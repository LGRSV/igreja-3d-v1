# Igreja 3D — cartão Lovelace para Home Assistant

Demo: https://lgrsv.github.io/igreja-3d-v1/ · Repositório: https://github.com/LGRSV/igreja-3d-v1

Modelo 3D interativo da **Base Church** (802 Sul · Palmas-TO) em Three.js, ligado às entidades do
Home Assistant: gira, dá zoom e cada ambiente acende conforme o interruptor real. Clicar no ambiente,
na luminária ou no bloco do painel alterna a entidade. O telão mostra o que está tocando, os LEDs do
som e dos ares acendem com o estado e a porta de vidro abre quando o sensor da porta abre.
É o mesmo motor do cartão `casa3d-card` (repositório [casa-chefe](https://github.com/LGRSV/casa-chefe)),
refeito para a planta da igreja.

## Novidades da v1.4 — Vista de cima navegável, Visão de pessoa e qualidade adaptativa

**Vista de cima navegável (blocos → cômodos → aparelhos).** O botão *Vista de cima* deixou de ser só uma foto da planta:
- **1º clique** num bloco (Templo · Hall / Família · Ala direita · Bloco dos fundos · Frente) aproxima a câmera, de cima, só nele;
  **2º clique** num cômodo enquadra só o cômodo; **dentro do cômodo** clicar na luminária, no ar, no telão ou no som liga e desliga
  (no piso, alterna a luz principal dele). O que está sob o mouse é realçado em âmbar e o nome aparece na trilha.
- Uma **trilha** mostra onde você está (`Planta › Ala direita › Mídia`) — cada item é clicável — e, no cômodo, uma fileira de
  **botões dos aparelhos** (luz, ar, telão, som…) com o estado; no celular a fileira rola na horizontal.
- **‹ Voltar** (ou Esc / Backspace) sobe um nível; na planta inteira, sai da Vista de cima. A câmera voa suave (3 s) e, com
  `prefers-reduced-motion`, corta direto. Os rótulos mostram só o que está dentro do bloco/cômodo. Redimensionar ou abrir o
  painel re-enquadra o **mesmo nível**. Ligar um ar na Vista de cima não tira você da planta (o selo do ar já mostra o estado).
- Ganchos: `setTopNav('ala', 'midia')` (liga a Vista de cima se preciso e navega direto; blocos `templo · hall · ala · fundos · frente`)
  e `getTopNav()` → `{ level, block, room }`.

**Visão de pessoa (botão *Pessoa*).** Câmera na altura dos olhos (1,6 m; 1,0 m a mais em cima do palco), começando na calçada,
de frente para a porta principal:
- **PC:** `W A S D` ou setas andam (A/D e ← → andam de lado), **Shift** corre, `Q`/`E` giram, **arrastar** com o mouse vira a cabeça,
  **Esc** sai. **Celular/tablet:** **joystick** na tela (canto inferior esquerdo) anda e **arrastar** com outro dedo olha.
- **Colisão simples** com as paredes do modelo (deslizando ao longo delas): portas, vãos e a porta de vidro passam (a pessoa
  "abre" a porta, mesmo com o sensor `off`); vidros fixos, paredes e o portão fechado bloqueiam. O mobiliário não bloqueia.
- Luzes, ares, telão e som continuam clicáveis (toque curto ou clique). O painel se recolhe ao entrar e volta ao sair;
  *Vista de cima* e *Recentrar* também saem do modo, e o voo automático até o ar que ligou fica de fora enquanto você anda.
- Ganchos: `setWalk(true|false)`, `setWalkPose(x, z, yaw, pitch)` (yaw 0 olha para −z; + vira à esquerda) e `getWalkPose()`.

**Renderização maximizada em qualquer dispositivo — até numa torradeira.**
- Novo nível **`quality: min`** (automático em renderizador **por software** — SwiftShader/llvmpipe —, ≤ 2 GB ou ≤ 2 núcleos com ≤ 4 GB de
  RAM): sem sombras, pisos lisos (sem relevo nem AO), 5 luzes reais + telão, sem entorno; o resto da cena é o mesmo.
- **Governador de qualidade** em todos os níveis (`alta · media · leve · min`), pelo **tempo real de quadro**: enquanto você
  gira/anda a resolução sobe e desce sozinha (com histerese: 2 janelas de 300 ms lentas para baixar, 4 rápidas para subir);
  ao parar sai **um** quadro nítido — sempre na resolução cheia da tela, ou acima dela quando sobra fôlego (nunca acima de 3× o
  DPR nem de 4 Mpx) —, com o custo medido no quadro seguinte; o que se adapta é só o movimento (v1.4.1: antes a parada também
  podia cair abaixo da resolução cheia e a imagem ficava borrada). Parado continua **0 redesenhos**.
- Só no **`auto`**, se nem a resolução mínima aguenta (< 15 quadros/s por ~1,5 s; nunca nos 20 s após carregar), o governador
  desce uma escada: 1) some o entorno — e volta sozinho depois de ~6 s de movimento fluido; 2) menos luzes reais; 3) sem
  supersampling parado e escala mínima menor em movimento. Desde a v1.4.3 a **sombra do sol e a resolução cheia parada nunca
  caem** (antes a escada podia deixar a imagem borrada), o MSAA vale em toda GPU de verdade e o `media` voltou à sombra suave. Com
  `quality` manual (`alta|media|leve|min`) nada disso acontece — vale o que você escolheu (só a resolução se adapta).
  `getQuality()` mostra o estado (`{ tier, rung, moveScale, idleScale, lights, entorno }`).

