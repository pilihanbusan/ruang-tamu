// Ruang Mendag — tata letak produk: meja pajang (banyak produk per meja, sesuai ukuran)
// dan rak showcase terbuka bertingkat di dinding untuk produk yang tidak di meja.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/* ---------- meja ---------- */
// Nama meja yang tampil di Mode Atur. id sama dengan kunci di data/pajangan.js.
export const TABLES = [
  { id: 'featured', label: 'Meja Featured (meja kopi depan branding)' },
  { id: 'table-1', label: 'Meja bundar lounge 1' },
  { id: 'side-1', label: 'Meja samping emas' },
  { id: 'table-2', label: 'Meja bundar lounge 2' },
  { id: 'nest-a', label: 'Meja nesting besar' },
  { id: 'nest-b', label: 'Meja nesting kecil' },
  { id: 'gunungan', label: 'Konsol Gunungan' },
  { id: 'console', label: 'Konsol pintu masuk' },
];
// kunci lama (satu produk per tempat) → meja baru
export const LEGACY = { 'table-1a': 'table-1', 'table-1b': 'table-1', 'table-2a': 'table-2', 'table-2b': 'table-2', 'gunungan-1': 'gunungan', 'gunungan-2': 'gunungan', 'gunungan-3': 'gunungan', 'console-1': 'console', 'console-2': 'console' };

// Susun produk di permukaan meja: baris dari belakang ke depan, yang tinggi di belakang.
// surf.userData: { r } untuk meja bundar atau { w, d } untuk meja persegi; maxH = tinggi bebas.
// items: [{ id, size:[w,h,d] }]  →  { ok, place: { id: [x, z] }, fail: [id], used (0..1) }
export function packSurface(surf, items, gap = 0.035) {
  const u = surf.userData, round = !!u.r, R = u.r, W = round ? 2 * R : u.w, D = round ? 2 * R : u.d, M = 0.03;
  const list = [...items].sort((a, b) => b.size[1] - a.size[1]);
  const place = {}, fail = [];
  const chord = (z0, z1) => round ? 2 * Math.sqrt(Math.max(0, (R - M) ** 2 - Math.max(z0 * z0, z1 * z1))) : W - 2 * M;
  const zMax = D / 2 - M;
  let zFree = -D / 2 + M, row = [], rowZ = zFree, rowD = 0;
  const widthOf = list => list.reduce((s, q) => s + q.size[0], 0) + gap * Math.max(0, list.length - 1);
  // cari posisi baris paling belakang (≥ zFree) yang cukup lebar untuk daftar ini
  const findZ = (list, nd) => { const need = widthOf(list); for (let zz = zFree; zz + nd <= zMax + 1e-6; zz += 0.005) if (need <= chord(zz, zz + nd) + 1e-6) return zz; return null; };
  const flush = () => { if (!row.length) return; let x = -widthOf(row) / 2; row.forEach(it => { place[it.id] = [x + it.size[0] / 2, rowZ + rowD / 2]; x += it.size[0] + gap; }); zFree = rowZ + rowD + gap; row = []; rowD = 0; };
  for (const it of list) {
    const [w, h, d] = it.size;
    if (u.maxH && h > u.maxH) { fail.push(it.id); continue; }
    const cand = [...row, it], nd = Math.max(rowD, d), zz = findZ(cand, nd);
    if (zz !== null) { row = cand; rowD = nd; rowZ = zz; continue; }
    flush();
    const z2 = findZ([it], d);
    if (z2 !== null) { row = [it]; rowD = d; rowZ = z2; continue; }
    fail.push(it.id);   // tidak muat di meja ini
  }
  flush();
  const area = round ? Math.PI * R * R : W * D, used = items.filter(it => place[it.id]).reduce((s, it) => s + it.size[0] * it.size[2], 0) / area;
  return { ok: fail.length === 0, place, fail, used };
}

