// "Đường công việc": dải đường 3D uốn lượn đặt sát phòng Lưu trữ, có dốc nối từ sàn Lưu trữ xuống cuối đường.
// Mỗi trạm trên đường là một việc gần đây của một phòng: cờ xanh = đã xong,
// bóng đèn sáng = đang làm, đồng hồ cát = chờ duyệt. Việc mới nhất ở cuối đường (gần người xem).
// Chỉ để hình dung và trang trí: dữ liệu lấy từ các dòng Board mà main.js đã đọc.
import * as THREE from 'three';

const N = 5;                 // số trạm
const U0 = 28.7, V0 = 9;     // tâm đảo theo trục màn hình (u: ngang, v: dọc)
const ISLAND_W = 12, ISLAND_L = 30;
const TOP = -0.95;           // mặt đảo
const ROAD_W = 1.9, ROAD_H = 0.3;
const ROAD_U = -2.3, AMP = 2.2, WAVE = 10, V_START = -13.5, V_END = 13.5;
const LABEL_U = 1.4;         // mép trái vùng chữ (bên phải con đường)
const S2 = Math.SQRT1_2;

const roadU = (v) => ROAD_U + AMP * Math.sin((2 * Math.PI * (v - V_START)) / WAVE);
const STATUS_TEXT = { working: 'Đang làm', done: 'Đã xong', waiting: 'Chờ duyệt' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export class Road {
  constructor(world, office, { overlay, onSelect }) {
    this.office = office;
    this.byId = Object.fromEntries(office.rooms.map((r) => [r.id, r]));
    this.onSelect = onSelect;
    this.root = new THREE.Group();   // thêm vào cảnh
    this.group = new THREE.Group();  // khung cục bộ của đảo
    // trục cục bộ: x = u (ngang màn hình), z = v (dọc màn hình, dương = gần người xem)
    this.group.position.set((V0 + U0) * S2, 0, (V0 - U0) * S2);
    this.group.rotation.y = Math.PI / 4;
    this.root.add(this.group);
    this.group.updateMatrixWorld(true);
    this._island();
    this._road();
    this._decor();
    this._stations();
    this._packets();
    this._labels(overlay);
    this._ramp(world.rooms.get('luu-tru'));
    this.group.updateMatrixWorld(true);

    // mở rộng vùng kéo camera để xem được con đường
    const b = world.bounds;
    for (const p of this.fitPoints()) {
      b.x0 = Math.min(b.x0, p.x); b.x1 = Math.max(b.x1, p.x);
      b.z0 = Math.min(b.z0, p.z); b.z1 = Math.max(b.z1, p.z);
    }
  }

  // ---------- đảo nền ----------
  _island() {
    const w = ISLAND_W / 2, l = ISLAND_L / 2, r = 1.6;
    const s = new THREE.Shape();
    s.moveTo(-w + r, -l); s.lineTo(w - r, -l); s.quadraticCurveTo(w, -l, w, -l + r);
    s.lineTo(w, l - r); s.quadraticCurveTo(w, l, w - r, l); s.lineTo(-w + r, l);
    s.quadraticCurveTo(-w, l, -w, l - r); s.lineTo(-w, -l + r); s.quadraticCurveTo(-w, -l, -w + r, -l);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.45, bevelEnabled: false, curveSegments: 10 });
    g.rotateX(-Math.PI / 2).translate(0, TOP - 0.45, 0);
    this.islandTop = new THREE.MeshLambertMaterial({ color: '#f3f6fa' });
    this.islandSide = new THREE.MeshLambertMaterial({ color: '#d6dee8' });
    const m = new THREE.Mesh(g, [this.islandTop, this.islandSide]);
    m.receiveShadow = true;
    this.group.add(m);
    // viền màu mảnh quanh chân đảo
    const rim = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: false, curveSegments: 10 })
      .rotateX(-Math.PI / 2).translate(0, TOP - 0.62, 0).scale(1.008, 1, 1.004), new THREE.MeshLambertMaterial({ color: '#7fd6d2' }));
    this.group.add(rim);
  }

  // ---------- dải đường ----------
  _road() {
    const pts = [];
    for (let v = V_START; v <= V_END + 1e-6; v += 0.5) pts.push(new THREE.Vector3(roadU(v), 0, v));
    this.curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const S = this.curve.getSpacedPoints(320);
    const top = new THREE.Color('#40c7c4'), side = new THREE.Color('#2a9aa0'), edge = new THREE.Color('#7fe0dc');
    const pos = [], col = [];
    const quad = (a, b, c, d, color) => {
      pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, b.x, b.y, b.z, d.x, d.y, d.z, c.x, c.y, c.z);
      for (let i = 0; i < 6; i++) col.push(color.r, color.g, color.b);
    };
    const y1 = TOP + ROAD_H, y0 = TOP + 0.01, hw = ROAD_W / 2;
    const rim = (p, n, k, y) => new THREE.Vector3(p.x + n.x * k, y, p.z + n.z * k);
    for (let i = 0; i < S.length - 1; i++) {
      const n0 = this._normal(S, i), n1 = this._normal(S, i + 1);
      const a = S[i], b = S[i + 1];
      // mặt trên (giữa) + hai dải viền sáng
      quad(rim(a, n0, hw * 0.82, y1), rim(a, n0, -hw * 0.82, y1), rim(b, n1, hw * 0.82, y1), rim(b, n1, -hw * 0.82, y1), top);
      quad(rim(a, n0, hw, y1), rim(a, n0, hw * 0.82, y1), rim(b, n1, hw, y1), rim(b, n1, hw * 0.82, y1), edge);
      quad(rim(a, n0, -hw * 0.82, y1), rim(a, n0, -hw, y1), rim(b, n1, -hw * 0.82, y1), rim(b, n1, -hw, y1), edge);
      // hai thành bên
      quad(rim(a, n0, hw, y1), rim(a, n0, hw, y0), rim(b, n1, hw, y1), rim(b, n1, hw, y0), side);
      quad(rim(a, n0, -hw, y0), rim(a, n0, -hw, y1), rim(b, n1, -hw, y0), rim(b, n1, -hw, y1), side);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
    mesh.castShadow = true; mesh.receiveShadow = true;
    this.group.add(mesh);
    // bo tròn hai đầu đường
    for (const p of [S[0], S[S.length - 1]]) {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(hw, hw, ROAD_H - 0.01, 24), new THREE.MeshLambertMaterial({ color: '#40c7c4' }));
      cap.position.set(p.x, TOP + ROAD_H / 2 + 0.005, p.z);
      cap.castShadow = true;
      this.group.add(cap);
    }
    this.roadStart = S[0].clone().setY(y1);
  }

  _normal(S, i) {
    const a = S[Math.max(0, i - 1)], b = S[Math.min(S.length - 1, i + 1)];
    const t = new THREE.Vector3(b.x - a.x, 0, b.z - a.z).normalize();
    return new THREE.Vector3(-t.z, 0, t.x);
  }

  // ---------- dốc nối từ sàn Lưu trữ xuống cuối đường ----------
  _ramp(R) {
    if (!R) return;
    // đầu trên: mép sàn Lưu trữ (phía ngoài). Đầu dưới: sát cuối đường trên đảo.
    const A = new THREE.Vector3(R.x + R.w / 2 - 0.1, R.y + 0.02, R.z - 1.5);
    const vEnd = 13, uEnd = roadU(vEnd) - ROAD_W / 2 - 0.1;
    const B = this.group.localToWorld(new THREE.Vector3(uEnd, TOP + ROAD_H, vEnd));
    const dx = B.x - A.x, dz = B.z - A.z, flat = Math.hypot(dx, dz);
    const len = A.distanceTo(B), mid = A.clone().add(B).multiplyScalar(0.5);
    const tilt = Math.atan2(A.y - B.y, flat);
    const slab = (w, h, color, dy) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(len, h, w), new THREE.MeshLambertMaterial({ color }));
      m.position.copy(mid); m.position.y += dy;
      m.rotation.set(0, Math.atan2(-dz, dx), -tilt, 'YZX');
      m.castShadow = true; m.receiveShadow = true;
      this.root.add(m);
    };
    slab(1.3, 0.16, '#2a9aa0', -0.08);
    slab(1.1, 0.02, '#40c7c4', 0.01);
    for (const f of [0.35, 0.7]) {   // chân đỡ
      const p = A.clone().lerp(B, f), h = p.y - (TOP - 0.2);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, h, 8), new THREE.MeshLambertMaterial({ color: '#3a4254' }));
      leg.position.set(p.x, TOP - 0.2 + h / 2, p.z);
      leg.castShadow = true;
      this.root.add(leg);
    }
  }

  // ---------- cây, cổng xuất phát ----------
  _decor() {
    const leaf = new THREE.MeshLambertMaterial({ color: '#6cc07a', flatShading: true });
    const leaf2 = new THREE.MeshLambertMaterial({ color: '#4fae66', flatShading: true });
    const trunk = new THREE.MeshLambertMaterial({ color: '#8a6446' });
    const tree = (u, v, s) => {
      const g = new THREE.Group();
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.07 * s, 0.1 * s, 0.6 * s, 6), trunk);
      t.position.y = 0.3 * s;
      const a = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42 * s, 0), leaf); a.position.y = 0.85 * s;
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3 * s, 0), leaf2); b.position.set(0.15 * s, 1.18 * s, 0.05 * s);
      g.add(t, a, b);
      g.traverse((o) => { o.castShadow = true; });
      g.position.set(u, TOP, v);
      this.group.add(g);
    };
    tree(-5.0, -13.4, 1.2); tree(-5.1, -2.4, 1.0); tree(-4.9, 6.0, 1.1); tree(4.9, 13.8, 1.1); tree(4.8, -13.8, 0.9);
    // cổng xuất phát
    const p = this.roadStart, pole = new THREE.MeshLambertMaterial({ color: '#3a4254' });
    const n = new THREE.Vector3(1, 0, 0);
    for (const k of [-1, 1]) {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.7, 8), pole);
      c.position.set(p.x + n.x * k * 0.95, p.y + 0.85, p.z);
      c.castShadow = true;
      this.group.add(c);
    }
    const bar = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.34, 0.1), new THREE.MeshLambertMaterial({ color: '#c25b7d' }));
    bar.position.set(p.x, p.y + 1.62, p.z);
    bar.castShadow = true;
    this.group.add(bar);
    this.gateTop = new THREE.Vector3(p.x, p.y + 2.0, p.z);
  }

  // ---------- trạm: bệ + 3 kiểu biểu tượng ----------
  _stations() {
    this.stations = [];
    const glow = (color, opacity) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    for (let i = 0; i < N; i++) {
      const v = -11.5 + (i * 23) / (N - 1);
      const g = new THREE.Group();
      g.position.set(roadU(v), TOP + ROAD_H, v);
      g.scale.setScalar(1.3);
      const pedMat = new THREE.MeshLambertMaterial({ color: '#ffffff' });
      const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.64, 0.14, 28), pedMat);
      ped.position.y = 0.07; ped.castShadow = true; ped.receiveShadow = true;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.035, 6, 36), new THREE.MeshLambertMaterial({ color: '#ffffff' }));
      ring.rotation.x = Math.PI / 2; ring.position.y = 0.15;

      // đã xong: cờ
      const flag = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 1.35, 8), new THREE.MeshLambertMaterial({ color: '#5a6275' }));
      pole.position.y = 0.82;
      const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.38, 0.04).translate(0.31, 0, 0), new THREE.MeshLambertMaterial({ color: '#3fae6a' }));
      cloth.position.set(0.03, 1.28, 0);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshLambertMaterial({ color: '#f2c14e' }));
      knob.position.y = 1.52;
      flag.add(pole, cloth, knob);

      // đang làm: bóng đèn phát sáng + tia
      const bulb = new THREE.Group();
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.26, 12), new THREE.MeshLambertMaterial({ color: '#4a5266' }));
      base.position.y = 0.3;
      const glass = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 14), new THREE.MeshBasicMaterial({ color: '#ffe36b', toneMapped: false }));
      glass.position.y = 0.68;
      const halo = new THREE.Mesh(new THREE.SphereGeometry(0.62, 18, 12), glow('#ffd34d', 0.22));
      halo.position.y = 0.68;
      const rays = new THREE.Group();
      rays.position.y = 0.68;
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        const r = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.05), new THREE.MeshBasicMaterial({ color: '#ffbe2e', toneMapped: false }));
        r.position.set(Math.cos(a) * 0.58, Math.sin(a) * 0.58, 0);
        r.rotation.z = a - Math.PI / 2;
        rays.add(r);
      }
      bulb.add(base, glass, halo, rays);

      // chờ duyệt: đồng hồ cát
      const sand = new THREE.Group();
      const wood = new THREE.MeshLambertMaterial({ color: '#9a6b3f' });
      const amber = new THREE.MeshLambertMaterial({ color: '#f2a93b' });
      const bot = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.06, 16), wood); bot.position.y = 0.2;
      const topD = bot.clone(); topD.position.y = 1.08;
      const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.4, 14), amber); c1.position.y = 0.43;
      const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.4, 14), amber); c2.rotation.x = Math.PI; c2.position.y = 0.85;
      const posts = [0, 1, 2].map((k) => {
        const a = (k / 3) * Math.PI * 2;
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.86, 6), wood);
        m.position.set(Math.cos(a) * 0.28, 0.64, Math.sin(a) * 0.28);
        return m;
      });
      sand.add(bot, topD, c1, c2, ...posts);

      for (const o of [flag, bulb, sand]) { o.traverse((m) => { if (m.isMesh && m !== halo) m.castShadow = true; }); o.visible = false; }
      g.add(ped, ring, flag, bulb, sand);
      g.visible = false;
      this.group.add(g);
      this.stations.push({ v, g, ped, pedMat, ringMat: ring.material, flag, cloth, bulb, rays, halo, sand, row: null, phase: i * 1.7 });
    }
  }

  // ---------- "tài liệu" chạy dọc đường ----------
  _packets() {
    this.packets = [];
    for (let i = 0; i < 4; i++) {
      const g = new THREE.Group();
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.26), new THREE.MeshLambertMaterial({ color: '#ffffff' }));
      const tab = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.02, 0.07), new THREE.MeshLambertMaterial({ color: '#c25b7d' }));
      tab.position.set(0, 0.04, -0.09);
      g.add(box, tab);
      g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
      this.group.add(g);
      this.packets.push({ g, tab, off: i / 4 });
    }
  }

  // ---------- nhãn HTML ----------
  _labels(overlay) {
    this.title = document.createElement('div');
    this.title.className = 'road-title';
    this.title.innerHTML = '<small>VĂN PHÒNG AGENT</small><b>Đường công việc</b><span>việc mới nhất ở cuối đường</span>';
    overlay.append(this.title);
    for (const st of this.stations) {
      const card = document.createElement('button');
      card.className = 'road-card';
      card.hidden = true;
      card.addEventListener('click', () => st.row && this.onSelect?.(st.row.agent));
      const lead = document.createElement('div');
      lead.className = 'road-lead';
      lead.hidden = true;
      overlay.append(lead, card);
      st.card = card; st.lead = lead;
    }
  }

  // ---------- dữ liệu ----------
  refresh(rows) {
    const ord = (r) => (r.seq ?? +r.timestamp);
    const latest = new Map();
    for (const r of [...rows].sort((a, b) => ord(a) - ord(b))) {
      if (r.status === 'idle' || !r.task || !this.byId[r.agent]) continue;
      const k = r.agent + '|' + r.task;
      latest.delete(k); latest.set(k, r);
    }
    const list = [...latest.values()].slice(-N);
    const off = N - list.length;
    this.stations.forEach((st, i) => {
      const r = i >= off ? list[i - off] : null;
      const key = r ? `${r.agent}|${r.task}|${r.status}|${+r.timestamp}` : '';
      if (st.key === key) return;
      st.key = key; st.row = r;
      st.g.visible = !!r;
      st.card.hidden = st.lead.hidden = !r;
      if (!r) return;
      const room = this.byId[r.agent];
      st.pedMat.color.set(room.accent || '#888');
      st.ringMat.color.set(room.floor || '#fff');
      st.flag.visible = r.status === 'done';
      st.bulb.visible = r.status === 'working';
      st.sand.visible = r.status === 'waiting';
      const when = r.timestamp ? new Date(r.timestamp) : null;
      const t = when ? when.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' · ' + when.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '';
      st.card.style.setProperty('--accent', room.accent || '#666');
      st.card.dataset.s = r.status;
      st.card.title = `${room.name}: ${r.task}`;
      st.card.innerHTML = `<span class="rc-head"><b>${esc(room.name)}</b><span class="chip" data-s="${r.status}">${STATUS_TEXT[r.status] || ''}</span></span>`
        + `<span class="rc-task">${esc(r.task)}</span><time>${esc(t)}</time>`;
      st.lead.style.setProperty('--accent', room.accent || '#666');
    });
    // màu tài liệu chạy theo các phòng đang có trên đường
    const accents = list.map((r) => this.byId[r.agent].accent).filter(Boolean);
    this.packets.forEach((p, i) => p.tab.material.color.set(accents.length ? accents[i % accents.length] : '#c25b7d'));
  }

  setTheme(dark) {
    this.islandTop.color.set(dark ? '#2b355a' : '#f3f6fa');
    this.islandSide.color.set(dark ? '#1d2545' : '#d6dee8');
  }

  // ---------- chuyển động ----------
  update(dt, t, reduced) {
    for (const st of this.stations) {
      if (!st.row) continue;
      if (st.bulb.visible) {
        const p = reduced ? 1 : 1 + Math.sin(t * 3 + st.phase) * 0.12;
        st.rays.scale.setScalar(p);
        if (!reduced) st.rays.rotation.z += dt * 0.6;
        st.halo.material.opacity = reduced ? 0.22 : 0.16 + Math.sin(t * 3 + st.phase) * 0.08;
      }
      if (st.flag.visible) st.cloth.rotation.y = reduced ? 0 : Math.sin(t * 2.2 + st.phase) * 0.25;
      if (st.sand.visible && !reduced) st.sand.rotation.y += dt * 0.5;
    }
    this.packets.forEach((p) => {
      p.g.visible = !reduced;
      if (reduced) return;
      const u = (p.off + t * 0.035) % 1;
      const q = this.curve.getPointAt(u), q2 = this.curve.getPointAt(Math.min(1, u + 0.002));
      p.g.position.set(q.x, TOP + ROAD_H + 0.12 + Math.abs(Math.sin(t * 5 + p.off * 9)) * 0.05, q.z);
      p.g.rotation.y = Math.atan2(q2.x - q.x, q2.z - q.z);
    });
  }

  // các góc đảo (toạ độ thế giới) để camera ôm vừa
  fitPoints() {
    const w = ISLAND_W / 2, l = ISLAND_L / 2, out = [];
    // u = w + 7: chừa chỗ cho thẻ chữ bên phải con đường
    for (const u of [-w, w + 7]) for (const v of [-l, l]) for (const y of [TOP - 0.5, TOP + 1.8]) out.push(this.group.localToWorld(new THREE.Vector3(u, y, v)));
    return out;
  }

  // đặt nhãn HTML theo vị trí 3D (gọi mỗi khung hình sau khi render)
  place(toScreen) {
    const v3 = new THREE.Vector3();
    const [tx, ty] = toScreen(this.group.localToWorld(v3.copy(this.gateTop)));
    this.title.style.transform = `translate(${tx}px, ${ty}px) translate(-50%, -100%)`;
    for (const st of this.stations) {
      if (!st.row) continue;
      const [sx, sy] = toScreen(this.group.localToWorld(v3.set(roadU(st.v), TOP + ROAD_H + 1.0, st.v)));
      const [ax] = toScreen(this.group.localToWorld(v3.set(LABEL_U, TOP, st.v)));
      const x0 = sx + 12, w = Math.max(10, ax - x0);
      st.lead.style.transform = `translate(${x0}px, ${sy}px)`;
      st.lead.style.width = w + 'px';
      st.card.style.transform = `translate(${x0 + w}px, ${sy}px) translate(0, -50%)`;
    }
  }
}