## Novidades da v1.3 — ar por cômodo, Vista de cima e templo sem tesouras

- **Ar-condicionado em todo cômodo que aparece nos vídeos**: além do templo (5 splits) e da pastoral, agora a
  **sala de mídia** (`ac_midia`, split no fundo, vídeo v4) e o **voluntariado** (`ac_voluntariado`, split na parede de
  marmorato, vídeo v2) são entidades `climate` próprias, com bloco no painel, LED de modo e clique.
- **Animação do ar ao ligar**: a aleta abre e sai um fluxo de ar translúcido da unidade até o piso — azul-claro no
  frio, laranja no quente, neutro no seco/ventilar. Desligou, some. O fluxo anda (~16 quadros/s) só nos primeiros
  segundos depois de ligar ou enquanto a câmera está focada no ar, e só com o aparelho na tela; depois fica parado e
  visível. Com `prefers-reduced-motion` ou a aba oculta ele não anda, e sem ar ligado o cartão não redesenha nada.
- **A câmera voa até o ar que ligou**, venha o comando do cartão, do Home Assistant ou de uma automação: enquadra o
  aparelho e o fluxo (no templo, a parede com os 3 splits). Não voa na carga inicial; com vários ao mesmo tempo, vai
  para o último. Girar/aproximar solta o foco; **Recentrar** volta à vista padrão. Na demo, clicar num ar mostra o voo.
- **Botão "Vista de cima"**: planta vista de cima (quase a prumo), com o prédio inteiro, sem cobertura/fachada, todos
  os cômodos rotulados, as luzes acesas e um selo em cada ar ligado (❄ frio, chama quente, gota seco, hélice
  ventilar) — para conferir automações e animações de uma vez. **Recentrar** volta à vista normal. No celular os
  botões ficam em 2 linhas.
- **Templo sem as tesouras brancas**: a pedido do cliente saíram as tesouras/terças brancas da cobertura e as
  hastes/correntes; os **high-bays redondos, a fileira de lampadinhas e a treliça de luz da plateia ficam suspensos**
  no mesmo lugar e altura. A treliça preta do palco (sobre o telão) continua igual.

## Novidades da v1.2 — templo e acabamentos reais (fotos e vídeos do cliente)

A v1.2 refaz o templo e os acabamentos a partir da foto do templo e dos vídeos enviados pela igreja,
que passaram a ser a referência principal. A planta continua valendo para paredes e portas.

**Templo com o palco na parede lateral**
- **O palco agora fica na parede lateral longa (x = 0), a pedido do cliente.** Ele é "atravessado": tem 16,6 m
  de frente, 4,85 m de fundo e 1,0 m de altura, e a plateia fica virada para ele. A **sala de mídia fica de frente
  para o palco**, e pelo visor dela se vê o culto.
