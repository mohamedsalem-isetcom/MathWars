(() => {
const $ = s => document.querySelector(s);
const cv = $('#board'), ctx = cv.getContext('2d'), wrap = $('#boardWrap');
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const EXAMPLES = ['2x + 5', 'x^2 - 4x + 3', 'sin(x) * 20', '10 * cos(x/5)', 'exp(-((x-20)/5)^2) * 30', 'abs(x) - 8', 'sqrt(x + 30) * 3', 'log(x + 31) * 4'];
const TURN_SECONDS = 30, SHOTS = 5;

let W = 0, H = 0;
const S = { mode: 'classic', targets: [], shots: SHOTS, score: 0, shown: { v: 0 }, hits: 0, misses: 0, best: 0,
  fn: null, preview: null, shot: null, parts: [], busy: false, over: false, left: TURN_SECONDS, tick: null, t0: 0 };

/* ---------- coordinates ---------- */
const sx = x => (x - MW.X[0]) / (MW.X[1] - MW.X[0]) * W;
const sy = y => H - (y - MW.Y[0]) / (MW.Y[1] - MW.Y[0]) * H;
const unit = () => W / (MW.X[1] - MW.X[0]);
function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2), r = cv.getBoundingClientRect();
  W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener('resize', resize);

/* ---------- screens ---------- */
function show(id) {
  const cur = document.querySelector('.screen.active'), next = $('#' + id);
  if (cur === next) return;
  const enter = () => {
    cur && cur.classList.remove('active');
    next.classList.add('active');
    resize();
    gsap.fromTo(next, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: calm ? 0 : .45, ease: 'power3.out' });
  };
  cur ? gsap.to(cur, { opacity: 0, y: -16, duration: calm ? 0 : .22, ease: 'power2.in', onComplete: enter }) : enter();
}

/* ---------- game flow ---------- */
function start(mode) {
  clearInterval(S.tick);
  Object.assign(S, { mode, shots: SHOTS, score: 0, hits: 0, misses: 0, best: 0, shot: null, parts: [], busy: false, over: false,
    preview: null, fn: null, t0: Date.now(), left: TURN_SECONDS });
  S.shown.v = 0;
  newField();
  const classic = mode === 'classic';
  $('#hudScoreLabel').textContent = classic ? 'Score' : 'Hits';
  $('#hudShotsLabel').textContent = classic ? 'Shots left' : 'Shots';
  $('#hudShots').textContent = classic ? SHOTS : '\u221E';
  $('#hudScore').textContent = 0;
  $('#fire').classList.toggle('hidden', !classic);
  $('#eq').value = ''; $('#err').textContent = '';
  show('game');
  setTimeout(() => { resize(); $('#eq').focus(); if (classic) startTimer(); }, 480);
}
function newField() {
  S.targets = MW.makeTargets((Math.random() * 1e9) | 0).map(t => Object.assign(t, { s: 0 }));
  S.targets.forEach((t, i) => gsap.to(t, { s: 1, duration: calm ? 0 : .5, delay: calm ? 0 : i * .06, ease: 'back.out(2)' }));
}
function startTimer() {
  clearInterval(S.tick); S.left = TURN_SECONDS; paintTimer();
  S.tick = setInterval(() => { S.left--; paintTimer(); if (S.left <= 0) { clearInterval(S.tick); fire(true); } }, 1000);
}
function paintTimer() {
  $('#fireNum').textContent = Math.max(S.left, 0);
  $('#fire').classList.toggle('low', S.left <= 5);
  if (S.left <= 5 && S.left > 0) FX.sfx('tick');
  if (S.left <= 5 && !calm) gsap.fromTo('#fire', { scale: 1.12 }, { scale: 1, duration: .3 });
}

function onInput() {
  const v = $('#eq').value;
  if (!v.trim()) { S.preview = null; S.fn = null; $('#err').textContent = ''; return; }
  try { S.fn = MW.compile(v); S.preview = MW.trace(S.fn); $('#err').textContent = ''; }
  catch (e) { S.fn = null; S.preview = null; $('#err').textContent = e.message; }
}

function fire(auto) {
  if (S.busy || S.over) return;
  onInput();
  if (!S.fn) {
    if (!auto) { $('#err').textContent = $('#err').textContent || 'Type an equation first'; FX.sfx('error'); gsap.fromTo('.editor', { x: -8 }, { x: 0, duration: .4, ease: 'elastic.out(1,.3)' }); return; }
    // timer ran out with no valid equation: the shot is lost
    S.misses++; S.shots--; afterShot(); return;
  }
  S.busy = true; clearInterval(S.tick); $('#fireBtn').disabled = true; FX.sfx('fire');
  const res = MW.fire(S.fn, S.targets);
  S.shot = { path: res.path, i: 0, hit: res.hit, last: performance.now() };
  if (S.mode === 'classic') { S.shots--; $('#hudShots').textContent = S.shots; }
}

