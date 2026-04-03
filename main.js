// ── Banner content ──────────────────────────────────────────────────────────
document.getElementById('banner-mac').textContent =
`         ______________
        /             /|
       /             / |
      /_____________/  |
     | ___________ |   |
     ||           ||   |
     ||  OK       ||   |
     ||  Computer ||   |
     ||___________||   |
     |   _______   |  /
    /|  (_______) | /
   ( |_____________|/
    \\
.=======================.
| ::::::::::::::::  ::: |
| ::::::::::::::[]  ::: |
|   -----------     ::: |
\`-----------------------'`;

document.getElementById('banner-btdev').textContent =
`
\u0020
\u0020
\u0020
$$$$$$$\\  $$$$$$$$\\       $$$$$$$\\  $$$$$$$$\\ $$\\    $$\\ 
$$  __$$\\ \\__$$  __|      $$  __$$\\ $$  _____|$$ |   $$ |
 $$ |  $$ |  $$ |         $$ |  $$ |$$ |      $$ |   $$ |
 $$$$$$$\\ |  $$ |         $$ |  $$ |$$$$$\\    \\$$\\  $$  |
 $$  __$$\\   $$ |         $$ |  $$ |$$  __|    \\$$\\$$  / 
 $$ |  $$ |  $$ |         $$ |  $$ |$$ |        \\$$$  /  
 $$$$$$$  |  $$ |         $$$$$$$  |$$$$$$$$\\    \\$  /   
\\_______/   \\__|         \\_______/ \\________|    \\_/
                                                      \u00A9 2026`;

// ── Terminal engine ──────────────────────────────────────────────────────────
const output          = document.getElementById('output');
const inputLine       = document.getElementById('input-line');
const riddleInputLine = document.getElementById('riddle-input-line');
const hiddenInput     = document.getElementById('hidden-input');
const typedText       = document.getElementById('typed-text');
const riddleTypedText = document.getElementById('riddle-typed-text');
let locked = false;

// Virtual riddle buffer — no real <input> element, keystrokes captured on document
let riddleBuffer = '';

function setRiddleBuffer(val) {
  riddleBuffer = val;
  riddleTypedText.textContent = val;
}

hiddenInput.addEventListener('input', () => {
  if (locked) { hiddenInput.value = ''; return; }
  typedText.textContent = hiddenInput.value;
});

document.getElementById('terminal-root').addEventListener('click', e => {
  const ignore = e.target.closest('canvas, .snake-overlay, .snake-dpad, button');
  if (!ignore && !riddleState.mode) hiddenInput.focus();
});

hiddenInput.focus();

// ── DOM helpers ──────────────────────────────────────────────────────────────
function ins(el) { output.insertBefore(el, inputLine); }

function print(html, modifier = 'white') {
  const d = document.createElement('div');
  d.className = 'line line--' + modifier;
  d.innerHTML = html;
  ins(d);
}

function printBlank() {
  const d = document.createElement('div');
  d.className = 'line line--blank';
  d.innerHTML = '&nbsp;';
  ins(d);
}

