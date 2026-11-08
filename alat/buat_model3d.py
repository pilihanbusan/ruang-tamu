# Membuat data/model3d.js dari alat/spek_model.py + warna dominan foto (photos/cut/*.webp).
# Pakai:  python3 alat/buat_model3d.py
import json, os, sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from spek_model import SPEK
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def colours(path, k=3):
    a = np.array(Image.open(path).convert('RGBA')); px = a[a[:, :, 3] > 200][:, :3].astype(float)
    if len(px) < 50: return []
    rng = np.random.default_rng(0); pts = px[rng.choice(len(px), min(4000, len(px)), replace=False)]
    C = pts[rng.choice(len(pts), k, replace=False)]
    for _ in range(15):
        l = ((pts[:, None] - C[None]) ** 2).sum(-1).argmin(1)
        C = np.array([pts[l == j].mean(0) if (l == j).any() else C[j] for j in range(k)])
    order = np.bincount(l, minlength=k).argsort()[::-1]
    return ['#%02x%02x%02x' % tuple(int(v) for v in C[j]) for j in order]
out = {}
for pid, sp in SPEK.items():
    d = {k: v for k, v in sp.items() if k != 's'}
    d['s'] = [round(v / 100, 4) for v in sp['s']]
    cut = os.path.join(ROOT, 'photos/cut', pid + '.webp')
    if os.path.exists(cut) and 'c' not in d: d['c'] = colours(cut)
    out[pid] = d
js = ('// Dibuat otomatis oleh alat/buat_model3d.py — ubah alat/spek_model.py lalu jalankan ulang.\n'
      '// t = jenis bentuk, s = [lebar, tinggi, tebal] dalam meter, n = jumlah varian, m = bahan, c = warna dominan foto.\n'
      'window.MODEL3D = {\n' + ''.join(f'  {json.dumps(k)}: {json.dumps(v, separators=(",", ":"))},\n' for k, v in out.items()) + '};\n')
open(os.path.join(ROOT, 'data/model3d.js'), 'w').write(js)
print(len(out), 'model')
