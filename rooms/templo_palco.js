function roomTemploPalco(ctx) {
  // ---------------------------------------------------------------------------
  // PALCO DO TEMPLO · plataforma x 1,2–14,85 · z 13,4–17,6 · topo y 0,6
  // Backstage (z 12,55–13,4) no nível do piso, atrás do telão, com acesso pela
  // porta de vidro x 12,9–15,1 e pelas escadinhas laterais.
  // Conceito "black box" (a Igreja Preta): tablado preto fosco, cortinas de molton
  // preto nas paredes em volta do palco, estrutura grafite, ripado escuro com
  // filetes âmbar e o logo oficial em LED acima do telão.
  // Objetos do cartão NÃO recriados: telão (moldura z 13,44–13,54 · tela z 13,55),
  // 4 refletores (x 3,5/6,5/9,5/12,5 · y 4,6 · z 16,6) com os feixes (x ±1,2 m,
  // z 14–16,6), LEDs do som (x 1,5 e 14,55 · y 0,65 · z 17,5) e splits das paredes.
  // Emissivos ligados às entidades (ctx.bindEmissive): LEDs/âmbar/logo → 'palco';
  // LEDs de status dos equipamentos → 'som'.
  // ---------------------------------------------------------------------------
  const THREE = ctx.THREE, M = ctx.M;
  const box = (...a) => ctx.box(...a), cyl = (...a) => ctx.cyl(...a), sph = (...a) => ctx.sph(...a);
  const place = (...a) => ctx.place(...a), std = (o) => ctx.std(o), rnd = () => ctx.rnd();
  const put = (m) => { ctx.add(m); return m; };
  const G = () => new THREE.Group();
  const rot = (m, x = 0, y = 0, z = 0) => { m.rotation.set(x, y, z); return m; };
  const nc = { cast: false };
  const Y0 = 0.6;                       // topo do palco
  const up = new THREE.Vector3(0, 1, 0);
  // barra cilíndrica entre dois pontos (tubos da treliça, cabos, pedestais inclinados)
  const bar = (x1, y1, z1, x2, y2, z2, r, mat, seg = 6, parent = null) => {
    const a = new THREE.Vector3(x1, y1, z1), b = new THREE.Vector3(x2, y2, z2);
    const d = b.clone().sub(a), len = d.length();
    const m = cyl(r, r, len, mat, 0, 0, 0, seg);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(up, d.normalize());
    m.castShadow = r > 0.015;
    (parent ? parent.add(m) : put(m));
    return m;
  };

  // Materiais locais (mesmas opções → mesmo material → menos draw calls)
  const deck     = std({ color: 0x161618, roughness: 0.92 });                        // tablado preto fosco
  const deckSeam = std({ color: 0x0a0a0b, roughness: 1 });
  const skirt    = std({ color: 0x0f0f11, roughness: 1 });                           // saia de tecido da testeira
  const molton   = std({ color: 0x0d0d0f, roughness: 1 });   // cortina de molton preto
  const trim     = std({ color: 0x3a3b3f, roughness: 0.4, metalness: 0.6 });         // cantoneira de alumínio escovado
  const bezel    = std({ color: 0x17181b, roughness: 0.35, metalness: 0.6 });        // perfil preto da moldura do telão
  const amber    = std({ color: 0xffb35c, emissive: 0xff9a2e, emissiveIntensity: 0.9, roughness: 0.4 });
  const truss    = std({ color: 0x2a2b2f, roughness: 0.4, metalness: 0.6 });         // treliça grafite
  const trussLt  = std({ color: 0x55575d, roughness: 0.35, metalness: 0.7 });
  const matte    = std({ color: 0x1b1b1e, roughness: 0.8 });                         // caixas de som / cases
  const grille   = std({ color: 0x2c2d31, roughness: 0.95 });                        // tela das caixas
  const slat     = std({ color: 0x2e2824, roughness: 0.8 });                         // ripado escuro (madeira tingida)
  const backing  = std({ color: 0x0c0c0d, roughness: 1 });
  const ledPanel = std({ color: 0x0d0e14, emissive: 0x7a66ff, emissiveIntensity: 0.28, roughness: 0.35 });
  const ledPanel2 = std({ color: 0x0d0e14, emissive: 0xff8a3d, emissiveIntensity: 0.22, roughness: 0.35 });
  const lensAmb  = std({ color: 0xffe2b8, emissive: 0xffb466, emissiveIntensity: 1.2, roughness: 0.3 });     // lente dos uplights
  const acrylic  = std({ color: 0xdfeaf2, roughness: 0.05, transparent: true, opacity: 0.22, depthWrite: false });
  const acrylicEdge = std({ color: 0xeaf4fb, roughness: 0.1, transparent: true, opacity: 0.45 });
  const chromeK  = M.chrome;
  const cymbal   = std({ color: 0xc9a24a, roughness: 0.3, metalness: 0.85 });       // pratos (bronze)
  const drumShell = std({ color: 0x1d1d20, roughness: 0.35, metalness: 0.25 });      // cascos pretos laqueados
  const drumHead = std({ color: 0xf0ede6, roughness: 0.7 });
  const keysWhite = std({ color: 0xf4f2ec, roughness: 0.5 });
  const woodGtr  = std({ color: 0xc58a4a, roughness: 0.5 });                         // violão (tampo)
  const woodDk   = std({ color: 0x6b3f22, roughness: 0.5 });
  const woodLt   = std({ color: 0xc9a27a, roughness: 0.65 });                        // ripado claro (como na fachada)
  const sunburst = std({ color: 0x8b2f2f, roughness: 0.35, metalness: 0.1 });        // guitarra vermelha
  const bassBody = std({ color: 0x1e3d5c, roughness: 0.35, metalness: 0.1 });        // baixo azul
  const rubber   = std({ color: 0x101011, roughness: 1 });
  const cable    = std({ color: 0x0b0b0c, roughness: 0.8 });
  const steel    = std({ color: 0x8d9096, roughness: 0.35, metalness: 0.8 });        // cintas / cabos de aço
  const potBlack = std({ color: 0x151517, roughness: 0.45, metalness: 0.1 });        // vaso preto (como na fachada)
  const cica     = std({ color: 0x2f5a2c, roughness: 0.9 });
  const cica2    = std({ color: 0x3d6e36, roughness: 0.9 });
  const pebble   = std({ color: 0xeceae4, roughness: 1 });
  const ledRed   = std({ color: 0x4a0d0d, emissive: 0xff3030, emissiveIntensity: 0.7, roughness: 0.4 });
  const ledW     = std({ color: 0x6a6660, emissive: 0xfff1d0, emissiveIntensity: 0.5, roughness: 0.4 });
  const ledGreen = std({ color: 0x1e5a2e, emissive: 0x3ee07a, emissiveIntensity: 0.7 });

  // Brilho que acompanha as entidades (com o palco apagado, ficam num mínimo discreto)
  ctx.bindEmissive('palco', ledPanel, 0.28);
  ctx.bindEmissive('palco', ledPanel2, 0.22);
  ctx.bindEmissive('palco', amber, 0.9, { min: 0.15 });
  ctx.bindEmissive('palco', lensAmb, 1.2, { min: 0 });
  ctx.bindEmissive('som', ledGreen, 0.7);
  ctx.bindEmissive('som', ledRed, 0.7);
  ctx.bindEmissive('som', ledW, 0.5);

  // ======================= PLATAFORMA =======================
  const X0 = 1.2, X1 = 14.85, Z0 = 13.4, Z1 = 17.6, CX = (X0 + X1) / 2, CZ = (Z0 + Z1) / 2;
  put(box(X1 - X0, Y0 - 0.02, Z1 - Z0, skirt, CX, (Y0 - 0.02) / 2, CZ));
  put(box(X1 - X0, 0.02, Z1 - Z0, deck, CX, Y0 - 0.01, CZ));
  // juntas das placas do tablado (módulos de 1 × 2,1 m)
  for (let x = X0 + 1.0; x < X1 - 0.3; x += 1.0) put(box(0.008, 0.002, Z1 - Z0 - 0.04, deckSeam, x, Y0 + 0.001, CZ, nc));
  put(box(X1 - X0 - 0.04, 0.002, 0.008, deckSeam, CX, Y0 + 0.001, CZ, nc));
  // cantoneira de alumínio nas bordas (frente e laterais) e faixa de LED âmbar na testeira
  put(box(X1 - X0 + 0.02, 0.035, 0.03, trim, CX, Y0 - 0.0175, Z1 + 0.005, nc));
  for (const x of [X0, X1]) put(box(0.03, 0.035, Z1 - Z0, trim, x + (x === X0 ? -0.005 : 0.005), Y0 - 0.0175, CZ, nc));
  for (const [a, b] of [[X0 + 0.15, 6.95], [9.05, X1 - 0.15]]) {
    put(box(b - a, 0.018, 0.012, amber, (a + b) / 2, Y0 - 0.075, Z1 + 0.012, nc));
  }
  // rodapé recuado (sombra embaixo da testeira)
  put(box(X1 - X0 - 0.1, 0.06, 0.02, rubber, CX, 0.03, Z1 + 0.012, nc));

  // Escada central frontal (x 7,0–9,0 · até z 18,3): 3 degraus de 0,15 + LED âmbar nos espelhos
  const steps = [[0.15, 18.3], [0.3, 18.067], [0.45, 17.833]];
  for (const [h, zEnd] of steps) {
    const d = zEnd - Z1;
    put(box(2.0, h, d, skirt, 8.0, h / 2, Z1 + d / 2));
    put(box(2.0, 0.015, d, deck, 8.0, h - 0.0075, Z1 + d / 2));
    put(box(2.02, 0.025, 0.03, trim, 8.0, h - 0.0125, zEnd - 0.005, nc));
    put(box(1.9, 0.012, 0.01, amber, 8.0, h - 0.06, zEnd + 0.006, nc));
  }
  // Escadinhas laterais (acesso do backstage / plateia), sobem em direção ao palco
  const sideStair = (xOut, dir, zc) => {        // xOut = borda externa; dir = +1 sobe para +x, −1 para −x
    const run = 0.28, w = 1.0;
    for (let i = 0; i < 3; i++) {
      const h = 0.15 * (i + 1), len = (3 - i) * run;
      const xa = dir > 0 ? xOut + i * run : xOut - i * run;
      const xc = xa + dir * len / 2;
      put(box(len, h, w, skirt, xc, h / 2, zc));
      put(box(len, 0.015, w, deck, xc, h - 0.0075, zc));
      put(box(0.03, 0.025, w + 0.02, trim, xa + dir * 0.01, h - 0.0125, zc, nc));
    }
    // corrimão preto do lado de fora (z maior)
    const zr = zc + w / 2 - 0.03;
    const xa = xOut + dir * 0.1, xb = xOut + dir * 3 * run;
    bar(xa, 0.15, zr, xa, 1.05, zr, 0.018, truss, 8);
    bar(xb, Y0, zr, xb, Y0 + 0.9, zr, 0.018, truss, 8);
    bar(xa, 1.05, zr, xb, Y0 + 0.9, zr, 0.02, truss, 8);
  };
  sideStair(0.36, 1, 14.6);
  sideStair(15.69, -1, 14.6);

  // ======================= BLACK BOX: CORTINAS DE MOLTON PRETO =======================
  // Molton (0–2,96 m) nas paredes em volta do palco, entre os pilares, para a luz colorida
  // do palco não pintar o branco das paredes. Pregas em onda (uma malha por trecho) e trilho no topo.
  // Laterais: face esquerda x 0,092 (z 12,62–16,68 e 17,12–18,36; a plateia começa em 18,45),
  // direita x 15,958 (z 12,62–18,08, antes do pilar de z 18,3). Fundo (z 12,49): x 0,22–1,23 e 15,12–15,83.
  const HC = 2.95, PLEAT = 0.24;
  const curtain = (axis, face, dir, a, b) => {
    // axis 'x': parede com normal em x (face em x = face), trecho z a–b; 'z': parede com normal em z, trecho x a–b.
    // dir = sentido para dentro do templo (+1/−1)
    const len = b - a, seg = Math.max(8, Math.round(len / 0.04));
    const geo = new THREE.PlaneGeometry(len, HC, seg, 1);
    if (axis === 'x') geo.rotateY(dir * Math.PI / 2); else if (dir < 0) geo.rotateY(Math.PI);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const s = axis === 'x' ? p.getZ(i) : p.getX(i), t = (s + len / 2) / PLEAT * Math.PI * 2;
      const f = 0.5 + 0.38 * Math.sin(t) + 0.12 * Math.sin(2 * t + 0.7);
      const o = dir * (0.004 + 0.036 * f);
      if (axis === 'x') p.setX(i, o); else p.setZ(i, o);
    }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, molton); m.castShadow = false; m.receiveShadow = true;
    const mid = (a + b) / 2;
    if (axis === 'x') m.position.set(face, 0.012 + HC / 2, mid); else m.position.set(mid, 0.012 + HC / 2, face);
    put(m);
    // trilho de cortina (perfil preto) no topo
    if (axis === 'x') put(box(0.04, 0.035, len + 0.02, truss, face + dir * 0.03, 0.012 + HC + 0.02, mid, nc));
    else put(box(len + 0.02, 0.035, 0.04, truss, mid, 0.012 + HC + 0.02, face + dir * 0.03, nc));
  };
  curtain('x', 0.092, 1, 12.62, 16.68);
  curtain('x', 0.092, 1, 17.12, 18.36);
  curtain('x', 15.958, -1, 12.62, 18.08);
  curtain('z', 12.492, 1, 0.22, 1.23);
  curtain('z', 12.492, 1, 15.12, 15.83);

  // ======================= FUNDO: RIPADO + ESTRUTURA DO TELÃO =======================
  // Painel ripado escuro (em pé no piso do backstage, face em z 13,4), dos dois lados do telão
  const ripado = (xa, xb) => {
    const w = xb - xa, hTop = 4.9;
    put(box(w, hTop, 0.04, backing, (xa + xb) / 2, hTop / 2, 13.3));
    const n = Math.floor(w / 0.12);
    for (let i = 0; i < n; i++) put(box(0.045, hTop - 0.1, 0.035, slat, xa + 0.05 + i * (w - 0.1) / (n - 1), hTop / 2, 13.34, nc));
    // filetes de LED âmbar embutidos (3 por painel)
    for (const f of [0.22, 0.5, 0.78]) put(box(0.012, hTop - 0.6, 0.012, amber, xa + w * f, hTop / 2, 13.362, nc));
    put(box(w + 0.02, 0.05, 0.1, trim, (xa + xb) / 2, hTop + 0.025, 13.32, nc));
  };
  ripado(1.25, 4.62);
  ripado(11.38, 12.8);
  // Uplights âmbar no tablado, lavando o ripado de baixo para cima (halo aditivo aceso com o palco)
  for (const x of [1.52, 12.1]) {
    const g = G();
    g.add(box(0.2, 0.02, 0.16, M.dark, 0, 0.01, 0));
    for (const sx of [-1, 1]) g.add(box(0.012, 0.14, 0.05, M.dark, sx * 0.1, 0.08, 0, nc));
    const can = rot(cyl(0.075, 0.085, 0.16, M.dark, 0, 0.11, 0.01, 14), -0.35); g.add(can);
    const lens = rot(cyl(0.066, 0.066, 0.01, lensAmb, 0, 0.19, -0.02, 14), -0.35); lens.castShadow = false; g.add(lens);
    place(g, x, 13.6, 0, Y0);
    const wash = ctx.glowPlane(1.3, 3.8, 'palco', { color: 0xff9a3c, base: 0.7, day: 0.2 });
    wash.position.set(x, Y0 + 1.9, 13.39); put(wash);
  }
  // Painéis de LED laterais estreitos (emissivo fraco; não iluminam)
  for (const [x, mat] of [[4.42, ledPanel], [11.58, ledPanel]]) {
    put(box(0.42, 3.5, 0.05, M.dark, x, 3.0, 13.405));
    for (let k = 0; k < 7; k++) put(box(0.38, 0.47, 0.012, k % 3 === 1 ? ledPanel2 : mat, x, 1.3 + 0.245 + k * 0.487, 13.436, nc));
  }
  // Base de palco sob o telão (tapa o vão entre o tablado e a moldura, abaixo da tela)
  put(box(6.24, 0.56, 0.05, M.dark, 8.0, Y0 + 0.28, 13.43, nc));
  // Moldura do telão: perfil preto acetinado em volta da tela (fora da área da imagem)
  put(box(6.14, 0.045, 0.03, bezel, 8.0, 4.7225, 13.555, nc));
  put(box(6.14, 0.045, 0.03, bezel, 8.0, 1.2775, 13.555, nc));
  for (const x of [4.9775, 11.0225]) put(box(0.045, 3.4, 0.03, bezel, x, 3.0, 13.555, nc));
  // Estrutura do telão: 2 torres de treliça no backstage + travessa no topo (atrás/acima da moldura)
  const trussSeg = (ax, ay, az, bx, by, bz, s, bay, parent = null) => {
    // treliça quadrada (4 banzos) de A a B; s = lado; bay = passo das diagonais
    const A = new THREE.Vector3(ax, ay, az), B = new THREE.Vector3(bx, by, bz);
    const dir = B.clone().sub(A), L = dir.length(); dir.normalize();
    const u = Math.abs(dir.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const v = new THREE.Vector3().crossVectors(dir, u).normalize(); u.crossVectors(v, dir).normalize();
    const h = s / 2;
    const cs = [0, 1, 2, 3].map((i) => u.clone().multiplyScalar(i === 0 || i === 3 ? -h : h).add(v.clone().multiplyScalar(i < 2 ? -h : h)));
    const P = (t, c) => A.clone().addScaledVector(dir, t).add(c);
    for (const c of cs) { const p = P(0, c), q = P(L, c); bar(p.x, p.y, p.z, q.x, q.y, q.z, 0.024, truss, 8, parent); }
    const n = Math.max(1, Math.round(L / bay));
    for (let k = 0; k < n; k++) {
      const t0 = k * L / n, t1 = (k + 1) * L / n;
      for (let f = 0; f < 4; f++) {
        const c0 = cs[f], c1 = cs[(f + 1) % 4];
        const p = P(k % 2 ? t1 : t0, c0), q = P(k % 2 ? t0 : t1, c1);
        bar(p.x, p.y, p.z, q.x, q.y, q.z, 0.009, trussLt, 5, parent);
      }
    }
  };
  for (const x of [5.05, 10.95]) {
    put(box(0.6, 0.02, 0.5, truss, x, 0.01, 12.98));
    trussSeg(x, 0.02, 12.98, x, 5.05, 12.98, 0.29, 0.8);
    // tirante curto até a moldura (atrás dela, z < 13,44)
    put(box(0.3, 0.04, 0.34, truss, x, 4.4, 13.2));
  }
  trussSeg(4.9, 5.2, 12.98, 11.1, 5.2, 12.98, 0.29, 0.7);
  for (const x of [6.0, 8.0, 10.0]) bar(x, 5.05, 13.0, x, 4.83, 13.42, 0.012, chromeK, 6);   // correntes da moldura

  // ======================= LOGO EM LED ACIMA DO TELÃO =======================
  // Letras caixa (anel + B) em pé sobre a travessa do telão, presas por uma base preta e duas
  // mãos-francesas; face acesa junto com o palco e halo retroiluminado atrás.
  {
    const LX = 8.0, LW = 1.2, LZ = 12.965, LB = 5.4, LY = LB + LW / 2;   // base do logo em y 5,4 (topo da travessa: 5,345)
    put(box(0.9, 0.05, 0.32, M.dark, LX, 5.37, 12.98));                   // base / calha de fiação
    for (const x of [LX - 0.32, LX + 0.32]) {
      put(box(0.03, 0.34, 0.03, M.dark, x, LB + 0.17, LZ - 0.03, nc));   // montantes atrás da face
      bar(x, 5.39, 12.84, x, LB + 0.3, LZ - 0.03, 0.01, M.dark, 5);         // mão-francesa
    }
    const halo = ctx.glowPlane(2.8, 2.8, 'palco', { color: 0xc2b4ff, base: 0.55, day: 0.2 });
    halo.position.set(LX, LY, LZ - 0.05); put(halo);
    const led = ctx.logo.relief(LW, { layout: 'mark', depth: 0.06, layers: 3, emissiveColor: 0xffffff });
    led.position.set(LX, LY, LZ); put(led);
    ctx.bindEmissive('palco', led.userData.face, 1.35);
  }

  // ======================= TRELIÇA FRONTAL + TORRES (segura os 4 refletores do cartão) =======================
  // Ground support: 2 torres no palco e a travessa passando por elas, com balanço de ~1 m para
  // os lados, onde ficam pendurados os line arrays (nada termina solto no ar).
  const TZ = 16.6, TY = 5.11, TS = 0.29, TXA = 0.5, TXB = 15.55;
  for (const x of [1.55, 14.45]) {
    put(box(0.7, 0.02, 0.7, truss, x, Y0 + 0.01, TZ));
    trussSeg(x, Y0 + 0.02, TZ, x, TY - TS / 2, TZ, TS, 0.6);
    put(box(TS + 0.04, TS + 0.04, TS + 0.04, truss, x, TY, TZ));      // bloco de canto
    // estabilizadores (outriggers) na base da torre
    for (const [dx, dz] of [[0.42, 0], [-0.42, 0], [0, 0.42], [0, -0.42]]) {
      const ex = x + dx, ez = TZ + dz;
      if (ex < X0 + 0.05 || ex > X1 - 0.05) continue;
      bar(x + dx * 0.4, Y0 + 0.35, TZ + dz * 0.4, ex, Y0 + 0.03, ez, 0.014, truss, 6);
    }
  }
  trussSeg(TXA, TY, TZ, TXB, TY, TZ, TS, 0.5);
  for (const x of [TXA, TXB]) put(box(0.03, TS + 0.03, TS + 0.03, truss, x, TY, TZ, nc));   // tampas das pontas
  // abraçadeiras (clamps) dos refletores, logo abaixo do banzo inferior
  for (const x of [3.5, 6.5, 9.5, 12.5]) {
    put(box(0.06, 0.05, TS + 0.03, truss, x, TY - TS / 2 - 0.035, TZ, nc));
    put(box(0.03, 0.03, 0.03, trussLt, x, TY - TS / 2 - 0.07, TZ, nc));
  }
  // cabos de alimentação correndo pela treliça e descendo pela torre da direita
  bar(0.9, TY + 0.1, TZ - 0.16, 15.15, TY + 0.1, TZ - 0.16, 0.011, cable, 5);
  bar(14.3, TY + 0.1, TZ - 0.16, 14.3, Y0 + 0.05, TZ - 0.16, 0.011, cable, 5);

  // ======================= LINE ARRAYS (pendurados nas pontas da treliça · x 0,9 e 15,15 · y ≈ 2,8–4,8) =======================
  const lineArray = () => {
    const g = G();
    g.add(box(0.8, 0.06, 0.62, truss, 0, 0.03, -0.05));                         // bumper
    for (const sx of [-1, 1]) g.add(box(0.03, 0.12, 0.62, truss, sx * 0.39, 0.09, -0.05));
    const angs = [0, 1, 2, 3.5, 5, 7, 9.5, 12].map((a) => a * Math.PI / 180);
    let py = 0, pz = 0;
    for (let i = 0; i < angs.length; i++) {
      const a = angs[i], hh = 0.245;
      const dy = -Math.cos(a) * hh / 2, dz = -Math.sin(a) * hh / 2;
      const cy = py + dy, cz = pz + dz;
      const cab = G(); cab.position.set(0, cy, cz); cab.rotation.x = a;
      cab.add(box(0.72, 0.23, 0.46, matte, 0, 0, -0.03));
      cab.add(box(0.68, 0.19, 0.012, grille, 0, 0, 0.206, nc));
      for (const sx of [-1, 1]) cab.add(box(0.02, 0.23, 0.44, trussLt, sx * 0.37, 0, -0.03, nc));  // ferragem lateral
      cab.add(box(0.05, 0.012, 0.004, trussLt, 0.28, -0.08, 0.213, nc));
      g.add(cab);
      py = cy + dy; pz = cz + dz;
    }
    // manilhas + cintas curtas de aço até o banzo inferior da treliça (y 4,965)
    for (const sx of [-1, 1]) {
      bar(sx * 0.3, 0.06, -0.05, sx * 0.24, 0.21, -0.05, 0.009, steel, 5, g);
      g.add(box(0.04, 0.03, 0.02, steel, sx * 0.3, 0.075, -0.05, nc));
    }
    // cabo de sinal descendo pela traseira
    bar(0.2, 0.06, -0.33, 0.2, -1.95, -0.52, 0.009, cable, 4, g);
    return g;
  };
  place(lineArray(), 0.9, TZ, 0.3, 4.75);
  place(lineArray(), 15.15, TZ, -0.3, 4.75);

  // ======================= SUBWOOFERS NO PISO, À FRENTE DO PALCO =======================
  const sub = () => {
    const g = G();
    g.add(box(0.62, 0.56, 0.6, matte, 0, 0.3, 0));
    g.add(box(0.56, 0.5, 0.012, grille, 0, 0.3, 0.303, nc));
    for (const sx of [-1, 1]) g.add(box(0.1, 0.02, 0.4, rubber, sx * 0.22, 0.01, 0));
    g.add(box(0.1, 0.012, 0.004, trussLt, 0.2, 0.08, 0.31, nc));
    return g;
  };
  for (const x of [3.05, 3.7, 12.35, 13.0]) place(sub(), x, 17.98, 0);
  // front fills sobre os subs de dentro (caixinhas inclinadas para as primeiras fileiras)
  for (const x of [3.7, 12.35]) {
    const g = G();
    const b = box(0.36, 0.22, 0.26, matte, 0, 0.13, 0); b.rotation.x = -0.18; g.add(b);
    const f = box(0.32, 0.18, 0.01, grille, 0, 0.15, 0.13, nc); f.rotation.x = -0.18; g.add(f);
    place(g, x, 17.98, x < 8 ? 0.25 : -0.25, 0.58);
  }

  // ======================= BANDA =======================
  const P = (g, x, z, ry = 0) => place(g, x, z, ry, Y0);

  // --- Bateria (lado esquerdo, fundo) sobre praticável com LED e cabine de acrílico ---
  const RX = 3.0, RZ = 14.6, RW = 2.4, RD = 2.0, RH = 0.3;
  put(box(RW, RH - 0.015, RD, skirt, RX, Y0 + (RH - 0.015) / 2, RZ));
  put(box(RW, 0.015, RD, deck, RX, Y0 + RH - 0.0075, RZ));
  put(box(RW - 0.1, 0.012, 0.01, amber, RX, Y0 + RH - 0.06, RZ + RD / 2 + 0.006, nc));
  put(box(RW + 0.02, 0.025, 0.03, trim, RX, Y0 + RH - 0.0125, RZ + RD / 2, nc));
  const drumKit = () => {
    const g = G();
    // tapete
    g.add(box(1.6, 0.006, 1.4, std({ color: 0x3a2320, roughness: 1 }), 0, 0.003, 0, nc));
    // bumbo (deitado, pele para +z) com o logo da igreja na pele de resposta preta
    const kick = rot(cyl(0.28, 0.28, 0.42, drumShell, 0, 0.29, 0.2, 20), Math.PI / 2); g.add(kick);
    const kh = rot(cyl(0.265, 0.265, 0.01, M.dark, 0, 0.29, 0.415, 20), Math.PI / 2); g.add(kh);
    g.add(rot(cyl(0.283, 0.283, 0.022, chromeK, 0, 0.29, 0.405, 20), Math.PI / 2));     // aro
    const kl = ctx.logo.mesh(0.42, 0, { layout: 'mark', color: '#f4f5f7', roughness: 0.6 });
    kl.position.set(0, 0.29, 0.4215); g.add(kl);
    for (const sx of [-1, 1]) g.add(bar(sx * 0.2, 0.1, 0.35, sx * 0.3, 0.0, 0.45, 0.01, chromeK, 5, g));
    // caixa, tons, surdo
    const drum = (r, h, x, y, z, tilt = 0) => {
      const d = G(); d.position.set(x, y, z); d.rotation.x = tilt;
      d.add(cyl(r, r, h, drumShell, 0, 0, 0, 18)); d.add(cyl(r - 0.005, r - 0.005, 0.006, drumHead, 0, h / 2 + 0.003, 0, 18));
      d.add(cyl(r + 0.006, r + 0.006, 0.012, chromeK, 0, h / 2 - 0.006, 0, 18));
      g.add(d);
    };
    drum(0.18, 0.14, -0.3, 0.62, -0.05, 0.12);                      // caixa
    drum(0.14, 0.2, -0.15, 0.78, 0.1, 0.35); drum(0.16, 0.2, 0.18, 0.8, 0.1, 0.35);  // tons
    drum(0.2, 0.36, 0.45, 0.4, -0.15);                               // surdo
    for (const [x, z] of [[0.33, -0.3], [0.57, -0.3], [0.45, -0.02]]) g.add(cyl(0.008, 0.008, 0.2, chromeK, x, 0.1, z, 5));
    g.add(bar(-0.3, 0, -0.05, -0.3, 0.55, -0.05, 0.01, chromeK, 5, g));
    // chimbal
    g.add(bar(-0.62, 0, -0.1, -0.62, 0.88, -0.1, 0.012, chromeK, 6, g));
    g.add(cyl(0.18, 0.18, 0.008, cymbal, -0.62, 0.86, -0.1, 20)); g.add(cyl(0.18, 0.18, 0.008, cymbal, -0.62, 0.88, -0.1, 20));
    // pratos (ataque, condução)
    for (const [x, y, z, r] of [[-0.45, 1.25, 0.25, 0.2], [0.45, 1.15, 0.1, 0.22], [0.15, 1.35, 0.3, 0.17]]) {
      g.add(bar(x * 0.9, 0, z - 0.15, x, y - 0.02, z, 0.01, chromeK, 5, g));
      g.add(rot(cyl(r, r, 0.008, cymbal, x, y, z, 20), 0.18 * Math.sign(z)));
    }
    // banco do baterista
    g.add(cyl(0.17, 0.17, 0.08, M.dark, 0, 0.52, -0.5, 16));
    g.add(cyl(0.02, 0.02, 0.48, chromeK, 0, 0.24, -0.5, 6));
    for (let i = 0; i < 3; i++) { const a = i * 2.094; g.add(bar(0, 0.12, -0.5, Math.cos(a) * 0.22, 0, -0.5 + Math.sin(a) * 0.22, 0.01, chromeK, 5, g)); }
    return g;
  };
  place(drumKit(), RX, RZ + 0.1, 0, Y0 + RH);
  // cabine de acrílico (5 painéis dobráveis em arco na frente e nas laterais)
  {
    const hS = 1.55, r = 0.87, cx = RX, cz = RZ + 0.1;
    const angs = [-1.1, -0.55, 0, 0.55, 1.1];
    for (const a of angs) {
      const x = cx + Math.sin(a) * r, z = cz + Math.cos(a) * r;
      const pnl = G(); pnl.position.set(x, Y0 + RH, z); pnl.rotation.y = a;
      pnl.add(box(0.62, hS, 0.01, acrylic, 0, hS / 2 + 0.02, 0, nc));
      pnl.add(box(0.62, 0.02, 0.014, acrylicEdge, 0, hS + 0.02, 0, nc));
      pnl.add(box(0.012, hS, 0.014, acrylicEdge, 0.31, hS / 2 + 0.02, 0, nc));
      put(pnl);
    }
    // painel absorvedor atrás do baterista (preto) sobre o praticável
    put(box(2.2, 1.2, 0.08, backing, RX, Y0 + RH + 0.6, RZ - RD / 2 + 0.08));
  }

  // --- Amplificadores ---
  const combo = (w, h, d, label) => {
    const g = G();
    g.add(box(w, h, d, matte, 0, h / 2 + 0.03, 0));
    g.add(box(w - 0.06, h * 0.62, 0.01, grille, 0, h * 0.36 + 0.03, d / 2 + 0.004, nc));
    g.add(box(w - 0.02, h * 0.18, 0.012, label, 0, h * 0.86 + 0.03, d / 2 + 0.002, nc));
    for (let i = 0; i < 5; i++) g.add(rot(cyl(0.012, 0.012, 0.015, chromeK, -w / 2 + 0.1 + i * 0.07, h * 0.86 + 0.03, d / 2 + 0.01, 8), Math.PI / 2));
    g.add(sph(0.01, ledRed, w / 2 - 0.06, h * 0.86 + 0.03, d / 2 + 0.01));
    for (const sx of [-1, 1]) g.add(box(0.04, 0.03, d - 0.05, rubber, sx * (w / 2 - 0.05), 0.015, 0));
    g.add(box(0.2, 0.02, 0.04, rubber, 0, h + 0.04, 0));   // alça
    return g;
  };
  const cream = std({ color: 0xd8cfb8, roughness: 0.7 });
  P(combo(0.62, 0.5, 0.28, cream), 11.85, 14.0, -0.2);          // amp de guitarra (tolex creme)
  P(combo(0.56, 0.8, 0.42, M.dark), 4.95, 14.0, 0.15);         // cabeçote + caixa do baixo

  // --- Teclados em suporte de dois andares (lado direito) ---
  const keyboard = (w) => {
    const g = G();
    g.add(box(w, 0.08, 0.3, M.dark, 0, 0.04, 0));
    g.add(box(w - 0.12, 0.022, 0.15, keysWhite, 0, 0.08, 0.06, nc));
    for (let i = 0; i < Math.floor((w - 0.12) / 0.045); i++) if ([1, 2, 4, 5, 6].includes(i % 7)) g.add(box(0.012, 0.012, 0.09, M.dark, -w / 2 + 0.06 + i * 0.045, 0.096, 0.035, nc));
    g.add(box(w * 0.3, 0.004, 0.06, M.screenOff, -w * 0.15, 0.082, -0.08, nc));
    for (let i = 0; i < 6; i++) g.add(cyl(0.01, 0.01, 0.015, M.graphite, w * 0.1 + i * 0.05, 0.088, -0.09, 8));
    return g;
  };
  const keyStand = () => {
    const g = G();
    for (const sx of [-1, 1]) {
      g.add(bar(sx * 0.45, 0, -0.3, sx * 0.45, 1.05, 0.05, 0.016, M.dark, 8, g));
      g.add(bar(sx * 0.45, 0, 0.3, sx * 0.45, 0.8, -0.05, 0.016, M.dark, 8, g));
      g.add(box(0.05, 0.02, 0.7, M.dark, sx * 0.45, 0.01, 0));
    }
    g.add(box(0.95, 0.025, 0.04, M.dark, 0, 0.78, -0.02)); g.add(box(0.95, 0.025, 0.04, M.dark, 0, 1.02, 0.02));
    const k1 = keyboard(1.25); k1.position.set(0, 0.79, 0.05); g.add(k1);
    const k2 = keyboard(1.0); k2.position.set(0, 1.035, -0.1); k2.rotation.x = -0.25; g.add(k2);
    // banqueta
    g.add(cyl(0.16, 0.16, 0.06, M.dark, 0, 0.62, 0.6, 16)); g.add(cyl(0.02, 0.02, 0.6, chromeK, 0, 0.3, 0.6, 6));
    g.add(cyl(0.2, 0.2, 0.02, chromeK, 0, 0.01, 0.6, 16));
    return g;
  };
  P(keyStand(), 12.85, 14.7, Math.PI - 0.45);

  // --- Instrumentos em pedestais ---
  const gtrStand = (bodyMat, kind) => {
    const g = G();
    // pedestal em A
    g.add(bar(0, 0.02, 0.12, 0, 0.62, -0.02, 0.009, M.dark, 5, g));
    for (const sx of [-1, 1]) g.add(bar(sx * 0.16, 0, 0.1, 0, 0.2, 0.05, 0.009, M.dark, 5, g));
    g.add(bar(0, 0, -0.14, 0, 0.2, 0.05, 0.009, M.dark, 5, g));
    const ins = G(); ins.position.set(0, 0.12, 0.08); ins.rotation.x = -0.2;
    if (kind === 'violao') {
      const b1 = cyl(0.19, 0.19, 0.1, bodyMat, 0, 0.22, 0, 20); b1.rotation.x = Math.PI / 2; ins.add(b1);
      const b2 = cyl(0.15, 0.15, 0.1, bodyMat, 0, 0.48, 0, 20); b2.rotation.x = Math.PI / 2; ins.add(b2);
      const hole = cyl(0.045, 0.045, 0.004, M.dark, 0, 0.4, 0.051, 14); hole.rotation.x = Math.PI / 2; ins.add(hole);
      ins.add(box(0.1, 0.012, 0.03, woodDk, 0, 0.26, 0.055, nc));
      ins.add(box(0.05, 0.5, 0.03, woodDk, 0, 0.86, 0)); ins.add(box(0.08, 0.16, 0.025, woodDk, 0, 1.18, -0.005));
    } else {
      // corpo sólido em dois bojos (cilindros achatados) + chifre superior
      const k = kind === 'baixo' ? 1.1 : 1;
      const lo = cyl(0.17 * k, 0.17 * k, 0.045, bodyMat, 0, 0.24 * k, 0, 18); lo.rotation.x = Math.PI / 2; ins.add(lo);
      const hi = cyl(0.125 * k, 0.125 * k, 0.045, bodyMat, 0.015, 0.42 * k, 0, 16); hi.rotation.x = Math.PI / 2; ins.add(hi);
      ins.add(rot(box(0.05, 0.16, 0.045, bodyMat, -0.1 * k, 0.52 * k, 0), 0, 0, 0.35));
      ins.add(box(0.14, 0.18, 0.006, M.dark, 0.03, 0.34 * k, 0.025, nc));      // escudo
      ins.add(box(0.07, 0.02, 0.012, chromeK, 0, 0.2 * k, 0.028, nc));          // ponte
      const nl = kind === 'baixo' ? 0.78 : 0.56, y0 = 0.5 * k;
      ins.add(box(0.045, nl, 0.025, woodDk, 0, y0 + nl / 2, 0));
      ins.add(box(0.07, 0.17, 0.02, M.dark, 0, y0 + nl + 0.08, 0));
    }
    g.add(ins);
    return g;
  };
  P(gtrStand(bassBody, 'baixo'), 5.6, 14.25, 0.2);
  P(gtrStand(sunburst, 'guitarra'), 11.2, 14.3, -0.25);
  P(gtrStand(woodGtr, 'violao'), 7.1, 15.8, 0.35);

  // --- Pedestais de microfone (5) ---
  const micStand = (h = 1.55, boom = 0) => {
    const g = G();
    for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.5; g.add(bar(0, 0.12, 0, Math.cos(a) * 0.26, 0.005, Math.sin(a) * 0.26, 0.008, M.dark, 5, g)); }
    g.add(bar(0, 0.12, 0, 0, h, 0, 0.011, M.dark, 6, g));
    const top = boom ? [0, h + 0.2, 0.45] : [0, h, 0];
    if (boom) g.add(bar(0, h - 0.05, -0.15, 0, h + 0.2, 0.45, 0.008, M.dark, 5, g));
    const mic = cyl(0.022, 0.014, 0.17, M.dark, top[0], top[1] + 0.06, top[2] + 0.02, 10); mic.rotation.x = 0.5; g.add(mic);
    g.add(sph(0.026, M.graphite, top[0], top[1] + 0.13, top[2] + 0.06));
    return g;
  };
  for (const [x, z, ry] of [[5.0, 16.3, 0], [6.35, 16.45, 0], [9.65, 16.45, 0], [11.0, 16.3, 0]]) P(micStand(), x, z, ry);
  P(micStand(1.2, 1), 13.55, 14.95, -2.5);             // boom do tecladista

  // --- Retornos (monitores de chão) virados para os músicos ---
  // perfil trapezoidal extrudado (tela inclinada voltada para +z local)
  const wedgeGeo = (() => {
    const sh = new THREE.Shape();
    // contorno no plano (−z, y): costas altas, frente baixa
    sh.moveTo(0.22, 0); sh.lineTo(-0.22, 0); sh.lineTo(-0.22, 0.1); sh.lineTo(0.1, 0.3); sh.lineTo(0.22, 0.3); sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.54, bevelEnabled: false });
    geo.rotateY(Math.PI / 2); geo.translate(-0.27, 0, 0);
    return geo;
  })();
  const wedge = () => {
    const g = G();
    const body = new THREE.Mesh(wedgeGeo, matte); body.castShadow = true; body.receiveShadow = true; g.add(body);
    const n = new THREE.Vector3(0, 0.32, 0.2).normalize();
    const f = box(0.48, 0.33, 0.01, grille, 0, 0.2 + n.y * 0.006, 0.06 + n.z * 0.006, nc); f.rotation.x = -Math.asin(n.y); g.add(f);
    return g;
  };
  for (const [x, z, ry] of [[5.0, 17.15, Math.PI], [6.35, 17.2, Math.PI], [9.65, 17.2, Math.PI], [11.0, 17.15, Math.PI], [RX + 1.2, 16.05, -2.4], [12.2, 15.95, 2.66]]) P(wedge(), x, z, ry);

  // --- Púlpito de acrílico no centro-frente (z ≈ 16,9): ripado claro por dentro com o letreiro
  //     BASE CHURCH em letras caixa prateadas, como uma miniatura da fachada ---
  {
    const g = G();
    g.add(box(0.66, 0.04, 0.46, M.dark, 0, 0.02, 0));                          // base preta
    g.add(box(0.6, 1.02, 0.02, acrylic, 0, 0.55, 0.2, nc));                    // frente
    for (const sx of [-1, 1]) g.add(box(0.02, 1.02, 0.4, acrylic, sx * 0.3, 0.55, 0, nc));
    const tp = box(0.64, 0.025, 0.46, acrylicEdge, 0, 1.08, 0, nc); tp.rotation.x = -0.18; g.add(tp);
    g.add(box(0.5, 0.02, 0.02, amber, 0, 0.05, 0.2, nc));                     // LED na base
    // miolo preto com o letreiro BASE CHURCH em letras caixa prateadas, ladeado por ripas de
    // madeira clara (miniatura do painel da fachada)
    g.add(box(0.5, 0.9, 0.02, backing, 0, 0.5, 0.035));
    for (const x of [-0.225, -0.17, 0.17, 0.225]) g.add(box(0.035, 0.9, 0.035, woodLt, x, 0.5, 0.06));
    const lg = ctx.logo.relief(0.27, { layout: 'full', depth: 0.02, layers: 3 });
    lg.position.set(0, 0.66, 0.047); g.add(lg);
    ctx.bindEmissive('palco', lg.userData.face, 0.3, { min: 0.1 });
    // microfone gooseneck + bíblia aberta
    g.add(bar(0.18, 1.1, -0.1, 0.1, 1.38, 0.05, 0.006, M.dark, 5, g));
    g.add(sph(0.018, M.graphite, 0.1, 1.39, 0.06));
    const bible = G(); bible.position.set(-0.05, 1.1, -0.02); bible.rotation.x = -0.18;
    bible.add(box(0.36, 0.02, 0.24, M.dark, 0, 0, 0)); bible.add(box(0.34, 0.012, 0.22, std({ color: 0xf3eee2, roughness: 0.9 }), 0, 0.016, 0, nc));
    g.add(bible);
    P(g, 8.0, 16.9, 0);
  }

  // --- Cabos no chão do palco (achatados, cast off) e caixa de multicabo ---
  put(box(0.36, 0.14, 0.24, matte, 8.0, Y0 + 0.07, 14.0));
  for (let i = 0; i < 8; i++) put(sph(0.012, i % 2 ? ledGreen : ledW, 7.87 + i * 0.037, Y0 + 0.1, 14.121));
  const floorCable = (pts) => { for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1]; bar(ax, Y0 + 0.008, az, bx, Y0 + 0.008, bz, 0.007, cable, 4); } };
  floorCable([[7.85, 14.1], [6.8, 14.6], [6.35, 15.8], [6.35, 16.45]]);
  floorCable([[8.15, 14.1], [9.3, 14.7], [9.65, 16.0], [9.65, 16.45]]);
  floorCable([[7.9, 14.12], [5.6, 15.0], [5.0, 16.3]]);
  floorCable([[8.1, 14.12], [10.4, 15.1], [11.0, 16.3]]);
  floorCable([[8.0, 14.12], [8.05, 15.6], [8.0, 16.7]]);
  floorCable([[5.0, 17.15], [5.4, 16.8], [6.35, 17.2]]);
  floorCable([[9.65, 17.2], [10.6, 16.8], [11.0, 17.15]]);
  floorCable([[11.85, 14.14], [12.4, 14.4], [12.85, 14.5]]);
  // marcações de posição (fita crepe cinza em "T") dos cantores
  const tape = std({ color: 0x8e8c86, roughness: 0.95 });
  for (const [x, z] of [[5.0, 16.75], [6.35, 16.9], [9.65, 16.9], [11.0, 16.75]]) {
    put(box(0.16, 0.002, 0.025, tape, x, Y0 + 0.002, z, nc));
    put(box(0.025, 0.002, 0.1, tape, x, Y0 + 0.002, z - 0.06, nc));
  }
  // pedaleira de guitarra
  put(box(0.55, 0.05, 0.22, M.dark, 10.8, Y0 + 0.025, 15.4));
  for (let i = 0; i < 4; i++) { put(box(0.09, 0.03, 0.1, [sunburst, bassBody, cream, M.graphite][i], 10.6 + i * 0.13, Y0 + 0.065, 15.4)); put(sph(0.008, ledRed, 10.6 + i * 0.13, Y0 + 0.085, 15.34)); }
  // setlist colado no chão + garrafinhas de água
  for (const [x, z] of [[6.2, 16.9], [9.8, 16.9]]) put(box(0.21, 0.002, 0.3, std({ color: 0xfbfaf5, roughness: 0.9 }), x, Y0 + 0.001, z, nc));
  for (const [x, z] of [[4.75, 16.7], [11.25, 16.7], [RX + 0.9, 15.4]]) put(cyl(0.032, 0.032, 0.2, std({ color: 0xbfe0f0, roughness: 0.1, transparent: true, opacity: 0.6 }), x, (x === RX + 0.9 ? Y0 + RH : Y0) + 0.1, z, 10));

  // ======================= VASOS COM CICAS (pretos, como na fachada) =======================
  const cicaPot = (s = 1) => {
    const g = G();
    g.add(cyl(0.22 * s, 0.16 * s, 0.75 * s, potBlack, 0, 0.375 * s, 0, 18));
    g.add(cyl(0.2 * s, 0.2 * s, 0.02, pebble, 0, 0.74 * s, 0, 16));
    g.add(cyl(0.07 * s, 0.09 * s, 0.25 * s, M.trunk, 0, 0.85 * s, 0, 8));
    const n = 10;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rnd() * 0.3, L = (0.55 + rnd() * 0.2) * s, tilt = 0.55 + (i % 3) * 0.28;
      const fr = G(); fr.position.set(0, 0.95 * s, 0); fr.rotation.set(0, a, 0);
      const leaf = box(0.13 * s, 0.012, L, i % 2 ? cica : cica2, 0, 0, L / 2, nc);
      const inner = G(); inner.rotation.x = -Math.PI / 2 + tilt; inner.add(leaf); leaf.rotation.x = Math.PI / 2;
      leaf.position.set(0, L / 2, 0);
      fr.add(inner); g.add(fr);
    }
    return g;
  };
  place(cicaPot(0.8), 0.78, 18.1, 0);
  place(cicaPot(0.8), 15.27, 18.1, 0);
  P(cicaPot(0.85), 14.35, 13.85, 0);

  // ======================= BACKSTAGE (z 12,55–13,4, nível do piso) =======================
  // Vão livre da porta de vidro: x 12,9–15,1 · z 12,4–13,3 (não ocupar)
  const roadCase = (w, h, d, wheels = true) => {
    const g = G();
    const y0 = wheels ? 0.09 : 0;
    g.add(box(w, h, d, matte, 0, y0 + h / 2, 0));
    for (const yy of [y0 + 0.012, y0 + h - 0.012]) g.add(box(w + 0.012, 0.024, d + 0.012, trussLt, 0, yy, 0, nc));
    for (const sx of [-1, 1]) g.add(box(0.12, 0.03, 0.012, M.chrome, sx * w * 0.3, y0 + h * 0.75, d / 2 + 0.008, nc));
    if (wheels) for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const wl = cyl(0.04, 0.04, 0.03, rubber, sx * (w / 2 - 0.07), 0.04, sz * (d / 2 - 0.07), 10); wl.rotation.z = Math.PI / 2; g.add(wl);
    }
    return g;
  };
  // estêncil do logo na tampa dos cases (uma textura/material só → funde num draw call)
  const stencil = ctx.logo.mesh(0.42, 0, { layout: 'wide', color: '#e9e6df', roughness: 0.85 });
  const stamp = (x, y, z, ry = 0) => {
    const m = new THREE.Mesh(stencil.geometry, stencil.material);
    m.rotation.set(-Math.PI / 2, 0, ry); m.position.set(x, y + 0.002, z); m.castShadow = false; m.receiveShadow = true; put(m);
  };
  // (x 0,2–1,25 fica livre: passagem do templo para o backstage)
  place(roadCase(0.9, 0.55, 0.6), 1.8, 12.97, 0);
  place(roadCase(0.9, 0.45, 0.6, false), 1.8, 12.97, 0, 0.64);
  stamp(1.8, 1.09, 12.97);
  place(roadCase(0.7, 0.7, 0.55), 2.85, 12.95, 0);
  stamp(2.85, 0.79, 12.95, 0.1);
  // rack de receptores sem fio (LEDs verdes) + cabo em carretel
  {
    const g = roadCase(0.6, 1.0, 0.55);
    for (let r = 0; r < 4; r++) {
      g.add(box(0.5, 0.16, 0.01, M.dark, 0, 0.2 + r * 0.22, 0.281, nc));
      g.add(box(0.12, 0.05, 0.004, M.screenOff, -0.12, 0.2 + r * 0.22, 0.288, nc));
      g.add(sph(0.01, ledGreen, 0.15, 0.2 + r * 0.22, 0.29)); g.add(sph(0.01, r === 2 ? ledRed : ledGreen, 0.19, 0.2 + r * 0.22, 0.29));
    }
    place(g, 3.75, 12.96, 0);
  }
  {
    const g = G();
    for (const sx of [-1, 1]) { const d = cyl(0.25, 0.25, 0.02, M.dark, sx * 0.15, 0.27, 0, 18); d.rotation.z = Math.PI / 2; g.add(d); }
    const core = cyl(0.19, 0.19, 0.28, std({ color: 0xc2410c, roughness: 0.7 }), 0, 0.27, 0, 18); core.rotation.z = Math.PI / 2; g.add(core);
    place(g, 7.3, 12.95, 0);
  }
  place(roadCase(1.1, 0.35, 0.45), 8.9, 12.95, 0);
  stamp(8.9, 0.44, 12.95, -0.05);
  // estojos de instrumento encostados
  for (const [x, mat] of [[11.7, M.dark], [12.1, std({ color: 0x3b2a1e, roughness: 0.8 })]]) {
    const c = box(0.4, 1.05, 0.12, mat, x, 0.53, 12.72); c.rotation.z = 0.08; put(c);
  }
}
