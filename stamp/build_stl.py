# Builds a printable stamp: base disc + mirrored raised design + handle. Units: mm.
import os, re, numpy as np
from svgpathtools import parse_path
from shapely.geometry import Polygon, Point, LineString
from shapely.ops import unary_union
from shapely import affinity
import manifold3d as m3
from design import svg

S = 0.1                     # 1 SVG unit = 0.1 mm
RELIEF, BASE_T, BASE_R = 1.5, 3.0, 11.0
src = svg()
stroke_part, fill_part = src.split('stroke="none"')

def pts(d, n=400):
    p = parse_path(d)
    return [(z.real, z.imag) for z in (p.point(t) for t in np.linspace(0, 1, n))]

shapes = []
for d in re.findall(r'<path d="([^"]+)"', stroke_part):
    shapes.append(LineString(pts(d)).buffer(4, quad_segs=16))            # 0.8 mm line
shapes.append(Point(100, 100).buffer(96).difference(Point(100, 100).buffer(88)))  # ring
for d in re.findall(r'<path d="([^"]+)"', fill_part):
    shapes.append(Polygon(pts(d)).buffer(0))
art = unary_union(shapes)
# SVG y points down; flip y to get the impression as seen, then mirror x for the stamp face
art = affinity.scale(art, xfact=-S, yfact=-S, origin=(100, 100))
art = affinity.translate(art, -100, -100)
art = art.simplify(0.01)

def to_cs(geom):
    # One cross-section per polygon, then union: an even-odd fill across all loops
    # would treat everything inside the ring as a hole.
    out = None
    for g in getattr(geom, 'geoms', [geom]):
        loops = [list(g.exterior.coords)[:-1]] + [list(i.coords)[:-1] for i in g.interiors]
        cs = m3.CrossSection(loops, m3.FillRule.EvenOdd)
        out = cs if out is None else out + cs
    return out

relief = to_cs(art).extrude(RELIEF).translate((0, 0, BASE_T))
base = m3.Manifold.cylinder(BASE_T, BASE_R, BASE_R, 128)
handle = m3.Manifold.cylinder(14, 5.5, 7.5, 96).translate((0, 0, -14))   # tapered knob, wider at top
knob = m3.Manifold.sphere(7.5, 96).scale((1, 1, 0.45)).translate((0, 0, -14))
# Flat top on the knob (about 10 mm across) so the stamp stands on it, design facing up
knob = knob.trim_by_plane((0, 0, 1), -16.5)
stamp = base + relief + handle + knob
mesh = stamp.to_mesh()
import trimesh
t = trimesh.Trimesh(mesh.vert_properties[:, :3], mesh.tri_verts)
print('watertight', t.is_watertight, 'bounds', t.bounds.round(2).tolist(), 'tris', len(t.faces))
t.export(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'stamp-20mm.stl'))
# preview render of the stamp face
