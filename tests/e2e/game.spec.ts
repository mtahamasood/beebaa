import { expect, test } from '@playwright/test';

// X takes the top row: X 0, O 3, X 1, O 4, X 2.
const X_WIN_CLICKS = [
  'top left, empty',
  'middle left, empty',
  'top center, empty',
  'middle center, empty',
  'top right, empty',
];

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByText("X's turn")).toBeVisible();
});

test('two-player win: names winner, highlights the line, scores once', async ({
  page,
}) => {
  for (const label of X_WIN_CLICKS) {
    await page.getByRole('button', { name: label }).click();
  }
  await expect(page.getByText('X wins!')).toBeVisible();
  await expect(page.locator('.square--winning')).toHaveCount(3);
  await expect(
    page.getByRole('button', { name: 'top left, X, winning' }),
  ).toBeVisible();
  await expect(
    page.getByText('X wins', { exact: true }).locator('..'),
  ).toContainText('1');
});

test('draw: all squares filled with no line increments the draw count', async ({
  page,
}) => {
  // X: 0,2,3,7,8 / O: 1,4,5,6 — no three aligned.
  const clicks = [0, 1, 2, 4, 3, 5, 7, 6, 8];
  for (const index of clicks) {
    await page.locator('.square').nth(index).click();
  }
  await expect(page.getByText("It's a draw.")).toBeVisible();
  await expect(page.getByText('Draws').locator('..')).toContainText('1');
});

test('restart clears the board but keeps the score', async ({ page }) => {
  for (const label of X_WIN_CLICKS) {
    await page.getByRole('button', { name: label }).click();
  }
  await page.getByRole('button', { name: 'Restart' }).click();
  await expect(page.getByText("X's turn")).toBeVisible();
  await expect(page.locator('.square', { hasText: /X|O/ })).toHaveCount(0);
  await expect(
    page.getByText('X wins', { exact: true }).locator('..'),
  ).toContainText('1');
});

test('scores survive a reload; reset zeroes them persistently', async ({
  page,
}) => {
  for (const label of X_WIN_CLICKS) {
    await page.getByRole('button', { name: label }).click();
  }
  await page.reload();
  await expect(
    page.getByText('X wins', { exact: true }).locator('..'),
  ).toContainText('1');

  await page.getByRole('button', { name: 'Reset scores' }).click();
  await page.reload();
  await expect(
    page.getByText('X wins', { exact: true }).locator('..'),
  ).toContainText('0');
});

test('vs computer: locks input during the reply and answers optimally', async ({
  page,
}) => {
  await page.getByLabel('Vs computer').check();
  await page.getByRole('button', { name: 'top left, empty' }).click();

  await expect(page.getByText('Computer is thinking…')).toBeVisible();
  // Clicking while the computer thinks is ignored.
  await page.getByRole('button', { name: 'top right, empty' }).click();
  await expect(
    page.getByRole('button', { name: 'top right, empty' }),
  ).toBeVisible();

  // Optimal answer to a corner opening is the center.
  await expect(
    page.getByRole('button', { name: 'middle center, O' }),
  ).toBeVisible();
  await expect(page.getByText("X's turn")).toBeVisible();
});

test('switching mode mid-game clears the board and keeps scores', async ({
  page,
}) => {
  for (const label of X_WIN_CLICKS) {
    await page.getByRole('button', { name: label }).click();
  }
  await page.getByLabel('Vs computer').check();
  await expect(page.locator('.square', { hasText: /X|O/ })).toHaveCount(0);
  await expect(
    page.getByText('X wins', { exact: true }).locator('..'),
  ).toContainText('1');
});

test('keyboard only: squares are focusable and Enter places a mark', async ({
  page,
}) => {
  const square = page.getByRole('button', { name: 'top left, empty' });
  await square.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'top left, X' })).toBeVisible();
  await expect(page.getByText("O's turn")).toBeVisible();
});
