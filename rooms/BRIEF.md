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
  Refletor do letreiro (modo Fachada): (8,9; 8,05; 50,35), preso à platibanda acima do logo. Arandela do pátio: no muro x = 0 em (0,16; 2,8; 6,2).
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
  No merge, materiais simples quase iguais (cor ±16/255, rugosidade/metal ±0,2; sem mapa, transparência nem emissivo) viram um só.
  Os pisos das zonas ficam em y = 0,004 e o gramado geral em y = −0,03.

## Regras para as funções de decoração
1. Escreva APENAS `function room<Nome>(ctx) { … }` no seu arquivo `rooms/<arquivo>.js` (sem import/export, sem código fora da função,
   sem `console.log`). ES2020 válido. Builders locais dentro da função.
2. Só primitivas; nada de fetch, texturas externas ou luzes (PointLight/SpotLight) — o cartão cuida da iluminação.
3. Mantenha móveis ≥ 0,08 m das paredes, fora do vão das portas (largura + 0,9 m) e fora dos objetos do cartão acima.
4. Vidro/objetos finos: `{ cast: false }`.
5. Estilo: igreja evangélica contemporânea — preto, madeira clara (ripado), branco, cinza grafite; acentos em âmbar/terracota.
   Coerente com a foto da fachada (bloco preto, painel ripado de madeira clara com o logo "B" e "BASE CHURCH", porta de vidro com
   caixilho preto, palmeiras cicas em vasos pretos, cerca-viva, estacionamento de intertravado terracota em espinha de peixe).
