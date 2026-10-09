# Potter's stamp (maker's mark)

A simplified fig tree with three figs and Cate's initials, C and P, 20 mm across. Lines are 0.8 mm, the thinnest that presses cleanly into clay.

| File | Use |
|---|---|
| `stamp-preview.png` / `stamp-impression-preview.svg` | What the mark looks like pressed into clay |
| `stamp-laser-mirrored-20mm.svg` | **Send this one to the makerspace.** Mirrored so the impression reads the right way round. 20 mm at true size. |
| `stamp-20mm.stl` / `stamp-3d-render.png` | **3D model for resin printing.** 22 mm disc, 3 mm thick, design raised 1.5 mm and already mirrored, with a 14 mm tapered knob handle. Print with the design facing up or flat on the bed as the makerspace prefers. Ask them to wash and fully cure it before use. |
| `stamp-not-mirrored-20mm.svg` | Unmirrored, for anyone whose machine mirrors it for you (ask first) |

When ordering, tell them: the black areas should stand up as raised relief (about 1.5 mm deep), on a base with a small handle or knob. `design.py` draws the mark and `build_stl.py` turns it into the 3D model (needs `pip install manifold3d shapely svgpathtools trimesh`).

Makerspace details are in the main README under "Potter's stamp".
