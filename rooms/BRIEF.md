# Brief — Igreja 3D (Base Church, 802 Sul · Palmas-TO)

Especificação comum do modelo. Toda a geometria foi medida na planta de layout do térreo
(Uõma Arquitetura, NOV/2024, escala 1:100) — é aproximada ao ~0,1 m, não é levantamento.
O cartão (`igreja3d-card.js`) é um fork do motor do `casa-chefe` (Three.js r170, cartão Lovelace).

## Sistema de coordenadas (metros)
- **X** cresce para a direita (do muro esquerdo x=0 até o muro direito x=20,1).
- **Z** cresce para a **frente** (fachada e estacionamento ficam em z ≈ 49,7+; os fundos, com o portão de correr, em z = 0).
- **Y** para cima; piso em y = 0.
- Paredes: espessura `T = 0,15` centrada nas linhas abaixo. No modo normal (casinha de boneca, sem teto)
  as paredes têm `H = 3,0 m`, **exceto a parede do palco** (divisa x = 0 no trecho do templo, z 12,4–44,0), que o cartão
  já cria com **8,5 m, preta por dentro** (é o fundo do palco). O botão **Fachada** mostra o grupo externo (`ctx.ext`):
  paredes altas, platibandas, telhados e revestimento da fachada.
- **Referência máxima = fotos e vídeos do cliente** (`templo_foto.jpg`, v1–v8): acabamento, mobiliário, equipamentos e
  disposição seguem a referência; a planta só manda nas paredes/portas.
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
| **Templo (501,7 m²)** | 0 – 16,05 | 12,4 – 44,0 | **palco na parede lateral longa x = 0**, plateia virada para −x (ver "Geometria do templo") |
| Hall de entrada (62,7 m²) | 4,0 – 16,05 | 44,0 – 49,65 | escada em x 13,3–16,0 · z 44,4–49,4 |
| WC | 0 – 1,9 | 44,0 – 46,3 | |
| WC PCD | 1,9 – 4,0 | 44,0 – 46,3 | |
| Sala da Família (11,7 m²) | 0 – 4,0 | 46,3 – 49,65 | |
| Jardins frontais | 0,1 – 10,6 e 13,3 – 16,0 | 49,75 – 50,85 | cerca-viva |
| Calçada da frente | −3 – 23 | 49,6 – 51 | intertravado grafite (fora dos jardins) |
| Estacionamento frontal | −3 – 23 | 51 – 60 | intertravado espinha de peixe terracota, vagas PCD |

### Pisos (o cartão cria; não cubra)
- **Laminado carvalho/mel** (réguas 1,2 × 0,2 m ao longo de z, leve brilho) + **rodapé de madeira** (7 cm): corredor, circulação,
  circ., mídia, voluntariado, depósito, Gilvan, administrativo, recepção, sala pastoral, sala da família.
- **Porcelanato bege claro 0,9 × 0,9** (rejunte fino): WC masc., WC fem., hall dos banheiros, WC, WC PCD, WC pastoral.
- **Templo: porcelanato cinza-claro 0,9 × 0,9 POLIDO** (rugosidade 0,13, reflete luzes e ambiente) + rodapé cinza.
- Hall, cozinha, almoxarifado e áreas externas: como antes.

## Paredes e aberturas (linha de centro)
Tipos de abertura: `door` (0,9×2,1), `window` (peitoril 1,0, topo 2,15), `glass` (vidro até 2,25), `open` (vão), `gate` (portão).
- `wallX(0, 0–20,1)`: gate x 0,3–4,7.
- `wallZ(0, 0–49,65)` e `wallZ(20,1, 0–49,5)` — muros/paredes laterais (divisa). `wallZ(0)` é feita em 3 trechos:
  z 0–12,4 (3 m), **z 12,4–44,0 = parede do palco, 8,5 m, face interna preta (`M.pretoFosco`)**, z 44,0–49,65 (3 m).
