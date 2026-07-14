import { createPanorama } from './panorama.js?pgnn-six=1';

const room = document.querySelector('#room');
const views = [...document.querySelectorAll('.view')];
const status = document.querySelector('#accessibility');
const passageHint = document.querySelector('#passage-hint');
const recordElement = document.querySelector('#record');
const snowCanvas = document.querySelector('#snow');
const atmosphereCanvas = document.querySelector('#atmosphere');
const panoramaRoot = document.querySelector('#panorama');
const detailFrame = document.querySelector('#detail-frame');
const detailImage = detailFrame?.querySelector('img');
const lyricEvidence = document.querySelector('#lyric-evidence');
const entryScreen = document.querySelector('#entry-screen');
const entryState = document.querySelector('#entry-state');
const detailPortal = document.querySelector('#detail-portal');
const rabbitHole = document.querySelector('#rabbit-hole');
const rabbitThreshold = document.querySelector('#rabbit-threshold');
const detailTouchButtons = [...document.querySelectorAll('.detail-touch')];
const detailReaction = document.querySelector('#detail-reaction');
const detailResponsePlate = document.querySelector('.detail-response-plate');

const SAVE_KEY = 'pgnn-six-memory-v1';
const LEGACY_SAVE_KEYS = ['room-7-memory-v5', 'room-7-memory-v4'];
const today = new Date().toISOString().slice(0, 10);
const ALBUM = [
  { id: 'normalno', src: './assets/pgnn-six/music/01-normalno.mp3', duration: 255.399175 },
  { id: 'rejumper', src: './assets/pgnn-six/music/02-rejumper.mp3', duration: 135.15755 },
  { id: 'casting', src: './assets/pgnn-six/music/03-casting.mp3', duration: 222.7461 },
  { id: 'water', src: './assets/pgnn-six/music/04-water.mp3', duration: 235.46775 },
  { id: 'knockout', src: './assets/pgnn-six/music/05-knockout.mp3', duration: 261.2506 },
  { id: 'slovo', src: './assets/pgnn-six/music/06-slovo.mp3', duration: 194.03755 },
];

const blankMemory = () => ({
  visits: 0,
  loops: 0,
  evolution: 0,
  notebookPages: 0,
  notebookRevealed: false,
  actions: {},
  discoveries: {},
  rabbitDepths: {},
  locationReturns: {},
  detailTouches: {},
  sceneDetailVisits: {},
  lyricCursors: {},
  lastLyricEvidence: '',
  albumIndex: 0,
  albumTime: 0,
  albumFinished: false,
  lastVisit: '',
});

let memory;
try {
  const legacyStored = LEGACY_SAVE_KEYS.map(key => localStorage.getItem(key)).find(Boolean);
  const stored = localStorage.getItem(SAVE_KEY) || legacyStored || '{}';
  memory = { ...blankMemory(), ...JSON.parse(stored) };
  if (memory.recordPosition && !memory.albumTime) memory.albumTime = memory.recordPosition;
} catch { memory = blankMemory(); }
memory.visits += 1;
memory.lastVisit = today;
const visitSeed = hash(`${today}:${memory.visits}:${memory.loops}`);
const save = () => localStorage.setItem(SAVE_KEY, JSON.stringify(memory));
save();

let currentView = 'foyer';
let audioStarted = false;
let transitionTimer = 0;
let dwellTimer = 0;
let elevatorTimer = 0;
let detailOpenTimer = 0;
let detailCloseTimer = 0;
let detailClearTimer = 0;
let blinkTimer = 0;
let blinkEndTimer = 0;
let rabbitTimer = 0;
let detailReactionTimer = 0;
let worldEventTimer = 0;
let worldEventClearTimer = 0;
let currentRabbitAction = '';
let rabbitCommitted = false;
let currentDetailScene = '';
let detailTouchConsumedAt = 0;
let activeLyricTrack = '';
let activeLyricSegment = -1;
let activeLyricIndex = -1;
let dwellTarget = null;
const musicState = { low: 0, mid: 0, high: 0, energy: 0, progress: 0, chapter: 0, active: false };
let lastMusicResponse = 0;

const DETAIL_SCENES = {
  desk: { src: './assets/pgnn-six/detail-desk-matched.png' },
  kitchen: { src: './assets/pgnn-six/detail-kitchen-matched.png' },
  bathroom: { src: './assets/pgnn-six/detail-bathroom-matched.png' },
  stairwell: { src: './assets/pgnn-six/detail-stairwell-matched.png' },
  corridor: { src: './assets/pgnn-six/detail-corridor-matched.png' },
  elevator: { src: './assets/pgnn-six/detail-elevator-matched.png' },
  courtyard: { src: './assets/pgnn-six/detail-courtyard-matched.png' },
  lobby: { src: './assets/pgnn-six/detail-lobby-matched.png' },
  basement: { src: './assets/pgnn-six/detail-basement-matched.png' },
  attic: { src: './assets/pgnn-six/detail-attic-matched.png' },
  roof: { src: './assets/pgnn-six/detail-roof-matched.png' },
  tramstop: { src: './assets/pgnn-six/detail-tramstop-matched.png' },
};

const DETAIL_TOUCHES = {
  desk: [
    { id: 'desk-page', label: 'коснуться страницы', action: 'notebook', effect: 'paper', sound: 'paper', x: 24, y: 30, w: 25, h: 23 },
    { id: 'desk-phone', label: 'снять трубку', action: 'phone', effect: 'voice', sound: 'intercom', x: 72, y: 28, w: 18, h: 22 },
    { id: 'desk-tape', label: 'коснуться кассеты', action: 'cassette', effect: 'signal', sound: 'cassette', x: 44, y: 15, w: 10, h: 19 },
  ],
  kitchen: [
    { id: 'kitchen-kettle', label: 'коснуться чайника', action: 'kettle', effect: 'heat', sound: 'kettle', x: 8, y: 24, w: 25, h: 34 },
    { id: 'kitchen-radio', label: 'нажать клавишу магнитофона', action: 'cassette', effect: 'signal', sound: 'cassette', x: 53, y: 18, w: 29, h: 28 },
    { id: 'kitchen-cup', label: 'подвинуть чашку', action: 'kitchen-cup', effect: 'glass', sound: 'cup', x: 60, y: 49, w: 18, h: 24 },
  ],
  bathroom: [
    { id: 'bathroom-mirror', label: 'стереть запотевшее пятно', action: 'mirror', effect: 'reflection', sound: 'mirror', x: 42, y: 7, w: 26, h: 52 },
    { id: 'bathroom-tap', label: 'коснуться крана', action: 'tap', effect: 'water', sound: 'tap', x: 47, y: 57, w: 18, h: 18 },
    { id: 'bathroom-cabinet', label: 'приоткрыть шкафчик', action: 'cabinet', effect: 'mechanical', sound: 'cabinet', x: 15, y: 25, w: 24, h: 35 },
  ],
  stairwell: [
    { id: 'stair-window', label: 'коснуться холодного стекла', action: 'stair-window', effect: 'snow', sound: 'stairWindow', x: 12, y: 8, w: 31, h: 53 },
    { id: 'stair-rail', label: 'провести по перилам', action: 'rail', effect: 'mechanical', sound: 'rail', x: 44, y: 38, w: 32, h: 35 },
    { id: 'stair-bulb', label: 'посмотреть на лампу', action: 'stair-lamp', effect: 'light', sound: 'lamp', x: 72, y: 7, w: 17, h: 22 },
  ],
  lobby: [
    { id: 'lobby-boxes', label: 'открыть почтовый ящик', action: 'mailboxes', effect: 'paper', sound: 'mailboxes', x: 4, y: 8, w: 35, h: 63 },
    { id: 'lobby-intercom', label: 'нажать кнопку домофона', action: 'intercom', effect: 'voice', sound: 'intercom', x: 39, y: 34, w: 18, h: 29 },
    { id: 'lobby-light', label: 'коснуться выключателя', action: 'lobby-light', effect: 'light', sound: 'lamp', x: 66, y: 13, w: 19, h: 25 },
  ],
  corridor: [
    { id: 'corridor-door', label: 'прислушаться к двери', action: 'corridor-door', effect: 'voice', sound: 'door', x: 56, y: 13, w: 25, h: 60 },
    { id: 'corridor-window', label: 'стереть конденсат', action: 'corridor-window', effect: 'snow', sound: 'stairWindow', x: 8, y: 9, w: 27, h: 48 },
    { id: 'corridor-radiator', label: 'коснуться батареи', action: 'corridor-radiator', effect: 'heat', sound: 'radiator', x: 26, y: 57, w: 30, h: 25 },
  ],
  courtyard: [
    { id: 'courtyard-tram', label: 'следить за трамваем', action: 'tram', effect: 'signal', sound: 'tram', x: 32, y: 27, w: 45, h: 25 },
    { id: 'courtyard-bench', label: 'коснуться мокрой скамьи', action: 'bench', effect: 'footprint', sound: 'bench', x: 56, y: 59, w: 26, h: 22 },
    { id: 'courtyard-window', label: 'посмотреть в освещённое окно', action: 'building-window', effect: 'light', sound: 'photo', x: 12, y: 13, w: 22, h: 27 },
  ],
  basement: [
    { id: 'basement-valve', label: 'повернуть вентиль', action: 'valve', effect: 'mechanical', sound: 'valve', x: 12, y: 33, w: 26, h: 44 },
    { id: 'basement-boiler', label: 'приложить ладонь к котлу', action: 'boiler', effect: 'heat', sound: 'boiler', x: 56, y: 20, w: 29, h: 52 },
    { id: 'basement-pipe', label: 'прислушаться к трубе', action: 'pipes', effect: 'water', sound: 'pipes', x: 31, y: 8, w: 25, h: 36 },
  ],
  elevator: [
    { id: 'elevator-mirror', label: 'стереть зеркало', action: 'elevator-mirror', effect: 'reflection', sound: 'mirror', x: 36, y: 5, w: 30, h: 56 },
    { id: 'elevator-button', label: 'нажать потёртую кнопку', action: 'elevator-button', effect: 'light', sound: 'elevator', x: 65, y: 31, w: 16, h: 32 },
    { id: 'elevator-rail', label: 'сжать холодный поручень', action: 'elevator-rail', effect: 'mechanical', sound: 'rail', x: 21, y: 57, w: 48, h: 18 },
  ],
  attic: [
    { id: 'attic-shirt', label: 'приподнять рубашку', action: 'attic-shirt', effect: 'paper', sound: 'paper', x: 29, y: 57, w: 27, h: 33 },
    { id: 'attic-cassette', label: 'коснуться кассеты', action: 'cassette', effect: 'signal', sound: 'cassette', x: 55, y: 62, w: 15, h: 18 },
    { id: 'attic-cable', label: 'коснуться антенного кабеля', action: 'attic-cable', effect: 'signal', sound: 'panel', x: 0, y: 28, w: 25, h: 48 },
    { id: 'attic-hatch', label: 'заглянуть в люк', action: 'attic-chair', effect: 'threshold', sound: 'door', x: 72, y: 49, w: 25, h: 30 },
  ],
  roof: [
    { id: 'roof-antenna', label: 'поймать дрожь антенны', action: 'roof-antenna', effect: 'signal', sound: 'panel', x: 0, y: 4, w: 32, h: 73 },
    { id: 'roof-tracks', label: 'проследить цепочку следов', action: 'roof-tracks', effect: 'footprint', sound: 'shoes', x: 32, y: 45, w: 38, h: 36 },
    { id: 'roof-hatch', label: 'коснуться тёплого люка', action: 'roof-hatch-light', effect: 'light', sound: 'door', x: 73, y: 55, w: 25, h: 37 },
  ],
  tramstop: [
    { id: 'tramstop-glass', label: 'стереть конденсат', action: 'tramstop-glass', effect: 'water', sound: 'tap', x: 0, y: 2, w: 56, h: 66 },
    { id: 'tramstop-time', label: 'поднять остановившиеся часы', action: 'tramstop-watch', effect: 'mechanical', sound: 'panel', x: 48, y: 69, w: 18, h: 20 },
    { id: 'tramstop-tram', label: 'следить за приближающимся трамваем', action: 'tramstop-tram', effect: 'signal', sound: 'tram', x: 62, y: 8, w: 33, h: 49 },
  ],
};

