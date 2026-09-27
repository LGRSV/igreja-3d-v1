# Brief — Igreja 3D (Base Church, 802 Sul · Palmas-TO)

Especificação comum do modelo. Toda a geometria foi medida na planta de layout do térreo
(Uõma Arquitetura, NOV/2024, escala 1:100) — é aproximada ao ~0,1 m, não é levantamento.
O cartão (`igreja3d-card.js`) é um fork do motor do `casa-chefe` (Three.js r170, cartão Lovelace).

## Sistema de coordenadas (metros)
- **X** cresce para a direita (do muro esquerdo x=0 até o muro direito x=20,1).
- **Z** cresce para a **frente** (fachada e estacionamento ficam em z ≈ 49,7+; os fundos, com o portão de correr, em z = 0).
- **Y** para cima; piso em y = 0.
- Paredes: espessura `T = 0,15` centrada nas linhas abaixo. No modo normal (casinha de boneca, sem teto)
  **todas as paredes têm `H = 3,0 m`**. O botão **Fachada** mostra o grupo externo (`ctx.ext`): paredes altas,
  platibandas, telhados e revestimento da fachada.
- Alturas externas (modo Fachada): bloco Templo + Hall (x 0–16,05 · z 12,4–49,65) = **8,5 m**; ala direita
  (x 16,05–20,1 · z 11,0–49,5) = **4,5 m**; bloco dos fundos (z 0–12,4: almoxarifado, cozinha, recepção, sala pastoral) = **3,6 m**.

## Ambientes (pisos)
| Ambiente | x | z | Obs. |
|---|---|---|---|
| Estacionamento interno (pátio, 2 carros) | 0 – 4,9 | 0 – 12,4 | piso intertravado; portão de correr na parede z=0 (x 0,3–4,7) |
| Pátio (resto da área aberta dos fundos) | 4,9 – 16,05 | 3,9 – 12,4 | exceto jardim interno e recepção |
| Almoxarifado (11,3 m²) | 4,9 – 8,6 | 0 – 3,9 | |
| Cozinha (13,7 m²) | 8,6 – 12,75 | 0 – 3,9 | |
| Jardim interno | 7,5 – 9,45 | 5,8 – 10,2 | grama (+ faixa x 9,45–10,3 · z 9,25–10,2) |
| Recepção (10,5 m²) | 9,45 – 12,75 | 5,9 – 9,25 | |
| Sala Pastoral (48,5 m²) | 12,75 – 20,1 | 0 – 9,25 | em L: sem a caixa d'água e o banheiro (x 17,0–20,1 · z 0–4,9) |
| Caixa d'água | 17,0 – 20,1 | 0 – 3,1 | |
| Banheiro pastoral | 17,0 – 20,1 | 3,1 – 4,9 | |
| Jardim pastoral | 12,75 – 20,1 | 9,25 – 11,0 | grama |
| Corredor (entrada lateral) | 16,05 – 17,1 | 11,0 – 19,0 | |
| Sala Gilvan (8,0 m²) | 17,1 – 20,1 | 11,0 – 14,2 | |
| Administrativo (12,6 m²) | 17,1 – 20,1 | 14,2 – 19,0 | |
| Circulação | 16,05 – 20,1 | 19,0 – 23,3 | + corredor x 18,9–20,1 · z 23,3–28,0 |
| Mídia (13,2 m²) | 16,05 – 18,9 | 23,3 – 28,0 | olha para o templo pela janela J12 |
| Voluntariado (19,8 m²) | 16,05 – 20,1 | 28,0 – 33,9 | |
| Circ. | 16,05 – 17,1 | 33,9 – 37,0 | |
| Depósito (5,3 m²) | 17,1 – 20,1 | 33,9 – 35,9 | |
| Área técnica (shaft) | 17,1 – 20,1 | 35,9 – 37,0 | |
| WC masculino | 17,1 – 20,1 | 37,0 – 40,8 | |
| Hall dos banheiros (18,6 m²) | 16,05 – 20,1 | 40,8 – 44,3 | + faixa x 16,05–17,1 · z 37,0–40,8 |
| WC feminino (13,4 m²) | 16,05 – 20,1 | 44,3 – 49,5 | antecâmara x 16,05–17,1 |
| **Templo (501,7 m²)** | 0 – 16,05 | 12,4 – 44,0 | palco no fundo (z pequeno), plateia virada para −z |
| Hall de entrada (62,7 m²) | 4,0 – 16,05 | 44,0 – 49,65 | escada em x 13,3–16,0 · z 44,4–49,4 |
| WC | 0 – 1,9 | 44,0 – 46,3 | |
| WC PCD | 1,9 – 4,0 | 44,0 – 46,3 | |
| Sala da Família (11,7 m²) | 0 – 4,0 | 46,3 – 49,65 | |
| Jardins frontais | 0,1 – 10,6 e 13,3 – 16,0 | 49,75 – 50,85 | cerca-viva |
| Calçada da frente | −3 – 23 | 49,6 – 51 | intertravado grafite (fora dos jardins) |
| Estacionamento frontal | −3 – 23 | 51 – 60 | intertravado espinha de peixe terracota, vagas PCD |

