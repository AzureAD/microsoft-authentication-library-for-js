// =================================================================
// CONFIGURATION
// =================================================================
const msalConfig = {
  auth: {
    clientId: "88f91eac-c606-4c67-a0e2-a5e8a186854f",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: "http://localhost:3000",
    navigateToLoginRequestUrl: true,
    allowPlatformBroker: false,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        console.log(`[MSAL] ${message}`);
      },
      logLevel: msal.LogLevel.Warning,
    },
  },
};

// =================================================================
// LOGGING UTILITIES
// =================================================================
let msalInstance = null;
let testNumber = 0;

function log(message, type = "info") {
  const logDiv = document.getElementById("log");
  const timestamp = new Date().toLocaleTimeString();
  const typeClass =
    type === "error"
      ? "error"
      : type === "warning"
      ? "warning"
      : type === "success"
      ? "success"
      : "info";

  logDiv.innerHTML += `<div class="${typeClass}">[${timestamp}] ${message}</div>`;
  logDiv.scrollTop = logDiv.scrollHeight;
  console.log(`[${type.toUpperCase()}] ${message}`);
}

function logObject(label, obj, type = "info") {
  log(`${label}:`, type);
  const formatted = JSON.stringify(obj, null, 2)
    .split("\n")
    .map((line) => "  " + line)
    .join("\n");
  log(formatted, type);
}

function logSection(title) {
  testNumber++;
  log(`\n${"=".repeat(60)}`, "info");
  log(`TEST #${testNumber}: ${title}`, "info");
  log("=".repeat(60), "info");
}

function validateAccount(account, context = "") {
  const prefix = context ? `[${context}] ` : "";

  if (!account) {
    log(`${prefix}No account provided`, "warning");
    return false;
  }

  log(`${prefix}Account validation:`, "info");
  log(
    `  • Environment: "${account.environment}"`,
    account.environment ? "success" : "error"
  );
  log(`  • Username: ${account.username}`, "info");
  log(`  • HomeAccountId: ${account.homeAccountId}`, "info");
  log(`  • TenantId: ${account.tenantId}`, "info");
  log(`  • LocalAccountId: ${account.localAccountId}`, "info");

  if (!account.environment || account.environment.trim() === "") {
    log(
      `${prefix}🚨 BUG REPRODUCED: Account has EMPTY environment!`,
      "error"
    );
    log(
      `${prefix}This account will cause authority_mismatch errors!`,
      "error"
    );
    return false;
  }

  log(`${prefix}✓ Account environment is valid`, "success");
  return true;
}

// =================================================================
// TEST 1: NORMAL FLOW (BASELINE)
// =================================================================
async function testNormalFlow() {
  logSection("Normal Flow (Baseline)");

  try {
    log("Creating MSAL instance...", "info");
    msalInstance =
      await msal.PublicClientApplication.createPublicClientApplication(
        msalConfig
      );

    log("Waiting 2 seconds for full initialization...", "info");
    await sleep(2000);

    const config = msalInstance.getConfiguration();
    log(
      `✓ MSAL initialized with authority: ${config.auth.authority}`,
      "success"
    );

    const accounts = msalInstance.getAllAccounts();
    log(`Found ${accounts.length} cached account(s)`, "info");

    if (accounts.length === 0) {
      log("No accounts found. Initiating login...", "warning");
      await msalInstance.loginRedirect({ scopes: ["User.Read"] });
      return;
    }

    accounts.forEach((account, i) => {
      log(`\nAccount ${i + 1}:`, "info");
      validateAccount(account, `Account ${i + 1}`);
    });

    // Try token acquisition
    log("\nAttempting token acquisition...", "info");
    const tokenRequest = {
      scopes: ["User.Read"],
      account: accounts[0],
    };

    const response = await msalInstance.acquireTokenSilent(tokenRequest);
    log("✓ Token acquired successfully!", "success");
    validateAccount(response.account, "Token Response");
  } catch (error) {
    log(`❌ Error: ${error.errorCode || error.name}`, "error");
    log(`   Message: ${error.message || error.errorMessage}`, "error");

    if (error.errorCode === "authority_mismatch") {
      log("🚨 AUTHORITY_MISMATCH ERROR - BUG CONFIRMED!", "error");
    }
  }
}

