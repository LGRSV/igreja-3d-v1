function roomAlaDireita(ctx) {
  // ---------------------------------------------------------------------------
  // ALA DIREITA (x 16,05–20,1 · z 11,0–49,5): corredor da entrada lateral,
  // circulação, sala de mídia (piso elevado 0,30 m — degraus "Abaixo" da planta),
  // voluntariado, circ./depósito/área técnica, WC masculino, hall dos banheiros
  // e WC feminino. Paleta da igreja: preto, grafite, madeira clara (ripado),
  // branco; acentos âmbar/terracota. Telas (mídia, TV da agenda) e placas usam
  // CanvasTexture (ctx.makeTex). Nada de luzes: o cartão cuida da iluminação.
  // Marca: sempre via ctx.logo (capacho da entrada lateral, painel retroiluminado da
  // circulação, neon da mídia, ripado com letras caixa no voluntariado, jateado no
  // espelho do hall dos banheiros, e dentro das telas/cartazes com ctx.logo.draw).
  // Telas e fitas de LED seguem as entidades com ctx.bindEmissive.
  // Faces internas das paredes: x 16,125 (templo) · 17,025/17,175 · 18,825/18,975
  // · 20,013 (muro, com revestimento) · z 19,075 · 23,225/23,375 · 27,925/28,075
  // · 33,825/33,975 · 35,825/35,975 · 36,925/37,075 · 40,725/40,875 ·
  // 44,225/44,375 · 49,413. Pilares 0,4×0,4 do templo avançam até x 16,25 em
  // z 21,4 · 25,9 · 30,4 · 35,0 · 39,5 · 44,0.
  // ---------------------------------------------------------------------------
  const { THREE, box, cyl, sph, place, add, std, rnd, M, F } = ctx;
  const PI = Math.PI, HPI = PI / 2;
  const G = () => new THREE.Group();
  const nc = { cast: false };

  // ---- materiais (ctx.std com as mesmas opções → mesmo material → merge) ----
  const woodL   = std({ color: 0xcfa97c, roughness: 0.7 });                 // madeira clara (ripado, tampos)
  const woodM   = std({ color: 0xa87c52, roughness: 0.72 });                // madeira média (molduras)
  const black   = std({ color: 0x18181b, roughness: 0.5, metalness: 0.2 }); // estrutura preta
  const graph   = std({ color: 0x3a3b3f, roughness: 0.6 });                 // cinza grafite
  const graphL  = std({ color: 0x5b5d63, roughness: 0.7 });
  const hpl     = std({ color: 0x45474c, roughness: 0.45 });                // divisórias HPL grafite
  const white   = std({ color: 0xf1f0ec, roughness: 0.5 });
  const china   = std({ color: 0xf7f7f5, roughness: 0.18 });                // louça sanitária
  const stone   = std({ color: 0x2c2d31, roughness: 0.28, metalness: 0.1 }); // granito preto (bancadas)
  const porc    = std({ color: 0x55565b, roughness: 0.35 });                // porcelanato grafite (parede dos mictórios / degraus)
  const carpet  = std({ color: 0x6a6c71, roughness: 1 });                   // carpete do piso elevado da mídia
  const acoustic = std({ color: 0x3f4146, roughness: 1 });                  // painéis acústicos
  const terra   = std({ color: 0xb3643f, roughness: 0.92 });                // estofado terracota
  const amber   = std({ color: 0xc98a3c, roughness: 0.85 });                // estofado âmbar
  const fabricG = std({ color: 0x8e9095, roughness: 0.97 });                // sofá cinza
  const cork    = std({ color: 0xb98e5e, roughness: 1 });
  const cardb   = std({ color: 0xb58b5b, roughness: 0.95 });                // papelão
  const basinDk = std({ color: 0x9aa0a6, roughness: 0.3, metalness: 0.5 }); // fundo da cuba inox
  const redExt  = std({ color: 0xc4201b, roughness: 0.35, metalness: 0.1 });
  const water   = std({ color: 0x7fb4e0, roughness: 0.1, transparent: true, opacity: 0.6 });
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
  // fitas de LED: um material por ambiente (opções levemente diferentes → materiais distintos),
  // cada um ligado à luz do seu ambiente
  const ledStrip = (key, r) => ctx.bindEmissive(key, std({ color: 0xfff1d8, emissive: 0xffe2b0, emissiveIntensity: 0.9, roughness: r }), 1.1, { min: 0.1 });
  const ledWv   = ledStrip('voluntariado', 0.5);
  const ledWb   = ledStrip('banheiros', 0.51);
  const ledWm   = ledStrip('midia', 0.52);
  const ledWc   = ledStrip('circulacao', 0.53);
  const ripa    = std({ color: 0xd9b8a0, roughness: 0.72 });                 // ripado (mesmo tom da fachada)
  const ripaFd  = std({ color: 0xa8876f, roughness: 0.85 });                 // fundo do ripado
  const matte   = std({ color: 0x1a1a1c, roughness: 0.92 });                 // preto fosco liso (painéis)
  const porcW   = std({ color: 0xd9d4cc, roughness: 0.3 });                  // porcelanato claro (WC fem.)
  const rugMat  = std({ color: 0x55575c, roughness: 1 });
  const rugEdge = std({ color: 0x9a6a45, roughness: 1 });
  const lampW   = std({ color: 0xf4f4f0, roughness: 0.3 });                   // luminária de emergência
  const papers  = [white, std({ color: 0xf3d77a, roughness: 1 }), std({ color: 0xe9a86a, roughness: 1 }), std({ color: 0xa9cbe6, roughness: 1 }), std({ color: 0xcfe3b0, roughness: 1 })];
  const bins    = [graphL, std({ color: 0x2f5f8b, roughness: 0.6 }), amber, cardb, std({ color: 0x3f7d3a, roughness: 0.7 }), terra];

  // ---- utilidades ------------------------------------------------------------
  // cilindro deitado ao longo de X ou Z
  const rod = (r, len, mat, x, y, z, axis, seg = 8) => {
    const m = cyl(r, r, len, mat, x, y, z, seg);
    if (axis === 'x') m.rotation.z = HPI; else if (axis === 'z') m.rotation.x = HPI;
    return add(m);
  };
  // Material com CanvasTexture desenhada num espaço virtual W×100 (W = 100·aspecto),
  // para o texto não sair esticado numa face de proporção `aspect`.
  const texMat = (aspect, draw, glow = 0, size = 256) => {
    const W = 100 * aspect, Hv = 100;
    const tex = ctx.makeTex(size, (g, s) => { g.save(); g.scale(s / W, s / Hv); draw(g, W, Hv); g.restore(); });
    return glow ? new THREE.MeshStandardMaterial({ color: 0x050505, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: glow, roughness: 0.35 })
      : new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
  };
  const text = (g, str, x, y, px, color, weight = 'bold', align = 'center') => {
    g.font = `${weight} ${px}px sans-serif`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(str, x, y);
  };
  // Cica / palmeira em vaso preto (como na fachada). reach = alcance das folhas
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
  // Placa fotoluminescente do extintor (NBR 13434: fundo vermelho, pictograma branco)
  const extSign = texMat(0.77, (g, W, Hh) => {
    g.fillStyle = '#c4201b'; g.fillRect(0, 0, W, Hh);
    g.strokeStyle = '#f7f1e6'; g.lineWidth = 2.2; g.strokeRect(4, 4, W - 8, Hh - 8);
    g.fillStyle = '#f7f1e6'; const cx = W / 2;
    g.beginPath(); g.moveTo(cx - 11, 30); g.lineTo(cx + 11, 30); g.lineTo(cx + 11, 72); g.quadraticCurveTo(cx + 11, 78, cx + 5, 78);
    g.lineTo(cx - 5, 78); g.quadraticCurveTo(cx - 11, 78, cx - 11, 72); g.closePath(); g.fill();     // cilindro
    g.fillRect(cx - 4, 20, 8, 10); g.fillRect(cx - 12, 16, 22, 5);                                  // válvula e gatilho
    g.lineWidth = 3; g.beginPath(); g.moveTo(cx + 9, 18); g.quadraticCurveTo(cx + 24, 22, cx + 20, 46); g.stroke(); // mangueira
    text(g, 'EXTINTOR', cx, 89, 10, '#f7f1e6');
  });
  // Extintor de parede com placa. face = x da face da parede, dir = lado da sala (±1)
  const extintor = (xf, z, dir) => {
    const xc = xf + dir * 0.09;
    add(box(0.01, 0.5, 0.2, black, xf + dir * 0.005, 0.62, z));
    add(cyl(0.075, 0.075, 0.46, redExt, xc, 0.55, z, 14));
    add(cyl(0.076, 0.076, 0.05, black, xc, 0.36, z, 14));                                     // etiqueta/cinta
    add(cyl(0.03, 0.04, 0.08, black, xc, 0.82, z, 10));
    add(box(0.12, 0.02, 0.03, black, xf + dir * 0.1, 0.87, z));
    add(cyl(0.016, 0.016, 0.01, white, xc + dir * 0.03, 0.82, z + 0.03, 10)).rotation.z = HPI; // manômetro
    add(cyl(0.01, 0.01, 0.34, black, xc + dir * 0.03, 0.66, z - 0.085, 6));                   // mangueira
    add(cyl(0.018, 0.012, 0.07, black, xc + dir * 0.03, 0.46, z - 0.085, 8));                  // difusor
    add(box(0.006, 0.26, 0.2, extSign, xf + dir * 0.004, 1.42, z, nc));
  };
  // Placa de porta (texto ou pictograma) colada numa parede ao longo de Z (face em xf) ou de X (face em zf)
  const plaque = (axis, c, t, y, w, h, mat) => add(axis === 'z' ? box(0.01, h, w, mat, c, y, t, nc) : box(w, h, 0.01, mat, t, y, c, nc));
  const doorSign = (label) => texMat(2.2, (g, W, Hh) => {
    g.fillStyle = '#141416'; g.fillRect(0, 0, W, Hh);
    g.fillStyle = '#c98a3c'; g.fillRect(12, 70, 40, 4);
    text(g, label, 12, 42, 24, '#f3efe6', 'bold', 'left');
    ctx.logo.draw(g, W - 40, 26, 30, { layout: 'mark', color: '#8d8f95' });
  }, 0, 512);
  // Placa de SAÍDA (sempre acesa: bloco autônomo). arrow: -1 esquerda, 0 nenhuma, 1 direita
  const exitMat = (arrow) => texMat(2.6, (g, W, Hh) => {
    g.fillStyle = '#0f7a3a'; g.fillRect(0, 0, W, Hh);
    g.fillStyle = '#f2fff4';
    const mx = arrow < 0 ? W - 48 : 28;                                                          // bonequinho correndo (no sentido da seta)
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
  // axis 'x' = parede ao longo de X (face em zf, sinal virado para dir·z); 'z' = parede ao longo de Z
  const exitSign = (axis, f, t, y, dir, arrow = 0) => {
    const m = exitMat(arrow);
    if (axis === 'x') { add(box(0.36, 0.15, 0.03, lampW, t, y, f + dir * 0.015)); add(box(0.33, 0.125, 0.004, m, t, y, f + dir * 0.032, nc)); }
    else { add(box(0.03, 0.15, 0.36, lampW, f + dir * 0.015, y, t)); add(box(0.004, 0.125, 0.33, m, f + dir * 0.032, y, t, nc)); }
  };
  // Luminária de emergência (2 faróis) na parede; mesmas convenções de exitSign
  const emerg = (axis, f, t, y, dir) => {
    const g = G();
    g.add(box(0.32, 0.075, 0.06, lampW, 0, 0, 0.03));
    for (const sx of [-0.1, 0.1]) { const h = cyl(0.028, 0.034, 0.05, lampW, sx, -0.02, 0.075, 12); h.rotation.x = HPI + 0.5; g.add(h); }
    g.add(box(0.03, 0.01, 0.004, ledG, 0, 0.012, 0.062, nc));
    if (axis === 'x') place(g, t, f, dir > 0 ? 0 : PI, y); else place(g, f, t, dir > 0 ? HPI : -HPI, y);
  };
  // Plano do logo (ctx.logo.mesh) virado para +z → posiciona e gira em torno de Y
  const logoAt = (m, x, y, z, ry = 0) => { m.position.set(x, y, z); m.rotation.y = ry; return add(m); };
  const picto = (fem) => texMat(0.78, (g, W, Hh) => {
    g.fillStyle = '#141416'; g.fillRect(0, 0, W, Hh);
    g.fillStyle = '#f3efe6'; const cx = W / 2;
    g.beginPath(); g.arc(cx, 20, 8, 0, Math.PI * 2); g.fill();
    if (fem) { g.beginPath(); g.moveTo(cx, 30); g.lineTo(cx + 17, 64); g.lineTo(cx - 17, 64); g.closePath(); g.fill(); g.fillRect(cx - 8, 64, 5, 12); g.fillRect(cx + 3, 64, 5, 12); }
    else { g.fillRect(cx - 12, 31, 24, 30); g.fillRect(cx - 11, 60, 9, 18); g.fillRect(cx + 2, 60, 9, 18); }
    text(g, fem ? 'FEMININO' : 'MASCULINO', cx, 89, 11, '#c98a3c');
  });

  // Cadeira de estofado terracota/âmbar e pés de madeira (frente = +z local)
  const chairV = (mat) => {
    const g = G();
    g.add(box(0.44, 0.06, 0.44, mat, 0, 0.46, 0));
    const back = box(0.44, 0.36, 0.05, mat, 0, 0.72, -0.2); back.rotation.x = -0.1; g.add(back);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(cyl(0.017, 0.013, 0.44, woodM, sx * 0.18, 0.22, sz * 0.18, 8));
    return g;
  };
  // Monitor em pedestal, tela para +z local
  const monitor = (w, h, mat, lift = 0.12) => {
    const g = G();
    g.add(box(0.22, 0.012, 0.16, black, 0, 0.006, 0));
    g.add(box(0.05, lift + h * 0.4, 0.03, black, 0, (lift + h * 0.4) / 2, -0.035));
    g.add(box(w + 0.02, h + 0.02, 0.025, black, 0, lift + h / 2, -0.005));
    g.add(box(w, h, 0.004, mat, 0, lift + h / 2, 0.0095, nc));
    return g;
  };
  // Cabines sanitárias: faixa x xa–xb, parede do fundo em zw, frente em zf, n cabines.
  // sides = [divisória no lado xa?, divisória no lado xb?]; cut = recuo das divisórias
  // junto da parede do fundo (janela alta), completado por um trecho baixo.
  const cabins = (xa, xb, zw, zf, n, sides, cut = 0) => {
    const sg = Math.sign(zf - zw), w = (xb - xa) / n, PY0 = 0.15, PH = 1.85, py = PY0 + PH / 2;
    const zw2 = zw + sg * cut, len = Math.abs(zf - zw2), zc = (zf + zw2) / 2;
    for (let i = 0; i <= n; i++) {
      if ((i === 0 && !sides[0]) || (i === n && !sides[1])) continue;
      const x = xa + i * w;
      add(box(0.025, PH, len, hpl, x, py, zc));
      if (cut) add(box(0.025, 1.4, cut, hpl, x, PY0 + 0.7, zw + sg * cut / 2));
    }
    const dw = Math.min(0.62, w - 0.2), pl = (w - dw) / 2;
    for (let i = 0; i < n; i++) {
      const x0 = xa + i * w, c = x0 + w / 2;
      add(box(pl - 0.008, PH, 0.025, hpl, x0 + pl / 2, py, zf));
      add(box(pl - 0.008, PH, 0.025, hpl, x0 + w - pl / 2, py, zf));
      add(box(dw - 0.008, PH - 0.06, 0.03, woodL, c, py + 0.02, zf));                         // porta (madeira clara)
      add(box(0.05, 0.025, 0.012, i % 2 ? ledR : ledG, c + dw / 2 - 0.08, 1.05, zf + sg * 0.021, nc)); // livre/ocupado
      add(box(0.02, 0.02, 0.12, M.chrome, c + dw / 2 - 0.08, 0.95, zf + sg * 0.03));          // puxador
      const t = F.toilet(); place(t, c, zw + sg * 0.3, sg > 0 ? 0 : PI);
      add(box(0.13, 0.12, 0.09, M.steel, c + 0.32, 0.72, zw + sg * 0.05));                   // papeleira
    }
    add(box(xb - xa, 0.03, 0.04, M.steel, (xa + xb) / 2, PY0 + PH + 0.015, zf));             // travessa superior
  };
  // Mictório de parede (parede ao longo de Z em x = xf, sala em −x)
  const urinal = (xf, z) => {
    add(box(0.1, 0.62, 0.34, china, xf - 0.05, 0.86, z));
    const bowl = cyl(0.16, 0.13, 0.52, china, xf - 0.17, 0.83, z, 16); bowl.scale.set(0.8, 1, 1); add(bowl);
    add(cyl(0.02, 0.02, 0.2, M.chrome, xf - 0.06, 1.27, z, 8));
  };

  // =====================================================================
  // CORREDOR DA ENTRADA LATERAL (x 16,05–17,1 · z 11,0–19,0)
  // Portas em x=17,1: Gilvan z 12,9–13,8 · Adm. z 14,4–15,3; porta PM01 em z=11.
  // =====================================================================
  // capacho de borracha grafite com a marca (anel + B) em bege, legível de quem chega pela frente
  add(box(0.8, 0.012, 0.62, matte, 16.58, 0.008, 11.45, nc));
  { const m = ctx.logo.mesh(0.44, 0, { layout: 'mark', color: '#bdb6a8', roughness: 1, cast: false }); m.rotation.x = -HPI; m.position.set(16.58, 0.0155, 11.45); add(m); }
  exitSign('x', 11.075, 16.575, 2.38, 1);                                                    // SAÍDA sobre a porta PM01
  emerg('z', 17.025, 16.25, 2.45, -1);
  extintor(17.025, 12.1, -1);
  plaque('z', 17.018, 12.62, 1.6, 0.3, 0.13, doorSign('SALA GILVAN'));
  plaque('z', 17.018, 14.17, 1.6, 0.3, 0.13, doorSign('ADMINISTRATIVO'));
  // cartazes emoldurados na parede do templo (entre os pilares de z 12,4 e 18,3): série e Base Jovem
  const poster1 = texMat(0.72, (g, W, Hh) => {
    const gr = g.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, '#1b1b1f'); gr.addColorStop(1, '#3a2a1f');
    g.fillStyle = gr; g.fillRect(0, 0, W, Hh);
    ctx.logo.draw(g, W / 2 - 9, 8, 18, { layout: 'mark', color: '#f4f5f7' });
    g.fillStyle = '#c98a3c'; g.fillRect(W / 2 - 10, 33, 20, 1.2);
    text(g, 'SÉRIE', W / 2, 42, 6, '#cfcfd4');
    text(g, 'RAÍZES', W / 2, 55, 15, '#f4f5f7', '900');
    g.strokeStyle = '#c98a3c'; g.lineWidth = 1.2;                                                 // raízes estilizadas
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
    add(box(0.006, 0.84, 0.6, white, 16.157, 1.55, z, nc));                                    // passe-partout
    add(box(0.004, 0.76, 0.54, pm, 16.161, 1.55, z, nc));
  });

  // =====================================================================
  // CIRCULAÇÃO (x 16,05–20,1 · z 19,0–23,3) + corredor x 18,9–20,1 · z 23,3–28,0
  // =====================================================================
  // Degraus "Abaixo" para a mídia (piso elevado 0,30 m), x 17,8–19,2
  add(box(1.4, 0.1, 0.57, porc, 18.5, 0.05, 22.905));
  add(box(1.4, 0.1, 0.27, porc, 18.5, 0.15, 23.055));
  add(box(1.4, 0.012, 0.04, black, 18.5, 0.106, 22.64, nc));                                // frisos antiderrapantes
  add(box(1.4, 0.012, 0.04, black, 18.5, 0.206, 22.94, nc));
  // Bebedouro de coluna (galão) junto à parede z=19
  {
    const g = G();
    g.add(box(0.32, 0.95, 0.32, white, 0, 0.475, 0));
    g.add(box(0.33, 0.04, 0.33, graphL, 0, 0.97, 0));
    g.add(box(0.22, 0.22, 0.01, graph, 0, 0.76, 0.162));
    g.add(box(0.04, 0.045, 0.04, redExt, -0.05, 0.84, 0.18));
    g.add(box(0.04, 0.045, 0.04, std({ color: 0x2f6fb8, roughness: 0.4 }), 0.05, 0.84, 0.18));
    g.add(box(0.22, 0.02, 0.09, M.steel, 0, 0.66, 0.2));
    g.add(cyl(0.05, 0.05, 0.06, water, 0, 1.02, 0, 12));
    g.add(cyl(0.135, 0.135, 0.36, water, 0, 1.23, 0, 16));
    g.add(cyl(0.05, 0.12, 0.06, water, 0, 1.44, 0, 16));
    place(g, 17.5, 19.33, 0);
  }
  // Aparador + quadro de avisos na parede z=19
  {
    const g = G();
    g.add(box(1.2, 0.04, 0.4, woodL, 0, 0.8, 0));
    g.add(box(1.14, 0.2, 0.36, black, 0, 0.68, 0));
    for (const sx of [-0.3, 0.3]) g.add(box(0.2, 0.012, 0.01, woodL, sx, 0.68, 0.181, nc));   // puxadores
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.03, 0.58, 0.03, black, sx * 0.55, 0.29, sz * 0.16));
    g.add(cyl(0.07, 0.09, 0.22, potBlk, -0.38, 0.93, 0, 12));                                 // vaso com planta
    g.add(sph(0.14, frond2, -0.38, 1.12, 0)); g.add(sph(0.1, frond, -0.32, 1.2, 0.04));
    g.add(box(0.21, 0.02, 0.15, papers[0], 0.05, 0.83, 0.05)); g.add(box(0.21, 0.02, 0.15, papers[1], 0.07, 0.85, 0.04)); // folhetos
    g.add(box(0.17, 0.05, 0.24, black, 0.38, 0.845, 0.0));                                   // Bíblia
    g.add(box(0.1, 0.006, 0.244, ledA, 0.38, 0.845, 0.0, nc));                               // marcador (fita)
    place(g, 18.9, 19.37, 0);
    add(box(1.24, 0.84, 0.03, woodM, 18.9, 1.62, 19.09));                                    // quadro de avisos
    add(box(1.16, 0.76, 0.012, cork, 18.9, 1.62, 19.111, nc));
    for (let i = 0; i < 8; i++) {
      const p = box(0.18 + rnd() * 0.06, 0.22 + rnd() * 0.06, 0.004, papers[i % papers.length], 18.42 + (i % 4) * 0.32 + rnd() * 0.04, 1.8 - Math.floor(i / 4) * 0.34 + rnd() * 0.04, 19.119, nc);
      p.rotation.z = (rnd() - 0.5) * 0.12; add(p);
      add(sph(0.012, i % 2 ? ledR : redExt, p.position.x, p.position.y + 0.1, 19.123));
    }
  }
  // Banco ripado na parede x=20,1 (sala de espera)
  {
    const g = G();
    for (let i = 0; i < 5; i++) g.add(box(0.066, 0.035, 1.6, woodL, -0.16 + i * 0.08, 0.45, 0));
    for (const sz of [-0.62, 0.62]) {
      g.add(box(0.4, 0.03, 0.05, black, 0, 0.418, sz));
      g.add(box(0.035, 0.42, 0.035, black, -0.17, 0.21, sz)); g.add(box(0.035, 0.42, 0.035, black, 0.17, 0.21, sz));
    }
    place(g, 19.73, 20.85, 0);
  }
  // Painel preto fosco com o logo retroiluminado atrás do banco (parede x=20,1): acende com a circulação
  add(box(0.03, 1.12, 2.3, matte, 19.998, 1.78, 20.85));
  add(box(0.012, 0.012, 2.2, ledWc, 19.976, 2.33, 20.85, nc));                                 // fita de LED rasante no topo
  {
    const lg = ctx.logo.mesh(1.75, 0, { layout: 'wide', color: '#f4f5f7', emissive: 1, roughness: 0.35, cast: false });
    logoAt(lg, 19.979, 1.74, 20.85, -HPI); ctx.bindEmissive('circulacao', lg.material, 0.85, { min: 0.12 });
    const halo = ctx.glowPlane(2.6, 1.4, 'circulacao', { color: 0xfff1dc, base: 0.45, day: 0.2 });
    logoAt(halo, 19.975, 1.76, 20.85, -HPI);
  }
  exitSign('x', 19.075, 17.55, 2.45, 1, -1);                                                  // SAÍDA ← (corredor lateral)
  emerg('x', 23.225, 16.75, 2.5, -1);
  cica(16.58, 22.72, 0.4);
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
  add(box(0.04, 0.6, 1.04, black, 19.99, 1.6, 25.1));
  add(box(0.004, 0.55, 0.98, agenda, 19.968, 1.6, 25.1, nc));
  [[24.3, terra, amber], [26.6, woodL, terra]].forEach(([z, a, b]) => {
    add(box(0.03, 0.72, 0.52, black, 18.99, 1.6, z));
    add(box(0.006, 0.64, 0.44, white, 19.007, 1.6, z, nc));
    add(box(0.008, 0.46, 0.12, a, 19.012, 1.6, z - 0.1, nc));
    add(box(0.008, 0.2, 0.2, b, 19.014, 1.72, z + 0.1, nc));
  });

  // =====================================================================
  // MÍDIA (x 16,05–18,9 · z 23,3–28,0) — piso elevado FP = 0,30 m.
  // Bancada de 4,4 m sob a janela J12 (vista para o templo), 6 cadeiras viradas
  // para −x, rack de equipamentos na parede x=18,9. Porta x 17,9–18,8 (z=23,3).
  // =====================================================================
  const FP = 0.3, DT = FP + 0.76;                                                           // piso e tampo da bancada
  add(box(2.57, FP, 4.54, carpet, 17.535, FP / 2, 25.65));                                  // piso elevado (carpete)
  add(box(0.12, FP, 4.3, carpet, 16.19, FP / 2, 25.6));                                      // faixa junto à parede, entre os pilares z 23,2 e 28,0
  // Telas (CanvasTexture)
  const stage = (g, x, y, w, h, kind) => {
    const gr = g.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, '#120b24'); gr.addColorStop(1, '#3b1f5e');
    g.fillStyle = gr; g.fillRect(x, y, w, h);
    if (kind === 'plateia') {
      g.fillStyle = '#3a2a1a'; g.fillRect(x, y, w, h);
      g.fillStyle = '#1a1210';
      for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) { g.beginPath(); g.arc(x + (c + 0.5 + (r % 2) * 0.4) * w / 9, y + h * (0.35 + r * 0.18), w * 0.035 + r * 0.6, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#5a3fd0'; g.fillRect(x + w * 0.35, y + h * 0.05, w * 0.3, h * 0.18);
      return;
    }
    if (kind === 'close') {
      g.fillStyle = '#e8c9a8'; g.beginPath(); g.arc(x + w / 2, y + h * 0.42, h * 0.2, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#18181b'; g.beginPath(); g.ellipse(x + w / 2, y + h * 1.02, w * 0.3, h * 0.42, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#2a1f1a'; g.beginPath(); g.arc(x + w / 2, y + h * 0.34, h * 0.2, Math.PI, 0); g.fill();
      return;
    }
    g.fillStyle = '#6d4fe0'; g.fillRect(x + w * 0.28, y + h * 0.1, w * 0.44, h * 0.34);            // telão
    g.fillStyle = 'rgba(255,220,160,0.25)';
    for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(x + w * (0.2 + i * 0.2), y); g.lineTo(x + w * (0.12 + i * 0.2), y + h * 0.7); g.lineTo(x + w * (0.28 + i * 0.2), y + h * 0.7); g.fill(); }
    g.fillStyle = '#0c0c0e'; g.fillRect(x, y + h * 0.72, w, h * 0.28);                            // palco
    g.fillStyle = '#050506';
    const n = kind === 'wide' ? 5 : 1;
    for (let i = 0; i < n; i++) { const px = x + w * (n === 1 ? 0.5 : 0.18 + i * 0.16); g.fillRect(px - w * 0.02, y + h * 0.5, w * 0.04, h * 0.23); g.beginPath(); g.arc(px, y + h * 0.47, w * 0.022, 0, Math.PI * 2); g.fill(); }
    if (kind === 'pulpito') { g.fillStyle = '#cfa97c'; g.fillRect(x + w * 0.44, y + h * 0.6, w * 0.12, h * 0.14); }
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
    ctx.logo.draw(g, W - 20, 5, 13, { layout: 'mark', color: '#ffffff' });                    // "bug" da transmissão
  }, 0.85, 512);
  const waveMat = texMat(1.7778, (g, W, Hh) => {
    g.fillStyle = '#16181c'; g.fillRect(0, 0, W, Hh);
    g.fillStyle = '#23262c'; g.fillRect(0, 0, W, 8);
    for (let i = 0; i < 16; i++) { g.fillStyle = '#3a3e46'; g.fillRect(24 + i * 9, 2, 0.5, 5); }
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
  // telas da mídia acompanham o culto: vídeo/slides com o telão, DAW com o som (apagadas = tela escura)
  for (const m of [camMat, liveMat, slidesMat]) ctx.bindEmissive('telao', m, 0.85, { min: 0.1 });
  ctx.bindEmissive('som', waveMat, 0.85, { min: 0.1 });

  // ---- bancada longa junto à J12 (x 16,27–16,92 · z 23,45–27,85) ----
  add(box(0.65, 0.04, 4.4, woodL, 16.595, DT - 0.02, 25.65));
  add(box(0.02, 0.12, 4.4, black, 16.915, DT - 0.1, 25.65));                                  // testeira preta
  for (const z of [23.47, 25.02, 26.7, 27.83]) add(box(0.6, DT - FP - 0.04, 0.03, black, 16.6, (FP + DT - 0.04) / 2, z)); // pés/painéis
  add(box(0.1, 0.08, 4.3, graph, 16.36, FP + 0.55, 25.65));                                   // calha de cabos
  for (const z of [24.25, 27.25]) {                                                            // gabinetes dos PCs
    add(box(0.2, 0.45, 0.44, black, 16.45, FP + 0.225, z));
    add(box(0.005, 0.2, 0.012, ledB, 16.552, FP + 0.3, z - 0.15, nc));
  }
  // Estação de vídeo / transmissão (z 23,5–25,0)
  place(monitor(0.62, 0.36, camMat), 16.42, 24.0, HPI, DT);
  place(monitor(0.53, 0.3, liveMat), 16.42, 24.68, HPI, DT);
  add(box(0.22, 0.045, 0.42, graph, 16.74, DT + 0.0225, 24.33));                              // switcher de vídeo
  add(box(0.03, 0.006, 0.34, ledR, 16.7, DT + 0.047, 24.33, nc));                             // barramento PGM
  add(box(0.03, 0.006, 0.34, ledG, 16.745, DT + 0.047, 24.33, nc));                           // barramento PVW
  add(box(0.03, 0.006, 0.34, graphL, 16.79, DT + 0.047, 24.33, nc));
  add(box(0.06, 0.004, 0.1, ledB, 16.67, DT + 0.047, 24.2, nc));                              // visor
  add(box(0.05, 0.03, 0.04, black, 16.78, DT + 0.06, 24.49));                                  // alavanca T
  add(cyl(0.008, 0.008, 0.12, M.chrome, 16.78, DT + 0.13, 24.49, 6));
  add(box(0.15, 0.02, 0.42, black, 16.8, DT + 0.01, 24.8));                                    // teclado
  add(box(0.13, 0.004, 0.39, graphL, 16.8, DT + 0.022, 24.8, nc));
  { const m = sph(0.03, black, 16.8, DT + 0.015, 25.08); m.scale.set(1.4, 0.55, 1); add(m); }
  // Estação de áudio: mesa de som digital (z 25,44–26,30), retornos e DAW
  place(monitor(0.6, 0.34, waveMat, 0.16), 16.39, 25.87, HPI, DT);
  add(box(0.42, 0.07, 0.86, graph, 16.71, DT + 0.035, 25.87));                                // corpo da mesa
  add(box(0.1, 0.1, 0.86, graph, 16.55, DT + 0.12, 25.87));                                   // ponte dos medidores
  add(box(0.004, 0.06, 0.22, waveMat, 16.602, DT + 0.125, 25.87, nc));                        // tela da mesa
  add(box(0.03, 0.004, 0.3, ledG, 16.55, DT + 0.172, 25.6, nc));                              // medidores LED
  add(box(0.03, 0.004, 0.3, ledA, 16.55, DT + 0.172, 26.14, nc));
  for (let i = 0; i < 17; i++) {
    const z = 25.49 + i * 0.047 + (i === 16 ? 0.02 : 0);
    add(box(0.13, 0.004, 0.008, black, 16.83, DT + 0.072, z, nc));                            // trilho do fader
    add(box(0.028, 0.022, 0.02, i === 16 ? redExt : white, 16.79 + ((i * 37) % 7) * 0.012, DT + 0.083, z)); // fader
    if (i < 16) add(cyl(0.008, 0.008, 0.016, i % 4 === 0 ? amber : black, 16.64, DT + 0.078, z, 8)); // knob
  }
  add(box(0.012, 0.004, 0.36, ledA, 16.69, DT + 0.071, 25.68, nc));                           // teclas de mute
  add(box(0.012, 0.004, 0.36, ledB, 16.69, DT + 0.071, 26.06, nc));
  for (const z of [25.2, 26.55]) {                                                             // retornos de estúdio
    add(box(0.19, 0.28, 0.17, black, 16.42, DT + 0.14, z));
    rod(0.055, 0.012, graph, 16.52, DT + 0.1, z, 'x', 16);
    rod(0.02, 0.012, graphL, 16.52, DT + 0.22, z, 'x', 10);
  }
  { const hp = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 6, 14, PI), black); hp.position.set(16.88, DT + 0.02, 26.5); hp.rotation.set(-HPI, 0, 0); hp.castShadow = true; add(hp); }
  // Estação de projeção (slides) + mesa de luz (z 26,75–27,8)
  place(monitor(0.53, 0.3, slidesMat), 16.42, 27.08, HPI, DT);
  {
    const g = G();                                                                              // notebook com os slides
    g.add(box(0.32, 0.016, 0.22, M.steel, 0, 0.008, 0));
    g.add(box(0.27, 0.004, 0.1, graphL, 0, 0.018, 0.02, nc));
    const lid = box(0.32, 0.21, 0.012, M.steel, 0, 0.11, -0.12); lid.rotation.x = -0.22; g.add(lid);
    const scr = box(0.29, 0.18, 0.004, slidesMat, 0, 0.112, -0.112, nc); scr.rotation.x = -0.22; g.add(scr);
    place(g, 16.76, 26.98, HPI, DT);
  }
  add(box(0.22, 0.05, 0.36, graph, 16.76, DT + 0.025, 27.55));                                // mesa de luz
  for (let i = 0; i < 8; i++) add(box(0.026, 0.02, 0.018, white, 16.8 + ((i * 3) % 5) * 0.01, DT + 0.06, 27.42 + i * 0.036));
  add(box(0.06, 0.004, 0.3, ledA, 16.68, DT + 0.051, 27.55, nc));
  add(cyl(0.04, 0.035, 0.1, white, 16.86, DT + 0.05, 25.28, 12));                              // caneca
  add(cyl(0.035, 0.035, 0.2, std({ color: 0x2f6fb8, roughness: 0.3 }), 16.86, DT + 0.1, 27.8, 12)); // garrafa d'água
  // Cadeiras de operador (6, viradas para a janela / templo)
  for (const z of [24.0, 24.72, 25.44, 26.16, 26.88, 27.6]) place(F.officeChair(), 17.3, z, -HPI, FP);
  // ---- rack de equipamentos (parede x=18,9) ----
  add(box(0.59, 1.9, 0.59, black, 18.445, FP + 0.95, 27.545));                               // rack 19" alto
  const rackU = [[0.09, graph], [0.13, graphL], [0.09, graph], [0.18, black], [0.09, graphL], [0.13, graph], [0.22, graphL]];
  let ry = FP + 1.75;
  rackU.forEach(([h, m], i) => {
    add(box(0.012, h - 0.01, 0.48, m, 18.144, ry - h / 2, 27.545));
    add(box(0.006, 0.012, 0.12 + (i % 3) * 0.08, [ledG, ledB, ledA, ledG][i % 4], 18.136, ry - h / 2, 27.44, nc));
    ry -= h + 0.05;
  });
  add(box(0.01, 1.8, 0.55, M.glass, 18.125, FP + 0.95, 27.545, { cast: false, receive: false })); // porta de vidro
  add(box(0.45, 0.8, 2.7, black, 18.515, FP + 0.4, 25.75));                                   // armário baixo
  add(box(0.47, 0.03, 2.72, woodL, 18.515, FP + 0.815, 25.75));
  for (let i = 0; i < 4; i++) add(box(0.01, 0.72, 0.66, graph, 18.286, FP + 0.42, 24.74 + i * 0.675));
  const TOP = FP + 0.83;
  add(box(0.12, 0.05, 0.5, black, 18.52, TOP + 0.025, 24.8));                                 // base de carga dos microfones
  add(box(0.004, 0.012, 0.4, ledG, 18.458, TOP + 0.03, 24.8, nc));
  for (let i = 0; i < 4; i++) {
    const z = 24.62 + i * 0.12;
    add(cyl(0.018, 0.014, 0.22, graph, 18.52, TOP + 0.16, z, 10));
    add(sph(0.026, graphL, 18.52, TOP + 0.285, z));
  }
  for (let k = 0; k < 2; k++) {                                                                 // receptores sem fio
    add(box(0.3, 0.085, 0.42, graph, 18.55, TOP + 0.045 + k * 0.09, 25.6));
    add(box(0.004, 0.03, 0.1, ledB, 18.398, TOP + 0.045 + k * 0.09, 25.5, nc));
    add(box(0.004, 0.012, 0.08, ledG, 18.398, TOP + 0.045 + k * 0.09, 25.7, nc));
  }
  for (const z of [25.42, 25.78]) add(cyl(0.006, 0.006, 0.2, black, 18.6, TOP + 0.28, z, 6));  // antenas
  add(box(0.36, 0.3, 0.6, graph, 18.53, TOP + 0.15, 26.55));                                  // case de transporte
  for (const [dy, dz] of [[0.15, 0.3], [0.15, -0.3], [-0.15, 0.3], [-0.15, -0.3]]) add(box(0.37, 0.02, 0.02, M.steel, 18.53, TOP + 0.15 + dy, 26.55 + dz));
  { const coil = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 6, 16), black); coil.position.set(18.53, TOP + 0.318, 26.55); coil.rotation.x = HPI; coil.castShadow = true; add(coil); }
  // painéis acústicos na parede x=18,9 (sobre o armário baixo)
  // e, no centro, painel de feltro preto com a marca em neon branco-frio (acende com a mídia)
  for (let r = 0; r < 2; r++) for (const c of [0, 3]) add(box(0.04, 0.46, 0.6, (r + c) % 3 === 1 ? amber : acoustic, 18.8, 1.72 + r * 0.5, 24.75 + c * 0.65));
  add(box(0.04, 0.96, 1.24, matte, 18.8, 1.97, 25.725));
  {
    const neon = ctx.logo.mesh(0.7, 0, { layout: 'mark', color: '#ffffff', emissive: 1.3, emissiveColor: 0xd9ccff, roughness: 0.4, cast: false });
    logoAt(neon, 18.777, 1.97, 25.725, -HPI); ctx.bindEmissive('midia', neon.material, 1.4, { min: 0.1 });
    const halo = ctx.glowPlane(1.5, 1.2, 'midia', { color: 0x8a70ff, base: 0.55, day: 0.3 });   // brilho roxo (Base Music)
    logoAt(halo, 18.774, 1.97, 25.725, -HPI);
  }
  // sinal "NO AR" sobre a porta (lado de dentro)
  const noAr = texMat(3, (g, W, Hh) => { g.fillStyle = '#9e0f0f'; g.fillRect(0, 0, W, Hh); text(g, 'NO AR', W / 2, 54, 62, '#fff1f1'); }, 0.9);
  ctx.bindEmissive('telao', noAr, 1.1, { min: 0.04 });                                          // acende durante a transmissão
  add(box(0.012, 0.01, 4.3, ledWm, 16.283, DT + 0.005, 25.65, nc));                              // fita de LED atrás dos monitores (luz de fundo)
  emerg('x', 27.925, 16.95, 2.5, -1);
  add(box(0.38, 0.14, 0.05, black, 18.35, 2.4, 23.4));
  add(box(0.34, 0.11, 0.004, noAr, 18.35, 2.4, 23.426, nc));

  // =====================================================================
  // VOLUNTARIADO (x 16,05–20,1 · z 28,0–33,9)
  // Portas: z=28 x 19,0–19,9 · z=33,9 x 16,2–17,0; janela p/ o templo z 29,9–31,9.
  // =====================================================================
  // Parede de marca atrás do sofá (face z 28,075, x 16,3–18,8 — antes da porta x 19,0): ripado de
  // madeira clara como o da fachada, com o logo em letras caixa prateadas (brilho leve com a luz da sala)
  {
    const x0 = 16.3, x1 = 18.8, zf = 28.075, yh = 2.72;
    add(box(x1 - x0, yh, 0.012, ripaFd, (x0 + x1) / 2, yh / 2, zf + 0.006));
    for (let x = x0 + 0.03; x < x1 - 0.02; x += 0.075) add(box(0.042, yh, 0.022, ripa, x, yh / 2, zf + 0.023));
    add(box(x1 - x0 + 0.02, 0.035, 0.05, matte, (x0 + x1) / 2, yh + 0.0175, zf + 0.025));      // arremate superior
    add(box(x1 - x0 + 0.02, 0.07, 0.04, matte, (x0 + x1) / 2, 0.035, zf + 0.02));               // rodapé
    const L = ctx.logo.relief(0.74, { depth: 0.045, layers: 3 });
    L.position.set(17.55, 1.86, zf + 0.036); add(L);
    ctx.bindEmissive('voluntariado', L.userData.face, 0.35, { min: 0 });
  }
  // tapete grafite com borda terracota sob a mesa
  add(box(2.3, 0.008, 3.2, rugEdge, 17.55, 0.006, 30.95, nc));
  add(box(2.14, 0.004, 3.04, rugMat, 17.55, 0.012, 30.95, nc));
  emerg('z', 20.013, 28.75, 2.5, -1);
  place(F.sofa(2.5, 0.85, fabricG), 17.52, 28.6, 0);
  for (const [x, m, a] of [[16.62, terra, 0.25], [18.42, amber, -0.2]]) { const c = box(0.4, 0.38, 0.12, m, x, 0.66, 28.42); c.rotation.set(-0.25, a, 0); add(c); }
  // mesa 1,3 × 2,5 com 8 cadeiras
  add(box(1.3, 0.04, 2.5, woodL, 17.55, 0.75, 30.95));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add(box(0.05, 0.73, 0.05, black, 17.55 + sx * 0.58, 0.365, 30.95 + sz * 1.17));
  add(box(1.14, 0.06, 0.03, black, 17.55, 0.7, 29.8)); add(box(1.14, 0.06, 0.03, black, 17.55, 0.7, 32.1));
  for (const [i, z] of [29.99, 30.63, 31.27, 31.91].entries()) {
    place(chairV(i % 2 ? amber : terra), 16.74, z, HPI);
    place(chairV(i % 2 ? terra : amber), 18.36, z, -HPI);
  }
  add(box(0.32, 0.02, 0.22, M.steel, 17.3, 0.78, 30.4));                                      // notebook fechado
  add(box(0.21, 0.015, 0.3, white, 17.8, 0.777, 31.5)); add(box(0.21, 0.012, 0.3, papers[1], 17.83, 0.79, 31.52)); // papéis
  add(cyl(0.055, 0.055, 0.3, black, 17.55, 0.92, 30.95, 12));                                 // garrafa térmica
  add(cyl(0.02, 0.02, 0.04, black, 17.55, 1.09, 30.95, 8));
  for (const [dx, dz] of [[-0.2, -0.25], [0.18, -0.3], [-0.22, 0.28], [0.2, 0.24]]) add(cyl(0.035, 0.03, 0.08, white, 17.55 + dx, 0.81, 30.95 + dz, 10)); // xícaras
  // armário com escaninhos na parede x=20,1 (x 19,52–19,93 · z 29,6–32,2)
  add(box(0.37, 0.06, 2.56, black, 19.745, 0.03, 30.9));
  add(box(0.41, 0.84, 2.6, woodL, 19.725, 0.48, 30.9));
  for (const z of [30.25, 30.9, 31.55]) add(box(0.004, 0.8, 0.008, black, 19.518, 0.48, z, nc));
  for (const z of [29.92, 30.58, 31.22, 31.88]) add(box(0.012, 0.16, 0.02, black, 19.512, 0.72, z + (z < 30.9 ? 0.25 : -0.25)));
  add(box(0.43, 0.03, 2.62, black, 19.725, 0.915, 30.9));
  add(box(0.02, 1.05, 2.6, woodL, 19.92, 1.455, 30.9));                                       // fundo
  for (const y of [1.28, 1.63]) add(box(0.39, 0.025, 2.6, black, 19.72, y, 30.9));
  add(box(0.43, 0.03, 2.64, woodL, 19.725, 1.995, 30.9));                                     // tampo superior
  for (let i = 0; i <= 5; i++) add(box(0.39, 1.05, 0.025, black, 19.72, 1.455, 29.6125 + i * 0.515));
  for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) {
    if (rnd() < 0.25) continue;
    const y0 = 0.93 + r * 0.35 + 0.0125, z = 29.87 + c * 0.515;
    if (rnd() < 0.5) add(box(0.3, 0.07 + rnd() * 0.08, 0.34, bins[(r * 5 + c) % bins.length], 19.74, y0 + 0.06, z)); // coletes/caixas
    else for (let k = 0; k < 3; k++) add(box(0.26, 0.26, 0.03, papers[(k + c) % papers.length], 19.76, y0 + 0.13, z - 0.1 + k * 0.08)); // pastas
  }
  // bancada com pia na parede z=33,9 (x 17,6–20,0)
  add(box(2.36, 0.08, 0.52, black, 18.8, 0.04, 33.55));
  add(box(2.4, 0.82, 0.58, white, 18.8, 0.49, 33.52));
  [[17.905, M.steel], [18.5, woodL], [19.095, woodL], [19.69, woodL]].forEach(([x, m]) => add(box(0.585, 0.78, 0.012, m, x, 0.49, 33.225)));
  add(box(2.42, 0.03, 0.62, stone, 18.8, 0.915, 33.51));
  add(box(0.52, 0.01, 0.44, M.steel, 19.3, 0.935, 33.49));                                    // cuba inox
  add(box(0.44, 0.004, 0.36, basinDk, 19.3, 0.9415, 33.49, nc));
  add(cyl(0.014, 0.014, 0.3, M.chrome, 19.3, 1.08, 33.74, 8));
  add(box(0.025, 0.025, 0.18, M.chrome, 19.3, 1.22, 33.66));
  add(box(0.48, 0.28, 0.36, black, 17.92, 1.07, 33.6));                                        // micro-ondas
  add(box(0.3, 0.2, 0.004, std({ color: 0x1d2a33, roughness: 0.1, metalness: 0.3 }), 17.88, 1.07, 33.418, nc));
  add(box(0.004, 0.012, 0.06, ledA, 18.1, 1.16, 33.418, nc));
  add(box(0.2, 0.32, 0.22, black, 18.42, 1.09, 33.64));                                        // cafeteira
  add(cyl(0.065, 0.06, 0.13, std({ color: 0x2a1c14, roughness: 0.2 }), 18.42, 1.0, 33.5, 12));
  for (const [x, m] of [[18.72, terra], [18.86, M.steel]]) { add(cyl(0.055, 0.055, 0.3, m, x, 1.08, 33.62, 12)); add(cyl(0.03, 0.03, 0.04, black, x, 1.25, 33.62, 8)); }
  add(cyl(0.14, 0.1, 0.07, woodL, 19.78, 0.965, 33.55, 16));                                  // fruteira
  for (const [dx, dz, m] of [[-0.04, 0.02, amber], [0.05, -0.03, std({ color: 0x6f9a3a, roughness: 0.6 })], [0.01, 0.06, redExt]]) add(sph(0.04, m, 19.78 + dx, 1.02, 33.55 + dz));
  add(box(2.4, 0.62, 0.34, woodL, 18.8, 1.95, 33.645));                                       // armário aéreo
  for (const x of [18.2, 18.8, 19.4]) add(box(0.008, 0.58, 0.004, black, x, 1.95, 33.473, nc));
  add(box(2.3, 0.012, 0.02, ledWv, 18.8, 1.634, 33.52, nc));                                   // fita LED sob o aéreo
  // quadro branco da escala (parede do templo, z 32,05–32,95)
  const escala = texMat(1.14, (g, W, Hh) => {
    g.fillStyle = '#f7f7f4'; g.fillRect(0, 0, W, Hh);
    text(g, 'ESCALA DE VOLUNTÁRIOS', W / 2, 11, 7.5, '#1f4fa8');
    const cols = ['Recepção', 'Mídia', 'Kids', 'Louvor'], names = ['Ana', 'Lucas', 'Júlia', 'Pedro', 'Rute', 'Marcos', 'Bia', 'Davi', 'Sara', 'João', 'Léo', 'Eva'];
    g.strokeStyle = '#9aa3b0'; g.lineWidth = 0.6;
    for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(6 + i * 25.5, 18); g.lineTo(6 + i * 25.5, 92); g.stroke(); }
    for (let r = 0; r <= 4; r++) { g.beginPath(); g.moveTo(6, 18 + r * 18.5); g.lineTo(108, 18 + r * 18.5); g.stroke(); }
    cols.forEach((c, i) => text(g, c, 18.75 + i * 25.5, 27, 6, '#b3643f'));
    for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) text(g, names[(r * 4 + i) % names.length], 18.75 + i * 25.5, 46 + r * 18.5, 6, r === 1 ? '#c42020' : '#1f4fa8', 'normal');
  });
  add(box(0.02, 0.8, 0.92, M.steel, 16.135, 1.5, 32.5));
  add(box(0.004, 0.74, 0.86, escala, 16.147, 1.5, 32.5, nc));
  cica(19.66, 32.7, 0.33);

  // =====================================================================
  // CIRC. (x 16,05–17,1 · z 33,9–37,0) — só passagem: extintor e sinalização
  // =====================================================================
  extintor(17.025, 36.55, -1);
  const wcSign = texMat(3, (g, W, Hh) => {
    g.fillStyle = '#141416'; g.fillRect(0, 0, W, Hh);
    text(g, 'BANHEIROS', 20, 52, 34, '#f3efe6', 'bold', 'left');
    g.fillStyle = '#c98a3c'; g.beginPath(); g.moveTo(W - 44, 30); g.lineTo(W - 14, 50); g.lineTo(W - 44, 70); g.closePath(); g.fill(); g.fillRect(W - 70, 44, 28, 12);
  });
  plaque('z', 17.018, 36.1, 1.95, 0.42, 0.14, wcSign);

  // =====================================================================
  // DEPÓSITO (x 17,1–20,1 · z 33,9–35,9) — porta em x=17,1 (z 34,6–35,4)
  // =====================================================================
  const shelf = (x, z, w, d, h, levels, ry) => {
    const g = G(), mt = M.steel;
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.035, h, 0.035, graphL, sx * (w / 2 - 0.018), h / 2, sz * (d / 2 - 0.018)));
    for (let i = 0; i < levels; i++) {
      const y = 0.1 + (i * (h - 0.14)) / (levels - 1);
      g.add(box(w, 0.02, d, mt, 0, y, 0));
      let px = -w / 2 + 0.06;
      while (px < w / 2 - 0.2) {
        const bw = 0.2 + rnd() * 0.18, bh = 0.14 + rnd() * 0.16;
        if (px + bw > w / 2 - 0.03) break;
        if (rnd() < 0.82) g.add(box(bw, bh, d * (0.7 + rnd() * 0.2), bins[Math.floor(rnd() * bins.length)], px + bw / 2, y + 0.01 + bh / 2, 0));
        px += bw + 0.04;
      }
    }
    return place(g, x, z, ry);
  };
  shelf(19.72, 34.9, 1.62, 0.42, 2.0, 5, HPI);                                                // estante na parede x=20,1
  shelf(18.72, 35.55, 1.3, 0.4, 1.8, 4, 0);                                                   // estante na parede z=35,9
  const stack = (x, z, n, mat) => {                                                           // cadeiras empilhadas
    const g = G();
    for (let i = 0; i < n; i++) {
      g.add(box(0.44, 0.03, 0.42, mat, 0, 0.45 + i * 0.055, 0.015 * i));
      const b = box(0.42, 0.3, 0.025, mat, 0, 0.72 + i * 0.055, -0.2 + 0.015 * i); b.rotation.x = -0.12; g.add(b);
    }
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.022, 0.45 + n * 0.055, 0.022, black, sx * 0.2, (0.45 + n * 0.055) / 2, sz * 0.18 + 0.008 * n));
    return place(g, x, z, 0);
  };
  stack(17.48, 34.28, 7, graph);
  stack(18.02, 34.28, 6, white);
  for (const [x, y, z, w, h, d] of [[18.78, 0.18, 34.3, 0.5, 0.36, 0.4], [18.78, 0.5, 34.3, 0.42, 0.28, 0.36], [19.22, 0.15, 34.28, 0.34, 0.3, 0.34]]) {
    add(box(w, h, d, cardb, x, y, z));                                                         // caixas de papelão
    add(box(w + 0.004, 0.03, 0.06, std({ color: 0xd8c8a0, roughness: 0.8 }), x, y + h / 2 - 0.01, z, nc)); // fita
  }
  {                                                                                            // ventilador de pé guardado
    const g = G();
    g.add(cyl(0.16, 0.18, 0.04, black, 0, 0.02, 0, 16));
    g.add(cyl(0.015, 0.015, 1.0, M.chrome, 0, 0.52, 0, 8));
    const head = cyl(0.21, 0.21, 0.1, graphL, 0, 1.1, 0, 18); head.rotation.x = HPI; g.add(head);
    g.add(box(0.12, 0.12, 0.12, black, 0, 1.1, -0.1));
    place(g, 17.45, 35.62, 0.3);
  }

  // =====================================================================
  // ÁREA TÉCNICA / SHAFT (x 17,1–20,1 · z 35,9–37,0): quadros e tubulações
  // =====================================================================
  add(box(0.55, 0.8, 0.12, std({ color: 0xc9ccd0, roughness: 0.5, metalness: 0.3 }), 17.75, 1.55, 36.04)); // QDC
  add(box(0.5, 0.003, 0.004, graphL, 17.75, 1.3, 36.102, nc));
  add(box(0.12, 0.08, 0.004, std({ color: 0xf2c200, roughness: 0.6 }), 17.75, 1.8, 36.103, nc)); // aviso de choque
  add(box(0.5, 0.6, 0.25, black, 18.5, 1.7, 36.1));                                           // rack de rede
  add(box(0.004, 0.012, 0.3, ledG, 18.5, 1.75, 36.227, nc)); add(box(0.2, 0.012, 0.004, ledB, 18.5, 1.6, 36.227, nc));
  add(box(2.7, 0.06, 0.12, M.steel, 18.6, 2.72, 36.06));                                       // eletrocalha
  rod(0.018, 1.0, graphL, 17.75, 2.2, 36.04, 'y'); rod(0.018, 0.8, graphL, 18.5, 2.3, 36.1, 'y'); // eletrodutos
  for (const [x, z, r] of [[19.8, 36.7, 0.075], [19.58, 36.75, 0.05], [19.82, 36.42, 0.04]]) rod(r, 2.96, pvc, x, 1.48, z, 'y', 14);
  for (const x of [19.35, 19.42]) { rod(0.028, 2.9, black, x, 1.45, 36.8, 'y', 8); }          // linhas do ar (isoladas)
  rod(0.012, 0.5, copper, 19.35, 0.5, 36.8, 'y'); rod(0.02, 2.5, copper, 19.55, 1.3, 36.3, 'y');
  add(cyl(0.05, 0.05, 0.02, redExt, 19.55, 1.2, 36.24, 12)).rotation.x = HPI;                 // registro
  add(cyl(0.07, 0.07, 0.006, black, 18.9, 0.004, 36.5, 12));                                  // ralo

  // =====================================================================
  // WC MASCULINO (x 17,1–20,1 · z 37,0–40,8) — porta em z=40,8 (x 18,2–19,0)
  // =====================================================================
  cabins(17.175, 19.45, 37.075, 38.45, 2, [false, true]);
  add(box(0.44, 0.14, 0.36, china, 19.73, 0.8, 37.265));                                      // lavatório suspenso
  add(box(0.34, 0.004, 0.24, std({ color: 0xdfe3e6, roughness: 0.2 }), 19.73, 0.872, 37.28, nc));
  add(cyl(0.012, 0.012, 0.16, M.chrome, 19.73, 0.95, 37.12, 8)); add(box(0.02, 0.02, 0.1, M.chrome, 19.73, 1.02, 37.17));
  add(box(0.42, 0.55, 0.01, M.mirror, 19.73, 1.45, 37.083, nc));
  add(box(0.012, 2.1, 2.2, porc, 20.006, 1.05, 39.6));                                        // parede grafite dos mictórios
  for (const z of [38.85, 39.55, 40.25]) urinal(20.0, z);
  for (const z of [39.2, 39.9]) add(box(0.42, 0.85, 0.02, hpl, 19.79, 1.0, z));              // divisórias dos mictórios
  add(cyl(0.14, 0.12, 0.45, M.steel, 17.45, 0.225, 40.45, 14));                               // lixeira
  add(box(0.08, 0.2, 0.13, white, 19.973, 1.12, 37.42));                                      // saboneteira de parede
  add(box(0.004, 0.06, 0.05, graphL, 19.931, 1.07, 37.42, nc));
  { const g = G();                                                                             // secador de mãos
    g.add(box(0.28, 0.34, 0.2, M.steel, 0, 0, 0.1)); g.add(box(0.2, 0.02, 0.1, black, 0, -0.17, 0.12));
    g.add(box(0.03, 0.03, 0.004, ledB, 0.09, 0.12, 0.202, nc));
    place(g, 20.013, 37.95, -HPI, 1.2); }
  add(cyl(0.07, 0.07, 0.006, black, 18.6, 0.004, 39.8, 12));                                 // ralo

  // =====================================================================
  // HALL DOS BANHEIROS (x 16,05–20,1 · z 40,8–44,3 + faixa x 16,05–17,1 · z 37,0–40,8)
  // =====================================================================
  add(box(2.7, 0.04, 0.52, stone, 18.65, 0.86, 43.96));                                       // bancada (granito preto)
  add(box(2.7, 0.16, 0.02, stone, 18.65, 0.76, 43.71));                                       // saia
  add(box(2.7, 0.1, 0.02, stone, 18.65, 0.93, 44.21));                                        // frontão
  add(box(2.6, 0.012, 0.012, ledWb, 18.65, 0.678, 43.73, nc));                                 // LED sob a bancada
  for (const x of [17.64, 18.27, 18.9, 19.53]) {                                              // 4 cubas de apoio
    const b = cyl(0.19, 0.14, 0.12, china, x, 0.94, 43.93, 20); b.scale.set(1.15, 1, 0.85); add(b);
    const w = cyl(0.165, 0.165, 0.004, std({ color: 0xdfe3e6, roughness: 0.2 }), x, 1.001, 43.93, 20); w.scale.set(1.15, 1, 0.85); add(w);
    add(cyl(0.013, 0.013, 0.26, black, x, 1.01, 44.14, 8)); add(box(0.022, 0.022, 0.13, black, x, 1.13, 44.08)); // torneira preta
    add(cyl(0.03, 0.03, 0.14, white, x + 0.26, 0.95, 44.12, 10));                             // saboneteira
  }
  add(box(2.66, 0.96, 0.006, black, 18.65, 1.58, 44.221, nc));                                // espelho com moldura
  add(box(2.6, 0.9, 0.01, M.mirror, 18.65, 1.58, 44.212, nc));
  add(box(2.5, 0.015, 0.015, ledWb, 18.65, 2.045, 44.2, nc));
  { const et = ctx.logo.mesh(0.36, 0.36, { layout: 'mark', color: '#eef2f4', opacity: 0.55, roughness: 0.6, cast: false });   // jateado no espelho
    logoAt(et, 19.72, 1.84, 44.2045, PI); }
  emerg('x', 40.875, 17.55, 2.5, 1);
  add(box(0.1, 0.34, 0.26, white, 19.96, 1.35, 43.2));                                        // papel-toalha
  add(box(0.004, 0.05, 0.16, graphL, 19.908, 1.2, 43.2, nc));
  add(cyl(0.15, 0.13, 0.5, M.steel, 19.8, 0.25, 43.25, 14));                                  // lixeira
  cica(19.66, 41.3, 0.33);
  plaque('x', 40.885, 19.35, 1.6, 0.2, 0.26, picto(false));                                   // placa WC masc.

  // =====================================================================
  // WC FEMININO (x 17,1–20,1 · z 44,3–49,5) + antecâmara x 16,05–17,1
  // Porta em x=17,1 (z 45,0–45,8) → área de giro x 17,1–18,0 livre.
  // =====================================================================
  cabins(18.05, 20.013, 44.375, 45.85, 2, [true, false]);                                     // 2 cabines junto à parede z=44,3
  cabins(17.175, 20.013, 49.413, 47.75, 3, [false, false], 0.08);                             // 3 cabines junto à fachada
  add(box(0.8, 0.3, 0.04, graph, 17.6, 0.8, 44.395));                                         // fraldário
  add(box(0.8, 0.1, 0.46, white, 17.6, 0.9, 44.645));
  add(box(0.7, 0.03, 0.38, amber, 17.6, 0.965, 44.65));
  add(box(0.5, 0.04, 1.5, stone, 19.75, 0.86, 46.75));                                        // bancada com 2 cubas
  add(box(0.02, 0.16, 1.5, stone, 19.51, 0.76, 46.75));
  for (const z of [46.38, 47.12]) {
    const b = cyl(0.17, 0.13, 0.12, china, 19.73, 0.94, z, 20); b.scale.set(0.85, 1, 1.1); add(b);
    const w = cyl(0.145, 0.145, 0.004, std({ color: 0xdfe3e6, roughness: 0.2 }), 19.73, 1.001, z, 20); w.scale.set(0.85, 1, 1.1); add(w);
    add(cyl(0.013, 0.013, 0.26, black, 19.95, 1.01, z, 8)); add(box(0.13, 0.022, 0.022, black, 19.89, 1.13, z));
  }
  add(box(0.012, 2.2, 1.8, porcW, 20.007, 1.1, 46.8));                                         // porcelanato claro atrás das cubas
  add(box(0.006, 0.9, 1.42, black, 19.998, 1.58, 46.75, nc));
  add(box(0.01, 0.84, 1.36, M.mirror, 19.99, 1.58, 46.75, nc));
  add(box(0.004, 0.012, 1.3, ledWb, 19.986, 2.05, 46.75, nc));                                 // LED sobre o espelho
  for (const z of [46.75]) { add(cyl(0.035, 0.035, 0.16, black, 19.9, 0.96, z, 12)); add(cyl(0.012, 0.012, 0.05, M.chrome, 19.9, 1.06, z, 6)); } // sabonete líquido
  { const g = G();                                                                             // vaso com flores na bancada
    g.add(cyl(0.05, 0.04, 0.14, porcW, 0, 0.07, 0, 12));
    for (const [dx, dz, dy, m] of [[0, 0, 0.26, amber], [0.04, 0.02, 0.23, white], [-0.03, 0.03, 0.24, terra], [0.01, -0.04, 0.22, white]]) { g.add(cyl(0.004, 0.004, dy, frond, dx * 0.5, 0.14 + dy / 2 - 0.04, dz * 0.5, 5)); g.add(sph(0.028, m, dx, 0.12 + dy, dz)); }
    place(g, 19.82, 47.38, 0, 0.88); }
  add(cyl(0.07, 0.07, 0.006, black, 18.6, 0.004, 46.8, 12));                                  // ralo
  add(cyl(0.12, 0.1, 0.4, M.steel, 19.8, 0.2, 45.98, 14));                                    // lixeira
  // antecâmara: placa, espelho de corpo inteiro, banco e cica
  plaque('z', 17.018, 46.1, 1.6, 0.2, 0.26, picto(true));
  add(box(0.012, 1.62, 0.62, black, 17.018, 1.2, 46.95));
  add(box(0.008, 1.54, 0.54, M.mirror, 17.009, 1.2, 46.95, nc));
  {
    const g = G();
    for (let i = 0; i < 4; i++) g.add(box(0.075, 0.035, 1.3, woodL, -0.135 + i * 0.09, 0.45, 0));
    for (const sz of [-0.5, 0.5]) { g.add(box(0.38, 0.03, 0.05, black, 0, 0.418, sz)); g.add(box(0.035, 0.42, 0.035, black, -0.16, 0.21, sz)); g.add(box(0.035, 0.42, 0.035, black, 0.16, 0.21, sz)); }
    place(g, 16.4, 47.75, 0);
  }
  cica(16.6, 49.02, 0.32);
}
