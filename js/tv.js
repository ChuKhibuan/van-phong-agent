// Màn hình TV "Bảng phòng ban": so sánh các phòng — bận/rảnh, việc xong, kiến thức đã học.
// Dữ liệu: các dòng Board (đã tải sẵn trên trang) + file tri-thuc/kien-thuc/<phòng>.md (đọc thẳng từ GitHub Pages).
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const H = 3600e3;
const GIO_LAM = [8, 22];          // khung giờ làm việc dùng để tính % rảnh (giờ VN)
const TRAN_MOT_VIEC = 3 * H;      // một dòng "working" không ghi dòng kết thúc thì tính tối đa 3 giờ
const VIEC_KHONG_GHI_GIO = H / 3; // việc ghi thẳng "done" không có giờ bắt đầu: ước 20 phút

function vnParts(t) { const d = new Date(t + 7 * H); return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), h: d.getUTCHours() + d.getUTCMinutes() / 60 }; }
function vnMidnight(t) { const p = vnParts(t); return Date.UTC(p.y, p.m, p.d) - 7 * H; }
// số giờ trong khung làm việc nằm giữa a và b
function workHours(a, b) {
  let s = 0;
  for (let day = vnMidnight(a); day < b; day += 24 * H) {
    const x = Math.max(a, day + GIO_LAM[0] * H), y = Math.min(b, day + GIO_LAM[1] * H);
    if (y > x) s += (y - x) / H;
  }
  return s;
}