// =================================================================
// TEST 2: RACE CONDITION (MOST LIKELY TO TRIGGER BUG)
// =================================================================
async function testRaceCondition() {
  logSection("Race Condition - Immediate SSO Silent");

  try {
    log("Creating MSAL instance...", "info");
    msalInstance =
      await msal.PublicClientApplication.createPublicClientApplication(
        msalConfig
      );

    log(
      "⚠️  Calling ssoSilent() IMMEDIATELY (no wait for metadata resolution)",
      "warning"
    );
    log(
      "This simulates app startup scenario where SSO happens too early",
      "warning"
    );

    const ssoRequest = {
      scopes: ["User.Read"],
      prompt: "none",
      authority: "https://login.microsoftonline.com/common",
      loginHint: 'O.CiQ5ZjQ4ODBkOC04MGJhLTRjNDAtOTdiYy1mN2EyM2M3MDMwODQSJGY2NDVhZDkyLWUzOGQtNGQxYS1iNTEwLWQxYjA5YTc0YThjYRoeaWRsYWJAbXNpZGxhYjQub25taWNyb3NvZnQuY29tICk='
    };

    const response = await msalInstance.ssoSilent(ssoRequest);
    log("✓ SSO Silent succeeded", "success");

    const isValid = validateAccount(response.account, "SSO Response");

    if (!isValid) {
      log("\n🎯 BUG SUCCESSFULLY REPRODUCED!", "error");
      log("Account was cached with empty environment", "error");

      // Try to use this broken account
      log(
        "\nAttempting token acquisition with broken account...",
        "warning"
      );
      const tokenRequest = {
        scopes: ["User.Read"],
        account: response.account,
      };

      try {
        await msalInstance.acquireTokenSilent(tokenRequest);
        log("Token acquisition succeeded (unexpected)", "warning");
      } catch (tokenError) {
        log(
          `❌ Token acquisition failed: ${tokenError.errorCode}`,
          "error"
        );
        if (tokenError.errorCode === "authority_mismatch") {
          log("🚨 AUTHORITY_MISMATCH ERROR CONFIRMED!", "error");
          log("Root cause: empty environment in cached account", "error");
        }
      }
    }
  } catch (error) {
    log(`SSO Silent error: ${error.errorCode || error.name}`, "error");
    log(`Message: ${error.message || error.errorMessage}`, "error");
    
    if (error.errorCode === "monitor_window_timeout") {
      log("", "warning");
      log("⚠️  monitor_window_timeout: SSO Silent timed out", "warning");
      log("💡 This may occur if there's no active session", "info");
      log("💡 Try running Test 1 first or signing in via another tab", "info");
    }
  }
}

// =================================================================
// TEST 3: SSO SILENT EARLY WITH DIFFERENT AUTHORITY
// =================================================================
async function testSsoSilentEarly() {
  logSection("SSO Silent Early with /consumers Authority");

  try {
    log("Creating MSAL with /common authority...", "info");
    msalInstance =
      await msal.PublicClientApplication.createPublicClientApplication(
        msalConfig
      );

    log("Waiting only 100ms (minimal delay)...", "warning");
    await sleep(100);

    log("Calling ssoSilent() with /common authority...", "info");
    const ssoRequest = {
      scopes: ["User.Read"],
      prompt: "none",
      authority: "https://login.microsoftonline.com/common",
      loginHint: 'O.CiQ5ZjQ4ODBkOC04MGJhLTRjNDAtOTdiYy1mN2EyM2M3MDMwODQSJGY2NDVhZDkyLWUzOGQtNGQxYS1iNTEwLWQxYjA5YTc0YThjYRoeaWRsYWJAbXNpZGxhYjQub25taWNyb3NvZnQuY29tICk='
    };

    const ssoResponse = await msalInstance.ssoSilent(ssoRequest);
    log("✓ SSO Silent succeeded", "success");
    log(`  Authority used: ${ssoResponse.authority}`, "info");

    validateAccount(ssoResponse.account, "SSO with /common");

    // Now try with /common authority
    log("\nTrying token acquisition with /common authority...", "info");
    const tokenRequest = {
      scopes: ["User.Read"],
      account: ssoResponse.account,
      authority: "https://login.microsoftonline.com/common",
    };

    const tokenResponse = await msalInstance.acquireTokenSilent(
      tokenRequest
    );
    log("✓ Token acquired with /common", "success");
    validateAccount(tokenResponse.account, "Token with /common");
  } catch (error) {
    log(`❌ Error: ${error.errorCode || error.name}`, "error");
    log(`   Message: ${error.message || error.errorMessage}`, "error");

    if (error.errorCode === "authority_mismatch") {
      log(
        "🚨 AUTHORITY_MISMATCH - Bug triggered!",
        "error"
      );
    } else if (error.errorCode === "monitor_window_timeout") {
      log("", "warning");
      log("⚠️  No active session - Run Test 1 first to sign in", "warning");
    }
  }
}

