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

  it('serves a bridge-only callback and broadcasts a popup response without bootstrapping Angular', async () => {
    const html = await page.evaluate(async () => {
      const response = await fetch('/redirect');
      if (!response.ok) {
        throw new Error(`Redirect page returned HTTP ${response.status}`);
      }
      return response.text();
    });
    expect(html).not.toContain('<app-root');

    const id = randomUUID();
    const state = Buffer.from(
      JSON.stringify({ id, meta: { interactionType: 'popup' } })
    ).toString('base64');
    const url = `http://localhost:${port}/redirect#code=test-bridge-code&state=${encodeURIComponent(
      state
    )}`;

    const response = await page.evaluate(
      ({ id, url }) =>
        new Promise<{ v: number; payload: string }>((resolve, reject) => {
          const channel = new BroadcastChannel(id);
          const timeout = window.setTimeout(() => {
            channel.close();
            reject(new Error('Redirect bridge did not broadcast the response'));
          }, 10000);
          channel.onmessage = (event) => {
            window.clearTimeout(timeout);
            channel.close();
            resolve(event.data);
          };
          if (!window.open(url)) {
            window.clearTimeout(timeout);
            channel.close();
            reject(new Error('Popup window was not opened'));
          }
        }),
      { id, url }
    );

    expect(response.v).toBe(1);
    const params = new URLSearchParams(response.payload);
    expect(params.get('code')).toBe('test-bridge-code');
    expect(params.get('state')).toBe(state);
  });
});
