function roomFachada(ctx) {
  const { THREE, M, F, box, cyl, sph, place, add, addExt, std, rnd, makeTex, SPEC, logo, bindEmissive, glowPlane } = ctx;
  const G = () => new THREE.Group();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const j = (k) => (rnd() - 0.5) * 2 * k;                      // jitter determinístico ±k
  const flat = (m) => { m.castShadow = false; return m; };     // peças rasteiras não projetam sombra
  const HT = (SPEC && SPEC.H_TEMPLO) || 8.5, HA = (SPEC && SPEC.H_ALA) || 4.5, HF = (SPEC && SPEC.H_FUNDOS) || 3.6;

  // Paleta local (poucos materiais: tudo é fundido por material depois)
  const P = {
    // ripado bege-rosado claro como na foto (duas tonalidades de ripa, sorteadas, quebram a uniformidade)
    ripa: std({ color: 0xd6b39b, roughness: 0.72 }), ripa2: std({ color: 0xc29b82, roughness: 0.75 }), ripaFundo: std({ color: 0x9c7a64, roughness: 0.85 }),
    mono: std({ color: 0x1b1b1e, roughness: 0.7 }), plate: std({ color: 0x121214, roughness: 0.4, metalness: 0.3 }),   // preto liso (totem, placas)
    alu: std({ color: 0x9a9da2, roughness: 0.35, metalness: 0.7 }),
    upLens: std({ color: 0xfff4dc, emissive: 0xffd9a8, emissiveIntensity: 0.1, roughness: 0.3 }),                    // embutidos no piso (ligados à 'fachada')
    lampLens: std({ color: 0xf6f1e4, emissive: 0xffe6b8, emissiveIntensity: 0.55, roughness: 0.4 }),               // postes da rua (iluminação pública)
    bark: std({ color: 0x5a4a3a, roughness: 1 }),
    leafT1: std({ color: 0x55713a, roughness: 0.95 }), leafT2: std({ color: 0x415d2c, roughness: 0.95 }), leafT3: std({ color: 0x6f8a45, roughness: 0.95 }),
    black: M.wallDark || std({ color: 0x2b2b2e, roughness: 0.85 }), cap: M.wallDarkCap || std({ color: 0x232326, roughness: 0.8 }),
    frame: M.frameDark || std({ color: 0x18181a, roughness: 0.45, metalness: 0.3 }),
    vase: std({ color: 0x141416, roughness: 0.32, metalness: 0.15 }),
    leafB: std({ color: 0x4c7f3c, roughness: 1 }),
    cyca: std({ color: 0x3d6f2c, roughness: 0.85 }), cyca2: std({ color: 0x2c5a22, roughness: 0.85 }), cycaTrunk: std({ color: 0x5b4632, roughness: 1 }),
    pebble: std({ color: 0xf1f0ec, roughness: 0.95 }), pebble2: std({ color: 0xcfccc4, roughness: 0.95 }), curbW: std({ color: 0xdedbd3, roughness: 0.9 }),
    paint: std({ color: 0xf3f3ef, roughness: 0.8 }), yellow: std({ color: 0xe2b633, roughness: 0.8 }),
    stop: std({ color: 0x9d9a93, roughness: 0.95 }), curb: std({ color: 0xbcb8b0, roughness: 0.95 }),
    walk: std({ color: 0xa8a59d, roughness: 0.95 }), asphalt: std({ color: 0x38393c, roughness: 0.95 }),
    carSilver: std({ color: 0xb9bdc2, roughness: 0.35, metalness: 0.5 }),
    cream: std({ color: 0xe7dcc5, roughness: 0.55, metalness: 0.15 }),   // treliça, calha e tubos (como na foto)
    unit: std({ color: 0xe8e8e4, roughness: 0.5 }), grille: std({ color: 0x2a2b2e, roughness: 0.6, metalness: 0.2 }),
    slab: std({ color: 0xa4a19a, roughness: 0.95 }), tank: std({ color: 0x2f6db3, roughness: 0.45 }),
  };

  // ---- texturas procedurais (canvas) ----------------------------------------------------------
  // Telha termoacústica trapezoidal: 4 ondas por metro, correndo no sentido do caimento (x)
  const roofTex = makeTex(256, (g, s) => {
    g.fillStyle = '#aeb3b8'; g.fillRect(0, 0, s, s);
    const p = s / 4;
    for (let i = 0; i < 4; i++) {
      const y = i * p;
      g.fillStyle = '#c9cdd1'; g.fillRect(0, y, s, p * 0.22);                 // crista
      g.fillStyle = '#8f959b'; g.fillRect(0, y + p * 0.22, s, p * 0.1);       // aba de sombra
      g.fillStyle = '#b8bcc0'; g.fillRect(0, y + p * 0.9, s, p * 0.1);        // aba de luz
    }
  }, [1, 37]);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: roofTex, roughness: 0.5, metalness: 0.45 });
  // Revestimento amadeirado da lateral alta (acima da ala direita) e forro do beiral
  const cladTex = makeTex(256, (g, s) => {
    const rr = mulberry(9), ph = s / 8;
    for (let i = 0; i < 8; i++) {
      const v = 0.85 + rr() * 0.25;
      g.fillStyle = `rgb(${(122 * v) | 0},${(86 * v) | 0},${(58 * v) | 0})`; g.fillRect(0, i * ph, s, ph);
      g.fillStyle = 'rgba(40,24,14,0.55)'; g.fillRect(0, i * ph + ph - 3, s, 3);
      for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(${rr() < 0.5 ? '70,45,28' : '160,120,85'},${(rr() * 0.25).toFixed(2)})`; g.fillRect(rr() * s, i * ph + rr() * ph, 8 + rr() * 40, 1 + rr() * 2); }
    }
  }, [15, 2]);
  const cladMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: cladTex, roughness: 0.8 });
  function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // ---- builders locais ------------------------------------------------------------------------
  // barra (caixa) entre dois pontos — treliças e tubos retos
  const bar = (put, a, b, w, mat) => {
    const A = V(...a), B = V(...b), d = B.clone().sub(A);
    const m = box(d.length(), w, w, mat, 0, 0, 0);
    m.position.copy(A).add(B).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(V(1, 0, 0), d.normalize());
    return put(m);
  };
  // folha comprida saindo de (cx,cy,cz): ângulo `a` no plano, inclinação `t` (positivo = caindo); devolve a ponta
  const frond = (g, cx, cy, cz, len, w, a, t, mat) => {
    const m = box(len, 0.018, w, mat, 0, 0, 0), L = len / 2, ct = Math.cos(t);
    m.position.set(cx + L * ct * Math.cos(a), cy - L * Math.sin(t), cz - L * ct * Math.sin(a));
    m.rotation.set(0, a, -t); m.castShadow = true; g.add(m);
    return [cx + len * ct * Math.cos(a), cy - len * Math.sin(t), cz - len * ct * Math.sin(a)];
  };
  // painel ripado de madeira clara (x 7,2–10,66, saliente em z 49,73–49,83) entre y0 e y1
  const ripado = (put, y0, y1) => {
    const x0 = 7.2, x1 = 10.66, h = y1 - y0, ym = (y0 + y1) / 2;
    put(box(x1 - x0, h, 0.05, P.ripaFundo, (x0 + x1) / 2, ym, 49.755));
    const n = Math.floor((x1 - x0 - 0.03) / 0.075);
    for (let i = 0; i <= n; i++) put(box(0.046, h, 0.04, rnd() < 0.3 ? P.ripa2 : P.ripa, x0 + 0.035 + i * 0.075, ym, 49.8));
  };

  // =================================================================================================
  // (a) MODO NORMAL — frente térrea, jardins, estacionamento e ruas
  // =================================================================================================

  // ---- Painel ripado de 0 a 8,5 m + letreiro BASE CHURCH: SEMPRE visíveis (a identidade do prédio vista da rua) ----
  const Y0 = 3.0, LX = 8.93;
  ripado(add, 0, HT);
  add(box(3.46, HT - Y0, 0.1, P.mono, LX, (HT + Y0) / 2, 49.69));   // contra-placa preta (quem olha do hall vê preto; embutida na parede alta no modo Fachada)
  add(box(3.54, 0.06, 0.24, P.cap, LX, HT + 0.03, 49.74));                                 // tampa no topo
  for (const x of [7.185, 10.675]) add(box(0.03, HT, 0.2, P.cap, x, HT / 2, 49.74));       // perfis laterais do painel
  // letreiro em letras caixa prateadas (logo oficial), afastadas do ripado; a face acende com a luz 'fachada'
  const LOGO_W = 2.4, LOGO_Y = 4.9;                                                        // BASE ≈ 70 % da largura do painel; y 3,4–6,4 (foto)
  const sign = logo.relief(LOGO_W, { depth: 0.09, layers: 4, weight: 0.045 });
  sign.position.set(LX, LOGO_Y, 49.822); add(sign);
  bindEmissive('fachada', sign.userData.face, 0.9);
  const halo = glowPlane(3.3, 3.9, 'fachada', { color: 0xffe9cc, base: 0.45, day: 0.1 });   // retroiluminação (halo atrás das letras)
  halo.position.set(LX, LOGO_Y, 49.826); add(halo);
  // embutidos de piso no pedrisco lavando o ripado de baixo para cima (faixas de luz verticais à noite)
  bindEmissive('fachada', P.upLens, 1.6);
  for (const x of [7.88, 8.63, 9.38, 10.12]) {
    add(flat(cyl(0.065, 0.065, 0.03, P.grille, x, 0.045, 49.97, 14)));
    add(flat(cyl(0.048, 0.048, 0.008, P.upLens, x, 0.062, 49.97, 14)));
    const w = glowPlane(0.7, 3.4, 'fachada', { color: 0xffc98a, base: 0.5, day: 0.05 }); w.position.set(x, 1.45, 49.828); add(w);
  }

  // ---- Porta principal: portal preto em volta do vão + bandeira de vidro escuro sobre as folhas ----
  for (const x of [10.78, 13.22]) add(box(0.2, 3.0, 0.22, P.frame, x, 1.5, 49.83));        // ombreiras do portal (fora do vão 10,9–13,1)
  add(box(2.22, 0.66, 0.02, M.glassDark, 12.0, 2.63, 49.74, { cast: false, receive: false }));   // bandeira
  add(box(2.22, 0.05, 0.05, P.frame, 12.0, 2.3, 49.75, { cast: false }));
  add(box(2.22, 0.05, 0.05, P.frame, 12.0, 2.96, 49.75, { cast: false }));
  // adesivo branco (logo horizontal) na bandeira de vidro, como o vinil das portas de vidro das igrejas
  const vin = logo.mesh(1.2, 0, { layout: 'wide', color: '#f1f1ee', opacity: 0.92, cast: false }); vin.position.set(12.0, 2.63, 49.757); add(vin);

  // ---- Jardineiras: cerca-viva densa + faixa de pedrisco branco + guia branca ----
  // folhagem miúda da cerca-viva podada (textura de folhas + relevo pela própria textura)
  const leafTex = makeTex(256, (g, s) => {
    g.fillStyle = '#23411f'; g.fillRect(0, 0, s, s);
    const rr = mulberry(31), cols = ['#2f5a29', '#3a6a30', '#4c7f3c', '#5f9147', '#27481f', '#436f35'];
    for (let i = 0; i < 2600; i++) {
      const x = rr() * s, y = rr() * s, a = rr() * Math.PI;
      g.fillStyle = cols[(rr() * cols.length) | 0];
      for (const [dx, dy] of [[0, 0], [s, 0], [-s, 0], [0, s], [0, -s]]) { g.beginPath(); g.ellipse(x + dx, y + dy, 2.5 + rr() * 3.5, 1.4 + rr() * 1.8, a, 0, Math.PI * 2); g.fill(); }
    }
  });
  const hedge = (x0, x1, z0, z1, h) => {
    const t = leafTex.clone(); t.needsUpdate = true; t.repeat.set((x1 - x0) / 0.45, h / 0.45);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: t, bumpMap: t, bumpScale: 3, roughness: 1 });
    add(box(x1 - x0, h - 0.05, z1 - z0, mat, (x0 + x1) / 2, (h - 0.05) / 2, (z0 + z1) / 2));
    // tufos irregulares (a poda nunca é perfeita): quebram a silhueta no topo e na frente
    const n = Math.round((x1 - x0) * 5);
    for (let i = 0; i < n; i++) {
      const x = x0 + 0.1 + rnd() * (x1 - x0 - 0.2), top = rnd() < 0.55, r = 0.12 + rnd() * 0.08;
      const m = top ? sph(r, mat, x, h - 0.07, z0 + 0.12 + rnd() * (z1 - z0 - 0.24)) : sph(r, mat, x, 0.2 + rnd() * (h - 0.4), z1 - 0.05);
      if (top) m.scale.set(1.4, 0.5, 1); else m.scale.set(1.3, 1, 0.45);
      add(m);
    }
  };
  hedge(0.2, 6.85, 49.82, 50.44, 1.02);        // frente da sala da família (sob a janela)
  hedge(13.42, 15.94, 49.82, 50.46, 1.14);     // à direita da porta
  // pedrisco branco (faixa da frente e todo o canteiro dos vasos)
  for (const [x0, x1, z0, z1] of [[0.13, 6.9, 50.44, 50.83], [6.9, 10.58, 49.84, 50.83], [13.32, 15.98, 50.46, 50.83]]) {
    add(flat(box(x1 - x0, 0.03, z1 - z0, P.pebble, (x0 + x1) / 2, 0.015, (z0 + z1) / 2)));
    const n = Math.round((x1 - x0) * (z1 - z0) * 5);
    for (let i = 0; i < n; i++) { const m = sph(0.028 + rnd() * 0.02, P.pebble2, x0 + 0.05 + rnd() * (x1 - x0 - 0.1), 0.03, z0 + 0.04 + rnd() * (z1 - z0 - 0.08)); m.scale.set(1, 0.45, 1); add(flat(m)); }
  }
  // guias brancas das jardineiras (frente e cabeceiras)
  for (const [x0, x1] of [[0.1, 10.6], [13.3, 16.0]]) {
    add(box(x1 - x0, 0.08, 0.05, P.curbW, (x0 + x1) / 2, 0.04, 50.83, { cast: false }));
    for (const x of [x0 + 0.025, x1 - 0.025]) add(box(0.05, 0.08, 1.07, P.curbW, x, 0.04, 50.29, { cast: false }));
  }

  // ---- Vasos altos pretos com palmeiras cicas, na frente do painel ripado ----
  const cycas = (x, z, h, seed) => {
    const g = G(), rr = mulberry(seed);
    g.add(cyl(0.19, 0.13, h, P.vase, 0, h / 2, 0, 20));
    g.add(cyl(0.2, 0.2, 0.03, P.vase, 0, h - 0.015, 0, 20));
    g.add(cyl(0.175, 0.175, 0.02, M.soil, 0, h - 0.035, 0, 16));
    g.add(cyl(0.065, 0.085, 0.16, P.cycaTrunk, 0, h + 0.05, 0, 10));
    // coroa de folhas pinadas: sobem firmes e arqueiam na ponta (a ponta é mais estreita)
    const n = 16, top = h + 0.12;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rr() * 0.3, rise = -0.45 - rr() * 0.45, mat = i % 2 ? P.cyca : P.cyca2;
      const tip = frond(g, 0, top, 0, 0.27 + rr() * 0.07, 0.085, a, rise, mat);
      frond(g, tip[0], tip[1], tip[2], 0.24 + rr() * 0.08, 0.055, a + (rr() - 0.5) * 0.15, 0.1 + rr() * 0.3, mat);
    }
    // folhas novas (centro, mais claras e em pé)
    for (let i = 0; i < 4; i++) frond(g, 0, top, 0, 0.22, 0.09, i * Math.PI / 2 + 0.4, -1.15, P.leafB);
    place(g, x, z, rr() * Math.PI);
  };
  [[7.52, 0.62], [8.26, 0.86], [9.0, 0.62], [9.74, 0.86], [10.42, 0.62]].forEach(([x, h], i) => cycas(x, 50.3, h, 40 + i));

  // ---- Estacionamento frontal (piso cinza em espinha de peixe já é a zona do cartão) ----
  // guia de concreto entre a calçada grafite e o intertravado
  add(flat(box(26.0, 0.008, 0.1, P.curbW, 10.0, 0.008, 51.0)));
  // vagas a 90° (2,5 × 4,8 m), de frente para o prédio; passagem livre na frente da porta (x 10,3–15,0)
  const L0 = 51.3, L1 = 56.1, Lm = (L0 + L1) / 2;
  const stallX = [-2.2, 0.3, 2.8, 5.3, 7.8, 10.3];
  for (const x of stallX) add(flat(box(0.1, 0.006, L1 - L0, P.paint, x, 0.007, Lm)));
  for (let i = 0; i < stallX.length - 1; i++) {
    const xc = (stallX[i] + stallX[i + 1]) / 2;
    add(box(1.5, 0.12, 0.16, P.stop, xc, 0.06, 51.85));                    // batente de concreto
    add(flat(box(1.5, 0.004, 0.05, P.yellow, xc, 0.122, 51.85)));          // faixa amarela no topo
  }
  // 2 vagas PCD (azuis, com símbolo de cadeira de rodas) + faixa zebrada de embarque entre elas
  const PW = 6.2, PD = L1 - L0, PX0 = 15.0;
  const pcdTex = makeTex(1024, (g, s) => {
    g.save(); g.scale(s / PW, s / PD);          // desenha em metros: x → largura, y → profundidade (0 = lado do prédio)
    const blue = (x0) => {
      g.fillStyle = '#2f76b2'; g.fillRect(x0, 0, 2.5, PD);
      g.strokeStyle = '#f4f4f0'; g.lineWidth = 0.1; g.strokeRect(x0 + 0.05, 0.05, 2.4, PD - 0.1);
      // símbolo internacional de acesso (branco), perto da entrada da vaga
      const cx = x0 + 1.2, cy = 3.25, k = 1.25;
      g.save(); g.translate(cx, cy); g.scale(k, k);
      g.fillStyle = '#f4f4f0'; g.strokeStyle = '#f4f4f0'; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.arc(-0.08, -0.52, 0.1, 0, Math.PI * 2); g.fill();
      g.lineWidth = 0.1;
      g.beginPath(); g.moveTo(-0.1, -0.34); g.lineTo(-0.06, 0.04); g.lineTo(0.28, 0.04); g.lineTo(0.42, 0.4); g.lineTo(0.56, 0.36); g.stroke();
      g.beginPath(); g.moveTo(-0.08, -0.17); g.lineTo(0.2, -0.17); g.stroke();
      g.lineWidth = 0.08; g.beginPath(); g.arc(-0.04, 0.26, 0.33, -0.1 * Math.PI, 1.3 * Math.PI); g.stroke();
      g.restore();
    };
    blue(0); blue(3.7);
    // faixa de embarque (x 2,5–3,7): contorno + zebrado diagonal
    g.strokeStyle = '#f4f4f0'; g.lineWidth = 0.1; g.strokeRect(2.55, 0.05, 1.1, PD - 0.1);
    g.save(); g.beginPath(); g.rect(2.55, 0.05, 1.1, PD - 0.1); g.clip();
    g.lineWidth = 0.09; for (let y = -1.2; y < PD + 0.6; y += 0.45) { g.beginPath(); g.moveTo(2.5, y + 1.2); g.lineTo(3.7, y); g.stroke(); }
    g.restore();
    g.restore();
  });
  pcdTex.wrapS = pcdTex.wrapT = THREE.ClampToEdgeWrapping;
  const pcd = new THREE.Mesh(new THREE.PlaneGeometry(PW, PD), new THREE.MeshStandardMaterial({ map: pcdTex, alphaTest: 0.5, roughness: 0.85 }));
  pcd.rotation.x = -Math.PI / 2; pcd.position.set(PX0 + PW / 2, 0.009, Lm); pcd.castShadow = false; pcd.receiveShadow = true; add(pcd);
  for (const xc of [PX0 + 1.25, PX0 + 4.95]) { add(box(1.5, 0.12, 0.16, P.stop, xc, 0.06, 51.85)); add(flat(box(1.5, 0.004, 0.05, P.yellow, xc, 0.122, 51.85))); }
  // placa de vaga PCD (poste + placa azul) na cabeceira de cada vaga, junto à calçada
  for (const xc of [PX0 + 0.35, PX0 + 4.05]) {
    add(cyl(0.03, 0.03, 1.9, P.grille, xc, 0.95, 50.93, 8));
    add(box(0.42, 0.42, 0.02, std({ color: 0x2f76b2, roughness: 0.6 }), xc, 1.72, 50.95));
    add(box(0.16, 0.2, 0.024, P.paint, xc, 1.72, 50.95, { cast: false }));
  }
  // estacionamento frontal sem carros (vagas livres)

  // ---- Limites do estacionamento, calçada pública e rua da frente (z > 60) ----
  for (const x of [-3.07, 23.07]) add(box(0.14, 0.12, 10.3, P.curb, x, 0.06, 54.85, { cast: false }));
  add(flat(box(26.0, 0.02, 0.2, P.curbW, 10.0, 0.01, 60.1)));                       // soleira rebaixada (entrada de carros)
  // Entorno (ruas, calçadas públicas, árvores de rua, postes e vizinhos): grupo à parte que o cartão esconde
  // no modo leve / `entorno: false` — pesa na GPU e não faz parte da igreja
  const out = ctx.addOut || add;
  const street = (zc, dir) => {
    // calçada (2,2 m) + meio-fio + pista de 7 m com faixa central amarela tracejada e bordas brancas
    const zw = zc - dir * 4.7;                                                       // centro da calçada
    out(flat(box(140, 0.025, 2.2, P.walk, 10, 0.0125, zw)));
    const zk = zw + dir * 1.18;
    out(box(140, 0.12, 0.15, P.curb, 10, 0.06, zk, { cast: false }));
    out(flat(box(140, 0.02, 7.0, P.asphalt, 10, 0.01, zc)));
    for (const s of [-1, 1]) out(flat(box(140, 0.004, 0.1, P.paint, 10, 0.022, zc + s * 3.25)));
    for (let x = -34; x <= 54; x += 6) out(flat(box(3.0, 0.004, 0.12, P.yellow, x, 0.022, zc)));
    // calçada do outro lado
    out(box(140, 0.12, 0.15, P.curb, 10, 0.06, zc + dir * 3.58, { cast: false }));
    out(flat(box(140, 0.025, 2.4, P.walk, 10, 0.0125, zc + dir * 4.85)));
  };
  street(66.0, 1);     // rua da frente (pista z 62,5–69,5)
  street(-6.0, -1);    // rua dos fundos (pista z −9,5…−2,5)
  // guia rebaixada em frente ao portão dos fundos
  out(flat(box(4.6, 0.02, 0.4, P.curbW, 2.5, 0.03, -2.38)));
  // ---- Arborização: copa em cachos (várias esferas pequenas achatadas), tronco com galhos ----
  const tree = (x, z, s, seed) => {
    const g = G(), rr = mulberry(seed), H0 = 2.1 * s;
    g.add(cyl(0.09 * s, 0.15 * s, H0, P.bark, 0, H0 / 2, 0, 8));
    for (let i = 0; i < 3; i++) {
      const a = i * 2.1 + rr(), r = 0.55 * s;
      bar((m) => g.add(m), [0, H0 - 0.15, 0], [Math.cos(a) * r, H0 + 0.55 * s, Math.sin(a) * r], 0.06 * s, P.bark);
    }
    const mats = [P.leafT1, P.leafT2, P.leafT3];
    for (let i = 0; i < 13; i++) {
      const a = rr() * Math.PI * 2, d = Math.sqrt(rr()) * 1.0 * s, y = H0 + (0.45 + rr() * 0.75) * s - d * 0.25;
      const m = sph((0.38 + rr() * 0.26) * s, mats[i % 3], Math.cos(a) * d, y, Math.sin(a) * d); m.scale.set(1, 0.72, 1); g.add(m);
    }
    place(g, x, z, rr() * Math.PI); out(g);
  };
  for (const [x, z, s] of [[-5.2, 55.0, 1.1], [25.2, 55.0, 1.1]]) tree(x, z, s, 70 + x | 0);          // laterais do estacionamento
  for (const [x, s] of [[-12, 1.0], [1.5, 0.95], [19.6, 0.95], [32, 1.05]]) tree(x, 61.6, s, 80 + x | 0);   // calçada da frente (sem esconder o letreiro)
  for (const [x, s] of [[4, 1.0], [16, 1.05]]) tree(x, -10.9, s, 90 + x | 0);                           // calçada dos fundos (lado oposto da rua)

  // ---- Postes de iluminação pública na calçada da frente (braço sobre a rua) ----
  for (const x of [-7.5, 27.5]) {
    const z = 61.9;
    out(cyl(0.17, 0.2, 0.35, P.curb, x, 0.175, z, 12));
    out(cyl(0.06, 0.1, 8.0, P.grille, x, 4.2, z, 10));
    bar(out, [x, 7.9, z], [x, 8.25, z + 1.7], 0.07, P.grille);
    out(box(0.28, 0.12, 0.62, P.grille, x, 8.2, z + 1.95));
    out(box(0.22, 0.02, 0.5, P.lampLens, x, 8.13, z + 1.95, { cast: false }));
  }

  // ---- Vizinhos e muros de divisa: retirados a pedido do cliente (v1.4.5) ----

  // ---- Totem de entrada (monólito preto com face ripada e o logo em relevo), na calçada à esquerda ----
  {
    const g = G(), TWd = 1.3, THt = 4.0, TD = 0.42, B0 = 0.3;
    g.add(box(1.9, B0, 1.0, P.curbW, 0, B0 / 2, 0));                                       // floreira/base de concreto branco
    g.add(flat(box(1.8, 0.02, 0.9, P.pebble, 0, B0 + 0.01, 0)));                            // pedrisco
    g.add(box(TWd, THt, TD, P.mono, 0, B0 + THt / 2, 0));
    g.add(box(TWd + 0.04, 0.05, TD + 0.04, P.cap, 0, B0 + THt + 0.025, 0));
    const fw = TWd - 0.2, fh = THt - 0.3, fy = B0 + 0.15 + fh / 2, zf = TD / 2;
    g.add(box(fw, fh, 0.02, P.ripaFundo, 0, fy, zf + 0.01));
    for (let x = -fw / 2 + 0.03; x < fw / 2 - 0.02; x += 0.075) g.add(box(0.046, fh, 0.03, rnd() < 0.3 ? P.ripa2 : P.ripa, x, fy, zf + 0.035));
    const R = logo.relief(0.86, { depth: 0.05, layers: 3, weight: 0.045 }); R.position.set(0, B0 + 2.85, zf + 0.052); g.add(R);
    bindEmissive('fachada', R.userData.face, 0.9);
    // placa preta com o endereço
    g.add(box(1.0, 0.26, 0.02, P.plate, 0, B0 + 1.45, zf + 0.062));
    const A = 1.0 / 0.2;                                                                     // proporção da placa de texto (1,0 × 0,2 m)
    const addrTex = makeTex(1024, (c, s) => {
      c.setTransform(1, 0, 0, A, 0, 0);
      const hS = s / A; c.fillStyle = '#eeeeea'; c.strokeStyle = '#eeeeea'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = `700 ${Math.round(hS * 0.62)}px ${logo.font}`; c.lineWidth = hS * 0.03;
      c.fillText('802 SUL · PALMAS', s / 2, hS * 0.52, s * 0.94); c.strokeText('802 SUL · PALMAS', s / 2, hS * 0.52, s * 0.94);
    });
    addrTex.wrapS = addrTex.wrapT = THREE.ClampToEdgeWrapping;
    const addr = new THREE.Mesh(new THREE.PlaneGeometry(0.94, 0.188), new THREE.MeshStandardMaterial({ map: addrTex, alphaTest: 0.5, roughness: 0.4,
      emissive: 0xfff4e6, emissiveMap: addrTex, emissiveIntensity: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    addr.position.set(0, B0 + 1.45, zf + 0.073); addr.castShadow = false; g.add(addr);
    bindEmissive('fachada', addr.material, 0.8);
    // verso: marca (anel + B) em branco
    const back = logo.mesh(0.7, 0, { layout: 'mark', color: '#e9e9e6' }); back.rotation.y = Math.PI; back.position.set(0, B0 + 3.1, -TD / 2 - 0.004); g.add(back);
    // embutido no pedrisco + faixa de luz lavando a face ripada
    g.add(flat(box(0.16, 0.03, 0.08, P.grille, 0, B0 + 0.03, zf + 0.2)));
    g.add(flat(box(0.12, 0.008, 0.05, P.upLens, 0, B0 + 0.047, zf + 0.2)));
    const w = glowPlane(1.15, 2.8, 'fachada', { color: 0xffc98a, base: 0.5, day: 0.05 }); w.position.set(0, B0 + 1.4, zf + 0.056); g.add(w);
    place(g, -1.85, 50.32, 0.35);
  }

  // ---- Placa com a marca no muro dos fundos, ao lado do portão (para quem chega pela rua de trás) ----
  add(box(0.72, 0.72, 0.02, P.plate, 6.3, 2.0, -0.105, { cast: false }));
  { const m = logo.mesh(0.6, 0, { layout: 'mark', color: '#e9e9e6' }); m.rotation.y = Math.PI; m.position.set(6.3, 2.0, -0.117); add(m); }

  // ---- Paraciclo (3 arcos de aço) na calçada da direita, fora das vagas PCD ----
  for (const x of [21.55, 22.05, 22.55]) {
    for (const z of [49.95, 50.55]) add(cyl(0.022, 0.022, 0.75, P.alu, x, 0.375, z, 8));
    bar(add, [x, 0.75, 49.95], [x, 0.75, 50.55], 0.044, P.alu);
  }

  // =================================================================================================
  // (b) MODO FACHADA — paredes altas, platibandas, cobertura, beiral com treliça e letreiro
  // =================================================================================================
  const TW = 0.19;                                           // cobre a tampa (0,18) das paredes de 3,0 m
  const wX = (z, x0, x1, y0, y1, mat = P.black) => addExt(box(x1 - x0, y1 - y0, TW, mat, (x0 + x1) / 2, (y0 + y1) / 2, z));
  const wZ = (x, z0, z1, y0, y1, mat = P.black) => addExt(box(TW, y1 - y0, z1 - z0, mat, x, (y0 + y1) / 2, (z0 + z1) / 2));
  const capX = (z, x0, x1, y) => addExt(box(x1 - x0 + 0.04, 0.05, TW + 0.06, P.cap, (x0 + x1) / 2, y + 0.025, z, { cast: false }));
  const capZ = (x, z0, z1, y) => addExt(box(TW + 0.06, 0.05, z1 - z0 + 0.04, P.cap, x, y + 0.025, (z0 + z1) / 2, { cast: false }));
  const e = TW / 2;

  // ---- Cobertura do bloco templo + hall: meia-água caindo para a ala direita (x+), beiral até x 17,45 ----
  const RX0 = 0.1, RX1 = 17.45, RY0 = HT - 0.3, RY1 = HT - 0.95, RZ0 = 12.5, RZ1 = 49.55;
  const slope = (RY0 - RY1) / (RX1 - RX0), roofY = (x) => RY0 - (x - RX0) * slope;   // topo da telha
  const ang = Math.atan(slope), RL = (RX1 - RX0) / Math.cos(ang);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(RL, 0.1, RZ1 - RZ0), roofMat);
  roof.position.set((RX0 + RX1) / 2, roofY((RX0 + RX1) / 2) - 0.05, (RZ0 + RZ1) / 2); roof.rotation.z = -ang;
  roof.castShadow = true; roof.receiveShadow = true; addExt(roof);
  const under = (x) => roofY(x) - 0.1;                                                 // face de baixo da telha

  // ---- Paredes altas (pretas) do bloco templo + hall: frente, esquerda e fundo até 8,5 m ----
  wX(49.65, -e, 16.05 + e, Y0, HT); capX(49.65, -e, 16.05 + e, HT);
  wZ(0, 12.4 - e, 49.65 + e, Y0, HT); capZ(0, 12.4 - e, 49.65 + e, HT);
  wX(12.4, -e, 16.05 + e, Y0, HT); capX(12.4, -e, 16.05 + e, HT);
  // lateral direita: preta dentro da ala, revestimento amadeirado acima do telhado da ala até o beiral
  const WING_TOP = HA - 0.25;                                                          // telhado da ala (atrás das platibandas)
  wZ(16.05, 12.4, 49.65, Y0, WING_TOP + 0.05);
  wZ(16.05, 12.4 + e, 49.65 - e, WING_TOP + 0.05, under(16.05) + 0.04, cladMat);
  // pilares aparentes na divisa (x = 0) continuando os de baixo até a platibanda
  for (const z of [12.4, 16.9, 21.4, 25.9, 30.4, 35.0, 39.5, 44.0]) addExt(box(0.2, HT - 3.05, 0.4, P.black, -0.1, (HT + 3.05) / 2, z));

  // ---- Beiral lateral: treliças metálicas creme em balanço, forro amadeirado e calha (foto, canto sup. direito) ----
  const xw = 16.05 + e;
  addExt(box(RX1 - xw, 0.02, RZ1 - RZ0, cladMat, (xw + RX1) / 2, under((xw + RX1) / 2) - 0.02, (RZ0 + RZ1) / 2, { cast: false }));   // forro sob o beiral
  addExt(box(0.14, 0.34, RZ1 - RZ0 + 0.1, P.cream, RX1 + 0.07, roofY(RX1) - 0.12, (RZ0 + RZ1) / 2));                                  // calha / testeira
  const put = (m) => addExt(m);
  for (const z of [12.9, 16.9, 21.4, 25.9, 30.4, 35.0, 39.5, 44.0, 49.1]) {
    const yt = (x) => under(x) - 0.06, yb = (x) => under(x) - 0.06 - 0.75 * (RX1 - 0.05 - x) / (RX1 - 0.05 - xw) - 0.06;
    const xs = [xw, 16.55, 16.95, RX1 - 0.05];
    bar(put, [xw, yt(xw), z], [RX1, yt(RX1), z], 0.06, P.cream);                   // banzo superior
    bar(put, [xw, yb(xw), z], [xs[3], yb(xs[3]), z], 0.06, P.cream);               // banzo inferior (inclinado)
    for (let i = 1; i < 3; i++) bar(put, [xs[i], yb(xs[i]), z], [xs[i], yt(xs[i]), z], 0.04, P.cream);   // montantes
    for (let i = 0; i < 3; i++) bar(put, [xs[i], yt(xs[i]), z], [xs[i + 1], yb(xs[i + 1]), z], 0.04, P.cream);   // diagonais
    addExt(box(0.03, 0.9, 0.14, P.cream, xw + 0.015, yt(xw) - 0.38, z));           // chapa de fixação na parede
  }
  // tubos de descida da calha até o telhado da ala
  for (const z of [21.0, 33.5, 46.2]) addExt(cyl(0.05, 0.05, roofY(RX1) - 0.3 - WING_TOP, P.cream, RX1 + 0.07, (roofY(RX1) - 0.3 + WING_TOP) / 2, z, 10));
  // cabos/tubulação descendo pela parede até a condensadora da frente
  for (const [dz, r] of [[0, 0.022], [0.07, 0.016], [0.13, 0.03]]) addExt(cyl(r, r, under(16.05) - 0.2 - WING_TOP, P.cream, xw + 0.04, (under(16.05) - 0.2 + WING_TOP) / 2, 48.55 + dz, 8));

  // ---- Ala direita (x 16,05–20,1 · z 11,0–49,5) até 4,5 m ----
  wX(49.5, 16.05 + e, 20.1 + e, Y0, HA); capX(49.5, 16.05 + e, 20.1 + e, HA);
  wZ(20.1, 11.0 - e, 49.5 + e, Y0, HA); capZ(20.1, 11.0 - e, 49.5 + e, HA);
  wX(11.0, 16.05 - e, 20.1 + e, Y0, HA); capX(11.0, 16.05 - e, 20.1 + e, HA);
  wZ(16.05, 11.0 - e, 12.4 - e, Y0, HA); capZ(16.05, 11.0 + e, 12.4 - e, HA);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(20.1 - e - xw, 0.08, 49.5 - e - (11.0 + e)), roofMat);
  wing.position.set((xw + 20.1 - e) / 2, WING_TOP - 0.04, (49.5 - e + 11.0 + e) / 2); wing.castShadow = true; wing.receiveShadow = true; addExt(wing);

  // ---- Bloco dos fundos (almoxarifado, cozinha, recepção, pastoral, caixa d'água) até 3,6 m ----
  // paredes finas (ctx.TF): largura TF + 4 cm; nas de divisa (z 0, x 20,1) o eixo recua TF/2 e a face externa fica no lugar
  const tf = ctx.TF + 0.04, ef = tf / 2, sf = ctx.TF / 2;
  const fX = (z, x0, x1) => { addExt(box(x1 - x0, HF - Y0, tf, P.black, (x0 + x1) / 2, (Y0 + HF) / 2, z)); addExt(box(x1 - x0 + 0.04, 0.05, tf + 0.06, P.cap, (x0 + x1) / 2, HF + 0.025, z, { cast: false })); };
  const fZ = (x, z0, z1) => { addExt(box(tf, HF - Y0, z1 - z0, P.black, x, (Y0 + HF) / 2, (z0 + z1) / 2)); addExt(box(tf + 0.06, 0.05, z1 - z0 + 0.04, P.cap, x, HF + 0.025, (z0 + z1) / 2, { cast: false })); };
  fX(-sf, 4.9 - ef, 20.1 + e);
  fZ(20.1 + sf, -e, 9.25 + ef);
  fX(9.25, 9.45 - ef, 20.1 + sf);
  fZ(9.45, 5.9 - ef, 9.25 + ef);
  fX(5.9, 9.45 - ef, 12.75 + ef);
  fZ(12.75, 3.9 - ef, 5.9 + ef);
  fX(3.9, 4.9 - ef, 12.75 + ef);
  fZ(4.9, -e, 3.9 + ef);
  const SLAB = HF - 0.3;                                                               // laje impermeabilizada
  for (const [x0, z0, x1, z1] of [[4.9, 0, 12.75, 3.9], [9.45, 5.9, 12.75, 9.25], [12.75, 0, 20.1, 9.25]]) {
    addExt(box(x1 - x0 - 0.02, 0.12, z1 - z0 - 0.02, P.slab, (x0 + x1) / 2, SLAB - 0.06, (z0 + z1) / 2));
  }
  // caixa d'água (reservatório azul) sobre a casa de máquinas
  addExt(box(1.8, 0.1, 1.8, P.slab, 18.55, SLAB + 0.05, 1.6));
  addExt(cyl(0.72, 0.78, 1.0, P.tank, 18.55, SLAB + 0.6, 1.6, 24));
  addExt(cyl(0.76, 0.76, 0.08, P.tank, 18.55, SLAB + 1.14, 1.6, 24));
  addExt(cyl(0.2, 0.2, 0.06, P.tank, 18.55, SLAB + 1.21, 1.6, 12));

  // ---- Condensadoras do ar-condicionado ----
  // (a) splits da ala/templo: unidades de parede no telhado da ala, encostadas na parede alta (foto)
  const cond = (x, y, z, face) => {
    addExt(box(0.34, 0.66, 0.9, P.unit, x, y + 0.08 + 0.33, z));
    addExt(box(0.3, 0.08, 0.06, P.grille, x, y + 0.04, z - 0.35)); addExt(box(0.3, 0.08, 0.06, P.grille, x, y + 0.04, z + 0.35));
    const fan = cyl(0.24, 0.24, 0.02, P.grille, x + face * 0.175, y + 0.42, z - 0.1, 20); fan.rotation.z = Math.PI / 2; addExt(fan);
    addExt(box(0.02, 0.5, 0.18, P.grille, x + face * 0.175, y + 0.42, z + 0.3, { cast: false }));
  };
  for (const z of [22.1, 29.6, 38.6, 41.6, 47.6]) cond(16.62, WING_TOP, z, 1);
  // (b) VRF do templo sobre a laje do almoxarifado (descarga para cima) e a da pastoral
  for (const x of [6.3, 7.9]) {
    addExt(box(1.0, 1.15, 0.72, P.unit, x, SLAB + 0.08 + 0.575, 2.0));
    addExt(cyl(0.3, 0.3, 0.05, P.grille, x, SLAB + 0.08 + 1.17, 2.0, 20));
    addExt(box(0.96, 0.7, 0.02, P.grille, x, SLAB + 0.55, 2.37, { cast: false }));
    addExt(box(0.9, 0.08, 0.1, P.grille, x, SLAB + 0.04, 2.0));
  }
  cond(14.9, SLAB, 1.0, 1);

  // ---- Fachada: painel ripado (parte alta), portal da porta e letreiro BASE CHURCH ----
  addExt(box(2.64, 0.5, 0.22, P.frame, 12.0, Y0 + 0.25, 49.83));                     // verga preta do portal
  // (o painel ripado alto e o letreiro BASE CHURCH ficam no modo normal: ver o início do arquivo)
  // câmera de segurança (canto esquerdo) e sensor branco (canto direito), como na foto
  addExt(box(0.12, 0.1, 0.18, P.grille, 0.9, 6.3, 49.83)); addExt(cyl(0.05, 0.05, 0.16, P.unit, 0.9, 6.24, 49.95, 10)).rotation.x = Math.PI / 2;
  addExt(box(0.28, 0.16, 0.06, P.unit, 15.3, 6.0, 49.78, { cast: false }));

  // ---- Detalhes de realismo (v1.5.1): interfone e placa de número ao lado da porta principal, capacho externo ----
  {
    add(box(0.1, 0.2, 0.035, P.alu, 13.55, 1.4, 49.743)); add(box(0.06, 0.06, 0.006, P.plate, 13.55, 1.45, 49.764, { cast: false }));
    const bt = cyl(0.012, 0.012, 0.006, P.plate, 13.55, 1.34, 49.764, 10); bt.rotation.x = Math.PI / 2; bt.castShadow = false; add(bt);
    const numTex = ctx.makeTex(256, (g, S) => { g.fillStyle = '#121214'; g.fillRect(0, 0, S, S); g.fillStyle = '#f4f5f7'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `bold ${Math.round(S * 0.42)}px ${ctx.logo.font}`; g.fillText('802', S / 2, S * 0.4); g.font = `bold ${Math.round(S * 0.2)}px ${ctx.logo.font}`; g.fillText('SUL', S / 2, S * 0.75); });
    add(box(0.26, 0.26, 0.012, std({ map: numTex, color: 0xffffff, roughness: 0.5 }), 13.55, 2.0, 49.731, { cast: false }));
    add(box(1.8, 0.012, 0.8, std({ color: 0x1a1a1c, roughness: 0.92 }), 12.0, 0.012, 50.15, { cast: false }));
  }
}