## Paredes e aberturas (linha de centro)
Tipos de abertura: `door` (0,9×2,1), `window` (peitoril 1,0, topo 2,15), `glass` (vidro até 2,25), `open` (vão), `gate` (portão).
- `wallX(0, 0–20,1)`: gate x 0,3–4,7.
- `wallZ(0, 0–49,65)` e `wallZ(20,1, 0–49,5)` — muros/paredes laterais (divisa).
- `wallX(49,65, 0–16,05)`: window x 0,6–3,2 (família); **glassdoor x 10,9–13,1 = porta principal de vidro (2 folhas pretas, abrem para fora com `binary_sensor` da porta = on)**.
- `wallX(49,5, 16,05–20,1)`: window alta x 17,6–19,6 (WC fem).
- Almoxarifado/cozinha: `wallZ(4,9, 0–3,9)` window z 1,0–2,0 · `wallZ(8,6, 0–3,9)` · `wallX(3,9, 4,9–12,75)` door x 7,5–8,4 (almox.), window x 9,2–10,8, door x 11,6–12,5 (cozinha).
- `wallZ(12,75, 0–9,25)`: door z 8,2–9,1 (recepção → pastoral).
- Recepção: `wallZ(9,45, 5,9–9,25)` · `wallX(5,9, 9,45–12,75)` window x 10,3–11,9.
- `wallX(9,25, 9,45–20,1)`: door x 11,8–12,6 (recepção), door x 12,9–13,8 (pastoral), glass x 14,2–16,6.
- Caixa/banheiro: `wallZ(17,0, 0–4,9)` window z 1,2–2,2, door z 3,4–4,2 · `wallX(3,1, 17,0–20,1)` · `wallX(4,9, 17,0–20,1)`.
- `wallX(11,0, 16,05–20,1)`: door x 16,15–17,0 (PM01, entrada lateral); window x 17,9–19,9 (J13, Gilvan).
- **Templo** `wallX(12,4, 0–16,05)`: glass x 12,9–15,1 (acesso ao backstage).
- **Templo** `wallZ(16,05, 11,0–49,65)`: glass z 19,2–22,6 · window z 23,6–27,7 (J12 da mídia, peitoril 1,1 — termina antes do pilar de z 28,0) · window z 29,9–31,9 · door z 34,2–35,1 (circ.) · open z 44,4–46,0 (hall → banheiros).
- `wallZ(17,1, 11,0–19,0)`: door z 12,9–13,8 (Gilvan), door z 14,4–15,3 (Adm.), window z 16,8–18,3 (J05).
- `wallX(14,2, 17,1–20,1)` · `wallX(19,0, 17,1–20,1)`.
- Mídia: `wallX(23,3, 16,05–18,9)` door x 17,9–18,8 · `wallZ(18,9, 23,3–28,0)`.
- Voluntariado: `wallX(28,0, 16,05–20,1)` door x 19,0–19,9 · `wallX(33,9, 16,05–20,1)` door x 16,2–17,0.
- `wallZ(17,1, 33,9–40,8)` door z 34,6–35,4 (depósito) · `wallX(35,9, 17,1–20,1)` · `wallX(37,0, 17,1–20,1)` · `wallX(40,8, 17,1–20,1)` door x 18,2–19,0 (WC mas.).
- `wallX(44,3, 17,1–20,1)` · `wallZ(17,1, 44,3–49,5)` door z 45,0–45,8 (WC fem.).
- **Templo ↔ Hall** `wallX(44,0, 0–16,05)`: glass x 10,6–13,1 (portas de vidro do templo).
- Família/WCs: `wallZ(1,9, 44,0–46,3)` · `wallZ(4,0, 44,0–49,65)` door z 44,4–45,3 (WC PCD), door z 46,6–47,5 (família) · `wallX(46,3, 0–4,0)` door x 0,5–1,3 (WC).
- Pilares do templo (0,4×0,4, altura 3,05 no modo normal): x = 0 em z = 12,4 · 16,9 · 21,4 · 25,9 · 30,4 · 35,0 · 39,5 · 44,0 (`PILLARS_L`);
  x = 16,05 em z = 12,4 · 18,3 · 23,2 · 28,0 · 33,7 · 39,3 · 44,0 (`PILLARS_R`, como na planta: fora do vidro, das janelas e da porta lateral);
  e em z = 12,4 / 44,0 também em x = 5,4 e 10,5. As listas estão em `ctx.PILLARS_L` / `ctx.PILLARS_R`.