export class TV {
  constructor(office, getRows) {
    this.office = office;
    this.getRows = getRows;
    this.range = 'week';
    this.sort = 'ranh';
    this.know = {};
    this.el = document.createElement('div');
    this.el.className = 'tv-wrap';
    this.el.hidden = true;
    this.el.innerHTML = `
      <div class="tv" role="dialog" aria-modal="true" aria-labelledby="tv-title">
        <div class="tv-screen">
          <div class="tv-head">
            <h2 id="tv-title">📺 Bảng phòng ban</h2>
            <div class="tv-ctl">
              <div class="tv-seg" data-k="range">
                <button data-v="today">Hôm nay</button><button data-v="week" class="on">7 ngày</button>
              </div>
              <label class="tv-sort">Xếp theo
                <select>
                  <option value="ranh">Rảnh nhiều nhất</option>
                  <option value="viec">Việc xong nhiều nhất</option>
                  <option value="hoc">Kiến thức ít nhất</option>
                </select>
              </label>
              <button class="tv-close" aria-label="Đóng">✕</button>
            </div>
          </div>
          <div class="tv-sum"></div>
          <div class="tv-grid" role="table" aria-label="So sánh các phòng"></div>
          <p class="tv-note">Giờ bận ước tính từ Board: từ lúc phòng ghi <b>đang làm</b> tới dòng kế tiếp (tối đa 3 giờ/việc); việc ghi thẳng <b>xong</b> tính khoảng 20 phút; % rảnh tính trong khung ${GIO_LAM[0]}h–${GIO_LAM[1]}h.
          Kiến thức = số điều đã ghi trong <code>tri-thuc/kien-thuc/&lt;phòng&gt;.md</code>.</p>
        </div>
        <div class="tv-stand" aria-hidden="true"></div>
      </div>
      <div class="tv-tip" role="tooltip" hidden></div>`;
    document.body.append(this.el);
    const $ = (s) => this.el.querySelector(s);
    $('.tv-close').addEventListener('click', () => this.close());
    this.el.addEventListener('click', (e) => { if (e.target === this.el) this.close(); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && !this.el.hidden) this.close(); });
    this.el.querySelectorAll('.tv-seg button').forEach((b) => b.addEventListener('click', () => {
      this.range = b.dataset.v;
      this.el.querySelectorAll('.tv-seg button').forEach((x) => x.classList.toggle('on', x === b));
      this.render();
    }));
    $('.tv-sort select').addEventListener('change', (e) => { this.sort = e.target.value; this.render(); });
    // tooltip theo con trỏ cho từng thanh
    const tip = $('.tv-tip');
    this.el.addEventListener('pointermove', (e) => {
      const c = e.target.closest('[data-tip]');
      if (!c) { tip.hidden = true; return; }
      tip.innerHTML = c.dataset.tip; tip.hidden = false;
      const w = tip.offsetWidth, h = tip.offsetHeight;
      tip.style.left = Math.min(innerWidth - w - 8, e.clientX + 12) + 'px';
      tip.style.top = Math.max(8, e.clientY - h - 12) + 'px';
    });
    this.el.addEventListener('pointerleave', () => { tip.hidden = true; });
  }

  async open() {
    this.el.hidden = false;
    this.render();
    await this._loadKnowledge();
    this.render();
  }
  close() { this.el.hidden = true; }
  refresh() { if (!this.el.hidden) this.render(); }

  async _loadKnowledge() {
    const ids = this.office.rooms.map((r) => r.id).filter((id) => !(id in this.know));
    await Promise.all(ids.map(async (id) => {
      try {
        // Bộ não: kiến thức nằm cả ở file cốt lõi chung
        const files = [`tri-thuc/kien-thuc/${id}.md`, ...(this.office.rooms.find((r) => r.id === id)?.brain ? ['tri-thuc/cot-loi.md'] : [])];
        const texts = await Promise.all(files.map(async (f) => {
          const res = await fetch(`${f}?_=${Date.now()}`, { cache: 'no-store' });
          if (!res.ok) throw 0;
          return res.text();
        }));
        const md = texts.join('\n').replace(/<!--[\s\S]*?-->/g, '');
        let sec = '', all = 0, lessons = 0, recv = 0;
        for (const l of md.split(/\r?\n/)) {
          if (/^## /.test(l)) sec = l;
          if (!/^\s*- \S/.test(l)) continue;
          all++;
          if (/Bài học từ việc thật/.test(sec)) lessons++;
          if (/Nhận từ phòng khác/.test(sec)) recv++;
        }
        this.know[id] = { all, lessons, recv };
      } catch { this.know[id] = null; }
    }));
  }

  _stats() {
    const now = Date.now();
    const from = this.range === 'today' ? vnMidnight(now) : vnMidnight(now) - 6 * 24 * H;
    const rows = this.getRows().slice().sort((a, b) => +a.timestamp - +b.timestamp);
    // chỉ tính từ ngày hệ thống bắt đầu có dữ liệu, không tính những ngày chưa có văn phòng
    const first = rows.length ? vnMidnight(+rows[0].timestamp) : from;
    const span = Math.max(0.5, workHours(Math.max(from, first), now));
    const byAgent = {};
    for (const r of rows) (byAgent[r.agent] ||= []).push(r);
    return this.office.rooms.map((room) => {
      const list = byAgent[room.id] || [];
      let busy = 0, done = 0, waiting = 0;
      list.forEach((r, i) => {
        const t = +r.timestamp;
        if (r.status === 'working') {
          const end = Math.min(list[i + 1] ? +list[i + 1].timestamp : now, t + TRAN_MOT_VIEC, now);
          const a = Math.max(t, from);
          if (end > a) busy += workHours(a, end);
        }
        if (t >= from && r.status === 'done') {
          done++;
          // việc ghi thẳng "done" (không có dòng "đang làm" ngay trước): tính khoảng 20 phút
          const prev = list[i - 1];
          if (!prev || prev.status !== 'working') busy += VIEC_KHONG_GHI_GIO / H;
        }
      });
      const last = list[list.length - 1];
      if (last?.status === 'waiting') waiting = 1;
      const k = this.know[room.id];
      return { room, busy, free: Math.max(0, 1 - busy / span), done, now: last?.status || 'idle', waiting, k };
    });
  }

  render() {
    const S = this._stats();
    const maxBusy = Math.max(1, ...S.map((s) => s.busy));
    const maxDone = Math.max(1, ...S.map((s) => s.done));
    const maxKnow = Math.max(1, ...S.map((s) => s.k?.all || 0));
    // nhãn tình trạng (biểu tượng + chữ, không chỉ dùng màu)
    const knows = S.filter((s) => s.k).map((s) => s.k.all).sort((a, b) => a - b);
    const lowKnow = knows.length ? knows[Math.floor(knows.length / 3)] : 0;
    for (const s of S) {
      s.tags = [];
      if (s.now === 'working') s.tags.push(['busy', '⚙', 'Đang làm']);
      if (s.waiting) s.tags.push(['wait', '⏳', 'Chờ duyệt']);
      // rảnh nhiều = khối việc dưới 1/4 phòng bận nhất (so tương đối giữa các phòng)
      if (s.busy < maxBusy / 4 && s.now !== 'working') s.tags.push(['free', '☕', 'Rảnh nhiều']);
      if (s.k && (s.k.all < 4 || (s.k.all <= lowKnow && s.done >= 2))) s.tags.push(['learn', '📚', 'Nên dạy thêm']);
    }
    const order = {
      ranh: (a, b) => b.free - a.free || a.done - b.done,
      viec: (a, b) => b.done - a.done || a.free - b.free,
      hoc: (a, b) => (a.k?.all ?? 1e9) - (b.k?.all ?? 1e9),
    }[this.sort];
    S.sort(order);

    const free = S.filter((s) => s.tags.some((t) => t[0] === 'free')).map((s) => s.room.name);
    const learn = S.filter((s) => s.tags.some((t) => t[0] === 'learn')).map((s) => s.room.name);
    const top = S.slice().sort((a, b) => b.done - a.done)[0];
    const per = this.range === 'today' ? 'hôm nay' : '7 ngày qua';
    this.el.querySelector('.tv-sum').innerHTML = `
      <div class="tv-kpi"><span>☕ Rảnh nhiều ${per}</span><b>${free.length ? esc(free.slice(0, 4).join(', ')) + (free.length > 4 ? ` +${free.length - 4}` : '') : 'Không có'}</b></div>
      <div class="tv-kpi"><span>🏆 Làm nhiều nhất</span><b>${top && top.done ? `${esc(top.room.name)} · ${top.done} việc` : 'Chưa có việc'}</b></div>
      <div class="tv-kpi"><span>📚 Nên dạy thêm</span><b>${learn.length ? esc(learn.slice(0, 4).join(', ')) : 'Không có'}</b></div>`;

    const bar = (lbl, v, max, txt, tip) => `<div class="tv-cell" role="cell" data-tip="${esc(tip)}"><span class="tv-lbl">${lbl}</span>
        <div class="tv-track"><i style="width:${max ? Math.max(v > 0 ? 3 : 0, (v / max) * 100) : 0}%"></i></div><span class="tv-val">${txt}</span></div>`;
    const head = `<div class="tv-row tv-hrow" role="row">
        <div role="columnheader">Phòng</div><div role="columnheader">Giờ bận · % rảnh</div>
        <div role="columnheader">Việc xong</div><div role="columnheader">Kiến thức đã học</div><div role="columnheader">Tình trạng</div></div>`;
    const body = S.map((s) => {
      const nm = esc(s.room.name);
      const bh = s.busy < 10 ? s.busy.toFixed(1) : Math.round(s.busy);
      const k = s.k;
      return `<div class="tv-row" role="row">
        <div class="tv-name" role="rowheader"><i style="background:${esc(s.room.accent || '#888')}"></i>${nm}</div>
        ${bar('Bận', s.busy, maxBusy, `${bh}h · rảnh ${Math.round(s.free * 100)}%`, `<b>${nm}</b><br>Bận khoảng ${bh} giờ ${per}<br>Rảnh ${Math.round(s.free * 100)}% giờ làm việc`)}
        ${bar('Việc', s.done, maxDone, String(s.done), `<b>${nm}</b><br>${s.done} việc xong ${per}`)}
        ${k ? bar('Học', k.all, maxKnow, String(k.all), `<b>${nm}</b><br>${k.all} điều đã học<br>${k.lessons} bài học từ việc thật · ${k.recv} nhận từ phòng khác`)
            : `<div class="tv-cell" role="cell"><span class="tv-val tv-muted">${k === null ? 'chưa có file' : 'đang tải…'}</span></div>`}
        <div class="tv-tags" role="cell">${s.tags.map((t) => `<span class="tv-tag t-${t[0]}">${t[1]} ${t[2]}</span>`).join('') || '<span class="tv-muted">—</span>'}</div>
      </div>`;
    }).join('');
    this.el.querySelector('.tv-grid').innerHTML = head + body;
  }
}