const ACTION_DETAIL = {
  crt: 'desk', lamp: 'desk', cup: 'desk', chair: 'desk', notebook: 'desk', shoes: 'desk', 'record-player': 'desk', phone: 'desk', bed: 'desk', radiator: 'desk', shelf: 'desk', plant: 'desk', window: 'courtyard',
  kettle: 'kitchen', cassette: 'kitchen', fridge: 'kitchen', 'kitchen-table': 'kitchen', sink: 'kitchen', 'kitchen-window': 'kitchen', stove: 'kitchen', jars: 'kitchen', boombox: 'kitchen', 'kitchen-cup': 'kitchen',
  mirror: 'bathroom', tap: 'bathroom', washer: 'bathroom', cabinet: 'bathroom', 'bathroom-pipe': 'bathroom', towel: 'bathroom', toothbrush: 'bathroom', bath: 'bathroom',
  'stair-window': 'stairwell', rail: 'stairwell', 'stair-lamp': 'stairwell', 'stair-step': 'stairwell', 'stair-door': 'stairwell',
  mailboxes: 'lobby', intercom: 'lobby', 'lobby-light': 'lobby', 'lobby-door': 'lobby', 'lobby-shadow': 'lobby',
  'corridor-window': 'corridor', 'corridor-lamp': 'corridor', 'corridor-door': 'corridor', panel: 'corridor', 'corridor-radiator': 'corridor', 'corridor-floor': 'corridor',
  tram: 'courtyard', bench: 'courtyard', 'courtyard-gate': 'courtyard', tracks: 'courtyard', snowbank: 'courtyard', 'building-window': 'courtyard',
  pipes: 'basement', valve: 'basement', boiler: 'basement', 'basement-window': 'basement', 'basement-door': 'basement', steam: 'basement', 'basement-stairs': 'basement',
  elevator: 'elevator', 'elevator-mirror': 'elevator', 'elevator-button': 'elevator', 'elevator-ceiling': 'elevator', 'elevator-rail': 'elevator', 'elevator-floor': 'elevator',
  'attic-suitcase': 'attic', 'attic-cable': 'attic', 'attic-shirt': 'attic', 'attic-chair': 'attic', 'attic-bulb': 'attic', 'attic-window': 'attic', 'attic-boxes': 'attic',
  'roof-antenna': 'roof', 'roof-cable': 'roof', 'roof-tracks': 'roof', 'roof-vent': 'roof', 'roof-hatch-light': 'roof', 'roof-edge': 'roof',
  'tramstop-glass': 'tramstop', 'tramstop-bench': 'tramstop', 'tramstop-tram': 'tramstop', 'tramstop-rails': 'tramstop', 'tramstop-snow': 'tramstop', 'tramstop-light': 'tramstop', 'tramstop-watch': 'tramstop',
};

const RABBIT_MODE = {
  crt: 'terminal', notebook: 'manuscript', phone: 'terminal', 'record-player': 'tape', cassette: 'tape', boombox: 'tape',
  plant: 'memory', window: 'outside',
  mirror: 'reflection', 'elevator-mirror': 'reflection', cabinet: 'reflection',
  tap: 'water', sink: 'water', kettle: 'water', pipes: 'water', bath: 'water', 'bathroom-pipe': 'water', steam: 'water',
  shoes: 'footsteps', chair: 'footsteps', bed: 'footsteps', 'stair-step': 'footsteps', tracks: 'footsteps',
  elevator: 'threshold', 'elevator-button': 'threshold', 'corridor-door': 'threshold', 'basement-door': 'threshold', 'courtyard-gate': 'threshold', 'lobby-door': 'threshold', 'stair-door': 'threshold',
  'kitchen-window': 'outside', 'stair-window': 'outside', 'corridor-window': 'outside', 'basement-window': 'outside', 'building-window': 'outside', snowbank: 'outside', tram: 'outside',
  mailboxes: 'names', intercom: 'names',
  boiler: 'machine', valve: 'machine', fridge: 'machine', washer: 'machine', stove: 'machine', 'elevator-rail': 'machine',
  'attic-cable': 'terminal', 'roof-antenna': 'terminal', 'roof-cable': 'terminal', 'tramstop-tram': 'tape',
  'attic-suitcase': 'manuscript', 'attic-shirt': 'memory', 'attic-boxes': 'memory', 'roof-tracks': 'footsteps',
  'roof-vent': 'machine', 'roof-hatch-light': 'threshold', 'roof-edge': 'outside', 'attic-window': 'outside',
  'tramstop-glass': 'water', 'tramstop-bench': 'memory', 'tramstop-rails': 'footsteps', 'tramstop-snow': 'outside', 'tramstop-light': 'outside', 'tramstop-watch': 'machine',
};
const SCENE_MODE = { desk: 'memory', kitchen: 'machine', bathroom: 'reflection', stairwell: 'footsteps', corridor: 'threshold', elevator: 'reflection', courtyard: 'outside', lobby: 'names', basement: 'machine', attic: 'memory', roof: 'outside', tramstop: 'water' };
const RABBIT_DESTINATIONS = {
  terminal: ['corridor', 'elevator', 'basement', 'attic', 'roof'], manuscript: ['stairwell', 'basement', 'foyer', 'attic'], reflection: ['elevator', 'bathroom', 'corridor'],
  water: ['courtyard', 'bathroom', 'basement', 'tramstop'], tape: ['kitchen', 'lobby', 'foyer', 'tramstop'], footsteps: ['stairwell', 'courtyard', 'corridor', 'roof'],
  threshold: ['corridor', 'basement', 'lobby', 'attic'], outside: ['courtyard', 'stairwell', 'foyer', 'roof', 'tramstop'], names: ['lobby', 'corridor', 'elevator'],
  machine: ['basement', 'elevator', 'kitchen', 'tramstop'], memory: ['foyer', 'stairwell', 'basement', 'attic'],
};

const PERSISTENT_ACTION_CLASSES = {
  window: 'window-open', crt: 'crt-awake', lamp: 'lamp-touched', chair: 'chair-touched', radiator: 'radiator-warm', bed: 'bed-touched',
  kettle: 'kettle-heard', cassette: 'cassette-touched', fridge: 'fridge-heard', 'kitchen-table': 'kitchen-table-seen',
  mirror: 'mirror-seen', tap: 'tap-touched', washer: 'washer-heard', cabinet: 'cabinet-open', panel: 'panel-heard',
  'stair-window': 'stair-window-seen', rail: 'rail-touched', tram: 'tram-heard', bench: 'bench-seen',
  mailboxes: 'mailboxes-seen', intercom: 'intercom-touched', pipes: 'pipes-heard', valve: 'valve-touched', boiler: 'boiler-heard',
  'basement-window': 'basement-window-seen', 'corridor-window': 'corridor-window-seen', 'corridor-lamp': 'corridor-lamp-seen',
  'elevator-mirror': 'elevator-mirror-seen', 'elevator-button': 'elevator-button-seen', shoes: 'shoes-seen', plant: 'plant-seen',
  'record-player': 'record-heard', sink: 'water-heard', 'bathroom-pipe': 'water-heard', 'kitchen-window': 'cold-air',
};
const MEMORY_GROUPS = {
  electric: ['crt', 'lamp', 'panel', 'intercom', 'elevator-button', 'attic-cable', 'roof-antenna', 'roof-cable', 'record-player'],
  water: ['window', 'tap', 'sink', 'kettle', 'bathroom-pipe', 'stair-window', 'corridor-window', 'basement-window', 'tramstop-glass', 'snowbank'],
  movement: ['chair', 'shoes', 'bed', 'stair-step', 'tracks', 'roof-tracks', 'corridor-door', 'basement-door', 'courtyard-gate', 'attic-chair'],
  decay: ['plant', 'mirror', 'cabinet', 'boiler', 'valve', 'mailboxes', 'attic-suitcase', 'attic-shirt', 'attic-boxes'],
};

