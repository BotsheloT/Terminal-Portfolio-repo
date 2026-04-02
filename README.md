# BT Dev — Terminal Portfolio

An interactive, terminal-style personal portfolio website. Visitors land on a fullscreen terminal emulator and navigate your profile by typing commands — no clicks, no scrolling, no templates.

Built with plain HTML, SCSS, and vanilla JavaScript. Zero dependencies, zero build tools required to run. Deploy to GitHub Pages in under two minutes.

---

## Table of Contents

- [Live Preview](#live-preview)
- [File Structure](#file-structure)
- [How It Works](#how-it-works)
- [JavaScript Reference](#javascript-reference)
  - [State Variables](#state-variables)
  - [DOM Helpers](#dom-helpers)
  - [Command Functions](#command-functions)
  - [Riddle System](#riddle-system)
  - [Snake Game (Internal)](#snake-game-internal)
  - [Input Handlers](#input-handlers)
- [SCSS Reference](#scss-reference)
  - [Variables](#variables)
  - [Sections](#sections)
- [How to Make Updates](#how-to-make-updates)
  - [Updating personal info](#updating-personal-info)
  - [Adding a new command](#adding-a-new-command)
  - [Removing a command](#removing-a-command)
  - [Changing the colour theme](#changing-the-colour-theme)
  - [Editing the banner ASCII art](#editing-the-banner-ascii-art)
  - [Editing the SCSS and recompiling](#editing-the-scss-and-recompiling)
  - [Changing the command delay](#changing-the-command-delay)
- [Deployment (GitHub Pages)](#deployment-github-pages)
- [Known Behaviours](#known-behaviours)

---

## Live Preview

Open `index.html` directly in any browser — no server needed for local development.

```
open index.html        # macOS
start index.html       # Windows
xdg-open index.html    # Linux
```

---

## File Structure

```
btdev/
├── index.html      # HTML skeleton — markup only, no inline styles or scripts
├── main.js         # All terminal logic, commands, riddle system, and snake game
├── styles.scss     # Source styles — edit this file
└── styles.css      # Compiled CSS — generated from styles.scss, linked by index.html
```

### Why four files?

| File | Role |
|------|------|
| `index.html` | Structure only. Defines the banner, output area, and two input rows (normal + riddle). Links to `styles.css` and `main.js`. |
| `main.js` | All behaviour. Populates the banner, handles typed commands, manages riddle mode, and runs the snake game. |
| `styles.scss` | The source of truth for all styling. Uses SCSS variables, nesting, and BEM naming. **Always edit this, not the CSS.** |
| `styles.css` | The browser-ready stylesheet compiled from SCSS. Commit this alongside `styles.scss` so GitHub Pages works without a build step. |

---

## How It Works

When the page loads:

1. `index.html` renders the terminal — a banner at the top, followed by a growing output area.
2. `main.js` runs immediately and populates the two banner `<pre>` elements with the ASCII Mac and BT DEV art.
3. A `<input id="hidden-input">` is auto-focused and styled to be invisible (`opacity: 0; width: 1px; height: 1px`). A blinking purple caret and a `<span>` mirroring the typed text create the illusion of a real terminal prompt.
4. Every character the user types updates `#typed-text`, mirroring what they've typed next to the prompt.
5. On `Enter`, the value is matched against the `COMMANDS` object. After a 750ms delay (simulating processing time), the matching function renders its output and the input reappears.
6. `window.scrollTo` keeps the latest output in view — the page itself scrolls, not a container, exactly like a real terminal.

### Layout approach

The layout is intentionally document-like rather than app-like. `body` scrolls natively (`overflow-y: auto`). `#terminal-root` is a plain block with `min-height: 100vh` that grows downward as content is added. This means scrolling works exactly like a real terminal — history disappears upward and new content always appears at the bottom of the document.

---

## JavaScript Reference

### State Variables

```js
const output          // The output <div> — all command output goes here
const inputLine       // The normal prompt row
const riddleInputLine // The riddle-mode prompt row (hidden by default)
const hiddenInput     // The invisible real <input> for normal commands
const typedText       // The <span> that mirrors what the user is typing (normal)
const riddleTypedText // The <span> that mirrors riddle answers
let locked            // Boolean — true while a command is processing, blocks input
let riddleBuffer      // String — virtual keyboard buffer for riddle mode (no real input)
const cmdHistory      // Array — all commands typed this session
let historyIndex      // Integer — current position when cycling history (-1 = not browsing)
```

`locked` is the key concurrency guard. It is set to `true` the moment the user presses Enter, preventing further input until the command finishes rendering. It must **always** be reset to `false` — including inside `exitGame()` for the snake command.

`riddleBuffer` is a plain string that acts as the riddle's virtual input. Because riddle mode does not use a real `<input>` element (to prevent browser autocomplete UI appearing), keystrokes are captured on `document.keydown` and stored here. `setRiddleBuffer(val)` updates both the buffer and the visual `#riddle-typed-text` span in one call.

---

### DOM Helpers

#### `ins(el)`
Inserts an element into the output area before the input line.

```js
ins(el)
```

#### `print(html, modifier?)`
Creates a `<div class="line line--{modifier}">` and inserts it.

```js
print('hello world')          // default white text
print('success', 'green')
print('error message', 'error')
print('muted note', 'muted')
print('heading', 'purple')
print('warning', 'yellow')
print('<b>html supported</b>')
```

Available modifiers: `white`, `green`, `purple`, `yellow`, `error`, `muted`, `cmd`, `blank`

#### `printBlank()`
Inserts an empty spacer line for visual breathing room.

#### `printPrompt(cmd, isRiddle?)`
Echoes the typed command into the history as a styled prompt line. Pass `isRiddle = true` to render the `{RIDDLE MODE}` label in the echoed line.

```js
printPrompt('skills')               // visitor@btdev.com:~$ skills
printPrompt('snake', true)          // visitor@btdev.com{RIDDLE MODE}:~$ snake
```

Called automatically — you do not need to call this inside command functions.

#### `esc(s)`
Escapes HTML special characters. Always use this when inserting user-typed input into `innerHTML`.

#### `scrollToBottom()`
Scrolls the window to the bottom of the document via `window.scrollTo`. Uses `requestAnimationFrame` to wait for DOM paint before measuring.

#### `hideInput()` / `showInput()`
Hides or reveals the correct input row. `showInput()` checks `riddleState.mode` to decide which row to display.

#### `setRiddleBuffer(val)`
Updates the riddle virtual buffer and syncs the visual `#riddle-typed-text` span.

---

### Command Functions

Commands are registered in the `COMMANDS` object:

```js
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
```

The key is the string the user types. The value is the function that runs.

#### `cmdHelp()`
Renders the command list. **State-aware** — before the riddle is solved, `riddle` and `snake` are hidden and a `psst...` hint appears. After solving, both commands appear in the list and the hint is removed.

#### `cmdNeofetch()`
Renders the BT ASCII logo alongside a profile key-value card with a colour palette bar.

#### `cmdAbout()` / `cmdSkills()` / `cmdExperience()` / `cmdEducation()` / `cmdContact()`
Plain content commands. Each follows the same pattern: `printBlank()` → render content → `printBlank()`.

#### `cmdClear()`
Removes all child nodes from `output` except the two input lines, resets typed text, and scrolls to the top of the page with `window.scrollTo(0, 0)`.

#### `cmdRiddle()`
Displays the riddle poem and enters riddle mode. See [Riddle System](#riddle-system) below.

---

### Riddle System

The riddle is a layered easter egg that gates the `snake` command behind answering a riddle. It references Atlanta S3 (the Socks/Paper Boi storyline) and Radiohead's *Snakes and Ladders*.

#### State

```js
let riddleState = {
  mode:    false,  // true = riddle input row is visible, virtual keyboard active
  strikes: 0,      // wrong answer count (max 3 before lockout)
  solved:  false,  // true after correct answer — persists for the session
  history: [],     // answers typed during the current riddle session
};
```

#### Two input rows

The terminal has two separate prompt rows in the HTML:

| Element | When visible | Prompt text |
|---------|-------------|-------------|
| `#input-line` | Normal mode | `visitor@btdev.com:~$` |
| `#riddle-input-line` | Riddle mode | `visitor@btdev.com{RIDDLE MODE}:~$` |

Only one is visible at a time. Switching between them is done by toggling `display` — no DOM rewriting, no innerHTML changes.

#### Why no real `<input>` for riddle mode

Using a second real `<input>` caused the browser to show an autocomplete suggestion box in the corner of the screen, breaking immersion. The riddle row has no `<input>` element at all. Instead, a `document.keydown` listener captures every keystroke while `riddleState.mode` is true, building up `riddleBuffer` character by character. `Backspace` removes the last character. `Enter` submits the buffer. The visual feedback (text appearing next to the cursor) is driven by `#riddle-typed-text`.

#### Functions

| Function | Purpose |
|----------|---------|
| `enterRiddleMode()` | Sets `riddleState.mode = true`, hides normal input, shows riddle input, clears buffer, blurs the real input |
| `exitRiddleMode()` | Sets `riddleState.mode = false`, hides riddle input, shows normal input, refocuses real input |
| `cmdRiddle()` | Displays the riddle poem and calls `enterRiddleMode()`. Resets strikes if previously locked out. |
| `handleRiddleAnswer(val)` | Checks the guess. Correct → celebrate, exit mode, auto-launch snake. Wrong → increment strikes, show taunt and hint. Three strikes → exit mode and lock until `riddle` is re-typed. |

#### Flow

```
User types 'riddle'
  → cmdRiddle() prints the poem
  → enterRiddleMode() swaps the input row
  → User types their answer via virtual keyboard
  → Enter submits riddleBuffer to handleRiddleAnswer()
    → Correct: exitRiddleMode() → celebration text → auto-type 'snake'
    → Wrong (1-2): strike taunt + progressive hint, stay in riddle mode
    → Wrong (3): lockout message with glowing 'riddle' link, exit mode
```

#### Auto-launch on correct answer

When the riddle is solved, `handleRiddleAnswer` calls `locked = false` and `showInput()` first (so the terminal is never stuck), then after 1.2 seconds hides the input and auto-types `snake` into the prompt, launching the game automatically.

---

### Snake Game (Internal)

`cmdSnake()` is the entry point. All game state and functions are scoped inside it.

#### Game state

```js
let snake    // Array of {x, y} objects, head-first
let dir      // Current direction {x, y}
let nextDir  // Queued next direction (prevents mid-tick 180° reversals)
let food     // Current food position {x, y}
let score    // Current score
let loopId   // setInterval ID
let state    // 'idle' | 'running' | 'dead'
```

#### Internal functions

| Function | Purpose |
|----------|---------|
| `teardown()` | Clears interval, removes keyboard listener, disconnects observer |
| `exitGame()` | Calls `teardown()`, removes snake DOM, resets `locked`, restores input |
| `spawnFood()` | Returns a random `{x, y}` not occupied by snake. Initialises snake first. |
| `resetGame()` | Resets all state, starts tick interval. Snake is assigned before `spawnFood()` is called. |
| `handleDir(key)` | Updates `nextDir`. Prevents reversal. Triggers `resetGame()` if called while dead. |
| `tick()` | One game frame — moves snake, checks wall/self collision, eats food |
| `draw()` | Redraws canvas: background, food, snake segments, score |
| `keyHandler(e)` | Document-level listener. Arrow keys → `handleDir`. `R` → restart. `Escape` → `exitGame`. |

#### Exit paths

1. **EXIT GAME button** in the start/game-over overlay
2. **exit game button** below the d-pad (always visible during gameplay)
3. **`Escape` key** at any time

All three call `exitGame()`, which sets `locked = false` before restoring the terminal input.

---

### Input Handlers

#### Normal mode — `hiddenInput.addEventListener('keydown', ...)`

```
Enter pressed
  → echo command to history (printPrompt)
  → hide input row
  → push to cmdHistory (no duplicates)
  → set locked = true
  → wait 750ms
    → run matching command OR print error
    → set locked = false
    → show input row
    → scroll to bottom
```

`↑` / `↓` cycle through `cmdHistory` using `handleHistoryNav()`. History index resets to `-1` on every Enter.

#### Riddle mode — `document.addEventListener('keydown', ...)`

Only fires when `riddleState.mode` is true. Builds up `riddleBuffer` from printable key presses. `Backspace` trims the buffer. `↑`/`↓` cycle `riddleState.history`. `Enter` submits to `handleRiddleAnswer()`.

#### `handleHistoryNav(e, input, textEl, history)`
Shared helper used by the normal input handler for `↑`/`↓` navigation. Takes the event, the input element, the text display span, and the history array. Returns `true` if it handled the key (so the caller can `return` early).

---

## SCSS Reference

### Variables

```scss
$bg:          #1e1e2e;   // Main background
$bg-dark:     #181825;   // Darker surfaces
$surface:     #313244;   // Cards, buttons, borders
$surface-hi:  #45475a;   // Hover state
$text:        #cdd6f4;   // Primary text
$text-muted:  #6c7086;   // Secondary/hint text
$text-dim:    #45475a;   // Very faint text
$purple:      #bd93f9;   // Accent — caret, prompt, glow
$purple-soft: #cba6f7;   // Softer purple for headings
$green:       #a6e3a1;   // Banner text, success
$red:         #f38ba8;   // Errors
$yellow:      #f9e2af;   // Warnings, riddle poem
$cyan:        #89dceb;   // Links
$blue:        #89b4fa;   // Info
$mono:        'Courier New', Courier, monospace;
```

### Sections

| Selector | Purpose |
|----------|---------|
| `html, body` | `min-height: 100%`, `overflow-y: auto` — the page itself scrolls |
| `#terminal-root` | Plain block, `min-height: 100vh`, grows with content |
| `.banner-area` | Top banner with ASCII art and welcome text — scrolls away as history grows |
| `.banner-area__mac` | Isometric Mac ASCII block |
| `.banner-area__btdev` | BT DEV title art block |
| `.glow-cmd` | Glowing purple `'help'` / `'riddle'` text style |
| `.output-area` | Plain `display: block` — lines stack naturally downward |
| `.line` | Base class for all output lines |
| `.line--{modifier}` | Colour variants: `white`, `green`, `purple`, `yellow`, `error`, `muted`, `cmd`, `blank` |
| `.input-inline` | The prompt row (both normal and riddle use this class) |
| `.prompt-label` | `visitor@btdev.com:~$` text |
| `.prompt-label__riddle` | `{RIDDLE MODE}` badge — same colour as surrounding prompt text |
| `.prompt-label__sep` | `:~$` portion in muted colour |
| `.fake-input` | Container for typed text + blinking caret |
| `.fake-input__caret` | Blinking block cursor (CSS `@keyframes blink`) |
| `#hidden-input` | Invisible real input (`opacity: 0; width: 1px; height: 1px`) |
| `.neo` | Neofetch layout (flex row) |
| `.neo__*` | BEM elements: `ascii`, `info`, `title`, `sep`, `row`, `key`, `val`, `colon`, `bar`, `dot` |
| `.help-table` | Two-column CSS grid for help listing |
| `.snake-wrap` | Relative wrapper so overlay sits over canvas |
| `.snake-overlay` | Semi-transparent overlay with start/restart/exit buttons |
| `.snake-dpad` | On-screen directional pad grid |

---

## How to Make Updates

### Updating personal info

All personal content lives in `main.js`. Each command function is self-contained.

**Bio (`cmdAbout`)**
```js
print("Your new bio line here.");
```

**Skills (`cmdSkills`)**
```js
['your new category', 'tool1 · tool2 · tool3'],
```

**Experience (`cmdExperience`)** — duplicate this block for multiple roles:
```js
print('<span style="color:#cba6f7;">Company Name</span>');
print('Your Title', 'green');
print('Start – End  ·  Location', 'muted');
printBlank();
print('› Bullet point one');
```

**Contact links (`cmdContact`)**
```js
['twitter', 'twitter.com/you', 'https://twitter.com/you'],
```

---

### Adding a new command

**Step 1** — Write the function:
```js
function cmdProjects() {
  printBlank();
  print('projects', 'purple');
  printBlank();
  print('<span style="color:#cba6f7;">Project Name</span>');
  print('A short description.', 'muted');
  printBlank();
}
```

**Step 2** — Register it:
```js
const COMMANDS = {
  // ...
  projects: cmdProjects,
};
```

**Step 3** — Add it to `cmdHelp()`:
```js
['projects', 'things i have built'],
```

If the command should only appear after the riddle is solved, add it inside the `if (riddleState.solved)` block in `cmdHelp()`.

---

### Removing a command

1. Delete the function
2. Remove its entry from `COMMANDS`
3. Remove its row from the array inside `cmdHelp()`

---

### Changing the colour theme

Edit the variables at the top of `styles.scss` and recompile.

---

### Editing the banner ASCII art

The Mac and BT DEV text are set at the very top of `main.js`:

```js
document.getElementById('banner-mac').textContent = `...`;
document.getElementById('banner-btdev').textContent = `...`;
```

Edit the template literal strings directly. Backslashes need to be escaped as `\\`.

---

### Editing the SCSS and recompiling

```bash
# Install once
npm install -g sass

# Compile once
sass styles.scss styles.css

# Watch for changes
sass --watch styles.scss:styles.css
```

Always commit both `styles.scss` and the recompiled `styles.css`.

---

### Changing the command delay

The 750ms processing delay is in the normal input handler near the bottom of `main.js`:

```js
setTimeout(() => {
  // command runs here
}, 750);  // ← change this value
```

---

## Deployment (GitHub Pages)

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Then: **GitHub repo → Settings → Pages → Source → main → / (root) → Save**

Your site will be live at `https://YOUR_USERNAME.github.io/YOUR_REPO`

**Custom domain** — add a `CNAME` file to the repo root:
```
btdev.com
```
Then point your domain's DNS A records to GitHub's IPs and set the domain in Pages settings.

---

## Known Behaviours

| Behaviour | Reason |
|-----------|--------|
| Input is blocked while a command processes | `locked = true` during the 750ms delay — intentional |
| Clicking anywhere refocuses input | Click listener on `#terminal-root` calls `hiddenInput.focus()` unless clicking a button or canvas |
| Riddle mode has no visible input box | There is no `<input>` element — keystrokes are captured directly on `document.keydown` to prevent browser autocomplete UI |
| Riddle answers cycle with `↑`/`↓` | `riddleState.history` tracks answers for the current riddle session, separate from `cmdHistory` |
| `clear` scrolls back to the top | `window.scrollTo(0, 0)` — mirrors how a real terminal clear works |
| Arrow keys in snake prevent page scrolling | `e.preventDefault()` is called on arrow keys inside the snake's `keyHandler` |
| `Escape` exits the snake game | Registered in the same `keyHandler` |
| `snake` and `riddle` are hidden in `help` until solved | `cmdHelp()` checks `riddleState.solved` before appending those rows |
| The banner scrolls away with history | It lives in the same document flow as the output — there is no sticky header |
| `styles.css` is committed alongside `styles.scss` | GitHub Pages serves static files — no SCSS compilation happens on push |