// =================================================================
// TEST 4: MULTIPLE RAPID AUTHORITY SWITCHES
// =================================================================
async function testMultipleAuthorities() {
  logSection("Multiple Rapid Authority Switches");

  try {
    log("Creating MSAL instance...", "info");
    msalInstance =
      await msal.PublicClientApplication.createPublicClientApplication(
        msalConfig
      );

    await sleep(500);

    const authorities = [
      {
        url: "https://login.microsoftonline.com/common",
        name: "/common #1",
      },
      {
        url: "https://login.microsoftonline.com/common",
        name: "/common #2",
      },
      {
        url: "https://login.microsoftonline.com/common",
        name: "/common #3",
      },
      {
        url: "https://login.microsoftonline.com/common",
        name: "/common #4",
      },
    ];

    log(
      `Making ${authorities.length} rapid SSO requests with /common...`,
      "warning"
    );

    for (let i = 0; i < authorities.length; i++) {
      const auth = authorities[i];
      log(`\nRequest ${i + 1}: ${auth.name}`, "info");

      try {
        const response = await msalInstance.ssoSilent({
          scopes: ["User.Read"],
          prompt: "none",
          authority: auth.url,
          loginHint: 'O.CiQ5ZjQ4ODBkOC04MGJhLTRjNDAtOTdiYy1mN2EyM2M3MDMwODQSJGY2NDVhZDkyLWUzOGQtNGQxYS1iNTEwLWQxYjA5YTc0YThjYRoeaWRsYWJAbXNpZGxhYjQub25taWNyb3NvZnQuY29tICk='
        });

        validateAccount(response.account, `${auth.name} response`);
      } catch (error) {
        log(`  Failed: ${error.errorCode}`, "warning");
      }

      await sleep(50); // Small delay between requests
    }

    log("\n✓ Authority switching test complete", "success");
  } catch (error) {
    log(`❌ Error: ${error.message}`, "error");
  }
}

// =================================================================
// TEST 5: QUICK INITIALIZATION AND USE
// =================================================================
async function testQuickInitAndUse() {
  logSection("Quick Init & Immediate Use");

  try {
    log("Creating MSAL and immediately using it...", "warning");
    msalInstance =
      await msal.PublicClientApplication.createPublicClientApplication(
        msalConfig
      );

    // Get accounts immediately
    const accounts = msalInstance.getAllAccounts();
    log(`Found ${accounts.length} account(s)`, "info");

    if (accounts.length > 0) {
      accounts.forEach((account, i) => {
        validateAccount(account, `Cached Account ${i + 1}`);
      });

      log("\nAttempting immediate token acquisition...", "warning");
      const response = await msalInstance.acquireTokenSilent({
        scopes: ["User.Read"],
        account: accounts[0],
      });

      log("✓ Token acquired", "success");
      validateAccount(response.account, "Token Response");
    } else {
      log("No cached accounts to test with", "warning");
    }
  } catch (error) {
    log(`❌ Error: ${error.errorCode || error.name}`, "error");
    log(`   Message: ${error.message || error.errorMessage}`, "error");
  }
}

// =================================================================
// CACHE INSPECTION
// =================================================================
function inspectCache() {
  logSection("Cache Inspection");

  try {
    const cacheKeys = Object.keys(localStorage).filter(
      (key) =>
        key.includes("msal") ||
        key.includes("login.microsoftonline") ||
        key.includes("authority")
    );

    log(`Found ${cacheKeys.length} MSAL-related cache entries`, "info");

    let foundEmptyEnvironment = false;
    let foundEmptyPreferredCache = false;

    cacheKeys.forEach((key) => {
      try {
        const value = localStorage.getItem(key);
        const parsed = JSON.parse(value);

        log(`\n📦 ${key}`, "info");

        // Account entries
        if (
          key.includes(".account.") &&
          parsed.environment !== undefined
        ) {
          log(`  Type: Account`, "info");
          log(
            `  Environment: "${parsed.environment || ""}"`,
            parsed.environment ? "success" : "error"
          );
          log(`  Username: ${parsed.username || "N/A"}`, "info");
          log(
            `  HomeAccountId: ${parsed.homeAccountId || "N/A"}`,
            "info"
          );

          if (!parsed.environment || parsed.environment.trim() === "") {
            log(`  🚨 EMPTY ENVIRONMENT FOUND!`, "error");
            foundEmptyEnvironment = true;
          }
        }

        // Authority metadata
        if (key.includes("authority-metadata")) {
          log(`  Type: Authority Metadata`, "info");
          log(
            `  Preferred Cache: "${parsed.preferred_cache || ""}"`,
            parsed.preferred_cache ? "success" : "error"
          );
          log(
            `  Preferred Network: ${parsed.preferred_network || "N/A"}`,
            "info"
          );
          log(
            `  Aliases: ${JSON.stringify(parsed.aliases || [])}`,
            "info"
          );

          if (
            !parsed.preferred_cache ||
            parsed.preferred_cache.trim() === ""
          ) {
            log(`  🚨 EMPTY PREFERRED_CACHE FOUND!`, "error");
            foundEmptyPreferredCache = true;
          }
        }
      } catch (e) {
        log(`  (Raw value, not JSON)`, "warning");
      }
    });

    if (foundEmptyEnvironment || foundEmptyPreferredCache) {
      log("\n🎯 BUG EVIDENCE FOUND IN CACHE!", "error");
      if (foundEmptyEnvironment) {
        log("  • Account(s) with empty environment detected", "error");
      }
      if (foundEmptyPreferredCache) {
        log(
          "  • Authority metadata with empty preferred_cache detected",
          "error"
        );
      }
    } else {
      log("\n✓ No empty environment issues found in cache", "success");
    }
  } catch (error) {
    log(`Error inspecting cache: ${error.message}`, "error");
  }
}