// Object/song resonance only affects the mix. Lyric choice always follows active playback.
const ACTION_TRACK = {
  notebook: 'normalno', chair: 'normalno', plant: 'normalno',
  rail: 'rejumper', 'stair-window': 'rejumper', shoes: 'rejumper',
  crt: 'casting', mirror: 'casting', cabinet: 'casting', 'record-player': 'casting',
  kettle: 'water', tap: 'water', pipes: 'water', tram: 'water',
  elevator: 'knockout', 'elevator-button': 'knockout', 'elevator-mirror': 'knockout',
  basement: 'slovo', valve: 'slovo', boiler: 'slovo', 'basement-window': 'slovo',
  'attic-suitcase': 'normalno', 'attic-cable': 'casting', 'attic-shirt': 'rejumper', 'attic-chair': 'rejumper',
  'roof-antenna': 'casting', 'roof-cable': 'casting', 'roof-tracks': 'rejumper', 'roof-edge': 'water',
  'tramstop-glass': 'water', 'tramstop-bench': 'water', 'tramstop-tram': 'water', 'tramstop-rails': 'knockout', 'tramstop-watch': 'knockout',
};
const LYRIC_EVIDENCE = {
  normalno: [
    'Я скучаю по версиям себя, что фейсконтроль не прошли.',
    'Когда ты говоришь «я грущу» — ты уже сам себе актёр, и наблюдаешь из зала.',
    'В его шкафу — одежда. В моём — души ископаемые.',
    'Мой айфон знает обо мне больше, чем я.',
    'Он — что верит мне. Я — что это нормально.',
    'Но тишина после — честная. Тишина после — как дом.',
  ],
  rejumper: [
    'Мой прыжок — лишь рябь на полотне.',
    'Может там за полем то же поле, но шире?',
    'Может наш прыжок только помеха в эфире?',
    'Мы летим в соседний луг, там трава зеленее. Просто меняем позицию, веря в святую материю.',
    'Кто-то прыгнул высоко — их склевал случай.',
    'Можно просидеть в траве… да пошло оно всё нахуй.',
  ],
  casting: [
    'На вопрос «кто мы есть?» — нет ответа у автора.',
    'Я выхожу на карниз, чтобы поправить антенну, но падаю вниз, ломая четвёртую стену.',
    'Я — то самое смутное, липкое подозрение, что мир — это просто ошибка создателя.',
    'Я тут единственный, кто не боится быть отвратительным.',
    'Я допиваю чай и сливаюсь с безликим пейзажем за морозным окном.',
    'Добро пожаловать в шоу, где горе не от ума.',
  ],
  water: [
    'Моё тело — простой футляр для боли и плесени.',
    'Выбрасываю часы, будто мелочь в фонтан, пытаясь услышать дно, но там совсем пусто.',
    'Интернет торгует всем, кроме покоя.',
    'Я записываю тишину между строк.',
    'Жизнь — лишь кости в миске, что челюсть собаки времени перемалывает.',
    'Стою. Жду. Заметаю следы, пока море не сотрёт меня до состояния воды.',
  ],
  knockout: [
    'Противник — это зеркало в лифте.',
    'Я ищу в карманах не монеты, а доказательства того, что я был тут.',
    'Этот город — один большой Стоктон.',
    'Оказался мешком для битья, на котором ты отрабатывала свои комплексы.',
    'Я пересматриваю хайлайты наших ссор, чувствуя себя старателем.',
    'Это мой главный бой — без гонга и перерывов на рекламу.',
  ],
  slovo: [
    'Мир — это слово безумного пастыря.',
    'Косноязычие стало правильной тактикой.',
    'В их зрачках я вижу только чернозёма галактики.',
    'Смыслы изъедены ржавчиной веры.',
    'Мы — сорняки в этой влажности серой.',
    'Слово — калека, тупое орудие.',
  ],
};
const sound = createSoundscape();
const album = createAlbum(recordElement);
panoramaRoot.dataset.loop = String(memory.loops);
panoramaRoot.dataset.variant = String(currentVariant());
panoramaRoot.dataset.cycle = String(currentVariant());
const panorama = createPanorama(panoramaRoot, portal => {
  startSound();
  if (portal.loop) returnToRoom(portal.from);
  else if (portal.to) moveTo(portal.to, portal);
  else if (portal.action) action(portal.action);
}, () => {
  startSound();
  hideDetail();
  room.classList.add('has-looked');
}, (hotspot, event) => {
  if (!passageHint) return;
  if (!hotspot || (!hotspot.to && !hotspot.loop)) {
    passageHint.textContent = '';
    passageHint.classList.remove('visible');
    return;
  }
  const names = {
    foyer: 'в комнату', kitchen: 'на кухню', bathroom: 'в ванную', stairwell: 'на лестницу',
    courtyard: 'во двор', lobby: 'в подъезд', basement: 'в подвал', corridor: 'в коридор', elevator: 'в лифт',
    attic: 'на чердак', roof: 'на крышу', tramstop: 'к остановке',
  };
  if (event) {
    passageHint.style.setProperty('--hint-x', `${event.clientX}px`);
    passageHint.style.setProperty('--hint-y', `${event.clientY}px`);
  }
  passageHint.textContent = hotspot.loop ? 'дальше' : names[hotspot.to] || 'пройти';
  passageHint.classList.add('visible');
});

room.dataset.visit = String(memory.visits);
room.dataset.seed = String(visitSeed);
room.dataset.variant = String(currentVariant());
room.dataset.day = String(currentDay());
room.dataset.chapter = ALBUM[Math.min(memory.albumIndex, ALBUM.length - 1)].id;
room.classList.add('pano-active');
syncPersistentWorld();
registerLocation('foyer');
panorama.setActive(true, 'foyer');
if (memory.visits > 1 || memory.loops > 0) window.setTimeout(() => room.classList.add('remembers'), 1500);
prepareEntry();
requestAnimationFrame(renderMusicResponse);

function hash(value) {
  let total = 2166136261;
  for (let index = 0; index < value.length; index += 1) total = Math.imul(total ^ value.charCodeAt(index), 16777619);
  return total >>> 0;
}

function currentVariant() { return (memory.visits - 1 + memory.loops + (memory.evolution || 0)) % 4; }
function currentDay() { return (memory.visits - 1 + memory.loops + (memory.evolution || 0)) % 3; }
function memoryGroupForAction(actionName) {
  return Object.entries(MEMORY_GROUPS).find(([, actions]) => actions.includes(actionName))?.[0] || 'decay';
}

function syncPersistentWorld() {
  const actions = memory.actions || {};
  Object.entries(PERSISTENT_ACTION_CLASSES).forEach(([actionName, className]) => {
    room.classList.toggle(className, (actions[actionName] || 0) > 0);
  });
  room.classList.toggle('attic-touched', Object.keys(actions).some(name => name.startsWith('attic-') && actions[name] > 0));
  room.classList.toggle('roof-touched', Object.keys(actions).some(name => name.startsWith('roof-') && actions[name] > 0));
  room.classList.toggle('tramstop-touched', Object.keys(actions).some(name => name.startsWith('tramstop-') && actions[name] > 0));
  const score = names => {
    const touches = names.reduce((total, name) => total + (actions[name] || 0), 0);
    return Math.min(1, 1 - Math.exp(-touches * .42));
  };
  const returnPressure = Math.min(.34, (Math.max(0, memory.visits - 1) + memory.loops) * .035);
  const worldMemory = {
    electric: score(MEMORY_GROUPS.electric),
    water: score(MEMORY_GROUPS.water),
    movement: score(MEMORY_GROUPS.movement),
    decay: Math.min(1, score(MEMORY_GROUPS.decay) + returnPressure),
  };
  const totalActions = Object.values(actions).reduce((total, count) => total + (Number(count) || 0), 0);
  const memoryStage = Math.min(4, Math.floor((totalActions + memory.loops * 3 + Math.max(0, memory.visits - 1)) / 6));
  room.dataset.memoryStage = String(memoryStage);
  panoramaRoot.dataset.memoryStage = String(memoryStage);
  room.style.setProperty('--memory-electric', worldMemory.electric.toFixed(3));
  room.style.setProperty('--memory-water', worldMemory.water.toFixed(3));
  room.style.setProperty('--memory-movement', worldMemory.movement.toFixed(3));
  room.style.setProperty('--memory-decay', worldMemory.decay.toFixed(3));
  room.style.setProperty('--memory-grain', (worldMemory.decay * .045).toFixed(3));
  panorama.setMemory(worldMemory);
}

function registerLocation(view) {
  memory.locationReturns ||= {};
  memory.locationReturns[view] = (memory.locationReturns[view] || 0) + 1;
  const returnCount = Math.max(0, memory.locationReturns[view] - 1);
  panoramaRoot.dataset.returnCount = String(returnCount);
  room.dataset.returnCount = String(returnCount);
  room.dataset.returnStage = String(Math.min(4, returnCount));
  save();
}

