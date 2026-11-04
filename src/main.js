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

/* ---------- Héroe: cuadros del video ---------- */
const N = 80;
const canvas = $('[data-hero-canvas]');
const ctx = canvas.getContext('2d');
let set_ = '';
let frames = [];
let lastDrawn = -1;
let wantFrame = 0;
function loadFrames(onProgress) {
  const which = vw / vh < 0.9 ? 'm' : 'd';
  if (which === set_) return Promise.resolve();
  set_ = which;
  frames = new Array(N);
  let done = 0;
  const order = [];
  for (let i = 0; i < N; i += 4) order.push(i);
  for (let i = 0; i < N; i++) if (i % 4) order.push(i);
  return new Promise((resolve) => {
    order.forEach((i) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = img.onerror = () => {
        frames[i] = img.naturalWidth ? img : null;
        done++;
        onProgress && onProgress(done / N);
        if (done === N) resolve();
        if (i === wantFrame) lastDrawn = -1;
      };
      img.src = `frames/${which}/${String(i).padStart(3, '0')}.webp`;
    });
  });
}
function sizeCanvas() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(vw * dpr);
  canvas.height = Math.round(vh * dpr);
  lastDrawn = -1;
}
function drawFrame(i) {
  let img = frames[i];
  if (!img) { for (let d = 1; d < N && !img; d++) img = frames[i - d] || frames[i + d]; }
  if (!img) return;
  const cw = canvas.width;
  const ch = canvas.height;
  const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
  const w = img.naturalWidth * s;
  const h = img.naturalHeight * s;
  ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
}
const heroEl = $('[data-scene="hero"]');
const heroLines = $$('[data-hero-line]');
function hero() {
  const { p, r } = pinP(heroEl);
  if (r.bottom < -50) return;
  wantFrame = Math.round(p * (N - 1));
  if (wantFrame !== lastDrawn) { drawFrame(wantFrame); lastDrawn = wantFrame; }
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

/* ---------- Marquesina y foto que crece ---------- */
const growEl = $('[data-scene="grow"]');
const marq = $('[data-marq] span');
const growPic = $('[data-grow-pic]');
const growImg = $('img', growPic);
const growCap = $('[data-grow-cap]');
function grow() {
  const { p, r } = pinP(growEl);
  if (r.top > vh || r.bottom < 0) return;
  set(marq, 'transform', `translateX(${(-8 - p * 38).toFixed(2)}%)`);
  const t = inOut(seg(p, 0.1, 0.72));
  const w0 = isPhone() ? vw * 0.56 : vw * 0.24;
  const h0 = w0 * 0.68;
  const tb = mix((vh - h0) / 2, 0, t);
  const lr = mix((vw - w0) / 2, 0, t);
  set(growPic, 'clipPath', `inset(${px(tb)} ${px(lr)} ${px(tb)} ${px(lr)} round ${px(mix(14, 0, t))})`);
  set(growImg, 'transform', `scale(${mix(1.35, 1, t).toFixed(4)})`);
  set(growCap, 'opacity', seg(p, 0.76, 0.9).toFixed(3));
}

/* ---------- Estructura: maqueta 3D por capas ---------- */
const scene3d = $('[data-scene3d]');
const B = [
  // grupo, x, y, z, ancho, fondo, alto, nivel de explosión
  ['ground', -8, -8, -1.2, 72, 54, 1.2, 0],
  ['slabs', 0, 0, 0, 56, 38, 1.2, 0],
  ['walls', 0, 0, 1.2, 30, 1, 9.5, 1],
  ['walls', 0, 1, 1.2, 1, 37, 9.5, 1],
  ['walls', 0, 37, 1.2, 12, 1, 9.5, 1],
  ['walls', 22, 37, 1.2, 8, 1, 9.5, 1],
  ['walls', 29, 1, 1.2, 1, 22, 9.5, 1],
  ['windows', 12, 37.3, 1.2, 10, 0.4, 9.5, 1],
  ['windows', 30, 1.5, 1.2, 24, 0.4, 9.5, 1],
  ['windows', 30, 29, 1.2, 24, 0.4, 9.5, 1],
  ['pillars', 41, 35.4, 1.2, 1.3, 1.3, 9.5, 1],
  ['pillars', 54, 35.4, 1.2, 1.3, 1.3, 9.5, 1],
  ['pillars', 54, 14, 1.2, 1.3, 1.3, 9.5, 1],
  ['pillars', 54, 0.6, 1.2, 1.3, 1.3, 9.5, 1],
  ['slabs', 0, 0, 10.7, 56, 38, 1.2, 2],
  ['walls', 2, 4, 11.9, 36, 1, 8.5, 3],
  ['walls', 2, 5, 11.9, 1, 29, 8.5, 3],
  ['walls', 37, 5, 11.9, 1, 29, 8.5, 3],
  ['walls', 2, 33, 11.9, 12, 1, 8.5, 3],
  ['walls', 30, 33, 11.9, 8, 1, 8.5, 3],
  ['windows', 14, 33.3, 11.9, 16, 0.4, 8.5, 3],
  ['roof', -1, 2, 20.4, 42, 34, 1.2, 4],
];
for (let i = 0; i < 8; i++) B.push(['stairs', 24, 5 + i * 2.2, 1.2 + i * 1.19, 4.5, 2.2, 1.0, 1.5]);
function buildModel() {
  const cx = 28;
  const cy = 19;
  const u = (v) => `calc(${v} * var(--u))`;
  B.forEach(([g, x, y, z, w, d, h, lvl]) => {
    const box = document.createElement('div');
    box.className = `box g-${g}`;
    box.style.left = u(x - cx);
    box.style.top = u(y - cy);
    box.style.width = u(w);
    box.style.height = u(d);
    box.style.transform = `translateZ(calc((${z} + ${lvl} * var(--ex) * 4.2) * var(--u)))`;
    const face = (cls, fw, fh, tf) => {
      const f = document.createElement('i');
      f.className = `f ${cls}`;
      f.style.width = u(fw);
      f.style.height = u(fh);
      f.style.transform = tf;
      box.append(f);
    };
    face('f-top', w, d, `translateZ(${u(h)})`);
    face('f-n', w, h, 'rotateX(90deg)');
    face('f-s', w, h, `translateY(${u(d)}) rotateX(90deg)`);
    face('f-w', h, d, 'rotateY(-90deg)');
    face('f-e', h, d, `translateX(${u(w)}) rotateY(-90deg)`);
    scene3d.append(box);
  });
}
buildModel();
const structEl = $('[data-scene="struct"]');
const stepsData = $$('[data-steps] li').map((li) => ({ focus: li.dataset.focus, name: $('.st-name', li).textContent, sub: $('.st-sub', li).textContent }));
const stName = $('[data-st-name]');
const stSub = $('[data-st-sub]');
const stNum = $('[data-st-num]');
const stBar = $('[data-st-bar]');
const stDots = $$('[data-st-dots] li');
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
    stName.textContent = s.name;
    stSub.textContent = s.sub;
    stNum.textContent = String(k + 1).padStart(2, '0');
    stDots.forEach((d, i) => d.classList.toggle('is-on', i === k));
    [stLabel, stNum].forEach((el) => { el.classList.remove('st-swap'); void el.offsetWidth; el.classList.add('st-swap'); });
  }
  const ex = inOut(seg(p, 0.1, 0.2)) * (1 - inOut(seg(p, 0.93, 1)));
  scene3d.style.setProperty('--ex', ex.toFixed(4));
  const rz = mix(-40, -18, p);
  const rx = mix(56, 62, inOut(seg(p, 0, 0.5)));
  const sc = isPhone() ? 1.5 : 1;
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
  if (cloudEl.getBoundingClientRect().top <= 38 && cloudEl.getBoundingClientRect().bottom > 38) {
    const p = pinP(cloudEl).p;
    tone = p > 0.42 && p < 0.99 ? 'dark' : 'light';
  }
  if (growEl.getBoundingClientRect().top <= 38 && growEl.getBoundingClientRect().bottom > 38) tone = pinP(growEl).p > 0.62 ? 'dark' : 'light';
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
  if (!RM) {
    sizeCanvas();
    loadFrames();
    measureCloud();
  }
}
addEventListener('resize', onResize);

/* ---------- Carga ---------- */
const loaderCount = $('[data-loader-count]');
if (!RM) {
  sizeCanvas();
  let shown = false;
  const reveal = () => {
    if (shown) return;
    shown = true;
    lastDrawn = -1;
    root.classList.remove('loading');
    lenis && lenis.start();
  };
  lenis && lenis.stop();
  loadFrames((f) => {
    if (loaderCount) loaderCount.textContent = Math.round(Math.min(1, f / 0.5) * 100);
    if (f >= 0.5) setTimeout(reveal, 250);
  });
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