- Paredes externas: pretas por fora, com revestimento branco de 12 mm por dentro (só entre as faces internas das paredes vizinhas).

## Objetos do cartão (ligados a entidades — NÃO recrie nem cubra)
- **Palco**: plataforma x 1,2–14,85 · z 13,4–17,6, topo y = 0,6 (construída pela decoração do palco). Faixa de backstage z 12,55–13,4 atrás do telão.
- **Telão LED** (`telao`, media_player): tela 6,0 × 3,4 m, x 5,0–11,0, y 1,3–4,7, plano em z 13,55 virado para +z.
- **Luzes do palco** (`palco`, RGB): 4 refletores pendurados em y 4,6 em z 16,6, x 3,5 / 6,5 / 9,5 / 12,5 — a treliça que os segura (y ≈ 4,8) é da decoração do palco.
- **Som** (`som`, switch): 2 LEDs de status nas quinas frontais do palco (x 1,5 e 14,55, y 0,65, z 17,5).
- **Ar do templo** (`ac_templo`, climate): 5 splits de parede (0,22 × 0,3 × 0,9) em y 2,55 — (0,2, z 22,1), (0,2, z 29,6), (0,2, z 38,0) (fora dos pilares), (15,85, z 38,6), (15,85, z 41,6).
- **Ar da sala pastoral** (`ac_pastoral`): split em (14,9, 2,4, 0,2) na parede z=0.
- Luminárias pendentes/refletores de cada item (posições na tabela de ITEMS do cartão). Não coloque nada num raio de 0,4 m delas.
  Refletor do letreiro (**sempre visível**, não é mais `ext`): (8,9; 8,05; 50,35), preso ao topo do painel ripado acima do logo.
  Plateia: 10 **pendentes lineares de LED** (2,4 m ao longo de z) em y 5,0, x 4 e 12 (z 19,5 / 25 / 30,5 / 36 / 41,5), pendurados por cabos
  até os **2 trilhos de teto que o próprio cartão cria** (y 6,43, seção 0,06, z ≈ 18,3–42,7, x 4 e 12) — não duplique os trilhos.
  O corredor central (x ≈ 8) fica livre de pendentes: não pendure nada ali acima de 3 m (cortaria as vistas do palco). Feixes de luz (cones aditivos)
  saem dos 4 refletores do palco em direção ao fundo do palco: não ponha peças altas no caminho (x ±1,2 m de cada refletor, z 14–16,6). Arandela do pátio: no muro x = 0 em (0,16; 2,8; 6,2).
- **Calçada** (`calcada`, piso grafite): faixa da frente fora dos jardins e o trecho x 16–23 (z 49,6–51).

## API disponível no `ctx` (igual ao casa-chefe, com extras)
- `ctx.THREE`, `ctx.box(w,h,d,mat,x,y,z,opts)`, `ctx.cyl(rTop,rBot,h,mat,x,y,z,seg,open)`, `ctx.sph(r,mat,x,y,z)`,
  `ctx.place(group,x,z,ry,y)`, `ctx.add(mesh)`, `ctx.std({...})` (materiais com cache), `ctx.rnd()`, `ctx.M` (materiais prontos),
  `ctx.F` (peças prontas: bed, nightstand, wardrobe, desk, officeChair, bookshelf, sofa, diningTable, chair, fridge, stove, hood,
  cabinet, sink, toilet, shower, washbasin, shelves, plant, tree, rug, roundTable, car…), `ctx.ZONES`, `ctx.H` (3,0), `ctx.T`, `ctx.LOT`, `ctx.PILLARS_L`, `ctx.PILLARS_R`.
- **Extras da igreja**: `ctx.ext` (Group do modo Fachada) e `ctx.addExt(mesh)`; `ctx.makeTex(size, drawFn(g2d, size), [rx, ry])`
  → CanvasTexture (use só para letreiro/logo, telas e sinalização); `ctx.SPEC` (constantes de alturas: `H_TEMPLO` 8,5, `H_ALA` 4,5, `H_FUNDOS` 3,6).
