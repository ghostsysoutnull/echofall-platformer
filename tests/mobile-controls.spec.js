const { test, expect } = require("@playwright/test");

async function waitForTestApi(page) {
  await page.waitForFunction(() => !!window.__ECHOFALL_TEST_API__);
}

async function startPlaySession(page) {
  await page.evaluate(() => {
    window.__ECHOFALL_TEST_API__.startPlaying();
    window.__ECHOFALL_TEST_API__.resetLevel();
    window.__ECHOFALL_TEST_API__.clearInput();
  });
}

test.describe("Mobile emulation gameplay smoke", () => {
  test("loads game canvas and test API", async ({ page }) => {
    await page.goto("/game.html");
    await waitForTestApi(page);

    const canvasBox = await page.locator("#c").boundingBox();
    expect(canvasBox).not.toBeNull();
    expect(canvasBox.width).toBeGreaterThan(100);
    expect(canvasBox.height).toBeGreaterThan(50);

    const snapshot = await page.evaluate(() => window.__ECHOFALL_TEST_API__.getSnapshot());
    expect(snapshot).toBeTruthy();
    expect(snapshot.player).toBeTruthy();
  });

  test("movement, jump, and ability trigger work", async ({ page }) => {
    await page.goto("/game.html");
    await waitForTestApi(page);
    await startPlaySession(page);

    const before = await page.evaluate(() => window.__ECHOFALL_TEST_API__.getSnapshot());

    await page.evaluate(() => {
      const api = window.__ECHOFALL_TEST_API__;
      api.setKey("ArrowRight", true);
      api.runFrames(24);
      api.setKey("ArrowRight", false);
    });

    const afterMove = await page.evaluate(() => window.__ECHOFALL_TEST_API__.getSnapshot());
    expect(afterMove.player.x).toBeGreaterThan(before.player.x + 1);

    await page.evaluate(() => {
      const api = window.__ECHOFALL_TEST_API__;
      api.resetPlayerToSpawn();
      api.triggerJump();
    });
    const afterJump = await page.evaluate(() => window.__ECHOFALL_TEST_API__.getSnapshot());
    expect(afterJump.player.vy).toBeLessThan(0);

    const skillResult = await page.evaluate(() => {
      const api = window.__ECHOFALL_TEST_API__;
      api.selectCharacter("ROBOT");
      const result = api.triggerSkill();
      api.runFrames(1);
      return result;
    });
    expect(skillResult.characterName).toBe("ROBOT");
    expect(skillResult.activated).toBeTruthy();
  });

  test("pause toggle and restart reset player position", async ({ page }) => {
    await page.goto("/game.html");
    await waitForTestApi(page);
    await startPlaySession(page);

    const spawn = await page.evaluate(() => window.__ECHOFALL_TEST_API__.getSnapshot().player.x);

    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(500);
    await page.keyboard.up("ArrowRight");

    const movedX = await page.evaluate(() => window.__ECHOFALL_TEST_API__.getSnapshot().player.x);
    expect(movedX).toBeGreaterThan(spawn + 2);

    await page.keyboard.press("p");
    await expect.poll(async () => page.evaluate(() => window.__ECHOFALL_TEST_API__.getSnapshot().isPaused)).toBeTruthy();

    await page.keyboard.press("p");
    await expect.poll(async () => page.evaluate(() => window.__ECHOFALL_TEST_API__.getSnapshot().isPaused)).toBeFalsy();

    await page.keyboard.press("r");
    await page.waitForTimeout(150);

    const resetX = await page.evaluate(() => window.__ECHOFALL_TEST_API__.getSnapshot().player.x);
    expect(resetX).toBeLessThanOrEqual(spawn + 1.5);
  });
});
