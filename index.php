<?php $v = '0.1.0'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Math Wars</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;700&family=IBM+Plex+Mono:wght@500&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/style.css?v=<?= $v ?>">
</head>
<body>
<div id="loader" role="status" aria-label="Loading"><div class="spin"></div></div>
<canvas id="bg" aria-hidden="true"></canvas>
<button id="mute" class="btn ghost" aria-pressed="true">Sound on</button>
<div id="toasts" aria-live="polite"></div>
<main id="app">

  <section id="menu" class="screen active">
    <h1 class="logo">MATH<span>WARS</span></h1>
    <p class="tag">Shoot with equations. Hit every target.</p>
    <div class="actions">
      <button class="btn primary" data-mode="classic">Play classic</button>
      <button class="btn" data-mode="free">Free play</button>
    </div>
    <details class="how tilt">
      <summary>How to play</summary>
      <p>Type a function of x, like <code>2x + 5</code> or <code>sin(x) * 20</code>. Your shot travels along the curve from left to right and stops at the first target it touches.</p>
      <p>Blue targets give 10 points, small yellow ones 25, the star 50. Classic gives you 5 shots, 30 seconds each.</p>
    </details>
  </section>

  <section id="game" class="screen">
    <header class="hud">
      <div class="stat"><b id="hudScore">0</b><small id="hudScoreLabel">Score</small></div>
      <div class="fire" id="fire"><b id="fireNum">30</b><small id="fireLabel">Fire in</small></div>
      <div class="stat"><b id="hudShots">5</b><small id="hudShotsLabel">Shots left</small></div>
    </header>
    <div id="boardWrap"><canvas id="board"></canvas></div>
    <div class="editor">
      <label for="eq">f(x) =</label>
      <input id="eq" type="text" autocomplete="off" spellcheck="false" placeholder="2x + 5">
      <button class="btn primary" id="fireBtn">FIRE</button>
      <button class="btn ghost" id="leaveBtn">Leave</button>
    </div>
    <p class="err" id="err" role="alert"></p>
    <div class="chips" id="chips"></div>
  </section>

  <section id="results" class="screen">
    <h2 id="resTitle">Round over</h2>
    <div class="bigscore"><b id="resScore">0</b><small>points</small></div>
    <dl class="grid">
      <div><dt>Hits</dt><dd id="resHits">0</dd></div>
      <div><dt>Misses</dt><dd id="resMiss">0</dd></div>
      <div><dt>Accuracy</dt><dd id="resAcc">0%</dd></div>
      <div><dt>Best shot</dt><dd id="resBest">0</dd></div>
      <div><dt>Duration</dt><dd id="resTime">0s</dd></div>
    </dl>
    <div class="actions">
      <button class="btn primary" id="againBtn">Play again</button>
      <button class="btn" id="menuBtn">Main menu</button>
    </div>
  </section>

</main>
<div id="confetti"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/mathjs/12.4.2/math.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="assets/js/engine.js?v=<?= $v ?>"></script>
<script src="assets/js/fx.js?v=<?= $v ?>"></script>
<script src="assets/js/main.js?v=<?= $v ?>"></script>
<script>FX.boot();</script>
</body>
</html>