function preloadImage(src) {
  return new Promise(resolve => {
    const image = new Image();
    image.onload = image.onerror = resolve;
    image.src = src;
  });
}

async function prepareEntry() {
  const minimumHold = new Promise(resolve => window.setTimeout(resolve, 720));
  await Promise.all([
    minimumHold,
    document.fonts?.ready || Promise.resolve(),
    preloadImage('./assets/pgnn-six/six-wordmark.png'),
    preloadImage('./assets/pgnn-six/panorama-apartment-shoes-desk.png'),
    preloadImage('./assets/pgnn-six/panorama-apartment-return-1-shoes.png'),
    preloadImage('./assets/pgnn-six/panorama-apartment-return-2-shoes.png'),
    preloadImage('./assets/pgnn-six/panorama-attic.png'),
    preloadImage('./assets/pgnn-six/panorama-roof.png'),
    preloadImage('./assets/pgnn-six/panorama-tramstop.png'),
  ]);
  room.classList.add('entry-ready');
  if (entryState) entryState.textContent = 'проснуться';
}

function enterRoom() {
  if (!room.classList.contains('entry-ready') || room.classList.contains('entered')) return;
  startSound();
  room.classList.remove('booting');
  room.classList.add('entered', 'awakening');
  entryScreen?.setAttribute('aria-hidden', 'true');
  status.textContent = 'Вы открываете глаза. Комната уже здесь.';
  window.setTimeout(() => room.classList.remove('awakening'), 3900);
  queueBlink(4700 + Math.random() * 1800);
  scheduleWorldEvent('foyer', 6200);
}

entryScreen?.addEventListener('click', event => {
  event.stopPropagation();
  enterRoom();
});

function queueBlink(delay = 3200 + Math.random() * 4300) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  clearTimeout(blinkTimer);
  blinkTimer = window.setTimeout(() => {
    if (document.hidden || !room.classList.contains('entered') || room.classList.contains('awakening')) {
      queueBlink(1200);
      return;
    }
    room.classList.remove('blinking');
    requestAnimationFrame(() => room.classList.add('blinking'));
    clearTimeout(blinkEndTimer);
    blinkEndTimer = window.setTimeout(() => {
      room.classList.remove('blinking');
      queueBlink(Math.random() < .13 ? 180 : 2800 + Math.random() * 4700);
    }, 390);
  }, delay);
}

function startSound() {
  if (!audioStarted) {
    audioStarted = true;
    sound.start();
  }
  album.start();
  document.querySelectorAll('.view img[loading="lazy"]').forEach(image => { const prefetch = new Image(); prefetch.src = image.src; });
}

const LOCATION_EVENTS = {
  foyer: ['crt-pulse', 'lamp-dip', 'pipe-knock'],
  kitchen: ['fridge-cycle', 'lamp-dip', 'distant-tram'],
  bathroom: ['pipe-knock', 'mirror-breath', 'lamp-dip'],
  stairwell: ['footsteps', 'lamp-dip', 'lift-arrival'],
  lobby: ['footsteps', 'intercom-breath', 'lift-arrival'],
  corridor: ['footsteps', 'lamp-dip', 'door-breath'],
  courtyard: ['tram-pass', 'wind-gust', 'window-pulse'],
  basement: ['pipe-knock', 'boiler-cycle', 'lamp-dip'],
  elevator: ['lift-arrival', 'lamp-dip', 'mirror-breath'],
  attic: ['cable-twitch', 'wind-gust', 'lamp-dip'],
  roof: ['antenna-twitch', 'wind-gust', 'distant-tram'],
  tramstop: ['tram-pass', 'wind-gust', 'light-pass'],
};

function scheduleWorldEvent(location = currentView, delay = 7600 + Math.random() * 8600) {
  clearTimeout(worldEventTimer);
  clearTimeout(worldEventClearTimer);
  if (!room.classList.contains('entered')) return;
  worldEventTimer = window.setTimeout(() => {
    if (currentView !== location || document.hidden || room.classList.contains('detail-open')) {
      scheduleWorldEvent(currentView, 2600 + Math.random() * 3600);
      return;
    }
    const events = LOCATION_EVENTS[location] || LOCATION_EVENTS.foyer;
    const localActionEcho = Object.entries(ACTION_DETAIL).reduce((total, [actionName, sceneName]) => (
      total + (sceneName === location || (location === 'foyer' && sceneName === 'desk') ? (memory.actions?.[actionName] || 0) : 0)
    ), 0);
    const sequence = (memory.locationReturns?.[location] || 0) + localActionEcho + memory.visits + memory.loops;
    const eventName = events[(sequence + Math.floor(performance.now() / 10000)) % events.length];
    room.removeAttribute('data-world-event');
    requestAnimationFrame(() => { room.dataset.worldEvent = eventName; });
    if (['pipe-knock', 'boiler-cycle'].includes(eventName)) sound.pipes();
    else if (['tram-pass', 'distant-tram'].includes(eventName)) sound.tram();
    else if (['lift-arrival'].includes(eventName)) sound.elevator();
    else if (['cable-twitch', 'antenna-twitch', 'crt-pulse'].includes(eventName)) sound.panel();
    else if (['footsteps', 'door-breath'].includes(eventName)) sound.door();
    else sound.touch();
    worldEventClearTimer = window.setTimeout(() => {
      room.removeAttribute('data-world-event');
      scheduleWorldEvent(location, Math.max(4200, 6100 + Math.random() * 7200 - musicState.energy * 1900));
    }, 2300 + Math.random() * 1300);
  }, delay);
}

function showDetail(actionName) {
  const key = ACTION_DETAIL[actionName];
  const scene = DETAIL_SCENES[key];
  if (!scene) return;
  memory.discoveries ||= {};
  memory.discoveries[actionName] = (memory.discoveries[actionName] || 0) + 1;
  save();
  passageHint?.classList.remove('visible');
  if (!detailFrame || !detailImage) return;
  clearTimeout(detailOpenTimer);
  clearTimeout(detailCloseTimer);
  clearTimeout(detailClearTimer);
  resetRabbitHole();
  detailFrame.classList.remove('active');
  detailImage.src = scene.src;
  if (detailResponsePlate) detailResponsePlate.src = scene.src;
  detailFrame.dataset.action = actionName;
  detailFrame.dataset.mode = RABBIT_MODE[actionName] || SCENE_MODE[key] || 'memory';
  configureDetailTouches(key);
  detailFrame.setAttribute('aria-hidden', 'false');
  syncLyricEvidence(true);
  detailOpenTimer = window.setTimeout(() => {
    detailFrame.classList.add('active');
    room.classList.add('detail-open');
  }, 440);
}

function configureDetailTouches(sceneKey) {
  currentDetailScene = sceneKey;
  memory.sceneDetailVisits ||= {};
  memory.sceneDetailVisits[sceneKey] = (memory.sceneDetailVisits[sceneKey] || 0) + 1;
  const sceneTouches = DETAIL_TOUCHES[sceneKey] || [];
  const visitStage = Math.min(3, Math.max(0, memory.sceneDetailVisits[sceneKey] - 1));
  detailFrame.dataset.detailScene = sceneKey;
  detailFrame.dataset.detailMemory = String(visitStage);
  detailTouchButtons.forEach((button, index) => {
    const touch = sceneTouches[index];
    button.hidden = !touch;
    if (!touch) return;
    button.dataset.touchIndex = String(index);
    button.setAttribute('aria-label', touch.label);
    button.style.setProperty('--touch-x', `${touch.x}%`);
    button.style.setProperty('--touch-y', `${touch.y}%`);
    button.style.setProperty('--touch-w', `${touch.w}%`);
    button.style.setProperty('--touch-h', `${touch.h}%`);
  });
  save();
}

function performDetailTouch(index) {
  const touch = DETAIL_TOUCHES[currentDetailScene]?.[index];
  if (!touch || !detailFrame?.classList.contains('active') || detailFrame.classList.contains('rabbit-open')) return;
  startSound();
  memory.detailTouches ||= {};
  const count = (memory.detailTouches[touch.id] || 0) + 1;
  memory.detailTouches[touch.id] = count;
  memory.actions[touch.action] = (memory.actions[touch.action] || 0) + 1;
  const totalTouches = Object.values(memory.detailTouches).reduce((sum, value) => sum + Number(value || 0), 0);
  const nextEvolution = Math.min(8, Math.floor(totalTouches / 6));
  const evolved = nextEvolution > (memory.evolution || 0);
  memory.evolution = nextEvolution;
  detailFrame.dataset.response = touch.effect;
  detailFrame.dataset.touchPhase = String((count - 1) % 4);
  detailFrame.dataset.detailMemory = String(Math.min(3, Number(detailFrame.dataset.detailMemory || 0) + (count > 1 ? 1 : 0)));
  detailFrame.style.setProperty('--response-x', `${touch.x + touch.w / 2}%`);
  detailFrame.style.setProperty('--response-y', `${touch.y + touch.h / 2}%`);
  detailFrame.style.setProperty('--response-left', `${touch.x}%`);
  detailFrame.style.setProperty('--response-top', `${touch.y}%`);
  detailFrame.style.setProperty('--response-width', `${touch.w}%`);
  detailFrame.style.setProperty('--response-height', `${touch.h}%`);
  detailFrame.style.setProperty('--response-mask-w', `${Math.max(7, touch.w * .64)}%`);
  detailFrame.style.setProperty('--response-mask-h', `${Math.max(7, touch.h * .64)}%`);
  const phase = (count - 1) % 4;
  const responseDuration = ({ signal: 2500, mechanical: 1900, paper: 2800, voice: 3300, heat: 3600, glass: 2900, reflection: 3400, water: 3700, snow: 3500, light: 3200, footprint: 2700, threshold: 3500 })[touch.effect] || 2900;
  const responseDx = [-2.2, 1.6, -1.2, 2.1][phase];
  const responseDy = [1.4, -1.1, .8, -1.5][phase];
  detailFrame.style.setProperty('--response-duration', `${responseDuration}ms`);
  detailFrame.style.setProperty('--response-dx', `${responseDx}px`);
  detailFrame.style.setProperty('--response-dy', `${responseDy}px`);
  detailFrame.style.setProperty('--response-dx-soft', `${responseDx * .45}px`);
  detailFrame.style.setProperty('--response-dy-soft', `${responseDy * .45}px`);
  detailFrame.style.setProperty('--response-dx-far', `${responseDx * 1.5}px`);
  detailFrame.style.setProperty('--response-rotate', `${[-.08, .06, -.045, .075][phase]}deg`);
  detailFrame.classList.remove('detail-responding');
  requestAnimationFrame(() => detailFrame.classList.add('detail-responding'));
  clearTimeout(detailReactionTimer);
  detailReactionTimer = window.setTimeout(() => detailFrame.classList.remove('detail-responding'), responseDuration);
  if (typeof sound[touch.sound] === 'function') sound[touch.sound]();
  else sound.touch();
  album.evidence(touch.action);
  room.dataset.objectEcho = touch.effect;
  status.textContent = touch.label.replace(/^./, letter => letter.toUpperCase()) + '.';
  if (evolved) {
    room.classList.add('remembers');
    room.dataset.variant = String(currentVariant());
    room.dataset.day = String(currentDay());
    panoramaRoot.dataset.variant = String(currentVariant());
    panoramaRoot.dataset.cycle = String(currentVariant());
  }
  syncPersistentWorld();
  panorama.react(memoryGroupForAction(touch.action));
  save();
}

