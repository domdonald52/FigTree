# Potter's stamp (maker's mark)

A simplified fig tree with three figs and Cate's initials, C and P, 20 mm across. Lines are 0.8 mm, the thinnest that presses cleanly into clay.

| File | Use |
|---|---|
| `stamp-preview.png` / `stamp-impression-preview.svg` | What the mark looks like pressed into clay |
| `stamp-laser-mirrored-20mm.svg` | **Send this one to the makerspace.** Mirrored so the impression reads the right way round. 20 mm at true size. |
| `stamp-20mm.stl` / `stamp-3d-render.png` | **3D model for resin printing.** 22 mm disc, 3 mm thick, design raised 1.5 mm and already mirrored, with a tapered knob handle (21 mm tall overall). The knob has a flat top, so it can print standing on it with the design facing up and no supports touching the design. Ask them to wash and fully cure it before use. |
| `stl-check.txt` | The latest result of `check_stl.py` (see below) |
| `stamp-not-mirrored-20mm.svg` | Unmirrored, for anyone whose machine mirrors it for you (ask first) |

When ordering, tell them: the black areas should stand up as raised relief (about 1.5 mm deep), on a base with a small handle or knob. `design.py` draws the mark and `build_stl.py` turns it into the 3D model (needs `pip install manifold3d shapely svgpathtools trimesh`).

Makerspace details are in the main README under "Potter's stamp".

## Checking the STL before sending it

1. **Run the checks:** `python3 check_stl.py` (from this folder). It rebuilds the model and confirms it is a closed, solid, single piece with no broken triangles, the right size, no line thinner than 0.7 mm, and no gap narrower than 0.5 mm (narrower gaps fill with clay). The result is saved to `stl-check.txt`; every line should say PASS.
2. **Look at it yourself:** open `stamp-20mm.stl` in a free viewer, e.g. Windows *3D Viewer*, macOS *Preview*, or drag it into [viewstl.com](https://www.viewstl.com). Check the face reads backwards (mirrored) and the size is 22 mm.
3. **Optional, in a slicer:** load it into a free resin slicer such as *Lychee* or *Chitubox* (or *PrusaSlicer*) with the design facing up. It should report no errors and need no supports on the design.
4. **When you submit the job,** say: resin print, 22 mm stamp, print standing on the flat top of the knob with the design facing up, no supports on the design face, wash and fully cure. Ask for the quote to include one print first, so Cate can test it in clay before ordering more.