function resolveShot() {
  const { hit, path } = S.shot;
  if (hit) {
    hit.alive = false;
    const gain = S.mode === 'classic' ? hit.pts : 1;
    S.score += gain; S.hits++; S.best = Math.max(S.best, hit.pts);
    FX.sfx(hit.kind === 'star' ? 'star' : 'hit');
    FX.toast(hit.kind === 'star' ? 'Star! +' + hit.pts : (S.mode === 'classic' ? '+' + hit.pts : 'Hit'), 'good');
    gsap.to(S.shown, { v: S.score, duration: calm ? 0 : .6, ease: 'power2.out', onUpdate: () => $('#hudScore').textContent = Math.round(S.shown.v) });
    gsap.to(hit, { s: 0, duration: calm ? 0 : .25, ease: 'power2.in' });
    burst(sx(hit.x), sy(hit.y), hit.kind === 'blue' ? '#5aa2ff' : '#ffd23f', hit.kind === 'star' ? 46 : 28);
    if (!calm) gsap.fromTo(wrap, { x: 0 }, { x: () => (Math.random() - .5) * (hit.kind === 'star' ? 18 : 9), y: () => (Math.random() - .5) * 8, duration: .35, ease: 'rough({strength:3,points:10})', onComplete: () => gsap.set(wrap, { x: 0, y: 0 }) });
  } else if (path.length) { S.misses++; FX.sfx('miss'); FX.toast('Miss', 'bad'); }
  setTimeout(afterShot, 700);
}
function afterShot() {
  S.shot = null; S.busy = false; $('#fireBtn').disabled = false;
  const classic = S.mode === 'classic';
  if (classic) $('#hudShots').textContent = Math.max(S.shots, 0);
  const alive = S.targets.some(t => t.alive);
  if (classic && (S.shots <= 0 || !alive)) return end();
  if (!alive) newField();
  if (classic) startTimer();
  $('#eq').focus();
}

function end() {
  S.over = true; clearInterval(S.tick);
  const total = S.hits + S.misses, secs = Math.round((Date.now() - S.t0) / 1000);
  $('#resHits').textContent = S.hits; $('#resMiss').textContent = S.misses;
  $('#resAcc').textContent = (total ? Math.round(S.hits / total * 100) : 0) + '%';
  $('#resBest').textContent = S.best; $('#resTime').textContent = secs + 's';
  $('#resTitle').textContent = S.targets.some(t => t.alive) ? 'Round over' : 'Board cleared';
  $('#resScore').textContent = 0;
  show('results');
  const c = { v: 0 };
  gsap.to(c, { v: S.score, duration: calm ? 0 : 1.2, delay: .4, ease: 'power2.out', onUpdate: () => $('#resScore').textContent = Math.round(c.v) });
  if (S.score > 0) FX.sfx('win');
  if (S.score > 0 && !calm) confetti();
}
function leave() { clearInterval(S.tick); S.over = true; show('menu'); }

/* ---------- effects ---------- */
function burst(x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.283, v = 60 + Math.random() * 260;
    S.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, c: color, r: 1.5 + Math.random() * 3 });
  }
}
function confetti() {
  const box = $('#confetti'), cols = ['#ffd23f', '#2f7bff', '#5aa2ff', '#ffffff'];
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('i');
    p.style.left = Math.random() * 100 + '%'; p.style.background = cols[i % 4]; box.appendChild(p);
    gsap.to(p, { y: innerHeight + 40, x: (Math.random() - .5) * 200, rotation: Math.random() * 720, duration: 2 + Math.random() * 1.5, delay: Math.random() * .6, ease: 'power1.in', onComplete: () => p.remove() });
  }
}

