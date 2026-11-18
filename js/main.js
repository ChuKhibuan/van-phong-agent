import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { OFFICE } from '../config.js';
import { World } from './world.js';
import { People } from './people.js';
import { Pets } from './pets.js';
import { UI, ls, STATUS_LABEL } from './ui.js';
import { createSource } from './data.js';
import { TV } from './tv.js';
import { Road } from './road.js';

// ---------------- cài đặt người dùng ----------------
const prefs = {
  theme: ls.get('vpa.theme', 'auto'),           // auto | light | dark
  reduced: ls.get('vpa.reduced', matchMedia('(prefers-reduced-motion: reduce)').matches),
  quality: ls.get('vpa.quality', (matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 500) ? 'low' : 'high'),
};
const dataSettings = { ...OFFICE.data, ...(ls.get('vpa.data', null) || {}) };

// ---------------- renderer / cảnh / camera ----------------
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: prefs.quality === 'high', alpha: true, powerPreference: 'high-performance' });
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();

const world = new World(OFFICE);
scene.add(world.group);
const people = new People(world, { reduced: prefs.reduced });
scene.add(people.group);
const pets = new Pets(world, { reduced: prefs.reduced });
scene.add(pets.group);
// đường công việc 3D cạnh phòng Lưu trữ (trang trí: việc đang làm / đã làm)
const road = new Road(world, OFFICE, { overlay: document.getElementById('overlay'), onSelect: (id) => select(id) });
scene.add(road.root);

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
const controls = new OrbitControls(camera, canvas);
controls.target.copy(world.center);
const AZ = Math.PI / 4, POLAR = 0.98;
camera.position.copy(world.center).add(new THREE.Vector3().setFromSphericalCoords(90, POLAR, AZ));
controls.minAzimuthAngle = AZ - 0.65; controls.maxAzimuthAngle = AZ + 0.65;
controls.minPolarAngle = 0.72; controls.maxPolarAngle = 1.18;
controls.minZoom = 0.5; controls.maxZoom = 4;
controls.enableDamping = !prefs.reduced; controls.dampingFactor = 0.08;
controls.screenSpacePanning = true;
controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
const B = world.bounds;
controls.addEventListener('change', () => {
  // không cho kéo lệch khỏi toà nhà
  const t = controls.target, c0 = t.clone();
  t.x = THREE.MathUtils.clamp(t.x, B.x0, B.x1); t.z = THREE.MathUtils.clamp(t.z, B.z0, B.z1); t.y = THREE.MathUtils.clamp(t.y, -6, 14);
  if (!c0.equals(t)) camera.position.add(t.clone().sub(c0));
});

// ánh sáng
const hemi = new THREE.HemisphereLight('#ffffff', '#b8c4d6', 1.6);
scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff4e6', 2.2);
sun.position.copy(world.center).add(new THREE.Vector3(14, 30, 8));
sun.target.position.copy(world.center);
scene.add(sun, sun.target);
sun.shadow.mapSize.set(2048, 2048);
{
  const span = Math.max(B.x1 - B.x0, B.z1 - B.z0) * 0.8;
  Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 1, far: 90 });
  sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.03; sun.shadow.radius = 4;
}

// "bộ não" phát sáng ở phòng trung tâm
const cores = (world.cores || []).map((c) => {
  const g = new THREE.Group();
  g.position.copy(c.pos);
  const lobe = (x) => new THREE.IcosahedronGeometry(0.42, 1).scale(1, 0.85, 1.25).translate(x, 0, 0);
  const brainMat = new THREE.MeshLambertMaterial({ color: '#f7a8c4', emissive: '#e0628f', emissiveIntensity: 0.35, flatShading: true });
  const brain = new THREE.Mesh(mergeGeometries([lobe(-0.22), lobe(0.22)]), brainMat);
  brain.castShadow = true;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.03, 6, 40), new THREE.MeshBasicMaterial({ color: '#ffd6e5', transparent: true, opacity: 0.8 }));
  ring.rotation.x = Math.PI / 2;
  const bits = new THREE.Mesh(mergeGeometries(Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2;
    return new THREE.BoxGeometry(0.14, 0.14, 0.14).translate(Math.cos(a) * 0.95, 0, Math.sin(a) * 0.95);
  })), new THREE.MeshBasicMaterial({ color: '#ffe9a8' }));
  g.add(brain, ring, bits);
  scene.add(g);
  return { ...c, g, brain, ring, bits, mat: brainMat };
});

// ---------------- theme ----------------
const THEMES = {
  light: { hemiSky: '#ffffff', hemiGround: '#b8c4d6', hemi: 1.55, sun: '#fff4e6', sunI: 2.3, screenK: 1 },
  dark: { hemiSky: '#8d9be0', hemiGround: '#252c4d', hemi: 1.0, sun: '#b4c2ff', sunI: 0.9, screenK: 1.3 },
};
let themeNow = 'light';
const mq = matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  themeNow = prefs.theme === 'auto' ? (mq.matches ? 'dark' : 'light') : prefs.theme;
  document.documentElement.dataset.theme = themeNow;
  const T = THEMES[themeNow];
  hemi.color.set(T.hemiSky); hemi.groundColor.set(T.hemiGround); hemi.intensity = T.hemi;
  sun.color.set(T.sun); sun.intensity = T.sunI;
  for (const c of cores) c.mat.emissiveIntensity = themeNow === 'dark' ? 0.8 : 0.35;
  road.setTheme(themeNow === 'dark');
  // cột đèn: tối thì sáng rõ, sáng thì dịu
  if (world.haloMesh) {
    world.haloMesh.material.opacity = themeNow === 'dark' ? 0.42 : 0.16;
    world.poolMesh.material.opacity = themeNow === 'dark' ? 0.24 : 0.08;
  }
  document.getElementById('btn-theme').dataset.v = prefs.theme;
  document.getElementById('btn-theme').title = { auto: 'Giao diện: tự động', light: 'Giao diện: sáng', dark: 'Giao diện: tối' }[prefs.theme];
}
mq.addEventListener?.('change', applyTheme);

function applyQuality() {
  const low = prefs.quality === 'low';
  renderer.setPixelRatio(Math.min(devicePixelRatio, low ? 1.25 : 2));
  renderer.shadowMap.enabled = !low;
  sun.castShadow = !low;
  scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; });
  document.getElementById('btn-quality').dataset.v = prefs.quality;
  document.getElementById('btn-quality').title = low ? 'Chất lượng: tiết kiệm pin' : 'Chất lượng: cao (bóng đổ mềm)';
  resize();
}

function applyReduced() {
  people.setReduced(prefs.reduced);
  pets.setReduced(prefs.reduced);
  controls.enableDamping = !prefs.reduced;
  document.documentElement.dataset.reduced = prefs.reduced ? '1' : '0';
  const b = document.getElementById('btn-motion');
  b.setAttribute('aria-pressed', String(prefs.reduced));
  b.title = prefs.reduced ? 'Đang giảm chuyển động (bấm để bật lại)' : 'Giảm chuyển động';
}

// ---------------- kích thước & khung nhìn ----------------
const FRUSTUM = 30;
let fitted = false;
function resize() {
  const w = innerWidth, h = innerHeight;
  if (!w || !h) return; // tab nền chưa có kích thước: đợi sự kiện resize
  const a = w / h;
  renderer.setSize(w, h, false);
  camera.left = -FRUSTUM * a / 2; camera.right = FRUSTUM * a / 2; camera.top = FRUSTUM / 2; camera.bottom = -FRUSTUM / 2;
  if (!fitted) {
    // vừa khung toà nhà
    camera.lookAt(controls.target); camera.updateMatrixWorld();
    const pts = [];
    for (const R of world.rooms.values()) for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const yy of [-0.8, 2.6]) pts.push(new THREE.Vector3(R.x + sx * R.w / 2, R.y + yy, R.z + sz * R.d / 2));
    if (a >= 1.05) pts.push(...road.fitPoints()); // màn hình ngang: ôm cả đường công việc
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const p of pts) { p.applyMatrix4(camera.matrixWorldInverse); x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
    const topPad = 120 / h * FRUSTUM, botPad = 70 / h * FRUSTUM; // chừa chỗ thanh trên + nhãn phòng, nhật ký dưới
    camera.zoom = Math.min((camera.right - camera.left) / (x1 - x0), (FRUSTUM - topPad - botPad) / (y1 - y0)) * 0.97;
    // căn giữa toà nhà, chừa phần trên cho thanh công cụ
    const off = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).multiplyScalar((x0 + x1) / 2)
      .add(new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion).multiplyScalar((y0 + y1) / 2 + (topPad - botPad) / 2 / camera.zoom));
    camera.position.add(off); controls.target.add(off);
    if (!Number.isFinite(camera.zoom) || camera.zoom <= 0) camera.zoom = 0.7;
    controls.minZoom = Math.min(0.5, camera.zoom * 0.8);
    fitted = true;
  }
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);

// ---------------- trạng thái các agent (đạo diễn hoạt ảnh) ----------------
const byId = Object.fromEntries(OFFICE.rooms.map((r) => [r.id, r]));
const state = Object.fromEntries(OFFICE.rooms.map((r) => [r.id, {
  status: 'idle', task: '', progress: 0, history: [], real: null, hold: 0, shownAt: 0,
}]));
const seen = new Set();
const allRows = [];   // mọi dòng Board đã thấy (cho màn hình TV so sánh các phòng)
let firstBatch = true;

function show(id, row) {
  const st = state[id];
  st.status = row.status; st.task = row.task; st.progress = row.progress; st.shownAt = Date.now();
  ui.setRoomState(id, st);
}

function nameOf(id) { return byId[id]?.name || id; }

function startDelivery(from, to, task) {
  const T = state[to];
  T.hold++;
  ui.say(to, `Đang chờ tài liệu từ ${nameOf(from)}…`, 6);
  people.deliver(from, to, () => {
    T.hold = Math.max(0, T.hold - 1);
    if (T.hold > 0) return;
    // tài liệu tới nơi → phòng nhận mới bắt đầu làm
    const r = T.real;
    if (r && r.status !== 'idle' && +r.timestamp >= T.handoffAt) show(to, r);
    else show(to, { status: 'working', task, progress: Math.max(0, r?.progress && r.status === 'working' ? r.progress : 0) });
    ui.say(to, `📄 Đã nhận: ${task}`, 5);
    ui.event(`<b>${nameOf(to)}</b> nhận tài liệu, bắt đầu làm`, byId[to].accent);
  });
  T.handoffAt = Date.now() - 2000;
}

function applyRows(rows) {
  const ord = (r) => (r.seq ?? +r.timestamp);
  rows = rows.filter((r) => state[r.agent]).sort((a, b) => ord(a) - ord(b));
  for (const r of rows) {
    const key = `${+r.timestamp}|${r.agent}|${r.status}|${r.progress}|${r.task}`;
    if (seen.has(key)) continue;
    seen.add(key);
    allRows.push(r);
    const st = state[r.agent];
    st.history.push(r);
    if (st.history.length > 60) st.history.shift();
    if (st.real && ord(r) < ord(st.real)) continue;
    const prev = st.real;
    st.real = r;
    if (firstBatch) { show(r.agent, r); continue; }
    if (st.hold === 0) show(r.agent, r);
    const color = byId[r.agent].accent;
    const changed = !prev || prev.status !== r.status || prev.task !== r.task;
    if (changed) {
      if (r.status === 'working') { ui.say(r.agent, '⚙ ' + r.task, 5); ui.event(`<b>${nameOf(r.agent)}</b> bắt đầu: ${escapeHtml(r.task)}`, color); }
      if (r.status === 'done') { ui.say(r.agent, '✔ Xong: ' + r.task, 5); ui.event(`<b>${nameOf(r.agent)}</b> xong: ${escapeHtml(r.task)}`, color); }
      if (r.status === 'waiting') { ui.say(r.agent, '⏳ Chờ bạn duyệt: ' + r.task, 8); ui.event(`<b>${nameOf(r.agent)}</b> chờ duyệt: ${escapeHtml(r.task)}`, color); ui.toast(`${nameOf(r.agent)} đang chờ bạn duyệt`); }
    }
    if ((r.status === 'done' || r.status === 'waiting') && r.handoff?.length) {
      for (const to of r.handoff) {
        if (!state[to] || to === r.agent) continue;
        ui.event(`<b>${nameOf(r.agent)}</b> → <b>${nameOf(to)}</b>: ${escapeHtml(r.task)}`, color);
        startDelivery(r.agent, to, r.task);
      }
    }
  }
  firstBatch = false;
  tv?.refresh();
  road.refresh(allRows);
}
const escapeHtml = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------------- giao diện ----------------
const ui = new UI(OFFICE, {
  getState: (id) => state[id],
  settings: () => dataSettings,
  onSelect: (id) => select(id),
  onClose: () => { world.select(null); },
  onSend: async (cmd) => {
    if (cmd.type === 'handoff') {
      startDelivery(cmd.from, cmd.to, cmd.text);
      ui.event(`Bạn giao <b>${nameOf(cmd.from)}</b> → <b>${nameOf(cmd.to)}</b>`, byId[cmd.from].accent);
    }
    const res = await source.send(cmd);
    if (res.ok && res.local) return;
    if (res.ok) { ui.note(cmd.to, '📮 Đang gửi… cửa sổ nhỏ hiện ✅ là đã vào Inbox. Câu trả lời sẽ hiện ngay trong khung chat này.'); return; }
    if (res.reason === 'no-inbox') {
      const line = `[${cmd.type}] → ${cmd.to}: ${cmd.text}`;
      try { await navigator.clipboard.writeText(line); } catch { /* bỏ qua */ }
      ui.note(cmd.to, '⚠ Chưa cấu hình Inbox (Cài đặt → URL Apps Script). Đã chép lệnh vào clipboard để bạn dán vào tab Inbox.');
    } else ui.note(cmd.to, '⚠ Gửi lỗi: ' + res.reason);
  },
});

function select(id) {
  world.select(id, byId[id]?.accent);
  ui.open(id);
}

// bấm vào phòng / nhân vật
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let down = null;
canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointerup', (e) => {
  if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) { down = null; return; }
  down = null;
  ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const p = people.pick(ray);
  if (p) { select(p.roomId); return; }
  const h = ray.intersectObjects(world.hitboxes, false)[0];
  if (h) select(h.object.userData.roomId);
});

// thanh công cụ
document.getElementById('btn-theme').addEventListener('click', () => {
  prefs.theme = { auto: 'light', light: 'dark', dark: 'auto' }[prefs.theme];
  ls.set('vpa.theme', prefs.theme); applyTheme();
});
document.getElementById('btn-motion').addEventListener('click', () => {
  prefs.reduced = !prefs.reduced; ls.set('vpa.reduced', prefs.reduced); applyReduced();
});
document.getElementById('btn-quality').addEventListener('click', () => {
  prefs.quality = prefs.quality === 'high' ? 'low' : 'high'; ls.set('vpa.quality', prefs.quality); applyQuality();
});
document.getElementById('btn-home').addEventListener('click', () => {
  controls.target.copy(world.center);
  camera.position.copy(world.center).add(new THREE.Vector3().setFromSphericalCoords(90, POLAR, AZ));
  fitted = false; resize(); controls.update();
});
const hint = document.getElementById('hint');
if (ls.get('vpa.hint', false)) hint.remove();
else hint.querySelector('button').addEventListener('click', () => { ls.set('vpa.hint', true); hint.remove(); });

// ---------------- màn hình TV: so sánh các phòng ----------------
const tv = new TV(OFFICE, () => allRows);
document.getElementById('btn-tv').addEventListener('click', () => tv.open());

// ---------------- nguồn dữ liệu ----------------
const source = createSource(dataSettings, OFFICE.rooms, OFFICE.flows);
source.start(applyRows, (s) => {
  if (source.kind === 'mock') { ui.setSource('DỮ LIỆU MẪU – không phải việc thật', true); document.body.classList.add('demo'); }
  else if (s.ok) ui.setSource('Board · cập nhật ' + s.at.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), true);
  else ui.setSource('Lỗi đọc Board: ' + s.error, false);
}, (chat) => ui.setChat(chat));

// ---------------- vòng lặp ----------------
applyTheme(); applyReduced(); applyQuality();
const clock = new THREE.Clock();
const v = new THREE.Vector3();
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _c = new THREE.Color();
const SCREEN = {
  idle: ['#40506a'], working: ['#7fd3ff', '#a8f0c6', '#ffe08a', '#c7b5ff', '#9fe7ff'], done: ['#8fe3a1'], waiting: ['#ffcf7a'],
};
const screenState = world.screens.map(() => ({ t: 0, col: new THREE.Color('#40506a') }));
const roomStatus = (id) => state[id]?.status || 'idle';
const zoneCenters = Object.keys(OFFICE.zones || {}).map((z) => {
  const rs = [...world.rooms.values()].filter((r) => r.cfg.zone === z);
  if (!rs.length) return null;
  // nhãn khu đặt ở mép trước của phòng gần camera nhất
  const front = rs.reduce((a, b) => (b.x + b.z > a.x + a.z ? b : a));
  return { z, pos: new THREE.Vector3(front.x + front.w / 2 + 0.6, front.y - 0.8, front.z + front.d / 2 + 0.6) };
}).filter(Boolean);

let simT = 0;
function frame() {
  frameBody(Math.min(clock.getDelta(), 0.1));
  requestAnimationFrame(frame);
}
function frameBody(dt) {
  simT += dt;
  const t = simT;
  controls.update();
  people.update(dt, t, roomStatus);
  pets.update(dt, t);
  road.update(dt, t, prefs.reduced);

  // cây đung đưa
  world.plants.forEach((p, i) => {
    const sway = prefs.reduced ? 0 : Math.sin(t * 1.3 + p.phase) * 0.06;
    _q.setFromEuler(new THREE.Euler(sway * 0.6, 0, sway));
    _m.compose(p.pos, _q, _s.set(p.s, p.s, p.s));
    world.leafMesh.setMatrixAt(i, _m);
  });
  world.leafMesh.instanceMatrix.needsUpdate = true;

  // màn hình nhấp nháy theo trạng thái phòng
  const k = THEMES[themeNow].screenK;
  world.screens.forEach((sc, i) => {
    const st = roomStatus(sc.roomId), ss = screenState[i];
    ss.t -= dt;
    if (ss.t <= 0) {
      const pal = SCREEN[st] || SCREEN.idle;
      ss.col.set(pal[Math.floor(Math.random() * pal.length)]);
      ss.t = st === 'working' ? 0.15 + Math.random() * 0.5 : 1.5;
    }
    let f = 1;
    if (!prefs.reduced) {
      if (st === 'working') f = 0.85 + Math.random() * 0.2;
      else if (st === 'waiting') f = 0.7 + Math.sin(t * 4) * 0.3;
      else f = 0.9 + Math.sin(t * 0.8 + i) * 0.1;
    }
    world.screenMesh.setColorAt(i, _c.copy(ss.col).multiplyScalar(f * k));
  });
  world.screenMesh.instanceColor.needsUpdate = true;

  // cột đèn lung linh nhẹ (quầng sáng phập phồng)
  if (world.lamps.length && !prefs.reduced) {
    world.lamps.forEach((lp, i) => {
      const f = 0.82 + Math.sin(t * 2.1 + lp.phase) * 0.1 + Math.sin(t * 7.3 + lp.phase * 3) * 0.05;
      world.haloMesh.setColorAt(i, _c.set('#ffc867').multiplyScalar(f));
    });
    world.haloMesh.instanceColor.needsUpdate = true;
  }

  // bộ não
  for (const c of cores) {
    const working = roomStatus(c.roomId) === 'working';
    if (!prefs.reduced) {
      c.g.position.y = c.pos.y + Math.sin(t * 1.5) * 0.1;
      c.brain.rotation.y += dt * (working ? 1.2 : 0.3);
      c.bits.rotation.y -= dt * (working ? 1.6 : 0.4);
      c.ring.rotation.z += dt * 0.5;
    }
    const pulse = working ? 0.5 + Math.sin(t * 6) * 0.3 : 0.2;
    c.mat.emissiveIntensity = (themeNow === 'dark' ? 0.6 : 0.25) + pulse;
  }
  // khung chọn phòng nhấp nháy
  if (world.selMesh.visible) world.selMesh.material.opacity = prefs.reduced ? 0.9 : 0.55 + Math.sin(t * 4) * 0.35;

  renderer.render(scene, camera);

  // vị trí nhãn HTML
  const W = innerWidth / 2, H = innerHeight / 2;
  ui.overlay.classList.toggle('compact', innerHeight / (FRUSTUM / camera.zoom) < 15 || innerHeight < 520);
  const toScreen = (p) => { v.copy(p).project(camera); return [v.x * W + W, -v.y * H + H]; };
  for (const R of world.rooms.values()) {
    const [x, y] = toScreen(R.anchor);
    ui.placeTag(R.id, x, y);
    const speaker = people.inRoom(R.id)[0];
    const [bx, by] = toScreen(speaker && speaker.mode === 'seated' ? people.headPos(speaker, new THREE.Vector3()).setY(speaker.pos.y + 1.9) : R.hub.clone().setY(R.y + 2.2));
    ui.placeBubble(R.id, bx, by);
  }
  for (const zc of zoneCenters) { const [x, y] = toScreen(zc.pos); ui.placeZone(zc.z, x, y); }
  road.place(toScreen);
}
requestAnimationFrame(frame);

// gỡ lỗi từ console
window.__office = { world, people, pets, state, camera, renderer, scene, controls, step: (n = 1) => { for (let i = 0; i < n; i++) frameBody(1 / 30); } };
