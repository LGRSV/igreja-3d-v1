function roomTemploPlateia(ctx) {
  // ---------------------------------------------------------------------------
  // TEMPLO — PLATEIA (x 0–16,05 · z 19,05–44,0). O palco (z ≤ 17,6 + escada até
  // 18,3) e o molton das paredes do palco (z ≤ 19,0) são de outra decoração.
  // Tudo virado para o palco (−z).
  // Conceito "black box" da Igreja Preta: paredes e pilares revestidos de painel
  // acústico preto fosco (tecido com juntas), rodapé preto acetinado; sobre ele,
  // painéis de ripado de madeira clara "flutuando" (como o painel da fachada) com
  // fita de LED âmbar no topo. Logo oficial (ctx.logo) em letras caixa com
  // retroiluminação na parede esquerda (visível da vista inicial) e na parede do
  // fundo (visível do palco). Objetos do cartão (splits, luminárias, trilhos,
  // som) NÃO são recriados; nada encosta num raio de 0,4 m das luminárias.
  // Brilhos ligados à entidade 'plateia' (ctx.bindEmissive / ctx.glowPlane);
  // o monitor de retorno do fundo segue o 'telao'.
  // ---------------------------------------------------------------------------
  const THREE = ctx.THREE, M = ctx.M;
  const box = (...a) => ctx.box(...a), cyl = (...a) => ctx.cyl(...a), sph = (...a) => ctx.sph(...a);
  const place = (...a) => ctx.place(...a), std = (o) => ctx.std(o), rnd = () => ctx.rnd();
  const put = (m) => { ctx.add(m); return m; };
  const G = () => new THREE.Group();
  const nc = { cast: false };
  const mesh = (geo, mat, x, y, z, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; return m; };

  // Materiais locais (ctx.std com as mesmas opções → mesmo material → merge)
  const black    = std({ color: 0x141416, roughness: 0.45, metalness: 0.45 });   // estrutura das cadeiras
  const uphol    = std({ color: 0x55585f, roughness: 0.97 });                     // estofado grafite
  const felt     = std({ color: 0x1b1b1e, roughness: 1 });                        // painel acústico preto (tecido)
  const reveal   = std({ color: 0x070708, roughness: 1 });                        // juntas entre painéis
  const skirting = std({ color: 0x1e1e21, roughness: 0.5, metalness: 0.1 });      // rodapé preto acetinado
  const slatWood = std({ color: 0xcaa47e, roughness: 0.7 });                      // ripado madeira clara
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
  const leather  = std({ color: 0x2b1c16, roughness: 0.6 });                      // capa de Bíblia
  const leather2 = std({ color: 0x14203a, roughness: 0.6 });
  const paper    = std({ color: 0xefece4, roughness: 0.95 });
  // Emissivos que acompanham a luz da plateia (1 material cada → 1 draw call cada)
  const ledStrip = new THREE.MeshStandardMaterial({ color: 0x3a2c1c, emissive: 0xffb45e, emissiveIntensity: 0, roughness: 0.5 });
  const aisleLed = new THREE.MeshStandardMaterial({ color: 0x2a2116, emissive: 0xffbf6e, emissiveIntensity: 0, roughness: 0.4 });
  ctx.bindEmissive('plateia', ledStrip, 2.6, { min: 0.04 });
  ctx.bindEmissive('plateia', aisleLed, 2.2, { min: 0.25 });   // balizadores ficam acesos baixinho (segurança)

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
  const texMat = (tex, glow = 0, rough = 0.55) => new THREE.MeshStandardMaterial({ map: tex, roughness: rough, emissive: glow ? 0xffffff : 0x000000, emissiveMap: glow ? tex : null, emissiveIntensity: glow });
  const plane = (w, h, mat) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.castShadow = false; m.receiveShadow = false; return m; };
  // desenha num canvas quadrado como se fosse w×h (compensa a proporção)
  const signTex = (w, h, draw, size = 256) => ctx.makeTex(size, (g, s) => { const vh = s * h / w; g.save(); g.scale(1, w / h); draw(g, s, vh); g.restore(); });
  const FONT = ctx.logo.font;

  // ======================= CADEIRAS (~500 lugares) =======================
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
    [0.018, 0.018, 0.4, -0.21, 0.1, -0.005], [0.018, 0.018, 0.4, 0.21, 0.1, -0.005],    // travessas laterais baixas
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
  // Capa branca de "reservado" (com faixa âmbar e o "B" da Base) vestida no encosto
  const coverGeo = mergeBoxes([[0.47, 0.3, 0.075, 0, 0.84, 0.242, TILT]]);
  const coverBand = mergeBoxes([[0.475, 0.04, 0.08, 0, 0.74, 0.232, TILT]]);
  const linen = std({ color: 0xf1ede4, roughness: 1 });
  const coverLogoMat = ctx.logo.mesh(0.14, 0.14, { layout: 'mark', color: '#1a1a1c', size: 256, cast: false }).material;
  const coverLogoGeo = new THREE.PlaneGeometry(0.14, 0.14);
  // Fileiras: 2 blocos de 11 cadeiras (0,53 m) com corredor central x 7,33–8,73 (1,4 m)
  // e corredores laterais de ~1,3 m (até o revestimento dos pilares). 24 posições a cada
  // 0,95 m de z 19,8 a 41,65, sem a de z 35,0 → corredor transversal alinhado com a
  // porta lateral. 23 fileiras × 22 − 2 (espaço PCD) = 504 lugares.
  const PITCH = 0.53, NB = 11, AISLE_L = 7.33, AISLE_R = 8.73;
  const rows = [];
  for (let k = 0; k < 24; k++) if (k !== 16) rows.push(19.8 + k * 0.95);
  const lastRow = rows[rows.length - 1];
  const aisleChairs = [];   // [cadeira, lado do corredor (+1 = corredor à direita), índice da fileira]
  const seats = [];
  rows.forEach((z, ri) => {
    for (let i = 0; i < NB; i++) {
      // fileira de trás, junto ao corredor central: 2 lugares reservados para cadeira de rodas
      if (z === lastRow && i < 2) continue;
      for (const [x, side] of [[AISLE_L - PITCH / 2 - i * PITCH, 1], [AISLE_R + PITCH / 2 + i * PITCH, -1]]) {
        const c = chairAt(x, z);
        seats.push(c);
        if (i === 0) aisleChairs.push([c, side, ri]);
        if (ri === 0 && i < 2) {   // 1ª fileira junto ao corredor: lugares reservados
          put(mesh(coverGeo, linen, c.x, 0, c.z)).rotation.y = c.ry;
          put(mesh(coverBand, amber, c.x, 0, c.z, false)).rotation.y = c.ry;
          // logo na parte de trás da capa (inclinada como o encosto)
          const lg = new THREE.Mesh(coverLogoGeo, coverLogoMat); lg.castShadow = false;
          const pv = G(); pv.position.set(c.x, 0, c.z); pv.rotation.y = c.ry;
          lg.position.set(0, 0.84 - 0.0385 * Math.sin(TILT), 0.242 + 0.0385 * Math.cos(TILT)); lg.rotation.x = TILT;
          pv.add(lg); put(pv);
        }
      }
    }
  });
  // Placas de fileira (A…W) no montante da cadeira do corredor central + balizador de LED no pé
  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVW';
  const rowTex = ctx.makeTex(512, (g, s) => {
    const n = 6, c = s / n;
    g.fillStyle = '#c9a063'; g.fillRect(0, 0, s, s);
    g.fillStyle = '#17171a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 ${c * 0.62}px ${FONT}`;
    for (let i = 0; i < n * n; i++) { const cx = (i % n) * c + c / 2, cy = Math.floor(i / n) * c + c / 2; if (i < LETTERS.length) g.fillText(LETTERS[i], cx, cy + c * 0.04); }
    g.strokeStyle = 'rgba(23,23,26,0.55)'; g.lineWidth = 3;
    for (let i = 0; i < n * n; i++) g.strokeRect((i % n) * c + 6, Math.floor(i / n) * c + 6, c - 12, c - 12);
  });
  rowTex.wrapS = rowTex.wrapT = THREE.ClampToEdgeWrapping;
  const rowMat = texMat(rowTex, 0, 0.4);
  const rowPlate = (idx) => {
    const geo = new THREE.PlaneGeometry(0.075, 0.075), n = 6, u0 = (idx % n) / n, v1 = 1 - Math.floor(idx / n) / n, uv = geo.attributes.uv;
    // PlaneGeometry: (0,1) (1,1) (0,0) (1,0)
    uv.setXY(0, u0, v1); uv.setXY(1, u0 + 1 / n, v1); uv.setXY(2, u0, v1 - 1 / n); uv.setXY(3, u0 + 1 / n, v1 - 1 / n);
    return new THREE.Mesh(geo, rowMat);
  };
  for (const [c, side, ri] of aisleChairs) {
    const pv = G(); pv.position.set(c.x, 0, c.z); pv.rotation.y = c.ry;
    const p = rowPlate(ri); p.castShadow = false;
    p.position.set(side * 0.228, 0.62, 0.2); p.rotation.y = side * Math.PI / 2; pv.add(p);
    // balizador: LED âmbar no pé traseiro, virado para o corredor
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.022, 0.05), aisleLed); l.castShadow = false;
    l.position.set(side * 0.224, 0.16, 0.19); pv.add(l);
    put(pv);
  }
  // Vida: Bíblias e folhetos esquecidos em alguns assentos (semente fixa)
  for (let k = 0; k < 16; k++) {
    const c = seats[Math.floor(rnd() * seats.length)], pv = G(); pv.position.set(c.x, 0, c.z); pv.rotation.y = c.ry + (rnd() - 0.5) * 0.8;
    if (k % 3 === 2) pv.add(box(0.15, 0.004, 0.21, paper, (rnd() - 0.5) * 0.1, 0.502, (rnd() - 0.5) * 0.1, nc));
    else {
      const bx = (rnd() - 0.5) * 0.1, bz = (rnd() - 0.5) * 0.08, mat = k % 2 ? leather : leather2;
      pv.add(box(0.16, 0.038, 0.22, mat, bx, 0.519, bz));
      pv.add(box(0.15, 0.03, 0.005, paper, bx, 0.519, bz + 0.109, nc));   // corte das páginas
    }
    put(pv);
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
  const pcdMat = texMat(pcdTex, 0, 0.8); pcdMat.polygonOffset = true; pcdMat.polygonOffsetFactor = -2;
  { const d = plane(0.95, 1.15, pcdMat); d.rotation.x = -Math.PI / 2; d.position.set(AISLE_L - PITCH, 0.008, lastRow); put(d); }

  // ======================= PASSADEIRA =======================
  // Corredor central (z 18,5–42,4) + trecho transversal até a porta de vidro do hall (x 10,6–13,1)
  const RX0 = 7.43, RX1 = 8.63, RZ0 = 18.5, RZ1 = 42.1, CZ1 = 43.0, CX1 = 13.0;
  put(box(RX1 - RX0, 0.01, RZ1 - RZ0, carpet, (RX0 + RX1) / 2, 0.009, (RZ0 + RZ1) / 2, nc));
  put(box(CX1 - RX0, 0.01, CZ1 - RZ1, carpet, (RX0 + CX1) / 2, 0.0091, (RZ1 + CZ1) / 2, nc));
  const fil = 0.035, fy = 0.0155, fo = 0.07;
  put(box(fil, 0.003, CZ1 - RZ0 - 2 * fo, terra, RX0 + fo, fy, (RZ0 + CZ1) / 2, nc));
  put(box(fil, 0.003, RZ1 - RZ0 - fo, terra, RX1 - fo, fy, (RZ0 + fo + RZ1 + fo) / 2, nc));
  put(box(RX1 - RX0 - 2 * fo, 0.003, fil, terra, (RX0 + RX1) / 2, fy, RZ0 + fo, nc));
  put(box(CX1 - RX1, 0.003, fil, terra, (RX1 - fo + CX1 - fo) / 2, fy, RZ1 + fo, nc));
  put(box(CX1 - RX0 - 2 * fo, 0.003, fil, terra, (RX0 + CX1) / 2, fy, CZ1 - fo, nc));
  put(box(fil, 0.003, CZ1 - RZ1 - 2 * fo, terra, CX1 - fo, fy, (RZ1 + CZ1) / 2, nc));
  // "B" tecido na passadeira, na entrada do corredor central (lido de quem entra)
  { const m = ctx.logo.mesh(0.6, 0.6, { layout: 'mark', color: '#77787d', size: 512, roughness: 1 }); m.rotation.x = -Math.PI / 2; m.position.set(8.03, 0.0152, 42.55); put(m); }

  // ======================= BLACK BOX: REVESTIMENTO ACÚSTICO =======================
  // Faces das paredes (lado do templo): x = 0 → 0,087 (revestimento do cartão) · x = 16,05 → 15,975 ·
  // z = 44 → 43,925. O painel preto (1,4–1,6 cm) sobrepõe a face em alguns mm (sem fresta).
  // side 'L' (x = 0, sala para +x) · 'R' (x = 16,05, sala para −x) · 'B' (z = 44, sala para −z)
  const FACE = { L: 0.097, R: 15.962, B: 43.912 };           // face do painel preto
  const NRM = { L: 1, R: -1, B: -1 };
  const HT = 2.995;
  // caixa encostada no painel preto: a..b ao longo da parede, y0..y1, espessura d, afastamento off
  const onWall = (side, a, b, y0, y1, d, off, mat, cast = false) => {
    const n = NRM[side], c = FACE[side] + n * (off + d / 2);
    return side === 'B' ? box(b - a, y1 - y0, d, mat, (a + b) / 2, (y0 + y1) / 2, c, { cast }) : box(d, y1 - y0, b - a, mat, c, (y0 + y1) / 2, (a + b) / 2, { cast });
  };
  const feltSpan = (side, a, b, y0 = 0, y1 = HT) => {
    if (b - a < 0.02) return;
    put(onWall(side, a, b, y0, y1, 0.015, -0.015, felt));                   // painel (entra 1,5 cm na parede)
    if (y0 < 0.05) put(onWall(side, a, b, 0.0, 0.1, 0.012, 0, skirting));  // rodapé
    // juntas verticais entre painéis de 1,2 m
    const n = Math.floor((b - a) / 1.2);
    for (let i = 1; i <= n; i++) { const p = a + ((b - a) * i) / (n + 1); put(onWall(side, p - 0.005, p + 0.005, Math.max(y0, 0.1), y1, 0.003, 0, reveal)); }
  };
  // revestimento dos pilares (3 faces + topo), preto como as paredes
  const PIL = (ctx.PILLARS_L || [12.4, 16.9, 21.4, 25.9, 30.4, 35.0, 39.5, 44.0]).filter((z) => z > 19.5);
  const PILR = (ctx.PILLARS_R || [12.4, 18.3, 23.2, 28.0, 33.7, 39.3, 44.0]).filter((z) => z > 19.5);
  const PC = 0.212, PH = 3.062;   // meia-largura revestida · altura (cobre o topo do pilar em 3,05)
  const cladL = (z) => { put(box(PC - 0.083, PH, z >= 43.9 ? 0.142 : 2 * PC, felt, (0.083 + PC) / 2, PH / 2, z >= 43.9 ? 43.859 : z)); put(box(0.012, 0.1, z >= 43.9 ? 0.13 : 2 * PC + 0.012, skirting, PC + 0.006, 0.05, z >= 43.9 ? 43.853 : z, nc)); };
  const cladR = (z) => { put(box(15.978 - (16.05 - PC), PH, z >= 43.9 ? 0.142 : 2 * PC, felt, (15.978 + 16.05 - PC) / 2, PH / 2, z >= 43.9 ? 43.859 : z)); put(box(0.012, 0.1, z >= 43.9 ? 0.13 : 2 * PC + 0.012, skirting, 16.05 - PC - 0.006, 0.05, z >= 43.9 ? 43.853 : z, nc)); };
  PIL.forEach(cladL); PILR.forEach(cladR);
  for (const x of [5.4, 10.5]) {   // pilares do fundo (z = 44): face −z e laterais
    put(box(2 * PC, PH, 0.142, felt, x, PH / 2, 43.859));
    put(box(2 * PC + 0.012, 0.1, 0.012, skirting, x, 0.05, 44.0 - PC - 0.006, nc));
  }
  // vãos das paredes (com folga para batentes/peitoris do cartão)
  const P0 = (z) => z - PC, P1 = (z) => z + PC;
  // parede esquerda (x = 0): sem aberturas; de z 19,05 (fim do molton do palco) até o pilar do fundo
  { let a = 19.05; for (const z of PIL) { feltSpan('L', a, P0(z)); a = P1(z); } }
  // parede direita (x = 16,05)
  {
    const g = 0.07;
    const Rw = [[22.6 + g, P0(23.2)], [P1(23.2), 23.6 - g], [27.7 + g, P0(28.0)], [P1(28.0), 29.9 - g], [31.9 + g, P0(33.7)],
      [P1(33.7), 34.2 - g], [35.1 + g, P0(39.3)], [P1(39.3), P0(44.0)]];
    for (const [a, b] of Rw) feltSpan('R', a, b);
    feltSpan('R', 19.2 - g + 0.14, 22.6 + g, 2.252, HT);    // sobre o vidro (a partir de 19,27: o trecho antes é do palco)
    feltSpan('R', 23.6 - g, 27.7 + g, 0, 1.1 - 0.012);      // sob a janela J12 (peitoril 1,1)
    feltSpan('R', 23.6 - g, 27.7 + g, 2.152, HT);           // sobre a janela J12
    feltSpan('R', 29.9 - g, 31.9 + g, 0, 1.0 - 0.012);
    feltSpan('R', 29.9 - g, 31.9 + g, 2.152, HT);
    feltSpan('R', 34.2 - g, 35.1 + g, 2.102, HT);           // sobre a porta lateral
  }
  // parede do fundo (z = 44): pilares em x 0 / 5,4 / 10,5 / 16,05; porta de vidro x 10,6–13,1
  feltSpan('B', PC, 5.4 - PC); feltSpan('B', 5.4 + PC, 10.5 - PC);
  feltSpan('B', 10.5 + PC, 13.1 + 0.07, 2.252, HT); feltSpan('B', 13.1 + 0.07, 16.05 - PC);

  // ======================= RIPADO DE MADEIRA (painéis flutuantes) =======================
  // Ripas verticais 4 × 2,2 cm a cada 7,5 cm sobre o painel preto, com arremate preto no topo e
  // fita de LED âmbar embaixo do arremate (acende com a plateia). y0..y1 = altura das ripas.
  const SP = 0.075, SW = 0.04, SD = 0.022;
  const slats = (side, a, b, y0 = 0.22, y1 = 2.6, led = true) => {
    const len = b - a; if (len < 0.3) return;
    const n = Math.max(1, Math.floor((len - 0.02) / SP)), start = (a + b) / 2 - ((n - 1) * SP) / 2;
    const hh = y1 - y0, ym = (y0 + y1) / 2, list = [], nn = NRM[side], cc = FACE[side] + nn * (0.004 + SD / 2);
    for (let i = 0; i < n; i++) list.push(side === 'B' ? [SW, hh, SD, start + i * SP, ym, cc] : [SD, hh, SW, cc, ym, start + i * SP]);
    put(mesh(mergeBoxes(list), slatWood, 0, 0, 0, false));
    put(onWall(side, a, b, y0 - 0.03, y0 + 0.02, 0.004, 0, reveal));          // sarrafo preto de fixação (base)
    put(onWall(side, a - 0.02, b + 0.02, y1, y1 + 0.03, 0.05, 0, skirting));  // arremate superior
    if (led) put(onWall(side, a, b, y1 - 0.014, y1 - 0.002, 0.008, 0.036, ledStrip));
  };
  // parede esquerda: um painel por vão entre pilares, desviando dos splits (0,95 m de cada lado)
  slats('L', 19.3, 20.95); slats('L', 23.3, 25.45); slats('L', 26.35, 28.4);
  slats('L', 30.86, 31.36); slats('L', 34.04, 34.54);             // moldura do vão do logo
  slats('L', 35.45, 36.8); slats('L', 39.95, 43.55);
  // lambri baixo sob os splits (z 22,1 / 29,6 / 38,0: 0,95 m livres de cada lado acima de 1,75 m)
  slats('L', 21.86, 23.05, 0.22, 1.75, false); slats('L', 28.65, 29.94, 0.22, 1.75, false); slats('L', 37.05, 39.04, 0.22, 1.75, false);
  // parede direita: entre janela e pilares; lambri baixo sob os 2 splits do fundo
  slats('R', 28.45, 29.72); slats('R', 35.45, 37.4);
  slats('R', 37.65, 38.84, 0.22, 1.75, false); slats('R', 39.75, 43.55, 0.22, 1.75, false);
  // parede do fundo: vão esquerdo inteiro e vão à direita da porta
  slats('B', 0.45, 4.95); slats('B', 13.95, 15.6);

  // ======================= LOGO OFICIAL (letras caixa retroiluminadas) =======================
  // Parede esquerda, no vão entre os pilares 30,4 e 35,0 (sem split): layout completo, 1,3 m,
  // virado para +x — é o que se vê da vista inicial pela lateral aberta da casa de bonecas.
  {
    const L = ctx.logo.relief(1.3, { depth: 0.07, layers: 4, metalness: 0.12, roughness: 0.42 });
    L.rotation.y = Math.PI / 2; L.position.set(FACE.L + 0.002, 1.66, 32.7); put(L);
    ctx.bindEmissive('plateia', L.userData.face, 0.6, { min: 0.3 });
    const h = ctx.glowPlane(2.4, 2.4, 'plateia', { color: 0xffe0b8, base: 0.55, day: 0.2 });
    h.rotation.y = Math.PI / 2; h.position.set(FACE.L + 0.004, 1.66, 32.7); ctx.add(h);
  }
  // Parede do fundo, no vão x 5,6–10,3, virado para o palco (−z): layout horizontal, 3,0 m
  {
    const L = ctx.logo.relief(3.0, { layout: 'wide', depth: 0.07, layers: 4, metalness: 0.12, roughness: 0.42 });
    L.rotation.y = Math.PI; L.position.set(7.95, 2.02, FACE.B - 0.002); put(L);
    ctx.bindEmissive('plateia', L.userData.face, 0.6, { min: 0.3 });
    const h = ctx.glowPlane(4.2, 1.9, 'plateia', { color: 0xffe0b8, base: 0.5, day: 0.2 });
    h.rotation.y = Math.PI; h.position.set(7.95, 2.02, FACE.B - 0.004); ctx.add(h);
  }

  // ======================= MONITOR DE RETORNO (relógio do pregador) =======================
  // TV de 65" no ripado do fundo, virada para o palco: cronômetro + próxima parte do culto.
  {
    const tvTex = signTex(1.45, 0.82, (g, s, vh) => {
      g.fillStyle = '#050507'; g.fillRect(0, 0, s, vh);
      const lh = ctx.logo.draw(g, s * 0.04, vh * 0.07, s * 0.2, { layout: 'wide', color: '#8d8f96' });
      g.fillStyle = '#8d8f96'; g.font = `600 ${vh * 0.075}px ${FONT}`; g.textAlign = 'right'; g.textBaseline = 'middle';
      g.fillText('CULTO DE DOMINGO', s * 0.96, vh * 0.07 + lh / 2);
      g.fillStyle = '#ff3b30'; g.font = `700 ${vh * 0.38}px ${FONT}`; g.textAlign = 'center';
      g.fillText('24:37', s * 0.5, vh * 0.52);
      g.fillStyle = '#f4f5f7'; g.font = `600 ${vh * 0.085}px ${FONT}`;
      g.fillText('PRÓXIMO: PALAVRA  ·  PR. GILVAN', s * 0.5, vh * 0.84);
      g.fillStyle = '#ffb45e'; g.fillRect(s * 0.04, vh * 0.93, s * 0.62, vh * 0.018);
      g.fillStyle = '#2a2b2f'; g.fillRect(s * 0.66, vh * 0.93, s * 0.3, vh * 0.018);
    }, 512);
    const scrMat = new THREE.MeshStandardMaterial({ color: 0x050507, map: tvTex, emissive: 0xffffff, emissiveMap: tvTex, emissiveIntensity: 0, roughness: 0.25 });
    ctx.bindEmissive('telao', scrMat, 0.95, { min: 0.03 });
    const g = G();   // local: parede em z = 0, sala para +z
    g.add(box(0.4, 0.3, 0.05, black, 0, 0, 0.03, nc));                 // suporte
    g.add(box(1.47, 0.85, 0.045, black, 0, 0, 0.078));                  // corpo
    const sc = plane(1.43, 0.8, scrMat); sc.position.set(0, 0, 0.1015); g.add(sc);
    place(g, 2.7, FACE.B - (0.004 + SD) - 0.003, Math.PI, 1.62);
  }

  // ======================= PLACAS DE SAÍDA (verde, acesas) =======================
  const exitTex = signTex(0.42, 0.16, (g, s, vh) => {
    g.fillStyle = '#0c8f45'; g.fillRect(0, 0, s, vh);
    g.strokeStyle = '#e9fff1'; g.lineWidth = 3; g.strokeRect(5, 4, s - 10, vh - 8);
    g.fillStyle = '#ffffff'; g.font = `bold 50px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('SAÍDA', s * 0.58, vh / 2 + 2);
    // seta
    g.beginPath(); g.moveTo(22, vh / 2); g.lineTo(46, vh / 2 - 20); g.lineTo(46, vh / 2 - 8); g.lineTo(64, vh / 2 - 8);
    g.lineTo(64, vh / 2 + 8); g.lineTo(46, vh / 2 + 8); g.lineTo(46, vh / 2 + 20); g.closePath(); g.fill();
  });
  const exitMat = texMat(exitTex, 0.9);
  const exitSign = (x, y, z, ry) => {
    const g = G();
    g.add(box(0.44, 0.18, 0.04, M.white, 0, 0, 0, nc));
    const f = plane(0.42, 0.16, exitMat); f.position.z = 0.021; g.add(f);
    place(g, x, z, ry, y);
  };
  exitSign(11.85, 2.5, FACE.B - 0.021, Math.PI);         // sobre a porta de vidro do hall
  exitSign(FACE.R - 0.021, 2.38, 34.65, -Math.PI / 2);   // sobre a porta lateral (circulação)
  // Luminárias de emergência (bloco autônomo branco com 2 faróis). d = afastamento da face (ripado)
  const emerg = (side, a, y, d = 0) => {
    const g = G();
    g.add(box(0.34, 0.08, 0.06, M.white, 0, 0, 0));
    for (const s of [-1, 1]) { const h = cyl(0.028, 0.028, 0.03, M.fixture, s * 0.1, -0.02, 0.045, 10); h.rotation.x = Math.PI / 2; g.add(h); }
    const c = FACE[side] + NRM[side] * (0.031 + d);
    if (side === 'B') place(g, a, c, Math.PI, y); else place(g, c, a, side === 'L' ? Math.PI / 2 : -Math.PI / 2, y);
  };
  emerg('B', 14.8, 2.75, 0.026);
  emerg('R', 33.2, 2.62);
  emerg('L', 27.3, 2.75, 0.026);
  emerg('L', 34.29, 2.75, 0.026);
  emerg('R', 29.1, 2.75, 0.026);

  // ======================= SEGURANÇA: EXTINTORES, ALARME, LOTAÇÃO =======================
  // Extintor no suporte + placa acima + demarcação no piso (0,6 m, tons terrosos, discreta)
  const extSignTex = ctx.makeTex(128, (g, s) => {
    g.fillStyle = '#c42a22'; g.fillRect(0, 0, s, s);
    g.fillStyle = '#ffffff';
    g.fillRect(52, 40, 26, 66); g.beginPath(); g.arc(65, 42, 13, Math.PI, 0); g.fill();
    g.fillRect(58, 18, 12, 14); g.fillRect(66, 20, 26, 6); g.fillRect(40, 44, 10, 36);
    g.strokeStyle = '#ffffff'; g.lineWidth = 5; g.strokeRect(6, 6, s - 12, s - 12);
  });
  const extSignMat = texMat(extSignTex);
  const floorTex = ctx.makeTex(128, (g, s) => { g.fillStyle = '#b88f2a'; g.fillRect(0, 0, s, s); g.fillStyle = '#8f2a22'; g.fillRect(12, 12, s - 24, s - 24); });
  const floorMat = texMat(floorTex, 0, 0.9); floorMat.polygonOffset = true; floorMat.polygonOffsetFactor = -2;
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
    const f = plane(0.6, 0.6, floorMat); f.rotation.x = -Math.PI / 2; f.position.set(0, 0.008, 0.4); g.add(f);
    place(g, x, z, Math.atan2(nx, nz));
  };
  extinguisher(PC, 30.4, 1, 0);          // pilar esquerdo z 30,4
  extinguisher(PC, 39.5, 1, 0);          // pilar esquerdo z 39,5
  extinguisher(16.05 - PC, 39.3, -1, 0); // pilar direito z 39,3
  extinguisher(FACE.R, 32.55, -1, 0);    // parede direita, entre a janela e o pilar da porta lateral
  // Acionador manual de alarme (caixinha vermelha) junto às saídas
  const alarm = (side, a) => {
    const g = G();
    g.add(box(0.12, 0.12, 0.045, redExt, 0, 0, 0.023));
    g.add(box(0.07, 0.05, 0.006, M.white, 0, 0.01, 0.047, nc));
    g.add(box(0.024, 0.024, 0.01, M.lightRed, 0, 0.01, 0.052, nc));
    if (side === 'B') place(g, a, FACE.B, Math.PI, 1.35); else place(g, FACE.R, a, -Math.PI / 2, 1.35);
  };
  alarm('B', 13.32); alarm('R', 35.3);
  // Placa de lotação (exigência do Corpo de Bombeiros) ao lado da porta de vidro
  {
    const lt = signTex(0.3, 0.42, (g, s, vh) => {
      g.fillStyle = '#f4f5f7'; g.fillRect(0, 0, s, vh);
      g.fillStyle = '#17171a'; g.fillRect(0, 0, s, vh * 0.2);
      g.fillStyle = '#f4f5f7'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `700 ${s * 0.1}px ${FONT}`;
      g.fillText('LOTAÇÃO', s / 2, vh * 0.1);
      g.fillStyle = '#17171a'; g.font = `700 ${s * 0.3}px ${FONT}`; g.fillText('500', s / 2, vh * 0.42);
      g.font = `600 ${s * 0.1}px ${FONT}`; g.fillText('PESSOAS', s / 2, vh * 0.62);
      g.fillStyle = '#c42a22'; g.fillRect(s * 0.1, vh * 0.74, s * 0.8, vh * 0.012);
      g.fillStyle = '#4a4b50'; g.font = `500 ${s * 0.058}px ${FONT}`; g.fillText('CBMTO · AVCB', s / 2, vh * 0.84);
    });
    const p = plane(0.3, 0.42, texMat(lt, 0, 0.5)); p.rotation.y = Math.PI; p.position.set(13.62, 1.62, FACE.B - 0.003); put(p);
  }

  // ======================= CAIXAS DE SOM DE DELAY (nos pilares) =======================
  const delaySpk = (x, z, side) => {
    const g = G();   // local: face do pilar em z = 0, sala para +z
    g.add(box(0.05, 0.1, 0.06, black, 0, 0, 0.03));
    const s = G(); s.position.set(0, 0, 0.16); s.rotation.x = 0.22;   // inclinada para a plateia
    s.add(box(0.3, 0.46, 0.22, black, 0, 0, 0));
    s.add(box(0.27, 0.43, 0.006, grille, 0, 0, 0.112, nc));
    g.add(s);
    place(g, x, z, side > 0 ? Math.PI / 2 : -Math.PI / 2, 2.55);
  };
  for (const z of [25.9, 35.0]) delaySpk(PC, z, 1);
  for (const z of [28.0, 33.7]) delaySpk(16.05 - PC, z, -1);

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
    const scr = box(0.004, 0.075, 0.11, M.screenOff, -0.082, HEAD + 0.22, 0.1, nc); g.add(scr);
    g.add(box(0.03, 0.015, 0.015, M.lightRed, 0, HEAD + 0.27, -0.155, nc));   // tally
    // cabo no piso até a lateral da passadeira
    g.add(box(0.012, 0.006, 0.9, black, 0.3, 0.004, 0.55, nc));
    place(g, x, z, (rnd() - 0.5) * 0.08);
  };
  camera(8.03, 31.0, 1);
  camera(8.03, 40.2, 2);

  // ======================= FUNDO: GAZOFILÁCIOS, TOTEM, VASOS =======================
  // Placa preta com o "B" e "DÍZIMOS E OFERTAS" (logo oficial desenhado por ctx.logo.draw)
  const offerTex = signTex(0.34, 0.1, (g, s, vh) => {
    g.fillStyle = '#141416'; g.fillRect(0, 0, s, vh);
    const m = vh * 0.72; ctx.logo.draw(g, s * 0.05, (vh - m) / 2, m, { layout: 'mark', color: '#e9e4da' });
    g.fillStyle = '#e9e4da'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.font = `700 ${vh * 0.3}px ${FONT}`;
    g.fillText('DÍZIMOS', s * 0.05 + m + s * 0.05, vh * 0.35); g.font = `500 ${vh * 0.24}px ${FONT}`; g.fillText('E OFERTAS', s * 0.05 + m + s * 0.05, vh * 0.7);
  });
  const offerMat = texMat(offerTex, 0, 0.5);
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
    g.add(box(0.36, 0.11, 0.008, black, 0, 0.78, 0.203));                   // placa
    const pl = plane(0.34, 0.1, offerMat); pl.position.set(0, 0.78, 0.2075); g.add(pl);
    g.add(box(0.14, 0.08, 0.1, black, 0.13, 1.0, -0.1));                    // porta-envelopes
    g.add(box(0.12, 0.1, 0.004, M.white, 0.13, 1.02, -0.09, nc));
    place(g, x, z, ry);
  };
  offering(6.4, 43.6, Math.PI);
  offering(14.5, 43.6, Math.PI);
  // Totem de boas-vindas (preto com face de madeira clara e o logo oficial em preto)
  const totemTex = signTex(0.4, 1.1, (g, s, vh) => {
    g.fillStyle = '#cfae88'; g.fillRect(0, 0, s, vh);
    g.fillStyle = 'rgba(70,45,25,0.28)'; for (let x = 10; x < s; x += 18) g.fillRect(x, 0, 3, vh);
    const lw = s * 0.7; ctx.logo.draw(g, (s - lw) / 2, vh * 0.12, lw, { layout: 'full', color: '#141416' });
    g.fillStyle = '#141416'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `600 ${s * 0.085}px ${FONT}`; g.fillText('seja bem-vindo', s / 2, vh * 0.66);
    g.fillRect(s * 0.3, vh * 0.72, s * 0.4, 2);
    g.font = `500 ${s * 0.062}px ${FONT}`; g.fillText('CULTOS', s / 2, vh * 0.78);
    g.fillText('DOM 9h · 18h', s / 2, vh * 0.83); g.fillText('QUA 19h30', s / 2, vh * 0.88);
    g.font = `600 ${s * 0.058}px ${FONT}`; g.fillText('@basechurch', s / 2, vh * 0.95);
  });
  const totemMat = texMat(totemTex, 0, 0.6);
  {
    const g = G();
    g.add(box(0.5, 0.05, 0.32, black, 0, 0.025, 0));
    g.add(box(0.46, 1.75, 0.26, black, 0, 0.925, 0));
    const f = plane(0.4, 1.1, totemMat); f.position.set(0, 1.12, 0.131); g.add(f);
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
