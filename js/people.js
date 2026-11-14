// Nhân viên + mèo, vẽ bằng InstancedMesh: mỗi bộ phận cơ thể là 1 draw call cho TẤT CẢ nhân vật.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const SKIN = ['#f6d3b8', '#eec19d', '#d9a67f', '#f3c9a6', '#c98f6a'];
const HAIR = ['#2b2222', '#5a3b2a', '#1f1f2b', '#8a5a3c', '#d9a35b', '#3a2e4a'];
const PANTS = ['#3d4a66', '#4a4a52', '#5c4b3f', '#2f3b4f'];

const _base = new THREE.Matrix4(), _m = new THREE.Matrix4(), _r = new THREE.Matrix4();
const _v = new THREE.Vector3(), _s = new THREE.Vector3();

function clean(g) { if (g.attributes.uv) g.deleteAttribute('uv'); return g; }
const merge = (list) => mergeGeometries(list.map((g) => clean(g.index ? g.toNonIndexed() : g)));

export class People {
  constructor(world, opts = {}) {
    this.world = world;
    this.group = new THREE.Group();
    this.persons = [];
    this.reduced = !!opts.reduced;
    this.queue = [];
    const shirtOf = (room) => new THREE.Color(room.cfg.accent || '#888').offsetHSL(0, -0.05, 0.12);

    for (const R of world.rooms.values()) {
      R.seats.forEach((seat, i) => {
        const p = {
          id: this.persons.length, roomId: R.id, seat,
          pos: seat.pos.clone(), rotY: seat.rotY,
          mode: 'seated', path: null, seg: 0, onArrive: null, wait: 0,
          carrying: false, phase: Math.random() * 10, walkPhase: 0,
          speed: 1.5 + Math.random() * 0.3,
          skin: SKIN[(this.persons.length * 3) % SKIN.length],
          hair: HAIR[(this.persons.length * 5 + i) % HAIR.length],
          shirt: shirtOf(R).offsetHSL(0, 0, (i % 2) * 0.08 - 0.04),
          pants: PANTS[this.persons.length % PANTS.length],
          nextIdle: 8 + Math.random() * 25,
          busy: false,
        };
        this.persons.push(p);
      });
    }
    this._buildMeshes();
    // mèo, chó: xem js/pets.js
  }

  _buildMeshes() {
    const N = Math.max(1, this.persons.length);
    const mat = new THREE.MeshLambertMaterial();
    const mk = (geo) => {
      const m = new THREE.InstancedMesh(clean(geo), mat, N);
      m.castShadow = true; m.frustumCulled = false; this.group.add(m); return m;
    };
    this.legL = mk(new THREE.BoxGeometry(0.15, 0.42, 0.17).translate(0, -0.21, 0));
    this.legR = mk(new THREE.BoxGeometry(0.15, 0.42, 0.17).translate(0, -0.21, 0));
    this.body = mk(new THREE.CylinderGeometry(0.19, 0.25, 0.52, 8).translate(0, 0.26, 0));
    this.head = mk(new THREE.IcosahedronGeometry(0.26, 1));
    const hair = mergeGeometries([
      clean(new THREE.SphereGeometry(0.275, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.5)),
      clean(new THREE.SphereGeometry(0.27, 10, 6, Math.PI * 0.6, Math.PI * 0.8, Math.PI * 0.4, Math.PI * 0.35)),
    ]);
    this.hair = mk(hair.translate(0, 0.03, -0.02));
    const eyes = mergeGeometries([
      new THREE.BoxGeometry(0.05, 0.07, 0.02).translate(-0.09, 0.0, 0.245),
      new THREE.BoxGeometry(0.05, 0.07, 0.02).translate(0.09, 0.0, 0.245),
      new THREE.BoxGeometry(0.06, 0.03, 0.02).translate(-0.15, -0.07, 0.23),
      new THREE.BoxGeometry(0.06, 0.03, 0.02).translate(0.15, -0.07, 0.23),
    ].map(clean));
    this.eyes = mk(eyes);
    this.eyes.castShadow = false;
    this.armL = mk(new THREE.BoxGeometry(0.11, 0.4, 0.12).translate(0, -0.2, 0));
    this.armR = mk(new THREE.BoxGeometry(0.11, 0.4, 0.12).translate(0, -0.2, 0));
    this.doc = mk(new THREE.BoxGeometry(0.34, 0.03, 0.44));

    const c = new THREE.Color();
    this.persons.forEach((p, i) => {
      this.legL.setColorAt(i, c.set(p.pants)); this.legR.setColorAt(i, c.set(p.pants));
      this.body.setColorAt(i, p.shirt);
      this.head.setColorAt(i, c.set(p.skin));
      this.hair.setColorAt(i, c.set(p.hair));
      this.eyes.setColorAt(i, c.set('#2a2230'));
      this.armL.setColorAt(i, p.shirt); this.armR.setColorAt(i, p.shirt);
      this.doc.setColorAt(i, c.set('#fffdf6'));
    });
    this.meshes = [this.legL, this.legR, this.body, this.head, this.hair, this.eyes, this.armL, this.armR, this.doc];
    // eyes có cùng material nhưng màu tối → để tách ánh sáng, giữ chung material vẫn ổn
    this.meshes.forEach((m) => { m.count = this.persons.length; });
  }

  _buildCats() {
    const cats = this.world.cats;
    const N = Math.max(1, cats.length);
    const mat = new THREE.MeshLambertMaterial({ flatShading: true });
    const body = clean(new THREE.IcosahedronGeometry(0.2, 1));
    const ear = (x) => clean(new THREE.ConeGeometry(0.06, 0.11, 4).translate(x, 0.14, 0));
    const head = merge([clean(new THREE.IcosahedronGeometry(0.14, 1)), ear(-0.075), ear(0.075)]);
    const tail = clean(new THREE.CylinderGeometry(0.035, 0.045, 0.36, 5).translate(0, 0.18, 0));
    const face = mergeGeometries([
      new THREE.BoxGeometry(0.03, 0.035, 0.01).translate(-0.05, 0.02, 0.135),
      new THREE.BoxGeometry(0.03, 0.035, 0.01).translate(0.05, 0.02, 0.135),
      new THREE.BoxGeometry(0.03, 0.02, 0.01).translate(0, -0.03, 0.14),
    ].map(clean));
    this.catBody = new THREE.InstancedMesh(body, mat, N);
    this.catHead = new THREE.InstancedMesh(head, mat, N);
    this.catTail = new THREE.InstancedMesh(tail, mat, N);
    this.catFace = new THREE.InstancedMesh(face, mat, N);
    const c = new THREE.Color();
    cats.forEach((k, i) => {
      c.set(k.color);
      this.catBody.setColorAt(i, c); this.catHead.setColorAt(i, c);
      this.catTail.setColorAt(i, c.clone().offsetHSL(0, 0, -0.08));
      this.catFace.setColorAt(i, new THREE.Color('#2a2230'));
      k.phase = Math.random() * 10;
    });
    for (const m of [this.catBody, this.catHead, this.catTail, this.catFace]) {
      m.count = cats.length; m.castShadow = true; m.frustumCulled = false; this.group.add(m);
    }
  }

  // ---------- điều khiển ----------
  inRoom(roomId) { return this.persons.filter((p) => p.roomId === roomId); }
  free(roomId) { return this.inRoom(roomId).filter((p) => !p.busy && p.mode === 'seated'); }

  _walk(p, pts, onArrive) {
    p.path = pts; p.seg = 0; p.mode = 'walking'; p.onArrive = onArrive;
  }

  _standPoint(p) {
    // đứng dậy: lùi ra sau ghế một chút
    const back = new THREE.Vector3(-Math.sin(p.seat.rotY), 0, -Math.cos(p.seat.rotY)).multiplyScalar(0.55);
    return p.seat.pos.clone().add(back);
  }

  _goHome(p, from) {
    const R = this.world.rooms.get(p.roomId);
    const pts = this.world.route(from, p.roomId) || [];
    pts.push(R.hub.clone(), this._standPoint(p), p.seat.pos.clone());
    this._walk(p, pts, () => {
      p.mode = 'seated'; p.rotY = p.seat.rotY; p.pos.copy(p.seat.pos); p.busy = false; p.carrying = false;
    });
  }

