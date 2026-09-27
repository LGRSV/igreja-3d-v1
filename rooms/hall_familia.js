function roomHallFamilia(ctx) {
  // ---------------------------------------------------------------------------
  // HALL DE ENTRADA (x 4,0–16,05 · z 44,0–49,65) + SALA DA FAMÍLIA (x 0–4,0 ·
  // z 46,3–49,65) + WC (x 0–1,9) e WC PCD (x 1,9–4,0) · z 44,0–46,3.
  // Paleta da fachada: preto, ripado de madeira clara, branco e grafite, com
  // acentos âmbar/terracota. Na Sala da Família, tons suaves (sálvia, creme,
  // rosado) e brinquedos coloridos.
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
  const sage     = std({ color: 0x8fa38a, roughness: 0.95 });
  const cream    = std({ color: 0xe9e1d3, roughness: 0.95 });
  const blush    = std({ color: 0xd9a38f, roughness: 0.95 });
  const woodLt   = std({ color: 0xd8b98f, roughness: 0.7 });
  const whiteF   = std({ color: 0xf1efea, roughness: 0.6 });
  const wicker   = std({ color: 0xb9925a, roughness: 0.95 });
  const net      = std({ color: 0xf4f1ea, roughness: 1, transparent: true, opacity: 0.42 });
  const sheer    = std({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.35 });
  const toys     = [0xe0574a, 0xf2b53a, 0x4f9bd9, 0x5bb36a, 0x9a6ad0, 0xf08fb0].map((c) => std({ color: c, roughness: 0.6 }));
  const eva      = [0xf2c14e, 0x7cc4e8, 0x9fd49a, 0xf4a3a0].map((c) => std({ color: c, roughness: 0.95 }));
  // WCs
  const tileWall = std({ color: 0xe9ebe8, roughness: 0.4 });
  const grabBar  = std({ color: 0xd9dde1, roughness: 0.25, metalness: 0.85 });
  const alarm    = std({ color: 0xc4201b, roughness: 0.4 });

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
  // Painel ripado x 5,75–10,15 (entre os pilares de x 5,4 e 10,5), fundo preto
  put(box(4.4, 2.75, 0.02, felt, 7.95, 1.4, WZ + 0.01, nc));
  {
    const L = [];
    for (let x = 5.79; x < 10.12; x += 0.075) L.push([0.04, 2.7, 0.028, x, 1.4, WZ + 0.034]);
    put(mergeBoxes(L, slat, false));
  }
  // Letreiro em letras-caixa prateadas sobre o ripado claro — o mesmo logo da fachada (ctx.logo),
  // com halo de retroiluminação e brilho ligados à luz do hall
  const PZ = WZ + 0.048;                                   // face das ripas
  {
    const halo = ctx.glowPlane(3.6, 1.7, 'hall', { color: 0xffe0b0, base: 0.32, day: 0.2 });
    halo.position.set(7.95, 2.15, PZ + 0.004); ctx.add(halo);
    const LG = ctx.logo.relief(2.15, { layout: 'wide', depth: 0.05, layers: 4 });
    LG.position.set(7.95, 2.17, PZ + 0.002); ctx.add(LG);
    ctx.bindEmissive('hall', LG.userData.face, 0.45, { min: 0.05 });
    // faixa preta com a frase de boas-vindas, abaixo do logo (acende com o hall)
    put(box(1.96, 0.25, 0.012, felt, 7.95, 1.47, PZ + 0.006, { cast: false }));
    put(box(1.96, 0.012, 0.016, amber, 7.95, 1.339, PZ + 0.008, nc));
    const welcome = canvasMat(1.88 / 0.22, (g, W, Hh) => {
      g.clearRect(0, 0, W, Hh);
      g.textBaseline = 'middle'; g.textAlign = 'left';
      g.font = `600 ${Hh * 0.62}px ${FONT}`; const t1 = 'Bem-vindo à ', w1 = g.measureText(t1).width;
      g.font = `800 ${Hh * 0.66}px ${FONT}`; const w2 = g.measureText('Base').width;
      const x0 = (W - w1 - w2) / 2;
      g.fillStyle = '#f4efe6'; g.font = `600 ${Hh * 0.62}px ${FONT}`; g.fillText(t1, x0, Hh * 0.54);
      g.fillStyle = '#f0b36a'; g.font = `800 ${Hh * 0.66}px ${FONT}`; g.fillText('Base', x0 + w1, Hh * 0.54);
    }, 0.8, true);
    ctx.bindEmissive('hall', welcome, 0.8, { min: 0.2 });
    plane(1.88, 0.22, welcome, 7.95, 1.47, PZ + 0.0135);
  }

  // Balcão de boas-vindas em madeira ripada (x 6,3–9,5 · z 45,0–45,65), frente para +z
  {
    const X0 = 6.3, X1 = 9.5, cx = (X0 + X1) / 2, L = X1 - X0, zc = 45.3;
    put(box(L, 1.0, 0.56, felt, cx, 0.5, zc));
    const S = [];
    for (let x = X0 + 0.03; x < X1 - 0.02; x += 0.06) S.push([0.035, 0.94, 0.025, x, 0.5, zc + 0.29]);
    for (const sx of [X0 - 0.015, X1 + 0.015]) for (let z = zc - 0.25; z < zc + 0.27; z += 0.06) S.push([0.025, 0.94, 0.035, sx, 0.5, z]);
    put(mergeBoxes(S, slat));
    put(box(L + 0.1, 0.04, 0.66, quartz, cx, 1.03, zc + 0.02));                  // tampo preto
    put(box(L - 0.1, 0.03, 0.4, slat, cx, 0.76, zc - 0.44));                     // bancada de trabalho (lado de dentro)
    put(box(L - 0.1, 0.03, 0.02, ledWarm, cx, 0.03, zc + 0.31, nc));             // LED no rodapé
    // Medalhão preto com a marca (anel + B) em relevo no centro da frente ripada
    {
      const fz = zc + 0.29 + 0.0125, my = 0.56;
      const disc = cyl(0.25, 0.25, 0.022, felt, cx, my, fz + 0.011, 36); disc.rotation.x = Math.PI / 2; put(disc);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.008, 6, 40), amber); rim.position.set(cx, my, fz + 0.02); put(rim);
      const MK = ctx.logo.relief(0.36, { layout: 'mark', depth: 0.02, layers: 3 });
      MK.position.set(cx, my, fz + 0.022); ctx.add(MK);
      ctx.bindEmissive('hall', MK.userData.face, 0.3, { min: 0.05 });
    }
    // Plaquinha acrílica "Base Kids · check-in" sobre o tampo
    {
      const kids = canvasMat(0.3 / 0.14, (g, W, Hh) => {
        g.fillStyle = '#1a1a1c'; g.fillRect(0, 0, W, Hh);
        ctx.logo.draw(g, W * 0.05, Hh * 0.14, Hh * 0.72, { layout: 'mark', color: '#f4efe6' });
        g.fillStyle = '#f4efe6'; g.textAlign = 'left'; g.textBaseline = 'middle';
        g.font = `800 ${Hh * 0.3}px ${FONT}`; g.fillText('BASE KIDS', W * 0.34, Hh * 0.38);
        g.fillStyle = '#f0b36a'; g.font = `500 ${Hh * 0.22}px ${FONT}`; g.fillText('check-in aqui', W * 0.34, Hh * 0.7);
      }, 0.25);
      put(rot(box(0.32, 0.16, 0.012, black, 7.9, 1.13, zc + 0.24), -0.3));
      const kp = plane(0.3, 0.14, kids, 7.9, 1.13, zc + 0.24); kp.rotation.x = -0.3; kp.position.z += 0.007; kp.position.y += 0.002;
    }
    // Tablets de check-in (Base Kids), porta-folhetos, vaso e sininho
    for (const x of [7.0, 8.8]) {
      put(box(0.1, 0.012, 0.1, black, x, 1.056, zc + 0.05));
      put(rot(box(0.26, 0.19, 0.012, black, x, 1.16, zc + 0.03), -0.35));
      put(rot(box(0.24, 0.17, 0.004, M.screenOff, x, 1.162, zc + 0.037, nc), -0.35));
    }
    put(box(0.3, 0.2, 0.12, black, 7.9, 1.15, zc + 0.12));
    for (let i = 0; i < 3; i++) put(box(0.09, 0.2, 0.004, i === 1 ? terra : paper, 7.8 + i * 0.1, 1.2, zc + 0.185, nc));
    put(cyl(0.05, 0.06, 0.2, ceramic, 6.55, 1.15, zc - 0.05, 12));
    for (let i = 0; i < 3; i++) put(sph(0.07, frond2, 6.55 + (i - 1) * 0.05, 1.3 + (i % 2) * 0.04, zc - 0.05));
    // Banquetas altas atrás do balcão
    for (const x of [7.1, 8.7]) {
      put(cyl(0.18, 0.18, 0.05, caramel, x, 0.74, 44.6, 16));
      put(cyl(0.022, 0.022, 0.7, black, x, 0.37, 44.6, 8));
      put(cyl(0.2, 0.22, 0.02, black, x, 0.01, 44.6, 16));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.01, 6, 20), black); ring.rotation.x = Math.PI / 2; ring.position.set(x, 0.3, 44.6); put(ring);
    }
  }
  // Plantas grandes junto ao pilar esquerdo e perto do café
  place(bigPlant(1.85, 0.22, 3), 5.9, 44.64);
  place(bigPlant(1.7, 0.28, 5), 7.3, 49.02);

  // Banco de madeira ripada entre as portas da parede x = 4,0 + quadro
  {
    const S = [];
    for (let i = 0; i < 6; i++) S.push([0.055, 0.04, 1.0, 4.19 + i * 0.065, 0.45, 45.95]);
    put(mergeBoxes(S, slat));
    for (const z of [45.55, 46.35]) { put(box(0.36, 0.43, 0.04, black, 4.35, 0.215, z)); }
    put(box(0.03, 0.8, 0.95, black, 4.1, 1.55, 45.95));
    put(box(0.012, 0.7, 0.85, slat, 4.12, 1.55, 45.95, nc));
    put(box(0.014, 0.28, 0.28, felt, 4.128, 1.55, 45.95, nc));
    put(cyl(0.07, 0.07, 0.016, amber, 4.132, 1.55, 45.95, 20)).rotation.z = Math.PI / 2;
  }

  // Lounge: sofá grafite na parede x = 4,0, mesa de centro, 2 poltronas caramelo e tapete
  {
    const R = G();
    R.add(box(2.3, 0.008, 2.1, rugEdge, 0, 0.008, 0, nc));
    R.add(box(2.18, 0.01, 1.98, rugHall, 0, 0.012, 0, nc));
    place(R, 6.0, 48.5);
    place(sofa3(1.8), 4.6, 48.5, Math.PI / 2);
    const T2 = G();
    T2.add(cyl(0.42, 0.42, 0.04, slat, 0, 0.4, 0, 28));
    T2.add(cyl(0.34, 0.34, 0.02, black, 0, 0.12, 0, 24));
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; T2.add(cyl(0.012, 0.012, 0.38, black, Math.cos(a) * 0.3, 0.2, Math.sin(a) * 0.3, 6)); }
    T2.add(box(0.24, 0.03, 0.18, terra, -0.1, 0.435, 0.05));                    // livros
    T2.add(box(0.2, 0.025, 0.15, paper, -0.1, 0.46, 0.05));
    T2.add(cyl(0.06, 0.05, 0.12, ceramic, 0.14, 0.48, -0.08, 12));
    place(T2, 5.72, 48.5);
    place(armchair(caramel, felt), 6.62, 47.98, -Math.PI / 2 - 0.12);
    place(armchair(caramel, terra), 6.62, 49.02, -Math.PI / 2 + 0.12);
  }

  // Tapete redondo grafite com borda âmbar sob o pendente do hall (marca a área de encontro)
  {
    const r1 = cyl(1.12, 1.12, 0.008, rugEdge, 8.35, 0.008, 46.85, 40); r1.castShadow = false; put(r1);
    const r2 = cyl(1.05, 1.05, 0.01, rugHall, 8.35, 0.012, 46.85, 40); r2.castShadow = false; put(r2);
  }

  // Café / aparador na parede da fachada (x 7,75–9,95 · z 49,05–49,55)
  {
    const X0 = 7.75, X1 = 9.95, cx = (X0 + X1) / 2, L = X1 - X0, zc = 49.3, fz = 49.563;
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
    const x = 8.75, z = 47.95;
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
  // Portas de vidro do templo: faixa jateada de segurança e a marca em adesivo jateado nas duas folhas
  {
    const ad = ctx.logo.mesh(0.44, 0.44, { layout: 'mark', opacity: 0.72, cast: false, side: THREE.DoubleSide, roughness: 0.7 });
    for (const [x, w] of [[11.235, 1.12], [12.485, 1.12]]) {
      put(box(w, 0.07, 0.026, frost, x, 1.02, 44.0, { cast: false, receive: false }));
      put(box(w, 0.018, 0.026, frost, x, 0.94, 44.0, { cast: false, receive: false }));
      const a = new THREE.Mesh(ad.geometry, ad.material); a.position.set(x, 1.45, 44.015); a.castShadow = a.receiveShadow = false; ctx.add(a);
    }
  }
  put(box(1.2, 0.26, 0.02, felt, 11.85, 2.62, WZ + 0.012, nc));
  const tpl = canvasMat(1.16 / 0.22, (g, W, Hh) => {
    g.clearRect(0, 0, W, Hh);
    g.fillStyle = '#f4efe6'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `600 ${Hh * 0.55}px ${FONT}`;
    g.fillText('T E M P L O', W / 2, Hh * 0.54);
  }, 0.7, true);
  plane(1.16, 0.22, tpl, 11.85, 2.62, WZ + 0.024);
  ctx.bindEmissive('hall', tpl, 0.7, { min: 0.25 });
  const wcs = canvasMat(0.9 / 0.2, (g, W, Hh) => {
    g.fillStyle = '#18181a'; g.fillRect(0, 0, W, Hh);
    g.fillStyle = '#f4efe6'; g.textBaseline = 'middle';
    // pictogramas (masc., fem., PCD) + seta
    const ic = (cx, fem) => {
      g.beginPath(); g.arc(cx, Hh * 0.26, Hh * 0.09, 0, Math.PI * 2); g.fill();
      if (fem) { g.beginPath(); g.moveTo(cx, Hh * 0.38); g.lineTo(cx - Hh * 0.13, Hh * 0.78); g.lineTo(cx + Hh * 0.13, Hh * 0.78); g.closePath(); g.fill(); }
      else g.fillRect(cx - Hh * 0.08, Hh * 0.38, Hh * 0.16, Hh * 0.44);
    };
    ic(W * 0.07, false); ic(W * 0.14, true);
    g.textAlign = 'left'; g.font = `600 ${Hh * 0.4}px ${FONT}`; g.fillText('Banheiros', W * 0.21, Hh * 0.54);
    g.fillStyle = '#f0b36a'; g.beginPath(); g.moveTo(W * 0.8, Hh * 0.35); g.lineTo(W * 0.9, Hh * 0.52); g.lineTo(W * 0.8, Hh * 0.69); g.lineTo(W * 0.8, Hh * 0.58); g.lineTo(W * 0.72, Hh * 0.58); g.lineTo(W * 0.72, Hh * 0.46); g.lineTo(W * 0.8, Hh * 0.46); g.closePath(); g.fill();
  }, 0.7);
  plane(0.9, 0.2, wcs, 15.955, 2.52, 45.2, -Math.PI / 2);
  ctx.bindEmissive('hall', wcs, 0.7, { min: 0.25 });

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
    sign(0, 4.087, 2.42, 47.05, Math.PI / 2);      // hall → Sala da Família
    sign(1, 4.087, 2.42, 44.85, Math.PI / 2);      // hall → WC PCD
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
    [49.11, 48.55, 47.99].forEach((z, i) => {
      put(box(0.03, 0.72, 0.52, black, 4.092, 1.68, z));
      const p = atlasPlane(0.48, 0.68, art, 0, 1, i / 3, (i + 1) / 3);
      p.position.set(4.109, 1.68, z); p.rotation.y = Math.PI / 2; put(p);
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
  // ESCADA EM U (x 13,62–15,94 · z 44,21–49,54) até o mezanino (y 3,0)
  // =====================================================================
  {
    const R = 3.0 / 18, GO = 0.26;                 // espelho e piso do degrau
    const A0 = 13.62, A1 = 14.76, B0 = 14.82, B1 = 15.94, ZF = 46.24, ZL = ZF + 8 * GO;   // ZL = 48,32
    const ZE = 49.54, ZT = 44.21;
    // Lance 1 (maciço, grafite + piso de madeira), sobe para +z; fita de LED sob cada bocel
    for (let i = 1; i <= 8; i++) {
      const z0 = ZF + (i - 1) * GO, top = i * R;
      put(box(A1 - A0, top - 0.03, GO, mass, (A0 + A1) / 2, (top - 0.03) / 2, z0 + GO / 2));
      put(box(A1 - A0 + 0.02, 0.03, GO + 0.03, slat, (A0 + A1) / 2, top - 0.015, z0 + GO / 2 - 0.015));
      put(box(A1 - A0 - 0.1, 0.012, 0.012, ledWarm, (A0 + A1) / 2, top - 0.04, z0 - 0.004, nc));
    }
    // Patamar intermediário (y 1,5) junto à fachada: maciço sob o lance 1, laje sob o lance 2
    put(box(A1 - A0, 1.47, ZE - ZL, mass, (A0 + A1) / 2, 0.735, (ZL + ZE) / 2));
    put(box(B1 - B0 + 0.06, 0.16, ZE - ZL, mass, (B0 + B1) / 2 - 0.03, 1.39, (ZL + ZE) / 2));
    put(box(B1 - A0 + 0.02, 0.03, ZE - ZL + 0.02, slat, (A0 + B1) / 2, 1.485, (ZL + ZE) / 2 - 0.01));
    // Lance 2 (degraus soltos de madeira sobre 2 longarinas pretas), volta para −z
    for (let j = 1; j <= 8; j++) {
      const z1 = ZL - (j - 1) * GO, top = 1.5 + j * R;
      put(box(B1 - B0, 0.05, GO + 0.03, slat, (B0 + B1) / 2, top - 0.025, z1 - GO / 2 + 0.015));
    }
    const ang = Math.atan2(1.5, ZL - ZF), slen = Math.hypot(1.5, ZL - ZF);
    for (const x of [B0 + 0.03, B1 - 0.02]) {
      const s = box(0.03, 0.26, slen, black, x, 1.5 + 0.75 - 0.19, (ZF + ZL) / 2); s.rotation.x = ang; put(s);
    }
    // Patamar superior / mezanino (y 3,0) sobre a passagem para os banheiros (vão livre ≈ 2,8 m)
    put(box(B1 - A0, 0.16, ZF - ZT, mass, (A0 + B1) / 2, 2.9, (ZT + ZF) / 2));
    put(box(B1 - A0 + 0.02, 0.025, ZF - ZT, slat, (A0 + B1) / 2, 2.99, (ZT + ZF) / 2));
    put(box(0.03, 0.2, ZF - ZT, black, A0 - 0.015, 2.9, (ZT + ZF) / 2));             // testeira preta
    put(box(B1 - A0, 0.2, 0.03, black, (A0 + B1) / 2, 2.9, ZF + 0.015));
    put(box(B1 - A0 - 0.2, 0.012, 0.03, ledWarm, (A0 + B1) / 2, 2.81, ZF - 0.02, nc)); // LED sob a testeira
    // Guarda-corpos de vidro com corrimão preto
    const nose1 = (z) => R + ((z - ZF) / GO) * R;                 // linha dos bocéis do lance 1
    const nose2 = (z) => 1.5 + R + ((ZL - z) / GO) * R;           // idem, lance 2
    const GL = M.glass, HR = 0.95;
    // lance 1 — lado do hall (x = A0) + patamar intermediário
    put(quad([A0 - 0.01, 0.03, ZF], [A0 - 0.01, 1.3, ZL], [A0 - 0.01, 1.5 + HR, ZL], [A0 - 0.01, nose1(ZF) + HR, ZF], GL));
    put(quad([A0 - 0.01, 1.3, ZL], [A0 - 0.01, 1.3, ZE - 0.02], [A0 - 0.01, 1.5 + HR, ZE - 0.02], [A0 - 0.01, 1.5 + HR, ZL], GL));
    put(bar(A0 - 0.01, nose1(ZF) + HR + 0.02, ZF, A0 - 0.01, 1.5 + HR + 0.02, ZL, 0.022, black));
    put(bar(A0 - 0.01, 1.5 + HR + 0.02, ZL, A0 - 0.01, 1.5 + HR + 0.02, ZE - 0.02, 0.022, black));
    // entre os lances (x = 14,79): do lance 1 até 0,95 m acima do lance 2
    const XM = (A1 + B0) / 2;
    put(quad([XM, nose1(ZF) - 0.1, ZF], [XM, 1.45, ZL], [XM, nose2(ZL) + HR, ZL], [XM, 3.0 + HR, ZF], GL));
    put(bar(XM, nose2(ZL) + HR + 0.02, ZL, XM, 3.0 + HR + 0.02, ZF, 0.022, black));
    // corrimão de parede do lance 2 (x ≈ 15,9) com 3 suportes
    const XW = B1 - 0.05;
    put(bar(XW, nose2(ZL) + 0.9, ZL, XW, nose2(ZF) + 0.9, ZF, 0.02, black));
    for (const t of [0.15, 0.5, 0.85]) { const z = ZL - t * (ZL - ZF); put(box(0.07, 0.02, 0.02, black, B1 - 0.02, nose2(z) + 0.87, z)); }
    // mezanino: bordas x = A0 e z = ZF (sobre o início do lance 1)
    put(quad([A0 - 0.01, 2.84, ZT], [A0 - 0.01, 2.84, ZF], [A0 - 0.01, 3.0 + HR, ZF], [A0 - 0.01, 3.0 + HR, ZT], GL));
    put(quad([A0, 2.84, ZF + 0.035], [XM, 2.84, ZF + 0.035], [XM, 3.0 + HR, ZF + 0.035], [A0, 3.0 + HR, ZF + 0.035], GL));
    put(bar(A0 - 0.01, 3.0 + HR + 0.02, ZT, A0 - 0.01, 3.0 + HR + 0.02, ZF + 0.035, 0.022, black));
    put(bar(A0 - 0.01, 3.0 + HR + 0.02, ZF + 0.035, XM, 3.0 + HR + 0.02, ZF + 0.035, 0.022, black));
    // montantes pretos nas quinas dos vidros
    for (const [x, y0, z, h] of [[A0 - 0.01, 0, ZF, nose1(ZF) + HR], [A0 - 0.01, 1.3, ZL, HR + 0.2], [A0 - 0.01, 2.84, ZF + 0.035, HR + 0.16], [A0 - 0.01, 2.84, ZT + 0.02, HR + 0.16]])
      put(box(0.035, h, 0.035, black, x, y0 + h / 2, z));
    // Jardim de seixos brancos sob o lance 2 e o patamar, com cica e planta alta
    const PZ0 = 46.34, PZ1 = 49.48, PX0 = B0 + 0.06, PX1 = B1 - 0.02;
    put(box(PX1 - PX0, 0.1, 0.03, black, (PX0 + PX1) / 2, 0.05, PZ0));
    put(box(PX1 - PX0, 0.1, 0.03, black, (PX0 + PX1) / 2, 0.05, PZ1));
    put(box(0.03, 0.1, PZ1 - PZ0, black, PX0, 0.05, (PZ0 + PZ1) / 2));
    put(box(PX1 - PX0 - 0.03, 0.07, PZ1 - PZ0 - 0.03, pebble, (PX0 + PX1) / 2, 0.035, (PZ0 + PZ1) / 2, nc));
    for (let i = 0; i < 14; i++) { const s = sph(0.035 + rnd() * 0.03, i % 3 ? pebble : mass, PX0 + 0.08 + rnd() * (PX1 - PX0 - 0.16), 0.07, PZ0 + 0.1 + rnd() * (PZ1 - PZ0 - 0.2)); s.scale.y = 0.55; put(s); }
    place(cycas(0.45, 0.5, 4), (PX0 + PX1) / 2, 48.85);
    place(bigPlant(1.75, 0.26, 7), (PX0 + PX1) / 2, 47.05);
  }

  // =====================================================================
  // SALA DA FAMÍLIA (x 0,09–3,92 · z 46,38–49,56)
  // =====================================================================
  {
    // Sofá na parede x = 0 (de frente para a TV), com manta e almofadas
    const S = G();
    S.add(box(1.8, 0.26, 0.8, sage, 0, 0.28, 0));
    S.add(box(1.8, 0.44, 0.17, sage, 0, 0.62, -0.315));
    for (const sx of [-1, 1]) S.add(box(0.14, 0.22, 0.8, sage, sx * 0.83, 0.52, 0));
    for (const sx of [-1, 1]) S.add(box(0.74, 0.1, 0.58, cream, sx * 0.38, 0.46, 0.08));
    S.add(rot(box(0.36, 0.34, 0.1, blush, -0.5, 0.66, -0.17), -0.15, 0.2));
    S.add(rot(box(0.34, 0.32, 0.1, cream, 0.5, 0.66, -0.17), -0.15, -0.2));
    S.add(rot(box(0.6, 0.02, 0.5, blush, 0.45, 0.52, 0.08), 0, 0.1));
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) S.add(cyl(0.016, 0.012, 0.15, woodLt, sx * 0.82, 0.075, sz * 0.33, 6));
    place(S, 0.58, 48.42, Math.PI / 2);

    // Poltrona de amamentação (balanço) + pufe, voltada para a TV
    const P = G();
    P.add(cyl(0.3, 0.32, 0.03, woodLt, 0, 0.015, 0, 20));
    P.add(cyl(0.05, 0.06, 0.2, woodLt, 0, 0.13, 0, 10));
    P.add(box(0.7, 0.2, 0.66, cream, 0, 0.36, 0.02));
    P.add(rot(box(0.7, 0.7, 0.16, cream, 0, 0.78, -0.27), -0.14));
    for (const sx of [-1, 1]) { const a = cyl(0.09, 0.09, 0.66, cream, sx * 0.33, 0.54, 0.02, 12); a.rotation.x = Math.PI / 2; P.add(a); }
    P.add(box(0.52, 0.08, 0.5, sage, 0, 0.5, 0.05));
    P.add(rot(box(0.4, 0.3, 0.09, blush, 0, 0.72, -0.16), -0.15));
    place(P, 2.15, 46.98, 0.72);
    const pf = cyl(0.2, 0.2, 0.34, sage, 2.64, 0.17, 47.5, 18); put(pf);
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
      const cx = 2.92, cz = 49.22;
      put(box(0.96, 0.86, 0.5, whiteF, cx, 0.45, cz));
      for (let i = 0; i < 3; i++) { put(box(0.9, 0.24, 0.012, woodLt, cx, 0.2 + i * 0.27, cz - 0.255)); put(box(0.14, 0.015, 0.02, M.chrome, cx, 0.27 + i * 0.27, cz - 0.268)); }
      put(box(0.96, 0.03, 0.52, woodLt, cx, 0.895, cz));
      put(box(0.74, 0.06, 0.46, sage, cx - 0.08, 0.94, cz));
      for (const sx of [-1, 1]) put(box(0.05, 0.1, 0.46, sage, cx - 0.08 + sx * 0.36, 0.96, cz));
      put(box(0.16, 0.12, 0.2, wicker, cx + 0.38, 0.97, cz));
      for (let i = 0; i < 3; i++) put(box(0.13, 0.03, 0.15, whiteF, cx + 0.38, 1.02 + i * 0.032, cz));
      put(box(0.12, 0.06, 0.08, toys[4], cx + 0.39, 1.14, cz + 0.02));
    }
    // Cortinas leves (laterais da janela x 0,6–3,2) e varão
    put(cyl(0.012, 0.012, 3.5, black, 1.9, 2.35, 49.5, 8)).rotation.z = Math.PI / 2;
    for (const x of [0.36, 3.44]) put(box(0.32, 2.2, 0.03, sheer, x, 1.2, 49.52, nc));
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
    [[47.9, 0.42, toys[2]], [48.45, 0.5, blush], [49.0, 0.42, toys[1]]].forEach(([z, s, c]) => {
      put(box(0.025, s, s, woodLt, 0.1, 1.55, z)); put(box(0.012, s - 0.08, s - 0.08, c, 0.115, 1.55, z, nc));
    });
    put(box(1.1, 0.03, 0.2, woodLt, 2.1, 1.55, 46.48));
    for (let i = 0; i < 7; i++) put(box(0.03, 0.2 - (i % 3) * 0.02, 0.15, toys[i % 6], 1.7 + i * 0.045, 1.66 - (i % 3) * 0.01, 46.49));
    put(sph(0.07, std({ color: 0xb48a60, roughness: 1 }), 2.35, 1.64, 46.49));
    put(cyl(0.06, 0.05, 0.12, ceramic, 2.55, 1.63, 46.49, 12));
    for (let i = 0; i < 3; i++) put(sph(0.06, frond2, 2.55 + (i - 1) * 0.04, 1.74, 46.49));
  }

  // =====================================================================
  // WC (x 0,09–1,82 · z 44,2–46,22) — porta na parede z = 46,3
  // =====================================================================
  {
    place(ctx.F.toilet(), 1.35, 44.39, 0);
    // cuba de apoio suspensa na parede x = 0 + espelho redondo
    put(box(0.34, 0.04, 0.46, quartz, 0.26, 0.82, 44.95));
    put(cyl(0.16, 0.12, 0.12, ceramic, 0.27, 0.9, 44.95, 18));
    put(cyl(0.012, 0.012, 0.2, black, 0.12, 0.94, 44.95, 8));
    put(box(0.12, 0.02, 0.02, black, 0.17, 1.03, 44.95));
    const mr = cyl(0.26, 0.26, 0.02, M.mirror, 0.105, 1.55, 44.95, 28); mr.rotation.z = Math.PI / 2; put(mr);
    const mf = cyl(0.275, 0.275, 0.015, black, 0.097, 1.55, 44.95, 28); mf.rotation.z = Math.PI / 2; put(mf);
    put(box(0.1, 0.28, 0.24, whiteF, 0.14, 1.35, 45.45));                 // dispenser de papel-toalha
    put(cyl(0.12, 0.1, 0.3, black, 0.3, 0.15, 45.6, 14));               // lixeira
    put(box(0.03, 0.1, 0.1, black, 1.805, 0.7, 44.55));                   // papeleira (parede x = 1,9)
    put(cyl(0.05, 0.05, 0.09, paper, 1.75, 0.66, 44.55, 12)).rotation.x = Math.PI / 2;
    put(box(1.7, 1.2, 0.012, tileWall, 0.96, 0.6, 44.082, nc));          // revestimento atrás do vaso
    // painel grafite atrás da cuba (destaca o espelho redondo), toalheiro e secador de mãos
    put(box(0.012, 2.1, 1.0, std({ color: 0x2e2f33, roughness: 0.5 }), 0.093, 1.05, 44.95, nc));
    const tr = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.008, 6, 20), black); tr.rotation.y = Math.PI / 2; tr.position.set(0.12, 1.12, 45.8); put(tr);
    put(box(0.02, 0.26, 0.14, std({ color: 0xbfc4b8, roughness: 1 }), 0.125, 0.98, 45.8, nc));
    put(box(0.12, 0.24, 0.26, black, 1.76, 1.2, 45.7));
    put(box(0.02, 0.03, 0.18, M.chrome, 1.695, 1.07, 45.7));
    // vaso com planta pequena sobre a cuba
    put(cyl(0.045, 0.035, 0.09, ceramic, 0.2, 0.885, 45.12, 10));
    for (let i = 0; i < 3; i++) put(sph(0.045, frond2, 0.2 + (i - 1) * 0.025, 0.97 + (i % 2) * 0.02, 45.12));
  }

  // =====================================================================
  // WC PCD (x 1,98–3,92 · z 44,08–46,22) — porta na parede x = 4,0 (z 44,4–45,3)
  // =====================================================================
  {
    place(ctx.F.toilet(), 2.45, 45.88, Math.PI);
    // barras de apoio: lateral (parede x = 1,9), de fundo (z = 46,3) e vertical
    const XS = 1.975 + 0.05, ZB = 46.225 - 0.05;
    put(bar(XS, 0.76, 45.2, XS, 0.76, 46.05, 0.017, grabBar));
    for (const z of [45.2, 46.05]) put(bar(1.975, 0.76, z, XS, 0.76, z, 0.015, grabBar));
    put(bar(XS, 0.9, 45.1, XS, 1.6, 45.1, 0.017, grabBar));
    for (const y of [0.9, 1.6]) put(bar(1.975, y, 45.1, XS, y, 45.1, 0.015, grabBar));
    put(bar(2.1, 0.9, ZB, 2.9, 0.9, ZB, 0.017, grabBar));
    for (const x of [2.1, 2.9]) put(bar(x, 0.9, 46.225, x, 0.9, ZB, 0.015, grabBar));
    // lavatório suspenso (sem gabinete) na parede z = 44,0 com barras em U e espelho inclinado
    const LX = 2.55, LZ = 44.3;
    put(box(0.52, 0.14, 0.42, ceramic, LX, 0.74, LZ));
    put(cyl(0.012, 0.012, 0.18, M.chrome, LX, 0.88, LZ - 0.14, 8));
    put(box(0.02, 0.02, 0.12, M.chrome, LX, 0.96, LZ - 0.09));
    for (const sx of [-1, 1]) {
      put(bar(LX + sx * 0.36, 0.78, 44.08, LX + sx * 0.36, 0.78, 44.6, 0.016, grabBar));
    }
    put(bar(LX - 0.36, 0.78, 44.6, LX + 0.36, 0.78, 44.6, 0.016, grabBar));
    const mir = box(0.5, 0.8, 0.02, M.mirror, LX, 1.45, 44.13); mir.rotation.x = 0.08; put(mir);
    put(box(0.54, 0.84, 0.012, black, LX, 1.45, 44.088));
    // alarme de emergência (cordão), lixeira e papeleira
    put(box(0.1, 0.1, 0.03, alarm, 2.0, 0.45, 45.6).rotateY(Math.PI / 2));
    put(box(0.025, 0.4, 0.02, alarm, 2.02, 0.22, 45.62));
    put(cyl(0.12, 0.1, 0.3, black, 3.7, 0.15, 46.0, 14));
    put(box(0.12, 0.12, 0.03, black, 2.02, 0.95, 45.55).rotateY(Math.PI / 2));
    put(box(1.95, 1.2, 0.012, tileWall, 2.95, 0.6, 46.218, nc));        // revestimento atrás do vaso
    put(box(0.12, 0.24, 0.26, black, 3.84, 1.1, 45.75));                  // secador de mãos (parede x = 4,0)
    put(box(0.02, 0.03, 0.18, M.chrome, 3.775, 0.97, 45.75));
    // símbolo de acessibilidade na parede ao lado do lavatório
    put(box(0.2, 0.2, 0.01, std({ color: 0x1f5fae, roughness: 0.5 }), 3.3, 1.5, 44.082, nc));
  }
}
