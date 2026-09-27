# Igreja 3D — cartão Lovelace para Home Assistant

Demo: https://lgrsv.github.io/igreja-3d-v1/ · Repositório: https://github.com/LGRSV/igreja-3d-v1

Modelo 3D interativo da **Base Church** (802 Sul · Palmas-TO) em Three.js, ligado às entidades do
Home Assistant: gira, dá zoom e cada ambiente acende conforme o interruptor real. Clicar no ambiente,
na luminária ou no bloco do painel alterna a entidade. O telão mostra o que está tocando, os LEDs do
som e dos ares acendem com o estado e a porta de vidro abre quando o sensor da porta abre.
É o mesmo motor do cartão `casa3d-card` (repositório [casa-chefe](https://github.com/LGRSV/casa-chefe)),
refeito para a planta da igreja.

## Novidades da v1.1 — logo, renderização e decoração

**Logo da Base Church (fiel à foto da fachada)**
- Uma **única função de desenho** do logo oficial (anel espesso com o "B" bold; "BASE" e "CHURCH" com a mesma
  largura, CHURCH um pouco menor), com as proporções medidas na foto. A fonte é medida e ajustada no canvas,
  então sai igual no Windows, Android e Linux (sem depender de "Arial Black"). Todos os logos do cartão usam
  essa função: fachada, totem, telão, LED do palco, recepção, hall, capachos, placas e telas.
- O **painel ripado bege-rosado de 0 a 8,5 m com o letreiro BASE CHURCH em letras caixa prateadas** agora é
  visível **sempre** (não só no modo Fachada): o prédio preto é reconhecível da rua e na vista inicial.
  À noite as letras acendem com a luz `fachada`, com halo de retroiluminação e 4 embutidos lavando o ripado.
- Logo em **LED acima do telão** (acende com o `palco`), **totem de entrada** de 4 m na calçada com o logo
  em relevo e "802 SUL · PALMAS", paredão da marca no pátio, letreiros no hall, na recepção, no voluntariado e
  na plateia, adesivos jateados nas portas de vidro do templo e capachos com o logo.

**Renderização**
- Tone mapping **Neutral** (exposição 1,0): a "Igreja Preta" fica preta de verdade e o roxo do palco e o
  telão ficam saturados; preto da fachada com **juntas de painel** (sem textura extra).
- **Feixes de luz** nos 4 refletores do palco (seguem a cor RGB e o brilho de `palco`), telão com cores fiéis
  e halo de LED, vidro com reflexo do céu, menos luz "chapada" de dia (mais volume nas sombras).
- Emissivos da decoração (LEDs, letreiros, telas) **acompanham a entidade** — de dia e com tudo desligado o
  palco não fica mais "ligado".
- Rótulos com tamanho fixo na tela, escondidos atrás das paredes e com nível de detalhe (de longe, só os
  ambientes principais; no celular, só os maiores).
- Câmera inicial de frente, pelo estacionamento (fachada e logo legíveis, palco e telão visíveis); em
  retrato os botões quebram em duas linhas.
- Sombras das luzes desenhadas uma vez e em 256² (160 → 64 MB de GPU); `quality: auto` (padrão) usa o
  perfil leve em celular/tablet; salvaguarda automática em GPU com poucos uniforms/samplers.

**Decoração**
- Palco "black box" com cortinas de molton, logo no bumbo e no púlpito; plateia com painéis acústicos pretos,
  ripado com fita de LED, 504 lugares e **pendentes lineares de LED** em 2 trilhos de teto (corredor central livre).
- Entorno mais realista: gramado seco, vizinhos, muros de divisa, árvores com copa em cachos, postes de rua,
  paraciclo e carros com cabine afunilada; ipê-amarelo do pátio refeito com flores caídas.
- Mais detalhe em todos os ambientes (hall, Sala da Família, WCs, mídia, voluntariado, recepção, pastoral,
  caixa d'água, cozinha, pátio) — ver `rooms/*.js`.

## Arquivos

| Arquivo | Para quê |
|---|---|
| `igreja3d-card.js` | **O cartão.** É o único arquivo que vai para o Home Assistant. |
| `index.html` | Demo standalone com estados simulados (noite de culto) — abre direto no navegador (duplo clique). |
| `demo.template.html` + `build.py` | Geram o `index.html` a partir do cartão (`python3 build.py`). |
| `rooms/*.js` + `integrate_rooms.py` | Fonte da decoração de cada área (uma função `room…(ctx)` por arquivo), colada no cartão pelo `integrate_rooms.py`. |
| `rooms/BRIEF.md` | Especificação da planta: coordenadas, paredes, aberturas, pilares, objetos do cartão e regras da decoração. |
| `tools/shot.mjs` | Screenshot da demo com Playwright (Chromium/SwiftShader), para conferir o cartão sem GPU. |
| `hacs.json` | Permite instalar pelo HACS como repositório personalizado. |

## Instalação no Home Assistant

### Opção A — pelo GitHub (sem copiar arquivo)
Recurso do Lovelace apontando para o CDN do GitHub (jsDelivr):
`https://cdn.jsdelivr.net/gh/LGRSV/igreja-3d-v1@main/igreja3d-card.js` (tipo **Módulo JavaScript**).
Ou pelo HACS: *HACS → ⋮ → Repositórios personalizados → URL do repositório, categoria Dashboard*,
depois "Baixar" — o `hacs.json` já está no repositório (URL: `https://github.com/LGRSV/igreja-3d-v1`).
A demo fica publicada em `https://lgrsv.github.io/igreja-3d-v1/` (Settings → Pages → branch `main`, pasta `/`).

> O jsDelivr guarda cache do `@main` por até 12 h. Depois de atualizar o repositório, use
> `https://purge.jsdelivr.net/gh/LGRSV/igreja-3d-v1@main/igreja3d-card.js` ou fixe um commit/tag
> (`@<hash>`) na URL do recurso.

### Opção B — arquivo local

1. Copie `igreja3d-card.js` para `/config/www/igreja3d/igreja3d-card.js`
   (pelo Samba: `\\homeassistant\config\www\igreja3d\`, ou pelo File editor).
2. **Definições → Painéis → ⋮ (canto superior direito) → Recursos → Adicionar recurso**
   - URL: `/local/igreja3d/igreja3d-card.js?v=1`
   - Tipo: **Módulo JavaScript**
   - Se a opção "Recursos" não aparecer, ative o *Modo avançado* no seu perfil de usuário.
3. No dashboard, crie uma vista do tipo **Painel** e adicione o cartão em YAML:

   ```yaml
   type: custom:igreja3d-card
   title: Base Church
   entities:
     palco: light.SEU_PALCO     # troque pelos IDs reais — veja abaixo
   ```
4. Recarregue a página (Ctrl+F5; no app, feche e abra). Sempre que atualizar o arquivo,
   aumente o `?v=` do recurso para furar o cache.

## Configuração completa (tudo opcional)

> **Importante:** os IDs de entidade abaixo são **nomes de exemplo** (é o que a demo usa). Troque
> cada um pelo `entity_id` real da sua instalação (*Definições → Dispositivos e serviços → Entidades*).
> Uma entidade que não existe no HA aparece como "indisponível" no painel e o ambiente fica apagado.
> Pode apontar duas chaves para a mesma entidade (ex.: `recepcao` e `administrativo` no mesmo circuito).

```yaml
type: custom:igreja3d-card
title: Base Church
mode: auto            # auto = segue sun.sun | day | night
night_vision: true    # à noite, luz de lua + ambiente frio: a igreja inteira fica legível
labels: true          # nomes dos ambientes flutuando (somem no modo Fachada)
height: calc(100vh - 100px)   # numa vista com seções use algo como 560px
panel: true           # painel inferior aberto ao iniciar (false = recolhido)
fachada: false        # começa no modo Fachada (paredes altas, cobertura e fachada completa)
quality: auto         # auto (padrão: leve em celular/tablet ou ≤ 4 GB de RAM) · alta · leve (sombras menores, só 3 luzes com sombra)
weather: true         # widget de clima ao vivo no canto inferior direito (Open-Meteo, sem chave)
weather_city: 'Palmas, TO'
timezone: America/Sao_Paulo      # relógio e nascer/pôr do sol (no HA vale o fuso do próprio HA)
latitude: -10.27                 # clima (sempre) e posição do sol fora do HA — no HA o sol usa
longitude: -48.33                #  a localização configurada no próprio HA (hass.config)
orientation: 90       # para onde a fachada (lado do estacionamento) aponta: 0=N, 90=L, 180=S, 270=O (Base Church: leste)
entities:
  # ---- Templo ----
  palco:          light.palco_rgb              # refletores do palco (RGB + brilho)
  plateia:        light.templo_plateia         # luminárias da plateia (brilho)
  telao:          media_player.telao_led       # telão LED: acende e mostra o título tocando
  som:            switch.som_templo            # LEDs verdes nas quinas do palco
  ac_templo:      climate.ar_templo            # 5 splits do templo (LED azul = frio)
  presenca:       binary_sensor.presenca_templo  # só leitura
  temperatura:    sensor.temperatura_templo      # só leitura
  # ---- Entrada / frente ----
  hall:           light.hall_entrada
  fachada:        light.fachada_letreiro       # refletor do letreiro + arandelas
  estacionamento: light.estacionamento         # postes da frente + arandela do pátio
  porta:          binary_sensor.porta_principal  # porta de vidro abre no modelo quando "on"
  familia:        light.sala_familia
  banheiros:      light.banheiros              # WCs, hall dos banheiros e depósito
  # ---- Administração / apoio ----
  pastoral:       light.sala_pastoral
  ac_pastoral:    climate.ar_sala_pastoral
  recepcao:       light.recepcao
  administrativo: light.administrativo         # Administrativo + Sala Gilvan
  circulacao:     light.circulacao             # corredores da ala direita
  midia:          light.sala_midia
  voluntariado:   light.voluntariado
  cozinha:        light.cozinha                # cozinha + almoxarifado
  sun:            sun.sun                      # dia/noite automático
```

Só precisa listar as chaves que quiser trocar; as que ficarem de fora usam o nome de exemplo acima.

## Como funciona

- **Luz / interruptor**: clique no ambiente, na luminária ou no bloco → `homeassistant.toggle` na
  entidade (resposta otimista, o HA confirma em seguida). A luz do palco segue a cor real
  (`rgb_color`) e o brilho; a plateia segue o brilho.
- **Telão, ares e sensores**: clique abre o *more-info* da entidade (o painel padrão do HA).
- **Porta principal**: as duas folhas de vidro abrem para fora quando `binary_sensor.porta_principal` fica `on`.
- **Sombras reais**: as paredes bloqueiam a luz (8 luminárias projetam sombra). As sombras só
  recalculam quando um estado muda, então o custo em repouso é baixo.
- **Dia/noite**: em `auto` segue o `sun.sun`; os botões Dia/Noite forçam. À noite a *visão noturna*
  (luz de lua + ambiente frio) mantém a igreja legível; desligue no botão para o visual escuro.
- **Tempo real**: data e hora no fuso de `timezone`, nascer e pôr do sol do dia e, em `mode: auto`,
  o sol real (elevação/azimute do `sun.sun`, ou calculados por latitude/longitude) move a sombra.
- **Fachada**: o botão *Fachada* mostra o prédio como ele é por fora — bloco preto de 8,5 m do templo
  e do hall, painel ripado de madeira clara com o logo "B / BASE CHURCH", ala direita de 4,5 m com o
  beiral de treliça e forro amadeirado, condensadoras no telhado, platibandas e coberturas. Desligado,
  volta a vista de casinha de boneca (paredes de 3 m, sem teto). O **painel ripado com o letreiro BASE
  CHURCH e o refletor ficam visíveis nos dois modos** (a identidade do prédio vista da rua); os rótulos dos
  ambientes somem enquanto o modo Fachada está ligado.
- **Entorno**: estacionamento frontal em intertravado espinha de peixe, vagas PCD, cerca-viva e cicas na
  frente, totem de entrada com o logo, ruas da frente e dos fundos, vizinhos, árvores e postes — só contexto.
- **Clima ao vivo (Palmas)**: widget no canto inferior direito com temperatura, condição, sensação
  térmica e vento — dados da [Open-Meteo](https://open-meteo.com/) (gratuita, sem chave), atualizados
  a cada 15 min, nas coordenadas `latitude`/`longitude` (padrão: Palmas-TO). Some quando o painel
  abre por cima e volta quando fecha. Desative com `weather: false`.
  Não funciona dentro do preview do Claude Artifact (o sandbox bloqueia requisições externas);
  funciona normalmente no GitHub Pages e no Home Assistant.

## Painel inferior (Ambientes · Automações · Atividade)

Barra na parte de baixo do cartão (recolhe pelo ˅ e volta pelo botão "Painel"). A câmera enquadra a
igreja na área que sobra acima dela.

- **Ambientes**: blocos agrupados por área (Templo, Entrada, Administração, Apoio), cada um com o
  dispositivo, o estado e há quanto tempo mudou; tocar alterna a entidade. O **⋯** abre os controles:
  cor e brilho do palco, brilho da plateia, modo e temperatura dos ares, tocar/pausar e volume do telão,
  e um **temporizador** ("desligar em 15/30/60 min") para qualquer luz/interruptor — ele roda no cartão,
  então só vale enquanto o painel estiver aberto (num tablet de parede, sempre). Presença, porta e
  temperatura são blocos só de leitura.
- **Automações**: *rotinas rápidas* do cartão (ações compostas — `SCENES` no topo do arquivo) e, abaixo,
  **todas as automações do seu Home Assistant** (`automation.*`), descobertas sozinhas: ativar/desativar,
  executar agora (▶, `automation.trigger`) e a última execução.
- **Atividade**: histórico do que ligou/desligou, disparos de automação, presença e porta, com hora e
  tempo relativo.

### Rotinas rápidas

| Rotina | O que chama |
|---|---|
| **Culto** | liga palco, plateia, som, hall, fachada e estacionamento; `media_player.turn_on` no telão; `climate.set_hvac_mode: cool` no ar do templo |
| **Louvor** | plateia a 30 %, palco roxo/azul (`rgb_color` 110,70,255) a 100 %, telão e som |
| **Pregação** | plateia a 80 %, palco branco quente (255,196,140) |
| **Ensaio da banda** | palco, som e telão ligados; plateia apagada |
| **Abrir a igreja** | fachada, estacionamento, hall, banheiros e recepção |
| **Expediente** | administrativo, pastoral, recepção, circulação e ar da pastoral em frio |
| **Fechar tudo** | todas as luzes, som e telão desligados; ares em `off` |

Elas não precisam existir no HA: o cartão chama os serviços direto (`homeassistant.turn_on/turn_off`,
`light.turn_on`, `media_player.*`, `climate.set_hvac_mode`). Para mudar, edite `SCENES` no cartão.

## Mapa dos ambientes

Coordenadas em metros (X → direita a partir do muro esquerdo, Z → frente; fachada em z ≈ 49,7).

| Área | Ambientes | Entidade ao clicar |
|---|---|---|
| Fundos (z 0–12,4) | Estacionamento interno e pátio · Almoxarifado · Cozinha · Recepção · Sala Pastoral (+ banheiro) · Caixa d'água · jardins | `estacionamento` · `cozinha` · `recepcao` · `pastoral` |
| Ala direita (x 16–20) | Corredor da entrada lateral · Sala Gilvan · Administrativo · Circulação · Mídia · Voluntariado · Depósito · Área técnica · WC Masc. · Hall dos banheiros · WC Fem. | `circulacao` · `administrativo` · `midia` · `voluntariado` · `banheiros` |
| Templo (z 12,4–44) | Palco com telão, banda e treliça · plateia de ~500 cadeiras · backstage | `plateia` (piso), `palco` (refletores), `telao`, `som`, `ac_templo` |
| Entrada (z 44–49,65) | Hall com balcão, café, lounge e escada · Sala da Família · WC · WC PCD | `hall` · `familia` · `banheiros` |
| Frente (z > 49,7) | Jardins, calçada, estacionamento frontal com vagas PCD | `fachada` · `estacionamento` |

## Ajustando a planta

Tudo está em metros no topo de `igreja3d-card.js` (X → direita, Z → frente) e documentado em
`rooms/BRIEF.md`:

- `ZONES` — os pisos (ambientes), a textura de cada um e qual entidade o clique alterna.
- `ITEMS` — luminárias: posição `p`, intensidade `i` (cd), alcance `d` (m), estilo (refletor com feixe, pendente linear de LED, pendente
  industrial, poste, arandela) e quais projetam sombra.
- `PILLARS_L` / `PILLARS_R` — pilares do templo nas paredes x = 0 e x = 16,05.
- `_buildWalls()` — paredes com portas (`door`), janelas (`window`), vidro (`glass`), porta de vidro de
  2 folhas (`glassdoor`), vãos (`open`) e portão (`gate`).
- `_buildFurniture()` — objetos ligados a entidades (telão, som, splits) e chamadas das funções de
  decoração (`roomTemploPalco`, `roomTemploPlateia`, `roomHallFamilia`, `roomAlaDireita`,
  `roomAdministrativo`, `roomServicoPatio`, `roomFachada`), coladas entre `@rooms-begin` e `@rooms-end`.
- Para refazer a decoração de uma área: edite `rooms/<área>.js` e rode `python3 integrate_rooms.py`.

Depois de editar, `python3 build.py` regenera a demo. Para conferir sem GPU:
`THREE_LOCAL=<three.module.min.js> WAIT=8000 node tools/shot.mjs index.html vista.png 1400 900 'document.querySelector("igreja3d-card").setFachada(true)'`
(ganchos: `setView([x,y,z],[tx,ty,tz])`, `setFachada(bool)`, `setMode('auto'|'day'|'night')`, `setSimTime(data)`;
na demo, `window.demo.set('palco','on',{rgb_color:[255,0,0]})` e `window.demo.setAll(true)`).

## Desempenho

Medido na demo (Chromium, vista padrão 1400×900). A cena roda no dispositivo que abre o dashboard,
não no HA nem no GitHub.

- ~6.900 malhas (paredes, cadeiras, palco, móveis, fachada) são fundidas por material na
  inicialização: **6.946 → 272 draw calls** na cena + **171 → 12** no grupo da Fachada. No total, a vista
  padrão desenha **~420 draw calls por quadro** (com pisos, luminárias, rótulos, halos e feixes); a v1.0
  desenhava ~372 com bem menos decoração (vista de topo 334 → 414; interior do templo 222 → 237).
  Materiais simples praticamente iguais (±22/255 na cor, ±0,25 na rugosidade) são unificados antes da
  fusão; materiais **idênticos** com textura/emissivo/transparência também (ex.: as laterais de todas as
  letras caixa do logo), os halos da mesma entidade compartilham material e as peças de uma mesma
  luminária/entidade viram uma malha só.
- **26 luzes reais** (PointLight: 25 luminárias + a do telão); **8 com sombra** em `quality: alta`,
  3 em `leve`. As outras 17 luminárias são só "brilho" (emissivo + halo), sem custo de luz.
  Em GPU com pouca margem (< 512 vetores de uniform no fragment ou < 16 samplers) as luzes fracas
  das salas viram só brilho (fica com 16 luzes reais, 3 com sombra) e o cartão avisa no console.
- Sombras das luzes em 256² (192² no leve): **~64 MB** de GPU no total, contra 160 MB antes. Elas são
  desenhadas **uma vez** (a geometria é estática) e só refeitas quando a porta do hall gira ou o modo
  Fachada muda; nas transições dia/noite e com o sol andando só a sombra do sol é refeita.
- Tone mapping Neutral (exposição 1,0): o preto da fachada fica preto e as cores do palco e do telão
  ficam fiéis. O telão não passa pelo tone mapping e tem um halo de LED em volta; os 4 refletores do
  palco têm feixe de luz falso (cone aditivo, 4 draw calls) que segue a cor RGB e o brilho da entidade.
- Construção da cena (`_build3D`): **~0,48 s** com os shaders já em cache (v1.0: ~0,39 s no mesmo teste) e
  ~8–11 s na primeira vez, quase tudo compilação de shader — medido em Chromium com SwiftShader (CPU, sem GPU);
  numa GPU real é bem menos. ~307 mil triângulos (v1.0: ~260 mil), 29 programas de shader, no máximo 13 das 16
  unidades de textura por material (map + bump + ao + ambiente + 9 sombras).
- Sombras só recalculam quando um estado muda; nada é renderizado parado (só quando a câmera se
  move, um estado muda ou o telão está tocando, a 30 fps).
- Pixel ratio adaptativo (orçamento de ~2,4 Mpx por quadro; 1,4 Mpx em `leve`).
- Ligar/desligar luz não recompila shaders (todas as luzes ficam ativas com intensidade zero).
- No disco o cartão tem ~480 KB (a demo `index.html`, com o cartão embutido, ~490 KB).

## Observações

- A geometria é **aproximada** a partir da planta de layout do térreo (Uõma Arquitetura, NOV/2024,
  escala 1:100) — precisão de ~0,1 m, não é levantamento. Alturas externas (8,5 / 4,5 / 3,6 m) e a
  fachada vêm de uma foto; o mobiliário é ilustrativo.
- **Orientação**: a fachada da Base Church é virada para o **leste** (`orientation: 90`) — o sol da manhã
  bate na fachada e o da tarde nos fundos. Para outro prédio ajuste (0 = N, 90 = L, 180 = S, 270 = O).
- As entidades de `entities:` são exemplos — troque pelos IDs reais antes de usar.
- O Three.js é carregado do jsDelivr (`three@0.170.0`): o **dispositivo que abre o dashboard** precisa
  de internet; o HA em si não.
- Testado em Chromium desktop e layout de celular (retrato afasta a câmera para caber o prédio inteiro).
