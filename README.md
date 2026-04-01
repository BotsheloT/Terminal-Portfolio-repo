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
  - [Snake Game (Internal)](#snake-game-internal)
  - [Input Handler](#input-handler)
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
├── main.js         # All terminal logic, commands, and the snake game
├── styles.scss     # Source styles — edit this file
└── styles.css      # Compiled CSS — generated from styles.scss, linked by index.html
```

### Why four files?

| File | Role |
|------|------|
| `index.html` | Structure only. Defines the terminal shell, banner placeholders, and the input line. Links to `styles.css` and `main.js`. |
| `main.js` | All behaviour. Populates the banner, handles typed commands, renders output, and runs the snake game. |
| `styles.scss` | The source of truth for all styling. Uses SCSS variables, nesting, and BEM naming. **Always edit this, not the CSS.** |
| `styles.css` | The browser-ready stylesheet compiled from SCSS. Commit this alongside `styles.scss` so GitHub Pages works without a build step. |

---

## How It Works

When the page loads:

1. `index.html` renders the terminal shell — banner area, output area, and an invisible `<input>` that captures all keyboard input.
2. `main.js` runs immediately and populates the two banner `<pre>` elements with the ASCII Mac and BT DEV art.
3. The hidden `<input id="hidden-input">` is auto-focused. A visible fake cursor (`#caret`) pulses on screen, keeping the illusion of a real terminal prompt.
4. Every character the user types updates `#typed-text`, mirroring what they've typed next to the prompt.
5. On `Enter`, the typed value is matched against the `COMMANDS` object. After a 750ms delay (simulating processing time), the matching function renders its output above the input line and the input reappears.
6. The output area scrolls to the bottom after every command so new content is always in view.

---

## JavaScript Reference

### State Variables

```js
const output      // The scrollable output <div>
const inputLine   // The prompt + input row element
const hiddenInput // The invisible <input> that captures keystrokes
const typedText   // The <span> that mirrors what the user is typing
let locked        // Boolean — true while a command is processing, blocks input
```

`locked` is the key concurrency guard. It is set to `true` the moment the user presses Enter, preventing further input until the command finishes rendering. It must **always** be reset to `false` after a command completes — including in error paths. The snake game sets `locked = false` inside `exitGame()` rather than the normal handler, because it has its own lifecycle.

---

### DOM Helpers

These are small utility functions used by every command to build output.

---

#### `ins(el)`
Inserts an element into the output area **before** the input line, keeping the input always at the bottom.

```js
ins(el)
// el — any DOM element
```

---

#### `print(html, modifier?)`
Creates a `<div class="line line--{modifier}">` and inserts it.

```js
print('hello world')             // white text (default)
print('success', 'green')        // green text
print('oops', 'error')           // red text
print('muted note', 'muted')     // grey text
print('heading', 'purple')       // purple/accent text
print('<b>bold</b>', 'white')    // HTML is supported
```

Available modifiers: `white`, `green`, `purple`, `yellow`, `error`, `muted`, `cmd`, `blank`

---

#### `printBlank()`
Inserts an empty spacer line. Used to add breathing room between sections.

```js
printBlank()
```

---

#### `printPrompt(cmd)`
Echoes the command the user just typed as a styled prompt line in the history.

```js
printPrompt('skills')
// renders: visitor@btdev.com:~$ skills
```

Called automatically by the input handler — you do not need to call this inside command functions.

---

#### `esc(s)`
Escapes HTML special characters in a string. Always use this when inserting user-typed input into innerHTML to prevent XSS.

```js
esc('<script>')  // returns '&lt;script&gt;'
```

---

#### `scrollToBottom()`
Scrolls the output area to the very bottom. Uses `requestAnimationFrame` to wait for DOM paint before measuring.

```js
scrollToBottom()
```

Called automatically after every command. You rarely need to call this manually unless you're adding content asynchronously.

---

#### `hideInput()` / `showInput()`
Hides or reveals the input prompt line. The input is hidden while a command is processing so the user does not see it jump before the result renders.

```js
hideInput()   // called immediately on Enter
showInput()   // called after command output is rendered
```

`showInput()` also calls `scrollToBottom()` and defers `hiddenInput.focus()` by one tick to reliably reclaim keyboard focus after any button-click blur events.

---

### Command Functions

All commands follow the same pattern: call `printBlank()` to open, render content using `print()` and DOM manipulation, call `printBlank()` to close.

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
  snake:      cmdSnake,
};
```

The key is the string the user must type. The value is the function that runs.

---

#### `cmdHelp()`
Renders a two-column grid listing all available commands and their descriptions. Also prints the easter egg hint at the bottom.

---

#### `cmdNeofetch()`
Renders a neofetch-style profile card: the BT ASCII logo on the left, profile key-value pairs and a colour palette bar on the right.

---

#### `cmdAbout()`
Prints the personal bio. Plain `print()` calls with paragraph spacing.

---

#### `cmdSkills()`
Renders the tech stack as a labelled list. Each row is a `print()` call with inline styles for the category label and value.

---

#### `cmdExperience()`
Renders work history with company name, title, dates, and bullet points.

---

#### `cmdEducation()`
Renders academic background with institution, degree, and graduation year.

---

#### `cmdContact()`
Renders links as `<a>` elements. Opens in a new tab (`target="_blank"`). Each link is built as a DOM element rather than using `print()` so the href can be set safely.

---

#### `cmdClear()`
Removes all child elements from the output area except the input line, and resets the typed text. Does not require a delay — runs instantly.

---

### Snake Game (Internal)

`cmdSnake()` is the entry point. It builds the entire game UI, injects it into the output, and sets up its own internal event loop. All game state and functions are scoped inside `cmdSnake` to avoid polluting the global scope.

#### Game state

```js
let snake    // Array of {x, y} objects, head-first
let dir      // Current movement direction {x, y}
let nextDir  // Queued next direction (prevents mid-tick reversals)
let food     // Current food position {x, y}
let score    // Current score (integer)
let loopId   // setInterval ID for the game tick
let state    // 'idle' | 'running' | 'dead'
```

#### Internal functions

| Function | Purpose |
|----------|---------|
| `teardown()` | Clears the game interval and removes the keyboard listener. Called before any exit. |
| `exitGame()` | Calls `teardown()`, removes the snake DOM block, resets `locked`, and restores the terminal input. |
| `spawnFood()` | Returns a random `{x, y}` position not occupied by any snake segment. |
| `resetGame()` | Initialises snake, direction, score, and food, then starts the tick interval. Always initialises `snake` before calling `spawnFood()` (critical — spawnFood reads snake). |
| `handleDir(key)` | Accepts an arrow key string and updates `nextDir`. Prevents 180° reversals. If called while `state === 'dead'`, triggers `resetGame()` instead. |
| `tick()` | One game frame. Moves the snake, checks collisions, eats food, updates score. Transitions to `dead` state on collision. |
| `draw()` | Redraws the canvas: background, food, snake body, score text. |
| `keyHandler(e)` | Document-level keyboard listener. Handles arrow keys, `R` to restart, `Escape` to exit. Registered on `document` (not the canvas) so no focus is required. |

#### Exit paths

There are three ways to exit the snake game, all of which call `exitGame()`:

1. Click the **exit game** button in the game-over/start overlay
2. Click the **exit game** button below the d-pad (always visible)
3. Press `Escape` at any time

---

### Input Handler

The `keydown` listener on `hiddenInput` is the terminal's main event loop.

```
User presses Enter
  → echo command to history (printPrompt)
  → hide input line
  → set locked = true
  → wait 750ms
    → run matching command function OR print error
    → set locked = false
    → show input line
    → scroll to bottom
```

The 750ms delay is intentional — it simulates a terminal processing commands rather than snapping instantly, which feels more authentic.

---

## SCSS Reference

### Variables

All design tokens are defined at the top of `styles.scss`. Change these to retheme the entire site.

```scss
$bg:          #1e1e2e;   // Main background (Dracula base)
$bg-dark:     #181825;   // Slightly darker surfaces
$surface:     #313244;   // Cards, buttons, borders
$surface-hi:  #45475a;   // Hover state for surfaces
$text:        #cdd6f4;   // Primary text
$text-muted:  #6c7086;   // Secondary / hint text
$text-dim:    #45475a;   // Very faint text
$purple:      #bd93f9;   // Accent — caret, prompt colour, glow
$purple-soft: #cba6f7;   // Softer purple for headings
$green:       #a6e3a1;   // Success / banner text
$red:         #f38ba8;   // Errors
$yellow:      #f9e2af;   // Warnings / easter egg
$cyan:        #89dceb;   // Links
$blue:        #89b4fa;   // Info
$mono:        'Courier New', Courier, monospace;  // Font stack
```

### Sections

| Selector | Purpose |
|----------|---------|
| `#terminal-root` | Full-viewport flex container — the outermost shell |
| `.banner-area` | Top section with ASCII art and welcome text |
| `.banner-area__mac` | The isometric Mac ASCII art block |
| `.banner-area__btdev` | The BT DEV title art block |
| `.glow-cmd` | The glowing purple `'help'` text style |
| `.output-area` | Scrollable command output area |
| `.line` | Base class for all output lines |
| `.line--{modifier}` | Colour variants: `white`, `green`, `purple`, `yellow`, `error`, `muted`, `cmd`, `blank` |
| `.input-inline` | The prompt row containing label + fake input |
| `.prompt-label` | `visitor@btdev.com:~$` text |
| `.fake-input` | Container for typed text + blinking caret |
| `.fake-input__caret` | The blinking block cursor (animated via `@keyframes blink`) |
| `#hidden-input` | The invisible real input element |
| `.neo` | Neofetch output layout (flex row) |
| `.neo__*` | BEM elements: `ascii`, `info`, `title`, `sep`, `row`, `key`, `val`, `bar`, `dot` |
| `.help-table` | Two-column CSS grid for the help listing |
| `.snake-wrap` | Relative wrapper so the overlay can be positioned over the canvas |
| `.snake-overlay` | Semi-transparent overlay with start/restart/exit buttons |
| `.snake-dpad` | On-screen directional pad grid |

---

## How to Make Updates

### Updating personal info

All personal content lives in `main.js`. Each command function is self-contained and straightforward to edit.

**Bio (`cmdAbout`)**
```js
function cmdAbout() {
  // Edit the print() calls below
  print("Your new bio line here.");
}
```

**Skills (`cmdSkills`)**
```js
// Add, remove, or edit rows in this array:
[
  ['frontend', 'React · Vue · ...'],
  ['your new category', 'tool1 · tool2'],
]
```

**Experience (`cmdExperience`)**
```js
// Duplicate this block for multiple roles:
print('<span style="color:#cba6f7;">Company Name</span>');
print('Your Title', 'green');
print('Start – End  ·  Location', 'muted');
printBlank();
print('› Bullet point one');
```

**Contact links (`cmdContact`)**
```js
[
  ['email',    'you@email.com',   'mailto:you@email.com'],
  ['github',   'github.com/you',  'https://github.com/you'],
  ['linkedin', 'linkedin.com/in/you', 'https://linkedin.com/in/you'],
  // Add more rows here:
  ['twitter',  'twitter.com/you', 'https://twitter.com/you'],
]
```

---

### Adding a new command

**Step 1** — Write the function in `main.js`:

```js
function cmdProjects() {
  printBlank();
  print('projects', 'purple');
  printBlank();
  print('<span style="color:#cba6f7;">Project Name</span>');
  print('A short description of what it does.', 'muted');
  print('github.com/BotsheloT/project  ·  live: yoursite.com', 'white');
  printBlank();
}
```

**Step 2** — Register it in the `COMMANDS` object:

```js
const COMMANDS = {
  // ...existing commands...
  projects: cmdProjects,   // ← add this line
};
```

**Step 3** — Add it to the help listing inside `cmdHelp()`:

```js
['projects', 'things i have built'],
```

That's it. The command is now live.

---

### Removing a command

1. Delete the function from `main.js`
2. Remove its entry from the `COMMANDS` object
3. Remove its row from the array inside `cmdHelp()`

---

### Changing the colour theme

All colours are SCSS variables at the top of `styles.scss`. Edit them and recompile.

Example — switching to an amber/dark theme:

```scss
$bg:      #1a1400;
$purple:  #f5a623;
$green:   #e8d44d;
```

Then recompile (see below).

---

### Editing the SCSS and recompiling

After any change to `styles.scss`, compile to `styles.css`:

**Option A — Sass CLI (recommended)**

```bash
# Install once
npm install -g sass

# Compile once
sass styles.scss styles.css

# Or watch for changes automatically
sass --watch styles.scss:styles.css
```

**Option B — Python (libsass)**

```bash
pip install libsass

python3 -c "
import sass
css = sass.compile(filename='styles.scss', output_style='expanded')
open('styles.css','w').write(css)
"
```

**Always commit both `styles.scss` and the recompiled `styles.css`** — GitHub Pages serves static files and will not compile SCSS automatically.

---

### Changing the command delay

The 750ms processing delay is set in the input handler at the bottom of `main.js`:

```js
setTimeout(() => {
  // command runs here
}, 750);  // ← change this value (milliseconds)
```

---

### Adding a new colour modifier for `print()`

1. Add a new modifier class to `styles.scss`:

```scss
.line {
  &--orange { color: #fab387; }
}
```

2. Recompile.

3. Use it:

```js
print('something orange', 'orange');
```

---

## Deployment (GitHub Pages)

```bash
# 1. Create a new repo on GitHub (e.g. "portfolio")

# 2. Initialise and push
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/portfolio.git
git push -u origin main

# 3. Enable GitHub Pages
# Go to: Settings → Pages → Source → Deploy from branch → main → / (root)
# Your site will be live at: https://YOUR_USERNAME.github.io/portfolio
```

**Custom domain** — add a file named `CNAME` to the root of the repo containing just your domain:

```
btdev.com
```

Then point your domain's DNS to GitHub Pages following their documentation.

---

## Known Behaviours

| Behaviour | Reason |
|-----------|--------|
| The terminal ignores input while a command is processing | `locked = true` during the 750ms delay — intentional |
| Clicking anywhere on the terminal refocuses input | A click listener on `#terminal-root` calls `hiddenInput.focus()` unless clicking a button or canvas |
| Arrow keys are captured while snake is active | The snake's `keyHandler` is attached to `document` and calls `e.preventDefault()` on arrow keys to stop the page scrolling |
| Pressing `Escape` exits the snake game | Registered in the same `keyHandler` |
| Running `clear` while snake is active ends the game | A `MutationObserver` watches for the canvas being removed from the DOM and calls `teardown()` automatically |
| `styles.css` is in the repo alongside `styles.scss` | Required for GitHub Pages — no build pipeline runs on push |
