function roomAlaDireita(ctx) {
  // ---------------------------------------------------------------------------
  // ALA DIREITA (x 16,05–20,1 · z 11,0–49,5): corredor da entrada lateral,
  // circulação, sala de mídia, voluntariado, circ./depósito/área técnica,
  // WC masculino, hall dos banheiros e WC feminino.
  // REFERÊNCIA MÁXIMA = vídeos do cliente: v4 (mídia: placas acústicas grafite,
  // bancada preta no visor, road case turquesa, cadeiras azul/preto e plásticas),
  // v2 (voluntariado: cortina, sofás cinza, letreiro "FAÇAM TUDO…", poltronas
  // capitonê terracota, parede de marmorato com split (do cartão), prateleiras, buffet
  // grafite + frigobar; depósito com estantes pretas e caixas organizadoras),
  // v3 (banheiros: porcelanato cinza até 1,3 m e marrom imperador acima, bancada
  // branca com cubas de apoio, espelhos com moldura de LED fria, bebedouro inox,
  // entrada com faixa azul-escura e pictograma), v1/v5 (corredores: fundo em
  // marmorato, placa vermelha "SAÍDA DE EMERGÊNCIA").
  // Pisos, rodapés, portas e caixilhos são do cartão. Nada de luzes.
  // Faces internas das paredes: x 16,125 (templo) · 17,025/17,175 · 18,825/18,975
  // · 20,013 (muro, com revestimento) · z 19,075 · 23,225/23,375 · 27,925/28,075
  // · 33,825/33,975 · 35,825/35,975 · 36,925/37,075 · 40,725/40,875 ·
  // 44,225/44,375 · 49,413. Pilares do templo (lado claro até x 16,25) em
  // z 12,4 · 18,3 · 23,2 · 28,0 · 33,7 · 39,3 · 44,0 (±0,2).
  // ---------------------------------------------------------------------------
  const { THREE, box, cyl, sph, place, add, std, rnd, M } = ctx;
  const PI = Math.PI, HPI = PI / 2;
  const G = () => new THREE.Group();
  const nc = { cast: false };

  // ---- materiais (ctx.std com as mesmas opções → mesmo material → merge) ----
  const woodL   = std({ color: 0xcfa97c, roughness: 0.7 });                 // madeira clara
  const woodM   = std({ color: 0xa87c52, roughness: 0.72 });                // madeira média (pés, molduras)
  const black   = std({ color: 0x18181b, roughness: 0.5, metalness: 0.2 }); // estrutura preta
  const blackGl = std({ color: 0x151517, roughness: 0.22 });                 // plástico preto brilhante
  const graph   = std({ color: 0x3a3b3f, roughness: 0.6 });                 // cinza grafite
  const graphL  = std({ color: 0x5b5d63, roughness: 0.7 });
  const hpl     = std({ color: 0x45474c, roughness: 0.45 });                // divisórias das cabines
  const white   = std({ color: 0xf1f0ec, roughness: 0.5 });
  const quartz  = std({ color: 0xf4f2ee, roughness: 0.25 });                // bancada de quartzo branco
  const china   = std({ color: 0xf7f7f5, roughness: 0.18 });                // louça sanitária
  const smoke   = std({ color: 0x1c2126, roughness: 0.08, metalness: 0.5 }); // vidro fumê/preto (portas das cabines)
  const inox    = std({ color: 0xc4c9cd, roughness: 0.3, metalness: 0.75 }); // aço inox escovado
  const benchTop = std({ color: 0x1d1d20, roughness: 0.32 });               // tampo preto da bancada da mídia
  const blueSeat = std({ color: 0x27406e, roughness: 0.85 });               // tecido azul das cadeiras de operador
  const turq    = std({ color: 0x1fa3c2, roughness: 0.35, metalness: 0.2 }); // road case azul-turquesa
  const padBlue = std({ color: 0x2c4fa0, roughness: 0.8 });
  const terraV  = std({ color: 0xb4531e, roughness: 0.82 });                // veludo terracota (poltronas)
  const terraD  = std({ color: 0x7a3413, roughness: 0.9 });                 // botões do capitonê
  const sofaG   = std({ color: 0x9e9e9b, roughness: 0.97 });                // sofá cinza
  const sofaG2  = std({ color: 0xaaaaa7, roughness: 0.97 });
  sofaG.userData.noShare = true; sofaG2.userData.noShare = true;                // o merge não troca o cinza do sofá por outro tom
  const pilDk   = std({ color: 0x46474b, roughness: 0.97 });                // almofada cinza-escuro
  const curtain = std({ color: 0xc9c8c4, roughness: 1 });                   // cortina cinza-claro
  const slate   = std({ color: 0x4b525c, roughness: 0.6 });                 // buffet cinza-grafite (azulado)
  const shelfG  = std({ color: 0x5d636b, roughness: 0.55 });                // prateleiras flutuantes
  const gold    = std({ color: 0xc9a24f, roughness: 0.3, metalness: 0.85 }); // puxadores dourados
  const redCup  = std({ color: 0xc62222, roughness: 0.4 });
  const greenGl = std({ color: 0x4d7a52, roughness: 0.15, transparent: true, opacity: 0.75 });
  const clearGl = std({ color: 0xe6eef2, roughness: 0.08, transparent: true, opacity: 0.35 });
  const clearBx = std({ color: 0xdfe6ea, roughness: 0.2, transparent: true, opacity: 0.42 }); // caixa organizadora transparente
  const lidG    = std({ color: 0x7c8087, roughness: 0.5 });
  const redExt  = std({ color: 0xc4201b, roughness: 0.35, metalness: 0.1 });
  const pvc     = std({ color: 0xe9e9e4, roughness: 0.6 });
  const copper  = std({ color: 0xb8733f, roughness: 0.35, metalness: 0.7 });
  const potBlk  = std({ color: 0x1c1c1e, roughness: 0.55 });
  const frond   = std({ color: 0x2f5a2a, roughness: 0.9 });
  const frond2  = std({ color: 0x3d6e34, roughness: 0.9 });
  const trunk   = std({ color: 0x5b4632, roughness: 1 });
  const ledG    = std({ color: 0x0f2a18, emissive: 0x22c55e, emissiveIntensity: 1.2 });
  const ledR    = std({ color: 0x3a0a0a, emissive: 0xff3030, emissiveIntensity: 1.2 });
  const ledB    = std({ color: 0x0a1a3a, emissive: 0x3aa0ff, emissiveIntensity: 1.2 });
  const ledA    = std({ color: 0x3a2a0a, emissive: 0xffb040, emissiveIntensity: 1.2 });
  const lampW   = std({ color: 0xf4f4f0, roughness: 0.3 });                 // luminária de emergência / placas
  // moldura de LED fria dos espelhos (v3): acende com a luz dos banheiros
  const ledCold = ctx.bindEmissive('banheiros', std({ color: 0xe8f7ff, emissive: 0xbfeaff, emissiveIntensity: 1, roughness: 0.4 }), 1.4, { min: 0.12 });
  // plafon quadrado dos corredores: acende com a circulação
  const plafMat = ctx.bindEmissive('circulacao', std({ color: 0xf7f5ef, emissive: 0xfff4e0, emissiveIntensity: 1, roughness: 0.4 }), 1.1, { min: 0.05 });
  const bins    = [graphL, std({ color: 0x2f5f8b, roughness: 0.6 }), std({ color: 0xc98a3c, roughness: 0.85 }), std({ color: 0x3f7d3a, roughness: 0.7 }), redCup, white];

  // ---- utilidades ------------------------------------------------------------
  const rod = (r, len, mat, x, y, z, axis, seg = 8) => {
    const m = cyl(r, r, len, mat, x, y, z, seg);
    if (axis === 'x') m.rotation.z = HPI; else if (axis === 'z') m.rotation.x = HPI;
    return add(m);
  };
  // Material com CanvasTexture desenhada num espaço virtual W×100 (W = 100·aspecto)
  const texMat = (aspect, draw, glow = 0, size = 256) => {
    const W = 100 * aspect, Hv = 100;
    const tex = ctx.makeTex(size, (g, s) => { g.save(); g.scale(s / W, s / Hv); draw(g, W, Hv); g.restore(); });
    return glow ? new THREE.MeshStandardMaterial({ color: 0x050505, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: glow, roughness: 0.35 })
      : new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
  };
  const text = (g, str, x, y, px, color, weight = 'bold', align = 'center') => {
    g.font = `${weight} ${px}px Arial, Helvetica, sans-serif`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(str, x, y);
  };
  // Revestimento de 12 mm numa parede: axis 'z' = parede ao longo de Z (face em f, sala para o lado dir),
  // 'x' = parede ao longo de X. (a, b) = trecho ao longo da parede, (y0, y1) = alturas.
  const clad = (axis, f, dir, a, b, y0, y1, mat, t = 0.012) => {
    if (b - a < 0.01 || y1 - y0 < 0.01) return null;
    const c = f + dir * t / 2, ym = (y0 + y1) / 2;
    return add(axis === 'z' ? box(t, y1 - y0, b - a, mat, c, ym, (a + b) / 2, nc) : box(b - a, y1 - y0, t, mat, (a + b) / 2, ym, c, nc));
  };
  // meia parede dos banheiros: porcelanato cinza até 1,3 m e marrom imperador (ou marmorato) acima
  const WAIN = 1.3, YB = 0.095, YT = 2.985;
  const wetWall = (axis, f, dir, a, b, upper) => { clad(axis, f, dir, a, b, YB, WAIN, M.porcelanatoCinza); clad(axis, f, dir, a, b, WAIN, YT, upper); };
  // Cica em vaso preto (como na fachada)
  const cica = (x, z, reach = 0.45, s = 1) => {
    const g = G();
    g.add(cyl(0.19, 0.15, 0.46, potBlk, 0, 0.23, 0, 16));
    g.add(cyl(0.175, 0.175, 0.02, M.soil, 0, 0.45, 0, 14));
    g.add(cyl(0.06, 0.085, 0.24, trunk, 0, 0.56, 0, 8));
    const n = 10, a0 = rnd() * PI;
    for (let i = 0; i < n; i++) {
      const a = a0 + (i / n) * PI * 2 + rnd() * 0.25, t = 0.6 + rnd() * 0.45, L = reach * (0.85 + rnd() * 0.25);
      const f = box(0.1, 0.012, L, i % 2 ? frond : frond2, 0, 0, 0);
      f.rotation.order = 'YXZ'; f.rotation.set(-t, a, 0);
      f.position.set(Math.cos(t) * Math.sin(a) * L / 2, 0.66 + Math.sin(t) * L / 2, Math.cos(t) * Math.cos(a) * L / 2);
      g.add(f);
    }
    g.scale.setScalar(s);
    return place(g, x, z, 0);
  };
  // Placa do extintor (fundo vermelho, pictograma branco)
  const extSign = texMat(0.77, (g, W, Hh) => {
    g.fillStyle = '#c4201b'; g.fillRect(0, 0, W, Hh);
    g.strokeStyle = '#f7f1e6'; g.lineWidth = 2.2; g.strokeRect(4, 4, W - 8, Hh - 8);
    g.fillStyle = '#f7f1e6'; const cx = W / 2;
    g.beginPath(); g.moveTo(cx - 11, 30); g.lineTo(cx + 11, 30); g.lineTo(cx + 11, 72); g.quadraticCurveTo(cx + 11, 78, cx + 5, 78);
    g.lineTo(cx - 5, 78); g.quadraticCurveTo(cx - 11, 78, cx - 11, 72); g.closePath(); g.fill();
    g.fillRect(cx - 4, 20, 8, 10); g.fillRect(cx - 12, 16, 22, 5);
    g.lineWidth = 3; g.beginPath(); g.moveTo(cx + 9, 18); g.quadraticCurveTo(cx + 24, 22, cx + 20, 46); g.stroke();
    text(g, 'EXTINTOR', cx, 89, 10, '#f7f1e6');
  });
  const extintor = (xf, z, dir) => {
    const xc = xf + dir * 0.09;
    add(box(0.01, 0.5, 0.2, black, xf + dir * 0.005, 0.62, z));
    add(cyl(0.075, 0.075, 0.46, redExt, xc, 0.55, z, 14));
    add(cyl(0.076, 0.076, 0.05, black, xc, 0.36, z, 14));
    add(cyl(0.03, 0.04, 0.08, black, xc, 0.82, z, 10));
    add(box(0.12, 0.02, 0.03, black, xf + dir * 0.1, 0.87, z));
    add(cyl(0.01, 0.01, 0.34, black, xc + dir * 0.03, 0.66, z - 0.085, 6));
    add(box(0.006, 0.26, 0.2, extSign, xf + dir * 0.004, 1.42, z, nc));
  };
  const plaque = (axis, c, t, y, w, h, mat) => add(axis === 'z' ? box(0.01, h, w, mat, c, y, t, nc) : box(w, h, 0.01, mat, t, y, c, nc));
  const doorSign = (label) => texMat(2.2, (g, W, Hh) => {
    g.fillStyle = '#141416'; g.fillRect(0, 0, W, Hh);
    g.fillStyle = '#c98a3c'; g.fillRect(12, 70, 40, 4);
    text(g, label, 12, 42, 24, '#f3efe6', 'bold', 'left');
    ctx.logo.draw(g, W - 40, 26, 30, { layout: 'mark', color: '#8d8f95' });
  }, 0, 512);
  // Placa verde de SAÍDA (bloco autônomo, sempre acesa). arrow: -1 esquerda, 0 nenhuma, 1 direita
  const exitMat = (arrow) => texMat(2.6, (g, W, Hh) => {
    g.fillStyle = '#0f7a3a'; g.fillRect(0, 0, W, Hh);
    g.fillStyle = '#f2fff4';
    const mx = arrow < 0 ? W - 48 : 28;
    g.save(); if (arrow < 0) { g.translate(2 * mx + 8, 0); g.scale(-1, 1); }
    g.beginPath(); g.arc(mx + 10, 24, 7, 0, PI * 2); g.fill();
    g.lineWidth = 7; g.lineCap = 'round'; g.strokeStyle = '#f2fff4';
    g.beginPath(); g.moveTo(mx + 6, 36); g.lineTo(mx - 2, 62); g.moveTo(mx + 6, 36); g.lineTo(mx + 20, 48); g.moveTo(mx - 2, 62); g.lineTo(mx - 12, 84);
    g.moveTo(mx - 2, 62); g.lineTo(mx + 14, 72); g.lineTo(mx + 16, 86); g.moveTo(mx + 5, 40); g.lineTo(mx - 10, 46); g.stroke();
    g.restore();
    text(g, 'SAÍDA', W / 2 + (arrow < 0 ? -12 : 14), 52, 34, '#f2fff4');
    if (arrow) {
      const ax = arrow < 0 ? 18 : W - 18, s = arrow;
      g.beginPath(); g.moveTo(ax + s * 14, 50); g.lineTo(ax - s * 4, 30); g.lineTo(ax - s * 4, 70); g.closePath(); g.fill();
    }
  }, 0.9);
  const exitSign = (axis, f, t, y, dir, arrow = 0) => {
    const m = exitMat(arrow);
    if (axis === 'x') { add(box(0.36, 0.15, 0.03, lampW, t, y, f + dir * 0.015)); add(box(0.33, 0.125, 0.004, m, t, y, f + dir * 0.032, nc)); }
    else { add(box(0.03, 0.15, 0.36, lampW, f + dir * 0.015, y, t)); add(box(0.004, 0.125, 0.33, m, f + dir * 0.032, y, t, nc)); }
  };
  const emerg = (axis, f, t, y, dir) => {
    const g = G();
    g.add(box(0.32, 0.075, 0.06, lampW, 0, 0, 0.03));
    for (const sx of [-0.1, 0.1]) { const h = cyl(0.028, 0.034, 0.05, lampW, sx, -0.02, 0.075, 12); h.rotation.x = HPI + 0.5; g.add(h); }
    g.add(box(0.03, 0.01, 0.004, ledG, 0, 0.012, 0.062, nc));
    if (axis === 'x') place(g, t, f, dir > 0 ? 0 : PI, y); else place(g, f, t, dir > 0 ? HPI : -HPI, y);
  };
  // Plano virado para +z (logo/brilho) → posiciona e gira em torno de Y
  const at = (m, x, y, z, ry = 0) => { m.position.set(x, y, z); m.rotation.y = ry; return add(m); };
  // Pictograma dos banheiros (placa curva de alumínio sobre a porta, v3): fem = mulher, senão homem
  const picto = (fem) => texMat(1.6, (g, W, Hh) => {
    g.fillStyle = '#e9ebed'; g.fillRect(0, 0, W, Hh);
    g.fillStyle = '#2a2b2f'; const cx = W / 2;
    g.beginPath(); g.arc(cx, 18, 8, 0, PI * 2); g.fill();
    if (fem) { g.beginPath(); g.moveTo(cx, 28); g.lineTo(cx + 15, 62); g.lineTo(cx - 15, 62); g.closePath(); g.fill(); g.fillRect(cx - 7, 62, 5, 14); g.fillRect(cx + 2, 62, 5, 14); }
    else { g.fillRect(cx - 11, 29, 22, 30); g.fillRect(cx - 10, 58, 8, 18); g.fillRect(cx + 2, 58, 8, 18); }
    text(g, fem ? 'MULHER' : 'HOMEM', cx, 88, 11, '#2a2b2f');
  });
  const doorPicto = (axis, f, t, dir, fem) => {
    const m = picto(fem);
    if (axis === 'z') { add(box(0.03, 0.2, 0.34, inox, f + dir * 0.015, 2.36, t)); add(box(0.004, 0.18, 0.3, m, f + dir * 0.032, 2.36, t, nc)); }
    else { add(box(0.34, 0.2, 0.03, inox, t, 2.36, f + dir * 0.015)); add(box(0.3, 0.18, 0.004, m, t, 2.36, f + dir * 0.032, nc)); }
  };
  // Espelho com moldura de LED fria. face = parede; ry = rotação que leva +z para a sala
  const ledMirror = (x, y, z, w, h, ry) => {
    const g = G();
    g.add(box(w, h, 0.012, M.mirror, 0, 0, 0.006, nc));
    const s = 0.018;
    g.add(box(w + s * 2, s, 0.012, ledCold, 0, h / 2 + s / 2, 0.012, nc)); g.add(box(w + s * 2, s, 0.012, ledCold, 0, -h / 2 - s / 2, 0.012, nc));
    g.add(box(s, h, 0.012, ledCold, -w / 2 - s / 2, 0, 0.012, nc)); g.add(box(s, h, 0.012, ledCold, w / 2 + s / 2, 0, 0.012, nc));
    place(g, x, z, ry, y);
    const halo = ctx.glowPlane(w + 0.34, h + 0.34, 'banheiros', { color: 0xcdefff, base: 0.5, day: 0.25, tex: 'frame' });
    const n = new THREE.Vector3(Math.sin(ry), 0, Math.cos(ry));
    at(halo, x + n.x * 0.02, y, z + n.z * 0.02, ry);
  };
  // Cuba de apoio retangular branca com torneira de mesa cromada (frente = +z local)
  const vessel = () => {
    const g = G();
    g.add(box(0.46, 0.12, 0.34, china, 0, 0.06, 0));
    g.add(box(0.4, 0.004, 0.28, std({ color: 0xdfe3e6, roughness: 0.2 }), 0, 0.119, 0, nc));
    g.add(cyl(0.014, 0.018, 0.3, M.chrome, 0, 0.15, -0.23, 10));
    g.add(box(0.022, 0.022, 0.15, M.chrome, 0, 0.3, -0.165));
    return g;
  };

  // =====================================================================
  // CORREDOR DA ENTRADA LATERAL (x 16,05–17,1 · z 11,0–19,0)
  // Portas em x=17,1: Gilvan z 12,9–13,8 · Adm. z 14,4–15,3; porta PM01 (do pátio) em x=16,05, z 11,25–12,15 (v1.5.1).
  // =====================================================================
  // v1.5.1: a porta lateral (PM01) saiu da parede z = 11 e foi para a parede x = 16,05 (z 11,25–12,15) — capacho e placa foram junto
  add(box(0.62, 0.012, 0.8, std({ color: 0x1a1a1c, roughness: 0.92 }), 16.47, 0.008, 11.7, nc));   // capacho grafite com a marca
  { const m = ctx.logo.mesh(0.44, 0, { layout: 'mark', color: '#bdb6a8', roughness: 1, cast: false }); m.rotation.set(-HPI, 0, -HPI); m.position.set(16.47, 0.0155, 11.7); add(m); }
  // placa vermelha "SAÍDA DE EMERGÊNCIA" sobre a porta lateral (v5)
  const sosMat = texMat(1.45, (g, W, Hh) => {
    g.fillStyle = '#c21d1d'; g.fillRect(0, 0, W, Hh);
    g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.strokeRect(4, 4, W - 8, Hh - 8);
    g.fillStyle = '#ffffff'; g.fillRect(12, 12, W - 24, 34);
    text(g, 'SAÍDA', W / 2, 30, 26, '#c21d1d', '900');
    text(g, 'DE', W / 2, 60, 15, '#ffffff');
    text(g, 'EMERGÊNCIA', W / 2, 80, 15, '#ffffff');
  }, 0, 512);
  add(box(0.008, 0.25, 0.36, sosMat, 16.132, 2.5, 11.7, nc));
  emerg('z', 17.025, 16.25, 2.45, -1);
  extintor(17.025, 12.1, -1);
  plaque('z', 17.018, 12.62, 1.6, 0.3, 0.13, doorSign('SALA GILVAN'));
  plaque('z', 17.018, 14.17, 1.6, 0.3, 0.13, doorSign('ADMINISTRATIVO'));
  // plafons quadrados embutidos (forro): só a placa de LED
  for (const z of [12.9, 16.3]) add(box(0.32, 0.02, 0.32, plafMat, 16.58, 2.975, z, nc));
  // cartazes emoldurados na parede do templo (entre os pilares de z 12,4 e 18,3)
  const poster1 = texMat(0.72, (g, W, Hh) => {
    const gr = g.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, '#1b1b1f'); gr.addColorStop(1, '#3a2a1f');
    g.fillStyle = gr; g.fillRect(0, 0, W, Hh);
    ctx.logo.draw(g, W / 2 - 9, 8, 18, { layout: 'mark', color: '#f4f5f7' });
    g.fillStyle = '#c98a3c'; g.fillRect(W / 2 - 10, 33, 20, 1.2);
    text(g, 'SÉRIE', W / 2, 42, 6, '#cfcfd4');
    text(g, 'RAÍZES', W / 2, 55, 15, '#f4f5f7', '900');
    g.strokeStyle = '#c98a3c'; g.lineWidth = 1.2;
    for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(W / 2, 64); g.quadraticCurveTo(W / 2 + i * 4, 72, W / 2 + i * 8, 82 - Math.abs(i)); g.stroke(); }
    text(g, 'DOMINGOS · 9H E 18H', W / 2, 92, 4.6, '#cfcfd4');
  }, 0, 512);
  const poster2 = texMat(0.72, (g, W, Hh) => {
    g.fillStyle = '#c98a3c'; g.fillRect(0, 0, W, Hh);
    g.fillStyle = '#141416'; g.fillRect(0, 58, W, Hh - 58);
    text(g, 'BASE', 6, 22, 17, '#141416', '900', 'left');
    text(g, 'JOVEM', 6, 40, 17, '#141416', '900', 'left');
    text(g, 'SEXTAS · 20H', 6, 52, 6, '#141416', 'bold', 'left');
    ctx.logo.draw(g, W / 2 - 16, 64, 32, { layout: 'wide', color: '#f4f5f7' });
    text(g, '802 SUL · PALMAS', W / 2, 90, 4.4, '#8d8f95');
  }, 0, 512);
  [[13.9, poster1], [15.6, poster2]].forEach(([z, pm]) => {
    add(box(0.03, 0.9, 0.66, black, 16.14, 1.55, z));
    add(box(0.006, 0.84, 0.6, white, 16.157, 1.55, z, nc));
    add(box(0.004, 0.76, 0.54, pm, 16.161, 1.55, z, nc));
  });

  // =====================================================================
  // CIRCULAÇÃO (x 16,05–20,1 · z 19,0–23,3) + corredor x 18,9–20,1 · z 23,3–28,0
  // Fundo em marmorato: parede x = 20,1 (circulação + corredor da mídia) e a parede
  // da mídia (z 23,3) vista de quem entra pelo corredor lateral.
  // =====================================================================
  clad('z', 20.013, -1, 19.075, 27.925, 0.075, 2.985, M.marmorato);
  clad('x', 23.225, -1, 16.26, 17.8, 0.075, 2.985, M.marmorato);
  for (const [x, z] of [[18.1, 20.4], [18.1, 22.1], [19.5, 26.6]]) add(box(0.32, 0.02, 0.32, plafMat, x, 2.975, z, nc));
  // Aparador + quadro de avisos na parede z=19
  {
    const g = G();
    g.add(box(1.2, 0.04, 0.4, woodL, 0, 0.8, 0));
    g.add(box(1.14, 0.2, 0.36, black, 0, 0.68, 0));
    for (const sx of [-0.3, 0.3]) g.add(box(0.2, 0.012, 0.01, woodL, sx, 0.68, 0.181, nc));
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.03, 0.58, 0.03, black, sx * 0.55, 0.29, sz * 0.16));
    g.add(cyl(0.07, 0.09, 0.22, potBlk, -0.38, 0.93, 0, 12));
    g.add(sph(0.14, frond2, -0.38, 1.12, 0)); g.add(sph(0.1, frond, -0.32, 1.2, 0.04));
    g.add(box(0.21, 0.02, 0.15, white, 0.05, 0.83, 0.05));
    g.add(box(0.17, 0.05, 0.24, black, 0.38, 0.845, 0.0));                                   // Bíblia
    place(g, 18.9, 19.37, 0);
    add(box(1.24, 0.84, 0.03, woodM, 18.9, 1.62, 19.09));                                    // quadro de avisos
    add(box(1.16, 0.76, 0.012, std({ color: 0xb98e5e, roughness: 1 }), 18.9, 1.62, 19.111, nc));
    const papers = [white, std({ color: 0xf3d77a, roughness: 1 }), std({ color: 0xa9cbe6, roughness: 1 })];
    for (let i = 0; i < 6; i++) {
      const p = box(0.2, 0.25, 0.004, papers[i % 3], 18.5 + (i % 3) * 0.4 + rnd() * 0.04, 1.8 - Math.floor(i / 3) * 0.36, 19.119, nc);
      p.rotation.z = (rnd() - 0.5) * 0.12; add(p);
    }
  }
  // Banco ripado na parede de marmorato (sala de espera)
  {
    const g = G();
    for (let i = 0; i < 5; i++) g.add(box(0.066, 0.035, 1.6, woodL, -0.16 + i * 0.08, 0.45, 0));
    for (const sz of [-0.62, 0.62]) {
      g.add(box(0.4, 0.03, 0.05, black, 0, 0.418, sz));
      g.add(box(0.035, 0.42, 0.035, black, -0.17, 0.21, sz)); g.add(box(0.035, 0.42, 0.035, black, 0.17, 0.21, sz));
    }
    place(g, 19.72, 20.85, 0);
  }
  // quadros no marmorato, acima do banco
  [[20.3, 0xcfa97c], [21.35, 0x8d8f95]].forEach(([z, c]) => {
    add(box(0.03, 0.62, 0.46, black, 19.985, 1.55, z));
    add(box(0.006, 0.56, 0.4, white, 19.967, 1.55, z, nc));
    add(box(0.006, 0.36, 0.22, std({ color: c, roughness: 0.9 }), 19.963, 1.57, z, nc));
  });
  exitSign('x', 19.075, 17.55, 2.45, 1, -1);                                                  // SAÍDA ← (corredor lateral)
  emerg('x', 23.213, 16.75, 2.5, -1);
  // Corredor da mídia: TV com a agenda da semana (parede x=20,1) e quadros (parede x=18,9)
  const agenda = texMat(1.75, (g, W, Hh) => {
    const gr = g.createLinearGradient(0, 0, W, Hh); gr.addColorStop(0, '#15151a'); gr.addColorStop(1, '#2a2230');
    g.fillStyle = gr; g.fillRect(0, 0, W, Hh);
    g.fillStyle = '#c98a3c'; g.fillRect(10, 12, 4, 16);
    text(g, 'AGENDA DA SEMANA', 20, 20, 11, '#f3efe6', 'bold', 'left');
    const rows = [['DOM', '9h e 18h', 'Cultos de celebração'], ['QUA', '20h', 'Culto de ensino'], ['SEX', '20h', 'Base Jovem'], ['SÁB', '16h', 'Ensaio do louvor']];
    rows.forEach(([d, h, t], i) => {
      const y = 42 + i * 15;
      g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(10, y - 6, W - 20, 12);
      text(g, d, 14, y, 8, '#c98a3c', 'bold', 'left'); text(g, h, 36, y, 7.5, '#f3efe6', 'bold', 'left'); text(g, t, 78, y, 7.5, '#cfcfd4', 'normal', 'left');
    });
    ctx.logo.draw(g, W - 40, 84, 28, { layout: 'wide', color: '#8d8f95' });
  }, 0.8, 512);
  ctx.bindEmissive('circulacao', agenda, 0.8, { min: 0.12 });
  add(box(0.04, 0.6, 1.04, black, 19.978, 1.6, 25.1));
  add(box(0.004, 0.55, 0.98, agenda, 19.956, 1.6, 25.1, nc));
  [[24.3, 0xb3643f, 0xc98a3c], [26.6, 0xcfa97c, 0xb3643f]].forEach(([z, a, b]) => {
    add(box(0.03, 0.72, 0.52, black, 18.99, 1.6, z));
    add(box(0.006, 0.64, 0.44, white, 19.007, 1.6, z, nc));
    add(box(0.008, 0.46, 0.12, std({ color: a, roughness: 0.9 }), 19.012, 1.6, z - 0.1, nc));
    add(box(0.008, 0.2, 0.2, std({ color: b, roughness: 0.9 }), 19.014, 1.72, z + 0.1, nc));
  });

  // =====================================================================
  // MÍDIA (x 16,05–18,9 · z 23,3–28,0) — v4. Piso laminado do cartão.
  // Placas acústicas grafite em todas as paredes; bancada preta longa sob o visor
  // J12 (de frente para o palco); cadeiras de operador azul/preto; cadeiras
  // plásticas pretas na parede oposta; gabinete com impressora; câmera (o split é do cartão).
  // Porta x 17,9–18,8 (z=23,3) → giro x 17,9–18,8 · z 23,4–24,3 livre.
  // =====================================================================
  const AC = M.acustico, AY0 = 0.08, AY1 = 2.98;
  clad('z', 16.125, 1, 23.41, 27.79, 2.2, AY1, AC, 0.04);                                   // acima do visor
  clad('z', 16.125, 1, 23.41, 27.79, AY0, 1.05, AC, 0.04);                                  // abaixo do peitoril
  clad('x', 23.375, 1, 16.26, 17.8, AY0, AY1, AC, 0.04);                                    // parede da porta
  clad('x', 23.375, 1, 17.8, 18.785, 2.3, AY1, AC, 0.04);                                   // acima da porta
  clad('z', 18.825, -1, 23.415, 27.885, AY0, AY1, AC, 0.04);                                // parede oposta ao visor
  clad('x', 27.925, -1, 16.26, 18.785, AY0, AY1, AC, 0.04);                                 // fundo (split + câmera)
  add(box(0.04, 2.9, 0.085, AC, 16.27, 1.53, 27.8425, nc));                                 // pilar revestido
  // Telas (CanvasTexture): multiview, transmissão, slides e DAW
  const stage = (g, x, y, w, h, kind) => {
    const gr = g.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, '#120b24'); gr.addColorStop(1, '#3b1f5e');
    g.fillStyle = gr; g.fillRect(x, y, w, h);
    if (kind === 'plateia') {
      g.fillStyle = '#3a2a1a'; g.fillRect(x, y, w, h);
      g.fillStyle = '#1a1210';
      for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) { g.beginPath(); g.arc(x + (c + 0.5 + (r % 2) * 0.4) * w / 9, y + h * (0.35 + r * 0.18), w * 0.035 + r * 0.6, 0, PI * 2); g.fill(); }
      g.fillStyle = '#5a3fd0'; g.fillRect(x + w * 0.35, y + h * 0.05, w * 0.3, h * 0.18);
      return;
    }
    if (kind === 'close') {
      g.fillStyle = '#e8c9a8'; g.beginPath(); g.arc(x + w / 2, y + h * 0.42, h * 0.2, 0, PI * 2); g.fill();
      g.fillStyle = '#18181b'; g.beginPath(); g.ellipse(x + w / 2, y + h * 1.02, w * 0.3, h * 0.42, 0, 0, PI * 2); g.fill();
      g.fillStyle = '#2a1f1a'; g.beginPath(); g.arc(x + w / 2, y + h * 0.34, h * 0.2, PI, 0); g.fill();
      return;
    }
    g.fillStyle = '#6d4fe0'; g.fillRect(x + w * 0.28, y + h * 0.1, w * 0.44, h * 0.34);
    g.fillStyle = 'rgba(255,220,160,0.25)';
    for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(x + w * (0.2 + i * 0.2), y); g.lineTo(x + w * (0.12 + i * 0.2), y + h * 0.7); g.lineTo(x + w * (0.28 + i * 0.2), y + h * 0.7); g.fill(); }
    g.fillStyle = '#0c0c0e'; g.fillRect(x, y + h * 0.72, w, h * 0.28);
    g.fillStyle = '#050506';
    const n = kind === 'wide' ? 5 : 1;
    for (let i = 0; i < n; i++) { const px = x + w * (n === 1 ? 0.5 : 0.18 + i * 0.16); g.fillRect(px - w * 0.02, y + h * 0.5, w * 0.04, h * 0.23); g.beginPath(); g.arc(px, y + h * 0.47, w * 0.022, 0, PI * 2); g.fill(); }
  };
  const camMat = texMat(1.7778, (g, W, Hh) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, Hh);
    const kinds = ['wide', 'close', 'plateia', 'pulpito'], w = W / 2, h = Hh / 2;
    kinds.forEach((k, i) => {
      const x = (i % 2) * w, y = Math.floor(i / 2) * h;
      stage(g, x + 1, y + 1, w - 2, h - 2, k);
      g.lineWidth = 2; g.strokeStyle = i === 0 ? '#ff2a2a' : i === 1 ? '#22c55e' : '#333'; g.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(x + 4, y + h - 12, 26, 8);
      text(g, 'CAM ' + (i + 1), x + 17, y + h - 8, 6, '#fff');
    });
  }, 0.85, 512);
  const liveMat = texMat(1.7778, (g, W, Hh) => {
    stage(g, 0, 0, W, Hh, 'wide');
    g.fillStyle = '#e02424'; g.fillRect(6, 6, 30, 11); text(g, '● AO VIVO', 21, 11.5, 6.5, '#fff');
    g.fillStyle = 'rgba(20,20,24,0.85)'; g.fillRect(10, 74, 110, 14); g.fillStyle = '#c98a3c'; g.fillRect(10, 74, 3, 14);
    text(g, 'Culto de Celebração · Base Church', 17, 81, 6.5, '#fff', 'bold', 'left');
    ctx.logo.draw(g, W - 20, 5, 13, { layout: 'mark', color: '#ffffff' });
  }, 0.85, 512);
  const waveMat = texMat(1.7778, (g, W, Hh) => {
    g.fillStyle = '#16181c'; g.fillRect(0, 0, W, Hh);
    g.fillStyle = '#23262c'; g.fillRect(0, 0, W, 8);
    const cols = ['#e0703a', '#3aa0ff', '#22c55e', '#c98a3c', '#b06cff', '#e04a6a'];
    for (let t = 0; t < 6; t++) {
      const y0 = 10 + t * 14.5, mid = y0 + 6.5;
      g.fillStyle = '#20232a'; g.fillRect(0, y0, W, 13.5);
      g.fillStyle = cols[t]; g.fillRect(0, y0, 18, 13.5);
      g.strokeStyle = cols[t]; g.lineWidth = 0.6; g.beginPath();
      for (let x = 20; x < W - 2; x += 0.8) { const a = (Math.sin(x * 0.07 + t) * 0.5 + 0.6) * (0.4 + 0.6 * Math.abs(Math.sin(x * 0.9 + t * 3))) * 5.5; g.moveTo(x, mid - a); g.lineTo(x, mid + a); }
      g.stroke();
    }
    g.fillStyle = '#fff'; g.fillRect(W * 0.62, 8, 0.8, Hh - 8);
  }, 0.85, 512);
  const slidesMat = texMat(1.7778, (g, W, Hh) => {
    const gr = g.createRadialGradient(W / 2, Hh / 2, 5, W / 2, Hh / 2, W * 0.7); gr.addColorStop(0, '#2a1d3f'); gr.addColorStop(1, '#07060b');
    g.fillStyle = gr; g.fillRect(0, 0, W, Hh);
    text(g, 'Grande é o Senhor', W / 2, 40, 13, '#ffffff');
    text(g, 'e mui digno de louvor', W / 2, 58, 13, '#ffffff');
    ctx.logo.draw(g, W / 2 - 13, 78, 26, { layout: 'wide', color: '#c98a3c' });
  }, 0.85, 512);
  for (const m of [camMat, liveMat, slidesMat]) ctx.bindEmissive('telao', m, 0.85, { min: 0.1 });
  ctx.bindEmissive('som', waveMat, 0.85, { min: 0.1 });
  // Monitor em pedestal, tela para +z local
  const monitor = (w, h, mat, lift = 0.1) => {
    const g = G();
    g.add(box(0.22, 0.012, 0.16, black, 0, 0.006, 0));
    g.add(box(0.05, lift + h * 0.4, 0.03, black, 0, (lift + h * 0.4) / 2, -0.035));
    g.add(box(w + 0.02, h + 0.02, 0.025, black, 0, lift + h / 2, -0.005));
    g.add(box(w, h, 0.004, mat, 0, lift + h / 2, 0.0095, nc));
    return g;
  };
  // ---- bancada preta longa sob o visor (x 16,2–16,9 · z 23,45–27,75, tampo y 0,78) ----
  const DT = 0.78;
  add(box(0.7, 0.035, 4.3, benchTop, 16.55, DT - 0.0175, 25.6));
  add(box(0.02, 0.1, 4.3, black, 16.89, DT - 0.085, 25.6));                                 // testeira
  for (const z of [23.47, 25.6, 27.73]) add(box(0.64, DT - 0.035, 0.03, black, 16.53, (DT - 0.035) / 2, z));
  add(box(0.02, 0.5, 4.3, black, 16.215, 0.5, 25.6));                                        // fundo (esconde os cabos)
  for (const z of [24.25, 26.95]) {                                                          // gabinetes dos PCs no chão
    add(box(0.42, 0.44, 0.2, black, 16.47, 0.22, z));
    add(box(0.004, 0.012, 0.012, ledB, 16.682, 0.4, z + 0.06, nc));
  }
  // monitores (costas para o vidro, telas para os operadores)
  place(monitor(0.56, 0.33, camMat), 16.4, 23.95, HPI, DT);
  place(monitor(0.56, 0.33, liveMat), 16.4, 24.62, HPI, DT);
  place(monitor(0.5, 0.3, slidesMat), 16.4, 25.4, HPI, DT);
  place(monitor(0.5, 0.3, waveMat), 16.4, 27.3, HPI, DT);
  // teclados, mouses e mouse pads azuis
  const kb = (x, z, len = 0.44) => { add(box(0.15, 0.022, len, black, x, DT + 0.011, z)); add(box(0.12, 0.004, len - 0.04, graph, x, DT + 0.024, z, nc)); };
  kb(16.72, 24.28); kb(16.72, 25.4); kb(16.68, 26.95, 0.46);
  for (const [z, pad] of [[24.72, true], [25.8, true], [27.3, false]]) {
    if (pad) add(box(0.26, 0.003, 0.3, padBlue, 16.74, DT + 0.0015, z, nc));
    const ms = sph(0.03, black, 16.74, DT + 0.013, z); ms.scale.set(1.5, 0.5, 1); add(ms);
  }
  // road case azul-turquesa (fechado, sobre a bancada)
  {
    const x = 16.52, z = 26.2, w = 0.44, h = 0.26, L = 0.64, y = DT + h / 2;
    add(box(w, h, L, turq, x, y, z));
    add(box(w + 0.006, 0.018, L + 0.006, M.chrome, x, y + 0.03, z));                         // perfil da tampa
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const sy of [-1, 1]) add(box(0.05, 0.05, 0.05, M.chrome, x + sx * (w / 2 - 0.02), y + sy * (h / 2 - 0.02), z + sz * (L / 2 - 0.02))); // cantoneiras
    for (const sz of [-0.16, 0.16]) add(box(0.012, 0.05, 0.07, M.chrome, x + w / 2 + 0.006, y + 0.03, z + sz));           // fechos
    const lbl = texMat(2.2, (g, W, Hh) => { g.fillStyle = '#1b8fac'; g.fillRect(0, 0, W, Hh); text(g, 'MÍDIA · BASE', W / 2, 52, 30, '#e8f7fb', '900'); });
    add(box(0.004, 0.07, 0.3, lbl, x + w / 2 + 0.003, y - 0.04, z, nc));
  }
  // difusor de varetas (vidro + 4 varetas de madeira), perto do vidro
  {
    const x = 16.33, z = 26.72;
    add(cyl(0.035, 0.04, 0.1, clearGl, x, DT + 0.05, z, 12));
    add(cyl(0.032, 0.036, 0.05, std({ color: 0xe0c070, roughness: 0.3, transparent: true, opacity: 0.6 }), x, DT + 0.026, z, 12));
    for (let i = 0; i < 4; i++) {
      const a = i * HPI + 0.4, st = cyl(0.004, 0.004, 0.3, woodL, x + Math.cos(a) * 0.04, DT + 0.22, z + Math.sin(a) * 0.04, 5);
      st.rotation.set(Math.sin(a) * 0.18, 0, -Math.cos(a) * 0.18); add(st);
    }
  }
  // switcher/processador de vídeo preto com botões (painel frontal para o operador)
  {
    add(box(0.3, 0.07, 0.44, black, 16.72, DT + 0.035, 27.5));
    const pnl = texMat(6.3, (g, W, Hh) => {
      g.fillStyle = '#141416'; g.fillRect(0, 0, W, Hh);
      g.fillStyle = '#2f5d7a'; g.fillRect(40, 20, 90, 55);                                  // visor
      for (let i = 0; i < 10; i++) { g.fillStyle = i === 2 ? '#ff5050' : i === 6 ? '#58e07a' : '#d9dce0'; g.fillRect(170 + (i % 5) * 46, i < 5 ? 14 : 56, 34, 30); }
      g.fillStyle = '#9a9ca2'; g.beginPath(); g.arc(W - 70, 50, 26, 0, PI * 2); g.fill();
      g.fillStyle = '#ff3030'; g.fillRect(W - 24, 40, 10, 20);
    }, 0.6, 512);
    add(box(0.004, 0.066, 0.43, pnl, 16.872, DT + 0.035, 27.5, nc));
  }
  add(box(0.13, 0.05, 0.09, black, 16.4, DT + 0.025, 26.85));                                // conversor / carregadores
  add(box(0.004, 0.006, 0.02, ledG, 16.466, DT + 0.035, 26.85, nc));
  // cadeiras de operador: estrutura preta, assento e encosto azuis (frente = +z local)
  const opChair = () => {
    const g = G();
    for (let i = 0; i < 5; i++) { const a = (i / 5) * PI * 2; const sp = box(0.3, 0.03, 0.04, black, Math.cos(a) * 0.15, 0.05, Math.sin(a) * 0.15); sp.rotation.y = -a; g.add(sp); g.add(sph(0.028, black, Math.cos(a) * 0.29, 0.03, Math.sin(a) * 0.29)); }
    g.add(cyl(0.025, 0.025, 0.36, M.chrome, 0, 0.25, 0, 8));
    g.add(box(0.46, 0.04, 0.44, black, 0, 0.44, 0));
    g.add(box(0.46, 0.07, 0.44, blueSeat, 0, 0.495, 0.01));
    g.add(box(0.05, 0.36, 0.04, black, 0, 0.62, -0.23));
    const bk = box(0.44, 0.44, 0.06, blueSeat, 0, 0.84, -0.25); bk.rotation.x = -0.1; g.add(bk);
    for (const sx of [-1, 1]) { g.add(box(0.03, 0.2, 0.03, black, sx * 0.24, 0.56, -0.02)); g.add(box(0.06, 0.03, 0.26, black, sx * 0.24, 0.67, 0.0)); }
    return g;
  };
  for (const [z, r] of [[24.3, 0.12], [25.5, -0.08], [26.95, 0.18]]) place(opChair(), 17.32, z, -HPI + r);
  // cadeiras plásticas pretas (monobloco) na parede oposta, viradas para a sala
  const plasticChair = () => {
    const g = G();
    g.add(box(0.44, 0.035, 0.42, blackGl, 0, 0.44, 0.01));
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = cyl(0.02, 0.016, 0.44, blackGl, sx * 0.19, 0.22, sz * 0.18, 8); l.rotation.set(sz * 0.08, 0, -sx * 0.08); g.add(l); }
    for (const sx of [-1, 1]) { const u = box(0.035, 0.44, 0.03, blackGl, sx * 0.19, 0.67, -0.2); u.rotation.x = -0.14; g.add(u); }
    const tr = box(0.42, 0.06, 0.035, blackGl, 0, 0.89, -0.235); tr.rotation.x = -0.14; g.add(tr);
    for (const sx of [-0.07, 0.07]) { const s = box(0.04, 0.36, 0.02, blackGl, sx, 0.66, -0.205); s.rotation.x = -0.14; g.add(s); }
    return g;
  };
  for (const z of [24.75, 25.35, 25.95]) place(plasticChair(), 18.5, z, -HPI);
  // gabinete preto com impressora, spray e papéis
  add(box(0.42, 0.78, 0.6, black, 18.55, 0.39, 26.65));
  add(box(0.004, 0.7, 0.004, graph, 18.338, 0.4, 26.65, nc));
  add(box(0.02, 0.12, 0.02, M.chrome, 18.33, 0.55, 26.57));
  add(box(0.36, 0.17, 0.4, graph, 18.56, 0.865, 26.56));                                    // impressora
  add(box(0.3, 0.012, 0.3, white, 18.56, 0.956, 26.56, nc));
  add(box(0.2, 0.004, 0.28, white, 18.4, 0.84, 26.56, nc));
  add(cyl(0.03, 0.03, 0.2, std({ color: 0xe8e4d8, roughness: 0.4 }), 18.62, 0.88, 26.87, 10)); // spray
  add(cyl(0.031, 0.031, 0.04, std({ color: 0x35a043, roughness: 0.4 }), 18.62, 1.0, 26.87, 10));
  // caixa de som/case no chão junto ao fundo
  add(box(0.36, 0.5, 0.3, graph, 17.95, 0.27, 27.7));
  add(box(0.3, 0.4, 0.006, std({ color: 0x2a2c30, roughness: 1 }), 17.95, 0.3, 27.547, nc));
  for (const sx of [-0.14, 0.14]) add(cyl(0.02, 0.02, 0.03, black, 17.95 + sx, 0.015, 27.62, 8));
  // receptor sem fio preto com LEDs na parede (v4_01)
  add(box(0.04, 0.26, 0.07, black, 18.765, 1.35, 24.5));
  add(box(0.004, 0.18, 0.012, ledR, 18.743, 1.35, 24.5, nc));
  // câmera de segurança no canto (o split branco do fundo — x 17,1–18,0, y 2,42–2,70 — é do cartão: `ac_midia`)
  const secCam = (x, y, z, ry) => {
    const g = G();
    g.add(box(0.08, 0.04, 0.03, white, 0, 0, -0.015));
    g.add(box(0.025, 0.08, 0.025, white, 0, -0.04, 0.02));
    const b = cyl(0.035, 0.04, 0.14, white, 0, -0.09, 0.07, 12); b.rotation.x = HPI + 0.35; g.add(b);
    const ln = cyl(0.028, 0.028, 0.004, black, 0, -0.114, 0.137, 12); ln.rotation.x = HPI + 0.35; g.add(ln);
    place(g, x, z, ry, y);
  };
  secCam(18.65, 2.88, 27.885, PI);
  emerg('x', 23.415, 16.95, 2.5, 1);

  // =====================================================================
  // VOLUNTARIADO (x 16,05–20,1 · z 28,0–33,9) — v2.
  // Portas: z=28 x 19,0–19,9 · z=33,9 x 16,2–17,0 (giros livres); janela p/ o templo
  // z 29,9–31,9 coberta pela cortina. Parede x=20,1 em marmorato.
  // =====================================================================
  // cortina cinza-claro do piso ao teto ao longo da parede do templo (pregas em zigue-zague)
  {
    const z0 = 28.24, z1 = 32.94, x = 16.295, step = 0.088, Hc = 2.92;
    add(box(0.05, 0.035, z1 - z0 + 0.06, graph, x, 2.965, (z0 + z1) / 2));                   // trilho
    let i = 0;
    for (let z = z0 + step / 2; z < z1; z += step, i++) { const p = box(0.1, Hc, 0.012, curtain, x, 0.02 + Hc / 2, z); p.rotation.y = HPI + (i % 2 ? 0.52 : -0.52); add(p); }
  }
  // sofás cinza (2, em fila junto à cortina), frente para +x
  const pilGeo = texMat(1, (g, W, Hh) => {
    g.fillStyle = '#f4f3ee'; g.fillRect(0, 0, W, Hh);
    const cols = ['#f2c230', '#1d1d1f', '#f4f3ee', '#f2c230', '#8e8f92', '#1d1d1f'];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      const x = c * 25, y = r * 25, k = (r * 3 + c * 5) % cols.length;
      g.fillStyle = cols[k]; g.beginPath();
      if ((r + c) % 2) { g.moveTo(x, y); g.lineTo(x + 25, y); g.lineTo(x, y + 25); } else { g.moveTo(x + 25, y); g.lineTo(x + 25, y + 25); g.lineTo(x, y + 25); }
      g.closePath(); g.fill();
      g.fillStyle = cols[(k + 2) % cols.length]; g.beginPath(); g.moveTo(x + 12.5, y + 5); g.lineTo(x + 20, y + 20); g.lineTo(x + 5, y + 20); g.closePath(); g.fill();
    }
  });
  const sofa = (L, pillows) => {
    const g = G(), D = 0.9;
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.05, 0.06, 0.05, woodM, sx * (L / 2 - 0.08), 0.03, sz * (D / 2 - 0.08)));
    g.add(box(L, 0.28, D, sofaG, 0, 0.2, 0));
    g.add(box(L, 0.38, 0.16, sofaG, 0, 0.53, -D / 2 + 0.08));                              // encosto (estrutura)
    for (const sx of [-1, 1]) g.add(box(0.2, 0.3, D, sofaG, sx * (L / 2 - 0.1), 0.49, 0));  // braços
    const cw = (L - 0.44) / 2;
    for (const sx of [-1, 1]) {
      g.add(box(cw - 0.02, 0.15, D - 0.2, sofaG2, sx * cw / 2, 0.415, 0.08));                // assentos
      const bc = box(cw - 0.03, 0.42, 0.18, sofaG2, sx * cw / 2, 0.66, -D / 2 + 0.22); bc.rotation.x = -0.14; g.add(bc); // almofadas do encosto
    }
    pillows.forEach(([px, mat, ry]) => { const p = box(0.42, 0.42, 0.12, mat, px, 0.68, -D / 2 + 0.36); p.rotation.set(-0.3, ry, 0); g.add(p); });
    return g;
  };
  place(sofa(2.05, [[-0.72, pilDk, 0.1], [0.62, pilGeo, -0.12]]), 16.81, 29.4, HPI);
  place(sofa(2.05, [[-0.7, pilGeo, 0.12], [-0.3, pilDk, -0.05], [0.7, pilDk, 0.1]]), 16.81, 31.6, HPI);
  // letreiro 3D preto na parede z=28: "FAÇAM TUDO / COMO PARA / O SENHOR" (camadas empilhadas = letra caixa)
  {
    const Wm = 1.62, Hm = 0.86, A = Wm / Hm;
    const tex = ctx.makeTex(1024, (g, s) => {
      g.clearRect(0, 0, s, s); g.save(); g.scale(s / (100 * A), s / 100);
      const lines = ['FAÇAM  TUDO', 'COMO  PARA', 'O  SENHOR'];
      g.fillStyle = '#ffffff'; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
      g.font = '900 30px "Arial Black", "Arial Narrow", Arial, Helvetica, sans-serif';
      const sx = (100 * A - 4) / g.measureText(lines[0]).width;
      g.strokeStyle = '#ffffff'; g.lineWidth = 1.6; g.lineJoin = 'round';
      lines.forEach((t, i) => { g.save(); g.translate(2, 27 + i * 33.5); g.scale(sx, 1); g.fillText(t, 0, 0); g.strokeText(t, 0, 0); g.restore(); });
      g.restore();
    });
    const geo = new THREE.PlaneGeometry(Wm, Hm);
    const side = new THREE.MeshStandardMaterial({ map: tex, color: 0x3a3a3d, alphaTest: 0.5, roughness: 0.6 });
    const face = new THREE.MeshStandardMaterial({ map: tex, color: 0x161618, alphaTest: 0.5, roughness: 0.45 });
    [[0.004, side], [0.011, side], [0.018, side], [0.025, face]].forEach(([dz, m]) => {
      const p = new THREE.Mesh(geo, m); p.position.set(17.66, 2.08, 28.075 + dz); p.receiveShadow = true; add(p);
    });
  }
  // 2 poltronas capitonê terracota com pés de madeira, sob o letreiro (frente = +z)
  const armchair = () => {
    const g = G();
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = cyl(0.022, 0.014, 0.22, woodM, sx * 0.27, 0.11, sz * 0.24, 8); l.rotation.set(sz * 0.12, 0, -sx * 0.12); g.add(l); }
    g.add(box(0.66, 0.2, 0.6, terraV, 0, 0.32, 0));
    g.add(box(0.5, 0.09, 0.5, terraV, 0, 0.465, 0.03));
    const bk = box(0.66, 0.56, 0.13, terraV, 0, 0.7, -0.24); bk.rotation.x = -0.08; g.add(bk);
    for (const sx of [-1, 1]) g.add(box(0.09, 0.2, 0.58, terraV, sx * 0.285, 0.52, 0.0));
    for (const [bx, by] of [[-0.16, 0.6], [0, 0.6], [0.16, 0.6], [-0.08, 0.78], [0.08, 0.78]]) g.add(sph(0.014, terraD, bx, by, -0.168 - (by - 0.6) * 0.08));
    return g;
  };
  place(armchair(), 17.62, 28.52, 0.04);
  place(armchair(), 18.34, 28.52, -0.04);
  secCam(16.4, 2.88, 28.075, 0.6);
  // parede x = 20,1 em marmorato (face da sala); o split no alto (z 29,05–29,95, y 2,43–2,73) é do cartão: `ac_voluntariado`
  clad('z', 20.013, -1, 28.075, 33.825, 0.075, 2.985, M.marmorato);
  // 2 prateleiras flutuantes cinza com quadros e planta pendente
  for (const y of [1.72, 2.2]) add(box(0.22, 0.04, 1.55, shelfG, 19.9, y, 31.25));
  const art = [std({ color: 0xe8e2d4, roughness: 0.9 }), std({ color: 0xd9cdb4, roughness: 0.9 })];
  [[30.7, 0.3, 0.24, 0], [31.0, 0.34, 0.26, 1], [31.55, 0.28, 0.24, 0]].forEach(([z, h, w, k]) => {
    const f = box(0.025, h, w, woodL, 19.93, 1.74 + h / 2, z); f.rotation.z = 0.08; add(f);
    const a = box(0.004, h - 0.05, w - 0.05, art[k], 19.915, 1.74 + h / 2, z, nc); a.rotation.z = 0.08; add(a);
  });
  add(box(0.004, 0.14, 0.1, black, 19.9, 1.8, 31.0, nc)).rotation.z = 0.08;                // silhueta no quadro
  add(cyl(0.035, 0.03, 0.09, black, 19.88, 1.785, 31.85, 10));                               // porta-lápis
  add(box(0.08, 0.07, 0.07, woodM, 19.9, 1.775, 32.0));                                       // casinha decorativa
  {
    add(cyl(0.07, 0.06, 0.12, white, 19.88, 2.28, 31.92, 12));                                // planta pendente
    for (let i = 0; i < 14; i++) {
      const t = i / 13, lf = sph(0.038 - t * 0.012, i % 2 ? frond : frond2, 19.83 - rnd() * 0.07, 2.3 - t * 0.62, 31.92 + (rnd() - 0.5) * 0.2 + t * 0.07);
      lf.scale.set(0.5, 1.3, 1); add(lf);
    }
  }
  // buffet cinza-grafite (2 módulos sobre rodízios) com tampo de madeira e puxadores dourados
  const buffet = (z0, z1) => {
    const L = z1 - z0, zc = (z0 + z1) / 2, x0 = 19.5, D = 0.46, xc = x0 + D / 2;
    add(box(D, 0.8, L, slate, xc, 0.46, zc));
    add(box(D + 0.03, 0.03, L + 0.02, woodL, xc - 0.015, 0.875, zc));
    add(box(0.004, 0.006, L - 0.04, black, x0 - 0.002, 0.68, zc, nc));                        // junta das gavetas
    const nd = 3, dw = L / nd;
    for (let i = 0; i < nd; i++) {
      const zd = z0 + dw * (i + 0.5);
      if (i) add(box(0.004, 0.76, 0.006, black, x0 - 0.002, 0.46, z0 + dw * i, nc));
      add(sph(0.017, gold, x0 - 0.012, 0.78, zd));
      add(sph(0.017, gold, x0 - 0.012, 0.58, zd + (i === 1 ? -0.1 : 0.1)));
    }
    for (const sz of [-1, 1]) for (const sx of [0.08, D - 0.08]) add(cyl(0.025, 0.025, 0.04, black, x0 + sx, 0.03, zc + sz * (L / 2 - 0.08), 10)).rotation.x = HPI;
  };
  buffet(29.1, 30.65); buffet(30.65, 32.2);
  // sobre o buffet: jarra, taças verdes, copos vermelhos, bandeja com café, caixa de lenços
  const TY = 0.89;
  add(cyl(0.06, 0.055, 0.22, clearGl, 19.74, TY + 0.11, 29.95, 14));
  for (const dz of [0.18, 0.3]) { add(cyl(0.035, 0.02, 0.07, greenGl, 19.72, TY + 0.13, 29.95 + dz, 12)); add(cyl(0.006, 0.006, 0.08, greenGl, 19.72, TY + 0.05, 29.95 + dz, 6)); add(cyl(0.03, 0.03, 0.008, greenGl, 19.72, TY + 0.004, 29.95 + dz, 12)); }
  for (const dz of [0, 0.1]) add(cyl(0.035, 0.03, 0.1, redCup, 19.66, TY + 0.05, 30.95 + dz, 12));
  add(box(0.3, 0.02, 0.42, black, 19.74, TY + 0.01, 31.45));                                 // bandeja
  add(cyl(0.055, 0.055, 0.26, black, 19.78, TY + 0.15, 31.35, 12));                           // garrafa térmica
  add(box(0.1, 0.12, 0.1, std({ color: 0x5a3a24, roughness: 0.6 }), 19.7, TY + 0.08, 31.55)); // pote de café
  add(box(0.16, 0.1, 0.24, white, 19.74, TY + 0.05, 32.0));                                   // caixa de lenços
  // frigobar inox ao lado e poltrona preta no canto
  add(box(0.48, 0.85, 0.5, inox, 19.73, 0.43, 32.53));
  add(box(0.004, 0.006, 0.46, black, 19.488, 0.7, 32.53, nc));
  add(box(0.02, 0.3, 0.02, black, 19.475, 0.5, 32.35));
  {
    const g = G(), tub = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.34, 0.5, 20, 1, true, PI * 0.65, PI * 1.7), blackGl);
    tub.position.y = 0.6; tub.castShadow = true; tub.receiveShadow = true; g.add(tub);
    g.add(cyl(0.34, 0.33, 0.14, blackGl, 0, 0.42, 0, 20));
    for (let i = 0; i < 4; i++) { const a = i * HPI + PI / 4, l = cyl(0.012, 0.012, 0.36, black, Math.cos(a) * 0.24, 0.17, Math.sin(a) * 0.24, 6); l.rotation.set(Math.sin(a) * 0.2, 0, -Math.cos(a) * 0.2); g.add(l); }
    place(g, 19.36, 33.28, -2.2);
  }
  emerg('x', 33.825, 17.9, 2.5, -1);

  // =====================================================================
  // CIRC. (x 16,05–17,1 · z 33,9–37,0) — passagem: extintor e sinalização
  // =====================================================================
  extintor(17.025, 36.55, -1);
  const wcSign = texMat(3, (g, W, Hh) => {
    g.fillStyle = '#141416'; g.fillRect(0, 0, W, Hh);
    text(g, 'BANHEIROS', 20, 52, 34, '#f3efe6', 'bold', 'left');
    g.fillStyle = '#c98a3c'; g.beginPath(); g.moveTo(W - 44, 30); g.lineTo(W - 14, 50); g.lineTo(W - 44, 70); g.closePath(); g.fill(); g.fillRect(W - 70, 44, 28, 12);
  });
  plaque('z', 17.018, 36.1, 1.95, 0.42, 0.14, wcSign);

  // =====================================================================
  // DEPÓSITO (x 17,1–20,1 · z 33,9–35,9) — v2: estantes de aço preto com caixas
  // organizadoras (transparentes/cinza com tampa), caixa preta de parede, mesinha.
  // Porta em x=17,1 (z 34,6–35,4) → x 17,18–18,1 livre.
  // =====================================================================
  const rack = (x0, x1, z0, D, h, levels) => {
    const w = x1 - x0, xc = (x0 + x1) / 2, zc = z0 + D / 2;
    for (const sx of [x0 + 0.015, x1 - 0.015]) for (const sz of [z0 + 0.015, z0 + D - 0.015]) add(box(0.03, h, 0.03, black, sx, h / 2, sz));
    for (let i = 0; i < levels; i++) {
      const y = 0.08 + (i * (h - 0.12)) / (levels - 1);
      add(box(w, 0.02, D, black, xc, y, zc));
      if (i === levels - 1) { if (rnd() < 0.7) add(box(0.5, 0.26, D - 0.06, rnd() < 0.5 ? lidG : std({ color: 0xd8cdb4, roughness: 0.9 }), xc - 0.1, y + 0.14, zc)); continue; }
      let px = x0 + 0.04;
      const gap = (h - 0.12) / (levels - 1) - 0.05;
      while (px < x1 - 0.25) {
        const bw = Math.min(0.26 + rnd() * 0.18, x1 - 0.04 - px), bh = Math.min(gap - 0.02, 0.2 + rnd() * 0.12);
        if (bw < 0.2) break;
        const bxc = px + bw / 2, by = y + 0.01 + bh / 2;
        if (rnd() < 0.62) {
          add(box(bw, bh, D - 0.06, clearBx, bxc, by, zc, nc));                                 // caixa transparente
          add(box(bw * 0.8, bh * 0.6, D - 0.14, bins[Math.floor(rnd() * bins.length)], bxc, y + 0.01 + bh * 0.3, zc)); // conteúdo
          add(box(bw + 0.012, 0.022, D - 0.05, rnd() < 0.5 ? lidG : white, bxc, by + bh / 2 + 0.011, zc)); // tampa
        } else {
          add(box(bw, bh, D - 0.06, rnd() < 0.5 ? graph : lidG, bxc, by, zc));                  // caixa cinza
          add(box(bw + 0.012, 0.022, D - 0.05, graph, bxc, by + bh / 2 + 0.011, zc));
        }
        px += bw + 0.03;
      }
    }
  };
  rack(18.2, 19.08, 34.02, 0.45, 1.95, 5);
  rack(19.1, 19.98, 34.02, 0.45, 1.95, 5);
  add(box(0.06, 0.5, 0.36, black, 19.98, 1.55, 35.25));                                        // caixa preta de parede
  add(box(0.012, 0.06, 0.03, M.chrome, 19.947, 1.5, 35.1));
  {                                                                                            // mesinha preta de apoio
    add(box(0.42, 0.025, 0.34, black, 19.7, 0.74, 35.6));
    for (const sz of [-0.15, 0.15]) { add(box(0.4, 0.025, 0.025, black, 19.7, 0.06, 35.6 + sz)); add(box(0.025, 0.72, 0.025, black, 19.505, 0.37, 35.6 + sz)); add(box(0.025, 0.72, 0.025, black, 19.895, 0.37, 35.6 + sz)); }
  }
  // caixas organizadoras empilhadas no chão (transparentes)
  for (const [x, y, h, c] of [[18.55, 0.12, 0.24, 1], [18.55, 0.36, 0.2, 5], [19.05, 0.13, 0.26, 3]]) {
    add(box(0.46, h, 0.36, clearBx, x, y + 0.005, 35.6, nc));
    add(box(0.38, h * 0.6, 0.28, bins[c], x, y - h * 0.18, 35.6));
    add(box(0.47, 0.02, 0.37, white, x, y + h / 2 + 0.015, 35.6));
  }

  // =====================================================================
  // ÁREA TÉCNICA / SHAFT (x 17,1–20,1 · z 35,9–37,0): quadros e tubulações
  // =====================================================================
  add(box(0.55, 0.8, 0.12, std({ color: 0xc9ccd0, roughness: 0.5, metalness: 0.3 }), 17.75, 1.55, 36.04));
  add(box(0.12, 0.08, 0.004, std({ color: 0xf2c200, roughness: 0.6 }), 17.75, 1.8, 36.103, nc));
  add(box(0.5, 0.6, 0.25, black, 18.5, 1.7, 36.1));
  add(box(0.004, 0.012, 0.3, ledG, 18.5, 1.75, 36.227, nc));
  add(box(2.7, 0.06, 0.12, M.steel, 18.6, 2.72, 36.06));
  rod(0.018, 1.0, graphL, 17.75, 2.2, 36.04, 'y'); rod(0.018, 0.8, graphL, 18.5, 2.3, 36.1, 'y');
  for (const [x, z, r] of [[19.8, 36.7, 0.075], [19.58, 36.75, 0.05]]) rod(r, 2.96, pvc, x, 1.48, z, 'y', 14);
  for (const x of [19.35, 19.42]) rod(0.028, 2.9, black, x, 1.45, 36.8, 'y', 8);
  rod(0.02, 2.5, copper, 19.55, 1.3, 36.3, 'y');

  // =====================================================================
  // BANHEIROS — v3: porcelanato cinza até 1,3 m e marrom imperador (ou marmorato)
  // acima; bancadas de quartzo branco com cubas de apoio retangulares; espelhos com
  // moldura de LED fria; cabines com portas de vidro fumê e ferragens pretas.
  // =====================================================================
  // Cabines: faixa x xa–xb, parede do fundo em zw, frente em zf, n cabines.
  const cabins = (xa, xb, zw, zf, n, sides, cut = 0) => {
    const sg = Math.sign(zf - zw), w = (xb - xa) / n, PY0 = 0.12, PH = 1.95, py = PY0 + PH / 2;
    const zw2 = zw + sg * cut, len = Math.abs(zf - zw2), zc = (zf + zw2) / 2;
    for (let i = 0; i <= n; i++) {
      if ((i === 0 && !sides[0]) || (i === n && !sides[1])) continue;
      const x = xa + i * w;
      add(box(0.025, PH, len, hpl, x, py, zc));
      if (cut) add(box(0.025, 1.4, cut, hpl, x, PY0 + 0.7, zw + sg * cut / 2));
      add(box(0.03, 0.05, 0.03, black, x, 0.06, zf - sg * 0.02));                            // pé
    }
    const dw = Math.min(0.64, w - 0.16), pl = (w - dw) / 2;
    for (let i = 0; i < n; i++) {
      const x0 = xa + i * w, c = x0 + w / 2;
      add(box(pl - 0.008, PH, 0.025, smoke, x0 + pl / 2, py, zf));
      add(box(pl - 0.008, PH, 0.025, smoke, x0 + w - pl / 2, py, zf));
      add(box(dw - 0.008, PH - 0.06, 0.02, smoke, c, py + 0.02, zf));                         // porta de vidro fumê
      for (const hy of [0.4, 1.75]) add(box(0.05, 0.08, 0.034, black, c - dw / 2 + 0.03, hy, zf)); // dobradiças
      add(box(0.02, 0.2, 0.05, black, c + dw / 2 - 0.07, 1.0, zf));                           // puxador/tarjeta
      const t = new THREE.Group();
      t.add(box(0.36, 0.4, 0.2, china, 0, 0.2, -0.05)); t.add(box(0.38, 0.05, 0.5, china, 0, 0.42, 0.08)); t.add(box(0.36, 0.34, 0.14, white, 0, 0.62, -0.2));
      place(t, c, zw + sg * 0.3, sg > 0 ? 0 : PI);
      add(box(0.13, 0.12, 0.09, black, c + 0.3, 0.72, zw + sg * 0.05));                       // papeleira preta
    }
    add(box(xb - xa, 0.03, 0.04, black, (xa + xb) / 2, PY0 + PH + 0.015, zf));               // travessa superior
  };
  const urinal = (xf, z) => {
    add(box(0.1, 0.62, 0.34, china, xf - 0.05, 0.86, z));
    const bowl = cyl(0.16, 0.13, 0.52, china, xf - 0.17, 0.83, z, 16); bowl.scale.set(0.8, 1, 1); add(bowl);
    add(cyl(0.02, 0.02, 0.2, M.chrome, xf - 0.06, 1.27, z, 8));
  };

  // ---- WC MASCULINO (x 17,1–20,1 · z 37,0–40,8) — porta em z=40,8 (x 18,2–19,0) ----
  wetWall('z', 20.013, -1, 37.075, 40.725, M.marmoreMarrom);
  cabins(17.175, 19.45, 37.075, 38.45, 2, [false, true]);
  add(box(0.5, 0.04, 1.15, quartz, 19.75, 0.86, 37.72));                                     // bancada de quartzo
  add(box(0.02, 0.12, 1.15, quartz, 19.49, 0.8, 37.72));
  place(vessel(), 19.72, 37.72, -HPI, 0.88);
  ledMirror(19.995, 1.6, 37.72, 0.55, 0.8, -HPI);
  for (const z of [38.85, 39.55, 40.25]) urinal(20.0, z);
  for (const z of [39.2, 39.9]) add(box(0.42, 0.85, 0.02, smoke, 19.79, 1.0, z));
  { const g = G();                                                                             // secador de mãos
    g.add(box(0.28, 0.34, 0.2, inox, 0, 0, 0.1)); g.add(box(0.2, 0.02, 0.1, black, 0, -0.17, 0.12));
    place(g, 17.175, 39.4, HPI, 1.2); }
  add(cyl(0.14, 0.12, 0.45, inox, 17.45, 0.225, 40.45, 14));
  doorPicto('x', 40.887, 18.6, 1, false);

  // ---- HALL DOS BANHEIROS (x 16,05–20,1 · z 40,8–44,3 + faixa x 16,05–17,1 · z 37,0–40,8) ----
  wetWall('z', 20.013, -1, 40.875, 44.225, M.marmoreMarrom);                                 // parede do bebedouro
  wetWall('x', 44.225, -1, 17.25, 20.013, M.marmoreMarrom);                                  // parede da bancada (porta do WC fem. em x 16,25–17,15)
  doorPicto('x', 44.225, 16.7, -1, true);
  wetWall('x', 40.875, 1, 17.1, 18.1, M.marmorato);                                          // parede da porta do WC masc.
  wetWall('x', 40.875, 1, 19.1, 20.013, M.marmorato);
  clad('x', 40.875, 1, 18.1, 19.1, 2.3, YT, M.marmorato);
  wetWall('z', 16.125, 1, 37.0, 39.08, M.marmorato);                                         // parede do templo (pilar em z 39,3)
  wetWall('z', 16.125, 1, 39.52, 44.225, M.marmorato);                                        // parede do templo (sem porta desde a v1.4.5)
  wetWall('z', 17.025, -1, 37.0, 40.8, M.marmorato);                                         // faixa de circulação
  // bancada branca de quartzo com 3 cubas de apoio retangulares e espelhos com LED
  add(box(2.6, 0.04, 0.5, quartz, 18.66, 0.86, 43.96));
  add(box(2.6, 0.13, 0.02, quartz, 18.66, 0.775, 43.72));
  for (const x of [17.8, 18.66, 19.52]) { place(vessel(), x, 43.98, PI, 0.88); ledMirror(x, 1.62, 44.213, 0.56, 0.82, PI); }
  add(box(0.1, 0.34, 0.26, white, 19.945, 1.35, 43.35));                                       // papel-toalha
  // bebedouro industrial inox (4 torneiras, calha) + lixeiras inox com pedal + porta-copos
  {
    const g = G(), L = 1.2;                                                                    // frente = +z local
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(0.04, 0.1, 0.04, inox, sx * (L / 2 - 0.04), 0.05, sz * 0.15 - 0.05));
    g.add(box(L, 1.0, 0.38, inox, 0, 0.6, -0.05));
    g.add(box(L + 0.02, 0.03, 0.4, inox, 0, 1.115, -0.05));
    g.add(box(L - 0.06, 0.07, 0.2, inox, 0, 0.8, 0.24));                                      // calha
    g.add(box(L - 0.1, 0.004, 0.16, std({ color: 0x8a9096, roughness: 0.3, metalness: 0.6 }), 0, 0.834, 0.24, nc));
    for (let i = 0; i < 4; i++) { const tx = -0.42 + i * 0.28; g.add(box(0.03, 0.03, 0.08, M.chrome, tx, 0.95, 0.18)); g.add(cyl(0.012, 0.012, 0.05, M.chrome, tx, 0.93, 0.22, 8)); }
    g.add(box(0.16, 0.2, 0.004, white, -0.35, 0.6, 0.142, nc));                                // etiqueta
    for (let i = 0; i < 5; i++) g.add(box(0.28, 0.012, 0.004, graphL, 0.3, 0.45 + i * 0.03, 0.142, nc)); // grelha
    add(g); g.position.set(19.75, 0, 42.0); g.rotation.y = -HPI;
  }
  for (const z of [42.95, 43.3]) {
    add(cyl(0.13, 0.12, 0.5, inox, 19.82, 0.25, z, 16));
    add(cyl(0.132, 0.132, 0.03, black, 19.82, 0.515, z, 16));
    add(box(0.08, 0.02, 0.06, black, 19.66, 0.02, z));
  }
  add(box(0.08, 0.32, 0.1, black, 19.97, 1.32, 41.2));                                         // porta-copos
  add(cyl(0.035, 0.035, 0.18, white, 19.93, 1.4, 41.2, 10));
  emerg('x', 40.887, 17.55, 2.5, 1);
  // ---- WC FEMININO (x 16,05–20,1 · z 44,3–49,5) — sem antecâmara ----
  // Porta na parede z = 44,3 (x 16,25–17,15), vinda do hall dos banheiros → área de giro x 16,1–17,3 · z 44,3–45,3 livre.
  wetWall('z', 20.013, -1, 44.375, 49.413, M.marmoreMarrom);
  cabins(18.05, 20.013, 44.375, 45.85, 2, [true, false]);
  cabins(17.175, 20.013, 49.413, 47.75, 3, [false, false], 0.08);
  add(box(0.8, 0.3, 0.04, graph, 17.6, 0.8, 44.395));                                        // fraldário
  add(box(0.8, 0.1, 0.46, white, 17.6, 0.9, 44.645));
  add(box(0.7, 0.03, 0.38, std({ color: 0xc98a3c, roughness: 0.85 }), 17.6, 0.965, 44.65));
  add(box(0.5, 0.04, 1.6, quartz, 19.75, 0.86, 46.8));                                       // bancada de quartzo
  add(box(0.02, 0.12, 1.6, quartz, 19.49, 0.8, 46.8));
  for (const z of [46.4, 47.2]) { place(vessel(), 19.72, z, -HPI, 0.88); ledMirror(19.995, 1.62, z, 0.52, 0.8, -HPI); }
  { const g = G();                                                                             // vaso com flores na bancada
    g.add(cyl(0.05, 0.04, 0.14, white, 0, 0.07, 0, 12));
    for (const [dx, dz, dy] of [[0, 0, 0.26], [0.04, 0.02, 0.23], [-0.03, 0.03, 0.24]]) { g.add(cyl(0.004, 0.004, dy, frond, dx * 0.5, 0.14 + dy / 2 - 0.04, dz * 0.5, 5)); g.add(sph(0.028, dy > 0.25 ? redCup : white, dx, 0.12 + dy, dz)); }
    place(g, 19.86, 46.8, 0, 0.88); }
  add(cyl(0.12, 0.1, 0.4, inox, 19.8, 0.2, 45.98, 14));
  // parede x = 16,05 (lado do WC) em marmorato; espelho de corpo inteiro, banco e cica
  wetWall('z', 16.125, 1, 44.375, 49.413, M.marmorato);
  add(box(0.012, 1.62, 0.62, black, 16.132, 1.2, 46.2));
  add(box(0.008, 1.54, 0.54, M.mirror, 16.141, 1.2, 46.2, nc));
  {
    const g = G();
    for (let i = 0; i < 4; i++) g.add(box(0.075, 0.035, 1.3, woodL, -0.135 + i * 0.09, 0.45, 0));
    for (const sz of [-0.5, 0.5]) { g.add(box(0.38, 0.03, 0.05, black, 0, 0.418, sz)); g.add(box(0.035, 0.42, 0.035, black, -0.16, 0.21, sz)); g.add(box(0.035, 0.42, 0.035, black, 0.16, 0.21, sz)); }
    place(g, 16.4, 47.75, 0);
  }
  cica(16.6, 49.02, 0.32);
}