- `wallX(49,65, 0–16,05)`: window x 0,6–3,2 (família); **glassdoor x 10,9–13,1 = porta principal de vidro (2 folhas pretas, abrem para fora com `binary_sensor` da porta = on)**.
- `wallX(49,5, 16,05–20,1)`: window alta x 17,6–19,6 (WC fem).
- Almoxarifado/cozinha: `wallZ(4,9, 0–3,9)` window z 1,0–2,0 · `wallZ(8,6, 0–3,9)` · `wallX(3,9, 4,9–12,75)` door x 7,5–8,4 (almox.), window x 9,2–10,8, door x 11,6–12,5 (cozinha).
- `wallZ(12,75, 0–9,25)`: door z 8,2–9,1 (recepção → pastoral).
- Recepção: `wallZ(9,45, 5,9–9,25)` · `wallX(5,9, 9,45–12,75)` window x 10,3–11,9.
- `wallX(9,25, 9,45–20,1)`: door x 11,8–12,6 (recepção), door x 12,9–13,8 (pastoral), glass x 14,2–16,6.
- Caixa/banheiro: `wallZ(17,0, 0–4,9)` window z 1,2–2,2, door z 3,4–4,2 · `wallX(3,1, 17,0–20,1)` · `wallX(4,9, 17,0–20,1)`.
- `wallX(11,0, 16,05–20,1)`: door x 16,15–17,0 (PM01, entrada lateral); window x 17,9–19,9 (J13, Gilvan).
- **Templo** `wallX(12,4, 0–16,05)`: parede comum de 3 m (ponta do templo), glass x 12,9–15,1.
- **Templo** `wallZ(16,05, 11,0–49,65)`: glass z 19,2–22,6 · window z 23,6–27,7 (J12 da mídia, peitoril 1,1 — de frente para o palco) · window z 29,9–31,9 · **door z 34,2–35,1 preta de correr** (trilho aparente do lado do templo, x ≈ 15,93, y 2,21–2,31, até z ≈ 36,0) · open z 44,4–46,0 (hall → banheiros).
- **Faces internas do perímetro do templo PRETAS** (revestimento de 12 mm, `M.pretoFosco`, face a 0,087 m do eixo): x = 0 (8,5 m),
  z = 12,4, x = 16,05 (z 12,475–43,925) e z = 44,0 (3 m). O lado dos cômodos vizinhos continua claro (greige).
- `wallZ(17,1, 11,0–19,0)`: door z 12,9–13,8 (Gilvan), door z 14,4–15,3 (Adm.), window z 16,8–18,3 (J05).
- `wallX(14,2, 17,1–20,1)` · `wallX(19,0, 17,1–20,1)`.
- Mídia: `wallX(23,3, 16,05–18,9)` door x 17,9–18,8 · `wallZ(18,9, 23,3–28,0)`.
- Voluntariado: `wallX(28,0, 16,05–20,1)` door x 19,0–19,9 · `wallX(33,9, 16,05–20,1)` door x 16,2–17,0.
- `wallZ(17,1, 33,9–40,8)` door z 34,6–35,4 (depósito) · `wallX(35,9, 17,1–20,1)` · `wallX(37,0, 17,1–20,1)` · `wallX(40,8, 17,1–20,1)` door x 18,2–19,0 (WC mas.).
- `wallX(44,3, 17,1–20,1)` · `wallZ(17,1, 44,3–49,5)` door z 45,0–45,8 (WC fem.).
- **Templo ↔ Hall** `wallX(44,0, 0–16,05)`: glass x 10,6–13,1 (portas de vidro do templo).
- Família/WCs: `wallZ(1,9, 44,0–46,3)` · `wallZ(4,0, 44,0–49,65)` door z 44,4–45,3 (WC PCD), door z 46,6–47,5 (família) · `wallX(46,3, 0–4,0)` door x 0,5–1,3 (WC).
- Pilares do templo (0,4×0,4, altura 3,05 no modo normal), **metade voltada para o templo preta**: x = 0 em z = 12,4 · 16,9 · 21,4 · 25,9 ·
  30,4 · 35,0 · 39,5 · 44,0 (`PILLARS_L` — por dentro do templo **só nos cantos z 12,4 e 44,0**: no trecho do palco a face da
  parede x = 0 fica lisa, x ≥ 0,087 livre para telas/telão/perfis); x = 16,05 em z = 12,4 · 18,3 · 23,2 · 28,0 · 33,7 · 39,3 · 44,0
  (`PILLARS_R`, x 15,85–16,25); e em z = 12,4 / 44,0 também em x = 5,4 e 10,5. As listas estão em `ctx.PILLARS_L` / `ctx.PILLARS_R`.
