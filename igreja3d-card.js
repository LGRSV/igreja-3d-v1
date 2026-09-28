/*
 * Igreja 3D — cartão Lovelace para Home Assistant (+ demo standalone)
 * Modelo 3D da Base Church (802 Sul · Palmas-TO) em Three.js. As luzes, o telão,
 * o som e os ares acendem conforme o estado das entidades do HA; clicar num
 * ambiente (ou num bloco do painel) alterna a entidade.
 * Motor derivado do casa3d-card (repositório casa-chefe).
 *
 * Instalação: veja o README.md ao lado deste arquivo.
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';

export const VERSION = '1.2.3';

// Única fonte de verdade para as opções do cartão — usada tanto no construtor (antes de
// qualquer setConfig, caso do próprio elemento já presente no HTML ao carregar o módulo)
// quanto em setConfig().
const DEFAULT_CONFIG = {
  title: 'Base Church', labels: true, mode: 'auto', night_vision: true, panel: true, roof: false,
  quality: 'auto', entities: {},   // auto | alta | leve
  latitude: -10.27, longitude: -48.33, timezone: 'America/Sao_Paulo', orientation: 90,
  weather: true, weather_city: 'Palmas, TO',
};

// ---------------------------------------------------------------------------
// Entidades (sobrescreva no YAML do cartão em `entities:`) — nomes de exemplo
// ---------------------------------------------------------------------------
export const DEFAULT_ENTITIES = {
  palco:          'light.palco_rgb',
  plateia:        'light.templo_plateia',
  telao:          'media_player.telao_led',
  som:            'switch.som_templo',
  ac_templo:      'climate.ar_templo',
  hall:           'light.hall_entrada',
  fachada:        'light.fachada_letreiro',
  estacionamento: 'light.estacionamento',
  pastoral:       'light.sala_pastoral',
  ac_pastoral:    'climate.ar_sala_pastoral',
  recepcao:       'light.recepcao',
  administrativo: 'light.administrativo',
  circulacao:     'light.circulacao',
  midia:          'light.sala_midia',
  voluntariado:   'light.voluntariado',
  cozinha:        'light.cozinha',
  banheiros:      'light.banheiros',
  familia:        'light.sala_familia',
  presenca:       'binary_sensor.presenca_templo',
  porta:          'binary_sensor.porta_principal',
  temperatura:    'sensor.temperatura_templo',
  sun:            'sun.sun',
};

// ---------------------------------------------------------------------------
// Itens controláveis: luminárias (posição em metros, X→direita, Z→frente)
// i = intensidade (cd), d = alcance (m), shadow = projeta sombra nas paredes
// Estilos: (padrão) pendente · spot = refletor de palco (com feixe) · moving = moving head de treliça (feixe para +x/baixo)
// · highbay = pendente industrial grande (hang = y da estrutura onde se prende: haste curta, sem cabo no ar) · linear = pendente linear de LED 2,4 m (cabos até o trilho do teto, y 6,43) · pole = poste de 5,5 m · sconce = arandela · lamp = abajur.
// glowOnly = só lâmpada + halo + emissivo (sem PointLight — economiza luzes reais).
// liteShadow = mantém a sombra em GPU com margem pequena (_tight). Em `quality: leve` nenhuma lâmpada projeta sombra (só o sol).
// ext = a luminária só aparece no modo Fachada (a luz em si vale sempre).
// ---------------------------------------------------------------------------
// quality leve: quantas luzes reais cada item mantém (as outras viram só brilho). Total ≈ 8 + telão.
const LITE_LIGHTS = { palco: 2, plateia: 2, hall: 1, fachada: 1, estacionamento: 2 };

export const ITEMS = [
  { key: 'palco', label: 'Palco (RGB)', kind: 'light', icon: 'spot', rgb: true, dim: true, color: 0xb88cff,
    fixtures: [
      // 4 moving heads pendurados na treliça preta acima do telão (parede do palco x = 0), mirando o palco (+x e para baixo)
      { p: [0.8, 6.05, 23.9], i: 70, d: 14, moving: true, shadow: true },
      { p: [0.8, 6.05, 26.7], i: 70, d: 14, moving: true },
      { p: [0.8, 6.05, 29.5], i: 70, d: 14, moving: true },
      { p: [0.8, 6.05, 32.3], i: 70, d: 14, moving: true, shadow: true },
    ] },
  { key: 'plateia', label: 'Plateia', kind: 'light', icon: 'bulb', dim: true, color: 0xffe2bd,
    fixtures: [
      // high-bays redondos pendurados nas tesouras brancas (banzo inferior y 7,6) sobre a plateia (x 6,3–15,5);
      // a tesoura de z 28,5 (sobre o corredor central, frente da mídia) fica sem luminária
      { p: [7.2, 7.2, 23.5], i: 120, d: 20, highbay: true, hang: 7.6, shadow: true, liteShadow: true },
      { p: [14.0, 7.2, 23.5], i: 120, d: 20, highbay: true, hang: 7.6 },
      { p: [7.2, 7.2, 33.5], i: 120, d: 20, highbay: true, hang: 7.6 },
      { p: [14.0, 7.2, 33.5], i: 120, d: 20, highbay: true, hang: 7.6, shadow: true },
      ...[[10.6, 23.5], [10.6, 33.5], [7.2, 18.5], [10.6, 18.5], [14.0, 18.5], [7.2, 38.5], [10.6, 38.5], [14.0, 38.5]]
        .map(([x, z]) => ({ p: [x, 7.2, z], highbay: true, hang: 7.6, glowOnly: true })),
    ] },
  { key: 'telao', label: 'Telão LED', kind: 'media', icon: 'tv' },
  { key: 'som', label: 'Som do templo', kind: 'switch', icon: 'speaker' },
  { key: 'ac_templo', label: 'Ar do templo', kind: 'climate', icon: 'ac' },
  { key: 'hall', label: 'Hall de entrada', kind: 'light', icon: 'bulb', color: 0xffe7c8,
    fixtures: [
      { p: [7.5, 2.7, 46.8], i: 30, d: 8, shadow: true, liteShadow: true },
      { p: [11.5, 2.7, 46.8], i: 30, d: 8 },
    ] },
  { key: 'fachada', label: 'Fachada / letreiro', kind: 'light', icon: 'sign', color: 0xffd9a8,
    fixtures: [
      { p: [8.9, 8.05, 50.35], i: 60, d: 11, spot: true, aim: 'wall' },   // no topo do painel ripado (sempre visível), acima do logo
      { p: [14.6, 2.8, 49.85], i: 14, d: 6, sconce: true },
      { p: [5.0, 2.8, 49.85], sconce: true, glowOnly: true },
    ] },
  { key: 'estacionamento', label: 'Estacionamento', kind: 'light', icon: 'car', color: 0xfff1dc,
    fixtures: [
      { p: [4, 5.5, 55.5], i: 140, d: 16, pole: true },
      { p: [16, 5.5, 55.5], i: 140, d: 16, pole: true },
      { p: [0.16, 2.8, 6.2], sconce: true, glowOnly: true },   // arandela no muro x = 0
    ] },
  { key: 'pastoral', label: 'Sala pastoral', kind: 'light', icon: 'bulb', color: 0xffe0b8,
    fixtures: [
      { p: [14.9, 2.7, 4.6], i: 30, d: 8, shadow: true, liteShadow: true },
      { p: [18.5, 2.7, 7.0], glowOnly: true },
    ] },
  { key: 'ac_pastoral', label: 'Ar da pastoral', kind: 'climate', icon: 'ac' },
  { key: 'recepcao', label: 'Recepção', kind: 'light', icon: 'bulb', color: 0xfff1dc,
    fixtures: [{ p: [11.1, 2.7, 7.6], i: 20, d: 5.5 }] },
  { key: 'administrativo', label: 'Administrativo', kind: 'light', icon: 'bulb', color: 0xfff5e6,
    fixtures: [
      { p: [18.6, 2.7, 12.6], i: 18, d: 5 },
      { p: [18.6, 2.7, 16.6], i: 22, d: 6 },
    ] },
  { key: 'circulacao', label: 'Circulação', kind: 'light', icon: 'bulb', color: 0xfff1dc,
    fixtures: [
      { p: [18.0, 2.7, 21.1], i: 20, d: 6 },
      { p: [16.6, 2.7, 14.8], glowOnly: true },
      { p: [19.5, 2.7, 25.6], glowOnly: true },
      { p: [16.6, 2.7, 35.5], glowOnly: true },
    ] },
  { key: 'midia', label: 'Sala de mídia', kind: 'light', icon: 'bulb', color: 0xd8e6ff,
    fixtures: [{ p: [17.5, 2.7, 25.6], i: 18, d: 5.5 }] },
  { key: 'voluntariado', label: 'Voluntariado', kind: 'light', icon: 'bulb', color: 0xffe9cc,
    fixtures: [{ p: [18.1, 2.7, 30.9], i: 26, d: 7, shadow: true }] },
  { key: 'cozinha', label: 'Cozinha / almox.', kind: 'light', icon: 'bulb', color: 0xfff5e4,
    fixtures: [
      { p: [10.7, 2.7, 1.95], i: 22, d: 6 },
      { p: [6.75, 2.7, 1.95], glowOnly: true },
    ] },
  { key: 'banheiros', label: 'Banheiros', kind: 'light', icon: 'bulb', color: 0xfff7ea,
    fixtures: [
      { p: [18.1, 2.7, 42.5], i: 18, d: 5.5 },
      { p: [18.6, 2.7, 46.9], i: 18, d: 5.5 },
      { p: [18.6, 2.7, 38.9], glowOnly: true },
      { p: [0.95, 2.7, 45.1], glowOnly: true },
      { p: [2.95, 2.7, 45.1], glowOnly: true },
      { p: [18.6, 2.7, 34.9], glowOnly: true },
    ] },
  { key: 'familia', label: 'Sala da família', kind: 'light', icon: 'bulb', color: 0xffdcae,
    fixtures: [{ p: [2.0, 2.7, 48.0], i: 20, d: 5.5, shadow: true }] },
  { key: 'presenca', label: 'Presença', kind: 'sensor', icon: 'motion' },
  { key: 'porta', label: 'Porta principal', kind: 'sensor', icon: 'door' },
  { key: 'temperatura', label: 'Temperatura', kind: 'sensor', icon: 'thermo' },
];


// Ícones dos chips (SVG inline, 16px, traço)
const ICONS = {
  bulb: '<path d="M8 1.6a4.4 4.4 0 0 0-2.5 8c.4.3.6.7.6 1.2v.9h3.8v-.9c0-.5.2-.9.6-1.2a4.4 4.4 0 0 0-2.5-8z"/><path d="M6.4 13.6h3.2M7 15.2h2"/>',
  led:  '<rect x="1.5" y="5.5" width="13" height="5" rx="2.5"/><circle cx="4.5" cy="8" r=".9" fill="currentColor" stroke="none"/><circle cx="8" cy="8" r=".9" fill="currentColor" stroke="none"/><circle cx="11.5" cy="8" r=".9" fill="currentColor" stroke="none"/>',
  ac:   '<rect x="1.5" y="3.2" width="13" height="6" rx="1.4"/><path d="M4 6.2h8M4.2 12v1.6M8 12v2.6M11.8 12v1.6"/>',
  tv:   '<rect x="1.5" y="2.6" width="13" height="8.8" rx="1.2"/><path d="M5.6 14h4.8M8 11.4V14"/>',
  home: '<path d="M2.5 8.2 8 3.2l5.5 5M4 7v6.3h8V7"/>',
  moon: '<path d="M13 9.6A5.2 5.2 0 0 1 6.4 3a5.4 5.4 0 1 0 6.6 6.6z"/>',
  film: '<rect x="2" y="3" width="12" height="10" rx="1.2"/><path d="M5 3v10M11 3v10M2 6h3M2 10h3M11 6h3M11 10h3"/>',
  power: '<path d="M8 2.5v5.5"/><path d="M4.6 4.6a4.8 4.8 0 1 0 6.8 0"/>',
  panel: '<rect x="1.5" y="2.5" width="13" height="11" rx="1.4"/><path d="M9.5 2.5v11M11 6h2M11 8.5h2"/>',
  play: '<path d="M5 3.5v9l7-4.5z" fill="currentColor" stroke="none"/>',
  motion: '<circle cx="8" cy="8" r="1.4" fill="currentColor" stroke="none"/><path d="M4.6 4.6a4.8 4.8 0 0 0 0 6.8M11.4 4.6a4.8 4.8 0 0 1 0 6.8M2.4 2.4a8 8 0 0 0 0 11.2M13.6 2.4a8 8 0 0 1 0 11.2"/>',
  lux: '<circle cx="8" cy="8" r="2.6"/><path d="M8 1.5v1.8M8 12.7v1.8M1.5 8h1.8M12.7 8h1.8M3.4 3.4l1.3 1.3M11.3 11.3l1.3 1.3M3.4 12.6l1.3-1.3M11.3 4.7l1.3-1.3"/>',
  person: '<circle cx="8" cy="5" r="2.6"/><path d="M2.8 14a5.2 5.2 0 0 1 10.4 0"/>',
  auto: '<path d="M8.8 1.8 4.2 9h3.4l-.9 5.2L11.8 7H8.4z"/>',
  timer: '<circle cx="8" cy="9" r="5"/><path d="M8 6.5V9l1.8 1.2M6 1.8h4"/>',
  pause: '<path d="M5.5 3.5v9M10.5 3.5v9" stroke-width="2"/>',
  sun: '<circle cx="8" cy="8" r="3"/><path d="M8 1.6v1.6M8 12.8v1.6M1.6 8h1.6M12.8 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1"/>',
  moon: '<path d="M13 9.6A5.2 5.2 0 0 1 6.4 3a5.4 5.4 0 1 0 6.6 6.6z"/>',
  cloudsun: '<circle cx="4.6" cy="4.6" r="2" /><path d="M4.6 1v1M4.6 8.2v1M1 4.6h1M8.2 4.6h1M1.9 1.9l.8.8M6.5 6.5l.8.8M1.9 7.3l.8-.8"/><path d="M5.6 13.4h5.9a2.5 2.5 0 0 0 .5-4.95 3.4 3.4 0 0 0-6.3-1.6A2.7 2.7 0 0 0 3 9.2a2.5 2.5 0 0 0 .3 5.0h.1"/>',
  cloud: '<path d="M4.4 13h7.3a2.6 2.6 0 0 0 .5-5.15 3.5 3.5 0 0 0-6.6-1.5A2.8 2.8 0 0 0 2 9.1 2.7 2.7 0 0 0 4.4 13z"/>',
  fog: '<path d="M4 6.6h7.3a2.4 2.4 0 0 0 .5-4.75A3.2 3.2 0 0 0 5.7 .95 2.6 2.6 0 0 0 1.9 3.3 2.5 2.5 0 0 0 4 6.6z"/><path d="M2 9.4h12M2 12h12"/>',
  rain: '<path d="M4.4 8.3h7.3a2.6 2.6 0 0 0 .5-5.15 3.5 3.5 0 0 0-6.6-1.5A2.8 2.8 0 0 0 2 4.4a2.7 2.7 0 0 0 2.4 3.9z"/><path d="M4.6 10.4 3.6 13M8 10.4 7 13M11.4 10.4l-1 2.6"/>',
  storm: '<path d="M4.4 7.3h7.3a2.6 2.6 0 0 0 .5-5.15 3.5 3.5 0 0 0-6.6-1.5A2.8 2.8 0 0 0 2 3.4a2.7 2.7 0 0 0 2.4 3.9z"/><path d="M8.6 9.2 6.4 12.4h2.3L7 15"/>',
  snow: '<path d="M4.4 8.3h7.3a2.6 2.6 0 0 0 .5-5.15 3.5 3.5 0 0 0-6.6-1.5A2.8 2.8 0 0 0 2 4.4a2.7 2.7 0 0 0 2.4 3.9z"/><path d="M5 10.6v3M3.6 12.1h2.8M10.6 10.6v3M9.2 12.1h2.8"/>',
  spot: '<path d="M2.2 4.6 7.6 2l2.3 4.8-5.4 2.6z"/><path d="M9.2 5.4l2.6-1.2M6.4 9.2 8.6 14M4.4 14h6.4"/><path d="M10.6 8.2l3.2 1.4M10.2 10.4l2.4 2.2"/>',
  speaker: '<rect x="3.5" y="1.5" width="9" height="13" rx="1.6"/><circle cx="8" cy="10" r="2.4"/><circle cx="8" cy="4.8" r="1"/>',
  door: '<path d="M3.5 14.5V2.2h9v12.3M1.5 14.5h13"/><circle cx="10.2" cy="8.4" r=".7" fill="currentColor" stroke="none"/>',
  thermo: '<path d="M6.5 9.6V3a1.5 1.5 0 0 1 3 0v6.6a3 3 0 1 1-3 0z"/><path d="M8 6.5v5"/>',
  cross: '<path d="M8 1.5v13M4 5.5h8"/>',
  church: '<path d="M8 1.2v3.2M6.6 2.6h2.8M3 14.5V8.2L8 4.8l5 3.4v6.3M6.6 14.5v-3a1.4 1.4 0 0 1 2.8 0v3"/>',
  car: '<path d="M2 11.5V8.6l1.6-3.6h8.8L14 8.6v2.9M2 11.5h12M2 8.6h12"/><circle cx="4.6" cy="11.8" r="1.2"/><circle cx="11.4" cy="11.8" r="1.2"/>',
  music: '<path d="M6 12.5V3.5l7-1.5v9"/><circle cx="4.5" cy="12.5" r="1.6"/><circle cx="11.5" cy="11" r="1.6"/>',
  sign: '<rect x="1.5" y="3" width="13" height="7.5" rx="1"/><path d="M5 13.8h6M8 10.5v3.3M5.5 6.8h5"/>',
  key: '<circle cx="5" cy="8" r="2.8"/><path d="M7.8 8h6.7M12.5 8v2.4M10.5 8v1.8"/>',
  mic: '<rect x="6" y="1.5" width="4" height="7.5" rx="2"/><path d="M3.8 7.5a4.2 4.2 0 0 0 8.4 0M8 11.7v2.8M5.6 14.5h4.8"/>',
  briefcase: '<rect x="1.5" y="5" width="13" height="8.5" rx="1.2"/><path d="M5.8 5V3.3h4.4V5M1.5 9h13"/>',
};

// Códigos WMO (Open-Meteo) → ícone + descrição em pt-BR
const WEATHER_CODE = {
  0: ['sun', 'Céu limpo'], 1: ['cloudsun', 'Poucas nuvens'], 2: ['cloudsun', 'Parcialmente nublado'], 3: ['cloud', 'Nublado'],
  45: ['fog', 'Neblina'], 48: ['fog', 'Neblina com geada'],
  51: ['rain', 'Garoa fraca'], 53: ['rain', 'Garoa'], 55: ['rain', 'Garoa forte'],
  56: ['rain', 'Garoa congelante'], 57: ['rain', 'Garoa congelante forte'],
  61: ['rain', 'Chuva fraca'], 63: ['rain', 'Chuva'], 65: ['rain', 'Chuva forte'],
  66: ['rain', 'Chuva congelante'], 67: ['rain', 'Chuva congelante forte'],
  71: ['snow', 'Neve fraca'], 73: ['snow', 'Neve'], 75: ['snow', 'Neve forte'], 77: ['snow', 'Grãos de neve'],
  80: ['rain', 'Pancadas fracas'], 81: ['rain', 'Pancadas de chuva'], 82: ['rain', 'Pancadas fortes'],
  85: ['snow', 'Pancadas de neve fracas'], 86: ['snow', 'Pancadas de neve fortes'],
  95: ['storm', 'Trovoada'], 96: ['storm', 'Trovoada com granizo'], 99: ['storm', 'Trovoada forte com granizo'],
};

// Rotinas rápidas: ações compostas disparadas pelo cartão (não precisam existir no HA)
const LIGHT_KEYS = ['palco', 'plateia', 'hall', 'fachada', 'estacionamento', 'pastoral', 'recepcao', 'administrativo', 'circulacao', 'midia', 'voluntariado', 'cozinha', 'banheiros', 'familia'];
const SCENES = [
  { id: 'culto', icon: 'church', name: 'Culto', desc: 'Palco, plateia, telão, som, ar do templo, hall, fachada e estacionamento',
    run: (c) => [c.on('palco'), c.on('plateia'), c.call('media_player', 'turn_on', c.e('telao')), c.on('som'),
      c.call('climate', 'set_hvac_mode', c.e('ac_templo'), { hvac_mode: 'cool' }), c.on('hall'), c.on('fachada'), c.on('estacionamento')] },
  { id: 'louvor', icon: 'music', name: 'Louvor', desc: 'Plateia a 30%, palco roxo/azul, telão e som',
    run: (c) => [c.call('light', 'turn_on', c.e('plateia'), { brightness_pct: 30 }), c.call('light', 'turn_on', c.e('palco'), { rgb_color: [110, 70, 255], brightness_pct: 100 }),
      c.call('media_player', 'turn_on', c.e('telao')), c.on('som')] },
  { id: 'pregacao', icon: 'mic', name: 'Pregação', desc: 'Plateia a 80%, palco em branco quente',
    run: (c) => [c.call('light', 'turn_on', c.e('plateia'), { brightness_pct: 80 }), c.call('light', 'turn_on', c.e('palco'), { rgb_color: [255, 196, 140], brightness_pct: 100 })] },
  { id: 'ensaio', icon: 'spot', name: 'Ensaio da banda', desc: 'Palco, som e telão; plateia apagada',
    run: (c) => [c.on('palco'), c.on('som'), c.call('media_player', 'turn_on', c.e('telao')), c.off('plateia')] },
  { id: 'abrir', icon: 'key', name: 'Abrir a igreja', desc: 'Fachada, estacionamento, hall, banheiros e recepção',
    run: (c) => ['fachada', 'estacionamento', 'hall', 'banheiros', 'recepcao'].map((k) => c.on(k)) },
  { id: 'expediente', icon: 'briefcase', name: 'Expediente', desc: 'Administrativo, pastoral, recepção, circulação e ar da pastoral',
    run: (c) => ['administrativo', 'pastoral', 'recepcao', 'circulacao'].map((k) => c.on(k)).concat([c.call('climate', 'set_hvac_mode', c.e('ac_pastoral'), { hvac_mode: 'cool' })]) },
  { id: 'fechar', icon: 'power', name: 'Fechar tudo', desc: 'Todas as luzes, telão, som e ares desligados',
    run: (c) => LIGHT_KEYS.map((k) => c.off(k)).concat([c.off('som'), c.call('media_player', 'turn_off', c.e('telao')),
      c.call('climate', 'set_hvac_mode', c.e('ac_templo'), { hvac_mode: 'off' }), c.call('climate', 'set_hvac_mode', c.e('ac_pastoral'), { hvac_mode: 'off' })]) },
];
const LED_PRESETS = [['Quente', [255, 180, 110]], ['Branco', [255, 244, 229]], ['Vermelho', [255, 40, 40]], ['Azul', [40, 110, 255]], ['Verde', [40, 200, 90]], ['Roxo', [140, 60, 230]]];
const HVAC_PT = { off: 'Desligado', cool: 'Frio', heat: 'Quente', heat_cool: 'Auto', auto: 'Auto', fan_only: 'Ventilar', dry: 'Seco' };
const MEDIA_PT = { playing: 'Tocando', paused: 'Pausado', idle: 'Ociosa', off: 'Desligada', standby: 'Standby', on: 'Ligada', unavailable: 'indisponível', unknown: '—' };
// Elevação/azimute do sol para uma data e um ponto (graus). Azimute: 0 = norte, 90 = leste.
function solarPosition(date, lat, lon) {
  const rad = Math.PI / 180;
  const d = date.getTime() / 86400000 - 10957.5;
  const g = ((357.529 + 0.98560028 * d) % 360) * rad;
  const q = (280.459 + 0.98564736 * d) % 360;
  const L = ((q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) % 360) * rad;
  const e = (23.439 - 0.00000036 * d) * rad;
  const RA = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / rad;
  const dec = Math.asin(Math.sin(e) * Math.sin(L));
  const gmst = ((18.697374558 + 24.06570982441908 * d) % 24 + 24) % 24;
  let H = ((gmst * 15 + lon - RA) % 360 + 540) % 360 - 180;
  const Hr = H * rad, la = lat * rad;
  const alt = Math.asin(Math.sin(la) * Math.sin(dec) + Math.cos(la) * Math.cos(dec) * Math.cos(Hr));
  const az = Math.atan2(-Math.sin(Hr), Math.tan(dec) * Math.cos(la) - Math.sin(la) * Math.cos(Hr));
  return { elevation: alt / rad, azimuth: (az / rad + 360) % 360 };
}
function fmtClock(ts, tz) {
  try { return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: tz || undefined }); }
  catch (_) { try { return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); } catch (__) { return ''; } }
}
function fmtRel(ts, now = Date.now()) {
  const d = Math.max(0, (now - new Date(ts).getTime()) / 1000);
  if (d < 45) return 'agora'; if (d < 3600) return `há ${Math.round(d / 60)} min`; if (d < 86400) return `há ${Math.round(d / 3600)} h`;
  const days = Math.round(d / 86400); return days === 1 ? 'ontem' : `há ${days} d`;
}
const iconSvg = (k) => `<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k] || ICONS.bulb}</svg>`;

// ---------------------------------------------------------------------------
// Planta (metros) — medida na planta de layout do térreo (Uõma Arquitetura,
// NOV/2024, 1:100); precisão ~0,1 m. X → direita, Z → frente (fachada em z ≈ 49,7).
// Cada zona = piso clicável; `item` = qual entidade o clique alterna.
// `rects` = [x, z, largura, profundidade, lados] — áreas em L viram vários retângulos
// sem sobreposição. `lados` (opcional) diz quais bordas encostam em parede (sombra de
// canto + rodapé): n = z mínimo, s = z máximo, w = x mínimo, e = x máximo (padrão 'nsew').
// `floor` = textura do piso, `tile` = tamanho do bloco da textura (m), `inside` = rodapé.
// ---------------------------------------------------------------------------
const H = 3.0;      // pé-direito no modo "casinha de boneca" (todas as paredes)
const T = 0.15;     // espessura das paredes
const SPEC = { H_TEMPLO: 8.5, H_ALA: 4.5, H_FUNDOS: 3.6 };   // alturas externas (modo Fachada)
// Pilares do templo (z): parede x = 0 e parede x = 16,05 (+ x 5,4 / 10,5 em z 12,4 e 44,0)
const PILLARS_L = [12.4, 16.9, 21.4, 25.9, 30.4, 35.0, 39.5, 44.0];
const PILLARS_R = [12.4, 18.3, 23.2, 28.0, 33.7, 39.3, 44.0];

const ZONES = {
  // ---- Fundos: estacionamento interno, pátio, almoxarifado, cozinha, recepção, pastoral ----
  estac_interno: { rects: [[0, 0, 4.9, 12.4, '']], floor: 'paversGray', tile: 2.4, label: 'Estacionamento interno', lp: [2.45, 6.2], item: 'estacionamento' },
  patio:         { rects: [[4.9, 3.9, 2.6, 8.5, ''], [7.5, 3.9, 1.95, 1.9, ''], [9.45, 3.9, 3.3, 2.0, ''], [10.3, 9.25, 2.45, 0.95, ''],
                           [7.5, 10.2, 5.25, 0.8, ''], [7.5, 11.0, 8.55, 1.4, '']], floor: 'paversGray', tile: 2.4, label: 'Pátio', lp: [6.2, 8.0], item: 'estacionamento', main: true },
  almoxarifado:  { rects: [[4.9, 0, 3.7, 3.9]], floor: 'tileLight', tile: 1.8, label: 'Almoxarifado', lp: [6.75, 1.95], item: 'cozinha', inside: true, ls: 0.8 },
  cozinha:       { rects: [[8.6, 0, 4.15, 3.9]], floor: 'tileCool', tile: 1.2, label: 'Cozinha', lp: [10.7, 1.95], item: 'cozinha', inside: true, ls: 0.8 },
  jardim_interno:{ rects: [[7.5, 5.8, 1.95, 4.4, ''], [9.45, 9.25, 0.85, 0.95, '']], floor: 'grass', tile: 2.2, label: null },
  recepcao:      { rects: [[9.45, 5.9, 3.3, 3.35]], floor: 'laminate', tile: 2.4, label: 'Recepção', lp: [11.1, 7.6], item: 'recepcao', inside: true, ls: 0.8 },
  pastoral:      { rects: [[12.75, 0, 4.25, 4.9, 'nwe'], [12.75, 4.9, 7.35, 4.35, 'swe']], floor: 'laminate', tile: 2.4, label: 'Sala Pastoral', lp: [15.0, 6.6], item: 'pastoral', inside: true, main: true },
  caixa_dagua:   { rects: [[17.0, 0, 3.1, 3.1]], floor: 'concrete', tile: 3, label: 'Caixa d’água', lp: [18.55, 1.55], inside: false, ls: 0.75 },
  wc_pastoral:   { rects: [[17.0, 3.1, 3.1, 1.8]], floor: 'porcelainBeige', tile: 1.8, label: null, item: 'pastoral', inside: true },
  jardim_pastoral:{ rects: [[12.75, 9.25, 7.35, 1.75, '']], floor: 'grass', tile: 2.2, label: null },
  // ---- Ala direita (x 16,05–20,1) ----
  corredor:      { rects: [[16.05, 11.0, 1.05, 8.0]], floor: 'laminate', tile: 2.4, label: null, item: 'circulacao', inside: true },
  gilvan:        { rects: [[17.1, 11.0, 3.0, 3.2]], floor: 'laminate', tile: 2.4, label: 'Sala Gilvan', lp: [18.6, 12.6], item: 'administrativo', inside: true, ls: 0.75 },
  administrativo:{ rects: [[17.1, 14.2, 3.0, 4.8]], floor: 'laminate', tile: 2.4, label: 'Administrativo', lp: [18.6, 16.6], item: 'administrativo', inside: true, ls: 0.75 },
  circulacao:    { rects: [[16.05, 19.0, 4.05, 4.3, 'nwe'], [18.9, 23.3, 1.2, 4.7, 'swe']], floor: 'laminate', tile: 2.4, label: 'Circulação', lp: [18.1, 21.1], item: 'circulacao', inside: true, ls: 0.75 },
  midia:         { rects: [[16.05, 23.3, 2.85, 4.7]], floor: 'laminate', tile: 2.4, label: 'Mídia', lp: [17.5, 25.6], item: 'midia', inside: true, ls: 0.75, main: true },
  voluntariado:  { rects: [[16.05, 28.0, 4.05, 5.9]], floor: 'laminate', tile: 2.4, label: 'Voluntariado', lp: [18.1, 30.9], item: 'voluntariado', inside: true, ls: 0.75 },
  circ2:         { rects: [[16.05, 33.9, 1.05, 3.1, 'nwe']], floor: 'laminate', tile: 2.4, label: null, item: 'circulacao', inside: true },
  deposito:      { rects: [[17.1, 33.9, 3.0, 2.0]], floor: 'laminate', tile: 2.4, label: 'Depósito', lp: [18.6, 34.9], item: 'banheiros', inside: true, ls: 0.7 },
  tecnica:       { rects: [[17.1, 35.9, 3.0, 1.1]], floor: 'concrete', tile: 3, label: null, inside: false },
  wc_masc:       { rects: [[17.1, 37.0, 3.0, 3.8]], floor: 'porcelainBeige', tile: 1.8, label: 'WC Masc.', lp: [18.6, 38.9], item: 'banheiros', inside: true, ls: 0.7 },
  hall_banheiros:{ rects: [[16.05, 40.8, 4.05, 3.5, 'swe'], [16.05, 37.0, 1.05, 3.8, 'nwe']], floor: 'porcelainBeige', tile: 1.8, label: 'Hall dos banheiros', lp: [18.1, 42.5], item: 'banheiros', inside: true, ls: 0.75 },
  wc_fem:        { rects: [[16.05, 44.3, 4.05, 5.2, 'swe']], floor: 'porcelainBeige', tile: 1.8, label: 'WC Fem.', lp: [18.6, 46.9], item: 'banheiros', inside: true, ls: 0.7 },
  // ---- Templo, hall e frente ----
  templo:        { rects: [[0, 12.4, 16.05, 31.6]], floor: 'porcelainGray', tile: 1.8, label: 'Templo', lp: [10.8, 28.1], item: 'plateia', inside: true, ls: 1.5, main: true },
  hall:          { rects: [[4.0, 44.0, 12.05, 5.65]], floor: 'tileGray', tile: 1.8, label: 'Hall de entrada', lp: [12.4, 46.8], item: 'hall', inside: true, main: true },
  wc1:           { rects: [[0, 44.0, 1.9, 2.3]], floor: 'porcelainBeige', tile: 1.8, label: 'WC', lp: [0.95, 45.1], item: 'banheiros', inside: true, ls: 0.6 },
  wc_pcd:        { rects: [[1.9, 44.0, 2.1, 2.3]], floor: 'porcelainBeige', tile: 1.8, label: 'WC PCD', lp: [2.95, 45.1], item: 'banheiros', inside: true, ls: 0.6 },
  familia:       { rects: [[0, 46.3, 4.0, 3.35]], floor: 'laminate', tile: 2.4, label: 'Sala da Família', lp: [2.0, 48.0], item: 'familia', inside: true, ls: 0.8, main: true },
  jardim_frontal:{ rects: [[0.1, 49.73, 10.5, 1.12, ''], [13.3, 49.73, 2.7, 1.12, '']], floor: 'grass', tile: 2.2, label: null, item: 'fachada' },
  calcada:       { rects: [[-3, 49.73, 3.1, 1.27, ''], [0.1, 50.85, 10.5, 0.15, ''], [10.6, 49.73, 2.7, 1.27, ''], [13.3, 50.85, 2.7, 0.15, ''], [16.0, 49.58, 7.0, 1.42, '']],
                   floor: 'paversDark', tile: 2.4, label: null, item: 'fachada' },
  estac_frontal: { rects: [[-3, 51.0, 26.0, 9.0, '']], floor: 'herring', tile: 1.6, label: 'Estacionamento', lp: [4.0, 57.5], ly: 1.2, item: 'estacionamento', ls: 1.2, main: true },   // baixo e à esquerda: não cobre o letreiro da fachada
};
const LOT = { x0: -3, x1: 23, z0: 0, z1: 60, cx: 10, cz: 30 };   // área modelada (lote + estacionamento frontal)

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
const clamp = THREE.MathUtils.clamp;
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Texturas procedurais (canvas) — nada externo para baixar
// ---------------------------------------------------------------------------
function makeTex(size, draw, repeat = [1, 1]) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function grain(g, size, seed, count, alpha, tint = [255, 255, 255]) {
  const rnd = mulberry32(seed);
  for (let i = 0; i < count; i++) {
    const v = rnd(); const c = tint.map((x) => Math.floor(x * (0.5 + v)));
    g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(rnd() * alpha).toFixed(3)})`;
    g.fillRect(rnd() * size, rnd() * size, 1 + rnd() * 2.5, 1 + rnd() * 2.5);
  }
}
function shade(hex, v) {
  const r = (hex >> 16) & 255, gg = (hex >> 8) & 255, b = hex & 255;
  return `rgb(${Math.min(255, r * v) | 0},${Math.min(255, gg * v) | 0},${Math.min(255, b * v) | 0})`;
}
const TEX = {};
function textures() {
  if (TEX.wood) return TEX;
  // Tábuas de madeira (6 por bloco de 2,4 m)
  TEX.wood = makeTex(512, (g, s) => {
    const rnd = mulberry32(5), ph = s / 6;
    for (let r = 0; r < 6; r++) {
      const y = r * ph, v = 0.86 + rnd() * 0.26;
      g.fillStyle = shade(0xb98d5c, v); g.fillRect(0, y, s, ph);
      g.strokeStyle = 'rgba(70,40,15,0.16)'; g.lineWidth = 1;
      for (let k = 0; k < 26; k++) {
        const yy = y + rnd() * ph; g.beginPath(); g.moveTo(0, yy);
        for (let x = 0; x <= s; x += 24) g.lineTo(x, yy + Math.sin(x / 60 + k) * 1.6 + (rnd() - 0.5));
        g.stroke();
      }
      g.fillStyle = 'rgba(45,28,12,0.6)'; g.fillRect(0, y, s, 2);
      g.fillRect(((r % 2) * s / 2 + rnd() * 60) % s, y, 2, ph);
    }
    grain(g, s, 9, 5000, 0.08, [120, 80, 40]);
  });
  const tiles = (base, grout, n, seed) => makeTex(256, (g, s) => {
    g.fillStyle = grout; g.fillRect(0, 0, s, s);
    const rnd = mulberry32(seed), t = s / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = shade(base, 0.93 + rnd() * 0.1); g.fillRect(i * t + 1.5, j * t + 1.5, t - 3, t - 3); }
    grain(g, s, seed + 1, 2500, 0.05);
  });
  TEX.tileWarm = tiles(0xe0dacc, '#b8b09f', 4, 2);   // porcelanato bege
  TEX.tileCool = tiles(0xd7e0e3, '#9fadb3', 6, 3);   // banheiro
  TEX.concrete = makeTex(256, (g, s) => { g.fillStyle = '#818079'; g.fillRect(0, 0, s, s); grain(g, s, 6, 22000, 0.22, [90, 90, 88]); grain(g, s, 7, 3000, 0.12, [200, 200, 196]); });
  TEX.grass = makeTex(256, (g, s) => {
    g.fillStyle = '#3c5c2f'; g.fillRect(0, 0, s, s);
    const rnd = mulberry32(12);
    for (let i = 0; i < 9000; i++) { const v = 0.75 + rnd() * 0.6; g.fillStyle = shade(0x4a7038, v); g.fillRect(rnd() * s, rnd() * s, 1, 2 + rnd() * 3); }
    grain(g, s, 13, 2000, 0.1, [30, 50, 20]);
  });
  // Gramado do entorno (terreno geral): mais seco e menos saturado, como os lotes de Palmas na seca
  TEX.grassDry = makeTex(256, (g, s) => {
    g.fillStyle = '#5c6537'; g.fillRect(0, 0, s, s);
    const rnd = mulberry32(14), cols = [0x6d7a40, 0x7d8a4a, 0x8f8a52, 0x5d6b35, 0x9a9160];
    for (let i = 0; i < 9000; i++) { g.fillStyle = shade(cols[(rnd() * cols.length) | 0], 0.8 + rnd() * 0.4); g.fillRect(rnd() * s, rnd() * s, 1, 2 + rnd() * 3); }
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(150,130,90,${(0.06 + rnd() * 0.08).toFixed(3)})`; g.beginPath(); g.arc(rnd() * s, rnd() * s, 6 + rnd() * 18, 0, Math.PI * 2); g.fill(); }
    grain(g, s, 15, 2000, 0.1, [60, 55, 30]);
  });
  TEX.pavers = makeTex(256, (g, s) => {
    g.fillStyle = '#a89373'; g.fillRect(0, 0, s, s);
    const rnd = mulberry32(21), w = s / 2, h = s / 4;
    for (let r = 0; r < 4; r++) for (let c = -1; c < 3; c++) { const x = c * w + (r % 2) * w / 2; g.fillStyle = shade(0xd2bc93, 0.92 + rnd() * 0.14); g.fillRect(x + 2, r * h + 2, w - 4, h - 4); }
    grain(g, s, 22, 4000, 0.08, [120, 100, 70]);
  });
  TEX.plaster = makeTex(256, (g, s) => { g.fillStyle = '#e8e2d6'; g.fillRect(0, 0, s, s); grain(g, s, 31, 9000, 0.07, [120, 110, 100]); }, [2, 1]);
  // Porcelanato cinza grande (templo/hall) e claro (salas/circulação)
  TEX.tileGray = tiles(0x9a9b9e, '#76777b', 2, 51);
  TEX.tileLight = tiles(0xe6e3dc, '#c4bfb4', 2, 52);
  // Intertravado retangular cinza (pátio) e grafite (calçada da fachada)
  const pav = (base, joint, seed) => makeTex(256, (g, s) => {
    g.fillStyle = joint; g.fillRect(0, 0, s, s);
    const rnd = mulberry32(seed), w = s / 4, h = s / 8;
    for (let r = 0; r < 8; r++) for (let c = -1; c < 5; c++) { const x = c * w + (r % 2) * w / 2; g.fillStyle = shade(base, 0.9 + rnd() * 0.16); g.fillRect(x + 1.5, r * h + 1.5, w - 3, h - 3); }
    grain(g, s, seed + 1, 4000, 0.07, [90, 90, 90]);
  });
  // Laminado de madeira carvalho/mel (vídeos v1/v2/v4/v5): réguas de 1,2 × 0,2 m correndo ao longo de z,
  // topos desencontrados e variação de tom régua a régua. Bloco de 2,4 × 2,4 m (tile 2,4) → 12 colunas × 2 réguas.
  TEX.laminate = makeTex(512, (g, s) => {
    const rnd = mulberry32(61), n = 12, cw = s / n, rl = s / 2;
    const tones = [0xc08b5b, 0xb98456, 0xc79462, 0xb47e51, 0xbd8a5a, 0xae7a4e];
    for (let c = 0; c < n; c++) {
      const off = rnd() * rl;
      for (let k = -1; k < 3; k++) {
        const y0 = off + k * rl, base = tones[(rnd() * tones.length) | 0], v = 0.95 + rnd() * 0.08;
        g.fillStyle = shade(base, v); g.fillRect(c * cw, y0, cw, rl);
        // veio: linhas finas ao longo da régua, levemente onduladas
        g.lineWidth = 1;
        for (let q = 0; q < 7; q++) {
          const x = c * cw + 2 + rnd() * (cw - 4), a = 0.05 + rnd() * 0.08;
          g.strokeStyle = rnd() < 0.5 ? `rgba(90,52,22,${a.toFixed(3)})` : `rgba(235,190,130,${(a * 0.8).toFixed(3)})`;
          g.beginPath(); g.moveTo(x, y0);
          for (let y = y0; y <= y0 + rl; y += 16) g.lineTo(x + Math.sin(y / 37 + q * 1.7) * 1.3, y);
          g.stroke();
        }
        g.fillStyle = 'rgba(55,32,14,0.55)'; g.fillRect(c * cw, y0, cw, 1.5);   // topo da régua
      }
      g.fillStyle = 'rgba(55,32,14,0.5)'; g.fillRect(c * cw, 0, 1.2, s);     // junta lateral
    }
    grain(g, s, 62, 6000, 0.05, [110, 70, 35]);
  });
  TEX.laminate.anisotropy = 8;
  // Porcelanato 0,9 × 0,9 com rejunte fino (bloco de 1,8 m = 2 × 2 placas): bege claro (WCs) e cinza-claro polido (templo)
  const porcelain = (base, grout, seed, cloud) => makeTex(512, (g, s) => {
    g.fillStyle = grout; g.fillRect(0, 0, s, s);
    const rnd = mulberry32(seed), t = s / 2;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      g.fillStyle = shade(base, 0.97 + rnd() * 0.05); g.fillRect(i * t + 1, j * t + 1, t - 2, t - 2);
      // manchas suaves (nuvem) dentro da placa
      for (let k = 0; k < 14; k++) {
        const cx = i * t + rnd() * t, cy = j * t + rnd() * t, r = 20 + rnd() * 70;
        const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r);
        const tone = rnd() < 0.5 ? '255,255,255' : cloud;
        gr.addColorStop(0, `rgba(${tone},${(0.025 + rnd() * 0.035).toFixed(3)})`); gr.addColorStop(1, `rgba(${tone},0)`);
        g.save(); g.beginPath(); g.rect(i * t + 1, j * t + 1, t - 2, t - 2); g.clip(); g.fillStyle = gr; g.fillRect(cx - r, cy - r, 2 * r, 2 * r); g.restore();
      }
    }
    grain(g, s, seed + 1, 5000, 0.035);
  });
  TEX.porcelainBeige = porcelain(0xe4dccb, '#c9bfae', 71, '170,150,120');
  TEX.porcelainGray = porcelain(0xc4c4c1, '#abaaa6', 72, '140,140,138');
  TEX.porcelainGray.anisotropy = 8;
  // Cedro (portas internas): veio vertical sutil (o v da face da porta corre na altura)
  TEX.cedar = makeTex(256, (g, s) => {
    g.fillStyle = '#b06c33'; g.fillRect(0, 0, s, s);
    const rnd = mulberry32(81);
    for (let k = 0; k < 70; k++) {
      const x = rnd() * s, a = 0.04 + rnd() * 0.09, w = 0.6 + rnd() * 1.6;
      g.strokeStyle = rnd() < 0.6 ? `rgba(110,55,20,${a.toFixed(3)})` : `rgba(230,160,100,${(a * 0.7).toFixed(3)})`; g.lineWidth = w;
      g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= s; y += 8) g.lineTo(x + Math.sin(y / 29 + k) * 2.2 + Math.sin(y / 83 + k * 0.3) * 3, y); g.stroke();
    }
    grain(g, s, 82, 2500, 0.05, [120, 70, 30]);
  });
  TEX.paversGray = pav(0xa3a19b, '#77756f', 23);
  TEX.paversDark = pav(0x5d5f63, '#3e4043', 24);
  // Intertravado terracota em espinha de peixe (estacionamento frontal, como na foto).
  // Padrão 90°: período de 4×4 módulos (tijolo = 2×1 módulo); o canvas tem 4 períodos.
  TEX.herring = makeTex(512, (g, s) => {
    g.fillStyle = '#8a6a58'; g.fillRect(0, 0, s, s);
    const rnd = mulberry32(25), u = s / 16, gap = 1.6;
    const brick = (cx, cy, w, h) => {
      const v = 0.84 + rnd() * 0.26, t = rnd();
      const base = t < 0.18 ? 0xb58a72 : t < 0.36 ? 0xa77e66 : 0xc39a80;   // salmão/bege como na foto (calibrado p/ Neutral)
      g.fillStyle = shade(base, v); g.fillRect(cx * u + gap, cy * u + gap, w * u - 2 * gap, h * u - 2 * gap);
    };
    for (let sft = -24; sft <= 24; sft += 4) for (let t = -20; t <= 20; t++) {
      brick(t + sft, t, 2, 1);          // tijolo deitado
      brick(t + sft, t + 1, 1, 2);      // tijolo em pé
    }
    grain(g, s, 26, 9000, 0.08, [80, 50, 35]);
  });
  TEX.glow = makeTex(128, (g, s) => {
    const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,0.55)'); r.addColorStop(0.6, 'rgba(255,255,255,0.12)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, s, s);
  });
  TEX.glow.wrapS = TEX.glow.wrapT = THREE.ClampToEdgeWrapping;
  TEX.skyDay = makeTex(256, (g, s) => { const r = g.createLinearGradient(0, s, 0, 0); r.addColorStop(0, '#e6eef6'); r.addColorStop(0.18, '#b7d3ee'); r.addColorStop(0.6, '#5f9bdc'); r.addColorStop(1, '#3f7fc9'); g.fillStyle = r; g.fillRect(0, 0, s, s); });
  TEX.skyDusk = makeTex(256, (g, s) => { const r = g.createLinearGradient(0, s, 0, 0); r.addColorStop(0, '#ffb070'); r.addColorStop(0.12, '#f0805a'); r.addColorStop(0.3, '#8a5a8c'); r.addColorStop(0.6, '#2c3a70'); r.addColorStop(1, '#121a3a'); g.fillStyle = r; g.fillRect(0, 0, s, s); });
  TEX.skyNight = makeTex(256, (g, s) => { const r = g.createLinearGradient(0, s, 0, 0); r.addColorStop(0, '#18213a'); r.addColorStop(0.2, '#0f1629'); r.addColorStop(0.6, '#070b17'); r.addColorStop(1, '#03050c'); g.fillStyle = r; g.fillRect(0, 0, s, s); });
  for (const k of ['skyDay', 'skyNight', 'skyDusk']) { TEX[k].wrapS = TEX[k].wrapT = THREE.ClampToEdgeWrapping; }
  return TEX;
}

// ---------------------------------------------------------------------------
// Logo oficial da Base Church — ÚNICA função de desenho (fachada, totem, telão, palco,
// recepção, hall…). Proporções medidas na foto da fachada, em unidades da largura de
// "BASE" (= 1): anel com raio externo 0,29 e traço de 0,046, "B" com 85 % do vão interno;
// "BASE" com altura de maiúscula 0,33 e "CHURCH" com 0,235, as duas palavras com a mesma
// largura (justificadas), como as letras caixa do letreiro. A fonte é medida no canvas
// (altura de maiúscula e largura exatas), então o desenho não depende da fonte instalada:
// Arial/Helvetica/Liberation/Roboto Bold dão o mesmo tamanho.
// Layouts: full (anel em cima + BASE/CHURCH) · mark (só anel + B) · wide (anel à esquerda,
// texto à direita) · text (só BASE/CHURCH).
// ---------------------------------------------------------------------------
const LOGO_FONT = 'Arial, "Helvetica Neue", Helvetica, "Liberation Sans", "Nimbus Sans", Roboto, "Segoe UI", sans-serif';
const LOGO_LAYOUTS = {
  full: { w: 1, h: 1.255, ring: [0.5, 0.29, 0.29], text: [0, 0.64] },
  mark: { w: 0.58, h: 0.58, ring: [0.29, 0.29, 0.29] },
  wide: { w: 1.87, h: 0.75, ring: [0.375, 0.375, 0.375], text: [0.87, 0.0675] },
  text: { w: 1, h: 0.615, text: [0, 0] },
};
const logoAspect = (layout = 'full') => { const L = LOGO_LAYOUTS[layout] || LOGO_LAYOUTS.full; return L.h / L.w; };
const cssColor = (c, fb = '#f4f5f7') => c == null ? fb : typeof c === 'number' ? '#' + c.toString(16).padStart(6, '0') : String(c);
let _capRatio = 0;
// Desenha o logo em qualquer contexto 2D: canto superior esquerdo (x, y), largura total w (px).
// opts: { layout, color, weight (reforço de traço, fração da altura da letra; padrão 0,025) }. Devolve a altura (px).
function drawLogo(g, x, y, w, opts = {}) {
  const L = LOGO_LAYOUTS[opts.layout] || LOGO_LAYOUTS.full, u = w / L.w, col = cssColor(opts.color);
  const weight = opts.weight != null ? opts.weight : 0.025;
  if (!_capRatio) { g.save(); g.font = `700 100px ${LOGO_FONT}`; const m = g.measureText('H'); _capRatio = (m.actualBoundingBoxAscent || 72) / 100; g.restore(); }
  g.save(); g.fillStyle = col; g.strokeStyle = col; g.lineJoin = 'round'; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  // texto com altura de maiúscula `cap` e largura exata `tw` (esticado na horizontal se a fonte for estreita)
  const word = (txt, left, top, cap, tw) => {
    const fs = cap / _capRatio; g.font = `700 ${fs}px ${LOGO_FONT}`;
    const m = g.measureText(txt), mw = (m.actualBoundingBoxRight != null ? m.actualBoundingBoxRight + (m.actualBoundingBoxLeft || 0) : m.width) || m.width;
    const sx = tw ? tw / mw : 1, x0 = tw ? left + (m.actualBoundingBoxLeft || 0) * sx : left - mw / 2 + (m.actualBoundingBoxLeft || 0);
    g.save(); g.translate(x0, top + cap); g.scale(sx, 1);
    g.lineWidth = weight * cap / sx; if (weight > 0) g.strokeText(txt, 0, 0); g.fillText(txt, 0, 0);
    g.restore();
  };
  if (L.ring) {
    const [cx, cy, R] = L.ring.map((v) => v * u), sw = R * 0.16;
    g.lineWidth = sw; g.beginPath(); g.arc(x + cx, y + cy, R - sw / 2, 0, Math.PI * 2); g.stroke();
    const cap = R * 1.43; word('B', x + cx, y + cy - cap / 2, cap, 0);
  }
  if (L.text) {
    const tx = x + L.text[0] * u, ty = y + L.text[1] * u;
    word('BASE', tx, ty, 0.33 * u, u); word('CHURCH', tx, ty + 0.38 * u, 0.235 * u, u);
  }
  g.restore();
  return L.h * u;
}
// Textura do logo (canvas com a proporção do layout, fundo transparente por padrão).
// opts: { layout, color, bg (cor de fundo ou null), glow (0–1: halo desfocado, p/ LED/neon), size (px da maior dimensão), pad (margem, fração) }
const _logoTexCache = new Map();
function logoTex(opts = {}) {
  const layout = LOGO_LAYOUTS[opts.layout] ? opts.layout : 'full', size = opts.size || 1024, pad = opts.pad != null ? opts.pad : (opts.glow ? 0.08 : 0.02);
  const key = JSON.stringify([layout, cssColor(opts.color), opts.bg == null ? null : cssColor(opts.bg), opts.glow || 0, size, pad, opts.weight]);
  if (_logoTexCache.has(key)) return _logoTexCache.get(key);
  const L = LOGO_LAYOUTS[layout], tw = L.w * (1 + 2 * pad), th = L.h + 2 * pad * L.w, k = size / Math.max(tw, th);
  const c = document.createElement('canvas'); c.width = Math.round(tw * k); c.height = Math.round(th * k);
  const g = c.getContext('2d');
  if (opts.bg != null) { g.fillStyle = cssColor(opts.bg); g.fillRect(0, 0, c.width, c.height); }
  const lw = L.w * k, lx = pad * L.w * k, ly = pad * L.w * k;
  if (opts.glow) {
    g.save(); g.shadowColor = cssColor(opts.color); g.shadowBlur = 0.05 * lw * opts.glow; g.globalAlpha = 0.9;
    drawLogo(g, lx, ly, lw, { layout, color: opts.color, weight: opts.weight }); drawLogo(g, lx, ly, lw, { layout, color: opts.color, weight: opts.weight }); g.restore();
  }
  drawLogo(g, lx, ly, lw, { layout, color: opts.color, weight: opts.weight });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  t.userData.aspect = c.height / c.width; t.userData.layout = layout;
  _logoTexCache.set(key, t); return t;
}
// Plano pronto (virado para +z, centro na origem). Sem `h`, a altura sai da proporção do layout.
// opts (além dos de logoTex): { emissive (intensidade; 0 = sem brilho próprio), emissiveColor, roughness, metalness,
//   envMapIntensity, opacity (<1 → transparente; senão alphaTest 0,5), side, offset (polygonOffset p/ colar em parede/piso; padrão true), cast }
function logoMesh(w, h, opts = {}) {
  const tex = logoTex(opts); if (!h) h = w * tex.userData.aspect;
  const transp = opts.opacity != null && opts.opacity < 1;
  const mo = { color: 0xffffff, map: tex, roughness: opts.roughness != null ? opts.roughness : 0.45, metalness: opts.metalness || 0,
    side: opts.side || THREE.FrontSide };
  if (opts.envMapIntensity != null) mo.envMapIntensity = opts.envMapIntensity;
  if (transp) Object.assign(mo, { transparent: true, opacity: opts.opacity, depthWrite: false }); else mo.alphaTest = 0.5;
  if (opts.offset !== false) Object.assign(mo, { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  if (opts.emissive) Object.assign(mo, { emissive: opts.emissiveColor != null ? opts.emissiveColor : 0xffffff, emissiveMap: tex, emissiveIntensity: opts.emissive });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial(mo));
  m.castShadow = !!opts.cast; m.receiveShadow = !transp; m.userData.logo = true;
  return m;
}
// Letreiro em letras caixa: camadas empilhadas (laterais escuras + face prateada), largura w,
// virado para +z, fundo encostado em z = 0 (cole direto na parede) e centro em x = y = 0.
// opts: { layout, depth (0,08 m), layers (4), color (face, 0xf4f5f7), sideColor (0x8a8d92), drop (deslocamento
//   da lateral, [x, y] em m, p/ o relevo aparecer de frente), emissive (brilho da face), metalness, roughness }
// Devolve um Group com userData.face (material da face: use ctx.bindEmissive(key, face, max)).
function logoRelief(w, opts = {}) {
  const layout = LOGO_LAYOUTS[opts.layout] ? opts.layout : 'full';
  const depth = opts.depth != null ? opts.depth : 0.08, n = Math.max(2, opts.layers || 4);
  const tex = logoTex({ layout, color: '#ffffff', size: opts.size || 1024, weight: opts.weight });
  const h = w * tex.userData.aspect, geo = new THREE.PlaneGeometry(w, h);
  const side = new THREE.MeshStandardMaterial({ color: opts.sideColor != null ? opts.sideColor : 0x8a8d92, map: tex, alphaTest: 0.5, roughness: 0.55, metalness: 0.4 });
  const fo = { color: opts.color != null ? opts.color : 0xf4f5f7, map: tex, alphaTest: 0.5, roughness: opts.roughness != null ? opts.roughness : 0.3,
    metalness: opts.metalness != null ? opts.metalness : 0.35, envMapIntensity: 1.2, emissive: opts.emissiveColor != null ? opts.emissiveColor : 0xfff4e6, emissiveMap: tex, emissiveIntensity: opts.emissive || 0 };
  const face = new THREE.MeshStandardMaterial(fo);
  const [dx, dy] = opts.drop || [0.005 * w, -0.007 * w];
  const grp = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const last = i === n - 1, kk = (n - 1 - i) / (n - 1), m = new THREE.Mesh(geo, last ? face : side);
    m.position.set(dx * kk, dy * kk, 0.004 + depth * i / (n - 1)); m.castShadow = last; m.receiveShadow = false; grp.add(m);
  }
  grp.userData = { face, side, w, h, logo: true };
  return grp;
}

const MAT = {};
function materials() {
  if (MAT.wall) return MAT;
  const T = textures();
  const std = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.9, metalness: 0 }, o));
  MAT.wall     = std({ color: 0xebedf2, map: T.plaster, roughness: 0.95 });   // × reboco ≈ greige #d6d2cb (paredes internas, vídeos)
  MAT.wallDark = std({ color: 0x25262c, roughness: 0.8 });   // fachada/muros pretos (como na foto): preto fosco com juntas
  // Juntas dos painéis em espaço de mundo (verticais a cada 1,25 m, horizontais a cada 3 m): sem textura
  // nem sampler a mais, e sem esticar ao longo das paredes de 49 m. noShare: o merge não troca por outro preto.
  MAT.wallDark.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN;')
      .replace('#include <map_fragment>', `#include <map_fragment>
        float wu = abs(vWN.x) > 0.5 ? vWP.z : vWP.x;
        float sd = abs(fract(wu / 1.25 + 0.5) - 0.5) * 1.25;
        float seam = 1.0 - smoothstep(0.006, 0.02, sd);
        float hz = 1.0 - smoothstep(0.004, 0.014, abs(fract(vWP.y / 3.0 + 0.5) - 0.5) * 3.0);
        diffuseColor.rgb *= (1.0 - 0.6 * max(seam, hz * step(abs(vWN.y), 0.5))) * (0.96 + 0.04 * sin(wu * 0.7 + vWP.y * 0.3));`);
  };
  MAT.wallDark.customProgramCacheKey = () => 'wallDarkSeams';
  MAT.wallDark.userData.noShare = true;
  MAT.wallDarkCap = std({ color: 0x232326, roughness: 0.8 });
  MAT.lowWall  = std({ color: 0xd6ccb8, map: T.plaster, roughness: 0.95 });
  MAT.ground   = std({ color: 0x9fb08c, map: T.grass, roughness: 1 });
  MAT.doorPanel = std({ color: 0x5a3b28, roughness: 0.75 });
  MAT.baseboard = std({ color: 0xf4f1ea, roughness: 0.7 });
  // vidro: Standard (sem os defines do Physical) com reflexo do céu forte — rasante reflete, de frente fica transparente
  MAT.glass    = new THREE.MeshStandardMaterial({ color: 0xcfe2ef, transparent: true, opacity: 0.22, roughness: 0.04, metalness: 0, envMapIntensity: 1.6, side: THREE.DoubleSide, depthWrite: false });
  MAT.wood     = std({ color: 0xa5692a, roughness: 0.7 });
  MAT.woodLite = std({ color: 0x8a6a3f, roughness: 0.7 });
  MAT.white    = std({ color: 0xe9ebee, roughness: 0.6 });
  MAT.steel    = std({ color: 0xcfd4d8, roughness: 0.35, metalness: 0.6 });
  MAT.dark     = std({ color: 0x262626, roughness: 0.6 });
  MAT.mattress = std({ color: 0xd9d5cf });
  MAT.red      = std({ color: 0x8b2f2f });
  MAT.blue     = std({ color: 0x7ea6c9 });
  MAT.tan      = std({ color: 0xb0a080 });
  MAT.chair    = std({ color: 0x5a4a3a });
  MAT.plant    = std({ color: 0x2f6b34, roughness: 1 });
  MAT.pot      = std({ color: 0x7a5236 });
  MAT.car      = std({ color: 0x3b4a6b, roughness: 0.4, metalness: 0.3 });
  MAT.tire     = std({ color: 0x151515 });
  MAT.fixture  = std({ color: 0xf2efe8, roughness: 0.5 });
  MAT.woodDark = std({ color: 0x5a3f2c, roughness: 0.7 });
  MAT.frame    = std({ color: 0xf7f4ee, roughness: 0.6 });
  MAT.frameDark = std({ color: 0x18181a, roughness: 0.45, metalness: 0.3 });   // caixilho preto (porta de vidro da fachada)
  MAT.wallCap  = std({ color: 0xd4cdbf, roughness: 0.9 });
  MAT.pillar   = std({ color: 0xebedf2, map: T.plaster, roughness: 0.9 });
  MAT.cushion  = std({ color: 0xe6dfd3, roughness: 0.95 });
  MAT.navy     = std({ color: 0x3b4a6b, roughness: 0.9 });
  MAT.leaf2    = std({ color: 0x3f7d3a, roughness: 1 });
  MAT.trunk    = std({ color: 0x6b4a2f, roughness: 1 });
  MAT.soil     = std({ color: 0x3d2b1c, roughness: 1 });
  MAT.chrome   = std({ color: 0xdfe3e8, roughness: 0.25, metalness: 0.9 });
  MAT.glassDark = new THREE.MeshStandardMaterial({ color: 0x1a2430, transparent: true, opacity: 0.6, roughness: 0.08, metalness: 0.6, envMapIntensity: 1.2 });
  MAT.mirror   = std({ color: 0xdfe6ee, roughness: 0.05, metalness: 1 });
  MAT.screenOff = std({ color: 0x0b0b0b, emissive: 0x1d3350, emissiveIntensity: 0.35, roughness: 0.3 });
  MAT.lightRed = std({ color: 0xc81e1e, emissive: 0xff3030, emissiveIntensity: 0.5 });
  MAT.lightWhite = std({ color: 0xfff6dd, emissive: 0xfff1d0, emissiveIntensity: 0.35 });
  MAT.graphite = std({ color: 0x3a3b3f, roughness: 0.55, metalness: 0.2 });   // luminárias/refletores
  MAT.concrete = std({ color: 0xb9b6ae, map: T.concrete, roughness: 1 });
  MAT.book     = [0x8b2f2f, 0x2f5f8b, 0x3f7d3a, 0xc9a24a, 0x6b4a2f, 0xe6dfd3].map((c) => std({ color: c, roughness: 0.9 }));
  // ---- Acabamentos reais (fotos e vídeos do cliente) ----
  // portas internas de cedro com veio (lisas, sem almofada), batente/guarnição de madeira
  MAT.door      = std({ color: 0xf0d2b8, map: T.cedar, roughness: 0.55 });   // × textura ≈ #a8662f
  MAT.doorFrame = std({ color: 0x9a5c2a, roughness: 0.6 });
  MAT.baseboardWood = std({ color: 0x9c6a3c, roughness: 0.6 });                // rodapé de madeira no laminado
  MAT.baseboardGray = std({ color: 0xbdbcb8, roughness: 0.4 });                // rodapé de porcelanato no templo
  // vidro levemente fumê dos visores/janelas internas (caixilho preto)
  MAT.glassSmoke = new THREE.MeshStandardMaterial({ color: 0x7d8790, transparent: true, opacity: 0.32, roughness: 0.05, metalness: 0.1, envMapIntensity: 1.4, side: THREE.DoubleSide, depthWrite: false });
  // preto fosco das paredes/pilares do templo (não é unificado com outros pretos no merge)
  MAT.pretoFosco = std({ color: 0x151517, roughness: 0.9 }); MAT.pretoFosco.userData.noShare = true;
  // treliça/tesoura branca da cobertura do templo
  MAT.aluminioBranco = std({ color: 0xeeeeec, roughness: 0.4, metalness: 0.3 });
  // Padrões em espaço de MUNDO (sem textura e sem depender das UVs da caixa): repetem em metros em qualquer
  // peça. `pattern` é GLSL que lê `wp2` (coordenadas no plano da face, m) e altera `diffuseColor`.
  const WS_HEAD = `varying vec3 vWP; varying vec3 vWN;
    float wsH(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float wsN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(wsH(i), wsH(i + vec2(1.0, 0.0)), f.x), mix(wsH(i + vec2(0.0, 1.0)), wsH(i + vec2(1.0, 1.0)), f.x), f.y); }
    float wsF(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * wsN(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return s; }
    float wsJ(vec2 q, vec2 cell, float w){ vec2 l = fract(q / cell) * cell; vec2 d = min(l, cell - l); return 1.0 - smoothstep(0.0, w, min(d.x, d.y)); }`;
  const worldPattern = (mat, key, pattern) => {
    mat.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + WS_HEAD)
        .replace('#include <map_fragment>', `#include <map_fragment>
          vec3 an = abs(vWN); vec2 wp2 = an.y > 0.5 ? vWP.xz : (an.x > 0.5 ? vWP.zy : vWP.xy);
          ${pattern}`);
    };
    mat.customProgramCacheKey = () => 'ws_' + key;
    return mat;
  };
  // marmorato / cimento queimado cinza manchado (paredes de destaque, pilares)
  MAT.marmorato = worldPattern(std({ color: 0xb4b2ac, roughness: 0.62 }), 'marmorato', `
    float m1 = wsF(wp2 * 0.9), m2 = wsF(wp2 * 3.1 + 7.3), m3 = wsN(wp2 * 22.0);
    diffuseColor.rgb *= 0.68 + 0.5 * m1 + 0.16 * (m2 - 0.5) + 0.05 * (m3 - 0.5);`);
  // placa acústica grafite 0,5 × 0,5 com juntas (sala de mídia)
  MAT.acustico = worldPattern(std({ color: 0x3c3d40, roughness: 0.97 }), 'acustico', `
    vec2 cid = floor(wp2 / 0.5);
    diffuseColor.rgb *= (0.9 + 0.14 * wsH(cid + 3.1)) * (0.96 + 0.08 * wsN(wp2 * 70.0)) * (1.0 - 0.55 * wsJ(wp2, vec2(0.5), 0.012));`);
  // porcelanato cinza-claro 0,9 × 0,9 (meia parede dos banheiros; serve para piso/parede)
  MAT.porcelanatoCinza = worldPattern(std({ color: 0xcfceca, roughness: 0.22 }), 'porcelanatoCinza', `
    vec2 pid = floor(wp2 / 0.9);
    diffuseColor.rgb *= (0.97 + 0.05 * wsH(pid + 1.3)) * (0.95 + 0.07 * wsF(wp2 * 1.6 + pid)) * (1.0 - 0.3 * wsJ(wp2, vec2(0.9), 0.004));`);
  // mármore "marrom imperador" com veios claros, placas de 0,9 × 0,9 (meia parede superior dos banheiros)
  // (veios finos, claros e interrompidos, com leve névoa em volta; fundo marrom-café mesclado — sem "curvas de nível")
  MAT.marmoreMarrom = worldPattern(std({ color: 0x5c4234, roughness: 0.2 }), 'marmoreMarrom', `
    vec2 mid = floor(wp2 / 0.9); vec2 mq = wp2 + mid * 3.7;
    float mn = wsF(mq * 1.3), mv = wsF(mq * 0.6 + 11.0), mb = wsF(mq * 4.0 + 5.0);
    float w1 = abs(sin((mq.x * 1.1 + mq.y * 0.7 + mn * 2.2) * 2.6));
    float w2 = abs(sin((mq.x * -0.6 + mq.y * 1.4 + mv * 3.0) * 4.1));
    float vein = (1.0 - smoothstep(0.0, 0.035, w1)) * smoothstep(0.4, 0.7, mv);
    float vein2 = (1.0 - smoothstep(0.0, 0.02, w2)) * smoothstep(0.45, 0.75, mn);
    float haze = (1.0 - smoothstep(0.0, 0.25, w1)) * smoothstep(0.4, 0.7, mv);
    diffuseColor.rgb *= 0.72 + 0.38 * mn + 0.1 * (mb - 0.5);
    diffuseColor.rgb *= 1.0 + 0.3 * haze;
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.58, 0.49, 0.41), clamp(vein * 0.45 + vein2 * 0.25, 0.0, 0.6));
    diffuseColor.rgb *= 1.0 - 0.35 * wsJ(wp2, vec2(0.9), 0.003);`);
  for (const k of ['marmorato', 'acustico', 'porcelanatoCinza', 'marmoreMarrom']) MAT[k].userData.noShare = true;
  return MAT;
}

function box(w, h, d, mat, x, y, z, opts = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = opts.cast !== false;
  m.receiveShadow = opts.receive !== false;
  return m;
}

// ---------------------------------------------------------------------------
// Mobiliário procedural: cada função devolve um Group com origem no centro da
// base (x → largura, z → profundidade, y → altura). Tudo feito de primitivas.
// ---------------------------------------------------------------------------
function cyl(rt, rb, h, mat, x, y, z, seg = 16, open = false) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, open), mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
}
function sph(r, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 9), mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
}
function furniture(M) {
  const G = () => new THREE.Group();
  const F = {
    bed(w, l, blanket) {
      const g = G();
      g.add(box(w, 0.22, l, M.woodDark, 0, 0.16, 0));
      g.add(box(w - 0.08, 0.2, l - 0.08, M.mattress, 0, 0.37, 0));
      g.add(box(w - 0.12, 0.07, l * 0.6, blanket, 0, 0.5, l * 0.18));
      if (w >= 1.2) { g.add(box(w * 0.4, 0.1, 0.4, M.white, -w * 0.24, 0.52, -l / 2 + 0.35)); g.add(box(w * 0.4, 0.1, 0.4, M.white, w * 0.24, 0.52, -l / 2 + 0.35)); }
      else g.add(box(w * 0.6, 0.1, 0.4, M.white, 0, 0.52, -l / 2 + 0.35));
      g.add(box(w + 0.06, 0.9, 0.07, M.woodDark, 0, 0.5, -l / 2 - 0.03));
      return g;
    },
    nightstand(lamp = true) {
      const g = G();
      g.add(box(0.45, 0.5, 0.42, M.woodDark, 0, 0.25, 0));
      g.add(box(0.14, 0.02, 0.02, M.chrome, 0, 0.32, 0.22));
      if (lamp) { g.add(cyl(0.02, 0.03, 0.22, M.chrome, 0, 0.61, 0, 8)); g.add(cyl(0.07, 0.12, 0.14, M.cushion, 0, 0.78, 0, 12, true)); }
      return g;
    },
    wardrobe(w, h = 2.0, d = 0.6, doors = 2) {
      const g = G();
      g.add(box(w, h, d, M.wood, 0, h / 2, 0));
      g.add(box(w + 0.02, 0.04, d + 0.02, M.woodDark, 0, h + 0.02, 0));
      for (let i = 1; i < doors; i++) g.add(box(0.01, h - 0.1, 0.01, M.woodDark, -w / 2 + (i * w) / doors, h / 2, d / 2));
      for (let i = 0; i < doors; i++) { const cx = -w / 2 + ((i + 0.5) * w) / doors + (i < doors / 2 ? 0.06 : -0.06); g.add(cyl(0.008, 0.008, 0.14, M.chrome, cx, h * 0.5, d / 2 + 0.015, 6)); }
      return g;
    },
    desk(w, d, withMonitor = true) {
      const g = G();
      g.add(box(w, 0.04, d, M.woodLite, 0, 0.74, 0));
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(cyl(0.025, 0.025, 0.72, M.dark, sx * (w / 2 - 0.06), 0.36, sz * (d / 2 - 0.06), 8));
      if (withMonitor) {
        g.add(box(0.6, 0.36, 0.03, M.dark, 0, 1.02, -d / 2 + 0.14));
        const scr = box(0.55, 0.31, 0.006, M.screenOff, 0, 1.02, -d / 2 + 0.16); scr.castShadow = false; g.add(scr);
        g.add(cyl(0.02, 0.02, 0.1, M.dark, 0, 0.8, -d / 2 + 0.14, 8)); g.add(cyl(0.1, 0.11, 0.015, M.dark, 0, 0.765, -d / 2 + 0.14, 16));
        g.add(box(0.42, 0.02, 0.14, M.dark, 0, 0.77, 0.06)); g.add(box(0.06, 0.02, 0.1, M.dark, 0.32, 0.77, 0.06));
      }
      return g;
    },
    officeChair() {
      const g = G();
      g.add(box(0.48, 0.08, 0.46, M.dark, 0, 0.47, 0));
      g.add(box(0.46, 0.5, 0.06, M.dark, 0, 0.78, -0.22));
      g.add(box(0.05, 0.03, 0.3, M.dark, -0.24, 0.66, 0)); g.add(box(0.05, 0.03, 0.3, M.dark, 0.24, 0.66, 0));
      g.add(cyl(0.025, 0.025, 0.4, M.chrome, 0, 0.23, 0, 8));
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; const sp = box(0.3, 0.03, 0.04, M.dark, Math.cos(a) * 0.15, 0.04, Math.sin(a) * 0.15); sp.rotation.y = -a; g.add(sp); g.add(sph(0.03, M.dark, Math.cos(a) * 0.3, 0.03, Math.sin(a) * 0.3)); }
      return g;
    },
    bookshelf(w, h, d = 0.3, levels = 4, seed = 1) {
      const g = G(); const rnd = mulberry32(seed);
      g.add(box(0.03, h, d, M.woodLite, -w / 2, h / 2, 0)); g.add(box(0.03, h, d, M.woodLite, w / 2, h / 2, 0));
      g.add(box(w, 0.02, d, M.woodLite, 0, h, 0)); g.add(box(w, h, 0.02, M.woodLite, 0, h / 2, -d / 2));
      for (let i = 0; i < levels; i++) {
        const y = (i * h) / levels + 0.02; g.add(box(w, 0.025, d, M.woodLite, 0, y, 0));
        let x = -w / 2 + 0.06;
        while (x < w / 2 - 0.1) { const bw = 0.03 + rnd() * 0.04, bh = 0.16 + rnd() * 0.1; if (rnd() < 0.85) g.add(box(bw, bh, d * 0.7, M.book[Math.floor(rnd() * M.book.length)], x + bw / 2, y + bh / 2 + 0.012, 0)); x += bw + 0.005; }
      }
      return g;
    },
    sofa(w, d, fabric) {
      const g = G();
      g.add(box(w, 0.38, d, fabric, 0, 0.19, 0));
      g.add(box(w, 0.42, 0.2, fabric, 0, 0.59, -d / 2 + 0.1));
      g.add(box(0.18, 0.56, d, fabric, -w / 2 + 0.09, 0.28, 0)); g.add(box(0.18, 0.56, d, fabric, w / 2 - 0.09, 0.28, 0));
      const n = Math.max(1, Math.round((w - 0.36) / 0.7)), cw = (w - 0.36) / n;
      for (let i = 0; i < n; i++) g.add(box(cw - 0.05, 0.12, d - 0.32, M.cushion, -w / 2 + 0.18 + cw * (i + 0.5), 0.44, 0.08));
      return g;
    },
    diningTable(rx, rz) {
      const g = G();
      const top = cyl(1, 1, 0.05, M.tan, 0, 0.75, 0, 36); top.scale.set(rx, 1, rz); g.add(top);
      g.add(cyl(0.08, 0.08, 0.7, M.woodDark, 0, 0.36, 0, 12));
      const base = cyl(0.45, 0.5, 0.04, M.woodDark, 0, 0.02, 0, 24); base.scale.set(rx / rz, 1, 1); g.add(base);
      return g;
    },
    chair(fabric) {
      const g = G();
      g.add(box(0.42, 0.05, 0.42, M.woodLite, 0, 0.45, 0)); g.add(box(0.38, 0.04, 0.38, fabric, 0, 0.495, 0));
      g.add(box(0.03, 0.45, 0.03, M.woodLite, -0.18, 0.7, -0.19)); g.add(box(0.03, 0.45, 0.03, M.woodLite, 0.18, 0.7, -0.19));
      g.add(box(0.4, 0.16, 0.03, M.woodLite, 0, 0.84, -0.19));
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(cyl(0.02, 0.02, 0.44, M.woodLite, sx * 0.18, 0.22, sz * 0.18, 8));
      return g;
    },
    fridge() {
      const g = G();
      g.add(box(0.75, 1.85, 0.7, M.steel, 0, 0.925, 0));
      g.add(box(0.73, 0.012, 0.01, M.dark, 0, 1.25, 0.352));
      g.add(box(0.02, 0.4, 0.025, M.chrome, 0.28, 1.5, 0.37)); g.add(box(0.02, 0.7, 0.025, M.chrome, 0.28, 0.75, 0.37));
      return g;
    },
    stove() {
      const g = G();
      g.add(box(0.6, 0.88, 0.6, M.white, 0, 0.44, 0)); g.add(box(0.6, 0.02, 0.6, M.dark, 0, 0.89, 0));
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(cyl(0.08, 0.08, 0.012, M.chrome, sx * 0.14, 0.905, sz * 0.14, 16));
      g.add(box(0.52, 0.4, 0.012, M.steel, 0, 0.4, 0.305)); g.add(box(0.36, 0.14, 0.006, M.dark, 0, 0.42, 0.313));
      g.add(box(0.5, 0.02, 0.025, M.chrome, 0, 0.64, 0.32));
      for (let i = 0; i < 4; i++) g.add(cyl(0.015, 0.015, 0.03, M.chrome, -0.2 + i * 0.13, 0.78, 0.31, 8));
      return g;
    },
    hood() {
      const g = G();
      g.add(box(0.7, 0.08, 0.5, M.steel, 0, 0.04, 0)); g.add(box(0.3, 0.6, 0.3, M.steel, 0, 0.38, -0.1));
      return g;
    },
    cabinet(w, h, d, doors, mat) {
      const g = G(); mat = mat || M.wood;
      g.add(box(w, h, d, mat, 0, h / 2, 0));
      g.add(box(w + 0.02, 0.03, d + 0.02, M.woodDark, 0, h + 0.015, 0));
      for (let i = 1; i < doors; i++) g.add(box(0.008, h - 0.08, 0.01, M.woodDark, -w / 2 + (i * w) / doors, h / 2, d / 2));
      for (let i = 0; i < doors; i++) g.add(cyl(0.007, 0.007, 0.1, M.chrome, -w / 2 + ((i + 0.5) * w) / doors, h * 0.55, d / 2 + 0.012, 6));
      return g;
    },
    sink(w = 0.5, d = 0.4) {
      const g = G();
      g.add(box(w, 0.03, d, M.steel, 0, 0.0, 0)); g.add(box(w - 0.08, 0.02, d - 0.08, M.dark, 0, 0.005, 0));
      g.add(cyl(0.014, 0.014, 0.22, M.chrome, 0, 0.11, -d / 2 + 0.05, 8)); g.add(box(0.025, 0.025, 0.16, M.chrome, 0, 0.22, -d / 2 + 0.12));
      return g;
    },
    toilet() {
      const g = G();
      g.add(box(0.38, 0.38, 0.17, M.white, 0, 0.58, -0.2)); g.add(box(0.34, 0.02, 0.1, M.chrome, 0, 0.78, -0.2));
      const bowl = cyl(0.19, 0.14, 0.38, M.white, 0, 0.19, 0.05, 16); bowl.scale.set(1, 1, 1.25); g.add(bowl);
      const seat = cyl(0.2, 0.2, 0.04, M.white, 0, 0.4, 0.05, 16); seat.scale.set(1, 1, 1.25); g.add(seat);
      return g;
    },
    shower(s) {
      const g = G();
      g.add(box(s, 0.06, s, M.white, 0, 0.03, 0)); g.add(cyl(0.04, 0.04, 0.005, M.chrome, 0, 0.065, 0, 12));
      const p1 = box(0.02, 2.0, s, M.glass, s / 2, 1.0, 0, { cast: false, receive: false }); const p2 = box(s, 2.0, 0.02, M.glass, 0, 1.0, s / 2, { cast: false, receive: false }); g.add(p1, p2);
      g.add(box(0.03, 2.0, 0.03, M.chrome, s / 2, 1.0, s / 2)); g.add(box(0.03, 0.03, s, M.chrome, s / 2, 2.0, 0)); g.add(box(s, 0.03, 0.03, M.chrome, 0, 2.0, s / 2));
      g.add(cyl(0.015, 0.015, 1.9, M.chrome, -s / 2 + 0.06, 0.98, -s / 2 + 0.06, 8)); g.add(box(0.02, 0.02, 0.3, M.chrome, -s / 2 + 0.06, 1.95, -s / 2 + 0.2)); g.add(cyl(0.08, 0.08, 0.02, M.chrome, -s / 2 + 0.06, 1.95, -s / 2 + 0.35, 12));
      return g;
    },
    washbasin() {
      const g = G();
      g.add(box(0.6, 0.78, 0.45, M.white, 0, 0.39, 0)); g.add(box(0.64, 0.04, 0.48, M.steel, 0, 0.8, 0));
      g.add(cyl(0.17, 0.13, 0.1, M.white, 0, 0.86, 0.02, 16)); g.add(cyl(0.012, 0.012, 0.18, M.chrome, 0, 0.9, -0.16, 8)); g.add(box(0.02, 0.02, 0.12, M.chrome, 0, 0.99, -0.1));
      g.add(box(0.5, 0.6, 0.02, M.mirror, 0, 1.5, -0.235));
      return g;
    },
    shelves(w, h, d, levels, seed = 3) {
      const g = G(); const rnd = mulberry32(seed);
      g.add(box(0.03, h, d, M.woodLite, -w / 2, h / 2, 0)); g.add(box(0.03, h, d, M.woodLite, w / 2, h / 2, 0));
      for (let i = 0; i <= levels; i++) {
        const y = 0.1 + (i * (h - 0.1)) / levels; g.add(box(w, 0.025, d, M.woodLite, 0, y, 0));
        if (i < levels) { let x = -w / 2 + 0.08; while (x < w / 2 - 0.12) { const iw = 0.08 + rnd() * 0.1, ih = 0.1 + rnd() * 0.16; if (rnd() < 0.5) g.add(cyl(iw / 2, iw / 2, ih, M.book[Math.floor(rnd() * 6)], x + iw / 2, y + ih / 2 + 0.012, 0, 10)); else g.add(box(iw, ih, iw, M.book[Math.floor(rnd() * 6)], x + iw / 2, y + ih / 2 + 0.012, 0)); x += iw + 0.04 + rnd() * 0.06; } }
      }
      return g;
    },
    car() {
      // sedã: carroceria com capô/porta-malas, cabine afunilada de vidro escuro, teto, para-lamas e faróis
      const g = G();
      g.add(box(1.72, 0.46, 4.2, M.car, 0, 0.56, 0));
      g.add(box(1.66, 0.1, 1.15, M.car, 0, 0.83, -1.45));   // capô levemente elevado
      const cg = new THREE.BoxGeometry(1.52, 0.46, 2.1), P = cg.attributes.position;
      for (let i = 0; i < P.count; i++) if (P.getY(i) > 0) { P.setX(i, P.getX(i) * 0.84); P.setZ(i, P.getZ(i) * (P.getZ(i) < 0 ? 0.62 : 0.8) + 0.08); }
      cg.computeVertexNormals();
      const cab = new THREE.Mesh(cg, M.glassDark); cab.position.set(0, 1.02, 0.1); cab.castShadow = true; cab.receiveShadow = false; g.add(cab);
      g.add(box(1.24, 0.04, 1.44, M.car, 0, 1.26, 0.24));   // teto
      g.add(box(1.36, 0.4, 0.07, M.car, 0, 1.03, 0.2, { cast: false }));   // coluna central
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const wh = cyl(0.33, 0.33, 0.24, M.tire, sx * 0.8, 0.33, sz * 1.35, 18); wh.rotation.z = Math.PI / 2; g.add(wh);
        const hub = cyl(0.17, 0.17, 0.25, M.chrome, sx * 0.8, 0.33, sz * 1.35, 12); hub.rotation.z = Math.PI / 2; g.add(hub);
        const fe = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.2, 16, 1, true, -Math.PI / 2, Math.PI), M.car);
        fe.rotation.z = Math.PI / 2; fe.position.set(sx * 0.78, 0.36, sz * 1.35); fe.castShadow = true; g.add(fe);
      }
      g.add(box(1.76, 0.16, 0.12, M.dark, 0, 0.38, -2.1)); g.add(box(1.76, 0.16, 0.12, M.dark, 0, 0.38, 2.1));   // para-choques
      g.add(box(0.36, 0.1, 0.03, M.lightWhite, -0.6, 0.66, -2.1)); g.add(box(0.36, 0.1, 0.03, M.lightWhite, 0.6, 0.66, -2.1));
      g.add(box(0.4, 0.09, 0.03, M.lightRed, -0.6, 0.68, 2.1)); g.add(box(0.4, 0.09, 0.03, M.lightRed, 0.6, 0.68, 2.1));
      g.add(box(0.1, 0.07, 0.14, M.car, -0.9, 0.98, -0.62)); g.add(box(0.1, 0.07, 0.14, M.car, 0.9, 0.98, -0.62));   // retrovisores
      return g;
    },
    plant(size = 1, seed = 1) {
      const g = G(); const rnd = mulberry32(seed);
      g.add(cyl(0.2, 0.15, 0.32, M.pot, 0, 0.16, 0, 12)); g.add(cyl(0.18, 0.18, 0.02, M.soil, 0, 0.32, 0, 12));
      g.add(cyl(0.03, 0.045, 0.5, M.trunk, 0, 0.56, 0, 8));
      for (let i = 0; i < 6; i++) { const a = rnd() * Math.PI * 2, r = 0.1 + rnd() * 0.16; g.add(sph(0.2 + rnd() * 0.1, i % 2 ? M.plant : M.leaf2, Math.cos(a) * r, 0.9 + rnd() * 0.25, Math.sin(a) * r)); }
      g.scale.setScalar(size); return g;
    },
    tree() {
      const g = G();
      g.add(cyl(0.09, 0.13, 2.0, M.trunk, 0, 1.0, 0, 10));
      const rnd = mulberry32(8);
      for (let i = 0; i < 7; i++) { const a = rnd() * Math.PI * 2, r = 0.15 + rnd() * 0.4; g.add(sph(0.5 + rnd() * 0.25, i % 2 ? M.plant : M.leaf2, Math.cos(a) * r, 2.2 + rnd() * 0.5, Math.sin(a) * r)); }
      return g;
    },
    lounger(fabric) {
      const g = G();
      g.add(box(0.65, 0.04, 1.9, M.white, 0, 0.34, 0));
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.04, 0.32, 0.04, M.white, sx * 0.29, 0.16, sz * 0.85));
      g.add(box(0.6, 0.08, 1.15, fabric, 0, 0.4, 0.33));
      const back = box(0.6, 0.08, 0.75, fabric, 0, 0.6, -0.6); back.rotation.x = -0.75; g.add(back);
      return g;
    },
    parasol() {
      const g = G();
      g.add(cyl(0.02, 0.02, 2.3, M.chrome, 0, 1.15, 0, 8)); g.add(cyl(0.22, 0.25, 0.06, M.dark, 0, 0.03, 0, 12));
      const c = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.34, 10, 1, true), new THREE.MeshStandardMaterial({ color: 0xf1e3c8, roughness: 0.95, side: THREE.DoubleSide })); c.position.y = 2.28; c.castShadow = true; g.add(c);
      return g;
    },
    roundTable(r = 0.45) {
      const g = G();
      g.add(cyl(r, r, 0.04, M.woodLite, 0, 0.72, 0, 24)); g.add(cyl(0.04, 0.04, 0.7, M.chrome, 0, 0.36, 0, 8)); g.add(cyl(0.25, 0.28, 0.03, M.chrome, 0, 0.015, 0, 16));
      return g;
    },
    rug(w, d, color) {
      const g = G(); const m = new THREE.MeshStandardMaterial({ color, roughness: 1 });
      const dark = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.7), roughness: 1 });
      g.add(box(w + 0.16, 0.01, d + 0.16, dark, 0, 0.005, 0, { cast: false })); g.add(box(w, 0.012, d, m, 0, 0.012, 0, { cast: false }));
      return g;
    },
  };
  return F;
}

// ---------------------------------------------------------------------------
// Desempenho: funde as malhas estáticas por material (um draw call por material).
// `root` = onde procurar (e onde o resultado fica). Com `skipKeep`, os subgrupos
// marcados com userData.keep (ex.: o grupo da Fachada) ficam de fora — eles são
// fundidos à parte, chamando mergeStatic(grupo) depois.
// ---------------------------------------------------------------------------
// Materiais "quase iguais" (mesmo tipo e opções, cor a ±22/255 por canal, rugosidade e
// metalicidade a ±0,25) viram um só no merge: as decorações criam muitas variações de
// preto/grafite/madeira que ninguém distingue, e cada variação custaria um draw call.
// Só entram materiais simples — sem mapas, sem transparência e sem emissivo (os emissivos
// podem ser animados pelo cartão, então ficam sempre separados).
const MAT_TOL_C = 22 / 255, MAT_TOL_R = 0.25;
// Materiais IDÊNTICOS (mesmas texturas — o mesmo objeto —, cores e opções) também viram um só, mesmo com
// mapa, emissivo ou transparência: ex. as laterais das letras caixa (ctx.logo.relief) e placas com a
// mesma textura criadas em vários lugares. Nunca entram os que o cartão anima (userData.noShare:
// ctx.bindEmissive, LEDs do som/ar, tela do telão) nem os com shader modificado (onBeforeCompile).
const _texId = (t) => t ? t.uuid : '';
function matExactSig(m) {
  if (m.userData.noShare || m.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile || !(m.isMeshStandardMaterial || m.isMeshBasicMaterial)) return null;
  const hx = (c) => c ? c.getHex() : '';
  return [m.type, hx(m.color), hx(m.emissive), m.emissiveIntensity, _texId(m.map), _texId(m.emissiveMap), _texId(m.bumpMap), m.bumpScale, _texId(m.aoMap), m.aoMapIntensity,
    _texId(m.alphaMap), _texId(m.normalMap), _texId(m.roughnessMap), _texId(m.metalnessMap), _texId(m.lightMap), _texId(m.envMap), m.roughness, m.metalness, m.envMapIntensity,
    m.transparent, m.opacity, m.alphaTest, m.side, m.depthWrite, m.depthTest, m.polygonOffset, m.polygonOffsetFactor, m.polygonOffsetUnits, m.blending,
    m.toneMapped, m.fog, m.vertexColors, m.flatShading, m.wireframe, m.visible, m.colorWrite].join('|');
}
function matCanon(reps, m) {
  if (m.map || m.emissiveMap || m.transparent || m.bumpMap || m.alphaTest || m.polygonOffset || (m.emissive && m.emissive.getHex() !== 0)) {
    const sig = matExactSig(m); if (!sig) return m;
    reps.exact = reps.exact || new Map();
    const r = reps.exact.get(sig); if (r) return r;
    reps.exact.set(sig, m); return m;
  }
  if (m.type !== 'MeshStandardMaterial' || m.transparent || m.opacity < 1 || m.alphaTest || m.vertexColors || m.wireframe
    || m.map || m.emissiveMap || m.normalMap || m.bumpMap || m.roughnessMap || m.metalnessMap || m.alphaMap || m.aoMap || m.lightMap || m.envMap
    || (m.emissive && m.emissive.getHex() !== 0) || m.polygonOffset || m.userData.noShare) return m;
  const sig = [m.side, m.flatShading, m.depthWrite, m.depthTest, m.fog, m.toneMapped, m.envMapIntensity].join('|');
  const c = m.color;
  for (const r of reps) {
    if (r.sig !== sig) continue;
    if (Math.abs(r.m.color.r - c.r) > r.tr || Math.abs(r.m.color.g - c.g) > r.tg || Math.abs(r.m.color.b - c.b) > r.tb) continue;
    if (Math.abs(r.m.roughness - m.roughness) > MAT_TOL_R || Math.abs(r.m.metalness - m.metalness) > MAT_TOL_R) continue;
    return r.m;
  }
  // tolerância medida em sRGB (a cor fica em linear dentro do material)
  const s = c.clone().convertLinearToSRGB();
  const tol = (v) => { const lo = new THREE.Color(Math.max(0, v - MAT_TOL_C), 0, 0).convertSRGBToLinear().r, hi = new THREE.Color(Math.min(1, v + MAT_TOL_C), 0, 0).convertSRGBToLinear().r; return (hi - lo) / 2; };
  reps.push({ m, sig, tr: tol(s.r), tg: tol(s.g), tb: tol(s.b) });
  return m;
}
// Junta as geometrias de `meshes` (coordenadas relativas a `inv`) numa só BufferGeometry.
// Escreve direto nos arrays finais (sem clonar/desindexar cada peça): com ~6 mil peças
// isso corta o tempo de fusão pela metade.
function mergeGeos(meshes, inv) {
  let total = 0;
  for (const o of meshes) total += o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count;
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), uv = new Float32Array(total * 2);
  const m4 = new THREE.Matrix4(), n3 = new THREE.Matrix3();
  let off = 0;
  for (const o of meshes) {
    const g = o.geometry, idx = g.index, P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv;
    m4.multiplyMatrices(inv, o.matrixWorld); n3.getNormalMatrix(m4);
    const e = m4.elements, q = n3.elements;
    const n = idx ? idx.count : P.count;
    for (let k = 0; k < n; k++) {
      const i = idx ? idx.getX(k) : k, j = (off + k) * 3;
      const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
      pos[j] = e[0] * x + e[4] * y + e[8] * z + e[12]; pos[j + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]; pos[j + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
      const a = N.getX(i), b = N.getY(i), c = N.getZ(i);
      let nx = q[0] * a + q[3] * b + q[6] * c, ny = q[1] * a + q[4] * b + q[7] * c, nz = q[2] * a + q[5] * b + q[8] * c;
      const l = Math.hypot(nx, ny, nz) || 1; nor[j] = nx / l; nor[j + 1] = ny / l; nor[j + 2] = nz / l;
      uv[(off + k) * 2] = U.getX(i); uv[(off + k) * 2 + 1] = U.getY(i);
    }
    off += n;
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  merged.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  merged.computeBoundingSphere();
  return merged;
}
function mergeStatic(root, skipKeep = true) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const groups = new Map(), reps = [];
  root.traverse((o) => {
    if (o === root || !o.isMesh || o.isSprite || o.userData.item || o.userData.zone || o.userData.keep || o.userData.noMerge) return;
    for (let q = o.parent; q && q !== root; q = q.parent) if (q.userData && (q.userData.item || (skipKeep && q.userData.keep))) return;
    const g = o.geometry, m0 = o.material;
    if (Array.isArray(m0) || !g.attributes.position || !g.attributes.normal || !g.attributes.uv) return;
    const m = matCanon(reps, m0);
    // quem projeta sombra fica separado de quem não projeta (custo das sombras);
    // receber sombra não separa: o grupo recebe se qualquer peça recebia
    const key = m.uuid + (o.castShadow ? ':c' : ':n');
    if (!groups.has(key)) groups.set(key, { mat: m, meshes: [] });
    groups.get(key).meshes.push(o);
  });
  // Peças rente ao chão (tapetes, faixas, capachos, marcações: topo ≤ 0,1 m) que não projetam sombra
  // entram no grupo das que projetam, quando ele existe: a sombra delas é invisível e economiza 1 draw call.
  const _bb = new THREE.Box3();
  for (const [key, grp] of groups) {
    if (!key.endsWith(':n')) continue;
    const cg = groups.get(key.slice(0, -2) + ':c'); if (!cg) continue;
    if (grp.meshes.every((o) => { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); return _bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld).max.y <= 0.1; })) {
      cg.meshes.push(...grp.meshes); groups.delete(key);
    }
  }
  let before = 0, after = 0;
  for (const { mat, meshes } of groups.values()) {
    before += meshes.length;
    if (meshes.length < 2) { after += meshes.length; meshes[0].material = mat; continue; }
    const mesh = new THREE.Mesh(mergeGeos(meshes, inv), mat);
    mesh.castShadow = meshes[0].castShadow; mesh.receiveShadow = meshes.some((o) => o.receiveShadow); mesh.matrixAutoUpdate = false; mesh.renderOrder = meshes[0].renderOrder;
    for (const o of meshes) { o.parent.remove(o); o.geometry.dispose(); }
    root.add(mesh); after += 1;
  }
  return { before, after };
}

// Funde as peças de luminária/objeto ligadas à mesma entidade que usam o mesmo material
// (lentes, campânulas, cúpulas): continuam clicáveis e acendendo juntas, com 1 draw call.
// Só peças soltas direto na cena/grupo (as folhas da porta, que giram, ficam de fora).
function mergeItems(holder, clickables, items) {
  holder.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(holder.matrixWorld).invert();
  const groups = new Map();
  for (const o of holder.children) {
    if (!o.isMesh || !o.userData.item || o.userData.zone || Array.isArray(o.material) || !o.geometry.attributes.uv) continue;
    const key = o.userData.item + '|' + o.material.uuid + (o.castShadow ? ':c' : ':n');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(o);
  }
  for (const meshes of groups.values()) {
    if (meshes.length < 2) continue;
    const o0 = meshes[0], mesh = new THREE.Mesh(mergeGeos(meshes, inv), o0.material);
    mesh.castShadow = o0.castShadow; mesh.receiveShadow = meshes.some((o) => o.receiveShadow);
    mesh.userData = { item: o0.userData.item };
    const set = new Set(meshes);
    const rt = items.get(o0.userData.item);
    if (rt && rt.fixtures && rt.fixtures.some((f) => set.has(f))) rt.fixtures = rt.fixtures.filter((f) => !set.has(f)).concat([mesh]);
    if (clickables.some((c) => set.has(c))) { for (let i = clickables.length - 1; i >= 0; i--) if (set.has(clickables[i])) clickables.splice(i, 1); clickables.push(mesh); }
    for (const o of meshes) { holder.remove(o); o.geometry.dispose(); }
    holder.add(mesh);
  }
}

// ---------------------------------------------------------------------------
// Controle de órbita (mínimo, sem dependências): arrastar gira, roda/pinça
// aproxima, botão direito / dois dedos / Shift arrasta o alvo.
// ---------------------------------------------------------------------------
class Orbit {
  constructor(camera, dom, target) {
    this.camera = camera; this.dom = dom;
    this.target = target.clone(); this.targetGoal = target.clone();
    this.sph = new THREE.Spherical().setFromVector3(camera.position.clone().sub(target));
    this.goal = this.sph.clone();
    this.minDist = 3; this.maxDist = 150; this.minPolar = 0.12; this.maxPolar = 1.45;
    this.pointers = new Map(); this.moved = 0; this.pinch = 0; this.touched = false;
    this.onClick = null; this.onHover = null;
    this._down = (e) => this.down(e); this._move = (e) => this.move(e);
    this._up = (e) => this.up(e); this._wheel = (e) => this.wheel(e);
    dom.addEventListener('pointerdown', this._down);
    dom.addEventListener('pointermove', this._move);
    dom.addEventListener('pointerup', this._up);
    dom.addEventListener('pointercancel', this._up);
    dom.addEventListener('wheel', this._wheel, { passive: false });
    dom.addEventListener('contextmenu', (e) => e.preventDefault());
    this.dirty = true;
  }
  dispose() {
    const d = this.dom;
    d.removeEventListener('pointerdown', this._down); d.removeEventListener('pointermove', this._move);
    d.removeEventListener('pointerup', this._up); d.removeEventListener('pointercancel', this._up);
    d.removeEventListener('wheel', this._wheel);
  }
  down(e) {
    this.dom.setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, b: e.button, shift: e.shiftKey });
    if (this.pointers.size === 2) this.pinch = this._dist();
    this.moved = 0;
  }
  _dist() {
    const [a, b] = [...this.pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
  move(e) {
    const p = this.pointers.get(e.pointerId);
    if (!p) { if (this.onHover) this.onHover(e); return; }
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY; this.touched = true;
    this.moved += Math.abs(dx) + Math.abs(dy);
    if (this.pointers.size === 2) {
      const d = this._dist();
      if (this.pinch) this.zoomBy(this.pinch / d);
      this.pinch = d;
      this.pan(dx * 0.5, dy * 0.5);
    } else if (p.b === 2 || p.b === 1 || p.shift) {
      this.pan(dx, dy);
    } else {
      this.goal.theta -= dx * 0.0055;
      this.goal.phi = clamp(this.goal.phi - dy * 0.0055, this.minPolar, this.maxPolar);
    }
    this.dirty = true;
  }
  up(e) {
    const p = this.pointers.get(e.pointerId);
    this.pointers.delete(e.pointerId);
    try { this.dom.releasePointerCapture(e.pointerId); } catch (_) {}
    if (p && this.moved < 6 && p.b === 0 && this.onClick) this.onClick(e);
    this.pinch = 0;
  }
  wheel(e) { e.preventDefault(); this.touched = true; this.zoomBy(Math.exp(e.deltaY * 0.0012)); this.dirty = true; }
  zoomBy(f) { this.goal.radius = clamp(this.goal.radius * f, this.minDist, this.maxDist); }
  pan(dx, dy) {
    const k = this.goal.radius * 0.0016;
    const fwd = new THREE.Vector3(); this.camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize();
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    this.targetGoal.addScaledVector(right, -dx * k).addScaledVector(fwd, dy * k);
    this.targetGoal.x = clamp(this.targetGoal.x, LOT.x0 - 6, LOT.x1 + 6);
    this.targetGoal.z = clamp(this.targetGoal.z, LOT.z0 - 6, LOT.z1 + 6);
  }
  reset(pos, target) {
    this.goal.setFromVector3(pos.clone().sub(target)); this.targetGoal.copy(target); this.dirty = true;
  }
  update(dt) {
    const k = 1 - Math.exp(-dt * 9);
    const s = this.sph;
    s.theta += (this.goal.theta - s.theta) * k;
    s.phi += (this.goal.phi - s.phi) * k;
    s.radius += (this.goal.radius - s.radius) * k;
    this.target.lerp(this.targetGoal, k);
    const moving = Math.abs(this.goal.theta - s.theta) + Math.abs(this.goal.phi - s.phi) + Math.abs(this.goal.radius - s.radius) + this.target.distanceTo(this.targetGoal) > 1e-4;
    this.camera.position.setFromSpherical(s).add(this.target);
    this.camera.lookAt(this.target);
    const wasDirty = this.dirty; this.dirty = moving;
    return wasDirty || moving;
  }
}

// @rooms-begin
function roomTemploPalco(ctx) {
  // ---------------------------------------------------------------------------
  // PALCO DO TEMPLO — na PAREDE LATERAL LONGA x = 0 (correção do cliente; plateia olha para −x)
  // Fiel à foto templo_foto.jpg e aos vídeos v6/v8:
  //  · plataforma x 0,15–5,0 · z 19,6–36,6 · topo y 1,0 — piso claro (compensado/madeira clara), testeira preta;
  //  · escadas pretas com corrimão inox nas duas pontas (à frente da testeira, sobem para −x);
  //  · 2 caixinhas pretas no piso à frente; retornos (wedges) no palco;
  //  · bateria Pearl (pele de resposta branca) sobre praticável preto no lado z baixo (direita de quem olha o palco),
  //    teclado em suporte X no lado z alto, violão e baixo em pedestais, pedestais de microfone, pedaleiras, banco alto;
  //  · barra de fixação do telão (grampos pretos acima da moldura); 2 telas brancas de projeção no alto da parede;
  //  · treliça preta tipo escada acima do telão (segura os 4 moving heads do cartão) + 2 barras de LED + 3 pares;
  //  · line arrays (2 clusters por lado, um reto e um angulado) pendurados por correntes até barras de rigging
  //    presas sob as tesouras brancas da cobertura (z 18,5–23,5 e 33,5–38,5);
  //  · perfis pretos verticais na parede alta (fora dos módulos das tesouras).
  // Objetos do cartão NÃO recriados: telão (painel x 0,12–0,24 · z 23,85–32,35 · y 1,10–4,20), moving heads
  // (x 0,8 · y 6,05 · z 23,9/26,7/29,5/32,3, grampo até y 6,30), LEDs do som (x 4,9 · z 19,8/36,4).
  // Nada alto (> y 2,5) na faixa dos feixes (x 0,8–4,6 × z de cada cabeça ± 1 m).
  // Emissivos: telas brancas → 'telao'; pares/barras de LED → 'palco'.
  // ---------------------------------------------------------------------------
  const THREE = ctx.THREE, M = ctx.M;
  const box = (...a) => ctx.box(...a), cyl = (...a) => ctx.cyl(...a), sph = (...a) => ctx.sph(...a);
  const place = (...a) => ctx.place(...a), std = (o) => ctx.std(o);
  const put = (m) => { ctx.add(m); return m; };
  const G = () => new THREE.Group();
  const rot = (m, x = 0, y = 0, z = 0) => { m.rotation.set(x, y, z); return m; };
  const nc = { cast: false };
  const HP = Math.PI / 2;
  const up = new THREE.Vector3(0, 1, 0);
  // barra cilíndrica entre dois pontos (tubos, correntes, pedestais inclinados)
  const bar = (x1, y1, z1, x2, y2, z2, r, mat, seg = 6, parent = null) => {
    const a = new THREE.Vector3(x1, y1, z1), b = new THREE.Vector3(x2, y2, z2);
    const d = b.clone().sub(a), len = d.length();
    const m = cyl(r, r, len, mat, 0, 0, 0, seg);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(up, d.normalize());
    m.castShadow = r > 0.015;
    if (parent) parent.add(m); else put(m);
    return m;
  };

  // ---------------- Materiais (mesmas opções → mesmo material → funde no merge) ----------------
  const deckMat  = std({ color: 0xd9c9ab, roughness: 0.5 });                          // piso do palco: madeira clara / bege
  const deckSeam = std({ color: 0x9c8c70, roughness: 0.8 });                          // juntas das chapas
  const blk      = std({ color: 0x131315, roughness: 0.82 });                         // testeira / praticável / escadas
  const blkSeam  = std({ color: 0x0a0a0b, roughness: 1 });
  const steelBlk = std({ color: 0x1c1d20, roughness: 0.45, metalness: 0.55 });        // treliça / perfis pretos
  const inox     = std({ color: 0xc9cdd2, roughness: 0.22, metalness: 0.9 });         // corrimãos
  const matte    = std({ color: 0x1b1b1e, roughness: 0.8 });                          // caixas de som
  const grille   = std({ color: 0x2c2d31, roughness: 0.95 });
  const rigGray  = std({ color: 0x5a5c62, roughness: 0.4, metalness: 0.7 });          // ferragens
  const chain    = std({ color: 0x8d9096, roughness: 0.35, metalness: 0.8 });         // correntes / cabos de aço
  const cable    = std({ color: 0x0b0b0c, roughness: 0.8 });
  const rubber   = std({ color: 0x101011, roughness: 1 });
  const chromeK  = M.chrome;
  const cymbal   = std({ color: 0xc9a24a, roughness: 0.3, metalness: 0.85 });
  const shell    = std({ color: 0x2b2c31, roughness: 0.3, metalness: 0.5 });          // cascos cinza-grafite (Pearl Export)
  const headW    = std({ color: 0xf0ede6, roughness: 0.7 });
  const keysW    = std({ color: 0xf4f2ec, roughness: 0.5 });
  const woodGtr  = std({ color: 0xd08a3a, roughness: 0.45 });                         // violão (tampo mel/laranja, foto)
  const woodDk   = std({ color: 0x5b3a22, roughness: 0.5 });
  const natural  = std({ color: 0xc8a676, roughness: 0.45 });                         // baixo natural (foto)
  const cream    = std({ color: 0xd8cfb8, roughness: 0.7 });
  const pedalC   = [std({ color: 0xc2410c, roughness: 0.5 }), std({ color: 0x2f7d4a, roughness: 0.5 }),
                    std({ color: 0xd9b21c, roughness: 0.5 }), std({ color: 0x2f5f9b, roughness: 0.5 })];
  const redSign  = std({ color: 0xc81e1e, roughness: 0.6 });
  const whiteP   = std({ color: 0xf4f4f2, roughness: 0.7 });
  // emissivos ligados às entidades
  const screenMat = std({ color: 0xeeeeec, roughness: 0.85, emissive: 0xf2f0ff, emissiveIntensity: 0.3 });   // telas de projeção
  const lensMat   = std({ color: 0x3a3642, roughness: 0.3, emissive: 0xd8c8ff, emissiveIntensity: 1.0 });    // lente dos pares
  const ledBarMat = std({ color: 0xd8d6cc, roughness: 0.35, emissive: 0xfff4e0, emissiveIntensity: 1.0 });   // barras de LED (brancas na foto)
  const ledG      = std({ color: 0x1e5a2e, emissive: 0x3ee07a, emissiveIntensity: 0.7 });
  ctx.bindEmissive('telao', screenMat, 0.32, { min: 0 });
  ctx.bindEmissive('palco', lensMat, 1.3, { min: 0 });
  ctx.bindEmissive('palco', ledBarMat, 1.1, { min: 0 });
  ctx.bindEmissive('som', ledG, 0.7);

  // ======================= PLATAFORMA =======================
  const X0 = 0.15, X1 = 5.0, Z0 = 19.6, Z1 = 36.6, SY = 1.0, CX = (X0 + X1) / 2, CZ = (Z0 + Z1) / 2;
  const DT = 0.04;                                           // espessura do tampo (borda clara aparente na frente)
  put(box(X1 - X0, SY - DT, Z1 - Z0, blk, CX, (SY - DT) / 2, CZ));
  put(box(X1 - X0, DT, Z1 - Z0, deckMat, CX, SY - DT / 2, CZ));
  // juntas das chapas (1,22 × 2,44): ao longo de z a cada 1,22 m; ao longo de x a cada 2,44 m
  for (let z = Z0 + 1.22; z < Z1 - 0.2; z += 1.22) put(box(X1 - X0 - 0.04, 0.002, 0.006, deckSeam, CX, SY + 0.001, z, nc));
  put(box(0.006, 0.002, Z1 - Z0 - 0.04, deckSeam, X1 - 2.44, SY + 0.001, CZ, nc));
  // testeira preta: faixa de sombra sob o tampo + juntas verticais dos painéis
  put(box(0.012, 0.05, Z1 - Z0, blkSeam, X1 + 0.006, SY - DT - 0.03, CZ, nc));
  for (let z = Z0 + 2.44; z < Z1 - 0.3; z += 2.44) put(box(0.008, SY - DT - 0.08, 0.012, blkSeam, X1 + 0.004, (SY - DT - 0.08) / 2 + 0.02, z, nc));
  put(box(0.02, 0.05, Z1 - Z0 - 0.02, rubber, X1 - 0.03, 0.025, CZ, nc));    // rodapé recuado

  // ======================= ESCADAS NAS PONTAS (à frente da testeira) + CORRIMÃO INOX =======================
  // 6 espelhos de 1/6 m, 5 pisos de 0,26 m: do piso (x 6,3) até o tampo (x 5,0). Largura 1,1 m.
  const NR = 6, RISE = SY / NR, RUN = 0.26, SW = 1.1;
  const stair = (zc) => {
    for (let k = 1; k < NR; k++) {
      const h = k * RISE, xa = X1, xb = X1 + (NR - k) * RUN, xc = (xa + xb) / 2;
      put(box(xb - xa, h, SW, blk, xc, h / 2, zc));
      put(box(0.03, 0.012, SW, rigGray, xb - 0.015, h - 0.006, zc, nc));             // cantoneira do bocel
    }
    // corrimão inox nos dois lados (2 tubos: mão + intermediário), montantes em baixo, no meio e em cima
    for (const s of [-1, 1]) {
      const z = zc + s * (SW / 2 - 0.04);
      const xb = X1 + (NR - 1) * RUN - 0.1, xt = X1 + 0.07;                            // x 6,3 → 5,07
      const yb = RISE, yt = (NR - 1) * RISE;                                          // degrau 1 e degrau 5
      const xm = (xb + xt) / 2, ym = RISE * Math.floor(NR - (xm - X1) / RUN), yr = yb + (yt - yb) * (xb - xm) / (xb - xt);
      bar(xb, yb, z, xb, yb + 0.95, z, 0.02, inox, 10);
      bar(xm, ym, z, xm, yr + 0.95, z, 0.018, inox, 10);
      bar(xt, yt, z, xt, yt + 0.95, z, 0.02, inox, 10);
      bar(xb, yb + 0.95, z, xt, yt + 0.95, z, 0.021, inox, 10);                       // mão
      bar(xb, yb + 0.45, z, xt, yt + 0.45, z, 0.013, inox, 8);                        // intermediário
      // grade de barras verticais finas (como na foto)
      for (let i = 1; i < 7; i++) {
        const t = i / 7, x = xb + (xt - xb) * t, yl = yb + (yt - yb) * t;
        bar(x, yl + 0.47, z, x, yl + 0.93, z, 0.006, inox, 5);
      }
    }
  };
  stair(Z0 + 0.6);           // z 19,65–20,75
  stair(Z1 - 0.6);           // z 35,45–36,55

  // ======================= CAIXAS NO PISO À FRENTE (front fill) =======================
  const floorBox = () => {
    const g = G();
    g.add(box(0.56, 0.5, 0.46, matte, 0, 0.25, 0));
    g.add(box(0.5, 0.42, 0.012, grille, 0, 0.26, 0.232, nc));
    g.add(box(0.1, 0.012, 0.004, rigGray, 0.19, 0.06, 0.238, nc));
    return g;
  };
  place(floorBox(), 5.38, 25.3, HP);
  place(floorBox(), 5.38, 30.9, HP);

  // ======================= RETORNOS (wedges) =======================
  const wedgeGeo = (() => {
    const sh = new THREE.Shape();
    sh.moveTo(0.22, 0); sh.lineTo(-0.2, 0); sh.lineTo(-0.2, 0.1); sh.lineTo(0.1, 0.3); sh.lineTo(0.22, 0.3); sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.54, bevelEnabled: false });
    geo.rotateY(HP); geo.translate(-0.27, 0, 0);
    return geo;
  })();
  const wedge = () => {
    const g = G();
    const body = new THREE.Mesh(wedgeGeo, matte); body.castShadow = true; body.receiveShadow = true; g.add(body);
    const f = box(0.46, 0.3, 0.01, grille, 0, 0.207, 0.054, nc); f.rotation.x = -0.98; g.add(f);
    return g;
  };
  // pontas (angulados para o centro) — longe dos LEDs do som (x 4,85–4,95)
  place(wedge(), 4.15, 20.75, -0.93, SY);
  place(wedge(), 4.15, 35.45, -2.21, SY);
  // retornos baixos na borda da frente (caixas pretas compridas da foto), virados para os músicos (−x)
  const lowWedge = () => {
    const g = G();
    const b = box(0.95, 0.15, 0.34, matte, 0, 0.09, 0); b.rotation.x = -0.12; g.add(b);
    const f = box(0.88, 0.1, 0.01, grille, 0, 0.1, 0.17, nc); f.rotation.x = -0.12; g.add(f);
    return g;
  };
  place(lowWedge(), 4.62, 26.0, -HP, SY);
  place(lowWedge(), 4.62, 30.0, -HP, SY);

  // ======================= BATERIA PEARL SOBRE PRATICÁVEL PRETO (lado z baixo) =======================
  const RX0 = 0.55, RX1 = 3.05, RZ0 = 22.0, RZ1 = 24.8, RH = 0.25;
  put(box(RX1 - RX0, RH, RZ1 - RZ0, blk, (RX0 + RX1) / 2, SY + RH / 2, (RZ0 + RZ1) / 2));
  put(box(0.012, 0.02, RZ1 - RZ0, blkSeam, RX1 + 0.006, SY + RH - 0.03, (RZ0 + RZ1) / 2, nc));
  // pele de resposta branca com "Pearl" e furo de porta (textura de canvas; logo da marca)
  const pearlTex = ctx.makeTex(256, (g, s) => {
    g.fillStyle = '#f2f0ea'; g.fillRect(0, 0, s, s);
    g.fillStyle = '#1a1a1a'; g.font = 'italic bold 58px Georgia, "Times New Roman", serif';
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Pearl', s * 0.5, s * 0.3);
    g.beginPath(); g.arc(s * 0.68, s * 0.68, s * 0.09, 0, Math.PI * 2); g.fillStyle = '#2a2320'; g.fill();
    g.lineWidth = 5; g.strokeStyle = '#8a8580'; g.stroke();
  });
  const pearlMat = std({ color: 0xffffff, map: pearlTex, roughness: 0.6 });
  const drumKit = () => {
    const g = G();                       // local: +z = frente (plateia), x = largura
    g.add(box(1.6, 0.006, 1.5, std({ color: 0x2a2a2d, roughness: 1 }), 0, 0.003, -0.05, nc));   // tapete
    // bumbo 22" (deitado, pele de resposta para +z)
    g.add(rot(cyl(0.28, 0.28, 0.42, shell, 0, 0.29, 0.2, 22), HP));
    g.add(rot(cyl(0.285, 0.285, 0.024, chromeK, 0, 0.29, 0.405, 22), HP));
    g.add(rot(cyl(0.285, 0.285, 0.024, chromeK, 0, 0.29, -0.005, 22), HP));
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.272, 28), pearlMat);
    face.position.set(0, 0.29, 0.419); face.castShadow = false; g.add(face);
    for (const sx of [-1, 1]) bar(sx * 0.2, 0.1, 0.35, sx * 0.3, 0.0, 0.45, 0.01, chromeK, 5, g);   // esporas
    // caixa, tons (sobre o bumbo), surdo
    const drum = (r, h, x, y, z, tilt = 0) => {
      const d = G(); d.position.set(x, y, z); d.rotation.x = tilt;
      d.add(cyl(r, r, h, shell, 0, 0, 0, 18)); d.add(cyl(r - 0.005, r - 0.005, 0.006, headW, 0, h / 2 + 0.003, 0, 18));
      d.add(cyl(r + 0.006, r + 0.006, 0.014, chromeK, 0, h / 2 - 0.007, 0, 18));
      g.add(d);
    };
    drum(0.18, 0.14, -0.32, 0.62, -0.1, 0.12);                        // caixa
    bar(-0.32, 0, -0.1, -0.32, 0.55, -0.1, 0.01, chromeK, 5, g);
    drum(0.13, 0.19, -0.14, 0.78, 0.12, 0.35); drum(0.15, 0.2, 0.16, 0.8, 0.12, 0.35);   // tons
    drum(0.2, 0.36, 0.46, 0.42, -0.16);                                // surdo
    for (const [x, z] of [[0.34, -0.31], [0.58, -0.31], [0.46, -0.01]]) g.add(cyl(0.008, 0.008, 0.24, chromeK, x, 0.12, z, 5));
    // chimbal
    bar(-0.64, 0, -0.14, -0.64, 0.86, -0.14, 0.012, chromeK, 6, g);
    for (let i = 0; i < 3; i++) { const a = i * 2.094; bar(-0.64, 0.25, -0.14, -0.64 + Math.cos(a) * 0.2, 0, -0.14 + Math.sin(a) * 0.2, 0.008, chromeK, 5, g); }
    g.add(cyl(0.18, 0.18, 0.008, cymbal, -0.64, 0.86, -0.14, 20)); g.add(cyl(0.18, 0.18, 0.008, cymbal, -0.64, 0.88, -0.14, 20));
    // pratos: ataque, condução, china (pedestais com tripé; topo ≤ 1,12 acima do praticável)
    for (const [x, y, z, r] of [[-0.46, 1.1, 0.25, 0.2], [0.62, 1.02, 0.12, 0.23], [0.2, 1.12, 0.32, 0.17]]) {
      const bx = x * 0.9, bz = z - 0.2;
      bar(bx, 0, bz, x, y - 0.02, z, 0.01, chromeK, 5, g);
      for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.4; bar(bx, 0.3, bz, bx + Math.cos(a) * 0.22, 0, bz + Math.sin(a) * 0.22, 0.008, chromeK, 5, g); }
      g.add(rot(cyl(r, r, 0.008, cymbal, x, y, z, 20), 0.2 * Math.sign(z), 0, -0.12 * Math.sign(x)));
    }
    // banco do baterista
    g.add(cyl(0.17, 0.17, 0.08, M.dark, 0, 0.52, -0.52, 16));
    g.add(cyl(0.02, 0.02, 0.48, chromeK, 0, 0.24, -0.52, 6));
    for (let i = 0; i < 3; i++) { const a = i * 2.094; bar(0, 0.12, -0.52, Math.cos(a) * 0.22, 0, -0.52 + Math.sin(a) * 0.22, 0.01, chromeK, 5, g); }
    return g;
  };
  place(drumKit(), 1.95, 23.45, HP, SY + RH);          // de frente para a plateia (+x)

  // ======================= INSTRUMENTOS EM PEDESTAIS =======================
  const gtrStand = (bodyMat, kind) => {
    const g = G();                       // instrumento virado para +z local
    bar(0, 0.02, -0.1, 0, 0.66, -0.06, 0.009, M.dark, 5, g);
    for (const sx of [-1, 1]) bar(sx * 0.17, 0, 0.12, 0, 0.18, 0.02, 0.009, M.dark, 5, g);
    bar(0, 0, -0.16, 0, 0.18, 0.02, 0.009, M.dark, 5, g);
    g.add(box(0.34, 0.03, 0.06, M.dark, 0, 0.16, 0.06));
    const ins = G(); ins.position.set(0, 0.14, 0.02); ins.rotation.x = -0.2;
    if (kind === 'violao') {
      const b1 = rot(cyl(0.19, 0.19, 0.1, bodyMat, 0, 0.22, 0, 22), HP); ins.add(b1);
      const b2 = rot(cyl(0.15, 0.15, 0.1, bodyMat, 0, 0.47, 0, 22), HP); ins.add(b2);
      ins.add(rot(cyl(0.045, 0.045, 0.004, M.dark, 0, 0.38, 0.051, 14), HP));
      ins.add(box(0.1, 0.012, 0.03, woodDk, 0, 0.25, 0.055, nc));
      ins.add(box(0.05, 0.5, 0.03, woodDk, 0, 0.84, 0)); ins.add(box(0.08, 0.16, 0.025, woodDk, 0, 1.16, -0.005));
    } else {
      const k = 1.1;
      ins.add(rot(cyl(0.17 * k, 0.17 * k, 0.045, bodyMat, 0, 0.24 * k, 0, 18), HP));
      ins.add(rot(cyl(0.125 * k, 0.125 * k, 0.045, bodyMat, 0.015, 0.42 * k, 0, 16), HP));
      ins.add(rot(box(0.05, 0.16, 0.045, bodyMat, -0.1 * k, 0.52 * k, 0), 0, 0, 0.35));
      ins.add(box(0.14, 0.18, 0.006, M.dark, 0.03, 0.34 * k, 0.025, nc));
      ins.add(box(0.07, 0.02, 0.012, chromeK, 0, 0.2 * k, 0.028, nc));
      ins.add(box(0.045, 0.78, 0.025, woodDk, 0, 0.55 + 0.39, 0));
      ins.add(box(0.07, 0.17, 0.02, M.dark, 0, 0.55 + 0.78 + 0.08, 0));
    }
    g.add(ins);
    return g;
  };
  place(gtrStand(natural, 'baixo'), 2.35, 25.25, HP, SY);
  place(gtrStand(woodGtr, 'violao'), 1.6, 29.55, HP, SY);

  // ======================= TECLADO EM SUPORTE X (lado z alto) + BANCO ALTO =======================
  {
    const g = G();                       // teclas ao longo de x local, músico em −z local
    for (const s of [-1, 1]) {           // X no plano do comprimento
      bar(-0.36, 0.02, s * 0.2, 0.36, 0.84, s * 0.2, 0.017, M.dark, 8, g);
      bar(0.36, 0.02, s * 0.2, -0.36, 0.84, s * 0.2, 0.017, M.dark, 8, g);
    }
    for (const x of [-0.37, 0.37]) g.add(box(0.05, 0.03, 0.46, M.dark, x, 0.015, 0));    // pés
    for (const x of [-0.36, 0.36]) g.add(box(0.05, 0.03, 0.44, M.dark, x, 0.85, 0));     // braços
    g.add(cyl(0.025, 0.025, 0.1, chromeK, 0, 0.43, 0, 10));                               // pino do X
    const kb = G(); kb.position.set(0, 0.87, 0);
    kb.add(box(1.3, 0.09, 0.32, M.dark, 0, 0.045, 0));
    kb.add(box(1.2, 0.022, 0.15, keysW, 0, 0.09, -0.07, nc));
    for (let i = 0; i < 26; i++) if ([1, 2, 4, 5, 6].includes(i % 7)) kb.add(box(0.012, 0.012, 0.09, M.dark, -0.585 + i * 0.045, 0.106, -0.045, nc));
    kb.add(box(0.3, 0.004, 0.05, M.screenOff, 0.25, 0.092, 0.09, nc));
    g.add(kb);
    // pedal de sustain + cabo
    g.add(box(0.08, 0.03, 0.2, M.dark, 0.25, 0.015, -0.45));
    place(g, 1.75, 31.4, HP, SY);                        // local +z → +x: músico (−z local) fica do lado da parede
  }
  {
    // banco alto preto (como na foto, junto à parede à esquerda do telão)
    const g = G();
    g.add(box(0.36, 0.035, 0.36, M.dark, 0, 0.76, 0));
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(rot(box(0.03, 0.78, 0.03, M.dark, sx * 0.15, 0.38, sz * 0.15), sz * 0.05, 0, -sx * 0.05));
    g.add(box(0.33, 0.02, 0.02, M.dark, 0, 0.28, 0.15)); g.add(box(0.33, 0.02, 0.02, M.dark, 0, 0.28, -0.15));
    g.add(box(0.02, 0.02, 0.33, M.dark, 0.15, 0.28, 0)); g.add(box(0.02, 0.02, 0.33, M.dark, -0.15, 0.28, 0));
    place(g, 0.7, 32.95, 0, SY);
  }

  // ======================= PEDESTAIS DE MICROFONE =======================
  const micStand = (h = 1.35, boom = 0) => {
    const g = G();
    for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.5; bar(0, 0.12, 0, Math.cos(a) * 0.26, 0.005, Math.sin(a) * 0.26, 0.008, M.dark, 5, g); }
    bar(0, 0.12, 0, 0, h, 0, 0.011, M.dark, 6, g);
    const top = boom ? [0, h + 0.18, 0.42] : [0, h, 0];
    if (boom) bar(0, h - 0.05, -0.15, 0, h + 0.18, 0.42, 0.008, M.dark, 5, g);
    g.add(rot(cyl(0.022, 0.014, 0.17, M.dark, top[0], top[1] + 0.05, top[2] + 0.02, 10), 0.5));
    g.add(sph(0.026, M.graphite, top[0], top[1] + 0.12, top[2] + 0.06));
    return g;
  };
  place(micStand(1.15, 1), 3.35, 26.2, HP, SY);          // topo ≤ y 2,5
  place(micStand(1.3), 3.55, 28.1, 0, SY);               // vocal central
  place(micStand(1.3), 3.25, 29.1, 0, SY);
  place(micStand(1.1, 1), 2.35, 32.15, -2.4, SY);        // boom do tecladista

  // ======================= PEDALEIRAS, DI, CABOS =======================
  const pedalboard = (n, w, baseMat = M.dark) => {
    const g = G();
    g.add(box(w, 0.045, 0.3, baseMat, 0, 0.0225, 0));
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + 0.08 + i * (w - 0.16) / Math.max(1, n - 1);
      g.add(box(0.075, 0.035, 0.12, pedalC[i % 4], x, 0.062, 0.02));
      g.add(sph(0.007, ledG, x, 0.082, -0.03));
    }
    return g;
  };
  place(pedalboard(4, 0.6), 3.15, 25.75, -HP, SY);
  place(pedalboard(3, 0.5), 3.35, 28.55, -HP, SY);
  {
    // multiefeito claro (caixa bege/metálica da foto) + DI
    const g = G();
    g.add(box(0.62, 0.07, 0.28, cream, 0, 0.035, 0));
    g.add(box(0.5, 0.004, 0.06, M.screenOff, 0, 0.072, -0.07, nc));
    for (let i = 0; i < 5; i++) g.add(box(0.07, 0.015, 0.07, rigGray, -0.22 + i * 0.11, 0.078, 0.06, nc));
    place(g, 3.2, 27.45, -HP, SY);
    put(box(0.12, 0.06, 0.16, rigGray, 2.9, SY + 0.03, 26.85));
  }
  const floorCable = (pts) => { for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1]; bar(ax, SY + 0.008, az, bx, SY + 0.008, bz, 0.007, cable, 4); } };
  floorCable([[3.55, 28.1], [3.2, 27.7], [2.6, 27.2], [0.6, 27.0]]);
  floorCable([[3.35, 26.2], [2.9, 26.85], [2.6, 27.2]]);
  floorCable([[3.25, 29.1], [2.8, 28.7], [2.6, 27.2]]);
  floorCable([[1.75, 31.4], [1.2, 30.4], [0.6, 30.0]]);
  floorCable([[3.15, 25.75], [2.6, 25.4], [2.35, 25.25]]);

  // ======================= TELÃO: BARRA DE FIXAÇÃO + GRAMPOS (acima da moldura, sem encostar) =======================
  // painel do cartão: x 0,12–0,24 · y 1,10–4,20 · z 23,85–32,35 → barra em y 4,36 (≥ 0,1 m de folga)
  bar(0.2, 4.36, 23.7, 0.2, 4.36, 32.5, 0.025, steelBlk, 8);
  for (let i = 0; i <= 10; i++) put(box(0.07, 0.05, 0.05, steelBlk, 0.2, 4.34, 23.95 + i * 0.815, nc));
  for (const z of [24.1, 28.1, 32.1]) {
    put(box(0.12, 0.04, 0.04, steelBlk, 0.145, 4.36, z, nc));                         // mão-francesa até a parede
    put(box(0.012, 0.16, 0.12, steelBlk, 0.093, 4.36, z, nc));                        // chapa na parede
  }

  // ======================= TELAS BRANCAS DE PROJEÇÃO =======================
  // 3,2 × 2,4 m, y 3,9–6,3, na face da parede (x ≈ 0,12). A tela do lado z alto foi deslocada para z 33,7–36,9
  // para não bater no pilar da tesoura de z 33,5 (os pilares/tesouras são da decoração da plateia).
  for (const [za, zb] of [[19.9, 23.1], [33.7, 36.9]]) {
    const zc = (za + zb) / 2;
    put(box(0.03, 2.4, zb - za, screenMat, 0.115, 5.1, zc, nc));
    put(box(0.02, 2.44, 0.02, rigGray, 0.11, 5.1, za - 0.01, nc));
    put(box(0.02, 2.44, 0.02, rigGray, 0.11, 5.1, zb + 0.01, nc));
    put(box(0.02, 0.02, zb - za + 0.04, rigGray, 0.11, 6.31, zc, nc));
    put(box(0.02, 0.02, zb - za + 0.04, rigGray, 0.11, 3.89, zc, nc));
  }

  // ======================= TRELIÇA PRETA TIPO ESCADA ACIMA DO TELÃO =======================
  // z 23,1–33,1 (como na foto: termina ~0,8 m além das bordas do telão, entre as telas brancas).
  // Seção 0,30 × 0,30: banzos em x 0,65 / 0,95 · y 6,325 / 6,60 (banzo inferior encosta no grampo dos moving heads, y 6,30).
  const TZ0 = 23.1, TZ1 = 33.1, TXA = 0.65, TXB = 0.95, TYB = 6.325, TYT = 6.6, TR = 0.022;
  const HEADS = [23.9, 26.7, 29.5, 32.3];
  for (const x of [TXA, TXB]) for (const y of [TYB, TYT]) bar(x, y, TZ0, x, y, TZ1, TR, steelBlk, 8);
  // degraus (montantes verticais nas duas faces + travessas em cima), longe das cabeças (≥ 0,3 m em z)
  const nb = 25;
  for (let i = 0; i <= nb; i++) {
    const z = TZ0 + (TZ1 - TZ0) * i / nb;
    if (HEADS.some((h) => Math.abs(h - z) < 0.3)) continue;
    for (const x of [TXA, TXB]) put(box(0.025, TYT - TYB, 0.025, steelBlk, x, (TYB + TYT) / 2, z));
    put(box(TXB - TXA, 0.02, 0.02, steelBlk, (TXA + TXB) / 2, TYT, z, nc));
  }
  for (const z of [TZ0, TZ1]) put(box(TXB - TXA + 0.05, TYT - TYB + 0.05, 0.02, steelBlk, (TXA + TXB) / 2, (TYB + TYT) / 2, z));
  // travessas inferiores nos pontos de fixação dos moving heads (apoio do grampo, fundo em y 6,30)
  for (const z of HEADS) put(box(TXB - TXA + 0.04, 0.04, 0.05, steelBlk, (TXA + TXB) / 2, 6.32, z, nc));
  // mãos-francesas até a parede (x 0,087) + chapas
  for (const z of [23.3, 25.3, 28.1, 30.9, 32.9]) {
    put(box(TXA - 0.09, 0.05, 0.05, steelBlk, (TXA + 0.09) / 2, 6.46, z));
    bar(0.095, 6.05, z, TXA, 6.44, z, 0.012, steelBlk, 5);
    put(box(0.012, 0.6, 0.14, steelBlk, 0.094, 6.25, z, nc));
  }
  // cabo de alimentação ao longo do banzo superior
  bar(0.7, TYT + 0.03, TZ0 + 0.1, 0.7, TYT + 0.03, TZ1 - 0.1, 0.01, cable, 5);

  // Pares LED (3) e barras de LED (2) penduradas na treliça, entre as cabeças (foto: par·MH·barra·MH·par·MH·barra·MH·par)
  const par = () => {
    const g = G();                                   // aponta para +x e para baixo
    g.add(box(0.05, 0.08, 0.05, steelBlk, 0, 0.23, 0));                     // grampo
    for (const s of [-1, 1]) g.add(box(0.2, 0.025, 0.02, steelBlk, 0.02, 0.15, s * 0.11, nc));
    for (const s of [-1, 1]) g.add(box(0.02, 0.17, 0.02, steelBlk, 0.0, 0.07, s * 0.11, nc));
    const can = G(); can.rotation.z = 0.85;
    can.add(cyl(0.085, 0.095, 0.24, M.dark, 0, 0, 0, 16));
    const lens = cyl(0.075, 0.075, 0.012, lensMat, 0, -0.123, 0, 16); lens.castShadow = false; can.add(lens);
    g.add(can);
    return g;
  };
  for (const z of [23.35, 28.1, 32.85]) place(par(), 0.8, z, 0, 6.04);
  const ledBar = () => {
    const g = G();                                   // barra horizontal ao longo de z, face para +x (inclinada p/ baixo)
    g.add(box(0.05, 0.08, 0.05, steelBlk, 0, 0.19, 0));
    const b = G(); b.rotation.z = -0.5;
    b.add(box(0.1, 0.14, 0.62, M.dark, 0, 0, 0));
    b.add(box(0.012, 0.1, 0.56, ledBarMat, 0.056, 0, 0, nc));
    g.add(b);
    for (const s of [-1, 1]) g.add(box(0.02, 0.14, 0.02, steelBlk, 0, 0.1, s * 0.28, nc));
    return g;
  };
  for (const z of [25.3, 30.9]) place(ledBar(), 0.8, z, 0, 6.1);

  // ======================= LINE ARRAYS (2 clusters por lado, correntes até as tesouras) =======================
  // Barras de rigging pretas em x 1,6, y 7,5, presas sob o banzo inferior (y 7,6) das tesouras de z 18,5–23,5 e 33,5–38,5.
  const RIGY = 7.5;
  for (const [za, zb] of [[18.4, 23.6], [33.4, 38.6]]) {
    put(box(0.08, 0.08, zb - za, steelBlk, 1.6, RIGY, (za + zb) / 2));
    for (const z of [za + 0.1, zb - 0.1]) put(box(0.14, 0.03, 0.14, rigGray, 1.6, RIGY + 0.055, z, nc));   // grampos na tesoura
  }
  const lineArray = () => {
    const g = G();                                   // face para +z local; topo do bumper em y 0
    g.add(box(0.82, 0.06, 0.6, steelBlk, 0, -0.03, -0.04));
    for (const sx of [-1, 1]) g.add(box(0.03, 0.1, 0.6, steelBlk, sx * 0.4, 0.02, -0.04));
    const angs = [0, 2, 4.5, 8].map((a) => a * Math.PI / 180);
    let py = -0.06, pz = 0;
    for (let i = 0; i < angs.length; i++) {
      const a = angs[i], hh = 0.25;
      const dy = -Math.cos(a) * hh / 2, dz = -Math.sin(a) * hh / 2;
      const cy = py + dy, cz = pz + dz;
      const cab = G(); cab.position.set(0, cy, cz); cab.rotation.x = a;
      cab.add(box(0.74, 0.235, 0.48, matte, 0, 0, -0.03));
      cab.add(box(0.7, 0.19, 0.012, grille, 0, 0, 0.216, nc));
      for (const sx of [-1, 1]) cab.add(box(0.02, 0.235, 0.46, rigGray, sx * 0.38, 0, -0.03, nc));
      g.add(cab);
      py = cy + dy; pz = cz + dz;
    }
    return g;
  };
  // [z, ry] — ry = π/2 → de frente para a plateia; os internos angulados para fora (como na foto)
  const arrays = [[20.45, HP], [22.3, 2.3], [34.0, 0.84], [36.15, HP]];
  const LAY = 6.12;
  for (const [z, ry] of arrays) {
    place(lineArray(), 1.6, z, ry, LAY);
    // correntes do bumper até a barra de rigging (duas por cluster)
    const s = Math.sin(ry), c = Math.cos(ry);
    for (const k of [-0.3, 0.3]) {
      const x = 1.6 + k * c, zz = z - k * s;
      bar(x, LAY, zz, 1.6, RIGY - 0.04, zz, 0.009, chain, 5);
      put(box(0.04, 0.05, 0.02, chain, x, LAY + 0.03, zz, nc));
    }
  }

  // ======================= PERFIS PRETOS NA PAREDE ALTA =======================
  // Montantes metálicos marcando os módulos da parede (fora das linhas das tesouras 13,5/18,5/23,5/…, que são da plateia).
  for (const z of [16.0, 41.0]) {
    put(box(0.06, 8.4, 0.12, steelBlk, 0.118, 4.2, z));
    put(box(0.02, 8.4, 0.05, blkSeam, 0.155, 4.2, z, nc));
  }

  // ======================= SINALIZAÇÃO (placa do extintor, como na foto) =======================
  put(box(0.01, 0.3, 0.2, redSign, 0.093, SY + 0.95, 34.6, nc));
  put(box(0.004, 0.12, 0.05, whiteP, 0.1, SY + 0.97, 34.6, nc));
  put(box(0.004, 0.03, 0.14, whiteP, 0.1, SY + 0.86, 34.6, nc));
}

function roomTemploPlateia(ctx) {
  // ---------------------------------------------------------------------------
  // TEMPLO — PLATEIA + COBERTURA APARENTE (x 0–16,05 · z 12,4–44,0), fiel às fotos/vídeos v6–v8.
  // CORREÇÃO DO CLIENTE: o palco fica na parede lateral longa x = 0 (x 0,15–5,0 · z 19,6–36,6);
  // a plateia olha para −x e a mídia (visor na parede x = 16,05) fica de frente para o palco.
  // Visual real: paredes pretas, porcelanato cinza polido (o cartão cria) e tesouras metálicas BRANCAS.
  // · Cadeiras pretas estofadas de encosto alto (estrutura de aço preto), 414 lugares em 4 blocos:
  //   2 centrais retos de 12 × 10 (corredor central de 1,76 m em z ≈ 28,1, alinhado com o centro do palco)
  //   e 2 das pontas levemente angulados (≈ 8,6°) para o centro; corredores laterais que recebem as
  //   escadas do palco (z ≈ 19,3–20,9 e 35,3–36,9), corredores junto às paredes z = 12,4 / 44 e passagem
  //   de ~1,25 m ao longo da parede x = 16,05 (porta preta de correr, visor da mídia), como em v7/v8.
  //   (≈ 500 não cabem com essas passagens: 8,5 m de fundo × 10 fileiras de 0,85 m.)
  // · Cobertura: 7 tesouras brancas (banzo inferior y 7,6 — os high-bays do cartão se prendem nele;
  //   superior 8,6) em z 13,5 / 18,5 / 23,5 / 28,5 / 33,5 / 38,5 / 43,3, pilares/perfis pretos nas duas
  //   laterais, vigas, terças e cordão de lampadinhas quentes nos beirais; 2ª treliça de luz (preta)
  //   sobre a plateia, pendurada nas tesouras. No modo Fachada a cobertura interna some (o telhado em
  //   meia-água do modo Fachada é mais baixo que as tesouras perto de x = 16).
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
  const white      = M.aluminioBranco;                                              // tesouras e terças brancas
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
  const bWhite = batch(white, true, cover), bBlk = batch(steelBlk, true, cover), bBulb = batch(bulbMat, false, cover);
  const bLens = batch(lensMat, false, cover), bCable = batch(blackPl, false, cover);

  // Tesouras brancas (plano xy em z = zt): banzos paralelos + montantes + diagonais em V
  const TZ = [13.5, 18.5, 23.5, 28.5, 33.5, 38.5, 43.3];
  const TX0 = FX0 + 0.16, TX1 = 15.93, YB = 7.64, YT = 8.56, NP = 18, DXP = (TX1 - TX0) / NP;
  for (const zt of TZ) {
    bx(bWhite, TX1 - TX0, 0.08, 0.1, (TX0 + TX1) / 2, YB, zt);         // banzo inferior (face de baixo em y 7,60)
    bx(bWhite, TX1 - TX0, 0.08, 0.1, (TX0 + TX1) / 2, YT, zt);         // banzo superior (topo em y 8,60)
    for (let i = 0; i <= NP; i++) bx(bWhite, 0.05, YT - YB - 0.08, 0.06, TX0 + i * DXP, (YB + YT) / 2, zt);
    for (let i = 0; i < NP; i++) {
      const xa = TX0 + i * DXP, xb = xa + DXP, up = i < NP / 2;
      bar(bWhite, [xa, up ? YB : YT, zt], [xb, up ? YT : YB, zt], 0.045);
    }
    // chapas de apoio sobre os pilares
    bx(bWhite, 0.2, 0.12, 0.26, TX0 + 0.02, YT - 0.02, zt);
    bx(bWhite, 0.2, 0.12, 0.26, TX1 - 0.08, YT - 0.02, zt);
  }
  // Terças (ao longo de z, sobre os banzos superiores); a de x 1,6 serve de ponto das correntes dos line arrays
  for (const x of [0.7, 1.6, 2.9, 4.2, 5.5, 6.8, 8.1, 9.4, 10.7, 12.0, 13.3, 14.6, 15.6])
    bx(bWhite, 0.05, 0.1, FZ1 - FZ0 - 0.02, x, 8.65, (FZ0 + FZ1) / 2);

  // Pilares/perfis pretos na parede do palco (x = 0, 8,5 m). Nos trechos do telão e das telas brancas
  // só há tocos acima da viga (y ≥ 6,95); ao lado do telão os perfis nascem no piso do palco (y 1,0).
  const PC = FX0 + 0.08;
  for (const [z, y0, y1] of [[13.5, 0, 8.6], [18.5, 0, 8.6], [23.55, 1.0, 8.6], [28.5, 6.95, 8.6], [32.65, 1.0, 6.8],
    [33.5, 6.95, 8.6], [38.5, 0, 8.6], [43.3, 0, 8.6]]) bx(bBlk, 0.16, y1 - y0, 0.24, FX0 + 0.08, (y0 + y1) / 2, z);
  bx(bBlk, 0.12, 0.15, FZ1 - FZ0 - 0.02, FX0 + 0.06, 6.875, (FZ0 + FZ1) / 2);   // viga horizontal preta (~7 m)
  bx(bBlk, 0.2, 0.12, FZ1 - FZ0, 0.1, 8.56, (FZ0 + FZ1) / 2);                    // frechal no topo da parede alta
  // Pilares pretos na lateral x = 16,05, subindo acima da parede de 3 m até as tesouras, + 2 vigas
  for (const z of TZ) bx(bBlk, 0.2, 5.6, 0.24, 16.05, 5.8, z);
  bx(bBlk, 0.16, 0.15, FZ1 - FZ0, 16.05, 6.0, (FZ0 + FZ1) / 2);
  bx(bBlk, 0.2, 0.12, FZ1 - FZ0, 16.05, 8.56, (FZ0 + FZ1) / 2);

  // Cordão de lampadinhas quentes nos dois beirais (v6/v8)
  for (const [x, y] of [[0.26, 8.3], [15.86, 8.3]]) {
    bx(bCable, 0.012, 0.012, FZ1 - FZ0 - 0.3, x, y + 0.05, (FZ0 + FZ1) / 2);
    for (let z = FZ0 + 0.3; z <= FZ1 - 0.25; z += 0.62) put(bBulb, sphGeo(0.036), mat4(x, y, z));
  }

  // 2ª treliça de luz (preta, box truss 0,3 × 0,3) sobre a plateia, paralela ao palco, pendurada nas tesouras
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
  // correntes até o banzo inferior (y 7,6): verticais em 23,5 / 28,5 / 33,5 e cabos inclinados das pontas
  for (const z of [23.5, 28.5, 33.5]) bar(bCable, [LX, LY1, z], [LX, YB - 0.04, z], 0.008, true);
  bar(bCable, [LX, LY1, LZ0 + 0.1], [LX, YB - 0.04, 18.5], 0.008, true);
  bar(bCable, [LX, LY1, LZ1 - 0.1], [LX, YB - 0.04, 38.5], 0.008, true);
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

function roomHallFamilia(ctx) {
  // ---------------------------------------------------------------------------
  // HALL DE ENTRADA (x 4,0–16,05 · z 44,0–49,65) + SALA DA FAMÍLIA (x 0–4,0 ·
  // z 46,3–49,65) + WC (x 0–1,9) e WC PCD (x 1,9–4,0) · z 44,0–46,3.
  // Paleta da fachada: preto, ripado de madeira clara, branco e grafite, com
  // acentos âmbar/terracota. Acabamentos reais (fotos/vídeos do cliente):
  // paredes de destaque em marmorato (x = 4,0 no hall; x = 0 na Sala da Família),
  // WCs no padrão dos banheiros (v3): porcelanato cinza até 1,2 m + mármore
  // "marrom imperador" na parede da bancada / marmorato nas outras, bancada branca
  // com cuba de apoio, torneira de parede, espelho com moldura de LED e lixeira
  // inox de pedal; faixa azul-marinho no acesso aos banheiros. Sala da Família:
  // laminado (cartão) + marmorato, sofá cinza, cortina cinza, brinquedos.
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
  const cream    = std({ color: 0xe9e1d3, roughness: 0.95 });
  const woodLt   = std({ color: 0xd8b98f, roughness: 0.7 });
  const whiteF   = std({ color: 0xf1efea, roughness: 0.6 });
  const wicker   = std({ color: 0xb9925a, roughness: 0.95 });
  const net      = std({ color: 0xf4f1ea, roughness: 1, transparent: true, opacity: 0.42 });
  const toys     = [0xe0574a, 0xf2b53a, 0x4f9bd9, 0x5bb36a, 0x9a6ad0, 0xf08fb0].map((c) => std({ color: c, roughness: 0.6 }));
  const eva      = [0xf2c14e, 0x7cc4e8, 0x9fd49a, 0xf4a3a0].map((c) => std({ color: c, roughness: 0.95 }));
  const fabricG  = std({ color: 0x8e9095, roughness: 0.97 });                     // sofá cinza (igual ao voluntariado)
  const fabricD  = std({ color: 0x55575c, roughness: 0.97 });                     // almofada cinza-escuro
  const mustard  = std({ color: 0xd9a53a, roughness: 0.95 });                     // almofada/manta mostarda
  const curtain  = std({ color: 0xcfcdc8, roughness: 1 });                        // cortina cinza-claro
  // Acabamentos reais do cartão (padrão em espaço de mundo: NÃO clonar, só reusar)
  const MARM = M.marmorato, PORC = M.porcelanatoCinza, MARR = M.marmoreMarrom;
  // WCs
  const grabBar  = std({ color: 0xd9dde1, roughness: 0.25, metalness: 0.85 });
  const alarm    = std({ color: 0xc4201b, roughness: 0.4 });
  const quartzW  = std({ color: 0xefeae0, roughness: 0.28 });                     // bancada de quartzo branco
  const basinIn  = std({ color: 0xdedcd6, roughness: 0.2 });                      // fundo da cuba
  const navy     = std({ color: 0x1b2d4f, roughness: 0.7 });                      // faixa azul-marinho (acesso aos banheiros)
  // moldura de LED dos espelhos (luz fria, v3) — acende com a luz dos banheiros
  const ledCool  = new THREE.MeshStandardMaterial({ color: 0xd8f7ff, emissive: 0x7fe6ff, emissiveIntensity: 1.1, roughness: 0.4 });
  ctx.bindEmissive('banheiros', ledCool, 1.3, { min: 0.12 });

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
  // Revestimento de parede (12 mm) colado na face f de uma parede. axis 'x' = parede com x fixo (corre em z),
  // 'z' = parede com z fixo (corre em x); dir = lado do ambiente (±1); a–b = trecho ao longo da parede; y0–y1.
  const CL = 0.012;
  const clad = (axis, f, dir, a, b, y0, y1, material) => {
    if (b - a < 0.01 || y1 - y0 < 0.01) return null;
    const c = f + dir * CL / 2, m = (a + b) / 2, y = (y0 + y1) / 2;
    return put(axis === 'x' ? box(CL, y1 - y0, b - a, material, c, y, m, nc) : box(b - a, y1 - y0, CL, material, m, y, c, nc));
  };
  // Parede de banheiro no padrão real: porcelanato cinza até 1,2 m + (mármore marrom | marmorato) em cima.
  // cuts = vãos [a, b] (portas, já com a folga de 0,1 m); acima de yTop do vão o revestimento superior continua.
  const wcWall = (axis, f, dir, a, b, upper, y0 = 0.09, cuts = [], yCut = 2.28) => {
    let cur = a;
    for (const [ca, cb] of cuts) { clad(axis, f, dir, cur, ca, y0, 1.2, PORC); clad(axis, f, dir, cur, ca, 1.2, 2.99, upper); cur = cb; }
    clad(axis, f, dir, cur, b, y0, 1.2, PORC); clad(axis, f, dir, cur, b, 1.2, 2.99, upper);
    for (const [ca, cb] of cuts) clad(axis, f, dir, ca, cb, yCut, 2.99, upper);
    // filete de acabamento (inox escovado) na junta das duas placas
    let c2 = a;
    for (const [ca, cb] of cuts) { if (ca - c2 > 0.02) put(axis === 'x' ? box(0.006, 0.008, ca - c2, M.steel, f + dir * (CL + 0.002), 1.2, (c2 + ca) / 2, nc) : box(ca - c2, 0.008, 0.006, M.steel, (c2 + ca) / 2, 1.2, f + dir * (CL + 0.002), nc)); c2 = cb; }
    if (b - c2 > 0.02) put(axis === 'x' ? box(0.006, 0.008, b - c2, M.steel, f + dir * (CL + 0.002), 1.2, (c2 + b) / 2, nc) : box(b - c2, 0.008, 0.006, M.steel, (c2 + b) / 2, 1.2, f + dir * (CL + 0.002), nc));
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
  // Planta grande perto do café (o balcão, o painel ripado e o letreiro da parede do templo foram retirados)
  place(bigPlant(1.7, 0.28, 5), 7.3, 49.02);

  // Parede de destaque em MARMORATO (vídeos): face do hall da parede x = 4,0 (portas com 0,1 m de folga,
  // o revestimento continua acima delas) e o trecho da parede z = 44,0 até o pilar de x 5,2
  {
    const F4 = 4.075;
    for (const [a, b] of [[44.075, 44.3], [45.4, 46.5], [47.6, 49.563]]) clad('x', F4, 1, a, b, 0.09, 2.99, MARM);
    for (const [a, b] of [[44.3, 45.4], [46.5, 47.6]]) clad('x', F4, 1, a, b, 2.28, 2.99, MARM);
    clad('z', 44.075, 1, 4.087, 5.19, 0.09, 2.99, MARM);
  }
  // Banco de madeira ripada entre as portas da parede x = 4,0 + quadro
  {
    const S = [];
    for (let i = 0; i < 6; i++) S.push([0.055, 0.04, 1.0, 4.19 + i * 0.065, 0.45, 45.95]);
    put(mergeBoxes(S, slat));
    for (const z of [45.55, 46.35]) { put(box(0.36, 0.43, 0.04, black, 4.35, 0.215, z)); }
    put(box(0.03, 0.8, 0.95, black, 4.102, 1.55, 45.95));
    put(box(0.012, 0.7, 0.85, slat, 4.123, 1.55, 45.95, nc));
    put(box(0.014, 0.28, 0.28, felt, 4.134, 1.55, 45.95, nc));
    put(cyl(0.07, 0.07, 0.016, amber, 4.141, 1.55, 45.95, 20)).rotation.z = Math.PI / 2;
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
  put(box(1.2, 0.26, 0.02, felt, 11.85, 2.62, WZ + 0.012, nc));
  const tpl = canvasMat(1.16 / 0.22, (g, W, Hh) => {
    g.clearRect(0, 0, W, Hh);
    g.fillStyle = '#f4efe6'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `600 ${Hh * 0.55}px ${FONT}`;
    g.fillText('T E M P L O', W / 2, Hh * 0.54);
  }, 0.7, true);
  plane(1.16, 0.22, tpl, 11.85, 2.62, WZ + 0.024);
  ctx.bindEmissive('hall', tpl, 0.7, { min: 0.25 });
  // Extintor (pó ABC) com placa, entre as portas de vidro do templo e a escada
  {
    const x = 13.38, z = 44.175;
    put(box(0.12, 0.06, 0.04, black, x, 1.6, 44.095));                            // suporte
    put(cyl(0.085, 0.085, 0.52, alarm, x, 1.25, z, 16));
    put(sph(0.085, alarm, x, 1.51, z)).scale.y = 0.5;
    put(cyl(0.02, 0.025, 0.08, black, x, 1.57, z, 8));
    put(box(0.12, 0.025, 0.03, black, x + 0.03, 1.62, z));                       // gatilho
    put(bar(x + 0.06, 1.55, z + 0.03, x + 0.1, 1.15, z + 0.06, 0.012, black));   // mangueira
    put(box(0.18, 0.18, 0.006, alarm, x, 1.9, 44.078, nc));                        // placa
    put(box(0.05, 0.1, 0.004, whiteF, x, 1.9, 44.083, nc));
  }
  // Placa de SAÍDA (verde, sempre acesa) sobre a porta principal, lado do hall
  {
    const ex = canvasMat(0.42 / 0.16, (g, W, Hh) => {
      g.fillStyle = '#0f8a3c'; g.fillRect(0, 0, W, Hh);
      g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `800 ${Hh * 0.56}px ${FONT}`; g.fillText('SAÍDA', W * 0.58, Hh * 0.54);
      g.beginPath(); g.moveTo(W * 0.08, Hh * 0.5); g.lineTo(W * 0.2, Hh * 0.25); g.lineTo(W * 0.2, Hh * 0.75); g.closePath(); g.fill();
    }, 0.9);
    put(box(0.44, 0.18, 0.03, whiteF, 12.0, 2.52, 49.548));
    plane(0.42, 0.16, ex, 12.0, 2.52, 49.532, Math.PI);
  }

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
    sign(0, 4.099, 2.42, 47.05, Math.PI / 2);      // hall → Sala da Família
    sign(1, 4.099, 2.42, 44.85, Math.PI / 2);      // hall → WC PCD
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
      put(box(0.03, 0.72, 0.52, black, 4.103, 1.68, z));
      const p = atlasPlane(0.48, 0.68, art, 0, 1, i / 3, (i + 1) / 3);
      p.position.set(4.12, 1.68, z); p.rotation.y = Math.PI / 2; put(p);
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
    // parede de destaque em marmorato (x = 0, face 0,087), como a sala ampla do v1
    clad('x', 0.087, 1, 46.375, 49.563, 0.07, 2.99, MARM);
    // Sofá cinza na parede x = 0 (de frente para a TV), almofadas mostarda/grafite e manta
    const S = G();
    S.add(box(1.8, 0.26, 0.8, fabricG, 0, 0.28, 0));
    S.add(box(1.8, 0.44, 0.17, fabricG, 0, 0.62, -0.315));
    for (const sx of [-1, 1]) S.add(box(0.14, 0.22, 0.8, fabricG, sx * 0.83, 0.52, 0));
    for (const sx of [-1, 1]) S.add(box(0.74, 0.1, 0.58, cream, sx * 0.38, 0.46, 0.08));
    S.add(rot(box(0.36, 0.34, 0.1, mustard, -0.5, 0.66, -0.17), -0.15, 0.2));
    S.add(rot(box(0.34, 0.32, 0.1, fabricD, 0.5, 0.66, -0.17), -0.15, -0.2));
    S.add(rot(box(0.6, 0.02, 0.5, cream, 0.45, 0.52, 0.08), 0, 0.1));
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) S.add(cyl(0.016, 0.012, 0.15, woodLt, sx * 0.82, 0.075, sz * 0.33, 6));
    place(S, 0.58, 48.42, Math.PI / 2);

    // Poltrona de amamentação (balanço) + pufe, voltada para a TV
    const P = G();
    P.add(cyl(0.3, 0.32, 0.03, woodLt, 0, 0.015, 0, 20));
    P.add(cyl(0.05, 0.06, 0.2, woodLt, 0, 0.13, 0, 10));
    P.add(box(0.7, 0.2, 0.66, cream, 0, 0.36, 0.02));
    P.add(rot(box(0.7, 0.7, 0.16, cream, 0, 0.78, -0.27), -0.14));
    for (const sx of [-1, 1]) { const a = cyl(0.09, 0.09, 0.66, cream, sx * 0.33, 0.54, 0.02, 12); a.rotation.x = Math.PI / 2; P.add(a); }
    P.add(box(0.52, 0.08, 0.5, fabricG, 0, 0.5, 0.05));
    P.add(rot(box(0.4, 0.3, 0.09, mustard, 0, 0.72, -0.16), -0.15));
    place(P, 2.15, 46.98, 0.72);
    const pf = cyl(0.2, 0.2, 0.34, fabricD, 2.64, 0.17, 47.5, 18); put(pf);
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
      const cx = 2.92, cz = 49.19;
      put(box(0.96, 0.86, 0.5, whiteF, cx, 0.45, cz));
      for (let i = 0; i < 3; i++) { put(box(0.9, 0.24, 0.012, woodLt, cx, 0.2 + i * 0.27, cz - 0.255)); put(box(0.14, 0.015, 0.02, M.chrome, cx, 0.27 + i * 0.27, cz - 0.268)); }
      put(box(0.96, 0.03, 0.52, woodLt, cx, 0.895, cz));
      put(box(0.74, 0.06, 0.46, fabricG, cx - 0.08, 0.94, cz));
      for (const sx of [-1, 1]) put(box(0.05, 0.1, 0.46, fabricG, cx - 0.08 + sx * 0.36, 0.96, cz));
      put(box(0.16, 0.12, 0.2, wicker, cx + 0.38, 0.97, cz));
      for (let i = 0; i < 3; i++) put(box(0.13, 0.03, 0.15, whiteF, cx + 0.38, 1.02 + i * 0.032, cz));
      put(box(0.12, 0.06, 0.08, toys[4], cx + 0.39, 1.14, cz + 0.02));
    }
    // Cortinas leves (laterais da janela x 0,6–3,2) e varão
    put(cyl(0.012, 0.012, 3.5, black, 1.9, 2.35, 49.5, 8)).rotation.z = Math.PI / 2;
    for (const x of [0.36, 3.44]) { put(box(0.34, 2.28, 0.04, curtain, x, 1.2, 49.5)); for (let i = 0; i < 3; i++) put(box(0.02, 2.26, 0.02, curtain, x - 0.11 + i * 0.11, 1.2, 49.47, nc)); }
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
    [[47.9, 0.42, toys[2]], [48.45, 0.5, mustard], [49.0, 0.42, cream]].forEach(([z, s, c]) => {
      put(box(0.025, s, s, black, 0.112, 1.55, z)); put(box(0.012, s - 0.08, s - 0.08, c, 0.127, 1.55, z, nc));
    });
    put(box(1.1, 0.03, 0.2, woodLt, 2.1, 1.55, 46.48));
    for (let i = 0; i < 7; i++) put(box(0.03, 0.2 - (i % 3) * 0.02, 0.15, toys[i % 6], 1.7 + i * 0.045, 1.66 - (i % 3) * 0.01, 46.49));
    put(sph(0.07, std({ color: 0xb48a60, roughness: 1 }), 2.35, 1.64, 46.49));
    put(cyl(0.06, 0.05, 0.12, ceramic, 2.55, 1.63, 46.49, 12));
    for (let i = 0; i < 3; i++) put(sph(0.06, frond2, 2.55 + (i - 1) * 0.04, 1.74, 46.49));
  }

  // =====================================================================
  // BANHEIROS (padrão real, v3): builders com origem na face da parede, frente = +z
  // =====================================================================
  // Bancada de quartzo branco (tampo grosso de 12 cm) com cuba(s) de apoio retangular(es), torneira de parede
  // cromada, espelho com moldura de LED fria e "spots" lavando o mármore (planos de brilho da luz dos banheiros)
  const vanity = (len, depth, top, basins, mw, mh, my0) => {
    const g = G();
    g.add(box(len, 0.12, depth, quartzW, 0, top - 0.06, depth / 2));
    g.add(box(len, 0.18, 0.02, quartzW, 0, top + 0.09, 0.01));                  // espelho de bancada
    for (const bx of basins) {
      const bz = depth * 0.56;
      g.add(box(0.4, 0.13, 0.32, ceramic, bx, top + 0.065, bz));
      g.add(box(0.34, 0.006, 0.26, basinIn, bx, top + 0.128, bz, nc));
      const cn = cyl(0.028, 0.028, 0.012, M.chrome, bx, top + 0.3, 0.026, 12); cn.rotation.x = Math.PI / 2; g.add(cn);   // canopla
      const sp = cyl(0.013, 0.013, 0.2, M.chrome, bx, top + 0.3, 0.12, 8); sp.rotation.x = Math.PI / 2; g.add(sp);
      g.add(cyl(0.013, 0.01, 0.05, M.chrome, bx, top + 0.28, 0.215, 8));
      g.add(box(0.016, 0.07, 0.016, M.chrome, bx + 0.07, top + 0.33, 0.05));      // alavanca
      g.add(cyl(0.03, 0.03, 0.13, M.steel, bx + 0.26 * (bx <= 0 ? 1 : -1), top + 0.065, depth * 0.5, 10));   // saboneteira
    }
    // espelho retangular com moldura de LED embutida (4 filetes)
    const yc = my0 + mh / 2;
    g.add(box(mw, mh, 0.012, M.mirror, 0, yc, 0.008, nc));
    const e = 0.055, t = 0.022;
    g.add(box(mw - 2 * e, t, 0.004, ledCool, 0, my0 + e, 0.016, nc));
    g.add(box(mw - 2 * e, t, 0.004, ledCool, 0, my0 + mh - e, 0.016, nc));
    g.add(box(t, mh - 2 * e, 0.004, ledCool, -mw / 2 + e, yc, 0.016, nc));
    g.add(box(t, mh - 2 * e, 0.004, ledCool, mw / 2 - e, yc, 0.016, nc));
    // halo frio do espelho + "spots" do forro lavando a parede de mármore
    const hm = ctx.glowPlane(mw + 0.35, mh + 0.35, 'banheiros', { color: 0x9feeff, base: 0.3, day: 0.12, tex: 'frame' });
    hm.position.set(0, yc, 0.02); g.add(hm);
    const n = Math.max(1, Math.round(len / 0.75));
    for (let i = 0; i < n; i++) {
      const w = ctx.glowPlane(0.7, 0.9, 'banheiros', { color: 0xffe2bc, base: 0.28, day: 0.1 });
      w.position.set(-len / 2 + (len / n) * (i + 0.5), 2.5, 0.006); g.add(w);
    }
    return g;
  };
  // Lixeira inox com pedal
  const binSteel = (r = 0.13, h = 0.45) => {
    const g = G();
    g.add(cyl(r, r * 0.93, h, M.steel, 0, h / 2 + 0.02, 0, 18));
    g.add(cyl(r + 0.005, r + 0.005, 0.03, M.chrome, 0, h + 0.035, 0, 18));
    g.add(cyl(r * 0.95, r * 0.95, 0.02, black, 0, 0.01, 0, 18));
    g.add(box(0.1, 0.02, 0.07, black, 0, 0.03, r + 0.02));
    return g;
  };

  // =====================================================================
  // WC (x 0,087–1,825 · z 44,075–46,225) — porta na parede z = 46,3 (x 0,5–1,3)
  // =====================================================================
  {
    // revestimentos: bancada na parede x = 0 (mármore marrom em cima); marmorato nas outras
    wcWall('x', 0.087, 1, 44.212, 46.225, MARR);                                  // parede x = 0 (face 0,087)
    wcWall('z', 44.075, 1, 0.212, 1.825, MARM);                                   // parede z = 44,0
    wcWall('x', 1.825, -1, 44.087, 46.225, MARM);                                 // parede x = 1,9
    wcWall('z', 46.225, -1, 0.099, 1.813, MARM, 0.09, [[0.4, 1.4]]);              // parede da porta (z = 46,3)
    // pilar do canto (x 0–0,2 · z 43,8–44,2) encapado no mesmo padrão
    put(box(0.125, 1.11, 0.137, PORC, 0.1495, 0.645, 44.1435, nc));
    put(box(0.125, 1.79, 0.137, MARR, 0.1495, 2.095, 44.1435, nc));
    // bancada (x 0,099–0,599 · z 44,32–45,22), cuba de apoio e espelho de LED
    place(vanity(0.9, 0.5, 0.86, [0], 0.72, 0.86, 1.28), 0.099, 44.77, Math.PI / 2);
    place(ctx.F.toilet(), 1.38, 44.39, 0);
    // papeleira preta e ducha higiênica na parede x = 1,9; dispenser de papel-toalha e lixeira de pedal
    put(box(0.03, 0.1, 0.12, black, 1.8, 0.72, 44.72));
    put(cyl(0.055, 0.055, 0.1, paper, 1.735, 0.69, 44.72, 12)).rotation.x = Math.PI / 2;
    put(box(0.04, 0.08, 0.05, M.chrome, 1.79, 0.62, 44.3));
    put(box(0.1, 0.3, 0.26, whiteF, 0.155, 1.4, 45.52));
    put(box(0.004, 0.08, 0.16, M.screenOff, 0.207, 1.33, 45.52, nc));
    place(binSteel(0.12, 0.42), 1.62, 45.15);
    // vasinho com planta sobre a bancada
    put(cyl(0.045, 0.035, 0.09, ceramic, 0.22, 0.905, 45.12, 10));
    for (let i = 0; i < 3; i++) put(sph(0.045, frond2, 0.22 + (i - 1) * 0.025, 0.99 + (i % 2) * 0.02, 45.12));
  }

  // =====================================================================
  // WC PCD (x 1,975–3,925 · z 44,075–46,225) — porta na parede x = 4,0 (z 44,4–45,3)
  // =====================================================================
  {
    wcWall('z', 44.075, 1, 1.975, 3.925, MARR);                                   // parede da bancada (z = 44,0)
    wcWall('x', 1.975, 1, 44.087, 46.225, MARM);                                  // parede x = 1,9
    wcWall('z', 46.225, -1, 1.987, 3.913, MARM);                                  // parede z = 46,3 (atrás do vaso)
    wcWall('x', 3.925, -1, 44.087, 46.213, MARM, 0.09, [[44.3, 45.4]]);           // parede da porta (x = 4,0)
    place(ctx.F.toilet(), 2.45, 45.88, Math.PI);
    // barras de apoio: lateral (parede x = 1,9), de fundo (z = 46,3) e vertical
    const XW = 1.987, XS = XW + 0.05, ZW = 46.213, ZB = ZW - 0.05;
    put(bar(XS, 0.76, 45.2, XS, 0.76, 46.05, 0.017, grabBar));
    for (const z of [45.2, 46.05]) put(bar(XW, 0.76, z, XS, 0.76, z, 0.015, grabBar));
    put(bar(XS, 0.9, 45.1, XS, 1.6, 45.1, 0.017, grabBar));
    for (const y of [0.9, 1.6]) put(bar(XW, y, 45.1, XS, y, 45.1, 0.015, grabBar));
    put(bar(2.1, 0.9, ZB, 2.9, 0.9, ZB, 0.017, grabBar));
    for (const x of [2.1, 2.9]) put(bar(x, 0.9, ZW, x, 0.9, ZB, 0.015, grabBar));
    // bancada suspensa acessível (tampo a 0,80 m, sem gabinete) com cuba de apoio baixa e barras em U
    const LX = 2.5, ZF = 44.087;
    place(vanity(0.7, 0.46, 0.8, [0], 0.6, 0.9, 1.05), LX, ZF, 0);
    for (const sx of [-1, 1]) put(bar(LX + sx * 0.42, 0.76, ZF, LX + sx * 0.42, 0.76, ZF + 0.56, 0.016, grabBar));
    put(bar(LX - 0.42, 0.76, ZF + 0.56, LX + 0.42, 0.76, ZF + 0.56, 0.016, grabBar));
    // alarme de emergência (cordão), lixeira de pedal, papeleira e dispenser
    put(box(0.03, 0.1, 0.1, alarm, XW + 0.015, 0.45, 45.62));
    put(box(0.02, 0.4, 0.02, alarm, XW + 0.035, 0.22, 45.64));
    place(binSteel(0.12, 0.42), 3.62, 45.98);
    put(box(0.03, 0.12, 0.12, black, XW + 0.015, 0.95, 45.55));
    put(cyl(0.055, 0.055, 0.1, paper, XW + 0.08, 0.9, 45.55, 12)).rotation.x = Math.PI / 2;
    put(box(0.26, 0.3, 0.1, whiteF, 3.35, 1.4, ZF + 0.05));
    // símbolo de acessibilidade na parede da bancada
    put(box(0.2, 0.2, 0.006, std({ color: 0x1f5fae, roughness: 0.5 }), 3.35, 1.85, ZF + 0.003, nc));
  }
}

function roomAlaDireita(ctx) {
  // ---------------------------------------------------------------------------
  // ALA DIREITA (x 16,05–20,1 · z 11,0–49,5): corredor da entrada lateral,
  // circulação, sala de mídia, voluntariado, circ./depósito/área técnica,
  // WC masculino, hall dos banheiros e WC feminino.
  // REFERÊNCIA MÁXIMA = vídeos do cliente: v4 (mídia: placas acústicas grafite,
  // bancada preta no visor, road case turquesa, cadeiras azul/preto e plásticas),
  // v2 (voluntariado: cortina, sofás cinza, letreiro "FAÇAM TUDO…", poltronas
  // capitonê terracota, parede de marmorato com split, prateleiras, buffet
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
  const navyBand = std({ color: 0x0e2a4f, roughness: 0.85 });              // faixa azul-escura da entrada dos banheiros
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
  // Portas em x=17,1: Gilvan z 12,9–13,8 · Adm. z 14,4–15,3; porta PM01 em z=11.
  // =====================================================================
  add(box(0.8, 0.012, 0.62, std({ color: 0x1a1a1c, roughness: 0.92 }), 16.58, 0.008, 11.45, nc));   // capacho grafite com a marca
  { const m = ctx.logo.mesh(0.44, 0, { layout: 'mark', color: '#bdb6a8', roughness: 1, cast: false }); m.rotation.x = -HPI; m.position.set(16.58, 0.0155, 11.45); add(m); }
  // placa vermelha "SAÍDA DE EMERGÊNCIA" sobre a porta lateral (v5)
  const sosMat = texMat(1.45, (g, W, Hh) => {
    g.fillStyle = '#c21d1d'; g.fillRect(0, 0, W, Hh);
    g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.strokeRect(4, 4, W - 8, Hh - 8);
    g.fillStyle = '#ffffff'; g.fillRect(12, 12, W - 24, 34);
    text(g, 'SAÍDA', W / 2, 30, 26, '#c21d1d', '900');
    text(g, 'DE', W / 2, 60, 15, '#ffffff');
    text(g, 'EMERGÊNCIA', W / 2, 80, 15, '#ffffff');
  }, 0, 512);
  add(box(0.36, 0.25, 0.008, sosMat, 16.575, 2.5, 11.08, nc));
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
  // plásticas pretas na parede oposta; gabinete com impressora; split e câmera.
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
  // split branco no fundo e câmera de segurança no canto
  add(box(0.85, 0.28, 0.2, white, 17.55, 2.56, 27.785));
  add(box(0.8, 0.02, 0.004, graph, 17.55, 2.45, 27.683, nc));
  add(box(0.08, 0.06, 0.004, ledB, 17.2, 2.6, 27.683, nc));
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
  // parede x = 20,1 em marmorato (face da sala), com split no alto
  clad('z', 20.013, -1, 28.075, 33.825, 0.075, 2.985, M.marmorato);
  add(box(0.22, 0.3, 0.9, white, 19.89, 2.58, 29.5));
  add(box(0.004, 0.02, 0.85, graph, 19.778, 2.46, 29.5, nc));
  add(box(0.004, 0.05, 0.1, redCup, 19.778, 2.64, 29.15, nc));
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
  wetWall('z', 16.125, 1, 39.52, 41.9, M.marmorato);                                          // porta do templo em z 42,0–43,6
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
  // entrada dos banheiros pelo templo (porta preta x = 16,05 · z 42,0–43,6): faixa azul-escura e placa com pictograma
  {
    const xf = 15.975 - 0.006;
    add(box(0.012, 0.69, 2.02, navyBand, xf, 2.645, 42.8, nc));                                // verga
    add(box(0.012, 2.3, 0.18, navyBand, xf, 1.15, 41.9, nc));                                  // ombreiras
    add(box(0.012, 2.3, 0.18, navyBand, xf, 1.15, 43.7, nc));
    const pg = texMat(1.1, (g, W, Hh) => {
      g.fillStyle = '#1f5fae'; g.fillRect(0, 0, W, Hh);
      g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.strokeRect(4, 4, W - 8, Hh - 8);
      g.fillStyle = '#ffffff';
      for (const [cx, fem] of [[W * 0.32, false], [W * 0.68, true]]) {
        g.beginPath(); g.arc(cx, 20, 7, 0, PI * 2); g.fill();
        if (fem) { g.beginPath(); g.moveTo(cx, 29); g.lineTo(cx + 13, 60); g.lineTo(cx - 13, 60); g.closePath(); g.fill(); g.fillRect(cx - 6, 60, 4, 14); g.fillRect(cx + 2, 60, 4, 14); }
        else { g.fillRect(cx - 9, 29, 18, 28); g.fillRect(cx - 8, 56, 7, 18); g.fillRect(cx + 1, 56, 7, 18); }
      }
      text(g, 'TOILETTE', W / 2, 88, 12, '#ffffff');
    });
    add(box(0.01, 0.3, 0.33, pg, xf - 0.011, 2.66, 42.35, nc));
  }

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

function roomAdministrativo(ctx) {
  // ---------------------------------------------------------------------------
  // BLOCO ADMINISTRATIVO — fundos (z 0–9,25) e começo da ala direita (z 11,0–19,0)
  //  · Sala Pastoral (x 12,75–20,1 · z 0–9,25, em L): estação de café na parede z=0 com
  //    frigobar, mesa redonda de reunião (6 lugares), aparador, estar (tapete, sofá,
  //    2 poltronas, mesas de centro), 2 mesas de atendimento com estante alta na parede
  //    x=20,1, painel com cruz, quadros e plantas.
  //  · Banheiro pastoral (x 17,0–20,1 · z 3,1–4,9): bancada com cuba, vaso e box.
  //  · Caixa d'água (x 17,0–20,1 · z 0–3,1): 2 reservatórios de 1000 L sobre base,
  //    barrilete em PVC, motobomba e quadro elétrico.
  //  · Recepção (x 9,45–12,75 · z 5,9–9,25): parede ripada do piso ao teto com o LOGO
  //    oficial em letras caixa prateadas (ctx.logo.relief, retroiluminado com a luz
  //    'recepcao'), balcão ripado com a marca "B" e fita de LED, 3 poltronas, bebedouro.
  //  · Sala Gilvan (x 17,1–20,1 · z 11,0–14,2) e Administrativo (z 14,2–19,0): estações
  //    com monitores (papel de parede com o logo), prateleiras, mural, logo na parede.
  //  · Placas de porta (recepção / sala pastoral) na face externa da parede z = 9,25.
  // Logo: SEMPRE via ctx.logo (mesma função de desenho do cartão). Telas, abajures e
  // LEDs acompanham a luz do ambiente (ctx.bindEmissive).
  // Paleta: preto, madeira clara (ripado), branco e grafite, acentos âmbar/terracota.
  // Livres: giros das portas (recepção, pastoral, banheiro, Gilvan, Adm.), split da
  // pastoral (14,9; 2,4; 0,2) e as luminárias do cartão (y ≈ 2,7).
  // Faces internas: x 12,675/12,825 · 16,925/17,075 · 17,175 · 20,013 (muro revestido)
  // · z 0,087 · 3,025/3,175 · 4,825/4,975 · 5,975 · 9,175/9,325 · 11,075 · 14,125/14,275 · 18,925.
  // ---------------------------------------------------------------------------
  const THREE = ctx.THREE, M = ctx.M;
  const box = (...a) => ctx.box(...a), cyl = (...a) => ctx.cyl(...a), sph = (...a) => ctx.sph(...a);
  const std = (o) => ctx.std(o), rnd = () => ctx.rnd();
  const place = (g, x, z, ry = 0, y = 0) => ctx.place(g, x, z, ry, y);
  const put = (m) => { ctx.add(m); return m; };
  const G = () => new THREE.Group();
  const nc = { cast: false };
  const PI = Math.PI;
  // rotações: frente (+z local) virada para +z / +x / −x / −z
  const FZ = 0, FX = PI / 2, FNX = -PI / 2, FNZ = PI;

  // ---- materiais (mesmas opções → mesmo material → menos draw calls) ----------
  const woodL    = std({ color: 0xd2b08a, roughness: 0.65 });                    // madeira clara (tampos)
  const slat     = std({ color: 0xcfa97c, roughness: 0.7 });                     // ripado
  const ripaB    = std({ color: 0xd9b8a0, roughness: 0.68 });                    // ripado bege-rosado (igual ao da fachada)
  const blackM   = std({ color: 0x1b1b1d, roughness: 0.55 });                    // marcenaria preta
  const metalBk  = std({ color: 0x141416, roughness: 0.45, metalness: 0.45 });   // metal preto (pés, perfis)
  const whiteTop = std({ color: 0xf1efea, roughness: 0.4 });                     // tampo branco / quartzo
  const graph    = std({ color: 0x3a3b3f, roughness: 0.6, metalness: 0.2 });     // grafite
  const uphDark  = std({ color: 0x2c2d31, roughness: 0.95 });                    // estofado preto (cadeiras)
  const uphGray  = std({ color: 0x5b5e66, roughness: 0.97 });                    // estofado grafite
  const linen    = std({ color: 0xcdc6b8, roughness: 0.97 });                    // linho (sofá)
  const linenLt  = std({ color: 0xe2dccf, roughness: 0.97 });
  const caramel  = std({ color: 0x9a6a44, roughness: 0.8 });                     // couro caramelo
  const terra    = std({ color: 0xa65a3a, roughness: 0.95 });                    // terracota
  const amber    = std({ color: 0xc98a3c, roughness: 0.6, metalness: 0.15 });    // âmbar
  const sand     = std({ color: 0xe3d3b8, roughness: 0.95 });
  const potBlack = std({ color: 0x1c1c1e, roughness: 0.55 });
  const frond    = std({ color: 0x2f5a2a, roughness: 0.9 });
  const frond2   = std({ color: 0x3d6e34, roughness: 0.9 });
  const soil     = std({ color: 0x3d2b1c, roughness: 1 });
  const ceramic  = std({ color: 0xf4f4f2, roughness: 0.3 });
  const paper    = std({ color: 0xf6f3ec, roughness: 0.9 });
  const coffee   = std({ color: 0x3b2417, roughness: 0.35 });
  const glassTn  = std({ color: 0xd8e4ea, roughness: 0.1, transparent: true, opacity: 0.45 });
  const rugEdge  = std({ color: 0x6f6456, roughness: 1 });
  const rugField = std({ color: 0xc9bca6, roughness: 1 });
  const rugLine  = std({ color: 0xa78f70, roughness: 1 });
  const tileW    = std({ color: 0xe6e7e4, roughness: 0.35 });                    // revestimento do banheiro
  const tankBlue = std({ color: 0x2d6fb3, roughness: 0.55 });                    // reservatório de polietileno
  const tankLid  = std({ color: 0x255f9c, roughness: 0.5 });
  const pvc      = std({ color: 0xf0f0ee, roughness: 0.5 });                     // tubo PVC branco
  const pvcBrown = std({ color: 0x8b5a2b, roughness: 0.6 });                     // tubo soldável marrom
  const pumpBlue = std({ color: 0x3b6fa8, roughness: 0.45, metalness: 0.3 });
  const panelGr  = std({ color: 0xb8bcc0, roughness: 0.5, metalness: 0.3 });
  const waterJug = std({ color: 0x7fb2dc, roughness: 0.1, transparent: true, opacity: 0.6 });
  const book = [0x8b2f2f, 0x2f4f6b, 0x3f6d3a, 0xc9a24a, 0x6b4a2f, 0xe6dfd3, 0x1f1f22, 0xa65a3a].map((c) => std({ color: c, roughness: 0.9 }));
  const cork     = std({ color: 0xb68c5c, roughness: 1 });
  const spruce   = std({ color: 0xe2c28e, roughness: 0.45 });                    // tampo do violão
  const rosewood = std({ color: 0x5a3320, roughness: 0.5 });                     // laterais/braço
  const hoseGr   = std({ color: 0x2f7a3a, roughness: 0.6 });                     // mangueira
  const steelBr  = std({ color: 0xb9bcc0, roughness: 0.3, metalness: 0.8 });     // inox escovado

  // ---- emissivos ligados às luzes dos ambientes (1 material por entidade → 1 draw call) ----
  // Abajures / luminárias de mesa: cúpula de linho que acende com a luz do ambiente.
  const shade = (key) => ctx.bindEmissive(key, new THREE.MeshStandardMaterial({ color: 0xe8e1d2, roughness: 0.9,
    emissive: 0xffd9a8, emissiveIntensity: 0, side: THREE.DoubleSide }), 0.85, { min: 0 });
  const shadePast = shade('pastoral'), shadeAdm = shade('administrativo');
  // Fita de LED (luz quente) — sancas e balcão
  const led = (key, max = 1.4) => ctx.bindEmissive(key, new THREE.MeshStandardMaterial({ color: 0xfff1dc, roughness: 0.5,
    emissive: 0xffe2b8, emissiveIntensity: 0 }), max, { min: 0 });
  const ledRec = led('recepcao'), ledPast = led('pastoral', 1.1);
  // Papel de parede dos monitores: degradê grafite/roxo (Base Music) com o logo oficial.
  // A tela é 16:9 e a textura é quadrada: desenha com escala horizontal = altura/largura.
  const SCR_A = 0.56;
  const wallTex = ctx.makeTex(512, (g, s) => {
    const gr = g.createLinearGradient(0, 0, s, s);
    gr.addColorStop(0, '#221d2e'); gr.addColorStop(0.55, '#35295a'); gr.addColorStop(1, '#141219');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
    g.save(); g.scale(SCR_A, 1);
    const W = s / SCR_A, lw = s * 0.34;
    g.globalAlpha = 0.08; g.fillStyle = '#b88cff';
    for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(W * (0.1 + i * 0.2), 0); g.lineTo(W * (0.18 + i * 0.2), 0); g.lineTo(W * (0.02 + i * 0.22), s); g.lineTo(W * (-0.06 + i * 0.22), s); g.fill(); }
    g.globalAlpha = 1;
    ctx.logo.draw(g, W / 2 - lw / 2, s * 0.2, lw, { layout: 'full', color: '#f4f5f7' });
    g.fillStyle = 'rgba(8,8,10,0.85)'; g.fillRect(0, s * 0.93, W, s * 0.07);                   // barra de tarefas
    g.fillStyle = '#c9c4d6'; for (let i = 0; i < 6; i++) g.fillRect(W / 2 - 0.2 * s + i * 0.075 * s, s * 0.947, 0.04 * s, 0.035 * s);
    g.restore();
  });
  wallTex.wrapS = wallTex.wrapT = THREE.ClampToEdgeWrapping;
  const screen = (key) => ctx.bindEmissive(key, new THREE.MeshStandardMaterial({ color: 0xffffff, map: wallTex, roughness: 0.22,
    emissive: 0xffffff, emissiveMap: wallTex, emissiveIntensity: 0.1 }), 0.95, { min: 0.1 });
  const scrPast = screen('pastoral'), scrRec = screen('recepcao'), scrAdm = screen('administrativo');

  // ---- utilidades ------------------------------------------------------------
  // tubo reto alinhado a um eixo, de a até b ([x, y, z])
  const pipe = (a, b, r = 0.025, mat = pvc) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz);
    const m = cyl(r, r, L, mat, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, 10);
    if (Math.abs(dx) > 1e-6) m.rotation.z = PI / 2; else if (Math.abs(dz) > 1e-6) m.rotation.x = PI / 2;
    return put(m);
  };

  // ======================= BUILDERS (origem no centro da base; frente = +z) =======================
  // Aparador: rodapé recuado, corpo preto, portas de madeira clara, puxadores pretos e tampo
  const credenza = (w, d, h, doors, top = woodL, body = blackM, front = woodL) => {
    const g = G();
    g.add(box(w - 0.08, 0.08, d - 0.08, metalBk, 0, 0.04, -0.01));
    g.add(box(w, h - 0.11, d, body, 0, 0.08 + (h - 0.11) / 2, 0));
    g.add(box(w + 0.02, 0.03, d + 0.02, top, 0, h - 0.015, 0));
    const dw = (w - 0.04) / doors;
    for (let i = 0; i < doors; i++) {
      const cx = -w / 2 + 0.02 + dw * (i + 0.5);
      g.add(box(dw - 0.012, h - 0.17, 0.018, front, cx, 0.08 + (h - 0.11) / 2, d / 2 + 0.009));
      g.add(box(0.012, 0.16, 0.02, metalBk, cx + (i % 2 ? -1 : 1) * (dw / 2 - 0.06), 0.08 + (h - 0.11) * 0.62, d / 2 + 0.028));
    }
    return g;
  };
  // Cadeira de reunião / visita: concha estofada e pés pretos finos levemente abertos
  const shellChair = (fab) => {
    const g = G();
    g.add(box(0.44, 0.06, 0.44, fab, 0, 0.46, 0.01));
    const back = box(0.44, 0.38, 0.05, fab, 0, 0.73, -0.2); back.rotation.x = -0.12; g.add(back);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const l = cyl(0.012, 0.009, 0.45, metalBk, sx * 0.18, 0.215, sz * 0.17, 6);
      l.rotation.z = sx * 0.06; l.rotation.x = -sz * 0.06; g.add(l);
    }
    return g;
  };
  // Cadeira giratória de escritório (base estrela de 5 pés)
  const officeChair = (fab = uphDark) => {
    const g = G();
    g.add(box(0.5, 0.08, 0.48, fab, 0, 0.49, 0.02));
    const back = box(0.46, 0.56, 0.06, fab, 0, 0.87, -0.23); back.rotation.x = -0.08; g.add(back);
    g.add(box(0.06, 0.22, 0.03, metalBk, 0, 0.58, -0.23));
    for (const sx of [-1, 1]) g.add(box(0.04, 0.2, 0.3, metalBk, sx * 0.25, 0.6, -0.02));                      // braços (lâmina)
    g.add(cyl(0.025, 0.025, 0.36, M.chrome, 0, 0.27, 0, 8));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * PI * 2;
      const sp = box(0.3, 0.035, 0.05, metalBk, Math.cos(a) * 0.15, 0.05, Math.sin(a) * 0.15); sp.rotation.y = -a; g.add(sp);
    }
    return g;
  };
  // Poltrona: base + almofada + encosto + braços, pés de madeira
  const armchair = (fab, cushion = fab, w = 0.74, d = 0.76, feet = woodL) => {
    const g = G();
    g.add(box(w, 0.22, d, fab, 0, 0.27, 0));
    g.add(box(w - 0.2, 0.1, d - 0.2, cushion, 0, 0.43, 0.07));
    const back = box(w - 0.02, 0.44, 0.16, fab, 0, 0.6, -d / 2 + 0.09); back.rotation.x = -0.08; g.add(back);
    for (const sx of [-1, 1]) g.add(box(0.1, 0.25, d - 0.12, fab, sx * (w / 2 - 0.05), 0.5, 0.06));
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(cyl(0.022, 0.016, 0.16, feet, sx * (w / 2 - 0.07), 0.08, sz * (d / 2 - 0.07), 8));
    return g;
  };
  // Sofá de 3 lugares com almofadas de acento
  const sofa3 = (w, d, fab, seat) => {
    const g = G();
    g.add(box(w, 0.24, d, fab, 0, 0.26, 0));
    const back = box(w, 0.46, 0.2, fab, 0, 0.6, -d / 2 + 0.1); back.rotation.x = -0.06; g.add(back);
    for (const sx of [-1, 1]) g.add(box(0.16, 0.3, d, fab, sx * (w / 2 - 0.08), 0.53, 0));
    const n = 3, cw = (w - 0.32) / n;
    for (let i = 0; i < n; i++) g.add(box(cw - 0.03, 0.12, d - 0.26, seat, -w / 2 + 0.16 + cw * (i + 0.5), 0.44, 0.1));
    const p1 = box(0.42, 0.36, 0.12, terra, -w / 2 + 0.42, 0.66, -d / 2 + 0.3); p1.rotation.set(-0.25, 0.2, 0); g.add(p1);
    const p2 = box(0.4, 0.34, 0.12, amber, w / 2 - 0.42, 0.66, -d / 2 + 0.3); p2.rotation.set(-0.25, -0.2, 0); g.add(p2);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.05, 0.14, 0.05, metalBk, sx * (w / 2 - 0.08), 0.07, sz * (d / 2 - 0.08)));
    return g;
  };
  // Monitor em pedestal (frente +z)
  const monitor = (w = 0.6, scr = null) => {
    const g = G();
    g.add(box(0.22, 0.012, 0.16, metalBk, 0, 0.006, 0));
    g.add(box(0.04, 0.3, 0.025, metalBk, 0, 0.16, -0.04));
    g.add(box(w, w * 0.58, 0.028, metalBk, 0, 0.3, -0.02));
    if (scr) {                                                                   // tela com o papel de parede do logo
      const p = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.024, w * 0.58 - 0.024), scr);
      p.position.set(0, 0.3, -0.0055); p.castShadow = false; g.add(p);
    } else g.add(box(w - 0.03, w * 0.58 - 0.03, 0.006, M.screenOff, 0, 0.3, -0.004, nc));
    return g;
  };
  // Luminária de mesa articulada (base, 2 hastes, cúpula que acende com a luz do ambiente)
  const deskLamp = (sh) => {
    const g = G();
    g.add(cyl(0.07, 0.075, 0.02, metalBk, 0, 0.01, 0, 14));
    const a1 = box(0.014, 0.36, 0.014, metalBk, 0, 0.19, 0.04); a1.rotation.x = 0.25; g.add(a1);
    const a2 = box(0.014, 0.3, 0.014, metalBk, 0, 0.4, 0.17); a2.rotation.x = 1.1; g.add(a2);
    const c = cyl(0.035, 0.075, 0.1, sh, 0, 0.47, 0.3, 14, true); c.rotation.x = 0.35; g.add(c);
    return g;
  };
  // Mesa de trabalho (frente +z = quem senta): tampo claro, laterais pretas, gaveteiro branco
  const workDesk = (w, d, pc = true, seed = 1, scr = null, lampSh = null) => {
    const g = G();
    g.add(box(w, 0.03, d, woodL, 0, 0.745, 0));
    for (const sx of [-1, 1]) g.add(box(0.04, 0.73, d - 0.04, metalBk, sx * (w / 2 - 0.04), 0.365, 0));
    g.add(box(w - 0.12, 0.34, 0.02, blackM, 0, 0.52, -d / 2 + 0.05));
    g.add(box(0.4, 0.56, d - 0.2, whiteTop, w / 2 - 0.3, 0.29, 0.03));
    for (let i = 0; i < 2; i++) g.add(box(0.2, 0.012, 0.012, metalBk, w / 2 - 0.3, 0.2 + i * 0.24, d / 2 - 0.06));
    if (lampSh) { const lp = deskLamp(lampSh); lp.position.set(-w / 2 + 0.14, 0.76, -d / 2 + 0.1); lp.rotation.y = 0.5; g.add(lp); }
    if (pc) {
      const mon = monitor(0.58, scr); mon.position.set(-0.05, 0.76, -d / 2 + 0.16); g.add(mon);
      g.add(box(0.42, 0.018, 0.14, graph, -0.05, 0.769, 0.06));
      const mouse = sph(0.03, metalBk, 0.28, 0.772, 0.07); mouse.scale.set(1, 0.55, 1.4); g.add(mouse);
      g.add(box(0.21, 0.012, 0.297, paper, -w / 2 + 0.25, 0.766, 0.02));
      g.add(cyl(0.04, 0.035, 0.09, seed % 2 ? ceramic : terra, w / 2 - 0.18, 0.805, -0.08, 12));
    } else {
      g.add(box(0.33, 0.018, 0.23, graph, 0, 0.769, 0.05));                      // notebook fechado
      g.add(box(0.21, 0.012, 0.297, paper, -w / 2 + 0.3, 0.766, 0.0));
    }
    return g;
  };
  // Mesa redonda (tampo claro, coluna e base pretas)
  const roundTable = (r, h = 0.75) => {
    const g = G();
    g.add(cyl(r, r, 0.035, woodL, 0, h - 0.0175, 0, 40));
    g.add(cyl(0.05, 0.05, h - 0.06, metalBk, 0, (h - 0.06) / 2 + 0.02, 0, 12));
    g.add(cyl(r * 0.45, r * 0.5, 0.03, metalBk, 0, 0.015, 0, 24));
    return g;
  };
  // Cica / planta tropical em vaso preto (upright = folhas mais em pé, para cantos)
  const plant = (potH = 0.45, span = 0.55, seed = 1, potR = 0.19, upright = false) => {
    const g = G(); let k = seed * 7.13;
    const r2 = () => { k = (k * 9301 + 49297) % 233280; return k / 233280; };
    g.add(cyl(potR, potR * 0.78, potH, potBlack, 0, potH / 2, 0, 16));
    g.add(cyl(potR - 0.015, potR - 0.015, 0.02, soil, 0, potH - 0.015, 0, 14));
    const n = 9;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * PI * 2 + r2() * 0.35, len = span * (0.75 + r2() * 0.4), tilt = upright ? 0.95 + r2() * 0.45 : 0.5 + r2() * 0.6;
      const pv = G(); pv.position.set(0, potH, 0); pv.rotation.y = a;
      const f = box(0.1, 0.012, len, i % 2 ? frond : frond2, 0, Math.sin(tilt) * len / 2, Math.cos(tilt) * len / 2);
      f.rotation.x = -tilt; pv.add(f); g.add(pv);
    }
    return g;
  };
  // Quadro emoldurado (moldura preta, passe-partout, arte abstrata em 2 blocos) — frente +z
  const frame = (w, h, a, b) => {
    const g = G();
    g.add(box(w, h, 0.03, metalBk, 0, 0, 0, nc));
    g.add(box(w - 0.05, h - 0.05, 0.006, paper, 0, 0, 0.016, nc));
    g.add(box((w - 0.16) * 0.6, h - 0.16, 0.006, a, -(w - 0.16) * 0.2, 0, 0.02, nc));
    g.add(box((w - 0.16) * 0.4, (h - 0.16) * 0.55, 0.006, b, (w - 0.16) * 0.3, -(h - 0.16) * 0.225, 0.02, nc));
    return g;
  };
  // Pilha de livros deitados / fileira de livros em pé
  const books = (g, x, y, z, width, seed, depth = 0.22, maxH = 0.26) => {
    let k = seed * 3.7; const r2 = () => { k = (k * 9301 + 49297) % 233280; return k / 233280; };
    let px = x - width / 2;
    while (px < x + width / 2 - 0.03) {
      const bw = 0.04 + r2() * 0.04, bh = maxH * (0.62 + r2() * 0.38);
      g.add(box(bw, bh, depth * (0.8 + r2() * 0.2), book[Math.floor(r2() * book.length)], px + bw / 2, y + bh / 2, z));
      px += bw + 0.004;
    }
  };
  // Estação de café: cafeteira, 2 garrafas térmicas, bandeja com xícaras e açucareiro
  const coffeeSet = (g, x, y, z) => {
    g.add(box(0.26, 0.36, 0.3, metalBk, x, y + 0.18, z - 0.02));
    g.add(cyl(0.065, 0.07, 0.15, glassTn, x, y + 0.085, z + 0.08, 14));
    g.add(cyl(0.06, 0.065, 0.06, coffee, x, y + 0.04, z + 0.08, 14));
    for (let i = 0; i < 2; i++) {
      g.add(cyl(0.055, 0.06, 0.28, i ? M.steel : metalBk, x + 0.28 + i * 0.14, y + 0.14, z - 0.04, 14));
      g.add(cyl(0.035, 0.045, 0.05, metalBk, x + 0.28 + i * 0.14, y + 0.305, z - 0.04, 12));
    }
    g.add(box(0.44, 0.015, 0.26, woodL, x + 0.72, y + 0.0075, z + 0.02));
    for (let i = 0; i < 4; i++) g.add(cyl(0.035, 0.03, 0.07, ceramic, x + 0.58 + (i % 2) * 0.12 + Math.floor(i / 2) * 0.16, y + 0.05, z - 0.03 + (i % 2) * 0.1, 12));
  };
  // Tapete em 3 camadas (borda escura, faixa, campo) — pisos em y 0,004
  const rug = (x, z, w, d) => {
    put(box(w, 0.008, d, rugEdge, x, 0.009, z, nc));
    put(box(w - 0.14, 0.008, d - 0.14, rugLine, x, 0.011, z, nc));
    put(box(w - 0.26, 0.008, d - 0.26, rugField, x, 0.013, z, nc));
    for (const t of [-1, 1]) put(box(w - 0.6, 0.004, 0.035, rugLine, x, 0.018, z + t * (d / 2 - 0.45), nc));
  };

  // =====================================================================
  // SALA PASTORAL
  // =====================================================================
  // ---- frigobar preto (canto x=12,75 / z=0) ----
  {
    const g = G();
    g.add(box(0.48, 0.84, 0.5, metalBk, 0, 0.44, 0));
    g.add(box(0.46, 0.012, 0.01, graph, 0, 0.62, 0.252, nc));
    g.add(box(0.02, 0.22, 0.03, M.chrome, 0.19, 0.5, 0.265));
    g.add(cyl(0.035, 0.03, 0.1, ceramic, -0.08, 0.91, -0.05, 12));             // caneca
    g.add(box(0.2, 0.02, 0.14, woodL, 0.08, 0.87, 0.0));                        // porta-copos
    place(g, 13.13, 0.4);
  }
  // ---- aparador para café na parede z=0 (x 13,5–16,0) + itens ----
  {
    const g = credenza(2.5, 0.46, 0.86, 4);
    coffeeSet(g, -0.9, 0.86, 0);
    g.add(cyl(0.09, 0.07, 0.22, ceramic, 0.95, 0.97, -0.05, 14));              // vaso branco
    for (let i = 0; i < 3; i++) { const a = i * 2.1; const st = box(0.012, 0.36, 0.012, frond, 0.95 + Math.cos(a) * 0.03, 1.22, -0.05 + Math.sin(a) * 0.03); st.rotation.set(Math.sin(a) * 0.25, 0, Math.cos(a) * 0.25); g.add(st); }
    g.add(box(0.3, 0.05, 0.22, amber, 0.35, 0.885, 0.0));                       // caixa de biscoitos
    place(g, 14.75, 0.34, FZ);
    // quadros na parede do café (fora do split x 14,45–15,35)
    const q1 = frame(0.5, 0.66, terra, sand); place(q1, 13.95, 0.105, FZ, 1.68);
    const q2 = frame(0.5, 0.66, uphGray, amber); place(q2, 15.9, 0.105, FZ, 1.68);
  }
  // ---- mesa redonda de reunião (centro 14,9; 2,1) com 6 cadeiras ----
  {
    place(roundTable(0.75), 14.9, 2.1);
    for (let i = 0; i < 6; i++) {
      const a = PI / 6 + (i * PI) / 3, r = 1.0;
      place(shellChair(uphGray), 14.9 + Math.sin(a) * r, 2.1 + Math.cos(a) * r, a + PI);
    }
    // centro de mesa: bíblia aberta, caderno e vaso baixo
    put(box(0.3, 0.035, 0.22, blackM, 14.72, 0.77, 2.02));
    put(box(0.28, 0.01, 0.2, paper, 14.72, 0.792, 2.02, nc));
    put(box(0.21, 0.012, 0.29, paper, 15.3, 0.758, 2.35));
    put(cyl(0.1, 0.08, 0.12, terra, 15.05, 0.81, 1.85, 14));
    put(sph(0.09, frond2, 15.05, 0.92, 1.85));
  }
  // ---- painel com cruz na parede x=12,75 (de frente para a mesa) ----
  {
    const g = G();
    g.add(box(1.0, 1.7, 0.03, blackM, 0, 0, 0, nc));
    for (let i = 0; i < 9; i++) g.add(box(0.05, 1.62, 0.02, slat, -0.44 + i * 0.11, 0, 0.025, nc));
    g.add(box(0.1, 1.15, 0.05, whiteTop, 0, 0.02, 0.06));
    g.add(box(0.62, 0.1, 0.05, whiteTop, 0, 0.22, 0.06));
    place(g, 12.84, 2.1, FX, 1.55);
  }
  // ---- aparador de apoio (z ≈ 4,2), aberto, atrás do sofá ----
  {
    const g = G();
    g.add(box(2.3, 0.035, 0.4, woodL, 0, 0.765, 0));
    g.add(box(2.2, 0.025, 0.34, woodL, 0, 0.2, 0));
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.035, 0.75, 0.035, metalBk, sx * 1.1, 0.375, sz * 0.17));
    for (const sx of [-1, 1]) g.add(box(0.035, 0.035, 0.34, metalBk, sx * 1.1, 0.19, 0));
    // em cima: luminária de mesa, livros deitados, vaso âmbar; embaixo: cestos
    g.add(cyl(0.07, 0.08, 0.03, metalBk, -0.85, 0.797, 0, 14));
    g.add(cyl(0.012, 0.012, 0.36, metalBk, -0.85, 0.99, 0, 6));
    g.add(cyl(0.09, 0.14, 0.18, shadePast, -0.85, 1.2, 0, 16, true));
    g.add(box(0.3, 0.04, 0.22, terra, 0.1, 0.803, 0.02)); g.add(box(0.26, 0.04, 0.2, sand, 0.1, 0.843, 0.02)); g.add(box(0.24, 0.035, 0.19, blackM, 0.1, 0.88, 0.02));
    g.add(cyl(0.07, 0.1, 0.28, amber, 0.7, 0.92, 0, 14));
    for (const sx of [-0.6, 0.45]) g.add(box(0.36, 0.22, 0.28, caramel, sx, 0.325, 0));
    place(g, 14.6, 4.2, FNZ);
  }
  // ---- estar: tapete, sofá, 2 poltronas, mesas de centro e mesa lateral ----
  rug(14.45, 6.3, 2.5, 3.0);
  place(sofa3(2.05, 0.9, linen, linenLt), 14.6, 5.02, FZ);
  place(armchair(caramel, caramel), 14.1, 7.28, FNZ);
  place(armchair(caramel, caramel), 15.1, 7.28, FNZ);
  {
    place(roundTable(0.36, 0.4), 14.35, 6.3);
    place(roundTable(0.25, 0.33), 15.0, 6.2);
    put(box(0.26, 0.04, 0.2, blackM, 14.3, 0.42, 6.3));                          // livro
    put(cyl(0.05, 0.045, 0.14, ceramic, 14.5, 0.47, 6.18, 12));
    put(sph(0.06, frond, 14.5, 0.56, 6.18));
    put(cyl(0.12, 0.11, 0.02, woodL, 15.0, 0.34, 6.2, 16));                     // bandeja
  }
  {
    const g = roundTable(0.21, 0.55);                                            // mesa lateral + abajur
    g.add(cyl(0.07, 0.09, 0.03, metalBk, 0, 0.565, 0, 12));
    g.add(cyl(0.012, 0.012, 0.3, metalBk, 0, 0.72, 0, 6));
    g.add(cyl(0.1, 0.15, 0.2, shadePast, 0, 0.94, 0, 16, true));
    place(g, 13.2, 5.05);
  }
  place(plant(0.5, 0.5, 3), 13.35, 3.5);
  place(plant(0.42, 0.55, 5, 0.18, true), 16.52, 0.52);
  // ---- 2 mesas de atendimento (lado direito) + cadeiras de visita ----
  for (const [zc, s] of [[6.0, 1], [8.2, 2]]) {
    place(workDesk(1.5, 0.72, true, s, scrPast, shadePast), 17.85, zc, FX);
    place(officeChair(), 18.66, zc, FNX);
    place(shellChair(uphGray), 16.98, zc - 0.3, FX);
    place(shellChair(uphGray), 16.98, zc + 0.3, FX);
  }
  // ---- estante alta na parede x=20,1 (z 5,0–9,0): 2 módulos pretos, fundo ripado ----
  {
    const g = G(); const L = 4.0, h = 2.2, d = 0.36;
    g.add(box(L, h, 0.02, slat, 0, h / 2, -d / 2 + 0.01));
    for (const sx of [-1, 0, 1]) g.add(box(0.035, h, d, blackM, sx * (L / 2 - 0.0175), h / 2, 0));
    const lv = [0.06, 0.62, 1.02, 1.42, 1.82, h - 0.015];
    for (const y of lv) g.add(box(L, 0.03, d, blackM, 0, y, 0));
    for (let i = 0; i < 4; i++) {                                                // portas de baixo
      const cx = -L / 2 + 0.035 + (i + 0.5) * ((L - 0.07) / 4);
      g.add(box((L - 0.1) / 4 - 0.02, 0.52, 0.018, woodL, cx, 0.34, d / 2 - 0.005));
      g.add(box(0.14, 0.012, 0.02, metalBk, cx, 0.54, d / 2 + 0.012));
    }
    // nichos: livros, caixas, vasos e porta-retratos
    const cells = [];
    for (let m = 0; m < 2; m++) for (let r = 1; r < 5; r++) cells.push([m, r]);
    cells.forEach(([m, r], i) => {
      const x0 = -L / 2 + m * (L / 2) + 0.05, y = lv[r] + 0.015, cw = L / 2 - 0.1;
      const t = (i * 5 + m) % 4;
      if (t === 0 || t === 2) { books(g, x0 + 0.4, y, 0.0, 0.6, i + 11); if (t === 0) g.add(cyl(0.07, 0.06, 0.2, ceramic, x0 + 1.35, y + 0.1, 0.0, 12)); else { g.add(box(0.3, 0.2, 0.26, caramel, x0 + 1.25, y + 0.1, 0)); g.add(box(0.3, 0.2, 0.26, sand, x0 + 1.6, y + 0.1, 0)); } }
      else if (t === 1) { books(g, x0 + cw - 0.35, y, 0.0, 0.45, i + 21); const pf = frame(0.22, 0.28, terra, sand); pf.position.set(x0 + 0.35, y + 0.14, -0.06); pf.rotation.x = -0.1; g.add(pf); }
      else { g.add(cyl(0.09, 0.07, 0.26, amber, x0 + 0.4, y + 0.13, 0, 14)); g.add(box(0.28, 0.05, 0.22, book[0], x0 + 1.0, y + 0.025, 0)); g.add(box(0.26, 0.05, 0.2, book[3], x0 + 1.0, y + 0.075, 0)); books(g, x0 + 1.55, y, 0, 0.3, i + 31); }
    });
    place(g, 19.8, 7.0, FNX);
  }
  // quadro com o LOGO sobre o estar, na parede x=12,75: tela preta, moldura de madeira clara
  // (filete) e o logo oficial em champanhe, com uma arandela de LED acima
  {
    const g = G();
    g.add(box(0.74, 0.96, 0.035, woodL, 0, 0, 0, nc));
    g.add(box(0.7, 0.92, 0.04, blackM, 0, 0, 0.004, nc));
    place(g, 12.845, 6.4, FX, 1.62);
    const lg = ctx.logo.mesh(0.44, 0, { layout: 'full', color: '#dcc49a', roughness: 0.35, metalness: 0.5 });
    lg.rotation.y = FX; lg.position.set(12.871, 1.63, 6.4); put(lg);
    // arandela linear (preta) com fita de LED voltada para o quadro
    put(box(0.07, 0.035, 0.6, metalBk, 12.87, 2.2, 6.4));
    put(box(0.02, 0.006, 0.54, ledPast, 12.89, 2.18, 6.4, nc));
  }
  // persiana rolô de linho na parede de vidro (x 14,2–16,6), meio abaixada
  {
    put(box(2.56, 0.1, 0.09, blackM, 15.4, 2.33, 9.12));                          // caixa (bandô)
    put(box(2.46, 0.52, 0.008, linenLt, 15.4, 2.02, 9.1, nc));                    // tecido
    put(box(2.46, 0.03, 0.02, metalBk, 15.4, 1.75, 9.1, nc));                     // barra de peso
    put(cyl(0.004, 0.004, 0.7, metalBk, 16.52, 1.9, 9.08, 4));                    // corrente
  }
  // violão no suporte (canto entre o aparador e a porta do banheiro) — ministério Base Music
  {
    const g = G();
    // suporte em A preto
    for (const sx of [-1, 1]) { const l = box(0.02, 0.5, 0.02, metalBk, sx * 0.14, 0.24, 0.05); l.rotation.z = sx * 0.2; g.add(l); }
    g.add(box(0.3, 0.02, 0.05, metalBk, 0, 0.2, 0.12));
    g.add(box(0.02, 0.62, 0.02, metalBk, 0, 0.31, -0.1));
    const v = G(); v.position.set(0, 0.2, 0.08); v.rotation.x = -0.24;         // violão inclinado para trás
    const lower = cyl(0.18, 0.18, 0.1, rosewood, 0, 0.19, 0, 24); lower.rotation.x = PI / 2; v.add(lower);
    const upper = cyl(0.135, 0.135, 0.1, rosewood, 0, 0.42, 0, 24); upper.rotation.x = PI / 2; v.add(upper);
    const top1 = cyl(0.175, 0.175, 0.006, spruce, 0, 0.19, 0.051, 24); top1.rotation.x = PI / 2; v.add(top1);
    const top2 = cyl(0.13, 0.13, 0.006, spruce, 0, 0.42, 0.051, 24); top2.rotation.x = PI / 2; v.add(top2);
    const hole = cyl(0.048, 0.048, 0.004, blackM, 0, 0.33, 0.055, 18); hole.rotation.x = PI / 2; v.add(hole);
    v.add(box(0.1, 0.02, 0.012, rosewood, 0, 0.12, 0.057));                     // cavalete
    v.add(box(0.05, 0.42, 0.03, rosewood, 0, 0.72, 0.02));                       // braço
    v.add(box(0.052, 0.4, 0.006, blackM, 0, 0.72, 0.037));                     // escala
    v.add(box(0.08, 0.16, 0.025, rosewood, 0, 1.0, 0.012));                    // mão
    for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) { const t = cyl(0.008, 0.008, 0.03, M.chrome, sx * 0.05, 0.95 + i * 0.045, 0.012, 6); t.rotation.z = PI / 2; v.add(t); }
    g.add(v);
    place(g, 16.4, 4.72, FNX + 0.35);
  }

  // =====================================================================
  // BANHEIRO PASTORAL (x 17,0–20,1 · z 3,1–4,9) — porta em x=17 (z 3,4–4,2)
  // =====================================================================
  {
    put(box(1.85, 1.2, 0.012, tileW, 18.12, 0.6, 4.818, nc));                   // revestimento atrás da pia/vaso
    // bancada suspensa preta com cuba branca, espelho redondo
    const g = G();
    g.add(box(0.6, 0.36, 0.44, blackM, 0, 0.66, 0));
    g.add(box(0.62, 0.03, 0.46, whiteTop, 0, 0.855, 0));
    g.add(cyl(0.17, 0.14, 0.1, ceramic, 0, 0.92, 0.03, 18));
    g.add(cyl(0.012, 0.012, 0.2, metalBk, 0, 0.97, -0.16, 8));
    g.add(box(0.02, 0.02, 0.12, metalBk, 0, 1.07, -0.11));
    const mir = cyl(0.26, 0.26, 0.02, M.mirror, 0, 1.55, -0.21, 28); mir.rotation.x = PI / 2; g.add(mir);
    const rim = cyl(0.275, 0.275, 0.015, metalBk, 0, 1.55, -0.222, 28); rim.rotation.x = PI / 2; g.add(rim);
    place(g, 17.52, 4.58, FNZ);
    // vaso sanitário contra a parede z=4,9
    place(ctx.F.toilet(), 18.38, 4.5, FNZ);
    put(box(0.04, 0.12, 0.1, metalBk, 18.78, 0.7, 4.77));                        // papeleira
    put(cyl(0.055, 0.055, 0.1, paper, 18.78, 0.66, 4.72, 12)).rotation.z = PI / 2;
    // box de vidro com perfil preto (x 19,1–20,0)
    put(box(0.9, 0.05, 1.5, whiteTop, 19.55, 0.025, 4.0));
    put(box(0.012, 1.95, 0.75, M.glass, 19.08, 1.03, 3.6, { cast: false, receive: false }));
    put(box(0.012, 1.95, 0.72, M.glass, 19.1, 1.03, 4.4, { cast: false, receive: false }));
    put(box(0.03, 0.03, 1.5, metalBk, 19.09, 2.02, 4.0));
    put(box(0.03, 1.98, 0.03, metalBk, 19.09, 1.0, 3.24));
    put(cyl(0.012, 0.012, 1.0, metalBk, 19.94, 1.55, 4.3, 8));
    put(box(0.3, 0.02, 0.03, metalBk, 19.82, 2.05, 4.3));
    put(cyl(0.1, 0.1, 0.015, metalBk, 19.68, 2.03, 4.3, 16));
    // toalha na parede z=3,1
    put(box(0.5, 0.02, 0.02, metalBk, 18.3, 1.35, 3.2));
    put(box(0.42, 0.55, 0.04, sand, 18.3, 1.08, 3.215));
    // espelho com LED atrás (halo que acende com a luz da pastoral), saboneteira e plantinha
    const halo = cyl(0.3, 0.3, 0.008, ledPast, 17.52, 1.55, 4.806, 32); halo.rotation.x = PI / 2; halo.castShadow = false; put(halo);
    put(cyl(0.035, 0.035, 0.14, blackM, 17.33, 0.94, 4.7, 12));                   // saboneteira líquida
    put(cyl(0.01, 0.01, 0.04, blackM, 17.33, 1.03, 4.7, 6));
    put(cyl(0.05, 0.04, 0.08, ceramic, 17.73, 0.91, 4.72, 12));                   // vasinho
    put(sph(0.055, frond2, 17.73, 0.99, 4.72));
    // toalheiro de argola ao lado da bancada, com toalha de rosto
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.008, 6, 20), metalBk);
    ring.position.set(17.97, 1.12, 4.8); put(ring);
    put(box(0.2, 0.3, 0.025, linenLt, 17.97, 0.98, 4.795));
    // lixeira com pedal (inox) ao lado do vaso
    put(cyl(0.1, 0.09, 0.3, steelBr, 18.78, 0.15, 4.62, 16));
    put(cyl(0.102, 0.102, 0.02, metalBk, 18.78, 0.31, 4.62, 16));
    // box: ralo linear, prateleira com frascos e tapete de banho
    put(box(0.6, 0.004, 0.06, steelBr, 19.55, 0.052, 4.72, nc));
    put(box(0.12, 0.02, 0.36, steelBr, 19.945, 1.09, 3.56));                     // prateleira de canto
    for (let i = 0; i < 3; i++) put(cyl(0.025, 0.025, 0.16 - i * 0.02, [amber, ceramic, terra][i], 19.945, 1.1 + (0.16 - i * 0.02) / 2, 3.46 + i * 0.1, 10));
    put(box(0.3, 0.012, 0.5, sand, 18.86, 0.012, 3.85, nc));
  }

  // =====================================================================
  // CAIXA D'ÁGUA (x 17,0–20,1 · z 0–3,1)
  // =====================================================================
  {
    put(box(2.65, 0.25, 1.95, M.concrete, 18.62, 0.125, 1.45));                 // base de concreto
    for (const x of [17.98, 19.28]) {
      put(cyl(0.6, 0.52, 0.82, tankBlue, x, 0.66, 1.45, 28));
      put(cyl(0.62, 0.62, 0.05, tankLid, x, 1.09, 1.45, 28));
      put(cyl(0.34, 0.6, 0.16, tankLid, x, 1.19, 1.45, 28));
      put(cyl(0.1, 0.1, 0.04, tankBlue, x, 1.29, 1.45, 14));
      // entrada pela tampa (boia) e saída na lateral de baixo
      pipe([x, 1.2, 0.95], [x, 1.5, 0.95], 0.022);
      pipe([x, 0.35, 1.95], [x, 0.35, 2.45], 0.025, pvcBrown);
      put(cyl(0.04, 0.04, 0.08, pvcBrown, x, 0.35, 2.3, 10)).rotation.x = PI / 2;   // registro de gaveta
      put(cyl(0.008, 0.008, 0.08, M.chrome, x, 0.42, 2.3, 6));                      // haste + volante vermelho
      const wh = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.009, 6, 16), M.red);
      wh.rotation.x = PI / 2; wh.position.set(x, 0.465, 2.3); put(wh);
      // frisos horizontais do reservatório e trava da tampa
      for (const y of [0.45, 0.75]) { const r = 0.532 + (y - 0.25) * 0.0976; put(cyl(r, r, 0.03, tankLid, x, y, 1.45, 28)); }
      put(box(0.06, 0.05, 0.03, tankLid, x + 0.6, 1.07, 1.45));
    }
    // extravasor (ladrão): liga os dois reservatórios e sai pelo muro x = 20,1
    pipe([18.56, 0.98, 1.45], [18.7, 0.98, 1.45], 0.02);
    pipe([19.86, 0.98, 1.45], [20.0, 0.98, 1.45], 0.02);
    put(cyl(0.035, 0.035, 0.01, pvc, 20.005, 0.98, 1.45, 12)).rotation.z = PI / 2;   // espelho da saída
    put(cyl(0.07, 0.07, 0.006, steelBr, 18.6, 0.008, 2.75, 16));                 // ralo
    // mangueira enrolada no suporte (parede z = 3,1) e escada de alumínio encostada no muro z = 0
    {
      const reel = cyl(0.2, 0.2, 0.1, hoseGr, 17.55, 1.15, 2.95, 20); reel.rotation.x = PI / 2; put(reel);
      const hub = cyl(0.08, 0.08, 0.12, metalBk, 17.55, 1.15, 2.95, 12); hub.rotation.x = PI / 2; put(hub);
      put(box(0.04, 0.2, 0.05, metalBk, 17.55, 1.0, 2.99));
      put(box(0.03, 0.9, 0.03, hoseGr, 17.42, 0.62, 2.9));                     // ponta pendurada
      const lad = G();
      for (const sx of [-1, 1]) lad.add(box(0.05, 2.1, 0.025, steelBr, sx * 0.2, 1.05, 0));
      for (let i = 0; i < 6; i++) lad.add(box(0.4, 0.03, 0.02, steelBr, 0, 0.3 + i * 0.3, 0));
      lad.rotation.x = -0.1; place(lad, 17.62, 0.35, 0);
    }
    pipe([17.6, 1.5, 0.95], [19.8, 1.5, 0.95], 0.025);                          // barrilete de entrada
    pipe([19.8, 1.5, 0.95], [19.8, 1.5, 0.2], 0.025);
    pipe([19.8, 1.5, 0.2], [19.8, 2.6, 0.2], 0.025);
    pipe([17.7, 0.35, 2.45], [19.6, 0.35, 2.45], 0.03, pvcBrown);               // barrilete de saída
    for (const x of [17.98, 19.28]) put(sph(0.035, pvcBrown, x, 0.35, 2.45));
    // motobomba sobre base, recalque subindo pela parede z=3,1
    put(box(0.6, 0.08, 0.38, M.concrete, 19.55, 0.04, 2.78));
    const mot = cyl(0.1, 0.1, 0.28, pumpBlue, 19.45, 0.2, 2.78, 16); mot.rotation.z = PI / 2; put(mot);
    const cap = cyl(0.08, 0.08, 0.06, metalBk, 19.28, 0.2, 2.78, 12); cap.rotation.z = PI / 2; put(cap);
    put(cyl(0.09, 0.09, 0.12, pumpBlue, 19.68, 0.2, 2.78, 14));
    pipe([19.6, 0.35, 2.45], [19.6, 0.35, 2.62], 0.03, pvcBrown);
    pipe([19.68, 0.28, 2.78], [19.68, 2.4, 2.78], 0.025);
    // quadro elétrico na parede x=20,1
    put(box(0.12, 0.42, 0.32, panelGr, 19.95, 1.6, 2.5));
    put(box(0.012, 0.08, 0.1, M.red, 19.885, 1.72, 2.5, nc));
    pipe([19.95, 1.39, 2.5], [19.95, 0.9, 2.5], 0.015, graph);
  }

  // =====================================================================
  // RECEPÇÃO (x 9,45–12,75 · z 5,9–9,25)
  // =====================================================================
  {
    // balcão: frente ripada virada para a espera (−x), tampo branco do lado de dentro
    put(box(0.62, 0.03, 1.6, whiteTop, 11.3, 0.745, 7.1));
    put(box(0.04, 1.06, 1.6, blackM, 10.99, 0.53, 7.1));
    put(box(0.26, 0.03, 1.66, woodL, 10.96, 1.075, 7.1));
    for (let i = 0; i < 12; i++) put(box(0.022, 0.96, 0.07, ripaB, 10.958, 0.5, 6.37 + i * 0.1327));
    for (const z of [6.32, 7.88]) put(box(0.62, 0.73, 0.04, blackM, 11.3, 0.365, z));
    put(box(0.34, 0.55, 0.5, whiteTop, 11.4, 0.28, 7.55));                      // gaveteiro
    const mon = monitor(0.5, scrRec); place(mon, 11.12, 7.25, FX, 0.76);
    put(box(0.14, 0.018, 0.4, graph, 11.4, 0.769, 7.25));                        // teclado
    put(box(0.2, 0.012, 0.28, paper, 11.35, 0.766, 6.65));
    put(cyl(0.035, 0.03, 0.09, terra, 11.5, 0.805, 6.45, 12));
    put(box(0.2, 0.06, 0.12, metalBk, 10.97, 1.12, 6.6));                         // porta-folhetos
    put(box(0.012, 0.2, 0.14, amber, 10.95, 1.2, 6.6, nc)).rotation.z = 0.2;
    place(officeChair(), 12.1, 7.15, FNX);
    // marca "B" em acrílico preto na frente ripada do balcão + fita de LED sob o tampo alto
    const mk = ctx.logo.mesh(0.34, 0, { layout: 'mark', color: '#161618', roughness: 0.3 });
    mk.rotation.y = FNX; mk.position.set(10.944, 0.6, 7.1); put(mk);
    put(box(0.012, 0.008, 1.56, ledRec, 10.87, 1.056, 7.1, nc));
    // telefone e porta-canetas no tampo de dentro
    put(box(0.16, 0.05, 0.2, metalBk, 11.45, 0.785, 6.9)); put(box(0.05, 0.03, 0.18, graph, 11.4, 0.822, 6.9));
    put(cyl(0.03, 0.03, 0.1, metalBk, 11.5, 0.81, 7.8, 10));
    // capacho com o logo (grafite, logo claro) logo depois da porta da recepção (x 11,8–12,6)
    const cap = ctx.logo.mesh(0.9, 0, { layout: 'wide', color: '#d9d4ca', bg: '#1a1a1c', pad: 0.12, roughness: 1 });
    cap.rotation.x = -PI / 2; cap.position.set(12.2, 0.014, 8.72); put(cap);
  }
  // PAREDE DA MARCA (x = 12,75, atrás do balcão): ripado de madeira clara do rodapé à sanca,
  // como o painel da fachada, com o LOGO oficial em letras caixa prateadas (ctx.logo.relief)
  // retroiluminadas — o halo e o brilho das letras acompanham a luz 'recepcao'.
  {
    const Z0 = 6.45, Z1 = 8.05, ZC = (Z0 + Z1) / 2, n = 16, pitch = (Z1 - Z0) / n;
    put(box(0.012, 2.72, Z1 - Z0 + 0.04, blackM, 12.665, 1.42, ZC, nc));          // fundo preto (sombra entre ripas)
    for (let i = 0; i < n; i++) put(box(0.03, 2.62, pitch * 0.62, ripaB, 12.64, 1.39, Z0 + pitch * (i + 0.5)));
    put(box(0.05, 0.08, Z1 - Z0 + 0.04, metalBk, 12.65, 0.04, ZC));               // rodapé preto
    put(box(0.09, 0.08, Z1 - Z0 + 0.04, metalBk, 12.63, 2.74, ZC));               // sanca preta
    put(box(0.012, 0.008, Z1 - Z0 - 0.04, ledRec, 12.6, 2.697, ZC, nc));          // fita de LED lavando o ripado
    const L = ctx.logo.relief(0.7, { layout: 'full', depth: 0.045, layers: 4 });
    L.rotation.y = FNX; L.position.set(12.622, 1.66, ZC); put(L);
    ctx.bindEmissive('recepcao', L.userData.face, 0.45, { min: 0.25 });
    const halo = ctx.glowPlane(1.5, 1.6, 'recepcao', { color: 0xfff1dc, base: 0.32, day: 0.15 });
    halo.rotation.y = FNX; halo.position.set(12.623, 1.66, ZC); put(halo);
  }
  // 3 poltronas de espera na parede x=9,45, mesinha, planta, bebedouro e quadro
  for (const z of [6.42, 7.22, 8.02]) place(armchair(caramel, caramel, 0.66, 0.7, metalBk), 9.95, z, FX);
  place(plant(0.5, 0.4, 7, 0.16, true), 9.85, 8.82);
  {
    const g = G();                                                               // bebedouro com galão
    g.add(box(0.3, 0.95, 0.32, whiteTop, 0, 0.475, 0));
    g.add(box(0.3, 0.04, 0.32, graph, 0, 0.97, 0));
    g.add(cyl(0.13, 0.13, 0.42, waterJug, 0, 1.2, 0, 16));
    g.add(cyl(0.05, 0.08, 0.06, waterJug, 0, 1.44, 0, 12));
    g.add(box(0.18, 0.1, 0.03, graph, 0, 0.72, 0.17));
    for (const sx of [-1, 1]) g.add(box(0.02, 0.04, 0.03, sx < 0 ? M.blue : M.red, sx * 0.05, 0.8, 0.175));
    place(g, 12.46, 6.2, FNZ);
  }
  place(frame(0.8, 0.56, terra, amber), 10.55, 9.16, FNZ, 1.65);

  // ---- placas de porta (acrílico preto, marca + nome) na face externa da parede z = 9,25 ----
  // Uma textura só (2 linhas) → 1 material → 1 draw call; cada placa usa a sua faixa de UV.
  {
    const PW = 0.26, PH = 0.1, rowH = Math.round(512 * PH / PW);
    const names = [['RECEPÇÃO'], ['SALA', 'PASTORAL']];
    const tex = ctx.makeTex(512, (g, s) => {
      g.fillStyle = '#0f0f11'; g.fillRect(0, 0, s, s);
      names.forEach((t, i) => {
        const y0 = i * rowH, pad = rowH * 0.18;
        g.fillStyle = '#17171a'; g.fillRect(0, y0, s, rowH);
        ctx.logo.draw(g, pad, y0 + pad, rowH - 2 * pad, { layout: 'mark', color: '#f4f5f7' });
        g.fillStyle = '#f4f5f7'; g.textBaseline = 'middle'; g.textAlign = 'left';
        let fs = rowH * (t.length > 1 ? 0.27 : 0.32); g.font = `700 ${fs}px ${ctx.logo.font}`;
        const maxW = s - rowH - pad * 1.2, w0 = Math.max(...t.map((l) => g.measureText(l).width));
        if (w0 > maxW) { fs *= maxW / w0; g.font = `700 ${fs}px ${ctx.logo.font}`; }
        t.forEach((l, k) => g.fillText(l, rowH * 0.98, y0 + rowH / 2 + (k - (t.length - 1) / 2) * fs * 1.12));
      });
    });
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.25, metalness: 0.1 });
    const plate = (i, x) => {
      const geo = new THREE.PlaneGeometry(PW, PH), uv = geo.attributes.uv;
      const v1 = 1 - (i * rowH) / 512, v0 = 1 - ((i + 1) * rowH) / 512;
      for (let k = 0; k < uv.count; k++) uv.setY(k, v0 + uv.getY(k) * (v1 - v0));
      const m = new THREE.Mesh(geo, mat); m.position.set(x, 1.6, 9.338); m.castShadow = false; put(m);
      put(box(PW + 0.01, PH + 0.01, 0.01, metalBk, x, 1.6, 9.331, nc));
    };
    plate(0, 11.52);                                                             // porta da recepção (x 11,8–12,6)
    plate(1, 14.0);                                                              // porta da pastoral (x 12,9–13,8)
  }

  // =====================================================================
  // SALA GILVAN (x 17,1–20,1 · z 11,0–14,2) — porta em x=17,1 (z 12,9–13,8)
  // =====================================================================
  {
    const g = credenza(2.0, 0.4, 0.74, 3);                                      // aparador de apoio sob a janela
    books(g, -0.68, 0.74, 0, 0.36, 41, 0.2, 0.24);
    g.add(cyl(0.07, 0.06, 0.16, ceramic, 0.05, 0.82, 0, 12)); g.add(sph(0.08, frond, 0.05, 0.94, 0));
    const pf = frame(0.2, 0.26, amber, sand); pf.position.set(0.55, 0.87, -0.05); pf.rotation.x = -0.12; g.add(pf);
    g.add(box(0.28, 0.08, 0.2, graph, 0.8, 0.78, 0));
    place(g, 18.9, 11.36, FZ);
    place(workDesk(1.3, 0.68, true, 3, scrAdm, shadeAdm), 18.6, 12.5, FX);
    place(officeChair(), 19.45, 12.5, FNX);
    place(shellChair(caramel), 17.85, 12.07, FX);
    place(shellChair(caramel), 17.85, 12.62, FX);
    place(plant(0.42, 0.4, 9, 0.16, true), 19.68, 13.8);
    place(frame(0.7, 0.5, blackM, terra), 18.6, 14.1, FNZ, 1.65);
    // 2 prateleiras flutuantes (madeira clara, mão-francesa oculta) na parede x = 20,1, atrás da cadeira:
    // livros, bíblia, porta-retrato, plantinha e um bloco de madeira com a marca "B"
    const sh = G();
    for (const y of [1.45, 1.85]) sh.add(box(0.24, 0.035, 1.3, woodL, 0, y, 0));
    books(sh, 0, 1.4675, 0, 0.5, 51, 0.18, 0.24);                              // fileira ao longo de z (girada abaixo)
    sh.children.slice(2).forEach((bk) => { const x0 = bk.position.x; bk.position.x = bk.position.z + 0.01; bk.position.z = x0 - 0.3; bk.rotation.y = PI / 2; });
    sh.add(box(0.2, 0.05, 0.28, blackM, 0.0, 1.492, 0.38)); sh.add(box(0.19, 0.012, 0.26, amber, 0.0, 1.521, 0.38));
    sh.add(cyl(0.06, 0.05, 0.12, ceramic, 0.0, 1.927, -0.45, 12)); sh.add(sph(0.08, frond2, 0.0, 2.04, -0.45));
    sh.add(box(0.05, 0.24, 0.24, woodL, -0.02, 1.987, 0.05));
    const bm = ctx.logo.mesh(0.19, 0, { layout: 'mark', color: '#1b1b1d', roughness: 0.4 });
    bm.rotation.y = FNX; bm.position.set(-0.047, 1.987, 0.05); sh.add(bm);
    const pf2 = frame(0.18, 0.24, sand, terra); pf2.rotation.y = FNX; pf2.rotation.z = 0; pf2.position.set(-0.02, 1.99, 0.42); sh.add(pf2);
    place(sh, 19.88, 12.55, 0);
    // cabideiro de pé no canto da porta
    const cb = G();
    cb.add(cyl(0.18, 0.2, 0.025, metalBk, 0, 0.0125, 0, 20));
    cb.add(cyl(0.016, 0.016, 1.72, metalBk, 0, 0.87, 0, 8));
    for (let i = 0; i < 4; i++) { const hk = box(0.16, 0.016, 0.016, metalBk, Math.cos(i * PI / 2) * 0.07, 1.68, Math.sin(i * PI / 2) * 0.07); hk.rotation.y = -i * PI / 2; hk.rotation.z = 0.35 * (i % 2 ? 1 : 1); cb.add(hk); }
    cb.add(box(0.34, 0.62, 0.1, graph, 0.1, 1.36, 0.03));                      // blazer pendurado
    cb.add(box(0.24, 0.3, 0.06, caramel, -0.07, 1.42, -0.1));                   // bolsa
    place(cb, 17.45, 11.4, 0.6);
  }

  // =====================================================================
  // ADMINISTRATIVO (x 17,1–20,1 · z 14,2–19,0) — porta em x=17,1 (z 14,4–15,3)
  // =====================================================================
  {
    // aparador da impressora na parede z=14,2
    const g = credenza(1.5, 0.48, 0.74, 3, woodL, blackM, woodL);
    g.add(box(0.5, 0.3, 0.42, whiteTop, 0.25, 0.89, 0));                       // multifuncional
    g.add(box(0.5, 0.06, 0.42, graph, 0.25, 1.07, -0.0));
    g.add(box(0.36, 0.012, 0.22, paper, 0.25, 0.9, 0.23));
    g.add(box(0.12, 0.012, 0.08, metalBk, 0.42, 1.101, 0.1));
    g.add(box(0.3, 0.12, 0.22, paper, -0.45, 0.8, 0.02));                       // resmas
    g.add(box(0.08, 0.28, 0.25, book[1], -0.2, 0.88, 0)); g.add(box(0.08, 0.28, 0.25, book[6], -0.11, 0.88, 0));
    place(g, 19.2, 14.6, FZ);
    // logo 'wide' em acrílico preto (letras caixa finas) na parede z = 14,2, acima da multifuncional
    const LW = ctx.logo.relief(0.95, { layout: 'wide', depth: 0.018, layers: 3, color: 0x1b1b1d, sideColor: 0x0d0d0f, metalness: 0.25, roughness: 0.35 });
    LW.position.set(19.2, 1.74, 14.279); put(LW);
    // 2 estações de trabalho
    for (const [zc, s] of [[15.95, 4], [17.8, 5]]) {
      place(workDesk(1.3, 0.68, true, s, scrAdm), 18.6, zc, FX);
      place(officeChair(), 19.45, zc, FNX);
      place(shellChair(caramel), 17.95, zc, FX);
    }
    // aparador para café na parede x=17,1 (entre a porta e a janela J05)
    const c = credenza(1.25, 0.4, 0.86, 2);
    coffeeSet(c, -0.4, 0.86, 0);
    place(c, 17.42, 16.08, FX);
    // arquivo de aço de 4 gavetas na parede z=19
    const a = G();
    a.add(box(0.47, 1.33, 0.58, graph, 0, 0.665, 0));
    for (let i = 0; i < 4; i++) {
      a.add(box(0.43, 0.3, 0.012, graph, 0, 0.17 + i * 0.325, 0.296));
      a.add(box(0.16, 0.02, 0.025, M.chrome, 0, 0.26 + i * 0.325, 0.31));
      a.add(box(0.08, 0.035, 0.005, paper, 0, 0.29 + i * 0.325, 0.304, nc));
    }
    a.add(cyl(0.08, 0.06, 0.18, ceramic, 0.08, 1.42, 0, 12)); a.add(sph(0.1, frond2, 0.08, 1.56, 0));
    place(a, 17.8, 18.6, FNZ);
    place(plant(0.42, 0.4, 13, 0.16, true), 19.68, 18.6);
    // mural de cortiça (escala do culto, avisos) na parede x = 20,1, entre as estações
    {
      const g2 = G();
      g2.add(box(1.1, 0.78, 0.03, metalBk, 0, 0, 0));
      g2.add(box(1.04, 0.72, 0.012, cork, 0, 0, 0.018, nc));
      const notes = [[-0.36, 0.18, 0.21, 0.297, paper], [-0.1, 0.2, 0.18, 0.18, sand], [0.16, 0.16, 0.21, 0.297, paper], [0.4, 0.2, 0.15, 0.15, amber],
        [-0.34, -0.17, 0.26, 0.18, linenLt], [-0.04, -0.16, 0.21, 0.297, paper], [0.24, -0.17, 0.2, 0.14, terra], [0.42, -0.18, 0.1, 0.14, paper]];
      notes.forEach(([x, y, w, h, m], i) => {
        const n = box(w, h, 0.004, m, x, y, 0.027, nc); n.rotation.z = ((i * 37) % 7 - 3) * 0.015; g2.add(n);
        g2.add(sph(0.012, i % 2 ? M.red : amber, x, y + h / 2 - 0.025, 0.032));
      });
      place(g2, 19.995, 16.88, FNX, 1.58);
    }
    // relógio de parede na parede z=19
    const clk = cyl(0.16, 0.16, 0.03, metalBk, 18.9, 2.05, 18.9, 24); clk.rotation.x = PI / 2; put(clk);
    const face = cyl(0.145, 0.145, 0.006, ceramic, 18.9, 2.05, 18.882, 24); face.rotation.x = PI / 2; face.castShadow = false; put(face);
    put(box(0.012, 0.1, 0.006, metalBk, 18.9, 2.09, 18.876, nc));
    const hand = box(0.012, 0.07, 0.006, metalBk, 18.925, 2.04, 18.876, nc); hand.rotation.z = -2.0; put(hand);
  }
}

function roomServicoPatio(ctx) {
  // ---------------------------------------------------------------------------
  // FUNDOS / SERVIÇO (z 0–12,4)
  //  · Estacionamento interno (x 0–4,9): 2 sedãs ao longo de z (centros x 2,4 · z 3,8 e 8,8),
  //    faixas de vaga pintadas, batentes de roda, torneira com mangueira no muro x=0 e a
  //    coleta seletiva (4 lixeiras + placa) perto do portão, na face externa do almoxarifado.
  //    O portão de correr (parede z=0) e a arandela do pátio (0,16; 2,8; 6,2) são do cartão.
  //  · Almoxarifado (x 4,9–8,6 · z 0–3,9): 3 estantes de aço com caixas e organizadores,
  //    cases de som (rack com rodízios, mesa de som, caixas) com estêncil "BASE MUSIC",
  //    caixa de som PA, pilhas de cadeiras empilháveis, escada de alumínio, balde com rodo.
  //  · Cozinha (x 8,6–12,75 · z 0–3,9): bancada em L (madeira clara + granito preto), cuba,
  //    cooktop com forno e coifa, armários aéreos brancos, geladeira inox, micro-ondas,
  //    garrafões de café, escorredor, mesa de apoio inox, purificador, lixeira e lousa
  //    "Café da Base" com o logo oficial na parede x=12,75.
  //    Janela (x 9,2–10,8) e porta (x 11,6–12,5) da parede z=3,9 ficam livres.
  //  · Pátio: PAREDÃO DA MARCA na face externa do almoxarifado (z=3,9 · x 5,0–7,3): ripado de
  //    madeira clara como o da fachada, logo oficial em letras caixa (ctx.logo.relief), sanca
  //    com fita de LED, halo e floreira preta com uplights. Medalhão com o "B" no piso
  //    (x 11,1 · z 10,85), no caminho recepção → templo. Ipê-amarelo florido (copa de tufos
  //    pequenos, galhos e flores caídas no chão), banco ripado com LED sob o assento,
  //    bicicletário com 2 bicicletas, abrigo de gás, cicas em vasos pretos na porta do templo.
  //  · Jardim interno (x 7,5–9,45 · z 5,8–10,2): meio-fio, 2 palmeiras, cica, arbustos,
  //    forração, pedras brancas e spots de chão (só emissivo, sem luz real).
  //  · Jardim pastoral (x 12,75–20,1 · z 9,25–11,0): pisantes de concreto ligando a porta
  //    da pastoral e o pátio à porta PM01, canteiros com forração, buxinhos, moreias e ráfis.
  // Livres: rotas das portas (PM01, recepção, pastoral, vidro do templo, cozinha, almox.),
  // luminárias do cartão (cozinha 10,7/6,75 · y 2,7 · z 1,95) e a arandela do pátio.
  // Brilhos da decoração (spots, LEDs do paredão e do banco, logo) seguem 'estacionamento'
  // (a luz externa dos fundos) via ctx.bindEmissive — apagados de dia, acesos à noite.
  // ---------------------------------------------------------------------------
  const { THREE, M, box, cyl, sph, place, add, std, rnd } = ctx;
  const G = () => new THREE.Group();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const PI = Math.PI;
  const j = (k) => (rnd() - 0.5) * 2 * k;                          // jitter determinístico ±k
  const nc = { cast: false };
  const flat = (m) => { m.castShadow = false; return m; };          // peças rasteiras não projetam sombra
  const mk = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; return m; };

  // ---- materiais (mesmas opções → mesmo material → menos draw calls) ---------------------
  const P = {
    paint: std({ color: 0xeceae3, roughness: 0.85 }), yellow: std({ color: 0xd9a930, roughness: 0.8 }),
    steelG: std({ color: 0x8d9298, roughness: 0.5, metalness: 0.5 }), steelDk: std({ color: 0x4a4e53, roughness: 0.55, metalness: 0.4 }),
    card: std({ color: 0xb08c5a, roughness: 1 }), card2: std({ color: 0x9c7a4c, roughness: 1 }),
    binW: std({ color: 0xe4e2dc, roughness: 0.7 }), binAmber: std({ color: 0xd08a3a, roughness: 0.7 }), binGray: std({ color: 0x5f6368, roughness: 0.7 }),
    caseBlk: std({ color: 0x1d1d20, roughness: 0.7 }), alu: std({ color: 0xb7bcc2, roughness: 0.35, metalness: 0.8 }),
    grille: std({ color: 0x2c2d30, roughness: 0.95 }),
    chairBlk: std({ color: 0x1f2022, roughness: 0.55, metalness: 0.3 }), upholst: std({ color: 0x3b3d42, roughness: 0.95 }),
    woodL: std({ color: 0xd2b08a, roughness: 0.65 }), granite: std({ color: 0x1e1f22, roughness: 0.3, metalness: 0.1 }),
    splash: std({ color: 0xdadddd, roughness: 0.5 }), cabW: std({ color: 0xf2f0ea, roughness: 0.6 }),
    glassBlk: std({ color: 0x121315, roughness: 0.15, metalness: 0.3 }), burner: std({ color: 0x3a3a3c, roughness: 0.5 }),
    trim: std({ color: 0x141416, roughness: 0.6 }),
    carWhite: std({ color: 0xe9e9e6, roughness: 0.3, metalness: 0.3 }), carGray: std({ color: 0x44484e, roughness: 0.3, metalness: 0.5 }),
    carGlass: std({ color: 0x1b232c, roughness: 0.1, metalness: 0.6 }), rim: std({ color: 0xb9bec4, roughness: 0.3, metalness: 0.8 }),
    plate: std({ color: 0xf0f0ea, roughness: 0.6 }), plateBlue: std({ color: 0x1f4ea3, roughness: 0.6 }),
    binBlue: std({ color: 0x2f5f9e, roughness: 0.7 }), binRed: std({ color: 0xb23a2e, roughness: 0.7 }),
    binGreen: std({ color: 0x2f7a3e, roughness: 0.7 }), binYel: std({ color: 0xd9a82a, roughness: 0.7 }),
    potBlk: std({ color: 0x1f1f21, roughness: 0.7 }), hose: std({ color: 0x3e7a3f, roughness: 0.8 }),
    bikeT: std({ color: 0xb85c38, roughness: 0.5, metalness: 0.3 }), bikeK: std({ color: 0x26282b, roughness: 0.5, metalness: 0.3 }),
    leafDk: std({ color: 0x24512a, roughness: 1 }), leafLt: std({ color: 0x6b9a3e, roughness: 1 }), palm: std({ color: 0x4d8a3c, roughness: 0.9 }),
    cyca: std({ color: 0x35612b, roughness: 0.9 }), forr: std({ color: 0x4f7d33, roughness: 1 }), strap: std({ color: 0x5f8f4a, roughness: 0.9 }),
    ipe: std({ color: 0xe8b832, roughness: 0.95 }), ipe2: std({ color: 0xd49a24, roughness: 0.95 }),
    flowerY: std({ color: 0xf0c040, roughness: 0.9 }), flowerT: std({ color: 0xc8643c, roughness: 0.9 }),
    pebble: std({ color: 0xeceae4, roughness: 0.95 }), pebble2: std({ color: 0xd9d5cb, roughness: 0.95 }),
    rock: std({ color: 0x8f8b82, roughness: 0.95 }), slab: std({ color: 0xbdb9b0, roughness: 0.95 }),
    spotBody: std({ color: 0x2a2b2e, roughness: 0.5, metalness: 0.4 }),
    // emissivos com opções exclusivas (o cache de std é do cartão inteiro): acendem com 'estacionamento'
    spotLens: std({ color: 0xfff3d6, emissive: 0xffd9a0, emissiveIntensity: 0.6, roughness: 0.39 }),
    led: std({ color: 0xfff0d8, emissive: 0xffd49a, emissiveIntensity: 0.1, roughness: 0.43 }),
    ripa: std({ color: 0xd9b8a0, roughness: 0.72 }), ripaFundo: std({ color: 0xa8876f, roughness: 0.85 }),
    medal: std({ color: 0x2b2c30, roughness: 0.85 }), ipe3: std({ color: 0xf2c94a, roughness: 0.95 }),
    gasDoor: std({ color: 0x9aa0a6, roughness: 0.6, metalness: 0.4 }), thermoR: std({ color: 0x8b2f2f, roughness: 0.5 }),
    fruitO: std({ color: 0xe08a2a, roughness: 0.7 }), fruitG: std({ color: 0x7ca23a, roughness: 0.7 }),
  };
  // spots de chão, fitas de LED e uplights: quase apagados de dia, acesos com a luz externa dos fundos
  if (ctx.bindEmissive) { ctx.bindEmissive('estacionamento', P.spotLens, 1.5); ctx.bindEmissive('estacionamento', P.led, 1.8); }
  const logo = ctx.logo;

  // ---- builders locais ------------------------------------------------------------------------
  // cilindro entre dois pontos (tubos de bicicleta, bicicletário, galhos, cabo do rodo)
  const tube = (g, a, b, r, mat, seg = 8) => {
    const A = V(...a), B = V(...b), d = B.clone().sub(A);
    const m = cyl(r, r, d.length(), mat, 0, 0, 0, seg);
    m.position.copy(A).add(B).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
    g.add(m); return m;
  };
  // toro (rodas de bicicleta, mangueira, carretel de cabo)
  const torus = (r, t, mat, x, y, z, rx = 0, ry = 0, seg = 20) => {
    const m = mk(new THREE.TorusGeometry(r, t, 8, seg), mat);
    m.position.set(x, y, z); m.rotation.set(rx, ry, 0); return m;
  };
  // folha comprida saindo de (cx,cy,cz): ângulo `a` no plano, inclinação `t` (positivo = caindo)
  const frond = (g, cx, cy, cz, len, w, a, t, mat) => {
    const m = box(len, 0.02, w, mat, 0, 0, 0), L = len / 2, ct = Math.cos(t);
    m.position.set(cx + L * ct * Math.cos(a), cy - L * Math.sin(t), cz - L * ct * Math.sin(a));
    m.rotation.set(0, a, -t);
    g.add(m); return m;
  };
  // perfil lateral (s = z do carro, y) extrudado na largura (eixo x), centrado em x = 0
  const extrudeX = (pts, width, mat, bevel = 0.04) => {
    const sh = new THREE.Shape(); sh.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i];
      if (p.length === 4) sh.absarc(p[0], p[1], p[2], 0, p[3], false); else sh.lineTo(p[0], p[1]);
    }
    const geo = new THREE.ExtrudeGeometry(sh, { depth: width - 2 * bevel, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: 2, curveSegments: 10 });
    geo.rotateY(-PI / 2); geo.translate(width / 2 - bevel, 0, 0);
    return mk(geo, mat);
  };

  // =============================== ESTACIONAMENTO INTERNO ===============================
  // Sedã (frente em −z local): carroceria extrudada com caixas de roda, estufa de vidro fumê,
  // teto, rodas com aro, faróis, lanternas, grade, placas Mercosul, retrovisores e maçanetas.
  const sedan = (paint) => {
    const g = G();
    g.add(extrudeX([[-2.3, 0.34], [-2.36, 0.52], [-2.32, 0.7], [-1.9, 0.8], [-1.0, 0.9], [1.4, 0.93], [2.2, 0.9], [2.32, 0.78], [2.34, 0.5], [2.28, 0.34],
      [1.8, 0.34], [1.38, 0.3, 0.42, PI], [-0.96, 0.34], [-1.38, 0.3, 0.42, PI], [-2.3, 0.34]], 1.74, paint, 0.06));
    g.add(extrudeX([[-1.0, 0.86], [-0.22, 1.36], [0.78, 1.38], [1.42, 0.9]], 1.42, P.carGlass, 0.04));
    g.add(box(1.34, 0.04, 0.96, paint, 0, 1.415, 0.28));                         // teto
    g.add(box(1.44, 0.42, 0.08, paint, 0, 1.13, 0.3));                           // coluna B
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const t = cyl(0.31, 0.31, 0.22, P.trim, sx * 0.74, 0.31, sz * 1.38, 18); t.rotation.z = PI / 2; g.add(t);
      const r = cyl(0.19, 0.19, 0.226, P.rim, sx * 0.74, 0.31, sz * 1.38, 14); r.rotation.z = PI / 2; g.add(r);
    }
    for (const sx of [-1, 1]) {
      g.add(box(0.36, 0.1, 0.12, M.lightWhite, sx * 0.56, 0.72, -2.29));         // faróis
      g.add(box(0.4, 0.1, 0.1, M.lightRed, sx * 0.55, 0.8, 2.31));               // lanternas
      g.add(box(0.08, 0.1, 0.18, paint, sx * 0.93, 0.98, -0.78));                // retrovisores
      g.add(box(0.02, 0.025, 0.14, M.chrome, sx * 0.875, 0.84, -0.15));          // maçanetas dianteiras
    }
    g.add(box(0.8, 0.14, 0.06, P.trim, 0, 0.5, -2.39));                          // grade
    for (const sz of [-1, 1]) {
      g.add(box(1.66, 0.1, 0.08, P.trim, 0, 0.38, sz * 2.35));                   // para-choques
      g.add(box(0.52, 0.12, 0.02, P.plate, 0, 0.52, sz * 2.42));                 // placas
      g.add(box(0.52, 0.03, 0.024, P.plateBlue, 0, 0.565, sz * 2.42));           // faixa azul Mercosul
    }
    return g;
  };
  place(sedan(P.carWhite), 2.4, 3.8, 0);        // de ré, frente para o portão
  place(sedan(P.carGray), 2.4, 8.8, PI);        // de frente, nariz para o fundo

  // Faixas de vaga pintadas (2 vagas de 2,5 × 5,3 m) e batentes de roda amarelos
  for (const x of [1.15, 3.65]) add(box(0.1, 0.006, 10.7, P.paint, x, 0.01, 6.3, nc));
  for (const z of [0.95, 6.3, 11.65]) add(box(2.6, 0.006, 0.1, P.paint, 2.4, 0.01, z, nc));
  for (const z of [5.62, 10.62]) {
    add(box(1.3, 0.1, 0.15, P.yellow, 2.4, 0.05, z));
    for (const x of [1.95, 2.85]) add(box(0.22, 0.102, 0.152, P.trim, x, 0.05, z));   // listras pretas
  }
  // Torneira com mangueira enrolada no muro x=0 (fundo do estacionamento)
  add(box(0.06, 0.34, 0.3, P.steelDk, 0.12, 0.85, 11.8));
  add(torus(0.14, 0.028, P.hose, 0.21, 0.85, 11.8, 0, PI / 2, 22));
  add(cyl(0.02, 0.02, 0.1, M.chrome, 0.14, 1.12, 11.8, 8));

  // ===================================== ALMOXARIFADO =====================================
  // Estante de aço (4 colunas, `levels` prateleiras) com caixas de papelão e organizadores
  const rack = (w, d, h, levels) => {
    const g = G();
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(0.035, h, 0.035, P.steelG, sx * (w / 2 - 0.018), h / 2, sz * (d / 2 - 0.018)));
    const step = (h - 0.12) / (levels - 1);
    for (let i = 0; i < levels; i++) {
      const y = 0.08 + i * step;
      g.add(box(w, 0.025, d, P.steelG, 0, y, 0));
      const top = i === levels - 1;
      let x = -w / 2 + 0.05;
      while (x < w / 2 - 0.25) {
        const bw = 0.26 + rnd() * 0.18, bh = top ? 0.2 + rnd() * 0.1 : 0.18 + rnd() * 0.15, t = rnd();
        if (x + bw > w / 2 - 0.03) break;
        if (t < 0.88) {
          const mat = t < 0.5 ? (rnd() < 0.5 ? P.card : P.card2) : t < 0.7 ? P.binW : t < 0.8 ? P.binAmber : P.binGray;
          g.add(box(bw, bh, d - 0.08 - rnd() * 0.06, mat, x + bw / 2, y + 0.0125 + bh / 2, j(0.02)));
        }
        x += bw + 0.03 + rnd() * 0.05;
      }
    }
    return g;
  };
  place(rack(1.2, 0.45, 2.0, 5), 5.75, 0.39);
  place(rack(1.2, 0.45, 2.0, 5), 7.05, 0.39);
  place(rack(1.2, 0.45, 2.0, 5), 8.22, 1.42, PI / 2);

  // Case de transporte (flight case): corpo preto, frisos e cantoneiras de alumínio, alças
  const flightCase = (w, h, d, casters = false) => {
    const g = G(), y0 = casters ? 0.08 : 0;
    g.add(box(w, h, d, P.caseBlk, 0, y0 + h / 2, 0));
    for (const y of [y0 + 0.015, y0 + h - 0.015]) g.add(box(w + 0.012, 0.03, d + 0.012, P.alu, 0, y, 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(0.03, h - 0.06, 0.03, P.alu, sx * (w / 2 - 0.01), y0 + h / 2, sz * (d / 2 - 0.01)));
    for (const sx of [-1, 1]) g.add(box(0.03, 0.03, Math.min(0.18, d * 0.4), P.alu, sx * (w / 2 + 0.012), y0 + h * 0.6, 0));
    if (casters) for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(cyl(0.035, 0.035, 0.03, P.trim, sx * (w / 2 - 0.07), 0.04, sz * (d / 2 - 0.07), 10));
    return g;
  };
  place(flightCase(0.6, 0.62, 0.62, true), 5.42, 1.25);                          // rack de amplificadores
  place(flightCase(0.72, 0.16, 0.56), 5.42, 1.25, PI / 2, 0.71);                 // mesa de som em cima
  place(flightCase(0.52, 0.5, 0.5), 5.36, 2.05);                                 // caixas de retorno
  place(flightCase(0.46, 0.4, 0.44), 5.36, 2.05, 0.08, 0.51);
  // Estêncil branco "BASE MUSIC" (logo oficial) nos cases: lateral do rack, tampa da mesa de som e case de cima
  const stencilTex = ctx.makeTex(256, (g2, s) => {
    g2.clearRect(0, 0, s, s);
    logo.draw(g2, s * 0.25, s * 0.04, s * 0.5, { layout: 'mark', color: '#ecebe6' });
    g2.fillStyle = '#ecebe6'; g2.textAlign = 'center'; g2.textBaseline = 'middle';
    g2.font = `700 ${Math.round(s * 0.15)}px ${logo.font}`; g2.fillText('BASE', s / 2, s * 0.68);
    g2.font = `700 ${Math.round(s * 0.1)}px ${logo.font}`; g2.fillText('M U S I C', s / 2, s * 0.84);
  });
  const stencilMat = new THREE.MeshStandardMaterial({ map: stencilTex, alphaTest: 0.5, roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const stencil = (sz, x, y, z, rx, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(sz, sz), stencilMat); m.position.set(x, y, z); m.rotation.set(rx, ry, 0, 'YXZ'); m.receiveShadow = true; add(m); return m; };
  stencil(0.24, 5.7235, 0.26, 1.25, 0, PI / 2);                                   // lateral do rack (abaixo da alça)
  stencil(0.3, 5.42, 0.8715, 1.25, -PI / 2, PI / 2);                              // tampa da mesa de som
  stencil(0.26, 5.36, 0.9115, 2.05, -PI / 2, 0.08);                               // case de retorno de cima
  // Caixa de som PA (grade frontal voltada para a sala)
  add(box(0.44, 0.72, 0.38, P.caseBlk, 5.32, 0.36, 2.78));
  add(box(0.012, 0.6, 0.32, P.grille, 5.546, 0.38, 2.78, nc));
  add(box(0.03, 0.03, 0.16, P.alu, 5.32, 0.735, 2.78));
  // Carretel de cabo e pedestais de microfone deitados no chão
  add(torus(0.16, 0.05, P.trim, 6.05, 0.21, 1.3, 0, PI / 2, 18));
  const reel = cyl(0.1, 0.1, 0.14, P.binAmber, 6.05, 0.21, 1.3, 14); reel.rotation.z = PI / 2; add(reel);
  for (const dx of [-0.05, 0.05]) {                                           // 2 pedestais dobrados no chão
    const s = cyl(0.012, 0.012, 1.0, P.trim, 6.1 + dx, 0.03, 2.05, 8); s.rotation.x = PI / 2; add(s);
    add(cyl(0.02, 0.02, 0.1, P.trim, 6.1 + dx, 0.03, 1.52, 8)).rotation.x = PI / 2;
  }

  // Pilhas de cadeiras empilháveis (estrutura preta, assento/encosto grafite; encosto para +z)
  const chairStack = (n) => {
    const g = G(), dy = 0.055, top = 0.45 + (n - 1) * dy;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(0.025, top, 0.025, P.chairBlk, sx * 0.21, top / 2, sz * 0.2));
    const backTop = top + 0.47;
    for (const sx of [-1, 1]) g.add(box(0.025, backTop - top, 0.025, P.chairBlk, sx * 0.21, (top + backTop) / 2, -0.23 - (n - 1) * 0.01));
    for (let i = 0; i < n; i++) {
      const y = 0.45 + i * dy;
      g.add(box(0.46, 0.05, 0.44, P.upholst, 0, y, 0.02));
      g.add(box(0.44, 0.32, 0.04, P.upholst, 0, y + 0.3, -0.22 - i * 0.01));
    }
    return g;
  };
  place(chairStack(8), 6.15, 3.3, PI);
  place(chairStack(5), 6.72, 3.3, PI);

  // Escada de alumínio (tesoura fechada) encostada na parede x=8,6
  const ladder = () => {
    const g = G(), h = 1.8;
    for (const sz of [-1, 1]) {
      g.add(box(0.04, h, 0.07, P.alu, 0, h / 2, sz * 0.21));                    // montantes
      g.add(box(0.03, h - 0.1, 0.05, P.alu, -0.06, (h - 0.1) / 2, sz * 0.2));   // pernas traseiras fechadas
      g.add(box(0.07, 0.04, 0.09, P.trim, -0.02, 0.02, sz * 0.21));             // sapatas
    }
    for (let i = 0; i < 5; i++) g.add(box(0.1, 0.03, 0.42, P.alu, 0.01, 0.3 + i * 0.3, 0));
    g.add(box(0.14, 0.06, 0.5, P.trim, -0.02, h + 0.03, 0));                     // topo
    return g;
  };
  const lad = place(ladder(), 8.16, 2.42); lad.rotation.z = -0.155;
  // Balde com rodo no canto perto da porta
  add(cyl(0.14, 0.12, 0.28, P.binBlue, 7.15, 0.14, 3.55, 14));
  const mopG = G(); tube(mopG, [7.15, 0.05, 3.55], [7.3, 1.35, 3.62], 0.012, P.woodL); add(mopG);
  add(box(0.34, 0.04, 0.06, P.trim, 7.15, 0.04, 3.55));

  // ======================================== COZINHA ========================================
  // Bancada em L: trecho ao longo de z=0 (x 8,76–11,72) + perna ao longo de x=8,6 (z 0,72–2,3)
  const RUN = { x0: 8.76, x1: 11.72, z: 0.42, d: 0.6 }, runL = RUN.x1 - RUN.x0, runC = (RUN.x0 + RUN.x1) / 2;
  add(box(runL, 0.1, RUN.d - 0.08, P.trim, runC, 0.05, RUN.z - 0.02));                        // rodapé recuado
  add(box(runL, 0.76, RUN.d - 0.02, P.woodL, runC, 0.48, RUN.z - 0.01));                       // gabinetes
  add(box(runL + 0.02, 0.04, RUN.d + 0.02, P.granite, runC, 0.88, RUN.z));                     // tampo de granito
  const LEG = { x: 9.06, z0: 0.72, z1: 2.3 }, legL = LEG.z1 - LEG.z0, legC = (LEG.z0 + LEG.z1) / 2;
  add(box(0.52, 0.1, legL, P.trim, LEG.x - 0.02, 0.05, legC));
  add(box(0.58, 0.76, legL, P.woodL, LEG.x - 0.01, 0.48, legC));
  add(box(0.62, 0.04, legL + 0.02, P.granite, LEG.x, 0.88, legC + 0.01));
  // frentes: frisos e puxadores pretos (o módulo do forno fica sem porta)
  const fz = RUN.z + 0.29;
  for (let i = 1; i < 6; i++) add(box(0.006, 0.7, 0.01, P.trim, RUN.x0 + (runL * i) / 6, 0.48, fz + 0.001, nc));
  for (let i = 0; i < 6; i++) { const cx = RUN.x0 + (runL * (i + 0.5)) / 6; if (Math.abs(cx - 11.1) > 0.3) add(box(0.22, 0.018, 0.02, P.trim, cx, 0.8, fz + 0.012)); }
  for (let i = 1; i < 3; i++) add(box(0.01, 0.7, 0.006, P.trim, LEG.x + 0.285, 0.48, LEG.z0 + (legL * i) / 3, nc));
  for (let i = 0; i < 3; i++) add(box(0.02, 0.018, 0.22, P.trim, LEG.x + 0.297, 0.8, LEG.z0 + (legL * (i + 0.5)) / 3));
  // revestimento (backsplash) nas duas paredes
  add(box(runL, 0.58, 0.012, P.splash, runC, 1.19, 0.094, nc));
  add(box(0.012, 0.58, 2.2, P.splash, 8.683, 1.19, 1.2, nc));
  // Cuba inox com misturador
  place(ctx.F.sink(0.62, 0.42), 9.95, RUN.z, 0, 0.905);
  // Cooktop (vidro preto, 4 bocas) + forno de embutir + coifa inox
  add(box(0.6, 0.012, 0.5, P.glassBlk, 11.1, 0.906, RUN.z));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(flat(cyl(0.075, 0.075, 0.004, P.burner, 11.1 + sx * 0.14, 0.914, RUN.z + sz * 0.12, 16)));
  add(box(0.58, 0.56, 0.012, M.steel, 11.1, 0.48, fz + 0.012));
  add(box(0.46, 0.26, 0.006, P.glassBlk, 11.1, 0.44, fz + 0.021));
  add(box(0.44, 0.02, 0.025, M.chrome, 11.1, 0.7, fz + 0.03));
  place(ctx.F.hood(), 11.1, 0.36, 0, 1.62);
  // Armários aéreos brancos (x 8,76–10,7), portas com frisos e puxadores
  add(box(1.94, 0.7, 0.35, P.cabW, 9.73, 1.85, 0.28));
  for (let i = 1; i < 4; i++) add(box(0.006, 0.66, 0.01, P.trim, 8.76 + (1.94 * i) / 4, 1.85, 0.456, nc));
  for (let i = 0; i < 4; i++) add(box(0.018, 0.16, 0.02, P.trim, 8.76 + (1.94 * (i + 0.5)) / 4 + (i % 2 ? -0.18 : 0.18), 1.62, 0.465));
  // Geladeira inox no canto (x 11,84–12,59)
  place(ctx.F.fridge(), 12.215, 0.47);
  // Micro-ondas na perna do L (porta para +x)
  add(box(0.36, 0.28, 0.5, P.trim, 9.0, 1.04, 1.95));
  add(box(0.006, 0.2, 0.32, P.glassBlk, 9.183, 1.04, 1.89));
  add(box(0.006, 0.22, 0.1, P.steelDk, 9.183, 1.04, 2.13));
  // Estação de café: garrafão elétrico inox + 2 garrafas térmicas
  add(cyl(0.13, 0.13, 0.42, M.steel, 9.05, 1.11, 0.42, 18));
  add(cyl(0.1, 0.13, 0.06, P.trim, 9.05, 1.35, 0.42, 18));
  add(box(0.04, 0.05, 0.06, P.trim, 9.05, 0.97, 0.57));
  for (const [x, m] of [[9.34, P.thermoR], [9.5, P.trim]]) { add(cyl(0.07, 0.07, 0.3, m, x, 1.05, 0.3, 14)); add(cyl(0.05, 0.06, 0.06, P.trim, x, 1.23, 0.3, 12)); }
  // Escorredor com pratos ao lado da cuba
  add(box(0.4, 0.02, 0.3, M.chrome, 10.48, 0.91, RUN.z));
  for (let i = 0; i < 4; i++) { const pl = cyl(0.11, 0.11, 0.012, M.white, 10.36 + i * 0.07, 1.02, RUN.z, 16); pl.rotation.z = PI / 2; add(pl); }
  // Tábua e fruteira na perna do L
  const tb = add(box(0.26, 0.02, 0.4, P.woodL, 9.08, 0.91, 1.3)); tb.rotation.y = 0.1;
  add(cyl(0.14, 0.09, 0.07, P.trim, 9.08, 0.935, 0.95, 16));
  for (const [dx, dz, m] of [[-0.04, 0.03, P.fruitO], [0.05, -0.02, P.fruitO], [0.0, -0.06, P.fruitG]]) add(sph(0.045, m, 9.08 + dx, 1.0, 0.95 + dz));
  // Mesa de apoio inox junto à parede x=12,75 (com prateleira inferior)
  add(box(0.55, 0.03, 1.2, M.steel, 12.32, 0.88, 1.85));
  add(box(0.5, 0.02, 1.14, M.steel, 12.32, 0.2, 1.85));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(cyl(0.018, 0.018, 0.86, M.steel, 12.32 + sx * 0.24, 0.43, 1.85 + sz * 0.56, 8));
  add(cyl(0.17, 0.17, 0.28, M.steel, 12.3, 1.035, 1.5, 18));                    // panelão
  add(cyl(0.175, 0.175, 0.02, M.chrome, 12.3, 1.185, 1.5, 18));
  add(box(0.4, 0.04, 0.3, M.steel, 12.3, 0.915, 2.15));                        // assadeiras
  add(box(0.36, 0.04, 0.28, M.steel, 12.3, 0.955, 2.15));
  add(box(0.4, 0.26, 0.34, P.binW, 12.32, 0.34, 1.55));                        // caixas plásticas embaixo
  add(box(0.4, 0.22, 0.34, P.binAmber, 12.32, 0.32, 2.15));
  // Purificador de água na parede x=8,6 e lixeira de pedal no canto
  add(box(0.1, 0.36, 0.26, P.cabW, 8.73, 1.4, 2.95));
  add(cyl(0.012, 0.012, 0.06, M.chrome, 8.79, 1.2, 2.95, 8));
  add(cyl(0.15, 0.14, 0.46, M.steel, 8.93, 0.23, 3.56, 16));
  add(cyl(0.155, 0.155, 0.03, P.trim, 8.93, 0.475, 3.56, 16));
  // Lousa "Café da Base" com o logo oficial na parede x=12,75 (acima da mesa inox, virada para −x)
  {
    const BW = 0.66, BH = 0.5, A = BH / BW;
    const boardTex = ctx.makeTex(512, (g2, s) => {
      g2.fillStyle = '#26282a'; g2.fillRect(0, 0, s, s);
      g2.save(); g2.scale(1, 1 / A);                                                // área lógica s × s·A
      const hh = s * A, chalk = '#ebe8df';
      logo.draw(g2, s * 0.14, hh * 0.08, s * 0.72, { layout: 'wide', color: chalk });
      g2.fillStyle = chalk; g2.textAlign = 'center'; g2.textBaseline = 'middle';
      g2.fillRect(s * 0.14, hh * 0.52, s * 0.72, 3);
      g2.font = `700 ${Math.round(s * 0.075)}px ${logo.font}`; g2.fillText('CAFÉ DA BASE', s / 2, hh * 0.64);
      g2.font = `400 ${Math.round(s * 0.05)}px ${logo.font}`; g2.fillText('domingo · 8h30 · 10h30 · 18h', s / 2, hh * 0.78);
      g2.fillText('quarta · 19h30', s / 2, hh * 0.9);
      g2.restore();
    });
    add(box(0.02, BH + 0.04, BW + 0.04, P.woodL, 12.664, 1.74, 1.85, nc));
    const bm = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.9 }));
    bm.position.set(12.652, 1.74, 1.85); bm.rotation.y = -PI / 2; bm.receiveShadow = true; add(bm);
  }

  // ========================================= PÁTIO =========================================
  // Coleta seletiva perto do portão, encostada na face externa do almoxarifado (x = 4,825), frente para −x
  const recBin = (mat) => {
    const g = G();
    g.add(box(0.42, 0.78, 0.44, mat, 0, 0.43, 0));
    const lid = box(0.46, 0.05, 0.48, mat, 0, 0.845, 0.01); g.add(lid);
    g.add(box(0.24, 0.16, 0.01, P.binW, 0, 0.6, 0.225, nc));                    // etiqueta
    g.add(box(0.36, 0.03, 0.04, P.trim, 0, 0.8, -0.24));                         // alça
    for (const sx of [-1, 1]) { const w = cyl(0.05, 0.05, 0.04, P.trim, sx * 0.19, 0.05, -0.17, 12); w.rotation.z = PI / 2; g.add(w); }
    return g;
  };
  [P.binBlue, P.binRed, P.binGreen, P.binYel].forEach((m, i) => place(recBin(m), 4.48, 1.0 + i * 0.5, -PI / 2));
  // placa "COLETA SELETIVA" (sinalização)
  const signTex = ctx.makeTex(512, (g2, s) => {
    g2.fillStyle = '#f2f0ea'; g2.fillRect(0, 0, s, s);
    g2.save(); g2.scale(1, s / (s * 0.1875)); g2.fillStyle = '#1e1f22'; g2.font = 'bold 44px sans-serif'; g2.textAlign = 'center'; g2.textBaseline = 'middle';
    g2.fillText('COLETA SELETIVA', s / 2, (s * 0.1875) / 2); g2.restore();
    ['#2f5f9e', '#b23a2e', '#2f7a3e', '#d9a82a'].forEach((c, i) => { g2.fillStyle = c; g2.fillRect((i * s) / 4, s * 0.86, s / 4, s * 0.14); });
  });
  // placa acima da janela do almoxarifado (verga em y 2,15), virada para −x
  add(box(0.02, 0.32, 1.62, P.trim, 4.814, 2.38, 1.75, nc));
  const signM = new THREE.Mesh(new THREE.PlaneGeometry(1.58, 0.28), new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.8 }));
  signM.position.set(4.802, 2.38, 1.75); signM.rotation.y = -PI / 2; add(signM);

  // ---- PAREDÃO DA MARCA (face externa do almoxarifado, z = 3,975, virado para o pátio) ----
  // Ripado de madeira clara igual ao da fachada + logo oficial em letras caixa prateadas.
  // Fica de frente para a câmera inicial (que olha de +z/+x) e vira o "ponto de foto" do pátio.
  {
    const x0 = 5.02, x1 = 7.3, W = x1 - x0, cx = (x0 + x1) / 2, y0 = 0.02, y1 = 2.84, Hh = y1 - y0, ym = (y0 + y1) / 2;
    add(box(W, Hh, 0.02, P.ripaFundo, cx, ym, 3.987, nc));                                   // fundo
    const n = Math.floor((W - 0.03) / 0.075);
    for (let i = 0; i <= n; i++) add(box(0.046, Hh, 0.035, P.ripa, x0 + 0.03 + i * 0.075 + (W - 0.06 - n * 0.075) / 2, ym, 4.0145));
    // sanca preta no topo com fita de LED embaixo (lava o ripado de cima para baixo)
    add(box(W + 0.06, 0.06, 0.16, P.trim, cx, y1 + 0.03, 4.05));
    add(box(W - 0.06, 0.012, 0.025, P.led, cx, y1 - 0.006, 4.1, nc));
    for (const sx of [-1, 1]) add(box(0.03, Hh + 0.06, 0.07, P.trim, cx + sx * (W / 2 + 0.015), ym + 0.03, 4.01));   // perfis laterais
    // logo oficial (anel + B + BASE/CHURCH) em relevo, acende de leve à noite
    const L = logo.relief(1.08, { depth: 0.05, layers: 4 });
    L.position.set(cx, 1.78, 4.034); add(L);
    if (ctx.bindEmissive) ctx.bindEmissive('estacionamento', L.userData.face, 0.6, { min: 0.3 });   // de dia fica branco-prata, à noite brilha
    if (ctx.glowPlane) { const h = ctx.glowPlane(W + 0.3, Hh + 0.3, 'estacionamento', { color: 0xffc98f, base: 0.55, day: 0.12 }); h.position.set(cx, ym + 0.1, 4.1); add(h); }
    // floreira preta ao pé do painel: grama-preta (moreia/ráfis) e 2 uplights
    add(box(W, 0.4, 0.36, P.potBlk, cx, 0.2, 4.245));
    add(box(W - 0.06, 0.02, 0.3, M.soil, cx, 0.39, 4.245, nc));
    for (let k = 0; k < 7; k++) {
      const px = x0 + 0.2 + k * (W - 0.4) / 6;
      if (k === 1 || k === 5) { add(cyl(0.035, 0.04, 0.05, P.spotBody, px, 0.425, 4.16, 10)); add(flat(cyl(0.028, 0.028, 0.006, P.spotLens, px, 0.452, 4.16, 10))); continue; }
      // touceira de grama-preta: lâminas finas abrindo em leque a partir do centro
      const tuft = G();
      for (let i = 0; i < 8; i++) frond(tuft, px + j(0.02), 0.4, 4.245 + j(0.02), 0.34 + rnd() * 0.16, 0.028, (i / 8) * PI * 2 + j(0.3), -(0.75 + rnd() * 0.45), i % 3 ? P.strap : P.leafDk);
      add(tuft);
    }
  }

  // ---- Medalhão com o "B" no piso do pátio (concreto grafite + logo claro + aro de aço) ----
  {
    const mx = 11.1, mz = 10.85;
    add(flat(cyl(0.72, 0.72, 0.012, P.medal, mx, 0.01, mz, 40)));
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.72, 0.755, 48), P.alu); ring.rotation.x = -PI / 2; ring.position.set(mx, 0.0165, mz); ring.receiveShadow = true; add(ring);
    const mk2 = logo.mesh(1.12, 1.12, { layout: 'mark', color: '#e3dfd5', roughness: 0.8 }); mk2.rotation.x = -PI / 2; mk2.position.set(mx, 0.0175, mz); add(mk2);
  }

  // Ipê-amarelo florido em floreira redonda preta (acento âmbar no pátio):
  // tronco + 3 galhos saindo do topo (com ramos finos), copa em guarda-chuva de ~22 tufos pequenos
  // achatados e flores caídas no chão em volta da floreira.
  const ipe = () => {
    const g = G();
    g.add(cyl(0.62, 0.56, 0.45, P.potBlk, 0, 0.225, 0, 24));
    g.add(cyl(0.645, 0.645, 0.04, P.potBlk, 0, 0.45, 0, 24));                  // borda
    g.add(cyl(0.575, 0.575, 0.02, M.soil, 0, 0.462, 0, 22));
    g.add(cyl(0.065, 0.12, 2.05, M.trunk, 0, 1.45, 0, 10));
    const top = [0, 2.42, 0], tips = [[-0.62, 2.98, 0.28], [0.58, 3.02, -0.26], [0.06, 3.12, 0.64], [0.12, 3.0, -0.62]];
    tips.forEach((t, i) => {
      tube(g, i < 3 ? top : [0, 2.1, 0], t, i < 3 ? 0.04 : 0.028, M.trunk);
      const d = V(t[0], 0, t[2]).normalize();
      for (const s of [-1, 1]) {
        const e = [t[0] + (d.x * 0.3 - d.z * 0.22 * s), t[1] + 0.18, t[2] + (d.z * 0.3 + d.x * 0.22 * s)];
        tube(g, t, e, 0.016, M.trunk, 6);
      }
    });
    const mats = [P.ipe, P.ipe3, P.ipe2, P.ipe, P.ipe3, P.ipe, P.ipe2, P.leafLt, P.ipe, P.ipe3, P.ipe];
    for (let i = 0; i < 28; i++) {
      const t = (i + 0.5) / 28, a = i * 2.39996 + j(0.3), rr = 1.08 * Math.sqrt(t);
      const s = sph(0.14 + rnd() * 0.1, mats[i % mats.length], Math.cos(a) * rr + j(0.18), 3.0 + 0.45 * (1 - t) + j(0.12), Math.sin(a) * rr + j(0.18));
      s.scale.set(1, 0.7, 1); s.rotation.y = rnd() * PI; g.add(s);
    }
    for (let i = 0; i < 5; i++) { const a = rnd() * PI * 2, r = 0.15 + rnd() * 0.35; g.add(flat(cyl(0.05, 0.05, 0.004, P.ipe, Math.cos(a) * r, 0.474, Math.sin(a) * r, 8))); }
    return g;
  };
  place(ipe(), 6.1, 6.55);
  // flores caídas no piso em volta da floreira
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * PI * 2 + j(0.25), r = 0.74 + rnd() * 0.55;
    add(flat(cyl(0.05, 0.05, 0.004, i % 3 ? P.ipe : P.ipe2, 6.1 + Math.cos(a) * r, 0.008, 6.55 + Math.sin(a) * r, 8)));
  }

  // Banco ripado de madeira clara com pés pretos (de frente para o jardim interno)
  const bench = (L) => {
    const g = G();
    for (const sx of [-1, 1]) {
      const x = sx * (L / 2 - 0.12);
      g.add(box(0.05, 0.42, 0.05, P.chairBlk, x, 0.21, 0.17)); g.add(box(0.05, 0.8, 0.05, P.chairBlk, x, 0.4, -0.2));
      g.add(box(0.05, 0.04, 0.42, P.chairBlk, x, 0.41, -0.01));
      const bk = box(0.05, 0.42, 0.04, P.chairBlk, x, 0.72, -0.21); bk.rotation.x = -0.12; g.add(bk);
    }
    for (let i = 0; i < 5; i++) g.add(box(L, 0.03, 0.075, P.woodL, 0, 0.445, 0.17 - i * 0.085));
    for (let i = 0; i < 3; i++) { const s = box(L, 0.075, 0.025, P.woodL, 0, 0.62 + i * 0.11, -0.225 - i * 0.013); s.rotation.x = -0.12; g.add(s); }
    g.add(box(L - 0.34, 0.01, 0.02, P.led, 0, 0.422, 0.15, nc));                // fita de LED sob o assento
    return g;
  };
  place(bench(1.6), 7.02, 9.0, PI / 2);

  // Bicicletário junto à parede do templo (z=12,4): 3 arcos galvanizados + 2 bicicletas
  const hoops = G();
  for (const x of [5.95, 6.6, 7.25]) {
    for (const z of [11.15, 11.85]) tube(hoops, [x, 0, z], [x, 0.72, z], 0.024, P.steelG, 10);
    tube(hoops, [x, 0.72, 11.15], [x, 0.72, 11.85], 0.024, P.steelG, 10);
  }
  add(hoops);
  const bicycle = (mat) => {
    const g = G(), R = [0, 0.345, 0.52], Fw = [0, 0.345, -0.52], BB = [0, 0.3, 0.08], S = [0, 0.84, 0.25], Hb = [0, 0.7, -0.4], Hh = [0, 0.86, -0.35];
    for (const w of [R, Fw]) { g.add(torus(0.32, 0.025, M.tire, w[0], w[1], w[2], 0, PI / 2, 24)); const hub = cyl(0.03, 0.03, 0.08, P.alu, w[0], w[1], w[2], 8); hub.rotation.z = PI / 2; g.add(hub); }
    for (const [a, b] of [[BB, S], [BB, Hb], [S, Hh], [BB, R], [S, R], [Hb, Fw], [Hb, Hh]]) tube(g, a, b, 0.016, mat);
    tube(g, S, [0, 0.96, 0.28], 0.012, M.chrome);
    g.add(box(0.12, 0.05, 0.26, P.trim, 0, 0.98, 0.3));                          // selim
    const bar = cyl(0.012, 0.012, 0.5, P.trim, 0, 0.93, -0.38, 8); bar.rotation.z = PI / 2; g.add(bar);
    return g;
  };
  const b1 = place(bicycle(P.bikeT), 6.05, 11.4); b1.rotation.z = -0.05;
  const b2 = place(bicycle(P.bikeK), 7.15, 11.42); b2.rotation.z = 0.05;

  // Abrigo de gás (2 P13) entre a porta do almoxarifado e a janela da cozinha
  add(box(0.5, 1.15, 0.44, M.concrete, 8.9, 0.575, 4.29));
  add(box(0.54, 0.04, 0.48, P.steelDk, 8.9, 1.17, 4.29));
  add(box(0.4, 0.9, 0.012, P.gasDoor, 8.9, 0.55, 4.516));
  for (let i = 0; i < 4; i++) add(box(0.32, 0.03, 0.02, P.steelDk, 8.9, 0.3 + i * 0.16, 4.526));

  // Cica (Cycas) em vaso preto — mesma planta da fachada
  // (pot = false: plantada direto no chão)
  const cycaPot = (s = 1, pot = true) => {
    const g = G(), y0 = pot ? 0 : -0.55 * s;
    if (pot) {
      g.add(cyl(0.3 * s, 0.24 * s, 0.6 * s, P.potBlk, 0, 0.3 * s, 0, 18));
      g.add(cyl(0.27 * s, 0.27 * s, 0.02, M.soil, 0, 0.59 * s, 0, 18));
    }
    g.add(cyl(0.09 * s, 0.11 * s, 0.25 * s, M.trunk, 0, y0 + 0.7 * s, 0, 10));
    const n = 12;
    for (let i = 0; i < n; i++) frond(g, 0, y0 + 0.82 * s, 0, (0.55 + rnd() * 0.15) * s, 0.12 * s, (i / n) * PI * 2 + j(0.12), (i % 2 ? 0.15 : -0.25) + j(0.08), i % 3 ? P.cyca : P.palm);
    g.add(sph(0.07 * s, P.leafLt, 0, y0 + 0.84 * s, 0));
    return g;
  };
  place(cycaPot(1), 12.2, 11.6);
  // Espada-de-são-jorge em vaso preto alto do outro lado da porta de vidro (cabe entre o vão e a parede x=16,05)
  const sansevieria = () => {
    const g = G();
    g.add(cyl(0.22, 0.18, 0.62, P.potBlk, 0, 0.31, 0, 16));
    g.add(cyl(0.2, 0.2, 0.02, M.soil, 0, 0.61, 0, 16));
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * PI * 2 + j(0.2), r = 0.05 + rnd() * 0.07, h = 0.5 + rnd() * 0.35;
      const b = box(0.06, h, 0.012, i % 3 ? P.strap : P.leafDk, Math.cos(a) * r, 0.6 + h / 2, Math.sin(a) * r);
      b.rotation.set(Math.sin(a) * 0.15, -a, -Math.cos(a) * 0.15); g.add(b);
    }
    return g;
  };
  place(sansevieria(), 15.55, 11.6);

  // Spot de chão (embutido, só emissivo — sem luz real)
  const spot = (x, z) => { add(cyl(0.055, 0.06, 0.05, P.spotBody, x, 0.03, z, 12)); add(flat(cyl(0.04, 0.04, 0.008, P.spotLens, x, 0.058, z, 12))); };

  // ==================================== JARDIM INTERNO ====================================
  // Meio-fio de concreto (os lados x=9,45 e z=9,25 são paredes da recepção)
  add(box(0.1, 0.14, 4.4, M.concrete, 7.55, 0.07, 8.0));
  add(box(1.83, 0.14, 0.1, M.concrete, 8.505, 0.07, 5.85));
  add(box(2.85, 0.14, 0.1, M.concrete, 8.875, 0.07, 10.15));
  add(box(0.1, 0.14, 0.77, M.concrete, 10.25, 0.07, 9.715));
  // Pedras brancas: faixa junto ao meio-fio + rodas em volta das palmeiras + seixos soltos
  add(box(0.32, 0.02, 4.2, P.pebble, 7.77, 0.012, 8.0, nc));
  add(box(2.45, 0.02, 0.32, P.pebble, 9.0, 0.013, 9.94, nc));
  add(flat(cyl(0.5, 0.5, 0.02, P.pebble, 8.45, 0.014, 6.75, 20)));
  add(flat(cyl(0.45, 0.45, 0.02, P.pebble, 8.35, 0.014, 8.85, 20)));
  for (let i = 0; i < 9; i++) {
    const onW = i < 5, x = onW ? 7.66 + rnd() * 0.22 : 7.9 + rnd() * 2.2, z = onW ? 6.0 + rnd() * 4.0 : 9.83 + rnd() * 0.22;
    const s = sph(0.03 + rnd() * 0.025, i % 3 ? P.pebble : P.pebble2, x, 0.026, z); s.scale.y = 0.55; s.castShadow = false; add(s);
  }
  // Pedras ornamentais
  for (const [x, z, r] of [[8.0, 7.55, 0.16], [9.1, 7.3, 0.12], [9.75, 9.7, 0.14]]) { const s = sph(r, P.rock, x, r * 0.35, z); s.scale.set(1.3, 0.6, 1); add(s); }
  // Palmeiras: tronco em anéis + folhas em leque
  // folha arqueada: trecho interno subindo + trecho externo (mais estreito) caindo
  const arcFrond = (g, y, len, w, a, droop, mat) => {
    const L1 = len * 0.45, t1 = -0.35, c1 = Math.cos(t1);
    frond(g, 0, y, 0, L1, w, a, t1, mat);
    frond(g, L1 * c1 * Math.cos(a), y - L1 * Math.sin(t1), -L1 * c1 * Math.sin(a), len * 0.55, w * 0.7, a, droop, mat);
  };
  const palm = (h, n, len, w, segs) => {
    const g = G(), sh = h / segs;
    for (let i = 0; i < segs; i++) g.add(cyl(0.07 - i * 0.006, 0.085 - i * 0.006, sh, i % 2 ? M.trunk : M.woodDark, 0, sh * (i + 0.5), 0, 8));
    for (let i = 0; i < n; i++) arcFrond(g, h, len, w, (i / n) * PI * 2 + j(0.15), 0.45 + rnd() * 0.35, i % 2 ? P.palm : M.leaf2);
    g.add(sph(0.08, P.leafLt, 0, h + 0.03, 0));
    return g;
  };
  place(palm(2.5, 8, 1.0, 0.16, 4), 8.45, 6.75);
  place(palm(1.8, 7, 0.85, 0.15, 3), 8.35, 8.85);
  place(cycaPot(0.6, false), 9.85, 9.8);
  // Arbustos (buxinhos) e forração baixa junto à parede da recepção
  const shrub = (x, z, s, m1, m2) => {
    add(sph(0.3 * s, m1, x, 0.26 * s, z)); add(sph(0.22 * s, m2, x - 0.16 * s, 0.22 * s, z + 0.14 * s)); add(sph(0.2 * s, P.leafLt, x + 0.12 * s, 0.28 * s, z - 0.15 * s));
  };
  shrub(9.0, 6.25, 0.9, P.leafDk, M.leaf2); shrub(7.95, 9.6, 0.8, M.plant, P.leafDk); shrub(9.05, 8.2, 0.75, P.leafDk, M.plant);
  for (const z of [7.0, 7.6]) { const f = sph(0.3, P.forr, 9.02, 0.05, z); f.scale.y = 0.3; add(f); }
  for (let i = 0; i < 6; i++) add(sph(0.035, P.flowerT, 8.95 + rnd() * 0.3, 0.12, 6.8 + rnd() * 1.0));
  spot(7.95, 6.75); spot(8.8, 9.3); spot(9.95, 9.45);

  // =================================== JARDIM PASTORAL ===================================
  // Pisantes de concreto: porta da pastoral → pátio, e pátio → porta PM01 (x 16,15–17,0)
  for (const z of [9.62, 10.2, 10.75]) add(flat(box(0.8, 0.04, 0.4, P.slab, 13.35, 0.02, z)));
  for (const x of [14.1, 14.75, 15.4, 16.05, 16.6]) add(flat(box(0.5, 0.04, 0.55, P.slab, x, 0.02, 10.6)));
  // Canteiros com borda metálica preta e forração (grama-amendoim com florzinhas amarelas)
  const bed = (x0, x1, z0, z1) => {
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0;
    add(box(w - 0.02, 0.05, d - 0.02, P.forr, cx, 0.03, cz, nc));
    for (const z of [z0, z1]) add(box(w, 0.08, 0.012, P.trim, cx, 0.04, z, nc));
    for (const x of [x0, x1]) add(box(0.012, 0.08, d, P.trim, x, 0.04, cz, nc));
    const n = Math.round(w * d * 2.8);
    for (let i = 0; i < n; i++) add(flat(sph(0.022, P.flowerY, x0 + 0.08 + rnd() * (w - 0.16), 0.06, z0 + 0.08 + rnd() * (d - 0.16))));
  };
  bed(13.9, 17.05, 9.4, 10.05);
  bed(17.15, 19.93, 9.4, 10.85);
  // Buxinhos em frente ao vidro da pastoral e moreias
  for (const x of [14.35, 15.05, 15.75, 16.55]) { const r = 0.22 + j(0.03); add(sph(r, x === 15.05 ? M.leaf2 : P.leafDk, x, r * 0.95, 9.72)); }
  const G_loose = G(); add(G_loose);                                             // folhas soltas das moreias
  const moreia = (x, z) => {
    for (let i = 0; i < 6; i++) frond(G_loose, x, 0.05, z, 0.42 + rnd() * 0.12, 0.035, (i / 6) * PI * 2 + j(0.2), -1.2 + rnd() * 0.2, P.strap);
    add(sph(0.03, P.binW, x + 0.05, 0.42, z));
  };
  moreia(14.7, 9.72); moreia(16.15, 9.72);
  // Canteiro leste: ráfis no canto, buxinhos e touceiras floridas terracota diante da janela J13
  place(palm(1.3, 7, 0.6, 0.12, 2), 19.4, 10.15);
  shrub(17.65, 10.3, 0.85, P.leafDk, M.leaf2); shrub(18.55, 9.8, 0.7, M.plant, P.leafDk); shrub(19.25, 10.45, 0.75, P.leafDk, M.plant);
  for (const [x, z] of [[18.1, 10.55], [18.95, 10.1]]) {
    add(sph(0.18, M.leaf2, x, 0.16, z));
    for (let i = 0; i < 5; i++) add(sph(0.04, P.flowerT, x + j(0.14), 0.28 + rnd() * 0.06, z + j(0.14)));
  }
  moreia(17.45, 9.75);
  spot(15.4, 9.95); spot(18.2, 9.55); spot(19.55, 10.4);
}

function roomFachada(ctx) {
  const { THREE, M, F, box, cyl, sph, place, add, addExt, std, rnd, makeTex, SPEC, logo, bindEmissive, glowPlane } = ctx;
  const G = () => new THREE.Group();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const j = (k) => (rnd() - 0.5) * 2 * k;                      // jitter determinístico ±k
  const flat = (m) => { m.castShadow = false; return m; };     // peças rasteiras não projetam sombra
  const HT = (SPEC && SPEC.H_TEMPLO) || 8.5, HA = (SPEC && SPEC.H_ALA) || 4.5, HF = (SPEC && SPEC.H_FUNDOS) || 3.6;

  // Paleta local (poucos materiais: tudo é fundido por material depois)
  const P = {
    // ripado bege-rosado claro como na foto (duas tonalidades de ripa, sorteadas, quebram a uniformidade)
    ripa: std({ color: 0xd6b39b, roughness: 0.72 }), ripa2: std({ color: 0xc29b82, roughness: 0.75 }), ripaFundo: std({ color: 0x9c7a64, roughness: 0.85 }),
    mono: std({ color: 0x1b1b1e, roughness: 0.7 }), plate: std({ color: 0x121214, roughness: 0.4, metalness: 0.3 }),   // preto liso (totem, placas)
    alu: std({ color: 0x9a9da2, roughness: 0.35, metalness: 0.7 }),
    upLens: std({ color: 0xfff4dc, emissive: 0xffd9a8, emissiveIntensity: 0.1, roughness: 0.3 }),                    // embutidos no piso (ligados à 'fachada')
    lampLens: std({ color: 0xf6f1e4, emissive: 0xffe6b8, emissiveIntensity: 0.55, roughness: 0.4 }),               // postes da rua (iluminação pública)
    bark: std({ color: 0x5a4a3a, roughness: 1 }),
    leafT1: std({ color: 0x55713a, roughness: 0.95 }), leafT2: std({ color: 0x415d2c, roughness: 0.95 }), leafT3: std({ color: 0x6f8a45, roughness: 0.95 }),
    neigh: std({ color: 0x86837c, roughness: 0.92 }), neigh2: std({ color: 0xa9a399, roughness: 0.92 }), neighCap: std({ color: 0xb4afa5, roughness: 0.9 }),
    neighRoof: std({ color: 0x6d7074, roughness: 0.7, metalness: 0.3 }),
    muro: std({ color: 0xcdc7bb, roughness: 0.95 }), winN: std({ color: 0x2a3440, roughness: 0.15, metalness: 0.5 }),
    black: M.wallDark || std({ color: 0x2b2b2e, roughness: 0.85 }), cap: M.wallDarkCap || std({ color: 0x232326, roughness: 0.8 }),
    frame: M.frameDark || std({ color: 0x18181a, roughness: 0.45, metalness: 0.3 }),
    vase: std({ color: 0x141416, roughness: 0.32, metalness: 0.15 }),
    leafB: std({ color: 0x4c7f3c, roughness: 1 }),
    cyca: std({ color: 0x3d6f2c, roughness: 0.85 }), cyca2: std({ color: 0x2c5a22, roughness: 0.85 }), cycaTrunk: std({ color: 0x5b4632, roughness: 1 }),
    pebble: std({ color: 0xf1f0ec, roughness: 0.95 }), pebble2: std({ color: 0xcfccc4, roughness: 0.95 }), curbW: std({ color: 0xdedbd3, roughness: 0.9 }),
    paint: std({ color: 0xf3f3ef, roughness: 0.8 }), yellow: std({ color: 0xe2b633, roughness: 0.8 }),
    stop: std({ color: 0x9d9a93, roughness: 0.95 }), curb: std({ color: 0xbcb8b0, roughness: 0.95 }),
    walk: std({ color: 0xa8a59d, roughness: 0.95 }), asphalt: std({ color: 0x38393c, roughness: 0.95 }),
    carSilver: std({ color: 0xb9bdc2, roughness: 0.35, metalness: 0.5 }),
    cream: std({ color: 0xe7dcc5, roughness: 0.55, metalness: 0.15 }),   // treliça, calha e tubos (como na foto)
    unit: std({ color: 0xe8e8e4, roughness: 0.5 }), grille: std({ color: 0x2a2b2e, roughness: 0.6, metalness: 0.2 }),
    slab: std({ color: 0xa4a19a, roughness: 0.95 }), tank: std({ color: 0x2f6db3, roughness: 0.45 }),
  };

  // ---- texturas procedurais (canvas) ----------------------------------------------------------
  // Telha termoacústica trapezoidal: 4 ondas por metro, correndo no sentido do caimento (x)
  const roofTex = makeTex(256, (g, s) => {
    g.fillStyle = '#aeb3b8'; g.fillRect(0, 0, s, s);
    const p = s / 4;
    for (let i = 0; i < 4; i++) {
      const y = i * p;
      g.fillStyle = '#c9cdd1'; g.fillRect(0, y, s, p * 0.22);                 // crista
      g.fillStyle = '#8f959b'; g.fillRect(0, y + p * 0.22, s, p * 0.1);       // aba de sombra
      g.fillStyle = '#b8bcc0'; g.fillRect(0, y + p * 0.9, s, p * 0.1);        // aba de luz
    }
  }, [1, 37]);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: roofTex, roughness: 0.5, metalness: 0.45 });
  // Revestimento amadeirado da lateral alta (acima da ala direita) e forro do beiral
  const cladTex = makeTex(256, (g, s) => {
    const rr = mulberry(9), ph = s / 8;
    for (let i = 0; i < 8; i++) {
      const v = 0.85 + rr() * 0.25;
      g.fillStyle = `rgb(${(122 * v) | 0},${(86 * v) | 0},${(58 * v) | 0})`; g.fillRect(0, i * ph, s, ph);
      g.fillStyle = 'rgba(40,24,14,0.55)'; g.fillRect(0, i * ph + ph - 3, s, 3);
      for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(${rr() < 0.5 ? '70,45,28' : '160,120,85'},${(rr() * 0.25).toFixed(2)})`; g.fillRect(rr() * s, i * ph + rr() * ph, 8 + rr() * 40, 1 + rr() * 2); }
    }
  }, [15, 2]);
  const cladMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: cladTex, roughness: 0.8 });
  function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // ---- builders locais ------------------------------------------------------------------------
  // barra (caixa) entre dois pontos — treliças e tubos retos
  const bar = (put, a, b, w, mat) => {
    const A = V(...a), B = V(...b), d = B.clone().sub(A);
    const m = box(d.length(), w, w, mat, 0, 0, 0);
    m.position.copy(A).add(B).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(V(1, 0, 0), d.normalize());
    return put(m);
  };
  // folha comprida saindo de (cx,cy,cz): ângulo `a` no plano, inclinação `t` (positivo = caindo); devolve a ponta
  const frond = (g, cx, cy, cz, len, w, a, t, mat) => {
    const m = box(len, 0.018, w, mat, 0, 0, 0), L = len / 2, ct = Math.cos(t);
    m.position.set(cx + L * ct * Math.cos(a), cy - L * Math.sin(t), cz - L * ct * Math.sin(a));
    m.rotation.set(0, a, -t); m.castShadow = true; g.add(m);
    return [cx + len * ct * Math.cos(a), cy - len * Math.sin(t), cz - len * ct * Math.sin(a)];
  };
  // painel ripado de madeira clara (x 7,2–10,66, saliente em z 49,73–49,83) entre y0 e y1
  const ripado = (put, y0, y1) => {
    const x0 = 7.2, x1 = 10.66, h = y1 - y0, ym = (y0 + y1) / 2;
    put(box(x1 - x0, h, 0.05, P.ripaFundo, (x0 + x1) / 2, ym, 49.755));
    const n = Math.floor((x1 - x0 - 0.03) / 0.075);
    for (let i = 0; i <= n; i++) put(box(0.046, h, 0.04, rnd() < 0.3 ? P.ripa2 : P.ripa, x0 + 0.035 + i * 0.075, ym, 49.8));
  };

  // =================================================================================================
  // (a) MODO NORMAL — frente térrea, jardins, estacionamento e ruas
  // =================================================================================================

  // ---- Painel ripado de 0 a 8,5 m + letreiro BASE CHURCH: SEMPRE visíveis (a identidade do prédio vista da rua) ----
  const Y0 = 3.0, LX = 8.93;
  ripado(add, 0, HT);
  add(box(3.46, HT - Y0, 0.1, P.mono, LX, (HT + Y0) / 2, 49.69));   // contra-placa preta (quem olha do hall vê preto; embutida na parede alta no modo Fachada)
  add(box(3.54, 0.06, 0.24, P.cap, LX, HT + 0.03, 49.74));                                 // tampa no topo
  for (const x of [7.185, 10.675]) add(box(0.03, HT, 0.2, P.cap, x, HT / 2, 49.74));       // perfis laterais do painel
  // letreiro em letras caixa prateadas (logo oficial), afastadas do ripado; a face acende com a luz 'fachada'
  const LOGO_W = 2.4, LOGO_Y = 4.9;                                                        // BASE ≈ 70 % da largura do painel; y 3,4–6,4 (foto)
  const sign = logo.relief(LOGO_W, { depth: 0.09, layers: 4, weight: 0.045 });
  sign.position.set(LX, LOGO_Y, 49.822); add(sign);
  bindEmissive('fachada', sign.userData.face, 0.9);
  const halo = glowPlane(3.3, 3.9, 'fachada', { color: 0xffe9cc, base: 0.45, day: 0.1 });   // retroiluminação (halo atrás das letras)
  halo.position.set(LX, LOGO_Y, 49.826); add(halo);
  // embutidos de piso no pedrisco lavando o ripado de baixo para cima (faixas de luz verticais à noite)
  bindEmissive('fachada', P.upLens, 1.6);
  for (const x of [7.88, 8.63, 9.38, 10.12]) {
    add(flat(cyl(0.065, 0.065, 0.03, P.grille, x, 0.045, 49.97, 14)));
    add(flat(cyl(0.048, 0.048, 0.008, P.upLens, x, 0.062, 49.97, 14)));
    const w = glowPlane(0.7, 3.4, 'fachada', { color: 0xffc98a, base: 0.5, day: 0.05 }); w.position.set(x, 1.45, 49.828); add(w);
  }

  // ---- Porta principal: portal preto em volta do vão + bandeira de vidro escuro sobre as folhas ----
  for (const x of [10.78, 13.22]) add(box(0.2, 3.0, 0.22, P.frame, x, 1.5, 49.83));        // ombreiras do portal (fora do vão 10,9–13,1)
  add(box(2.22, 0.66, 0.02, M.glassDark, 12.0, 2.63, 49.74, { cast: false, receive: false }));   // bandeira
  add(box(2.22, 0.05, 0.05, P.frame, 12.0, 2.3, 49.75, { cast: false }));
  add(box(2.22, 0.05, 0.05, P.frame, 12.0, 2.96, 49.75, { cast: false }));
  // adesivo branco (logo horizontal) na bandeira de vidro, como o vinil das portas de vidro das igrejas
  const vin = logo.mesh(1.2, 0, { layout: 'wide', color: '#f1f1ee', opacity: 0.92, cast: false }); vin.position.set(12.0, 2.63, 49.757); add(vin);

  // ---- Jardineiras: cerca-viva densa + faixa de pedrisco branco + guia branca ----
  // folhagem miúda da cerca-viva podada (textura de folhas + relevo pela própria textura)
  const leafTex = makeTex(256, (g, s) => {
    g.fillStyle = '#23411f'; g.fillRect(0, 0, s, s);
    const rr = mulberry(31), cols = ['#2f5a29', '#3a6a30', '#4c7f3c', '#5f9147', '#27481f', '#436f35'];
    for (let i = 0; i < 2600; i++) {
      const x = rr() * s, y = rr() * s, a = rr() * Math.PI;
      g.fillStyle = cols[(rr() * cols.length) | 0];
      for (const [dx, dy] of [[0, 0], [s, 0], [-s, 0], [0, s], [0, -s]]) { g.beginPath(); g.ellipse(x + dx, y + dy, 2.5 + rr() * 3.5, 1.4 + rr() * 1.8, a, 0, Math.PI * 2); g.fill(); }
    }
  });
  const hedge = (x0, x1, z0, z1, h) => {
    const t = leafTex.clone(); t.needsUpdate = true; t.repeat.set((x1 - x0) / 0.45, h / 0.45);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: t, bumpMap: t, bumpScale: 3, roughness: 1 });
    add(box(x1 - x0, h - 0.05, z1 - z0, mat, (x0 + x1) / 2, (h - 0.05) / 2, (z0 + z1) / 2));
    // tufos irregulares (a poda nunca é perfeita): quebram a silhueta no topo e na frente
    const n = Math.round((x1 - x0) * 5);
    for (let i = 0; i < n; i++) {
      const x = x0 + 0.1 + rnd() * (x1 - x0 - 0.2), top = rnd() < 0.55, r = 0.12 + rnd() * 0.08;
      const m = top ? sph(r, mat, x, h - 0.07, z0 + 0.12 + rnd() * (z1 - z0 - 0.24)) : sph(r, mat, x, 0.2 + rnd() * (h - 0.4), z1 - 0.05);
      if (top) m.scale.set(1.4, 0.5, 1); else m.scale.set(1.3, 1, 0.45);
      add(m);
    }
  };
  hedge(0.2, 6.85, 49.82, 50.44, 1.02);        // frente da sala da família (sob a janela)
  hedge(13.42, 15.94, 49.82, 50.46, 1.14);     // à direita da porta
  // pedrisco branco (faixa da frente e todo o canteiro dos vasos)
  for (const [x0, x1, z0, z1] of [[0.13, 6.9, 50.44, 50.83], [6.9, 10.58, 49.84, 50.83], [13.32, 15.98, 50.46, 50.83]]) {
    add(flat(box(x1 - x0, 0.03, z1 - z0, P.pebble, (x0 + x1) / 2, 0.015, (z0 + z1) / 2)));
    const n = Math.round((x1 - x0) * (z1 - z0) * 5);
    for (let i = 0; i < n; i++) { const m = sph(0.028 + rnd() * 0.02, P.pebble2, x0 + 0.05 + rnd() * (x1 - x0 - 0.1), 0.03, z0 + 0.04 + rnd() * (z1 - z0 - 0.08)); m.scale.set(1, 0.45, 1); add(flat(m)); }
  }
  // guias brancas das jardineiras (frente e cabeceiras)
  for (const [x0, x1] of [[0.1, 10.6], [13.3, 16.0]]) {
    add(box(x1 - x0, 0.08, 0.05, P.curbW, (x0 + x1) / 2, 0.04, 50.83, { cast: false }));
    for (const x of [x0 + 0.025, x1 - 0.025]) add(box(0.05, 0.08, 1.07, P.curbW, x, 0.04, 50.29, { cast: false }));
  }

  // ---- Vasos altos pretos com palmeiras cicas, na frente do painel ripado ----
  const cycas = (x, z, h, seed) => {
    const g = G(), rr = mulberry(seed);
    g.add(cyl(0.19, 0.13, h, P.vase, 0, h / 2, 0, 20));
    g.add(cyl(0.2, 0.2, 0.03, P.vase, 0, h - 0.015, 0, 20));
    g.add(cyl(0.175, 0.175, 0.02, M.soil, 0, h - 0.035, 0, 16));
    g.add(cyl(0.065, 0.085, 0.16, P.cycaTrunk, 0, h + 0.05, 0, 10));
    // coroa de folhas pinadas: sobem firmes e arqueiam na ponta (a ponta é mais estreita)
    const n = 16, top = h + 0.12;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rr() * 0.3, rise = -0.45 - rr() * 0.45, mat = i % 2 ? P.cyca : P.cyca2;
      const tip = frond(g, 0, top, 0, 0.27 + rr() * 0.07, 0.085, a, rise, mat);
      frond(g, tip[0], tip[1], tip[2], 0.24 + rr() * 0.08, 0.055, a + (rr() - 0.5) * 0.15, 0.1 + rr() * 0.3, mat);
    }
    // folhas novas (centro, mais claras e em pé)
    for (let i = 0; i < 4; i++) frond(g, 0, top, 0, 0.22, 0.09, i * Math.PI / 2 + 0.4, -1.15, P.leafB);
    place(g, x, z, rr() * Math.PI);
  };
  [[7.52, 0.62], [8.26, 0.86], [9.0, 0.62], [9.74, 0.86], [10.42, 0.62]].forEach(([x, h], i) => cycas(x, 50.3, h, 40 + i));

  // ---- Estacionamento frontal (piso de espinha de peixe já é a zona do cartão) ----
  // guia de concreto entre a calçada grafite e o intertravado
  add(flat(box(26.0, 0.008, 0.1, P.curbW, 10.0, 0.008, 51.0)));
  // vagas a 90° (2,5 × 4,8 m), de frente para o prédio; passagem livre na frente da porta (x 10,3–15,0)
  const L0 = 51.3, L1 = 56.1, Lm = (L0 + L1) / 2;
  const stallX = [-2.2, 0.3, 2.8, 5.3, 7.8, 10.3];
  for (const x of stallX) add(flat(box(0.1, 0.006, L1 - L0, P.paint, x, 0.007, Lm)));
  for (let i = 0; i < stallX.length - 1; i++) {
    const xc = (stallX[i] + stallX[i + 1]) / 2;
    add(box(1.5, 0.12, 0.16, P.stop, xc, 0.06, 51.85));                    // batente de concreto
    add(flat(box(1.5, 0.004, 0.05, P.yellow, xc, 0.122, 51.85)));          // faixa amarela no topo
  }
  // 2 vagas PCD (azuis, com símbolo de cadeira de rodas) + faixa zebrada de embarque entre elas
  const PW = 6.2, PD = L1 - L0, PX0 = 15.0;
  const pcdTex = makeTex(1024, (g, s) => {
    g.save(); g.scale(s / PW, s / PD);          // desenha em metros: x → largura, y → profundidade (0 = lado do prédio)
    const blue = (x0) => {
      g.fillStyle = '#2f76b2'; g.fillRect(x0, 0, 2.5, PD);
      g.strokeStyle = '#f4f4f0'; g.lineWidth = 0.1; g.strokeRect(x0 + 0.05, 0.05, 2.4, PD - 0.1);
      // símbolo internacional de acesso (branco), perto da entrada da vaga
      const cx = x0 + 1.2, cy = 3.25, k = 1.25;
      g.save(); g.translate(cx, cy); g.scale(k, k);
      g.fillStyle = '#f4f4f0'; g.strokeStyle = '#f4f4f0'; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.arc(-0.08, -0.52, 0.1, 0, Math.PI * 2); g.fill();
      g.lineWidth = 0.1;
      g.beginPath(); g.moveTo(-0.1, -0.34); g.lineTo(-0.06, 0.04); g.lineTo(0.28, 0.04); g.lineTo(0.42, 0.4); g.lineTo(0.56, 0.36); g.stroke();
      g.beginPath(); g.moveTo(-0.08, -0.17); g.lineTo(0.2, -0.17); g.stroke();
      g.lineWidth = 0.08; g.beginPath(); g.arc(-0.04, 0.26, 0.33, -0.1 * Math.PI, 1.3 * Math.PI); g.stroke();
      g.restore();
    };
    blue(0); blue(3.7);
    // faixa de embarque (x 2,5–3,7): contorno + zebrado diagonal
    g.strokeStyle = '#f4f4f0'; g.lineWidth = 0.1; g.strokeRect(2.55, 0.05, 1.1, PD - 0.1);
    g.save(); g.beginPath(); g.rect(2.55, 0.05, 1.1, PD - 0.1); g.clip();
    g.lineWidth = 0.09; for (let y = -1.2; y < PD + 0.6; y += 0.45) { g.beginPath(); g.moveTo(2.5, y + 1.2); g.lineTo(3.7, y); g.stroke(); }
    g.restore();
    g.restore();
  });
  pcdTex.wrapS = pcdTex.wrapT = THREE.ClampToEdgeWrapping;
  const pcd = new THREE.Mesh(new THREE.PlaneGeometry(PW, PD), new THREE.MeshStandardMaterial({ map: pcdTex, alphaTest: 0.5, roughness: 0.85 }));
  pcd.rotation.x = -Math.PI / 2; pcd.position.set(PX0 + PW / 2, 0.009, Lm); pcd.castShadow = false; pcd.receiveShadow = true; add(pcd);
  for (const xc of [PX0 + 1.25, PX0 + 4.95]) { add(box(1.5, 0.12, 0.16, P.stop, xc, 0.06, 51.85)); add(flat(box(1.5, 0.004, 0.05, P.yellow, xc, 0.122, 51.85))); }
  // placa de vaga PCD (poste + placa azul) na cabeceira de cada vaga, junto à calçada
  for (const xc of [PX0 + 0.35, PX0 + 4.05]) {
    add(cyl(0.03, 0.03, 1.9, P.grille, xc, 0.95, 50.93, 8));
    add(box(0.42, 0.42, 0.02, std({ color: 0x2f76b2, roughness: 0.6 }), xc, 1.72, 50.95));
    add(box(0.16, 0.2, 0.024, P.paint, xc, 1.72, 50.95, { cast: false }));
  }
  // dois carros estacionados de frente para o prédio (vagas livres ao lado dos postes)
  place(F.car(), 1.55, 53.75, 0);
  const car2 = F.car(); car2.traverse((o) => { if (o.material === M.car) o.material = P.carSilver; }); place(car2, -0.95, 53.75, 0);

  // ---- Limites do estacionamento, calçada pública e rua da frente (z > 60) ----
  for (const x of [-3.07, 23.07]) add(box(0.14, 0.12, 10.3, P.curb, x, 0.06, 54.85, { cast: false }));
  add(flat(box(26.0, 0.02, 0.2, P.curbW, 10.0, 0.01, 60.1)));                       // soleira rebaixada (entrada de carros)
  const street = (zc, dir) => {
    // calçada (2,2 m) + meio-fio + pista de 7 m com faixa central amarela tracejada e bordas brancas
    const zw = zc - dir * 4.7;                                                       // centro da calçada
    add(flat(box(140, 0.025, 2.2, P.walk, 10, 0.0125, zw)));
    const zk = zw + dir * 1.18;
    add(box(140, 0.12, 0.15, P.curb, 10, 0.06, zk, { cast: false }));
    add(flat(box(140, 0.02, 7.0, P.asphalt, 10, 0.01, zc)));
    for (const s of [-1, 1]) add(flat(box(140, 0.004, 0.1, P.paint, 10, 0.022, zc + s * 3.25)));
    for (let x = -34; x <= 54; x += 6) add(flat(box(3.0, 0.004, 0.12, P.yellow, x, 0.022, zc)));
    // calçada do outro lado
    add(box(140, 0.12, 0.15, P.curb, 10, 0.06, zc + dir * 3.58, { cast: false }));
    add(flat(box(140, 0.025, 2.4, P.walk, 10, 0.0125, zc + dir * 4.85)));
  };
  street(66.0, 1);     // rua da frente (pista z 62,5–69,5)
  street(-6.0, -1);    // rua dos fundos (pista z −9,5…−2,5)
  // guia rebaixada em frente ao portão dos fundos
  add(flat(box(4.6, 0.02, 0.4, P.curbW, 2.5, 0.03, -2.38)));
  // ---- Arborização: copa em cachos (várias esferas pequenas achatadas), tronco com galhos ----
  const tree = (x, z, s, seed) => {
    const g = G(), rr = mulberry(seed), H0 = 2.1 * s;
    g.add(cyl(0.09 * s, 0.15 * s, H0, P.bark, 0, H0 / 2, 0, 8));
    for (let i = 0; i < 3; i++) {
      const a = i * 2.1 + rr(), r = 0.55 * s;
      bar((m) => g.add(m), [0, H0 - 0.15, 0], [Math.cos(a) * r, H0 + 0.55 * s, Math.sin(a) * r], 0.06 * s, P.bark);
    }
    const mats = [P.leafT1, P.leafT2, P.leafT3];
    for (let i = 0; i < 13; i++) {
      const a = rr() * Math.PI * 2, d = Math.sqrt(rr()) * 1.0 * s, y = H0 + (0.45 + rr() * 0.75) * s - d * 0.25;
      const m = sph((0.38 + rr() * 0.26) * s, mats[i % 3], Math.cos(a) * d, y, Math.sin(a) * d); m.scale.set(1, 0.72, 1); g.add(m);
    }
    place(g, x, z, rr() * Math.PI);
  };
  for (const [x, z, s] of [[-5.2, 55.0, 1.1], [25.2, 55.0, 1.1]]) tree(x, z, s, 70 + x | 0);          // laterais do estacionamento
  for (const [x, s] of [[-12, 1.0], [1.5, 0.95], [19.6, 0.95], [32, 1.05]]) tree(x, 61.6, s, 80 + x | 0);   // calçada da frente (sem esconder o letreiro)
  for (const [x, s] of [[4, 1.0], [16, 1.05]]) tree(x, -10.9, s, 90 + x | 0);                           // calçada dos fundos (lado oposto da rua)

  // ---- Postes de iluminação pública na calçada da frente (braço sobre a rua) ----
  for (const x of [-7.5, 27.5]) {
    const z = 61.9;
    add(cyl(0.17, 0.2, 0.35, P.curb, x, 0.175, z, 12));
    add(cyl(0.06, 0.1, 8.0, P.grille, x, 4.2, z, 10));
    bar(add, [x, 7.9, z], [x, 8.25, z + 1.7], 0.07, P.grille);
    add(box(0.28, 0.12, 0.62, P.grille, x, 8.2, z + 1.95));
    add(box(0.22, 0.02, 0.5, P.lampLens, x, 8.13, z + 1.95, { cast: false }));
  }

  // ---- Vizinhos (volumes simples, sem roubar a cena) e muros de divisa ----
  const neighbor = (x0, x1, z0, z1, h, face) => {
    add(box(x1 - x0, h, z1 - z0, P.neigh, (x0 + x1) / 2, h / 2, (z0 + z1) / 2));
    add(box(x1 - x0 + 0.1, 0.1, z1 - z0 + 0.1, P.neighCap, (x0 + x1) / 2, h + 0.05, (z0 + z1) / 2, { cast: false }));        // platibanda
    add(box(x1 - x0 - 0.5, 0.02, z1 - z0 - 0.5, P.neighRoof, (x0 + x1) / 2, h + 0.11, (z0 + z1) / 2, { cast: false }));   // telhado metálico (a platibanda vira só a borda)
    const xf = face < 0 ? x0 - 0.012 : x1 + 0.012;                                          // janelas na face voltada para a igreja
    for (let z = z0 + 3.5; z < z1 - 2; z += 6.5) add(box(0.02, 1.1, 2.4, P.winN, xf, h * 0.55, z, { cast: false }));
    // frente: vitrine + porta de enrolar
    add(box(Math.min(5, x1 - x0 - 2), 2.2, 0.02, P.winN, x0 + (x1 - x0) * 0.35, 1.3, z1 + 0.012, { cast: false }));
    add(box(2.6, 2.6, 0.03, P.neigh2, x0 + (x1 - x0) * 0.8, 1.3, z1 + 0.015, { cast: false }));
  };
  neighbor(-14, -4.2, 4, 46, 4.0, 1);
  neighbor(24.4, 32, 10, 46, 3.0, -1);
  for (const x of [-3.35, 23.45]) {
    add(box(0.15, 2.2, 49.6, P.muro, x, 1.1, 24.8));
    add(box(0.21, 0.05, 49.64, P.neighCap, x, 2.225, 24.8, { cast: false }));
  }

  // ---- Totem de entrada (monólito preto com face ripada e o logo em relevo), na calçada à esquerda ----
  {
    const g = G(), TWd = 1.3, THt = 4.0, TD = 0.42, B0 = 0.3;
    g.add(box(1.9, B0, 1.0, P.curbW, 0, B0 / 2, 0));                                       // floreira/base de concreto branco
    g.add(flat(box(1.8, 0.02, 0.9, P.pebble, 0, B0 + 0.01, 0)));                            // pedrisco
    g.add(box(TWd, THt, TD, P.mono, 0, B0 + THt / 2, 0));
    g.add(box(TWd + 0.04, 0.05, TD + 0.04, P.cap, 0, B0 + THt + 0.025, 0));
    const fw = TWd - 0.2, fh = THt - 0.3, fy = B0 + 0.15 + fh / 2, zf = TD / 2;
    g.add(box(fw, fh, 0.02, P.ripaFundo, 0, fy, zf + 0.01));
    for (let x = -fw / 2 + 0.03; x < fw / 2 - 0.02; x += 0.075) g.add(box(0.046, fh, 0.03, rnd() < 0.3 ? P.ripa2 : P.ripa, x, fy, zf + 0.035));
    const R = logo.relief(0.86, { depth: 0.05, layers: 3, weight: 0.045 }); R.position.set(0, B0 + 2.85, zf + 0.052); g.add(R);
    bindEmissive('fachada', R.userData.face, 0.9);
    // placa preta com o endereço
    g.add(box(1.0, 0.26, 0.02, P.plate, 0, B0 + 1.45, zf + 0.062));
    const A = 1.0 / 0.2;                                                                     // proporção da placa de texto (1,0 × 0,2 m)
    const addrTex = makeTex(1024, (c, s) => {
      c.setTransform(1, 0, 0, A, 0, 0);
      const hS = s / A; c.fillStyle = '#eeeeea'; c.strokeStyle = '#eeeeea'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = `700 ${Math.round(hS * 0.62)}px ${logo.font}`; c.lineWidth = hS * 0.03;
      c.fillText('802 SUL · PALMAS', s / 2, hS * 0.52, s * 0.94); c.strokeText('802 SUL · PALMAS', s / 2, hS * 0.52, s * 0.94);
    });
    addrTex.wrapS = addrTex.wrapT = THREE.ClampToEdgeWrapping;
    const addr = new THREE.Mesh(new THREE.PlaneGeometry(0.94, 0.188), new THREE.MeshStandardMaterial({ map: addrTex, alphaTest: 0.5, roughness: 0.4,
      emissive: 0xfff4e6, emissiveMap: addrTex, emissiveIntensity: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    addr.position.set(0, B0 + 1.45, zf + 0.073); addr.castShadow = false; g.add(addr);
    bindEmissive('fachada', addr.material, 0.8);
    // verso: marca (anel + B) em branco
    const back = logo.mesh(0.7, 0, { layout: 'mark', color: '#e9e9e6' }); back.rotation.y = Math.PI; back.position.set(0, B0 + 3.1, -TD / 2 - 0.004); g.add(back);
    // embutido no pedrisco + faixa de luz lavando a face ripada
    g.add(flat(box(0.16, 0.03, 0.08, P.grille, 0, B0 + 0.03, zf + 0.2)));
    g.add(flat(box(0.12, 0.008, 0.05, P.upLens, 0, B0 + 0.047, zf + 0.2)));
    const w = glowPlane(1.15, 2.8, 'fachada', { color: 0xffc98a, base: 0.5, day: 0.05 }); w.position.set(0, B0 + 1.4, zf + 0.056); g.add(w);
    place(g, -1.85, 50.32, 0.35);
  }

  // ---- Placa com a marca no muro dos fundos, ao lado do portão (para quem chega pela rua de trás) ----
  add(box(0.72, 0.72, 0.02, P.plate, 6.3, 2.0, -0.105, { cast: false }));
  { const m = logo.mesh(0.6, 0, { layout: 'mark', color: '#e9e9e6' }); m.rotation.y = Math.PI; m.position.set(6.3, 2.0, -0.117); add(m); }

  // ---- Paraciclo (3 arcos de aço) na calçada da direita, fora das vagas PCD ----
  for (const x of [21.55, 22.05, 22.55]) {
    for (const z of [49.95, 50.55]) add(cyl(0.022, 0.022, 0.75, P.alu, x, 0.375, z, 8));
    bar(add, [x, 0.75, 49.95], [x, 0.75, 50.55], 0.044, P.alu);
  }

  // =================================================================================================
  // (b) MODO FACHADA — paredes altas, platibandas, cobertura, beiral com treliça e letreiro
  // =================================================================================================
  const TW = 0.19;                                           // cobre a tampa (0,18) das paredes de 3,0 m
  const wX = (z, x0, x1, y0, y1, mat = P.black) => addExt(box(x1 - x0, y1 - y0, TW, mat, (x0 + x1) / 2, (y0 + y1) / 2, z));
  const wZ = (x, z0, z1, y0, y1, mat = P.black) => addExt(box(TW, y1 - y0, z1 - z0, mat, x, (y0 + y1) / 2, (z0 + z1) / 2));
  const capX = (z, x0, x1, y) => addExt(box(x1 - x0 + 0.04, 0.05, TW + 0.06, P.cap, (x0 + x1) / 2, y + 0.025, z, { cast: false }));
  const capZ = (x, z0, z1, y) => addExt(box(TW + 0.06, 0.05, z1 - z0 + 0.04, P.cap, x, y + 0.025, (z0 + z1) / 2, { cast: false }));
  const e = TW / 2;

  // ---- Cobertura do bloco templo + hall: meia-água caindo para a ala direita (x+), beiral até x 17,45 ----
  const RX0 = 0.1, RX1 = 17.45, RY0 = HT - 0.3, RY1 = HT - 0.95, RZ0 = 12.5, RZ1 = 49.55;
  const slope = (RY0 - RY1) / (RX1 - RX0), roofY = (x) => RY0 - (x - RX0) * slope;   // topo da telha
  const ang = Math.atan(slope), RL = (RX1 - RX0) / Math.cos(ang);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(RL, 0.1, RZ1 - RZ0), roofMat);
  roof.position.set((RX0 + RX1) / 2, roofY((RX0 + RX1) / 2) - 0.05, (RZ0 + RZ1) / 2); roof.rotation.z = -ang;
  roof.castShadow = true; roof.receiveShadow = true; addExt(roof);
  const under = (x) => roofY(x) - 0.1;                                                 // face de baixo da telha

  // ---- Paredes altas (pretas) do bloco templo + hall: frente, esquerda e fundo até 8,5 m ----
  wX(49.65, -e, 16.05 + e, Y0, HT); capX(49.65, -e, 16.05 + e, HT);
  wZ(0, 12.4 - e, 49.65 + e, Y0, HT); capZ(0, 12.4 - e, 49.65 + e, HT);
  wX(12.4, -e, 16.05 + e, Y0, HT); capX(12.4, -e, 16.05 + e, HT);
  // lateral direita: preta dentro da ala, revestimento amadeirado acima do telhado da ala até o beiral
  const WING_TOP = HA - 0.25;                                                          // telhado da ala (atrás das platibandas)
  wZ(16.05, 12.4, 49.65, Y0, WING_TOP + 0.05);
  wZ(16.05, 12.4 + e, 49.65 - e, WING_TOP + 0.05, under(16.05) + 0.04, cladMat);
  // pilares aparentes na divisa (x = 0) continuando os de baixo até a platibanda
  for (const z of [12.4, 16.9, 21.4, 25.9, 30.4, 35.0, 39.5, 44.0]) addExt(box(0.2, HT - 3.05, 0.4, P.black, -0.1, (HT + 3.05) / 2, z));

  // ---- Beiral lateral: treliças metálicas creme em balanço, forro amadeirado e calha (foto, canto sup. direito) ----
  const xw = 16.05 + e;
  addExt(box(RX1 - xw, 0.02, RZ1 - RZ0, cladMat, (xw + RX1) / 2, under((xw + RX1) / 2) - 0.02, (RZ0 + RZ1) / 2, { cast: false }));   // forro sob o beiral
  addExt(box(0.14, 0.34, RZ1 - RZ0 + 0.1, P.cream, RX1 + 0.07, roofY(RX1) - 0.12, (RZ0 + RZ1) / 2));                                  // calha / testeira
  const put = (m) => addExt(m);
  for (const z of [12.9, 16.9, 21.4, 25.9, 30.4, 35.0, 39.5, 44.0, 49.1]) {
    const yt = (x) => under(x) - 0.06, yb = (x) => under(x) - 0.06 - 0.75 * (RX1 - 0.05 - x) / (RX1 - 0.05 - xw) - 0.06;
    const xs = [xw, 16.55, 16.95, RX1 - 0.05];
    bar(put, [xw, yt(xw), z], [RX1, yt(RX1), z], 0.06, P.cream);                   // banzo superior
    bar(put, [xw, yb(xw), z], [xs[3], yb(xs[3]), z], 0.06, P.cream);               // banzo inferior (inclinado)
    for (let i = 1; i < 3; i++) bar(put, [xs[i], yb(xs[i]), z], [xs[i], yt(xs[i]), z], 0.04, P.cream);   // montantes
    for (let i = 0; i < 3; i++) bar(put, [xs[i], yt(xs[i]), z], [xs[i + 1], yb(xs[i + 1]), z], 0.04, P.cream);   // diagonais
    addExt(box(0.03, 0.9, 0.14, P.cream, xw + 0.015, yt(xw) - 0.38, z));           // chapa de fixação na parede
  }
  // tubos de descida da calha até o telhado da ala
  for (const z of [21.0, 33.5, 46.2]) addExt(cyl(0.05, 0.05, roofY(RX1) - 0.3 - WING_TOP, P.cream, RX1 + 0.07, (roofY(RX1) - 0.3 + WING_TOP) / 2, z, 10));
  // cabos/tubulação descendo pela parede até a condensadora da frente
  for (const [dz, r] of [[0, 0.022], [0.07, 0.016], [0.13, 0.03]]) addExt(cyl(r, r, under(16.05) - 0.2 - WING_TOP, P.cream, xw + 0.04, (under(16.05) - 0.2 + WING_TOP) / 2, 48.55 + dz, 8));

  // ---- Ala direita (x 16,05–20,1 · z 11,0–49,5) até 4,5 m ----
  wX(49.5, 16.05 + e, 20.1 + e, Y0, HA); capX(49.5, 16.05 + e, 20.1 + e, HA);
  wZ(20.1, 11.0 - e, 49.5 + e, Y0, HA); capZ(20.1, 11.0 - e, 49.5 + e, HA);
  wX(11.0, 16.05 - e, 20.1 + e, Y0, HA); capX(11.0, 16.05 - e, 20.1 + e, HA);
  wZ(16.05, 11.0 - e, 12.4 - e, Y0, HA); capZ(16.05, 11.0 + e, 12.4 - e, HA);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(20.1 - e - xw, 0.08, 49.5 - e - (11.0 + e)), roofMat);
  wing.position.set((xw + 20.1 - e) / 2, WING_TOP - 0.04, (49.5 - e + 11.0 + e) / 2); wing.castShadow = true; wing.receiveShadow = true; addExt(wing);

  // ---- Bloco dos fundos (almoxarifado, cozinha, recepção, pastoral, caixa d'água) até 3,6 m ----
  wX(0, 4.9 - e, 20.1 + e, Y0, HF); capX(0, 4.9 - e, 20.1 + e, HF);
  wZ(20.1, -e, 9.25 + e, Y0, HF); capZ(20.1, -e, 9.25 + e, HF);
  wX(9.25, 9.45 - e, 20.1 + e, Y0, HF); capX(9.25, 9.45 - e, 20.1 + e, HF);
  wZ(9.45, 5.9 - e, 9.25 + e, Y0, HF); capZ(9.45, 5.9 - e, 9.25 + e, HF);
  wX(5.9, 9.45 - e, 12.75 + e, Y0, HF); capX(5.9, 9.45 - e, 12.75 + e, HF);
  wZ(12.75, 3.9 - e, 5.9 + e, Y0, HF); capZ(12.75, 3.9 - e, 5.9 + e, HF);
  wX(3.9, 4.9 - e, 12.75 + e, Y0, HF); capX(3.9, 4.9 - e, 12.75 + e, HF);
  wZ(4.9, -e, 3.9 + e, Y0, HF); capZ(4.9, -e, 3.9 + e, HF);
  const SLAB = HF - 0.3;                                                               // laje impermeabilizada
  for (const [x0, z0, x1, z1] of [[4.9, 0, 12.75, 3.9], [9.45, 5.9, 12.75, 9.25], [12.75, 0, 20.1, 9.25]]) {
    addExt(box(x1 - x0 - 0.02, 0.12, z1 - z0 - 0.02, P.slab, (x0 + x1) / 2, SLAB - 0.06, (z0 + z1) / 2));
  }
  // caixa d'água (reservatório azul) sobre a casa de máquinas
  addExt(box(1.8, 0.1, 1.8, P.slab, 18.55, SLAB + 0.05, 1.6));
  addExt(cyl(0.72, 0.78, 1.0, P.tank, 18.55, SLAB + 0.6, 1.6, 24));
  addExt(cyl(0.76, 0.76, 0.08, P.tank, 18.55, SLAB + 1.14, 1.6, 24));
  addExt(cyl(0.2, 0.2, 0.06, P.tank, 18.55, SLAB + 1.21, 1.6, 12));

  // ---- Condensadoras do ar-condicionado ----
  // (a) splits da ala/templo: unidades de parede no telhado da ala, encostadas na parede alta (foto)
  const cond = (x, y, z, face) => {
    addExt(box(0.34, 0.66, 0.9, P.unit, x, y + 0.08 + 0.33, z));
    addExt(box(0.3, 0.08, 0.06, P.grille, x, y + 0.04, z - 0.35)); addExt(box(0.3, 0.08, 0.06, P.grille, x, y + 0.04, z + 0.35));
    const fan = cyl(0.24, 0.24, 0.02, P.grille, x + face * 0.175, y + 0.42, z - 0.1, 20); fan.rotation.z = Math.PI / 2; addExt(fan);
    addExt(box(0.02, 0.5, 0.18, P.grille, x + face * 0.175, y + 0.42, z + 0.3, { cast: false }));
  };
  for (const z of [22.1, 29.6, 38.6, 41.6, 47.6]) cond(16.62, WING_TOP, z, 1);
  // (b) VRF do templo sobre a laje do almoxarifado (descarga para cima) e a da pastoral
  for (const x of [6.3, 7.9]) {
    addExt(box(1.0, 1.15, 0.72, P.unit, x, SLAB + 0.08 + 0.575, 2.0));
    addExt(cyl(0.3, 0.3, 0.05, P.grille, x, SLAB + 0.08 + 1.17, 2.0, 20));
    addExt(box(0.96, 0.7, 0.02, P.grille, x, SLAB + 0.55, 2.37, { cast: false }));
    addExt(box(0.9, 0.08, 0.1, P.grille, x, SLAB + 0.04, 2.0));
  }
  cond(14.9, SLAB, 1.0, 1);

  // ---- Fachada: painel ripado (parte alta), portal da porta e letreiro BASE CHURCH ----
  addExt(box(2.64, 0.5, 0.22, P.frame, 12.0, Y0 + 0.25, 49.83));                     // verga preta do portal
  // (o painel ripado alto e o letreiro BASE CHURCH ficam no modo normal: ver o início do arquivo)
  // câmera de segurança (canto esquerdo) e sensor branco (canto direito), como na foto
  addExt(box(0.12, 0.1, 0.18, P.grille, 0.9, 6.3, 49.83)); addExt(cyl(0.05, 0.05, 0.16, P.unit, 0.9, 6.24, 49.95, 10)).rotation.x = Math.PI / 2;
  addExt(box(0.28, 0.16, 0.06, P.unit, 15.3, 6.0, 49.78, { cast: false }));
}
// @rooms-end

// ---------------------------------------------------------------------------
// O cartão
// ---------------------------------------------------------------------------
const CSS = `
:host { display: block; position: relative; height: var(--igreja3d-height, calc(100vh - 100px)); min-height: 360px;
  border-radius: var(--ha-card-border-radius, 12px); overflow: hidden; background: #0a0f1e;
  font: 13px/1.35 var(--primary-font-family, -apple-system, BlinkMacSystemFont, Roboto, "Segoe UI", sans-serif); color: #e6edf7; }
.wrap { position: absolute; inset: 0; }
canvas { display: block; width: 100%; height: 100%; touch-action: none; outline: none; cursor: grab; }
canvas.pick { cursor: pointer; }
canvas:active { cursor: grabbing; }
.hud { position: absolute; left: 0; right: 0; display: flex; gap: 8px; padding: 10px; pointer-events: none; box-sizing: border-box; }
.hud > * { pointer-events: auto; }
.hud.top { top: 0; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; }
.panel { background: rgba(10, 14, 26, .72); border: 1px solid rgba(255, 255, 255, .09); border-radius: 10px;
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
.title { padding: 8px 12px; display: flex; flex-direction: column; gap: 2px; }
.title b { font-size: 15px; font-weight: 700; letter-spacing: .01em; }
.title .sub { color: #9aa6bd; font-size: 12px; font-variant-numeric: tabular-nums; }
.title .clock { color: #e6edf7; font-size: 12.5px; font-weight: 600; font-variant-numeric: tabular-nums; letter-spacing: .01em; }
.title .clock .per { color: #ffd48a; font-weight: 700; }
.title .clock .suntimes { color: #9aa6bd; font-weight: 500; }
.btns { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
.seg { display: inline-flex; padding: 3px; gap: 2px; }
button { appearance: none; border: 0; background: transparent; color: #d5dcea; font: inherit; font-weight: 600; font-size: 12px;
  padding: 6px 10px; border-radius: 7px; cursor: pointer; letter-spacing: .01em; }
button:hover { background: rgba(255, 255, 255, .08); }
button:focus-visible { outline: 2px solid #ffc46b; outline-offset: 1px; }
button[aria-pressed="true"] { background: rgba(255, 196, 107, .18); color: #ffd48a; }
.btn { padding: 9px 12px; }
.wrap::before, .wrap::after { content: ""; position: absolute; left: 0; right: 0; height: 120px; pointer-events: none; }
.wrap::before { top: 0; background: linear-gradient(rgba(6, 9, 18, .55), transparent); }
.wrap::after { bottom: 0; background: linear-gradient(transparent, rgba(6, 9, 18, .6)); }
.hint { color: #8f9bb3; font-size: 11px; white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis; transition: opacity .6s; }
.hint.hide { opacity: 0; }
.err { position: absolute; inset: 0; display: grid; place-items: center; padding: 24px; text-align: center; color: #ffb4b4; background: #0a0f1e; }
/* Painel inferior (dock) */
.dock { position: absolute; left: 10px; right: 10px; bottom: 10px; max-height: min(48%, 372px); display: flex; flex-direction: column; overflow: hidden; z-index: 3; }
.dock[hidden] { display: none; }
.tabs { display: flex; gap: 2px; padding: 6px 6px 6px 8px; border-bottom: 1px solid rgba(255, 255, 255, .08); flex: none; align-items: center; }
.tabs button[role="tab"] { padding: 7px 12px; font-size: 12px; }
.tabs button[aria-selected="true"] { background: rgba(255, 196, 107, .16); color: #ffd48a; }
.tabs .spacer { flex: 1; }
.tabs .count { color: #8f9bb3; font-size: 11px; font-variant-numeric: tabular-nums; padding: 0 8px; white-space: nowrap; }
.tabs .collapse { width: 30px; height: 28px; padding: 0; display: grid; place-items: center; }
.pane { overflow: auto; padding: 10px; display: none; overscroll-behavior: contain; }
.pane.active { display: block; }
.tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(126px, 1fr)); gap: 8px; }
.tile .top { display: flex; align-items: center; justify-content: space-between; }
.tile .eyebrow { display: block; font-size: 9.5px; letter-spacing: .1em; text-transform: uppercase; color: #8f9bb3; font-weight: 700; margin-bottom: 3px; }
.tile.on .eyebrow { color: #c9b48a; }
.tile { aspect-ratio: 1 / 1; min-height: 112px; border-radius: 14px; background: rgba(255, 255, 255, .05); border: 1px solid rgba(255, 255, 255, .08); color: #d5dcea;
  display: flex; flex-direction: column; justify-content: space-between; align-items: stretch; padding: 10px; text-align: left; position: relative; transition: background .2s, border-color .2s, transform .1s; }
.tile:hover { background: rgba(255, 255, 255, .09); }
.tile:active { transform: scale(.98); }
.tile .ico { width: 22px; height: 22px; color: #6b768f; display: flex; transition: color .25s, filter .25s; }
.tile .ico svg { width: 22px; height: 22px; }
.tile b { display: block; font-size: 13px; font-weight: 700; line-height: 1.2; color: #eef2f8; }
.tile small { display: block; color: #8f9bb3; font-size: 11px; margin-top: 2px; line-height: 1.25; }
.tile.on { background: rgba(255, 196, 107, .15); border-color: rgba(255, 196, 107, .45); }
.tile.on .ico { color: var(--dot, #ffc46b); filter: drop-shadow(0 0 6px var(--dot, #ffc46b)); }
.tile.on small { color: #dfe6f3; }
.tile.unavailable { opacity: .45; }
.tile.flash { box-shadow: 0 0 0 2px #ffd48a inset; }
.tile .more { width: 26px; height: 22px; padding: 0; border-radius: 7px; background: rgba(255, 255, 255, .08); color: #c9d2e3; font-size: 14px; line-height: 22px; text-align: center; letter-spacing: .05em; cursor: pointer; }
.tile .more:hover { background: rgba(255, 255, 255, .18); }
.tile.routine { aspect-ratio: auto; min-height: 96px; justify-content: flex-start; gap: 8px; }
.tile.routine .ico { width: 30px; height: 30px; border-radius: 9px; background: rgba(255, 196, 107, .12); color: #ffd48a; display: grid; place-items: center; }
.tile.routine .ico svg { width: 18px; height: 18px; }
.tile.routine:hover { background: rgba(255, 196, 107, .1); border-color: rgba(255, 196, 107, .3); }
.detail { grid-column: 1 / -1; box-sizing: border-box; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; padding: 10px 12px; border-radius: 12px; background: rgba(255, 255, 255, .05); border: 1px solid rgba(255, 196, 107, .3); }
.detail[hidden] { display: none; }
.detail .dtitle { display: flex; align-items: center; gap: 8px; margin-right: auto; }
.detail .dtitle .ico { color: var(--dot, #ffc46b); display: flex; }
.detail .dtitle b { font-size: 13px; } .detail .dtitle small { color: #8f9bb3; font-size: 11px; display: block; }
.detail .close { width: 26px; height: 26px; padding: 0; border-radius: 7px; background: rgba(255, 255, 255, .08); }
.sw { width: 40px; height: 22px; border-radius: 999px; background: #2b3245; position: relative; padding: 0; border: 1px solid rgba(255, 255, 255, .1); transition: background .2s; flex: none; }
.sw::after { content: ""; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #aab3c5; transition: transform .2s, background .2s; }
.sw[aria-checked="true"] { background: #ffb85a; border-color: #ffb85a; } .sw[aria-checked="true"]::after { transform: translateX(18px); background: #1a1200; }
.seg2 { display: inline-flex; gap: 2px; padding: 2px; background: rgba(255, 255, 255, .05); border-radius: 8px; }
.seg2 button { padding: 5px 8px; font-size: 11px; }
.timerseg .tlab { display: inline-flex; align-items: center; gap: 4px; padding: 0 6px 0 4px; font-size: 11px; color: #8f9bb3; }
.step { display: inline-flex; align-items: center; gap: 4px; }
.step button { width: 28px; height: 28px; padding: 0; border-radius: 7px; background: rgba(255, 255, 255, .06); font-size: 16px; line-height: 1; }
.step output { min-width: 40px; text-align: center; font-variant-numeric: tabular-nums; font-weight: 700; font-size: 13px; }
.mbtn { width: 32px; height: 28px; padding: 0; border-radius: 7px; background: rgba(255, 255, 255, .06); display: inline-grid; place-items: center; font-size: 15px; }
input[type="range"] { flex: 1; min-width: 110px; accent-color: #ffc46b; }
.swatches { display: flex; gap: 6px; } .swatch { width: 22px; height: 22px; border-radius: 50%; border: 2px solid rgba(255, 255, 255, .18); padding: 0; }
.swatch:hover { transform: scale(1.12); }
.sect { margin: 4px 2px 8px; font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; color: #8f9bb3; font-weight: 700; display: flex; justify-content: space-between; align-items: baseline; }
.sect small { text-transform: none; letter-spacing: 0; font-weight: 500; font-size: 11px; }
.tiles + .sect { margin-top: 14px; }
.autos { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 6px 10px; }
.auto { display: grid; grid-template-columns: 22px 1fr auto auto; align-items: center; gap: 8px; padding: 7px 8px; border-radius: 10px; background: rgba(255, 255, 255, .04); border: 1px solid rgba(255, 255, 255, .07); }
.auto .ico { color: #6b768f; display: flex; } .auto.on .ico { color: #ffd48a; filter: drop-shadow(0 0 5px #ffd48a); }
.auto b { display: block; font-size: 12.5px; font-weight: 600; } .auto small { color: #8f9bb3; font-size: 11px; }
.auto.off b { color: #9aa6bd; }
.auto .run { width: 30px; height: 26px; padding: 0; border-radius: 7px; background: rgba(255, 255, 255, .07); display: inline-grid; place-items: center; }
.autos .empty { color: #8f9bb3; font-size: 12px; padding: 6px 2px; }
.feed { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 0 18px; }
.feed li { display: grid; grid-template-columns: 10px 1fr auto; gap: 10px; align-items: center; padding: 7px 4px; border-bottom: 1px solid rgba(255, 255, 255, .05); font-size: 12px; }
.feed .d { width: 8px; height: 8px; border-radius: 50%; background: #4b5468; } .feed li.on .d { background: var(--dot, #ffc46b); box-shadow: 0 0 6px var(--dot, #ffc46b); }
.feed b { font-weight: 600; } .feed time { color: #8f9bb3; font-variant-numeric: tabular-nums; font-size: 11px; text-align: right; }
.feed .empty { color: #8f9bb3; padding: 12px 4px; font-size: 12px; }
.reopen { position: absolute; left: 50%; bottom: 12px; transform: translateX(-50%); padding: 8px 14px; z-index: 3; }
.reopen[hidden] { display: none; }
/* Clima ao vivo — canto inferior direito, some quando o painel de automações abre por cima */
.weather { position: absolute; right: 10px; bottom: 10px; width: 168px; box-sizing: border-box; padding: 10px 12px; z-index: 3;
  display: flex; flex-direction: column; gap: 4px; transition: opacity .25s, transform .25s; }
.weather[hidden] { display: none; }
.weather.out { opacity: 0; transform: translateY(6px); pointer-events: none; }
.weather .wtop { display: flex; align-items: center; gap: 8px; }
.weather .wicon { width: 30px; height: 30px; color: #ffc46b; flex: none; display: flex; }
.weather .wicon svg { width: 30px; height: 30px; }
.weather .wtemp { font-size: 26px; font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; }
.weather .wtemp sup { font-size: 15px; font-weight: 600; opacity: .8; }
.weather .wcond { font-size: 12px; color: #c9d2e3; line-height: 1.25; }
.weather .wcity { font-size: 10.5px; letter-spacing: .06em; text-transform: uppercase; color: #8f9bb3; font-weight: 700; }
.weather .wmeta { display: flex; justify-content: space-between; font-size: 11px; color: #9aa6bd; font-variant-numeric: tabular-nums; margin-top: 2px; }
.weather .wupd { font-size: 10px; color: #6b768f; text-align: right; }
@media (max-width: 640px) {
  .weather { width: 140px; padding: 8px 10px; }
  .weather .wtemp { font-size: 22px; } .weather .wicon, .weather .wicon svg { width: 24px; height: 24px; }
}
@media (max-width: 640px) {
  .dock { height: 50%; left: 6px; right: 6px; bottom: 6px; }
  .tiles { grid-template-columns: repeat(auto-fill, minmax(98px, 1fr)); gap: 6px; }
  .tile { min-height: 96px; padding: 8px; border-radius: 12px; } .tile b { font-size: 12px; } .tile small { font-size: 10.5px; } .tile .eyebrow { font-size: 9px; }
  .tile.routine { grid-column: span 2; }
  .tabs button[role="tab"] { padding: 7px 8px; } .tabs .count { display: none; }
  .hud.top { flex-direction: column; flex-wrap: nowrap; align-items: stretch; gap: 6px; }   /* sem wrap: a linha teria a largura do maior item */

  .title { flex-direction: row; flex-wrap: wrap; align-items: baseline; column-gap: 10px; row-gap: 0; padding: 6px 10px; }
  .title b { font-size: 14px; }
  .btns { flex-wrap: nowrap; justify-content: flex-start; overflow-x: auto; scrollbar-width: none; padding-bottom: 2px; }
  .btns::-webkit-scrollbar { display: none; }
  .btns > * { flex: none; }
  .btn { padding: 7px 10px; }
  .hint { display: none; }
}
/* celular em retrato: os botões quebram em duas linhas em vez de rolar escondidos */
@media (max-width: 480px) {
  .btns { flex-wrap: wrap; overflow: visible; gap: 6px; }
  .btn { padding: 6px 9px; font-size: 11.5px; } .seg button { padding: 5px 8px; font-size: 11.5px; }
}
@media (prefers-reduced-motion: reduce) { .tile, .tile .ico, .sw, .sw::after { transition: none; } }
`;

export class Igreja3DCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = Object.assign({}, DEFAULT_CONFIG);
    this._lite = this._liteFor(this._config.quality);
    this._nightVision = true;
    this._state = {};          // key -> { on, state, attrs }
    this._lastChanged = {};    // key -> ISO da última mudança (do HA)
    this._activity = [];       // histórico: { key, state, ts }
    this._autos = []; this._autoLast = {};   // automações do HA
    this._panelOpen = false;
    this._items = new Map();   // key -> runtime (lights, meshes, chip)
    this._built = false;
    this._raf = 0;
    this._lastSig = '';
    this._mode = 'auto';
    this._night = true;
    this._clock = new THREE.Clock(false);
    this._hoverObj = null;
    this._reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // ---- API Lovelace ----
  static getStubConfig() { return { title: 'Base Church' }; }
  getCardSize() { return 12; }
  getLayoutOptions() { return { grid_columns: 'full', grid_rows: 8, grid_min_rows: 5 }; }

  setConfig(config) {
    this._config = Object.assign({}, DEFAULT_CONFIG, config || {});
    this._lite = this._liteFor(this._config.quality);   // no HA a posição real vem de hass.config
    this._mode = ['auto', 'day', 'night'].includes(this._config.mode) ? this._config.mode : 'auto';
    this._nightVision = this._config.night_vision !== false;
    if (this._config.height) this.style.setProperty('--igreja3d-height', String(this._config.height));
    if (this._built) {
      this._titleEl.textContent = this._config.title || 'Base Church';
      this._setLabels(!!this._config.labels);
      this._applyMode();
      this._lastSig = ''; if (this._hass) this._syncFromHass();
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (this._built) this._syncFromHass();
  }
  get hass() { return this._hass; }

  entity(key) {
    const e = this._config.entities || {};
    return e[key] || DEFAULT_ENTITIES[key];
  }

  connectedCallback() {
    if (!this._built) this._build(); else this._timersOn();
    this._start();
  }
  // o HA desanexa/reanexa o cartão ao trocar de vista: os intervalos param e voltam junto
  disconnectedCallback() { this._stop(); this._timersOff(); }
  _timersOn() {
    if (!this._feedTimer && this._built) this._feedTimer = setInterval(() => { if (this._panelOpen) this._renderPanel(); this._updateTime(true); }, 30000);
    if (!this._weatherTimer && this._weatherUI) this._weatherTimer = setInterval(() => this._fetchWeather(), 15 * 60000);
  }
  _timersOff() { clearInterval(this._feedTimer); clearInterval(this._weatherTimer); this._feedTimer = this._weatherTimer = 0; }

  // ---- Construção do DOM ----
  _build() {
    const root = this.shadowRoot;
    root.innerHTML = '';
    const style = document.createElement('style'); style.textContent = CSS; root.appendChild(style);
    const wrap = document.createElement('div'); wrap.className = 'wrap'; root.appendChild(wrap);
    const canvas = document.createElement('canvas'); canvas.tabIndex = 0; canvas.setAttribute('aria-label', 'Modelo 3D da igreja'); wrap.appendChild(canvas);
    this._canvas = canvas;

    const top = document.createElement('div'); top.className = 'hud top'; wrap.appendChild(top); this._hudTop = top;
    const title = document.createElement('div'); title.className = 'panel title';
    this._titleEl = document.createElement('b'); this._titleEl.textContent = this._config.title || 'Base Church';
    this._clockEl = document.createElement('span'); this._clockEl.className = 'clock'; this._clockEl.textContent = '—';
    this._subEl = document.createElement('span'); this._subEl.className = 'sub'; this._subEl.textContent = '—';
    title.append(this._titleEl, this._clockEl, this._subEl); top.appendChild(title);

    const btns = document.createElement('div'); btns.className = 'btns'; top.appendChild(btns);
    const seg = document.createElement('div'); seg.className = 'panel seg'; seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', 'Iluminação ambiente');
    this._modeBtns = {};
    for (const [m, lbl] of [['auto', 'Auto'], ['day', 'Dia'], ['night', 'Noite']]) {
      const b = document.createElement('button'); b.textContent = lbl; b.dataset.mode = m;
      b.addEventListener('click', () => { this._mode = m; this._applyMode(); });
      seg.appendChild(b); this._modeBtns[m] = b;
    }
    btns.appendChild(seg);
    this._nvBtn = document.createElement('button'); this._nvBtn.className = 'panel btn'; this._nvBtn.textContent = 'Visão noturna';
    this._nvBtn.title = 'À noite, deixa a igreja inteira visível (luz de lua)';
    this._nvBtn.addEventListener('click', () => { this._nightVision = !this._nightVision; this._applyMode(); });
    btns.appendChild(this._nvBtn);
    this._labelsBtn = document.createElement('button'); this._labelsBtn.className = 'panel btn'; this._labelsBtn.textContent = 'Rótulos';
    this._labelsBtn.addEventListener('click', () => this._setLabels(!this._labelsOn));
    btns.appendChild(this._labelsBtn);
    const reset = document.createElement('button'); reset.className = 'panel btn'; reset.textContent = 'Recentrar';
    reset.addEventListener('click', () => this._resetView());
    btns.appendChild(reset);
    this._roofBtn = document.createElement('button'); this._roofBtn.className = 'panel btn'; this._roofBtn.textContent = 'Fachada';
    this._roofBtn.title = 'Mostra a fachada, paredes altas e cobertura';
    this._roofBtn.addEventListener('click', () => this._setRoof(!this._roofOn));
    btns.appendChild(this._roofBtn);
    this._panelBtn = document.createElement('button'); this._panelBtn.className = 'panel btn'; this._panelBtn.textContent = 'Painel';
    this._panelBtn.addEventListener('click', () => this._setPanel(!this._panelOpen));
    btns.appendChild(this._panelBtn);

    this._hint = document.createElement('div'); this._hint.className = 'hint';
    this._hint.textContent = 'Arraste para girar · roda/pinça para zoom · clique num ambiente para acender';
    title.appendChild(this._hint);
    setTimeout(() => { if (!this._hint) return; this._hint.classList.add('hide'); setTimeout(() => { this._hint.hidden = true; }, 700); }, 9000);

    try {
      this._build3D(canvas);
    } catch (err) {
      const e = document.createElement('div'); e.className = 'err';
      e.textContent = 'Não foi possível iniciar o WebGL: ' + (err && err.message || err);
      wrap.appendChild(e);
      console.error('[igreja3d-card]', err);
      return;
    }

    this._buildPanel(wrap);
    if (this._ro) this._ro.observe(this._dock);
    this._built = true;
    this._timersOn();
    this._setLabels(!!this._config.labels);
    this._applyMode();
    this._setPanel(this._config.panel !== false);
    this._setRoof(!!(this._config.fachada != null ? this._config.fachada : this._config.roof));   // `fachada:` (ou `roof:`, como no casa3d)
    if (this._hass) this._syncFromHass();
    else this._applyDemoDefaults();
  }

  // quality: 'alta' | 'leve' | 'auto' (padrão): leve em celular/tablet (toque + tela < 900 px) ou com ≤ 4 GB de RAM
  static _strongGPU() {
    if (Igreja3DCard.__gpu !== undefined) return Igreja3DCard.__gpu;
    let strong = false;
    try {
      const cv = document.createElement('canvas');
      const gl = cv.getContext('webgl2') || cv.getContext('webgl');
      if (gl) {
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) || '');
        strong = /nvidia|geforce|quadro|rtx|gtx|radeon\s*(rx|pro)|apple m\d|apple gpu/i.test(name) && !/intel|swiftshader|llvmpipe|mali|adreno|powervr/i.test(name);
        const lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
      }
    } catch (_) { strong = false; }
    Igreja3DCard.__gpu = strong;
    return strong;
  }
  _liteFor(q) {
    if (q === 'leve') return true;
    if (q === 'alta') return false;
    try {
      const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
      const small = typeof screen !== 'undefined' && Math.min(screen.width, screen.height) < 900;
      if ((coarse && small) || (navigator.deviceMemory || 8) <= 4) return true;
      // desktop/notebook: 'alta' só com GPU dedicada; integrada (Intel, AMD Vega/APU etc.) ou desconhecida → leve
      return !Igreja3DCard._strongGPU();
    } catch (_) { return true; }
  }

  // ---- Cena 3D ----
  _build3D(canvas) {
    const M = materials();
    // MSAA só compensa com DPR baixo; no leve com DPR ≥ 1,5 ele pesa e rende pouco
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !this._lite || (window.devicePixelRatio || 1) < 1.5, powerPreference: 'high-performance' });
    // Neutral (r162+): preto da "Igreja Preta" fica preto, roxo do palco e telão saturados, branco estoura menos que no ACES
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.0;
    // Salvaguarda de GPU: 26 PointLights + 9 sombras usam ~250 vec4 de uniforms e 13 samplers por programa PBR;
    // o mínimo do WebGL2 é 224 vetores de fragment. Em GPU apertada (ou no leve) corta luzes fracas e sombras.
    const caps = renderer.capabilities;
    this._tight = caps.maxFragmentUniforms < 512 || caps.maxTextures < 16;
    if (this._tight) console.warn(`[igreja3d-card] GPU com margem pequena (fragment uniforms ${caps.maxFragmentUniforms}, samplers ${caps.maxTextures}): luzes fracas viram só halo e sombras só nas principais`);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = this._lite ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;   // cena estática: sombras só recalculam quando algo muda
    this._renderer = renderer;

    const scene = new THREE.Scene();
    this._scene = scene;
    renderer.setClearColor(0x0a0f1e, 1);
    scene.fog = new THREE.Fog(0x0a0f1e, 70, 240);
    this._buildSky(scene, renderer);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.3, 400);
    this._camera = camera;
    this._home = this._homeFor(1.6);
    camera.position.copy(this._home.pos); camera.lookAt(this._home.target);
    this._orbit = new Orbit(camera, canvas, this._home.target);
    this._orbit.onClick = (e) => this._onClick(e);
    this._orbit.onHover = (e) => this._onHover(e);

    // Luz ambiente (dia/noite). Um único direcional faz de sol (dia) e de lua (noite).
    const C = new THREE.Vector3(LOT.cx, 0, LOT.cz);   // centro do lote
    this._hemi = new THREE.HemisphereLight(0xbfd8ff, 0x8a8070, 1.6); scene.add(this._hemi);
    this._amb = new THREE.AmbientLight(0x4a5a80, 0.25); scene.add(this._amb);
    this._sun = new THREE.DirectionalLight(0xfff0d2, 3.2);
    this._sunDist = 60;
    this._sunPos = new THREE.Vector3(-0.42, 1, 0.55).normalize();   // direção do sol no modo "Dia" (ilumina a fachada)
    this._moonPos = C.clone().addScaledVector(new THREE.Vector3(11, 20, -9).normalize(), this._sunDist);
    this._sunCol = new THREE.Color(0xfff0d2); this._moonCol = new THREE.Color(0x8fa6d8);
    this._sun.position.copy(C).addScaledVector(this._sunPos, this._sunDist); this._sun.target.position.copy(C);
    this._sun.castShadow = true;
    this._sun.shadow.mapSize.set(this._lite ? 1024 : 2048, this._lite ? 1024 : 2048);
    // cobre x −4…24 · z −4…62 (meia-diagonal ≈ 36 m) em qualquer direção do sol
    const sc = this._sun.shadow.camera; sc.left = -38; sc.right = 38; sc.top = 38; sc.bottom = -38; sc.near = 1; sc.far = 125;
    this._sun.shadow.bias = -0.0006; this._sun.shadow.normalBias = 0.04;
    scene.add(this._sun); scene.add(this._sun.target);

    // Terreno (grama) — grande, sem recortes
    const GS = 800;   // passa do domo do céu: o horizonte some na neblina
    const gmat = M.ground.clone(); gmat.color.setHex(0xd8d6c8); gmat.map = textures().grassDry.clone(); gmat.map.repeat.set(GS / 2.2, GS / 2.2);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(GS, GS), gmat);
    ground.rotation.x = -Math.PI / 2; ground.position.set(LOT.cx, -0.03, LOT.cz); ground.receiveShadow = true;   // 3 cm abaixo dos pisos (y 0,004): sem z-fighting grama × piso em vista rasante
    ground.userData.noMerge = true; scene.add(ground);

    this._clickables = []; this._labels = []; this._zoneMeshes = {};
    // Pisos (zonas): um plano por retângulo; textura alinhada ao mundo (sem emenda entre retângulos)
    const TX = textures();
    // laminado com leve brilho; porcelanato bege acetinado (WCs); porcelanato cinza POLIDO no templo (reflete luzes e ambiente)
    const ROUGH = { tileGray: 0.5, tileLight: 0.6, tileCool: 0.45, wood: 0.72, herring: 0.95, paversGray: 0.95, paversDark: 0.9, laminate: 0.44, porcelainBeige: 0.3, porcelainGray: 0.13 };
    const BUMP = { tileGray: 0.3, laminate: 0.25, porcelainBeige: 0.15, porcelainGray: 0.08 }, ENVI = { porcelainGray: 0.6, porcelainBeige: 0.8, laminate: 0.8 };
    for (const [id, z] of Object.entries(ZONES)) {
      const tk = z.floor || 'concrete', tile = z.tile || 3, list = this._zoneMeshes[id] = [];
      for (const [x, zz, w, d, edges = 'nsew'] of z.rects) {
        const map = TX[tk].clone(); map.repeat.set(w / tile, d / tile); map.offset.set(x / tile, -(zz + d) / tile);
        const tint = ['grass', 'concrete'].includes(tk) ? 0xdedede : 0xffffff;
        const mat = new THREE.MeshStandardMaterial({ color: tint, map, roughness: ROUGH[tk] || 0.9, bumpMap: map, bumpScale: BUMP[tk] != null ? BUMP[tk] : 0.6,
          aoMap: edges ? this._makeAO(w, d, edges) : null, aoMapIntensity: 1.0, envMapIntensity: ENVI[tk] != null ? ENVI[tk] : 1 });
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
        m.rotation.x = -Math.PI / 2; m.position.set(x + w / 2, 0.004, zz + d / 2); m.receiveShadow = true;   // pisos a 4 mm: tapetes (≥ 5 mm) ficam por cima sem z-fighting
        m.userData = { item: z.item || null, zone: id }; scene.add(m); list.push(m);
        if (z.item) this._clickables.push(m);
      }
      if (z.label) {
        const s = this._makeLabel(z.label, z.ls || 1, !!z.main); s.position.set(z.lp[0], z.ly != null ? z.ly : H + 0.6 + (id === 'templo' ? 1.2 : 0), z.lp[1]);
        scene.add(s); this._labels.push(s);
      }
    }
    this._buildWalls(scene, M);
    // Rodapés nas zonas internas (só nas bordas que encostam em parede)
    // madeira no laminado (~7 cm), porcelanato cinza no templo, branco no resto
    const i0 = T / 2 + 0.02;
    for (const z of Object.values(ZONES)) {
      if (!z.inside) continue;
      const bm = z.floor === 'laminate' ? M.baseboardWood : z.floor === 'porcelainGray' ? M.baseboardGray : M.baseboard, hb = bm === M.baseboard ? 0.09 : 0.07;
      for (const [x, zz, w, d, edges = 'nsew'] of z.rects) {
        if (edges.includes('n')) scene.add(box(w - 2 * i0, hb, 0.02, bm, x + w / 2, hb / 2, zz + i0, { cast: false }));
        if (edges.includes('s')) scene.add(box(w - 2 * i0, hb, 0.02, bm, x + w / 2, hb / 2, zz + d - i0, { cast: false }));
        if (edges.includes('w')) scene.add(box(0.02, hb, d - 2 * i0, bm, x + i0, hb / 2, zz + d / 2, { cast: false }));
        if (edges.includes('e')) scene.add(box(0.02, hb, d - 2 * i0, bm, x + w - i0, hb / 2, zz + d / 2, { cast: false }));
      }
    }

    // Grupo externo (modo Fachada): paredes altas, platibandas, telhados e revestimento da
    // fachada — preenchido pela decoração roomFachada via ctx.addExt; só aparece com o botão.
    this._ext = new THREE.Group(); this._ext.name = 'fachada'; this._ext.userData.keep = true; this._ext.visible = false; scene.add(this._ext);

    this._nLights = 0; this._nShadows = 0;
    this._buildFurniture(scene, M);
    this._buildFixtures(scene, M);
    mergeItems(scene, this._clickables, this._items); mergeItems(this._ext, this._clickables, this._items);

    const stats = mergeStatic(scene, true);
    const extStats = mergeStatic(this._ext, true);
    console.info(`[igreja3d-card] malhas estáticas: ${stats.before} → ${stats.after} draw calls · fachada: ${extStats.before} → ${extStats.after} · luzes reais: ${this._nLights} (${this._nShadows} com sombra)`);

    this._raycaster = new THREE.Raycaster();
    this._ndc = new THREE.Vector2();
    this._ro = new ResizeObserver(() => this._resize());
    // fora da tela (rolado para longe no dashboard) não gasta GPU com a animação ociosa
    try { this._io = new IntersectionObserver((es) => { this._onScreen = es.some((e) => e.isIntersecting); }); this._io.observe(this); } catch (_) {}
    this._ro.observe(this);
    if (this._dock) this._ro.observe(this._dock);
    if (this._hudTop) this._ro.observe(this._hudTop);
    this._resize();
    renderer.shadowMap.needsUpdate = true;
  }

  // Luminárias + luzes de cada item (PointLight só onde não é `glowOnly`)
  _buildFixtures(scene, M) {
    const TXg = textures().glow;
    const shadeMat = new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.6, side: THREE.DoubleSide });
    const bayMat = new THREE.MeshStandardMaterial({ color: 0x2c2d31, roughness: 0.5, metalness: 0.35, side: THREE.DoubleSide });
    const linMat = new THREE.MeshStandardMaterial({ color: 0x2a2b2f, roughness: 0.45, metalness: 0.4 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x1b1b1e, roughness: 0.6, metalness: 0.3 });
    const linRails = {};
    const up = new THREE.Vector3(0, 1, 0);
    const MOVE_DIR = new THREE.Vector3(1, -1.25, 0).normalize();   // moving heads da parede do palco: para +x e para baixo
    // material do feixe: aditivo, mais forte no eixo (N·V) e sumindo para baixo (uv.y); uma instância por refletor
    const beamMat = () => new THREE.ShaderMaterial({
      uniforms: { uC: { value: new THREE.Color() }, uI: { value: 0 } },
      vertexShader: 'varying vec3 vN; varying vec3 vV; varying float vY; void main(){ vY = uv.y; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform vec3 uC; uniform float uI; varying vec3 vN; varying vec3 vV; varying float vY; void main(){ float edge = pow(abs(dot(normalize(vN), normalize(vV))), 2.0); float fade = pow(vY, 1.8); gl_FragColor = vec4(uC * uI * edge * fade, 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}',
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    for (const it of ITEMS) {
      const rt = this._items.get(it.key) || {}; this._items.set(it.key, rt);
      rt.lights = rt.lights || []; rt.fixtures = rt.fixtures || []; rt.target = 0; rt.level = 0; rt.color = new THREE.Color(it.color || 0xffffff);
      if (!it.fixtures) continue;
      // quality leve (tablet/celular): poucas luzes reais — cada item principal fica com LITE_LIGHTS[key] delas,
      // mais fortes e com alcance maior para compensar; as demais viram só halo + emissivo (visual quase igual)
      const realIdx = it.fixtures.map((f, k) => (f.glowOnly || (this._tight && f.i <= 22)) ? -1 : k).filter((k) => k >= 0);
      const liteMax = this._lite ? (LITE_LIGHTS[it.key] || 0) : realIdx.length;
      const step = liteMax > 0 ? realIdx.length / liteMax : Infinity;
      const keep = new Set(liteMax >= realIdx.length ? realIdx : Array.from({ length: liteMax }, (_, n) => realIdx[Math.floor(n * step + step / 2 - 0.5)]));
      const boost = keep.size ? realIdx.length / keep.size : 1;
      for (const [fk, f] of it.fixtures.entries()) {
        const [px, py, pz] = f.p;
        const holder = f.ext ? this._ext : scene;
        // GPU apertada (uniforms/samplers no limite): as luzes fracas das salas viram só halo + emissivo
        const glowOnly = !keep.has(fk);
        if (!glowOnly) {
          const L = new THREE.PointLight(rt.color, 0, this._lite ? f.d * Math.min(1.35, Math.sqrt(boost)) : f.d, 2);
          L.position.set(px, f.pole ? py - 0.2 : f.highbay ? py - 0.25 : f.linear ? py - 0.1 : py, pz);
          // moving head: a luz sai 1,2 m à frente da lente (ilumina o palco, não a parede atrás da treliça)
          if (f.moving) L.position.addScaledVector(MOVE_DIR, 1.2);
          if (f.shadow && !this._lite && (!this._tight || f.liteShadow)) {
            // 256 (leve: 192): com o PCF de 9 amostras fica igual a 512 e ocupa 1/4 da memória (4 MB por luz em vez de 16)
            const ms = this._lite ? 192 : 256;
            L.castShadow = true; L.shadow.mapSize.set(ms, ms); L.shadow.radius = 2;
            L.shadow.bias = -0.004; L.shadow.normalBias = 0.03;
            L.shadow.camera.near = 0.15; L.shadow.camera.far = f.d + 1;
            // a geometria é estática: a sombra da luz é desenhada uma vez só (a do sol continua seguindo o sol);
            // _refreshPointShadows() pede de novo quando algo muda (porta do hall, modo Fachada)
            L.shadow.autoUpdate = false; L.shadow.needsUpdate = true;
            this._nShadows++;
          }
          scene.add(L); rt.lights.push({ L, i: this._lite ? f.i * boost : f.i }); this._nLights++;
        }
        // uma lente emissiva por entidade (todas acendem juntas) → depois vira uma malha só
        const emis = () => rt.emisMat || (rt.emisMat = new THREE.MeshStandardMaterial({ color: 0xfff6e6, emissive: rt.color, emissiveIntensity: 0, roughness: 0.4 }));
        let mesh, gs = 1.5, gb = 0.8;
        if (f.spot) {
          // refletor: lata preta curta com lente, presa por uma forquilha
          const dir = (f.aim === 'wall' ? new THREE.Vector3(0, -1, -0.2) : new THREE.Vector3(0, -0.85, -0.5)).normalize();
          const q = new THREE.Quaternion().setFromUnitVectors(up, dir);
          const can = cyl(0.11, 0.13, 0.28, M.dark, px, py, pz, 16); can.quaternion.copy(q); can.castShadow = false; holder.add(can);
          const back = cyl(0.07, 0.07, 0.06, M.graphite, 0, 0, 0, 12); back.quaternion.copy(q); back.position.set(px, py, pz).addScaledVector(dir, -0.16); back.castShadow = false; holder.add(back);
          holder.add(box(0.03, 0.26, 0.03, M.dark, px - 0.16, py + 0.06, pz, { cast: false }));
          holder.add(box(0.03, 0.26, 0.03, M.dark, px + 0.16, py + 0.06, pz, { cast: false }));
          holder.add(box(0.35, 0.03, 0.04, M.dark, px, py + 0.19, pz, { cast: false }));
          holder.add(cyl(0.012, 0.012, f.aim === 'wall' ? 0.12 : 0.4, M.dark, px, py + (f.aim === 'wall' ? 0.26 : 0.39), pz, 6));
          // refletor de fachada: braço curto até a parede (abaixo do topo da platibanda)
          if (f.aim === 'wall') holder.add(box(0.05, 0.05, 0.66, M.dark, px, py + 0.33, pz - 0.3, { cast: false }));
          mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.02, 18), emis());
          mesh.quaternion.copy(q); mesh.position.set(px, py, pz).addScaledVector(dir, 0.145);
          gs = 1.3; gb = 0.85;
        } else if (f.moving) {
          // moving head (como na foto): base presa à treliça (grampo até y + 0,25), garfo e cabeça cilíndrica mirando MOVE_DIR
          const dir = MOVE_DIR, q = new THREE.Quaternion().setFromUnitVectors(up, dir);
          holder.add(box(0.3, 0.1, 0.3, M.dark, px, py + 0.17, pz, { cast: false }));
          holder.add(box(0.06, 0.06, 0.06, M.graphite, px, py + 0.25, pz, { cast: false }));
          for (const s2 of [-1, 1]) holder.add(box(0.26, 0.2, 0.03, M.dark, px, py + 0.03, pz + s2 * 0.14, { cast: false }));   // braços do garfo
          const head = cyl(0.11, 0.1, 0.3, M.dark, px, py, pz, 18); head.quaternion.copy(q); head.castShadow = false; holder.add(head);
          const bez = cyl(0.115, 0.115, 0.03, M.graphite, 0, 0, 0, 18); bez.quaternion.copy(q); bez.position.set(px, py, pz).addScaledVector(dir, 0.15); bez.castShadow = false; holder.add(bez);
          mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.02, 18), emis());
          mesh.quaternion.copy(q); mesh.position.set(px, py, pz).addScaledVector(dir, 0.165);
          gs = 1.1; gb = 0.85;
        } else if (f.highbay) {
          // pendente industrial grande (campânula grafite + difusor); `hang` = y da estrutura (tesoura): haste curta até lá
          // (presos a uma estrutura — `hang` — são os redondos menores do templo, Ø 0,64 m)
          const kb = f.hang != null ? 0.7 : 1;
          const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * kb, 0.46 * kb, 0.36 * kb, 24, 1, true), bayMat); sh.position.set(px, py + 0.02 * kb, pz); sh.castShadow = false; sh.userData = { item: it.key };
          holder.add(sh); this._clickables.push(sh);
          holder.add(cyl(0.15 * kb, 0.15 * kb, 0.12 * kb, M.graphite, px, py + 0.25 * kb, pz, 16));
          const top = f.hang != null ? f.hang : py + 1.7, y0r = py + 0.31 * kb, rodL = Math.max(0.02, top - y0r);
          holder.add(cyl(0.012, 0.012, rodL, M.dark, px, y0r + rodL / 2, pz, 6));
          mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.42 * kb, 0.42 * kb, 0.025, 28), emis()); mesh.position.set(px, py - 0.15 * kb, pz);
          gs = 2.6 * kb; gb = 0.8;
        } else if (f.linear) {
          // pendente linear de LED (2,4 m ao longo de z), grafite, pendurado por 2 cabos no trilho do teto (y 6,42)
          const body = box(0.1, 0.07, 2.4, linMat, px, py + 0.035, pz, { cast: false }); body.userData = { item: it.key };
          holder.add(body); this._clickables.push(body);
          for (const dz of [-0.9, 0.9]) holder.add(cyl(0.006, 0.006, 6.4 - py - 0.07, M.dark, px, (6.4 + py + 0.07) / 2, pz + dz, 5));
          mesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.01, 2.3), emis()); mesh.position.set(px, py - 0.004, pz);
          (linRails[px] = linRails[px] || []).push(pz);
          gs = 1.6; gb = 0.55;
        } else if (f.pole) {
          // poste de 5,5 m: base de concreto, haste, braço e luminária pública
          const bz = pz + 1.0;
          holder.add(cyl(0.2, 0.24, 0.5, M.concrete, px, 0.25, bz, 14));
          holder.add(cyl(0.055, 0.075, 5.45, M.graphite, px, 0.5 + 5.45 / 2, bz, 10));
          holder.add(box(0.06, 0.06, 1.05, M.graphite, px, py + 0.12, pz + 0.5));
          holder.add(box(0.5, 0.1, 0.34, M.graphite, px, py + 0.07, pz));
          mesh = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.02, 0.28), emis()); mesh.position.set(px, py + 0.01, pz);
          gs = 2.4; gb = 0.9;
        } else if (f.lamp) {
          mesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), emis()); mesh.position.set(px, py, pz);
          holder.add(box(0.18, 0.22, 0.18, M.dark, px, py - 0.2, pz));
          gs = 0.9; gb = 0.7;
        } else if (f.sconce) {
          mesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 0.12), emis()); mesh.position.set(px, py, pz);
          gs = 1.1; gb = 0.8;
        } else {
          // pendente: cabo + cúpula aberta + lâmpada
          mesh = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), emis()); mesh.position.set(px, py, pz);
          const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.2, 0.17, 20, 1, true), shadeMat);
          shade.position.set(px, py + 0.09, pz); shade.castShadow = false; shade.userData = { item: it.key }; holder.add(shade); this._clickables.push(shade);
          const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.28, 6), M.dark); rod.position.set(px, py + 0.3, pz); rod.castShadow = false; holder.add(rod);
        }
        mesh.userData = { item: it.key }; mesh.castShadow = false; holder.add(mesh);
        rt.fixtures.push(mesh); this._clickables.push(mesh);
        // Halo (bloom barato) na luminária
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TXg, color: rt.color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
        glow.scale.set(gs, gs, 1); glow.position.copy(mesh.position);
        holder.add(glow); rt.glows = rt.glows || []; rt.glows.push({ sp: glow, base: gb });
        // Feixe volumétrico falso (cone aditivo) nos refletores do palco: segue a cor e o brilho da entidade
        if ((f.spot && !f.aim) || f.moving) {
          const dir = f.moving ? MOVE_DIR : new THREE.Vector3(0, -0.85, -0.5).normalize(), len = f.moving ? 5.8 : 5.2;
          const geo = new THREE.CylinderGeometry(f.moving ? 0.08 : 0.1, f.moving ? 0.95 : 1.15, len, 24, 1, true); geo.translate(0, -len / 2, 0);   // topo (v = 1) na lente
          const beam = new THREE.Mesh(geo, beamMat()); beam.position.set(px, py, pz).addScaledVector(dir, f.moving ? 0.17 : 0.15);
          beam.quaternion.setFromUnitVectors(up, dir.clone().negate());
          beam.userData.keep = true; beam.renderOrder = 5; beam.visible = false; beam.castShadow = beam.receiveShadow = false; holder.add(beam);
          rt.beams = rt.beams || []; rt.beams.push(beam);
        }
      }
    }
    // trilhos do teto (y 6,42) onde os pendentes lineares se penduram: um por coluna de luminárias, ao longo de z
    const allZ = Object.values(linRails).flat();
    if (allZ.length) {
      const z0 = Math.min(...allZ) - 1.2, z1 = Math.max(...allZ) + 1.2;
      for (const x of Object.keys(linRails)) scene.add(box(0.06, 0.06, z1 - z0, railMat, +x, 6.43, (z0 + z1) / 2, { cast: false }));
    }
  }

  // Domo de céu (dia/noite com crossfade), estrelas e mapa de ambiente para reflexos
  _buildSky(scene, renderer) {
    const T = textures();
    const R = 260;   // envolve a câmera mesmo no zoom máximo (alvo ± 150 m)
    const geo = new THREE.SphereGeometry(R, 32, 16);
    this._skyNight = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: T.skyNight, side: THREE.BackSide, fog: false, depthWrite: false }));
    this._skyDay = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: T.skyDay, side: THREE.BackSide, fog: false, depthWrite: false, transparent: true, opacity: 0 }));
    this._skyDusk = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: T.skyDusk, side: THREE.BackSide, fog: false, depthWrite: false, transparent: true, opacity: 0 }));
    this._skyNight.renderOrder = -3; this._skyDusk.renderOrder = -2; this._skyDay.renderOrder = -1;
    this._skyNight.position.set(LOT.cx, 0, LOT.cz); this._skyDay.position.copy(this._skyNight.position); this._skyDusk.position.copy(this._skyNight.position);
    scene.add(this._skyNight, this._skyDusk, this._skyDay);
    const rnd = mulberry32(77), n = 900, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const th = rnd() * Math.PI * 2, ph = Math.acos(1 - rnd() * 0.9), r = R - 12;
      pos[i * 3] = LOT.cx + r * Math.sin(ph) * Math.cos(th); pos[i * 3 + 1] = r * Math.cos(ph); pos[i * 3 + 2] = LOT.cz + r * Math.sin(ph) * Math.sin(th);
    }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this._stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xdfe8ff, size: 1.1, transparent: true, opacity: 0, fog: false, depthWrite: false }));
    scene.add(this._stars);
    // Ambiente (PMREM) a partir do próprio céu: reflexos em vidros/metais e luz difusa
    try {
      const pm = new THREE.PMREMGenerator(renderer);
      const envScene = new THREE.Scene();
      const dome = new THREE.Mesh(new THREE.SphereGeometry(130, 32, 16), new THREE.MeshBasicMaterial({ map: T.skyDay, side: THREE.BackSide }));
      const sun = new THREE.Mesh(new THREE.SphereGeometry(6, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      sun.position.set(-45, 90, 35); envScene.add(dome, sun);
      this._envDay = pm.fromScene(envScene, 0.04).texture;
      dome.material.map = T.skyNight; sun.visible = false;
      this._envNight = pm.fromScene(envScene, 0.04).texture;
      pm.dispose();
      scene.environment = this._envNight; scene.environmentIntensity = 0.35;
    } catch (e) { console.warn('[igreja3d-card] sem environment map', e); }
  }

  // Paredes (linha de centro, espessura T, altura H) — medidas do rooms/BRIEF.md
  _buildWalls(scene, M) {
    const wallX = (z, xa, xb, ops = [], o = {}) => this._wallSeg(scene, M, 'x', z, xa, xb, ops, o);
    const wallZ = (x, za, zb, ops = [], o = {}) => this._wallSeg(scene, M, 'z', x, za, zb, ops, o);
    // Externas (pretas por fora, revestidas de branco por dentro): `inner` = lado de dentro
    const DK = { mat: M.wallDark, cap: M.wallDarkCap, frame: M.frameDark, ext: true };
    wallX(0, 0, 20.1, [{ a: 0.3, b: 4.7, t: 'gate' }], Object.assign({ inner: 1 }, DK));
    // divisa esquerda (x = 0) em 3 trechos: o do templo (z 12,4–44,0) é a PAREDE DO PALCO — sobe a 8,5 m
    // já no modo normal e é preta por dentro (correção do cliente: o palco fica nesta parede lateral longa)
    wallZ(0, 0, 12.4, [], Object.assign({}, DK, { ext1: false, clad: [{ side: 1, mat: M.wall, a: T / 2, b: 12.4 }] }));
    wallZ(0, 12.4, 44.0, [], Object.assign({}, DK, { ext: false, h: SPEC.H_TEMPLO, clad: [{ side: 1, mat: M.pretoFosco, a: 12.4, b: 44.0 }] }));
    wallZ(0, 44.0, 49.65, [], Object.assign({}, DK, { ext0: false, clad: [{ side: 1, mat: M.wall, a: 44.0, b: 49.65 - T / 2 }] }));
    wallZ(20.1, 0, 49.5, [], Object.assign({ inner: -1 }, DK));
    wallX(49.65, 0, 16.05, [{ a: 0.6, b: 3.2, t: 'window' }, { a: 10.9, b: 13.1, t: 'glassdoor', item: 'porta' }], Object.assign({ inner: -1 }, DK));
    wallX(49.5, 16.05, 20.1, [{ a: 17.6, b: 19.6, t: 'window', sill: 1.6 }], Object.assign({ inner: -1 }, DK));
    // Almoxarifado / cozinha
    wallZ(4.9, 0, 3.9, [{ a: 1.0, b: 2.0, t: 'window' }]);
    wallZ(8.6, 0, 3.9);
    wallX(3.9, 4.9, 12.75, [{ a: 7.5, b: 8.4, t: 'door' }, { a: 9.2, b: 10.8, t: 'window' }, { a: 11.6, b: 12.5, t: 'door' }]);
    // Recepção / sala pastoral
    wallZ(12.75, 0, 9.25, [{ a: 8.2, b: 9.1, t: 'door' }]);
    wallZ(9.45, 5.9, 9.25);
    wallX(5.9, 9.45, 12.75, [{ a: 10.3, b: 11.9, t: 'window' }]);
    wallX(9.25, 9.45, 20.1, [{ a: 11.8, b: 12.6, t: 'door' }, { a: 12.9, b: 13.8, t: 'door' }, { a: 14.2, b: 16.6, t: 'glass' }]);
    // Caixa d'água / banheiro da pastoral
    wallZ(17.0, 0, 4.9, [{ a: 1.2, b: 2.2, t: 'window' }, { a: 3.4, b: 4.2, t: 'door' }]);
    wallX(3.1, 17.0, 20.1);
    wallX(4.9, 17.0, 20.1);
    // Ala direita: entrada lateral, Gilvan, administrativo
    wallX(11.0, 16.05, 20.1, [{ a: 16.15, b: 17.0, t: 'door' }, { a: 17.9, b: 19.9, t: 'window' }]);
    wallZ(17.1, 11.0, 19.0, [{ a: 12.9, b: 13.8, t: 'door' }, { a: 14.4, b: 15.3, t: 'door' }, { a: 16.8, b: 18.3, t: 'window' }]);
    wallX(14.2, 17.1, 20.1);
    wallX(19.0, 17.1, 20.1);
    // Templo: faces internas do perímetro PRETAS (fosco), o lado dos cômodos vizinhos continua claro.
    // Ponta z = 12,4 (parede comum de 3 m, porta de vidro para o backstage) e lateral direita x = 16,05 (mídia de frente para o palco)
    const TB = (side, a, b) => ({ clad: [{ side, mat: M.pretoFosco, a, b }] });
    wallX(12.4, 0, 16.05, [{ a: 12.9, b: 15.1, t: 'glass' }], TB(1, T / 2, 16.05 - T / 2));
    wallZ(16.05, 11.0, 49.65, [{ a: 19.2, b: 22.6, t: 'glass' }, { a: 23.6, b: 27.7, t: 'window', sill: 1.1 }, { a: 29.9, b: 31.9, t: 'window' },
      { a: 34.2, b: 35.1, t: 'door', style: 'black' }, { a: 42.0, b: 43.6, t: 'door', style: 'black2' }], TB(-1, 12.4 + T / 2, 44.0 - T / 2));
    // Mídia, voluntariado, depósito, WCs
    wallX(23.3, 16.05, 18.9, [{ a: 17.9, b: 18.8, t: 'door' }]);
    wallZ(18.9, 23.3, 28.0);
    wallX(28.0, 16.05, 20.1, [{ a: 19.0, b: 19.9, t: 'door' }]);
    wallX(33.9, 16.05, 20.1, [{ a: 16.2, b: 17.0, t: 'door' }]);
    wallZ(17.1, 33.9, 40.8, [{ a: 34.6, b: 35.4, t: 'door' }]);
    wallX(35.9, 17.1, 20.1);
    wallX(37.0, 17.1, 20.1);
    wallX(40.8, 17.1, 20.1, [{ a: 18.2, b: 19.0, t: 'door' }]);
    wallX(44.3, 16.05, 20.1, [{ a: 16.25, b: 17.15, t: 'door' }]);   // WC fem.: porta pelo hall dos banheiros
    // Templo ↔ hall (porta preta de 2 folhas)
    wallX(44.0, 0, 16.05, [{ a: 10.6, b: 13.1, t: 'door', style: 'black2' }], TB(-1, T / 2, 16.05 - T / 2));
    // Sala da família / WCs
    wallZ(1.9, 44.0, 46.3);
    wallZ(4.0, 44.0, 49.65, [{ a: 44.4, b: 45.3, t: 'door' }, { a: 46.6, b: 47.5, t: 'door' }]);
    wallX(46.3, 0, 4.0, [{ a: 0.5, b: 1.3, t: 'door' }]);
    // Pilares do templo (0,4 × 0,4, 3,05 m). Metade voltada para o templo PRETA, a outra clara (ou preta por fora na divisa).
    // x = 0: por dentro só nos cantos (z 12,4 e 44,0) — no trecho do palco a face da parede fica lisa (telas, telão e
    // perfis altos são da decoração). x = 16,05: seguem a planta (encontros com as paredes da ala direita).
    const PH = H + 0.05;
    for (const z of PILLARS_L) {
      scene.add(box(0.2, PH, 0.4, M.wallDark, -0.1, PH / 2, z));
      if (z <= 12.4 || z >= 44.0) scene.add(box(0.2, PH, 0.4, M.pretoFosco, 0.1, PH / 2, z));
    }
    for (const z of PILLARS_R) { scene.add(box(0.2, PH, 0.4, M.pretoFosco, 15.95, PH / 2, z)); scene.add(box(0.2, PH, 0.4, M.pillar, 16.15, PH / 2, z)); }
    for (const x of [5.4, 10.5]) {
      scene.add(box(0.4, PH, 0.2, M.pillar, x, PH / 2, 12.3)); scene.add(box(0.4, PH, 0.2, M.pretoFosco, x, PH / 2, 12.5));
      scene.add(box(0.4, PH, 0.2, M.pretoFosco, x, PH / 2, 43.9)); scene.add(box(0.4, PH, 0.2, M.pillar, x, PH / 2, 44.1));
    }
  }

  // Segmento de parede ao longo de X (z fixo) ou Z (x fixo) com aberturas.
  // o = { h, mat, cap, frame (caixilho; padrão preto), doorFrame (batente/guarnição; padrão madeira), inner (±1: lado do
  //   revestimento claro), ext (estende T/2 nas pontas; ext0/ext1 só no início/fim), clad: [{ side ±1, mat, a, b }] (revestimento
  //   de 12 mm num lado, entre a e b — ex.: face preta do templo) }
  // Aberturas: door (style 'black' = preta de correr, side = lado do trilho) · window (sill/top opcionais) · glass ·
  //   glassdoor (2 folhas, item) · open · gate
  _wallSeg(scene, M, axis, c, a0, a1, ops, o = {}) {
    const h = o.h || H, mat = o.mat || M.wall, capMat = o.cap || M.wallCap, fr = o.frame || M.frameDark, inner = o.inner || 0;
    const e0 = o.ext0 != null ? o.ext0 : !!o.ext, e1 = o.ext1 != null ? o.ext1 : !!o.ext;
    if (e0) a0 -= T / 2;
    if (e1) a1 += T / 2;
    const glassMat = o.ext ? M.glass : M.glassSmoke;   // visores/janelas internas: vidro levemente fumê
    const put = (len, hh, thick, m, mid, y, opts, off = 0) => {
      const mesh = axis === 'x' ? box(len, hh, thick, m, mid, y, c + off, opts) : box(thick, hh, len, m, c + off, y, mid, opts);
      scene.add(mesh); return mesh;
    };
    const seg = (a, b, y0, y1) => {
      if (b - a <= 0.001 || y1 - y0 <= 0.001) return;
      put(b - a, y1 - y0, T, mat, (a + b) / 2, (y0 + y1) / 2);
      // revestimento interno: só entre as faces internas das paredes vizinhas (nas pontas
      // estendidas ele apareceria como um filete branco do lado de fora)
      const la = e0 ? Math.max(a, a0 + T) : a, lb = e1 ? Math.min(b, a1 - T) : b;
      if (inner && lb - la > 0.001) put(lb - la, y1 - y0, 0.012, M.wall, (la + lb) / 2, (y0 + y1) / 2, { cast: false }, inner * (T / 2 + 0.006));
      for (const cl of o.clad || []) {
        const ca = Math.max(a, cl.a), cb = Math.min(b, cl.b);
        if (cb - ca > 0.001) put(cb - ca, y1 - y0, 0.012, cl.mat, (ca + cb) / 2, (y0 + y1) / 2, { cast: false }, cl.side * (T / 2 + 0.006));
      }
      // tampa ligeiramente acima do topo (e com altura diferente por eixo) → sem faces coplanares
      if (Math.abs(y1 - h) < 0.001) put(b - a, 0.03, T + 0.03, capMat, (a + b) / 2, h + (axis === 'x' ? 0.02 : 0.018), { cast: false });
    };
    const pane = (a, b, y0, y1) => put(b - a, y1 - y0, 0.02, glassMat, (a + b) / 2, (y0 + y1) / 2, { cast: false, receive: false });
    // caixilho: ombreiras + verga (e peitoril se y0 > 0)
    const frame = (a, b, y0, y1, lintel = true) => {
      put(0.06, y1 - y0, T + 0.06, fr, a + 0.03, (y0 + y1) / 2); put(0.06, y1 - y0, T + 0.06, fr, b - 0.03, (y0 + y1) / 2);
      if (lintel) put(b - a, 0.06, T + 0.06, fr, (a + b) / 2, y1 - 0.03);
      if (y0 > 0.01) put(b - a + 0.12, 0.04, T + 0.16, fr, (a + b) / 2, y0 + 0.02);
    };
    const mullion = (a, b, y0, y1) => put(0.04, y1 - y0, T + 0.02, fr, (a + b) / 2, (y0 + y1) / 2);
    // peça pequena em (u ao longo da parede, y, n = afastamento do eixo); `rot` gira o cilindro para a normal da parede
    const at = (m, u, y, n) => { if (axis === 'x') m.position.set(u, y, c + n); else m.position.set(c + n, y, u); scene.add(m); return m; };
    let cur = a0;
    const sorted = [...ops].sort((p, q) => p.a - q.a);
    for (const op of sorted) {
      seg(cur, op.a, 0, h);
      if (op.t === 'door') {
        // porta interna (vídeos): folha lisa de cedro com veio, batente + guarnição de madeira nas duas faces, alavanca
        // cromada dos dois lados. style 'black': porta preta de correr (saídas do templo) com trilho aparente e puxador preto.
        seg(op.a, op.b, 2.1, h);
        const black = op.style === 'black' || op.style === 'black2', df = black ? M.frameDark : (o.doorFrame || M.doorFrame);
        const w = op.b - op.a, mid = (op.a + op.b) / 2;
        put(0.04, 2.1, T + 0.02, df, op.a + 0.02, 1.05); put(0.04, 2.1, T + 0.02, df, op.b - 0.02, 1.05); put(w, 0.04, T + 0.02, df, mid, 2.08);
        for (const sd of [-1, 1]) {
          const off = sd * (T / 2 + 0.008);
          put(0.07, 2.17, 0.016, df, op.a - 0.025, 1.085, { cast: false }, off);
          put(0.07, 2.17, 0.016, df, op.b + 0.025, 1.085, { cast: false }, off);
          put(w + 0.12, 0.07, 0.016, df, mid, 2.135, { cast: false }, off);
        }
        put(w - 0.08, 2.06, 0.04, black ? M.pretoFosco : M.door, mid, 1.03);
        if (op.style === 'black2') {
          // 2 folhas: junta central + puxadores verticais pretos dos dois lados
          put(0.012, 2.06, 0.05, M.frameDark, mid, 1.03, { cast: false });
          for (const s2 of [-1, 1]) for (const dx of [-0.09, 0.09]) put(0.025, 0.6, 0.025, M.frameDark, mid + dx, 1.05, { cast: false }, s2 * 0.045);
        } else if (black) {
          const sd = op.side || -1;
          put(2 * w + 0.1, 0.1, 0.07, M.frameDark, op.a + w - 0.05, 2.26, { cast: false }, sd * (T / 2 + 0.05));   // trilho/caixa da porta de correr
          for (const s2 of [-1, 1]) put(0.025, 0.4, 0.025, M.frameDark, op.b - 0.1, 1.05, { cast: false }, s2 * 0.045);
        } else {
          const hx = op.b - 0.1;
          for (const s2 of [-1, 1]) {
            const ros = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.012, 14), M.chrome);
            if (axis === 'x') ros.rotation.x = Math.PI / 2; else ros.rotation.z = Math.PI / 2;
            ros.castShadow = false; at(ros, hx, 1.02, s2 * 0.026);
            const lev = axis === 'x' ? box(0.13, 0.02, 0.022, M.chrome, 0, 0, 0, { cast: false }) : box(0.022, 0.02, 0.13, M.chrome, 0, 0, 0, { cast: false });
            at(lev, hx - 0.05, 1.02, s2 * 0.05);
          }
        }
      } else if (op.t === 'gate') {
        // portão de correr: sem verga, réguas horizontais escuras até 2,5 m
        frame(op.a, op.b, 0, 2.6, false);
        for (let y = 0.12; y < 2.5; y += 0.2) put(op.b - op.a - 0.12, 0.13, 0.04, M.frameDark, (op.a + op.b) / 2, y + 0.065, { cast: false });
        put(op.b - op.a - 0.12, 0.05, 0.06, M.frameDark, (op.a + op.b) / 2, 2.55);
      } else if (op.t === 'window') {
        const y0 = op.sill != null ? op.sill : 1.0, y1 = op.top != null ? op.top : 2.15;
        seg(op.a, op.b, 0, y0); seg(op.a, op.b, y1, h); frame(op.a, op.b, y0, y1); pane(op.a, op.b, y0, y1); mullion(op.a, op.b, y0, y1);
      } else if (op.t === 'glass') {
        seg(op.a, op.b, 2.25, h); frame(op.a, op.b, 0, 2.25); pane(op.a, op.b, 0, 2.25);
        const n = Math.max(1, Math.round((op.b - op.a) / 1.0)); for (let i = 1; i < n; i++) mullion(op.a + ((op.b - op.a) * i) / n - 0.02, op.a + ((op.b - op.a) * i) / n + 0.02, 0, 2.25);
      } else if (op.t === 'glassdoor') {
        // porta de vidro de 2 folhas (caixilho preto) — abre para fora quando `item` (sensor) = on
        seg(op.a, op.b, 2.25, h); frame(op.a, op.b, 0, 2.25);
        const rt = this._items.get(op.item) || {}; this._items.set(op.item, rt); rt.leaves = rt.leaves || []; rt.fixtures = rt.fixtures || [];
        const lw = (op.b - op.a - 0.12) / 2, out = axis === 'x' ? (inner < 0 ? 1 : -1) : 1;
        for (const [pivot, sgn] of [[op.a + 0.06, 1], [op.b - 0.06, -1]]) {
          const g = new THREE.Group(); g.userData.keep = true;
          if (axis === 'x') g.position.set(pivot, 0, c); else { g.position.set(c, 0, pivot); g.rotation.y = -Math.PI / 2; }
          const cx = sgn * lw / 2;
          const gl = box(lw - 0.08, 2.1, 0.02, M.glass, cx, 1.1, 0, { cast: false, receive: false }); gl.userData = { item: op.item };
          g.add(gl, box(0.05, 2.18, 0.05, M.frameDark, sgn * 0.025, 1.1, 0), box(0.05, 2.18, 0.05, M.frameDark, sgn * (lw - 0.025), 1.1, 0),
            box(lw, 0.05, 0.05, M.frameDark, cx, 0.03, 0), box(lw, 0.05, 0.05, M.frameDark, cx, 2.17, 0));
          for (const s of [-1, 1]) g.add(cyl(0.012, 0.012, 1.1, M.chrome, sgn * (lw - 0.12), 1.05, s * 0.06, 8));   // puxadores
          scene.add(g); this._clickables.push(gl); rt.fixtures.push(gl);
          rt.leaves.push({ g, dir: sgn * out, base: g.rotation.y });
        }
      } else if (op.t === 'open') {
        seg(op.a, op.b, Math.min(h - 0.35, 2.3), h);
      }
      cur = op.b;
    }
    seg(cur, a1, 0, h);
  }

  _buildFurniture(scene, M) {
    const F = furniture(M);
    const place = (g, x, z, ry = 0, y = 0) => { g.position.set(x, y, z); g.rotation.y = ry; scene.add(g); return g; };
    // materiais iguais (mesmas opções) viram o mesmo objeto → menos draw calls depois do mergeStatic
    const matCache = new Map();
    const std = (o) => {
      const opts = Object.assign({ roughness: 0.9, metalness: 0 }, o || {});
      // texturas entram na chave pelo uuid: JSON.stringify chamaria Texture.toJSON (serializa a imagem em data URL — segundos por build)
      const kopts = {}; for (const k in opts) { const v = opts[k]; kopts[k] = (v && v.isTexture) ? 'tex:' + v.uuid : v; }
      let key = null; try { key = JSON.stringify(kopts, (k, v) => (v && v.isColor) ? '#' + v.getHexString() : v); } catch (_) { key = null; }
      if (key && matCache.has(key)) return matCache.get(key);
      const m = new THREE.MeshStandardMaterial(opts); if (key) matCache.set(key, m); return m;
    };
    const ext = this._ext;
    const addExt = (m) => { ext.add(m); return m; };
    const get = (k) => { const rt = this._items.get(k) || {}; this._items.set(k, rt); rt.fixtures = rt.fixtures || []; return rt; };
    // Emissivo da decoração que acompanha uma entidade: intensidade = max · (min + (1 − min) · nível).
    // O material pode ser compartilhado (continua valendo depois do mergeStatic).
    const bindEmissive = (key, mat, max = 1, opts = {}) => {
      if (!mat || !mat.emissive) return mat;
      const rt = get(key); rt.emisBind = rt.emisBind || [];
      rt.emisBind.push({ mat, max, min: opts.min != null ? opts.min : 0.08 }); mat.userData.noShare = true; mat.emissiveIntensity = max * (opts.min != null ? opts.min : 0.08);
      return mat;
    };
    // Halo aditivo (bloom barato) num plano w × h virado para +z, aceso com a entidade `key`.
    // opts: { color, base (opacidade máx., 0,45), day (fração de dia, 0,35), tex ('glow' radial | 'frame' moldura) }
    // Planos da mesma entidade com a mesma cor/opções compartilham o material (o merge os junta num draw call);
    // o cartão acende/apaga pelo material (opacity + visible).
    const glowMats = new Map();
    const glowPlane = (w, h, key, opts = {}) => {
      const tk = opts.tex === 'frame' ? 'frame' : 'glow', color = opts.color != null ? opts.color : 0xffffff;
      const base = opts.base != null ? opts.base : 0.45, day = opts.day != null ? opts.day : 0.35, mk = [key, tk, color, base, day].join('|');
      let mat = glowMats.get(mk);
      if (!mat) {
        mat = new THREE.MeshBasicMaterial({ map: tk === 'frame' ? this._frameGlowTex() : textures().glow, color, transparent: true, opacity: 0,
          blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
        mat.visible = false; mat.userData = { noShare: true, base, day }; glowMats.set(mk, mat);
        const rt = get(key); (rt.halos = rt.halos || []).push(mat);
      }
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      m.castShadow = m.receiveShadow = false; m.renderOrder = 4;
      return m;
    };
    // Logo oficial compartilhado (mesma função de desenho em todo o cartão) — ver rooms/BRIEF.md
    const logo = { draw: drawLogo, aspect: logoAspect, tex: logoTex, mesh: logoMesh, relief: logoRelief, font: LOGO_FONT };
    const ctx = (seed) => ({ THREE, M, F, box, cyl, sph, std, place, add: (m) => { scene.add(m); return m; }, rnd: mulberry32(seed),
      ZONES, H, T, LOT, ext, addExt, makeTex, SPEC, PILLARS_L, PILLARS_R, logo, bindEmissive, glowPlane, TEX: textures() });
    const click = (m, key) => { m.userData = { item: key }; scene.add(m); this._clickables.push(m); get(key).fixtures.push(m); return m; };

    // ---- Objetos ligados a entidades (as decorações não recriam nem cobrem) ----
    // Telão LED 8,4 × 3,0 m (media_player) na PAREDE DO PALCO x = 0: z 23,9–32,3, y 1,15–4,15, plano em x 0,25 virado
    // para +x (a plateia olha para −x), moldura preta fina (painel de x 0,12 a 0,24 com 5 cm de borda)
    const TVZ = 28.1, TVY = 2.65, TVW = 8.4, TVH = 3.0, TVX = 0.25;
    const tv = get('telao');
    scene.add(box(0.12, TVH + 0.1, TVW + 0.1, M.dark, 0.18, TVY, TVZ));
    tv.canvas = document.createElement('canvas'); tv.canvas.width = 1536; tv.canvas.height = 548;   // 2,8 : 1 (8,4 × 3,0)
    tv.tex = new THREE.CanvasTexture(tv.canvas); tv.tex.colorSpace = THREE.SRGBColorSpace; tv.tex.anisotropy = 4;
    tv.screenMat = new THREE.MeshStandardMaterial({ color: 0x050608, emissive: 0xffffff, emissiveMap: tv.tex, emissiveIntensity: 0, roughness: 0.3, metalness: 0.1, toneMapped: false });
    tv.screenMat.userData.noShare = true;
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(TVW, TVH), tv.screenMat); screen.rotation.y = Math.PI / 2;
    screen.position.set(TVX, TVY, TVZ); screen.castShadow = false; screen.receiveShadow = false;
    click(screen, 'telao');
    tv.light = new THREE.PointLight(0x8a70ff, 0, 14, 2); tv.light.position.set(2.1, 2.8, TVZ); scene.add(tv.light); this._nLights++;   // cor média do conteúdo
    // brilho de LED em volta do painel (moldura desfocada, vazada no meio para não lavar a imagem)
    tv.bloom = new THREE.Mesh(new THREE.PlaneGeometry(TVW + 2.2, TVH + 1.8), new THREE.MeshBasicMaterial({ map: this._frameGlowTex(TVW, TVH, TVW + 2.2, TVH + 1.8), color: 0x7a5cff,
      transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    tv.bloom.rotation.y = Math.PI / 2; tv.bloom.position.set(TVX + 0.04, TVY, TVZ);
    tv.bloom.userData.noMerge = true; tv.bloom.renderOrder = 4; tv.bloom.visible = false; scene.add(tv.bloom);
    this._drawTelao('');
    // Som (switch): LEDs de status nas quinas frontais do palco (topo y 1,0; frente x 5,0; pontas z 19,6 / 36,6)
    const som = get('som'); som.ledMats = [];
    for (const z of [19.8, 36.4]) {
      click(box(0.1, 0.05, 0.16, M.dark, 4.9, 1.025, z, { cast: false }), 'som');
      const lm = som.ledMats[0] || new THREE.MeshStandardMaterial({ color: 0x0f2a18, emissive: 0x22c55e, emissiveIntensity: 0 }); lm.userData.noShare = true;
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), lm); led.position.set(4.9, 1.065, z); led.castShadow = false;
      click(led, 'som'); if (!som.ledMats.includes(lm)) som.ledMats.push(lm);
    }
    // Splits (climate): corpo branco + grelha + LED de modo. axis = direção do comprimento; face = lado da sala.
    // sz = [comprimento, altura, profundidade] (templo: unidades grandes piso-teto instaladas no alto, como nos vídeos)
    const split = (key, x, y, z, axis, face, sz = [0.9, 0.3, 0.22]) => {
      const rt = get(key); rt.ledMats = rt.ledMats || [];
      const [Ls, Hs, D] = sz;
      click(axis === 'z' ? box(D, Hs, Ls, M.white, x, y, z) : box(Ls, Hs, D, M.white, x, y, z), key);
      const fo = face * (D / 2 + 0.006);
      scene.add(axis === 'z' ? box(0.012, 0.05, Ls - 0.1, M.steel, x + fo, y - Hs / 2 + 0.04, z, { cast: false }) : box(Ls - 0.1, 0.05, 0.012, M.steel, x, y - Hs / 2 + 0.04, z + fo, { cast: false }));
      // um material de LED por entidade (todos os splits do templo mudam juntos) → fundem num draw call
      const lm = rt.ledMats[0] || new THREE.MeshStandardMaterial({ color: 0x0a2a3a, emissive: 0x67d3ff, emissiveIntensity: 0 }); lm.userData.noShare = true;
      const led = new THREE.Mesh(axis === 'z' ? new THREE.BoxGeometry(0.012, 0.03, 0.2) : new THREE.BoxGeometry(0.2, 0.03, 0.012), lm);
      if (axis === 'z') led.position.set(x + fo, y + Hs / 2 - 0.09, z + (Ls / 2 - 0.2) * face); else led.position.set(x + Ls / 2 - 0.2, y + Hs / 2 - 0.09, z + fo);
      led.castShadow = false; scene.add(led); if (!rt.ledMats.includes(lm)) rt.ledMats.push(lm);
    };
    // templo (nenhum na parede do palco x = 0): 3 na parede x = 16,05 (fora do vidro/visor/porta; o do meio acima da janela
    // z 29,9–31,9) e 1 em cada ponta (z 12,4 e 44,0), no alto (y 2,6, topo 2,73 < 3,0)
    const ACT = [1.25, 0.26, 0.3], acIn = T / 2 + ACT[2] / 2;
    for (const z of [15.3, 30.9, 37.6]) split('ac_templo', 16.05 - acIn, 2.6, z, 'z', -1, ACT);
    split('ac_templo', 7.95, 2.6, 12.4 + acIn, 'x', 1, ACT);
    split('ac_templo', 7.95, 2.6, 44.0 - acIn, 'x', -1, ACT);
    split('ac_pastoral', 14.9, 2.4, 0.2, 'x', 1);

    // Decoração por ambiente (funções room*, no topo do arquivo)
    // @room templo_palco
    roomTemploPalco(ctx(21));
    // @endroom
    // @room templo_plateia
    roomTemploPlateia(ctx(22));
    // @endroom
    // @room hall_familia
    roomHallFamilia(ctx(23));
    // @endroom
    // @room ala_direita
    roomAlaDireita(ctx(24));
    // @endroom
    // @room administrativo
    roomAdministrativo(ctx(25));
    // @endroom
    // @room servico_patio
    roomServicoPatio(ctx(26));
    // @endroom
    // @room fachada
    roomFachada(ctx(27));
    // @endroom
  }

  // Conteúdo do telão (canvas 2,8 : 1, como o painel de 8,4 × 3,0 m): fundo roxo/azul com feixes e o logo oficial (drawLogo).
  // Parado: logo completo no centro. Tocando: marca (anel + B) em cima, título e "BASE MUSIC".
  _drawTelao(title) {
    const tv = this._items.get('telao'); if (!tv || !tv.canvas) return;
    title = title || '';
    if (tv.drawn === title) return; tv.drawn = title;
    const g = tv.canvas.getContext('2d'), W = tv.canvas.width, Hh = tv.canvas.height, k = Hh / 580;
    const bg = g.createLinearGradient(0, 0, W, Hh); bg.addColorStop(0, '#1d1040'); bg.addColorStop(0.55, '#3b2080'); bg.addColorStop(1, '#10306e');
    g.fillStyle = bg; g.fillRect(0, 0, W, Hh);
    g.globalCompositeOperation = 'lighter';
    const nb = 8;
    for (let i = 0; i < nb; i++) {
      const x = W * (i + 0.5) / nb, sk = (i - (nb - 1) / 2) * 34 * k, gr = g.createLinearGradient(0, 0, 0, Hh);
      gr.addColorStop(0, 'rgba(190,160,255,0.3)'); gr.addColorStop(1, 'rgba(190,160,255,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(x - 14 * k, 0); g.lineTo(x + 14 * k, 0); g.lineTo(x + 130 * k + sk, Hh); g.lineTo(x - 130 * k + sk, Hh); g.closePath(); g.fill();
    }
    g.globalCompositeOperation = 'source-over';
    g.save(); g.shadowColor = 'rgba(200,180,255,0.8)'; g.shadowBlur = 18 * k;
    if (!title) {
      const lh = Hh * 0.62, lw = lh / logoAspect('full'); drawLogo(g, (W - lw) / 2, (Hh - lh) / 2, lw, { layout: 'full', color: '#ffffff' });
    } else {
      const mw = 170 * k; drawLogo(g, (W - mw) / 2, 44 * k, mw, { layout: 'mark', color: '#ffffff' });
      const font = '-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
      g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `700 ${Math.round(74 * k)}px ${font}`; g.fillText(title, W / 2, 318 * k, W - 160);
      g.fillStyle = 'rgba(255,255,255,.8)'; g.font = `600 ${Math.round(32 * k)}px ${LOGO_FONT}`;
      if ('letterSpacing' in g) g.letterSpacing = `${Math.round(11 * k)}px`;
      g.fillText('BASE MUSIC', W / 2, 418 * k);
      if ('letterSpacing' in g) g.letterSpacing = '0px';
    }
    g.restore();
    tv.tex.needsUpdate = true;
  }

  // Moldura desfocada (branco nas bordas de um retângulo interno, preto dentro e fora) para halos
  // aditivos em volta de telas: o miolo fica preto e não lava a imagem. Padrão (ctx.glowPlane 'frame'):
  // interno 6,0 × 3,4 num plano de 8,4 × 5,8; o telão usa interno 8,4 × 3,0 num plano de 10,6 × 4,8.
  _frameGlowTex(iwM = 6.0, ihM = 3.4, owM = 8.4, ohM = 5.8) {
    const key = [iwM, ihM, owM, ohM].join('x'); this._fgTex = this._fgTex || {};
    if (this._fgTex[key]) return this._fgTex[key];
    const W = 256, Hh = Math.max(64, Math.round(256 * ohM / owM));
    const c = document.createElement('canvas'); c.width = W; c.height = Hh; const g = c.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, W, Hh);
    const iw = W * iwM / owM, ih = Hh * ihM / ohM, ix = (W - iw) / 2, iy = (Hh - ih) / 2;
    g.shadowColor = '#fff'; g.shadowBlur = 26; g.fillStyle = '#fff';
    for (let i = 0; i < 2; i++) g.fillRect(ix, iy, iw, ih);
    g.shadowBlur = 0; g.fillStyle = '#000'; g.fillRect(ix, iy, iw, ih);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; this._fgTex[key] = t; return t;
  }
  // Sombras das PointLights são desenhadas uma vez (autoUpdate = false). Pede um redesenho
  // só das luzes de `key` (ou de todas, sem argumento) — ex.: a porta do hall girou.
  _refreshPointShadows(key) {
    for (const [k, rt] of this._items) {
      if (key && k !== key) continue;
      for (const { L } of rt.lights || []) if (L.castShadow) L.shadow.needsUpdate = true;
    }
    this._needShadow = true;
  }

  // Sombra suave junto às paredes (AO falsa): textura branca com bordas escurecidas.
  // edges: n = z mínimo (topo do canvas), s = z máximo, w = x mínimo, e = x máximo
  _makeAO(w, d, edges = 'nsew') {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 128);
    const fx = Math.min(0.45, 0.55 / w) * 128, fz = Math.min(0.45, 0.55 / d) * 128;
    const strip = (x0, y0, x1, y1, gx0, gy0, gx1, gy1) => { const gr = g.createLinearGradient(gx0, gy0, gx1, gy1); gr.addColorStop(0, 'rgba(0,0,0,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, y1 - y0); };
    if (edges.includes('w')) strip(0, 0, fx, 128, 0, 0, fx, 0);
    if (edges.includes('e')) strip(128 - fx, 0, 128, 128, 128, 0, 128 - fx, 0);
    if (edges.includes('n')) strip(0, 0, 128, fz, 0, 0, 0, fz);
    if (edges.includes('s')) strip(0, 128 - fz, 128, 128, 0, 128, 0, 128 - fz);
    const t = new THREE.CanvasTexture(c); t.channel = 0; return t;
  }

  // Rótulo em sprite de tamanho fixo NA TELA (sizeAttenuation: false; a escala é recalculada em
  // _updateLabels para ~12–16 px de fonte) e com teste de profundidade: de dentro do templo o
  // telão e as paredes escondem os nomes das salas de trás. LOD: de longe só os ambientes principais.
  _makeLabel(text, scale = 1, main = false) {
    const c = document.createElement('canvas'); const s = 2; c.width = 320 * s; c.height = 72 * s;
    const g = c.getContext('2d'); g.scale(s, s);
    g.font = '600 24px -apple-system, BlinkMacSystemFont, Roboto, "Segoe UI", sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    g.lineWidth = 7; g.strokeStyle = 'rgba(6,10,20,.9)'; g.strokeText(text, 160, 36, 300);
    g.fillStyle = '#ffffff'; g.fillText(text, 160, 36, 300);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: true, depthWrite: false, sizeAttenuation: false, fog: false }));
    sp.renderOrder = 20; sp.userData.label = { ls: scale, main, font: clamp(13 * Math.sqrt(scale), 11, 16) };
    return sp;
  }

  // ---- Estado ----
  _applyDemoDefaults() {
    for (const it of ITEMS) this._setItemState(it.key, { state: 'off', attrs: {} });
    this._refreshSub(); this._renderPanel();
  }

  _syncFromHass() {
    const hass = this._hass; if (!hass || !hass.states) return;
    const sig = ITEMS.map((it) => {
      const s = hass.states[this.entity(it.key)]; if (!s) return 'x';
      const a = s.attributes || {};
      return s.state + '|' + JSON.stringify([a.rgb_color, a.brightness, a.temperature, a.current_temperature, a.hvac_action, a.media_title, a.volume_level]);
    }).join(';') + '|' + (hass.states[this.entity('sun')] || {}).state
      + '|' + Object.keys(hass.states).filter((id) => id.startsWith('automation.')).map((id) => { const a = hass.states[id]; return id + ':' + a.state + ':' + ((a.attributes || {}).last_triggered || ''); }).join(',');
    if (sig === this._lastSig) return;
    this._lastSig = sig;
    const seeded = !!this._activitySeeded;
    for (const it of ITEMS) {
      const s = hass.states[this.entity(it.key)];
      const prev = this._state[it.key];
      const next = s ? { state: s.state, attrs: s.attributes || {} } : { state: 'unavailable', attrs: {} };
      // a temperatura muda o tempo todo: não entra no histórico
      if (seeded && prev && prev.state !== next.state && next.state !== 'unavailable' && it.key !== 'temperatura') this._pushActivity(it.key, next.state, Date.now());
      this._setItemState(it.key, next);
      if (s && s.last_changed) this._lastChanged[it.key] = s.last_changed; else if (!s) delete this._lastChanged[it.key];
    }
    // Automações do HA: descobertas pelo domínio; disparos entram na atividade
    const autos = [];
    for (const st of Object.values(hass.states)) {
      if (!st.entity_id || !st.entity_id.startsWith('automation.')) continue;
      const a = st.attributes || {}; const last = a.last_triggered ? new Date(a.last_triggered).getTime() : 0;
      autos.push({ id: st.entity_id, name: a.friendly_name || st.entity_id.slice(11), on: st.state === 'on', last });
      const prevLast = this._autoLast[st.entity_id];
      if (seeded && prevLast !== undefined && last && last !== prevLast) this._pushActivity(st.entity_id, 'triggered', last);
      this._autoLast[st.entity_id] = last;
    }
    autos.sort((x, y) => y.last - x.last);
    this._autos = autos;
    if (!seeded) {
      for (const a of autos) if (a.last) this._pushActivity(a.id, 'triggered', a.last, true);
      // Semente do histórico: última mudança de cada entidade, conforme o HA reporta
      for (const it of ITEMS) { const st = this._state[it.key]; if (it.key !== 'temperatura' && st && !st.unavailable && this._lastChanged[it.key]) this._pushActivity(it.key, st.state, new Date(this._lastChanged[it.key]).getTime(), true); }
      this._activitySeeded = true;
    }
    this._renderPanel();
    this._timeAt = 0;
    this._applyMode();
    this._refreshSub();
  }

  _setItemState(key, { state, attrs }) {
    const it = ITEMS.find((i) => i.key === key); const rt = this._items.get(key); if (!it || !rt) return;
    attrs = attrs || {};
    const unavailable = state === 'unavailable' || state === 'unknown';
    let on = false, val = '';
    if (it.kind === 'light' || it.kind === 'switch') on = state === 'on';
    else if (it.kind === 'climate') {
      on = !unavailable && state !== 'off';
      const t = attrs.temperature, cur = attrs.current_temperature;
      val = unavailable ? 'indisponível' : (on ? `${HVAC_PT[state] || state}${t != null ? ' · ' + t + '°' : ''}` : 'Desligado') + (cur != null ? ` · ${cur}° atual` : '');
    } else if (it.kind === 'media') {
      on = state === 'playing' || state === 'on' || state === 'paused';
      val = unavailable ? 'indisponível' : (MEDIA_PT[state] || state);
      if (state === 'playing' && attrs.media_title) val = attrs.media_title;
      rt.playing = state === 'playing';
      if (key === 'telao') this._drawTelao(on ? attrs.media_title || '' : '');
    } else if (it.kind === 'sensor') {
      if (key === 'presenca') { on = state === 'on'; val = unavailable ? 'indisponível' : on ? 'pessoas no templo' : 'vazio'; }
      else if (key === 'porta') { on = state === 'on'; val = unavailable ? 'indisponível' : on ? 'aberta' : 'fechada'; }
      else if (key === 'temperatura') { const n = parseFloat(state); on = !unavailable && !isNaN(n); val = on ? `${(Math.round(n * 10) / 10).toLocaleString('pt-BR')} °C` : 'indisponível'; }
      else { on = state === 'on'; val = unavailable ? 'indisponível' : state; }
    }
    if ((it.kind === 'light' || it.kind === 'switch') && unavailable) val = 'indisponível';
    this._state[key] = { on, state, attrs, unavailable };
    rt.target = on ? 1 : 0;
    // brilho (qualquer luz dimerizável) e cor (RGB)
    rt.brightScale = it.kind === 'light' && attrs.brightness != null ? clamp(attrs.brightness / 255, 0.08, 1) : 1;
    if (it.rgb) {
      const rgb = attrs.rgb_color;
      const c = rgb ? new THREE.Color(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255) : new THREE.Color(it.color);
      rt.color.copy(c);
      for (const f of rt.fixtures || []) if (f.material && f.material.emissive) f.material.emissive.copy(c);
    }
    if (it.kind === 'climate') { rt.hvac = state; rt.on = on; }
    this._state[key].text = val;
    this._needShadow = true;
  }

  _refreshSub() {
    const lights = ITEMS.filter((i) => i.kind === 'light');
    const n = lights.filter((i) => this._state[i.key] && this._state[i.key].on).length;
    const hasHass = !!this._hass;
    this._subEl.textContent = `${n} de ${lights.length} luzes acesas` + (hasHass ? '' : ' · demo');
    this._renderPanel();
  }

  // Relógio + sol: hora local (ou simulada), elevação/azimute (do HA quando houver)
  _updateTime(force = false) {
    const now = Date.now();
    if (!force && this._timeAt && now - this._timeAt < 1000) return;
    this._timeAt = now;
    const cfg = this._config, hc = this._hass && this._hass.config;
    const lat = hc && hc.latitude != null ? hc.latitude : cfg.latitude, lon = hc && hc.longitude != null ? hc.longitude : cfg.longitude;
    const tz = (hc && hc.time_zone) || cfg.timezone;
    const date = this._simTime ? new Date(this._simTime) : new Date(now);
    let sun = null;
    const hs = this._hass && this._hass.states && this._hass.states[this.entity('sun')];
    if (!this._simTime && hs && hs.attributes && hs.attributes.elevation != null) sun = { elevation: +hs.attributes.elevation, azimuth: +hs.attributes.azimuth };
    else sun = solarPosition(date, lat, lon);
    this._sunInfo = sun;
    let per; const el = sun.elevation;
    let hour = date.getHours();
    try { hour = +new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).format(date); } catch (_) {}
    if (el > 6) per = hour < 12 ? 'Manhã' : 'Tarde'; else if (el > -4) per = hour < 12 ? 'Amanhecer' : 'Entardecer'; else per = hour < 5 || hour >= 22 ? 'Noite' : hour < 12 ? 'Madrugada' : 'Noite';
    let txt = '';
    try { txt = new Intl.DateTimeFormat('pt-BR', { timeZone: tz, weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date); } catch (_) { txt = date.toLocaleString('pt-BR'); }
    txt = txt.replace(/\.,?/g, '').replace(/, /g, ' · ');
    // nascer/pôr do sol do dia (varredura de 5 em 5 min; recalcula uma vez por dia)
    const dayKey = Math.floor((date.getTime() - 3 * 3600000) / 86400000);
    if (this._sunDay !== dayKey) {
      this._sunDay = dayKey; let rise = null, set = null, prev = null;
      const d0 = new Date(date); d0.setHours(0, 0, 0, 0);
      for (let m = 0; m <= 1440; m += 5) { const el2 = solarPosition(new Date(d0.getTime() + m * 60000), lat, lon).elevation; if (prev !== null) { if (prev < -0.83 && el2 >= -0.83) rise = d0.getTime() + m * 60000; if (prev >= -0.83 && el2 < -0.83) set = d0.getTime() + m * 60000; } prev = el2; }
      this._sunTimes = { rise, set };
    }
    const stt = this._sunTimes || {};
    const sunTxt = stt.rise && stt.set ? ` · ☀ ${fmtClock(stt.rise, tz)}–${fmtClock(stt.set, tz)}` : '';   // no fuso da igreja, não no do navegador
    if (this._clockEl) this._clockEl.innerHTML = `${txt} · <span class="per">${per}${this._simTime ? ' · simulado' : ''}</span><span class="suntimes">${sunTxt}</span>`;
  }
  setSimTime(date) { this._simTime = date ? new Date(date).getTime() : null; this._updateTime(true); this._orbit.dirty = true; }
  _applyMode() {
    this._updateTime(true);
    const el = this._sunInfo ? this._sunInfo.elevation : -20;
    const night = this._mode === 'night' ? true : this._mode === 'day' ? false : el < 1;
    this._night = night;
    for (const [m, b] of Object.entries(this._modeBtns)) b.setAttribute('aria-pressed', m === this._mode ? 'true' : 'false');
    this._nvBtn.setAttribute('aria-pressed', this._nightVision ? 'true' : 'false');
    this._nvBtn.disabled = !night; this._nvBtn.style.opacity = night ? '' : '.55';
    this._needShadow = true;
  }

  _setLabels(on) {
    this._labelsOn = on;
    // no modo Fachada os rótulos (desenhados por cima de tudo) ficariam soltos na frente das paredes altas
    for (const s of this._labels || []) s.visible = on && !this._roofOn;
    this._labelsBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    this._updateLabels(); if (this._orbit) this._orbit.dirty = true;
  }
  // Tamanho fixo na tela (fonte ~12–16 px), some perto da câmera (< 5 m, esmaecendo até 9 m) e,
  // com a câmera a mais de 35 m do alvo, só os ambientes principais (Templo, Hall, Estacionamento…)
  _updateLabels() {
    if (!this._labels || !this._labelsOn || this._roofOn || !this._camera) return;
    const cam = this._camera, k = 2 * Math.tan(cam.fov * Math.PI / 360) / (this._vh || 600);
    const far = this._orbit && cam.position.distanceTo(this._orbit.target) > 35;
    // celular (tela estreita): de longe só os maiores (Templo, Hall, Estacionamento, Pastoral, Pátio) — os outros se sobrepõem
    const narrow = (this.clientWidth || 1000) < 560;
    // câmera baixa (dentro do prédio / altura de gente): só os rótulos até ~20 m, os do fundo não poluem
    const reach = cam.position.y < 8 ? 20 : 1e9;
    for (const s of this._labels) {
      const L = s.userData.label; if (!L) continue;
      const d = cam.position.distanceTo(s.position);
      const op = clamp((d - 5) / 4, 0, 1) * clamp((reach - d) / 4, 0, 1) * (far && (!L.main || (narrow && L.ls < 1)) ? 0 : 1);
      s.visible = op > 0.02; s.material.opacity = op;
      const hpx = L.font * 3;   // texto de 24 px num canvas de 72 px → sprite com 3× a altura da fonte
      s.scale.set(hpx * k * 320 / 72, hpx * k, 1);
    }
  }

  // Posição inicial da câmera: prédio inteiro (lote ~20 × 60 m) em diagonal, por cima,
  // vendo a fachada; em telas estreitas (retrato) sobe e afasta para caber tudo.
  // A câmera vem da frente (lado do estacionamento), um pouco à direita e alta: a fachada com o
  // painel ripado e o logo fica de frente e legível, e o interior (palco/telão) aparece por cima das paredes.
  _homeFor(aspect) {
    const panel = !!(this._panelOpen && this._dock && !this._dock.hidden);
    if (aspect < 1.0) {
      // retrato: vista mais de cima, com o comprimento do lote na vertical da tela
      // (a faixa visível já desconta o HUD e o painel: ver _resize) com o painel aberto chega um pouco mais perto
      const target = new THREE.Vector3(9.5, 0, 31);
      const dir = new THREE.Vector3(0.45, 1.6, 1.0).normalize();
      return { pos: target.clone().addScaledVector(dir, 66 * Math.sqrt(1 / Math.max(aspect, 0.3)) * (panel ? 0.9 : 1)), target };
    }
    // paisagem: abaixo de 1,8 o limite é a largura → afasta
    // o palco fica na parede alta x = 0 virado para +x: a câmera vem um pouco da direita para ver o palco/telão em
    // diagonal e ainda ler o logo do ripado da fachada (z 49,65); a parede alta vira o fundo da cena, não esconde o interior
    const target = new THREE.Vector3(9.8, 0, 33.5);
    const dir = new THREE.Vector3(0.62, 1.2, 1.0).normalize();
    const k = aspect >= 1.8 ? 1 : 1.8 / aspect;
    return { pos: target.clone().addScaledVector(dir, 47 * k), target };
  }
  _setRoof(on) {
    this._roofOn = !!on;
    if (this._ext) this._ext.visible = this._roofOn;
    if (this._items) this._refreshPointShadows();   // paredes altas entram/saem: refaz as sombras das luzes uma vez
    if (this._labelsBtn) this._setLabels(!!this._labelsOn);
    this._roofBtn.setAttribute('aria-pressed', this._roofOn ? 'true' : 'false');
    this._needShadow = true; this._orbit.dirty = true;
  }
  _resetView() { this._home = this._homeFor(this._camera.aspect); this._orbit.reset(this._home.pos, this._home.target); this._orbit.touched = false; }

  // ---- Ganchos públicos (depuração / demo) ----
  // setView([x,y,z],[tx,ty,tz]) — posiciona a câmera na hora (e para de recentrar sozinha)
  setView(pos, target) {
    if (!this._orbit) return;
    const p = new THREE.Vector3(...pos), t = new THREE.Vector3(...(target || [LOT.cx, 0, LOT.cz]));
    this._orbit.reset(p, t); this._orbit.sph.copy(this._orbit.goal); this._orbit.target.copy(t);
    this._orbit.touched = true; this._orbit.dirty = true;
  }
  setFachada(on) { this._setRoof(!!on); }
  // setMode('auto'|'day'|'night') — troca o ambiente na hora (sem a transição suave dos botões)
  setMode(mode) { if (['auto', 'day', 'night'].includes(mode)) { this._mode = mode; this._applyMode(); this._nightLevel = undefined; if (this._orbit) this._orbit.dirty = true; } }

  // ---- Ações ----
  _activate(key) {
    const it = ITEMS.find((i) => i.key === key); if (!it) return;
    const eid = this.entity(key);
    const hass = this._hass;
    if (it.kind === 'light' || it.kind === 'switch') {
      // Otimista: acende já, o HA confirma em seguida
      const st = this._state[key] || { on: false, attrs: {} };
      if (!st.unavailable) this._setItemState(key, { state: st.on ? 'off' : 'on', attrs: st.attrs });
      this._refreshSub(); this._renderPanel();
      if (hass && hass.callService) hass.callService('homeassistant', 'toggle', { entity_id: eid });
    } else {
      this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: eid }, bubbles: true, composed: true }));
    }
    this._lastSig = '';
  }

  _pick(e) {
    const r = this._canvas.getBoundingClientRect();
    this._ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this._raycaster.setFromCamera(this._ndc, this._camera);
    const hits = this._raycaster.intersectObjects(this._clickables, false);
    // ignora o que está escondido (ex.: luminárias do modo Fachada com o botão desligado)
    for (const h of hits) { let vis = true; for (let o = h.object; o; o = o.parent) if (!o.visible) { vis = false; break; } if (vis) return h.object; }
    return null;
  }
  _onClick(e) { const o = this._pick(e); if (o && o.userData.item) { this._activate(o.userData.item); this._flashRow(o.userData.item); } }
  _onHover(e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    const o = this._pick(e);
    this._canvas.classList.toggle('pick', !!o);
    if (o !== this._hoverObj) {
      // zonas em L têm vários retângulos: realça todos
      const tint = (obj, hex) => { if (obj && obj.userData.zone) for (const m of this._zoneMeshes[obj.userData.zone] || [obj]) m.material.emissive.setHex(hex); };
      tint(this._hoverObj, 0x000000); tint(o, 0x1a1a1a);
      this._hoverObj = o; this._orbit.dirty = true;
    }
  }

  // ---- Painel inferior: cômodos (blocos), rotinas, atividade ----
  _svc(domain, service, entity, data) {
    const payload = Object.assign({ entity_id: entity }, data || {});
    if (this._hass && this._hass.callService) this._hass.callService(domain, service, payload);
    this._lastSig = '';
  }
  _sceneCtx() {
    return { e: (k) => this.entity(k), on: (k) => this._svc('homeassistant', 'turn_on', this.entity(k)), off: (k) => this._svc('homeassistant', 'turn_off', this.entity(k)), call: (d, sv, e, data) => this._svc(d, sv, e, data) };
  }
  _dotColor(key) { return { palco: '#c084fc', telao: '#c4b5fd', som: '#4ade80', ac_templo: '#67d3ff', ac_pastoral: '#67d3ff', presenca: '#f472b6', porta: '#fbbf24', temperatura: '#fb923c', midia: '#a5c8ff' }[key] || '#ffc46b'; }
  // Temporizador local: desliga a entidade depois de N minutos (enquanto o cartão estiver aberto)
  _setTimer(key, minutes) {
    const cur = this._timers[key]; if (cur) { clearTimeout(cur.handle); delete this._timers[key]; }
    if (minutes > 0) {
      const at = Date.now() + minutes * 60000;
      const handle = setTimeout(() => { delete this._timers[key]; this._svc('homeassistant', 'turn_off', this.entity(key)); this._pushActivity(key, 'off', Date.now()); this._renderPanel(); }, minutes * 60000);
      this._timers[key] = { at, handle, min: minutes };
    }
    this._renderPanel();
  }
  _timerText(key, now = Date.now()) {
    const t = this._timers[key]; if (!t) return '';
    const m = Math.max(1, Math.round((t.at - now) / 60000)); return ` · desliga em ${m} min`;
  }
  _setPanel(open) {
    this._panelOpen = !!open;
    this._dock.hidden = !open; this._reopen.hidden = !!open;
    if (this._weatherEl) this._weatherEl.classList.toggle('out', !!open);
    this._panelBtn.setAttribute('aria-pressed', open ? 'true' : 'false');
    if (open) this._renderPanel();
    requestAnimationFrame(() => this._resize());
  }
  _buildPanel(wrap) {
    this._wrap = wrap;
    const dock = document.createElement('div'); dock.className = 'panel dock'; dock.hidden = true; wrap.appendChild(dock); this._dock = dock;
    const tabs = document.createElement('div'); tabs.className = 'tabs'; tabs.setAttribute('role', 'tablist'); dock.appendChild(tabs);
    this._panes = {};
    const panes = [];
    for (const [id, label] of [['ctl', 'Ambientes'], ['scn', 'Automações'], ['act', 'Atividade']]) {
      const b = document.createElement('button'); b.textContent = label; b.setAttribute('role', 'tab'); b.dataset.tab = id;
      b.addEventListener('click', () => this._showTab(id)); tabs.appendChild(b);
      const pane = document.createElement('div'); pane.className = 'pane'; pane.dataset.pane = id; panes.push(pane);
      this._panes[id] = { btn: b, pane };
    }
    const spacer = document.createElement('div'); spacer.className = 'spacer'; tabs.appendChild(spacer);
    this._countEl = document.createElement('span'); this._countEl.className = 'count'; tabs.appendChild(this._countEl);
    const col = document.createElement('button'); col.className = 'collapse'; col.title = 'Recolher painel'; col.setAttribute('aria-label', 'Recolher painel');
    col.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6l5 5 5-5"/></svg>';
    col.addEventListener('click', () => this._setPanel(false)); tabs.appendChild(col);
    for (const pane of panes) dock.appendChild(pane);
    this._reopen = document.createElement('button'); this._reopen.className = 'panel btn reopen'; this._reopen.textContent = 'Painel ▴'; this._reopen.hidden = true;
    this._reopen.addEventListener('click', () => this._setPanel(true)); wrap.appendChild(this._reopen);
    this._buildWeather(wrap);

    // Ambientes: blocos quadrados agrupados por área
    this._tiles = {};
    const grid = document.createElement('div'); grid.className = 'tiles'; this._panes.ctl.pane.appendChild(grid); this._grid = grid;
    this._detail = document.createElement('div'); this._detail.className = 'detail'; this._detail.hidden = true; grid.appendChild(this._detail);
    const ROOMS = [['Templo', ['palco', 'plateia', 'telao', 'som', 'ac_templo', 'presenca', 'temperatura']], ['Entrada', ['hall', 'fachada', 'estacionamento', 'porta', 'familia', 'banheiros']],
      ['Administração', ['recepcao', 'pastoral', 'ac_pastoral', 'administrativo', 'circulacao']], ['Apoio', ['midia', 'voluntariado', 'cozinha']]];
    for (const [title, keys] of ROOMS) for (const k of keys) grid.appendChild(this._makeTile(ITEMS.find((i) => i.key === k), title));
    this._timers = {};
    // Automações: rotinas rápidas do cartão + automações do HA (descobertas sozinhas)
    const h1 = document.createElement('div'); h1.className = 'sect'; h1.textContent = 'Rotinas rápidas'; this._panes.scn.pane.appendChild(h1);
    const rgrid = document.createElement('div'); rgrid.className = 'tiles'; this._panes.scn.pane.appendChild(rgrid);
    const h2 = document.createElement('div'); h2.className = 'sect'; h2.innerHTML = 'Automações do Home Assistant <small>ligar/desligar · executar agora</small>'; this._panes.scn.pane.appendChild(h2);
    this._autoList = document.createElement('div'); this._autoList.className = 'autos'; this._panes.scn.pane.appendChild(this._autoList);
    for (const sc of SCENES) {
      const b = document.createElement('button'); b.className = 'tile routine';
      b.innerHTML = `<span class="ico">${iconSvg(sc.icon)}</span><span><b>${sc.name}</b><small>${sc.desc}</small></span>`;
      b.addEventListener('click', () => { sc.run(this._sceneCtx()); b.classList.add('flash'); setTimeout(() => b.classList.remove('flash'), 700); });
      rgrid.appendChild(b);
    }
    // Atividade
    this._feed = document.createElement('ul'); this._feed.className = 'feed'; this._panes.act.pane.appendChild(this._feed);
    this._showTab('ctl');
  }
  // Clima ao vivo (Open-Meteo, sem chave) — atualiza a cada 15 min
  _buildWeather(wrap) {
    if (!this._config.weather) return;
    const w = document.createElement('div'); w.className = 'panel weather'; wrap.appendChild(w); this._weatherEl = w;
    const top = document.createElement('div'); top.className = 'wtop';
    const ico = document.createElement('span'); ico.className = 'wicon'; ico.innerHTML = iconSvg('cloudsun');
    const temp = document.createElement('span'); temp.className = 'wtemp'; temp.textContent = '—';
    top.append(ico, temp); w.appendChild(top);
    const city = document.createElement('div'); city.className = 'wcity'; city.textContent = this._config.weather_city || 'Local';
    const cond = document.createElement('div'); cond.className = 'wcond'; cond.textContent = 'Carregando…';
    const meta = document.createElement('div'); meta.className = 'wmeta';
    const upd = document.createElement('div'); upd.className = 'wupd'; upd.textContent = '';
    w.append(city, cond, meta, upd);
    this._weatherUI = { ico, temp, cond, meta, upd };
    this._fetchWeather();
  }
  async _fetchWeather() {
    const ui = this._weatherUI; if (!ui) return;
    const lat = this._config.latitude, lon = this._config.longitude;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day&timezone=auto`;
    try {
      const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(url, { signal: ctrl.signal }); clearTimeout(to);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const j = await res.json(); const c = j.current; if (!c) throw new Error('sem dados');
      const [iconKey, desc] = WEATHER_CODE[c.weather_code] || ['cloud', '—'];
      const icon = !c.is_day && iconKey === 'sun' ? 'moon' : !c.is_day && iconKey === 'cloudsun' ? 'cloud' : iconKey;
      ui.ico.innerHTML = iconSvg(icon);
      ui.temp.innerHTML = `${Math.round(c.temperature_2m)}<sup>°C</sup>`;
      ui.cond.textContent = desc;
      ui.meta.innerHTML = `<span>sensação ${Math.round(c.apparent_temperature)}°</span><span>${Math.round(c.wind_speed_10m)} km/h</span>`;
      ui.upd.textContent = `atualizado ${fmtClock(Date.now())}`;
      this._weatherOk = true;
    } catch (err) {
      if (!this._weatherOk) { ui.cond.textContent = 'Indisponível'; ui.upd.textContent = 'sem conexão'; }
      console.warn('[igreja3d-card] clima indisponível:', err && err.message);
    }
  }
  _showTab(id) {
    for (const [k, t] of Object.entries(this._panes)) { t.btn.setAttribute('aria-selected', k === id ? 'true' : 'false'); t.pane.classList.toggle('active', k === id); }
  }
  _hasDetail(it) { return it.kind !== 'sensor'; }
  _makeTile(it, room) {
    const tile = document.createElement('button'); tile.className = 'tile'; tile.dataset.key = it.key; tile.setAttribute('aria-pressed', 'false');
    const top = document.createElement('span'); top.className = 'top';
    const ico = document.createElement('span'); ico.className = 'ico'; ico.innerHTML = iconSvg(it.icon); top.appendChild(ico);
    const txt = document.createElement('span');
    const eye = document.createElement('span'); eye.className = 'eyebrow'; eye.textContent = room || '';
    const b = document.createElement('b'); b.textContent = it.label; const small = document.createElement('small'); txt.append(eye, b, small);
    tile.append(top, txt);
    tile.style.setProperty('--dot', this._dotColor(it.key));
    const t = { tile, small, it };
    if (this._hasDetail(it)) {
      const more = document.createElement('span'); more.className = 'more'; more.textContent = '⋯'; more.title = 'Mais controles'; more.setAttribute('role', 'button'); more.tabIndex = 0;
      more.addEventListener('click', (e) => { e.stopPropagation(); this._openDetail(it.key); });
      more.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); this._openDetail(it.key); } });
      top.appendChild(more);
    }
    tile.addEventListener('click', () => {
      if (it.kind === 'sensor') { this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: this.entity(it.key) }, bubbles: true, composed: true })); return; }
      if (it.kind === 'light' || it.kind === 'switch') this._activate(it.key);
      else if (it.kind === 'climate') this._svc('climate', 'set_hvac_mode', this.entity(it.key), { hvac_mode: this._state[it.key] && this._state[it.key].on ? 'off' : 'cool' });
      else if (it.kind === 'media') this._svc('media_player', this._state[it.key] && this._state[it.key].on ? 'turn_off' : 'turn_on', this.entity(it.key));
    });
    this._tiles[it.key] = t; return tile;
  }
  // Faixa de detalhes (brilho/cor do LED, modo/temperatura do ar, controles da TV)
  _openDetail(key) {
    const it = ITEMS.find((i) => i.key === key); if (!it) return;
    const d = this._detail; d.innerHTML = ''; d.hidden = false; d.dataset.key = key; this._detailKey = key;
    this._dSw = this._dSmall = this._dModes = this._dOut = this._dPP = this._dVol = this._dTimer = null;
    const title = document.createElement('div'); title.className = 'dtitle'; title.style.setProperty('--dot', this._dotColor(key));
    title.innerHTML = `<span class="ico">${iconSvg(it.icon)}</span><span><b>${it.label}</b><small></small></span>`;
    d.appendChild(title); this._dSmall = title.querySelector('small');
    const sw = document.createElement('button'); sw.className = 'sw'; sw.setAttribute('role', 'switch'); sw.setAttribute('aria-checked', 'false'); sw.setAttribute('aria-label', `${it.label} ligado`);
    d.appendChild(sw); this._dSw = sw;
    if (it.rgb || it.dim) {
      sw.addEventListener('click', () => this._activate(key));
      const range = document.createElement('input'); range.type = 'range'; range.min = 1; range.max = 100; range.setAttribute('aria-label', 'Brilho');
      const st = this._state[key]; range.value = st && st.attrs && st.attrs.brightness != null ? Math.round(st.attrs.brightness / 2.55) : 100;
      range.addEventListener('change', () => this._svc('light', 'turn_on', this.entity(key), { brightness_pct: +range.value }));
      d.append(range);
      if (it.rgb) {
        const sws = document.createElement('div'); sws.className = 'swatches';
        for (const [name, rgb] of LED_PRESETS) { const c = document.createElement('button'); c.className = 'swatch'; c.title = name; c.setAttribute('aria-label', name); c.style.background = `rgb(${rgb.join(',')})`; c.addEventListener('click', () => this._svc('light', 'turn_on', this.entity(key), { rgb_color: rgb })); sws.appendChild(c); }
        d.append(sws);
      }
    } else if (it.kind === 'climate') {
      sw.addEventListener('click', () => this._svc('climate', 'set_hvac_mode', this.entity(key), { hvac_mode: this._state[key] && this._state[key].on ? 'off' : 'cool' }));
      const seg = document.createElement('div'); seg.className = 'seg2'; this._dModes = {};
      for (const m of ['cool', 'fan_only', 'dry', 'heat_cool']) { const mb = document.createElement('button'); mb.textContent = HVAC_PT[m]; mb.addEventListener('click', () => this._svc('climate', 'set_hvac_mode', this.entity(key), { hvac_mode: m })); seg.appendChild(mb); this._dModes[m] = mb; }
      const step = document.createElement('div'); step.className = 'step';
      const minus = document.createElement('button'); minus.textContent = '−'; minus.setAttribute('aria-label', 'Diminuir temperatura');
      const out = document.createElement('output'); out.textContent = '—';
      const plus = document.createElement('button'); plus.textContent = '+'; plus.setAttribute('aria-label', 'Aumentar temperatura');
      const bump = (dd) => { const st = this._state[key]; const a = (st && st.attrs) || {}; const cur = a.temperature != null ? a.temperature : 23; const tt = clamp(cur + dd, a.min_temp || 16, a.max_temp || 31); out.textContent = `${tt}°`; this._svc('climate', 'set_temperature', this.entity(key), { temperature: tt }); };
      minus.addEventListener('click', () => bump(-1)); plus.addEventListener('click', () => bump(1));
      step.append(minus, out, plus); d.append(seg, step); this._dOut = out;
    } else if (it.kind === 'media') {
      sw.addEventListener('click', () => this._svc('media_player', this._state[key] && this._state[key].on ? 'turn_off' : 'turn_on', this.entity(key)));
      const mk = (html, label, fn) => { const x = document.createElement('button'); x.className = 'mbtn'; x.innerHTML = html; x.setAttribute('aria-label', label); x.addEventListener('click', fn); d.appendChild(x); return x; };
      this._dPP = mk(iconSvg('play'), 'Tocar / pausar', () => this._svc('media_player', 'media_play_pause', this.entity(key)));
      mk('−', 'Volume −', () => this._svc('media_player', 'volume_down', this.entity(key)));
      mk('+', 'Volume +', () => this._svc('media_player', 'volume_up', this.entity(key)));
      const vol = document.createElement('small'); d.appendChild(vol); this._dVol = vol;
    }
    if (it.kind === 'light' || it.kind === 'switch') {
      if (!it.rgb && !it.dim) sw.addEventListener('click', () => this._activate(key));
      const tm = document.createElement('div'); tm.className = 'seg2 timerseg'; tm.setAttribute('aria-label', 'Desligar em');
      const lab = document.createElement('span'); lab.className = 'tlab'; lab.innerHTML = `${iconSvg('timer')} desligar em`; tm.appendChild(lab);
      for (const m of [15, 30, 60]) { const b = document.createElement('button'); b.textContent = `${m} min`; b.addEventListener('click', () => this._setTimer(key, m)); tm.appendChild(b); }
      const cancel = document.createElement('button'); cancel.textContent = 'cancelar'; cancel.addEventListener('click', () => this._setTimer(key, 0)); tm.appendChild(cancel);
      d.appendChild(tm); this._dTimer = tm;
    }
    const close = document.createElement('button'); close.className = 'close'; close.textContent = '×'; close.setAttribute('aria-label', 'Fechar');
    close.addEventListener('click', () => { d.hidden = true; this._detailKey = null; }); d.appendChild(close);
    this._showTab('ctl'); this._renderPanel();
    d.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  _stateText(it, st) {
    if (!st || st.unavailable) return 'indisponível';
    const a = st.attrs || {};
    if (it.kind === 'climate') return st.on ? `${HVAC_PT[st.state] || st.state}${a.temperature != null ? ` · ${a.temperature}°` : ''}${a.current_temperature != null ? ` · ${a.current_temperature}° atual` : ''}` : `Desligado${a.current_temperature != null ? ` · ${a.current_temperature}° atual` : ''}`;
    if (it.kind === 'media') return st.state === 'playing' && a.media_title ? `${a.media_title}` : (MEDIA_PT[st.state] || st.state);
    if (it.kind === 'sensor') return st.text || st.state;
    if (it.kind === 'switch') return st.on ? 'ligado' : 'desligado';
    const pct = st.on && a.brightness != null && (it.dim || it.rgb) ? ` · ${Math.round(a.brightness / 2.55)}%` : '';
    return (st.on ? 'acesa' : 'apagada') + pct;
  }
  _renderPanel() {
    if (!this._tiles) return;
    const now = Date.now();
    for (const [k, t] of Object.entries(this._tiles)) {
      const st = this._state[k]; const on = !!(st && st.on);
      t.tile.classList.toggle('on', on); t.tile.classList.toggle('unavailable', !!(st && st.unavailable));
      t.tile.setAttribute('aria-pressed', on ? 'true' : 'false');
      const lc = this._lastChanged[k];
      t.small.textContent = this._stateText(t.it, st) + (lc ? ` · ${fmtRel(lc, now)}` : '') + this._timerText(k, now);
      if (t.it.rgb && st && st.attrs && st.attrs.rgb_color) t.tile.style.setProperty('--dot', `rgb(${st.attrs.rgb_color.join(',')})`);
    }
    const lights = ITEMS.filter((i) => i.kind === 'light');
    const n = lights.filter((i) => this._state[i.key] && this._state[i.key].on).length;
    if (this._countEl) this._countEl.textContent = `${n} de ${lights.length} luzes acesas`;
    const key = this._detailKey;
    if (key && this._detail && !this._detail.hidden) {
      const st = this._state[key]; const on = !!(st && st.on); const it = ITEMS.find((i) => i.key === key);
      if (this._dSw) this._dSw.setAttribute('aria-checked', on ? 'true' : 'false');
      if (this._dSmall) this._dSmall.textContent = this._stateText(it, st) + this._timerText(key, now);
      if (this._dTimer) for (const b of this._dTimer.querySelectorAll('button')) b.setAttribute('aria-pressed', this._timers[key] && b.textContent === `${this._timers[key].min} min` ? 'true' : 'false');
      if (this._dModes) for (const [m, mb] of Object.entries(this._dModes)) mb.setAttribute('aria-pressed', st && st.state === m ? 'true' : 'false');
      if (this._dOut && st && st.attrs && st.attrs.temperature != null) this._dOut.textContent = `${st.attrs.temperature}°`;
      if (this._dPP) this._dPP.innerHTML = iconSvg(st && st.state === 'playing' ? 'pause' : 'play');
      if (this._dVol && st && st.attrs) this._dVol.textContent = st.attrs.volume_level != null ? `vol ${Math.round(st.attrs.volume_level * 100)}%` : '';
    }
    this._renderFeed(now);
  }
  _pushActivity(key, state, ts, seed = false) {
    this._activity.push({ key, state, ts, seed });
    this._activity.sort((a, b) => b.ts - a.ts);
    if (this._activity.length > 40) this._activity.length = 40;
  }
  _renderAutos(now = Date.now()) {
    const el = this._autoList; if (!el) return;
    el.innerHTML = '';
    if (!this._autos.length) { const e = document.createElement('div'); e.className = 'empty'; e.textContent = this._hass ? 'Nenhuma automação encontrada no Home Assistant.' : 'As automações do HA aparecem aqui quando o cartão está no Home Assistant.'; el.appendChild(e); return; }
    for (const a of this._autos) {
      const row = document.createElement('div'); row.className = 'auto ' + (a.on ? 'on' : 'off');
      row.innerHTML = `<span class="ico">${iconSvg('auto')}</span><span><b>${a.name}</b><small>${a.last ? `última execução ${fmtClock(a.last)} · ${fmtRel(a.last, now)}` : 'nunca executou'}${a.on ? '' : ' · desativada'}</small></span>`;
      const sw = document.createElement('button'); sw.className = 'sw'; sw.setAttribute('role', 'switch'); sw.setAttribute('aria-checked', a.on ? 'true' : 'false'); sw.setAttribute('aria-label', `${a.name} ativa`);
      sw.addEventListener('click', () => { a.on = !a.on; this._svc('automation', a.on ? 'turn_on' : 'turn_off', a.id); this._renderAutos(); });
      const run = document.createElement('button'); run.className = 'run'; run.innerHTML = iconSvg('play'); run.title = 'Executar agora'; run.setAttribute('aria-label', `Executar ${a.name}`);
      run.addEventListener('click', () => { this._svc('automation', 'trigger', a.id, { skip_condition: true }); row.classList.add('flash'); setTimeout(() => row.classList.remove('flash'), 600); });
      row.append(sw, run); el.appendChild(row);
    }
  }
  _renderFeed(now = Date.now()) {
    if (!this._feed) return;
    this._renderAutos(now);
    this._feed.innerHTML = '';
    if (!this._activity.length) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = 'Nenhuma atividade ainda.'; this._feed.appendChild(li); return; }
    for (const ev of this._activity.slice(0, 30)) {
      if (ev.state === 'triggered') {
        const a = this._autos.find((x) => x.id === ev.key); const li = document.createElement('li'); li.classList.add('on'); li.style.setProperty('--dot', '#ffd48a');
        li.innerHTML = `<i class="d"></i><span><b>${a ? a.name : ev.key}</b> disparou</span><time>${fmtClock(ev.ts)} · ${fmtRel(ev.ts, now)}</time>`;
        this._feed.appendChild(li); continue;
      }
      const it = ITEMS.find((i) => i.key === ev.key); if (!it) continue;
      const li = document.createElement('li');
      const on = it.kind === 'climate' ? ev.state !== 'off' : it.kind === 'media' ? (ev.state === 'playing' || ev.state === 'on' || ev.state === 'paused') : ev.state === 'on';
      li.classList.toggle('on', on); li.style.setProperty('--dot', this._dotColor(it.key));
      let what;
      if (it.kind === 'climate') what = ev.state === 'off' ? 'desligado' : `→ ${HVAC_PT[ev.state] || ev.state}`;
      else if (it.kind === 'media') what = `→ ${MEDIA_PT[ev.state] || ev.state}`;
      else if (it.kind === 'sensor') what = it.key === 'presenca' ? (ev.state === 'on' ? '→ pessoas no templo' : '→ vazio') : it.key === 'porta' ? (ev.state === 'on' ? 'aberta' : 'fechada') : `→ ${ev.state} °C`;
      else if (it.kind === 'switch') what = ev.state === 'on' ? 'ligado' : 'desligado';
      else what = ev.state === 'on' ? 'acesa' : 'apagada';
      li.innerHTML = `<i class="d"></i><span><b>${it.label}</b> ${what}</span><time datetime="${new Date(ev.ts).toISOString()}">${fmtClock(ev.ts)} · ${fmtRel(ev.ts, now)}</time>`;
      this._feed.appendChild(li);
    }
  }
  _flashRow(key) {
    const t = this._tiles && this._tiles[key]; if (!t || !this._panelOpen) return;
    this._showTab('ctl'); t.tile.classList.add('flash'); t.tile.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    setTimeout(() => t.tile.classList.remove('flash'), 900);
  }

  // ---- Loop ----
  _resize() {
    if (!this._renderer) return;
    const w = Math.max(1, this.clientWidth), h = Math.max(1, this.clientHeight);
    // Orçamento de ~1,8 Mpx por quadro (1 Mpx no leve): em telas Retina grandes baixa o pixel ratio
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, this._lite ? 1.25 : 2, Math.sqrt((this._lite ? 1.0e6 : 1.8e6) / (w * h))));
    this._renderer.setPixelRatio(dpr);
    this._renderer.setSize(w, h, false);
    // Com o painel aberto, a cena é enquadrada na área visível acima dele
    const P = this._panelOpen && this._dock && !this._dock.hidden ? Math.min(this._dock.offsetHeight + 12, h * 0.6) : 0;
    // no celular o HUD de cima (título + botões em 2 linhas) cobre ~150 px: a cena é enquadrada entre ele e o painel
    const hudH = this._hudTop ? this._hudTop.offsetHeight : 0, U = hudH > 90 ? Math.min(hudH, h * 0.3) : 0;
    const vh = Math.max(120, h - P - U); this._vh = vh;
    this._camera.aspect = w / vh;
    if (P > 0 || U > 0) this._camera.setViewOffset(w, vh, 0, -U, w, h); else this._camera.clearViewOffset();
    this._camera.updateProjectionMatrix();
    if (!this._orbit.touched) this._resetView();
    this._orbit.dirty = true;
  }
  _start() {
    if (this._raf || !this._renderer) return;
    this._clock.start();
    const tick = () => { this._raf = requestAnimationFrame(tick); this._frame(); };
    this._raf = requestAnimationFrame(tick);
  }
  _stop() { if (this._raf) cancelAnimationFrame(this._raf); this._raf = 0; this._clock.stop(); }

  _frame() {
    const dt = Math.min(this._clock.getDelta(), 0.1);
    const t = this._clock.elapsedTime;
    let dirty = this._orbit.update(dt);
    const k = 1 - Math.exp(-dt * 7);
    // Ambiente dia/noite — em "auto" segue a elevação do sol (transição suave no crepúsculo)
    this._updateTime();
    const elev = this._sunInfo ? this._sunInfo.elevation : -20;
    const nightGoal = this._mode === 'night' ? 1 : this._mode === 'day' ? 0 : clamp((6 - elev) / 10, 0, 1);
    if (this._mode === 'auto' && this._night !== (nightGoal > 0.5)) { this._night = nightGoal > 0.5; this._nvBtn.disabled = !this._night; this._nvBtn.style.opacity = this._night ? '' : '.55'; }
    if (this._nightLevel === undefined) this._nightLevel = nightGoal;
    if (Math.abs(this._nightLevel - nightGoal) > 0.002) { this._nightLevel += (nightGoal - this._nightLevel) * k; dirty = true; this._needShadow = true; }
    else if (this._nightLevel !== nightGoal) { this._nightLevel = nightGoal; dirty = true; this._needShadow = true; }
    const nl = this._nightLevel;
    // Visão noturna: à noite, luz de lua mais forte + ambiente frio para a igreja inteira ficar legível
    const nvGoal = this._nightVision ? 1 : 0;
    if (this._nvLevel === undefined) this._nvLevel = nvGoal;
    if (Math.abs(this._nvLevel - nvGoal) > 0.002) { this._nvLevel += (nvGoal - this._nvLevel) * k; dirty = true; this._needShadow = true; }
    else if (this._nvLevel !== nvGoal) { this._nvLevel = nvGoal; dirty = true; this._needShadow = true; }
    const nv = this._nvLevel, L = THREE.MathUtils.lerp;
    this._hemi.intensity = L(0.85, L(0.22, 0.66, nv), nl);   // de dia menos luz chapada → sombras com volume
    this._hemi.color.setHex(0xe4ecf5).lerp(new THREE.Color(0x4a5f92), nl);
    this._hemi.groundColor.setHex(0xa08c70).lerp(new THREE.Color(0x1c2130), nl);
    this._amb.intensity = L(0.12, L(0.14, 0.36, nv), nl);   // visão noturna um pouco mais escura: letreiro e refletores aparecem
    this._amb.color.setHex(0xdde4ee).lerp(new THREE.Color(0x6b7aa8), nl);
    // sol: posição pelo azimute/elevação reais (no dia); cor esquenta perto do horizonte
    const az = ((this._sunInfo ? this._sunInfo.azimuth : 90) - (this._config.orientation - 180)) * Math.PI / 180;
    const elr = Math.max(elev, 4) * Math.PI / 180;
    const sunDir = new THREE.Vector3(Math.sin(az) * Math.cos(elr), Math.sin(elr), -Math.cos(az) * Math.cos(elr));
    if (this._mode === 'day') sunDir.copy(this._sunPos).normalize();
    const sunPos = this._sun.target.position.clone().addScaledVector(sunDir, this._sunDist);
    // no modo "Dia" forçado (mesmo com o sol real abaixo do horizonte) usa um sol de meio da manhã
    const effEl = this._mode === 'day' ? Math.max(elev, 50) : elev;
    const warm = clamp(1 - effEl / 14, 0, 1);
    const dayCol = this._sunCol.clone().lerp(new THREE.Color(0xff9848), warm * 0.85);
    const dayInt = 3.2 * clamp(0.25 + Math.sin(Math.max(effEl, 0) * Math.PI / 180) * 1.5, 0.25, 1);
    this._sun.intensity = L(dayInt, L(0.5, 1.15, nv), nl);
    this._sun.position.lerpVectors(sunPos, this._moonPos, nl);
    this._sun.color.copy(dayCol).lerp(this._moonCol, nl);
    if (!this._lastSunPos || this._lastSunPos.distanceToSquared(this._sun.position) > 0.01) { this._lastSunPos = this._sun.position.clone(); this._needShadow = true; dirty = true; }
    const dusk = this._mode === 'auto' ? clamp(1 - Math.abs(elev) / 9, 0, 1) * 0.95 : 0;
    this._skyDusk.material.opacity = dusk;
    this._skyDay.material.opacity = (1 - nl) * (1 - dusk * 0.85); this._stars.material.opacity = nl * 0.9;
    this._hemi.color.lerp(new THREE.Color(0xffb27a), dusk * 0.5 * (1 - nl));
    this._scene.fog.color.setHex(0xd6e4f2).lerp(new THREE.Color(0xf0a070), dusk * 0.6).lerp(new THREE.Color(0x0a0f1e), nl);
    if (this._envDay) {
      const env = nl > 0.5 ? this._envNight : this._envDay;
      if (this._scene.environment !== env) this._scene.environment = env;
      this._scene.environmentIntensity = L(0.9, L(0.35, 0.7, nv), nl);   // PMREM mais forte: reflexo em vidro/metal
    }
    // Luzes (fade) e materiais emissivos
    let ambient = false;   // animação ociosa (telão pulsando)
    // luz de dia: as lâmpadas pesam menos na cena
    const dayScale = L(0.45, 1, nl);
    for (const it of ITEMS) {
      const rt = this._items.get(it.key); if (!rt) continue;
      const goal = rt.target * (rt.brightScale || 1);
      if (Math.abs(rt.level - goal) > 0.003) { rt.level += (goal - rt.level) * k; dirty = true; }
      else if (rt.level !== goal) { rt.level = goal; dirty = true; }
      const lv = rt.level;
      for (const { L: pl, i } of rt.lights || []) { pl.intensity = i * lv * dayScale; pl.color.copy(rt.color); }
      if (it.kind === 'light') for (const f of rt.fixtures || []) if (f.material && f.material.emissive) f.material.emissiveIntensity = lv * 1.6;
      for (const { sp, base } of rt.glows || []) { sp.material.opacity = lv * base * L(0.35, 1, nl); sp.material.color.copy(rt.color); sp.visible = lv > 0.01; }   // de dia o halo quase some
      for (const b of rt.beams || []) { b.material.uniforms.uI.value = lv * L(0.18, 0.55, nl); b.material.uniforms.uC.value.copy(rt.color); b.visible = lv > 0.01; }
      // emissivos da decoração ligados à entidade (ctx.bindEmissive): acompanham o brilho, com um mínimo aceso
      for (const b of rt.emisBind || []) b.mat.emissiveIntensity = b.max * (b.min + (1 - b.min) * lv);
      for (const hm of rt.halos || []) { hm.opacity = lv * hm.userData.base * L(hm.userData.day, 1, nl); hm.visible = lv > 0.01; }   // materiais de ctx.glowPlane
      if (it.key === 'telao' && rt.screenMat) {
        // tela acende; tocando, pulsa levemente e ilumina o palco
        const pulse = rt.playing && !this._reduced ? 0.88 + 0.12 * Math.sin(t * 2.1) : rt.playing ? 1 : 0.7;
        rt.screenMat.emissiveIntensity = pulse * lv * 1.0;   // toneMapped: false → cores do canvas saem fiéis
        rt.light.intensity = pulse * lv * 9 * L(0.6, 1, nl);
        if (rt.bloom) { rt.bloom.material.opacity = pulse * lv * 0.35 * L(0.4, 1, nl); rt.bloom.visible = lv > 0.01; }
        if (lv > 0.01 && rt.playing && !this._reduced) ambient = true;
      }
      if (it.key === 'som' && rt.ledMats) for (const m of rt.ledMats) m.emissiveIntensity = lv * 2.6;
      if (it.kind === 'climate' && rt.ledMats) {
        const c = rt.hvac === 'cool' ? 0x67d3ff : rt.hvac === 'heat' ? 0xff8a5b : 0x8ef0b0;
        for (const m of rt.ledMats) { m.emissive.setHex(c); m.emissiveIntensity = lv * 2.2; }
      }
      if (it.key === 'porta' && rt.leaves) for (const lf of rt.leaves) { const ry = lf.base - lf.dir * lv * 1.25; if (lf.g.rotation.y !== ry) { lf.g.rotation.y = ry; this._needShadow = true; this._refreshPointShadows('hall'); } }
    }
    if (this._needShadow) { this._renderer.shadowMap.needsUpdate = true; this._needShadow = false; dirty = true; }
    if (dirty) this._updateLabels();
    // Só animação ociosa (telão pulsando): no máximo ~8 quadros/s, e nada com a aba ou o cartão fora da tela
    const now = performance.now();
    const visible = !(typeof document !== 'undefined' && document.hidden) && this._onScreen !== false;
    if (dirty || (ambient && visible && now - (this._lastIdle || 0) > 125)) {
      if (!dirty) this._lastIdle = now;
      this._renderer.render(this._scene, this._camera);
    }
  }
}

if (!customElements.get('igreja3d-card')) customElements.define('igreja3d-card', Igreja3DCard);
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === 'igreja3d-card')) {
  window.customCards.push({ type: 'igreja3d-card', name: 'Igreja 3D', description: 'Planta 3D interativa da igreja; luzes, telão, som e ares ligados às entidades do Home Assistant.', preview: false });
}
console.info(`%c IGREJA3D-CARD %c v${VERSION} `, 'background:#0a0f1e;color:#ffc46b;font-weight:700', 'background:#ffc46b;color:#0a0f1e;font-weight:700');
