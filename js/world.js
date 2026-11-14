// Dựng thế giới tĩnh: phòng, tường, cầu thang, nội thất.
// Mọi khối tĩnh được gộp vào MỘT mesh dùng màu đỉnh (vertex color) → 1 draw call.
// Thứ cần chuyển động (lá cây, màn hình) dùng InstancedMesh.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const LEVEL_H = 1.6;
const WALL_H = 2.3;
const RAIL_H = 0.85;
const DOOR_W = 1.9;

const _e = new THREE.Euler();
const _m = new THREE.Matrix4();

class GeoBag {
  constructor() { this.list = []; }
  push(g, color, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    if (g.attributes.uv) g.deleteAttribute('uv');
    if (g.index === null) g.setIndex([...Array(g.attributes.position.count).keys()]);
    _m.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(_e.set(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
    g.applyMatrix4(_m);
    const c = new THREE.Color(color);
    const n = g.attributes.position.count;
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3));
    this.list.push(g);
  }
  box(w, h, d, x, y, z, color, ry = 0, rx = 0, rz = 0) { this.push(new THREE.BoxGeometry(w, h, d), color, x, y, z, rx, ry, rz); }
  cyl(rt, rb, h, seg, x, y, z, color) { this.push(new THREE.CylinderGeometry(rt, rb, h, seg), color, x, y, z); }
  blob(r, x, y, z, color, sx = 1, sy = 1, sz = 1, detail = 1) { this.push(new THREE.IcosahedronGeometry(r, detail), color, x, y, z, 0, 0, 0, sx, sy, sz); }
  build(material) {
    const g = mergeGeometries(this.list, false);
    this.list.forEach((x) => x.dispose());
    this.list = [];
    return new THREE.Mesh(g, material);
  }
}

// Xoay điểm (ox, oz) quanh trục Y một góc a
const rot = (ox, oz, a) => [ox * Math.cos(a) + oz * Math.sin(a), -ox * Math.sin(a) + oz * Math.cos(a)];

const shade = (hex, k) => '#' + new THREE.Color(hex).offsetHSL(0, 0, k).getHexString();

export class World {
  constructor(config) {
    this.cfg = config;
    this.group = new THREE.Group();
    this.rooms = new Map();
    this.links = [];
    this.adj = new Map();
    this.screens = [];   // {pos, rotY, w, h, roomId}
    this.plants = [];    // {pos, s, phase}
    this.cats = [];      // {pos, rotY, color, roomId}
    this.lamps = [];
    this.bag = new GeoBag();
    this.glass = new GeoBag();
    this._layout();
    this._links();
    for (const r of this.rooms.values()) this._room(r);
    for (const l of this.links) this._connector(l);
    this._finish();
  }

