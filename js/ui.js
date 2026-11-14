// Giao diện HTML phủ lên cảnh 3D: thẻ phòng, bong bóng thoại, khung chat, nhật ký, cài đặt.
export const STATUS_LABEL = { idle: 'Rảnh', working: 'Đang làm', done: 'Xong', waiting: 'Chờ duyệt' };

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const timeStr = (d) => d ? new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';

const ls = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* bỏ qua */ } },
};
export { ls };

export class UI {
  constructor(office, handlers) {
    this.office = office;
    this.h = handlers; // { onSend(cmd), onClose(), onSelect(id), getState(id), settings }
    this.rooms = office.rooms;
    this.byId = Object.fromEntries(this.rooms.map((r) => [r.id, r]));
    this.overlay = document.getElementById('overlay');
    this.tags = new Map();
    this.zoneTags = new Map();
    this.current = null;
    this.mode = 'message';
    this.localMsgs = ls.get('vpa.msgs', {});
    this._tags();
    this._panel();
    this._feed();
    this._settings();
  }

  // ---------- thẻ phòng + bong bóng ----------
  _tags() {
    for (const r of this.rooms) {
      const el = document.createElement('button');
      el.className = 'room-tag' + (r.brain ? ' is-brain' : '');
      el.style.setProperty('--accent', r.accent || '#666');
      el.innerHTML = `<span class="rt-name">${esc(r.name)}</span><span class="chip" data-s="idle">${STATUS_LABEL.idle}</span><span class="rt-bar"><i></i></span>`;
      el.addEventListener('click', () => this.h.onSelect(r.id));
      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      this.overlay.append(el, bubble);
      this.tags.set(r.id, { el, bubble, chip: el.querySelector('.chip'), bar: el.querySelector('.rt-bar i'), until: 0 });
    }
    for (const [id, z] of Object.entries(this.office.zones || {})) {
      if (!this.rooms.some((r) => r.zone === id) || id === 'trung-tam') continue;
      const el = document.createElement('div');
      el.className = 'zone-tag';
      el.style.setProperty('--zone', z.color);
      el.textContent = z.name;
      this.overlay.append(el);
      this.zoneTags.set(id, el);
    }
  }

  placeTag(id, x, y, visible = true) {
    const t = this.tags.get(id); if (!t) return;
    t.el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
    t.el.style.visibility = visible ? '' : 'hidden';
  }
  placeBubble(id, x, y) {
    const t = this.tags.get(id); if (!t) return;
    t.bubble.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
  }
  placeZone(id, x, y) {
    const el = this.zoneTags.get(id); if (el) el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
  }

  setRoomState(id, st) {
    const t = this.tags.get(id); if (!t) return;
    t.chip.dataset.s = st.status;
    t.chip.textContent = STATUS_LABEL[st.status] || st.status;
    t.bar.style.width = (st.status === 'idle' ? 0 : st.progress) + '%';
    t.el.dataset.s = st.status;
    if (this.current === id) this._fillPanel();
  }

  say(id, text, secs = 5) {
    const t = this.tags.get(id); if (!t || !text) return;
    t.bubble.textContent = text;
    t.bubble.classList.add('show');
    clearTimeout(t.timer);
    t.timer = setTimeout(() => t.bubble.classList.remove('show'), secs * 1000);
  }