- A **parede do palco é preta e tem 8,5 m de altura** mesmo na vista de casinha de boneca, porque é o fundo do
  palco. As outras paredes do templo continuam com 3 m para deixar o interior à mostra, e as faces internas delas
  também são pretas.
- **O telão de LED tem 8,4 × 3,0 m** e fica logo acima do piso do palco. Ao lado dele há **duas telas brancas de
  projeção**, que acendem de leve com o telão.
- **A treliça preta fica acima do telão**, com os **4 moving heads** do `palco`, pares e barras de LED. Os feixes
  seguem a cor RGB. Há ainda **line arrays** pendurados por correntes (dois clusters por lado) e uma segunda
  treliça de luz sobre a plateia.
- **O palco segue a foto:**
  - piso de madeira clara com testeira preta;
  - escadas com corrimão inox nas duas pontas;
  - bateria Pearl sobre praticável preto;
  - teclado em suporte X, violão e baixo em pedestais;
  - microfones, retornos e pedaleiras.
- **A cobertura fica aparente**, com tesouras metálicas brancas a cada 5 m, pilares e vigas pretos, terças e um
  cordão de lampadinhas quentes no beiral. Os **12 high-bays redondos** da `plateia` ficam pendurados nas tesouras (tesouras retiradas na v1.3).
  No modo Fachada a cobertura interna some.
- **A plateia tem 414 cadeiras pretas estofadas de encosto alto** em 4 blocos. O corredor central fica alinhado
  com o centro do palco, e os blocos das pontas são levemente angulados, como nos vídeos. Os corredores deixam
  livres as portas, o visor da mídia e o acesso do hall.
- **O piso do templo é de porcelanato cinza-claro 0,9 × 0,9 polido**, que reflete as luzes.
- **Paredes do templo:** 5 ares grandes no alto, nenhum deles na parede do palco. Há também extintores com placa,
  placas de SAÍDA acesas e uma porta preta de correr com a placa "SAÍDA DE EMERGÊNCIA".

**Acabamentos do prédio**
- **Piso:**
  - laminado carvalho/mel com rodapé de madeira nos corredores, salas, mídia, voluntariado e escritórios;
  - porcelanato bege 0,9 × 0,9 nos banheiros.
- **Paredes:** internas em greige, com paredes de destaque em **marmorato** (cimento queimado).
- **Portas e janelas:** portas de **cedro** com guarnição de madeira e alavanca cromada; visores e janelas internas
  com caixilho preto e vidro fumê.
- **Mídia (v4):** placas acústicas grafite, bancada preta longa sob o visor, monitores, road case turquesa e
  cadeiras de operador com assento e encosto azuis.
- **Voluntariado (v2):** letreiro "FAÇAM TUDO COMO PARA O SENHOR", poltronas terracota, sofás cinza, cortina,
  buffet grafite com tampo de madeira e frigobar.
- **Depósito:** estantes de aço preto com caixas organizadoras.
- **Banheiros (v3):**
  - porcelanato cinza até 1,3 m, com **mármore marrom imperador** acima;
  - bancadas de quartzo com cubas de apoio e espelhos com moldura de LED que acendem com `banheiros`;
  - cabines de vidro fumê;
  - bebedouro inox;
  - faixa azul com a placa na entrada.
- **Hall e Sala da Família:** parede de marmorato no hall; WC e WC PCD no mesmo padrão dos banheiros; sala da
  família com marmorato, sofá cinza e cortinas.
- **A vista inicial ficou um pouco mais à direita.** Ela mostra o palco e o telão em diagonal sem perder o
  letreiro da fachada.

**Motor**
- **Materiais com padrão calculado no espaço** (`M.marmorato`, `M.acustico`, `M.porcelanatoCinza`,
  `M.marmoreMarrom`): repetem em metros em qualquer peça, sem textura nem sampler a mais.
