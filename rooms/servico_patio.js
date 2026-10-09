function roomServicoPatio(ctx) {
  // ---------------------------------------------------------------------------
  // FUNDOS / SERVIÇO (z 0–12,4)
  //  · Estacionamento interno (x 0–4,9): 2 sedãs ao longo de z (centros x 2,4 · z 3,8 e 8,8),
  //    faixas de vaga pintadas, batentes de roda, torneira com mangueira no muro x=0 e a
  //    coleta seletiva (4 lixeiras + placa) perto do portão, na face externa do almoxarifado.
  //    O portão de correr (parede z=0) e a arandela do pátio (0,085; 2,8; 6,2) são do cartão.
  //  · Almoxarifado (x 4,9–8,6 · z 0–3,9): 3 estantes de aço com caixas e organizadores,
  //    cases de som (rack com rodízios, mesa de som, caixas) com estêncil "BASE MUSIC",
  //    caixa de som PA, pilhas de cadeiras empilháveis, escada de alumínio, balde com rodo.
  //  · Cozinha (x 8,6–12,75 · z 0–3,9): bancada em L (madeira clara + granito preto), cuba,
  //    cooktop com forno e coifa, armários aéreos brancos, geladeira inox, micro-ondas,
  //    garrafões de café, escorredor, mesa de apoio inox, purificador, lixeira e lousa
  //    "Café da Base" com o logo oficial na parede x=12,75.
  //    Janela (x 9,2–10,8) e porta (x 11,6–12,5) da parede z=3,9 ficam livres.
  //  · Pátio: PAREDÃO DA MARCA na face externa do almoxarifado (z=3,9 · x 5,0–7,3): ripado de
  //    madeira clara como o da fachada, logo oficial em letras caixa (ctx.logo.relief), sanca
  //    com fita de LED, halo e floreira preta com uplights. Medalhão com o "B" no piso
  //    (x 11,1 · z 10,85), no caminho recepção → templo. Banco ripado com LED sob o assento,
  //    bicicletário com 2 bicicletas, abrigo de gás, cicas em vasos pretos na porta do templo.
  //  · Jardim interno (x 7,5–9,45 · z 5,8–10,2): meio-fio, cica, arbustos,
  //    forração, pedras brancas e spots de chão (só emissivo, sem luz real).
  //  · Jardim pastoral (x 12,75–20,1 · z 9,25–11,0): pisantes de concreto ligando a porta
  //    da pastoral e o pátio à porta PM01, canteiros com forração, buxinhos e moreias (v1.8: sem árvores).
  // Livres: rotas das portas (PM01, recepção, pastoral, vidro do templo, cozinha, almox.),
  // luminárias do cartão (cozinha 10,7/6,75 · y 2,7 · z 1,95) e a arandela do pátio.
  // Brilhos da decoração (spots, LEDs do paredão e do banco, logo) seguem 'estacionamento'
  // (a luz externa dos fundos) via ctx.bindEmissive — apagados de dia, acesos à noite.
  // ---------------------------------------------------------------------------
  const { THREE, M, box, cyl, sph, place, add, std, rnd } = ctx;
  const G = () => new THREE.Group();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const PI = Math.PI;
  const j = (k) => (rnd() - 0.5) * 2 * k;                          // jitter determinístico ±k
  const nc = { cast: false };
  const flat = (m) => { m.castShadow = false; return m; };          // peças rasteiras não projetam sombra
  const mk = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; return m; };

  // ---- materiais (mesmas opções → mesmo material → menos draw calls) ---------------------
  const P = {
    paint: std({ color: 0xeceae3, roughness: 0.85 }), yellow: std({ color: 0xd9a930, roughness: 0.8 }),
    steelG: std({ color: 0x8d9298, roughness: 0.5, metalness: 0.5 }), steelDk: std({ color: 0x4a4e53, roughness: 0.55, metalness: 0.4 }),
    card: std({ color: 0xb08c5a, roughness: 1 }), card2: std({ color: 0x9c7a4c, roughness: 1 }),
    binW: std({ color: 0xe4e2dc, roughness: 0.7 }), binAmber: std({ color: 0xd08a3a, roughness: 0.7 }), binGray: std({ color: 0x5f6368, roughness: 0.7 }),
    caseBlk: std({ color: 0x1d1d20, roughness: 0.7 }), alu: std({ color: 0xb7bcc2, roughness: 0.35, metalness: 0.8 }),
    grille: std({ color: 0x2c2d30, roughness: 0.95 }),
    chairBlk: std({ color: 0x1f2022, roughness: 0.55, metalness: 0.3 }), upholst: std({ color: 0x3b3d42, roughness: 0.95 }),
    woodL: std({ color: 0xd2b08a, roughness: 0.65 }), granite: std({ color: 0x1e1f22, roughness: 0.3, metalness: 0.1 }),
    splash: std({ color: 0xdadddd, roughness: 0.5 }), cabW: std({ color: 0xf2f0ea, roughness: 0.6 }),
    glassBlk: std({ color: 0x121315, roughness: 0.15, metalness: 0.3 }), burner: std({ color: 0x3a3a3c, roughness: 0.5 }),
    trim: std({ color: 0x141416, roughness: 0.6 }),
    carWhite: std({ color: 0xe9e9e6, roughness: 0.3, metalness: 0.3 }), carGray: std({ color: 0x44484e, roughness: 0.3, metalness: 0.5 }),
    carGlass: std({ color: 0x1b232c, roughness: 0.1, metalness: 0.6 }), rim: std({ color: 0xb9bec4, roughness: 0.3, metalness: 0.8 }),
    plate: std({ color: 0xf0f0ea, roughness: 0.6 }), plateBlue: std({ color: 0x1f4ea3, roughness: 0.6 }),
    binBlue: std({ color: 0x2f5f9e, roughness: 0.7 }), binRed: std({ color: 0xb23a2e, roughness: 0.7 }),
    binGreen: std({ color: 0x2f7a3e, roughness: 0.7 }), binYel: std({ color: 0xd9a82a, roughness: 0.7 }),
    potBlk: std({ color: 0x1f1f21, roughness: 0.7 }), hose: std({ color: 0x3e7a3f, roughness: 0.8 }),
    bikeT: std({ color: 0xb85c38, roughness: 0.5, metalness: 0.3 }), bikeK: std({ color: 0x26282b, roughness: 0.5, metalness: 0.3 }),
    leafDk: std({ color: 0x24512a, roughness: 1 }), leafLt: std({ color: 0x6b9a3e, roughness: 1 }), palm: std({ color: 0x4d8a3c, roughness: 0.9 }),
    cyca: std({ color: 0x35612b, roughness: 0.9 }), forr: std({ color: 0x4f7d33, roughness: 1 }), strap: std({ color: 0x5f8f4a, roughness: 0.9 }),
    flowerY: std({ color: 0xf0c040, roughness: 0.9 }), flowerT: std({ color: 0xc8643c, roughness: 0.9 }),
    pebble: std({ color: 0xeceae4, roughness: 0.95 }), pebble2: std({ color: 0xd9d5cb, roughness: 0.95 }),
    rock: std({ color: 0x8f8b82, roughness: 0.95 }), slab: std({ color: 0xbdb9b0, roughness: 0.95 }),
    spotBody: std({ color: 0x2a2b2e, roughness: 0.5, metalness: 0.4 }),
    // emissivos com opções exclusivas (o cache de std é do cartão inteiro): acendem com 'estacionamento'
    spotLens: std({ color: 0xfff3d6, emissive: 0xffd9a0, emissiveIntensity: 0.6, roughness: 0.39 }),
    led: std({ color: 0xfff0d8, emissive: 0xffd49a, emissiveIntensity: 0.1, roughness: 0.43 }),
    ripa: std({ color: 0xd9b8a0, roughness: 0.72 }), ripaFundo: std({ color: 0xa8876f, roughness: 0.85 }),
    medal: std({ color: 0x2b2c30, roughness: 0.85 }),
    gasDoor: std({ color: 0x9aa0a6, roughness: 0.6, metalness: 0.4 }), thermoR: std({ color: 0x8b2f2f, roughness: 0.5 }),
    fruitO: std({ color: 0xe08a2a, roughness: 0.7 }), fruitG: std({ color: 0x7ca23a, roughness: 0.7 }),
  };
  // spots de chão, fitas de LED e uplights: quase apagados de dia, acesos com a luz externa dos fundos
  if (ctx.bindEmissive) { ctx.bindEmissive('estacionamento', P.spotLens, 1.5); ctx.bindEmissive('estacionamento', P.led, 1.8); }
  const logo = ctx.logo;

  // ---- builders locais ------------------------------------------------------------------------
  // cilindro entre dois pontos (tubos de bicicleta, bicicletário, galhos, cabo do rodo)
  const tube = (g, a, b, r, mat, seg = 8) => {
    const A = V(...a), B = V(...b), d = B.clone().sub(A);
    const m = cyl(r, r, d.length(), mat, 0, 0, 0, seg);
    m.position.copy(A).add(B).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
    g.add(m); return m;
  };
  // toro (rodas de bicicleta, mangueira, carretel de cabo)
  const torus = (r, t, mat, x, y, z, rx = 0, ry = 0, seg = 20) => {
    const m = mk(new THREE.TorusGeometry(r, t, 8, seg), mat);
    m.position.set(x, y, z); m.rotation.set(rx, ry, 0); return m;
  };
  // folha comprida saindo de (cx,cy,cz): ângulo `a` no plano, inclinação `t` (positivo = caindo)
  const frond = (g, cx, cy, cz, len, w, a, t, mat) => {
    const m = box(len, 0.02, w, mat, 0, 0, 0), L = len / 2, ct = Math.cos(t);
    m.position.set(cx + L * ct * Math.cos(a), cy - L * Math.sin(t), cz - L * ct * Math.sin(a));
    m.rotation.set(0, a, -t);
    g.add(m); return m;
  };
  // perfil lateral (s = z do carro, y) extrudado na largura (eixo x), centrado em x = 0
  const extrudeX = (pts, width, mat, bevel = 0.04) => {
    const sh = new THREE.Shape(); sh.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i];
      if (p.length === 4) sh.absarc(p[0], p[1], p[2], 0, p[3], false); else sh.lineTo(p[0], p[1]);
    }
    const geo = new THREE.ExtrudeGeometry(sh, { depth: width - 2 * bevel, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: 2, curveSegments: 10 });
    geo.rotateY(-PI / 2); geo.translate(width / 2 - bevel, 0, 0);
    return mk(geo, mat);
  };

  // =============================== ESTACIONAMENTO INTERNO ===============================
  // Sedã (frente em −z local): carroceria extrudada com caixas de roda, estufa de vidro fumê,
  // teto, rodas com aro, faróis, lanternas, grade, placas Mercosul, retrovisores e maçanetas.
  const sedan = (paint) => {
    const g = G();
    g.add(extrudeX([[-2.3, 0.34], [-2.36, 0.52], [-2.32, 0.7], [-1.9, 0.8], [-1.0, 0.9], [1.4, 0.93], [2.2, 0.9], [2.32, 0.78], [2.34, 0.5], [2.28, 0.34],
      [1.8, 0.34], [1.38, 0.3, 0.42, PI], [-0.96, 0.34], [-1.38, 0.3, 0.42, PI], [-2.3, 0.34]], 1.74, paint, 0.06));
    g.add(extrudeX([[-1.0, 0.86], [-0.22, 1.36], [0.78, 1.38], [1.42, 0.9]], 1.42, P.carGlass, 0.04));
    g.add(box(1.34, 0.04, 0.96, paint, 0, 1.415, 0.28));                         // teto
    g.add(box(1.44, 0.42, 0.08, paint, 0, 1.13, 0.3));                           // coluna B
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const t = cyl(0.31, 0.31, 0.22, P.trim, sx * 0.74, 0.31, sz * 1.38, 18); t.rotation.z = PI / 2; g.add(t);
      const r = cyl(0.19, 0.19, 0.226, P.rim, sx * 0.74, 0.31, sz * 1.38, 14); r.rotation.z = PI / 2; g.add(r);
    }
    for (const sx of [-1, 1]) {
      g.add(box(0.36, 0.1, 0.12, M.lightWhite, sx * 0.56, 0.72, -2.29));         // faróis
      g.add(box(0.4, 0.1, 0.1, M.lightRed, sx * 0.55, 0.8, 2.31));               // lanternas
      g.add(box(0.08, 0.1, 0.18, paint, sx * 0.93, 0.98, -0.78));                // retrovisores
      g.add(box(0.02, 0.025, 0.14, M.chrome, sx * 0.875, 0.84, -0.15));          // maçanetas dianteiras
    }
    g.add(box(0.8, 0.14, 0.06, P.trim, 0, 0.5, -2.39));                          // grade
    for (const sz of [-1, 1]) {
      g.add(box(1.66, 0.1, 0.08, P.trim, 0, 0.38, sz * 2.35));                   // para-choques
      g.add(box(0.52, 0.12, 0.02, P.plate, 0, 0.52, sz * 2.42));                 // placas
      g.add(box(0.52, 0.03, 0.024, P.plateBlue, 0, 0.565, sz * 2.42));           // faixa azul Mercosul
    }
    return g;
  };
  place(sedan(P.carWhite), 2.4, 3.8, 0);        // de ré, frente para o portão
  place(sedan(P.carGray), 2.4, 8.8, PI);        // de frente, nariz para o fundo

  // Faixas de vaga pintadas (2 vagas de 2,5 × 5,3 m) e batentes de roda amarelos
  for (const x of [1.15, 3.65]) add(box(0.1, 0.006, 10.7, P.paint, x, 0.01, 6.3, nc));
  for (const z of [0.95, 6.3, 11.65]) add(box(2.6, 0.006, 0.1, P.paint, 2.4, 0.01, z, nc));
  for (const z of [5.62, 10.62]) {
    add(box(1.3, 0.1, 0.15, P.yellow, 2.4, 0.05, z));
    for (const x of [1.95, 2.85]) add(box(0.22, 0.102, 0.152, P.trim, x, 0.05, z));   // listras pretas
  }
  // Torneira com mangueira enrolada no muro x=0 (fundo do estacionamento; face interna em x 0,012)
  add(box(0.06, 0.34, 0.3, P.steelDk, 0.045, 0.85, 11.8));
  add(torus(0.14, 0.028, P.hose, 0.135, 0.85, 11.8, 0, PI / 2, 22));
  add(cyl(0.02, 0.02, 0.1, M.chrome, 0.065, 1.12, 11.8, 8));

  // ===================================== ALMOXARIFADO =====================================
  // Estante de aço (4 colunas, `levels` prateleiras) com caixas de papelão e organizadores
  const rack = (w, d, h, levels) => {
    const g = G();
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(0.035, h, 0.035, P.steelG, sx * (w / 2 - 0.018), h / 2, sz * (d / 2 - 0.018)));
    const step = (h - 0.12) / (levels - 1);
    for (let i = 0; i < levels; i++) {
      const y = 0.08 + i * step;
      g.add(box(w, 0.025, d, P.steelG, 0, y, 0));
      const top = i === levels - 1;
      let x = -w / 2 + 0.05;
      while (x < w / 2 - 0.25) {
        const bw = 0.26 + rnd() * 0.18, bh = top ? 0.2 + rnd() * 0.1 : 0.18 + rnd() * 0.15, t = rnd();
        if (x + bw > w / 2 - 0.03) break;
        if (t < 0.88) {
          const mat = t < 0.5 ? (rnd() < 0.5 ? P.card : P.card2) : t < 0.7 ? P.binW : t < 0.8 ? P.binAmber : P.binGray;
          g.add(box(bw, bh, d - 0.08 - rnd() * 0.06, mat, x + bw / 2, y + 0.0125 + bh / 2, j(0.02)));
        }
        x += bw + 0.03 + rnd() * 0.05;
      }
    }
    return g;
  };
  place(rack(1.2, 0.45, 2.0, 5), 5.75, 0.315);
  place(rack(1.2, 0.45, 2.0, 5), 7.05, 0.315);
  place(rack(1.2, 0.45, 2.0, 5), 8.2575, 1.42, PI / 2);

  // Case de transporte (flight case): corpo preto, frisos e cantoneiras de alumínio, alças
  const flightCase = (w, h, d, casters = false) => {
    const g = G(), y0 = casters ? 0.08 : 0;
    g.add(box(w, h, d, P.caseBlk, 0, y0 + h / 2, 0));
    for (const y of [y0 + 0.015, y0 + h - 0.015]) g.add(box(w + 0.012, 0.03, d + 0.012, P.alu, 0, y, 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(0.03, h - 0.06, 0.03, P.alu, sx * (w / 2 - 0.01), y0 + h / 2, sz * (d / 2 - 0.01)));
    for (const sx of [-1, 1]) g.add(box(0.03, 0.03, Math.min(0.18, d * 0.4), P.alu, sx * (w / 2 + 0.012), y0 + h * 0.6, 0));
    if (casters) for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(cyl(0.035, 0.035, 0.03, P.trim, sx * (w / 2 - 0.07), 0.04, sz * (d / 2 - 0.07), 10));
    return g;
  };
  place(flightCase(0.6, 0.62, 0.62, true), 5.42, 1.25);                          // rack de amplificadores
  place(flightCase(0.72, 0.16, 0.56), 5.42, 1.25, PI / 2, 0.71);                 // mesa de som em cima
  place(flightCase(0.52, 0.5, 0.5), 5.36, 2.05);                                 // caixas de retorno
  place(flightCase(0.46, 0.4, 0.44), 5.36, 2.05, 0.08, 0.51);
  // Estêncil branco "BASE MUSIC" (logo oficial) nos cases: lateral do rack, tampa da mesa de som e case de cima
  const stencilTex = ctx.makeTex(256, (g2, s) => {
    g2.clearRect(0, 0, s, s);
    logo.draw(g2, s * 0.25, s * 0.04, s * 0.5, { layout: 'mark', color: '#ecebe6' });
    g2.fillStyle = '#ecebe6'; g2.textAlign = 'center'; g2.textBaseline = 'middle';
    g2.font = `700 ${Math.round(s * 0.15)}px ${logo.font}`; g2.fillText('BASE', s / 2, s * 0.68);
    g2.font = `700 ${Math.round(s * 0.1)}px ${logo.font}`; g2.fillText('M U S I C', s / 2, s * 0.84);
  });
  const stencilMat = new THREE.MeshStandardMaterial({ map: stencilTex, alphaTest: 0.5, roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const stencil = (sz, x, y, z, rx, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(sz, sz), stencilMat); m.position.set(x, y, z); m.rotation.set(rx, ry, 0, 'YXZ'); m.receiveShadow = true; add(m); return m; };
  stencil(0.24, 5.7235, 0.26, 1.25, 0, PI / 2);                                   // lateral do rack (abaixo da alça)
  stencil(0.3, 5.42, 0.8715, 1.25, -PI / 2, PI / 2);                              // tampa da mesa de som
  stencil(0.26, 5.36, 0.9115, 2.05, -PI / 2, 0.08);                               // case de retorno de cima
  // Caixa de som PA (grade frontal voltada para a sala)
  add(box(0.44, 0.72, 0.38, P.caseBlk, 5.32, 0.36, 2.78));
  add(box(0.012, 0.6, 0.32, P.grille, 5.546, 0.38, 2.78, nc));
  add(box(0.03, 0.03, 0.16, P.alu, 5.32, 0.735, 2.78));
  // Carretel de cabo e pedestais de microfone deitados no chão
  add(torus(0.16, 0.05, P.trim, 6.05, 0.21, 1.3, 0, PI / 2, 18));
  const reel = cyl(0.1, 0.1, 0.14, P.binAmber, 6.05, 0.21, 1.3, 14); reel.rotation.z = PI / 2; add(reel);
  for (const dx of [-0.05, 0.05]) {                                           // 2 pedestais dobrados no chão
    const s = cyl(0.012, 0.012, 1.0, P.trim, 6.1 + dx, 0.03, 2.05, 8); s.rotation.x = PI / 2; add(s);
    add(cyl(0.02, 0.02, 0.1, P.trim, 6.1 + dx, 0.03, 1.52, 8)).rotation.x = PI / 2;
  }

  // Pilhas de cadeiras empilháveis (estrutura preta, assento/encosto grafite; encosto para +z)
  const chairStack = (n) => {
    const g = G(), dy = 0.055, top = 0.45 + (n - 1) * dy;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(0.025, top, 0.025, P.chairBlk, sx * 0.21, top / 2, sz * 0.2));
    const backTop = top + 0.47;
    for (const sx of [-1, 1]) g.add(box(0.025, backTop - top, 0.025, P.chairBlk, sx * 0.21, (top + backTop) / 2, -0.23 - (n - 1) * 0.01));
    for (let i = 0; i < n; i++) {
      const y = 0.45 + i * dy;
      g.add(box(0.46, 0.05, 0.44, P.upholst, 0, y, 0.02));
      g.add(box(0.44, 0.32, 0.04, P.upholst, 0, y + 0.3, -0.22 - i * 0.01));
    }
    return g;
  };
  place(chairStack(8), 6.15, 3.3, PI);
  place(chairStack(5), 6.72, 3.3, PI);

  // Escada de alumínio (tesoura fechada) encostada na parede x=8,6
  const ladder = () => {
    const g = G(), h = 1.8;
    for (const sz of [-1, 1]) {
      g.add(box(0.04, h, 0.07, P.alu, 0, h / 2, sz * 0.21));                    // montantes
      g.add(box(0.03, h - 0.1, 0.05, P.alu, -0.06, (h - 0.1) / 2, sz * 0.2));   // pernas traseiras fechadas
      g.add(box(0.07, 0.04, 0.09, P.trim, -0.02, 0.02, sz * 0.21));             // sapatas
    }
    for (let i = 0; i < 5; i++) g.add(box(0.1, 0.03, 0.42, P.alu, 0.01, 0.3 + i * 0.3, 0));
    g.add(box(0.14, 0.06, 0.5, P.trim, -0.02, h + 0.03, 0));                     // topo
    return g;
  };
  const lad = place(ladder(), 8.1975, 2.42); lad.rotation.z = -0.155;
  // Balde com rodo no canto perto da porta
  add(cyl(0.14, 0.12, 0.28, P.binBlue, 7.15, 0.14, 3.55, 14));
  const mopG = G(); tube(mopG, [7.15, 0.05, 3.55], [7.3, 1.35, 3.62], 0.012, P.woodL); add(mopG);
  add(box(0.34, 0.04, 0.06, P.trim, 7.15, 0.04, 3.55));

  // ======================================== COZINHA ========================================
  // Bancada em L: trecho ao longo de z=0 (x 8,72–11,72) + perna ao longo de x=8,6 (z 0,645–2,225)
  const RUN = { x0: 8.7225, x1: 11.72, z: 0.345, d: 0.6 }, runL = RUN.x1 - RUN.x0, runC = (RUN.x0 + RUN.x1) / 2;
  add(box(runL, 0.1, RUN.d - 0.08, P.trim, runC, 0.05, RUN.z - 0.02));                        // rodapé recuado
  add(box(runL, 0.76, RUN.d - 0.02, P.woodL, runC, 0.48, RUN.z - 0.01));                       // gabinetes
  add(box(runL + 0.02, 0.04, RUN.d + 0.02, P.granite, runC, 0.88, RUN.z));                     // tampo de granito
  const LEG = { x: 9.0225, z0: 0.645, z1: 2.225 }, legL = LEG.z1 - LEG.z0, legC = (LEG.z0 + LEG.z1) / 2;
  add(box(0.52, 0.1, legL, P.trim, LEG.x - 0.02, 0.05, legC));
  add(box(0.58, 0.76, legL, P.woodL, LEG.x - 0.01, 0.48, legC));
  add(box(0.62, 0.04, legL + 0.02, P.granite, LEG.x, 0.88, legC + 0.01));
  // frentes: frisos e puxadores pretos (o módulo do forno fica sem porta)
  const fz = RUN.z + 0.29;
  for (let i = 1; i < 6; i++) add(box(0.006, 0.7, 0.01, P.trim, RUN.x0 + (runL * i) / 6, 0.48, fz + 0.001, nc));
  for (let i = 0; i < 6; i++) { const cx = RUN.x0 + (runL * (i + 0.5)) / 6; if (Math.abs(cx - 11.1) > 0.3) add(box(0.22, 0.018, 0.02, P.trim, cx, 0.8, fz + 0.012)); }
  for (let i = 1; i < 3; i++) add(box(0.01, 0.7, 0.006, P.trim, LEG.x + 0.285, 0.48, LEG.z0 + (legL * i) / 3, nc));
  for (let i = 0; i < 3; i++) add(box(0.02, 0.018, 0.22, P.trim, LEG.x + 0.297, 0.8, LEG.z0 + (legL * (i + 0.5)) / 3));
  // revestimento (backsplash) nas duas paredes
  add(box(runL, 0.58, 0.012, P.splash, runC, 1.19, 0.019, nc));
  add(box(0.012, 0.58, 2.2, P.splash, 8.6455, 1.19, 1.125, nc));
  // Cuba inox com misturador
  place(ctx.F.sink(0.62, 0.42), 9.95, RUN.z, 0, 0.905);
  // Cooktop (vidro preto, 4 bocas) + forno de embutir + coifa inox
  add(box(0.6, 0.012, 0.5, P.glassBlk, 11.1, 0.906, RUN.z));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(flat(cyl(0.075, 0.075, 0.004, P.burner, 11.1 + sx * 0.14, 0.914, RUN.z + sz * 0.12, 16)));
  add(box(0.58, 0.56, 0.012, M.steel, 11.1, 0.48, fz + 0.012));
  add(box(0.46, 0.26, 0.006, P.glassBlk, 11.1, 0.44, fz + 0.021));
  add(box(0.44, 0.02, 0.025, M.chrome, 11.1, 0.7, fz + 0.03));
  place(ctx.F.hood(), 11.1, 0.285, 0, 1.62);
  // Armários aéreos brancos (x 8,72–10,66), portas com frisos e puxadores
  add(box(1.94, 0.7, 0.35, P.cabW, 9.6925, 1.85, 0.205));
  for (let i = 1; i < 4; i++) add(box(0.006, 0.66, 0.01, P.trim, 8.7225 + (1.94 * i) / 4, 1.85, 0.381, nc));
  for (let i = 0; i < 4; i++) add(box(0.018, 0.16, 0.02, P.trim, 8.7225 + (1.94 * (i + 0.5)) / 4 + (i % 2 ? -0.18 : 0.18), 1.62, 0.39));
  // Geladeira inox no canto (x 11,88–12,63)
  place(ctx.F.fridge(), 12.2525, 0.395);
  // Micro-ondas na perna do L (porta para +x)
  add(box(0.36, 0.28, 0.5, P.trim, 8.9625, 1.04, 1.875));
  add(box(0.006, 0.2, 0.32, P.glassBlk, 9.1455, 1.04, 1.815));
  add(box(0.006, 0.22, 0.1, P.steelDk, 9.1455, 1.04, 2.055));
  // Estação de café: garrafão elétrico inox + 2 garrafas térmicas
  add(cyl(0.13, 0.13, 0.42, M.steel, 9.0125, 1.11, 0.345, 18));
  add(cyl(0.1, 0.13, 0.06, P.trim, 9.0125, 1.35, 0.345, 18));
  add(box(0.04, 0.05, 0.06, P.trim, 9.0125, 0.97, 0.495));
  for (const [x, m] of [[9.3025, P.thermoR], [9.4625, P.trim]]) { add(cyl(0.07, 0.07, 0.3, m, x, 1.05, 0.225, 14)); add(cyl(0.05, 0.06, 0.06, P.trim, x, 1.23, 0.225, 12)); }
  // Escorredor com pratos ao lado da cuba
  add(box(0.4, 0.02, 0.3, M.chrome, 10.48, 0.91, RUN.z));
  for (let i = 0; i < 4; i++) { const pl = cyl(0.11, 0.11, 0.012, M.white, 10.36 + i * 0.07, 1.02, RUN.z, 16); pl.rotation.z = PI / 2; add(pl); }
  // Tábua e fruteira na perna do L
  const tb = add(box(0.26, 0.02, 0.4, P.woodL, 9.0425, 0.91, 1.225)); tb.rotation.y = 0.1;
  add(cyl(0.14, 0.09, 0.07, P.trim, 9.0425, 0.935, 0.875, 16));
  for (const [dx, dz, m] of [[-0.04, 0.03, P.fruitO], [0.05, -0.02, P.fruitO], [0.0, -0.06, P.fruitG]]) add(sph(0.045, m, 9.0425 + dx, 1.0, 0.875 + dz));
  // Mesa de apoio inox junto à parede x=12,75 (com prateleira inferior)
  add(box(0.55, 0.03, 1.2, M.steel, 12.3575, 0.88, 1.85));
  add(box(0.5, 0.02, 1.14, M.steel, 12.3575, 0.2, 1.85));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(cyl(0.018, 0.018, 0.86, M.steel, 12.3575 + sx * 0.24, 0.43, 1.85 + sz * 0.56, 8));
  add(cyl(0.17, 0.17, 0.28, M.steel, 12.3375, 1.035, 1.5, 18));                    // panelão
  add(cyl(0.175, 0.175, 0.02, M.chrome, 12.3375, 1.185, 1.5, 18));
  add(box(0.4, 0.04, 0.3, M.steel, 12.3375, 0.915, 2.15));                        // assadeiras
  add(box(0.36, 0.04, 0.28, M.steel, 12.3375, 0.955, 2.15));
  add(box(0.4, 0.26, 0.34, P.binW, 12.3575, 0.34, 1.55));                        // caixas plásticas embaixo
  add(box(0.4, 0.22, 0.34, P.binAmber, 12.3575, 0.32, 2.15));
  // Purificador de água na parede x=8,6 e lixeira de pedal no canto
  add(box(0.1, 0.36, 0.26, P.cabW, 8.6925, 1.4, 2.95));
  add(cyl(0.012, 0.012, 0.06, M.chrome, 8.7525, 1.2, 2.95, 8));
  add(cyl(0.15, 0.14, 0.46, M.steel, 8.8925, 0.23, 3.5975, 16));
  add(cyl(0.155, 0.155, 0.03, P.trim, 8.8925, 0.475, 3.5975, 16));
  // Lousa "Café da Base" com o logo oficial na parede x=12,75 (acima da mesa inox, virada para −x)
  {
    const BW = 0.66, BH = 0.5, A = BH / BW;
    const boardTex = ctx.makeTex(512, (g2, s) => {
      g2.fillStyle = '#26282a'; g2.fillRect(0, 0, s, s);
      g2.save(); g2.scale(1, 1 / A);                                                // área lógica s × s·A
      const hh = s * A, chalk = '#ebe8df';
      logo.draw(g2, s * 0.14, hh * 0.08, s * 0.72, { layout: 'wide', color: chalk });
      g2.fillStyle = chalk; g2.textAlign = 'center'; g2.textBaseline = 'middle';
      g2.fillRect(s * 0.14, hh * 0.52, s * 0.72, 3);
      g2.font = `700 ${Math.round(s * 0.075)}px ${logo.font}`; g2.fillText('CAFÉ DA BASE', s / 2, hh * 0.64);
      g2.font = `400 ${Math.round(s * 0.05)}px ${logo.font}`; g2.fillText('domingo · 8h30 · 10h30 · 18h', s / 2, hh * 0.78);
      g2.fillText('quarta · 19h30', s / 2, hh * 0.9);
      g2.restore();
    });
    add(box(0.02, BH + 0.04, BW + 0.04, P.woodL, 12.7015, 1.74, 1.85, nc));
    const bm = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.9 }));
    bm.position.set(12.6895, 1.74, 1.85); bm.rotation.y = -PI / 2; bm.receiveShadow = true; add(bm);
  }

  // ========================================= PÁTIO =========================================
  // Coleta seletiva perto do portão, encostada na face externa do almoxarifado (x = 4,8625), frente para −x
  const recBin = (mat) => {
    const g = G();
    g.add(box(0.42, 0.78, 0.44, mat, 0, 0.43, 0));
    const lid = box(0.46, 0.05, 0.48, mat, 0, 0.845, 0.01); g.add(lid);
    g.add(box(0.24, 0.16, 0.01, P.binW, 0, 0.6, 0.225, nc));                    // etiqueta
    g.add(box(0.36, 0.03, 0.04, P.trim, 0, 0.8, -0.24));                         // alça
    for (const sx of [-1, 1]) { const w = cyl(0.05, 0.05, 0.04, P.trim, sx * 0.19, 0.05, -0.17, 12); w.rotation.z = PI / 2; g.add(w); }
    return g;
  };
  [P.binBlue, P.binRed, P.binGreen, P.binYel].forEach((m, i) => place(recBin(m), 4.5175, 1.0 + i * 0.5, -PI / 2));
  // placa "COLETA SELETIVA" (sinalização)
  const signTex = ctx.makeTex(512, (g2, s) => {
    g2.fillStyle = '#f2f0ea'; g2.fillRect(0, 0, s, s);
    g2.save(); g2.scale(1, s / (s * 0.1875)); g2.fillStyle = '#1e1f22'; g2.font = 'bold 44px sans-serif'; g2.textAlign = 'center'; g2.textBaseline = 'middle';
    g2.fillText('COLETA SELETIVA', s / 2, (s * 0.1875) / 2); g2.restore();
    ['#2f5f9e', '#b23a2e', '#2f7a3e', '#d9a82a'].forEach((c, i) => { g2.fillStyle = c; g2.fillRect((i * s) / 4, s * 0.86, s / 4, s * 0.14); });
  });
  // placa acima da janela do almoxarifado (verga em y 2,15), virada para −x — cabe abaixo do topo da parede (ctx.HB, v1.8)
  const SY = (ctx.HB || 2.7) - 0.12;
  add(box(0.02, 0.22, 1.16, P.trim, 4.8515, SY, 1.75, nc));
  const signM = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 0.2), new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.8 }));
  signM.position.set(4.8395, SY, 1.75); signM.rotation.y = -PI / 2; add(signM);

  // ---- PAREDÃO DA MARCA (face externa do almoxarifado, z = 3,9375, virado para o pátio) ----
  // Ripado de madeira clara igual ao da fachada + logo oficial em letras caixa prateadas.
  // Fica de frente para a câmera inicial (que olha de +z/+x) e vira o "ponto de foto" do pátio.
  {
    const x0 = 5.02, x1 = 7.3, W = x1 - x0, cx = (x0 + x1) / 2, y0 = 0.02, y1 = (ctx.HB || 2.94) - 0.1, Hh = y1 - y0, ym = (y0 + y1) / 2;   // até logo abaixo do topo da parede
    add(box(W, Hh, 0.02, P.ripaFundo, cx, ym, 3.9495, nc));                                   // fundo
    const n = Math.floor((W - 0.03) / 0.075);
    for (let i = 0; i <= n; i++) add(box(0.046, Hh, 0.035, P.ripa, x0 + 0.03 + i * 0.075 + (W - 0.06 - n * 0.075) / 2, ym, 3.977));
    // sanca preta no topo com fita de LED embaixo (lava o ripado de cima para baixo)
    add(box(W + 0.06, 0.06, 0.16, P.trim, cx, y1 + 0.03, 4.0125));
    add(box(W - 0.06, 0.012, 0.025, P.led, cx, y1 - 0.006, 4.0625, nc));
    for (const sx of [-1, 1]) add(box(0.03, Hh + 0.06, 0.07, P.trim, cx + sx * (W / 2 + 0.015), ym + 0.03, 3.9725));   // perfis laterais
    // logo oficial (anel + B + BASE/CHURCH) em relevo, acende de leve à noite
    const L = logo.relief(1.08, { depth: 0.05, layers: 4 });
    L.position.set(cx, y1 - 0.75, 3.9965); add(L);
    if (ctx.bindEmissive) ctx.bindEmissive('estacionamento', L.userData.face, 0.6, { min: 0.3 });   // de dia fica branco-prata, à noite brilha
    if (ctx.glowPlane) { const h = ctx.glowPlane(W + 0.3, Hh + 0.3, 'estacionamento', { color: 0xffc98f, base: 0.55, day: 0.12 }); h.position.set(cx, ym + 0.1, 4.0625); add(h); }
    // floreira preta ao pé do painel: grama-preta (moreia/ráfis) e 2 uplights
    add(box(W, 0.4, 0.36, P.potBlk, cx, 0.2, 4.2075));
    add(box(W - 0.06, 0.02, 0.3, M.soil, cx, 0.39, 4.2075, nc));
    for (let k = 0; k < 7; k++) {
      const px = x0 + 0.2 + k * (W - 0.4) / 6;
      if (k === 1 || k === 5) { add(cyl(0.035, 0.04, 0.05, P.spotBody, px, 0.425, 4.1225, 10)); add(flat(cyl(0.028, 0.028, 0.006, P.spotLens, px, 0.452, 4.1225, 10))); continue; }
      // touceira de grama-preta: lâminas finas abrindo em leque a partir do centro
      const tuft = G();
      for (let i = 0; i < 8; i++) frond(tuft, px + j(0.02), 0.4, 4.2075 + j(0.02), 0.34 + rnd() * 0.16, 0.028, (i / 8) * PI * 2 + j(0.3), -(0.75 + rnd() * 0.45), i % 3 ? P.strap : P.leafDk);
      add(tuft);
    }
  }

  // ---- Medalhão com o "B" no piso do pátio (concreto grafite + logo claro + aro de aço) ----
  {
    const mx = 11.1, mz = 10.85;
    add(flat(cyl(0.72, 0.72, 0.012, P.medal, mx, 0.01, mz, 40)));
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.72, 0.755, 48), P.alu); ring.rotation.x = -PI / 2; ring.position.set(mx, 0.0165, mz); ring.receiveShadow = true; add(ring);
    const mk2 = logo.mesh(1.12, 1.12, { layout: 'mark', color: '#e3dfd5', roughness: 0.8 }); mk2.rotation.x = -PI / 2; mk2.position.set(mx, 0.0175, mz); add(mk2);
  }

  // (v1.8: o ipê-amarelo saiu — pedido do dono: nenhuma árvore)

  // Banco ripado de madeira clara com pés pretos (de frente para o jardim interno)
  const bench = (L) => {
    const g = G();
    for (const sx of [-1, 1]) {
      const x = sx * (L / 2 - 0.12);
      g.add(box(0.05, 0.42, 0.05, P.chairBlk, x, 0.21, 0.17)); g.add(box(0.05, 0.8, 0.05, P.chairBlk, x, 0.4, -0.2));
      g.add(box(0.05, 0.04, 0.42, P.chairBlk, x, 0.41, -0.01));
      const bk = box(0.05, 0.42, 0.04, P.chairBlk, x, 0.72, -0.21); bk.rotation.x = -0.12; g.add(bk);
    }
    for (let i = 0; i < 5; i++) g.add(box(L, 0.03, 0.075, P.woodL, 0, 0.445, 0.17 - i * 0.085));
    for (let i = 0; i < 3; i++) { const s = box(L, 0.075, 0.025, P.woodL, 0, 0.62 + i * 0.11, -0.225 - i * 0.013); s.rotation.x = -0.12; g.add(s); }
    g.add(box(L - 0.34, 0.01, 0.02, P.led, 0, 0.422, 0.15, nc));                // fita de LED sob o assento
    return g;
  };
  place(bench(1.6), 7.02, 9.0, PI / 2);

  // Bicicletário junto à parede do templo (z=12,4): 3 arcos galvanizados + 2 bicicletas
  const hoops = G();
  for (const x of [5.95, 6.6, 7.25]) {
    for (const z of [11.15, 11.85]) tube(hoops, [x, 0, z], [x, 0.72, z], 0.024, P.steelG, 10);
    tube(hoops, [x, 0.72, 11.15], [x, 0.72, 11.85], 0.024, P.steelG, 10);
  }
  add(hoops);
  const bicycle = (mat) => {
    const g = G(), R = [0, 0.345, 0.52], Fw = [0, 0.345, -0.52], BB = [0, 0.3, 0.08], S = [0, 0.84, 0.25], Hb = [0, 0.7, -0.4], Hh = [0, 0.86, -0.35];
    for (const w of [R, Fw]) { g.add(torus(0.32, 0.025, M.tire, w[0], w[1], w[2], 0, PI / 2, 24)); const hub = cyl(0.03, 0.03, 0.08, P.alu, w[0], w[1], w[2], 8); hub.rotation.z = PI / 2; g.add(hub); }
    for (const [a, b] of [[BB, S], [BB, Hb], [S, Hh], [BB, R], [S, R], [Hb, Fw], [Hb, Hh]]) tube(g, a, b, 0.016, mat);
    tube(g, S, [0, 0.96, 0.28], 0.012, M.chrome);
    g.add(box(0.12, 0.05, 0.26, P.trim, 0, 0.98, 0.3));                          // selim
    const bar = cyl(0.012, 0.012, 0.5, P.trim, 0, 0.93, -0.38, 8); bar.rotation.z = PI / 2; g.add(bar);
    return g;
  };
  const b1 = place(bicycle(P.bikeT), 6.05, 11.4); b1.rotation.z = -0.05;
  const b2 = place(bicycle(P.bikeK), 7.15, 11.42); b2.rotation.z = 0.05;

  // Abrigo de gás (2 P13) entre a porta do almoxarifado e a janela da cozinha
  add(box(0.5, 1.15, 0.44, M.concrete, 8.9, 0.575, 4.2525));
  add(box(0.54, 0.04, 0.48, P.steelDk, 8.9, 1.17, 4.2525));
  add(box(0.4, 0.9, 0.012, P.gasDoor, 8.9, 0.55, 4.4785));
  for (let i = 0; i < 4; i++) add(box(0.32, 0.03, 0.02, P.steelDk, 8.9, 0.3 + i * 0.16, 4.4885));

  // Cica (Cycas) em vaso preto — mesma planta da fachada
  // (pot = false: plantada direto no chão)
  const cycaPot = (s = 1, pot = true) => {
    const g = G(), y0 = pot ? 0 : -0.55 * s;
    if (pot) {
      g.add(cyl(0.3 * s, 0.24 * s, 0.6 * s, P.potBlk, 0, 0.3 * s, 0, 18));
      g.add(cyl(0.27 * s, 0.27 * s, 0.02, M.soil, 0, 0.59 * s, 0, 18));
    }
    g.add(cyl(0.09 * s, 0.11 * s, 0.25 * s, M.trunk, 0, y0 + 0.7 * s, 0, 10));
    const n = 12;
    for (let i = 0; i < n; i++) frond(g, 0, y0 + 0.82 * s, 0, (0.55 + rnd() * 0.15) * s, 0.12 * s, (i / n) * PI * 2 + j(0.12), (i % 2 ? 0.15 : -0.25) + j(0.08), i % 3 ? P.cyca : P.palm);
    g.add(sph(0.07 * s, P.leafLt, 0, y0 + 0.84 * s, 0));
    return g;
  };
  place(cycaPot(1), 12.2, 11.6);
  // Espada-de-são-jorge em vaso preto alto diante da parede z = 11 do corredor lateral (onde era a porta PM01)
  const sansevieria = () => {
    const g = G();
    g.add(cyl(0.22, 0.18, 0.62, P.potBlk, 0, 0.31, 0, 16));
    g.add(cyl(0.2, 0.2, 0.02, M.soil, 0, 0.61, 0, 16));
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * PI * 2 + j(0.2), r = 0.05 + rnd() * 0.07, h = 0.5 + rnd() * 0.35;
      const b = box(0.06, h, 0.012, i % 3 ? P.strap : P.leafDk, Math.cos(a) * r, 0.6 + h / 2, Math.sin(a) * r);
      b.rotation.set(Math.sin(a) * 0.15, -a, -Math.cos(a) * 0.15); g.add(b);
    }
    return g;
  };
  place(sansevieria(), 16.6, 10.62);   // v1.5.1: trocou de lugar com a porta PM01 (agora na parede x = 16,05, onde o vaso ficava)

  // Spot de chão (embutido, só emissivo — sem luz real)
  const spot = (x, z) => { add(cyl(0.055, 0.06, 0.05, P.spotBody, x, 0.03, z, 12)); add(flat(cyl(0.04, 0.04, 0.008, P.spotLens, x, 0.058, z, 12))); };

  // ==================================== JARDIM INTERNO ====================================
  // Meio-fio de concreto (os lados x=9,45 e z=9,25 são paredes da recepção)
  add(box(0.1, 0.14, 4.4, M.concrete, 7.55, 0.07, 8.0));
  add(box(1.83, 0.14, 0.1, M.concrete, 8.505, 0.07, 5.85));
  add(box(2.85, 0.14, 0.1, M.concrete, 8.875, 0.07, 10.15));
  add(box(0.1, 0.14, 0.81, M.concrete, 10.25, 0.07, 9.695));
  // Pedras brancas: faixa junto ao meio-fio + rodas de pedra + seixos soltos
  add(box(0.32, 0.02, 4.2, P.pebble, 7.77, 0.012, 8.0, nc));
  add(box(2.45, 0.02, 0.32, P.pebble, 9.0, 0.013, 9.94, nc));
  add(flat(cyl(0.5, 0.5, 0.02, P.pebble, 8.45, 0.014, 6.75, 20)));
  add(flat(cyl(0.45, 0.45, 0.02, P.pebble, 8.35, 0.014, 8.85, 20)));
  for (let i = 0; i < 9; i++) {
    const onW = i < 5, x = onW ? 7.66 + rnd() * 0.22 : 7.9 + rnd() * 2.2, z = onW ? 6.0 + rnd() * 4.0 : 9.83 + rnd() * 0.22;
    const s = sph(0.03 + rnd() * 0.025, i % 3 ? P.pebble : P.pebble2, x, 0.026, z); s.scale.y = 0.55; s.castShadow = false; add(s);
  }
  // Pedras ornamentais
  for (const [x, z, r] of [[8.0, 7.55, 0.16], [9.1, 7.3, 0.12], [9.75, 9.7, 0.14]]) { const s = sph(r, P.rock, x, r * 0.35, z); s.scale.set(1.3, 0.6, 1); add(s); }
  // (v1.8: as 2 palmeiras saíram — nenhuma árvore; as rodas de pedra ficam como canteiro)
  place(cycaPot(0.6, false), 9.85, 9.8);
  // Arbustos (buxinhos) e forração baixa junto à parede da recepção
  const shrub = (x, z, s, m1, m2) => {
    add(sph(0.3 * s, m1, x, 0.26 * s, z)); add(sph(0.22 * s, m2, x - 0.16 * s, 0.22 * s, z + 0.14 * s)); add(sph(0.2 * s, P.leafLt, x + 0.12 * s, 0.28 * s, z - 0.15 * s));
  };
  shrub(9.0, 6.25, 0.9, P.leafDk, M.leaf2); shrub(7.95, 9.6, 0.8, M.plant, P.leafDk); shrub(9.05, 8.2, 0.75, P.leafDk, M.plant);
  for (const z of [7.0, 7.6]) { const f = sph(0.3, P.forr, 9.02, 0.05, z); f.scale.y = 0.3; add(f); }
  for (let i = 0; i < 6; i++) add(sph(0.035, P.flowerT, 8.95 + rnd() * 0.3, 0.12, 6.8 + rnd() * 1.0));
  spot(7.95, 6.75); spot(8.8, 9.3); spot(9.95, 9.45);

  // =================================== JARDIM PASTORAL ===================================
  // Pisantes de concreto: porta da pastoral → pátio (a porta PM01 fica no pátio, parede x = 16,05)
  for (const z of [9.62, 10.2, 10.75]) add(flat(box(0.8, 0.04, 0.4, P.slab, 13.35, 0.02, z)));
  for (const x of [14.1, 14.75, 15.4]) add(flat(box(0.5, 0.04, 0.55, P.slab, x, 0.02, 10.6)));   // (daqui se entra no pátio e na porta PM01, x = 16,05)
  // Canteiros com borda metálica preta e forração (grama-amendoim com florzinhas amarelas)
  const bed = (x0, x1, z0, z1) => {
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0;
    add(box(w - 0.02, 0.05, d - 0.02, P.forr, cx, 0.03, cz, nc));
    for (const z of [z0, z1]) add(box(w, 0.08, 0.012, P.trim, cx, 0.04, z, nc));
    for (const x of [x0, x1]) add(box(0.012, 0.08, d, P.trim, x, 0.04, cz, nc));
    const n = Math.round(w * d * 2.8);
    for (let i = 0; i < n; i++) add(flat(sph(0.022, P.flowerY, x0 + 0.08 + rnd() * (w - 0.16), 0.06, z0 + 0.08 + rnd() * (d - 0.16))));
  };
  bed(13.9, 17.05, 9.4, 10.05);
  bed(17.15, 20.005, 9.4, 10.85);
  // Buxinhos em frente ao vidro da pastoral e moreias
  for (const x of [14.35, 15.05, 15.75, 16.55]) { const r = 0.22 + j(0.03); add(sph(r, x === 15.05 ? M.leaf2 : P.leafDk, x, r * 0.95, 9.72)); }
  const G_loose = G(); add(G_loose);                                             // folhas soltas das moreias
  const moreia = (x, z) => {
    for (let i = 0; i < 6; i++) frond(G_loose, x, 0.05, z, 0.42 + rnd() * 0.12, 0.035, (i / 6) * PI * 2 + j(0.2), -1.2 + rnd() * 0.2, P.strap);
    add(sph(0.03, P.binW, x + 0.05, 0.42, z));
  };
  moreia(14.7, 9.72); moreia(16.15, 9.72);
  // Canteiro leste: buxinhos e touceiras floridas terracota diante da janela J13
  shrub(17.65, 10.3, 0.85, P.leafDk, M.leaf2); shrub(18.55, 9.8, 0.7, M.plant, P.leafDk); shrub(19.25, 10.45, 0.75, P.leafDk, M.plant);
  for (const [x, z] of [[18.1, 10.55], [18.95, 10.1]]) {
    add(sph(0.18, M.leaf2, x, 0.16, z));
    for (let i = 0; i < 5; i++) add(sph(0.04, P.flowerT, x + j(0.14), 0.28 + rnd() * 0.06, z + j(0.14)));
  }
  moreia(17.45, 9.75);
  spot(15.4, 9.95); spot(18.2, 9.55); spot(19.55, 10.4);

  // =====================================================================
  // DETALHES DE REALISMO (v1.5.1): tomadas do frontão da cozinha, interruptores junto às portas da
  // cozinha e do almoxarifado e extintor da cozinha.
  // Placas a ≥ 3 mm das faces (bloco dos fundos: paredes de 7,5 cm).
  // =====================================================================
  {
    const plate = (axis, f, dir, t, y, kind) => {
      const d = 0.012, c = f + dir * d / 2, dd = 0.006, cc = f + dir * (d + dd / 2);
      if (axis === 'x') {
        add(box(0.075, 0.12, d, P.cabW, t, y, c, nc));
        add(kind === 'sw' ? box(0.03, 0.045, dd, P.paint, t, y + 0.01, cc, nc) : box(0.034, 0.034, dd, P.trim, t, y, cc, nc));
      } else {
        add(box(d, 0.12, 0.075, P.cabW, c, y, t, nc));
        add(kind === 'sw' ? box(dd, 0.045, 0.03, P.paint, cc, y + 0.01, t, nc) : box(dd, 0.034, 0.034, P.trim, cc, y, t, nc));
      }
    };
    // Cozinha: 2 tomadas no frontão (parede z = 0, face 0,012, abaixo dos aéreos) e interruptor junto à porta (x 11,6–12,5)
    plate('x', 0.012, 1, 9.4, 1.15, 'out'); plate('x', 0.012, 1, 11.05, 1.15, 'out');
    plate('x', 3.8625, -1, 11.3, 1.15, 'sw');
    // porta-papel-toalha sob os aéreos (rolo em suporte de alumínio), entre as garrafas e a cuba
    for (const dx of [-0.13, 0.13]) add(box(0.02, 0.03, 0.1, P.alu, 9.55 + dx, 1.33, 0.06, nc));
    { const roll = cyl(0.055, 0.055, 0.24, P.paint, 9.55, 1.33, 0.1, 14); roll.rotation.z = PI / 2; add(roll); }
    add(box(0.22, 0.14, 0.004, P.paint, 9.55, 1.2, 0.157, nc));
    // extintor de pó (vermelho) em suporte na parede x = 12,75 (face 12,7125), perto da porta
    const redExt = std({ color: 0xc4201b, roughness: 0.35, metalness: 0.1 });
    add(box(0.02, 0.14, 0.12, P.trim, 12.7025, 1.28, 3.2));
    add(cyl(0.08, 0.08, 0.5, redExt, 12.61, 1.05, 3.2, 14)); add(cyl(0.055, 0.055, 0.04, redExt, 12.61, 1.32, 3.2, 10));
    add(cyl(0.026, 0.026, 0.08, P.trim, 12.61, 1.38, 3.2, 8)); add(box(0.03, 0.02, 0.14, P.trim, 12.61, 1.43, 3.2, nc));
    // Almoxarifado: interruptor junto à porta (x 7,5–8,4)
    plate('x', 3.8625, -1, 7.12, 1.15, 'sw');
  }
}
