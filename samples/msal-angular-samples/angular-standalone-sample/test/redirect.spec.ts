import * as puppeteer from 'puppeteer';
import { randomUUID } from 'crypto';

describe('/redirect (Bridge Page)', () => {
  let browser: puppeteer.Browser;
  let context: puppeteer.BrowserContext;
  let page: puppeteer.Page;
  let port: number;

  beforeAll(() => {
    // @ts-ignore
    browser = global.__BROWSER__;
    // @ts-ignore
    port = global.__PORT__;
  });

  beforeEach(async () => {
    context = await browser.createBrowserContext();
    page = await context.newPage();
    await page.goto(`http://localhost:${port}`);
    await page.waitForSelector("xpath/.//button[contains(., 'Login')]");
  });

  afterEach(async () => {
    await context.close();
  });

  it.each(['/redirect', '/redirect/'])(
    'bootstraps only the bridge component at %s and broadcasts the popup response',
    async (pathname) => {
      const id = randomUUID();
      const state = Buffer.from(
        JSON.stringify({ id, meta: { interactionType: 'popup' } })
      ).toString('base64');
      const url = `http://localhost:${port}${pathname}?callback=popup#code=test-bridge-code&state=${encodeURIComponent(
        state
      )}`;

      const [response] = await Promise.all([
        page.evaluate(
          ({ id }) =>
            new Promise<{ v: number; payload: string }>((resolve, reject) => {
              const channel = new BroadcastChannel(id);
              const timeout = window.setTimeout(() => {
                channel.close();
                reject(
                  new Error('Redirect bridge did not broadcast the response')
                );
              }, 10000);
              channel.onmessage = (event) => {
                window.clearTimeout(timeout);
                channel.close();
                resolve(event.data);
              };
              if (!window.open('about:blank')) {
                window.clearTimeout(timeout);
                channel.close();
                reject(new Error('Popup window was not opened'));
              }
            }),
          { id }
        ),
        (async () => {
          const target = await browser.waitForTarget(
            (target) => target.opener() === page.target(),
            { timeout: 10000 }
          );
          const popup = await target.page();
          if (!popup) {
            throw new Error('Popup target did not contain a page');
          }
          await popup.evaluateOnNewDocument(() => {
            // Keep the popup open to inspect which root component was bootstrapped.
            window.close = () => {};
          });
          await popup.goto(url);
          await popup.waitForSelector('app-root > p');
          expect(await popup.$('router-outlet')).toBeNull();
          expect(await popup.$('mat-toolbar')).toBeNull();
          expect(
            await popup.evaluate(() => ({
              hash: window.location.hash,
              search: window.location.search,
            }))
          ).toEqual({ hash: '', search: '?callback=popup' });
        })(),
      ]);

      expect(response.v).toBe(1);
      const params = new URLSearchParams(response.payload);
      expect(params.get('code')).toBe('test-bridge-code');
      expect(params.get('state')).toBe(state);
    }
  );
});