- **Novos estilos de luminária:** `moving` (moving head de treliça) e `hang` (high-bay preso a uma estrutura; na v1.3 virou `susp`, suspenso sem haste).
- **Novas opções de parede:** revestimento por lado (`clad`) e porta preta de correr (`style: 'black'`).
- **Correção de desempenho:** o cache de materiais (`ctx.std`) serializava a imagem inteira de uma textura a
  cada chamada, o que custava cerca de 2,5 s por construção da cena. Agora usa o uuid da textura.

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
| `tools/lib.mjs` + `nav_test.mjs`, `walk_test.mjs`, `gov_test.mjs`, `integ_test.mjs` | Testes headless da v1.4 (Vista de cima navegável, visão de pessoa, governador, convivência). `THREE_LOCAL=<three.module.min.js> node tools/nav_test.mjs index.html` |
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
quality: auto         # auto (padrão: alta com GPU dedicada; media em PC com vídeo integrado; leve em celular/tablet ou ≤ 4 GB de RAM;
                      #   min em renderizador por software, ≤ 2 GB ou ≤ 2 núcleos com ≤ 4 GB) · alta · media · leve · min
entorno: auto         # ruas, vizinhos, árvores de rua e postes: auto (some só no leve) · true · false
weather: true         # widget de clima ao vivo no canto inferior direito (Open-Meteo, sem chave)
weather_city: 'Palmas, TO'
timezone: America/Sao_Paulo      # relógio e nascer/pôr do sol (no HA vale o fuso do próprio HA)
latitude: -10.27                 # clima (sempre) e posição do sol fora do HA — no HA o sol usa
longitude: -48.33                #  a localização configurada no próprio HA (hass.config)
orientation: 90       # para onde a fachada (lado do estacionamento) aponta: 0=N, 90=L, 180=S, 270=O (Base Church: leste)
entities:
  # ---- Templo ----
  palco:          light.palco_rgb              # moving heads do palco (RGB + brilho)
  plateia:        light.templo_plateia         # luminárias da plateia (brilho)
  telao:          media_player.telao_led       # telão LED: acende e mostra o título tocando
  som:            switch.som_templo            # LEDs verdes nas quinas do palco
  ac_templo:      climate.ar_templo            # 5 splits do templo (LED azul = frio; aleta + fluxo de ar)
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
  ac_midia:       climate.ar_midia             # split da sala de mídia (vídeo v4)
  voluntariado:   light.voluntariado
  ac_voluntariado: climate.ar_voluntariado     # split do voluntariado (vídeo v2)
  cozinha:        light.cozinha                # cozinha + almoxarifado
  sun:            sun.sun                      # dia/noite automático
