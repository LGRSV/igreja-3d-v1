function roomHallFamilia(ctx) {
  // ---------------------------------------------------------------------------
  // HALL DE ENTRADA (x 4,0–16,05 · z 44,0–49,65) + SALA DA FAMÍLIA (x 0–4,0 ·
  // z 46,3–49,65) + WC (x 0–1,9) e WC PCD (x 1,9–4,0) · z 44,0–46,3.
  // Paleta da fachada: preto, ripado de madeira clara, branco e grafite, com
  // acentos âmbar/terracota. Acabamentos reais (fotos/vídeos do cliente):
  // paredes de destaque em marmorato (x = 4,0 no hall; x = 0 na Sala da Família),
  // WCs no padrão dos banheiros (v3): porcelanato cinza até 1,2 m + mármore
  // "marrom imperador" na parede da bancada / marmorato nas outras, bancada branca
  // com cuba de apoio, torneira de parede, espelho com moldura de LED e lixeira
  // inox de pedal; faixa azul-marinho no acesso aos banheiros. Sala da Família:
  // laminado (cartão) + marmorato, sofá cinza, cortina cinza, brinquedos.
  // Livres: rota porta principal → portas de vidro do templo (x 10,3–13,6),
  // vão para os banheiros (x = 16,05, z 44,4–46,0: passa por baixo do patamar
  // superior da escada), portas em x = 4,0 e a porta do WC (z = 46,3).
  // Escada em U (x 13,62–15,94 · z 44,2–49,55): lance 1 maciço subindo para +z,
  // patamar intermediário (y 1,5) junto à fachada, lance 2 de degraus soltos
  // voltando para −z e patamar/mezanino em y 3,0 sobre a passagem dos banheiros.
  // Objetos do cartão (pendentes do hall e da família, arandelas) NÃO são recriados.
  // ---------------------------------------------------------------------------
  const THREE = ctx.THREE, M = ctx.M;
  const box = (...a) => ctx.box(...a), cyl = (...a) => ctx.cyl(...a), sph = (...a) => ctx.sph(...a);
  const place = (...a) => ctx.place(...a), std = (o) => ctx.std(o), rnd = () => ctx.rnd();
  const put = (m) => { ctx.add(m); return m; };
  const G = () => new THREE.Group();
  const rot = (m, x = 0, y = 0, z = 0) => { m.rotation.set(x, y, z); return m; };
  const nc = { cast: false };

  // Materiais locais (mesmas opções → mesmo material → menos draw calls)
  const slat     = std({ color: 0xd3b08e, roughness: 0.7 });                      // ripado madeira clara (tom da fachada)
  const felt     = std({ color: 0x19191b, roughness: 1 });                        // fundo preto do ripado
  const black    = std({ color: 0x141416, roughness: 0.45, metalness: 0.45 });    // metal preto
  const quartz   = std({ color: 0x1d1d20, roughness: 0.25, metalness: 0.1 });     // tampo preto
  const mass     = std({ color: 0x3a3b3f, roughness: 0.8 });                      // grafite (escada maciça)
  const uphol    = std({ color: 0x55585f, roughness: 0.97 });                     // estofado grafite
  const terra    = std({ color: 0xa65a3a, roughness: 0.95 });                     // terracota
  const amber    = std({ color: 0xc98a3c, roughness: 0.6, metalness: 0.2 });
  const caramel  = std({ color: 0x9a6a44, roughness: 0.85 });                     // couro caramelo
  const potBlack = std({ color: 0x1c1c1e, roughness: 0.55 });
  const frond    = std({ color: 0x2f5a2a, roughness: 0.9 });
  const frond2   = std({ color: 0x3d6e34, roughness: 0.9 });
  const trunk    = std({ color: 0x5b4632, roughness: 1 });
  const pebble   = std({ color: 0xe9e7e1, roughness: 0.9 });
  const ceramic  = std({ color: 0xf4f4f2, roughness: 0.3 });
  const paper    = std({ color: 0xf6f1e6, roughness: 0.9 });
  const coffee   = std({ color: 0x3b2417, roughness: 0.4 });
  // LED âmbar (degraus, balcão, testeira): material próprio (não compartilhado com outras salas),
  // aceso junto com a luz do hall
  const ledWarm  = new THREE.MeshStandardMaterial({ color: 0xffd9a0, emissive: 0xffb866, emissiveIntensity: 0.9, roughness: 0.5 });
  ctx.bindEmissive('hall', ledWarm, 1.0, { min: 0.1 });
  const frost    = std({ color: 0xf1f3f4, roughness: 0.85, transparent: true, opacity: 0.55 });   // vidro jateado
  const rugHall  = std({ color: 0x4a4b50, roughness: 1 });
  const rugEdge  = std({ color: 0x8a6a4c, roughness: 1 });
  const mat      = std({ color: 0x232325, roughness: 1 });
  // Sala da família
  const cream    = std({ color: 0xe9e1d3, roughness: 0.95 });
  const woodLt   = std({ color: 0xd8b98f, roughness: 0.7 });
  const whiteF   = std({ color: 0xf1efea, roughness: 0.6 });
  const wicker   = std({ color: 0xb9925a, roughness: 0.95 });
  const net      = std({ color: 0xf4f1ea, roughness: 1, transparent: true, opacity: 0.42 });
  const toys     = [0xe0574a, 0xf2b53a, 0x4f9bd9, 0x5bb36a, 0x9a6ad0, 0xf08fb0].map((c) => std({ color: c, roughness: 0.6 }));
  const eva      = [0xf2c14e, 0x7cc4e8, 0x9fd49a, 0xf4a3a0].map((c) => std({ color: c, roughness: 0.95 }));
  const fabricG  = std({ color: 0x8e9095, roughness: 0.97 });                     // sofá cinza (igual ao voluntariado)
  const fabricD  = std({ color: 0x55575c, roughness: 0.97 });                     // almofada cinza-escuro
  const mustard  = std({ color: 0xd9a53a, roughness: 0.95 });                     // almofada/manta mostarda
  const curtain  = std({ color: 0xcfcdc8, roughness: 1 });                        // cortina cinza-claro
  // Acabamentos reais do cartão (padrão em espaço de mundo: NÃO clonar, só reusar)
  const MARM = M.marmorato, PORC = M.porcelanatoCinza, MARR = M.marmoreMarrom;
  // WCs
  const grabBar  = std({ color: 0xd9dde1, roughness: 0.25, metalness: 0.85 });
  const alarm    = std({ color: 0xc4201b, roughness: 0.4 });
  const quartzW  = std({ color: 0xefeae0, roughness: 0.28 });                     // bancada de quartzo branco
  const basinIn  = std({ color: 0xdedcd6, roughness: 0.2 });                      // fundo da cuba
  const navy     = std({ color: 0x1b2d4f, roughness: 0.7 });                      // faixa azul-marinho (acesso aos banheiros)
  // moldura de LED dos espelhos (luz fria, v3) — acende com a luz dos banheiros
  const ledCool  = new THREE.MeshStandardMaterial({ color: 0xd8f7ff, emissive: 0x7fe6ff, emissiveIntensity: 1.1, roughness: 0.4 });
  ctx.bindEmissive('banheiros', ledCool, 1.3, { min: 0.12 });

  // ------------------------------------------------------------ utilidades
  // Funde várias caixas numa só geometria (ripados etc.) — item: [w, h, d, x, y, z, rx, ry, rz]
  const mergeBoxes = (list, material, cast = true) => {
    const pos = [], nor = [], uv = [];
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s1 = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
    for (const [w, h, d, x, y, z, rx = 0, ry = 0, rz = 0] of list) {
      const g = new THREE.BoxGeometry(w, h, d).toNonIndexed();
      g.applyMatrix4(m4.compose(p.set(x, y, z), q.setFromEuler(e.set(rx, ry, rz)), s1));
      for (const v of g.attributes.position.array) pos.push(v);
      for (const v of g.attributes.normal.array) nor.push(v);
      for (const v of g.attributes.uv.array) uv.push(v);
      g.dispose();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.computeBoundingSphere();
    const m = new THREE.Mesh(geo, material); m.castShadow = cast; m.receiveShadow = true; return m;
  };
  // Quadrilátero plano (painéis de vidro inclinados da escada)
  const quad = (a, b, c, d, material) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], 2));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, material); m.castShadow = false; m.receiveShadow = false; return m;
  };
  // Barra cilíndrica entre dois pontos (corrimãos, barras de apoio)
  const up = new THREE.Vector3(0, 1, 0);
  const bar = (x1, y1, z1, x2, y2, z2, r, material, seg = 8) => {
    const a = new THREE.Vector3(x1, y1, z1), b = new THREE.Vector3(x2, y2, z2);
    const m = cyl(r, r, a.distanceTo(b), material, (x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2, seg);
    m.quaternion.setFromUnitVectors(up, b.sub(a).normalize()); return m;
  };
  // Placa com textura de canvas (letreiros e telas). aspect = largura/altura da placa;
  // o canvas do makeTex é quadrado, então o desenho é feito num espaço virtual
  // (largura × altura) e esticado para caber — na placa ele volta à proporção certa.
  const canvasMat = (aspect, draw, glow = 0.8, transparent = false) => {
    const tex = ctx.makeTex(1024, (g, s) => {
      const W = aspect >= 1 ? s : s * aspect, Hh = aspect >= 1 ? s / aspect : s;
      g.save(); g.scale(s / W, s / Hh); draw(g, W, Hh); g.restore();
    });
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    return new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: glow, roughness: 0.5, transparent, alphaTest: transparent ? 0.02 : 0 });
  };
  const plane = (w, h, material, x, y, z, ry = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
    m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = false; m.receiveShadow = false; return put(m);
  };
  // Plano que mostra só uma faixa (linhas v0–v1) de uma textura-atlas
  const atlasPlane = (w, h, material, v0, v1, u0 = 0, u1 = 1) => {
    const g = new THREE.PlaneGeometry(w, h), uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) { uv.setY(i, uv.getY(i) > 0.5 ? v1 : v0); uv.setX(i, uv.getX(i) > 0.5 ? u1 : u0); }
    uv.needsUpdate = true;
    const m = new THREE.Mesh(g, material); m.castShadow = false; m.receiveShadow = false; return m;
  };
  // Revestimento de parede (12 mm) colado na face f de uma parede. axis 'x' = parede com x fixo (corre em z),
  // 'z' = parede com z fixo (corre em x); dir = lado do ambiente (±1); a–b = trecho ao longo da parede; y0–y1.
  const CL = 0.012;
  const clad = (axis, f, dir, a, b, y0, y1, material) => {
    if (b - a < 0.01 || y1 - y0 < 0.01) return null;
    const c = f + dir * CL / 2, m = (a + b) / 2, y = (y0 + y1) / 2;
    return put(axis === 'x' ? box(CL, y1 - y0, b - a, material, c, y, m, nc) : box(b - a, y1 - y0, CL, material, m, y, c, nc));
  };
  // Parede de banheiro no padrão real: porcelanato cinza até 1,2 m + (mármore marrom | marmorato) em cima.
  // cuts = vãos [a, b] (portas, já com a folga de 0,1 m); acima de yTop do vão o revestimento superior continua.
  const wcWall = (axis, f, dir, a, b, upper, y0 = 0.09, cuts = [], yCut = 2.28) => {
    let cur = a;
    for (const [ca, cb] of cuts) { clad(axis, f, dir, cur, ca, y0, 1.2, PORC); clad(axis, f, dir, cur, ca, 1.2, 2.99, upper); cur = cb; }
    clad(axis, f, dir, cur, b, y0, 1.2, PORC); clad(axis, f, dir, cur, b, 1.2, 2.99, upper);
    for (const [ca, cb] of cuts) clad(axis, f, dir, ca, cb, yCut, 2.99, upper);
    // filete de acabamento (inox escovado) na junta das duas placas
    let c2 = a;
    for (const [ca, cb] of cuts) { if (ca - c2 > 0.02) put(axis === 'x' ? box(0.006, 0.008, ca - c2, M.steel, f + dir * (CL + 0.002), 1.2, (c2 + ca) / 2, nc) : box(ca - c2, 0.008, 0.006, M.steel, (c2 + ca) / 2, 1.2, f + dir * (CL + 0.002), nc)); c2 = cb; }
    if (b - c2 > 0.02) put(axis === 'x' ? box(0.006, 0.008, b - c2, M.steel, f + dir * (CL + 0.002), 1.2, (c2 + b) / 2, nc) : box(b - c2, 0.008, 0.006, M.steel, (c2 + b) / 2, 1.2, f + dir * (CL + 0.002), nc));
  };
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const FONT = '"Montserrat","Helvetica Neue",Arial,sans-serif';

  // ======================= BUILDERS (origem no centro da base; frente = +z) =======================
  // Cica (Cycas revoluta) em vaso preto alto — como as da fachada
  const cycas = (potH = 0.75, span = 0.62, seed = 1) => {
    const g = G(); let k = seed * 7.13;
    const r2 = () => { k = (k * 9301 + 49297) % 233280; return k / 233280; };
    g.add(cyl(0.19, 0.15, potH, potBlack, 0, potH / 2, 0, 16));
    g.add(cyl(0.175, 0.175, 0.02, M.soil, 0, potH - 0.02, 0, 14));
    g.add(cyl(0.07, 0.09, 0.22, trunk, 0, potH + 0.1, 0, 10));
    const n = 11;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r2() * 0.3, len = span * (0.8 + r2() * 0.35), tilt = 0.55 + r2() * 0.5;
      const pv = G(); pv.position.set(0, potH + 0.2, 0); pv.rotation.y = a;
      const f = box(0.14, 0.012, len, i % 2 ? frond : frond2, 0, Math.sin(tilt) * len / 2, Math.cos(tilt) * len / 2);
      f.rotation.x = -tilt; f.castShadow = true; pv.add(f); g.add(pv);
    }
    return g;
  };
  // Planta grande (tipo ficus-lira) em vaso preto cilíndrico
  const bigPlant = (h = 1.8, spread = 0.32, seed = 2) => {
    const g = G(); let k = seed * 3.7;
    const r2 = () => { k = (k * 9301 + 49297) % 233280; return k / 233280; };
    g.add(cyl(0.21, 0.18, 0.55, potBlack, 0, 0.275, 0, 16));
    g.add(cyl(0.195, 0.195, 0.02, M.soil, 0, 0.535, 0, 14));
    g.add(cyl(0.025, 0.035, h - 0.7, trunk, 0, 0.55 + (h - 0.7) / 2, 0, 8));
    for (let i = 0; i < 7; i++) {
      const a = r2() * Math.PI * 2, rr2 = spread * (0.35 + r2() * 0.65), y = 1.0 + (i / 6) * (h - 1.1);
      const s = sph(0.2 + r2() * 0.08, i % 2 ? frond : frond2, Math.cos(a) * rr2, y, Math.sin(a) * rr2);
      s.scale.set(1, 0.75, 1); g.add(s);
    }
    return g;
  };
  // Poltrona moderna (encosto em −z)
  const armchair = (fab, cush) => {
    const g = G();
    g.add(box(0.74, 0.26, 0.74, fab, 0, 0.28, 0));
    g.add(box(0.74, 0.44, 0.16, fab, 0, 0.63, -0.29));
    for (const sx of [-1, 1]) g.add(box(0.12, 0.2, 0.74, fab, sx * 0.31, 0.51, 0));
    g.add(box(0.48, 0.1, 0.54, M.cushion, 0, 0.46, 0.06));
    if (cush) g.add(rot(box(0.34, 0.32, 0.09, cush, 0, 0.66, -0.17), -0.18, 0.1));
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(cyl(0.014, 0.01, 0.15, black, sx * 0.31, 0.075, sz * 0.31, 6));
    return g;
  };
  // Sofá 3 lugares grafite (encosto em −z)
  const sofa3 = (w) => {
    const g = G();
    g.add(box(w, 0.26, 0.84, uphol, 0, 0.28, 0));
    g.add(box(w, 0.46, 0.18, uphol, 0, 0.64, -0.33));
    for (const sx of [-1, 1]) g.add(box(0.14, 0.24, 0.84, uphol, sx * (w / 2 - 0.07), 0.53, 0));
    const n = 3, cw = (w - 0.28) / n;
    for (let i = 0; i < n; i++) g.add(box(cw - 0.03, 0.1, 0.6, M.cushion, -w / 2 + 0.14 + cw * (i + 0.5), 0.46, 0.08));
    g.add(rot(box(0.38, 0.36, 0.1, terra, -w / 2 + 0.4, 0.68, -0.18), -0.15, 0.2));
    g.add(rot(box(0.36, 0.34, 0.1, amber, w / 2 - 0.4, 0.67, -0.18), -0.15, -0.2));
    g.add(box(w - 0.1, 0.03, 0.7, black, 0, 0.135, 0));
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(cyl(0.014, 0.01, 0.13, black, sx * (w / 2 - 0.08), 0.065, sz * 0.34, 6));
    return g;
  };

  // =====================================================================
  // HALL — parede do letreiro (face do hall da parede z = 44,0)
  // =====================================================================
  const WZ = 44.075;   // face da parede templo↔hall do lado do hall
  // Planta grande ao lado do lounge (v1.4.6: o lounge foi para a parede do templo; a escada ocupa o canto da fachada)
  place(bigPlant(1.7, 0.28, 5), 8.8, 44.65);

  // Parede de destaque em MARMORATO (vídeos): face do hall da parede x = 4,0 (portas com 0,1 m de folga,
  // o revestimento continua acima delas) e o trecho da parede z = 44,0 até o pilar de x 5,2
  {
    const F4 = 4.075;
    for (const [a, b] of [[44.075, 44.3], [45.4, 46.5], [47.6, 49.563]]) clad('x', F4, 1, a, b, 0.09, 2.99, MARM);
    for (const [a, b] of [[44.3, 45.4], [46.5, 47.6]]) clad('x', F4, 1, a, b, 2.28, 2.99, MARM);
    clad('z', 44.075, 1, 4.087, 5.19, 0.09, 2.99, MARM);
  }
  // Banco de madeira ripada entre as portas da parede x = 4,0 + quadro
  {
    const S = [];
    for (let i = 0; i < 6; i++) S.push([0.055, 0.04, 1.0, 4.19 + i * 0.065, 0.45, 45.95]);
    put(mergeBoxes(S, slat));
    for (const z of [45.55, 46.35]) { put(box(0.36, 0.43, 0.04, black, 4.35, 0.215, z)); }
    put(box(0.03, 0.8, 0.95, black, 4.102, 1.55, 45.95));
    put(box(0.012, 0.7, 0.85, slat, 4.123, 1.55, 45.95, nc));
    put(box(0.014, 0.28, 0.28, felt, 4.134, 1.55, 45.95, nc));
    put(cyl(0.07, 0.07, 0.016, amber, 4.141, 1.55, 45.95, 20)).rotation.z = Math.PI / 2;
  }

  // Lounge (v1.4.6: na parede do templo, x 5,8–8,0 — a escada tomou o canto da fachada): sofá grafite de frente para o hall,
  // mesa de centro, 2 poltronas caramelo e tapete
  {
    const R = G();
    R.add(box(2.3, 0.008, 2.1, rugEdge, 0, 0.008, 0, nc));
    R.add(box(2.18, 0.01, 1.98, rugHall, 0, 0.012, 0, nc));
    place(R, 6.9, 45.7);
    place(sofa3(1.8), 6.9, 44.55, 0);
    const T2 = G();
    T2.add(cyl(0.42, 0.42, 0.04, slat, 0, 0.4, 0, 28));
    T2.add(cyl(0.34, 0.34, 0.02, black, 0, 0.12, 0, 24));
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; T2.add(cyl(0.012, 0.012, 0.38, black, Math.cos(a) * 0.3, 0.2, Math.sin(a) * 0.3, 6)); }
    T2.add(box(0.24, 0.03, 0.18, terra, -0.1, 0.435, 0.05));                    // livros
    T2.add(box(0.2, 0.025, 0.15, paper, -0.1, 0.46, 0.05));
    T2.add(cyl(0.06, 0.05, 0.12, ceramic, 0.14, 0.48, -0.08, 12));
    place(T2, 6.9, 45.75);
    place(armchair(caramel, felt), 5.85, 46.55, Math.PI - 0.32);
    place(armchair(caramel, terra), 7.95, 46.55, Math.PI + 0.32);
  }

  // Tapete redondo grafite com borda âmbar sob a mesa bistrô (v1.4.6: acompanhou o bistrô para o canto livre à direita)
  {
    const r1 = cyl(1.12, 1.12, 0.008, rugEdge, 14.7, 0.008, 47.3, 40); r1.castShadow = false; put(r1);
    const r2 = cyl(1.05, 1.05, 0.01, rugHall, 14.7, 0.012, 47.3, 40); r2.castShadow = false; put(r2);
  }

  // Café / aparador na parede da fachada (v1.4.6: x 13,35–15,55 · z 49,05–49,55, à direita da porta principal)
  {
    const X0 = 13.35, X1 = 15.55, cx = (X0 + X1) / 2, L = X1 - X0, zc = 49.3, fz = 49.563;
    put(box(L, 0.84, 0.46, black, cx, 0.46, zc));
    for (let i = 1; i < 4; i++) put(box(0.008, 0.76, 0.01, felt, X0 + (i * L) / 4, 0.46, zc + 0.232, nc));
    for (let i = 0; i < 4; i++) put(box(0.12, 0.012, 0.012, amber, X0 + ((i + 0.5) * L) / 4, 0.78, zc + 0.24));
    put(box(L, 0.04, 0.48, slat, cx, 0.9, zc));
    for (const x of [X0 + 0.08, X1 - 0.08]) put(box(0.05, 0.04, 0.05, black, x, 0.02, zc));
    // Máquina de espresso (inox) com xícara
    const ex = X0 + 0.35;
    put(box(0.42, 0.4, 0.34, M.steel, ex, 1.12, zc - 0.03));
    put(box(0.42, 0.06, 0.36, black, ex, 1.35, zc - 0.03));
    put(box(0.34, 0.12, 0.02, black, ex, 1.22, zc + 0.15, nc));
    put(cyl(0.035, 0.035, 0.05, M.chrome, ex - 0.08, 0.98, zc + 0.12, 10));
    put(cyl(0.035, 0.035, 0.05, M.chrome, ex + 0.08, 0.98, zc + 0.12, 10));
    put(cyl(0.035, 0.028, 0.06, ceramic, ex - 0.08, 0.95, zc + 0.12, 10));
    put(box(0.3, 0.012, 0.12, M.chrome, ex, 0.926, zc + 0.12));
    // Moedor
    put(box(0.16, 0.28, 0.2, black, ex + 0.36, 1.06, zc - 0.05));
    put(cyl(0.07, 0.05, 0.16, std({ color: 0x3a2a20, roughness: 0.3, metalness: 0.1, transparent: true, opacity: 0.8 }), ex + 0.36, 1.28, zc - 0.05, 12));
    // Garrafas térmicas (preta, âmbar, preta)
    [black, amber, black].forEach((mt, i) => {
      const x = cx + 0.05 + i * 0.2;
      put(cyl(0.07, 0.075, 0.3, mt, x, 1.07, zc - 0.07, 14));
      put(cyl(0.05, 0.06, 0.06, black, x, 1.25, zc - 0.07, 12));
      put(box(0.1, 0.02, 0.03, black, x, 1.29, zc - 0.07));
    });
    // Pilhas de copos, xícaras, açucareiro, guardanapos
    for (let i = 0; i < 3; i++) put(cyl(0.04, 0.03, 0.22 - i * 0.04, paper, X1 - 0.35 + i * 0.1, 1.03 - i * 0.02, zc + 0.1, 12));
    for (let i = 0; i < 4; i++) {
      const x = X1 - 0.55 + (i % 2) * 0.1, z = zc - 0.12 + Math.floor(i / 2) * 0.1;
      put(cyl(0.035, 0.028, 0.065, ceramic, x, 0.953, z, 10));
    }
    put(cyl(0.045, 0.045, 0.1, ceramic, X1 - 0.18, 0.97, zc - 0.12, 12));
    put(cyl(0.03, 0.03, 0.02, amber, X1 - 0.18, 1.03, zc - 0.12, 10));
    put(box(0.14, 0.03, 0.14, paper, X1 - 0.15, 0.935, zc + 0.08));
    put(box(0.34, 0.03, 0.24, slat, cx - 0.2, 0.935, zc + 0.08));                // bandeja com biscoitos
    for (let i = 0; i < 5; i++) put(cyl(0.028, 0.028, 0.012, caramel, cx - 0.32 + i * 0.06, 0.957, zc + 0.08 + (i % 2) * 0.05, 10));
    // Prateleira com canecas + quadro "Café da Base" na parede
    put(box(0.95, 0.04, 0.22, slat, cx + 0.6, 1.72, fz - 0.11));
    for (const x of [cx + 0.2, cx + 1.0]) put(box(0.02, 0.12, 0.18, black, x, 1.65, fz - 0.1));
    for (let i = 0; i < 5; i++) put(cyl(0.04, 0.035, 0.1, i % 3 === 1 ? terra : (i % 3 === 2 ? black : ceramic), cx + 0.24 + i * 0.18, 1.79, fz - 0.11, 12));
    put(box(0.94, 0.62, 0.03, black, cx - 0.45, 1.6, fz - 0.015));
    const menu = canvasMat(0.88 / 0.56, (g, W, Hh) => {
      g.fillStyle = '#1b1c1e'; g.fillRect(0, 0, W, Hh);
      g.strokeStyle = 'rgba(240,179,106,0.9)'; g.lineWidth = Hh * 0.012; g.strokeRect(W * 0.04, Hh * 0.06, W * 0.92, Hh * 0.88);
      g.fillStyle = '#f4efe6'; g.textAlign = 'center'; g.textBaseline = 'middle';
      ctx.logo.draw(g, W * 0.1, Hh * 0.12, Hh * 0.2, { layout: 'mark', color: '#f4efe6' });
      g.font = `800 ${Hh * 0.15}px ${FONT}`; g.fillText('CAFÉ DA BASE', W * 0.56, Hh * 0.22);
      g.fillStyle = '#f0b36a'; g.fillRect(W * 0.35, Hh * 0.33, W * 0.3, Hh * 0.012);
      g.fillStyle = '#e8e2d6'; g.font = `500 ${Hh * 0.085}px ${FONT}`; g.textAlign = 'left';
      const rows = [['Espresso', 'R$ 5'], ['Cappuccino', 'R$ 8'], ['Café coado', 'grátis'], ['Chá gelado', 'R$ 6']];
      rows.forEach(([a, b], i) => { const y = Hh * (0.46 + i * 0.12); g.textAlign = 'left'; g.fillText(a, W * 0.12, y); g.textAlign = 'right'; g.fillText(b, W * 0.88, y); });
    }, 0.45);
    plane(0.88, 0.56, menu, cx - 0.45, 1.6, fz - 0.032, Math.PI);
  }
  // Mesa bistrô alta com 2 banquetas
  {
    const x = 14.7, z = 47.3;
    put(cyl(0.32, 0.32, 0.035, quartz, x, 1.04, z, 24));
    put(cyl(0.03, 0.03, 1.0, black, x, 0.52, z, 8));
    put(cyl(0.22, 0.24, 0.025, black, x, 0.013, z, 18));
    put(cyl(0.04, 0.03, 0.08, ceramic, x + 0.08, 1.1, z - 0.05, 10));
    for (const a of [2.2, 4.1]) {
      const sx = x + Math.cos(a) * 0.55, sz = z + Math.sin(a) * 0.55;
      put(cyl(0.17, 0.17, 0.05, caramel, sx, 0.72, sz, 14));
      put(cyl(0.02, 0.02, 0.7, black, sx, 0.36, sz, 8));
      put(cyl(0.18, 0.2, 0.02, black, sx, 0.01, sz, 14));
    }
  }

  // Totem de avisos (TV vertical) ao lado da rota, virado para a entrada
  {
    const x = 9.95, z = 47.25;
    put(box(0.5, 0.03, 0.36, black, x, 0.015, z));
    put(box(0.1, 0.25, 0.06, black, x, 0.15, z - 0.02));
    put(box(0.64, 1.14, 0.06, black, x, 1.3, z));
    const tot = canvasMat(0.58 / 1.04, (g, W, Hh) => {
      const bg = g.createLinearGradient(0, 0, 0, Hh); bg.addColorStop(0, '#16171a'); bg.addColorStop(1, '#0b0b0d');
      g.fillStyle = bg; g.fillRect(0, 0, W, Hh);
      g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      ctx.logo.draw(g, W * 0.08, Hh * 0.035, W * 0.5, { layout: 'wide', color: '#f4efe6' });
      g.fillStyle = '#f0b36a'; g.font = `800 ${W * 0.075}px ${FONT}`; g.fillText('AVISOS DA SEMANA', W * 0.08, Hh * 0.178);
      const cards = [
        ['#6e46ff', 'CULTO DE CELEBRAÇÃO', 'Domingo · 9h e 18h'],
        ['#c98a3c', 'BASE KIDS', 'Check-in no balcão'],
        ['#2e8b57', 'CÉLULAS', 'Quartas · 20h'],
        ['#a65a3a', 'CAFÉ COM O PASTOR', 'Sábado · 8h30'],
      ];
      cards.forEach(([c, t, s], i) => {
        const y = Hh * (0.205 + i * 0.16), h = Hh * 0.14;
        g.fillStyle = 'rgba(255,255,255,0.06)'; rr(g, W * 0.06, y, W * 0.88, h, W * 0.03); g.fill();
        g.fillStyle = c; rr(g, W * 0.06, y, W * 0.035, h, W * 0.015); g.fill();
        g.fillStyle = '#ffffff'; g.font = `700 ${W * 0.062}px ${FONT}`; g.fillText(t, W * 0.14, y + h * 0.42);
        g.fillStyle = '#c9c4ba'; g.font = `400 ${W * 0.055}px ${FONT}`; g.fillText(s, W * 0.14, y + h * 0.78);
      });
      // "QR code" de inscrição
      const q = W * 0.2, qx = W * 0.08, qy = Hh * 0.86;
      g.fillStyle = '#ffffff'; g.fillRect(qx, qy, q, q * 0.9);
      g.fillStyle = '#111'; let k = 7;
      for (let i = 0; i < 9; i++) for (let j = 0; j < 8; j++) { k = (k * 9301 + 49297) % 233280; if (k / 233280 > 0.5) g.fillRect(qx + q * 0.05 + i * q * 0.1, qy + q * 0.05 + j * q * 0.1, q * 0.1, q * 0.1); }
      g.fillStyle = '#f4efe6'; g.font = `500 ${W * 0.05}px ${FONT}`; g.fillText('Inscreva-se', W * 0.33, qy + q * 0.4);
      g.fillStyle = '#f0b36a'; g.fillText('basechurch.app', W * 0.33, qy + q * 0.7);
    }, 0.9);
    ctx.bindEmissive('hall', tot, 0.9, { min: 0.3 });
    plane(0.58, 1.04, tot, x, 1.3, z + 0.032);
  }

  // Capacho na entrada e placas "TEMPLO" (sobre as portas de vidro) e "Banheiros"
  // Capacho de borracha grafite com o logo (anel à esquerda, BASE/CHURCH à direita) logo depois da porta
  put(box(2.16, 0.012, 1.18, mat, 12.0, 0.006, 48.9, nc));
  {
    const cap = ctx.logo.mesh(2.04, 0, { layout: 'wide', color: '#d9d4ca', bg: '#1a1a1c', pad: 0.12, roughness: 1 });
    cap.rotation.x = -Math.PI / 2; cap.position.set(12.0, 0.0135, 48.9); cap.receiveShadow = true; ctx.add(cap);
  }
  put(box(1.2, 0.26, 0.02, felt, 11.85, 2.62, WZ + 0.012, nc));
  const tpl = canvasMat(1.16 / 0.22, (g, W, Hh) => {
    g.clearRect(0, 0, W, Hh);
    g.fillStyle = '#f4efe6'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `600 ${Hh * 0.55}px ${FONT}`;
    g.fillText('T E M P L O', W / 2, Hh * 0.54);
  }, 0.7, true);
  plane(1.16, 0.22, tpl, 11.85, 2.62, WZ + 0.024);
  ctx.bindEmissive('hall', tpl, 0.7, { min: 0.25 });
  // Extintor (pó ABC) com placa, à direita da nova porta de saída do templo (x 13,4–15,2)
  {
    const x = 15.55, z = 44.175;
    put(box(0.12, 0.06, 0.04, black, x, 1.6, 44.095));                            // suporte
    put(cyl(0.085, 0.085, 0.52, alarm, x, 1.25, z, 16));
    put(sph(0.085, alarm, x, 1.51, z)).scale.y = 0.5;
    put(cyl(0.02, 0.025, 0.08, black, x, 1.57, z, 8));
    put(box(0.12, 0.025, 0.03, black, x + 0.03, 1.62, z));                       // gatilho
    put(bar(x + 0.06, 1.55, z + 0.03, x + 0.1, 1.15, z + 0.06, 0.012, black));   // mangueira
    put(box(0.18, 0.18, 0.006, alarm, x, 1.9, 44.078, nc));                        // placa
    put(box(0.05, 0.1, 0.004, whiteF, x, 1.9, 44.083, nc));
  }
  // Placa de SAÍDA (verde, sempre acesa) sobre a porta principal, lado do hall
  {
    const ex = canvasMat(0.42 / 0.16, (g, W, Hh) => {
      g.fillStyle = '#0f8a3c'; g.fillRect(0, 0, W, Hh);
      g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `800 ${Hh * 0.56}px ${FONT}`; g.fillText('SAÍDA', W * 0.58, Hh * 0.54);
      g.beginPath(); g.moveTo(W * 0.08, Hh * 0.5); g.lineTo(W * 0.2, Hh * 0.25); g.lineTo(W * 0.2, Hh * 0.75); g.closePath(); g.fill();
    }, 0.9);
    put(box(0.44, 0.18, 0.03, whiteF, 12.0, 2.52, 49.548));
    plane(0.42, 0.16, ex, 12.0, 2.52, 49.532, Math.PI);
  }

  // Placas pretas sobre as portas (atlas numa textura só): Sala da Família, WC PCD e WC
  {
    const tex = ctx.makeTex(1024, (g, s) => {
      const rh = s / 3;
      const row = (i, draw) => { g.save(); g.translate(0, i * rh); g.fillStyle = '#1a1a1c'; g.fillRect(0, 0, s, rh);
        g.strokeStyle = 'rgba(240,179,106,0.55)'; g.lineWidth = 4; g.strokeRect(10, 10, s - 20, rh - 20); draw(); g.restore(); };
      const txt = (t1, t2) => {
        g.textAlign = 'left'; g.textBaseline = 'middle';
        g.fillStyle = '#f4efe6'; g.font = `800 ${rh * 0.3}px ${FONT}`; g.fillText(t1, rh * 1.05, rh * 0.4);
        g.fillStyle = '#f0b36a'; g.font = `500 ${rh * 0.19}px ${FONT}`; g.fillText(t2, rh * 1.05, rh * 0.72);
      };
      row(0, () => { ctx.logo.draw(g, rh * 0.18, rh * 0.16, rh * 0.68, { layout: 'mark', color: '#f4efe6' }); txt('Sala da Família', 'Base Kids · 0 a 3 anos'); });
      row(1, () => {
        g.fillStyle = '#1f5fae'; rr(g, rh * 0.16, rh * 0.14, rh * 0.72, rh * 0.72, rh * 0.08); g.fill();
        g.strokeStyle = '#ffffff'; g.fillStyle = '#ffffff'; g.lineCap = 'round'; g.lineWidth = rh * 0.06;
        const ox = rh * 0.16, oy = rh * 0.14, u = rh * 0.72;
        g.beginPath(); g.arc(ox + u * 0.45, oy + u * 0.18, u * 0.08, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.moveTo(ox + u * 0.43, oy + u * 0.3); g.lineTo(ox + u * 0.45, oy + u * 0.55); g.lineTo(ox + u * 0.68, oy + u * 0.55); g.lineTo(ox + u * 0.78, oy + u * 0.8); g.stroke();
        g.beginPath(); g.moveTo(ox + u * 0.44, oy + u * 0.42); g.lineTo(ox + u * 0.62, oy + u * 0.42); g.stroke();
        g.beginPath(); g.arc(ox + u * 0.42, oy + u * 0.66, u * 0.2, -Math.PI * 0.15, Math.PI * 1.25); g.stroke();
        txt('WC PCD', 'acessível · barras de apoio');
      });
      row(2, () => {
        g.fillStyle = '#f4efe6';
        for (const [cx, fem] of [[rh * 0.36, false], [rh * 0.68, true]]) {
          g.beginPath(); g.arc(cx, rh * 0.3, rh * 0.08, 0, Math.PI * 2); g.fill();
          if (fem) { g.beginPath(); g.moveTo(cx, rh * 0.42); g.lineTo(cx - rh * 0.13, rh * 0.78); g.lineTo(cx + rh * 0.13, rh * 0.78); g.closePath(); g.fill(); }
          else g.fillRect(cx - rh * 0.08, rh * 0.42, rh * 0.16, rh * 0.38);
        }
        txt('WC', 'Sala da Família');
      });
    });
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    const pm = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.2 });
    ctx.bindEmissive('hall', pm, 0.35, { min: 0.1 });
    const sign = (i, x, y, z, ry) => {
      const b = box(0.56, 0.2, 0.02, black, x, y, z); b.rotation.y = ry; put(b);
      const p = atlasPlane(0.54, 0.18, pm, 1 - (i + 1) / 3, 1 - i / 3);
      p.position.set(x + Math.sin(ry) * 0.0115, y, z + Math.cos(ry) * 0.0115); p.rotation.y = ry; put(p);
    };
    sign(0, 4.099, 2.42, 47.05, Math.PI / 2);      // hall → Sala da Família
    sign(1, 4.099, 2.42, 44.85, Math.PI / 2);      // hall → WC PCD
    sign(2, 0.9, 2.42, 46.387, 0);                 // Sala da Família → WC
  }

  // Tríptico (foto de culto: silhuetas de mãos erguidas contra a luz âmbar do palco) acima do sofá do lounge
  {
    const art = canvasMat(1.5 / 0.7, (g, W, Hh) => {
      const bg = g.createLinearGradient(0, 0, 0, Hh); bg.addColorStop(0, '#22140e'); bg.addColorStop(0.55, '#7a3f1f'); bg.addColorStop(0.8, '#d98c3f'); bg.addColorStop(1, '#2a1a12');
      g.fillStyle = bg; g.fillRect(0, 0, W, Hh);
      const sun = g.createRadialGradient(W * 0.52, Hh * 0.62, 0, W * 0.52, Hh * 0.62, W * 0.35);
      sun.addColorStop(0, 'rgba(255,226,170,0.95)'); sun.addColorStop(0.35, 'rgba(255,170,90,0.45)'); sun.addColorStop(1, 'rgba(255,140,60,0)');
      g.fillStyle = sun; g.fillRect(0, 0, W, Hh);
      for (let i = 0; i < 7; i++) {                              // feixes
        const x = W * (0.1 + i * 0.13), gr = g.createLinearGradient(x, 0, W * 0.52, Hh * 0.62);
        gr.addColorStop(0, 'rgba(255,220,170,0.28)'); gr.addColorStop(1, 'rgba(255,220,170,0)');
        g.fillStyle = gr; g.beginPath(); g.moveTo(x - W * 0.012, 0); g.lineTo(x + W * 0.012, 0); g.lineTo(W * 0.52, Hh * 0.62); g.closePath(); g.fill();
      }
      let k = 11; const r2 = () => { k = (k * 9301 + 49297) % 233280; return k / 233280; };
      for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,${190 + (r2() * 50) | 0},140,${0.12 + r2() * 0.3})`; g.beginPath(); g.arc(r2() * W, r2() * Hh * 0.6, 3 + r2() * 14, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#120b08';                                     // plateia em silhueta
      for (let i = 0; i < 17; i++) {
        const x = W * (0.02 + i * 0.061 + (r2() - 0.5) * 0.02), hy = Hh * (0.8 + r2() * 0.05);
        g.beginPath(); g.arc(x, hy, Hh * 0.045, 0, Math.PI * 2); g.fill();
        g.fillRect(x - Hh * 0.07, hy + Hh * 0.03, Hh * 0.14, Hh);
        if (r2() > 0.45) { g.save(); g.translate(x + Hh * 0.05, hy); g.rotate(0.15 + r2() * 0.25); g.fillRect(-Hh * 0.012, -Hh * 0.28, Hh * 0.024, Hh * 0.28); g.beginPath(); g.arc(0, -Hh * 0.29, Hh * 0.02, 0, Math.PI * 2); g.fill(); g.restore(); }
        if (r2() > 0.6) { g.save(); g.translate(x - Hh * 0.05, hy); g.rotate(-0.15 - r2() * 0.25); g.fillRect(-Hh * 0.012, -Hh * 0.26, Hh * 0.024, Hh * 0.26); g.beginPath(); g.arc(0, -Hh * 0.27, Hh * 0.02, 0, Math.PI * 2); g.fill(); g.restore(); }
      }
    }, 0.12);
    [6.35, 6.9, 7.45].forEach((x, i) => {   // v1.4.6: na parede do templo, acima do sofá do lounge
      put(box(0.52, 0.72, 0.03, black, x, 1.68, 44.103));
      const p = atlasPlane(0.48, 0.68, art, 0, 1, i / 3, (i + 1) / 3);
      p.position.set(x, 1.68, 44.12); put(p);
    });
  }

  // Totem de álcool em gel ao lado da porta principal
  {
    const x = 10.38, z = 49.22;
    put(cyl(0.16, 0.17, 0.02, black, x, 0.01, z, 18));
    put(cyl(0.022, 0.022, 1.05, black, x, 0.54, z, 8));
    put(box(0.13, 0.22, 0.1, whiteF, x, 1.15, z + 0.02));
    put(box(0.11, 0.05, 0.02, black, x, 1.1, z + 0.075));
    put(box(0.14, 0.02, 0.1, black, x, 0.62, z + 0.03));
  }

  // =====================================================================
  // ESCADA RETA ao longo da fachada (x 4,1–9,2 · z 48,05–49,56) até o MEZANINO / "salinha" (y 3,05) — v1.4.6
  // Geometria em ctx.STAIR (a visão de Pessoa sobe por ela): 17 degraus de 0,30 × 0,169 + o piso do mezanino.
  // Mesma linguagem da escada antiga: lance maciço grafite, degraus de madeira soltos com fita de LED sob o bocel,
  // painel de vidro inclinado com corrimão preto do lado do hall e corrimão de parede.
  // =====================================================================
  const SX = ctx.STAIR, MZ = ctx.MEZZ;
  const mz = (m) => ctx.addMezz(m);                      // peças do mezanino: grupo próprio (some na Vista de cima)
  const nose = (x) => SX.R * (18 - (x - SX.XS) / SX.GO);   // linha dos bocéis (y) em função de x
  {
    const zc = (SX.Z0 + SX.Z1) / 2, W = SX.Z1 - SX.Z0, N = SX.N - 1, HR = 0.95;
    for (let i = 1; i <= N; i++) {
      const x0 = SX.XS + (N - i) * SX.GO, x1 = x0 + SX.GO, top = i * SX.R;
      put(box(SX.GO, top - 0.03, W, mass, (x0 + x1) / 2, (top - 0.03) / 2, zc));
      put(box(SX.GO + 0.03, 0.03, W + 0.02, slat, (x0 + x1 + 0.03) / 2, top - 0.015, zc));
      put(box(0.012, 0.012, W - 0.12, ledWarm, x1 + 0.006, top - 0.05, zc, nc));
    }
    const G0 = SX.Z0 + 0.03;                                        // plano do vidro (na borda do lance, lado do hall)
    // painel de vidro inclinado + corrimão preto, do primeiro bocel ao piso do mezanino
    put(quad([SX.XE, nose(SX.XE) + 0.03, G0], [SX.XS, SX.Y + 0.03, G0], [SX.XS, SX.Y + HR, G0], [SX.XE, nose(SX.XE) + HR, G0], M.glass));
    put(bar(SX.XE, nose(SX.XE) + HR + 0.02, G0, SX.XS - 0.02, SX.Y + HR + 0.02, G0, 0.022, black));
    put(bar(SX.XE, nose(SX.XE) + 0.03, G0, SX.XS, SX.Y + 0.03, G0, 0.014, black));                 // sapata inferior
    for (const x of [SX.XE - 0.02, SX.XS + 2.5, SX.XS + 0.02]) { const y0 = nose(x); put(box(0.035, HR + 0.03, 0.035, black, x, y0 + (HR + 0.03) / 2, G0)); }
    // corrimão de parede (z ≈ 49,5) com 3 suportes
    const ZW = SX.Z1 - 0.06;
    put(bar(SX.XE - 0.1, nose(SX.XE - 0.1) + 0.9, ZW, SX.XS + 0.1, nose(SX.XS + 0.1) + 0.9, ZW, 0.02, black));
    for (const t of [0.15, 0.5, 0.85]) { const x = SX.XE - 0.1 - t * (SX.XE - SX.XS - 0.2); put(box(0.02, 0.02, 0.07, black, x, nose(x) + 0.87, SX.Z1 - 0.03)); }
  }

  // ---- Mezanino: laje sobre WC / WC PCD / Sala da Família (x 0,087–4,075 · z 44,075–49,563), piso em y = 3,05 ----
  {
    const YF = SX.Y, x0 = MZ.x0, x1 = MZ.x1, z0 = MZ.z0, z1 = MZ.z1, WT = 5.92;
    // laje (face de baixo = forro dos cômodos de baixo) e testeira grafite com fita de LED no lado do hall
    mz(box(4.125, 0.12, 5.75, M.wall, 2.0125, 2.97, 46.825));
    mz(box(0.05, 0.23, z1 - z0 - (z1 - SX.Z0), mass, 4.1, 2.955, (z0 + SX.Z0) / 2));
    mz(box(0.012, 0.012, SX.Z0 - z0 - 0.2, ledWarm, 4.1, 2.83, (z0 + SX.Z0) / 2, nc));
    // piso laminado (mesma textura e escala dos pisos do cartão)
    {
      const tile = 2.4, fw = 4.1 - x0, fd = z1 - z0, map = ctx.TEX.laminate.clone();
      map.repeat.set(fw / tile, fd / tile); map.offset.set(x0 / tile, -z1 / tile);
      const fm = new THREE.MeshStandardMaterial({ color: 0xffffff, map, roughness: 0.44, bumpMap: map, bumpScale: 0.25, envMapIntensity: 0.8 });
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(fw, fd), fm);
      fl.rotation.x = -Math.PI / 2; fl.position.set(x0 + fw / 2, YF, z0 + fd / 2); fl.receiveShadow = true; mz(fl);
    }
    // rodapé de madeira (oeste, norte, sul) — o piso e o rodapé seguem o padrão dos cômodos de laminado
    mz(box(0.02, 0.07, z1 - z0, M.baseboardWood, x0 + 0.01, YF + 0.035, (z0 + z1) / 2, nc));
    mz(box(4.0 - x0, 0.07, 0.02, M.baseboardWood, (x0 + 4.0) / 2, YF + 0.035, z0 + 0.01, nc));
    mz(box(4.0 - x0, 0.07, 0.02, M.baseboardWood, (x0 + 4.0) / 2, YF + 0.035, z1 - 0.01, nc));
    // paredes acima da laje (o resto do cartão tem paredes de 3 m): preto por fora, greige por dentro, tampa escura
    const wy0 = 3.03, wh = WT - wy0, wcy = wy0 + wh / 2;
    mz(box(0.15, wh, 5.8, M.wallDark, 0, wcy, 46.825));                                    // x = 0
    mz(box(0.012, wh, z1 - z0, M.wall, 0.081, wcy, (z0 + z1) / 2, nc));
    mz(box(4.0, wh, 0.15, M.wallDark, 2.075, wcy, 44.0));                                   // z = 44,0 (parede do templo)
    mz(box(4.0 - x0, wh, 0.012, M.wall, (x0 + 4.075) / 2, wcy, z0 + 0.006, nc));
    const WX0 = 0.7, WX1 = 3.2, WY0 = YF + 0.9, WY1 = WY0 + 1.25;                          // janela da fachada (mesmo vão da Sala da Família)
    for (const [a, b, ya, yb] of [[0.075, 4.075, wy0, WY0], [0.075, 4.075, WY1, WT], [0.075, WX0, WY0, WY1], [WX1, 4.075, WY0, WY1]]) {
      mz(box(b - a, yb - ya, 0.15, M.wallDark, (a + b) / 2, (ya + yb) / 2, 49.65));
      const ia = Math.max(a, x0), ib = Math.min(b, 4.075);
      if (ib > ia) mz(box(ib - ia, yb - ya, 0.012, M.wall, (ia + ib) / 2, (ya + yb) / 2, 49.569, nc));
    }
    const fr = M.frameDark;                                                                  // caixilho preto + vidro fumê
    mz(box(WX1 - WX0, 0.06, 0.2, fr, (WX0 + WX1) / 2, WY0 + 0.03, 49.65)); mz(box(WX1 - WX0, 0.06, 0.2, fr, (WX0 + WX1) / 2, WY1 - 0.03, 49.65));
    for (const x of [WX0 + 0.03, (WX0 + WX1) / 2, WX1 - 0.03]) mz(box(0.06, WY1 - WY0, 0.2, fr, x, (WY0 + WY1) / 2, 49.65));
    mz(box(WX1 - WX0 - 0.1, WY1 - WY0 - 0.1, 0.02, M.glassSmoke, (WX0 + WX1) / 2, (WY0 + WY1) / 2, 49.65, { cast: false, receive: false }));
    for (const [cx, cz, lx, lz] of [[0, 46.825, 0.15, 5.8], [2.075, 44.0, 4.0, 0.15]]) mz(box(cx === 0 ? 0.18 : lx, 0.03, cx === 0 ? lz : 0.18, M.wallDarkCap, cx, WT + 0.015, cz, { cast: false }));
    mz(box(4.0, 0.03, 0.18, M.wallDarkCap, 2.075, WT + 0.015, 49.65, { cast: false }));
    // guarda-corpo de vidro do lado do hall (x = 4,06): 2 painéis, corrimão preto e montantes
    const RX = 4.06, GH = YF + 1.0;
    for (const [za, zb] of [[z0 + 0.06, 46.1], [46.16, SX.Z0 + 0.03]]) mz(quad([RX, YF + 0.09, za], [RX, YF + 0.09, zb], [RX, GH - 0.03, zb], [RX, GH - 0.03, za], M.glass));
    mz(bar(RX, GH, z0 + 0.06, RX, GH, SX.Z0 + 0.03, 0.024, black));
    mz(box(0.05, 0.05, SX.Z0 - z0 - 0.02, black, RX, YF + 0.045, (z0 + SX.Z0) / 2 + 0.03));
    for (const z of [z0 + 0.06, 46.13, SX.Z0 + 0.03]) mz(box(0.04, 1.0, 0.04, black, RX, YF + 0.5, z));

    // ---- mobília mínima: 2 poltronas, mesinha de canto, tapete, planta e quadros ----
    const rugM = box(2.3, 0.012, 1.9, rugHall, 2.95, YF + 0.008, 46.35, nc); mz(rugM);
    mz(box(2.18, 0.006, 1.78, rugEdge, 2.95, YF + 0.014, 46.35, nc));
    const chair = (x, z, ry, cush) => { const c = armchair(caramel, cush); c.position.set(x, YF, z); c.rotation.y = ry; return mz(c); };
    chair(3.05, 45.2, 0.4, terra); chair(3.05, 47.5, Math.PI - 0.4, felt);
    { const T2 = G();                                                                    // mesinha redonda com livros e vaso
      T2.add(cyl(0.3, 0.3, 0.035, slat, 0, 0.5, 0, 24)); T2.add(cyl(0.03, 0.03, 0.48, black, 0, 0.25, 0, 8)); T2.add(cyl(0.2, 0.22, 0.02, black, 0, 0.01, 0, 20));
      T2.add(box(0.2, 0.03, 0.15, terra, -0.08, 0.535, 0.05)); T2.add(box(0.17, 0.025, 0.13, paper, -0.08, 0.56, 0.05));
      T2.add(cyl(0.05, 0.04, 0.1, ceramic, 0.1, 0.57, -0.05, 10));
      T2.position.set(3.15, YF, 46.35); mz(T2); }
    { const c = cycas(0.5, 0.55, 5); c.position.set(0.55, YF, 48.95); mz(c); }
    { const c = bigPlant(1.6, 0.24, 3); c.position.set(0.55, YF, 44.65); mz(c); }
    [[45.6, 0.5, mustard], [46.3, 0.42, terra]].forEach(([z, s, c]) => { mz(box(0.03, s, s, black, x0 + 0.02, YF + 1.5, z)); mz(box(0.012, s - 0.08, s - 0.08, c, x0 + 0.04, YF + 1.5, z, nc)); });
  }

  // =====================================================================
  // SALA DA FAMÍLIA (x 0,09–3,92 · z 46,38–49,56)
  // =====================================================================
  {
    // parede de destaque em marmorato (x = 0, face 0,087), como a sala ampla do v1
    clad('x', 0.087, 1, 46.375, 49.563, 0.07, 2.99, MARM);
    // Sofá cinza na parede x = 0 (de frente para a TV), almofadas mostarda/grafite e manta
    const S = G();
    S.add(box(1.8, 0.26, 0.8, fabricG, 0, 0.28, 0));
    S.add(box(1.8, 0.44, 0.17, fabricG, 0, 0.62, -0.315));
    for (const sx of [-1, 1]) S.add(box(0.14, 0.22, 0.8, fabricG, sx * 0.83, 0.52, 0));
    for (const sx of [-1, 1]) S.add(box(0.74, 0.1, 0.58, cream, sx * 0.38, 0.46, 0.08));
    S.add(rot(box(0.36, 0.34, 0.1, mustard, -0.5, 0.66, -0.17), -0.15, 0.2));
    S.add(rot(box(0.34, 0.32, 0.1, fabricD, 0.5, 0.66, -0.17), -0.15, -0.2));
    S.add(rot(box(0.6, 0.02, 0.5, cream, 0.45, 0.52, 0.08), 0, 0.1));
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) S.add(cyl(0.016, 0.012, 0.15, woodLt, sx * 0.82, 0.075, sz * 0.33, 6));
    place(S, 0.58, 48.42, Math.PI / 2);

    // Poltrona de amamentação (balanço) + pufe, voltada para a TV
    const P = G();
    P.add(cyl(0.3, 0.32, 0.03, woodLt, 0, 0.015, 0, 20));
    P.add(cyl(0.05, 0.06, 0.2, woodLt, 0, 0.13, 0, 10));
    P.add(box(0.7, 0.2, 0.66, cream, 0, 0.36, 0.02));
    P.add(rot(box(0.7, 0.7, 0.16, cream, 0, 0.78, -0.27), -0.14));
    for (const sx of [-1, 1]) { const a = cyl(0.09, 0.09, 0.66, cream, sx * 0.33, 0.54, 0.02, 12); a.rotation.x = Math.PI / 2; P.add(a); }
    P.add(box(0.52, 0.08, 0.5, fabricG, 0, 0.5, 0.05));
    P.add(rot(box(0.4, 0.3, 0.09, mustard, 0, 0.72, -0.16), -0.15));
    place(P, 2.15, 46.98, 0.72);
    const pf = cyl(0.2, 0.2, 0.34, fabricD, 2.64, 0.17, 47.5, 18); put(pf);
    put(cyl(0.2, 0.2, 0.02, cream, 2.64, 0.35, 47.5, 18));

    // Tapete infantil de EVA (placas coloridas) + brinquedos
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) if (!(i >= 2 && j === 2)) put(box(0.52, 0.014, 0.52, eva[(i + j) % 4], 1.4 + i * 0.53, 0.009, 47.95 + j * 0.53, nc));
    // Cercadinho (1,0 × 1,0) com urso e bola
    {
      const cx = 1.72, cz = 48.82, s = 0.96, h = 0.66;
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) put(cyl(0.022, 0.022, h, whiteF, cx + sx * s / 2, h / 2 + 0.02, cz + sz * s / 2, 8));
      for (const sz of [-1, 1]) { put(box(s, 0.035, 0.04, whiteF, cx, h + 0.02, cz + sz * s / 2)); put(box(s - 0.04, h - 0.1, 0.008, net, cx, h / 2 + 0.04, cz + sz * s / 2, nc)); }
      for (const sx of [-1, 1]) { put(box(0.04, 0.035, s, whiteF, cx + sx * s / 2, h + 0.02, cz)); put(box(0.008, h - 0.1, s - 0.04, net, cx + sx * s / 2, h / 2 + 0.04, cz, nc)); }
      put(box(s - 0.02, 0.06, s - 0.02, cream, cx, 0.05, cz));
      // urso de pelúcia
      const bx = cx - 0.2, bz = cz - 0.18, bear = std({ color: 0xb48a60, roughness: 1 });
      put(sph(0.1, bear, bx, 0.17, bz)); put(sph(0.075, bear, bx, 0.32, bz));
      put(sph(0.028, bear, bx - 0.055, 0.38, bz)); put(sph(0.028, bear, bx + 0.055, 0.38, bz));
      put(sph(0.03, cream, bx, 0.31, bz + 0.065));
      put(sph(0.09, toys[1], cx + 0.2, 0.17, cz + 0.2));
      put(box(0.08, 0.08, 0.08, toys[2], cx + 0.25, 0.12, cz - 0.2));
    }
    // brinquedos soltos sobre o EVA
    [[2.55, 48.0, 0], [2.66, 48.12, 3], [2.62, 48.04, 5]].forEach(([x, z, c], i) => { const b = box(0.09, 0.09, 0.09, toys[c], x, 0.06 + (i === 2 ? 0.09 : 0), z); b.rotation.y = i * 0.5; put(b); });
    put(sph(0.11, toys[0], 3.0, 0.125, 48.4));
    put(cyl(0.012, 0.012, 0.22, whiteF, 2.4, 0.13, 48.55, 6));
    put(cyl(0.07, 0.07, 0.02, whiteF, 2.4, 0.025, 48.55, 12));
    [0.065, 0.055, 0.045, 0.035].forEach((r, i) => { const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.018, 8, 18), toys[i + 1]); t.rotation.x = Math.PI / 2; t.position.set(2.4, 0.05 + i * 0.038, 48.55); t.castShadow = true; put(t); });

    // TV transmitindo o culto (parede x = 4,0) + rack baixo com cestos
    put(box(0.36, 0.44, 1.2, whiteF, 3.73, 0.26, 48.55));
    put(box(0.38, 0.03, 1.22, woodLt, 3.73, 0.495, 48.55));
    for (const z of [48.25, 48.85]) put(box(0.02, 0.26, 0.5, wicker, 3.54, 0.25, z));
    for (const z of [48.1, 48.9]) put(box(0.04, 0.04, 0.04, woodLt, 3.73, 0.02, z));
    put(box(0.05, 0.64, 1.1, black, 3.9, 1.5, 48.55));
    const live = canvasMat(1.04 / 0.58, (g, W, Hh) => {
      const bg = g.createLinearGradient(0, 0, 0, Hh); bg.addColorStop(0, '#1a1036'); bg.addColorStop(0.7, '#3a1f6e'); bg.addColorStop(1, '#0d0a18');
      g.fillStyle = bg; g.fillRect(0, 0, W, Hh);
      // feixes de luz do palco
      for (let i = 0; i < 5; i++) {
        const x = W * (0.12 + i * 0.19), gr = g.createLinearGradient(x, 0, x, Hh * 0.8);
        gr.addColorStop(0, i % 2 ? 'rgba(120,160,255,0.55)' : 'rgba(190,120,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.beginPath(); g.moveTo(x - W * 0.01, 0); g.lineTo(x + W * 0.01, 0); g.lineTo(x + W * 0.09, Hh * 0.8); g.lineTo(x - W * 0.09, Hh * 0.8); g.closePath(); g.fill();
      }
      // telão ao fundo com o logo
      g.fillStyle = '#0b0b10'; g.fillRect(W * 0.34, Hh * 0.14, W * 0.32, Hh * 0.3);
      ctx.logo.draw(g, W * 0.5 - Hh * 0.105, Hh * 0.158, Hh * 0.21, { layout: 'full', color: '#f4efe6' });
      g.textBaseline = 'middle';
      // palco e banda (silhuetas)
      g.fillStyle = '#0a0812'; g.fillRect(0, Hh * 0.62, W, Hh * 0.38);
      g.fillStyle = '#120d20';
      [0.2, 0.36, 0.5, 0.64, 0.8].forEach((x, i) => { const hh = Hh * (i === 2 ? 0.2 : 0.17); g.fillRect(W * x - W * 0.014, Hh * 0.62 - hh, W * 0.028, hh); g.beginPath(); g.arc(W * x, Hh * 0.62 - hh - Hh * 0.025, Hh * 0.03, 0, Math.PI * 2); g.fill(); });
      // plateia de mãos erguidas
      g.fillStyle = '#050407';
      for (let i = 0; i < 14; i++) { const x = W * (0.03 + i * 0.072); g.beginPath(); g.arc(x, Hh * 0.93, Hh * 0.06, 0, Math.PI * 2); g.fill(); if (i % 3 === 0) g.fillRect(x + Hh * 0.02, Hh * 0.72, Hh * 0.02, Hh * 0.18); }
      // selo AO VIVO + tarja
      g.fillStyle = '#e02424'; rr(g, W * 0.04, Hh * 0.05, W * 0.15, Hh * 0.09, Hh * 0.02); g.fill();
      g.fillStyle = '#fff'; g.font = `700 ${Hh * 0.055}px ${FONT}`; g.textAlign = 'left'; g.fillText('● AO VIVO', W * 0.055, Hh * 0.097);
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, Hh * 0.8, W, Hh * 0.12);
      g.fillStyle = '#f0b36a'; g.fillRect(0, Hh * 0.8, W * 0.012, Hh * 0.12);
      g.fillStyle = '#fff'; g.font = `700 ${Hh * 0.05}px ${FONT}`; g.fillText('Culto de Celebração', W * 0.04, Hh * 0.845);
      g.fillStyle = '#d6d0c6'; g.font = `400 ${Hh * 0.04}px ${FONT}`; g.fillText('Base Church · transmissão para a Sala da Família', W * 0.04, Hh * 0.89);
    }, 0.95);
    ctx.bindEmissive('familia', live, 0.95, { min: 0.35 });
    plane(1.04, 0.58, live, 3.87, 1.5, 48.55, -Math.PI / 2);

    // Trocador (fraldário) sob a janela: cômoda branca, colchonete e cestos
    {
      const cx = 2.92, cz = 49.19;
      put(box(0.96, 0.86, 0.5, whiteF, cx, 0.45, cz));
      for (let i = 0; i < 3; i++) { put(box(0.9, 0.24, 0.012, woodLt, cx, 0.2 + i * 0.27, cz - 0.255)); put(box(0.14, 0.015, 0.02, M.chrome, cx, 0.27 + i * 0.27, cz - 0.268)); }
      put(box(0.96, 0.03, 0.52, woodLt, cx, 0.895, cz));
      put(box(0.74, 0.06, 0.46, fabricG, cx - 0.08, 0.94, cz));
      for (const sx of [-1, 1]) put(box(0.05, 0.1, 0.46, fabricG, cx - 0.08 + sx * 0.36, 0.96, cz));
      put(box(0.16, 0.12, 0.2, wicker, cx + 0.38, 0.97, cz));
      for (let i = 0; i < 3; i++) put(box(0.13, 0.03, 0.15, whiteF, cx + 0.38, 1.02 + i * 0.032, cz));
      put(box(0.12, 0.06, 0.08, toys[4], cx + 0.39, 1.14, cz + 0.02));
    }
    // Cortinas leves (laterais da janela x 0,6–3,2) e varão
    put(cyl(0.012, 0.012, 3.5, black, 1.9, 2.35, 49.5, 8)).rotation.z = Math.PI / 2;
    for (const x of [0.36, 3.44]) { put(box(0.34, 2.28, 0.04, curtain, x, 1.2, 49.5)); for (let i = 0; i < 3; i++) put(box(0.02, 2.26, 0.02, curtain, x - 0.11 + i * 0.11, 1.2, 49.47, nc)); }
    // Frase adesiva na parede z = 46,3 (acima da prateleira)
    {
      const dec = canvasMat(1.5 / 0.3, (g, W, Hh) => {
        g.clearRect(0, 0, W, Hh); g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = '#6f8a6a'; g.font = `italic 600 ${Hh * 0.38}px Georgia, "Times New Roman", serif`; g.fillText('Deixai vir a mim as criancinhas', W / 2, Hh * 0.36);
        g.fillStyle = '#c47f68'; g.font = `600 ${Hh * 0.2}px ${FONT}`; g.fillText('MARCOS 10.14', W / 2, Hh * 0.8);
      }, 0, true);
      dec.polygonOffset = true; dec.polygonOffsetFactor = -2; dec.polygonOffsetUnits = -2;
      plane(1.5, 0.3, dec, 2.2, 2.08, 46.379);
    }
    // Quadros na parede x = 0 (acima do sofá) e prateleira com livrinhos na parede z = 46,3
    [[47.9, 0.42, toys[2]], [48.45, 0.5, mustard], [49.0, 0.42, cream]].forEach(([z, s, c]) => {
      put(box(0.025, s, s, black, 0.112, 1.55, z)); put(box(0.012, s - 0.08, s - 0.08, c, 0.127, 1.55, z, nc));
    });
    put(box(1.1, 0.03, 0.2, woodLt, 2.1, 1.55, 46.48));
    for (let i = 0; i < 7; i++) put(box(0.03, 0.2 - (i % 3) * 0.02, 0.15, toys[i % 6], 1.7 + i * 0.045, 1.66 - (i % 3) * 0.01, 46.49));
    put(sph(0.07, std({ color: 0xb48a60, roughness: 1 }), 2.35, 1.64, 46.49));
    put(cyl(0.06, 0.05, 0.12, ceramic, 2.55, 1.63, 46.49, 12));
    for (let i = 0; i < 3; i++) put(sph(0.06, frond2, 2.55 + (i - 1) * 0.04, 1.74, 46.49));
  }

  // =====================================================================
  // BANHEIROS (padrão real, v3): builders com origem na face da parede, frente = +z
  // =====================================================================
  // Bancada de quartzo branco (tampo grosso de 12 cm) com cuba(s) de apoio retangular(es), torneira de parede
  // cromada, espelho com moldura de LED fria e "spots" lavando o mármore (planos de brilho da luz dos banheiros)
  const vanity = (len, depth, top, basins, mw, mh, my0) => {
    const g = G();
    g.add(box(len, 0.12, depth, quartzW, 0, top - 0.06, depth / 2));
    g.add(box(len, 0.18, 0.02, quartzW, 0, top + 0.09, 0.01));                  // espelho de bancada
    for (const bx of basins) {
      const bz = depth * 0.56;
      g.add(box(0.4, 0.13, 0.32, ceramic, bx, top + 0.065, bz));
      g.add(box(0.34, 0.006, 0.26, basinIn, bx, top + 0.128, bz, nc));
      const cn = cyl(0.028, 0.028, 0.012, M.chrome, bx, top + 0.3, 0.026, 12); cn.rotation.x = Math.PI / 2; g.add(cn);   // canopla
      const sp = cyl(0.013, 0.013, 0.2, M.chrome, bx, top + 0.3, 0.12, 8); sp.rotation.x = Math.PI / 2; g.add(sp);
      g.add(cyl(0.013, 0.01, 0.05, M.chrome, bx, top + 0.28, 0.215, 8));
      g.add(box(0.016, 0.07, 0.016, M.chrome, bx + 0.07, top + 0.33, 0.05));      // alavanca
      g.add(cyl(0.03, 0.03, 0.13, M.steel, bx + 0.26 * (bx <= 0 ? 1 : -1), top + 0.065, depth * 0.5, 10));   // saboneteira
    }
    // espelho retangular com moldura de LED embutida (4 filetes)
    const yc = my0 + mh / 2;
    g.add(box(mw, mh, 0.012, M.mirror, 0, yc, 0.008, nc));
    const e = 0.055, t = 0.022;
    g.add(box(mw - 2 * e, t, 0.004, ledCool, 0, my0 + e, 0.016, nc));
    g.add(box(mw - 2 * e, t, 0.004, ledCool, 0, my0 + mh - e, 0.016, nc));
    g.add(box(t, mh - 2 * e, 0.004, ledCool, -mw / 2 + e, yc, 0.016, nc));
    g.add(box(t, mh - 2 * e, 0.004, ledCool, mw / 2 - e, yc, 0.016, nc));
    // halo frio do espelho + "spots" do forro lavando a parede de mármore
    const hm = ctx.glowPlane(mw + 0.35, mh + 0.35, 'banheiros', { color: 0x9feeff, base: 0.3, day: 0.12, tex: 'frame' });
    hm.position.set(0, yc, 0.02); g.add(hm);
    const n = Math.max(1, Math.round(len / 0.75));
    for (let i = 0; i < n; i++) {
      const w = ctx.glowPlane(0.7, 0.9, 'banheiros', { color: 0xffe2bc, base: 0.28, day: 0.1 });
      w.position.set(-len / 2 + (len / n) * (i + 0.5), 2.5, 0.006); g.add(w);
    }
    return g;
  };
  // Lixeira inox com pedal
  const binSteel = (r = 0.13, h = 0.45) => {
    const g = G();
    g.add(cyl(r, r * 0.93, h, M.steel, 0, h / 2 + 0.02, 0, 18));
    g.add(cyl(r + 0.005, r + 0.005, 0.03, M.chrome, 0, h + 0.035, 0, 18));
    g.add(cyl(r * 0.95, r * 0.95, 0.02, black, 0, 0.01, 0, 18));
    g.add(box(0.1, 0.02, 0.07, black, 0, 0.03, r + 0.02));
    return g;
  };

  // =====================================================================
  // WC (x 0,087–1,825 · z 44,075–46,225) — porta na parede z = 46,3 (x 0,5–1,3)
  // =====================================================================
  {
    // revestimentos: bancada na parede x = 0 (mármore marrom em cima); marmorato nas outras
    wcWall('x', 0.087, 1, 44.212, 46.225, MARR);                                  // parede x = 0 (face 0,087)
    wcWall('z', 44.075, 1, 0.212, 1.825, MARM);                                   // parede z = 44,0
    wcWall('x', 1.825, -1, 44.087, 46.225, MARM);                                 // parede x = 1,9
    wcWall('z', 46.225, -1, 0.099, 1.813, MARM, 0.09, [[0.4, 1.4]]);              // parede da porta (z = 46,3)
    // pilar do canto (x 0–0,2 · z 43,8–44,2) encapado no mesmo padrão
    put(box(0.125, 1.11, 0.137, PORC, 0.1495, 0.645, 44.1435, nc));
    put(box(0.125, 1.79, 0.137, MARR, 0.1495, 2.095, 44.1435, nc));
    // bancada (x 0,099–0,599 · z 44,32–45,22), cuba de apoio e espelho de LED
    place(vanity(0.9, 0.5, 0.86, [0], 0.72, 0.86, 1.28), 0.099, 44.77, Math.PI / 2);
    place(ctx.F.toilet(), 1.38, 44.39, 0);
    // papeleira preta e ducha higiênica na parede x = 1,9; dispenser de papel-toalha e lixeira de pedal
    put(box(0.03, 0.1, 0.12, black, 1.8, 0.72, 44.72));
    put(cyl(0.055, 0.055, 0.1, paper, 1.735, 0.69, 44.72, 12)).rotation.x = Math.PI / 2;
    put(box(0.04, 0.08, 0.05, M.chrome, 1.79, 0.62, 44.3));
    put(box(0.1, 0.3, 0.26, whiteF, 0.155, 1.4, 45.52));
    put(box(0.004, 0.08, 0.16, M.screenOff, 0.207, 1.33, 45.52, nc));
    place(binSteel(0.12, 0.42), 1.62, 45.15);
    // vasinho com planta sobre a bancada
    put(cyl(0.045, 0.035, 0.09, ceramic, 0.22, 0.905, 45.12, 10));
    for (let i = 0; i < 3; i++) put(sph(0.045, frond2, 0.22 + (i - 1) * 0.025, 0.99 + (i % 2) * 0.02, 45.12));
  }

  // =====================================================================
  // WC PCD (x 1,975–3,925 · z 44,075–46,225) — porta na parede x = 4,0 (z 44,4–45,3)
  // =====================================================================
  {
    wcWall('z', 44.075, 1, 1.975, 3.925, MARR);                                   // parede da bancada (z = 44,0)
    wcWall('x', 1.975, 1, 44.087, 46.225, MARM);                                  // parede x = 1,9
    wcWall('z', 46.225, -1, 1.987, 3.913, MARM);                                  // parede z = 46,3 (atrás do vaso)
    wcWall('x', 3.925, -1, 44.087, 46.213, MARM, 0.09, [[44.3, 45.4]]);           // parede da porta (x = 4,0)
    place(ctx.F.toilet(), 2.45, 45.88, Math.PI);
    // barras de apoio: lateral (parede x = 1,9), de fundo (z = 46,3) e vertical
    const XW = 1.987, XS = XW + 0.05, ZW = 46.213, ZB = ZW - 0.05;
    put(bar(XS, 0.76, 45.2, XS, 0.76, 46.05, 0.017, grabBar));
    for (const z of [45.2, 46.05]) put(bar(XW, 0.76, z, XS, 0.76, z, 0.015, grabBar));
    put(bar(XS, 0.9, 45.1, XS, 1.6, 45.1, 0.017, grabBar));
    for (const y of [0.9, 1.6]) put(bar(XW, y, 45.1, XS, y, 45.1, 0.015, grabBar));
    put(bar(2.1, 0.9, ZB, 2.9, 0.9, ZB, 0.017, grabBar));
    for (const x of [2.1, 2.9]) put(bar(x, 0.9, ZW, x, 0.9, ZB, 0.015, grabBar));
    // bancada suspensa acessível (tampo a 0,80 m, sem gabinete) com cuba de apoio baixa e barras em U
    const LX = 2.5, ZF = 44.087;
    place(vanity(0.7, 0.46, 0.8, [0], 0.6, 0.9, 1.05), LX, ZF, 0);
    for (const sx of [-1, 1]) put(bar(LX + sx * 0.42, 0.76, ZF, LX + sx * 0.42, 0.76, ZF + 0.56, 0.016, grabBar));
    put(bar(LX - 0.42, 0.76, ZF + 0.56, LX + 0.42, 0.76, ZF + 0.56, 0.016, grabBar));
    // alarme de emergência (cordão), lixeira de pedal, papeleira e dispenser
    put(box(0.03, 0.1, 0.1, alarm, XW + 0.015, 0.45, 45.62));
    put(box(0.02, 0.4, 0.02, alarm, XW + 0.035, 0.22, 45.64));
    place(binSteel(0.12, 0.42), 3.62, 45.98);
    put(box(0.03, 0.12, 0.12, black, XW + 0.015, 0.95, 45.55));
    put(cyl(0.055, 0.055, 0.1, paper, XW + 0.08, 0.9, 45.55, 12)).rotation.x = Math.PI / 2;
    put(box(0.26, 0.3, 0.1, whiteF, 3.35, 1.4, ZF + 0.05));
    // símbolo de acessibilidade na parede da bancada
    put(box(0.2, 0.2, 0.006, std({ color: 0x1f5fae, roughness: 0.5 }), 3.35, 1.85, ZF + 0.003, nc));
  }
}
