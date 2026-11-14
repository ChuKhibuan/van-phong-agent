// Mèo và chó: nằm nghỉ, đi dạo, phóng chạy nhảy, chó thỉnh thoảng chạy sang phòng bên cạnh chơi.
// Mỗi bộ phận là một InstancedMesh → mèo 5 draw call, chó 5 draw call cho tất cả con.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const clean = (g) => { if (g.attributes.uv) g.deleteAttribute('uv'); return g.index ? g.toNonIndexed() : g; };
const merge = (list) => mergeGeometries(list.map(clean));

const _base = new THREE.Matrix4(), _m = new THREE.Matrix4(), _r = new THREE.Matrix4(), _s = new THREE.Vector3(), _v = new THREE.Vector3();
const _e = new THREE.Euler(), _q = new THREE.Quaternion();
const HIDE = new THREE.Matrix4().makeScale(0, 0, 0);

const SPECIES = {
  cat: {
    size: 1, legLen: 0.2, bodyY: 0.3, bodyScale: [1.0, 0.82, 1.55], headY: 0.47, headZ: 0.31,
    walk: 0.8, run: 2.6, hop: 0.26, rest: [7, 18], tailPitch: -0.35, wagRate: 2.2, wagAmp: 0.5,
    choices: { walk: 0.5, zoom: 0.28, visit: 0 },
  },
  dog: {
    size: 1.3, legLen: 0.24, bodyY: 0.33, bodyScale: [1.0, 0.9, 1.7], headY: 0.5, headZ: 0.33,
    walk: 1.1, run: 3.2, hop: 0.32, rest: [4, 11], tailPitch: -0.75, wagRate: 13, wagAmp: 0.6,
    choices: { walk: 0.4, zoom: 0.35, visit: 0.18 },
  },
};

function geometries(kind) {
  const body = new THREE.IcosahedronGeometry(0.2, 1);
  let head, face;
  if (kind === 'cat') {
    const ear = (x) => new THREE.ConeGeometry(0.06, 0.11, 4).translate(x, 0.14, 0);
    head = merge([new THREE.IcosahedronGeometry(0.14, 1), ear(-0.075), ear(0.075)]);
    face = merge([
      new THREE.BoxGeometry(0.03, 0.035, 0.01).translate(-0.05, 0.02, 0.135),
      new THREE.BoxGeometry(0.03, 0.035, 0.01).translate(0.05, 0.02, 0.135),
      new THREE.BoxGeometry(0.03, 0.02, 0.01).translate(0, -0.03, 0.14),
    ]);
  } else {
    // đầu chó: mõm dài + tai cụp hai bên
    const ear = (x) => new THREE.BoxGeometry(0.04, 0.13, 0.08).translate(x, -0.02, -0.02);
    head = merge([
      new THREE.IcosahedronGeometry(0.13, 1),
      new THREE.BoxGeometry(0.11, 0.09, 0.12).translate(0, -0.03, 0.13),
      ear(-0.13), ear(0.13),
    ]);
    face = merge([
      new THREE.BoxGeometry(0.03, 0.035, 0.01).translate(-0.05, 0.03, 0.12),
      new THREE.BoxGeometry(0.03, 0.035, 0.01).translate(0.05, 0.03, 0.12),
      new THREE.BoxGeometry(0.05, 0.04, 0.02).translate(0, -0.005, 0.195),
      new THREE.BoxGeometry(0.05, 0.015, 0.01).translate(0, -0.075, 0.17),
    ]);
  }
  const tail = new THREE.CylinderGeometry(kind === 'cat' ? 0.03 : 0.035, kind === 'cat' ? 0.042 : 0.05, kind === 'cat' ? 0.36 : 0.24, 5).translate(0, kind === 'cat' ? 0.18 : 0.12, 0);
  const leg = new THREE.BoxGeometry(0.065, 1, 0.065).translate(0, -0.5, 0); // cao 1, co giãn theo legLen
  return { body: clean(body), head: clean(head), face: clean(face), tail: clean(tail), leg: clean(leg) };
}

