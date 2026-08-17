// Headless smoke driver for beebaa (tic-tac-toe).
// Usage: node .claude/skills/run-beebaa/driver.mjs [url]
//   - Starts the Vite dev server itself if the url isn't already serving.
//   - Plays a two-player round to an X win, then a vs-computer round.
//   - Screenshots land in .claude/skills/run-beebaa/shots/ (gitignored).
//   - Exits non-zero on any failed expectation or console error.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const APP_URL = process.argv[2] ?? 'http://localhost:5173';
const SHOT_DIR = new URL('./shots/', import.meta.url).pathname;
mkdirSync(SHOT_DIR, { recursive: true });

// Rootless chromium libs (see setup-deps.sh) — harmless if absent.
const LIBS = `${process.env.HOME}/.cache/beebaa-chromium-libs/root/usr/lib/x86_64-linux-gnu`;
if (existsSync(LIBS)) {
  process.env.LD_LIBRARY_PATH = process.env.LD_LIBRARY_PATH
    ? `${LIBS}:${process.env.LD_LIBRARY_PATH}`
    : LIBS;
}

const up = () => fetch(APP_URL).then((r) => r.ok, () => false);

let server = null;
if (!(await up())) {
  console.log(`starting dev server (nothing serving at ${APP_URL})`);
  // detached → own process group, so we can kill vite, not just the npm wrapper
  server = spawn('npm', ['run', 'dev'], { detached: true, stdio: 'ignore' });
  const deadline = Date.now() + 30_000;
  while (!(await up())) {
    if (Date.now() > deadline) throw new Error('dev server did not come up in 30s');
    await new Promise((r) => setTimeout(r, 500));
  }
}

const failures = [];
const expect = (cond, msg) => {
  console.log(`${cond ? 'ok' : 'FAIL'} - ${msg}`);
  if (!cond) failures.push(msg);
};

const errors = [];
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const page = await (
    await browser.newContext({ viewport: { width: 480, height: 800 } })
  ).newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(APP_URL);
  await page.getByText('Tic-Tac-Toe').waitFor();
  await page.evaluate(() => localStorage.clear()); // deterministic scoreboard
  await page.reload();
  await page.getByText("X's turn").waitFor();
  await page.screenshot({ path: SHOT_DIR + '1-fresh.png' });

  const sq = (label) => page.getByLabel(label, { exact: false });

  // Two-player: X takes the top row.
  await sq('top left, empty').click();
  await sq('middle center, empty').click(); // O
  await sq('top center, empty').click(); // X
  await sq('bottom right, empty').click(); // O
  await sq('top right, empty').click(); // X wins
  await page.getByText('X wins!').waitFor();
  expect((await page.locator('.square--winning').count()) === 3, 'winning line highlighted');
  const xWins = await page.locator('.scoreboard__item dd').first().innerText();
  expect(xWins === '1', `X score incremented once (got ${xWins})`);
  await page.screenshot({ path: SHOT_DIR + '2-x-wins.png' });

  // Vs computer: corner opening; optimal reply is the center.
  await page.getByLabel('Vs computer').click();
  await sq('top left, empty').click();
  await page.getByText('Computer is thinking…').waitFor();
  await page.getByLabel('middle center, O').waitFor();
  expect(true, 'computer replied in the center after the thinking delay');
  await page.screenshot({ path: SHOT_DIR + '3-vs-computer.png' });

  expect(errors.length === 0, `no console errors (got ${JSON.stringify(errors)})`);
} finally {
  await browser.close();
  if (server) {
    try { process.kill(-server.pid, 'SIGTERM'); } catch { /* already gone */ }
  }
}

console.log(`screenshots: ${SHOT_DIR}`);
if (failures.length > 0) {
  console.error(`\n${failures.length} expectation(s) failed`);
  process.exit(1);
}
console.log('\nsmoke passed');