/* ---------- drawing ---------- */
function drawGrid() {
  ctx.fillStyle = '#070d20'; ctx.fillRect(0, 0, W, H);
  ctx.lineWidth = 1;
  for (let x = MW.X[0]; x <= MW.X[1]; x++) {
    ctx.strokeStyle = x % 5 ? 'rgba(47,123,255,.10)' : 'rgba(47,123,255,.26)';
    ctx.beginPath(); ctx.moveTo(sx(x), 0); ctx.lineTo(sx(x), H); ctx.stroke();
  }
  for (let y = MW.Y[0]; y <= MW.Y[1]; y++) {
    ctx.strokeStyle = y % 5 ? 'rgba(47,123,255,.10)' : 'rgba(47,123,255,.26)';
    ctx.beginPath(); ctx.moveTo(0, sy(y)); ctx.lineTo(W, sy(y)); ctx.stroke();
  }
  ctx.strokeStyle = '#8fb6ff'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(sx(0), 0); ctx.lineTo(sx(0), H); ctx.moveTo(0, sy(0)); ctx.lineTo(W, sy(0)); ctx.stroke();
  ctx.fillStyle = '#6f86bd'; ctx.font = `${Math.max(9, W / 70)}px "IBM Plex Mono",monospace`;
  ctx.textAlign = 'center';
  for (let x = -25; x <= 25; x += 5) if (x) ctx.fillText(x, sx(x), sy(0) + 13);
  ctx.textAlign = 'left';
  for (let y = -15; y <= 15; y += 5) if (y) ctx.fillText(y, sx(0) + 5, sy(y) + 3);
}
function line(path, to, color, width, dash, glow) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash || []);
  if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
  ctx.beginPath();
  for (let i = 0; i <= to && i < path.length; i++) {
    const p = path[i];
    (i === 0 || p.g) ? ctx.moveTo(sx(p.x), sy(p.y)) : ctx.lineTo(sx(p.x), sy(p.y));
  }
  ctx.stroke(); ctx.restore();
}
function drawTarget(t) {
  if (t.s <= 0.01) return;
  const x = sx(t.x), y = sy(t.y), r = t.r * unit() * t.s;
  ctx.save(); ctx.shadowBlur = 18;
  if (t.kind === 'star') {
    ctx.shadowColor = ctx.fillStyle = '#ffd23f'; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * .45 : r * 1.25, a = -Math.PI / 2 + i * Math.PI / 5; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
  } else {
    ctx.shadowColor = ctx.fillStyle = t.kind === 'blue' ? '#2f7bff' : '#ffd23f';
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(x - r * .3, y - r * .3, r * .3, 0, 6.283); ctx.fill();
  }
  ctx.restore();
}

let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, .05); last = now;
  if ($('#game').classList.contains('active') && W) {
    drawGrid();
    if (S.preview && !S.shot) line(S.preview, S.preview.length, 'rgba(90,162,255,.75)', 2, [7, 6]);
    S.targets.forEach(drawTarget);
    const sh = S.shot;
    if (sh) {
      sh.i += 2200 * dt;
      const i = Math.min(Math.floor(sh.i), sh.path.length - 1);
      line(sh.path, i, '#ffd23f', 3, null, 14);
      const p = sh.path[i];
      if (p) { ctx.save(); ctx.fillStyle = '#fff'; ctx.shadowColor = '#ffd23f'; ctx.shadowBlur = 22; ctx.beginPath(); ctx.arc(sx(p.x), sy(p.y), 5, 0, 6.283); ctx.fill(); ctx.restore(); }
      if (i >= sh.path.length - 1 && !sh.done) { sh.done = true; resolveShot(); }
    }
    for (let k = S.parts.length - 1; k >= 0; k--) {
      const q = S.parts[k]; q.life -= dt * 1.6; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 240 * dt;
      if (q.life <= 0) { S.parts.splice(k, 1); continue; }
      ctx.globalAlpha = q.life; ctx.fillStyle = q.c; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  requestAnimationFrame(frame);
}

/* ---------- wiring ---------- */
document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => start(b.dataset.mode)));
$('#fireBtn').addEventListener('click', () => fire(false));
$('#leaveBtn').addEventListener('click', leave);
$('#menuBtn').addEventListener('click', () => show('menu'));
$('#againBtn').addEventListener('click', () => start(S.mode));
$('#eq').addEventListener('input', onInput);
$('#eq').addEventListener('keydown', e => { if (e.key === 'Enter') fire(false); });
EXAMPLES.forEach(ex => {
  const c = document.createElement('button');
  c.className = 'chip'; c.textContent = ex;
  c.addEventListener('click', () => { $('#eq').value = ex; onInput(); $('#eq').focus(); });
  $('#chips').appendChild(c);
});
if (!calm) gsap.from('.logo', { opacity: 0, y: 30, scale: .94, duration: .9, ease: 'power3.out' });
requestAnimationFrame(frame);
})();