  // ---------- khung chat ----------
  _panel() {
    const p = document.getElementById('panel');
    this.panel = p;
    p.innerHTML = `
      <div class="pn-head">
        <span class="pn-dot"></span>
        <div class="pn-title"><div class="pn-zone"></div><h2></h2></div>
        <button class="icon-btn pn-close" aria-label="Đóng">✕</button>
      </div>
      <p class="pn-role"></p>
      <div class="pn-status">
        <span class="chip"></span>
        <div class="pn-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100"><i></i></div>
        <span class="pn-pct"></span>
      </div>
      <div class="pn-task"></div>
      <div class="pn-approval" hidden>
        <div class="pn-warn"></div>
        <button class="btn btn-approve">Duyệt việc này</button>
      </div>
      <div class="pn-modes" hidden>
        <button data-mode="message" class="seg on">Ra lệnh</button>
        <button data-mode="teach" class="seg">Dạy kiến thức</button>
      </div>
      <div class="pn-msgs" aria-live="polite"></div>
      <div class="pn-sugs"></div>
      <form class="pn-form">
        <textarea rows="2" placeholder="Nhắn cho agent…"></textarea>
        <button class="btn btn-send" type="submit">Gửi</button>
      </form>
      <div class="pn-hand">
        <button class="btn btn-ghost btn-hand" type="button">Giao việc sang… ▾</button>
        <div class="pn-menu" hidden></div>
      </div>`;
    this.$ = (s) => p.querySelector(s);
    this.$('.pn-close').addEventListener('click', () => this.close());
    this.$('.pn-form').addEventListener('submit', (e) => { e.preventDefault(); this._send(); });
    this.$('textarea').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this._send(); }
    });
    this.$('.btn-hand').addEventListener('click', () => {
      const m = this.$('.pn-menu'); m.hidden = !m.hidden;
    });
    this.$('.btn-approve').addEventListener('click', () => {
      const st = this.h.getState(this.current);
      this.h.onSend({ type: 'approve', to: this.current, from: 'nguoi-duyet', text: st?.task || '' });
      this._log(this.current, 'user', '✅ Đã duyệt: ' + (st?.task || ''));
    });
    p.querySelectorAll('.seg').forEach((b) => b.addEventListener('click', () => this._setMode(b.dataset.mode)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !p.hidden) this.close(); });
  }

  _setMode(m) {
    this.mode = m;
    this.panel.querySelectorAll('.seg').forEach((b) => b.classList.toggle('on', b.dataset.mode === m));
    this.$('textarea').placeholder = m === 'teach'
      ? 'Dạy Bộ não một điều (bảng giá, quy trình, giọng văn…). Nó sẽ tóm tắt thành skill và chia cho các phòng liên quan.'
      : 'Ra lệnh cho Bộ não, nó sẽ chia việc cho các phòng…';
  }

  open(id) {
    this.current = id;
    const r = this.byId[id];
    this.panel.hidden = false;
    this.panel.style.setProperty('--accent', r.accent || '#666');
    void this.panel.offsetWidth; this.panel.classList.add('open');
    this.$('h2').textContent = r.name;
    this.$('.pn-zone').textContent = this.office.zones?.[r.zone]?.name || '';
    this.$('.pn-role').textContent = r.role || '';
    this.$('.pn-modes').hidden = !r.brain;
    this._setMode('message');
    if (!r.brain) this.$('textarea').placeholder = `Nhắn cho ${r.name}…`;
    const sugs = this.$('.pn-sugs');
    sugs.innerHTML = '';
    for (const s of r.suggestions || []) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'sug'; b.textContent = s;
      b.addEventListener('click', () => {
        if (r.brain && /^Dạy:/.test(s)) this._setMode('teach');
        const ta = this.$('textarea'); ta.value = s.replace(/^Dạy:\s*/, ''); ta.focus();
        const i = ta.value.indexOf('…'); if (i >= 0) ta.setSelectionRange(i, i + 1);
      });
      sugs.append(b);
    }
    const menu = this.$('.pn-menu');
    menu.hidden = true; menu.innerHTML = '';
    for (const o of this.rooms.filter((x) => x.id !== id)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = `<span class="pn-dot" style="background:${o.accent}"></span>${esc(o.name)}`;
      b.addEventListener('click', () => {
        menu.hidden = true;
        const ta = this.$('textarea');
        const text = ta.value.trim() || this.h.getState(id)?.task || `Việc từ ${r.name}`;
        this.h.onSend({ type: 'handoff', from: id, to: o.id, text });
        this._log(id, 'user', `📄 Giao sang ${o.name}: ${text}`);
        ta.value = '';
      });
      menu.append(b);
    }
    this._fillPanel();
  }

  close() {
    this.panel.classList.remove('open');
    this.current = null;
    this.h.onClose?.();
    setTimeout(() => { if (!this.current) this.panel.hidden = true; }, 250);
  }

  _send() {
    const ta = this.$('textarea');
    const text = ta.value.trim();
    if (!text || !this.current) return;
    const type = this.mode === 'teach' ? 'teach' : 'message';
    this.h.onSend({ type, to: this.current, from: 'ban', text });
    this._log(this.current, 'user', (type === 'teach' ? '📚 Dạy: ' : '') + text);
    ta.value = '';
  }

  _log(id, who, text) {
    const list = (this.localMsgs[id] ||= []);
    list.push({ who, text, at: Date.now() });
    if (list.length > 40) list.splice(0, list.length - 40);
    ls.set('vpa.msgs', this.localMsgs);
    if (this.current === id) this._fillPanel();
  }

  note(id, text) { this._log(id, 'sys', text); }

  _fillPanel() {
    const id = this.current; if (!id) return;
    const r = this.byId[id];
    const st = this.h.getState(id) || { status: 'idle', progress: 0, task: '', history: [] };
    const chip = this.$('.pn-status .chip');
    chip.dataset.s = st.status; chip.textContent = STATUS_LABEL[st.status] || st.status;
    const pct = st.status === 'idle' ? 0 : st.progress;
    this.$('.pn-progress i').style.width = pct + '%';
    this.$('.pn-progress').setAttribute('aria-valuenow', pct);
    this.$('.pn-pct').textContent = pct + '%';
    this.$('.pn-task').innerHTML = st.task ? `<b>Đang xử lý:</b> ${esc(st.task)}` : '<span class="muted">Chưa có việc. Gõ lệnh bên dưới hoặc chọn gợi ý.</span>';
    const ap = this.$('.pn-approval');
    ap.hidden = !r.approval;
    if (r.approval) {
      this.$('.pn-warn').textContent = r.id === 'ctv'
        ? '⚠ Agent chỉ tính công và đề xuất. Việc trả tiền và ký thoả thuận do người làm.'
        : '⚠ Tin báo giá / tin nhắn khách do agent soạn. Bạn duyệt trước khi gửi.';
      this.$('.btn-approve').hidden = st.status !== 'waiting';
    }
    // tin nhắn: lịch sử từ Board + tin của bạn, xếp theo thời gian
    const items = [
      ...(st.history || []).filter((h) => h.task || h.status !== 'idle').map((h) => ({
        at: +h.timestamp, who: 'agent',
        text: (h.status === 'done' ? '✔ Xong: ' : h.status === 'waiting' ? '⏳ Chờ duyệt: ' : h.status === 'working' ? `⚙ ${h.progress}% · ` : '') + (h.task || 'Nghỉ') +
          (h.handoff?.length ? ` → ${h.handoff.map((x) => this.byId[x]?.name || x).join(', ')}` : ''),
      })),
      ...(this.localMsgs[id] || []),
    ].sort((a, b) => a.at - b.at);
    // gộp các dòng tiến độ liên tiếp cho gọn
    const compact = [];
    for (const it of items) {
      const last = compact[compact.length - 1];
      if (last && last.who === 'agent' && it.who === 'agent' && last.text.startsWith('⚙') && it.text.startsWith('⚙')) compact[compact.length - 1] = it;
      else compact.push(it);
    }
    const box = this.$('.pn-msgs');
    const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 40;
    box.innerHTML = compact.slice(-30).map((m) => `<div class="msg ${m.who}"><div>${esc(m.text)}</div><time>${timeStr(m.at)}</time></div>`).join('')
      || `<div class="msg sys"><div>Xin chào! Mình là agent phòng ${esc(r.name)}. Bạn cần gì?</div></div>`;
    if (atBottom) box.scrollTop = box.scrollHeight;
  }

  // ---------- nhật ký sự kiện ----------
  _feed() {
    this.feedEl = document.getElementById('feed');
    this.feedEl.innerHTML = '<button class="feed-toggle" aria-expanded="true">Nhật ký</button><ol></ol>';
    const btn = this.feedEl.querySelector('.feed-toggle');
    btn.addEventListener('click', () => {
      const c = this.feedEl.classList.toggle('collapsed');
      btn.setAttribute('aria-expanded', String(!c));
    });
    if (window.matchMedia('(max-width: 640px)').matches) this.feedEl.classList.add('collapsed');
  }
  event(html, color) {
    const ol = this.feedEl.querySelector('ol');
    const li = document.createElement('li');
    li.innerHTML = `<span class="pn-dot" style="background:${color || '#999'}"></span><span>${html}</span><time>${timeStr(Date.now())}</time>`;
    ol.prepend(li);
    while (ol.children.length > 6) ol.lastChild.remove();
  }

  setSource(text, ok) {
    const el = document.getElementById('source');
    el.querySelector('span').textContent = text;
    el.dataset.ok = ok ? '1' : '0';
  }

  toast(text) {
    const t = document.getElementById('toast');
    t.textContent = text; t.classList.add('show');
    clearTimeout(this._tt); this._tt = setTimeout(() => t.classList.remove('show'), 3500);
  }

  // ---------- cài đặt ----------
  _settings() {
    const dlg = document.getElementById('settings');
    const f = dlg.querySelector('form');
    document.getElementById('btn-settings').addEventListener('click', () => {
      const s = this.h.settings();
      f.source.value = s.source; f.csvUrl.value = s.csvUrl; f.pollSeconds.value = s.pollSeconds;
      f.inboxUrl.value = s.inboxUrl; f.inboxKey.value = s.inboxKey;
      dlg.showModal();
    });
    dlg.querySelector('.btn-cancel').addEventListener('click', () => dlg.close());
    dlg.querySelector('.btn-reset').addEventListener('click', () => { ls.set('vpa.data', null); location.reload(); });
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      ls.set('vpa.data', {
        source: f.source.value, csvUrl: f.csvUrl.value.trim(), pollSeconds: +f.pollSeconds.value || 7,
        inboxUrl: f.inboxUrl.value.trim(), inboxKey: f.inboxKey.value.trim(),
      });
      location.reload();
    });
  }
}
