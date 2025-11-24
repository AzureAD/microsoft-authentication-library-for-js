# State Management Best Practice Sample

This sample demonstrates the **recommended pattern** for using the OAuth `state` parameter when you need to preserve the user's location during authentication flows with MSAL.js.

## The Problem: URL in State Parameter Anti-Pattern

### ❌ ANTI-PATTERN (Do NOT do this)

Many developers make the mistake of directly placing URLs in the OAuth state parameter:

```javascript
// DON'T DO THIS!
msalInstance.loginRedirect({
    scopes: ["user.read"],
    state: window.location.pathname  // Security risk!
});
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

## The Solution: Browser Storage with Reference Keys

### ✅ RECOMMENDED PATTERN (Use this instead)

This sample demonstrates the correct approach:

```javascript
// Save URL to browser storage, get a reference key
const stateKey = AuthStateStorage.saveReturnUrl(window.location.pathname);

// Use the reference key in the state parameter
msalInstance.loginRedirect({
    scopes: ["user.read"],
    state: stateKey  // Secure reference key, not the URL
});

// In your redirect handler
msalInstance.handleRedirectPromise()
    .then((response) => {
        if (response && response.state) {
            // Retrieve the original URL using the state key
            const returnUrl = AuthStateStorage.getReturnUrl(response.state);
            if (returnUrl) {
                window.location.href = returnUrl;
            }
        }
    });
```

## Key Benefits

### 1. Enhanced Security
- URLs are not exposed in the OAuth flow
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

## Files in This Sample

### `authStateStorage.js`
A reusable utility module that provides:
- `saveReturnUrl(url, options)` - Stores a URL and returns a reference key
- `getReturnUrl(stateKey, options)` - Retrieves and validates a URL
- `saveApplicationState(state, options)` - Stores complex application state
- `getApplicationState(stateKey, options)` - Retrieves complex application state
- `cleanupExpiredStates()` - Removes expired state entries

### `auth.js`
Demonstrates how to integrate the `AuthStateStorage` utility with MSAL.js:
- Sign-in with URL preservation
- Redirect handling with state retrieval
- Token acquisition with state management
- Complex state management example

### `index.html`
A demo page that shows:
- The anti-pattern vs. recommended pattern
- Interactive navigation to test state preservation
- Documentation of the approach

## How to Use This Pattern in Your Application

### Step 1: Copy the Utility Module

Copy `authStateStorage.js` to your project. This is a standalone utility that has no dependencies.

### Step 2: Use It Before Authentication

When initiating authentication, save your URL and get a reference key:

```javascript
import { AuthStateStorage } from './authStateStorage.js';

function signIn() {
    const stateKey = AuthStateStorage.saveReturnUrl(window.location.pathname);
    
    msalInstance.loginRedirect({
        scopes: ["user.read"],
        state: stateKey
    });
}
```

### Step 3: Retrieve the URL After Redirect

In your redirect handler, retrieve the original URL:

```javascript
msalInstance.handleRedirectPromise()
    .then((response) => {
        if (response && response.state) {
            const returnUrl = AuthStateStorage.getReturnUrl(response.state);
            if (returnUrl) {
                // Navigate back to the original page
                window.location.href = returnUrl;
            }
        }
    });
```

## Storage Options

### sessionStorage (Default, Recommended)
- Automatically cleared when tab/window closes
- More secure for authentication flows
- Best for most applications

### localStorage (Optional)
- Persists across tabs and browser sessions
- Requires manual cleanup
- Use when state must survive tab closes

```javascript
// Use persistent storage
const stateKey = AuthStateStorage.saveReturnUrl(
    window.location.pathname, 
    { usePersistent: true }
);
```

## Advanced Usage: Complex State

You can store more than just URLs:

```javascript
const stateKey = AuthStateStorage.saveApplicationState({
    returnUrl: window.location.pathname,
    scrollPosition: window.scrollY,
    formData: {
        step: 2,
        completed: ['step1']
    },
    activeTab: 'profile'
});

// Later, retrieve all the state
const appState = AuthStateStorage.getApplicationState(stateKey);
if (appState) {
    window.location.href = appState.returnUrl;
    window.scrollTo(0, appState.scrollPosition);
    // Restore form state, etc.
}
```

## Security Considerations

The `AuthStateStorage` utility includes several security features:

1. **URL Validation**: Only relative URLs or same-origin URLs are allowed
2. **Expiration**: State automatically expires after 10 minutes
3. **Origin Checking**: State from different origins is rejected
4. **Automatic Cleanup**: Expired state is cleaned up automatically
5. **One-time Use**: State is removed from storage after retrieval

## Testing the Sample

1. Open `index.html` in a browser
2. Navigate to different pages using the buttons (Profile, Settings, Dashboard)
3. Click "Sign In"
4. After authentication, observe that you're returned to the same page

Compare this to the anti-pattern, where the URL would be visible in the OAuth flow and network traffic.

## Implementation Checklist

When implementing URL preservation in your authentication flows:

- [ ] Copy `authStateStorage.js` to your project
- [ ] Use `saveReturnUrl()` before authentication
- [ ] Use `getReturnUrl()` in your redirect handler
- [ ] Validate URLs before navigation
- [ ] Test with various URL patterns
- [ ] Consider state expiration for your use case
- [ ] Document the pattern for your team
- [ ] Review security considerations
- [ ] Test storage cleanup behavior
- [ ] Consider using `cleanupExpiredStates()` on app initialization

## Related Documentation

- [State Parameter Best Practices](../../../lib/msal-browser/docs/state-parameter-best-practices.md)
- [MSAL.js Request and Response Objects](../../../lib/msal-browser/docs/request-response-object.md)
- [OAuth 2.0 Security Best Current Practice](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [OAuth 2.0 for Browser-Based Apps](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps)

## Questions?

If you have questions about this pattern, please refer to:
- The comprehensive documentation in `lib/msal-browser/docs/state-parameter-best-practices.md`
- MSAL.js FAQ and documentation
- OAuth 2.0 security best practices

## License

This sample is licensed under the MIT License. See LICENSE file for details.
