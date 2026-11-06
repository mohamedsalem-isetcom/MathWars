/* MATH WARS - Phase 2 effects. Sounds are synthesized with WebAudio (no audio files needed). */
const FX = (() => {
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let actx = null, muted = localStorage.getItem('mw_mute') === '1';

  /* ----- sound ----- */
  function tone(freq, dur, type = 'sine', vol = .15, slide = 0, delay = 0) {
    if (muted) return;
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const t = actx.currentTime + delay, o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(slide, 30), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur);
  }
  const SFX = {
    click: () => tone(520, .06, 'triangle', .08),
    fire:  () => tone(900, .35, 'sawtooth', .07, 180),
    hit:   () => { tone(180, .3, 'square', .1, 50); tone(660, .15, 'triangle', .1, 1200, .05); },
    star:  () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .18, 'triangle', .12, 0, i * .08)),
    miss:  () => tone(220, .3, 'sawtooth', .06, 90),
    tick:  () => tone(1000, .05, 'square', .05),
    win:   () => [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, .25, 'triangle', .12, 0, i * .1)),
    error: () => tone(160, .18, 'square', .06)
  };
  const sfx = name => SFX[name] && SFX[name]();

  /* ----- toasts ----- */
  function toast(text, kind = '') {
    const box = document.getElementById('toasts'), el = document.createElement('div');
    el.className = 'toast ' + kind; el.textContent = text; box.appendChild(el);
    gsap.fromTo(el, { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: calm ? 0 : .35, ease: 'power3.out' });
    gsap.to(el, { x: 60, opacity: 0, duration: calm ? 0 : .3, delay: 2.2, ease: 'power2.in', onComplete: () => el.remove() });
  }

  /* ----- animated background: moving particles + floating equations ----- */
  function background() {
    const cv = document.getElementById('bg'), c = cv.getContext('2d');
    const EQ = ['y = 2x + 5', 'f(x) = x² − 4x + 3', 'sin(x)·20', 'e^(−x²)', 'log(x)', '|x| − 8', '√x', 'cos(x/5)', 'f′(x)', 'Σ'];
    let w, h, dots = [], eqs = [];
    function size() {
      w = cv.width = innerWidth; h = cv.height = innerHeight;
      const n = Math.round(Math.min(70, w * h / 22000));
      dots = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3 }));
      eqs = EQ.map(t => ({ t, x: Math.random() * w, y: Math.random() * h, v: .15 + Math.random() * .25, a: .08 + Math.random() * .12, s: 14 + Math.random() * 14 }));
    }
    size(); addEventListener('resize', size);
    let run = true;
    document.addEventListener('visibilitychange', () => { run = !document.hidden; if (run) loop(); });
    function loop() {
      if (!run) return;
      c.clearRect(0, 0, w, h);
      c.fillStyle = 'rgba(90,162,255,.55)';
      for (const d of dots) {
        d.x = (d.x + d.vx + w) % w; d.y = (d.y + d.vy + h) % h;
        c.beginPath(); c.arc(d.x, d.y, 1.4, 0, 6.283); c.fill();
      }
      c.strokeStyle = 'rgba(90,162,255,.12)';
      for (let i = 0; i < dots.length; i++) for (let j = i + 1; j < dots.length; j++) {
        const dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y;
        if (dx * dx + dy * dy < 9000) { c.beginPath(); c.moveTo(dots[i].x, dots[i].y); c.lineTo(dots[j].x, dots[j].y); c.stroke(); }
      }
      c.textBaseline = 'middle';
      for (const e of eqs) {
        e.y -= e.v; if (e.y < -30) { e.y = h + 30; e.x = Math.random() * w; }
        c.font = `${e.s}px "IBM Plex Mono",monospace`; c.fillStyle = `rgba(255,210,63,${e.a})`; c.fillText(e.t, e.x, e.y);
      }
      requestAnimationFrame(loop);
    }
    if (calm) { dots.forEach(d => { d.vx = d.vy = 0; }); eqs.forEach(e => { e.v = 0; }); }
    loop();
  }

  /* ----- cards react to the mouse ----- */
  function tilt(sel) {
    if (calm || !matchMedia('(hover:hover)').matches) return;
    document.querySelectorAll(sel).forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        gsap.to(el, { rotateY: px * 10, rotateX: -py * 10, transformPerspective: 700, duration: .3 });
      });
      el.addEventListener('mouseleave', () => gsap.to(el, { rotateX: 0, rotateY: 0, duration: .5 }));
    });
  }

  /* ----- loader + mute ----- */
  function boot() {
    background(); tilt('.tilt');
    const mute = document.getElementById('mute');
    const paint = () => { mute.textContent = muted ? 'Sound off' : 'Sound on'; mute.setAttribute('aria-pressed', !muted); };
    paint();
    mute.addEventListener('click', () => { muted = !muted; localStorage.setItem('mw_mute', muted ? '1' : '0'); paint(); sfx('click'); });
    document.addEventListener('click', e => { if (e.target.closest('.btn,.chip')) sfx('click'); });
    const ld = document.getElementById('loader');
    const done = () => gsap.to(ld, { opacity: 0, duration: calm ? 0 : .5, delay: calm ? 0 : .5, onComplete: () => ld.remove() });
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(done);
    setTimeout(done, 2500);
  }
  return { boot, sfx, toast };
})();