function printPrompt(cmd, isRiddle = false) {
  const d = document.createElement('div');
  d.className = 'line line--cmd';
  if (isRiddle) {
    d.innerHTML =
      '<span class="prompt-label">visitor@btdev.com' +
      '<span class="prompt-label__riddle">{RIDDLE MODE}</span>' +
      '<span class="prompt-label__sep">:~$</span></span> ' + esc(cmd);
  } else {
    d.innerHTML =
      '<span class="prompt-label">visitor@btdev.com' +
      '<span class="prompt-label__sep">:~$</span></span> ' + esc(cmd);
  }
  ins(d);
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Always scroll output to the very bottom after DOM updates
function scrollToBottom() {
  requestAnimationFrame(() => window.scrollTo({ top: document.body.scrollHeight }));
}

function hideInput() {
  inputLine.style.display       = 'none';
  riddleInputLine.style.display = 'none';
}

function showInput() {
  if (riddleState && riddleState.mode) {
    riddleInputLine.style.display = 'flex';
    inputLine.style.display       = 'none';
    scrollToBottom();
  } else {
    inputLine.style.display       = 'flex';
    riddleInputLine.style.display = 'none';
    scrollToBottom();
    setTimeout(() => { hiddenInput.focus(); }, 0);
  }
}

// ── Commands ─────────────────────────────────────────────────────────────────
const COMMANDS = {
  help:       cmdHelp,
  neofetch:   cmdNeofetch,
  about:      cmdAbout,
  skills:     cmdSkills,
  experience: cmdExperience,
  education:  cmdEducation,
  contact:    cmdContact,
  clear:      cmdClear,
  riddle:     cmdRiddle,
  snake:      cmdSnake,
};

function cmdHelp() {
  printBlank();
  print('available commands', 'purple');
  printBlank();

  const table = document.createElement('div');
  table.className = 'help-table';

  // Base commands always visible
  const baseCommands = [
    ['neofetch',    'display profile overview'],
    ['about',       'who i am'],
    ['skills',      'tech stack & tools'],
    ['experience',  'work history'],
    ['education',   'academic background'],
    ['contact',     'links & socials'],
    ['clear',       'clear the terminal'],
    ['help',        'show this help menu'],
  ];

  // Riddle and snake only show once solved
  if (riddleState.solved) {
    baseCommands.push(['riddle', 'revisit the riddle']);
    baseCommands.push(['snake',  'you already know']);
  }

  baseCommands.forEach(([cmd, desc]) => {
    const k = document.createElement('div'); k.className = 'help-table__cmd';  k.textContent = cmd;
    const v = document.createElement('div'); v.className = 'help-table__desc'; v.textContent = desc;
    table.appendChild(k); table.appendChild(v);
  });

  ins(table);
  printBlank();

  // Only show the psst hint if the riddle hasn't been solved yet
  if (!riddleState.solved) {
    const hint = document.createElement('div');
    hint.className = 'line line--muted';
    hint.style.fontSize = '11px';
    hint.innerHTML = "psst... type <span class='glow-cmd'>'riddle'</span> if you think you can handle a secret.";
    ins(hint);
    printBlank();
  }
}

function cmdNeofetch() {
  printBlank();
  const wrap  = document.createElement('div'); wrap.className  = 'neo';
  const ascii = document.createElement('div'); ascii.className = 'neo__ascii';
  ascii.textContent =
    "    __                      __\n" +
    " .-'  `'.._...-----..._..-`  '-.\n" +
    "/                                \\\n" +
    "|  ,   ,'                '.   ,  |\n" +
    " \\  '-/                    \\-'  /\n" +
    "  '._|          _           |_.'\n" +
    "     |    /\\   / \\    /\\    |\n" +
    "     |    \\/   | |    \\/    |\n" +
    "      \\        \\\"/         /\n" +
    "       '.    ==\"'\"==     .'\n" +
    "         `'------------'`";
  const info  = document.createElement('div'); info.className  = 'neo__info';
  const title = document.createElement('div'); title.className = 'neo__title';
  title.textContent = 'visitor@btdev.com';
  const sep = document.createElement('div'); sep.className = 'neo__sep';
  sep.textContent = '\u2500'.repeat(26);
  info.appendChild(title); info.appendChild(sep);
  [
    ['name',    'Botshelo Tlhabanyane'],
    ['title',   'Full Stack Developer'],
    ['company', 'Accenture'],
    ['focus',   'Frontend & Full Stack'],
    ['stack',   'MEAN \u00B7 MERN \u00B7 TypeScript \u00B7 Tailwind'],
    ['tools',   'Figma \u00B7 Claude \u00B7 Git'],
    ['os',      'macOS / VS Code'],
    ['uptime',  '3+ yrs professional'],
  ].forEach(([k, v]) => {
    const row = document.createElement('div'); row.className = 'neo__row';
    row.innerHTML =
      '<span class="neo__key">' + k + '</span>' +
      '<span class="neo__colon">:</span>' +
      '<span class="neo__val">' + v + '</span>';
    info.appendChild(row);
  });
  const bar = document.createElement('div'); bar.className = 'neo__bar';
  ['#f38ba8','#f9e2af','#a6e3a1','#89dceb','#89b4fa','#cba6f7','#cdd6f4','#bac2de'].forEach(c => {
    const dot = document.createElement('div'); dot.className = 'neo__dot'; dot.style.background = c;
    bar.appendChild(dot);
  });
  info.appendChild(bar);
  wrap.appendChild(ascii); wrap.appendChild(info);
  ins(wrap); printBlank();
}

function cmdAbout() {
  printBlank(); print('about me', 'purple'); printBlank();
  print("I'm a developer with a serious soft spot for great design and creative flair.");
  printBlank();
  print("I take the \u201Cwouldn\u2019t it be cool if\u2026\u201D moments and turn them into interactive,");
  print("virtual realities that don\u2019t look like a template.");
  printBlank();
  print("Currently at <span style='color:#cba6f7'>Accenture</span> as a Full Stack Developer, blending engineering");
  print("rigour with a designer\u2019s eye \u2014 from clean APIs to polished UIs.");
  printBlank();
}

function cmdSkills() {
  printBlank(); print('tech stack', 'purple'); printBlank();
  [
    ['frontend',           'React / Next.js \u00B7 Angular \u00B7 TypeScript \u00B7 Tailwind CSS \u00B7 HTML & CSS'],
    ['backend',            'Node.js \u00B7 Express \u00B7 MongoDB \u00B7 REST APIs'],
    ['stacks',             'MEAN \u00B7 MERN'],
    ['ai & design',        'Claude \u00B7 Claude Code \u00B7 Figma'],
    ['devops',             'Git \u00B7 GitHub Actions \u00B7 CI/CD pipelines'],
    ['currently learning', 'edge deployments \u00B7 AI-assisted workflows'],
  ].forEach(([cat, val]) => {
    print(
      '<span style="color:#bd93f9;min-width:145px;display:inline-block">' + cat + '</span>' +
      '<span style="color:#6c7086"> \u203A </span>' +
      '<span style="color:#cdd6f4">' + val + '</span>'
    );
  });
  printBlank();
}

function cmdExperience() {
  printBlank(); print('work experience', 'purple'); printBlank();
  print('<span style="color:#cba6f7;">Accenture</span>');
  print('Full Stack Developer', 'green');
  print('Feb 2023 \u2013 present  \u00B7  Johannesburg, ZA', 'muted');
  printBlank();
  print('\u203A Started on the Graduate Programme (Feb 2023)');
  print('\u203A Converted to full-time employment after one year');
  print('\u203A Building and maintaining enterprise-grade web applications');
  print('\u203A Bridging design and engineering across MEAN/MERN stacks');
  printBlank();
}

function cmdEducation() {
  printBlank(); print('education', 'purple'); printBlank();
  print('<span style="color:#cba6f7;">Varsity College</span>');
  print('Bachelor of Science in Computer Science', 'green');
  print('Graduated 2022', 'muted'); printBlank();
}

function cmdContact() {
  printBlank(); print('get in touch', 'purple'); printBlank();
  [
    ['email',    'botshelotlhabanyane@gmail.com', 'mailto:botshelotlhabanyane@gmail.com'],
    ['github',   'github.com/BotsheloT',          'https://github.com/BotsheloT'],
    ['linkedin', 'linkedin.com/in/botshelotlhabanyane', 'https://www.linkedin.com/in/botshelotlhabanyane'],
  ].forEach(([k, label, href]) => {
    const row = document.createElement('div');
    row.className = 'line line--white'; row.style.lineHeight = '1.5';
    row.innerHTML =
      '<span style="color:#bd93f9;display:inline-block;min-width:85px">' + k + '</span>' +
      '<span style="color:#6c7086"> \u203A </span>' +
      '<a href="' + href + '" style="color:#89dceb;text-decoration:none;" target="_blank" rel="noopener noreferrer">' + label + '</a>';
    ins(row);
  });
  printBlank(); print("feel free to reach out \u2014 i don\u2019t bite", 'muted'); printBlank();
}

function cmdClear() {
  while (output.firstChild !== inputLine && output.firstChild !== riddleInputLine) {
    output.removeChild(output.firstChild);
  }
  hiddenInput.value = ''; typedText.textContent = '';
  window.scrollTo(0, 0);
}

// ── Riddle ───────────────────────────────────────────────────────────────────
let riddleState = {
  mode:    false,  // true = user is in riddle mode (prompt changes)
  strikes: 0,
  solved:  false,
  history: [],     // answers typed during this riddle session
};

const RIDDLE_LINES = [
  "I was Medusa\u2019s crown.",
  "I was Eden\u2019s downfall.",
  "I am a language, a game, and a threat.",
  "Find me here and the terminal will answer.",
  "What am I?",
];

const HINTS = [
  "hint: I have no legs but I can run.",
  "hint: Python borrowed my name. I live in gardens and in code.",
  "hint: one word. type it into this terminal and see what happens.",
];

const STRIKE_TAUNTS = [
  "not quite. think about what Medusa and Eden have in common.",
  "still no. the answer is also a programming language and something on this page.",
  "three strikes. type <span class=\'glow-cmd\'>\'riddle\'</span> to reset and try again.",
];

function enterRiddleMode() {
  riddleState.mode    = true;
  riddleState.history = [];
  setRiddleBuffer('');
  inputLine.style.display       = 'none';
  riddleInputLine.style.display = 'flex';
  // blur the normal input so the browser stops tracking it
  hiddenInput.blur();
}

function exitRiddleMode() {
  riddleState.mode = false;
  setRiddleBuffer('');
  riddleInputLine.style.display = 'none';
  inputLine.style.display       = 'flex';
  setTimeout(() => hiddenInput.focus(), 0);
}

function cmdRiddle() {
  // Reset strikes if locked out
  if (riddleState.strikes >= 3) {
    riddleState.strikes = 0;
  }

  // If already solved, just remind them
  if (riddleState.solved) {
    printBlank();
    print("you already cracked it. the command is waiting.", "muted");
    printBlank();
    return;
  }

  printBlank();
  print("\u2500\u2500 riddle mode activated \u2500\u2500", "purple");
  printBlank();
  RIDDLE_LINES.forEach(line => print(line, "yellow"));
  printBlank();

  if (riddleState.strikes > 0 && riddleState.strikes < 3) {
    print(HINTS[riddleState.strikes - 1], "muted");
    printBlank();
  }

  print("type your answer and press enter.", "muted");
  printBlank();

  enterRiddleMode();
}

function handleRiddleAnswer(val) {
  const guess = val.trim().toLowerCase();

  // Push to riddle history
  riddleState.history.push(val);

  printPrompt(val, true);

  if (guess === 'snake') {
    riddleState.solved = true;
    exitRiddleMode();
    printBlank();
    print("\u2713  correct.", "green");
    printBlank();
    print("Socks knew. the garden knew. and now so do you.", "yellow");
    print("the hidden command has been unlocked.", "muted");
    printBlank();
    // Unlock and show input immediately so the terminal is not stuck.
    // Then after a readable pause, kick off the auto-type snake sequence.
    locked = false;
    showInput();
    setTimeout(() => {
      hideInput();
      setTimeout(() => {
        printPrompt('snake');
        setTimeout(() => {
          cmdSnake();
        }, 600);
      }, 800);
    }, 1200);
    return;
  }

  // Wrong answer
  riddleState.strikes++;
  printBlank();

  if (riddleState.strikes >= 3) {
    exitRiddleMode();
    const d = document.createElement('div');
    d.className = 'line line--error';
    d.innerHTML = STRIKE_TAUNTS[2];
    ins(d);
  } else {
    print(STRIKE_TAUNTS[riddleState.strikes - 1], 'error');
    print(HINTS[riddleState.strikes - 1], 'muted');
  }
  printBlank();
}

// ── Snake ─────────────────────────────────────────────────────────────────────
function cmdSnake() {
  printBlank();
  print('snake \u2014 secret unlocked', 'yellow');
  print("arrow keys or d-pad \u00B7 eat red dots \u00B7 don\u2019t hit walls \u00B7 ESC to exit", 'muted');
  printBlank();

  const CELL = 18, COLS = 24, ROWS = 16;
  const W = CELL * COLS, H = CELL * ROWS;

  // ── build DOM ──
  const container = document.createElement('div');
  container.style.cssText = 'display:inline-flex;flex-direction:column;gap:0;';

  const snakeWrap = document.createElement('div');
  snakeWrap.className = 'snake-wrap';

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  canvas.style.cssText = 'display:block;border:1px solid #313244;background:#11111b;';
  snakeWrap.appendChild(canvas);

  // overlay
  const overlay    = document.createElement('div'); overlay.className = 'snake-overlay';
  const overlayMsg = document.createElement('div'); overlayMsg.textContent = 'click START to play';
  const startBtn   = document.createElement('button'); startBtn.textContent = '\u25B6  START';
  const overlayExit = document.createElement('button');
  overlayExit.textContent = '\u2715  exit game';
  overlayExit.style.cssText = 'background:transparent;border-color:#6c7086;color:#6c7086;margin-top:4px;';

  overlay.appendChild(overlayMsg);
  overlay.appendChild(startBtn);
  overlay.appendChild(overlayExit);
  snakeWrap.appendChild(overlay);
  container.appendChild(snakeWrap);

  // d-pad
  const dpad = document.createElement('div'); dpad.className = 'snake-dpad';
  [
    { key: 'ArrowUp',    label: '\u25B2', col: 2, row: 1 },
    { key: 'ArrowLeft',  label: '\u25C0', col: 1, row: 2 },
    { key: 'ArrowDown',  label: '\u25BC', col: 2, row: 2 },
    { key: 'ArrowRight', label: '\u25B6', col: 3, row: 2 },
  ].forEach(({ key, label, col, row }) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.style.gridColumn = String(col);
    b.style.gridRow    = String(row);
    b.addEventListener('mousedown',  e => { e.preventDefault(); handleDir(key); });
    b.addEventListener('touchstart', e => { e.preventDefault(); handleDir(key); }, { passive: false });
    dpad.appendChild(b);
  });
  container.appendChild(dpad);

  // exit button below d-pad (always visible, not just on overlay)
  const exitBtnBelow = document.createElement('button');
  exitBtnBelow.textContent = '\u2715  exit game';
  exitBtnBelow.style.cssText =
    'margin-top:8px;background:transparent;border:1px solid #45475a;color:#6c7086;' +
    'font-family:"Courier New",monospace;font-size:11px;padding:4px 14px;' +
    'cursor:pointer;border-radius:4px;align-self:flex-start;transition:color 0.15s;';
  exitBtnBelow.addEventListener('mouseover', () => { exitBtnBelow.style.color = '#cdd6f4'; });
  exitBtnBelow.addEventListener('mouseout',  () => { exitBtnBelow.style.color = '#6c7086'; });
  container.appendChild(exitBtnBelow);

  ins(container);
  printBlank();

  // scroll so the game is visible
  requestAnimationFrame(() => {
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // ── game state ──
  const ctx = canvas.getContext('2d');
  let snake, dir, nextDir, food, score, loopId;
  let state = 'idle';

  function teardown() {
    if (loopId) { clearInterval(loopId); loopId = null; }
    document.removeEventListener('keydown', keyHandler);
    observer.disconnect();
  }

  function exitGame() {
    teardown();
    if (container.parentNode) container.parentNode.removeChild(container);
    // Make sure the terminal is fully unlocked before restoring input
    locked = false;
    showInput();
    scrollToBottom();
    // Double-tap focus after a tick to beat any blur caused by button click
    setTimeout(() => { hiddenInput.focus(); }, 50);
  }

  overlayExit.addEventListener('click',  exitGame);
  exitBtnBelow.addEventListener('click', exitGame);

  function spawnFood() {
    let f, attempts = 0;
    do {
      f = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
      if (++attempts > COLS * ROWS) break;
    } while (snake && snake.some(s => s.x === f.x && s.y === f.y));
    return f;
  }

  function resetGame() {
    if (loopId) { clearInterval(loopId); loopId = null; }
    // initialise snake BEFORE calling spawnFood
    snake   = [{ x: 12, y: 8 }, { x: 11, y: 8 }, { x: 10, y: 8 }];
    dir     = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score   = 0;
    food    = spawnFood();
    state   = 'running';
    overlay.style.display = 'none';
    loopId = setInterval(tick, 140);
    draw();
  }

  function handleDir(key) {
    if (state === 'dead')    { resetGame(); return; }
    if (state !== 'running') return;
    const map = {
      ArrowUp:    { x:  0, y: -1 },
      ArrowDown:  { x:  0, y:  1 },
      ArrowLeft:  { x: -1, y:  0 },
      ArrowRight: { x:  1, y:  0 },
    };
    const d = map[key];
    if (d && !(d.x === -dir.x && d.y === -dir.y)) nextDir = d;
  }

  function tick() {
    if (state !== 'running') return;
    dir = { ...nextDir };
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // wall collision
    const wallHit = head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS;
    // self collision — exclude the tail that's about to vacate
    const bodyHit = snake.slice(0, snake.length - 1).some(s => s.x === head.x && s.y === head.y);

    if (wallHit || bodyHit) {
      state = 'dead';
      clearInterval(loopId); loopId = null;
      overlayMsg.textContent = 'game over \u2014 score: ' + score;
      startBtn.textContent   = '\u21BA  RESTART';
      overlay.style.display  = 'flex';
      draw(); return;
    }

    const ateFood = head.x === food.x && head.y === food.y;
    snake.unshift(head);
    if (ateFood) { score++; food = spawnFood(); }
    else         { snake.pop(); }
    draw();
  }

  function draw() {
    ctx.fillStyle = '#11111b'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f38ba8';
    ctx.fillRect(food.x * CELL + 2, food.y * CELL + 2, CELL - 4, CELL - 4);
    snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? '#bd93f9' : (i % 2 === 0 ? '#7c7fa8' : '#6c7086');
      ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
    });
    ctx.fillStyle = '#6c7086'; ctx.font = '11px monospace';
    ctx.fillText('score: ' + score, 4, H - 5);
  }

  startBtn.addEventListener('click', resetGame);

  function keyHandler(e) {
    const arrows = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    if (arrows.includes(e.key)) { e.preventDefault(); handleDir(e.key); }
    if ((e.key === 'r' || e.key === 'R') && state === 'dead') resetGame();
    if (e.key === 'Escape') exitGame();
  }
  document.addEventListener('keydown', keyHandler);

  const observer = new MutationObserver(() => {
    if (!document.contains(canvas)) teardown();
  });
  observer.observe(output, { childList: true, subtree: true });

  draw(); // idle screen
}