- Tudo o que você cria é fundido por material automaticamente (`mergeStatic`), então muitas peças pequenas custam pouco em draw calls,
  mas **não use InstancedMesh** (o merge não entende instâncias) e reaproveite materiais (`ctx.std` com as mesmas opções → mesmo material).
  No merge, materiais simples quase iguais (cor ±22/255, rugosidade/metal ±0,25; sem mapa, transparência nem emissivo) viram um só,
  e materiais **idênticos** com mapa/emissivo/transparência (mesma textura — o mesmo objeto — e mesmas opções) também — por isso
  reaproveite texturas (`ctx.logo.tex` tem cache). Os ligados a `ctx.bindEmissive` nunca são trocados por outro.
  Peças rente ao chão (topo ≤ 0,1 m) com `cast: false` entram no grupo das que projetam sombra do mesmo material (economiza draw call).
  Os pisos das zonas ficam em y = 0,004 e o gramado geral em y = −0,03.

### Logo oficial — `ctx.logo` (use SEMPRE isto; não desenhe o logo à mão)
Uma única função de desenho, com as proporções medidas na foto da fachada: anel espesso (raio externo 0,29, traço 0,046 em
unidades da largura de "BASE") com o "B" bold centrado; "BASE" (altura de maiúscula 0,33) e "CHURCH" logo abaixo (0,235),
as duas palavras com a **mesma largura**. A fonte (Arial/Helvetica/Liberation/Roboto Bold) é medida no canvas e ajustada à
altura/largura exatas, então o resultado é igual em Windows, Android e Linux. Layouts:
`'full'` (anel em cima + BASE/CHURCH; proporção h/w 1,255) · `'mark'` (só anel + B; 1:1) · `'wide'` (anel à esquerda e texto à
direita; h/w 0,40) · `'text'` (só BASE/CHURCH; h/w 0,615).
- `ctx.logo.tex(opts)` → `CanvasTexture` com a proporção do layout, fundo transparente (cache: mesmas opções → mesma textura).
  opts: `{ layout, color ('#f4f5f7' ou 0xRRGGBB), bg (cor de fundo; padrão transparente), glow (0–1: halo desfocado p/ LED/neon),
  size (px da maior dimensão, 1024), pad (margem) }`. `tex.userData.aspect` = altura/largura.
- `ctx.logo.mesh(w, h, opts)` → `Mesh` plano **virado para +z**, centro na origem (sem `h`, sai da proporção). Já vem com
  `alphaTest 0,5` (ou `transparent` se `opacity < 1`) e `polygonOffset` (cole a 2–5 mm da parede/piso sem z-fighting).
  opts extras: `{ emissive (intensidade; 0 = sem brilho), emissiveColor, roughness, metalness, envMapIntensity, opacity, side, offset (false desliga o polygonOffset), cast }`.
- `ctx.logo.relief(w, opts)` → `Group` de **letras caixa** (camadas empilhadas: laterais cinza + face prateada), largura w,
  virado para +z, **fundo em z = 0** (encoste na parede e posicione o grupo), centro em x = y = 0. Altura = `w × aspect`.
  opts: `{ layout, depth (0,08), layers (4), color (face 0xf4f5f7), sideColor (0x8a8d92), drop ([dx, dy] da lateral), emissive, emissiveColor, metalness, roughness }`.
  `group.userData.face` = material da face (para ligar o brilho à entidade), `userData.w/h` = medidas.
- `ctx.logo.draw(g2d, x, y, w, { layout, color, weight })` desenha num canvas seu (canto superior esquerdo, largura w px;
  devolve a altura) e `ctx.logo.aspect(layout)` dá h/w — para telas/cartazes que misturam logo e texto. `ctx.logo.font` = pilha de fontes.
- O telão (`_drawTelao`) usa a mesma função: parado mostra o logo completo; tocando, a marca + o título + "BASE MUSIC".

