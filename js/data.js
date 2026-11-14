// Lớp dữ liệu: mọi nguồn (Google Sheet CSV, dữ liệu mẫu, sau này Notion/WebSocket)
// đều trả về cùng một dạng "dòng" đã chuẩn hoá:
//   { timestamp: Date, agent: 'content', status: 'idle'|'working'|'done',
//     task: string, progress: 0..100, handoff_to: '' | 'edit' }
// Giao diện chỉ biết tới dạng này, nên đổi nguồn không phải viết lại giao diện.

const strip = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();

export function makeAgentResolver(rooms) {
  const map = new Map();
  for (const r of rooms) {
    map.set(strip(r.id), r.id);
    map.set(strip(r.name), r.id);
    if (r.agent) map.set(strip(r.agent), r.id);
  }
  return (v) => map.get(strip(v)) || map.get(strip(v).replace(/\s+/g, '-')) || '';
}

const STATUS = {
  idle: 'idle', 'ranh': 'idle', 'nghi': 'idle', '': 'idle',
  working: 'working', 'dang lam': 'working', 'lam': 'working', busy: 'working', 'in_progress': 'working',
  done: 'done', 'xong': 'done', 'hoan thanh': 'done', complete: 'done', completed: 'done',
  waiting: 'waiting', review: 'waiting', 'cho duyet': 'waiting', pending_approval: 'waiting', approval: 'waiting',
};

function parseTime(v) {
  const s = String(v ?? '').trim();
  if (!s) return null;
  // dd/mm/yyyy hh:mm:ss (định dạng Google Sheet tiếng Việt)
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ ,T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
  const g = s.match(/^Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)$/); // gviz
  if (g) return new Date(+g[1], +g[2], +g[3], +(g[4] || 0), +(g[5] || 0), +(g[6] || 0));
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : new Date(t);
}