// ── Command history + input handler ─────────────────────────────────────────
const cmdHistory = [];
let historyIndex  = -1;

// Shared history navigation logic
function handleHistoryNav(e, input, textEl, history) {
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (history.length === 0) return;
    if (historyIndex === -1) historyIndex = history.length;
    historyIndex = Math.max(0, historyIndex - 1);
    input.value = history[historyIndex];
    textEl.textContent = history[historyIndex];
    return true;
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (historyIndex === -1) return true;
    historyIndex++;
    if (historyIndex >= history.length) {
      historyIndex = -1;
      input.value = '';
      textEl.textContent = '';
    } else {
      input.value = history[historyIndex];
      textEl.textContent = history[historyIndex];
    }
    return true;
  }
  return false;
}

// ── Normal input handler ──────────────────────────────────────────────────
hiddenInput.addEventListener('keydown', e => {
  if (handleHistoryNav(e, hiddenInput, typedText, cmdHistory)) return;
  if (e.key !== 'Enter') return;

  const val = hiddenInput.value.trim();
  hiddenInput.value     = '';
  typedText.textContent = '';
  historyIndex          = -1;

  printPrompt(val || '');
  hideInput();

  if (!val) { showInput(); return; }

  if (cmdHistory[cmdHistory.length - 1] !== val) cmdHistory.push(val);

  const cmd = val.toLowerCase().trim();
  locked = true;

  setTimeout(() => {
    if (COMMANDS[cmd]) {
      COMMANDS[cmd]();
    } else {
      printBlank();
      const d = document.createElement('div');
      d.className = 'line line--error';
      d.innerHTML =
        'command not found: <span style="color:#f38ba8">' + esc(cmd) + '</span>' +
        ' \u2014 try <span class="glow-cmd">\'help\'</span>';
      ins(d); printBlank();
    }
    locked = false;
    if (cmd !== 'snake') {
      showInput();
      scrollToBottom();
    }
  }, 750);
});