detailTouchButtons.forEach((button, index) => {
  button.addEventListener('click', event => {
    event.stopPropagation();
    if (performance.now() - detailTouchConsumedAt < 450) return;
    performDetailTouch(index);
  });
});

function resetRabbitHole() {
  clearTimeout(rabbitTimer);
  currentRabbitAction = '';
  rabbitCommitted = false;
  room.classList.remove('rabbit-open', 'rabbit-diving');
  detailFrame?.classList.remove('rabbit-open', 'rabbit-diving');
  rabbitHole?.setAttribute('aria-hidden', 'true');
  rabbitHole?.removeAttribute('data-mode');
  rabbitHole?.removeAttribute('data-phase');
  rabbitHole?.removeAttribute('data-destination');
}

function enterRabbitHole() {
  if (!detailFrame?.classList.contains('active')) return;
  currentRabbitAction = detailFrame.dataset.action || '';
  if (!currentRabbitAction) return;
  rabbitCommitted = false;
  clearTimeout(detailCloseTimer);
  const mode = detailFrame.dataset.mode || 'memory';
  room.classList.add('rabbit-open');
  detailFrame.classList.add('rabbit-open');
  rabbitHole?.setAttribute('aria-hidden', 'false');
  if (rabbitHole) rabbitHole.dataset.mode = mode;
  deepenRabbitHole();
}

function completeRabbitDescent(destination, delay) {
  if (!destination) return;
  clearTimeout(rabbitTimer);
  rabbitTimer = window.setTimeout(() => {
    memory.loops += 1;
    syncPersistentWorld();
    room.classList.add('remembers');
    room.dataset.variant = String(currentVariant());
    room.dataset.day = String(currentDay());
    panoramaRoot.dataset.loop = String(memory.loops);
    panoramaRoot.dataset.variant = String(currentVariant());
    panoramaRoot.dataset.cycle = String(currentVariant());
    save();
    hideDetail();
    moveTo(destination, { screenX: .5, screenY: .5, u: .5, v: .5 });
  }, delay);
}

function deepenRabbitHole() {
  if (!currentRabbitAction || !rabbitHole || !detailFrame) return;
  if (rabbitCommitted) {
    room.classList.remove('rabbit-diving');
    detailFrame.classList.remove('rabbit-diving');
    requestAnimationFrame(() => {
      room.classList.add('rabbit-diving');
      detailFrame.classList.add('rabbit-diving');
    });
    sound.panel();
    status.textContent = 'Пространство проваливается быстрее.';
    completeRabbitDescent(rabbitHole.dataset.destination, 220);
    return;
  }
  memory.rabbitDepths ||= {};
  const depth = (memory.rabbitDepths[currentRabbitAction] || 0) + 1;
  memory.rabbitDepths[currentRabbitAction] = depth;
  rabbitHole.dataset.phase = String(depth % 6);
  room.classList.remove('rabbit-diving');
  detailFrame.classList.remove('rabbit-diving');
  requestAnimationFrame(() => {
    room.classList.add('rabbit-diving');
    detailFrame.classList.add('rabbit-diving');
  });
  sound.panel();
  syncLyricEvidence();
  save();

  const mode = detailFrame.dataset.mode || 'memory';
  const destinations = RABBIT_DESTINATIONS[mode] || RABBIT_DESTINATIONS.memory;
  let destinationIndex = (depth - 1 + memory.visits + memory.loops) % destinations.length;
  if (destinations[destinationIndex] === currentView) destinationIndex = (destinationIndex + 1) % destinations.length;
  const destination = destinations[destinationIndex];
  rabbitCommitted = true;
  rabbitHole.dataset.destination = destination;
  status.textContent = 'Экран становится глубже комнаты.';
  completeRabbitDescent(destination, 2380);
}

detailPortal?.addEventListener('click', event => {
  event.stopPropagation();
  enterRabbitHole();
});

detailFrame?.addEventListener('pointerup', event => {
  if (!detailFrame.classList.contains('active') || detailFrame.classList.contains('rabbit-open')) return;
  if (event.target.closest?.('.detail-portal, .rabbit-hole')) return;
  const rect = detailFrame.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  const touchIndex = (DETAIL_TOUCHES[currentDetailScene] || []).findIndex(touch => (
    x >= touch.x && x <= touch.x + touch.w && y >= touch.y && y <= touch.y + touch.h
  ));
  if (touchIndex < 0) return;
  detailTouchConsumedAt = performance.now();
  event.preventDefault();
  event.stopPropagation();
  performDetailTouch(touchIndex);
});

detailFrame?.addEventListener('click', event => {
  if (!detailFrame.classList.contains('active') || detailFrame.classList.contains('rabbit-open')) return;
  if (performance.now() - detailTouchConsumedAt < 450) {
    event.stopPropagation();
    return;
  }
  if (event.target.closest?.('.detail-portal, .detail-touch, .rabbit-hole')) return;
  const rect = detailFrame.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  const touchIndex = (DETAIL_TOUCHES[currentDetailScene] || []).findIndex(touch => (
    x >= touch.x && x <= touch.x + touch.w && y >= touch.y && y <= touch.y + touch.h
  ));
  if (touchIndex >= 0) {
    event.stopPropagation();
    performDetailTouch(touchIndex);
    return;
  }
  if (event.target === detailFrame) hideDetail();
});

rabbitThreshold?.addEventListener('click', event => {
  event.stopPropagation();
  deepenRabbitHole();
});

function syncLyricEvidence(forceNew = false) {
  if (!lyricEvidence || !detailFrame) return;
  const track = ALBUM.find(item => item.id === room.dataset.chapter);
  const fragments = track ? LYRIC_EVIDENCE[track.id] || [] : [];
  if (!track || !fragments.length) {
    lyricEvidence.textContent = '';
    detailFrame.removeAttribute('data-track');
    activeLyricTrack = '';
    activeLyricSegment = -1;
    activeLyricIndex = -1;
    return;
  }
  const playbackTime = Number.isFinite(recordElement?.currentTime) ? recordElement.currentTime : memory.albumTime || 0;
  const progress = Math.max(0, Math.min(.9999, playbackTime / track.duration));
  const timelineSegment = Math.min(fragments.length - 1, Math.floor(progress * fragments.length));
  const contextChanged = activeLyricTrack !== track.id || activeLyricSegment !== timelineSegment;
  if (forceNew || contextChanged || activeLyricIndex < 0) {
    memory.lyricCursors ||= {};
    const storedCursor = Number(memory.lyricCursors[track.id]);
    let fragmentIndex = Number.isInteger(storedCursor) ? storedCursor : timelineSegment;
    fragmentIndex = ((fragmentIndex % fragments.length) + fragments.length) % fragments.length;
    if (fragments.length > 1 && fragments[fragmentIndex] === memory.lastLyricEvidence) {
      fragmentIndex = (fragmentIndex + 1) % fragments.length;
    }
    activeLyricTrack = track.id;
    activeLyricSegment = timelineSegment;
    activeLyricIndex = fragmentIndex;
    memory.lyricCursors[track.id] = (fragmentIndex + 1) % fragments.length;
    memory.lastLyricEvidence = fragments[fragmentIndex];
    save();
  }
  lyricEvidence.textContent = fragments[activeLyricIndex];
  detailFrame.dataset.track = track.id;
}

recordElement?.addEventListener('timeupdate', () => {
  if (detailFrame?.classList.contains('active')) syncLyricEvidence();
});

function hideDetail() {
  clearTimeout(detailOpenTimer);
  clearTimeout(detailCloseTimer);
  clearTimeout(detailReactionTimer);
  if (!detailFrame || !detailImage) return;
  detailFrame.classList.remove('active');
  detailFrame.setAttribute('aria-hidden', 'true');
  room.classList.remove('detail-open');
  detailFrame.classList.remove('detail-responding');
  resetRabbitHole();
  clearTimeout(detailClearTimer);
  detailClearTimer = window.setTimeout(() => {
    if (!detailFrame.classList.contains('active')) {
      detailImage.removeAttribute('src');
      detailResponsePlate?.removeAttribute('src');
      detailFrame.removeAttribute('data-action');
      detailFrame.removeAttribute('data-track');
      detailFrame.removeAttribute('data-mode');
      detailFrame.removeAttribute('data-response');
      detailFrame.removeAttribute('data-touch-phase');
      detailFrame.removeAttribute('data-detail-scene');
      if (lyricEvidence) lyricEvidence.textContent = '';
    }
  }, 720);
}