  // Giao tài liệu từ phòng `from` sang phòng `to`. onArrive gọi khi tài liệu tới nơi.
  deliver(from, to, onArrive) {
    const cand = this.free(from);
    const p = cand[Math.floor(Math.random() * cand.length)];
    if (!p) { this.queue.push({ from, to, onArrive, t: 0 }); return; }
    const route = this.world.route(from, to);
    if (!route) { onArrive?.(); return; }
    const T = this.world.rooms.get(to);
    const target = T.seats.length ? T.seats[Math.floor(Math.random() * T.seats.length)].side.clone() : T.hub.clone();
    p.busy = true; p.carrying = true;
    const pts = [this._standPoint(p), ...route, target];
    this._walk(p, pts, () => {
      p.carrying = false; p.mode = 'standing'; p.wait = this.reduced ? 0.3 : 1.6;
      // quay mặt vào chỗ ngồi gần nhất
      const seat = T.seats[0];
      if (seat) p.rotY = Math.atan2(seat.pos.x - p.pos.x, seat.pos.z - p.pos.z);
      onArrive?.();
      p.after = () => this._goHome(p, to);
    });
  }

  // nhân viên rảnh đi ghé phòng khác cho vui
  _visit(p) {
    const others = [...this.world.rooms.keys()].filter((id) => id !== p.roomId && this.world.route(p.roomId, id));
    // ưu tiên phòng kề
    const near = (this.world.adj.get(p.roomId) || []).map((e) => e.to);
    const pool = near.length && Math.random() < 0.7 ? near : others;
    const to = pool[Math.floor(Math.random() * pool.length)];
    if (!to) return;
    const T = this.world.rooms.get(to);
    const spot = T.spots[Math.floor(Math.random() * T.spots.length)].clone();
    p.busy = true;
    this._walk(p, [this._standPoint(p), ...this.world.route(p.roomId, to), spot], () => {
      p.mode = 'standing'; p.wait = 4 + Math.random() * 5;
      p.rotY = Math.atan2(T.hub.x - p.pos.x, T.hub.z - p.pos.z) + (Math.random() - 0.5);
      p.after = () => this._goHome(p, to);
    });
  }

  // ---------- cập nhật mỗi khung hình ----------
  update(dt, t, roomStatus) {
    const reduced = this.reduced;
    // hàng đợi giao việc
    if (this.queue.length) {
      const q = this.queue.shift();
      if (this.free(q.from).length) this.deliver(q.from, q.to, q.onArrive);
      else { q.t += dt; if (q.t > 20) { q.onArrive?.(); } else this.queue.push(q); }
    }
    for (const p of this.persons) {
      if (p.mode === 'walking') {
        let dist = p.speed * dt * (reduced ? 1.6 : 1);
        while (dist > 0 && p.path && p.seg < p.path.length) {
          const tgt = p.path[p.seg];
          _v.subVectors(tgt, p.pos);
          const flat = Math.hypot(_v.x, _v.z);
          const len = _v.length();
          if (len <= dist) { p.pos.copy(tgt); dist -= len; p.seg++; continue; }
          p.pos.addScaledVector(_v, dist / len);
          if (flat > 0.01) {
            const want = Math.atan2(_v.x, _v.z);
            let da = want - p.rotY; da = Math.atan2(Math.sin(da), Math.cos(da));
            p.rotY += da * Math.min(1, dt * 12);
          }
          dist = 0;
        }
        p.walkPhase += dt * 9;
        if (p.seg >= p.path.length) { p.mode = 'standing'; p.path = null; const f = p.onArrive; p.onArrive = null; f?.(); }
      } else if (p.mode === 'standing') {
        p.wait -= dt;
        if (p.wait <= 0 && p.after) { const f = p.after; p.after = null; f(); }
      } else if (p.mode === 'seated' && !p.busy && !reduced) {
        p.nextIdle -= dt;
        if (p.nextIdle <= 0) {
          p.nextIdle = 25 + Math.random() * 45;
          const st = roomStatus(p.roomId);
          const busyWalkers = this.persons.filter((x) => x.mode === 'walking').length;
          if (st !== 'working' && busyWalkers < 3 && Math.random() < 0.55) this._visit(p);
        }
      }
      this._pose(p, t, roomStatus(p.roomId));
    }
    for (const m of this.meshes) m.instanceMatrix.needsUpdate = true;
  }

