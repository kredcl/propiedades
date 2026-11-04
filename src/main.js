import './style.css';
import Lenis from 'lenis';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const RM = root.classList.contains('rm');
if (!RM) root.classList.add('mo');

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const seg = (p, a, b) => clamp01((p - a) / (b - a));
const mix = (a, b, t) => a + (b - a) * t;
const out3 = (t) => 1 - (1 - t) ** 3;
const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const px = (v) => `${v.toFixed(1)}px`;
let vw = innerWidth;
let vh = innerHeight;
const isPhone = () => vw < 900;
const hh = () => (isPhone() ? 64 : 76);
const mPx = () => Math.min(40, Math.max(16, vw * 0.026));

const set = (el, prop, val) => { if (el && el.style[prop] !== val) el.style[prop] = val; };
const pinP = (el) => {
  const r = el.getBoundingClientRect();
  return { p: clamp01(-r.top / Math.max(1, r.height - vh)), r };
};

/* ---------- Scroll suave ---------- */
const lenis = RM ? null : new Lenis({ lerp: 0.1, wheelMultiplier: 0.95 });
const scrollToY = (y, opts = {}) => (lenis ? lenis.scrollTo(y, { duration: 1.4, ...opts }) : scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' }));

/* ---------- Héroe: cámara que avanza por tres tomas ---------- */
const heroEl = $('[data-scene="hero"]');
const heroLines = $$('[data-hero-line]');
const shots = $$('[data-shot]', heroEl).map((el) => ({ el, img: $('img', el) }));
const sine = (t) => 0.5 - Math.cos(Math.PI * t) / 2;
function hero() {
  const { p, r } = pinP(heroEl);
  if (r.bottom < -50) return;
  // 1: nos acercamos al living iluminado de la Residencia 01
  set(shots[0].img, 'transform', `scale(${mix(1.02, 1.4, sine(seg(p, 0, 0.42))).toFixed(4)})`);
  // 2: entramos: la escalera de acero frente a la piscina
  set(shots[1].el, 'opacity', seg(p, 0.3, 0.42).toFixed(3));
  set(shots[1].img, 'transform', `scale(${mix(1.0, 1.28, sine(seg(p, 0.3, 0.76))).toFixed(4)})`);
  // 3: el living, donde la cámara se detiene
  set(shots[2].el, 'opacity', seg(p, 0.64, 0.76).toFixed(3));
  set(shots[2].img, 'transform', `scale(${mix(1.0, 1.14, sine(seg(p, 0.64, 1))).toFixed(4)})`);
  heroLines.forEach((el, i) => {
    const local = p * 3 - i;
    let o = 1;
    if (i > 0) o = Math.min(o, seg(local, -0.02, 0.14));
    if (i < 2) o = Math.min(o, 1 - seg(local, 0.8, 0.96));
    set(el, 'opacity', o.toFixed(3));
    set(el, 'transform', `translateY(${px((1 - o) * (local < 0.5 ? 26 : -26))})`);
    set(el, 'filter', o < 0.99 ? `blur(${((1 - o) * 6).toFixed(1)}px)` : 'none');
  });
}

/* ---------- Nube de fotos ---------- */
const cloudEl = $('[data-scene="cloud"]');
const cloudPics = $$('.cloud-pic', cloudEl);
const cloudTitle = $('[data-cloud-title]');
const cloudMain = $('[data-cloud-main]');
const slideUi = $('[data-slide-ui]');
const slideCap = $('[data-slide-cap]');
const slides = $$('.slide');
const caps = ['Residencia 01 · Los Dominicos', 'Casa del Canelo · vendida en 2025', 'Casa Piedra Roja · vendida en 2024', 'Residencia 02 · Pirque'];
let cloudOffsets = [];
function measureCloud() {
  cloudOffsets = cloudPics.map((el) => {
    el.style.transform = '';
    const r = el.getBoundingClientRect();
    const s = cloudEl.querySelector('.stage').getBoundingClientRect();
    return { dx: r.left + r.width / 2 - (s.left + s.width / 2), dy: r.top + r.height / 2 - (s.top + s.height / 2) };
  });
}
let slideIdx = 0;
function showSlide(i) {
  if (i === slideIdx) return;
  slideIdx = i;
  slides.forEach((s, k) => s.classList.toggle('is-on', k === i));
  slideCap.textContent = caps[i];
}
function cloud() {
  const { p, r } = pinP(cloudEl);
  if (r.top > vh || r.bottom < 0) return;
  const t = inOut(seg(p, 0.04, 0.5));
  cloudPics.forEach((el, i) => {
    const o = cloudOffsets[i] || { dx: 0, dy: 0 };
    set(el, 'transform', `translate3d(${px(-o.dx * t)}, ${px(-o.dy * t)}, 0) scale(${mix(1, 0.4, t).toFixed(3)})`);
    set(el, 'opacity', (1 - seg(p, 0.3, 0.5)).toFixed(3));
  });
  set(cloudTitle, 'opacity', (1 - seg(p, 0.06, 0.26)).toFixed(3));
  set(cloudTitle, 'transform', `translateY(${px(-60 * seg(p, 0.06, 0.3))})`);
  const w0 = isPhone() ? vw * 0.62 : vw * 0.26;
  const h0 = w0 * 0.66;
  const m = mPx();
  const top = mix((vh - h0) / 2, hh() + vh * 0.02, t);
  const side = mix((vw - w0) / 2, m, t);
  const bot = mix((vh - h0) / 2, vh * 0.04, t);
  set(cloudMain, 'clipPath', `inset(${px(top)} ${px(side)} ${px(bot)} ${px(side)} round 18px)`);
  const ui = seg(p, 0.5, 0.58);
  set(slideUi, 'opacity', ui.toFixed(3));
  set(slideUi, 'bottom', px(bot + 20));
  set(slideCap, 'opacity', ui.toFixed(3));
  set(slideCap, 'top', px(top + 18));
  set(slideCap, 'left', px(side + 20));
  showSlide(Math.min(3, Math.floor(seg(p, 0.56, 0.98) * 4)));
}
function slideJump(dir) {
  const target = (slideIdx + dir + 4) % 4;
  if (RM) { showSlide(target); return; }
  const r = cloudEl.getBoundingClientRect();
  const span = r.height - vh;
  const p = 0.56 + ((target + 0.5) / 4) * 0.42;
  scrollToY(scrollY + r.top + span * p, { duration: 1 });
}
$('[data-slide-prev]').addEventListener('click', () => slideJump(-1));
$('[data-slide-next]').addEventListener('click', () => slideJump(1));

/* ---------- Declaración: palabra por palabra ---------- */
const wordsEl = $('[data-words]');
(function splitWords() {
  const pic = wordsEl.querySelector('.inline-pic');
  const text = wordsEl.textContent.trim().replace(/\s+/g, ' ');
  wordsEl.textContent = '';
  if (pic) wordsEl.append(pic);
  text.split(' ').forEach((w, i) => {
    const s = document.createElement('span');
    s.className = 'w';
    s.textContent = w;
    wordsEl.append(s, document.createTextNode(i < text.split(' ').length - 1 ? ' ' : ''));
  });
})();
const words = $$('.w', wordsEl);
function manifest() {
  if (RM) return;
  const r = wordsEl.getBoundingClientRect();
  if (r.top > vh || r.bottom < 0) return;
  const q = clamp01((vh * 0.88 - r.top) / (r.height + vh * 0.35));
  const n = words.length;
  words.forEach((w, i) => set(w, 'opacity', (0.16 + 0.84 * clamp01(q * n * 1.15 - i)).toFixed(3)));
}

/* ---------- Dos filas de texto que abrazan la foto que crece ---------- */
const growEl = $('[data-scene="grow"]');
const marqA = $('[data-marq-a]');
const marqB = $('[data-marq-b]');
const spanA = $('span', marqA);
const spanB = $('span', marqB);
const growPic = $('[data-grow-pic]');
const growImg = $('img', growPic);
const growCap = $('[data-grow-cap]');
function grow() {
  const { p, r } = pinP(growEl);
  if (r.top > vh || r.bottom < 0) return;
  const t = inOut(seg(p, 0.18, 0.78));
  const w0 = isPhone() ? vw * 0.72 : vw * 0.34;
  const h0 = w0 * 0.62;
  const tb = mix((vh - h0) / 2, 0, t);
  const lr = mix((vw - w0) / 2, 0, t);
  set(growPic, 'clipPath', `inset(${px(tb)} ${px(lr)} ${px(tb)} ${px(lr)} round ${px(mix(14, 0, t))})`);
  set(growImg, 'transform', `scale(${mix(1.3, 1, t).toFixed(4)})`);
  const gap = isPhone() ? 14 : 26;
  set(marqA, 'transform', `translateY(${px(tb - marqA.offsetHeight - gap)})`);
  set(marqB, 'transform', `translateY(${px(vh - tb + gap)})`);
  set(spanA, 'transform', `translateX(${(-6 - p * 28).toFixed(2)}%)`);
  set(spanB, 'transform', `translateX(${(-36 + p * 28).toFixed(2)}%)`);
  set(growCap, 'opacity', seg(p, 0.8, 0.92).toFixed(3));
}

/* ---------- Estructura: maqueta 3D por capas ---------- */
const scene3d = $('[data-scene3d]');
// grupo, material, x, y, z, ancho, fondo, alto, nivel de explosión
const B = [
  ['ground', 'grid', -16, -14, -0.6, 92, 68, 0.6, 0],
  ['ground', 'lawn', -14, 32, 0, 42, 18, 0.15, 0],
  ['ground', 'wood', 28, 31.5, 0, 30, 12, 0.35, 0],
  ['ground', 'water', 31, 34, 0.36, 22, 6.5, 0.12, 0],
  ['slabs', 'slab', 0, 0, 0, 46, 30, 1, 0],
  // planta baja: muros de hormigón
  ['walls', 'concrete', 0, 0, 1, 46, 0.8, 9.8, 1],
  ['walls', 'concrete', 0, 0.8, 1, 0.8, 29.2, 9.8, 1],
  ['walls', 'concrete', 0, 29.2, 1, 9, 0.8, 9.8, 1],
  ['walls', 'concrete', 24, 0.8, 1, 0.8, 13, 9.8, 1],
  ['walls', 'concrete', 45.2, 0.8, 1, 0.8, 8, 9.8, 1],
  ['walls', 'concrete', 8, 10, 1, 9, 2.6, 3.4, 1],
  // planta baja: vidrios y montantes
  ['windows', 'glass', 9, 29.5, 1, 36, 0.25, 9.8, 1],
  ['windows', 'glass', 45.5, 8.8, 1, 0.25, 20.6, 9.8, 1],
  // acero: pilares bajo el voladizo
  ['steel', 'steel', 54.4, 1.2, 1, 0.8, 0.8, 9.8, 1],
  ['steel', 'steel', 54.4, 28.4, 1, 0.8, 0.8, 9.8, 1],
  ['steel', 'steel', 50, 28.4, 1, 0.8, 0.8, 9.8, 1],
  // losa del segundo piso, en voladizo
  ['slabs', 'slab', 6, -1, 10.8, 50, 32, 1, 2],
  // segundo piso
  ['walls', 'concrete', 6, 0, 11.8, 50, 0.8, 8.6, 3],
  ['walls', 'concrete', 6, 0.8, 11.8, 0.8, 28.4, 8.6, 3],
  ['walls', 'concrete', 55.2, 0.8, 11.8, 0.8, 28.4, 8.6, 3],
  ['walls', 'concrete', 6, 29.2, 11.8, 50, 0.8, 2.6, 3],
  ['walls', 'concrete', 6, 29.2, 18.4, 50, 0.8, 2, 3],
  ['windows', 'glass', 6.8, 29.45, 14.4, 48.4, 0.25, 4, 3],
  ['windows', 'glass', 55.45, 6, 13.4, 0.25, 18, 5.6, 3],
  // techo
  ['roof', 'slab', 5, -1.5, 20.4, 52, 33, 0.9, 4],
  ['roof', 'concrete', 5, -1.5, 21.3, 52, 0.5, 1.1, 4],
  ['roof', 'concrete', 5, 31, 21.3, 52, 0.5, 1.1, 4],
  ['roof', 'concrete', 5, -1, 21.3, 0.5, 32, 1.1, 4],
  ['roof', 'concrete', 56.5, -1, 21.3, 0.5, 32, 1.1, 4],
  ['roof', 'glass', 12, 8, 21.3, 9, 6, 0.6, 4],
  ['roof', 'solar', 30, 5, 21.3, 18, 11, 0.45, 4],
];
// montantes de los ventanales
for (let x = 13; x < 45; x += 4) B.push(['windows', 'dark', x, 29.4, 1, 0.35, 0.45, 9.8, 1]);
for (let x = 12.8; x < 55; x += 6) B.push(['windows', 'dark', x, 29.4, 14.4, 0.3, 0.45, 4, 3]);
// celosía de aluminio delante del segundo piso
for (let x = 39; x < 55.5; x += 1.15) B.push(['steel', 'steel', x, 30.35, 11.8, 0.22, 0.9, 8.6, 3]);
// escalera de hormigón en voladizo y descanso
for (let i = 0; i < 9; i++) B.push(['stairs', 'concrete', 25, 1.6 + i * 1.35, 1, 5.5, 1.35, (i + 1) * 1.08, 1.5]);
B.push(['stairs', 'concrete', 25, 13.75, 1, 5.5, 3, 9.8, 1.5]);

const TREES = [[-8, 38, 13], [62, -6, 11], [-9, 6, 9], [64, 40, 8]];
const GUIDES = [[0, 0], [46, 0], [0, 30], [56, 31], [6, -1], [56, -1]];
const CX = 30;
const CY = 20;
const U = (v) => `calc(${v} * var(--u))`;
function buildModel() {
  const sh = document.createElement('div');
  sh.className = 'shadow3d';
  Object.assign(sh.style, { left: U(1 - CX), top: U(2 - CY), width: U(52), height: U(31), transform: `translateZ(${U(0.03)})` });
  scene3d.append(sh);
  B.forEach(([g, mat, x, y, z, w, d, h, lvl]) => {
    const box = document.createElement('div');
    box.className = `box g-${g} m-${mat}`;
    Object.assign(box.style, { left: U(x - CX), top: U(y - CY), width: U(w), height: U(d) });
    box.style.transform = `translateZ(calc((${z} + ${lvl} * var(--ex) * 4.2) * var(--u)))`;
    const face = (cls, fw, fh, tf) => {
      const f = document.createElement('i');
      f.className = `f ${cls}`;
      f.style.width = U(fw);
      f.style.height = U(fh);
      f.style.transform = tf;
      box.append(f);
    };
    face('f-top', w, d, `translateZ(${U(h)})`);
    face('f-n', w, h, 'rotateX(90deg)');
    face('f-s', w, h, `translateY(${U(d)}) rotateX(90deg)`);
    face('f-w', h, d, 'rotateY(-90deg)');
    face('f-e', h, d, `translateX(${U(w)}) rotateY(-90deg)`);
    scene3d.append(box);
  });
  TREES.forEach(([x, y, size]) => {
    const trunk = document.createElement('div');
    trunk.className = 'box g-ground m-dark';
    Object.assign(trunk.style, { left: U(x - 0.4 - CX), top: U(y - 0.4 - CY), width: U(0.8), height: U(0.8), transform: 'translateZ(0px)' });
    ['f-n', 'f-w'].forEach((c) => {
      const f = document.createElement('i');
      f.className = `f ${c}`;
      f.style.width = U(c === 'f-n' ? 0.8 : 9);
      f.style.height = U(c === 'f-n' ? 9 : 0.8);
      f.style.transform = c === 'f-n' ? `translateY(${U(0.4)}) rotateX(90deg)` : `translateX(${U(0.4)}) rotateY(-90deg)`;
      trunk.append(f);
    });
    scene3d.append(trunk);
    [[size, 7.5, 'disc-a'], [size * 0.72, 10.5, 'disc-b'], [size * 0.4, 12.8, 'disc-b']].forEach(([sz, z, cls]) => {
      const d = document.createElement('div');
      d.className = `disc ${cls} g-ground`;
      Object.assign(d.style, { left: U(x - sz / 2 - CX), top: U(y - sz / 2 - CY), width: U(sz), height: U(sz), transform: `translateZ(${U(z)})` });
      scene3d.append(d);
    });
  });
  GUIDES.forEach(([x, y]) => {
    const g = document.createElement('div');
    g.className = 'guide';
    Object.assign(g.style, { left: U(x - CX), top: U(y - CY), height: U(40), transform: 'rotateX(90deg)' });
    scene3d.append(g);
  });
}
buildModel();
const guides = $$('.guide', scene3d);
const boxes = $$('.box', scene3d);
const SPECS = [
  [['Sistema', 'Hormigón, acero y vidrio'], ['Superficie', '286 m² en dos pisos'], ['Terreno', '720 m²']],
  [['Material', 'Hormigón armado visto'], ['Espesor', '20 cm'], ['Terminación', 'Moldaje de tabla de pino']],
  [['Material', 'Losa postensada'], ['Espesor', '15 cm'], ['Voladizo', '6 m sobre la terraza']],
  [['Sistema', 'Cubierta invertida'], ['Aislación', '10 cm de poliestireno'], ['Energía', 'Paneles solares de 4,2 kWp']],
  [['Pilares', 'Perfil HEB 150'], ['Celosía', 'Aluminio anodizado negro'], ['Protección', 'Pintura intumescente']],
  [['Peldaños', '9 de hormigón en voladizo'], ['Contrahuella', '18 cm'], ['Baranda', 'Vidrio templado de 10 mm']],
  [['Vidrio', 'Termopanel 6/12/6 low-e'], ['Marco', 'Aluminio negro con RPT'], ['Puertas', 'Correderas de 3 m']],
];
const structEl = $('[data-scene="struct"]');
const stepsData = $$('[data-steps] li').map((li) => ({ focus: li.dataset.focus, name: $('.st-name', li).textContent, sub: $('.st-sub', li).textContent }));
const stName = $('[data-st-name]');
const stSub = $('[data-st-sub]');
const stNum = $('[data-st-num]');
const stBar = $('[data-st-bar]');
const stLegend = $$('[data-st-legend] li');
const stSpec = $('[data-st-spec]');
const stLabel = $('.st-label');
let stIdx = -1;
function struct() {
  if (RM) { scene3d.dataset.focus = 'all'; return; }
  const { p, r } = pinP(structEl);
  if (r.top > vh || r.bottom < 0) return;
  const k = Math.min(6, Math.floor(p * 7));
  if (k !== stIdx) {
    stIdx = k;
    const s = stepsData[k];
    scene3d.dataset.focus = s.focus;
    scene3d.classList.toggle('ghost', s.focus !== 'all');
    boxes.forEach((bx) => bx.classList.toggle('on', bx.classList.contains('g-' + s.focus)));
    stName.textContent = s.name;
    stSub.textContent = s.sub;
    stNum.textContent = String(k + 1).padStart(2, '0');
    stLegend.forEach((d, i) => d.classList.toggle('is-on', i === k));
    stSpec.innerHTML = SPECS[k].map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('');
    [stLabel, stNum, stSpec].forEach((el) => { el.classList.remove('st-swap'); void el.offsetWidth; el.classList.add('st-swap'); });
  }
  const ex = inOut(seg(p, 0.1, 0.2)) * (1 - inOut(seg(p, 0.93, 1)));
  scene3d.style.setProperty('--ex', ex.toFixed(4));
  guides.forEach((g) => set(g, 'opacity', (ex * 0.85).toFixed(3)));
  const rz = mix(-42, -16, p);
  const rx = mix(54, 62, inOut(seg(p, 0, 0.5)));
  const sc = isPhone() ? 1.45 : 1;
  set(scene3d, 'transform', `rotateX(${rx.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg) scale(${sc})`);
  set(stBar, 'transform', `scaleX(${p.toFixed(4)})`);
}

/* ---------- Tarjetas apiladas ---------- */
const cards = $$('[data-card]');
function cardsFx() {
  if (RM || isPhone()) return;
  cards.forEach((c, i) => {
    const next = cards[i + 1];
    if (!next) return;
    const q = clamp01((vh - next.getBoundingClientRect().top) / vh);
    set(c, 'transform', `scale(${(1 - 0.06 * q).toFixed(4)})`);
    set(c, 'filter', q > 0.01 ? `brightness(${(1 - 0.35 * q).toFixed(3)})` : 'none');
  });
}

/* ---------- Foto pequeña que se abre ---------- */
const smallEl = $('[data-scene="small"]');
const smallTitle = $('[data-small-title]');
const smallPic = $('[data-small-pic]');
const smallImg = $('img', smallPic);
const smallOver = $('[data-small-over]');
function small() {
  const { p, r } = pinP(smallEl);
  if (r.top > vh || r.bottom < 0) return;
  const t = inOut(seg(p, 0.16, 0.7));
  const w0 = isPhone() ? vw * 0.6 : vw * 0.22;
  const h0 = w0 * 0.68;
  const top0 = vh * (isPhone() ? 0.56 : 0.6);
  const top = mix(top0, 0, t);
  const bot = mix(vh - top0 - h0, 0, t);
  const lr = mix((vw - w0) / 2, 0, t);
  set(smallPic, 'clipPath', `inset(${px(top)} ${px(lr)} ${px(Math.max(0, bot))} ${px(lr)} round ${px(mix(12, 0, t))})`);
  set(smallImg, 'transform', `scale(${mix(1.3, 1, t).toFixed(4)})`);
  set(smallTitle, 'opacity', (1 - seg(p, 0.3, 0.5)).toFixed(3));
  set(smallTitle, 'transform', `translateY(${px(-50 * seg(p, 0.2, 0.5))})`);
  const o = seg(p, 0.72, 0.86);
  set(smallOver, 'opacity', o.toFixed(3));
  set(smallOver, 'transform', `translateY(${px((1 - o) * 30)})`);
}

/* ---------- Recorrido del piloto ---------- */
const tourEl = $('[data-scene="tour"]');
const tourImgs = $$('.tour-img', tourEl);
const tourTexts = $$('.tour-text', tourEl);
const tourThumbs = $$('[data-tour-thumb]', tourEl);
const tourCount = $('[data-tour-count]');
tourImgs[0].classList.add('is-base');
let tourIdx = 0;
function tour() {
  if (RM) return;
  const { p, r } = pinP(tourEl);
  if (r.top > vh || r.bottom < 0) return;
  for (let i = 1; i < tourImgs.length; i++) {
    const t = inOut(seg(p, i / 4 - 0.09, i / 4 + 0.03));
    set(tourImgs[i], 'clipPath', `inset(${((1 - t) * 100).toFixed(2)}% 0% 0% 0%)`);
    set(tourImgs[i], 'transform', `scale(${mix(1.12, 1, t).toFixed(4)})`);
  }
  const k = Math.min(3, Math.floor(p * 4 + 0.04));
  if (k !== tourIdx) {
    tourIdx = k;
    tourTexts.forEach((t, i) => t.classList.toggle('is-on', i === k));
    tourCount.textContent = `${String(k + 1).padStart(2, '0')} / 04`;
  }
  tourThumbs.forEach((th, i) => set(th, 'transform', `translate3d(0, ${px((0.5 - p) * vh * (0.35 + i * 0.22))}, 0)`));
}

/* ---------- Pasa adelante ---------- */
const insideEl = $('[data-inside]');
const insideImg = $('[data-inside-img]');
function inside() {
  if (RM) return;
  const r = insideEl.getBoundingClientRect();
  if (r.top > vh || r.bottom < 0) return;
  const q = clamp01((vh - r.top) / (vh + r.height));
  set(insideImg, 'transform', `scale(${(1.14 - 0.14 * q).toFixed(4)})`);
}

/* ---------- Cabecera según el fondo ---------- */
const hdr = $('[data-hdr]');
const toneEls = $$('[data-tone]');
function header() {
  let tone = 'light';
  for (const el of toneEls) {
    const r = el.getBoundingClientRect();
    if (r.top <= 38 && r.bottom > 38) { tone = el.dataset.tone; break; }
  }
  if (smallEl.getBoundingClientRect().top <= 38 && smallEl.getBoundingClientRect().bottom > 38) tone = pinP(smallEl).p > 0.62 ? 'dark' : 'light';
  hdr.classList.toggle('on-dark', tone === 'dark');
}

/* ---------- Bucle ---------- */
function frame(t) {
  if (lenis) lenis.raf(t);
  if (!RM) { hero(); cloud(); manifest(); grow(); struct(); cardsFx(); small(); tour(); inside(); }
  header();
  requestAnimationFrame(frame);
}
function onResize() {
  vw = innerWidth;
  vh = innerHeight;
  if (!RM) measureCloud();
}
addEventListener('resize', onResize);

/* ---------- Carga ---------- */
const loaderCount = $('[data-loader-count]');
if (!RM) {
  let shown = false;
  const reveal = () => {
    if (shown) return;
    shown = true;
    root.classList.remove('loading');
    lenis && lenis.start();
  };
  lenis && lenis.stop();
  let ready = false;
  Promise.all([shots[0].img.decode().catch(() => {}), document.fonts ? document.fonts.ready : null]).then(() => { ready = true; });
  const t0 = performance.now();
  (function count() {
    if (shown) return;
    const k = Math.min(1, (performance.now() - t0) / 1300);
    const v = ready ? k : Math.min(k, 0.9);
    if (loaderCount) loaderCount.textContent = Math.round(v * 100);
    if (v >= 1) { setTimeout(reveal, 160); return; }
    requestAnimationFrame(count);
  })();
  setTimeout(reveal, 6000);
  measureCloud();
} else {
  root.classList.remove('loading');
  scene3d.dataset.focus = 'all';
}
requestAnimationFrame(frame);
document.fonts && document.fonts.ready.then(() => !RM && measureCloud());

/* ---------- Anclas ---------- */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  const el = id === '#inicio' ? document.body : $(id);
  if (!el) return;
  e.preventDefault();
  if (menu.open) menu.close();
  scrollToY(id === '#inicio' ? 0 : scrollY + el.getBoundingClientRect().top);
});