function resolveView(nextView) {
  const returning = memory.visits > 1 || memory.loops > 0;
  if (nextView === 'descent') return ['courtyard', 'lobby', 'basement'][currentDay()];
  if (nextView === 'threshold' && currentView === 'foyer' && returning && currentVariant() % 2 === 1) return 'threshold-return';
  return nextView;
}

function moveTo(nextView, passage = null) {
  const resolved = resolveView(nextView);
  if (!resolved || resolved === currentView) return;
  hideDetail();
  passageHint?.classList.remove('visible');
  room.removeAttribute('data-world-event');
  clearTimeout(transitionTimer);
  const entersPanorama = panorama.hasView(resolved);
  if (!entersPanorama) return;
  room.classList.add('transitioning');
  sound.move();
  album.scene(resolved);
  transitionTimer = window.setTimeout(() => {
    currentView = resolved;
    room.dataset.view = resolved;
    registerLocation(resolved);
    views.forEach(view => view.classList.toggle('active', false));
    room.classList.add('pano-active');
    panorama.setActive(true, resolved, passage);
    scheduleWorldEvent(resolved);
    room.classList.remove('transitioning');
    status.textContent = 'Пространство незаметно смещается.';
  }, 90);
}

function returnToRoom(from) {
  memory.loops += 1;
  syncPersistentWorld();
  save();
  room.classList.add('remembers');
  room.dataset.variant = String(currentVariant());
  room.dataset.day = String(currentDay());
  panoramaRoot.dataset.loop = String(memory.loops);
  panoramaRoot.dataset.variant = String(currentVariant());
  panoramaRoot.dataset.cycle = String(currentVariant());
  const detours = {
    basement: ['elevator', 'foyer'],
    corridor: ['elevator', 'foyer'],
    elevator: ['corridor', 'foyer'],
  };
  const next = detours[from]?.[memory.loops % 2] || 'foyer';
  moveTo(next);
}

function action(name) {
  memory.actions[name] = (memory.actions[name] || 0) + 1;
  panorama.react(memoryGroupForAction(name));
  save();
  showDetail(name);
  album.evidence(name);
  if (ACTION_DETAIL[name]) sound.touch();
  if (name === 'window') {
    room.classList.add('window-open');
    sound.window();
    album.emerge();
    status.textContent = 'Из окна входит холодный воздух.';
  }
  if (name === 'curtain') { room.classList.add('curtain-moved'); sound.curtain(); album.breathe(); }
  if (name === 'crt') { room.classList.add('crt-awake'); sound.crt(); album.muffle(); }
  if (name === 'lamp') { room.classList.remove('lamp-touched'); requestAnimationFrame(() => room.classList.add('lamp-touched')); sound.lamp(); }
  if (name === 'cup') { sound.cup(); }
  if (name === 'photo') { room.classList.add('photo-seen'); sound.photo(); }
  if (name === 'chair') { room.classList.add('chair-touched'); sound.chair(); }
  if (name === 'radiator') { room.classList.add('radiator-warm'); sound.radiator(); }
  if (name === 'bed') { room.classList.add('bed-touched'); sound.bed(); }
  if (name === 'kettle') { room.classList.add('kettle-heard'); sound.kettle(); album.breathe(); }
  if (name === 'cassette') { room.classList.add('cassette-touched'); sound.cassette(); album.emerge(); }
  if (name === 'fridge') { room.classList.add('fridge-heard'); sound.fridge(); }
  if (name === 'kitchen-table') { room.classList.add('kitchen-table-seen'); sound.table(); }
  if (name === 'mirror') { room.classList.add('mirror-seen'); sound.mirror(); album.muffle(); }
  if (name === 'tap') { room.classList.add('tap-touched'); sound.tap(); }
  if (name === 'washer') { room.classList.add('washer-heard'); sound.washer(); }
  if (name === 'cabinet') { room.classList.add('cabinet-open'); sound.cabinet(); }
  if (name === 'panel') { room.classList.add('panel-heard'); sound.panel(); album.muffle(); }
  if (name === 'elevator') {
    room.classList.add('elevator-open');
    sound.elevator();
    clearTimeout(elevatorTimer);
    elevatorTimer = window.setTimeout(() => { if (currentView === 'threshold-return') returnToRoom(); }, 5400);
  }
  if (name === 'notebook') {
    memory.notebookPages += 1;
    if (memory.notebookPages >= 3 && !memory.notebookRevealed) {
      memory.notebookRevealed = true;
      status.textContent = 'Страница помнит, что её уже открывали.';
    }
    save();
    sound.paper();
  }
  if (name === 'stair-window') { room.classList.add('stair-window-seen'); sound.stairWindow(); album.breathe(); }
  if (name === 'rail') { room.classList.add('rail-touched'); sound.rail(); }
  if (name === 'tram') { room.classList.add('tram-heard'); sound.tram(); album.emerge(); }
  if (name === 'bench') { room.classList.add('bench-seen'); sound.bench(); }
  if (name === 'mailboxes') { room.classList.add('mailboxes-seen'); sound.mailboxes(); }
  if (name === 'intercom') { room.classList.add('intercom-touched'); sound.intercom(); }
  if (name === 'pipes') { room.classList.add('pipes-heard'); sound.pipes(); album.breathe(); }
  if (name === 'valve') { room.classList.add('valve-touched'); sound.valve(); }
  if (name === 'boiler') { room.classList.add('boiler-heard'); sound.boiler(); }
  if (name === 'basement-window') { room.classList.add('basement-window-seen'); sound.basementWindow(); }
  if (name === 'corridor-window') { room.classList.add('corridor-window-seen'); sound.stairWindow(); album.breathe(); }
  if (name === 'corridor-lamp') { room.classList.add('corridor-lamp-seen'); sound.lamp(); }
  if (name === 'elevator-mirror') { room.classList.add('elevator-mirror-seen'); sound.mirror(); album.muffle(); }
  if (name === 'elevator-button') { room.classList.add('elevator-button-seen'); sound.elevator(); album.emerge(); }
  if (name === 'shoes') { room.classList.add('shoes-seen'); sound.shoes(); album.breathe(); }
  if (name === 'plant') { room.classList.add('plant-seen'); sound.plant(); }
  if (name === 'record-player') { room.classList.add('record-heard'); sound.cassette(); album.emerge(); }
  if (name === 'sink' || name === 'bathroom-pipe') { room.classList.add('water-heard'); sound.tap(); album.breathe(); }
  if (name === 'kitchen-window' || name === 'courtyard-gate') { room.classList.add('cold-air'); sound.window(); }
  if (name === 'stair-lamp' || name === 'lobby-light' || name === 'elevator-ceiling') { room.classList.add('light-touched'); sound.lamp(); }
  if (name === 'corridor-door' || name === 'basement-door') { room.classList.add('door-heard'); sound.door(); }
  if (name.startsWith('attic-')) {
    room.classList.add('attic-touched');
    if (name === 'attic-cable') sound.panel();
    else if (name === 'attic-bulb') sound.lamp();
    else sound.paper();
  }
  if (name.startsWith('roof-')) {
    room.classList.add('roof-touched');
    if (name === 'roof-antenna' || name === 'roof-cable') sound.panel();
    else sound.window();
  }
  if (name.startsWith('tramstop-')) {
    room.classList.add('tramstop-touched');
    if (name === 'tramstop-tram') sound.tram();
    else if (name === 'tramstop-glass') sound.tap();
    else sound.bench();
  }
  syncPersistentWorld();
  save();
}

document.addEventListener('click', event => {
  if (event.target.closest('#panorama, #detail-frame')) return;

  startSound();
  const target = event.target.closest('[data-to], [data-action], [data-loop], [data-back]');
  if (!target) { if (currentView !== 'foyer') moveTo('foyer'); return; }
  if (target.dataset.to) moveTo(target.dataset.to);
  else if (target.hasAttribute('data-loop')) returnToRoom();
  else if (target.hasAttribute('data-back')) moveTo('foyer');
  else action(target.dataset.action);
});

document.addEventListener('pointerover', event => {
  const target = event.target.closest('[data-dwell]');
  if (!target || dwellTarget === target) return;
  dwellTarget = target;
  clearTimeout(dwellTimer);
  dwellTimer = window.setTimeout(() => { if (dwellTarget === target) action(target.dataset.dwell); }, 2600);
});

document.addEventListener('pointerout', event => {
  const target = event.target.closest('[data-dwell]');
  if (!target || target !== dwellTarget) return;
  dwellTarget = null;
  clearTimeout(dwellTimer);
});

document.addEventListener('keydown', event => {
  if (!room.classList.contains('entered')) return;
  if (event.key === 'Escape' && detailFrame?.classList.contains('active')) hideDetail();
  else if (event.key === 'Escape') moveTo('foyer');
  else startSound();
});
document.addEventListener('visibilitychange', () => {
  album.persist();
  if (!document.hidden && room.classList.contains('entered')) queueBlink(1900 + Math.random() * 2200);
});
addEventListener('resize', () => panorama.resize());

let lookAnimation = 0;
let lookX = 0;
let lookY = 0;
document.addEventListener('pointermove', event => {
  lookX = Math.max(-1, Math.min(1, (event.clientX / innerWidth - .5) * 2));
  lookY = Math.max(-1, Math.min(1, (event.clientY / innerHeight - .5) * 2));
  if (lookAnimation) return;
  lookAnimation = requestAnimationFrame(() => {
    room.style.setProperty('--look-x', `${(-lookX * 5).toFixed(2)}px`);
    room.style.setProperty('--look-y', `${(-lookY * 3).toFixed(2)}px`);
    lookAnimation = 0;
  });
});