function parseProgress(v, status) {
  let s = String(v ?? '').replace('%', '').replace(',', '.').trim();
  let n = parseFloat(s);
  if (Number.isNaN(n)) return status === 'done' ? 100 : 0;
  if (n > 0 && n <= 1 && s.includes('.')) n *= 100;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function normalizeRow(raw, resolve) {
  const r = {};
  for (const [k, v] of Object.entries(raw)) r[strip(k).replace(/\s+/g, '_')] = v;
  const agent = resolve(r.agent);
  const timestamp = parseTime(r.timestamp);
  if (!agent || !timestamp) return null;
  const status = STATUS[strip(r.status)] || 'idle';
  return {
    timestamp, agent, status,
    task: String(r.task ?? '').trim(),
    progress: parseProgress(r.progress, status),
    // handoff_to có thể là nhiều phòng, cách nhau bằng dấu phẩy
    handoff: String(r.handoff_to ?? '').split(/[,;|]/).map(resolve).filter(Boolean),
  };
}

export function parseCsv(text) {
  const rows = []; let row = []; let cell = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  const head = (rows.shift() || []).map((h) => h.trim());
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
    .map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

// ------------------------------------------------------------------
// Nguồn 1: Google Sheet xuất bản CSV (đọc định kỳ)
// ------------------------------------------------------------------
class SheetSource {
  constructor(settings, rooms) {
    this.kind = 'sheet';
    this.s = settings; this.resolve = makeAgentResolver(rooms);
    this.timer = null;
  }
  start(onRows, onStatus) {
    const tick = async () => {
      try {
        const u = this.s.csvUrl + (this.s.csvUrl.includes('?') ? '&' : '?') + '_ts=' + Date.now();
        const res = await fetch(u, { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const text = await res.text();
        if (/^\s*</.test(text)) throw new Error('Link không trả về CSV (có thể Sheet chưa chia sẻ/xuất bản)');
        const rows = parseCsv(text).map((r) => normalizeRow(r, this.resolve)).filter(Boolean);
        onRows(rows);
        onStatus({ ok: true, at: new Date() });
      } catch (e) {
        onStatus({ ok: false, error: e.message || String(e) });
      }
    };
    tick();
    this.timer = setInterval(tick, Math.max(3, +this.s.pollSeconds || 7) * 1000);
  }
  stop() { clearInterval(this.timer); }
  async send(cmd) {
    if (!this.s.inboxUrl) return { ok: false, reason: 'no-inbox' };
    try {
      // text/plain để không bị preflight CORS; Apps Script vẫn đọc được JSON.
      await fetch(this.s.inboxUrl, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ ...cmd, key: this.s.inboxKey || '' }),
      });
      return { ok: true, queued: true };
    } catch (e) {
      return { ok: false, reason: e.message };
    }
  }
}

// ------------------------------------------------------------------
// Nguồn 2: dữ liệu mẫu — mô phỏng các quy trình trong config.flows
// ------------------------------------------------------------------
const SAMPLES = {
  'Đơn dựng video': ['Đơn #A12: video cưới 60 giây, nhạc nhẹ', 'Đơn #A13: video giới thiệu tiệm 30 giây', 'Đơn #A14: highlight lễ ăn hỏi'],
  'Khách hỏi giá': ['Báo giá gói dựng video cưới cho chị Lan', 'Soạn tin nhắc khách anh Minh (chưa chốt 3 ngày)'],
  'Đăng video mẫu': ['Lên lịch đăng 3 video mẫu tuần này', 'Caption + hashtag cho video mẫu mới'],
  'Tính hoa hồng CTV': ['Tính hoa hồng CTV tháng này', 'Ghép 2 khách mới vào danh sách CTV'],
};

class MockSource {
  constructor(settings, rooms, flows = {}) {
    this.kind = 'mock';
    this.rooms = rooms;
    this.byId = Object.fromEntries(rooms.map((r) => [r.id, r]));
    this.brain = (rooms.find((r) => r.brain) || rooms[0]).id;
    this.flows = Object.entries(flows).filter(([, s]) => s.every((id) => this.byId[id]));
    if (!this.flows.length) this.flows = [['Quy trình', rooms.map((r) => r.id)]];
    this.state = Object.fromEntries(rooms.map((r) => [r.id, { status: 'idle', task: '', progress: 0 }]));
    this.jobs = [];
    this.out = [];
    this.n = 0;
    this.k = 0;
  }
  emit(agent, status, task, progress, handoff = []) {
    Object.assign(this.state[agent], { status, task, progress, since: Date.now() });
    this.out.push({ timestamp: new Date(Date.now() + (this.n++ % 1000)), agent, status, task, progress, handoff });
  }
  queue(task, steps, delay = 0, extra = {}) {
    this.jobs.push({ task, steps: [...steps], i: 0, startAt: Date.now() + delay, started: false, speed: 1, ...extra });
  }
  nextSample() {
    const [name, steps] = this.flows[this.k % this.flows.length];
    const list = SAMPLES[name] || [name];
    const task = list[Math.floor(this.k / this.flows.length) % list.length];
    this.k++;
    return { task, steps };
  }
  start(onRows, onStatus) {
    const t0 = Date.now() - 60_000;
    for (const r of this.rooms) this.out.push({ timestamp: new Date(t0), agent: r.id, status: 'idle', task: '', progress: 0, handoff: [] });
    const first = this.nextSample();
    this.queue(first.task, first.steps, 1500);
    let idleTicks = 0;
    const step = () => {
      const now = Date.now();
      for (const j of [...this.jobs]) {
        if (now < j.startAt) continue;
        const agent = j.steps[j.i];
        const st = this.state[agent];
        if (!j.started) {
          if (st.status === 'working') continue; // phòng đang bận, đợi
          j.started = true;
          this.emit(agent, 'working', j.task, 0);
          continue;
        }
        const p = Math.min(100, st.progress + Math.round((8 + Math.random() * 14) * j.speed));
        if (p < 100) { this.emit(agent, 'working', j.task, p); continue; }
        const next = j.steps[j.i + 1];
        const handoff = next ? [next] : (j.fanout || []);
        const needApproval = !next && this.byId[agent].approval;
        this.emit(agent, needApproval ? 'waiting' : 'done', j.task, 100, handoff);
        this.jobs.splice(this.jobs.indexOf(j), 1);
        if (next) this.jobs.push({ ...j, i: j.i + 1, started: false, startAt: now + 1200 });
        for (const f of j.fanout || []) this.queue('Học kiến thức mới: ' + j.task.replace(/^Dạy:\s*/, ''), [f], 1200, { speed: 2.5 });
        const s = this.state[agent], task = j.task;
        // phòng cần duyệt: demo tự "duyệt" sau 25 giây
        setTimeout(() => {
          if (s.status === 'waiting' && s.task === task) this.emit(agent, 'done', 'Đã duyệt: ' + task, 100);
          setTimeout(() => { if (s.status === 'done') this.emit(agent, 'idle', '', 0); }, 12000);
        }, needApproval ? 25000 : 0);
      }
      if (this.jobs.length === 0) {
        if (++idleTicks > 8) { idleTicks = 0; const s = this.nextSample(); this.queue(s.task, s.steps); }
      } else idleTicks = 0;
      if (this.out.length) onRows(this.out.splice(0));
      onStatus({ ok: true, at: new Date() });
    };
    step();
    this.timer = setInterval(step, 1600);
  }
  stop() { clearInterval(this.timer); }
  async send(cmd) {
    // cmd: { type: 'message'|'teach'|'handoff'|'approve', from, to, text }
    const text = (cmd.text || '').trim();
    if (cmd.type === 'approve') {
      const s = this.state[cmd.to];
      if (s && s.status === 'waiting') this.emit(cmd.to, 'done', 'Đã duyệt: ' + s.task, 100);
      return { ok: true, local: true };
    }
    if (cmd.type === 'teach') {
      const others = this.rooms.filter((r) => !r.brain).map((r) => r.id).sort(() => Math.random() - 0.5);
      this.queue('Dạy: ' + (text || 'kiến thức mới'), [this.brain], 300, { fanout: others.slice(0, 3), speed: 1.6 });
      return { ok: true, local: true };
    }
    const task = text || 'Việc mới từ bạn';
    if (cmd.type === 'handoff') { this.queue(task, [cmd.to], 6500); return { ok: true, local: true }; }
    if (cmd.to === this.brain) {
      // lệnh cho Bộ não → chạy quy trình đơn hàng từ Bộ não trở đi
      const flow = this.flows.find(([, s]) => s.includes(this.brain) && s.length > 3) || this.flows[0];
      const steps = flow[1].slice(Math.max(0, flow[1].indexOf(this.brain)));
      this.queue(task, steps, 600);
    } else this.queue(task, [cmd.to], 600);
    return { ok: true, local: true };
  }
}

// ------------------------------------------------------------------
// Nguồn 3, 4 (để sau): Notion / WebSocket — chỉ cần cài đặt start/stop/send
// và gọi onRows([...]) với dòng đã chuẩn hoá. Ví dụ khung WebSocket:
// ------------------------------------------------------------------
class WebSocketSource {
  constructor(settings, rooms) { this.kind = 'ws'; this.url = settings.wsUrl; this.resolve = makeAgentResolver(rooms); }
  start(onRows, onStatus) {
    this.ws = new WebSocket(this.url);
    this.ws.onmessage = (ev) => {
      const data = JSON.parse(ev.data);
      const rows = (Array.isArray(data) ? data : [data]).map((r) => normalizeRow(r, this.resolve)).filter(Boolean);
      onRows(rows); onStatus({ ok: true, at: new Date() });
    };
    this.ws.onerror = () => onStatus({ ok: false, error: 'WebSocket lỗi' });
  }
  stop() { this.ws?.close(); }
  async send(cmd) { this.ws?.send(JSON.stringify(cmd)); return { ok: true }; }
}

export function createSource(settings, rooms, flows) {
  const mode = settings.source || 'auto';
  if (mode === 'ws' && settings.wsUrl) return new WebSocketSource(settings, rooms);
  if (mode === 'sheet' || (mode === 'auto' && settings.csvUrl)) {
    if (settings.csvUrl) return new SheetSource(settings, rooms);
  }
  return new MockSource(settings, rooms, flows);
}