  // ---------- tính vị trí ----------
  _layout() {
    for (const c of this.cfg.rooms) {
      const y = (c.level || 0) * LEVEL_H;
      this.rooms.set(c.id, {
        cfg: c, id: c.id, x: c.x, y, z: c.z, w: c.w || 9, d: c.d || 8,
        doors: [], blocks: [], seats: [], spots: [], hub: null,
        screenIdx: [], anchor: new THREE.Vector3(),
      });
      this.adj.set(c.id, []);
    }
    const xs = [], zs = [];
    for (const r of this.rooms.values()) { xs.push(r.x - r.w / 2, r.x + r.w / 2); zs.push(r.z - r.d / 2, r.z + r.d / 2); }
    this.bounds = { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) };
    this.center = new THREE.Vector3((this.bounds.x0 + this.bounds.x1) / 2, 0.8, (this.bounds.z0 + this.bounds.z1) / 2);
  }

  _links() {
    for (const [ia, ib, kind = 'stairs', offset] of this.cfg.links) {
      const A = this.rooms.get(ia), B = this.rooms.get(ib);
      if (!A || !B) { console.warn('Liên kết không hợp lệ', ia, ib); continue; }
      const dx = B.x - A.x, dz = B.z - A.z;
      const alongX = Math.abs(dx) >= Math.abs(dz);
      let doorA, doorB, sideA, sideB;
      if (alongX) {
        const lo = Math.max(A.z - A.d / 2, B.z - B.d / 2) + 1.2, hi = Math.min(A.z + A.d / 2, B.z + B.d / 2) - 1.2;
        const zc = lo <= hi ? THREE.MathUtils.clamp((A.z + B.z) / 2 + (offset || 0), lo, hi) : (A.z + B.z) / 2;
        const s = Math.sign(dx);
        doorA = new THREE.Vector3(A.x + s * A.w / 2, A.y, zc);
        doorB = new THREE.Vector3(B.x - s * B.w / 2, B.y, zc);
        sideA = s > 0 ? 'px' : 'nx'; sideB = s > 0 ? 'nx' : 'px';
      } else {
        const lo = Math.max(A.x - A.w / 2, B.x - B.w / 2) + 1.2, hi = Math.min(A.x + A.w / 2, B.x + B.w / 2) - 1.2;
        const xc = lo <= hi ? THREE.MathUtils.clamp((A.x + B.x) / 2 + (offset || 0), lo, hi) : (A.x + B.x) / 2;
        const s = Math.sign(dz);
        doorA = new THREE.Vector3(xc, A.y, A.z + s * A.d / 2);
        doorB = new THREE.Vector3(xc, B.y, B.z - s * B.d / 2);
        sideA = s > 0 ? 'pz' : 'nz'; sideB = s > 0 ? 'nz' : 'pz';
      }
      const inward = (door, side, room) => {
        const v = door.clone();
        if (side === 'px') v.x -= 1.0; if (side === 'nx') v.x += 1.0;
        if (side === 'pz') v.z -= 1.0; if (side === 'nz') v.z += 1.0;
        return v;
      };
      const link = { a: ia, b: ib, kind, doorA, doorB, sideA, sideB, alongX,
        inA: inward(doorA, sideA, A), inB: inward(doorB, sideB, B) };
      A.doors.push({ side: sideA, at: alongX ? doorA.z - A.z : doorA.x - A.x });
      B.doors.push({ side: sideB, at: alongX ? doorB.z - B.z : doorB.x - B.x });
      // vùng lối đi trước cửa: không đặt đồ ở đây
      for (const [R, door, side] of [[A, doorA, sideA], [B, doorB, sideB]]) {
        const lx = door.x - R.x, lz = door.z - R.z, depth = 2.6, half = 1.1;
        if (side === 'px') R.blocks.push([lx - depth, lx, lz - half, lz + half]);
        if (side === 'nx') R.blocks.push([lx, lx + depth, lz - half, lz + half]);
        if (side === 'pz') R.blocks.push([lx - half, lx + half, lz - depth, lz]);
        if (side === 'nz') R.blocks.push([lx - half, lx + half, lz, lz + depth]);
      }
      this.links.push(link);
      this.adj.get(ia).push({ to: ib, link, fwd: true });
      this.adj.get(ib).push({ to: ia, link, fwd: false });
    }
  }

  // ô chữ nhật [x0,x1,z0,z1] (toạ độ trong phòng) có trống không?
  _free(R, rect) {
    const [a0, a1, b0, b1] = rect;
    if (a0 < -R.w / 2 - 0.01 || a1 > R.w / 2 + 0.01 || b0 < -R.d / 2 - 0.01 || b1 > R.d / 2 + 0.01) return false;
    return !R.blocks.some(([x0, x1, z0, z1]) => a0 < x1 && a1 > x0 && b0 < z1 && b1 > z0);
  }
  _take(R, rect) { if (!this._free(R, rect)) return false; R.blocks.push(rect); return true; }

  // ---------- dựng một phòng ----------
  _room(R) {
    const c = R.cfg, B = this.bag, { x, y, z, w, d } = R;
    const floor = c.floor || '#cfd8e6', wall = c.wall || '#f4f4f4', accent = c.accent || '#555';
    // bệ nổi + mặt sàn
    B.box(w, 0.7, d, x, y - 0.4, z, shade(floor, -0.12));
    B.box(w, 0.1, d, x, y - 0.03, z, floor);
    B.box(w - 0.02, 0.012, 0.04, x, y + 0.025, z + d / 2 - 0.02, shade(floor, 0.08));
    B.box(0.04, 0.012, d - 0.02, x + w / 2 - 0.02, y + 0.025, z, shade(floor, 0.08));
    // dải màu của khu quanh chân bệ
    const zone = this.cfg.zones?.[c.zone];
    if (zone) B.box(w + 0.06, 0.16, d + 0.06, x, y - 0.62, z, zone.color);
    // tường sau (nx, nz) cao, mặt trước (px, pz) lan can kính thấp
    this._wallSide(R, 'nx', wall, accent);
    this._wallSide(R, 'nz', wall, accent);
    this._wallSide(R, 'px', wall, accent);
    this._wallSide(R, 'pz', wall, accent);

    const L = (lx, ly, lz) => new THREE.Vector3(x + lx, y + ly, z + lz);

    if (c.layout === 'reception') this._reception(R, L);
    else if (c.layout === 'brain') this._brain(R, L);
    else this._desks(R, L);

    for (const p of c.props || []) this._prop(R, p, L);

    // cây ở góc
    const corners = [[-w / 2 + 0.55, d / 2 - 0.55], [w / 2 - 0.55, -d / 2 + 0.55], [-w / 2 + 0.55, -d / 2 + 0.55], [w / 2 - 0.55, d / 2 - 0.55]];
    let planted = 0;
    for (const [px, pz] of corners) {
      if (planted >= 2) break;
      if (this._take(R, [px - 0.35, px + 0.35, pz - 0.35, pz + 0.35])) { this._plant(L(px, 0, pz), 1 + Math.random() * 0.25); planted++; }
    }

    // điểm tụ tập (hub): chỗ trống gần giữa phòng
    const cands = [[w * 0.12, d * 0.12], [0, 0], [w * 0.2, -d * 0.05], [-w * 0.05, d * 0.2], [w * 0.25, d * 0.25]];
    let hub = cands[0];
    for (const cnd of cands) {
      if (this._free(R, [cnd[0] - 0.4, cnd[0] + 0.4, cnd[1] - 0.4, cnd[1] + 0.4])) { hub = cnd; break; }
    }
    R.hub = L(hub[0], 0, hub[1]);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      R.spots.push(L(hub[0] + Math.cos(a) * 0.9, 0, hub[1] + Math.sin(a) * 0.9));
    }
    // mèo
    if (c.cat !== false) {
      const spots = [[w * 0.28, d * 0.32], [-w * 0.1, d * 0.35], [w * 0.35, -d * 0.1], [0.2, 0.9]];
      let cp = spots.find(([cx, cz]) => this._free(R, [cx - 0.35, cx + 0.35, cz - 0.4, cz + 0.4])) || spots[0];
      R.blocks.push([cp[0] - 0.35, cp[0] + 0.35, cp[1] - 0.4, cp[1] + 0.4]);
      this.cats.push({ pos: L(cp[0], 0, cp[1]), rotY: Math.random() * 6.28, color: typeof c.cat === 'string' ? c.cat : '#f2b36b', roomId: R.id });
    }
    // chó (tuỳ chọn): dog: '#màu'
    if (c.dog) {
      this.dogs = this.dogs || [];
      this.dogs.push({ pos: (R.hub || L(0, 0, 0)).clone(), rotY: Math.random() * 6.28, color: typeof c.dog === 'string' ? c.dog : '#c8945a', roomId: R.id });
    }
    R.anchor.copy(L(-w * 0.18, WALL_H + 0.7, -d * 0.18));
    R.hit = { cx: x, cy: y + 1.2, cz: z, w, h: 2.6, d };
  }

  _wallSide(R, side, wall, accent) {
    const { x, y, z, w, d } = R;
    const back = side === 'nx' || side === 'nz';
    const alongX = side === 'nz' || side === 'pz'; // tường chạy theo trục x
    const len = alongX ? w : d;
    const doors = R.doors.filter((o) => o.side === side).map((o) => o.at).sort((a, b) => a - b);
    const segs = []; let s = -len / 2;
    for (const at of doors) { segs.push([s, at - DOOR_W / 2]); s = at + DOOR_W / 2; }
    segs.push([s, len / 2]);
    const fixed = side === 'nx' ? x - w / 2 : side === 'px' ? x + w / 2 : side === 'nz' ? z - d / 2 : z + d / 2;
    const B = this.bag;
    for (const [a, b] of segs) {
      const L = b - a; if (L < 0.05) continue;
      const mid = (a + b) / 2;
      const cx = alongX ? x + mid : fixed, cz = alongX ? fixed : z + mid;
      const sx = alongX ? L : 0.16, sz = alongX ? 0.16 : L;
      if (back) {
        B.box(sx, WALL_H, sz, cx, y + WALL_H / 2, cz, wall);
        B.box(alongX ? L : 0.2, 0.08, alongX ? 0.2 : L, cx, y + WALL_H + 0.04, cz, shade(wall, -0.18));
        B.box(alongX ? L : 0.18, 0.12, alongX ? 0.18 : L, cx, y + 0.06, cz, shade(accent, 0.25));
        // cửa sổ dải
        if (L > 2.2) {
          const ww = L - 1.2;
          const inset = side === 'nx' ? 0.09 : side === 'nz' ? 0.09 : 0;
          this.glass.box(alongX ? ww : 0.03, 0.7, alongX ? 0.03 : ww, cx + (alongX ? 0 : inset), y + 1.55, cz + (alongX ? inset : 0), '#bfe3ff');
        }
      } else {
        // lan can kính + cột
        this.glass.box(alongX ? L : 0.05, RAIL_H, alongX ? 0.05 : L, cx, y + RAIL_H / 2, cz, '#cfeaff');
        B.box(alongX ? L : 0.09, 0.06, alongX ? 0.09 : L, cx, y + RAIL_H, cz, shade(accent, 0.15));
        const posts = Math.max(2, Math.round(L / 1.6) + 1);
        for (let i = 0; i < posts; i++) {
          const t = a + (L * i) / (posts - 1);
          B.box(0.07, RAIL_H, 0.07, alongX ? x + t : fixed, y + RAIL_H / 2, alongX ? fixed : z + t, shade(accent, 0.15));
        }
      }
    }
  }

  // bàn làm việc + ghế + màn hình. worker nhìn theo hướng rotY
  _desk(R, L, lx, lz, rotY, chairColor) {
    const B = this.bag;
    const P = (ox, oy, oz) => { const [a, b] = rot(ox, oz, rotY); return L(lx + a, oy, lz + b); };
    const add = (w, h, dd, ox, oy, oz, color) => { const p = P(ox, oy, oz); B.box(w, h, dd, p.x, p.y, p.z, color, rotY); };
    // mặt bàn + chân
    add(1.35, 0.06, 0.7, 0, 0.74, 0.62, '#f3ede3');
    for (const [a, b] of [[-0.6, 0.33], [0.6, 0.33], [-0.6, 0.9], [0.6, 0.9]]) add(0.05, 0.72, 0.05, a, 0.36, b, '#9aa0aa');
    add(1.2, 0.35, 0.03, 0, 0.5, 0.95, '#d9d2c6');
    // màn hình (vỏ) + chân đế
    add(0.72, 0.46, 0.05, 0, 1.1, 0.88, '#3a3f4b');
    add(0.06, 0.25, 0.06, 0, 0.88, 0.9, '#3a3f4b');
    add(0.3, 0.02, 0.18, 0, 0.775, 0.88, '#3a3f4b');
    // bàn phím, cốc
    add(0.45, 0.02, 0.15, 0, 0.78, 0.48, '#e7e9ef');
    add(0.08, 0.1, 0.08, 0.5, 0.82, 0.55, ['#ef8a7a', '#7ab6ef', '#f2c96b'][Math.floor(Math.random() * 3)]);
    // ghế
    add(0.5, 0.08, 0.5, 0, 0.44, -0.02, chairColor);
    add(0.5, 0.5, 0.07, 0, 0.72, -0.27, chairColor);
    add(0.06, 0.4, 0.06, 0, 0.22, 0, '#555a66');
    add(0.46, 0.04, 0.08, 0, 0.03, 0, '#555a66');
    add(0.08, 0.04, 0.46, 0, 0.03, 0, '#555a66');
    // màn hình phát sáng (instanced)
    const sp = P(0, 1.1, 0.85);
    R.screenIdx.push(this.screens.length);
    this.screens.push({ pos: sp, rotY: rotY + Math.PI, w: 0.64, h: 0.38, roomId: R.id });
    R.seats.push({ pos: P(0, 0, -0.02), rotY, side: P(0.85, 0, 0.25) });
  }

  _desks(R, L) {
    const { w, d } = R, c = R.cfg, n = c.staff ?? 2;
    const chair = shade(c.accent || '#666', 0.1);
    const slots = [];
    // cột dọc tường nx: người nhìn về -x
    for (let lz = -d / 2 + 1.5; lz <= d / 2 - 1.6; lz += 2.1) slots.push({ lx: -w / 2 + 2.25, lz, rotY: -Math.PI / 2 });
    // hàng dọc tường nz: người nhìn về -z
    for (let lx = -w / 2 + 3.9; lx <= w / 2 - 1.0; lx += 2.0) slots.push({ lx, lz: -d / 2 + 2.25, rotY: Math.PI });
    // hàng giữa (dự phòng)
    for (let lx = -w / 2 + 3.9; lx <= w / 2 - 1.0; lx += 2.0) slots.push({ lx, lz: 0.6, rotY: Math.PI });
    let placed = 0;
    for (const s of slots) {
      if (placed >= n) break;
      // footprint xấp xỉ của bàn+ghế
      const [fx, fz] = rot(0, 0.35, s.rotY);
      const cx = s.lx + fx, cz = s.lz + fz;
      const along = Math.abs(Math.sin(s.rotY)) > 0.5; // nhìn theo x
      const hw = along ? 0.75 : 0.85, hd = along ? 0.85 : 0.75;
      if (!this._take(R, [cx - hw, cx + hw, cz - hd, cz + hd])) continue;
      this._desk(R, L, s.lx, s.lz, s.rotY, chair);
      placed++;
    }
  }

  // Bộ não: bục tròn ở giữa với "bộ não" phát sáng, bàn làm việc ở 4 góc chéo nhìn vào
  _brain(R, L) {
    const B = this.bag, c = R.cfg, accent = c.accent || '#c25b7d';
    R.blocks.push([-1.7, 1.7, -1.7, 1.7]);
    const p = L(0, 0, 0);
    B.cyl(1.6, 1.75, 0.22, 20, p.x, R.y + 0.11, p.z, shade(accent, 0.3));
    B.cyl(1.25, 1.25, 0.06, 20, p.x, R.y + 0.25, p.z, '#ffffff');
    B.cyl(0.35, 0.5, 0.7, 10, p.x, R.y + 0.6, p.z, shade(accent, 0.15));
    // 4 cột đèn nhỏ quanh bục
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      B.cyl(0.06, 0.06, 1.2, 6, p.x + Math.cos(a) * 1.45, R.y + 0.8, p.z + Math.sin(a) * 1.45, '#e9e4ef');
      B.blob(0.11, p.x + Math.cos(a) * 1.45, R.y + 1.45, p.z + Math.sin(a) * 1.45, '#fff1c9', 1, 1, 1, 0);
    }
    this.cores = this.cores || [];
    this.cores.push({ pos: L(0, 2.0, 0), color: accent, roomId: R.id });
    const n = c.staff ?? 3, chair = shade(accent, 0.15);
    // ưu tiên góc trước (người quay lưng về camera, thấy màn hình), rồi hai bên, rồi góc sau
    const angles = [Math.PI / 4, -Math.PI / 4, 3 * Math.PI / 4, -3 * Math.PI / 4];
    let placed = 0;
    for (const a of angles) {
      if (placed >= n) break;
      const r = 3.5, lx = Math.sin(a) * r, lz = Math.cos(a) * r;
      if (!this._take(R, [lx - 0.75, lx + 0.75, lz - 0.75, lz + 0.75])) continue;
      this._desk(R, L, lx, lz, a + Math.PI, chair);
      placed++;
    }
  }

  _reception(R, L) {
    const { w, d } = R, c = R.cfg, B = this.bag;
    const accent = c.accent || '#2f5d8a';
    // chọn góc sau-trái hoặc sau-phải
    let side = -1;
    const rectFor = (s) => { const cx = s * (w / 2 - 2.4); return [cx - 1.7, cx + 1.7, -d / 2 + 0.2, -d / 2 + 2.85]; };
    if (!this._free(R, rectFor(-1))) side = 1;
    R.blocks.push(rectFor(side));
    const cx = side * (w / 2 - 2.4), cz = -d / 2 + 2.3;
    // quầy cong (3 đoạn)
    const top = '#f7f7f4', front = accent;
    B.box(2.4, 1.0, 0.5, L(cx, 0, cz).x, R.y + 0.5, L(cx, 0, cz).z, front);
    B.box(2.55, 0.07, 0.65, L(cx, 0, cz).x, R.y + 1.03, L(cx, 0, cz).z, top);
    for (const s of [-1, 1]) {
      const p = L(cx + s * 1.45, 0, cz - 0.35);
      B.box(0.5, 1.0, 0.9, p.x, R.y + 0.5, p.z, front, s * 0.5);
      B.box(0.62, 0.07, 1.0, p.x, R.y + 1.03, p.z, top, s * 0.5);
    }
    B.box(2.3, 0.08, 0.06, L(cx, 0, cz).x, R.y + 0.7, L(cx, 0, cz + 0.26).z, '#ffffff');
    // nhân viên lễ tân ngồi sau quầy, nhìn về +z
    const n = Math.min(c.staff ?? 2, 3);
    for (let i = 0; i < n; i++) {
      const lx = cx + (n === 1 ? 0 : (i - (n - 1) / 2) * 1.1), lz = cz - 0.95;
      const P = (ox, oy, oz) => L(lx + ox, oy, lz + oz);
      const chair = shade(accent, 0.2);
      let p = P(0, 0.44, 0); B.box(0.5, 0.08, 0.5, p.x, p.y, p.z, chair);
      p = P(0, 0.72, -0.25); B.box(0.5, 0.5, 0.07, p.x, p.y, p.z, chair);
      p = P(0, 0.22, 0); B.box(0.06, 0.4, 0.06, p.x, p.y, p.z, '#555a66');
      // màn hình trên quầy (quay về nhân viên)
      p = P(0, 1.3, 0.45); B.box(0.6, 0.38, 0.05, p.x, p.y, p.z, '#3a3f4b');
      R.screenIdx.push(this.screens.length);
      this.screens.push({ pos: P(0, 1.3, 0.42), rotY: Math.PI, w: 0.54, h: 0.32, roomId: R.id });
      R.seats.push({ pos: P(0, 0, 0), rotY: 0, side: P(0.0, 0, 1.25) });
    }
    // bảng tên trên tường sau
    const wallZ = -d / 2 + 0.1;
    let p = L(cx, 0, wallZ); B.box(2.2, 0.7, 0.05, p.x, R.y + 1.75, p.z, accent);
    B.cyl(0.22, 0.22, 0.06, 12, p.x - 0.65, R.y + 1.75, p.z + 0.04, '#ffd27a');
    B.box(1.0, 0.1, 0.03, p.x + 0.2, R.y + 1.85, p.z + 0.04, '#ffffff');
    B.box(0.7, 0.07, 0.03, p.x + 0.05, R.y + 1.66, p.z + 0.04, '#dbe7f3');
  }

  _prop(R, kind, L) {
    const { w, d } = R, B = this.bag, c = R.cfg, accent = c.accent || '#666';
    const tryRects = (list, fn) => {
      for (const [lx, lz, hw, hd, extra] of list) {
        if (this._take(R, [lx - hw, lx + hw, lz - hd, lz + hd])) { fn(lx, lz, extra); return true; }
      }
      return false;
    };
    if (kind === 'sofa') {
      tryRects([[w / 2 - 1.3, d / 2 - 1.6, 0.6, 1.1, 'x'], [-w / 2 + 1.4, d / 2 - 1.1, 1.1, 0.6, 'z'], [w / 2 - 1.6, 0.3, 0.6, 1.1, 'x']], (lx, lz, o) => {
        const col = shade(accent, 0.28);
        const p = L(lx, 0, lz), ry = o === 'x' ? -Math.PI / 2 : Math.PI;
        const P = (ox, oz) => { const [a, b] = rot(ox, oz, ry); return [p.x + a, p.z + b]; };
        let q = P(0, 0); B.box(1.9, 0.38, 0.8, q[0], R.y + 0.24, q[1], col, ry);
        q = P(0, -0.32); B.box(1.9, 0.55, 0.2, q[0], R.y + 0.5, q[1], shade(col, -0.06), ry);
        for (const s of [-1, 1]) { q = P(s * 0.92, 0); B.box(0.18, 0.5, 0.8, q[0], R.y + 0.3, q[1], shade(col, -0.06), ry); }
        for (const s of [-0.45, 0.45]) { q = P(s, 0.05); B.box(0.8, 0.1, 0.62, q[0], R.y + 0.47, q[1], shade(col, 0.06), ry); }
        // bàn trà
        q = P(0, 1.0);
        B.cyl(0.38, 0.38, 0.06, 14, q[0], R.y + 0.42, q[1], '#f4f0e8');
        B.cyl(0.05, 0.05, 0.4, 6, q[0], R.y + 0.2, q[1], '#9aa0aa');
        B.box(0.22, 0.03, 0.3, q[0] + 0.1, R.y + 0.46, q[1], '#ffffff', 0.4);
      });
    } else if (kind === 'shelf') {
      tryRects([[w / 2 - 1.4, -d / 2 + 0.35, 0.9, 0.3, 'z'], [-w / 2 + 0.35, d / 2 - 1.6, 0.3, 0.9, 'x'], [w / 2 - 3.6, -d / 2 + 0.35, 0.9, 0.3, 'z']], (lx, lz, o) => {
        const p = L(lx, 0, lz), ry = o === 'z' ? 0 : Math.PI / 2;
        const P = (ox, oz) => { const [a, b] = rot(ox, oz, ry); return [p.x + a, p.z + b]; };
        let q = P(0, 0); B.box(1.6, 1.9, 0.4, q[0], R.y + 0.95, q[1], '#f6f3ee', ry);
        const books = ['#e9806e', '#6fa8dc', '#f6c26b', '#93c47d', '#8e7cc3', '#76a5af'];
        for (let row = 0; row < 3; row++) {
          q = P(0, 0.12); B.box(1.5, 0.04, 0.38, q[0], R.y + 0.35 + row * 0.55, q[1], '#d8d2c8', ry);
          let off = -0.65;
          while (off < 0.6) {
            const bw = 0.08 + Math.random() * 0.08, bh = 0.25 + Math.random() * 0.15;
            q = P(off, 0.12); B.box(bw, bh, 0.26, q[0], R.y + 0.37 + row * 0.55 + bh / 2, q[1], books[Math.floor(Math.random() * books.length)], ry);
            off += bw + 0.02 + (Math.random() < 0.15 ? 0.15 : 0);
          }
        }
      });
    } else if (kind === 'board' || kind === 'tv' || kind === 'easel') {
      // treo trên tường sau nz (hoặc nx)
      const cands = [[w / 2 - 1.6, -d / 2 + 0.25, 0.9, 0.2, 'z'], [-w / 2 + 0.25, d / 2 - 1.8, 0.2, 0.9, 'x'], [0.6, -d / 2 + 0.25, 0.9, 0.2, 'z'], [-w / 2 + 0.25, 0, 0.2, 0.9, 'x']];
      if (kind === 'easel') {
        tryRects([[w / 2 - 1.8, -0.4, 0.6, 0.6], [1.2, d / 2 - 1.4, 0.6, 0.6], [0.3, 0.3, 0.6, 0.6]], (lx, lz) => {
          const p = L(lx, 0, lz), ry = Math.PI / 4;
          const P = (ox, oz) => { const [a, b] = rot(ox, oz, ry); return [p.x + a, p.z + b]; };
          for (const s of [-0.35, 0.35]) { const q = P(s, 0); B.box(0.05, 1.7, 0.05, q[0], R.y + 0.85, q[1], '#b8895a', ry, -0.12); }
          let q = P(0, -0.25); B.box(0.05, 1.5, 0.05, q[0], R.y + 0.75, q[1], '#b8895a', ry, 0.25);
          q = P(0, 0.08); B.box(1.0, 0.75, 0.04, q[0], R.y + 1.25, q[1], '#ffffff', ry, -0.12);
          const cols = ['#f4a6a6', '#a6c8f4', '#f7d794', '#b5e3b0'];
          cols.forEach((cl, i) => { q = P(-0.25 + (i % 2) * 0.45, 0.11); B.box(0.36, 0.26, 0.02, q[0], R.y + 1.08 + Math.floor(i / 2) * 0.32, q[1], cl, ry, -0.12); });
          q = P(0, 0.1); B.box(0.9, 0.04, 0.12, q[0], R.y + 0.86, q[1], '#b8895a', ry);
        });
        return;
      }
      tryRects(cands, (lx, lz, o) => {
        const p = L(lx, 0, lz), ry = o === 'z' ? 0 : Math.PI / 2;
        const P = (ox, oz) => { const [a, b] = rot(ox, oz, ry); return [p.x + a, p.z + b]; };
        if (kind === 'board') {
          let q = P(0, -0.08); B.box(1.7, 1.05, 0.05, q[0], R.y + 1.5, q[1], '#ffffff', ry);
          { const f = P(0, -0.11); B.box(1.8, 1.13, 0.07, f[0], R.y + 1.5, f[1], '#c9ced8', ry); }
          const notes = ['#ffe28a', '#ffb3c1', '#a8e6cf', '#9ad0f5'];
          for (let i = 0; i < 8; i++) {
            q = P(-0.65 + (i % 4) * 0.42 + Math.random() * 0.06, -0.04);
            B.box(0.22, 0.22, 0.02, q[0], R.y + 1.75 - Math.floor(i / 4) * 0.4 - Math.random() * 0.06, q[1], notes[i % 4], ry);
          }
          q = P(0.2, -0.04); B.box(0.9, 0.03, 0.02, q[0], R.y + 1.12, q[1], '#ef6f6f', ry, 0, 0.3);
        } else {
          let q = P(0, -0.08); B.box(1.9, 1.1, 0.08, q[0], R.y + 1.45, q[1], '#2b2f3a', ry);
          const sp = P(0, -0.02);
          this.screens.push({ pos: new THREE.Vector3(sp[0], R.y + 1.45, sp[1]), rotY: ry, w: 1.75, h: 0.95, roomId: R.id, big: true });
          R.screenIdx.push(this.screens.length - 1);
          q = P(0, 0.25); B.box(1.6, 0.5, 0.45, q[0], R.y + 0.25, q[1], '#e9e4dc', ry);
        }
      });
    } else if (kind === 'beanbags') {
      tryRects([[w / 2 - 1.4, d / 2 - 1.4, 1.0, 1.0], [-w / 2 + 1.5, d / 2 - 1.3, 1.0, 0.9], [1.0, d / 2 - 1.3, 1.0, 0.9]], (lx, lz) => {
        const cols = [shade(accent, 0.05), shade(accent, 0.2), shade(accent, -0.05)];
        [[-0.45, -0.35], [0.5, -0.2], [0.0, 0.5]].forEach(([a, b], i) => {
          const p = L(lx + a, 0, lz + b);
          B.blob(0.45, p.x, R.y + 0.25, p.z, cols[i], 1, 0.62, 1);
        });
      });
    } else if (kind === 'cooler') {
      tryRects([[w / 2 - 0.45, -d / 2 + 1.5, 0.3, 0.3], [-w / 2 + 0.45, d / 2 - 2.6, 0.3, 0.3], [w / 2 - 0.45, d / 2 - 2.8, 0.3, 0.3]], (lx, lz) => {
        const p = L(lx, 0, lz);
        B.box(0.4, 0.9, 0.4, p.x, R.y + 0.45, p.z, '#eef1f5');
        B.cyl(0.17, 0.17, 0.45, 10, p.x, R.y + 1.12, p.z, '#9fd3f5');
        B.box(0.12, 0.06, 0.06, p.x + 0.2, R.y + 0.75, p.z, '#5d9fd6');
      });
    } else if (kind === 'rug') {
      // thảm không chặn đường đi
      const p = R.hub || L(w * 0.12, 0, d * 0.12);
      B.box(2.6, 0.02, 1.8, p.x, R.y + 0.03, p.z, shade(c.floor || '#ccc', 0.1));
      B.box(2.2, 0.022, 1.4, p.x, R.y + 0.032, p.z, shade(accent, 0.3));
    }
  }

  _plant(pos, s = 1) {
    const B = this.bag;
    B.cyl(0.2 * s, 0.15 * s, 0.38 * s, 8, pos.x, pos.y + 0.19 * s, pos.z, '#f2efe9');
    B.cyl(0.21 * s, 0.21 * s, 0.05, 8, pos.x, pos.y + 0.38 * s, pos.z, '#d8d1c4');
    B.cyl(0.03, 0.03, 0.4 * s, 5, pos.x, pos.y + 0.55 * s, pos.z, '#7d5b3e');
    this.plants.push({ pos: pos.clone().setY(pos.y + 0.75 * s), s, phase: Math.random() * 6.28 });
  }

  // ---------- cầu thang / thang cuốn / hành lang ----------
  _connector(l) {
    const B = this.bag;
    const A = this.rooms.get(l.a), Bm = this.rooms.get(l.b);
    const p0 = l.doorA, p1 = l.doorB;
    const len = l.alongX ? Math.abs(p1.x - p0.x) : Math.abs(p1.z - p0.z);
    if (len < 0.05) return;
    const rise = p1.y - p0.y;
    const width = 1.7;
    const low = Math.min(p0.y, p1.y);
    const dir = new THREE.Vector3().subVectors(p1, p0).setY(0).normalize();
    const color = '#dfe6ef';
    const side = shade(A.cfg.floor || '#ccc', -0.15);
    if (Math.abs(rise) < 0.01) {
      const m = p0.clone().lerp(p1, 0.5);
      B.box(l.alongX ? len : width, 0.5, l.alongX ? width : len, m.x, p0.y - 0.27, m.z, shade('#dfe6ef', -0.1));
      B.box(l.alongX ? len : width, 0.06, l.alongX ? width : len, m.x, p0.y - 0.02, m.z, color);
      return;
    }
    if (l.kind === 'escalator') {
      const slope = Math.atan2(rise, len);
      const hyp = Math.hypot(len, rise);
      const m = p0.clone().lerp(p1, 0.5);
      // dầm
      const ry = l.alongX ? 0 : Math.PI / 2;
      // độ dốc dương theo dir: nếu đi theo x, quay quanh z; nếu theo z, quay quanh x
      const sgn = (l.alongX ? Math.sign(dir.x) : Math.sign(dir.z));
      const rz = l.alongX ? slope * sgn : 0, rx = l.alongX ? 0 : -slope * sgn;
      B.box(l.alongX ? hyp : width, 0.45, l.alongX ? width : hyp, m.x, m.y - 0.25, m.z, '#9aa6b8', 0, rx, rz);
      B.box(l.alongX ? hyp : 1.0, 0.05, l.alongX ? 1.0 : hyp, m.x, m.y + 0.0, m.z, '#5c6577', 0, rx, rz);
      for (const s of [-1, 1]) {
        const off = l.alongX ? new THREE.Vector3(0, 0, s * 0.68) : new THREE.Vector3(s * 0.68, 0, 0);
        const q = m.clone().add(off);
        this.glass.box(l.alongX ? hyp : 0.06, 0.8, l.alongX ? 0.06 : hyp, q.x, q.y + 0.42, q.z, '#cfeaff', 0, rx, rz);
        B.box(l.alongX ? hyp + 0.3 : 0.12, 0.08, l.alongX ? 0.12 : hyp + 0.3, q.x, q.y + 0.85, q.z, '#2f3644', 0, rx, rz);
        B.box(l.alongX ? hyp : 0.16, 0.1, l.alongX ? 0.16 : hyp, q.x, q.y + 0.04, q.z, '#c8d0dc', 0, rx, rz);
      }
      l.walkY = (t) => THREE.MathUtils.lerp(p0.y, p1.y, t) + 0.03;
      return;
    }
    // cầu thang bậc
    const n = Math.max(3, Math.round(Math.abs(rise) / 0.2));
    const stepLen = len / n;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const c = p0.clone().addScaledVector(dir, stepLen * (i + 0.5));
      const topY = rise > 0 ? p0.y + rise * ((i + 1) / n) : p0.y + rise * (i / n) + rise / n * 0;
      const tY = rise > 0 ? p0.y + (rise * (i + 1)) / n : p0.y + (rise * (i + 1)) / n + (-rise) / n;
      const h = tY - (low - 0.6);
      B.box(l.alongX ? stepLen + 0.01 : width, h, l.alongX ? width : stepLen + 0.01, c.x, low - 0.6 + h / 2, c.z, i % 2 ? side : shade(side, 0.04));
      B.box(l.alongX ? stepLen + 0.01 : width, 0.04, l.alongX ? width : stepLen + 0.01, c.x, tY, c.z, color);
      void t; void topY;
    }
    l.walkY = (t) => THREE.MathUtils.lerp(p0.y, p1.y, t);
  }

  _finish() {
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    this.staticMesh = this.bag.build(mat);
    this.staticMesh.castShadow = true;
    this.staticMesh.receiveShadow = true;
    this.group.add(this.staticMesh);

    const gmat = new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.32, depthWrite: false });
    this.glassMesh = this.glass.build(gmat);
    this.glassMesh.renderOrder = 2;
    this.group.add(this.glassMesh);

    // lá cây (instanced) — đung đưa
    const leaf = mergeGeometries([
      new THREE.IcosahedronGeometry(0.34, 0).translate(0, 0.25, 0),
      new THREE.IcosahedronGeometry(0.26, 0).translate(0.12, 0.58, 0.05),
      new THREE.IcosahedronGeometry(0.2, 0).translate(-0.1, 0.8, -0.05),
    ].map((g) => { g.deleteAttribute('uv'); return g; }));
    this.leafMesh = new THREE.InstancedMesh(leaf, new THREE.MeshLambertMaterial({ flatShading: true }), Math.max(1, this.plants.length));
    const greens = ['#7cc36e', '#5fb36a', '#8fd07a'];
    this.plants.forEach((p, i) => this.leafMesh.setColorAt(i, new THREE.Color(greens[i % 3])));
    this.leafMesh.count = this.plants.length;
    this.leafMesh.castShadow = true;
    this.leafMesh.frustumCulled = false;
    this.group.add(this.leafMesh);

    // màn hình (instanced, không chịu ánh sáng → trông như phát sáng)
    const sg = new THREE.PlaneGeometry(1, 1);
    this.screenMesh = new THREE.InstancedMesh(sg, new THREE.MeshBasicMaterial({ toneMapped: false }), Math.max(1, this.screens.length));
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3();
    this.screens.forEach((sc, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), sc.rotY);
      m.compose(sc.pos, q, s.set(sc.w, sc.h, 1));
      this.screenMesh.setMatrixAt(i, m);
      this.screenMesh.setColorAt(i, new THREE.Color('#3b4a63'));
    });
    this.screenMesh.count = this.screens.length;
    this.screenMesh.frustumCulled = false;
    this.group.add(this.screenMesh);

    // hộp bấm chọn phòng (vô hình)
    this.hitboxes = [];
    for (const R of this.rooms.values()) {
      const h = new THREE.Mesh(new THREE.BoxGeometry(R.hit.w, R.hit.h, R.hit.d), new THREE.MeshBasicMaterial());
      h.position.set(R.hit.cx, R.hit.cy, R.hit.cz);
      h.visible = false;
      h.userData.roomId = R.id;
      this.hitboxes.push(h);
      this.group.add(h);
    }

    // khung sáng khi chọn phòng
    this.selMesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9 }));
    this.selMesh.visible = false;
    this.group.add(this.selMesh);
  }

  select(roomId, color) {
    const R = this.rooms.get(roomId);
    if (!R) { this.selMesh.visible = false; return; }
    const t = 0.12, { w, d } = R;
    const parts = [
      new THREE.BoxGeometry(w + 0.3, 0.06, t).translate(0, 0, d / 2 + 0.15),
      new THREE.BoxGeometry(w + 0.3, 0.06, t).translate(0, 0, -d / 2 - 0.15),
      new THREE.BoxGeometry(t, 0.06, d + 0.3).translate(w / 2 + 0.15, 0, 0),
      new THREE.BoxGeometry(t, 0.06, d + 0.3).translate(-w / 2 - 0.15, 0, 0),
    ];
    this.selMesh.geometry.dispose();
    this.selMesh.geometry = mergeGeometries(parts);
    this.selMesh.position.set(R.x, R.y + 0.03, R.z);
    this.selMesh.material.color.set(color || '#ffffff');
    this.selMesh.visible = true;
  }

  // ---------- tìm đường giữa các phòng (BFS) ----------
  route(fromId, toId) {
    if (fromId === toId) return [];
    const prev = new Map([[fromId, null]]);
    const q = [fromId];
    while (q.length) {
      const cur = q.shift();
      if (cur === toId) break;
      for (const e of this.adj.get(cur) || []) if (!prev.has(e.to)) { prev.set(e.to, { from: cur, e }); q.push(e.to); }
    }
    if (!prev.has(toId)) return null;
    const hops = [];
    for (let c = toId; prev.get(c); c = prev.get(c).from) hops.unshift(prev.get(c).e);
    const pts = [];
    let cur = fromId;
    for (const e of hops) {
      const l = e.link;
      const [inS, dS, dE, inE] = e.fwd ? [l.inA, l.doorA, l.doorB, l.inB] : [l.inB, l.doorB, l.doorA, l.inA];
      pts.push(this.rooms.get(cur).hub.clone(), inS.clone(), dS.clone());
      // các điểm trung gian trên cầu thang để độ cao đi đúng
      const N = 6;
      for (let i = 1; i < N; i++) {
        const t = i / N;
        const p = dS.clone().lerp(dE, t);
        p.y = l.walkY ? (e.fwd ? l.walkY(t) : l.walkY(1 - t)) : p.y;
        pts.push(p);
      }
      pts.push(dE.clone(), inE.clone());
      cur = e.to;
    }
    pts.push(this.rooms.get(toId).hub.clone());
    return pts;
  }
}
