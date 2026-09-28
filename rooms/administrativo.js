function roomAdministrativo(ctx) {
  // ---------------------------------------------------------------------------
  // BLOCO ADMINISTRATIVO — fundos (z 0–9,25) e começo da ala direita (z 11,0–19,0)
  //  · Sala Pastoral (x 12,75–20,1 · z 0–9,25, em L): estação de café na parede z=0 com
  //    frigobar, mesa redonda de reunião (6 lugares), aparador, estar (tapete, sofá,
  //    2 poltronas, mesas de centro), 2 mesas de atendimento com estante alta na parede
  //    x=20,1, painel com cruz, quadros e plantas.
  //  · Banheiro pastoral (x 17,0–20,1 · z 3,1–4,9): bancada com cuba, vaso e box.
  //  · Caixa d'água (x 17,0–20,1 · z 0–3,1): 2 reservatórios de 1000 L sobre base,
  //    barrilete em PVC, motobomba e quadro elétrico.
  //  · Recepção (x 9,45–12,75 · z 5,9–9,25): parede ripada do piso ao teto com o LOGO
  //    oficial em letras caixa prateadas (ctx.logo.relief, retroiluminado com a luz
  //    'recepcao'), balcão ripado com a marca "B" e fita de LED, 3 poltronas, bebedouro.
  //  · Sala Gilvan (x 17,1–20,1 · z 11,0–14,2) e Administrativo (z 14,2–19,0): estações
  //    com monitores (papel de parede com o logo), prateleiras, mural, logo na parede.
  //  · Placas de porta (recepção / sala pastoral) na face externa da parede z = 9,25.
  // Logo: SEMPRE via ctx.logo (mesma função de desenho do cartão). Telas, abajures e
  // LEDs acompanham a luz do ambiente (ctx.bindEmissive).
  // Paleta: preto, madeira clara (ripado), branco e grafite, acentos âmbar/terracota.
  // Livres: giros das portas (recepção, pastoral, banheiro, Gilvan, Adm.), split da
  // pastoral (14,9; 2,4; 0,125) e as luminárias do cartão (y ≈ 2,7).
  // Faces internas — bloco dos fundos (paredes finas, 7,5 cm): x 9,4875 · 12,7125/12,7875 · 16,9625/17,0375
  // · 20,088 (muro revestido, z < 11) · z 0,012 · 3,0625/3,1375 · 4,8625/4,9375 · 5,9375 · 9,2125/9,2875.
  // Ala direita: x 17,175 · 20,013 · z 11,075 · 14,125/14,275 · 18,925.
  // ---------------------------------------------------------------------------
  const THREE = ctx.THREE, M = ctx.M;
  const box = (...a) => ctx.box(...a), cyl = (...a) => ctx.cyl(...a), sph = (...a) => ctx.sph(...a);
  const std = (o) => ctx.std(o), rnd = () => ctx.rnd();
  const place = (g, x, z, ry = 0, y = 0) => ctx.place(g, x, z, ry, y);
  const put = (m) => { ctx.add(m); return m; };
  const G = () => new THREE.Group();
  const nc = { cast: false };
  const PI = Math.PI;
  // rotações: frente (+z local) virada para +z / +x / −x / −z
  const FZ = 0, FX = PI / 2, FNX = -PI / 2, FNZ = PI;

  // ---- materiais (mesmas opções → mesmo material → menos draw calls) ----------
  const woodL    = std({ color: 0xd2b08a, roughness: 0.65 });                    // madeira clara (tampos)
  const slat     = std({ color: 0xcfa97c, roughness: 0.7 });                     // ripado
  const ripaB    = std({ color: 0xd9b8a0, roughness: 0.68 });                    // ripado bege-rosado (igual ao da fachada)
  const blackM   = std({ color: 0x1b1b1d, roughness: 0.55 });                    // marcenaria preta
  const metalBk  = std({ color: 0x141416, roughness: 0.45, metalness: 0.45 });   // metal preto (pés, perfis)
  const whiteTop = std({ color: 0xf1efea, roughness: 0.4 });                     // tampo branco / quartzo
  const graph    = std({ color: 0x3a3b3f, roughness: 0.6, metalness: 0.2 });     // grafite
  const uphDark  = std({ color: 0x2c2d31, roughness: 0.95 });                    // estofado preto (cadeiras)
  const uphGray  = std({ color: 0x5b5e66, roughness: 0.97 });                    // estofado grafite
  const linen    = std({ color: 0xcdc6b8, roughness: 0.97 });                    // linho (sofá)
  const linenLt  = std({ color: 0xe2dccf, roughness: 0.97 });
  const caramel  = std({ color: 0x9a6a44, roughness: 0.8 });                     // couro caramelo
  const terra    = std({ color: 0xa65a3a, roughness: 0.95 });                    // terracota
  const amber    = std({ color: 0xc98a3c, roughness: 0.6, metalness: 0.15 });    // âmbar
  const sand     = std({ color: 0xe3d3b8, roughness: 0.95 });
  const potBlack = std({ color: 0x1c1c1e, roughness: 0.55 });
  const frond    = std({ color: 0x2f5a2a, roughness: 0.9 });
  const frond2   = std({ color: 0x3d6e34, roughness: 0.9 });
  const soil     = std({ color: 0x3d2b1c, roughness: 1 });
  const ceramic  = std({ color: 0xf4f4f2, roughness: 0.3 });
  const paper    = std({ color: 0xf6f3ec, roughness: 0.9 });
  const coffee   = std({ color: 0x3b2417, roughness: 0.35 });
  const glassTn  = std({ color: 0xd8e4ea, roughness: 0.1, transparent: true, opacity: 0.45 });
  const rugEdge  = std({ color: 0x6f6456, roughness: 1 });
  const rugField = std({ color: 0xc9bca6, roughness: 1 });
  const rugLine  = std({ color: 0xa78f70, roughness: 1 });
  const tileW    = std({ color: 0xe6e7e4, roughness: 0.35 });                    // revestimento do banheiro
  const tankBlue = std({ color: 0x2d6fb3, roughness: 0.55 });                    // reservatório de polietileno
  const tankLid  = std({ color: 0x255f9c, roughness: 0.5 });
  const pvc      = std({ color: 0xf0f0ee, roughness: 0.5 });                     // tubo PVC branco
  const pvcBrown = std({ color: 0x8b5a2b, roughness: 0.6 });                     // tubo soldável marrom
  const pumpBlue = std({ color: 0x3b6fa8, roughness: 0.45, metalness: 0.3 });
  const panelGr  = std({ color: 0xb8bcc0, roughness: 0.5, metalness: 0.3 });
  const waterJug = std({ color: 0x7fb2dc, roughness: 0.1, transparent: true, opacity: 0.6 });
  const book = [0x8b2f2f, 0x2f4f6b, 0x3f6d3a, 0xc9a24a, 0x6b4a2f, 0xe6dfd3, 0x1f1f22, 0xa65a3a].map((c) => std({ color: c, roughness: 0.9 }));
  const cork     = std({ color: 0xb68c5c, roughness: 1 });
  const spruce   = std({ color: 0xe2c28e, roughness: 0.45 });                    // tampo do violão
  const rosewood = std({ color: 0x5a3320, roughness: 0.5 });                     // laterais/braço
  const hoseGr   = std({ color: 0x2f7a3a, roughness: 0.6 });                     // mangueira
  const steelBr  = std({ color: 0xb9bcc0, roughness: 0.3, metalness: 0.8 });     // inox escovado

  // ---- emissivos ligados às luzes dos ambientes (1 material por entidade → 1 draw call) ----
  // Abajures / luminárias de mesa: cúpula de linho que acende com a luz do ambiente.
  const shade = (key) => ctx.bindEmissive(key, new THREE.MeshStandardMaterial({ color: 0xe8e1d2, roughness: 0.9,
    emissive: 0xffd9a8, emissiveIntensity: 0, side: THREE.DoubleSide }), 0.85, { min: 0 });
  const shadePast = shade('pastoral'), shadeAdm = shade('administrativo');
  // Fita de LED (luz quente) — sancas e balcão
  const led = (key, max = 1.4) => ctx.bindEmissive(key, new THREE.MeshStandardMaterial({ color: 0xfff1dc, roughness: 0.5,
    emissive: 0xffe2b8, emissiveIntensity: 0 }), max, { min: 0 });
  const ledRec = led('recepcao'), ledPast = led('pastoral', 1.1);
  // Papel de parede dos monitores: degradê grafite/roxo (Base Music) com o logo oficial.
  // A tela é 16:9 e a textura é quadrada: desenha com escala horizontal = altura/largura.
  const SCR_A = 0.56;
  const wallTex = ctx.makeTex(512, (g, s) => {
    const gr = g.createLinearGradient(0, 0, s, s);
    gr.addColorStop(0, '#221d2e'); gr.addColorStop(0.55, '#35295a'); gr.addColorStop(1, '#141219');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
    g.save(); g.scale(SCR_A, 1);
    const W = s / SCR_A, lw = s * 0.34;
    g.globalAlpha = 0.08; g.fillStyle = '#b88cff';
    for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(W * (0.1 + i * 0.2), 0); g.lineTo(W * (0.18 + i * 0.2), 0); g.lineTo(W * (0.02 + i * 0.22), s); g.lineTo(W * (-0.06 + i * 0.22), s); g.fill(); }
    g.globalAlpha = 1;
    ctx.logo.draw(g, W / 2 - lw / 2, s * 0.2, lw, { layout: 'full', color: '#f4f5f7' });
    g.fillStyle = 'rgba(8,8,10,0.85)'; g.fillRect(0, s * 0.93, W, s * 0.07);                   // barra de tarefas
    g.fillStyle = '#c9c4d6'; for (let i = 0; i < 6; i++) g.fillRect(W / 2 - 0.2 * s + i * 0.075 * s, s * 0.947, 0.04 * s, 0.035 * s);
    g.restore();
  });
  wallTex.wrapS = wallTex.wrapT = THREE.ClampToEdgeWrapping;
  const screen = (key) => ctx.bindEmissive(key, new THREE.MeshStandardMaterial({ color: 0xffffff, map: wallTex, roughness: 0.22,
    emissive: 0xffffff, emissiveMap: wallTex, emissiveIntensity: 0.1 }), 0.95, { min: 0.1 });
  const scrPast = screen('pastoral'), scrRec = screen('recepcao'), scrAdm = screen('administrativo');

  // ---- utilidades ------------------------------------------------------------
  // tubo reto alinhado a um eixo, de a até b ([x, y, z])
  const pipe = (a, b, r = 0.025, mat = pvc) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz);
    const m = cyl(r, r, L, mat, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, 10);
    if (Math.abs(dx) > 1e-6) m.rotation.z = PI / 2; else if (Math.abs(dz) > 1e-6) m.rotation.x = PI / 2;
    return put(m);
  };

  // ======================= BUILDERS (origem no centro da base; frente = +z) =======================
  // Aparador: rodapé recuado, corpo preto, portas de madeira clara, puxadores pretos e tampo
  const credenza = (w, d, h, doors, top = woodL, body = blackM, front = woodL) => {
    const g = G();
    g.add(box(w - 0.08, 0.08, d - 0.08, metalBk, 0, 0.04, -0.01));
    g.add(box(w, h - 0.11, d, body, 0, 0.08 + (h - 0.11) / 2, 0));
    g.add(box(w + 0.02, 0.03, d + 0.02, top, 0, h - 0.015, 0));
    const dw = (w - 0.04) / doors;
    for (let i = 0; i < doors; i++) {
      const cx = -w / 2 + 0.02 + dw * (i + 0.5);
      g.add(box(dw - 0.012, h - 0.17, 0.018, front, cx, 0.08 + (h - 0.11) / 2, d / 2 + 0.009));
      g.add(box(0.012, 0.16, 0.02, metalBk, cx + (i % 2 ? -1 : 1) * (dw / 2 - 0.06), 0.08 + (h - 0.11) * 0.62, d / 2 + 0.028));
    }
    return g;
  };
  // Cadeira de reunião / visita: concha estofada e pés pretos finos levemente abertos
  const shellChair = (fab) => {
    const g = G();
    g.add(box(0.44, 0.06, 0.44, fab, 0, 0.46, 0.01));
    const back = box(0.44, 0.38, 0.05, fab, 0, 0.73, -0.2); back.rotation.x = -0.12; g.add(back);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const l = cyl(0.012, 0.009, 0.45, metalBk, sx * 0.18, 0.215, sz * 0.17, 6);
      l.rotation.z = sx * 0.06; l.rotation.x = -sz * 0.06; g.add(l);
    }
    return g;
  };
  // Cadeira giratória de escritório (base estrela de 5 pés)
  const officeChair = (fab = uphDark) => {
    const g = G();
    g.add(box(0.5, 0.08, 0.48, fab, 0, 0.49, 0.02));
    const back = box(0.46, 0.56, 0.06, fab, 0, 0.87, -0.23); back.rotation.x = -0.08; g.add(back);
    g.add(box(0.06, 0.22, 0.03, metalBk, 0, 0.58, -0.23));
    for (const sx of [-1, 1]) g.add(box(0.04, 0.2, 0.3, metalBk, sx * 0.25, 0.6, -0.02));                      // braços (lâmina)
    g.add(cyl(0.025, 0.025, 0.36, M.chrome, 0, 0.27, 0, 8));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * PI * 2;
      const sp = box(0.3, 0.035, 0.05, metalBk, Math.cos(a) * 0.15, 0.05, Math.sin(a) * 0.15); sp.rotation.y = -a; g.add(sp);
    }
    return g;
  };
  // Poltrona: base + almofada + encosto + braços, pés de madeira
  const armchair = (fab, cushion = fab, w = 0.74, d = 0.76, feet = woodL) => {
    const g = G();
    g.add(box(w, 0.22, d, fab, 0, 0.27, 0));
    g.add(box(w - 0.2, 0.1, d - 0.2, cushion, 0, 0.43, 0.07));
    const back = box(w - 0.02, 0.44, 0.16, fab, 0, 0.6, -d / 2 + 0.09); back.rotation.x = -0.08; g.add(back);
    for (const sx of [-1, 1]) g.add(box(0.1, 0.25, d - 0.12, fab, sx * (w / 2 - 0.05), 0.5, 0.06));
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(cyl(0.022, 0.016, 0.16, feet, sx * (w / 2 - 0.07), 0.08, sz * (d / 2 - 0.07), 8));
    return g;
  };
  // Sofá de 3 lugares com almofadas de acento
  const sofa3 = (w, d, fab, seat) => {
    const g = G();
    g.add(box(w, 0.24, d, fab, 0, 0.26, 0));
    const back = box(w, 0.46, 0.2, fab, 0, 0.6, -d / 2 + 0.1); back.rotation.x = -0.06; g.add(back);
    for (const sx of [-1, 1]) g.add(box(0.16, 0.3, d, fab, sx * (w / 2 - 0.08), 0.53, 0));
    const n = 3, cw = (w - 0.32) / n;
    for (let i = 0; i < n; i++) g.add(box(cw - 0.03, 0.12, d - 0.26, seat, -w / 2 + 0.16 + cw * (i + 0.5), 0.44, 0.1));
    const p1 = box(0.42, 0.36, 0.12, terra, -w / 2 + 0.42, 0.66, -d / 2 + 0.3); p1.rotation.set(-0.25, 0.2, 0); g.add(p1);
    const p2 = box(0.4, 0.34, 0.12, amber, w / 2 - 0.42, 0.66, -d / 2 + 0.3); p2.rotation.set(-0.25, -0.2, 0); g.add(p2);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.05, 0.14, 0.05, metalBk, sx * (w / 2 - 0.08), 0.07, sz * (d / 2 - 0.08)));
    return g;
  };
  // Monitor em pedestal (frente +z)
  const monitor = (w = 0.6, scr = null) => {
    const g = G();
    g.add(box(0.22, 0.012, 0.16, metalBk, 0, 0.006, 0));
    g.add(box(0.04, 0.3, 0.025, metalBk, 0, 0.16, -0.04));
    g.add(box(w, w * 0.58, 0.028, metalBk, 0, 0.3, -0.02));
    if (scr) {                                                                   // tela com o papel de parede do logo
      const p = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.024, w * 0.58 - 0.024), scr);
      p.position.set(0, 0.3, -0.0055); p.castShadow = false; g.add(p);
    } else g.add(box(w - 0.03, w * 0.58 - 0.03, 0.006, M.screenOff, 0, 0.3, -0.004, nc));
    return g;
  };
  // Luminária de mesa articulada (base, 2 hastes, cúpula que acende com a luz do ambiente)
  const deskLamp = (sh) => {
    const g = G();
    g.add(cyl(0.07, 0.075, 0.02, metalBk, 0, 0.01, 0, 14));
    const a1 = box(0.014, 0.36, 0.014, metalBk, 0, 0.19, 0.04); a1.rotation.x = 0.25; g.add(a1);
    const a2 = box(0.014, 0.3, 0.014, metalBk, 0, 0.4, 0.17); a2.rotation.x = 1.1; g.add(a2);
    const c = cyl(0.035, 0.075, 0.1, sh, 0, 0.47, 0.3, 14, true); c.rotation.x = 0.35; g.add(c);
    return g;
  };
  // Mesa de trabalho (frente +z = quem senta): tampo claro, laterais pretas, gaveteiro branco
  const workDesk = (w, d, pc = true, seed = 1, scr = null, lampSh = null) => {
    const g = G();
    g.add(box(w, 0.03, d, woodL, 0, 0.745, 0));
    for (const sx of [-1, 1]) g.add(box(0.04, 0.73, d - 0.04, metalBk, sx * (w / 2 - 0.04), 0.365, 0));
    g.add(box(w - 0.12, 0.34, 0.02, blackM, 0, 0.52, -d / 2 + 0.05));
    g.add(box(0.4, 0.56, d - 0.2, whiteTop, w / 2 - 0.3, 0.29, 0.03));
    for (let i = 0; i < 2; i++) g.add(box(0.2, 0.012, 0.012, metalBk, w / 2 - 0.3, 0.2 + i * 0.24, d / 2 - 0.06));
    if (lampSh) { const lp = deskLamp(lampSh); lp.position.set(-w / 2 + 0.14, 0.76, -d / 2 + 0.1); lp.rotation.y = 0.5; g.add(lp); }
    if (pc) {
      const mon = monitor(0.58, scr); mon.position.set(-0.05, 0.76, -d / 2 + 0.16); g.add(mon);
      g.add(box(0.42, 0.018, 0.14, graph, -0.05, 0.769, 0.06));
      const mouse = sph(0.03, metalBk, 0.28, 0.772, 0.07); mouse.scale.set(1, 0.55, 1.4); g.add(mouse);
      g.add(box(0.21, 0.012, 0.297, paper, -w / 2 + 0.25, 0.766, 0.02));
      g.add(cyl(0.04, 0.035, 0.09, seed % 2 ? ceramic : terra, w / 2 - 0.18, 0.805, -0.08, 12));
    } else {
      g.add(box(0.33, 0.018, 0.23, graph, 0, 0.769, 0.05));                      // notebook fechado
      g.add(box(0.21, 0.012, 0.297, paper, -w / 2 + 0.3, 0.766, 0.0));
    }
    return g;
  };
  // Mesa redonda (tampo claro, coluna e base pretas)
  const roundTable = (r, h = 0.75) => {
    const g = G();
    g.add(cyl(r, r, 0.035, woodL, 0, h - 0.0175, 0, 40));
    g.add(cyl(0.05, 0.05, h - 0.06, metalBk, 0, (h - 0.06) / 2 + 0.02, 0, 12));
    g.add(cyl(r * 0.45, r * 0.5, 0.03, metalBk, 0, 0.015, 0, 24));
    return g;
  };
  // Cica / planta tropical em vaso preto (upright = folhas mais em pé, para cantos)
  const plant = (potH = 0.45, span = 0.55, seed = 1, potR = 0.19, upright = false) => {
    const g = G(); let k = seed * 7.13;
    const r2 = () => { k = (k * 9301 + 49297) % 233280; return k / 233280; };
    g.add(cyl(potR, potR * 0.78, potH, potBlack, 0, potH / 2, 0, 16));
    g.add(cyl(potR - 0.015, potR - 0.015, 0.02, soil, 0, potH - 0.015, 0, 14));
    const n = 9;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * PI * 2 + r2() * 0.35, len = span * (0.75 + r2() * 0.4), tilt = upright ? 0.95 + r2() * 0.45 : 0.5 + r2() * 0.6;
      const pv = G(); pv.position.set(0, potH, 0); pv.rotation.y = a;
      const f = box(0.1, 0.012, len, i % 2 ? frond : frond2, 0, Math.sin(tilt) * len / 2, Math.cos(tilt) * len / 2);
      f.rotation.x = -tilt; pv.add(f); g.add(pv);
    }
    return g;
  };
  // Quadro emoldurado (moldura preta, passe-partout, arte abstrata em 2 blocos) — frente +z
  const frame = (w, h, a, b) => {
    const g = G();
    g.add(box(w, h, 0.03, metalBk, 0, 0, 0, nc));
    g.add(box(w - 0.05, h - 0.05, 0.006, paper, 0, 0, 0.016, nc));
    g.add(box((w - 0.16) * 0.6, h - 0.16, 0.006, a, -(w - 0.16) * 0.2, 0, 0.02, nc));
    g.add(box((w - 0.16) * 0.4, (h - 0.16) * 0.55, 0.006, b, (w - 0.16) * 0.3, -(h - 0.16) * 0.225, 0.02, nc));
    return g;
  };
  // Pilha de livros deitados / fileira de livros em pé
  const books = (g, x, y, z, width, seed, depth = 0.22, maxH = 0.26) => {
    let k = seed * 3.7; const r2 = () => { k = (k * 9301 + 49297) % 233280; return k / 233280; };
    let px = x - width / 2;
    while (px < x + width / 2 - 0.03) {
      const bw = 0.04 + r2() * 0.04, bh = maxH * (0.62 + r2() * 0.38);
      g.add(box(bw, bh, depth * (0.8 + r2() * 0.2), book[Math.floor(r2() * book.length)], px + bw / 2, y + bh / 2, z));
      px += bw + 0.004;
    }
  };
  // Estação de café: cafeteira, 2 garrafas térmicas, bandeja com xícaras e açucareiro
  const coffeeSet = (g, x, y, z) => {
    g.add(box(0.26, 0.36, 0.3, metalBk, x, y + 0.18, z - 0.02));
    g.add(cyl(0.065, 0.07, 0.15, glassTn, x, y + 0.085, z + 0.08, 14));
    g.add(cyl(0.06, 0.065, 0.06, coffee, x, y + 0.04, z + 0.08, 14));
    for (let i = 0; i < 2; i++) {
      g.add(cyl(0.055, 0.06, 0.28, i ? M.steel : metalBk, x + 0.28 + i * 0.14, y + 0.14, z - 0.04, 14));
      g.add(cyl(0.035, 0.045, 0.05, metalBk, x + 0.28 + i * 0.14, y + 0.305, z - 0.04, 12));
    }
    g.add(box(0.44, 0.015, 0.26, woodL, x + 0.72, y + 0.0075, z + 0.02));
    for (let i = 0; i < 4; i++) g.add(cyl(0.035, 0.03, 0.07, ceramic, x + 0.58 + (i % 2) * 0.12 + Math.floor(i / 2) * 0.16, y + 0.05, z - 0.03 + (i % 2) * 0.1, 12));
  };
  // Tapete em 3 camadas (borda escura, faixa, campo) — pisos em y 0,004
  const rug = (x, z, w, d) => {
    put(box(w, 0.008, d, rugEdge, x, 0.009, z, nc));
    put(box(w - 0.14, 0.008, d - 0.14, rugLine, x, 0.011, z, nc));
    put(box(w - 0.26, 0.008, d - 0.26, rugField, x, 0.013, z, nc));
    for (const t of [-1, 1]) put(box(w - 0.6, 0.004, 0.035, rugLine, x, 0.018, z + t * (d / 2 - 0.45), nc));
  };

  // =====================================================================
  // SALA PASTORAL
  // =====================================================================
  // ---- frigobar preto (canto x=12,75 / z=0) ----
  {
    const g = G();
    g.add(box(0.48, 0.84, 0.5, metalBk, 0, 0.44, 0));
    g.add(box(0.46, 0.012, 0.01, graph, 0, 0.62, 0.252, nc));
    g.add(box(0.02, 0.22, 0.03, M.chrome, 0.19, 0.5, 0.265));
    g.add(cyl(0.035, 0.03, 0.1, ceramic, -0.08, 0.91, -0.05, 12));             // caneca
    g.add(box(0.2, 0.02, 0.14, woodL, 0.08, 0.87, 0.0));                        // porta-copos
    place(g, 13.09, 0.325);
  }
  // ---- aparador para café na parede z=0 (x 13,5–16,0) + itens ----
  {
    const g = credenza(2.5, 0.46, 0.86, 4);
    coffeeSet(g, -0.9, 0.86, 0);
    g.add(cyl(0.09, 0.07, 0.22, ceramic, 0.95, 0.97, -0.05, 14));              // vaso branco
    for (let i = 0; i < 3; i++) { const a = i * 2.1; const st = box(0.012, 0.36, 0.012, frond, 0.95 + Math.cos(a) * 0.03, 1.22, -0.05 + Math.sin(a) * 0.03); st.rotation.set(Math.sin(a) * 0.25, 0, Math.cos(a) * 0.25); g.add(st); }
    g.add(box(0.3, 0.05, 0.22, amber, 0.35, 0.885, 0.0));                       // caixa de biscoitos
    place(g, 14.75, 0.265, FZ);
    // quadros na parede do café (fora do split x 14,45–15,35)
    const q1 = frame(0.5, 0.66, terra, sand); place(q1, 13.95, 0.03, FZ, 1.68);
    const q2 = frame(0.5, 0.66, uphGray, amber); place(q2, 15.9, 0.03, FZ, 1.68);
  }
  // ---- mesa redonda de reunião (centro 14,9; 2,1) com 6 cadeiras ----
  {
    place(roundTable(0.75), 14.9, 2.1);
    for (let i = 0; i < 6; i++) {
      const a = PI / 6 + (i * PI) / 3, r = 1.0;
      place(shellChair(uphGray), 14.9 + Math.sin(a) * r, 2.1 + Math.cos(a) * r, a + PI);
    }
    // centro de mesa: bíblia aberta, caderno e vaso baixo
    put(box(0.3, 0.035, 0.22, blackM, 14.72, 0.77, 2.02));
    put(box(0.28, 0.01, 0.2, paper, 14.72, 0.792, 2.02, nc));
    put(box(0.21, 0.012, 0.29, paper, 15.3, 0.758, 2.35));
    put(cyl(0.1, 0.08, 0.12, terra, 15.05, 0.81, 1.85, 14));
    put(sph(0.09, frond2, 15.05, 0.92, 1.85));
  }
  // ---- painel com cruz na parede x=12,75 (de frente para a mesa) ----
  {
    const g = G();
    g.add(box(1.0, 1.7, 0.03, blackM, 0, 0, 0, nc));
    for (let i = 0; i < 9; i++) g.add(box(0.05, 1.62, 0.02, slat, -0.44 + i * 0.11, 0, 0.025, nc));
    g.add(box(0.1, 1.15, 0.05, whiteTop, 0, 0.02, 0.06));
    g.add(box(0.62, 0.1, 0.05, whiteTop, 0, 0.22, 0.06));
    place(g, 12.8025, 2.1, FX, 1.55);
  }
  // ---- aparador de apoio (z ≈ 4,2), aberto, atrás do sofá ----
  {
    const g = G();
    g.add(box(2.3, 0.035, 0.4, woodL, 0, 0.765, 0));
    g.add(box(2.2, 0.025, 0.34, woodL, 0, 0.2, 0));
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.035, 0.75, 0.035, metalBk, sx * 1.1, 0.375, sz * 0.17));
    for (const sx of [-1, 1]) g.add(box(0.035, 0.035, 0.34, metalBk, sx * 1.1, 0.19, 0));
    // em cima: luminária de mesa, livros deitados, vaso âmbar; embaixo: cestos
    g.add(cyl(0.07, 0.08, 0.03, metalBk, -0.85, 0.797, 0, 14));
    g.add(cyl(0.012, 0.012, 0.36, metalBk, -0.85, 0.99, 0, 6));
    g.add(cyl(0.09, 0.14, 0.18, shadePast, -0.85, 1.2, 0, 16, true));
    g.add(box(0.3, 0.04, 0.22, terra, 0.1, 0.803, 0.02)); g.add(box(0.26, 0.04, 0.2, sand, 0.1, 0.843, 0.02)); g.add(box(0.24, 0.035, 0.19, blackM, 0.1, 0.88, 0.02));
    g.add(cyl(0.07, 0.1, 0.28, amber, 0.7, 0.92, 0, 14));
    for (const sx of [-0.6, 0.45]) g.add(box(0.36, 0.22, 0.28, caramel, sx, 0.325, 0));
    place(g, 14.6, 4.2, FNZ);
  }
  // ---- estar: tapete, sofá, 2 poltronas, mesas de centro e mesa lateral ----
  rug(14.45, 6.3, 2.5, 3.0);
  place(sofa3(2.05, 0.9, linen, linenLt), 14.6, 5.02, FZ);
  place(armchair(caramel, caramel), 14.1, 7.28, FNZ);
  place(armchair(caramel, caramel), 15.1, 7.28, FNZ);
  {
    place(roundTable(0.36, 0.4), 14.35, 6.3);
    place(roundTable(0.25, 0.33), 15.0, 6.2);
    put(box(0.26, 0.04, 0.2, blackM, 14.3, 0.42, 6.3));                          // livro
    put(cyl(0.05, 0.045, 0.14, ceramic, 14.5, 0.47, 6.18, 12));
    put(sph(0.06, frond, 14.5, 0.56, 6.18));
    put(cyl(0.12, 0.11, 0.02, woodL, 15.0, 0.34, 6.2, 16));                     // bandeja
  }
  {
    const g = roundTable(0.21, 0.55);                                            // mesa lateral + abajur
    g.add(cyl(0.07, 0.09, 0.03, metalBk, 0, 0.565, 0, 12));
    g.add(cyl(0.012, 0.012, 0.3, metalBk, 0, 0.72, 0, 6));
    g.add(cyl(0.1, 0.15, 0.2, shadePast, 0, 0.94, 0, 16, true));
    place(g, 13.2, 5.05);
  }
  place(plant(0.5, 0.5, 3), 13.35, 3.5);
  place(plant(0.42, 0.55, 5, 0.18, true), 16.52, 0.52);
  // ---- 2 mesas de atendimento (lado direito) + cadeiras de visita ----
  for (const [zc, s] of [[6.0, 1], [8.2, 2]]) {
    place(workDesk(1.5, 0.72, true, s, scrPast, shadePast), 17.85, zc, FX);
    place(officeChair(), 18.66, zc, FNX);
    place(shellChair(uphGray), 16.98, zc - 0.3, FX);
    place(shellChair(uphGray), 16.98, zc + 0.3, FX);
  }
  // ---- estante alta na parede x=20,1 (z 5,0–9,0): 2 módulos pretos, fundo ripado ----
  {
    const g = G(); const L = 4.0, h = 2.2, d = 0.36;
    g.add(box(L, h, 0.02, slat, 0, h / 2, -d / 2 + 0.01));
    for (const sx of [-1, 0, 1]) g.add(box(0.035, h, d, blackM, sx * (L / 2 - 0.0175), h / 2, 0));
    const lv = [0.06, 0.62, 1.02, 1.42, 1.82, h - 0.015];
    for (const y of lv) g.add(box(L, 0.03, d, blackM, 0, y, 0));
    for (let i = 0; i < 4; i++) {                                                // portas de baixo
      const cx = -L / 2 + 0.035 + (i + 0.5) * ((L - 0.07) / 4);
      g.add(box((L - 0.1) / 4 - 0.02, 0.52, 0.018, woodL, cx, 0.34, d / 2 - 0.005));
      g.add(box(0.14, 0.012, 0.02, metalBk, cx, 0.54, d / 2 + 0.012));
    }
    // nichos: livros, caixas, vasos e porta-retratos
    const cells = [];
    for (let m = 0; m < 2; m++) for (let r = 1; r < 5; r++) cells.push([m, r]);
    cells.forEach(([m, r], i) => {
      const x0 = -L / 2 + m * (L / 2) + 0.05, y = lv[r] + 0.015, cw = L / 2 - 0.1;
      const t = (i * 5 + m) % 4;
      if (t === 0 || t === 2) { books(g, x0 + 0.4, y, 0.0, 0.6, i + 11); if (t === 0) g.add(cyl(0.07, 0.06, 0.2, ceramic, x0 + 1.35, y + 0.1, 0.0, 12)); else { g.add(box(0.3, 0.2, 0.26, caramel, x0 + 1.25, y + 0.1, 0)); g.add(box(0.3, 0.2, 0.26, sand, x0 + 1.6, y + 0.1, 0)); } }
      else if (t === 1) { books(g, x0 + cw - 0.35, y, 0.0, 0.45, i + 21); const pf = frame(0.22, 0.28, terra, sand); pf.position.set(x0 + 0.35, y + 0.14, -0.06); pf.rotation.x = -0.1; g.add(pf); }
      else { g.add(cyl(0.09, 0.07, 0.26, amber, x0 + 0.4, y + 0.13, 0, 14)); g.add(box(0.28, 0.05, 0.22, book[0], x0 + 1.0, y + 0.025, 0)); g.add(box(0.26, 0.05, 0.2, book[3], x0 + 1.0, y + 0.075, 0)); books(g, x0 + 1.55, y, 0, 0.3, i + 31); }
    });
    place(g, 19.875, 7.0, FNX);
  }
  // quadro com o LOGO sobre o estar, na parede x=12,75: tela preta, moldura de madeira clara
  // (filete) e o logo oficial em champanhe, com uma arandela de LED acima
  {
    const g = G();
    g.add(box(0.74, 0.96, 0.035, woodL, 0, 0, 0, nc));
    g.add(box(0.7, 0.92, 0.04, blackM, 0, 0, 0.004, nc));
    place(g, 12.8075, 6.4, FX, 1.62);
    const lg = ctx.logo.mesh(0.44, 0, { layout: 'full', color: '#dcc49a', roughness: 0.35, metalness: 0.5 });
    lg.rotation.y = FX; lg.position.set(12.8335, 1.63, 6.4); put(lg);
    // arandela linear (preta) com fita de LED voltada para o quadro
    put(box(0.07, 0.035, 0.6, metalBk, 12.8325, 2.2, 6.4));
    put(box(0.02, 0.006, 0.54, ledPast, 12.8525, 2.18, 6.4, nc));
  }
  // persiana rolô de linho na parede de vidro (x 14,2–16,6), meio abaixada
  {
    put(box(2.56, 0.1, 0.09, blackM, 15.4, 2.33, 9.1575));                          // caixa (bandô)
    put(box(2.46, 0.52, 0.008, linenLt, 15.4, 2.02, 9.1375, nc));                    // tecido
    put(box(2.46, 0.03, 0.02, metalBk, 15.4, 1.75, 9.1375, nc));                     // barra de peso
    put(cyl(0.004, 0.004, 0.7, metalBk, 16.52, 1.9, 9.1175, 4));                    // corrente
  }
  // violão no suporte (canto entre o aparador e a porta do banheiro) — ministério Base Music
  {
    const g = G();
    // suporte em A preto
    for (const sx of [-1, 1]) { const l = box(0.02, 0.5, 0.02, metalBk, sx * 0.14, 0.24, 0.05); l.rotation.z = sx * 0.2; g.add(l); }
    g.add(box(0.3, 0.02, 0.05, metalBk, 0, 0.2, 0.12));
    g.add(box(0.02, 0.62, 0.02, metalBk, 0, 0.31, -0.1));
    const v = G(); v.position.set(0, 0.2, 0.08); v.rotation.x = -0.24;         // violão inclinado para trás
    const lower = cyl(0.18, 0.18, 0.1, rosewood, 0, 0.19, 0, 24); lower.rotation.x = PI / 2; v.add(lower);
    const upper = cyl(0.135, 0.135, 0.1, rosewood, 0, 0.42, 0, 24); upper.rotation.x = PI / 2; v.add(upper);
    const top1 = cyl(0.175, 0.175, 0.006, spruce, 0, 0.19, 0.051, 24); top1.rotation.x = PI / 2; v.add(top1);
    const top2 = cyl(0.13, 0.13, 0.006, spruce, 0, 0.42, 0.051, 24); top2.rotation.x = PI / 2; v.add(top2);
    const hole = cyl(0.048, 0.048, 0.004, blackM, 0, 0.33, 0.055, 18); hole.rotation.x = PI / 2; v.add(hole);
    v.add(box(0.1, 0.02, 0.012, rosewood, 0, 0.12, 0.057));                     // cavalete
    v.add(box(0.05, 0.42, 0.03, rosewood, 0, 0.72, 0.02));                       // braço
    v.add(box(0.052, 0.4, 0.006, blackM, 0, 0.72, 0.037));                     // escala
    v.add(box(0.08, 0.16, 0.025, rosewood, 0, 1.0, 0.012));                    // mão
    for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) { const t = cyl(0.008, 0.008, 0.03, M.chrome, sx * 0.05, 0.95 + i * 0.045, 0.012, 6); t.rotation.z = PI / 2; v.add(t); }
    g.add(v);
    place(g, 16.4, 4.72, FNX + 0.35);
  }

  // =====================================================================
  // BANHEIRO PASTORAL (x 17,0–20,1 · z 3,1–4,9) — porta em x=17 (z 3,4–4,2)
  // =====================================================================
  {
    put(box(1.85, 1.2, 0.012, tileW, 18.12, 0.6, 4.8555, nc));                   // revestimento atrás da pia/vaso
    // bancada suspensa preta com cuba branca, espelho redondo
    const g = G();
    g.add(box(0.6, 0.36, 0.44, blackM, 0, 0.66, 0));
    g.add(box(0.62, 0.03, 0.46, whiteTop, 0, 0.855, 0));
    g.add(cyl(0.17, 0.14, 0.1, ceramic, 0, 0.92, 0.03, 18));
    g.add(cyl(0.012, 0.012, 0.2, metalBk, 0, 0.97, -0.16, 8));
    g.add(box(0.02, 0.02, 0.12, metalBk, 0, 1.07, -0.11));
    const mir = cyl(0.26, 0.26, 0.02, M.mirror, 0, 1.55, -0.21, 28); mir.rotation.x = PI / 2; g.add(mir);
    const rim = cyl(0.275, 0.275, 0.015, metalBk, 0, 1.55, -0.222, 28); rim.rotation.x = PI / 2; g.add(rim);
    place(g, 17.52, 4.6175, FNZ);
    // vaso sanitário contra a parede z=4,9
    place(ctx.F.toilet(), 18.38, 4.5375, FNZ);
    put(box(0.04, 0.12, 0.1, metalBk, 18.78, 0.7, 4.8075));                        // papeleira
    put(cyl(0.055, 0.055, 0.1, paper, 18.78, 0.66, 4.7575, 12)).rotation.z = PI / 2;
    // box de vidro com perfil preto (x 19,1–20,0)
    put(box(0.9, 0.05, 1.5, whiteTop, 19.55, 0.025, 4.0));
    put(box(0.012, 1.95, 0.75, M.glass, 19.08, 1.03, 3.6, { cast: false, receive: false }));
    put(box(0.012, 1.95, 0.72, M.glass, 19.1, 1.03, 4.4, { cast: false, receive: false }));
    put(box(0.03, 0.03, 1.5, metalBk, 19.09, 2.02, 4.0));
    put(box(0.03, 1.98, 0.03, metalBk, 19.09, 1.0, 3.24));
    put(cyl(0.012, 0.012, 1.0, metalBk, 20.015, 1.55, 4.3, 8));
    put(box(0.3, 0.02, 0.03, metalBk, 19.895, 2.05, 4.3));
    put(cyl(0.1, 0.1, 0.015, metalBk, 19.755, 2.03, 4.3, 16));
    // toalha na parede z=3,1
    put(box(0.5, 0.02, 0.02, metalBk, 18.3, 1.35, 3.1625));
    put(box(0.42, 0.55, 0.04, sand, 18.3, 1.08, 3.1775));
    // espelho com LED atrás (halo que acende com a luz da pastoral), saboneteira e plantinha
    const halo = cyl(0.3, 0.3, 0.008, ledPast, 17.52, 1.55, 4.8435, 32); halo.rotation.x = PI / 2; halo.castShadow = false; put(halo);
    put(cyl(0.035, 0.035, 0.14, blackM, 17.33, 0.94, 4.7375, 12));                   // saboneteira líquida
    put(cyl(0.01, 0.01, 0.04, blackM, 17.33, 1.03, 4.7375, 6));
    put(cyl(0.05, 0.04, 0.08, ceramic, 17.73, 0.91, 4.7575, 12));                   // vasinho
    put(sph(0.055, frond2, 17.73, 0.99, 4.7575));
    // toalheiro de argola ao lado da bancada, com toalha de rosto
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.008, 6, 20), metalBk);
    ring.position.set(17.97, 1.12, 4.8375); put(ring);
    put(box(0.2, 0.3, 0.025, linenLt, 17.97, 0.98, 4.8325));
    // lixeira com pedal (inox) ao lado do vaso
    put(cyl(0.1, 0.09, 0.3, steelBr, 18.78, 0.15, 4.6575, 16));
    put(cyl(0.102, 0.102, 0.02, metalBk, 18.78, 0.31, 4.6575, 16));
    // box: ralo linear, prateleira com frascos e tapete de banho
    put(box(0.6, 0.004, 0.06, steelBr, 19.55, 0.052, 4.72, nc));
    put(box(0.12, 0.02, 0.36, steelBr, 20.02, 1.09, 3.56));                     // prateleira de canto
    for (let i = 0; i < 3; i++) put(cyl(0.025, 0.025, 0.16 - i * 0.02, [amber, ceramic, terra][i], 20.02, 1.1 + (0.16 - i * 0.02) / 2, 3.46 + i * 0.1, 10));
    put(box(0.3, 0.012, 0.5, sand, 18.86, 0.012, 3.85, nc));
  }

  // =====================================================================
  // CAIXA D'ÁGUA (x 17,0–20,1 · z 0–3,1)
  // =====================================================================
  {
    put(box(2.65, 0.25, 1.95, M.concrete, 18.62, 0.125, 1.45));                 // base de concreto
    for (const x of [17.98, 19.28]) {
      put(cyl(0.6, 0.52, 0.82, tankBlue, x, 0.66, 1.45, 28));
      put(cyl(0.62, 0.62, 0.05, tankLid, x, 1.09, 1.45, 28));
      put(cyl(0.34, 0.6, 0.16, tankLid, x, 1.19, 1.45, 28));
      put(cyl(0.1, 0.1, 0.04, tankBlue, x, 1.29, 1.45, 14));
      // entrada pela tampa (boia) e saída na lateral de baixo
      pipe([x, 1.2, 0.95], [x, 1.5, 0.95], 0.022);
      pipe([x, 0.35, 1.95], [x, 0.35, 2.45], 0.025, pvcBrown);
      put(cyl(0.04, 0.04, 0.08, pvcBrown, x, 0.35, 2.3, 10)).rotation.x = PI / 2;   // registro de gaveta
      put(cyl(0.008, 0.008, 0.08, M.chrome, x, 0.42, 2.3, 6));                      // haste + volante vermelho
      const wh = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.009, 6, 16), M.red);
      wh.rotation.x = PI / 2; wh.position.set(x, 0.465, 2.3); put(wh);
      // frisos horizontais do reservatório e trava da tampa
      for (const y of [0.45, 0.75]) { const r = 0.532 + (y - 0.25) * 0.0976; put(cyl(r, r, 0.03, tankLid, x, y, 1.45, 28)); }
      put(box(0.06, 0.05, 0.03, tankLid, x + 0.6, 1.07, 1.45));
    }
    // extravasor (ladrão): liga os dois reservatórios e sai pelo muro x = 20,1
    pipe([18.56, 0.98, 1.45], [18.7, 0.98, 1.45], 0.02);
    pipe([19.86, 0.98, 1.45], [20.075, 0.98, 1.45], 0.02);
    put(cyl(0.035, 0.035, 0.01, pvc, 20.08, 0.98, 1.45, 12)).rotation.z = PI / 2;   // espelho da saída
    put(cyl(0.07, 0.07, 0.006, steelBr, 18.6, 0.008, 2.75, 16));                 // ralo
    // mangueira enrolada no suporte (parede z = 3,1) e escada de alumínio encostada no muro z = 0
    {
      const reel = cyl(0.2, 0.2, 0.1, hoseGr, 17.55, 1.15, 2.9875, 20); reel.rotation.x = PI / 2; put(reel);
      const hub = cyl(0.08, 0.08, 0.12, metalBk, 17.55, 1.15, 2.9875, 12); hub.rotation.x = PI / 2; put(hub);
      put(box(0.04, 0.2, 0.05, metalBk, 17.55, 1.0, 3.0275));
      put(box(0.03, 0.9, 0.03, hoseGr, 17.42, 0.62, 2.9375));                     // ponta pendurada
      const lad = G();
      for (const sx of [-1, 1]) lad.add(box(0.05, 2.1, 0.025, steelBr, sx * 0.2, 1.05, 0));
      for (let i = 0; i < 6; i++) lad.add(box(0.4, 0.03, 0.02, steelBr, 0, 0.3 + i * 0.3, 0));
      lad.rotation.x = -0.1; place(lad, 17.62, 0.275, 0);
    }
    pipe([17.6, 1.5, 0.95], [19.8, 1.5, 0.95], 0.025);                          // barrilete de entrada
    pipe([19.8, 1.5, 0.95], [19.8, 1.5, 0.125], 0.025);
    pipe([19.8, 1.5, 0.125], [19.8, 2.6, 0.125], 0.025);
    pipe([17.7, 0.35, 2.45], [19.6, 0.35, 2.45], 0.03, pvcBrown);               // barrilete de saída
    for (const x of [17.98, 19.28]) put(sph(0.035, pvcBrown, x, 0.35, 2.45));
    // motobomba sobre base, recalque subindo pela parede z=3,1
    put(box(0.6, 0.08, 0.38, M.concrete, 19.55, 0.04, 2.78));
    const mot = cyl(0.1, 0.1, 0.28, pumpBlue, 19.45, 0.2, 2.78, 16); mot.rotation.z = PI / 2; put(mot);
    const cap = cyl(0.08, 0.08, 0.06, metalBk, 19.28, 0.2, 2.78, 12); cap.rotation.z = PI / 2; put(cap);
    put(cyl(0.09, 0.09, 0.12, pumpBlue, 19.68, 0.2, 2.78, 14));
    pipe([19.6, 0.35, 2.45], [19.6, 0.35, 2.62], 0.03, pvcBrown);
    pipe([19.68, 0.28, 2.78], [19.68, 2.4, 2.78], 0.025);
    // quadro elétrico na parede x=20,1
    put(box(0.12, 0.42, 0.32, panelGr, 20.025, 1.6, 2.5));
    put(box(0.012, 0.08, 0.1, M.red, 19.96, 1.72, 2.5, nc));
    pipe([20.025, 1.39, 2.5], [20.025, 0.9, 2.5], 0.015, graph);
  }

  // =====================================================================
  // RECEPÇÃO (x 9,45–12,75 · z 5,9–9,25)
  // =====================================================================
  {
    // balcão: frente ripada virada para a espera (−x), tampo branco do lado de dentro
    put(box(0.62, 0.03, 1.6, whiteTop, 11.3, 0.745, 7.1));
    put(box(0.04, 1.06, 1.6, blackM, 10.99, 0.53, 7.1));
    put(box(0.26, 0.03, 1.66, woodL, 10.96, 1.075, 7.1));
    for (let i = 0; i < 12; i++) put(box(0.022, 0.96, 0.07, ripaB, 10.958, 0.5, 6.37 + i * 0.1327));
    for (const z of [6.32, 7.88]) put(box(0.62, 0.73, 0.04, blackM, 11.3, 0.365, z));
    put(box(0.34, 0.55, 0.5, whiteTop, 11.4, 0.28, 7.55));                      // gaveteiro
    const mon = monitor(0.5, scrRec); place(mon, 11.12, 7.25, FX, 0.76);
    put(box(0.14, 0.018, 0.4, graph, 11.4, 0.769, 7.25));                        // teclado
    put(box(0.2, 0.012, 0.28, paper, 11.35, 0.766, 6.65));
    put(cyl(0.035, 0.03, 0.09, terra, 11.5, 0.805, 6.45, 12));
    put(box(0.2, 0.06, 0.12, metalBk, 10.97, 1.12, 6.6));                         // porta-folhetos
    put(box(0.012, 0.2, 0.14, amber, 10.95, 1.2, 6.6, nc)).rotation.z = 0.2;
    place(officeChair(), 12.1, 7.15, FNX);
    // marca "B" em acrílico preto na frente ripada do balcão + fita de LED sob o tampo alto
    const mk = ctx.logo.mesh(0.34, 0, { layout: 'mark', color: '#161618', roughness: 0.3 });
    mk.rotation.y = FNX; mk.position.set(10.944, 0.6, 7.1); put(mk);
    put(box(0.012, 0.008, 1.56, ledRec, 10.87, 1.056, 7.1, nc));
    // telefone e porta-canetas no tampo de dentro
    put(box(0.16, 0.05, 0.2, metalBk, 11.45, 0.785, 6.9)); put(box(0.05, 0.03, 0.18, graph, 11.4, 0.822, 6.9));
    put(cyl(0.03, 0.03, 0.1, metalBk, 11.5, 0.81, 7.8, 10));
    // capacho com o logo (grafite, logo claro) logo depois da porta da recepção (x 11,8–12,6)
    const cap = ctx.logo.mesh(0.9, 0, { layout: 'wide', color: '#d9d4ca', bg: '#1a1a1c', pad: 0.12, roughness: 1 });
    cap.rotation.x = -PI / 2; cap.position.set(12.2, 0.014, 8.72); put(cap);
  }
  // PAREDE DA MARCA (x = 12,75, atrás do balcão): ripado de madeira clara do rodapé à sanca,
  // como o painel da fachada, com o LOGO oficial em letras caixa prateadas (ctx.logo.relief)
  // retroiluminadas — o halo e o brilho das letras acompanham a luz 'recepcao'.
  {
    const Z0 = 6.45, Z1 = 8.05, ZC = (Z0 + Z1) / 2, n = 16, pitch = (Z1 - Z0) / n;
    put(box(0.012, 2.72, Z1 - Z0 + 0.04, blackM, 12.7025, 1.42, ZC, nc));          // fundo preto (sombra entre ripas)
    for (let i = 0; i < n; i++) put(box(0.03, 2.62, pitch * 0.62, ripaB, 12.6775, 1.39, Z0 + pitch * (i + 0.5)));
    put(box(0.05, 0.08, Z1 - Z0 + 0.04, metalBk, 12.6875, 0.04, ZC));               // rodapé preto
    put(box(0.09, 0.08, Z1 - Z0 + 0.04, metalBk, 12.6675, 2.74, ZC));               // sanca preta
    put(box(0.012, 0.008, Z1 - Z0 - 0.04, ledRec, 12.6375, 2.697, ZC, nc));          // fita de LED lavando o ripado
    const L = ctx.logo.relief(0.7, { layout: 'full', depth: 0.045, layers: 4 });
    L.rotation.y = FNX; L.position.set(12.6595, 1.66, ZC); put(L);
    ctx.bindEmissive('recepcao', L.userData.face, 0.45, { min: 0.25 });
    const halo = ctx.glowPlane(1.5, 1.6, 'recepcao', { color: 0xfff1dc, base: 0.32, day: 0.15 });
    halo.rotation.y = FNX; halo.position.set(12.6605, 1.66, ZC); put(halo);
  }
  // 3 poltronas de espera na parede x=9,45, mesinha, planta, bebedouro e quadro
  for (const z of [6.42, 7.22, 8.02]) place(armchair(caramel, caramel, 0.66, 0.7, metalBk), 9.9125, z, FX);
  place(plant(0.5, 0.4, 7, 0.16, true), 9.8125, 8.82);
  {
    const g = G();                                                               // bebedouro com galão
    g.add(box(0.3, 0.95, 0.32, whiteTop, 0, 0.475, 0));
    g.add(box(0.3, 0.04, 0.32, graph, 0, 0.97, 0));
    g.add(cyl(0.13, 0.13, 0.42, waterJug, 0, 1.2, 0, 16));
    g.add(cyl(0.05, 0.08, 0.06, waterJug, 0, 1.44, 0, 12));
    g.add(box(0.18, 0.1, 0.03, graph, 0, 0.72, 0.17));
    for (const sx of [-1, 1]) g.add(box(0.02, 0.04, 0.03, sx < 0 ? M.blue : M.red, sx * 0.05, 0.8, 0.175));
    place(g, 12.4975, 6.1625, FNZ);
  }
  place(frame(0.8, 0.56, terra, amber), 10.55, 9.1975, FNZ, 1.65);

  // ---- placas de porta (acrílico preto, marca + nome) na face externa da parede z = 9,25 ----
  // Uma textura só (2 linhas) → 1 material → 1 draw call; cada placa usa a sua faixa de UV.
  {
    const PW = 0.26, PH = 0.1, rowH = Math.round(512 * PH / PW);
    const names = [['RECEPÇÃO'], ['SALA', 'PASTORAL']];
    const tex = ctx.makeTex(512, (g, s) => {
      g.fillStyle = '#0f0f11'; g.fillRect(0, 0, s, s);
      names.forEach((t, i) => {
        const y0 = i * rowH, pad = rowH * 0.18;
        g.fillStyle = '#17171a'; g.fillRect(0, y0, s, rowH);
        ctx.logo.draw(g, pad, y0 + pad, rowH - 2 * pad, { layout: 'mark', color: '#f4f5f7' });
        g.fillStyle = '#f4f5f7'; g.textBaseline = 'middle'; g.textAlign = 'left';
        let fs = rowH * (t.length > 1 ? 0.27 : 0.32); g.font = `700 ${fs}px ${ctx.logo.font}`;
        const maxW = s - rowH - pad * 1.2, w0 = Math.max(...t.map((l) => g.measureText(l).width));
        if (w0 > maxW) { fs *= maxW / w0; g.font = `700 ${fs}px ${ctx.logo.font}`; }
        t.forEach((l, k) => g.fillText(l, rowH * 0.98, y0 + rowH / 2 + (k - (t.length - 1) / 2) * fs * 1.12));
      });
    });
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.25, metalness: 0.1 });
    const plate = (i, x) => {
      const geo = new THREE.PlaneGeometry(PW, PH), uv = geo.attributes.uv;
      const v1 = 1 - (i * rowH) / 512, v0 = 1 - ((i + 1) * rowH) / 512;
      for (let k = 0; k < uv.count; k++) uv.setY(k, v0 + uv.getY(k) * (v1 - v0));
      const m = new THREE.Mesh(geo, mat); m.position.set(x, 1.6, 9.3005); m.castShadow = false; put(m);
      put(box(PW + 0.01, PH + 0.01, 0.01, metalBk, x, 1.6, 9.2935, nc));
    };
    plate(0, 11.52);                                                             // porta da recepção (x 11,8–12,6)
    plate(1, 14.0);                                                              // porta da pastoral (x 12,9–13,8)
  }

  // =====================================================================
  // SALA GILVAN (x 17,1–20,1 · z 11,0–14,2) — porta em x=17,1 (z 12,9–13,8)
  // =====================================================================
  {
    const g = credenza(2.0, 0.4, 0.74, 3);                                      // aparador de apoio sob a janela
    books(g, -0.68, 0.74, 0, 0.36, 41, 0.2, 0.24);
    g.add(cyl(0.07, 0.06, 0.16, ceramic, 0.05, 0.82, 0, 12)); g.add(sph(0.08, frond, 0.05, 0.94, 0));
    const pf = frame(0.2, 0.26, amber, sand); pf.position.set(0.55, 0.87, -0.05); pf.rotation.x = -0.12; g.add(pf);
    g.add(box(0.28, 0.08, 0.2, graph, 0.8, 0.78, 0));
    place(g, 18.9, 11.36, FZ);
    place(workDesk(1.3, 0.68, true, 3, scrAdm, shadeAdm), 18.6, 12.5, FX);
    place(officeChair(), 19.45, 12.5, FNX);
    place(shellChair(caramel), 17.85, 12.07, FX);
    place(shellChair(caramel), 17.85, 12.62, FX);
    place(plant(0.42, 0.4, 9, 0.16, true), 19.68, 13.8);
    place(frame(0.7, 0.5, blackM, terra), 18.6, 14.1, FNZ, 1.65);
    // 2 prateleiras flutuantes (madeira clara, mão-francesa oculta) na parede x = 20,1, atrás da cadeira:
    // livros, bíblia, porta-retrato, plantinha e um bloco de madeira com a marca "B"
    const sh = G();
    for (const y of [1.45, 1.85]) sh.add(box(0.24, 0.035, 1.3, woodL, 0, y, 0));
    books(sh, 0, 1.4675, 0, 0.5, 51, 0.18, 0.24);                              // fileira ao longo de z (girada abaixo)
    sh.children.slice(2).forEach((bk) => { const x0 = bk.position.x; bk.position.x = bk.position.z + 0.01; bk.position.z = x0 - 0.3; bk.rotation.y = PI / 2; });
    sh.add(box(0.2, 0.05, 0.28, blackM, 0.0, 1.492, 0.38)); sh.add(box(0.19, 0.012, 0.26, amber, 0.0, 1.521, 0.38));
    sh.add(cyl(0.06, 0.05, 0.12, ceramic, 0.0, 1.927, -0.45, 12)); sh.add(sph(0.08, frond2, 0.0, 2.04, -0.45));
    sh.add(box(0.05, 0.24, 0.24, woodL, -0.02, 1.987, 0.05));
    const bm = ctx.logo.mesh(0.19, 0, { layout: 'mark', color: '#1b1b1d', roughness: 0.4 });
    bm.rotation.y = FNX; bm.position.set(-0.047, 1.987, 0.05); sh.add(bm);
    const pf2 = frame(0.18, 0.24, sand, terra); pf2.rotation.y = FNX; pf2.rotation.z = 0; pf2.position.set(-0.02, 1.99, 0.42); sh.add(pf2);
    place(sh, 19.88, 12.55, 0);
    // cabideiro de pé no canto da porta
    const cb = G();
    cb.add(cyl(0.18, 0.2, 0.025, metalBk, 0, 0.0125, 0, 20));
    cb.add(cyl(0.016, 0.016, 1.72, metalBk, 0, 0.87, 0, 8));
    for (let i = 0; i < 4; i++) { const hk = box(0.16, 0.016, 0.016, metalBk, Math.cos(i * PI / 2) * 0.07, 1.68, Math.sin(i * PI / 2) * 0.07); hk.rotation.y = -i * PI / 2; hk.rotation.z = 0.35 * (i % 2 ? 1 : 1); cb.add(hk); }
    cb.add(box(0.34, 0.62, 0.1, graph, 0.1, 1.36, 0.03));                      // blazer pendurado
    cb.add(box(0.24, 0.3, 0.06, caramel, -0.07, 1.42, -0.1));                   // bolsa
    place(cb, 17.45, 11.4, 0.6);
  }

  // =====================================================================
  // ADMINISTRATIVO (x 17,1–20,1 · z 14,2–19,0) — porta em x=17,1 (z 14,4–15,3)
  // =====================================================================
  {
    // aparador da impressora na parede z=14,2
    const g = credenza(1.5, 0.48, 0.74, 3, woodL, blackM, woodL);
    g.add(box(0.5, 0.3, 0.42, whiteTop, 0.25, 0.89, 0));                       // multifuncional
    g.add(box(0.5, 0.06, 0.42, graph, 0.25, 1.07, -0.0));
    g.add(box(0.36, 0.012, 0.22, paper, 0.25, 0.9, 0.23));
    g.add(box(0.12, 0.012, 0.08, metalBk, 0.42, 1.101, 0.1));
    g.add(box(0.3, 0.12, 0.22, paper, -0.45, 0.8, 0.02));                       // resmas
    g.add(box(0.08, 0.28, 0.25, book[1], -0.2, 0.88, 0)); g.add(box(0.08, 0.28, 0.25, book[6], -0.11, 0.88, 0));
    place(g, 19.2, 14.6, FZ);
    // logo 'wide' em acrílico preto (letras caixa finas) na parede z = 14,2, acima da multifuncional
    const LW = ctx.logo.relief(0.95, { layout: 'wide', depth: 0.018, layers: 3, color: 0x1b1b1d, sideColor: 0x0d0d0f, metalness: 0.25, roughness: 0.35 });
    LW.position.set(19.2, 1.74, 14.279); put(LW);
    // 2 estações de trabalho
    for (const [zc, s] of [[15.95, 4], [17.8, 5]]) {
      place(workDesk(1.3, 0.68, true, s, scrAdm), 18.6, zc, FX);
      place(officeChair(), 19.45, zc, FNX);
      place(shellChair(caramel), 17.95, zc, FX);
    }
    // aparador para café na parede x=17,1 (entre a porta e a janela J05)
    const c = credenza(1.25, 0.4, 0.86, 2);
    coffeeSet(c, -0.4, 0.86, 0);
    place(c, 17.42, 16.08, FX);
    // arquivo de aço de 4 gavetas na parede z=19
    const a = G();
    a.add(box(0.47, 1.33, 0.58, graph, 0, 0.665, 0));
    for (let i = 0; i < 4; i++) {
      a.add(box(0.43, 0.3, 0.012, graph, 0, 0.17 + i * 0.325, 0.296));
      a.add(box(0.16, 0.02, 0.025, M.chrome, 0, 0.26 + i * 0.325, 0.31));
      a.add(box(0.08, 0.035, 0.005, paper, 0, 0.29 + i * 0.325, 0.304, nc));
    }
    a.add(cyl(0.08, 0.06, 0.18, ceramic, 0.08, 1.42, 0, 12)); a.add(sph(0.1, frond2, 0.08, 1.56, 0));
    place(a, 17.8, 18.6, FNZ);
    place(plant(0.42, 0.4, 13, 0.16, true), 19.68, 18.6);
    // mural de cortiça (escala do culto, avisos) na parede x = 20,1, entre as estações
    {
      const g2 = G();
      g2.add(box(1.1, 0.78, 0.03, metalBk, 0, 0, 0));
      g2.add(box(1.04, 0.72, 0.012, cork, 0, 0, 0.018, nc));
      const notes = [[-0.36, 0.18, 0.21, 0.297, paper], [-0.1, 0.2, 0.18, 0.18, sand], [0.16, 0.16, 0.21, 0.297, paper], [0.4, 0.2, 0.15, 0.15, amber],
        [-0.34, -0.17, 0.26, 0.18, linenLt], [-0.04, -0.16, 0.21, 0.297, paper], [0.24, -0.17, 0.2, 0.14, terra], [0.42, -0.18, 0.1, 0.14, paper]];
      notes.forEach(([x, y, w, h, m], i) => {
        const n = box(w, h, 0.004, m, x, y, 0.027, nc); n.rotation.z = ((i * 37) % 7 - 3) * 0.015; g2.add(n);
        g2.add(sph(0.012, i % 2 ? M.red : amber, x, y + h / 2 - 0.025, 0.032));
      });
      place(g2, 19.995, 16.88, FNX, 1.58);
    }
    // relógio de parede na parede z=19
    const clk = cyl(0.16, 0.16, 0.03, metalBk, 18.9, 2.05, 18.9, 24); clk.rotation.x = PI / 2; put(clk);
    const face = cyl(0.145, 0.145, 0.006, ceramic, 18.9, 2.05, 18.882, 24); face.rotation.x = PI / 2; face.castShadow = false; put(face);
    put(box(0.012, 0.1, 0.006, metalBk, 18.9, 2.09, 18.876, nc));
    const hand = box(0.012, 0.07, 0.006, metalBk, 18.925, 2.04, 18.876, nc); hand.rotation.z = -2.0; put(hand);
  }
}