// ── Riddle virtual keyboard capture (no real <input> — prevents browser UI) ──
document.addEventListener('keydown', e => {
  if (!riddleState.mode) return;
  if (locked) return;

  // history navigation
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    const hist = riddleState.history;
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (hist.length === 0) return;
      if (historyIndex === -1) historyIndex = hist.length;
      historyIndex = Math.max(0, historyIndex - 1);
      setRiddleBuffer(hist[historyIndex]);
    } else {
      e.preventDefault();
      if (historyIndex === -1) return;
      historyIndex++;
      if (historyIndex >= hist.length) {
        historyIndex = -1;
        setRiddleBuffer('');
      } else {
        setRiddleBuffer(hist[historyIndex]);
      }
    }
    return;
  }

  // prevent arrow keys scrolling the page
  if (['ArrowLeft','ArrowRight'].includes(e.key)) return;

  if (e.key === 'Enter') {
    e.preventDefault();
    const val = riddleBuffer.trim();
    setRiddleBuffer('');
    historyIndex = -1;
    if (!val) { showInput(); return; }
    locked = true;
    hideInput();
    setTimeout(() => {
      handleRiddleAnswer(val);
      locked = false;
      if (riddleState.mode) {
        showInput();
        scrollToBottom();
      } else if (!riddleState.solved) {
        showInput();
        scrollToBottom();
      }
    }, 750);
    return;
  }

  if (e.key === 'Backspace') {
    e.preventDefault();
    setRiddleBuffer(riddleBuffer.slice(0, -1));
    return;
  }

  // printable characters only (single char, not modifier combos)
  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault();
    setRiddleBuffer(riddleBuffer + e.key);
  }
});