export class Pets {
  constructor(world, opts = {}) {
    this.world = world;
    this.reduced = !!opts.reduced;
    this.group = new THREE.Group();
    this.list = [];
    const add = (kind, arr) => (arr || []).forEach((k) => {
      const R = world.rooms.get(k.roomId);
      this.list.push({
        kind, sp: SPECIES[kind], color: k.color, home: k.roomId, roomId: k.roomId,
        pos: k.pos.clone().setY(R.y), rotY: k.rotY,
        mode: 'rest', timer: 2 + Math.random() * 8, lie: 1,
        path: null, seg: 0, speed: 0, running: false, queue: 0,
        phase: Math.random() * 10, gait: 0, hopPhase: 0, visiting: false,
      });
    });
    add('cat', world.cats);
    add('dog', world.dogs);
    this.meshes = {};
    for (const kind of ['cat', 'dog']) {
      const pets = this.list.filter((p) => p.kind === kind);
      if (!pets.length) continue;
      const g = geometries(kind);
      const mat = new THREE.MeshLambertMaterial({ flatShading: true });
      const mk = (geo, n, shadow = true) => {
        const m = new THREE.InstancedMesh(geo, mat, n);
        m.castShadow = shadow; m.frustumCulled = false; this.group.add(m); return m;
      };
      const set = {
        pets,
        body: mk(g.body, pets.length), head: mk(g.head, pets.length), face: mk(g.face, pets.length, false),
        tail: mk(g.tail, pets.length), leg: mk(g.leg, pets.length * 4),
      };
      const c = new THREE.Color(), dark = new THREE.Color('#2a2230');
      pets.forEach((p, i) => {
        c.set(p.color);
        set.body.setColorAt(i, c); set.head.setColorAt(i, c);
        set.tail.setColorAt(i, c.clone().offsetHSL(0, 0, -0.07));
        set.face.setColorAt(i, dark);
        for (let j = 0; j < 4; j++) set.leg.setColorAt(i * 4 + j, c.clone().offsetHSL(0, 0, -0.05));
        p.idx = i;
      });
      this.meshes[kind] = set;
    }
  }

  setReduced(v) { this.reduced = v; }

  // điểm trống ngẫu nhiên trong phòng (tránh đồ đạc)
  _spot(roomId) {
    const R = this.world.rooms.get(roomId);
    for (let k = 0; k < 16; k++) {
      const lx = (Math.random() - 0.5) * (R.w - 1.4), lz = (Math.random() - 0.5) * (R.d - 1.4);
      const hit = R.blocks.some(([x0, x1, z0, z1]) => lx > x0 - 0.25 && lx < x1 + 0.25 && lz > z0 - 0.25 && lz < z1 + 0.25);
      if (!hit) return new THREE.Vector3(R.x + lx, R.y, R.z + lz);
    }
    return R.hub.clone();
  }

  _go(p, pts, speed, running) {
    p.path = pts; p.seg = 0; p.mode = 'move'; p.speed = speed; p.running = running;
  }

  _decide(p) {
    const ch = p.sp.choices, r = Math.random();
    const neighbors = (this.world.adj.get(p.roomId) || []).map((e) => e.to);
    if (p.visiting && p.roomId !== p.home) {
      // đã chơi xong ở phòng bên → chạy về nhà
      const route = this.world.route(p.roomId, p.home) || [];
      p.visiting = false;
      this._go(p, [...route, this._spot(p.home)], p.sp.run * 0.8, true);
      p.dest = p.home;
      return;
    }
    if (r < ch.visit && neighbors.length) {
      const to = neighbors[Math.floor(Math.random() * neighbors.length)];
      const route = this.world.route(p.roomId, to);
      if (route) {
        p.visiting = true; p.dest = to;
        this._go(p, [...route, this._spot(to)], p.sp.run * 0.8, true);
        return;
      }
    }
    if (r < ch.visit + ch.zoom) {
      // phóng chạy nhảy 2–4 vòng trong phòng
      p.queue = 1 + Math.floor(Math.random() * 3);
      this._go(p, [this._spot(p.roomId)], p.sp.run, true);
      return;
    }
    if (r < ch.visit + ch.zoom + ch.walk) {
      this._go(p, [this._spot(p.roomId)], p.sp.walk, false);
      return;
    }
    p.mode = 'rest'; p.timer = 3 + Math.random() * 6;
  }

