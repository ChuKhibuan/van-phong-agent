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
    this.handled = ls.get('vpa.handled', {}) || {}; // việc chờ duyệt bạn đã duyệt / yêu cầu sửa
    this.fixFor = null;
    this._tags();
    this._panel();
    this._feed();
    this._settings();
    this._dockInit();
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
    const h = st.status === 'waiting' && this.handled && (this.handled[this._wkey(id)] || (this._isHandled(id) && { how: 'approved' }));
    t.chip.dataset.s = h ? 'working' : st.status;
    t.chip.textContent = h ? (h.how === 'approved' ? 'Đã duyệt' : 'Đang sửa') : (STATUS_LABEL[st.status] || st.status);
    t.bar.style.width = (st.status === 'idle' ? 0 : st.progress) + '%';
    t.el.dataset.s = st.status;
    this.updateDock();
    if (this.current === id || this.byId[this.current]?.gatekeeper) this._fillPanel();
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
      <div class="pn-queue" hidden>
        <h3>Chờ bạn duyệt <span class="q-count"></span></h3>
        <ul></ul>
      </div>
      <div class="pn-kho" hidden>
        <h3>Mục lục kho <a class="kho-link" target="_blank" rel="noopener">Mở trên GitHub ↗</a></h3>
        <div class="kho-body">Đang tải…</div>
      </div>
      <div class="pn-modes" hidden>
        <button data-mode="message" class="seg on">Ra lệnh</button>
        <button data-mode="teach" class="seg">Dạy kiến thức</button>
      </div>
      <div class="pn-msgs" aria-live="polite"></div>
      <div class="pn-sugs"></div>
      <div class="pn-attach">
        <label class="btn btn-ghost btn-file" title="Tải file lên Google Drive và gửi link kèm lệnh">📎 Gửi file<input type="file" multiple hidden></label>
        <button type="button" class="btn btn-ghost btn-path" title="Ghi đường dẫn file/thư mục trên máy bạn">🗂 Đường dẫn trên máy</button>
      </div>
      <textarea class="pn-paths" rows="2" hidden placeholder="Dán đường dẫn trên máy, mỗi dòng một đường dẫn. Ví dụ: D:\\1. Hoàng Hà makeup\\clip cô dâu A"></textarea>
      <div class="pn-files"></div>
      <div class="pn-fix" hidden></div>
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
    this.$('.pn-form textarea').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this._send(); }
    });
    this.$('.btn-hand').addEventListener('click', () => {
      const m = this.$('.pn-menu'); m.hidden = !m.hidden;
    });
    this.$('.btn-approve').addEventListener('click', () => {
      const st = this.h.getState(this.current);
      this._prepWin();
      this.h.onSend({ type: 'approve', to: this.current, from: 'nguoi-duyet', text: st?.task || '' });
      this._log(this.current, 'user', '✅ Đã duyệt: ' + (st?.task || ''));
    });
    p.querySelectorAll('.seg').forEach((b) => b.addEventListener('click', () => this._setMode(b.dataset.mode)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !p.hidden) this.close(); });
    // đính kèm
    this.pending = [];
    this.$('.btn-file input').addEventListener('change', (e) => {
      for (const f of e.target.files) this.pending.push(f);
      e.target.value = '';
      this._renderFiles();
    });
    this.$('.btn-path').addEventListener('click', () => {
      const t = this.$('.pn-paths'); t.hidden = !t.hidden; if (!t.hidden) t.focus();
    });
    // hàng chờ duyệt (phòng kiểm duyệt)
    this.$('.pn-queue ul').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const id = b.dataset.room, st = this.h.getState(id), name = this.byId[id]?.name || id;
      if (b.dataset.act === 'approve') {
        this._prepWin();
        this.h.onSend({ type: 'approve', to: id, from: 'chu', text: st?.task || '' });
        this._log(this.current, 'user', `✅ Duyệt (${name}): ${st?.task || ''}`);
        this._markHandled(id, 'approved');
      } else {
        // yêu cầu sửa: gắn với đúng việc, chờ bạn gõ nội dung cần sửa rồi Gửi
        this.fixFor = { id, key: this._wkey(id), name, task: st?.task || '' };
        this._renderFix();
        this.$('.pn-form textarea').focus();
      }
    });
    this.$('.pn-fix').addEventListener('click', (e) => {
      if (e.target.closest('button')) { this.fixFor = null; this._renderFix(); }
    });
  }

  // Mở sẵn cửa sổ nhỏ nhận kết quả gửi lệnh. Phải gọi ngay trong lúc bấm (trước mọi await),
  // nếu không trình duyệt sẽ chặn cửa sổ bật lên.
  _prepWin() {
    const s = this.h.settings();
    const live = s.inboxUrl && s.source !== 'mock' && !(s.source === 'auto' && !s.csvUrl);
    if (!live) return;
    try {
      const w = window.open('', 'vpa_send', 'width=460,height=300');
      if (!w) { this.note(this.current, '⚠ Trình duyệt chặn cửa sổ gửi lệnh. Cho phép cửa sổ bật lên cho trang này rồi gửi lại.'); return; }
      try {
        if (w.location.href === 'about:blank') {
          w.document.title = 'Đang gửi…';
          w.document.body.innerHTML = '<p style="font:15px system-ui,sans-serif;padding:18px">Đang gửi lệnh tới Inbox…</p>';
        }
      } catch { /* cửa sổ đang ở trang Google: bỏ qua */ }
    } catch { /* bỏ qua */ }
  }

  // khoá nhận diện một việc chờ duyệt: phòng + dòng Board đang hiển thị
  _wkey(id) {
    const st = this.h.getState(id);
    const r = st?.real;
    return id + '|' + (r ? `${+r.timestamp}:${r.seq ?? ''}` : (st?.task || ''));
  }
  _isHandled(id) {
    if (this.handled[this._wkey(id)]) return true;
    // đã duyệt / yêu cầu sửa ở bất kỳ máy nào: Inbox có lệnh sau lúc việc chuyển sang chờ duyệt
    const st = this.h.getState(id);
    const since = +(st?.real?.timestamp || st?.since || 0);
    const name = this.byId[id]?.name || id;
    return !!since && (this.chat?.inbox || []).some((m) => +m.at > since - 60e3 &&
      ((m.type === 'approve' && m.to === id) || m.text.startsWith(`Yêu cầu sửa việc của phòng ${name}`)));
  }
  _markHandled(id, how, key) {
    this.handled[key || this._wkey(id)] = { how, at: Date.now() };
    const keys = Object.keys(this.handled);
    if (keys.length > 200) keys.sort((a, b) => this.handled[a].at - this.handled[b].at).slice(0, keys.length - 200).forEach((k) => delete this.handled[k]);
    ls.set('vpa.handled', this.handled);
    this.setRoomState(id, this.h.getState(id));
    this._fillPanel();
  }
  _renderFix() {
    const el = this.$('.pn-fix');
    const f = this.fixFor;
    el.hidden = !f;
    if (f) el.innerHTML = `<span>✏ Yêu cầu sửa <b>${esc(f.name)}</b>: ${esc(f.task)}</span><button type="button" aria-label="Huỷ yêu cầu sửa">✕</button>`;
    const ta = this.$('.pn-form textarea');
    if (f) { if (this._ph == null) this._ph = ta.placeholder; ta.placeholder = 'Gõ điều cần sửa rồi bấm Gửi…'; }
    else if (this._ph != null) { ta.placeholder = this._ph; this._ph = null; }
  }

  _renderFiles() {
    const box = this.$('.pn-files');
    const kb = (n) => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.ceil(n / 1024) + ' KB';
    box.innerHTML = this.pending.map((f, i) => `<span class="fchip">📎 ${esc(f.name)} <small>${kb(f.size)}</small><button type="button" data-i="${i}" aria-label="Bỏ file">✕</button></span>`).join('');
    box.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { this.pending.splice(+b.dataset.i, 1); this._renderFiles(); }));
  }

  // Cập nhật nút tắt trên thanh trên (Bộ não, Kiểm duyệt) và số việc chờ duyệt
  updateDock() {
    const waiting = this.rooms.filter((r) => this.h.getState(r.id)?.status === 'waiting' && !this._isHandled(r.id));
    for (const [id, btn] of this.dock || []) {
      const badge = btn.querySelector('b');
      if (this.byId[id]?.gatekeeper) { badge.textContent = waiting.length || ''; badge.hidden = !waiting.length; }
    }
    return waiting;
  }

  _dockInit() {
    const el = document.getElementById('contacts');
    if (!el) return;
    this.dock = new Map();
    for (const id of this.office.contacts || []) {
      const r = this.byId[id]; if (!r) continue;
      const b = document.createElement('button');
      b.className = 'contact';
      b.style.setProperty('--accent', r.accent);
      b.innerHTML = `<i></i>${esc(r.gatekeeper ? 'Kiểm duyệt' : r.name)}<b hidden></b>`;
      b.title = r.gatekeeper ? 'Mở phòng QA · Kiểm duyệt: duyệt việc, sửa kho' : `Mở ${r.name}: ra lệnh, dạy, gửi file`;
      b.addEventListener('click', () => this.h.onSelect(id));
      el.append(b);
      this.dock.set(id, b);
    }
  }

  async _loadKho() {
    const body = this.$('.kho-body');
    const repo = this.office.repo;
    this.$('.kho-link').hidden = !repo;
    if (repo) this.$('.kho-link').href = repo + '/tree/main/kho';
    if (this._kho) { body.innerHTML = this._kho; return; }
    try {
      const res = await fetch('kho/README.md?_=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) throw new Error(res.status);
      const md = await res.text();
      const link = (u) => /^https?:/.test(u) ? u : (repo ? `${repo}/blob/main/kho/${u}` : 'kho/' + u);
      const inline = (s) => esc(s)
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, t, u) => `<a href="${link(u)}" target="_blank" rel="noopener">${t}</a>`)
        .replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
      const html = md.replace(/<!--[\s\S]*?-->/g, '').split(/\r?\n/).map((l) => {
        if (/^# /.test(l)) return '';
        if (/^## /.test(l)) return `<h4>${inline(l.slice(3))}</h4>`;
        if (/^- /.test(l)) return `<div class="kli">• ${inline(l.slice(2))}</div>`;
        return l.trim() ? `<p>${inline(l)}</p>` : '';
      }).join('');
      this._kho = html;
      body.innerHTML = html;
    } catch {
      body.textContent = 'Chưa đọc được kho (cần mở trang trên GitHub Pages hoặc máy chủ chạy thử).';
    }
  }

  _setMode(m) {
    this.mode = m;
    this.panel.querySelectorAll('.seg').forEach((b) => b.classList.toggle('on', b.dataset.mode === m));
    this.$('.pn-form textarea').placeholder = m === 'teach'
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
    this.$('.pn-queue').hidden = !r.gatekeeper;
    this.$('.pn-kho').hidden = !r.archive;
    if (r.archive) this._loadKho();
    this.pending = []; this._renderFiles();
    this.$('.pn-paths').value = ''; this.$('.pn-paths').hidden = true;
    this._setMode('message');
    if (!r.brain) this.$('.pn-form textarea').placeholder = `Nhắn cho ${r.name}…`;
    this.fixFor = null; this._renderFix();
    const sugs = this.$('.pn-sugs');
    sugs.innerHTML = '';
    for (const s of r.suggestions || []) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'sug'; b.textContent = s;
      b.addEventListener('click', () => {
        if (r.brain && /^Dạy:/.test(s)) this._setMode('teach');
        const ta = this.$('.pn-form textarea'); ta.value = s.replace(/^Dạy:\s*/, ''); ta.focus();
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
        const ta = this.$('.pn-form textarea');
        const text = ta.value.trim() || this.h.getState(id)?.task || `Việc từ ${r.name}`;
        this._prepWin();
        this.h.onSend({ type: 'handoff', from: id, to: o.id, text });
        this._log(id, 'user', `📄 Giao sang ${o.name}: ${text}`);
        ta.value = '';
      });
      menu.append(b);
    }
    this._jump = true;
    this._fillPanel();
  }

  close() {
    this.panel.classList.remove('open');
    this.current = null;
    this.h.onClose?.();
    setTimeout(() => { if (!this.current) this.panel.hidden = true; }, 250);
  }

  async _send() {
    const ta = this.$('.pn-form textarea');
    const pathsEl = this.$('.pn-paths');
    const paths = pathsEl.value.split(/\r?\n/).map((s) => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
    const files = this.pending.slice();
    let text = ta.value.trim();
    if (!this.current || (!text && !files.length && !paths.length)) return;
    if (!text) text = 'Gửi kèm tài liệu';
    const total = files.reduce((s, f) => s + f.size, 0);
    const LIMIT = 20 * 1048576;
    if (total > LIMIT) {
      this.note(this.current, `⚠ Tổng file ${(total / 1048576).toFixed(1)} MB, quá giới hạn 20 MB mỗi lần gửi. File lớn (video gốc) hãy tải lên Google Drive rồi dán link, hoặc gửi đường dẫn trên máy.`);
      return;
    }
    this._prepWin(); // mở cửa sổ gửi ngay lúc bấm, trước khi đọc file
    const type = this.mode === 'teach' ? 'teach' : 'message';
    const to = this.current;
    const fix = this.fixFor;
    if (fix) {
      // gửi yêu cầu sửa kèm ngữ cảnh việc đang chờ duyệt, rồi cho việc đó rời hàng chờ
      text = `Yêu cầu sửa việc của phòng ${fix.name} ("${fix.task}"): ${text}`;
      this.fixFor = null; this._renderFix();
      this._markHandled(fix.id, 'fix', fix.key);
    }
    ta.value = ''; pathsEl.value = ''; pathsEl.hidden = true; this.pending = []; this._renderFiles();
    const extra = [
      ...files.map((f) => `📎 ${f.name}`),
      ...paths.map((p) => `🗂 ${p}`),
    ].join('\n');
    this._log(to, 'user', (type === 'teach' ? '📚 Dạy: ' : '') + text + (extra ? '\n' + extra : ''));
    let payload = [];
    if (files.length) {
      this.note(to, `⏳ Đang tải ${files.length} file lên…`);
      const b64 = (f) => new Promise((ok, err) => {
        const rd = new FileReader();
        rd.onload = () => ok(String(rd.result).split(',')[1] || '');
        rd.onerror = () => err(rd.error);
        rd.readAsDataURL(f);
      });
      payload = await Promise.all(files.map(async (f) => ({ name: f.name, type: f.type || 'application/octet-stream', size: f.size, data: await b64(f) })));
    }
    this.h.onSend({ type, to, from: 'ban', text, files: payload, paths });
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
      this.$('.pn-warn').textContent += ' Mọi việc chờ duyệt cũng hiện ở phòng QA · Kiểm duyệt.';
      this.$('.btn-approve').hidden = st.status !== 'waiting' || this._isHandled(id);
    }
    if (r.gatekeeper) {
      const waiting = this.updateDock();
      this.$('.q-count').textContent = waiting.length ? `(${waiting.length})` : '';
      this.$('.pn-queue ul').innerHTML = waiting.length
        ? waiting.map((w) => {
          const s = this.h.getState(w.id);
          return `<li><span class="pn-dot" style="background:${w.accent}"></span><div><b>${esc(w.name)}</b><span>${esc(s.task || '')}</span></div>
            <button class="btn btn-approve" data-act="approve" data-room="${w.id}">Duyệt</button>
            <button class="btn btn-ghost" data-act="fix" data-room="${w.id}">Yêu cầu sửa</button></li>`;
        }).join('')
        : '<li class="muted">Không có việc nào chờ duyệt.</li>';
    }
    this._renderChat(id, st);
  }

  // ---------- khung chat: tin bạn gửi (Inbox) + câu trả lời (Tra_loi) + bước làm (Board) ----------
  setChat(chat) {
    const sig = chat.inbox.length + ':' + chat.replies.length + ':' + chat.inbox.map((m) => m.status).join('');
    if (sig === this.chatSig) return;
    this.chatSig = sig; this.chat = chat;
    for (const r of this.rooms) { const s = this.h.getState(r.id); if (s?.status === 'waiting') this.setRoomState(r.id, s); }
    this.updateDock();
    if (this.current) this._fillPanel();
  }

  _md(s) {
    // markdown gọn: **đậm**, `mã`, gạch đầu dòng, tiêu đề, link — đã escape trước
    const inline = (t) => esc(t)
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    const out = []; let list = null;
    for (const line of String(s).split(/\r?\n/)) {
      const li = line.match(/^\s*(?:[-•*]|\d+[.)])\s+(.*)$/);
      if (li) { (list ||= []).push(`<li>${inline(li[1])}</li>`); continue; }
      if (list) { out.push(`<ul>${list.join('')}</ul>`); list = null; }
      const h = line.match(/^#{1,4}\s+(.*)$/);
      if (h) out.push(`<p class="md-h">${inline(h[1])}</p>`);
      else if (line.trim()) out.push(`<p>${inline(line)}</p>`);
    }
    if (list) out.push(`<ul>${list.join('')}</ul>`);
    return out.join('');
  }

  _nextRun() {
    // Routine chạy đầu mỗi giờ 8:00–18:00 giờ Việt Nam, Thứ 2–Thứ 7
    const vn = new Date(Date.now() + 7 * 3600e3); // đọc bằng getUTC* = giờ VN
    const t = new Date(vn); t.setUTCMinutes(0, 0, 0); t.setUTCHours(t.getUTCHours() + 1);
    for (let i = 0; i < 200; i++) {
      const h = t.getUTCHours(), d = t.getUTCDay();
      if (d !== 0 && h >= 8 && h <= 18) break;
      t.setUTCHours(h + 1);
    }
    const sameDay = t.getUTCDate() === vn.getUTCDate();
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return `${t.getUTCHours()}:00${sameDay ? '' : ' ' + (t.getUTCDate() === new Date(+vn + 864e5).getUTCDate() ? 'mai' : days[t.getUTCDay()])}`;
  }

  _renderChat(id, st) {
    const r = this.byId[id];
    const chat = this.chat || { inbox: [], replies: [] };
    const mine = chat.inbox.filter((m) => m.to === id);
    const replies = chat.replies.filter((m) => m.room === id);
    const answered = new Set(replies.map((m) => m.replyTo));
    const items = [];
    // bước làm trên Board: dòng nhỏ, gộp tiến độ
    for (const h of (st.history || [])) {
      if (!h.task && h.status === 'idle') continue;
      items.push({ at: +h.timestamp, who: 'step', text: (h.status === 'done' ? '✔ ' : h.status === 'waiting' ? '⏳ Chờ duyệt: ' : h.status === 'working' ? '⚙ ' : '') + (h.task || 'Nghỉ') +
        (h.handoff?.length ? ` → ${h.handoff.map((x) => this.byId[x]?.name || x).join(', ')}` : ''), s: h.status });
    }
    for (const m of mine) {
      const extra = [...(m.files ? m.files.split('\n').map((f) => '📎 ' + f.split(' — ')[0]) : []), ...(m.paths ? m.paths.split('\n').map((p) => '🗂 ' + p) : [])];
      const label = m.type === 'teach' ? '📚 Dạy: ' : m.type === 'approve' ? '✅ Duyệt: ' : m.type === 'handoff' ? `📄 Giao từ ${this.byId[m.from]?.name || m.from}: ` : '';
      items.push({ at: +m.at, who: 'user', text: label + m.text + (extra.length ? '\n' + extra.join('\n') : ''), m });
      // tin cũ chưa có câu trả lời riêng: dùng cột note của Inbox
      if (m.note && !answered.has(m.key) && /done|error/.test(m.status)) items.push({ at: +m.at + 1, who: 'agent', md: m.note, err: m.status === 'error' });
    }
    for (const m of replies) items.push({ at: +m.at, who: 'agent', md: m.text, needs: m.needs });
    // tin bạn vừa gửi mà Inbox chưa kịp hiện
    const lastIn = mine.length ? Math.max(...mine.map((m) => +m.at)) : 0;
    for (const m of (this.localMsgs[id] || [])) if (m.at > lastIn + 60e3 || !this.chat) items.push({ ...m });
    items.sort((a, b) => a.at - b.at);
    const compact = [];
    for (const it of items) {
      const last = compact[compact.length - 1];
      if (last?.who === 'step' && it.who === 'step' && last.s === 'working' && it.s === 'working') compact[compact.length - 1] = it;
      else compact.push(it);
    }
    const view = compact.slice(-40);
    // tin cuối của bạn chưa được trả lời → đang chờ
    let pending = '';
    const lastUser = [...view].reverse().find((m) => m.who === 'user');
    const lastAgent = [...view].reverse().find((m) => m.who === 'agent');
    if (lastUser && (!lastAgent || lastAgent.at < lastUser.at)) {
      const s = lastUser.m?.status || '';
      pending = s === 'processing'
        ? `<div class="msg agent typing"><div><span class="dots"><i></i><i></i><i></i></span> ${esc(r.name)} đang xử lý…</div></div>`
        : `<div class="msg agent typing"><div><span class="dots"><i></i><i></i><i></i></span> Đã nhận. ${esc(r.name)} trả lời lúc khoảng <b>${this._nextRun()}</b>${lastUser.m ? '' : ' (đang chờ vào Inbox)'}.</div></div>`;
    }
    // mục "Cần bạn" chỉ còn hiệu lực ở câu trả lời mới nhất, khi bạn chưa nhắn lại
    const liveNeeds = lastAgent?.needs?.length && (!lastUser || lastUser.at < lastAgent.at) ? lastAgent : null;
    const html = view.map((m) => {
      if (m.who === 'step') return `<div class="msg step"><span>${esc(m.text)}</span><time>${timeStr(m.at)}</time></div>`;
      if (m.who === 'agent' && m.md != null) {
        const needs = m.needs?.length ? `<div class="needs${m === liveNeeds ? ' live' : ''}"><b>Cần bạn</b><ul>${m.needs.map((n) =>
          `<li><span>${esc(n)}</span>${m === liveNeeds ? `<button type="button" class="btn btn-ghost need-reply" data-need="${esc(n)}">Trả lời</button>` : ''}</li>`).join('')}</ul></div>` : '';
        return `<div class="msg agent${m.err ? ' err' : ''}"><div class="who"><span class="pn-dot" style="background:${r.accent}"></span>${esc(r.name)}</div><div class="md">${this._md(m.md)}</div>${needs}<time>${timeStr(m.at)}</time></div>`;
      }
      return `<div class="msg ${m.who}"><div>${esc(m.text)}</div><time>${timeStr(m.at)}</time></div>`;
    }).join('');
    this.panel.classList.toggle('has-chat', view.some((m) => m.who === 'user' || m.who === 'agent'));
    const box = this.$('.pn-msgs');
    const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 60;
    box.innerHTML = (html + pending) || `<div class="msg sys"><div>Xin chào! Mình là agent phòng ${esc(r.name)}. Bạn cần gì?</div></div>`;
    if (atBottom || this._jump) { box.scrollTop = box.scrollHeight; this._jump = false; }
    if (!box._needs) {
      box._needs = true;
      box.addEventListener('click', (e) => {
        const b = e.target.closest('.need-reply'); if (!b) return;
        const ta = this.$('.pn-form textarea');
        ta.value = `Về "${b.dataset.need}": `; ta.focus();
      });
    }
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