Exemplos:
```js
// letreiro da fachada: BASE com ~75 % da largura do painel ripado (3,46 m), acende com a luz 'fachada'
const L = ctx.logo.relief(2.6, { depth: 0.08 }); L.position.set(8.93, 5.25, 49.83); ctx.add(L);
ctx.bindEmissive('fachada', L.userData.face, 0.9);
const halo = ctx.glowPlane(3.9, 3.9, 'fachada', { color: 0xfff1dc, base: 0.45 }); halo.position.set(8.93, 5.25, 49.895); ctx.add(halo);
// logo em LED acima do telão, aceso com o palco
const led = ctx.logo.mesh(1.2, 0, { layout: 'mark', emissive: 1.2 }); led.position.set(8.0, 5.75, 13.5); ctx.add(led);
ctx.bindEmissive('palco', led.material, 1.2);
// adesivo jateado na porta de vidro (x 11,2, virado para +z)
const ad = ctx.logo.mesh(0.45, 0.45, { layout: 'mark', opacity: 0.7, cast: false }); ad.position.set(11.2, 1.45, 44.09); ctx.add(ad);
// capacho: logo claro em fundo grafite, deitado no piso
const cap = ctx.logo.mesh(2.0, 0, { layout: 'wide', color: '#d9d4ca', bg: '#1a1a1c', pad: 0.12 });   // h = 2,0 × proporção (não estique)
cap.rotation.x = -Math.PI / 2; cap.position.set(12.0, 0.012, 48.9); ctx.add(cap);
```

### Brilho ligado às entidades
- `ctx.bindEmissive(key, material, max = 1, { min = 0,08 })` → o `emissiveIntensity` do material passa a seguir a entidade:
  `max × (min + (1 − min) × nível)` (nível 0–1, com o fade e o brilho da luz). Vale depois do merge (o material é o mesmo).
  Use em LEDs de palco (`'palco'`), status do som (`'som'`), letreiros (`'fachada'`), telas de TV etc. Material com `emissive` ≠ preto.
- `ctx.glowPlane(w, h, key, { color, base = 0,45, day = 0,35, tex: 'glow' | 'frame' })` → plano aditivo (bloom barato) virado
  para +z que acende com a entidade (opacidade `nível × base`, × `day` de dia). `'frame'` = moldura vazada (halo em volta de telas).
  Planos da mesma entidade com as mesmas opções (`color`, `base`, `day`, `tex`) compartilham o material e são fundidos num
  draw call; o cartão acende/apaga pelo material. Posicione e `ctx.add`.
- `ctx.TEX` = texturas prontas do cartão (`TEX.glow`, `TEX.wood`, `TEX.tileGray`…) — reaproveite em vez de criar outra.

### Renderização (o que mudou e cuidados)
- Tone mapping **Neutral**, exposição 1,0 (antes ACES 1,15): as cores saem como você escreve — um branco 0xffffff estoura menos,
  pretos ficam pretos, e cores saturadas continuam saturadas. Não "compense" clareando materiais.
- De dia há menos luz ambiente chapada (hemisfério 0,85, ambiente 0,12) e mais reflexo do céu (environment 0,9): metal/cromo e
  vidro refletem mais. `M.glass` agora é Standard com `envMapIntensity 1,6` (reflete em ângulo rasante); `M.glassDark` é vidro fumê.
- `M.wallDark` (preto da fachada/muros) tem **juntas de painel** em espaço de mundo (verticais a cada 1,25 m, horizontais a cada
  3 m) e não é unificado com outros pretos no merge. Para preto liso use `ctx.std({ color: 0x1a1a1c })`.
- **Orçamento de GPU**: os materiais PBR já usam ~250 vetores de uniform e 13 samplers (26 luzes + 9 sombras). Nos pisos/decoração,
  **no máximo 2 mapas por material** (ex.: `map` + `bumpMap`); nada de `normalMap`/`roughnessMap` grandes. Emissivos e texturas de
  canvas ficam fora do merge: prefira compartilhar a mesma textura/material.
- Rótulos: tamanho fixo na tela, somem perto da câmera e, de longe, só os ambientes principais aparecem.

## Regras para as funções de decoração
1. Escreva APENAS `function room<Nome>(ctx) { … }` no seu arquivo `rooms/<arquivo>.js` (sem import/export, sem código fora da função,
   sem `console.log`). ES2020 válido. Builders locais dentro da função.
2. Só primitivas; nada de fetch, texturas externas ou luzes (PointLight/SpotLight) — o cartão cuida da iluminação.
3. Mantenha móveis ≥ 0,08 m das paredes, fora do vão das portas (largura + 0,9 m) e fora dos objetos do cartão acima.
4. Vidro/objetos finos: `{ cast: false }`.
5. Estilo: igreja evangélica contemporânea — preto, madeira clara (ripado), branco, cinza grafite; acentos em âmbar/terracota.
   Coerente com a foto da fachada (bloco preto, painel ripado de madeira clara com o logo "B" e "BASE CHURCH", porta de vidro com
   caixilho preto, palmeiras cicas em vasos pretos, cerca-viva, estacionamento de intertravado terracota em espinha de peixe).
