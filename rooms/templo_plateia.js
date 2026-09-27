function roomTemploPlateia(ctx) {
  // ---------------------------------------------------------------------------
  // TEMPLO — PLATEIA (x 0–16,05 · z 18,3–44,0). O palco (z ≤ 17,6 + escada até
  // 18,3) é de outra decoração. Tudo virado para o palco (−z).
  // Paleta: estrutura preta, estofado grafite, ripado de madeira clara sobre
  // fundo preto (como o painel da fachada), passadeira grafite com filete
  // terracota. Objetos do cartão (splits, luminárias, som) NÃO são recriados;
  // o ripado desvia dos pilares, das aberturas e deixa 0,5 m livres em volta
  // dos splits (ali ele vira um lambri baixo).
  // ---------------------------------------------------------------------------
  const THREE = ctx.THREE, M = ctx.M;
  const box = (...a) => ctx.box(...a), cyl = (...a) => ctx.cyl(...a), sph = (...a) => ctx.sph(...a);
  const place = (...a) => ctx.place(...a), std = (o) => ctx.std(o), rnd = () => ctx.rnd();
  const put = (m) => { ctx.add(m); return m; };
  const G = () => new THREE.Group();
  const mesh = (geo, mat, x, y, z, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; return m; };

  // Materiais locais (ctx.std com as mesmas opções → mesmo material → merge)
  const black    = std({ color: 0x141416, roughness: 0.45, metalness: 0.45 });   // estrutura das cadeiras
  const uphol    = std({ color: 0x55585f, roughness: 0.97 });                     // estofado grafite
  const felt     = std({ color: 0x19191b, roughness: 1 });                        // fundo do ripado (feltro acústico)
  const slatWood = std({ color: 0xcfa97c, roughness: 0.7 });                      // ripado madeira clara
  const carpet   = std({ color: 0x2f3034, roughness: 1 });                        // passadeira
  const terra    = std({ color: 0xa65a3a, roughness: 0.95 });                     // filete terracota
  const amber    = std({ color: 0xc98a3c, roughness: 0.6, metalness: 0.2 });
  const redExt   = std({ color: 0xc4201b, roughness: 0.35, metalness: 0.1 });
  const potBlack = std({ color: 0x1c1c1e, roughness: 0.55 });
  const frond    = std({ color: 0x2f5a2a, roughness: 0.9 });
  const frond2   = std({ color: 0x3d6e34, roughness: 0.9 });
  const trunk    = std({ color: 0x5b4632, roughness: 1 });
  const grille   = std({ color: 0x2a2b2e, roughness: 0.95 });
  const lensGl   = std({ color: 0x0c1826, roughness: 0.05, metalness: 0.6 });

  // Funde várias caixas numa só geometria (peça repetida = 1 malha em vez de ~10)
  // item: [w, h, d, x, y, z, rx, ry, rz]
  const mergeBoxes = (list) => {
    const parts = []; let total = 0;
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
    for (const [w, h, d, x, y, z, rx = 0, ry = 0, rz = 0] of list) {
      const g = new THREE.BoxGeometry(w, h, d).toNonIndexed();
      m4.compose(p.set(x, y, z), q.setFromEuler(e.set(rx, ry, rz)), one); g.applyMatrix4(m4);
      parts.push(g); total += g.attributes.position.count;
    }
    const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), uv = new Float32Array(total * 2);
    let off = 0;
    for (const g of parts) {
      const n = g.attributes.position.count;
      pos.set(g.attributes.position.array, off * 3); nor.set(g.attributes.normal.array, off * 3); uv.set(g.attributes.uv.array, off * 2);
      off += n; g.dispose();
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    out.computeBoundingSphere();
    return out;
  };
  // Haste cilíndrica entre dois pontos (pés do tripé, etc.)
  const UP = new THREE.Vector3(0, 1, 0);
  const rod = (a, b, r, mat) => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), dir = vb.clone().sub(va), len = dir.length();
    const m = cyl(r, r, len, mat, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, 6);
    m.quaternion.setFromUnitVectors(UP, dir.normalize()); return m;
  };
  // Material com textura de canvas (placas) — criado à parte, não passa pelo cache do std
  const texMat = (tex, glow = 0) => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, emissive: glow ? 0xffffff : 0x000000, emissiveMap: glow ? tex : null, emissiveIntensity: glow });
  const plane = (w, h, mat) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.castShadow = false; m.receiveShadow = false; return m; };
  // desenha num canvas quadrado como se fosse w×h (compensa a proporção)
  const signTex = (w, h, draw) => ctx.makeTex(256, (g, s) => { const vh = s * h / w; g.save(); g.scale(1, w / h); draw(g, s, vh); g.restore(); });

  // ======================= CADEIRAS =======================
  // Cadeira empilhável de igreja: estrutura preta (pés, laterais, barra de pega,
  // concha do encosto) + estofado grafite. 2 malhas por cadeira (geometria compartilhada).
  // Origem no centro da base; frente para −z.
  const TILT = 0.1;
  const chairFrame = mergeBoxes([
    [0.44, 0.025, 0.42, 0, 0.418, -0.02],                      // chapa do assento
    [0.022, 0.43, 0.022, -0.21, 0.215, -0.2], [0.022, 0.43, 0.022, 0.21, 0.215, -0.2],   // pés dianteiros
    [0.022, 0.43, 0.022, -0.21, 0.215, 0.19], [0.022, 0.43, 0.022, 0.21, 0.215, 0.19],   // pés traseiros
    [0.022, 0.56, 0.022, -0.215, 0.7, 0.215, TILT], [0.022, 0.56, 0.022, 0.215, 0.7, 0.215, TILT],   // montantes do encosto
    [0.022, 0.03, 0.42, -0.21, 0.4, -0.005], [0.022, 0.03, 0.42, 0.21, 0.4, -0.005],     // laterais do assento
    [0.44, 0.37, 0.012, 0, 0.775, 0.258, TILT],                // concha preta atrás do encosto
    [0.46, 0.024, 0.03, 0, 0.975, 0.262, TILT],                // barra de pega
    [0.42, 0.018, 0.018, 0, 0.1, 0.19],                        // travessa traseira baixa
  ]);
  const chairPad = mergeBoxes([
    [0.46, 0.07, 0.44, 0, 0.465, -0.02],                       // assento estofado
    [0.44, 0.36, 0.045, 0, 0.775, 0.228, TILT],                // encosto estofado
  ]);
  const chairAt = (x, z) => {
    const ry = (rnd() - 0.5) * 0.03, dx = (rnd() - 0.5) * 0.012, dz = (rnd() - 0.5) * 0.02;
    const f = put(mesh(chairFrame, black, x + dx, 0, z + dz, false)); f.rotation.y = ry;
    const p = put(mesh(chairPad, uphol, x + dx, 0, z + dz, true)); p.rotation.y = ry;
    return { x: x + dx, z: z + dz, ry };
  };
  // Capa branca de "reservado" (com faixa âmbar) vestida no encosto
  const coverGeo = mergeBoxes([[0.47, 0.3, 0.075, 0, 0.84, 0.242, TILT]]);
  const coverBand = mergeBoxes([[0.475, 0.04, 0.08, 0, 0.74, 0.232, TILT]]);
  const linen = std({ color: 0xf1ede4, roughness: 1 });
  // Blocos: corredor central x 7,33–8,73 (1,4 m); 11 cadeiras de 0,53 m por bloco;
  // corredores laterais de ~1,3 m (dos pilares). Fileiras a cada 0,95 m de z 19,8
  // a 41,65, sem a fileira de z 35,0 → corredor transversal alinhado com a porta lateral.
  const PITCH = 0.53, NB = 11, AISLE_L = 7.33, AISLE_R = 8.73;
  const rows = [];
  for (let k = 0; k < 24; k++) if (k !== 16) rows.push(19.8 + k * 0.95);
  const lastRow = rows[rows.length - 1];
  for (const z of rows) {
    for (let i = 0; i < NB; i++) {
      // fileira de trás, junto ao corredor central: 2 lugares reservados para cadeira de rodas
      if (z === lastRow && i < 2) continue;
      for (const x of [AISLE_L - PITCH / 2 - i * PITCH, AISLE_R + PITCH / 2 + i * PITCH]) {
        const c = chairAt(x, z);
        if (z === rows[0] && i < 2) {   // 1ª fileira junto ao corredor: lugares reservados
          put(mesh(coverGeo, linen, c.x, 0, c.z)).rotation.y = c.ry;
          put(mesh(coverBand, amber, c.x, 0, c.z, false)).rotation.y = c.ry;
        }
      }
    }
  }
  // Espaço PCD (piso azul com o símbolo internacional de acesso)
  const pcdTex = ctx.makeTex(256, (g, s) => {
    g.fillStyle = '#1f5fae'; g.fillRect(0, 0, s, s);
    g.strokeStyle = '#ffffff'; g.lineWidth = 10; g.strokeRect(12, 12, s - 24, s - 24);
    g.fillStyle = '#ffffff'; g.strokeStyle = '#ffffff'; g.lineCap = 'round';
    g.beginPath(); g.arc(118, 62, 16, 0, Math.PI * 2); g.fill();
    g.lineWidth = 16; g.beginPath(); g.moveTo(112, 88); g.lineTo(108, 150); g.lineTo(160, 150); g.lineTo(178, 196); g.stroke();
    g.beginPath(); g.moveTo(110, 112); g.lineTo(150, 112); g.stroke();
    g.lineWidth = 12; g.beginPath(); g.arc(112, 160, 46, Math.PI * 0.55, Math.PI * 1.75); g.stroke();
  });
  const pcdMat = texMat(pcdTex); pcdMat.polygonOffset = true; pcdMat.polygonOffsetFactor = -2;
  { const d = plane(0.95, 1.15, pcdMat); d.rotation.x = -Math.PI / 2; d.position.set(AISLE_L - PITCH, 0.008, lastRow); put(d); }

  // ======================= PASSADEIRA =======================
  // Corredor central (z 18,5–42,4) + trecho transversal até a porta de vidro do hall (x 10,6–13,1)
  const RX0 = 7.43, RX1 = 8.63, RZ0 = 18.5, RZ1 = 42.1, CZ1 = 43.0, CX1 = 13.0;
  put(box(RX1 - RX0, 0.01, RZ1 - RZ0, carpet, (RX0 + RX1) / 2, 0.009, (RZ0 + RZ1) / 2, { cast: false }));
  put(box(CX1 - RX0, 0.01, CZ1 - RZ1, carpet, (RX0 + CX1) / 2, 0.0091, (RZ1 + CZ1) / 2, { cast: false }));
  const fil = 0.035, fy = 0.0155, fo = 0.07;
  put(box(fil, 0.003, CZ1 - RZ0 - 2 * fo, terra, RX0 + fo, fy, (RZ0 + CZ1) / 2, { cast: false }));
  put(box(fil, 0.003, RZ1 - RZ0 - fo, terra, RX1 - fo, fy, (RZ0 + fo + RZ1 + fo) / 2, { cast: false }));
  put(box(RX1 - RX0 - 2 * fo, 0.003, fil, terra, (RX0 + RX1) / 2, fy, RZ0 + fo, { cast: false }));
  put(box(CX1 - RX1, 0.003, fil, terra, (RX1 - fo + CX1 - fo) / 2, fy, RZ1 + fo, { cast: false }));
  put(box(CX1 - RX0 - 2 * fo, 0.003, fil, terra, (RX0 + CX1) / 2, fy, CZ1 - fo, { cast: false }));
  put(box(fil, 0.003, CZ1 - RZ1 - 2 * fo, terra, CX1 - fo, fy, (RZ1 + CZ1) / 2, { cast: false }));

  // ======================= RIPADO ACÚSTICO =======================
  // Painel: fundo de feltro preto + ripas verticais de madeira clara (1 malha fundida).
  // side 'L' (x = 0), 'R' (x = 16,05), 'B' (z = 44). [a, b] = trecho ao longo da parede.
  const SP = 0.075, SW = 0.04, SD = 0.025;
  const panel = (side, a, b, y0, y1) => {
    const len = b - a; if (len < 0.35) return;
    const n = Math.max(1, Math.floor((len - 0.04) / SP)), start = (a + b) / 2 - ((n - 1) * SP) / 2;
    const hh = y1 - y0, ym = (y0 + y1) / 2, list = [];
    if (side === 'B') {
      put(box(len, hh + 0.04, 0.017, felt, (a + b) / 2, ym, 43.9135, { cast: false }));
      for (let i = 0; i < n; i++) list.push([SW, hh, SD, start + i * SP, ym, 43.8925]);
      put(box(len, 0.03, 0.05, felt, (a + b) / 2, y1 + 0.035, 43.88, { cast: false }));   // arremate superior
    } else {
      const xb = side === 'L' ? 0.1 : 15.96, xs = side === 'L' ? 0.1225 : 15.9375, xc = side === 'L' ? 0.115 : 15.945;
      put(box(0.02, hh + 0.04, len, felt, xb, ym, (a + b) / 2, { cast: false }));
      for (let i = 0; i < n; i++) list.push([SD, hh, SW, xs, ym, start + i * SP]);
      put(box(0.05, 0.03, len, felt, xc, y1 + 0.035, (a + b) / 2, { cast: false }));
    }
    put(mesh(mergeBoxes(list), slatWood, 0, 0, 0, false));
  };
  const subtract = (spans, holes) => {
    let out = spans;
    for (const [ha, hb] of holes) {
      const nx = [];
      for (const [s, e] of out) {
        if (hb <= s || ha >= e) nx.push([s, e]);
        else { if (ha > s) nx.push([s, ha]); if (hb < e) nx.push([hb, e]); }
      }
      out = nx;
    }
    return out;
  };
  const intersect = (spans, zones) => {
    const out = [];
    for (const [s, e] of spans) for (const [a, b] of zones) { const lo = Math.max(s, a), hi = Math.min(e, b); if (hi - lo > 0.01) out.push([lo, hi]); }
    return out;
  };
  const Y0 = 0.14, Y1 = 2.82, YLOW = 1.85;
  const wallPanels = (side, from, to, holes, lows) => {
    const free = subtract([[from, to]], holes);
    for (const [a, b] of subtract(free, lows)) panel(side, a, b, Y0, Y1);
    for (const [a, b] of intersect(free, lows)) panel(side, a, b, Y0, YLOW);   // lambri baixo sob os splits
  };
  // pilares: parede x = 0 e parede x = 16,05 (posições diferentes, seguem a planta)
  const PIL = ctx.PILLARS_L || [16.9, 21.4, 25.9, 30.4, 35.0, 39.5, 44.0];
  const PILR = ctx.PILLARS_R || [18.3, 23.2, 28.0, 33.7, 39.3, 44.0];
  const pil = PIL.map((z) => [z - 0.26, z + 0.26]), pilR = PILR.map((z) => [z - 0.26, z + 0.26]);
  const splitZone = (z) => [z - 0.45 - 0.5, z + 0.45 + 0.5];
  // Parede x = 0 (splits em z 22,1 / 29,6 / 38,0)
  wallPanels('L', 18.45, 43.75, pil, [22.1, 29.6, 38.0].map(splitZone));
  // Parede x = 16,05: vidro, janelas da mídia/voluntariado, porta da circulação, splits em 38,6 / 41,6
  const openR = [[19.2, 22.6], [23.6, 27.7], [29.9, 31.9], [34.2, 35.1]].map(([a, b]) => [a - 0.12, b + 0.12]);
  wallPanels('R', 18.45, 43.75, [...pilR, ...openR, [32.0, 33.3]], [38.6, 41.6].map(splitZone));
  // Parede do fundo (z = 44): pilares em x 0 / 5,4 / 10,5 / 16,05; porta de vidro x 10,6–13,1
  for (const [a, b] of [[0.3, 5.14], [5.66, 10.24], [13.3, 15.79]]) panel('B', a, b, Y0, Y1);

  // ======================= PLACAS DE SAÍDA (verde, acesas) =======================
  const exitTex = signTex(0.42, 0.16, (g, s, vh) => {
    g.fillStyle = '#0c8f45'; g.fillRect(0, 0, s, vh);
    g.strokeStyle = '#e9fff1'; g.lineWidth = 3; g.strokeRect(5, 4, s - 10, vh - 8);
    g.fillStyle = '#ffffff'; g.font = 'bold 50px Arial, Helvetica, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('SAÍDA', s * 0.58, vh / 2 + 2);
    // seta
    g.beginPath(); g.moveTo(22, vh / 2); g.lineTo(46, vh / 2 - 20); g.lineTo(46, vh / 2 - 8); g.lineTo(64, vh / 2 - 8);
    g.lineTo(64, vh / 2 + 8); g.lineTo(46, vh / 2 + 8); g.lineTo(46, vh / 2 + 20); g.closePath(); g.fill();
  });
  const exitMat = texMat(exitTex, 0.9);
  const exitSign = (x, y, z, ry) => {
    const g = G();
    g.add(box(0.44, 0.18, 0.04, M.white, 0, 0, 0, { cast: false }));
    const f = plane(0.42, 0.16, exitMat); f.position.z = 0.021; g.add(f);
    place(g, x, z, ry, y);
  };
  exitSign(11.85, 2.5, 43.905, Math.PI);          // sobre a porta de vidro do hall
  exitSign(15.955, 2.38, 34.65, -Math.PI / 2);    // sobre a porta lateral (circulação)
  // Luminárias de emergência (bloco autônomo branco com 2 faróis)
  const emerg = (x, y, z, ry) => {
    const g = G();
    g.add(box(0.34, 0.08, 0.06, M.white, 0, 0, 0));
    for (const s of [-1, 1]) { const h = cyl(0.028, 0.028, 0.03, M.fixture, s * 0.1, -0.02, 0.045, 10); h.rotation.x = Math.PI / 2; g.add(h); }
    place(g, x, z, ry, y);
  };
  // (sobre o ripado: afastadas da face das ripas)
  emerg(13.9, 2.62, 43.85, Math.PI);
  emerg(15.945, 2.62, 33.0, -Math.PI / 2);
  emerg(0.165, 2.62, 27.0, Math.PI / 2);
  emerg(0.165, 2.62, 33.2, Math.PI / 2);
  emerg(15.885, 2.62, 29.2, -Math.PI / 2);

  // ======================= EXTINTORES =======================
  // Extintor no suporte + placa de sinalização acima + demarcação no piso (vermelho com borda amarela)
  const extSignTex = ctx.makeTex(128, (g, s) => {
    g.fillStyle = '#d0231d'; g.fillRect(0, 0, s, s);
    g.fillStyle = '#ffffff';
    g.fillRect(52, 40, 26, 66); g.beginPath(); g.arc(65, 42, 13, Math.PI, 0); g.fill();
    g.fillRect(58, 18, 12, 14); g.fillRect(66, 20, 26, 6); g.fillRect(40, 44, 10, 36);
    g.strokeStyle = '#ffffff'; g.lineWidth = 5; g.strokeRect(6, 6, s - 12, s - 12);
  });
  const extSignMat = texMat(extSignTex);
  const floorTex = ctx.makeTex(128, (g, s) => { g.fillStyle = '#e8b518'; g.fillRect(0, 0, s, s); g.fillStyle = '#b8231d'; g.fillRect(14, 14, s - 28, s - 28); });
  const floorMat = texMat(floorTex); floorMat.polygonOffset = true; floorMat.polygonOffsetFactor = -2;
  // (x, z) = ponto na face da parede/pilar; nx, nz = normal para dentro da sala
  const extinguisher = (x, z, nx, nz) => {
    const g = G();   // local: parede em z = 0, sala para +z
    g.add(box(0.12, 0.2, 0.02, black, 0, 1.0, 0.01));                               // suporte
    g.add(cyl(0.075, 0.075, 0.46, redExt, 0, 1.0, 0.09, 14));                        // cilindro
    g.add(sph(0.075, redExt, 0, 1.23, 0.09));
    g.add(cyl(0.02, 0.022, 0.06, black, 0, 1.3, 0.09, 8));                           // válvula
    g.add(box(0.1, 0.015, 0.03, black, 0.03, 1.34, 0.09));                           // gatilho
    g.add(box(0.018, 0.34, 0.018, black, -0.07, 1.1, 0.13));                         // mangueira
    g.add(box(0.12, 0.12, 0.006, M.white, 0, 0.95, 0.166));                          // rótulo
    const s = plane(0.24, 0.24, extSignMat); s.position.set(0, 1.78, 0.006); g.add(s);
    const f = plane(0.7, 0.7, floorMat); f.rotation.x = -Math.PI / 2; f.position.set(0, 0.008, 0.4); g.add(f);
    place(g, x, z, Math.atan2(nx, nz));
  };
  extinguisher(0.2, 30.4, 1, 0);        // pilar esquerdo z 30,4
  extinguisher(0.2, 39.5, 1, 0);        // pilar esquerdo z 39,5
  extinguisher(15.85, 39.3, -1, 0);     // pilar direito z 39,3
  extinguisher(15.975, 32.55, -1, 0);   // parede direita, entre a janela e o pilar da porta lateral

  // ======================= CAIXAS DE SOM DE DELAY (nos pilares) =======================
  const delaySpk = (x, z, side) => {
    const g = G();   // local: face do pilar em z = 0, sala para +z
    g.add(box(0.05, 0.1, 0.06, black, 0, 0, 0.03));
    const s = G(); s.position.set(0, 0, 0.16); s.rotation.x = 0.22;   // inclinada para a plateia
    s.add(box(0.3, 0.46, 0.22, black, 0, 0, 0));
    s.add(box(0.27, 0.43, 0.006, grille, 0, 0, 0.112, { cast: false }));
    g.add(s);
    place(g, x, z, side > 0 ? Math.PI / 2 : -Math.PI / 2, 2.55);
  };
  for (const z of [25.9, 35.0]) delaySpk(0.2, z, 1);
  for (const z of [28.0, 33.7]) delaySpk(15.85, z, -1);

  // ======================= CÂMERAS EM TRIPÉ (corredor central) =======================
  const camera = (x, z, seed) => {
    const g = G(), rr = ((seed * 0.37) % 1) * Math.PI;
    const HEAD = 1.3;
    for (let i = 0; i < 3; i++) {
      const a = rr + (i * Math.PI * 2) / 3;
      g.add(rod([Math.cos(a) * 0.4, 0.02, Math.sin(a) * 0.4], [Math.cos(a) * 0.05, HEAD - 0.05, Math.sin(a) * 0.05], 0.013, black));
      g.add(rod([Math.cos(a) * 0.2, 0.42, Math.sin(a) * 0.2], [0, 0.55, 0], 0.007, M.steel));   // aranha
      g.add(box(0.03, 0.02, 0.05, M.dark, Math.cos(a) * 0.4, 0.01, Math.sin(a) * 0.4));      // sapata
    }
    g.add(cyl(0.02, 0.02, 0.8, M.steel, 0, 0.95, 0, 8));                    // coluna
    g.add(cyl(0.05, 0.05, 0.07, black, 0, HEAD + 0.03, 0, 12));              // cabeça fluida
    g.add(box(0.14, 0.03, 0.2, black, 0, HEAD + 0.08, 0));
    const bar = rod([0.05, HEAD + 0.08, 0.1], [0.12, HEAD - 0.02, 0.55], 0.012, black); g.add(bar);   // alavanca
    g.add(box(0.13, 0.16, 0.32, M.dark, 0, HEAD + 0.18, 0.0));               // corpo
    g.add(box(0.1, 0.05, 0.14, black, 0, HEAD + 0.285, -0.04));              // alça
    const lens = cyl(0.05, 0.045, 0.2, black, 0, HEAD + 0.18, -0.25, 14); lens.rotation.x = Math.PI / 2; g.add(lens);
    const glassL = cyl(0.043, 0.043, 0.006, lensGl, 0, HEAD + 0.18, -0.353, 14); glassL.rotation.x = Math.PI / 2; g.add(glassL);
    g.add(box(0.13, 0.11, 0.05, black, 0, HEAD + 0.18, -0.38));             // para-sol
    g.add(box(0.012, 0.09, 0.13, M.dark, -0.075, HEAD + 0.22, 0.1));         // monitor lateral
    const scr = box(0.004, 0.075, 0.11, M.screenOff, -0.082, HEAD + 0.22, 0.1, { cast: false }); g.add(scr);
    g.add(box(0.03, 0.015, 0.015, M.lightRed, 0, HEAD + 0.27, -0.155, { cast: false }));   // tally
    place(g, x, z, (rnd() - 0.5) * 0.08);
  };
  camera(8.03, 31.0, 1);
  camera(8.03, 40.2, 2);

  // ======================= FUNDO: GAZOFILÁCIOS, TOTEM, VASOS =======================
  // Gazofilácio (caixa de ofertas) em madeira clara ripada, tampo preto com fenda
  const offering = (x, z, ry) => {
    const g = G();   // frente para +z
    g.add(box(0.5, 0.06, 0.4, black, 0, 0.03, 0));
    g.add(box(0.46, 0.86, 0.36, slatWood, 0, 0.49, 0));
    const r = [];
    for (let i = 0; i < 6; i++) r.push([0.03, 0.8, 0.02, -0.19 + i * 0.076, 0.49, 0.187]);
    g.add(mesh(mergeBoxes(r), slatWood, 0, 0, 0, false));
    g.add(box(0.5, 0.04, 0.4, black, 0, 0.94, 0));
    g.add(box(0.2, 0.006, 0.02, M.dark, 0, 0.963, 0.04));                   // fenda
    g.add(box(0.26, 0.05, 0.012, amber, 0, 0.8, 0.2));                      // plaquinha âmbar
    g.add(box(0.14, 0.08, 0.1, black, 0.13, 1.0, -0.1));                    // porta-envelopes
    g.add(box(0.12, 0.1, 0.004, M.white, 0.13, 1.02, -0.09, { cast: false }));
    place(g, x, z, ry);
  };
  offering(6.4, 43.6, Math.PI);
  offering(14.5, 43.6, Math.PI);
  // Totem de boas-vindas (preto com face ripada e o "B" da Base Church)
  const logoTex = signTex(0.4, 1.1, (g, s, vh) => {
    g.fillStyle = '#cfa97c'; g.fillRect(0, 0, s, vh);
    g.fillStyle = 'rgba(80,50,25,0.35)'; for (let x = 0; x < s; x += 16) g.fillRect(x, 0, 3, vh);
    const cx = s / 2, cy = vh * 0.34;
    g.fillStyle = '#141416'; g.beginPath(); g.arc(cx, cy, 70, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#cfa97c'; g.font = 'bold 96px Arial, Helvetica, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('B', cx, cy + 4);
    g.fillStyle = '#141416'; g.font = 'bold 34px Arial, Helvetica, sans-serif';
    g.fillText('BASE', cx, vh * 0.62); g.fillText('CHURCH', cx, vh * 0.7);
    g.font = '20px Arial, Helvetica, sans-serif'; g.fillText('seja bem-vindo', cx, vh * 0.82);
  });
  const logoMat = texMat(logoTex);
  {
    const g = G();
    g.add(box(0.5, 0.05, 0.32, black, 0, 0.025, 0));
    g.add(box(0.46, 1.75, 0.26, black, 0, 0.925, 0));
    const f = plane(0.4, 1.1, logoMat); f.position.set(0, 1.12, 0.131); g.add(f);
    g.add(box(0.4, 0.02, 0.01, amber, 0, 0.5, 0.132));
    place(g, 15.4, 43.25, -2.3);
  }
  // Cicas em vaso preto (como na fachada), ladeando a porta de vidro
  const cycad = (x, z, seed) => {
    const g = G(); let s = seed * 9301;
    const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    g.add(cyl(0.22, 0.17, 0.5, potBlack, 0, 0.25, 0, 16));
    g.add(cyl(0.2, 0.2, 0.02, M.soil, 0, 0.49, 0, 14));
    g.add(cyl(0.09, 0.11, 0.26, trunk, 0, 0.62, 0, 10));
    const top = new THREE.Vector3(0, 0.76, 0);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + r() * 0.3, el = 0.55 + r() * 0.4, L = 0.42 + r() * 0.13;
      const dir = new THREE.Vector3(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el));
      const m = box(0.13, 0.008, L, i % 2 ? frond : frond2, 0, 0, 0, { cast: true });
      const c = top.clone().addScaledVector(dir, L / 2); m.position.copy(c); m.lookAt(top.clone().addScaledVector(dir, L));
      g.add(m);
    }
    place(g, x, z, 0);
  };
  cycad(9.85, 43.35, 3);
  cycad(13.55, 43.35, 5);
}