/* ---------- rak showcase ---------- */
// Rak terbuka di depan panel dinding abu & gelap. Di belakang sofa rak dipasang di dinding mulai 0,92 m
// (supaya tidak tertutup sandaran sofa); di tempat lapang rak berdiri dari lantai.
export function buildShowcase(root, wallPanels, { HX, blocked }) {
  const wood = new THREE.MeshStandardMaterial({ name: 'showcase_oak', color: '#c9a77c', roughness: 0.5 });
  const dark = new THREE.MeshStandardMaterial({ name: 'showcase_frame', color: '#2b2522', roughness: 0.45 });
  const led = new THREE.MeshBasicMaterial({ name: 'showcase_led', color: new THREE.Color(1.0, 0.9, 0.72), toneMapped: false });
  const comps = [], DEP = 0.3, T = 0.02;
  wallPanels.forEach((wp, bi) => {
    if (wp.type !== 'grey' && wp.type !== 'dark' && !(wp.type === 'slat' && wp.side === 'W')) return;
    const zc = wp.zc, zA = zc - wp.w / 2, zB = zc + wp.w / 2;
    if (blocked.skip(wp.side, zA, zB)) return;
    const wall = blocked.wall(wp.side, zA, zB);              // true = di belakang perabot → dipasang tinggi
    const levels = wall ? [0.92, 1.35, 1.78, 2.21, 2.64] : [0.1, 0.53, 0.96, 1.39, 1.82, 2.25];
    const g = new THREE.Group(); g.name = 'showcase_bay_' + bi;
    g.position.set(wp.side === 'E' ? HX - 0.035 : -HX + 0.035, 0, zc); g.rotation.y = wp.side === 'E' ? -Math.PI / 2 : Math.PI / 2;
    const w = wp.w - 0.02, parts = { wood: [], dark: [], led: [] };
    const B = (k, bw, bh, bd, x, y, z) => { const geo = new THREE.BoxGeometry(bw, bh, bd); geo.translate(x, y, z); parts[k].push(geo); };
    const y0 = levels[0], y1 = levels[levels.length - 1];
    [-1, 1].forEach(s => B('wood', T, y1 - y0 + T, DEP, s * (w / 2 - T / 2), (y0 + y1) / 2, DEP / 2));
    B('dark', w, y1 - y0, 0.01, 0, (y0 + y1) / 2, 0.005);   // panel belakang gelap supaya produk menonjol
    levels.forEach((y, i) => { B('wood', w - 2 * T, T, DEP, 0, y, DEP / 2); if (i) B('led', w - 2 * T - 0.04, 0.006, 0.012, 0, y - T / 2 - 0.004, DEP - 0.02); });
    if (!wall) B('dark', w, 0.1, DEP - 0.02, 0, 0.05, DEP / 2 - 0.01);
    for (const k in parts) if (parts[k].length) { const m = new THREE.Mesh(mergeGeometries(parts[k]), k === 'wood' ? wood : k === 'dark' ? dark : led); m.name = 'showcase_' + k; m.castShadow = false; m.receiveShadow = true; g.add(m); }
    root.add(g);
    for (let i = 0; i < levels.length - 1; i++) {
      const a = new THREE.Object3D(); a.name = 'shelf_slot'; a.position.set(0, levels[i] + T / 2, DEP * 0.55); g.add(a);
      comps.push({ a, side: wp.side, z: zc, level: i, y: levels[i], w: w - 2 * T - 0.04, h: levels[i + 1] - levels[i] - T - 0.03, d: DEP - 0.04, wall });
    }
  });
  return comps;
}

// Isi kompartemen rak berurutan (per dinding). Produk diperkecil bila lebih besar dari kompartemen.
// items: [{ id, size, side }]  →  { place: { id: { comp, x, k } }, fail: [id] }
export function fillShelves(comps, items, gap = 0.04) {
  const order = { E: comps.filter(c => c.side === 'E'), W: comps.filter(c => c.side === 'W') };
  // urutan isi: baris setinggi mata di semua rak dulu (menyebar sepanjang dinding), lalu baris di atas/bawahnya
  const eye = c => Math.round(Math.abs(c.y + c.h / 2 - 1.3) / 0.3);
  ['E', 'W'].forEach(k => order[k].sort((p, q) => eye(p) - eye(q) || p.z - q.z));
  const fill = new Map(comps.map(c => [c, 0]));
  const place = {}, fail = [];
  const fit = (c, it) => { const [w, h, d] = it.size, k = Math.min(1, c.h / h, c.d / d, c.w / w); return { k, w: w * k }; };
  for (const it of items) {
    let done = false;
    for (const side of [it.side, it.side === 'E' ? 'W' : 'E']) {
      for (const c of order[side]) {
        const f = fit(c, it), used = fill.get(c);
        if (used + f.w + (used ? gap : 0) <= c.w + 1e-6) { const x = -c.w / 2 + used + (used ? gap : 0) + f.w / 2; fill.set(c, used + (used ? gap : 0) + f.w); place[it.id] = { comp: c, x, k: f.k }; done = true; break; }
      }
      if (done) break;
    }
    if (!done) fail.push(it.id);
  }
  // ratakan isi tiap kompartemen ke tengah
  const byComp = new Map(); Object.entries(place).forEach(([id, p]) => { byComp.has(p.comp) || byComp.set(p.comp, []); byComp.get(p.comp).push(p); });
  byComp.forEach((ps, c) => { const sh = (c.w - fill.get(c)) / 2; ps.forEach(p => { p.x += sh; }); });
  return { place, fail };
}