/* ---------- Menú ---------- */
const menu = $('[data-menu]');
const menuBtn = $('[data-menu-open]');
menuBtn.addEventListener('click', () => { menu.showModal(); menuBtn.setAttribute('aria-expanded', 'true'); lenis && lenis.stop(); });
$('[data-menu-close]').addEventListener('click', () => menu.close());
menu.addEventListener('close', () => { menuBtn.setAttribute('aria-expanded', 'false'); lenis && lenis.start(); });

/* ---------- Agenda una visita ---------- */
const modal = $('[data-modal]');
const form = $('[data-form]');
const body = $('[data-modal-body]');
const done = $('[data-modal-done]');
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-visita]');
  if (!b) return;
  if (menu.open) menu.close();
  form.reset();
  $$('[aria-invalid]', form).forEach((i) => i.removeAttribute('aria-invalid'));
  body.hidden = false;
  done.hidden = true;
  if (b.dataset.visita) $('[data-interes]').value = b.dataset.visita;
  modal.showModal();
  lenis && lenis.stop();
});
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const bad = $$('input[required]', form).filter((i) => !i.value.trim());
  $$('input[required]', form).forEach((i) => i.setAttribute('aria-invalid', bad.includes(i) ? 'true' : 'false'));
  if (bad.length) { bad[0].focus(); return; }
  body.hidden = true;
  done.hidden = false;
  $('.modal-t', done).focus();
});
$$('[data-modal-close]').forEach((b) => b.addEventListener('click', () => modal.close()));
modal.addEventListener('close', () => lenis && lenis.start());
modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });
