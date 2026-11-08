// Ruang Mendag — model 3D produk.
// Setiap produk dibangun dari spesifikasinya di data/model3d.js (jenis bentuk, ukuran nyata dalam meter,
// bahan, warna dominan dari foto) + foto produk yang latarnya sudah dihapus (photos/cut/<id>.webp)
// sebagai label kemasan / permukaan depan / motif kain.
// Titik asal model = tengah alas; bagian depan menghadap +z. Satuan meter.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const S = THREE.MeshStandardMaterial;
const cache = new Map();
const memo = (k, f) => cache.has(k) ? cache.get(k) : (cache.set(k, f()), cache.get(k));
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

/* ---------- warna ---------- */
const col = c => new THREE.Color(c);
const shade = (c, k) => { const x = col(c); x.offsetHSL(0, 0, k); return '#' + x.getHexString(); };
const lum = c => { const x = col(c); return 0.299 * x.r + 0.587 * x.g + 0.114 * x.b; };
const darkest = cs => [...cs].sort((p, q) => lum(p) - lum(q))[0]; const lightest = cs => [...cs].sort((p, q) => lum(q) - lum(p))[0];

/* ---------- tekstur prosedural ---------- */
function canvas(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; }
function ctex(c, rep = [1, 1]) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 4; return t; }
const weaveCanvas = (a, b, kind) => memo('weave' + a + b + kind, () => canvas(128, 128, (x, w, h) => {
  x.fillStyle = a; x.fillRect(0, 0, w, h);
  const n = kind === 'fine' ? 16 : 8, s = w / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const over = (i + j) % 2 === 0, g = over ? x.createLinearGradient(i * s, 0, i * s + s, 0) : x.createLinearGradient(0, j * s, 0, j * s + s);
    g.addColorStop(0, shade(a, -0.12)); g.addColorStop(0.5, shade(a, 0.08)); g.addColorStop(1, shade(a, -0.14));
    x.fillStyle = g; x.fillRect(i * s + 0.5, j * s + 0.5, s - 1, s - 1);
  }
  if (b) { x.globalAlpha = 0.35; x.fillStyle = b; for (let j = 0; j < n; j += 4) x.fillRect(0, j * s, w, s); x.globalAlpha = 1; }
}));
const woodCanvas = c => memo('wood' + c, () => canvas(256, 256, (x, w, h) => {
  x.fillStyle = c; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 90; i++) {
    const y = rnd() * h, amp = 1 + rnd() * 4, f = 0.01 + rnd() * 0.02, ph = rnd() * 6; x.beginPath();
    for (let xx = 0; xx <= w; xx += 6) { const yy = y + Math.sin(xx * f + ph) * amp; xx ? x.lineTo(xx, yy) : x.moveTo(xx, yy); }
    x.strokeStyle = rnd() < 0.7 ? `rgba(40,20,8,${0.08 + rnd() * 0.18})` : `rgba(255,220,170,${0.05 + rnd() * 0.1})`; x.lineWidth = 0.5 + rnd() * 1.8; x.stroke();
  }
}));
const noiseCanvas = (c, k = 0.06) => memo('noise' + c + k, () => canvas(128, 128, (x, w, h) => {
  x.fillStyle = c; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${rnd() < 0.5 ? '0,0,0' : '255,255,255'},${rnd() * k})`; x.fillRect(rnd() * w, rnd() * h, 1.5, 1.5); }
}));
const swirlCanvas = (a, b, c2) => memo('swirl' + a + b, () => canvas(256, 256, (x, w, h) => {
  x.fillStyle = a; x.fillRect(0, 0, w, h);
  [b, c2, '#ffffff'].forEach((cc, k) => { for (let i = 0; i < 5; i++) { x.beginPath(); let yy = rnd() * h; x.moveTo(0, yy); for (let xx = 0; xx <= w; xx += 8) x.lineTo(xx, yy + Math.sin(xx * 0.03 + i + k) * 30); x.strokeStyle = cc; x.globalAlpha = 0.6; x.lineWidth = 6 + rnd() * 14; x.stroke(); } });
  x.globalAlpha = 1;
}));

/* ---------- bahan ---------- */
const WEAVE = { rattan: 'fine', pandan: 'fine', abaca: 'fine', hyacinth: 'coarse', mendong: 'fine', coir: 'coarse', bamboo: 'fine', raffia: 'fine', jute: 'fine', weave: 'fine', tuft: 'coarse' };
function matFor(m, c, opt = {}) {
  const c0 = c[0] || '#b89466', c1 = c[1] || shade(c0, -0.15);
  return memo('mat' + m + c0 + c1 + (opt.rep || ''), () => {
    const rep = opt.rep || [2, 2];
    if (WEAVE[m]) return new S({ name: 'mat_' + m, map: ctex(weaveCanvas(c0, m === 'weave' ? c1 : null, WEAVE[m]), rep), roughness: 0.95 });
    if (m === 'wood' || m === 'teak') return new S({ name: 'mat_wood', map: ctex(woodCanvas(c0), [1, 1]), roughness: 0.55 });
    if (m === 'leather') return new S({ name: 'mat_leather', map: ctex(noiseCanvas(c0, 0.05)), roughness: 0.55 });
    if (m === 'ceramic') return new THREE.MeshPhysicalMaterial({ name: 'mat_ceramic', map: ctex(noiseCanvas(c0, 0.08)), roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.2 });
    if (m === 'capiz') return new THREE.MeshPhysicalMaterial({ name: 'mat_capiz', color: c0, roughness: 0.25, iridescence: 0.8, sheen: 0.5, sheenColor: col('#ffffff') });
    if (m === 'metal' || m === 'copper') return new S({ name: 'mat_metal', color: c0, metalness: 0.9, roughness: 0.32 });
    if (m === 'mirror') return new S({ name: 'mat_mirror', color: '#d9dde2', metalness: 1, roughness: 0.08 });
    if (m === 'black') return new S({ name: 'mat_black', color: '#1b1b1d', roughness: 0.35 });
    if (m === 'glass') return new THREE.MeshPhysicalMaterial({ name: 'mat_glass', color: '#ffffff', roughness: 0.04, transparent: true, opacity: 0.28, depthWrite: false });
    if (m === 'plastic' || m === 'eva') return new S({ name: 'mat_plastic', color: c0, roughness: 0.45 });
    if (m === 'areca') return new S({ name: 'mat_areca', map: ctex(woodCanvas(c0 || '#c9a878')), roughness: 0.8 });
    return new S({ name: 'mat_' + (m || 'fabric'), map: ctex(noiseCanvas(c0, 0.07)), roughness: 0.9 });
  });
}
const plain = (c, r = 0.6, m = 0) => memo('plain' + c + r + m, () => new S({ name: 'plain', color: c, roughness: r, metalness: m }));

/* ---------- label dari foto ---------- */
// crop = [u0, u1] irisan horizontal foto (untuk varian berjejer), bg = warna latar kemasan
// crop = [x0, y0, x1, y1] (pecahan, y dari atas)
function photoCanvas(img, { crop = [0, 0, 1, 1], bg = null, w = 256, h = 256, fit = 'cover', pad = 0 } = {}) {
  return canvas(w, h, (x) => {
    if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
    if (!img) return;
    const sx = img.width * crop[0], sy = img.height * crop[1], sw = img.width * (crop[2] - crop[0]), sh = img.height * (crop[3] - crop[1]);
    const k = fit === 'cover' ? Math.max(w / sw, h / sh) : Math.min((w - 2 * pad) / sw, (h - 2 * pad) / sh);
    const dw = sw * k, dh = sh * k; x.drawImage(img, sx, sy, sw, sh, (w - dw) / 2, (h - dh) / 2, dw, dh);
  });
}
const photoMat = (img, o = {}) => { const t = ctex(photoCanvas(img, o)); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return new S({ name: 'product_label', map: t, roughness: o.rough ?? 0.5, transparent: !o.bg && !o.opaque, alphaTest: o.bg || o.opaque ? 0 : 0.5, side: o.side || THREE.FrontSide }); };

/* ---------- geometri ---------- */
const G = [];   // daftar [geometri, bahan] untuk model yang sedang dibangun
function add(geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
  G.push([geo.clone().applyMatrix4(m), mat]); return geo;
}
const Box = (w, h, d, s = [1, 1, 1]) => new THREE.BoxGeometry(w, h, d, ...s);
const Cyl = (rt, rb, h, seg = 32, open = false, t0 = 0, tl = Math.PI * 2) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open, t0, tl);
const Lathe = (pts, seg = 40) => new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(Math.max(0.0005, a), b)), seg);
const Tube = (pts, r, seg = 24) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), seg, r, 8, false);
function rrect(w, h, r) { const s = new THREE.Shape(), x = -w / 2, y = -h / 2; r = Math.min(r, w / 2, h / 2); s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; }
function extrude(shape, d, bevel = 0) { const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.0005, d - 2 * bevel), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 10 }); g.translate(0, 0, -(d - 2 * bevel) / 2); planarUV(g); return g; }
function planarUV(g) {   // UV dari posisi x,y (untuk tekstur foto di muka depan)
  g.computeBoundingBox(); const b = g.boundingBox, p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - b.min.x) / (b.max.x - b.min.x || 1), (p.getY(i) - b.min.y) / (b.max.y - b.min.y || 1));
  uv.needsUpdate = true; return g;
}
const roundedBox = (w, h, d, r) => { const g = extrude(rrect(w, h, r), d, Math.min(r, d / 2.2) * 0.5); return g; };
function deform(geo, f) { const p = geo.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); f(v); p.setXYZ(i, v.x, v.y, v.z); } geo.computeVertexNormals(); return geo; }

/* ---------- penyangga tampilan ---------- */
const easelWood = () => plain('#5a3c28', 0.55);
function easel(w, h, lean = 0.22) {   // penyangga kecil untuk benda pipih
  const m = easelWood(), hh = h * 0.7;
  add(Box(0.012, hh, 0.012), m, -w * 0.32, hh / 2, -0.02 - Math.sin(lean) * hh / 2, -lean);
  add(Box(0.012, hh, 0.012), m, w * 0.32, hh / 2, -0.02 - Math.sin(lean) * hh / 2, -lean);
  add(Box(0.012, hh * 0.9, 0.012), m, 0, hh * 0.45, -0.06 - hh * 0.3, 0.35);
  add(Box(w * 0.8, 0.012, 0.03), m, 0, 0.012, 0.01);
}
const standUp = (w, h, d, lean = 0.2) => ({ y: d / 2 + 0.014 + Math.sin(lean) * h / 2, z: Math.sin(lean) * h * 0.1, rx: -lean });

/* ---------- pembuat per jenis ---------- */
const B = {};
// --- kemasan makanan ---
function packFace(ctx, i, n) { const cr = ctx.spec.cr; return { crop: cr ? cr[Math.min(i, cr.length - 1)] : [i / n, 0, (i + 1) / n, 1], bg: ctx.c[0] }; }
B.pouch = (ctx, [w, h, d], i, n) => {
  const g = deform(Box(w, h, d, [10, 14, 4]), v => {
    const u = v.y / h + 0.5, sx = Math.abs(v.x) / (w / 2);
    let t = 0.55 + 0.45 * Math.cos(sx * Math.PI / 2);
    if (u > 0.86) t *= Math.max(0.04, 1 - (u - 0.86) / 0.14); if (u < 0.06) t *= 0.85;
    v.z *= t;
  });
  const lab = photoMat(ctx.img, { ...packFace(ctx, i, n), w: 256, h: Math.round(256 * h / w) });
  const back = plain(shade(ctx.c[0], -0.05), 0.5), side = plain(shade(ctx.c[0], -0.1), 0.5);
  add(g, [side, side, side, back, lab, back]);
  add(Box(w * 0.98, h * 0.01, d * 0.18), plain(shade(ctx.c[0], -0.2), 0.4), 0, h * 0.32, 0);   // ritsleting
  add(Box(w, h * 0.06, 0.002), plain(shade(ctx.c[0], 0.05), 0.4), 0, h * 0.46, 0);           // segel atas
};
B.pillow = (ctx, [w, h, d], i, n) => {
  const g = deform(Box(w, h, d, [10, 16, 4]), v => {
    const u = v.y / h + 0.5, sx = Math.abs(v.x) / (w / 2);
    let t = (0.5 + 0.5 * Math.cos(sx * Math.PI / 2)) * Math.sin(Math.min(1, Math.max(0, (u - 0.04) / 0.92)) * Math.PI) ** 0.6; v.z *= Math.max(0.03, t);
  });
  const lab = photoMat(ctx.img, { ...packFace(ctx, i, n), w: 256, h: Math.round(256 * h / w) }), side = plain(ctx.c[0], 0.35);
  add(g, [side, side, side, side, lab, plain(shade(ctx.c[0], -0.06), 0.35)]);
  const crimp = plain(shade(ctx.c[0], 0.08), 0.35); add(Box(w, h * 0.04, 0.004), crimp, 0, h * 0.48, 0); add(Box(w, h * 0.04, 0.004), crimp, 0, -h * 0.48, 0);
};
B.sachet = (ctx, s, i, n) => B.pillow(ctx, [s[0], s[1], Math.max(0.006, s[2] * 0.6)], i, n);
B.box = (ctx, [w, h, d], i, n) => {
  const lab = photoMat(ctx.img, { ...packFace(ctx, i, n), w: 256, h: Math.round(256 * h / w), rough: 0.4 });
  const side = plain(shade(ctx.c[0], -0.08), 0.45), top = plain(shade(ctx.c[0], 0.04), 0.45);
  add(Box(w, h, d), [side, side, top, side, lab, side]);
};
B.bar = (ctx, [w, h, d], i, n) => {
  const lab = photoMat(ctx.img, { ...packFace(ctx, i, n), w: 192, h: Math.round(192 * h / w), rough: 0.35 }), side = plain(shade(ctx.c[0], -0.1), 0.4);
  const st = standUp(w, h, d, 0.18); add(Box(w, h, d), [side, side, side, side, lab, side], 0, st.y + h / 2 - d / 2, st.z, st.rx);
  add(Box(w * 0.9, 0.006, 0.05), plain('#e8e8ea', 0.1), 0, 0.003, 0);          // dudukan akrilik
};
function labelBand(ctx, r, h, y, i, n, arc = 1.2) {
  const lab = photoMat(ctx.img, { ...packFace(ctx, i, n), w: 256, h: Math.round(256 * h / (r * arc * Math.PI)) });
  add(Cyl(r * 1.004, r * 1.004, h, 32, true, -arc * Math.PI / 2, arc * Math.PI), lab, 0, y, 0);
}
B.jar = (ctx, [w, h, d], i, n) => {
  const S_ = ctx.spec, glass = matFor('glass', []), fill = plain(S_.fill || ctx.c[0], 0.25), lid = plain(S_.lid || '#d4a83c', 0.3, 0.5);
  const hb = h * 0.8, r = Math.min(w, d) / 2;
  if (S_.sq) {
    add(roundedBox(w, hb, d, 0.01), glass, 0, hb / 2, 0); add(roundedBox(w * 0.94, hb * 0.86, d * 0.94, 0.008), fill, 0, hb * 0.45, 0);
    const lab = photoMat(ctx.img, { ...packFace(ctx, i, n), w: 256, h: Math.round(256 * hb / w) });
    add(new THREE.PlaneGeometry(w * 0.96, hb * 0.82), lab, 0, hb * 0.48, d / 2 + 0.002);
    add(Cyl(r * 0.8, r * 0.8, h * 0.06, 32), glass, 0, hb + h * 0.03, 0);
    add(Cyl(Math.min(w, d) * 0.46, Math.min(w, d) * 0.46, h * 0.16, 40), lid, 0, hb + h * 0.1, 0);
  } else {
    add(Lathe([[0, 0], [r * 0.92, 0], [r, r * 0.12], [r, hb * 0.92], [r * 0.82, hb], [r * 0.82, hb + h * 0.04], [0, hb + h * 0.04]]), glass);
    add(Cyl(r * 0.94, r * 0.94, hb * 0.85, 32), fill, 0, hb * 0.45, 0);
    labelBand(ctx, r, hb * 0.62, hb * 0.48, i, n, 1.3);
    add(Cyl(r * 0.88, r * 0.88, h * 0.16, 40), lid, 0, hb + h * 0.1, 0);
    for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; add(Box(0.0015, h * 0.14, 0.002), lid, Math.cos(a) * r * 0.885, hb + h * 0.1, Math.sin(a) * r * 0.885, 0, -a); }
  }
};
const BOTTLES = {
  sauce: [[0, 0], [1, 0], [1, 0.52], [0.86, 0.62], [0.36, 0.78], [0.3, 0.92], [0, 0.92]],
  syrup: [[0, 0], [1, 0], [1, 0.62], [0.7, 0.74], [0.36, 0.82], [0.34, 0.92], [0, 0.92]],
  juice: [[0, 0], [1, 0], [1, 0.7], [0.75, 0.8], [0.45, 0.86], [0.45, 0.93], [0, 0.93]],
  small: [[0, 0], [1, 0], [1, 0.74], [0.8, 0.82], [0.62, 0.84], [0.62, 0.9], [0, 0.9]],
  can: [[0, 0], [0.92, 0], [1, 0.04], [1, 0.9], [0.86, 0.97], [0, 0.97]],
};
B.bottle = (ctx, [w, h], i, n) => {
  const st = ctx.spec.style || 'sauce', prof = BOTTLES[st], r = w / 2, liquid = plain(ctx.c[0], 0.2);
  if (st === 'can') { add(Lathe(prof.map(([a, b]) => [a * r, b * h])), plain('#c9c9cc', 0.3, 0.9)); labelBand(ctx, r, h * 0.8, h * 0.47, i, n, 2); return; }
  add(Lathe(prof.map(([a, b]) => [a * r, b * h]), 32), plain(ctx.c[0], 0.12));
  add(Lathe(prof.map(([a, b]) => [a * r * 1.01, b * h]), 32), matFor('glass', []));
  { const f = packFace(ctx, i, n), c = f.crop, lh = st === 'small' ? 0.5 : 0.4, ly = st === 'small' ? 0.38 : 0.3;
    const sub = st === 'small' ? c : [c[0], c[1] + (c[3] - c[1]) * 0.5, c[2], c[1] + (c[3] - c[1]) * 0.94];
    const lab = photoMat(ctx.img, { crop: sub, bg: '#f4f1ea', w: 256, h: 192 });
    add(Cyl(r * 1.02, r * 1.02, h * lh, 32, true, -0.7 * Math.PI, 1.4 * Math.PI), lab, 0, h * ly, 0); }
  const cap = ctx.spec.lid || shade(ctx.c[0], -0.25); const top = prof[prof.length - 2];
  add(Cyl(top[0] * r * 1.18, top[0] * r * 1.18, h * 0.09, 24), plain(cap, 0.35, ctx.spec.lid ? 0.6 : 0), 0, top[1] * h + h * 0.04, 0);
};
B.tin = (ctx, [w, h], i, n) => {
  const r = w / 2; add(Cyl(r, r, h * 0.86, 40), plain(ctx.c[0], 0.4)); labelBand(ctx, r, h * 0.7, h * 0.43, i, n, 2);
  add(Cyl(r * 1.02, r * 1.02, h * 0.14, 40), plain(shade(ctx.c[0], -0.1), 0.25, 0.6), 0, h * 0.93, 0);
};
B.cup = (ctx, [w, h], i, n) => {
  const r = w / 2; add(Lathe([[0, 0], [r * 0.72, 0], [r, h * 0.92], [r * 1.03, h * 0.95], [0, h * 0.95]]), plain('#fafafa', 0.4));
  labelBand(ctx, r * 0.9, h * 0.7, h * 0.48, i, n, 2); add(Cyl(r * 1.04, r * 1.04, h * 0.05, 32), plain(ctx.c[0], 0.3), 0, h * 0.97, 0);
};
// --- tas & dompet ---
function bagBody(ctx, w, h, d, taper = 0.85, soft = false) {
  const front = photoMat(ctx.img, { bg: ctx.c[0], w: 256, h: Math.round(256 * h / w), fit: 'cover' });
  const m = matFor(ctx.spec.m, ctx.c);
  const g = deform(Box(w, h, d, [8, 8, 3]), v => { const u = v.y / h + 0.5; v.x *= 1 - (1 - taper) * u; v.z *= (soft ? 0.4 + 0.6 * Math.sin(Math.min(1, u + 0.25) * Math.PI) : 1 - 0.35 * u); });
  add(g, [m, m, m, m, front, m], 0, h / 2, 0);
}
const leather = ctx => plain(ctx.spec.m === 'leather' ? shade(ctx.c[0], -0.15) : '#6b4226', 0.5);
function handles(ctx, w, h, d, k = 0.32, hh = 0.55, r = 0.006, two = true) {
  const m = ctx.spec.m === 'rattan' ? matFor('rattan', [shade(ctx.c[0], -0.05)]) : leather(ctx);
  [two ? -d * 0.25 : 0, two ? d * 0.25 : null].forEach(z => z !== null && add(Tube([[-w * k, h, z], [-w * k * 0.8, h + h * hh * 0.85, z], [0, h + h * hh, z], [w * k * 0.8, h + h * hh * 0.85, z], [w * k, h, z]], r), m));
}
B.tote = (ctx, [w, h, d]) => { bagBody(ctx, w, h, d, 0.92, ctx.spec.soft); handles(ctx, w, h, d, 0.28, 0.5, 0.008); };
B.handbag = (ctx, [w, h, d]) => { bagBody(ctx, w, h, d, 0.82); handles(ctx, w * 0.82, h, d, 0.3, 0.45, 0.007, ctx.spec.m !== 'rattan'); if (ctx.spec.strap) add(Tube([[-w * 0.42, h * 0.9, 0], [-w * 0.6, h * 0.4, d], [0, -h * 0.05, d * 1.6], [w * 0.6, h * 0.4, d], [w * 0.42, h * 0.9, 0]], 0.004), leather(ctx)); };
B.sling = (ctx, [w, h, d]) => {
  bagBody(ctx, w, h, d, 0.95); const lm = leather(ctx);
  add(Box(w * 0.96, h * 0.42, 0.006), matFor(ctx.spec.m, ctx.c), 0, h * 0.8, d / 2 + 0.004, -0.05);
  add(Cyl(0.008, 0.008, 0.006, 16), plain('#c8a85a', 0.3, 0.8), 0, h * 0.6, d / 2 + 0.01, Math.PI / 2);
  add(Tube([[-w / 2, h * 0.92, 0], [-w * 0.55, h * 1.6, 0], [0, h * 1.9, 0], [w * 0.55, h * 1.6, 0], [w / 2, h * 0.92, 0]], 0.004), lm);
};
B.clutch = (ctx, [w, h, d]) => { const st = standUp(w, h, d, 0.16), front = photoMat(ctx.img, { bg: ctx.c[0], w: 256, h: Math.round(256 * h / w) }), m = matFor(ctx.spec.m, ctx.c); add(Box(w, h, d), [m, m, m, m, front, m], 0, st.y + h / 2 - d / 2, st.z, st.rx); add(Box(w * 0.8, 0.006, 0.05), plain('#e8e8ea', 0.1), 0, 0.003, 0); };
B.flat = (ctx, [w, h, d]) => {
  const st = standUp(w, h, d, 0.18), front = photoMat(ctx.img, { bg: ctx.c[0], w: 256, h: Math.round(256 * h / w) }), m = matFor(ctx.spec.m, ctx.c);
  const g = deform(Box(w, h, d, [6, 6, 2]), v => { v.z *= 0.7 + 0.3 * Math.cos(Math.abs(v.x) / (w / 2) * Math.PI / 2); });
  add(g, [m, m, m, m, front, m], 0, st.y + h / 2 - d / 2, st.z, st.rx);
  if (ctx.spec.zip) add(Box(w * 0.94, 0.004, d * 1.05), plain('#b9a170', 0.3, 0.7), 0, st.y + h - d / 2 - 0.004, st.z - Math.sin(-st.rx) * h, st.rx);
  if (ctx.spec.strap) add(Tube([[w * 0.42, st.y + h * 0.95, st.z - 0.02], [w * 0.62, st.y + h * 1.25, st.z - 0.04], [w * 0.75, st.y + h * 0.9, st.z - 0.03]], 0.004), leather(ctx));
  easel(w, h);
};
// --- anyaman, keramik, peralatan makan ---
B.basket = (ctx, [w, h, d]) => {
  const m = matFor(ctx.spec.m === 'batik' ? 'weave' : ctx.spec.m, ctx.c, { rep: [4, 2] }), r = w / 2;
  if (ctx.spec.rect) { const g = Box(w, h, d, [1, 1, 1]); g.groups.splice(2, 1); add(g, m, 0, h / 2, 0); add(Box(w * 0.96, 0.004, d * 0.96), m, 0, 0.003, 0); return; }
  const bowl = ctx.spec.style === 'bowl';
  const pts = bowl ? [[0, 0], [r * 0.55, 0], [r * 0.85, h * 0.4], [r, h], [r * 0.96, h], [r * 0.8, h * 0.42], [r * 0.5, h * 0.04], [0, h * 0.04]] : [[0, 0], [r * 0.85, 0], [r * 0.92, h * 0.15], [r, h], [r * 0.96, h], [r * 0.88, h * 0.16], [r * 0.82, h * 0.03], [0, h * 0.03]];
  add(Lathe(pts, 40), m); add(new THREE.TorusGeometry(r * 0.98, Math.max(0.004, r * 0.04), 8, 40), matFor(ctx.spec.m === 'batik' ? 'weave' : ctx.spec.m, [shade(ctx.c[0], -0.12)]), 0, h, 0, Math.PI / 2);
  if (ctx.spec.m === 'batik') add(Cyl(r * 0.99, r * 0.94, h * 0.35, 40, true), photoMat(ctx.img, { bg: ctx.c[1] || ctx.c[0], opaque: true }), 0, h * 0.55, 0);
};
B.bowl = (ctx, [w, h]) => { const r = w / 2, m = matFor(ctx.spec.m, ctx.c), inner = matFor(ctx.spec.m, [shade(ctx.c[0], 0.06)]); add(Lathe([[0, 0], [r * 0.45, 0], [r * 0.85, h * 0.5], [r, h], [r * 0.95, h], [r * 0.8, h * 0.5], [r * 0.4, h * 0.12], [0, h * 0.12]], 48), m); add(new THREE.CircleGeometry(r * 0.5, 32), inner, 0, h * 0.125, 0, -Math.PI / 2); };
B.plate = (ctx, [w, h, d]) => {   // berdiri di penyangga supaya permukaannya terlihat
  const sp = ctx.spec, m = matFor(sp.m, ctx.c), top = photoMat(ctx.img, { bg: ctx.c[0], opaque: true, fit: 'cover' });
  const lean = 0.25, t = Math.max(0.008, h * 0.5), H = d;
  let face; if (sp.square) face = rrect(w, d, w * 0.08); else { face = new THREE.Shape(); const k = 48; for (let a = 0; a <= k; a++) { const th = a / k * Math.PI * 2, wob = sp.organic ? 1 + 0.05 * Math.sin(th * 3) + 0.03 * Math.cos(th * 5) : 1; const x = Math.cos(th) * w / 2 * wob, y = Math.sin(th) * H / 2 * wob; a ? face.lineTo(x, y) : face.moveTo(x, y); } }
  const g = extrude(face, t, t * 0.3), y0 = H / 2 * Math.cos(lean) + 0.012, z0 = -Math.sin(lean) * H / 2 * 0.4;
  add(g, [top, m], 0, y0, z0, -lean); easel(w * 0.9, H * 0.6, lean);
};
B.mat = (ctx, [w, h, d]) => {
  const sp = ctx.spec, m = matFor(sp.m, ctx.c), top = photoMat(ctx.img, { bg: ctx.c[0], opaque: true, fit: 'cover' });
  const W = w, Hh = h, lean = 0.2, t = Math.max(0.004, d);
  const shape = sp.round ? new THREE.Shape().absarc(0, 0, W / 2, 0, Math.PI * 2) : rrect(W, Hh, Math.min(W, Hh) * 0.03);
  add(extrude(shape, t), [top, m], 0, (sp.round ? W : Hh) / 2 * Math.cos(lean) + 0.012, -Math.sin(lean) * Hh * 0.2, -lean); easel(W * 0.8, (sp.round ? W : Hh) * 0.5, lean);
};
B.tray = (ctx, [w, h, d]) => { const m = matFor(ctx.spec.m, ctx.c, { rep: [3, 1] }); add(Box(w, 0.008, d), m, 0, 0.004, 0); [[0, d / 2, w, 0], [0, -d / 2, w, 0], [w / 2, 0, d, 1], [-w / 2, 0, d, 1]].forEach(([x, z, L, r]) => add(Box(L, h, 0.012), m, x, h / 2, z, 0, r * Math.PI / 2)); [-1, 1].forEach(s => add(new THREE.TorusGeometry(0.03, 0.006, 8, 16, Math.PI), m, s * (w / 2 + 0.004), h * 0.9, 0, 0, Math.PI / 2)); };
B.lunchbox = (ctx, [w, h, d]) => { const m = matFor('areca', ctx.c); add(Box(w, 0.004, d), m, 0, 0.002, 0); [[0, d / 2, w, 0], [0, -d / 2, w, 0], [w / 2, 0, d, 1], [-w / 2, 0, d, 1]].forEach(([x, z, L, r]) => add(Box(L, h, 0.004), m, x, h / 2, z, 0, r * Math.PI / 2)); add(Box(w, 0.004, d), m, 0, h + Math.sin(1.1) * d / 2, -d / 2 - Math.cos(1.1) * d / 2 + d / 2 * 0, 1.1); };
B.tableset = (ctx, [w, h, d]) => { const c = { ...ctx, spec: { ...ctx.spec, m: 'ceramic' } }; G.length; B.plate(c, [w, 0.02, w * 0.9]); const gl = matFor('glass', []); [-1, 1].forEach(s => { add(Lathe([[0, 0], [0.035, 0], [0.04, 0.1], [0.037, 0.1], [0.032, 0.006], [0, 0.006]], 24), gl, s * w * 0.42, 0, d * 0.25); }); };
B.containers = (ctx, [w, h, d]) => { const cl = matFor('glass', []), lid = plain(ctx.c[0], 0.4); [[w, h * 0.42], [w * 0.85, h * 0.36], [w * 0.7, h * 0.3]].forEach(([ww, hh], k, a) => { const y = a.slice(0, k).reduce((s, [, q]) => s + q + 0.012, 0); add(roundedBox(ww, hh, d * (ww / w), 0.01), cl, 0, y + hh / 2, 0); add(roundedBox(ww * 1.02, 0.012, d * (ww / w) * 1.02, 0.004), lid, 0, y + hh + 0.006, 0); }); };
B.utensils = (ctx, [w, h, d]) => {   // berdiri di dalam wadah keramik
  const m = matFor('teak', [ctx.c[0] || '#9a6b3e']), n = ctx.spec.n || 3, L = w;
  add(Lathe([[0, 0], [0.05, 0], [0.055, 0.12], [0.05, 0.12], [0.045, 0.008], [0, 0.008]], 32), plain(ctx.c[1] || '#e9e4da', 0.3));
  for (let k = 0; k < n; k++) {
    const a = (k - (n - 1) / 2) * 0.22, hw = ctx.spec.style === 'server' ? 0.03 : 0.028;
    const s = new THREE.Shape(); s.moveTo(-0.008, 0); s.lineTo(0.008, 0); s.lineTo(0.009, L * 0.62); s.quadraticCurveTo(hw * 1.4, L * 0.7, hw, L * 0.9); s.quadraticCurveTo(0, L * 1.02, -hw, L * 0.9); s.quadraticCurveTo(-hw * 1.4, L * 0.7, -0.009, L * 0.62); s.lineTo(-0.008, 0);
    add(extrude(s, 0.008, 0.002), m, Math.sin(a) * 0.02, 0.01, 0, 0.1 * (k % 2 ? 1 : -1), 0, -a);
  }
};
B.board = (ctx, [w, h, d]) => { const m = matFor('teak', [ctx.c[0]]), s = rrect(w, h, 0.03), hole = new THREE.Path().absarc(w * 0.38, 0, 0.015, 0, Math.PI * 2); s.holes.push(hole); const lean = 0.2; add(extrude(s, d, 0.004), m, 0, h / 2 * Math.cos(lean) + 0.012, -Math.sin(lean) * h * 0.2, -lean, 0, 0); easel(w * 0.8, h * 0.6, lean); };
// --- dekorasi rumah ---
B.vase_ring = (ctx, [w, h, d]) => { const m = matFor('ceramic', ctx.c); add(new THREE.TorusGeometry(w * 0.34, w * 0.15, 24, 48), m, 0, h * 0.52, 0, 0, 0, 0, 1, 1, d / (w * 0.3)); add(Box(w * 0.4, 0.012, d * 0.9), m, 0, 0.006, 0); };
B.candle = (ctx, [w, h]) => { const r = w / 2, sw = matFor('x', ctx.c); const t = ctex(swirlCanvas(ctx.c[0], ctx.c[1] || '#ffffff', ctx.c[2] || '#f0b0b0')); add(Cyl(r, r, h * 0.9, 32), new S({ name: 'candle', map: t, roughness: 0.6 }), 0, h * 0.47, 0); add(Cyl(0.0015, 0.0015, h * 0.06, 6), plain('#222', 0.8), 0, h * 0.95, 0); add(Cyl(r * 2, r * 2.1, 0.012, 32), new S({ name: 'candle_dish', map: t, roughness: 0.4 }), 0, 0.006, 0); };
B.diffuser = (ctx, [w, h]) => {
  const r = w / 2, black = ctx.spec.m === 'black', body = black ? plain('#1b1b1d', 0.3) : matFor('glass', []);
  if (ctx.spec.style === 'stone') { const st = plain(ctx.c[0], 0.85); for (let k = 0; k < 7; k++) add(new THREE.SphereGeometry(r * 0.38, 16, 12), st, (rnd() - 0.5) * w, r * 0.3 + (k > 4 ? r * 0.5 : 0), (rnd() - 0.5) * w * 0.6, 0, rnd() * 3, 0, 1, 0.6, 1); add(Cyl(r * 0.45, r * 0.5, h * 0.4, 24), matFor('glass', []), w * 0.4, h * 0.2, -r * 0.2); return; }
  add(Lathe([[0, 0], [r, 0], [r, h * 0.42], [r * 0.4, h * 0.5], [r * 0.32, h * 0.56], [0, h * 0.56]], 32), body);
  if (!black) add(Cyl(r * 0.92, r * 0.92, h * 0.3, 24), plain(ctx.c[0], 0.2), 0, h * 0.16, 0);
  const reed = plain('#4a3424', 0.8); for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; add(Cyl(0.0018, 0.0018, h * 0.75, 6), reed, Math.cos(a) * 0.006 + Math.cos(a) * 0.02, h * 0.82, Math.sin(a) * 0.02, Math.sin(a) * 0.18, 0, -Math.cos(a) * 0.18); }
};
B.dispenser = (ctx, [w, h, d]) => { const front = photoMat(ctx.img, { bg: ctx.c[0], w: 192, h: 256 }), m = plain(ctx.c[0], 0.35); add(roundedBox(w, h * 0.72, d, 0.012), [front, m], 0, h * 0.36, 0); add(Cyl(0.008, 0.01, h * 0.12, 16), plain('#c9a45c', 0.3, 0.8), 0, h * 0.78, 0); add(Box(0.03, 0.01, 0.012), plain('#c9a45c', 0.3, 0.8), 0.012, h * 0.85, 0); };
B.tissue = (ctx, [w, h, d]) => { const front = photoMat(ctx.img, { bg: ctx.c[0], w: 256, h: Math.round(256 * h / w) }), m = ctx.spec.m === 'black' ? plain('#1b1b1d', 0.35) : matFor(ctx.spec.m, ctx.c); add(Box(w, h, d), [m, m, m, m, front, m], 0, h / 2, 0); add(Box(w * 0.5, 0.004, 0.012), plain('#111', 0.9), 0, h + 0.001, 0); add(new THREE.SphereGeometry(0.03, 12, 8), plain('#fbfbfb', 0.9), 0, h + 0.012, 0, 0, 0.4, 0, 1.4, 0.6, 0.7); };
B.planter = (ctx, [w, h, d]) => { const r = w / 2, m = matFor(ctx.spec.m, ctx.c); if (ctx.spec.style === 'tall') add(Lathe([[0, 0], [r * 0.7, 0], [r, h * 0.6], [r * 0.95, h * 0.62], [0, h * 0.62]], 32), m); else add(new THREE.SphereGeometry(r, 32, 20, 0, Math.PI * 2, Math.PI * 0.2, Math.PI * 0.8), m, 0, r * 0.95, 0); const leaf = plain('#3f6b2e', 0.6), top = ctx.spec.style === 'tall' ? h * 0.62 : r * 1.75; for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2; add(new THREE.SphereGeometry(1, 10, 6), leaf, Math.cos(a) * r * 0.35, top + r * 0.25, Math.sin(a) * r * 0.35, 0.6 * Math.sin(a), a, 0.6 * Math.cos(a), r * 0.3, 0.02, r * 0.12); } };
B.lamp_table = (ctx, [w, h, d]) => {
  const st = ctx.spec.style, wood = matFor('teak', ['#8a5a34']), shadeM = matFor(ctx.spec.m === 'clay' ? 'x' : (ctx.spec.m === 'teak' ? 'abaca' : ctx.spec.m), ctx.spec.m === 'teak' ? ['#e8dcc6'] : ctx.c, { rep: [6, 2] });
  const glow = new THREE.MeshBasicMaterial({ name: 'lamp_glow', color: new THREE.Color(1.6, 1.25, 0.8), toneMapped: false });
  if (st === 'orb') { add(new THREE.SphereGeometry(w / 2, 32, 20), plain(ctx.c[0], 0.85), 0, w / 2, 0); add(new THREE.SphereGeometry(w * 0.3, 16, 12), glow, 0, w / 2, 0); return; }
  if (st === 'wide') { add(Lathe([[0, 0], [w * 0.5, 0], [w * 0.5, h * 0.06], [w * 0.36, h * 0.5], [w * 0.18, h * 0.9], [w * 0.08, h], [0, h]], 40), shadeM); add(Cyl(w * 0.1, w * 0.1, h * 0.3, 16), glow, 0, h * 0.2, 0); return; }
  add(Cyl(w * 0.3, w * 0.36, h * 0.06, 24), wood, 0, h * 0.03, 0); add(Cyl(w * 0.1, w * 0.12, h * 0.55, 16), wood, 0, h * 0.32, 0);
  add(Lathe([[w * 0.5, 0], [w * 0.32, h * 0.38], [w * 0.31, h * 0.38], [w * 0.49, 0]], 40), shadeM, 0, h * 0.58, 0); add(Cyl(w * 0.1, w * 0.1, h * 0.12, 12), glow, 0, h * 0.62, 0);
};
B.lamp_hang = (ctx, [w, h]) => {
  const m = matFor(ctx.spec.m, ctx.c, { rep: [8, 3] }), r = w / 2, glow = new THREE.MeshBasicMaterial({ name: 'lamp_glow', color: new THREE.Color(1.6, 1.25, 0.8), toneMapped: false });
  const prof = ctx.spec.style === 'drop' ? [[0.002, h], [r * 0.3, h * 0.9], [r * 0.8, h * 0.55], [r, h * 0.25], [r * 0.9, h * 0.08], [r * 0.6, 0]] : [[0.002, h], [r * 0.25, h * 0.98], [r * 0.7, h * 0.8], [r * 0.95, h * 0.4], [r, 0]];
  const g = Lathe(prof, 48); g.groups = []; const mm = m.clone(); mm.side = THREE.DoubleSide; add(g, mm); add(new THREE.SphereGeometry(r * 0.16, 16, 12), glow, 0, h * 0.35, 0); add(Cyl(0.003, 0.003, h * 0.5, 6), plain('#222', 0.6), 0, h * 1.25, 0);
};
B.lamp_floor = (ctx, [w, h]) => { const m = matFor(ctx.spec.m, ctx.c, { rep: [6, 3] }), r = w / 2; add(Cyl(r * 0.6, r * 0.7, h * 0.03, 24), m, 0, h * 0.015, 0); add(Cyl(0.012, 0.012, h * 0.62, 12), plain('#6b4a2c', 0.5), 0, h * 0.33, 0); const mm = m.clone(); mm.side = THREE.DoubleSide; add(Lathe([[r * 0.95, 0], [r, h * 0.12], [r * 0.85, h * 0.28], [r * 0.4, h * 0.36]], 40), mm, 0, h * 0.62, 0); };
B.cushion = (ctx, [w, h, d]) => {
  const front = photoMat(ctx.img, { bg: ctx.c[0], opaque: true, w: 256, h: Math.round(256 * h / w) }), m = matFor('fabric', ctx.c);
  const g = deform(Box(w, h, d, [12, 12, 6]), v => { const sx = Math.abs(v.x) / (w / 2), sy = Math.abs(v.y) / (h / 2); v.z *= Math.max(0.08, (1 - sx ** 3) * (1 - sy ** 3)); v.x *= 1 - 0.05 * (1 - sy ** 2); v.y *= 1 - 0.05 * (1 - sx ** 2); });
  const lean = 0.25; add(g, [m, m, m, m, front, front], 0, h / 2 * Math.cos(lean) + d * 0.3, -h * 0.12, -lean);
};
B.fabric = (ctx, [w, h, d]) => {   // kain terlipat bertumpuk, motif dari foto
  const pat = photoMat(ctx.img, { bg: ctx.c[0], opaque: true, fit: 'cover' }), m = matFor(ctx.spec.m === 'weave' ? 'weave' : 'fabric', ctx.c), n = 3, t = h / n;
  for (let k = 0; k < n; k++) { const g = roundedBox(w * (1 - k * 0.04), t * 0.9, d * (1 - k * 0.04), t * 0.4); add(g, [pat, m], (k - 1) * 0.004, t * (k + 0.5), 0, -Math.PI / 2, 0, 0); }
};
B.garment = (ctx, [w, h, d]) => {   // siluet pakaian di gantungan kecil, motif dari foto
  const st = ctx.spec.style, s = new THREE.Shape(), W = w / 2, H = h;
  if (st === 'pants') { s.moveTo(-W * 0.8, H); s.lineTo(W * 0.8, H); s.lineTo(W, 0); s.lineTo(W * 0.15, 0); s.lineTo(0, H * 0.62); s.lineTo(-W * 0.15, 0); s.lineTo(-W, 0); s.lineTo(-W * 0.8, H); }
  else if (st === 'skirt') { s.moveTo(-W * 0.6, H); s.lineTo(W * 0.6, H); s.lineTo(W, 0); s.lineTo(-W, 0); s.lineTo(-W * 0.6, H); }
  else if (st === 'vest') { s.moveTo(-W * 0.3, H); s.lineTo(-W * 0.62, H * 0.96); s.lineTo(-W * 0.62, H * 0.66); s.lineTo(-W * 0.7, 0); s.lineTo(W * 0.7, 0); s.lineTo(W * 0.62, H * 0.66); s.lineTo(W * 0.62, H * 0.96); s.lineTo(W * 0.3, H); s.lineTo(0, H * 0.82); s.lineTo(-W * 0.3, H); }
  else { s.moveTo(-W * 0.32, H); s.lineTo(-W * 0.62, H * 0.97); s.lineTo(-W, H * 0.55); s.lineTo(-W * 0.86, H * 0.5); s.lineTo(-W * 0.62, H * 0.78); s.lineTo(-W * 0.62, 0); s.lineTo(W * 0.62, 0); s.lineTo(W * 0.62, H * 0.78); s.lineTo(W * 0.86, H * 0.5); s.lineTo(W, H * 0.55); s.lineTo(W * 0.62, H * 0.97); s.lineTo(W * 0.32, H); s.lineTo(0, H * 0.9); s.lineTo(-W * 0.32, H); }
  const pat = photoMat(ctx.img, { crop: (ctx.spec.cr && ctx.spec.cr[0]) || [0.3, 0.2, 0.7, 0.55], bg: ctx.c[0], opaque: true, fit: 'cover' }), m = matFor('fabric', ctx.c);
  const y0 = 0.05; add(extrude(s, Math.max(0.006, d)), [pat, m], 0, y0, 0);
  const hz = plain('#2b2b2b', 0.4, 0.6); add(Tube([[-W * 0.55, y0 + H * 0.97, 0], [0, y0 + H * 1.06, 0], [W * 0.55, y0 + H * 0.97, 0]], 0.003), hz); add(Cyl(0.003, 0.003, 0.06, 8), hz, 0, y0 + H * 1.1, 0);
  add(Cyl(0.005, 0.005, y0 + H * 1.13, 8), hz, 0, (y0 + H * 1.13) / 2, -0.03); add(Cyl(w * 0.18, w * 0.2, 0.012, 24), hz, 0, 0.006, -0.03);
};
B.doll = (ctx, [w, h, d]) => { const pat = photoMat(ctx.img, { bg: ctx.c[0], opaque: true, fit: 'cover' }); const g = Cyl(w * 0.18, w * 0.42, h * 0.62, 24); add(g, [pat, plain(ctx.c[0], 0.8), plain(ctx.c[0], 0.8)], 0, h * 0.31, 0); add(new THREE.SphereGeometry(w * 0.2, 20, 14), plain('#d9b48c', 0.7), 0, h * 0.74, 0); add(new THREE.SphereGeometry(w * 0.21, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), plain('#2a1d16', 0.8), 0, h * 0.76, -0.004); };
B.figure = (ctx, [w, h, d]) => {   // potongan bentuk asli dari foto (wayang kulit, hiasan dinding, gantungan kunci)
  const ar = ctx.img ? ctx.img.width / ctx.img.height : w / h; let W = w, H = W / ar; if (H > h) { H = h; W = H * ar; }
  const face = photoMat(ctx.img, { w: 512, h: Math.round(512 / ar), fit: 'contain', side: THREE.DoubleSide });
  const lean = d > 0.02 ? 0 : 0.12, y = H / 2 * Math.cos(lean) + 0.016;
  add(new THREE.PlaneGeometry(W, H), face, 0, y, 0, -lean); add(new THREE.PlaneGeometry(W, H), face, 0, y, -0.002, -lean, Math.PI);
  add(Box(Math.min(W, 0.3) * 0.7, 0.016, Math.max(0.05, d)), plain('#3a2a1e', 0.5), 0, 0.008, 0);
};
// --- furnitur (di rak tampil sebagai miniatur) ---
B.chair = (ctx, [w, h, d]) => {
  const fc = [...ctx.c].filter(c => lum(c) < 0.8).sort((p, q) => lum(p) - lum(q)); const frc = fc[Math.min(1, fc.length - 1)] || '#a97a46';
  const m = matFor(ctx.spec.m, [frc], { rep: [3, 3] }), cush = plain(lum(lightest(ctx.c)) > 0.6 ? lightest(ctx.c) : '#ece6da', 0.95), fr = ctx.spec.m === 'rattan' ? m : matFor('teak', [frc]);
  const sh = h * 0.42, r = Math.min(w, d) * 0.04;
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => add(Cyl(r, r, sh, 10), fr, a * w * 0.42, sh / 2, b * d * 0.4));
  [-1, 1].forEach(a => { add(Tube([[a * w * 0.44, sh, d * 0.42], [a * w * 0.46, h * 0.62, d * 0.25], [a * w * 0.45, h * 0.66, -d * 0.3], [a * w * 0.42, h, -d * 0.44]], r), fr); });
  add(Box(w * 0.86, r * 2, d * 0.86), fr, 0, sh, 0); add(roundedBox(w * 0.8, h * 0.12, d * 0.78, 0.02), cush, 0, sh + h * 0.06, 0.02, -Math.PI / 2, 0, 0);
  const back = roundedBox(w * 0.8, h * 0.48, h * 0.1, 0.02); add(back, cush, 0, sh + h * 0.3, -d * 0.36, -0.18);
};
B.stool = (ctx, [w, h, d]) => { const m = matFor('teak', [ctx.c[0]]), r = w / 2; add(Cyl(r, r, h * 0.08, 32), m, 0, h * 0.96, 0); for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; add(Cyl(r * 0.07, r * 0.06, h * 0.95, 10), m, Math.cos(a) * r * 0.6, h * 0.47, Math.sin(a) * r * 0.6, Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12); } add(new THREE.TorusGeometry(r * 0.62, r * 0.03, 8, 32), m, 0, h * 0.35, 0, Math.PI / 2); };
B.table = (ctx, [w, h, d]) => { const mir = matFor('mirror', []), base = plain(ctx.c[0], 0.3, 0.6); add(Cyl(0.5, 0.5, h * 0.06, 48), mir, 0, h * 0.97, 0, 0, 0, 0, w, 1, d); add(Lathe([[w * 0.3, 0], [w * 0.22, h * 0.5], [w * 0.28, h * 0.94], [0, h * 0.94]], 40), base, 0, 0, 0, 0, 0, 0, 1, 1, d / w); };
B.cabinet = (ctx, [w, h, d]) => { const front = photoMat(ctx.img, { bg: ctx.c[0], opaque: true, w: 256, h: Math.round(256 * h / w) }), m = plain(shade(ctx.c[0], -0.1), 0.3, 0.6); add(Box(w, h * 0.88, d), [m, m, m, m, front, m], 0, h * 0.56, 0); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => add(Cyl(0.015, 0.012, h * 0.12, 10), plain('#c9a45c', 0.3, 0.9), a * w * 0.45, h * 0.06, b * d * 0.4)); };
B.shelf = (ctx, [w, h, d]) => { const m = matFor('teak', [ctx.c[0]]), t = 0.03; [0, h / 2, h].forEach(y => add(Box(w, t, d), m, 0, Math.max(t / 2, Math.min(h - t / 2, y)), 0)); [-0.5, -0.25, 0, 0.25, 0.5].forEach(x => add(Box(t, h, d), m, x * (w - t), h / 2, 0)); add(Box(w, h, 0.01), m, 0, h / 2, -d / 2); };
B.clock = (ctx, [w, h, d]) => {
  const round = ctx.spec.style === 'round', m = matFor(ctx.spec.m, ctx.c), face = plain('#f4efe4', 0.4), hand = plain('#1d1d1d', 0.4);
  if (round) { add(Cyl(h / 2, h / 2, d * 0.5, 40), m, 0, h / 2 + 0.01, 0, Math.PI / 2); add(new THREE.CircleGeometry(h * 0.32, 32), face, 0, h / 2 + 0.01, d * 0.26); add(Box(w * 0.7, 0.02, d), m, 0, 0.01, 0); }
  else { add(roundedBox(w, h, d, 0.008), [matFor('teak', ctx.c), matFor('teak', ctx.c)], 0, h / 2, 0); add(new THREE.CircleGeometry(w * 0.36, 32), face, 0, h * 0.62, d / 2 + 0.001); }
  const cy = round ? h / 2 + 0.01 : h * 0.62, cz = round ? d * 0.27 : d / 2 + 0.002; add(Box(0.003, w * 0.18, 0.002), hand, 0, cy + w * 0.07, cz, 0, 0, 0.6); add(Box(0.003, w * 0.26, 0.002), hand, 0, cy + w * 0.1, cz + 0.001, 0, 0, -1.8);
};
B.radio = (ctx, [w, h, d]) => { const front = photoMat(ctx.img, { bg: ctx.c[0], opaque: true, w: 256, h: Math.round(256 * h / w) }), m = matFor('wood', ctx.c); add(roundedBox(w, h, d, 0.015), [front, m], 0, h / 2, 0); add(Cyl(0.012, 0.012, 0.012, 20), plain('#c9a45c', 0.3, 0.8), w * 0.38, h * 0.82, 0, 0, 0, Math.PI / 2); add(Box(w * 0.3, 0.012, 0.02), m, 0, h + 0.006, -d * 0.2); };
B.watch = (ctx, [w, h, d]) => {   // jam tangan melingkar di penyangga
  const band = matFor(ctx.spec.m === 'plastic' ? 'plastic' : 'leather', [ctx.c[1] || '#4a3020']), cas = ctx.spec.m === 'wood' ? matFor('teak', [ctx.c[0]]) : plain(ctx.c[0], 0.4);
  const R = h / (2 * Math.PI) * 1.05, y = R + 0.03;
  add(Box(0.03, y - 0.01, 0.02), plain('#2a2a2a', 0.5), 0, (y - 0.01) / 2, -0.005); add(Box(0.07, 0.012, 0.06), plain('#2a2a2a', 0.5), 0, 0.006, 0);
  add(new THREE.TorusGeometry(R, w * 0.25, 8, 40), band, 0, y, 0, 0, 0, 0, 1, 1, 2.4);
  add(Cyl(w * 0.55, w * 0.55, d, 32), cas, 0, y, R + d / 2, Math.PI / 2); add(new THREE.CircleGeometry(w * 0.45, 32), photoMat(ctx.img, { bg: '#f1ede3', opaque: true, fit: 'cover' }), 0, y, R + d + 0.001);
};
// --- alas kaki ---
function shoe(ctx, [w, h, L], x, style) {
  const up = matFor(ctx.spec.m === 'mesh' ? 'fabric' : 'leather', ctx.spec.m === 'mesh' ? ctx.c : [darkest(ctx.c)]), sole = plain(style === 'sport' ? '#f2f0ea' : (style === 'loafer' ? '#3a2a1e' : '#cdb38a'), 0.7);
  const s = new THREE.Shape(); s.moveTo(0, -L / 2); s.bezierCurveTo(w * 0.62, -L / 2, w * 0.55, L * 0.1, w * 0.5, L * 0.3); s.bezierCurveTo(w * 0.5, L * 0.5, -w * 0.5, L * 0.5, -w * 0.45, L * 0.3); s.bezierCurveTo(-w * 0.45, L * 0.05, -w * 0.4, -L / 2, 0, -L / 2);
  const sh = style === 'sport' ? h * 0.25 : h * 0.14; add(extrude(s, sh, 0.003), sole, x, sh / 2, 0, -Math.PI / 2);
  const g = new THREE.SphereGeometry(0.5, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  add(g, up, x, sh, L * 0.12, 0, 0, 0, w * 0.95, (h - sh) * 1.05, L * 0.62);
  add(g, up, x, sh, -L * 0.22, 0, 0, 0, w * 0.92, (h - sh) * (style === 'maryjane' ? 0.7 : 1.15), L * 0.5);
  if (style === 'derby' || style === 'sport') for (let k = 0; k < 4; k++) add(Box(w * 0.5, 0.003, 0.004), plain(style === 'sport' ? '#ffffff' : '#1f3b6d', 0.6), x, h * (0.8 - k * 0.04), L * (0.05 + k * 0.05), -0.4);
  if (style === 'maryjane') add(Box(w * 1.02, 0.008, 0.012), up, x, h * 0.75, -L * 0.02);
}
B.shoes = (ctx, s) => { shoe(ctx, s, -s[0] * 0.58, ctx.spec.style); shoe(ctx, s, s[0] * 0.58, ctx.spec.style); };
B.sandals = (ctx, [w, h, L]) => { const sole = plain('#3a2a1e', 0.6), strap = matFor('leather', ctx.c); [-1, 1].forEach(a => { add(roundedBox(w, L, 0.02, 0.03), sole, a * w * 0.6, 0.012, 0, -Math.PI / 2); [0.25, -0.05].forEach(t => add(new THREE.TorusGeometry(w * 0.5, 0.008, 6, 20, Math.PI), strap, a * w * 0.6, 0.02, L * t, 0, 0, 0, 1, h * 0.9 / (w * 0.5), 1)); }); };
B.slippers = (ctx, [w, h, L]) => { const m = plain(ctx.c[0], 0.6); [-1, 1].forEach(a => { add(roundedBox(w, L, 0.025, 0.035), m, a * w * 0.6, 0.0125, 0, -Math.PI / 2); add(new THREE.TorusGeometry(w * 0.5, 0.018, 8, 20, Math.PI), m, a * w * 0.6, 0.022, L * 0.18, 0, 0, 0, 1, 1.1, 2.2); }); };
// --- lain-lain ---
B.sticks = (ctx, [L]) => { const m = matFor('wood', [ctx.c[0] || '#d9b98a']); [-0.18, 0.18].forEach((a, k) => add(Cyl(0.006, 0.0075, L, 12), m, k ? 0.02 : -0.02, L / 2 * Math.cos(a) + 0.02, 0, 0, 0, a)); add(Box(0.12, 0.02, 0.06), plain('#2a2a2a', 0.5), 0, 0.01, 0); };
B.pick = (ctx, [w, h]) => { for (let k = 0; k < 3; k++) { const s = new THREE.Shape(); s.moveTo(-w / 2, h / 2); s.quadraticCurveTo(0, h * 0.62, w / 2, h / 2); s.quadraticCurveTo(w * 0.2, -h * 0.2, 0, -h / 2); s.quadraticCurveTo(-w * 0.2, -h * 0.2, -w / 2, h / 2); add(extrude(s, 0.002), plain(ctx.c[k % ctx.c.length] || '#c33', 0.3), (k - 1) * w * 1.1, h / 2 + 0.012, 0, -0.2); } add(Box(w * 3.6, 0.012, 0.03), plain('#2a2a2a', 0.5), 0, 0.006, 0); };

/* ---------- penyatuan geometri (hemat panggilan gambar) ---------- */
function bake(name) {
  const byMat = new Map();
  for (const [g, m] of G) {
    const mats = Array.isArray(m) ? m : [m];
    let geo = g.index ? g.toNonIndexed() : g;
    ['position', 'normal', 'uv'].forEach(a => { if (!geo.attributes[a]) { if (a === 'normal') geo.computeVertexNormals(); else geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2)); } });
    Object.keys(geo.attributes).forEach(a => { if (!['position', 'normal', 'uv'].includes(a)) geo.deleteAttribute(a); });
    if (mats.length === 1 || !geo.groups.length) { const k = mats[0]; byMat.has(k) || byMat.set(k, []); byMat.get(k).push(geo); continue; }
    for (const gr of geo.groups) {   // pisahkan grup bahan
      const k = mats[gr.materialIndex] || mats[mats.length - 1], part = new THREE.BufferGeometry();
      ['position', 'normal', 'uv'].forEach(a => { const at = geo.attributes[a]; part.setAttribute(a, new THREE.Float32BufferAttribute(at.array.slice(gr.start * at.itemSize, (gr.start + gr.count) * at.itemSize), at.itemSize)); });
      byMat.has(k) || byMat.set(k, []); byMat.get(k).push(part);
    }
  }
  const out = new THREE.Group(); out.name = name;
  byMat.forEach((list, mat) => { list.forEach(g => g.clearGroups()); const merged = mergeGeometries(list, false); if (!merged) return; const me = new THREE.Mesh(merged, mat); me.name = 'model_part'; out.add(me); });
  G.length = 0; return out;
}

/* ---------- API ---------- */
// spec: { t, s:[w,h,d] (m), n, m, c:[warna...], ... } ; img: gambar foto tanpa latar (HTMLImageElement / ImageBitmap)
export function buildProduct(spec, img) {
  const t = B[spec.t] ? spec.t : 'box', n = Math.max(1, spec.n || 1), s = spec.s;
  const ctx = { spec, img, c: spec.c && spec.c.length ? spec.c : ['#b89466', '#6b4a2c', '#e8dcc6'] };
  G.length = 0;
  if (n > 1 && ['pouch', 'pillow', 'box', 'bar', 'jar', 'bottle', 'tin', 'cup', 'sachet'].includes(t)) {
    const gap = s[0] * 0.08, tot = n * s[0] + (n - 1) * gap;
    const groups = [];
    for (let i = 0; i < n; i++) { B[t](ctx, s, i, n); const g = bake('item'); g.position.x = -tot / 2 + s[0] / 2 + i * (s[0] + gap); g.position.z = (i % 2) * -s[2] * 0.5; groups.push(g); }
    const root = new THREE.Group(); root.name = 'product3d'; groups.forEach(g => root.add(g));
    return finish(root);
  }
  B[t](ctx, s, 0, 1);
  return finish(bake('product3d'));
}
function finish(g) {
  const b = new THREE.Box3().setFromObject(g), sz = b.getSize(new THREE.Vector3());
  g.userData.size = [sz.x, sz.y, sz.z]; g.userData.min = [b.min.x, b.min.y, b.min.z];
  const hits = []; g.traverse(o => { if (o.isMesh) hits.push(o); }); g.userData.hits = hits;
  return g;
}
export const TYPES = Object.keys(B);