  update(dt, t) {
    for (const p of this.list) {
      if (this.reduced && p.mode !== 'rest') { p.mode = 'rest'; p.path = null; p.timer = 9999; }
      if (p.mode === 'rest') {
        p.lie = Math.min(1, p.lie + dt * 2.5);
        p.timer -= dt;
        if (p.timer <= 0 && !this.reduced) this._decide(p);
      } else if (p.mode === 'move') {
        p.lie = Math.max(0, p.lie - dt * 4);
        if (p.lie > 0.4) { this._pose(p, t); continue; } // đứng dậy trước đã
        let dist = p.speed * dt;
        while (dist > 0 && p.path && p.seg < p.path.length) {
          const tgt = p.path[p.seg];
          _v.subVectors(tgt, p.pos);
          const len = _v.length();
          if (len <= dist) { p.pos.copy(tgt); dist -= len; p.seg++; continue; }
          p.pos.addScaledVector(_v, dist / len);
          if (Math.hypot(_v.x, _v.z) > 0.01) {
            let da = Math.atan2(_v.x, _v.z) - p.rotY; da = Math.atan2(Math.sin(da), Math.cos(da));
            p.rotY += da * Math.min(1, dt * (p.running ? 14 : 8));
          }
          dist = 0;
        }
        p.gait += dt * p.speed * 11 / p.sp.size;
        p.hopPhase += dt * p.speed * 3.2;
        if (!p.path || p.seg >= p.path.length) {
          if (p.dest) { p.roomId = p.dest; p.dest = null; }
          if (p.queue > 0) { p.queue--; this._go(p, [this._spot(p.roomId)], p.sp.run, true); }
          else if (p.visiting) { p.mode = 'rest'; p.timer = 3 + Math.random() * 4; p.lie = 0.6; }
          else {
            p.mode = 'rest';
            const [a, b] = p.sp.rest; p.timer = a + Math.random() * (b - a);
          }
        }
      }
      this._pose(p, t);
    }
    for (const set of Object.values(this.meshes)) for (const k of ['body', 'head', 'face', 'tail', 'leg']) set[k].instanceMatrix.needsUpdate = true;
  }

  _pose(p, t) {
    const set = this.meshes[p.kind], sp = p.sp, i = p.idx, s = sp.size;
    const moving = p.mode === 'move' && p.lie < 0.4;
    const lie = p.lie;
    const breath = this.reduced ? 1 : 1 + Math.sin(t * 2.4 + p.phase) * 0.05;
    // nhảy: vòng cung khi phóng chạy, nhún nhẹ khi đi
    let hop = 0, pitch = 0;
    if (moving && !this.reduced) {
      const h = Math.abs(Math.sin(p.hopPhase));
      hop = p.running ? h * sp.hop : h * 0.025;
      if (p.running) pitch = Math.cos(p.hopPhase) * 0.18 * Math.sign(Math.sin(p.hopPhase));
    }
    _q.setFromEuler(_e.set(0, p.rotY, 0));
    _base.compose(_v.set(p.pos.x, p.pos.y + hop, p.pos.z), _q, _s.set(s, s, s));
    const put = (mesh, idx, x, y, z, rx, ry, rz, sx = 1, sy = 1, sz = 1) => {
      _q.setFromEuler(_e.set(rx, ry, rz, 'YXZ'));
      _m.compose(_v.set(x, y, z), _q, _s.set(sx, sy, sz));
      mesh.setMatrixAt(idx, _r.multiplyMatrices(_base, _m));
    };
    const bodyY = THREE.MathUtils.lerp(sp.bodyY, 0.15, lie);
    const [bx, by, bz] = sp.bodyScale;
    put(set.body, i, 0, bodyY, 0, pitch, 0, 0, bx, by * THREE.MathUtils.lerp(1, 0.78, lie) * breath, bz);
    // đầu: khi nằm thì gật gù nhìn quanh
    const look = this.reduced ? 0 : (lie > 0.5 ? Math.sin(t * 0.6 + p.phase) * 0.35 : 0);
    const headY = THREE.MathUtils.lerp(sp.headY, 0.26, lie) + (moving ? Math.sin(p.gait) * 0.01 : 0);
    put(set.head, i, 0, headY, sp.headZ, pitch * 0.5, look, 0);
    put(set.face, i, 0, headY, sp.headZ, pitch * 0.5, look, 0);
    // đuôi
    const wagRate = moving && p.running ? sp.wagRate * 1.3 : sp.wagRate;
    const wag = this.reduced ? 0.2 : Math.sin(t * wagRate + p.phase) * sp.wagAmp;
    const tailPitch = lie > 0.5 ? -1.35 : sp.tailPitch - (p.running ? 0.3 : 0);
    put(set.tail, i, 0, bodyY + 0.04, -0.28, tailPitch, wag, 0);
    // chân: chéo cặp, nằm thì gập vào
    const legTop = bodyY - 0.04;
    const len = sp.legLen;
    const amp = moving ? (p.running ? 0.95 : 0.55) : 0;
    const legs = [[-0.09, 0.17, 0], [0.09, 0.17, Math.PI], [-0.09, -0.17, Math.PI], [0.09, -0.17, 0]];
    legs.forEach(([lx, lz, off], j) => {
      if (lie > 0.7) { set.leg.setMatrixAt(i * 4 + j, HIDE); return; }
      const sw = this.reduced ? 0 : Math.sin(p.gait + off) * amp;
      put(set.leg, i * 4 + j, lx, legTop, lz, sw, 0, 0, 1, len * (1 - lie * 0.6), 1);
    });
  }
}