function createAlbum(element) {
  let currentIndex = Math.min(Math.max(Number(memory.albumIndex) || 0, 0), ALBUM.length - 1);
  let started = false;
  let active = false;
  let lastSavedAt = 0;
  let loadVersion = 0;
  let targetVolume = .14;
  let preparedIndex = -1;
  let evidenceTimer = 0;
  let analysisContext = null;
  let analyser = null;
  let frequencyData = null;
  let smoothedLow = 0;
  let smoothedMid = 0;
  let smoothedHigh = 0;

  if (!element) return { start() {}, emerge() {}, breathe() {}, muffle() {}, scene() {}, persist() {}, levels() { return { low: 0, mid: 0, high: 0, active: false, progress: 0 }; } };
  element.preload = 'auto';
  element.volume = 0;

  function ensureAnalysis() {
    if (analysisContext) {
      if (analysisContext.state === 'suspended') analysisContext.resume().catch(() => {});
      return;
    }
    const AudioEngine = window.AudioContext || window.webkitAudioContext;
    if (!AudioEngine) return;
    try {
      analysisContext = new AudioEngine();
      analyser = analysisContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = .84;
      frequencyData = new Uint8Array(analyser.frequencyBinCount);
      const source = analysisContext.createMediaElementSource(element);
      source.connect(analyser);
      analyser.connect(analysisContext.destination);
      if (analysisContext.state === 'suspended') analysisContext.resume().catch(() => {});
    } catch {
      analysisContext = null;
      analyser = null;
      frequencyData = null;
    }
  }

  function levels() {
    const duration = Number.isFinite(element.duration) && element.duration > 0 ? element.duration : ALBUM[currentIndex].duration;
    const progress = Math.max(0, Math.min(1, (element.currentTime || 0) / Math.max(1, duration)));
    if (!analyser || !frequencyData || !active) return { low: 0, mid: 0, high: 0, active: false, progress };
    analyser.getByteFrequencyData(frequencyData);
    const band = (from, to) => {
      let total = 0;
      const end = Math.min(to, frequencyData.length);
      for (let index = from; index < end; index += 1) total += frequencyData[index];
      return total / Math.max(1, end - from);
    };
    const rawLow = Math.min(1, band(0, 7) / 175);
    const rawMid = Math.min(1, band(7, 38) / 165);
    const rawHigh = Math.min(1, band(38, 132) / 150);
    smoothedLow = smoothedLow * .78 + rawLow * .22;
    smoothedMid = smoothedMid * .8 + rawMid * .2;
    smoothedHigh = smoothedHigh * .82 + rawHigh * .18;
    return { low: smoothedLow, mid: smoothedMid, high: smoothedHigh, active: true, progress };
  }

  function setChapter(index) {
    currentIndex = index;
    memory.albumIndex = index;
    memory.albumTime = 0;
    memory.albumFinished = false;
    room.dataset.chapter = ALBUM[index].id;
    save();
  }

  function fade(to, seconds) {
    targetVolume = to;
    if (!active) return;
    const from = element.volume;
    const startedAt = performance.now();
    const frame = now => {
      const progress = Math.min(1, (now - startedAt) / (seconds * 1000));
      element.volume = from + (to - from) * progress;
      if (progress < 1 && targetVolume === to) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  function loadTrack(index, startAt = 0) {
    const track = ALBUM[index];
    const version = ++loadVersion;
    currentIndex = index;
    preparedIndex = index;
    room.dataset.chapter = track.id;
    element.pause();
    element.src = track.src;
    element.load();
    const onMetadata = () => {
      if (version !== loadVersion) return;
      const safeStart = Math.max(0, Math.min(startAt, Math.max(0, element.duration - .35)));
      if (safeStart) element.currentTime = safeStart;
      if (started) ensurePlaying();
    };
    element.addEventListener('loadedmetadata', onMetadata, { once: true });
    if (started) ensurePlaying();
  }

  function ensurePlaying() {
    element.play().then(() => { active = true; }).catch(() => { active = false; });
  }

  function persist() {
    if (!element || !Number.isFinite(element.currentTime)) return;
    memory.albumIndex = currentIndex;
    memory.albumTime = element.currentTime;
    save();
  }

  function advance() {
    persist();
    if (currentIndex >= ALBUM.length - 1) {
      // The album is a day, not an ending. Completing all six compositions
      // advances the apartment and lets the next cycle surface quietly.
      memory.loops += 1;
      memory.albumFinished = false;
      room.classList.add('remembers');
      room.dataset.variant = String(currentVariant());
      room.dataset.day = String(currentDay());
      panoramaRoot.dataset.loop = String(memory.loops);
      panoramaRoot.dataset.variant = String(currentVariant());
      panoramaRoot.dataset.cycle = String(currentVariant());
      syncPersistentWorld();
      setChapter(0);
      lastSavedAt = 0;
      element.volume = .035;
      loadTrack(currentIndex, 0);
      fade(.15, 10);
      save();
      return;
    }
    setChapter(currentIndex + 1);
    loadTrack(currentIndex, 0);
    fade(.16, 3);
  }

  element.addEventListener('timeupdate', () => {
    if (element.currentTime - lastSavedAt >= 12) {
      lastSavedAt = element.currentTime;
      persist();
    }
  });
  element.addEventListener('ended', advance);
  loadTrack(currentIndex, memory.albumTime || 0);

  return {
    start() {
      ensureAnalysis();
      if (memory.albumFinished) {
        memory.albumFinished = false;
        memory.albumIndex = 0;
        memory.albumTime = 0;
        currentIndex = 0;
        loadTrack(currentIndex, 0);
      }
      if (!started) {
        started = true;
        currentIndex = Math.min(memory.albumIndex, ALBUM.length - 1);
        if (preparedIndex !== currentIndex) loadTrack(currentIndex, memory.albumTime || 0);
        ensurePlaying();
        window.setTimeout(() => fade(.14, 8), 3800);
      } else ensurePlaying();
    },
    emerge() { fade(.3, 10); },
    breathe() { fade(.23, 6); },
    muffle() { fade(.12, 5); },
    scene(view) {
      if (view === 'threshold' || view === 'threshold-return') fade(.15, 4);
      if (view === 'window') fade(.26, 6);
      if (view === 'courtyard') fade(.27, 8);
      if (view === 'kitchen') fade(.22, 6);
      if (view === 'corridor' || view === 'elevator') fade(.13, 5);
      if (view === 'basement') fade(.18, 7);
      if (view === 'attic') fade(.17, 7);
      if (view === 'roof') fade(.24, 9);
      if (view === 'tramstop') fade(.28, 8);
    },
    evidence(action) {
      const track = ACTION_TRACK[action];
      if (!track) return;
      room.dataset.evidence = track;
      clearTimeout(evidenceTimer);
      evidenceTimer = window.setTimeout(() => { delete room.dataset.evidence; }, 8200);
      // When the physical evidence and the current chapter coincide, let the song surface.
      fade(track === ALBUM[currentIndex].id ? .3 : .19, track === ALBUM[currentIndex].id ? 8 : 4);
    },
    levels,
    persist,
  };
}

function renderMusicResponse(time) {
  if (time - lastMusicResponse >= 32) {
    lastMusicResponse = time;
    const sample = album.levels();
    const blend = sample.active ? .34 : .12;
    musicState.low += (sample.low - musicState.low) * blend;
    musicState.mid += (sample.mid - musicState.mid) * blend;
    musicState.high += (sample.high - musicState.high) * blend;
    musicState.energy = musicState.low * .5 + musicState.mid * .32 + musicState.high * .18;
    musicState.progress = sample.progress || 0;
    musicState.chapter = Math.max(0, ALBUM.findIndex(track => track.id === room.dataset.chapter));
    musicState.active = sample.active;
    room.style.setProperty('--music-low', musicState.low.toFixed(3));
    room.style.setProperty('--music-mid', musicState.mid.toFixed(3));
    room.style.setProperty('--music-high', musicState.high.toFixed(3));
    room.style.setProperty('--music-energy', musicState.energy.toFixed(3));
    room.style.setProperty('--music-snow', (musicState.high * .28).toFixed(3));
    room.style.setProperty('--music-air', (musicState.mid * .18).toFixed(3));
    room.style.setProperty('--music-bright', (musicState.high * .35).toFixed(3));
    room.style.setProperty('--music-grain', (musicState.high * .12).toFixed(3));
    const musicPresence = sample.active && musicState.energy > .018 ? 'live' : 'quiet';
    if (room.dataset.music !== musicPresence) room.dataset.music = musicPresence;
    const phaseIndex = Math.min(3, Math.floor((sample.progress || 0) * 4));
    const phase = ['opening', 'body', 'fracture', 'afterimage'][phaseIndex];
    if (room.dataset.songPhase !== phase) room.dataset.songPhase = phase;
    panorama.setAudio(musicState);
  }
  requestAnimationFrame(renderMusicResponse);
}

function createSoundscape() {
  let context, master, airGain;
  function start() {
    if (!window.AudioContext || context) return;
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = .048;
    master.connect(context.destination);
    const buffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let index = 0; index < data.length; index += 1) { last = last * .991 + (Math.random() * 2 - 1) * .09; data[index] = last; }
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const low = context.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = 170;
    airGain = context.createGain();
    airGain.gain.value = .043;
    source.connect(low).connect(airGain).connect(master);
    source.start();
    tone(49.5, 'sine', .055, master);
    tone(99, 'sine', .005, master);
  }
  function tone(frequency, type, gainValue, destination) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.value = gainValue;
    oscillator.connect(gain).connect(destination);
    oscillator.start();
  }
  function pulse(frequency, duration, volume, type = 'sine') {
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(.001, context.currentTime);
    gain.gain.linearRampToValueAtTime(volume, context.currentTime + .06);
    gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + duration);
    oscillator.connect(gain).connect(master);
    oscillator.start();
    oscillator.stop(context.currentTime + duration + .08);
  }
  return {
    start,
    move: () => pulse(72, .38, .006, 'triangle'),
    touch: () => pulse(238, .16, .0025, 'sine'),
    window: () => { if (!context) return; airGain.gain.linearRampToValueAtTime(.12, context.currentTime + 1.4); airGain.gain.linearRampToValueAtTime(.045, context.currentTime + 16); },
    curtain: () => pulse(310, .32, .006, 'triangle'),
    crt: () => { pulse(57, 2.4, .018, 'triangle'); pulse(182, .22, .006); },
    lamp: () => pulse(164, .5, .008),
    cup: () => pulse(760, .2, .005),
    photo: () => pulse(105, 1.1, .007, 'sine'),
    chair: () => pulse(84, .42, .013, 'triangle'),
    radiator: () => pulse(332, 1.25, .013),
    bed: () => pulse(124, .31, .009, 'triangle'),
    paper: () => pulse(990, .12, .004),
    kettle: () => { pulse(521, .72, .005, 'sine'); pulse(610, 1.2, .003); },
    cassette: () => { pulse(280, .18, .011, 'triangle'); pulse(74, .6, .006); },
    fridge: () => pulse(57, 1.4, .008, 'sine'),
    table: () => pulse(156, .26, .009, 'triangle'),
    mirror: () => pulse(1190, .34, .004, 'sine'),
    tap: () => { pulse(890, .12, .004); pulse(1250, .09, .003); },
    washer: () => pulse(96, 1.1, .009, 'triangle'),
    cabinet: () => pulse(412, .24, .005, 'triangle'),
    panel: () => pulse(62, 1.9, .011, 'sawtooth'),
    elevator: () => { pulse(88, 1.8, .014, 'sine'); pulse(142, .25, .008); },
    stairWindow: () => pulse(136, 1.5, .008, 'sine'),
    rail: () => pulse(178, .42, .008, 'triangle'),
    tram: () => { pulse(98, 1.8, .011, 'triangle'); pulse(440, .42, .005, 'sine'); },
    bench: () => pulse(112, .54, .008, 'triangle'),
    mailboxes: () => pulse(742, .18, .004),
    intercom: () => { pulse(880, .12, .006); pulse(440, .12, .004); },
    pipes: () => pulse(54, 2.2, .013, 'sine'),
    valve: () => pulse(225, .38, .007, 'triangle'),
    boiler: () => pulse(68, 1.5, .01, 'sine'),
    basementWindow: () => pulse(154, 1.2, .007, 'sine'),
    shoes: () => { pulse(92, .25, .012, 'triangle'); pulse(54, .8, .006, 'sine'); },
    plant: () => pulse(241, .75, .004, 'sine'),
    door: () => pulse(67, .68, .011, 'triangle'),
  };
}

