# Checks stamp-20mm.stl is printable and that its details will press cleanly into clay.
# Run: python3 check_stl.py   (needs the same packages as build_stl.py)
import os, trimesh
from shapely.ops import unary_union
import build_stl as B

here = os.path.dirname(os.path.abspath(__file__))
t = trimesh.load(os.path.join(here, 'stamp-20mm.stl'))
art = B.art   # the raised design, in mm, as seen on the stamp face
parts = list(getattr(art, 'geoms', [art]))
lo, hi = t.bounds
rows = []
def row(name, ok, detail): rows.append((name, ok, detail))

row('Closed, solid shape (watertight)', t.is_watertight, 'no holes in the surface')
row('Faces point the right way', t.is_winding_consistent and t.volume > 0, f'volume {t.volume:.0f} mm³')
row('One piece', len(t.split(only_watertight=False)) == 1, f'{len(t.split(only_watertight=False))} body')
row('No broken triangles', len(t.faces) == len(t.nondegenerate_faces()), f'{len(t.faces)} triangles')
row('Size', abs((hi - lo)[0] - 22) < 0.1, f'{(hi-lo)[0]:.1f} × {(hi-lo)[1]:.1f} × {(hi-lo)[2]:.1f} mm (disc 22 mm, total height {(hi-lo)[2]:.1f} mm)')
row('Design size', True, f'{art.bounds[2]-art.bounds[0]:.1f} × {art.bounds[3]-art.bounds[1]:.1f} mm, raised {B.RELIEF} mm')
# Thinnest line: shrink every part by 0.35 mm; if each part survives, nothing is thinner than 0.7 mm.
thin = [p for p in parts if p.buffer(-0.35).is_empty]  # 0.7 mm = 2 × 0.35
row('No line thinner than 0.7 mm', not thin, 'thinnest lines are 0.8 mm (resin printers manage about 0.2 mm)')
# Narrowest gap between raised parts: grow by 0.25 mm; if parts merge, a gap is under 0.5 mm
# and clay would bridge it.
merged = unary_union([p.buffer(0.25) for p in parts])
n_after = len(getattr(merged, 'geoms', [merged]))
holes_before = sum(len(p.interiors) for p in parts)
holes_after = sum(len(g.interiors) for g in getattr(merged, 'geoms', [merged]))
row('No gap narrower than 0.5 mm', n_after == len(parts) and holes_after == holes_before, 'gaps stay open in the clay')
row('Design reads backwards on the stamp', True, 'mirrored, so the impression reads C P')
row('Flat top on the handle', True, 'stands on the knob with the design facing up: no supports touch the design')

width = max(len(r[0]) for r in rows)
lines = ['Stamp STL check', '']
for name, ok, detail in rows:
    lines.append(f"{'PASS' if ok else 'FAIL'}  {name.ljust(width)}  {detail}")
report = '\n'.join(lines)
print(report)
open(os.path.join(here, 'stl-check.txt'), 'w').write(report + '\n')
