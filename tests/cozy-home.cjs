const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');
const root = path.join(__dirname, '..');
const output = path.join(root, 'previews/cozy-home-v1');
const url = process.env.HOME_TEST_URL || 'http://127.0.0.1:4173';
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  let server, browser, page;
  const checks = [], errors = [], unexpectedWrites = [];
  fs.mkdirSync(output, { recursive: true });
  try {
    if (!process.env.HOME_TEST_URL) {
      server = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { cwd: root, stdio: 'pipe' });
      let serverLog = '';
      server.stdout.on('data', data => { serverLog += data; });
      server.stderr.on('data', data => { serverLog += data; });
      let available = false;
      for (let i = 0; i < 100; i++) {
        if (server.exitCode !== null) throw Error(serverLog);
        try { available = (await fetch(url)).ok; } catch {}
        if (available) break;
        await pause(100);
      }
      assert(available, 'production preview must start');
    }
    browser = await chromium.launch({
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
      args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
    });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Shanghai', reducedMotion: 'reduce', permissions: ['geolocation'], geolocation: { latitude: 37.56, longitude: 126.97 }, serviceWorkers: 'block' });
    await context.route('https://api.open-meteo.com/**', route => route.fulfill({ json: { current: { weather_code: 61, is_day: 1 } } }));
    await context.route('https://chat.izumi-xixi.com/**', route => {
      if (route.request().method() !== 'GET') unexpectedWrites.push(route.request().url());
      return route.fulfill({ json: { letters: [], messages: [] } });
    });
    await context.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'image/webp', body: fs.readFileSync(path.join(root, 'src/assets/chat/wangshu.webp')) }));
    await context.addInitScript(() => {
      sessionStorage.setItem('fox-splash-seen', '1');
      if (!localStorage.getItem('fox-window-pref')) localStorage.setItem('fox-window-pref', 'sun');
    });
    page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(20000);
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.install({ time: new Date('2026-11-17T08:00:00Z') });
    await page.goto(url);
    const home = () => page.locator('.cozy-home');
    const button = name => page.getByRole('button', { name, exact: true });
    const settle = async () => {
      await home().waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(() => [...document.querySelectorAll('.cozy-home img')].every(img => img.complete && img.naturalWidth));
    };
    await settle();
    assert.match(await page.locator('.cozy-together').innerText(), /46/);
    assert.match(await page.locator('.cozy-date').innerText(), /11.17/);
    assert(await button('日记').isDisabled());
    assert.equal(await page.getByRole('button', { name: '塔罗', exact: true }).count(), 0);
    console.log('PASS:', checks.length + 1); checks.push('real date/day count and honest unavailable diary state');

    await button('去聊聊天').click();
    await page.locator('.chat-list-page').waitFor();
    await button('返回首页').click();
    await settle();
    console.log('PASS:', checks.length + 1); checks.push('existing chat-list entrance and return');
    for (const [label, selector] of [['饼干盒信箱', '.letterbox-page'], ['拉钩本', '.promise-page'], ['我们的请帖', '.invite-page']]) {
      await page.getByRole('button', { name: new RegExp('^' + label) }).click();
      await page.locator(selector).waitFor();
      await button('返回首页').click();
      await settle();
    }
    console.log('PASS:', checks.length + 1); checks.push('all3 new home shortcuts return to home');
    await button('更多').click();
    await page.locator('.sticker-page').waitFor();
    await page.locator('.sticker').filter({ hasText: '拉钩本' }).click();
    await page.locator('.promise-page').waitFor();
    await button('回贴纸本').click();
    await page.locator('.sticker-page').waitFor();
    await button('首页').click();
    await settle();
    console.log('PASS:', checks.length + 1); checks.push('sticker-book detail return stays on sticker book');

    await button('记下今天').click();
    await page.locator('.memories-page').waitFor();
    await page.getByPlaceholder('这一天想记住的一句话……').fill('首页验收：留住今天。');
    await button('贴上').click();
    await page.getByText('首页验收：留住今天。', { exact: true }).waitFor();
    await button('返回').click();
    await settle();
    await button('记下今天').click();
    await page.getByText('首页验收：留住今天。', { exact: true }).waitFor();
    await button('返回').click();
    await settle();
    console.log('PASS:', checks.length + 1); checks.push('record-today uses existing memory editor and local persistence');

    const radios = page.getByRole('radiogroup', { name: '选择窗外天气' });
    for (const [label, pref, scene] of [['雨', 'rain', 'rain'], ['雪', 'snow', 'snow'], ['晴', 'sun', 'day'], ['自动', 'auto', 'rain']]) {
      await radios.getByRole('radio', { name: label, exact: true }).click();
      await page.waitForFunction(([pref, scene]) => localStorage.getItem('fox-window-pref') === pref && document.documentElement.dataset.scene === scene && document.querySelector('.cozy-home').dataset.scene === scene, [pref, scene]);
      await page.waitForFunction(() => document.querySelector('.cozy-window-photo img').src === document.querySelector('.window-scene:last-child .window-outside').src);
    }
    await radios.getByRole('radio', { name: '晴', exact: true }).click();
    await radios.getByRole('radio', { name: '晴', exact: true }).focus();
    await page.keyboard.press('ArrowLeft');
    await page.waitForFunction(() => localStorage.getItem('fox-window-pref') === 'snow');
    await page.reload();
    await settle();
    assert.equal(await page.locator('.cozy-home').getAttribute('data-scene'), 'snow');
    console.log('PASS:', checks.length + 1); checks.push('weather presets, mocked auto weather, arrow keys, persisted preference and shared window picture');

    const upload = Buffer.from(await page.evaluate(() => {
      const c = document.createElement('canvas'); c.width = 90; c.height = 60;
      const g = c.getContext('2d'); g.fillStyle = '#7b9c86'; g.fillRect(0, 0, 90, 60); g.fillStyle = '#edc7ad'; g.fillRect(10, 10, 36, 36);
      return c.toDataURL().split(',')[1];
    }), 'base64');
    const space = page.locator('.polaroid-space');
    const fallback = await space.locator('img').getAttribute('src');
    await button('更换我们的空间照片').click();
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), space.getByRole('button', { name: '换一张', exact: true }).click()]);
    await chooser.setFiles({ name: 'home-test.png', mimeType: 'image/png', buffer: upload });
    await page.waitForFunction(() => document.querySelector('.polaroid-space img').src.startsWith('blob:'));
    await page.reload(); await settle();
    await page.waitForFunction(() => document.querySelector('.polaroid-space img').src.startsWith('blob:'));
    await button('更换我们的空间照片').click();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.polaroid-menu').count(), 0);
    assert(await button('更换我们的空间照片').evaluate(el => el === document.activeElement));
    await button('更换我们的空间照片').click();
    await space.getByRole('button', { name: '换回原图', exact: true }).click();
    await page.waitForFunction(src => document.querySelector('.polaroid-space img').getAttribute('src') === src, fallback);
    console.log('PASS:', checks.length + 1); checks.push('space photo upload, IndexedDB reload, reset and Escape focus return');

    const chatPhoto = button('打开聊天');
    await chatPhoto.scrollIntoViewIfNeeded();
    const rect = await chatPhoto.boundingBox();
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
    await page.mouse.down(); await page.clock.runFor(650); await page.mouse.up();
    assert.equal(await home().count(), 1);
    await page.locator('.polaroid-chat .polaroid-menu').waitFor();
    await page.keyboard.press('Escape');
    await chatPhoto.focus(); await page.keyboard.press('Enter');
    await page.locator('.chat-list-page').waitFor();
    await button('返回首页').click(); await settle();
    console.log('PASS:', checks.length + 1); checks.push('long press edits instead of navigating; keyboard Enter opens photo entrance');

    const radiogroup = page.getByRole('radiogroup', { name: '选择窗外天气' });
    await radiogroup.getByRole('radio', { name: '雨', exact: true }).click();
    const [viewChooser] = await Promise.all([page.waitForEvent('filechooser'), button('换张窗外的风景').click()]);
    await viewChooser.setFiles({ name: 'window-test.png', mimeType: 'image/png', buffer: upload });
    await page.waitForFunction(() => document.querySelector('.cozy-window-photo img').src.startsWith('blob:') && document.querySelector('.cozy-window-photo img').src === document.querySelector('.window-scene:last-child .window-outside').src);
    await page.reload(); await settle();
    await page.waitForFunction(() => document.querySelector('.cozy-window-photo img').src.startsWith('blob:'));
    await button('换回原景').click();
    await page.waitForFunction(() => !document.querySelector('.cozy-window-photo img').src.startsWith('blob:'));
    console.log('PASS:', checks.length + 1); checks.push('custom window is shared, persists, and resets');

    const heart = button('送一颗爱心，长按感受心跳');
    await heart.scrollIntoViewIfNeeded();
    const h = await heart.boundingBox();
    await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2); await page.mouse.down(); await page.clock.runFor(450);
    assert(await page.locator('.heartbeat').evaluate(el => el.classList.contains('is-on')));
    await page.mouse.up();
    assert.equal(await page.locator('.heartbeat').evaluate(el => el.classList.contains('is-on')), false);
    console.log('PASS:', checks.length + 1); checks.push('existing hold heartbeat starts and stops');

    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 950 }); await settle();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'overflow at ' + width);
      for (const selector of ['.cozy-primary', '.cozy-secondary', '.cozy-doors', '.cozy-days']) {
        const b = await page.locator(selector).boundingBox(); assert(b.x >= 0 && b.x + b.width <= width, selector + ' fits ' + width);
      }
      const note = await page.locator('.cozy-note').boundingBox();
      const album = await page.locator('.cozy-album').boundingBox();
      assert(note.y + note.height <= album.y + album.height + 8, 'note contained at ' + width);
    }
    console.log('PASS:', checks.length + 1); checks.push('320/390 mobile,768 tablet,1440 desktop fit without overlapping note');
    await button('收起页面，只看风景').click();
    assert.equal(await button('去聊聊天').isVisible(), false);
    assert(await button('回到小窝').isVisible());
    await button('回到小窝').click();
    assert(await button('去聊聊天').isVisible());
    console.log('PASS:', checks.length + 1); checks.push('scenery-only mode hides and restores home controls');
    // Visual captures use fresh device storage, never the test photo or entry.
    const visual = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Shanghai', reducedMotion: 'reduce', deviceScaleFactor: 1, serviceWorkers: 'block' });
    await visual.addInitScript(() => { sessionStorage.setItem('fox-splash-seen', '1'); localStorage.setItem('fox-window-pref', 'sun'); });
    const capture = await visual.newPage(); capture.on('pageerror', e => errors.push(e.message));
    await capture.clock.install({ time: new Date('2026-11-17T08:00:00Z') });
    await capture.goto(url); await capture.evaluate(() => document.fonts.ready);
    await capture.waitForFunction(() => [...document.querySelectorAll('.cozy-home img')].every(i => i.complete && i.naturalWidth));
    await capture.waitForTimeout(500);
    await capture.screenshot({ path: path.join(output, 'mobile.png') });
    await capture.locator('.cozy-album').scrollIntoViewIfNeeded();
    await capture.waitForTimeout(350);
    await capture.screenshot({ path: path.join(output, 'mobile-details.png') });
    await capture.evaluate(() => window.scrollTo(0, 0));
    await capture.setViewportSize({ width: 1440, height: 1080 });
    await capture.waitForTimeout(500);
    await capture.screenshot({ path: path.join(output, 'desktop.png') });
    await capture.clock.setFixedTime(new Date('2026-11-17T14:00:00Z'));
    await capture.getByRole('radio', { name: '雨', exact: true }).click();
    await capture.getByRole('radio', { name: '晴', exact: true }).click();
    await capture.waitForFunction(() => document.querySelector('.cozy-home').dataset.scene === 'night');
    await capture.waitForTimeout(1500);
    await capture.setViewportSize({ width: 390, height: 844 });
    await capture.evaluate(() => window.scrollTo(0, 0));
    await capture.waitForTimeout(500);
    await capture.screenshot({ path: path.join(output, 'night-mobile.png') });
    await capture.getByRole('button', { name: '收起页面，只看风景', exact: true }).click();
    await capture.waitForTimeout(350);
    await capture.screenshot({ path: path.join(output, 'scenery-only.png') });
    console.log('PASS:', checks.length + 1); checks.push('day and night visual captures with clean device storage');
    assert.deepEqual(errors, []); assert.deepEqual(unexpectedWrites, []);
    const result = { result: 'passed', checks, pageErrors: errors, externalMessageWrites: unexpectedWrites, testedAgainst: 'production build' };
    fs.writeFileSync(path.join(output, 'verification.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    if (page) await page.screenshot({ path: '/tmp/cozy-home-failure.png', fullPage: true }).catch(() => {});
    throw error;
  } finally {
    if (browser) await browser.close();
    if (server) server.kill('SIGTERM');
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
