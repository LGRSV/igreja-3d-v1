#!/usr/bin/env python3
"""Integra as funções room*(ctx) (arquivos rooms/*.js) no igreja3d-card.js.
Uso: python3 integrate_rooms.py [pasta-com-os-arquivos]   (padrão: ./rooms)
Cada arquivo rooms/<chave>.js deve conter só `function room<Nome>(ctx) { … }`.
Funções sem arquivo na pasta continuam como estão no cartão (stub ou versão anterior)."""
import re, sys
from pathlib import Path
ROOMS = {  # arquivo -> (nome da função, seed)
    'templo_palco': ('roomTemploPalco', 21), 'templo_plateia': ('roomTemploPlateia', 22), 'hall_familia': ('roomHallFamilia', 23),
    'ala_direita': ('roomAlaDireita', 24), 'administrativo': ('roomAdministrativo', 25), 'servico_patio': ('roomServicoPatio', 26),
    'fachada': ('roomFachada', 27),
}
src_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parent / 'rooms'
card = Path(__file__).parent / 'igreja3d-card.js'
s = card.read_text(encoding='utf-8')
m = re.search(r'// @rooms-begin\n(.*?)// @rooms-end', s, re.S)
if not m: sys.exit('!! marcadores @rooms-begin/@rooms-end não encontrados no cartão')
current = m.group(1)

def extract(code, fn):
    """Recorta `function fn(ctx) { … }` (chaves balanceadas, ignorando strings/comentários)."""
    i = code.find(f'function {fn}(')
    if i < 0: return None
    j = code.index('{', code.index(')', i)); depth = 0; k = j; n = len(code); st = None
    while k < n:
        c = code[k]
        if st:
            if c == '\\': k += 2; continue
            if c == st: st = None
        elif code.startswith('//', k): k = code.find('\n', k); k = n if k < 0 else k; continue
        elif code.startswith('/*', k): k = code.index('*/', k) + 2; continue
        elif c in '\'"`': st = c
        elif c == '{': depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0: return code[i:k + 1]
        k += 1
    return None

funcs, done = [], []
for key, (fn, seed) in ROOMS.items():
    f = src_dir / f'{key}.js'
    code = None
    if f.exists():
        txt = f.read_text(encoding='utf-8').strip()
        if f'function {fn}(' not in txt: print(f'!! {f.name}: não define {fn}')
        else: code = txt; done.append(key)
    if code is None:
        code = extract(current, fn) or f'function {fn}(ctx) {{}}'
    funcs.append(code)
    pat = re.compile(r'(    // @room ' + key + r'\n)(.*?)(    // @endroom\n)', re.S)
    s, n = pat.subn(lambda mm: mm.group(1) + f'    {fn}(ctx({seed}));\n' + mm.group(3), s)
    if not n: print(f'!! marcador @room {key} não encontrado')
block = '// @rooms-begin\n' + '\n\n'.join(funcs) + '\n// @rooms-end'
s = re.sub(r'// @rooms-begin\n.*?// @rooms-end', lambda mm: block, s, flags=re.S)
card.write_text(s, encoding='utf-8')
print('integrados:', ', '.join(done) or 'nenhum')
