# MSAL Browser - Empty Environment Bug Reproduction

This repository contains a minimal reproduction case for a bug in `@azure/msal-browser` where `AccountEntity` objects are occasionally created with an empty string (`""`) for the `environment` property, causing `authority_mismatch` errors.

**Current MSAL Version**: `@azure/msal-browser@4.27.0`

## 🐛 Bug Description

### The Issue

MSAL Browser sometimes caches accounts with:

```javascript
{
  environment: "",  // ❌ Empty string instead of "login.microsoftonline.com"
  homeAccountId: "...",
  username: "user@example.com"
}
```

### The Impact

When this occurs:

1. Account is cached with invalid `environment: ""`
2. Subsequent `acquireTokenSilent()` calls fail with `authority_mismatch`
3. User is forced to clear cache or re-authenticate
4. Silent token refresh fails, breaking the user experience

### Root Cause

In `AccountEntity.createAccount()` (lib/msal-common/src/cache/entities/AccountEntity.ts):

```typescript
const env =
  accountDetails.environment || (authority && authority.getPreferredCache());
if (!env) {
  // ❌ Only checks null/undefined, not empty string
  throw createClientAuthError(ClientAuthErrorCodes.invalidCacheEnvironment);
}
account.environment = env; // Empty string passes validation!
```

The validation `if (!env)` allows empty strings to pass through. This happens when:

- `authority.getPreferredCache()` returns `""`
- Which occurs when `this.metadata.preferred_cache` is `""`
- Which happens when `this.hostnameAndPort` is empty during authority initialization
- **Root cause**: Race condition where account creation happens before authority metadata resolution completes

## 🚀 Quick Start

### Prerequisites

1. An Azure AD application with redirect URI configured
2. Node.js installed

### Setup

1. **Clone/download this repository**

2. **Install dependencies**

   ```bash
   npm install
   ```
s
3. **Configure your Azure AD application**

   - Edit `main.js` and replace `YOUR_CLIENT_ID_HERE` with your Azure AD application client ID
   - Update the `authority` if needed (default is `/common`)

4. **Configure redirect URI**

   - In your Azure AD app registration, add redirect URI: `http://localhost:3000`

5. **Build MSAL Browser (uses local workspace build)**

   ```bash
   npm run build:package
   ```

6. **Start development server**

   ```bash
   npm start
   ```

7. **Open in browser**
   ```
   http://localhost:3000
   ```

   ```bash
   npm start
   # or
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🧪 Running the Tests

### Test Scenarios

The reproduction page includes 5 test scenarios designed to trigger the bug:

#### **1️⃣ Normal Flow (Baseline)**

- Standard MSAL initialization with proper wait time
- Establishes baseline behavior
- **Run this first** to sign in

#### **2️⃣ Race Condition** ⚡ (Most Likely to Trigger Bug)

- Creates MSAL instance and immediately calls `ssoSilent()`
- No wait for authority metadata resolution
- Simulates real-world app startup scenario
- **High probability of reproducing the bug**

#### **3️⃣ SSO Silent Early**

- Uses `/consumers` authority immediately after initialization
- Tests authority switching before metadata is ready
- Common pattern in multi-tenant apps

#### **4️⃣ Multiple Authorities**

- Rapidly switches between `/common` and `/consumers`
- Tests metadata caching across different authorities
- Stresses authority resolution system

#### **5️⃣ Quick Init & Use**

- Immediately uses cached accounts after initialization
- Tests if cached accounts already have the bug

### Inspection Tools

- **Inspect Cache**: Examines browser localStorage for accounts with empty environment
- **Inspect MSAL State**: Shows current MSAL configuration and accounts
- **Clear All Cache**: Removes all MSAL cache entries for fresh start

## 📊 What to Look For

### Bug Successfully Reproduced When You See:

```
🚨 BUG REPRODUCED: Account has EMPTY environment!
```

And/or:

```
❌ Token acquisition failed: authority_mismatch
🚨 AUTHORITY_MISMATCH ERROR CONFIRMED!
```

### In the Logs:

- Account validation showing `Environment: ""`
- Red error messages indicating empty environment
- `authority_mismatch` errors on token requests

### In Cache Inspection:

```json
{
  "homeAccountId": "...",
  "environment": "", // ❌ Empty!
  "username": "user@example.com",
  "tenantId": "..."
}
```

## 🔍 Expected vs Actual

### ✅ Expected Behavior

```javascript
{
  environment: "login.microsoftonline.com",  // Valid hostname
  homeAccountId: "abc123.def456",
  username: "user@contoso.com"
}
```

### ❌ Actual Behavior (Bug)

```javascript
{
  environment: "",  // Empty string!
  homeAccountId: "abc123.def456",
  username: "user@contoso.com"
}
```

## 🛠️ Proposed Fix

### Option 1: Stricter Validation (Recommended)

```typescript
// In lib/msal-common/src/cache/entities/AccountEntity.ts (line 132-151)
const env =
  accountDetails.environment || (authority && authority.getPreferredCache());
