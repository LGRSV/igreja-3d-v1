function roomTemploPlateia(ctx) {
  // ---------------------------------------------------------------------------
  // TEMPLO — PLATEIA + COBERTURA APARENTE (x 0–16,05 · z 12,4–44,0), fiel às fotos/vídeos v6–v8.
  // CORREÇÃO DO CLIENTE: o palco fica na parede lateral longa x = 0 (x 0,15–5,0 · z 19,6–36,6);
  // a plateia olha para −x e a mídia (visor na parede x = 16,05) fica de frente para o palco.
  // Visual real: paredes pretas e porcelanato cinza polido (o cartão cria). As tesouras metálicas BRANCAS
  // das fotos foram retiradas a pedido do cliente (a vista de cima fica limpa; as luminárias ficam suspensas).
  // · Cadeiras pretas estofadas de encosto alto (estrutura de aço preto), 414 lugares em 4 blocos:
  //   2 centrais retos de 12 × 10 (corredor central de 1,76 m em z ≈ 28,1, alinhado com o centro do palco)
  //   e 2 das pontas levemente angulados (≈ 8,6°) para o centro; corredores laterais que recebem as
  //   escadas do palco (frente, z ≈ 19,3–20,9; a da ponta z alto fica na lateral do palco), corredores junto às paredes z = 12,4 / 44 e passagem
  //   de ~1,25 m ao longo da parede x = 16,05 (porta preta de correr, visor da mídia), como em v7/v8.
  //   (≈ 500 não cabem com essas passagens: 8,5 m de fundo × 10 fileiras de 0,85 m.)
  // · Cobertura: SEM as tesouras/terças brancas e sem hastes/correntes (pedido do cliente): os high-bays do
  //   cartão (y 7,2) e a 2ª treliça de luz (preta) sobre a plateia ficam suspensos no lugar; ficam os
  //   pilares/perfis pretos na parede do palco (módulos z 13,5 / 18,5 / 23,5 / 28,5 / 33,5 / 38,5 / 43,3), vigas
  //   e o cordão de lampadinhas quentes nos beirais. No modo Fachada a cobertura interna some.
  // · Paredes: perfis pretos, extintores vermelhos com placa, placas de SAÍDA verdes (acesas),
  //   placa vermelha "SAÍDA DE EMERGÊNCIA" sobre a porta preta de correr (cartão) e folhas pretas de
  //   correr (abertas) na saída de vidro da parede z = 12,4.
  // Sem luzes reais e sem InstancedMesh: as peças repetidas são fundidas aqui mesmo, uma malha por
  // material (as cadeiras viram 2 malhas). Nada do cartão é recriado nem coberto.
  // ---------------------------------------------------------------------------
  const THREE = ctx.THREE, M = ctx.M;
  const std = (o) => ctx.std(o);

  // ---- materiais (mesmas opções → mesmo material → menos draw calls) ----
  const chairFrame = std({ color: 0x121214, roughness: 0.42, metalness: 0.55 });   // aço preto das cadeiras
  const uphol      = std({ color: 0x1f2023, roughness: 0.96 });                     // tecido preto estofado
  const steelBlk   = std({ color: 0x0d0d0f, roughness: 0.38, metalness: 0.55 });   // pilares, vigas, perfis, treliça de luz
  const redExt     = std({ color: 0xc4201b, roughness: 0.3, metalness: 0.1 });
  const blackPl    = std({ color: 0x1a1a1c, roughness: 0.55 });                     // válvula/mangueira, carcaças
  const doorBlack  = std({ color: 0x19191b, roughness: 0.5, metalness: 0.15 });     // folhas pretas de correr
  const chrome     = M.chrome;
  // lampadinhas quentes do beiral (acendem com a plateia; ficam num mínimo aceso como nos vídeos)
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffe2b0, emissive: 0xffb45a, emissiveIntensity: 0, roughness: 0.4 });
  ctx.bindEmissive('plateia', bulbMat, 2.4, { min: 0.3 });
  // lentes dos moving heads da treliça da plateia (acendem com o palco)
  const lensMat = new THREE.MeshStandardMaterial({ color: 0x10141c, emissive: 0xfff0e0, emissiveIntensity: 0, roughness: 0.1, metalness: 0.3 });
  ctx.bindEmissive('palco', lensMat, 1.6, { min: 0.0 });

  // ---- placas (texturas de canvas, uma por tipo) ----
  // desenha num canvas quadrado que será esticado num plano w × h: escala o eixo y para não distorcer
  const signTex = (w, h, draw) => ctx.makeTex(256, (g, S) => { g.save(); g.scale(1, w / h); draw(g, S, S * h / w); g.restore(); });
  const texExit = signTex(0.4, 0.15, (g, W, H) => {                    // SAÍDA verde com homem correndo e seta
    g.fillStyle = '#0c8a3e'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#e9fff1'; g.lineWidth = 2; g.strokeRect(3, 3, W - 6, H - 6);
    g.fillStyle = '#ffffff'; g.font = `bold ${Math.round(H * 0.5)}px Arial, Helvetica, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('SAÍDA', W * 0.58, H * 0.54);
    const cx = W * 0.14, cy = H * 0.5, k = H / 60;                     // pictograma (cabeça + corpo em traços)
    g.beginPath(); g.arc(cx + 4 * k, cy - 17 * k, 5 * k, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#ffffff'; g.lineWidth = 5 * k; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx + 2 * k, cy - 9 * k); g.lineTo(cx - 3 * k, cy + 6 * k); g.lineTo(cx + 7 * k, cy + 19 * k);
    g.moveTo(cx - 3 * k, cy + 6 * k); g.lineTo(cx - 12 * k, cy + 18 * k);
    g.moveTo(cx - 10 * k, cy - 3 * k); g.lineTo(cx + 1 * k, cy - 7 * k); g.lineTo(cx + 10 * k, cy + 1 * k); g.stroke();
    g.beginPath(); g.moveTo(W * 0.86, cy - 9 * k); g.lineTo(W * 0.95, cy); g.lineTo(W * 0.86, cy + 9 * k); g.closePath(); g.fill();
    g.fillRect(W * 0.8, cy - 3 * k, W * 0.07, 6 * k);
  });
  const texEmerg = signTex(0.62, 0.17, (g, W, H) => {                  // placa vermelha "SAÍDA DE EMERGÊNCIA" (v7)
    g.fillStyle = '#c21d1d'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `bold ${Math.round(H * 0.34)}px Arial, Helvetica, sans-serif`; g.fillText('SAÍDA DE', W / 2, H * 0.3);
    g.font = `bold ${Math.round(H * 0.3)}px Arial, Helvetica, sans-serif`; g.fillText('EMERGÊNCIA', W / 2, H * 0.72);
  });
  const texExt = signTex(0.2, 0.28, (g, W, H) => {                     // placa do extintor (vermelha, pictograma branco)
    g.fillStyle = '#c8201c'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#ffffff'; const k = W / 100;
    g.fillRect(40 * k, 34 * k, 22 * k, 62 * k);                         // cilindro
    g.beginPath(); g.arc(51 * k, 34 * k, 11 * k, Math.PI, 0); g.fill();
    g.fillRect(46 * k, 16 * k, 10 * k, 9 * k); g.fillRect(40 * k, 12 * k, 26 * k, 5 * k);   // válvula + gatilho
    g.lineWidth = 4 * k; g.strokeStyle = '#ffffff'; g.beginPath(); g.moveTo(58 * k, 18 * k); g.quadraticCurveTo(80 * k, 22 * k, 74 * k, 60 * k); g.stroke();
    g.beginPath(); g.moveTo(20 * k, 104 * k); g.quadraticCurveTo(12 * k, 88 * k, 22 * k, 74 * k); g.quadraticCurveTo(24 * k, 86 * k, 30 * k, 88 * k);
    g.quadraticCurveTo(28 * k, 76 * k, 34 * k, 68 * k); g.quadraticCurveTo(36 * k, 96 * k, 34 * k, 104 * k); g.closePath(); g.fill();   // chama
    g.font = `bold ${Math.round(13 * k)}px Arial, Helvetica, sans-serif`; g.textAlign = 'center'; g.fillText('EXTINTOR', 50 * k, 124 * k);
  });
  const signMat = (tex, glow) => new THREE.MeshStandardMaterial({ map: tex, color: 0xffffff, roughness: 0.5,
    emissive: glow ? 0xffffff : 0x000000, emissiveMap: glow ? tex : null, emissiveIntensity: glow ? 0.55 : 0 });
  const exitMat = signMat(texExit, true), emergMat = signMat(texEmerg, false), extSignMat = signMat(texExt, false);

  // ---- fusão local: peças repetidas viram UMA malha por material ----
  const ONE = new THREE.Vector3(1, 1, 1), UP = new THREE.Vector3(0, 1, 0);
  const batches = [];
  const batch = (mat, cast = true, parent = null) => { const b = { mat, cast, parent, items: [] }; batches.push(b); return b; };
  const geoCache = new Map();
  const boxGeo = (w, h, d) => { const k = `b${w.toFixed(4)},${h.toFixed(4)},${d.toFixed(4)}`; let g = geoCache.get(k); if (!g) { g = new THREE.BoxGeometry(w, h, d); geoCache.set(k, g); } return g; };
  const cylGeo = (r, h, seg = 8) => { const k = `c${r.toFixed(4)},${h.toFixed(4)},${seg}`; let g = geoCache.get(k); if (!g) { g = new THREE.CylinderGeometry(r, r, h, seg); geoCache.set(k, g); } return g; };
  const sphGeo = (r) => { const k = `s${r}`; let g = geoCache.get(k); if (!g) { g = new THREE.SphereGeometry(r, 8, 6); geoCache.set(k, g); } return g; };
  const planeGeo = (w, h) => { const k = `p${w},${h}`; let g = geoCache.get(k); if (!g) { g = new THREE.PlaneGeometry(w, h); geoCache.set(k, g); } return g; };
  const mat4 = (x, y, z, rx = 0, ry = 0, rz = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), ONE);
  const put = (b, geo, m, P) => { if (P) m.premultiply(P); b.items.push([geo, m]); };
  const bx = (b, w, h, d, x, y, z, rx = 0, ry = 0, rz = 0, P = null) => put(b, boxGeo(w, h, d), mat4(x, y, z, rx, ry, rz), P);
  const cy = (b, r, h, x, y, z, rx = 0, ry = 0, rz = 0, seg = 8, P = null) => put(b, cylGeo(r, h, seg), mat4(x, y, z, rx, ry, rz), P);
  const pl = (b, w, h, x, y, z, ry) => put(b, planeGeo(w, h), mat4(x, y, z, 0, ry, 0));
  // barra entre dois pontos (quadrada, ou redonda com round = true)
  const bar = (b, a, c, t, round = false, P = null) => {
    const va = new THREE.Vector3(a[0], a[1], a[2]), vc = new THREE.Vector3(c[0], c[1], c[2]);
    const d = vc.clone().sub(va), L = d.length();
    const m = new THREE.Matrix4().compose(va.clone().add(vc).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()), ONE);
    put(b, round ? cylGeo(t, L, 6) : boxGeo(t, L, t), m, P);
  };
  const flush = () => {
    const n3 = new THREE.Matrix3();
    for (const b of batches) {
      if (!b.items.length) continue;
      let total = 0;
      for (const [g] of b.items) total += g.index ? g.index.count : g.attributes.position.count;
      const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), uv = new Float32Array(total * 2);
      let off = 0;
      for (const [g, m] of b.items) {
        n3.getNormalMatrix(m);
        const e = m.elements, q = n3.elements, P = g.attributes.position.array, N = g.attributes.normal.array, U = g.attributes.uv.array, idx = g.index;
        const n = idx ? idx.count : P.length / 3;
        for (let k = 0; k < n; k++) {
          const i = idx ? idx.getX(k) : k, j = (off + k) * 3;
          const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
          pos[j] = e[0] * x + e[4] * y + e[8] * z + e[12]; pos[j + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]; pos[j + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
          const a = N[i * 3], bb = N[i * 3 + 1], c = N[i * 3 + 2];
          let nx = q[0] * a + q[3] * bb + q[6] * c, ny = q[1] * a + q[4] * bb + q[7] * c, nz = q[2] * a + q[5] * bb + q[8] * c;
          const l = Math.hypot(nx, ny, nz) || 1; nor[j] = nx / l; nor[j + 1] = ny / l; nor[j + 2] = nz / l;
          uv[(off + k) * 2] = U[i * 2]; uv[(off + k) * 2 + 1] = U[i * 2 + 1];
        }
        off += n;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, b.mat); mesh.castShadow = b.cast; mesh.receiveShadow = true;
      if (b.parent) { mesh.matrixAutoUpdate = false; mesh.updateMatrix(); b.parent.add(mesh); } else ctx.add(mesh);
    }
    for (const g of geoCache.values()) g.dispose();
  };

  // Faces internas das paredes do templo (revestimento preto do cartão a 0,087 m do eixo)
  const FX0 = 0.087, FX1 = 16.05 - 0.087, FZ0 = 12.4 + 0.087, FZ1 = 44.0 - 0.087;

  // =====================================================================================
  // 1) CADEIRAS — pretas, estofadas, encosto alto, estrutura de aço preto (v6/v8, foto do templo)
  //    Local: assento centrado na origem, virada para −x (para o palco). 8 peças por cadeira.
  // =====================================================================================
  const bSeat = batch(uphol), bFrame = batch(chairFrame);
  const chair = (x, z, yaw) => {
    const P = mat4(x, 0, z, 0, yaw, 0);
    bx(bSeat, 0.46, 0.085, 0.47, -0.01, 0.465, 0, 0, 0, 0, P);                 // assento
    bx(bSeat, 0.062, 0.6, 0.47, 0.262, 0.865, 0, 0, 0, -0.12, P);               // encosto alto, levemente reclinado
    for (const s of [-1, 1]) {
      bx(bFrame, 0.022, 0.43, 0.022, -0.19, 0.215, s * 0.215, 0, 0, 0, P);     // pé dianteiro
      bx(bFrame, 0.022, 0.47, 0.022, 0.235, 0.235, s * 0.215, 0, 0, 0.09, P);  // pé traseiro (abre para trás)
      bx(bFrame, 0.42, 0.018, 0.018, 0.02, 0.11, s * 0.215, 0, 0, 0, P);        // travessa lateral
    }
    bx(bFrame, 0.02, 0.02, 0.43, -0.19, 0.12, 0, 0, 0, 0, P);                  // travessa dianteira
  };
  // Footprint local da cadeira: x −0,23…+0,35 (encosto), z ±0,245
  const FOOT = [[-0.23, -0.245], [-0.23, 0.245], [0.35, -0.245], [0.35, 0.245]];
  const fits = (x, z, yaw, zMin, zMax) => FOOT.every(([u, v]) => {
    const wx = x + u * Math.cos(yaw) + v * Math.sin(yaw), wz = z - u * Math.sin(yaw) + v * Math.cos(yaw);
    return wx >= 5.75 && wx <= 14.72 && wz >= zMin && wz <= zMax;
  });
  const RP = 0.85, SP = 0.53, ROWS = 10, X0 = 6.62;    // passo entre fileiras, entre cadeiras, nº de fileiras, 1ª fileira
  let seats = 0;
  // Blocos centrais (retos): 12 cadeiras × 10 fileiras cada, corredor central de 1,76 m (z 27,22–28,98);
  // os corredores laterais (z ≈ 19,3–20,9 e 35,3–36,9) recebem as escadas das pontas do palco
  for (const zc of [21.145, 29.225]) {
    for (let r = 0; r < ROWS; r++) for (let s = 0; s < 12; s++) { chair(X0 + r * RP, zc + s * SP, 0); seats++; }
  }
  // Blocos das pontas: levemente angulados para o centro (≈ 8,6°), fileiras recortadas pelos corredores
  // laterais (parede z = 12,4 com a porta de vidro; parede z = 44 com o acesso do hall)
  const AN = 0.15;
  for (const [sg, px, pz, zMin, zMax] of [[1, 6.5, 19.0, 13.72, 19.3], [-1, 6.5, 37.2, 36.9, 42.55]]) {
    const a = AN * sg, ca = Math.cos(a), sa = Math.sin(a);
    for (let r = 0; r < ROWS + 1; r++) for (let s = 0; s < 13; s++) {
      const x = px + r * RP * ca - s * SP * sa * sg, z = pz - r * RP * sa - s * SP * ca * sg;
      if (fits(x, z, a, zMin, zMax)) { chair(x, z, a); seats++; }
    }
  }

  // =====================================================================================
  // 2) COBERTURA APARENTE — grupo à parte que some no modo Fachada (o telhado de lá é mais baixo)
  // =====================================================================================
  const cover = new THREE.Group(); cover.name = 'templo-cobertura'; cover.userData.keep = true;
  let coverOn = true;
  Object.defineProperty(cover, 'visible', { configurable: true, get: () => coverOn && !(ctx.ext && ctx.ext.visible), set: (v) => { coverOn = !!v; } });
  ctx.add(cover);
  const bBlk = batch(steelBlk, true, cover), bBulb = batch(bulbMat, false, cover);
  const bLens = batch(lensMat, false, cover), bCable = batch(blackPl, false, cover);

  // Estrutura: as tesouras brancas e os pilares/vigas da lateral x = 16,05 saíram; ficam os perfis da parede do palco

  // Pilares/perfis pretos na parede do palco (x = 0, 8,5 m). Nos trechos do telão e das telas brancas
  // só há tocos acima da viga (y ≥ 6,95); ao lado do telão os perfis nascem no piso do palco (y 1,0).
  const PC = FX0 + 0.08;
  for (const [z, y0, y1] of [[13.5, 0, 8.6], [18.5, 0, 8.6], [23.55, 1.0, 8.6], [28.5, 6.95, 8.6], [32.65, 1.0, 6.8],
    [33.5, 6.95, 8.6], [38.5, 0, 8.6], [43.3, 0, 8.6]]) bx(bBlk, 0.16, y1 - y0, 0.24, FX0 + 0.08, (y0 + y1) / 2, z);
  bx(bBlk, 0.12, 0.15, FZ1 - FZ0 - 0.02, FX0 + 0.06, 6.875, (FZ0 + FZ1) / 2);   // viga horizontal preta (~7 m)
  bx(bBlk, 0.2, 0.12, FZ1 - FZ0, 0.1, 8.56, (FZ0 + FZ1) / 2);                    // frechal no topo da parede alta
  // Lateral x = 16,05: os pilares pretos acima da parede de 3 m e as 2 vigas saíram (pedido do cliente); o cordão de
  // lampadinhas desse lado fica suspenso no mesmo lugar

  // Cordão de lampadinhas quentes nos dois beirais (v6/v8)
  for (const [x, y] of [[0.26, 8.3], [15.86, 8.3]]) {
    bx(bCable, 0.012, 0.012, FZ1 - FZ0 - 0.3, x, y + 0.05, (FZ0 + FZ1) / 2);
    for (let z = FZ0 + 0.3; z <= FZ1 - 0.25; z += 0.62) put(bBulb, sphGeo(0.036), mat4(x, y, z));
  }

  // 2ª treliça de luz (preta, box truss 0,3 × 0,3) sobre a plateia, paralela ao palco, suspensa (sem correntes)
  const LX = 5.55, LY0 = 6.72, LY1 = 7.0, LZ0 = 19.9, LZ1 = 36.3, LH = 0.14;
  for (const dx of [-LH, LH]) for (const y of [LY0, LY1]) bar(bBlk, [LX + dx, y, LZ0], [LX + dx, y, LZ1], 0.024, true);
  const NL = Math.round((LZ1 - LZ0) / 0.5), dzl = (LZ1 - LZ0) / NL;
  for (let i = 0; i < NL; i++) {
    const za = LZ0 + i * dzl, zb = za + dzl, f = i % 2;
    bar(bBlk, [LX - LH, f ? LY0 : LY1, za], [LX - LH, f ? LY1 : LY0, zb], 0.016);   // face do palco
    bar(bBlk, [LX + LH, f ? LY0 : LY1, za], [LX + LH, f ? LY1 : LY0, zb], 0.016);   // face da plateia
    bar(bBlk, [f ? LX - LH : LX + LH, LY0, za], [f ? LX + LH : LX - LH, LY0, zb], 0.016);
    bar(bBlk, [f ? LX - LH : LX + LH, LY1, za], [f ? LX + LH : LX - LH, LY1, zb], 0.016);
  }
  for (const z of [LZ0, LZ1]) { bar(bBlk, [LX - LH, LY0, z], [LX + LH, LY0, z], 0.02); bar(bBlk, [LX - LH, LY1, z], [LX + LH, LY1, z], 0.02); bar(bBlk, [LX - LH, LY0, z], [LX - LH, LY1, z], 0.02); bar(bBlk, [LX + LH, LY0, z], [LX + LH, LY1, z], 0.02); }
  // moving heads e pares pendurados, mirando o palco (−x) e para baixo
  const tilt = 0.75;   // inclinação do eixo do refletor (rad a partir da vertical para −x)
  for (const z of [21.2, 24.4, 27.1, 29.1, 31.8, 35.0]) {
    bx(bBlk, 0.1, 0.06, 0.1, LX, LY0 - 0.05, z);                       // grampo
    bx(bBlk, 0.3, 0.13, 0.26, LX, LY0 - 0.15, z);                      // base
    for (const s of [-1, 1]) bx(bBlk, 0.05, 0.28, 0.04, LX, LY0 - 0.34, z + s * 0.15);   // garfo
    const hx = LX, hy = LY0 - 0.42;
    cy(bBlk, 0.12, 0.3, hx, hy, z, 0, 0, -tilt, 12);                   // cabeça
    const lx = hx - Math.sin(tilt) * 0.155, ly = hy - Math.cos(tilt) * 0.155;
    cy(bLens, 0.09, 0.012, lx, ly, z, 0, 0, -tilt, 16);                // lente
  }
  for (const z of [22.8, 25.8, 30.4, 33.4]) {
    bx(bBlk, 0.05, 0.14, 0.04, LX - LH, LY0 - 0.09, z);
    cy(bBlk, 0.085, 0.26, LX - LH, LY0 - 0.26, z, 0, 0, -0.6, 10);    // par LED
    cy(bLens, 0.07, 0.01, LX - LH - Math.sin(0.6) * 0.13, LY0 - 0.26 - Math.cos(0.6) * 0.13, z, 0, 0, -0.6, 12);
  }

  // =====================================================================================
  // 3) PAREDES — extintores com placa, placas de saída, folhas pretas de correr
  // =====================================================================================
  const bRed = batch(redExt), bPl = batch(blackPl), bDoor = batch(doorBlack), bChrome = batch(chrome, false);
  const bExit = batch(exitMat, false), bEmerg = batch(emergMat, false), bExtSign = batch(extSignMat, false);
  // parede: 'x0' (face x = 0,087, olha +x), 'x1' (face 15,963, olha −x), 'z0' (face 12,487, olha +z), 'z1' (face 43,913, olha −z)
  const WALL = { x0: [1, 0, Math.PI / 2], x1: [-1, 0, -Math.PI / 2], z0: [0, 1, 0], z1: [0, -1, Math.PI] };
  const onWall = (w, t, off) => (w === 'x0' ? [FX0 + off, t] : w === 'x1' ? [FX1 - off, t] : w === 'z0' ? [t, FZ0 + off] : [t, FZ1 - off]);
  const extintor = (w, t) => {
    const [nx, nz, ry] = WALL[w];
    const [cx, cz] = onWall(w, t, 0.1), [px, pz] = onWall(w, t, 0.01), [sx, sz] = onWall(w, t, 0.004);
    bx(bPl, 0.12, 0.14, 0.02, px, 1.28, pz, 0, ry, 0);                 // suporte na parede
    cy(bRed, 0.085, 0.5, cx, 1.05, cz, 0, 0, 0, 14);                    // cilindro (topo 1,30)
    cy(bRed, 0.06, 0.04, cx, 1.32, cz, 0, 0, 0, 10);
    cy(bPl, 0.028, 0.08, cx, 1.38, cz, 0, 0, 0, 8);                     // válvula
    bx(bPl, 0.14, 0.02, 0.03, cx, 1.43, cz, 0, ry, 0);                  // gatilho
    bar(bPl, [cx + nz * 0.07, 1.37, cz + nx * 0.07], [cx + nz * 0.1 + nx * 0.05, 0.95, cz + nx * 0.1 + nz * 0.05], 0.012, true);   // mangueira
    pl(bExtSign, 0.2, 0.28, sx, 1.85, sz, ry);                          // placa acima (v6_12, v7_01)
  };
  // parede x = 16,05 (fora do vidro z 19,2–22,6, visor 23,6–28,4, janela 29,9–31,9, porta 34,2–35,1 + trilho até 36,0)
  extintor('x1', 17.3); extintor('x1', 29.3); extintor('x1', 36.7);
  // parede do hall (z = 44): dos dois lados do acesso de vidro x 10,6–13,1 (pilar em x 10,5)
  extintor('z1', 9.8); extintor('z1', 13.75);
  // parede z = 12,4 e parede do palco, fora do palco e das escadas
  extintor('z0', 9.8); extintor('z0', 4.6);
  extintor('x0', 15.0); extintor('x0', 42.0);

  // Placas de SAÍDA verdes (acesas) sobre as saídas; placa vermelha sobre a porta preta de correr (cartão)
  { const [x, z] = onWall('z1', 11.85, 0.006); pl(bExit, 0.4, 0.15, x, 2.62, z, WALL.z1[2]); }
  { const [x, z] = onWall('z0', 14.0, 0.006); pl(bExit, 0.4, 0.15, x, 2.66, z, WALL.z0[2]); }
  { const [x, z] = onWall('x1', 34.65, 0.006); pl(bEmerg, 0.62, 0.17, x, 2.55, z, WALL.x1[2]); }

  // Saída de vidro da parede z = 12,4 (x 12,9–15,1): 2 folhas pretas de correr, abertas (estacionadas à
  // esquerda, x 11,6–12,75) + trilho aparente acima do vão (termina antes do pilar de x = 16,05)
  for (const [x, z] of [[12.17, FZ0 + 0.075], [12.2, FZ0 + 0.125]]) {
    bx(bDoor, 1.15, 2.2, 0.04, x, 1.13, z);
    bx(bChrome, 0.02, 0.5, 0.025, x + 0.5, 1.05, z + 0.035, 0, 0, 0);  // puxador
  }
  bx(bPl, 3.7, 0.07, 0.07, 13.4, 2.36, FZ0 + 0.1);                       // trilho
  for (const x of [11.7, 13.4, 15.1]) bx(bPl, 0.05, 0.05, 0.1, x, 2.36, FZ0 + 0.05);

  flush();
}