```

Só precisa listar as chaves que quiser trocar; as que ficarem de fora usam o nome de exemplo acima.

## Como funciona

- **Luz / interruptor**: clique no ambiente, na luminária ou no bloco → `homeassistant.toggle` na
  entidade (resposta otimista, o HA confirma em seguida). A luz do palco segue a cor real
  (`rgb_color`) e o brilho; a plateia segue o brilho.
- **Telão, ares e sensores**: clique abre o *more-info* da entidade (o painel padrão do HA).
- **Ares (`climate`)**: um por cômodo que tem ar nos vídeos — templo (5 splits), mídia, voluntariado — e a pastoral.
  Ligado, a aleta abre e sai o fluxo de ar (cor pelo modo); o LED mostra o modo. Quando um ar liga (pelo cartão, pelo
  HA ou por automação, fora da carga inicial) a **câmera voa até ele**; *Recentrar* volta.
- **Vista de cima**: o botão mostra a planta de cima, sem cobertura, com todos os cômodos rotulados e um selo em cada
  ar ligado (❄ frio · chama quente · gota seco · hélice ventilar · A auto). Dela dá para **descer por níveis** — clique num
  bloco, depois num cômodo, e ligue/desligue os aparelhos dele; **‹ Voltar** (ou Esc) sobe um nível. *Recentrar* volta à vista normal.
- **Pessoa**: o botão *Pessoa* põe a câmera na altura dos olhos, dentro do prédio: setas/WASD (ou o joystick na tela) andam,
  arrastar vira a cabeça, Shift corre, Esc sai. As paredes seguram a pessoa; portas e vãos passam.
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
  volta a vista de casinha de boneca (paredes de 3 m, sem teto — exceto a parede preta de 8,5 m atrás do palco;
  sobre o templo só as luminárias suspensas, sem as tesouras brancas). O **painel ripado com o letreiro BASE
  CHURCH e o refletor ficam visíveis nos dois modos** (a identidade do prédio vista da rua); os rótulos dos
  ambientes somem enquanto o modo Fachada está ligado.
- **Entorno**: estacionamento frontal em intertravado cinza (espinha de peixe), sem carros, vagas PCD, cerca-viva e cicas na
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
| **Culto** | liga palco, plateia, som, hall, fachada e estacionamento; `media_player.turn_on` no telão; `climate.set_hvac_mode: cool` nos ares do templo e da mídia |
| **Louvor** | plateia a 30 %, palco roxo/azul (`rgb_color` 110,70,255) a 100 %, telão e som |
| **Pregação** | plateia a 80 %, palco branco quente (255,196,140) |
| **Ensaio da banda** | palco, som e telão ligados; plateia apagada |
| **Abrir a igreja** | fachada, estacionamento, hall, banheiros e recepção |
| **Expediente** | administrativo, pastoral, recepção, circulação e ar da pastoral em frio |
| **Fechar tudo** | todas as luzes, som e telão desligados; os ares de todos os cômodos (templo, pastoral, mídia, voluntariado) em `off` |

Elas não precisam existir no HA: o cartão chama os serviços direto (`homeassistant.turn_on/turn_off`,
`light.turn_on`, `media_player.*`, `climate.set_hvac_mode`). Para mudar, edite `SCENES` no cartão.

## Mapa dos ambientes

Coordenadas em metros (X → direita a partir do muro esquerdo, Z → frente; fachada em z ≈ 49,7).

| Área | Ambientes | Entidade ao clicar |
|---|---|---|
| Fundos (z 0–12,4) | Estacionamento interno e pátio · Almoxarifado · Cozinha · Recepção · Sala Pastoral (+ banheiro) · Caixa d'água · jardins | `estacionamento` · `cozinha` · `recepcao` · `pastoral` |
| Ala direita (x 16–20) | Corredor da entrada lateral · Sala Gilvan · Administrativo · Circulação · Mídia · Voluntariado · Depósito · Área técnica · WC Masc. · Hall dos banheiros · WC Fem. | `circulacao` · `administrativo` · `midia` (+ `ac_midia`) · `voluntariado` (+ `ac_voluntariado`) · `banheiros` |
| Templo (z 12,4–44) | Palco na parede lateral x = 0 com telão, telas de projeção, banda, treliça e line arrays · plateia de 414 cadeiras virada para −x · cobertura aparente | `plateia` (piso, high-bays), `palco` (moving heads), `telao`, `som`, `ac_templo` |
| Entrada (z 44–49,65) | Hall com balcão, café, lounge e escada · Sala da Família · WC · WC PCD | `hall` · `familia` · `banheiros` |
| Frente (z > 49,7) | Jardins, calçada, estacionamento frontal com vagas PCD | `fachada` · `estacionamento` |

## Ajustando a planta

Tudo está em metros no topo de `igreja3d-card.js` (X → direita, Z → frente) e documentado em
`rooms/BRIEF.md`:

- `ZONES` — os pisos (ambientes), a textura de cada um e qual entidade o clique alterna.
- `ITEMS` — luminárias: posição `p`, intensidade `i` (cd), alcance `d` (m), estilo (refletor com feixe, moving head, pendente linear de LED,
  high-bay industrial, poste, arandela) e quais projetam sombra.
- `PILLARS_L` / `PILLARS_R` — pilares do templo nas paredes x = 0 e x = 16,05.
- `_buildWalls()` — paredes com portas (`door`), janelas (`window`), vidro (`glass`), porta de vidro de
  2 folhas (`glassdoor`), vãos (`open`) e portão (`gate`).
- `_buildFurniture()` — objetos ligados a entidades (telão, som, splits) e chamadas das funções de
  decoração (`roomTemploPalco`, `roomTemploPlateia`, `roomHallFamilia`, `roomAlaDireita`,
  `roomAdministrativo`, `roomServicoPatio`, `roomFachada`), coladas entre `@rooms-begin` e `@rooms-end`.
- Para refazer a decoração de uma área: edite `rooms/<área>.js` e rode `python3 integrate_rooms.py`.

Depois de editar, `python3 build.py` regenera a demo. Para conferir sem GPU:
`THREE_LOCAL=<three.module.min.js> WAIT=8000 node tools/shot.mjs index.html vista.png 1400 900 'document.querySelector("igreja3d-card").setFachada(true)'`
(ganchos: `setView([x,y,z],[tx,ty,tz])`, `setFachada(bool)`, `setMode('auto'|'day'|'night')`, `setSimTime(data)`, `setTopNav(bloco, cômodo)`/`getTopNav()`,
`setWalk(bool)`/`setWalkPose(x,z,yaw,pitch)`/`getWalkPose()`, `getQuality()`;
na demo, `window.demo.set('palco','on',{rgb_color:[255,0,0]})` e `window.demo.setAll(true)`).

## Desempenho

Medido na demo (Chromium, vista padrão 1400×900). A cena roda no dispositivo que abre o dashboard,
não no HA nem no GitHub.

- ~5.200 malhas (paredes, palco, móveis, fachada) são fundidas por material na inicialização:
  **5.152 → 250 draw calls** na cena + **171 → 12** no grupo da Fachada. As 414 cadeiras e a cobertura do templo
  já saem fundidas da própria decoração (4.418 peças → 14 malhas). No total, a vista padrão desenha **~405 draw
  calls por quadro** (com pisos, luminárias, rótulos, halos e feixes). A v1.1 desenhava ~419; a vista de topo
  caiu de 414 para 399 e o interior do templo de 237 para 221.
  Materiais simples praticamente iguais (±22/255 na cor, ±0,25 na rugosidade) são unificados antes da
  fusão; materiais **idênticos** com textura/emissivo/transparência também (ex.: as laterais de todas as
  letras caixa do logo), os halos da mesma entidade compartilham material e as peças de uma mesma
  luminária/entidade viram uma malha só.
- **26 luzes reais** (PointLight: 25 luminárias + a do telão); **8 com sombra** em `quality: alta`.
  As outras luminárias são só "brilho" (emissivo + halo), sem custo de luz.
- **`quality: media`** (v1.3, automático em PC com vídeo integrado — Intel, AMD APU): visual próximo do alta
  com custo perto do leve. Entorno visível (gramado Lambert sem o laço das lâmpadas); **conjunto fixo de 11 luzes
  reais (2 com sombra)** redistribuído às luminárias que importam no enquadramento quando a câmera para — de longe
  parece o leve, perto de um cômodo fica igual ao alta; environment map só nos materiais brilhantes (vidro, metal,
  porcelanato polido) e sonda SH para a luz difusa do céu; shaders compilados antes do primeiro quadro; resolução
  dinâmica durante o movimento. Medido no SwiftShader (1400 × 900): quadro ~550 ms (leve ~300–390, alta ~3.200).
- **`quality: leve`** (automático em celular/tablet, ex. Galaxy Tab S6 Lite): só **9 luzes reais** —
  palco 2, plateia 2, hall 1, fachada 1, estacionamento 2 e o telão (tabela `LITE_LIGHTS` no topo do
  arquivo) — mais fortes e com alcance maior para compensar; as demais viram brilho, **nenhuma lâmpada
  projeta sombra** (só o sol, 1024²); parado a imagem sai na resolução cheia da tela (até 2 Mpx). O visual é
  praticamente o mesmo; as salas pequenas ficam um pouco mais escuras à noite. Medido no SwiftShader:
  quadro ~1,7× mais rápido e atualização de sombras de 635 ms → 5 ms.
  Desde a v1.2.4 o leve também: fica **sem o reflexo do céu** (environment map, ~⅓ do custo de cada quadro),
  **esconde o entorno** (ruas, vizinhos, árvores de rua e postes; o gramado vira cor chapada — volta com
  `entorno: true`), **não anima o telão parado** (sem interação a cena não é redesenhada) e, enquanto
  você gira/aproxima, desenha com 55 % da resolução e faz um quadro nítido ao soltar. Medido no
  SwiftShader (1400 × 900): quadro 1914 → 390 ms (~5×) e carregamento 10,3 → 4,9 s.
  Em GPU com pouca margem (< 512 vetores de uniform no fragment ou < 16 samplers) as luzes fracas
  das salas viram só brilho (fica com 16 luzes reais, 3 com sombra) e o cartão avisa no console.
- **`quality: min`** (v1.4, automático em renderizador por software, ≤ 2 GB ou ≤ 2 núcleos com ≤ 4 GB): tudo do `leve` e mais
  **nenhuma sombra** (nem a do sol), pisos sem relevo/AO e só **5 luzes reais + telão** (`MIN_LIGHTS`). Medido no
  SwiftShader (1400 × 900, mesma sessão do `leve`): quadro **~0,6× o do `leve`** (171–240 ms contra 295–374 ms; `alta` ~3.200,
  `media` ~550), mesmas 390 chamadas e 222 mil triângulos, carga com shaders em cache em ~2,7 s (`leve`: 12–15 s, pelos shaders de sombra).
  Como o SwiftShader é software, o `auto` cai em `min` nele.
- **Governador de qualidade** (v1.4): a resolução em movimento parte de 100 % (alta), 60 % (media), 55 % (leve) ou 45 % (min)
  e desce até 50 / 35 / 35 / 30 % conforme o tempo de quadro (no SwiftShader chega ao piso em ≤ 3 s de arrasto); ao soltar sai
  exatamente **um** quadro nítido. Parado, 0 redesenhos (medido em 8 s: `media` 0 · `min` 0 · `leve` 1 do assentamento da câmera ·
  `alta` ≤ 8/s só com o telão tocando). A escada de rebaixamento (só no `auto`) foi exercitada forçando `media` + `auto` num arrasto
  de 30 s: degrau 1 (entorno some) → 2 (11 → 7 luzes reais) → 3 (resolução mínima menor), sem erros e sem travar a página.
- **Vista de cima e Pessoa** não redesenham parados; andar liga o mesmo caminho de resolução reduzida do governador
  (a flag de movimento do controle de câmera é espelhada pelo andador). A colisão usa ~90 segmentos de parede
  (`_walls`, registrados em `_wallSeg`) e custa microssegundos por quadro.
- Sombras das luzes em 256² (no `leve` não há sombra de lâmpadas): **~64 MB** de GPU no total, contra 160 MB antes. Elas são
  desenhadas **uma vez** (a geometria é estática) e só refeitas quando a porta do hall gira ou o modo
  Fachada muda; nas transições dia/noite e com o sol andando só a sombra do sol é refeita.
- Tone mapping Neutral (exposição 1,0): o preto da fachada fica preto e as cores do palco e do telão
  ficam fiéis. O telão não passa pelo tone mapping e tem um halo de LED em volta; os 4 refletores do
  palco (moving heads) têm feixe de luz falso (cone aditivo, 4 draw calls) que segue a cor RGB e o brilho da entidade.
- Construção da cena (`_build3D`): **~0,55 s** com os shaders já em cache (v1.1: ~0,58 s no mesmo teste) e
  ~10–11 s na primeira vez, quase tudo compilação de shader. A medição é em Chromium com SwiftShader (CPU, sem GPU);
  numa GPU real é bem menos. São **~252 mil triângulos** (v1.1: ~307 mil) e 33 programas de shader (v1.1: 29; os 4 a
  mais são os padrões em espaço de mundo). Cada material usa no máximo 13 das 16 unidades de textura
  (map + bump + ao + ambiente + 9 sombras).
- Sombras só recalculam quando um estado muda; nada é renderizado parado (só quando a câmera se
  move, um estado muda ou o telão está tocando, a 30 fps).
- Pixel ratio adaptativo (v1.4.1): parado, a imagem sai sempre na **resolução cheia** da tela (teto de 2,8 Mpx em `alta`, 3,5 com GPU
  dedicada; 2,4 em `media`; 2,0 em `leve`; 1,4 em `min`), com MSAA em toda GPU de verdade; só o movimento desenha uma fração disso.
- Parado, a cena não é redesenhada; com o telão tocando, a animação roda a no máximo ~8 quadros/s e para quando a aba ou o cartão saem da tela.
- Ligar/desligar luz não recompila shaders (todas as luzes ficam ativas com intensidade zero).
- No disco o cartão tem ~485 KB (a demo `index.html`, com o cartão embutido, ~497 KB).

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