const snowContext = snowCanvas?.getContext('2d');
const atmosphereContext = atmosphereCanvas?.getContext('2d');
const flakes = Array.from({ length: 240 }, () => ({
  x: Math.random(),
  y: Math.random(),
  r: Math.random() * 1.45 + .3,
  speed: Math.random() * .00058 + .00013,
  drift: Math.random() * Math.PI * 2,
  sway: Math.random() * .00018 + .00003,
}));
let snowRatio = 1;
let atmosphereRatio = 1;
const airParticles = Array.from({ length: 140 }, () => ({
  x: Math.random(), y: Math.random(), z: Math.random(),
  drift: Math.random() * Math.PI * 2, speed: Math.random() * .00012 + .000025,
}));

function resizeSnow() {
  if (!snowCanvas || !snowContext) return;
  snowRatio = Math.min(devicePixelRatio, 1.5);
  snowCanvas.width = innerWidth * snowRatio;
  snowCanvas.height = innerHeight * snowRatio;
  snowContext.setTransform(snowRatio, 0, 0, snowRatio, 0, 0);
}

function resizeAtmosphere() {
  if (!atmosphereCanvas || !atmosphereContext) return;
  atmosphereRatio = Math.min(devicePixelRatio, 1.35);
  atmosphereCanvas.width = innerWidth * atmosphereRatio;
  atmosphereCanvas.height = innerHeight * atmosphereRatio;
  atmosphereContext.setTransform(atmosphereRatio, 0, 0, atmosphereRatio, 0, 0);
}

function paintSoft(context, x, y, radius, red, green, blue, alpha) {
  if (radius < 1.2) {
    context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    context.fillRect(x, y, 1, 1);
    return;
  }
  const glow = context.createRadialGradient(x, y, 0, x, y, radius);
  glow.addColorStop(0, `rgba(${red}, ${green}, ${blue}, ${alpha})`);
  glow.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`);
  context.fillStyle = glow;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
}

function renderAtmosphere(time) {
  if (!atmosphereContext) return;
  atmosphereContext.clearRect(0, 0, innerWidth, innerHeight);
  const location = panoramaRoot?.dataset.location || 'foyer';
  const exterior = ['courtyard', 'roof', 'tramstop'].includes(location);
  const cycle = Number(panoramaRoot?.dataset.cycle) || 0;
  const returnCount = Number(panoramaRoot?.dataset.returnCount) || 0;
  const musicLift = Math.round(musicState.mid * 20 + musicState.high * 10);
  const count = exterior ? airParticles.length : Math.min(airParticles.length, 48 + cycle * 7 + Math.min(returnCount, 4) * 5 + musicLift);
  for (let index = 0; index < count; index += 1) {
    const particle = airParticles[index];
    const depth = .2 + particle.z * .8;
    const musicDrift = 1 + musicState.low * .7 + musicState.mid * .45;
    particle.y += (exterior ? particle.speed * (2.8 - depth) : -particle.speed * .36) * musicDrift;
    particle.x += Math.sin(time * .00032 + particle.drift) * particle.speed * (exterior ? 4.5 : .9) * (1 + musicState.mid * .9);
    if (particle.y > 1.08) particle.y = -.08;
    if (particle.y < -.08) particle.y = 1.08;
    if (particle.x > 1.08 || particle.x < -.08) particle.x = Math.random();
    const radius = (exterior ? (1.1 + depth * 4.2) : (.4 + depth * 1.65)) + musicState.high * (exterior ? 1.5 : .45);
    const alpha = (exterior ? (.052 + depth * .16) : (.01 + depth * .032)) * (1 + musicState.mid * .35);
    paintSoft(
      atmosphereContext,
      particle.x * innerWidth,
      particle.y * innerHeight,
      radius,
      exterior ? 225 : 198,
      exterior ? 237 : 199,
      exterior ? 246 : 193,
      alpha,
    );
  }
  if (location === 'kitchen' && room.classList.contains('kettle-heard')) {
    for (let index = 0; index < 10; index += 1) {
      const rise = ((time * .00008 + index * .13) % 1);
      paintSoft(atmosphereContext, innerWidth * (.63 + Math.sin(time * .0004 + index) * .025), innerHeight * (.5 - rise * .24), 7 + rise * 13, 216, 218, 210, .018 * (1 - rise));
    }
  }
  requestAnimationFrame(renderAtmosphere);
}

function snowRect() {
  if (['courtyard', 'roof', 'tramstop'].includes(panoramaRoot?.dataset.location)) {
    return { left: 0, top: 0, width: innerWidth, height: innerHeight };
  }
  if (currentView !== 'window') return null;
  const zone = document.querySelector('.window-glass')?.getBoundingClientRect();
  if (!zone) return null;
  return { left: zone.left, top: zone.top, width: zone.width, height: zone.height * .67 };
}

function renderSnow(time) {
  if (!snowContext) return;
  snowContext.clearRect(0, 0, innerWidth, innerHeight);
  const rect = snowRect();
  if (rect) {
    snowContext.save();
    snowContext.beginPath();
    snowContext.rect(rect.left, rect.top, rect.width, rect.height);
    snowContext.clip();
    const cycle = Number(panoramaRoot?.dataset.cycle) || 0;
    const returnCount = Number(panoramaRoot?.dataset.returnCount) || 0;
    const flakeCount = Math.min(flakes.length, 150 + cycle * 30 + Math.min(returnCount, 4) * 14 + Math.round(musicState.high * 30));
    for (let index = 0; index < flakeCount; index += 1) {
      const flake = flakes[index];
      flake.y += flake.speed * (1 + musicState.low * .55);
      flake.x += Math.sin(time * .0003 + flake.drift) * flake.sway;
      if (flake.y > 1.05 || flake.x < -.06 || flake.x > 1.06) { flake.y = -.05; flake.x = Math.random(); }
      const x = rect.left + flake.x * rect.width;
      const y = rect.top + flake.y * rect.height;
      const alpha = .13 + flake.r * .095 + musicState.high * .08;
      snowContext.fillStyle = `rgba(232, 241, 247, ${alpha})`;
      snowContext.beginPath();
      snowContext.ellipse(x, y, flake.r * .72, flake.r * (1.08 + flake.speed * 820), 0, 0, Math.PI * 2);
      snowContext.fill();
    }
    snowContext.restore();
  }
  requestAnimationFrame(renderSnow);
}

resizeSnow();
resizeAtmosphere();
addEventListener('resize', resizeSnow);
addEventListener('resize', resizeAtmosphere);
requestAnimationFrame(renderSnow);
requestAnimationFrame(renderAtmosphere);
