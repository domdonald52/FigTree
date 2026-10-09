# Cate's potter's stamp: simplified fig tree with C and P, 20 mm across (1 unit = 0.1 mm)
STROKE = 8
# Each curl's tail stops short so the eye of the curl stays at least 0.5 mm open:
# narrower than that, clay fills it and the curl prints as a blob.
CURL_END = 0.94   # 0.8 mm lines: the thinnest that presses cleanly into clay
def fig(x, y, s=1):
    """A fig hanging from (x, y): short stem, then a teardrop. s scales it."""
    f = lambda dx, dy: f'{x+dx*s:g} {y+dy*s:g}'
    return (f'M{f(0,0)} L{f(0,6)} C{f(4,10)} {f(7,13)} {f(7,18)} '
            f'A{7*s:g} {7*s:g} 0 0 1 {f(-7,18)} C{f(-7,13)} {f(-4,10)} {f(0,6)} Z')
def branch(d, end=CURL_END):
    from svgpathtools import parse_path
    return parse_path(d).cropped(0, end).d()
def svg(mirror=False, ink='#1C1C1A', size='20mm', bg=None):
    flip = ' transform="translate(200 0) scale(-1 1)"' if mirror else ''
    b = f'<rect width="200" height="200" fill="{bg}"/>' if bg else ''
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 200 200">{b}
<g{flip} fill="none" stroke="{ink}" stroke-width="{STROKE}" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="100" cy="100" r="92"/>
  <!-- branches -->
  <path d="{branch('M98 104 C86 94 68 90 54 96 C42 101 42 118 55 118 C63 118 65 109 59 106')}"/>
  <path d="{branch('M102 102 C116 92 134 88 148 94 C160 99 160 116 147 116 C139 116 137 107 143 104')}"/>
  <path d="{branch('M99 99 C95 82 86 66 72 58 C62 53 51 62 57 71 C61 77 69 74 68 68')}"/>
  <path d="{branch('M101 98 C107 80 117 64 131 56 C141 51 152 60 146 69 C142 75 134 72 135 66')}"/>
  <path d="{branch('M100 98 C100 80 101 62 104 46 C106 35 119 35 119 43 C119 49 113 50 112 46', 0.88)}"/>
  <!-- C and P -->
  <path d="M74 133 A14 14 0 1 0 74 155"/>
  <path d="M130 158 V128 H138 A9 9 0 0 1 138 146 H130"/>
</g>
<g{flip} fill="{ink}" stroke="none">
  <!-- trunk -->
  <path d="M90 164 C95 142 96 122 96.5 100 L103.5 100 C104 122 105 142 110 164 Z"/>
  <!-- figs, hanging on short stems -->
  <path d="M80 92 L80 98 C84 102 87 105 87 110 A7 7 0 0 1 73 110 C73 105 76 102 80 98 Z"/>
  <path d="M122 88 L122 94 C126 98 129 101 129 106 A7 7 0 0 1 115 106 C115 101 118 98 122 94 Z"/>
  <path d="{fig(119, 66, 0.7)}"/>
</g>
</svg>'''
if __name__ == '__main__':
    open('preview.svg','w').write(svg(size='400px', bg='#FBFAF7'))