  _pose(p, t, status) {
    const i = p.id;
    const seated = p.mode === 'seated';
    const walking = p.mode === 'walking';
    const reduced = this.reduced;
    let hipY, legA = 0, legB = 0, armA = 0, armB = 0, bob = 0, headTilt = 0;
    if (seated) {
      hipY = 0.47;
      legA = legB = -Math.PI / 2;
      const working = status === 'working';
      const rate = working ? 18 : 6;
      const amp = reduced ? 0 : (working ? 0.14 : (Math.sin(t * 0.7 + p.phase) > 0.3 ? 0.08 : 0));
      armA = -1.15 + Math.sin(t * rate + p.phase) * amp;
      armB = -1.15 + Math.sin(t * rate + p.phase + 1.7) * amp;
      bob = reduced ? 0 : Math.sin(t * 2 + p.phase) * 0.008;
      headTilt = reduced ? 0 : (working ? -0.12 : Math.sin(t * 0.5 + p.phase) * 0.1);
    } else {
      hipY = 0.42;
      if (walking && !reduced) {
        const s = Math.sin(p.walkPhase);
        legA = s * 0.6; legB = -s * 0.6;
        armA = -s * 0.5; armB = s * 0.5;
        bob = Math.abs(Math.cos(p.walkPhase)) * 0.04;
      }
      if (p.carrying) { armA = armB = -1.1; }
      if (!walking && !reduced) bob = Math.sin(t * 2 + p.phase) * 0.006;
    }
    _base.makeRotationY(p.rotY).setPosition(p.pos.x, p.pos.y + bob, p.pos.z);
    const put = (mesh, x, y, z, pitch, sx = 1, sy = 1, sz = 1) => {
      _m.makeRotationX(pitch);
      if (sx !== 1 || sy !== 1 || sz !== 1) _m.scale(_s.set(sx, sy, sz));
      _m.setPosition(x, y, z);
      _r.multiplyMatrices(_base, _m);
      mesh.setMatrixAt(i, _r);
    };
    put(this.legL, -0.09, hipY, seated ? 0.02 : 0, legA);
    put(this.legR, 0.09, hipY, seated ? 0.02 : 0, legB);
    const breath = reduced ? 1 : 1 + Math.sin(t * 2.2 + p.phase) * 0.02;
    put(this.body, 0, hipY - 0.02, 0, 0, 1, breath, 1);
    const headY = hipY + 0.52 * breath + 0.22;
    put(this.head, 0, headY, 0, headTilt);
    put(this.hair, 0, headY, 0, headTilt);
    put(this.eyes, 0, headY, 0, headTilt);
    put(this.armL, -0.28, hipY + 0.47, 0, armA);
    put(this.armR, 0.28, hipY + 0.47, 0, armB);
    if (p.carrying) put(this.doc, 0, hipY + 0.42, 0.36, -0.15);
    else put(this.doc, 0, -50, 0, 0, 0.001, 0.001, 0.001);
  }

  _cats(t) {
    const reduced = this.reduced;
    this.world.cats.forEach((k, i) => {
      const br = reduced ? 1 : 1 + Math.sin(t * 2.4 + k.phase) * 0.06;
      _base.makeRotationY(k.rotY).setPosition(k.pos.x, k.pos.y, k.pos.z);
      // thân nằm, kéo dài theo z
      _m.makeScale(1.05, 0.72 * br, 1.55).setPosition(0, 0.15, 0);
      this.catBody.setMatrixAt(i, _r.multiplyMatrices(_base, _m));
      const nod = reduced ? 0 : Math.sin(t * 0.6 + k.phase) * 0.15;
      _m.makeRotationY(nod).setPosition(0, 0.25, 0.3);
      this.catHead.setMatrixAt(i, _r.multiplyMatrices(_base, _m));
      this.catFace.setMatrixAt(i, _r);
      const wag = reduced ? 0.3 : Math.sin(t * 2.0 + k.phase) * 0.7;
      _m.makeRotationFromEuler(new THREE.Euler(-1.0, wag, 0, 'YXZ')).setPosition(0, 0.15, -0.28);
      this.catTail.setMatrixAt(i, _r.multiplyMatrices(_base, _m));
    });
    for (const m of [this.catBody, this.catHead, this.catTail, this.catFace]) m.instanceMatrix.needsUpdate = true;
  }

  setReduced(v) { this.reduced = v; }

  // tìm nhân vật được bấm
  pick(raycaster) {
    const hits = [];
    for (const m of [this.body, this.head]) { m.computeBoundingSphere(); raycaster.intersectObject(m, false, hits); }
    hits.sort((a, b) => a.distance - b.distance);
    const h = hits.find((x) => x.instanceId != null);
    return h ? this.persons[h.instanceId] : null;
  }

  headPos(p, out) { return out.set(p.pos.x, p.pos.y + (p.mode === 'seated' ? 1.3 : 1.25), p.pos.z); }
}
