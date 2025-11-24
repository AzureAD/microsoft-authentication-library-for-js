# State Parameter Best Practices

## Overview

The `state` parameter in OAuth 2.0 and OpenID Connect flows serves two important purposes:
1. **CSRF protection**: A unique, unguessable value that prevents cross-site request forgery attacks
2. **Application state preservation**: Optionally encode information about the application's state before authentication

This document provides best practices for using the `state` parameter with MSAL.js, particularly when you need to preserve the user's location for post-authentication navigation.

## Anti-Pattern: Directly Setting URLs in State

### What NOT to Do

**❌ INCORRECT - Do not do this:**

```javascript
import { PublicClientApplication } from "@azure/msal-browser";

const msalInstance = new PublicClientApplication(config);

// ANTI-PATTERN: Directly setting URL in state parameter
function signIn() {
    msalInstance.loginRedirect({
        scopes: ["user.read"],
        state: window.location.pathname  // ❌ Security risk!
    });
}
```

### Why This is Problematic

1. **Security Exposure**: URLs may contain sensitive routing information (e.g., `/user/123/settings`) that gets exposed in:
   - Browser history
   - Server logs
   - Network traffic
   - Authorization provider URLs

2. **Injection Vulnerabilities**: Unvalidated pathnames can be manipulated for:
   - Open redirect attacks
   - Unauthorized navigation
   - Information disclosure

3. **Limited Context**: URLs alone don't provide enough context about the full application state

4. **URL Length Limits**: Long URLs may exceed state parameter size limitations

## Recommended Pattern: Browser Storage with Reference Keys

### The Correct Approach

**✅ CORRECT - Use this pattern:**

```javascript
import { PublicClientApplication } from "@azure/msal-browser";

const msalInstance = new PublicClientApplication(config);

/**
 * Generates a unique state key and stores the URL in browser storage
 * @param {string} url - The URL to preserve
 * @returns {string} - A unique reference key for the state parameter
 */
function saveReturnUrl(url) {
    // Generate a unique, unpredictable key
    const stateKey = `msal.return.url.${Date.now()}.${Math.random().toString(36).substring(2)}`;
    
    // Store the URL in sessionStorage (cleared when tab closes)
    sessionStorage.setItem(stateKey, url);
    
    return stateKey;
}

/**
 * Retrieves and removes the URL from browser storage
 * @param {string} stateKey - The reference key from the state parameter
 * @returns {string|null} - The preserved URL or null if not found
 */
function getReturnUrl(stateKey) {
    if (!stateKey || !stateKey.startsWith('msal.return.url.')) {
        return null;
    }
    
    const url = sessionStorage.getItem(stateKey);
    
    // Clean up after retrieval
    sessionStorage.removeItem(stateKey);
    
    // Validate the URL before using it
    if (url && isValidReturnUrl(url)) {
        return url;
    }
    
    return null;
}

/**
 * Validates that a return URL is safe to navigate to
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if the URL is safe
 */
function isValidReturnUrl(url) {
    try {
        // Only allow relative URLs (same origin)
        if (url.startsWith('/') && !url.startsWith('//')) {
            return true;
        }
        
        // Optionally allow specific absolute URLs
        const allowedOrigins = [window.location.origin];
        const urlObj = new URL(url, window.location.origin);
        return allowedOrigins.includes(urlObj.origin);
    } catch (e) {
        return false;
    }
}

// Usage during sign-in
function signIn() {
    // Save current location and get reference key
    const stateKey = saveReturnUrl(window.location.pathname);
    
    msalInstance.loginRedirect({
        scopes: ["user.read"],
        state: stateKey  // ✅ Use reference key instead of URL
    });
}

// Usage in redirect handler
msalInstance.handleRedirectPromise()
    .then((response) => {
        if (response && response.state) {
            // Retrieve the original URL using the state key
            const returnUrl = getReturnUrl(response.state);
            
            if (returnUrl) {
                // Navigate back to the original location
                window.location.href = returnUrl;
            }
        }
    })
    .catch((error) => {
        console.error("Authentication error:", error);
    });
```

## Key Benefits of This Approach

### 1. Enhanced Security
- URLs are not exposed in OAuth flow
- Reference keys are meaningless without access to browser storage
- Validation prevents unauthorized redirects
- Storage is automatically cleared (sessionStorage) or can be explicitly cleared

### 2. Better Privacy
- No sensitive routing information in logs or network traces
- User paths remain private

### 3. Flexibility
- Can store additional context beyond just URLs
- Can include complex state objects
- Not limited by URL length restrictions

### 4. CSRF Protection Maintained
- MSAL.js still adds its own CSRF protection
- Your reference key adds an additional layer

## Advanced Pattern: Storing Complex State

For applications that need to preserve more than just the URL:

```javascript
function saveApplicationState() {
    const state = {
        returnUrl: window.location.pathname,
        scrollPosition: window.scrollY,
        formData: {
            // Preserve form inputs if needed
        },
        timestamp: Date.now()
    };
    
    const stateKey = `msal.app.state.${Date.now()}.${Math.random().toString(36).substring(2)}`;
    sessionStorage.setItem(stateKey, JSON.stringify(state));
    
    return stateKey;
}

function restoreApplicationState(stateKey) {
    const stateJson = sessionStorage.getItem(stateKey);
    sessionStorage.removeItem(stateKey);
    
    if (!stateJson) return null;
    
    try {
        const state = JSON.parse(stateJson);
        
        // Validate state hasn't expired (e.g., 10 minutes)
        const age = Date.now() - state.timestamp;
        if (age > 10 * 60 * 1000) {
            return null;
        }
        
        return state;
    } catch (e) {
        return null;
    }
}
```

## Storage Choice: sessionStorage vs localStorage

### sessionStorage (Recommended)
- **Pros**: Automatically cleared when tab/window closes, more secure
- **Cons**: Lost if user opens auth in new tab (unless using popup)
- **Best for**: Most authentication flows, especially redirect-based

### localStorage
- **Pros**: Persists across tabs and browser sessions
- **Cons**: Requires manual cleanup, security considerations
- **Best for**: Long-running sessions where state must survive tab closes

## Implementation Checklist

When implementing URL preservation in authentication flows:

- [ ] Generate unique, unpredictable reference keys
- [ ] Store URLs in browser storage (prefer sessionStorage)
- [ ] Use reference keys in the state parameter
- [ ] Validate URLs before navigation
- [ ] Implement URL whitelist/validation
- [ ] Clean up storage after use
- [ ] Handle edge cases (expired state, missing keys)
- [ ] Test with various URL patterns
- [ ] Consider state expiration
- [ ] Document the pattern for your team

## Related Documentation

- [Request and Response Objects](./request-response-object.md)
- [Configuration Options](./configuration.md)
- [Login User](./login-user.md)
- [Acquire Token](./acquire-token.md)

## References

- [OAuth 2.0 Security Best Current Practice](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [OAuth 2.0 for Browser-Based Apps](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps)
- [Open Redirect Vulnerabilities](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html)