if (!env || env.trim() === "") {
  // ✅ Add empty string check
  throw createClientAuthError(ClientAuthErrorCodes.invalidCacheEnvironment);
}
account.environment = env;
```

### Option 2: Validate at Authority Level

```typescript
// In lib/msal-common/src/authority/Authority.ts (line 1165-1181)
getPreferredCache(): string {
    if (this.managedIdentity) {
        return Constants.DEFAULT_AUTHORITY_HOST;
    } else if (this.discoveryComplete()) {
        const cache = this.metadata.preferred_cache;
        if (!cache || cache.trim() === '') {  // ✅ Add validation
            throw createClientAuthError(ClientAuthErrorCodes.endpointResolutionError);
        }
        return cache;
    } else {
        throw createClientAuthError(ClientAuthErrorCodes.endpointResolutionError);
## 📁 Files Affected in MSAL

- `lib/msal-common/src/cache/entities/AccountEntity.ts` (lines 132-151)
- `lib/msal-common/src/authority/Authority.ts` (lines 1165-1181, 443-463)
- `lib/msal-common/src/response/ResponseHandler.ts` (buildAccountToCache function)

## 📦 Project Structure

```

├── index.html # Main HTML page with test UI
├── main.js # JavaScript module with MSAL logic
├── .env # Environment variables (not in git)
├── .env.example # Environment variables template
├── package.json # Dependencies and scripts
├── vite.config.js # Vite configuration (if needed)
└── README.md # This file

```

## 🛠️ Technology Stack

- **MSAL**: `@azure/msal-browser@4.27.0`
- **Bundler**: Vite 7.x
- **Environment Variables**: Vite's built-in `.env` support (VITE_ prefix required)

- `lib/msal-common/src/cache/entities/AccountEntity.ts` (lines 132-151)
- `lib/msal-common/src/authority/Authority.ts` (lines 1165-1181, 443-463)
- `lib/msal-common/src/response/ResponseHandler.ts` (buildAccountToCache function)

## 🤔 Questions for MSAL Team

1. Is there a scenario where `hostnameAndPort` can legitimately be empty?
2. Should account creation be blocked until authority metadata is fully resolved?
3. Are there known race condition issues with async initialization?
4. Has this been observed in other applications using MSAL Browser?
5. Should validation happen at multiple layers or just at the root?

## 📝 Additional Context

- Observed in production applications using `@azure/msal-browser` and `@azure/msal-browser-1p`
- Affects applications with:
  - SSO silent flow during startup
  - Multiple authority configurations (`/common`, `/consumers`)
  - Fast page loads (less time for metadata resolution)
- More common in scenarios with:
  - Nested App Authentication (NAA)
  - Platform Broker (PwB) configurations
  - Early token acquisition requests

## 🔗 Related Code Paths

The bug manifests through this code flow:

1. `PublicClientApplication.createPublicClientApplication()` - MSAL initialization
2. `Authority.resolveEndpointsAsync()` - Async metadata resolution
3. `ssoSilent()` or token acquisition called too early
4. `AccountEntity.createAccount()` - Account creation
5. `authority.getPreferredCache()` returns `""` (metadata not ready)
6. Account cached with `environment: ""`
---

**Need Help?**

- Make sure you've created a `.env` file from `.env.example`
- Update `VITE_CLIENT_ID` with your Azure AD application client ID
- Ensure redirect URI `http://localhost:3000` is configured in your Azure AD app
- Run `npm install` before starting the dev server

When you successfully reproduce the bug, you should see red error messages indicating empty environment and subsequent authority_mismatch errors in the logs section.

## 📄 License

MIT

## 🙋 Contributing

This is a bug reproduction repository. Once you've reproduced the bug:

1. Capture screenshots/logs showing the empty environment
2. Note which test scenario triggered it
3. Submit to the MSAL team at: https://github.com/AzureAD/microsoft-authentication-library-for-js/issues

---

**Need Help?** Make sure you've updated the client ID and have the correct redirect URI configured in your Azure AD app.
```
