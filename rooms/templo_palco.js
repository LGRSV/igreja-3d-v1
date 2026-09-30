function roomTemploPalco(ctx) {
  // ---------------------------------------------------------------------------
  // PALCO DO TEMPLO — na PAREDE LATERAL LONGA x = 0 (correção do cliente; plateia olha para −x)
  // Fiel à foto templo_foto.jpg e aos vídeos v6/v8:
  //  · plataforma x 0,15–5,0 · z 19,6–36,6 · topo y 1,0 — piso claro (compensado/madeira clara), testeira preta;
  //  · escadas pretas com corrimão inox: ponta z baixo à frente da testeira (sobe para −x); ponta z alto na lateral
  //    do palco, junto à parede (sobe para −z) — pedido do cliente;
  //  · 2 caixinhas pretas no piso à frente; retornos (wedges) no palco;
  //  · bateria Pearl (pele de resposta branca) sobre praticável preto no lado z baixo (direita de quem olha o palco),
  //    teclado em suporte X no lado z alto, violão e baixo em pedestais, pedestais de microfone, pedaleiras, banco alto;
  //  · barra de fixação do telão (grampos pretos acima da moldura); 2 telas brancas de projeção no alto da parede;
  //  · treliça preta tipo escada acima do telão (segura os 4 moving heads do cartão) + 2 barras de LED + 3 pares;
  //  · line arrays (2 clusters por lado, um reto e um angulado) pendurados por correntes até barras de rigging
  //    presas sob as tesouras brancas da cobertura (z 18,5–23,5 e 33,5–38,5);
  //  · perfis pretos verticais na parede alta (fora dos módulos das tesouras).
  // Objetos do cartão NÃO recriados: telão (painel x 0,12–0,24 · z 23,85–32,35 · y 1,10–4,20), moving heads
  // (x 0,8 · y 6,05 · z 23,9/26,7/29,5/32,3, grampo até y 6,30), LEDs do som (x 4,9 · z 19,8/36,4).
  // Nada alto (> y 2,5) na faixa dos feixes (x 0,8–4,6 × z de cada cabeça ± 1 m).
  // Emissivos: telas brancas → 'telao'; pares/barras de LED → 'palco'.
  // ---------------------------------------------------------------------------
  const THREE = ctx.THREE, M = ctx.M;
  const box = (...a) => ctx.box(...a), cyl = (...a) => ctx.cyl(...a), sph = (...a) => ctx.sph(...a);
  const place = (...a) => ctx.place(...a), std = (o) => ctx.std(o);
  const put = (m) => { ctx.add(m); return m; };
  const G = () => new THREE.Group();
  const rot = (m, x = 0, y = 0, z = 0) => { m.rotation.set(x, y, z); return m; };
  const nc = { cast: false };
  const HP = Math.PI / 2;
  const up = new THREE.Vector3(0, 1, 0);
  // barra cilíndrica entre dois pontos (tubos, correntes, pedestais inclinados)
  const bar = (x1, y1, z1, x2, y2, z2, r, mat, seg = 6, parent = null) => {
    const a = new THREE.Vector3(x1, y1, z1), b = new THREE.Vector3(x2, y2, z2);
    const d = b.clone().sub(a), len = d.length();
    const m = cyl(r, r, len, mat, 0, 0, 0, seg);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(up, d.normalize());
    m.castShadow = r > 0.015;
    if (parent) parent.add(m); else put(m);
    return m;
  };

  // ---------------- Materiais (mesmas opções → mesmo material → funde no merge) ----------------
  const deckMat  = std({ color: 0xd9c9ab, roughness: 0.5 });                          // piso do palco: madeira clara / bege
  const deckSeam = std({ color: 0x9c8c70, roughness: 0.8 });                          // juntas das chapas
  const blk      = std({ color: 0x131315, roughness: 0.82 });                         // testeira / praticável / escadas
  const blkSeam  = std({ color: 0x0a0a0b, roughness: 1 });
  const steelBlk = std({ color: 0x1c1d20, roughness: 0.45, metalness: 0.55 });        // treliça / perfis pretos
  const inox     = std({ color: 0xc9cdd2, roughness: 0.22, metalness: 0.9 });         // corrimãos
  const matte    = std({ color: 0x1b1b1e, roughness: 0.8 });                          // caixas de som
  const grille   = std({ color: 0x2c2d31, roughness: 0.95 });
  const rigGray  = std({ color: 0x5a5c62, roughness: 0.4, metalness: 0.7 });          // ferragens
  const chain    = std({ color: 0x8d9096, roughness: 0.35, metalness: 0.8 });         // correntes / cabos de aço
  const cable    = std({ color: 0x0b0b0c, roughness: 0.8 });
  const rubber   = std({ color: 0x101011, roughness: 1 });
  const chromeK  = M.chrome;
  const cymbal   = std({ color: 0xc9a24a, roughness: 0.3, metalness: 0.85 });
  const shell    = std({ color: 0x2b2c31, roughness: 0.3, metalness: 0.5 });          // cascos cinza-grafite (Pearl Export)
  const headW    = std({ color: 0xf0ede6, roughness: 0.7 });
  const keysW    = std({ color: 0xf4f2ec, roughness: 0.5 });
  const woodGtr  = std({ color: 0xd08a3a, roughness: 0.45 });                         // violão (tampo mel/laranja, foto)
  const woodDk   = std({ color: 0x5b3a22, roughness: 0.5 });
  const natural  = std({ color: 0xc8a676, roughness: 0.45 });                         // baixo natural (foto)
  const cream    = std({ color: 0xd8cfb8, roughness: 0.7 });
  const pedalC   = [std({ color: 0xc2410c, roughness: 0.5 }), std({ color: 0x2f7d4a, roughness: 0.5 }),
                    std({ color: 0xd9b21c, roughness: 0.5 }), std({ color: 0x2f5f9b, roughness: 0.5 })];
  const redSign  = std({ color: 0xc81e1e, roughness: 0.6 });
  const whiteP   = std({ color: 0xf4f4f2, roughness: 0.7 });
  // emissivos ligados às entidades
  const screenMat = std({ color: 0xeeeeec, roughness: 0.85, emissive: 0xf2f0ff, emissiveIntensity: 0.3 });   // telas de projeção
  const lensMat   = std({ color: 0x3a3642, roughness: 0.3, emissive: 0xd8c8ff, emissiveIntensity: 1.0 });    // lente dos pares
  const ledBarMat = std({ color: 0xd8d6cc, roughness: 0.35, emissive: 0xfff4e0, emissiveIntensity: 1.0 });   // barras de LED (brancas na foto)
  const ledG      = std({ color: 0x1e5a2e, emissive: 0x3ee07a, emissiveIntensity: 0.7 });
  ctx.bindEmissive('telao', screenMat, 0.32, { min: 0 });
  ctx.bindEmissive('palco', lensMat, 1.3, { min: 0 });
  ctx.bindEmissive('palco', ledBarMat, 1.1, { min: 0 });
  ctx.bindEmissive('som', ledG, 0.7);

  // ======================= PLATAFORMA =======================
  const X0 = 0.15, X1 = 5.0, Z0 = 19.6, Z1 = 36.6, SY = 1.0, CX = (X0 + X1) / 2, CZ = (Z0 + Z1) / 2;
  const DT = 0.04;                                           // espessura do tampo (borda clara aparente na frente)
  put(box(X1 - X0, SY - DT, Z1 - Z0, blk, CX, (SY - DT) / 2, CZ));
  put(box(X1 - X0, DT, Z1 - Z0, deckMat, CX, SY - DT / 2, CZ));
  // juntas das chapas (1,22 × 2,44): ao longo de z a cada 1,22 m; ao longo de x a cada 2,44 m
  for (let z = Z0 + 1.22; z < Z1 - 0.2; z += 1.22) put(box(X1 - X0 - 0.04, 0.002, 0.006, deckSeam, CX, SY + 0.001, z, nc));
  put(box(0.006, 0.002, Z1 - Z0 - 0.04, deckSeam, X1 - 2.44, SY + 0.001, CZ, nc));
  // testeira preta: faixa de sombra sob o tampo + juntas verticais dos painéis
  put(box(0.012, 0.05, Z1 - Z0, blkSeam, X1 + 0.006, SY - DT - 0.03, CZ, nc));
  for (let z = Z0 + 2.44; z < Z1 - 0.3; z += 2.44) put(box(0.008, SY - DT - 0.08, 0.012, blkSeam, X1 + 0.004, (SY - DT - 0.08) / 2 + 0.02, z, nc));
  put(box(0.02, 0.05, Z1 - Z0 - 0.02, rubber, X1 - 0.03, 0.025, CZ, nc));    // rodapé recuado

  // ======================= ESCADAS DO PALCO + CORRIMÃO INOX =======================
  // 6 espelhos de 1/6 m, 5 pisos de 0,26 m (1,3 m de projeção), largura 1,1 m. Montada num grupo com a face do palco
  // em x local 0 e subindo para −x local: a da ponta z baixo fica à frente da testeira (sobe para −x); a da ponta
  // z alto (lado esquerdo de quem olha o palco) foi para a lateral do palco, junto à parede (pedido do cliente).
  const NR = 6, RISE = SY / NR, RUN = 0.26, SW = 1.1;
  const stair = () => {
    const g = G();
    const add = (m) => { g.add(m); return m; };
    for (let k = 1; k < NR; k++) {
      const h = k * RISE, xb = (NR - k) * RUN;
      add(box(xb, h, SW, blk, xb / 2, h / 2, 0));
      add(box(0.03, 0.012, SW, rigGray, xb - 0.015, h - 0.006, 0, nc));             // cantoneira do bocel
    }
    // corrimão inox nos dois lados (2 tubos: mão + intermediário), montantes em baixo, no meio e em cima
    for (const sd of [-1, 1]) {
      const z = sd * (SW / 2 - 0.04);
      const xb = (NR - 1) * RUN - 0.1, xt = 0.07;                                    // 1,2 → 0,07 da face do palco
      const yb = RISE, yt = (NR - 1) * RISE;                                          // degrau 1 e degrau 5
      const xm = (xb + xt) / 2, ym = RISE * Math.floor(NR - xm / RUN), yr = yb + (yt - yb) * (xb - xm) / (xb - xt);
      bar(xb, yb, z, xb, yb + 0.95, z, 0.02, inox, 10, g);
      bar(xm, ym, z, xm, yr + 0.95, z, 0.018, inox, 10, g);
      bar(xt, yt, z, xt, yt + 0.95, z, 0.02, inox, 10, g);
      bar(xb, yb + 0.95, z, xt, yt + 0.95, z, 0.021, inox, 10, g);                    // mão
      bar(xb, yb + 0.45, z, xt, yt + 0.45, z, 0.013, inox, 8, g);                     // intermediário
      // grade de barras verticais finas (como na foto)
      for (let i = 1; i < 7; i++) {
        const t = i / 7, x = xb + (xt - xb) * t, yl = yb + (yt - yb) * t;
        bar(x, yl + 0.47, z, x, yl + 0.93, z, 0.006, inox, 5, g);
      }
    }
    return g;
  };
  place(stair(), X1, Z0 + 0.6, 0);           // frente, ponta z baixo: x 5,0–6,3 · z 19,65–20,75
  place(stair(), X0 + 0.7, Z1, -HP);         // lateral z alto, junto à parede: x 0,3–1,4 · z 36,6–37,9

  // ======================= CAIXAS NO PISO À FRENTE (front fill) =======================
  const floorBox = () => {
    const g = G();
    g.add(box(0.56, 0.5, 0.46, matte, 0, 0.25, 0));
    g.add(box(0.5, 0.42, 0.012, grille, 0, 0.26, 0.232, nc));
    g.add(box(0.1, 0.012, 0.004, rigGray, 0.19, 0.06, 0.238, nc));
    return g;
  };
  place(floorBox(), 5.38, 25.3, HP);
  place(floorBox(), 5.38, 30.9, HP);

  // ======================= RETORNOS (wedges) =======================
  const wedgeGeo = (() => {
    const sh = new THREE.Shape();
    sh.moveTo(0.22, 0); sh.lineTo(-0.2, 0); sh.lineTo(-0.2, 0.1); sh.lineTo(0.1, 0.3); sh.lineTo(0.22, 0.3); sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.54, bevelEnabled: false });
    geo.rotateY(HP); geo.translate(-0.27, 0, 0);
    return geo;
  })();
  const wedge = () => {
    const g = G();
    const body = new THREE.Mesh(wedgeGeo, matte); body.castShadow = true; body.receiveShadow = true; g.add(body);
    const f = box(0.46, 0.3, 0.01, grille, 0, 0.207, 0.054, nc); f.rotation.x = -0.98; g.add(f);
    return g;
  };
  // pontas (angulados para o centro) — longe dos LEDs do som (x 4,85–4,95)
  place(wedge(), 4.15, 20.75, -0.93, SY);
  place(wedge(), 4.15, 35.45, -2.21, SY);
  // retornos baixos na borda da frente (caixas pretas compridas da foto), virados para os músicos (−x)
  const lowWedge = () => {
    const g = G();
    const b = box(0.95, 0.15, 0.34, matte, 0, 0.09, 0); b.rotation.x = -0.12; g.add(b);
    const f = box(0.88, 0.1, 0.01, grille, 0, 0.1, 0.17, nc); f.rotation.x = -0.12; g.add(f);
    return g;
  };
  place(lowWedge(), 4.62, 26.0, -HP, SY);
  place(lowWedge(), 4.62, 30.0, -HP, SY);

  // ======================= BATERIA PEARL SOBRE PRATICÁVEL PRETO (lado z baixo) =======================
  const RX0 = 0.55, RX1 = 3.05, RZ0 = 22.0, RZ1 = 24.8, RH = 0.25;
  put(box(RX1 - RX0, RH, RZ1 - RZ0, blk, (RX0 + RX1) / 2, SY + RH / 2, (RZ0 + RZ1) / 2));
  put(box(0.012, 0.02, RZ1 - RZ0, blkSeam, RX1 + 0.006, SY + RH - 0.03, (RZ0 + RZ1) / 2, nc));
  // pele de resposta branca com "Pearl" e furo de porta (textura de canvas; logo da marca)
  const pearlTex = ctx.makeTex(256, (g, s) => {
    g.fillStyle = '#f2f0ea'; g.fillRect(0, 0, s, s);
    g.fillStyle = '#1a1a1a'; g.font = 'italic bold 58px Georgia, "Times New Roman", serif';
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Pearl', s * 0.5, s * 0.3);
    g.beginPath(); g.arc(s * 0.68, s * 0.68, s * 0.09, 0, Math.PI * 2); g.fillStyle = '#2a2320'; g.fill();
    g.lineWidth = 5; g.strokeStyle = '#8a8580'; g.stroke();
  });
  const pearlMat = std({ color: 0xffffff, map: pearlTex, roughness: 0.6 });
  const drumKit = () => {
    const g = G();                       // local: +z = frente (plateia), x = largura
    g.add(box(1.6, 0.006, 1.5, std({ color: 0x2a2a2d, roughness: 1 }), 0, 0.003, -0.05, nc));   // tapete
    // bumbo 22" (deitado, pele de resposta para +z)
    g.add(rot(cyl(0.28, 0.28, 0.42, shell, 0, 0.29, 0.2, 22), HP));
    g.add(rot(cyl(0.285, 0.285, 0.024, chromeK, 0, 0.29, 0.405, 22), HP));
    g.add(rot(cyl(0.285, 0.285, 0.024, chromeK, 0, 0.29, -0.005, 22), HP));
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.272, 28), pearlMat);
    face.position.set(0, 0.29, 0.419); face.castShadow = false; g.add(face);
    for (const sx of [-1, 1]) bar(sx * 0.2, 0.1, 0.35, sx * 0.3, 0.0, 0.45, 0.01, chromeK, 5, g);   // esporas
    // caixa, tons (sobre o bumbo), surdo
    const drum = (r, h, x, y, z, tilt = 0) => {
      const d = G(); d.position.set(x, y, z); d.rotation.x = tilt;
      d.add(cyl(r, r, h, shell, 0, 0, 0, 18)); d.add(cyl(r - 0.005, r - 0.005, 0.006, headW, 0, h / 2 + 0.003, 0, 18));
      d.add(cyl(r + 0.006, r + 0.006, 0.014, chromeK, 0, h / 2 - 0.007, 0, 18));
      g.add(d);
    };
    drum(0.18, 0.14, -0.32, 0.62, -0.1, 0.12);                        // caixa
    bar(-0.32, 0, -0.1, -0.32, 0.55, -0.1, 0.01, chromeK, 5, g);
    drum(0.13, 0.19, -0.14, 0.78, 0.12, 0.35); drum(0.15, 0.2, 0.16, 0.8, 0.12, 0.35);   // tons
    drum(0.2, 0.36, 0.46, 0.42, -0.16);                                // surdo
    for (const [x, z] of [[0.34, -0.31], [0.58, -0.31], [0.46, -0.01]]) g.add(cyl(0.008, 0.008, 0.24, chromeK, x, 0.12, z, 5));
    // chimbal
    bar(-0.64, 0, -0.14, -0.64, 0.86, -0.14, 0.012, chromeK, 6, g);
    for (let i = 0; i < 3; i++) { const a = i * 2.094; bar(-0.64, 0.25, -0.14, -0.64 + Math.cos(a) * 0.2, 0, -0.14 + Math.sin(a) * 0.2, 0.008, chromeK, 5, g); }
    g.add(cyl(0.18, 0.18, 0.008, cymbal, -0.64, 0.86, -0.14, 20)); g.add(cyl(0.18, 0.18, 0.008, cymbal, -0.64, 0.88, -0.14, 20));
    // pratos: ataque, condução, china (pedestais com tripé; topo ≤ 1,12 acima do praticável)
    for (const [x, y, z, r] of [[-0.46, 1.1, 0.25, 0.2], [0.62, 1.02, 0.12, 0.23], [0.2, 1.12, 0.32, 0.17]]) {
      const bx = x * 0.9, bz = z - 0.2;
      bar(bx, 0, bz, x, y - 0.02, z, 0.01, chromeK, 5, g);
      for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.4; bar(bx, 0.3, bz, bx + Math.cos(a) * 0.22, 0, bz + Math.sin(a) * 0.22, 0.008, chromeK, 5, g); }
      g.add(rot(cyl(r, r, 0.008, cymbal, x, y, z, 20), 0.2 * Math.sign(z), 0, -0.12 * Math.sign(x)));
    }
    // banco do baterista
    g.add(cyl(0.17, 0.17, 0.08, M.dark, 0, 0.52, -0.52, 16));
    g.add(cyl(0.02, 0.02, 0.48, chromeK, 0, 0.24, -0.52, 6));
    for (let i = 0; i < 3; i++) { const a = i * 2.094; bar(0, 0.12, -0.52, Math.cos(a) * 0.22, 0, -0.52 + Math.sin(a) * 0.22, 0.01, chromeK, 5, g); }
    return g;
  };
  place(drumKit(), 1.95, 23.45, HP, SY + RH);          // de frente para a plateia (+x)

  // ======================= INSTRUMENTOS EM PEDESTAIS =======================
  const gtrStand = (bodyMat, kind) => {
    const g = G();                       // instrumento virado para +z local
    bar(0, 0.02, -0.1, 0, 0.66, -0.06, 0.009, M.dark, 5, g);
    for (const sx of [-1, 1]) bar(sx * 0.17, 0, 0.12, 0, 0.18, 0.02, 0.009, M.dark, 5, g);
    bar(0, 0, -0.16, 0, 0.18, 0.02, 0.009, M.dark, 5, g);
    g.add(box(0.34, 0.03, 0.06, M.dark, 0, 0.16, 0.06));
    const ins = G(); ins.position.set(0, 0.14, 0.02); ins.rotation.x = -0.2;
    if (kind === 'violao') {
      const b1 = rot(cyl(0.19, 0.19, 0.1, bodyMat, 0, 0.22, 0, 22), HP); ins.add(b1);
      const b2 = rot(cyl(0.15, 0.15, 0.1, bodyMat, 0, 0.47, 0, 22), HP); ins.add(b2);
      ins.add(rot(cyl(0.045, 0.045, 0.004, M.dark, 0, 0.38, 0.051, 14), HP));
      ins.add(box(0.1, 0.012, 0.03, woodDk, 0, 0.25, 0.055, nc));
      ins.add(box(0.05, 0.5, 0.03, woodDk, 0, 0.84, 0)); ins.add(box(0.08, 0.16, 0.025, woodDk, 0, 1.16, -0.005));
    } else {
      const k = 1.1;
      ins.add(rot(cyl(0.17 * k, 0.17 * k, 0.045, bodyMat, 0, 0.24 * k, 0, 18), HP));
      ins.add(rot(cyl(0.125 * k, 0.125 * k, 0.045, bodyMat, 0.015, 0.42 * k, 0, 16), HP));
      ins.add(rot(box(0.05, 0.16, 0.045, bodyMat, -0.1 * k, 0.52 * k, 0), 0, 0, 0.35));
      ins.add(box(0.14, 0.18, 0.006, M.dark, 0.03, 0.34 * k, 0.025, nc));
      ins.add(box(0.07, 0.02, 0.012, chromeK, 0, 0.2 * k, 0.028, nc));
      ins.add(box(0.045, 0.78, 0.025, woodDk, 0, 0.55 + 0.39, 0));
      ins.add(box(0.07, 0.17, 0.02, M.dark, 0, 0.55 + 0.78 + 0.08, 0));
    }
    g.add(ins);
    return g;
  };
  place(gtrStand(natural, 'baixo'), 2.35, 25.25, HP, SY);
  place(gtrStand(woodGtr, 'violao'), 1.6, 29.55, HP, SY);

  // ======================= TECLADO EM SUPORTE X (lado z alto) + BANCO ALTO =======================
  {
    const g = G();                       // teclas ao longo de x local, músico em −z local
    for (const s of [-1, 1]) {           // X no plano do comprimento
      bar(-0.36, 0.02, s * 0.2, 0.36, 0.84, s * 0.2, 0.017, M.dark, 8, g);
      bar(0.36, 0.02, s * 0.2, -0.36, 0.84, s * 0.2, 0.017, M.dark, 8, g);
    }
    for (const x of [-0.37, 0.37]) g.add(box(0.05, 0.03, 0.46, M.dark, x, 0.015, 0));    // pés
    for (const x of [-0.36, 0.36]) g.add(box(0.05, 0.03, 0.44, M.dark, x, 0.85, 0));     // braços
    g.add(cyl(0.025, 0.025, 0.1, chromeK, 0, 0.43, 0, 10));                               // pino do X
    const kb = G(); kb.position.set(0, 0.87, 0);
    kb.add(box(1.3, 0.09, 0.32, M.dark, 0, 0.045, 0));
    kb.add(box(1.2, 0.022, 0.15, keysW, 0, 0.09, -0.07, nc));
    for (let i = 0; i < 26; i++) if ([1, 2, 4, 5, 6].includes(i % 7)) kb.add(box(0.012, 0.012, 0.09, M.dark, -0.585 + i * 0.045, 0.106, -0.045, nc));
    kb.add(box(0.3, 0.004, 0.05, M.screenOff, 0.25, 0.092, 0.09, nc));
    g.add(kb);
    // pedal de sustain + cabo
    g.add(box(0.08, 0.03, 0.2, M.dark, 0.25, 0.015, -0.45));
    place(g, 1.75, 31.4, HP, SY);                        // local +z → +x: músico (−z local) fica do lado da parede
  }
  {
    // banco alto preto (como na foto, junto à parede à esquerda do telão)
    const g = G();
    g.add(box(0.36, 0.035, 0.36, M.dark, 0, 0.76, 0));
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(rot(box(0.03, 0.78, 0.03, M.dark, sx * 0.15, 0.38, sz * 0.15), sz * 0.05, 0, -sx * 0.05));
    g.add(box(0.33, 0.02, 0.02, M.dark, 0, 0.28, 0.15)); g.add(box(0.33, 0.02, 0.02, M.dark, 0, 0.28, -0.15));
    g.add(box(0.02, 0.02, 0.33, M.dark, 0.15, 0.28, 0)); g.add(box(0.02, 0.02, 0.33, M.dark, -0.15, 0.28, 0));
    place(g, 0.7, 32.95, 0, SY);
  }

  // ======================= PEDESTAIS DE MICROFONE =======================
  const micStand = (h = 1.35, boom = 0) => {
    const g = G();
    for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.5; bar(0, 0.12, 0, Math.cos(a) * 0.26, 0.005, Math.sin(a) * 0.26, 0.008, M.dark, 5, g); }
    bar(0, 0.12, 0, 0, h, 0, 0.011, M.dark, 6, g);
    const top = boom ? [0, h + 0.18, 0.42] : [0, h, 0];
    if (boom) bar(0, h - 0.05, -0.15, 0, h + 0.18, 0.42, 0.008, M.dark, 5, g);
    g.add(rot(cyl(0.022, 0.014, 0.17, M.dark, top[0], top[1] + 0.05, top[2] + 0.02, 10), 0.5));
    g.add(sph(0.026, M.graphite, top[0], top[1] + 0.12, top[2] + 0.06));
    return g;
  };
  place(micStand(1.15, 1), 3.35, 26.2, HP, SY);          // topo ≤ y 2,5
  place(micStand(1.3), 3.55, 28.1, 0, SY);               // vocal central
  place(micStand(1.3), 3.25, 29.1, 0, SY);
  place(micStand(1.1, 1), 2.35, 32.15, -2.4, SY);        // boom do tecladista

  // ======================= PEDALEIRAS, DI, CABOS =======================
  const pedalboard = (n, w, baseMat = M.dark) => {
    const g = G();
    g.add(box(w, 0.045, 0.3, baseMat, 0, 0.0225, 0));
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + 0.08 + i * (w - 0.16) / Math.max(1, n - 1);
      g.add(box(0.075, 0.035, 0.12, pedalC[i % 4], x, 0.062, 0.02));
      g.add(sph(0.007, ledG, x, 0.082, -0.03));
    }
    return g;
  };
  place(pedalboard(4, 0.6), 3.15, 25.75, -HP, SY);
  place(pedalboard(3, 0.5), 3.35, 28.55, -HP, SY);
  {
    // multiefeito claro (caixa bege/metálica da foto) + DI
    const g = G();
    g.add(box(0.62, 0.07, 0.28, cream, 0, 0.035, 0));
    g.add(box(0.5, 0.004, 0.06, M.screenOff, 0, 0.072, -0.07, nc));
    for (let i = 0; i < 5; i++) g.add(box(0.07, 0.015, 0.07, rigGray, -0.22 + i * 0.11, 0.078, 0.06, nc));
    place(g, 3.2, 27.45, -HP, SY);
    put(box(0.12, 0.06, 0.16, rigGray, 2.9, SY + 0.03, 26.85));
  }
  const floorCable = (pts) => { for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1]; bar(ax, SY + 0.008, az, bx, SY + 0.008, bz, 0.007, cable, 4); } };
  floorCable([[3.55, 28.1], [3.2, 27.7], [2.6, 27.2], [0.6, 27.0]]);
  floorCable([[3.35, 26.2], [2.9, 26.85], [2.6, 27.2]]);
  floorCable([[3.25, 29.1], [2.8, 28.7], [2.6, 27.2]]);
  floorCable([[1.75, 31.4], [1.2, 30.4], [0.6, 30.0]]);
  floorCable([[3.15, 25.75], [2.6, 25.4], [2.35, 25.25]]);

  // ======================= TELÃO: BARRA DE FIXAÇÃO + GRAMPOS (acima da moldura, sem encostar) =======================
  // painel do cartão: x 0,12–0,24 · y 1,10–4,20 · z 23,85–32,35 → barra em y 4,36 (≥ 0,1 m de folga)
  bar(0.2, 4.36, 23.7, 0.2, 4.36, 32.5, 0.025, steelBlk, 8);
  for (let i = 0; i <= 10; i++) put(box(0.07, 0.05, 0.05, steelBlk, 0.2, 4.34, 23.95 + i * 0.815, nc));
  for (const z of [24.1, 28.1, 32.1]) {
    put(box(0.12, 0.04, 0.04, steelBlk, 0.145, 4.36, z, nc));                         // mão-francesa até a parede
    put(box(0.012, 0.16, 0.12, steelBlk, 0.093, 4.36, z, nc));                        // chapa na parede
  }

  // ======================= TELAS BRANCAS DE PROJEÇÃO =======================
  // 3,2 × 2,4 m, y 3,9–6,3, na face da parede (x ≈ 0,12). A tela do lado z alto foi deslocada para z 33,7–36,9
  // para não bater no pilar da tesoura de z 33,5 (os pilares/tesouras são da decoração da plateia).
  for (const [za, zb] of [[19.9, 23.1], [33.7, 36.9]]) {
    const zc = (za + zb) / 2;
    put(box(0.03, 2.4, zb - za, screenMat, 0.115, 5.1, zc, nc));
    put(box(0.02, 2.44, 0.02, rigGray, 0.11, 5.1, za - 0.01, nc));
    put(box(0.02, 2.44, 0.02, rigGray, 0.11, 5.1, zb + 0.01, nc));
    put(box(0.02, 0.02, zb - za + 0.04, rigGray, 0.11, 6.31, zc, nc));
    put(box(0.02, 0.02, zb - za + 0.04, rigGray, 0.11, 3.89, zc, nc));
  }

  // ======================= TRELIÇA PRETA TIPO ESCADA ACIMA DO TELÃO =======================
  // z 23,1–33,1 (como na foto: termina ~0,8 m além das bordas do telão, entre as telas brancas).
  // Seção 0,30 × 0,30: banzos em x 0,65 / 0,95 · y 6,325 / 6,60 (banzo inferior encosta no grampo dos moving heads, y 6,30).
  const TZ0 = 23.1, TZ1 = 33.1, TXA = 0.65, TXB = 0.95, TYB = 6.325, TYT = 6.6, TR = 0.022;
  const HEADS = [23.9, 26.7, 29.5, 32.3];
  for (const x of [TXA, TXB]) for (const y of [TYB, TYT]) bar(x, y, TZ0, x, y, TZ1, TR, steelBlk, 8);
  // degraus (montantes verticais nas duas faces + travessas em cima), longe das cabeças (≥ 0,3 m em z)
  const nb = 25;
  for (let i = 0; i <= nb; i++) {
    const z = TZ0 + (TZ1 - TZ0) * i / nb;
    if (HEADS.some((h) => Math.abs(h - z) < 0.3)) continue;
    for (const x of [TXA, TXB]) put(box(0.025, TYT - TYB, 0.025, steelBlk, x, (TYB + TYT) / 2, z));
    put(box(TXB - TXA, 0.02, 0.02, steelBlk, (TXA + TXB) / 2, TYT, z, nc));
  }
  for (const z of [TZ0, TZ1]) put(box(TXB - TXA + 0.05, TYT - TYB + 0.05, 0.02, steelBlk, (TXA + TXB) / 2, (TYB + TYT) / 2, z));
  // travessas inferiores nos pontos de fixação dos moving heads (apoio do grampo, fundo em y 6,30)
  for (const z of HEADS) put(box(TXB - TXA + 0.04, 0.04, 0.05, steelBlk, (TXA + TXB) / 2, 6.32, z, nc));
  // mãos-francesas até a parede (x 0,087) + chapas
  for (const z of [23.3, 25.3, 28.1, 30.9, 32.9]) {
    put(box(TXA - 0.09, 0.05, 0.05, steelBlk, (TXA + 0.09) / 2, 6.46, z));
    bar(0.095, 6.05, z, TXA, 6.44, z, 0.012, steelBlk, 5);
    put(box(0.012, 0.6, 0.14, steelBlk, 0.094, 6.25, z, nc));
  }
  // cabo de alimentação ao longo do banzo superior
  bar(0.7, TYT + 0.03, TZ0 + 0.1, 0.7, TYT + 0.03, TZ1 - 0.1, 0.01, cable, 5);

  // Pares LED (3) e barras de LED (2) penduradas na treliça, entre as cabeças (foto: par·MH·barra·MH·par·MH·barra·MH·par)
  const par = () => {
    const g = G();                                   // aponta para +x e para baixo
    g.add(box(0.05, 0.08, 0.05, steelBlk, 0, 0.23, 0));                     // grampo
    for (const s of [-1, 1]) g.add(box(0.2, 0.025, 0.02, steelBlk, 0.02, 0.15, s * 0.11, nc));
    for (const s of [-1, 1]) g.add(box(0.02, 0.17, 0.02, steelBlk, 0.0, 0.07, s * 0.11, nc));
    const can = G(); can.rotation.z = 0.85;
    can.add(cyl(0.085, 0.095, 0.24, M.dark, 0, 0, 0, 16));
    const lens = cyl(0.075, 0.075, 0.012, lensMat, 0, -0.123, 0, 16); lens.castShadow = false; can.add(lens);
    g.add(can);
    return g;
  };
  for (const z of [23.35, 28.1, 32.85]) place(par(), 0.8, z, 0, 6.04);
  const ledBar = () => {
    const g = G();                                   // barra horizontal ao longo de z, face para +x (inclinada p/ baixo)
    g.add(box(0.05, 0.08, 0.05, steelBlk, 0, 0.19, 0));
    const b = G(); b.rotation.z = -0.5;
    b.add(box(0.1, 0.14, 0.62, M.dark, 0, 0, 0));
    b.add(box(0.012, 0.1, 0.56, ledBarMat, 0.056, 0, 0, nc));
    g.add(b);
    for (const s of [-1, 1]) g.add(box(0.02, 0.14, 0.02, steelBlk, 0, 0.1, s * 0.28, nc));
    return g;
  };
  for (const z of [25.3, 30.9]) place(ledBar(), 0.8, z, 0, 6.1);

  // ======================= LINE ARRAYS (2 clusters por lado, correntes até as tesouras) =======================
  // Barras de rigging pretas em x 1,6, y 7,5, presas sob o banzo inferior (y 7,6) das tesouras de z 18,5–23,5 e 33,5–38,5.
  const RIGY = 7.5;
  for (const [za, zb] of [[18.4, 23.6], [33.4, 38.6]]) {
    put(box(0.08, 0.08, zb - za, steelBlk, 1.6, RIGY, (za + zb) / 2));
    for (const z of [za + 0.1, zb - 0.1]) put(box(0.14, 0.03, 0.14, rigGray, 1.6, RIGY + 0.055, z, nc));   // grampos na tesoura
  }
  const lineArray = () => {
    const g = G();                                   // face para +z local; topo do bumper em y 0
    g.add(box(0.82, 0.06, 0.6, steelBlk, 0, -0.03, -0.04));
    for (const sx of [-1, 1]) g.add(box(0.03, 0.1, 0.6, steelBlk, sx * 0.4, 0.02, -0.04));
    const angs = [0, 2, 4.5, 8].map((a) => a * Math.PI / 180);
    let py = -0.06, pz = 0;
    for (let i = 0; i < angs.length; i++) {
      const a = angs[i], hh = 0.25;
      const dy = -Math.cos(a) * hh / 2, dz = -Math.sin(a) * hh / 2;
      const cy = py + dy, cz = pz + dz;
      const cab = G(); cab.position.set(0, cy, cz); cab.rotation.x = a;
      cab.add(box(0.74, 0.235, 0.48, matte, 0, 0, -0.03));
      cab.add(box(0.7, 0.19, 0.012, grille, 0, 0, 0.216, nc));
      for (const sx of [-1, 1]) cab.add(box(0.02, 0.235, 0.46, rigGray, sx * 0.38, 0, -0.03, nc));
      g.add(cab);
      py = cy + dy; pz = cz + dz;
    }
    return g;
  };
  // [z, ry] — ry = π/2 → de frente para a plateia; os internos angulados para fora (como na foto)
  const arrays = [[20.45, HP], [22.3, 2.3], [34.0, 0.84], [36.15, HP]];
  const LAY = 6.12;
  for (const [z, ry] of arrays) {
    place(lineArray(), 1.6, z, ry, LAY);
    // correntes do bumper até a barra de rigging (duas por cluster)
    const s = Math.sin(ry), c = Math.cos(ry);
    for (const k of [-0.3, 0.3]) {
      const x = 1.6 + k * c, zz = z - k * s;
      bar(x, LAY, zz, 1.6, RIGY - 0.04, zz, 0.009, chain, 5);
      put(box(0.04, 0.05, 0.02, chain, x, LAY + 0.03, zz, nc));
    }
  }

  // ======================= PERFIS PRETOS NA PAREDE ALTA =======================
  // Montantes metálicos marcando os módulos da parede (fora das linhas das tesouras 13,5/18,5/23,5/…, que são da plateia).
  for (const z of [16.0, 41.0]) {
    put(box(0.06, 8.4, 0.12, steelBlk, 0.118, 4.2, z));
    put(box(0.02, 8.4, 0.05, blkSeam, 0.155, 4.2, z, nc));
  }

  // ======================= SINALIZAÇÃO (placa do extintor, como na foto) =======================
  put(box(0.01, 0.3, 0.2, redSign, 0.093, SY + 0.95, 34.6, nc));
  put(box(0.004, 0.12, 0.05, whiteP, 0.1, SY + 0.97, 34.6, nc));
  put(box(0.004, 0.03, 0.14, whiteP, 0.1, SY + 0.86, 34.6, nc));

  // ======================= DETALHES DE REALISMO (v1.5.1) =======================
  // Púlpito de acrílico com a marca, Bíblia e garrafa d'água (frente do palco, z 28,1 — fora dos feixes dos moving heads,
  // z 26,7 ± 1 e 29,5 ± 1), fitas de marcação no piso e a folha do repertório ao pé do microfone vocal.
  {
    const acryl = std({ color: 0xe6eef2, roughness: 0.08, transparent: true, opacity: 0.35 });   // (mesmas opções do vidro da ala → mesmo material)
    const PX = 4.35, PZ = 28.1;
    put(box(0.4, 0.02, 0.5, acryl, PX, SY + 0.01, PZ, nc));                                  // base
    put(box(0.02, 1.12, 0.6, acryl, PX + 0.2, SY + 0.58, PZ, nc));                            // painel frontal (voltado para a plateia, +x)
    put(box(0.36, 1.05, 0.02, acryl, PX, SY + 0.545, PZ, nc));                                // alma central
    const top = box(0.44, 0.02, 0.6, acryl, PX - 0.02, SY + 1.16, PZ, nc); top.rotation.z = 0.22; put(top);   // tampo inclinado para quem fala
    const lg = ctx.logo.mesh(0.28, 0, { layout: 'mark', color: '#f4f5f7', roughness: 0.4, cast: false }); lg.rotation.y = HP; lg.position.set(PX + 0.215, SY + 0.66, PZ); put(lg);
    // Bíblia aberta sobre o tampo (capa preta, miolo claro) e garrafa d'água
    const bib = G(); bib.add(box(0.26, 0.012, 0.19, blk, 0, 0.006, 0)); bib.add(box(0.245, 0.022, 0.175, whiteP, 0, 0.023, 0)); bib.add(box(0.004, 0.026, 0.19, blk, 0, 0.022, 0));
    bib.rotation.z = 0.22; bib.position.set(PX - 0.05, SY + 1.176, PZ + 0.02); put(bib);
    put(cyl(0.03, 0.028, 0.2, acryl, PX + 0.08, SY + 1.29, PZ - 0.22, 10)); put(cyl(0.016, 0.016, 0.02, blk, PX + 0.08, SY + 1.4, PZ - 0.22, 10));
    // fitas de marcação (X brancos) nas posições dos músicos, rente ao piso do palco
    for (const [x, z] of [[3.9, 22.4], [3.9, 33.9], [2.1, 27.0]]) for (const a of [0.785, -0.785]) { const t = box(0.24, 0.005, 0.04, whiteP, x, SY + 0.0045, z, nc); t.rotation.y = a; put(t); }
    // repertório (folha A4) no piso, ao pé do pedestal do vocal (3,55; 28,1)
    { const s = box(0.21, 0.004, 0.297, whiteP, 3.35, SY + 0.004, 28.5, nc); s.rotation.y = 0.2; put(s); }
  }
}