- Paredes internas: pintura **greige ~#d6d2cb** (`M.wall`). Paredes externas: pretas por fora, com revestimento claro de 12 mm por
  dentro (só entre as faces internas das paredes vizinhas).
- **Portas internas** (`door`): folha lisa de **cedro com veio** (`M.door`, ≈ #a8662f), batente + **guarnição de madeira de 7 cm nas duas
  faces** (`M.doorFrame`; a guarnição avança 0,016 m sobre a parede e 6 cm além do vão), **alavanca cromada dos dois lados**
  (y 1,02, a 0,1 m do batente do lado `b`). Nada a menos de 0,1 m do vão na parede.
- **Janelas/visores/vidros internos**: caixilho **preto** (`M.frameDark`) e vidro **levemente fumê** (`M.glassSmoke`).

## Geometria do templo (CORREÇÃO DO CLIENTE: palco na parede lateral x = 0)
O templo (x 0–16,05 · z 12,4–44,0) é largo e raso em relação ao palco: o palco fica encostado na **parede longa x = 0**, a plateia
olha para **−x** e a sala de mídia (visor J12 na parede x = 16,05, z 23,6–27,7) fica **de frente para o palco**.
- **Palco** (decoração do palco): x 0,15–5,0 · z 19,6–36,6 (16,6 m de frente, 4,85 m de fundo), **topo y = 1,0**; piso claro
  bege/madeira clara, **testeira (face x = 5,0) preta**; escadas com corrimão inox nas duas pontas (perto de z 19,6 e 36,6);
  2 caixinhas/retornos pretos no piso à frente do palco.
- **Parede do palco** x = 0: preta em altura total (8,5 m) — o cartão cria. Face interna em x = 0,087.
- **Telão LED** (cartão): 8,4 × 3,0 m, z 23,9–32,3, y 1,15–4,15, plano em x 0,25 virado para +x; moldura preta fina = painel
  x 0,12–0,24, z 23,85–32,35, y 1,10–4,20. Brilho aditivo em volta (x 0,29, 10,6 × 4,8 m). Não cubra nem encoste (≥ 0,1 m).
- **Telas brancas de projeção** (decoração do palco): ~3,2 × 2,4 m em z 19,9–23,1 e 33,1–36,3, y 3,9–6,3, na face da parede
  (x ≈ 0,12, virada para +x); acendem levemente com o telão (`ctx.bindEmissive('telao', mat, …)`).
- **Treliça de luz** (decoração do palco): treliça preta tipo escada em y ≈ 6,3, x ≈ 0,6, de z 20,5 a 35,5, com o **banzo inferior
  em y ≈ 6,30** (o grampo dos moving heads sobe até y 6,30 em x 0,8). Nela ficam as luminárias `palco` do cartão.
- **Cobertura aparente** (decoração da plateia): tesouras metálicas **brancas** (`M.aluminioBranco`) atravessando o templo em x
  (0 → 16,05), banzo inferior y ≈ 7,6, superior ≈ 8,6, em z ≈ 13,5 / 18,5 / 23,5 / 28,5 / 33,5 / 38,5 / 43,3, apoiadas em
  pilares/perfis pretos que sobem até ≈ 8,6 nas duas laterais (em x = 0 junto à parede alta; em x = 16,05 acima da parede de 3 m);
  terças finas; lampadinhas quentes no beiral (opcional). **Os high-bays da `plateia` se prendem no banzo inferior (y 7,6)** das
  tesouras de z 18,5 / 23,5 / 33,5 / 38,5 — a tesoura de z 28,5 fica sem luminária.
- **Line arrays** (decoração do palco): pendurados por correntes até as tesouras, na frente das telas brancas (x ≈ 1,6,
  z ≈ 21,5 e ≈ 34,7), 2 clusters por lado (um para frente, um angulado).
- **Plateia** (decoração da plateia): cadeiras pretas estofadas de encosto alto voltadas para −x, de x ≈ 6,3 a ≈ 15,5, em blocos com
  corredor central perpendicular ao palco (z ≈ 28,1) e corredores laterais; blocos das pontas levemente angulados para o centro
  (v6/v8); ~500 lugares. Livres: acesso do hall (vidro x 10,6–13,1 em z = 44), porta de vidro z = 12,4 (x 12,9–15,1), aberturas da
  parede x = 16,05 (vidro z 19,2–22,6, visor z 23,6–28,4, janela z 29,9–31,9, porta preta z 34,2–35,1 + trilho até z 36,0, vão
  z 44,4–46,0), escadas do palco e os ares (abaixo).

**Como ficou na v1.2 (as-built — respeite ao mexer em qualquer um dos lados):**
- Palco (`templo_palco.js`): escadas à frente da testeira em x 5,0–6,3 · z 19,65–20,75 e 35,45–36,55 (6 espelhos, corrimão inox
  dos dois lados); caixinhas no piso em z 25,3 / 30,9; bateria sobre praticável x 0,55–3,05 · z 22,0–24,8; barra de fixação do
  telão com grampos em y 4,36. **Telas brancas em z 19,9–23,1 e 33,7–36,9** (a do lado z alto foi deslocada para não bater no
  pilar da tesoura de z 33,5). **Treliça de luz em z 23,1–33,1** (termina ~0,8 m além do telão, como na foto), mãos-francesas até a
  parede em z 23,3 e 32,9. Line arrays pendurados em barras de rigging em y 7,5 (x 1,6) entre as tesouras (z 18,4–23,6 e 33,4–38,6).
- Plateia (`templo_plateia.js`): **414 lugares** — 2 blocos centrais retos 12 × 10 (z 20,9–27,22 e 28,98–35,3; corredor central
  1,76 m) e 2 blocos das pontas angulados ~8,6° (z 13,72–19,3 e 36,9–42,55), cadeiras em x 5,75–14,72 (1ª fileira central em
  x 6,62). Corredores de ~1,3–1,45 m junto às paredes z = 12,4 / 44 e passagem de ~1,25 m ao longo de x = 16,05. Pilares na
  parede do palco: inteiros fora do palco/telas, em z 23,55 e 32,65 nascem no piso do palco, em z 28,5 e 33,5 só acima de y 6,95.
  Segunda treliça de luz (preta, 0,3 × 0,3) sobre a plateia em x 5,55, y 6,72–7,0, z 19,9–36,3, pendurada nas tesouras.
- **A cobertura interna (tesouras, terças, pilares altos, treliça da plateia, lampadinhas) é um grupo `userData.keep` que some no
  modo Fachada** (`visible` segue `!ctx.ext.visible`): o telhado em meia-água do modo Fachada (face de baixo de y ≈ 8,1 em x = 0
  a ≈ 7,5 em x = 16) é mais baixo que as tesouras perto de x = 16.

## Objetos do cartão (ligados a entidades — NÃO recrie nem cubra)
- **Telão LED** (`telao`, media_player): ver acima (8,4 × 3,0, plano em x 0,25, centro y 2,65 · z 28,1). Luz do telão em (2,1; 2,8; 28,1).
- **Luzes do palco** (`palco`, RGB): **4 moving heads** em x 0,8, y 6,05, z 23,9 / 26,7 / 29,5 / 32,3 (base até y 6,30, garfo
  z ± 0,15), mirando (1; −1,25; 0) — **+x e para baixo, sobre o palco**. Feixes volumetricos (cones aditivos de 5,8 m) vão da lente
  até ≈ (4,4; 1,5): **nada alto no caminho** (faixa x 0,8–4,6 × z de cada cabeça ± 1 m acima do piso do palco + 1,5 m) e **nada a
  menos de 0,35 m das cabeças**. As PointLights ficam 1,2 m à frente da lente.
- **Som** (`som`, switch): 2 LEDs de status nas quinas frontais do palco — base 0,1 × 0,05 × 0,16 em (4,9; 1,025; 19,8) e (4,9; 1,025; 36,4),
  LED em y 1,065. Não cubra (degraus/corrimão começam fora de z 19,6–19,95 e 36,25–36,6 na quina x 4,85–4,95).
- **Ar do templo** (`ac_templo`, climate): **5 unidades grandes** (1,25 × 0,26 × 0,30) em y 2,6 (topo 2,73) — **nenhuma na parede do palco**:
  (15,825; z 15,3), (15,825; z 30,9 — acima da janela), (15,825; z 41,6) na parede x = 16,05; (x 7,95; z 12,625) e (x 7,95; z 43,775)
  nas pontas. Deixe 0,3 m livres em volta.
- **Ar da sala pastoral** (`ac_pastoral`): split em (14,9, 2,4, 0,2) na parede z=0.
- Luminárias pendentes/refletores de cada item (posições na tabela de ITEMS do cartão). Não coloque nada num raio de 0,4 m delas.
  Refletor do letreiro (**sempre visível**, não é mais `ext`): (8,9; 8,05; 50,35), preso ao topo do painel ripado acima do logo.
  **Plateia**: 12 **high-bays redondos** (Ø 0,64 m, altura 0,25) com o difusor em y ≈ 7,1, pendurados por haste curta até o banzo
  inferior das tesouras (y 7,6), em x 7,2 / 10,6 / 14,0 × z 18,5 / 23,5 / 33,5 / 38,5 (reais: (7,2|14,0; 23,5) e (7,2|14,0; 33,5)).
  **Não há mais pendentes lineares nem trilhos de teto** (y 6,43) — a cobertura/tesouras é da decoração da plateia.
  Arandela do pátio: no muro x = 0 em (0,16; 2,8; 6,2).
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

### Acabamentos prontos em `ctx.M` (v1.2 — fotos/vídeos do cliente)
- `M.marmorato` (cimento queimado/marmorato cinza manchado), `M.acustico` (placa acústica grafite 0,5 × 0,5 com juntas),
  `M.porcelanatoCinza` (porcelanato cinza-claro 0,9 × 0,9) e `M.marmoreMarrom` (mármore "marrom imperador", placas 0,9 × 0,9):
  **padrões calculados em espaço de mundo** (repetem em metros em qualquer peça, sem UV e sem textura/sampler a mais).
  **Não clone** (o `clone()` perde o padrão): reaproveite o mesmo objeto; peças com o mesmo material fundem num draw call.
- `M.pretoFosco` (paredes/pilares do templo; não é unificado com outros pretos), `M.aluminioBranco` (tesouras), `M.glassSmoke`
  (vidro fumê dos visores internos), `M.door` (cedro com veio), `M.doorFrame`, `M.baseboardWood`, `M.baseboardGray`.
- Texturas novas em `ctx.TEX`: `laminate`, `porcelainBeige`, `porcelainGray`, `cedar`.
- `ctx.std({ map: tex, … })` pode receber textura: a chave do cache usa o **uuid** da textura (antes serializava a imagem inteira
  em data URL a cada chamada — segundos por construção da cena).

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
