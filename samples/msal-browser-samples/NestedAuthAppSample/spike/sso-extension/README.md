# SSO Extension E2E Wiring — Puppeteer vs Playwright Spike

Branch: `js-wam/naa-sso-extension-spike` (stacked on `js-wam/naa-sample`)
Goal: wire the Microsoft SSO extension (JS-WAM platform broker) into the NAA
e2e tests. Compare Puppeteer vs Playwright and identify the real blockers.

## TL;DR

The "can't load the SSO extension" problem was **never really about Puppeteer
vs Playwright**. It was two things:

1. **The wrong loading mechanism.** WAM's native messaging host
   (`C:\Windows\BrowserCore\manifest.json`) hard-codes `allowed_origins` to
   exactly three canonical extension IDs. `--load-extension` (unpacked) yields
   a *path-derived* ID that the native host rejects → broker never engages.
   Only the **canonically-installed Store extension** (`ppnbnpeolgkicgegkbkbjmhlideopiji`)
   can talk to `BrowserCore.exe`.
2. **The automation tools' default flags.** Both Puppeteer and Playwright
   launch Chrome with `--disable-extensions` and `--disable-background-networking`
   by default, which (a) turns off all extensions and (b) blocks the
   force-install CRX download.

Once you launch **branded Chrome** (not bundled Chromium) with a **fresh
`userDataDir`** and **strip those default flags**, the machine's
`ExtensionInstallForcelist` policy installs the canonical extension — with its
canonical ID intact — into the throwaway profile automatically. This works in
**both tools** and in **both headful and new-headless** modes.

## Empirical results (this AAD-joined, WAM-enabled machine)

| Variant                     | Launch | Canonical extension on disk |
| --------------------------- | ------ | --------------------------- |
| Puppeteer headful           | ~1.1s  | ✅ ~3.1s                     |
| Puppeteer headless (new)    | ~1.1s  | ✅ ~3.1s                     |
| Playwright headful          | ~1.4s  | ✅ ~3.4s                     |
| Playwright headless (new)   | ~1.8s  | ✅ ~3.8s                     |

Detection note: the extension is MV3, so its service worker is dormant —
`browser.targets()` / `context.serviceWorkers()` will NOT list it until woken.
Reliable detection = check `<userDataDir>\Default\Extensions\<id>` on disk (or
wake the worker).

Required launch recipe (both tools):
- Branded Chrome: Puppeteer `executablePath`, Playwright `channel: "chrome"`.
- Fresh throwaway `userDataDir` (avoids the single-instance profile lock — the
  historical blocker #3).
- `ignoreDefaultArgs: ['--disable-extensions', '--disable-background-networking',
  '--disable-component-extensions-with-background-pages', '--disable-default-apps',
  '--disable-sync']`.

## Environment prerequisites (must hold on the test agent)

- Windows, **AzureAdJoined = YES**, **WamDefaultSet = YES** (this machine ✔).
- `C:\Windows\BrowserCore\BrowserCore.exe` present + native-host manifest
  registered under `...\NativeMessagingHosts\com.microsoft.browsercore` (✔).
- `ExtensionInstallForcelist` (HKLM) includes `ppnbnpeolgkicgegkbkbjmhlideopiji`
  (✔ on this machine — entry 55).
- Branded Google Chrome installed (policies apply to Chrome, not Chromium).

⇒ The hosted Linux CI pool can NOT satisfy these. The true-broker e2e must run
on a **self-hosted, AAD-joined Windows agent**. The existing web-flow bridge
test stays the CI-able assertion; the broker path is an opt-in / self-hosted
smoke test.

## Puppeteer vs Playwright — the actual differentiators

Extension loading is a tie (both work). The remaining differences are runtime
robustness and harness fit:

**Playwright advantages**
- Auto-waiting locators eliminate the `Attempted to use detached Frame` class
  of flakiness that MSAL popups caused in Puppeteer (historical blocker #2:
  host `mainFrame()` detaches after the popup, then `ConnectionClosedError` on
  `context.close()`).
- `launchPersistentContext` is a first-class API purpose-built for
  profile-based (extension) automation.
- Extensions work in the **new headless** mode.
- Already in the repo (`playwright@1.61.1`); `TestingSample` and the Electron
  suites (`e2eTestUtils/src/ElectronPlaywrightTestUtils.ts`) use it → prior art
  for a parallel harness.

**Puppeteer advantages**
- Zero migration for the NAA test — it already uses the shared jest-puppeteer
  harness that 27 samples depend on.
- Extension loading + new-headless work fine (proven above).

**Cost of each path**
- Puppeteer: keep the shared harness, but the popup detached-frame handling was
  the source of the historical flakiness; would need defensive teardown
  (`page.waitForFrame`, guarded `context.close()`).
- Playwright: a *parallel* harness for just the NAA broker test (like
  `TestingSample`), NOT a repo-wide migration. Isolates the broker test's
  special launch needs from the 27 shared-harness samples.

## Recommendation

1. **Keep the web-flow bridge test as the primary, CI-runnable NAA e2e** (no
   extension, runs on the hosted pool).
2. **Add the true-broker test as an opt-in, self-hosted-Windows-only spec.**
3. **Use Playwright `launchPersistentContext` for the broker spec** — the
   auto-wait model directly fixes the popup/detached-frame flakiness that was
   Puppeteer's blocker #2, headless works, and it lives as a small parallel
   harness (mirroring `TestingSample`) without disturbing the shared
   jest-puppeteer util.
4. Provision the automation profile via the existing forcelist policy + a fresh
   `userDataDir` and the strip-default-flags recipe above.

## Still to validate (needs sample servers + lab creds, interactive account)

- Run the full popup broker sign-in end-to-end and confirm the broker actually
  mints a token (not `native_extension_not_installed`).
- Confirm Playwright's auto-wait removes the detached-frame failure under the
  real popup flow.
- Decide whether the broker smoke test asserts a real token or just that the
  broker path is *reached* (extension present + native host responds).

## Spike artifacts (this folder)

Run with `NODE_PATH` pointed at the repo root `node_modules` (the sample dir
has no local install), e.g.:

```powershell
$env:NODE_PATH="<repo-root>\node_modules"; node spike-puppeteer.cjs
```

- `spike-puppeteer.cjs` — Puppeteer launch + disk detection (headful/new-headless
  via `PPTR_HEADLESS=new`).
- `spike-playwright.cjs` — Playwright `launchPersistentContext` (headful/new-headless
  via `PW_HEADLESS=new`).
- `spike-probe-disk.cjs` — first proof that the CRX lands in a throwaway profile.

