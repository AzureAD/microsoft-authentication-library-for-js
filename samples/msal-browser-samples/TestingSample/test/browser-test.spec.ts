import "expect-puppeteer";
import * as msal from "@azure/msal-node";

// Credentials
const [username, password] = getCredentials(); // Implement an API to get your credentials

const config = {
  auth: {
    clientId: "client_id_here", // Add same ClientId here as in app/authConfig.js
    authority: "add_tenanted_authority_here" // Add same tenanted authority here as in app/authConfig.js
  } 
};

// Defining the timeout for the test
const timeout = 8000;
let tokenCache: msal.CacheKVStore;

async function setSessionStorage(tokens: msal.CacheKVStore) {
  const cacheKeys = Object.keys(tokenCache);
  for (let key of cacheKeys) {
    const value = JSON.stringify(tokenCache[key]);
    await page.evaluate((key, value) => {
      sessionStorage.setItem(key, value);
    }, key, value);
  };
  await page.reload();
}

beforeAll(async () => {
  const pca = new msal.PublicClientApplication(config);

  const usernamePasswordRequest = {
      scopes: ["user.read"],
      username: username,
      password: password
  };

  await pca.acquireTokenByUsernamePassword(usernamePasswordRequest);
  tokenCache = pca.getTokenCache().getKVStore();

  await page.goto('http://localhost:30662');
});

describe('Tests', () => {
  test('Tests sign-out button is displayed when user is signed-in', async () => {
    let signInButton = await page.$x("//button[contains(., 'Sign In')]");
    let signOutButton = await page.$x("//button[contains(., 'Sign Out')]");
    expect(signInButton.length).toBeGreaterThan(0);
    expect(signOutButton.length).toEqual(0);
    await setSessionStorage(tokenCache);
    signInButton = await page.$x("//button[contains(., 'Sign In')]");
    signOutButton = await page.$x("//button[contains(., 'Sign Out')]");
    expect(signOutButton.length).toBeGreaterThan(0);
    expect(signInButton.length).toEqual(0);
  }, timeout);
});