// =================================================================
// MSAL STATE INSPECTION
// =================================================================
function inspectMsalState() {
  logSection("MSAL State Inspection");

  if (!msalInstance) {
    log("No MSAL instance available. Run a test first.", "warning");
    return;
  }

  try {
    const config = msalInstance.getConfiguration();
    log("Configuration:", "info");
    log(`  Authority: ${config.auth.authority}`, "info");
    log(`  ClientId: ${config.auth.clientId}`, "info");
    log(`  RedirectUri: ${config.auth.redirectUri}`, "info");

    const accounts = msalInstance.getAllAccounts();
    log(`\nTotal accounts: ${accounts.length}`, "info");

    accounts.forEach((account, i) => {
      log(`\nAccount ${i + 1}:`, "info");
      validateAccount(account, `Account ${i + 1}`);
    });

    const activeAccount = msalInstance.getActiveAccount();
    if (activeAccount) {
      log("\nActive account:", "info");
      validateAccount(activeAccount, "Active");
    } else {
      log("\nNo active account set", "warning");
    }
  } catch (error) {
    log(`Error inspecting MSAL state: ${error.message}`, "error");
  }
}

// =================================================================
// CACHE CLEARING
// =================================================================
function clearCache() {
  logSection("Cache Clearing");

  if (!confirm("This will clear ALL MSAL cache. Continue?")) {
    log("Cache clear cancelled", "warning");
    return;
  }

  try {
    const cacheKeys = Object.keys(localStorage).filter(
      (key) =>
        key.includes("msal") ||
        key.includes("login.microsoftonline") ||
        key.includes("authority")
    );

    log(`Removing ${cacheKeys.length} cache entries...`, "warning");

    cacheKeys.forEach((key) => {
      localStorage.removeItem(key);
      log(`  ✓ Removed: ${key}`, "info");
    });

    log("\n✓ Cache cleared successfully!", "success");
    log("⚠️  Reload the page to start fresh", "warning");

    if (msalInstance) {
      log("\nClearing MSAL instance...", "info");
      msalInstance = null;
    }
  } catch (error) {
    log(`Error clearing cache: ${error.message}`, "error");
  }
}

// =================================================================
// UTILITIES
// =================================================================
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =================================================================
// INITIALIZATION
// =================================================================
window.addEventListener("load", () => {
  log("🚀 MSAL Bug Reproduction Page Loaded", "success");
  log("👉 Update .env file with your Azure AD client ID", "warning");
  log("👉 Run Test 1 first to sign in if needed", "info");
  log("👉 Then run Test 2 or 3 to trigger the bug\n", "info");
});

// Handle redirect response
(async () => {
  try {
    const response =
      await msal.PublicClientApplication.createPublicClientApplication(
        msalConfig
      );
    const redirectResponse = await response.handleRedirectPromise();

    if (redirectResponse) {
      log("Redirect response received", "success");
      validateAccount(redirectResponse.account, "Redirect Response");
      msalInstance = response;
    }
  } catch (error) {
    log(`Redirect handling error: ${error.message}`, "error");
  }
})();

// Expose functions to window for button onclick handlers
window.testNormalFlow = testNormalFlow;
window.testRaceCondition = testRaceCondition;
window.testSsoSilentEarly = testSsoSilentEarly;
window.testMultipleAuthorities = testMultipleAuthorities;
window.testQuickInitAndUse = testQuickInitAndUse;
window.inspectCache = inspectCache;
window.inspectMsalState = inspectMsalState;
window.clearCache = clearCache;
