# Cross-Origin Opener Policy (COOP) Headers and acquireTokenPopup Flow

## Overview

Cross-Origin Opener Policy (COOP) is a security feature that allows you to ensure a top-level document does not share a browsing context group with cross-origin documents. When using MSAL.js with the `acquireTokenPopup` flow, COOP headers can significantly impact the behavior of popup windows and the authentication flow.

This document explains how different COOP header values affect the `acquireTokenPopup` flow, specifically the opening, monitoring, and closing of popup windows.

## What is COOP?

Cross-Origin Opener Policy (COOP) is an HTTP response header that allows a document to isolate itself from other documents that might be opened in the same browsing context group. This prevents certain types of attacks where malicious websites could potentially access or manipulate popup windows.

The COOP header is set on the response from your web server:

```
Cross-Origin-Opener-Policy: same-origin
```

## COOP Header Values

### `unsafe-none` (Default)

This is the default value when no COOP header is present.

**Behavior:**

-   Popup windows maintain a reference to their opener window
-   The parent window can access the popup's properties (when same-origin)
-   The popup can access the parent window's properties (when same-origin)
-   Cross-origin communication is possible through postMessage

**Impact on acquireTokenPopup:**

-   ✅ **Fully Compatible**: This is the ideal setting for MSAL.js popup flows
-   The popup monitoring works correctly as MSAL can check `popupWindow.location.href` when the popup returns to the same origin
-   Window closing behavior works as expected
-   No additional configuration needed

### `same-origin-allow-popups`

Isolates the document from cross-origin documents, but allows popups to be opened.

**Behavior:**

-   Documents can open popups that will not be isolated
-   Opened popups maintain the `unsafe-none` policy unless they set their own COOP header
-   Parent-popup communication works when same-origin

**Impact on acquireTokenPopup:**

-   ✅ **Compatible**: Works well with MSAL.js popup flows
-   The popup can communicate back to the parent window
-   MSAL can monitor the popup's location when it returns to the same origin
-   Provides better security isolation while maintaining popup functionality

### `same-origin`

Isolates the document from cross-origin documents and prevents popups from accessing the opener.

**Behavior:**

-   The popup window cannot access the opener window
-   The opener window cannot access the popup window (even when same-origin)
-   `window.opener` is null in the popup
-   Communication between windows is severely restricted

**Impact on acquireTokenPopup:**

-   ⚠️ **Problematic**: This setting can cause issues with the popup flow
-   MSAL relies on monitoring the popup window's location to detect when authentication is complete
-   The popup monitoring logic in `monitorPopupForHash()` may fail because:
    -   Access to `popupWindow.location.href` may be blocked
    -   The popup cannot communicate back to the parent window
    -   Window closing detection may not work properly

**Potential Issues:**

-   Authentication timeouts due to inability to monitor popup state
-   Popup windows may not close automatically after authentication
-   The authentication flow may hang indefinitely

### `noopener-allow-popups`

Isolates the document from its opener while still allowing popups to be opened.

**Behavior:**

-   The document is always opened in a new browsing context group
-   Severs connections between the document and its opener
-   `window.opener` is null
-   Can still open popups with `unsafe-none` policy in the same browsing context group

**Impact on acquireTokenPopup:**

-   ❌ **Not Recommended**: This setting will break the popup flow
-   The popup cannot communicate back to the parent window
-   Similar issues to `same-origin` but may be slightly more restrictive
-   Authentication flow will likely timeout

## How MSAL.js Popup Flow Works

Understanding how MSAL.js monitors popup windows helps explain why certain COOP headers cause issues:

### 1. Popup Opening

```typescript
// In PopupClient.ts
const popupWindow = this.openPopup(requestUrl, popupParams);
```

### 2. Popup Monitoring

```typescript
// In PopupClient.ts - monitorPopupForHash method
const intervalId = setInterval(() => {
    if (popupWindow.closed) {
        // Handle window closed
        return;
    }

    let href = "";
    try {
        // This line can fail with restrictive COOP headers
        href = popupWindow.location.href;
    } catch (e) {
        // Cross-origin access blocked - continue polling
    }

    // Process the response when popup returns to same origin
    if (href && href !== "about:blank") {
        // Extract tokens from URL and resolve promise
    }
}, this.config.system.pollIntervalMilliseconds);
```

### 3. Window Cleanup

```typescript
// In PopupClient.ts
cleanPopup(popupWindow: Window, popupWindowParent: Window): void {
    popupWindow.close();
    popupWindowParent.removeEventListener("beforeunload", this.unloadWindow);
}
```

## COOP Impact on Async vs Non-Async Popups

MSAL.js supports two types of popup behaviors controlled by the `asyncPopups` configuration option. The COOP header affects these differently:

### Non-Async Popups (Default: `asyncPopups: false`)

**Behavior:**

-   Popup window opens with `about:blank` before the authentication URL is loaded
-   The popup window is created synchronously during user interaction
-   Navigation to the authentication URL happens after window creation

**COOP Impact:**

With **`unsafe-none`** or **`same-origin-allow-popups`**:

-   ✅ **Works normally**: The popup opens immediately with `about:blank`
-   ✅ **Navigation succeeds**: The popup can be navigated to the authentication URL
-   ✅ **Monitoring works**: Parent can monitor popup state throughout the flow

With **`same-origin`**:

-   ✅ **Initial popup creation**: Opens successfully with `about:blank`
-   ⚠️ **Navigation issues**: May have problems navigating to authentication URL
-   ❌ **Monitoring fails**: Parent cannot monitor popup state after navigation to external domain
-   ❌ **Cleanup problems**: May not close properly after authentication

```typescript
// Non-async popup flow in PopupClient.ts
if (!this.config.system.asyncPopups) {
    // Opens about:blank immediately
    popupParams.popup = this.openSizedPopup("about:blank", popupParams);
    // Then navigates to auth URL
    return this.acquireTokenPopupAsync(request, popupParams, pkceCodes);
}
```

### Async Popups (`asyncPopups: true`)

**Behavior:**

-   Popup window opens directly with the authentication URL
-   The popup window is created asynchronously during the network request
-   No intermediate `about:blank` page

**COOP Impact:**

With **`unsafe-none`** or **`same-origin-allow-popups`**:

-   ✅ **Works normally**: Popup opens directly with authentication URL
-   ✅ **Better user experience**: Faster popup opening, no blank page
-   ✅ **Monitoring works**: Parent can monitor popup state throughout the flow

With **`same-origin`**:

-   ❌ **Immediate isolation**: Popup is isolated from the moment it opens
-   ❌ **No monitoring capability**: Parent cannot monitor popup state at all
-   ❌ **Authentication hangs**: Flow will typically timeout
-   ❌ **Manual cleanup required**: Popup may remain open after timeout

```typescript
// Async popup flow in PopupClient.ts
if (this.config.system.asyncPopups) {
    // No pre-created popup, opens directly with auth URL
    return this.acquireTokenPopupAsync(request, popupParams, pkceCodes);
}
```

### Comparison Summary

| COOP Header                | Non-Async Popups         | Async Popups          | Recommendation            |
| -------------------------- | ------------------------ | --------------------- | ------------------------- |
| `unsafe-none`              | ✅ Full compatibility    | ✅ Full compatibility | Use either approach       |
| `same-origin-allow-popups` | ✅ Full compatibility    | ✅ Full compatibility | Use either approach       |
| `same-origin`              | ⚠️ Partial functionality | ❌ Broken             | Use non-async if required |
| `noopener-allow-popups`    | ❌ Broken                | ❌ Broken             | Avoid popup flow          |

### Configuration Recommendations by COOP Header

**For `unsafe-none` or `same-origin-allow-popups`:**

```javascript
const msalConfig = {
    system: {
        // Async popups provide better UX
        asyncPopups: true,
        windowHashTimeout: 60000, // Default timeout is sufficient
        pollIntervalMilliseconds: 30, // Default polling is sufficient
    },
};
```

**For `same-origin` (if unavoidable):**

```javascript
const msalConfig = {
    system: {
        // Non-async popups work better with restrictive COOP
        asyncPopups: false,
        windowHashTimeout: 90000, // Increased timeout
        pollIntervalMilliseconds: 100, // Reduced polling frequency
    },
};
```

### Why Async Popups Are More Affected

Async popups are more severely impacted by restrictive COOP headers because:

1. **Immediate Isolation**: The popup is created directly on the authentication domain, triggering immediate COOP isolation
2. **No Transition Period**: There's no `about:blank` phase where the parent can establish monitoring
3. **Cross-Origin from Start**: The popup begins life as a cross-origin window, making all monitoring attempts fail
4. **No Recovery Mechanism**: Unlike non-async popups, there's no opportunity to establish communication before isolation

## Recommendations

### For Production Applications

1. **Use `same-origin-allow-popups`** for the best balance of security and functionality:

    ```
    Cross-Origin-Opener-Policy: same-origin-allow-popups
    ```

2. **Avoid `same-origin`** unless absolutely necessary for security requirements

3. **Test thoroughly** if you must use `same-origin` - consider fallback mechanisms

### For Development/Testing

1. **Use `unsafe-none`** (or no COOP header) during development for easier testing
2. **Gradually increase security** as you move through environments

### Configuration Considerations

If you must use restrictive COOP headers, consider these MSAL.js configuration options:

```javascript
const msalConfig = {
    system: {
        // Increase timeout for popup operations
        windowHashTimeout: 90000, // 90 seconds instead of default 60

        // Increase polling interval to reduce CPU usage
        pollIntervalMilliseconds: 100, // 100ms instead of default 30ms

        // Enable async popups to potentially work better with COOP
        asyncPopups: true,
    },
};
```

## Troubleshooting COOP Issues

### Common Error Scenarios

1. **Authentication Timeout**

    - **Symptoms**: Popup opens but authentication never completes
    - **Likely Cause**: COOP header blocking popup monitoring
    - **Solution**: Change COOP header to `same-origin-allow-popups` or `unsafe-none`

2. **Popup Not Closing**

    - **Symptoms**: Authentication succeeds but popup window remains open
    - **Likely Cause**: Parent window cannot access popup to close it
    - **Solution**: Modify COOP header or implement custom popup cleanup

3. **Cross-Origin Access Errors**

    - **Symptoms**: Console errors about cross-origin access
    - **Likely Cause**: Restrictive COOP headers
    - **Solution**: Adjust COOP header or use redirect flow instead

4. **Async Popup Failures with Restrictive COOP**

    - **Symptoms**: Async popups (`asyncPopups: true`) fail immediately with `same-origin` COOP
    - **Likely Cause**: Popup is isolated from moment of creation
    - **Solution**: Switch to non-async popups (`asyncPopups: false`) or change COOP header

5. **Non-Async Popup Hangs with Restrictive COOP**
    - **Symptoms**: Non-async popups work initially but hang after navigation
    - **Likely Cause**: Monitoring fails after navigation to authentication domain
    - **Solution**: Increase timeouts or change COOP header

### Debugging Steps

1. **Check Network Tab**: Look for COOP headers in response headers
2. **Check Console**: Look for cross-origin access errors
3. **Test with Different Headers**: Try different COOP values in development
4. **Monitor Popup State**: Add logging to track popup window behavior
5. **Test Both Popup Types**: Try both `asyncPopups: true` and `asyncPopups: false`
6. **Check Popup Isolation**: Test if `popupWindow.opener` is null in the popup

### Specific Debugging for Popup Types

**For Async Popup Issues:**

```javascript
// Add debugging to detect immediate isolation
const popupWindow = window.open(authUrl, popupName, windowFeatures);

// Test if popup is immediately isolated
setTimeout(() => {
    try {
        console.log("Popup location accessible:", popupWindow.location.href);
    } catch (e) {
        console.error("Popup immediately isolated by COOP:", e);
    }
}, 100);
```

**For Non-Async Popup Issues:**

```javascript
// Add debugging to track navigation phases
const popupWindow = window.open("about:blank", popupName, windowFeatures);

// Test before navigation
try {
    console.log("Before navigation - accessible:", popupWindow.location.href);
} catch (e) {
    console.error("Popup isolated even on about:blank:", e);
}

// Test after navigation
popupWindow.location.assign(authUrl);
setTimeout(() => {
    try {
        console.log(
            "After navigation - accessible:",
            popupWindow.location.href
        );
    } catch (e) {
        console.error("Popup isolated after navigation:", e);
    }
}, 1000);
```

### Fallback to Redirect Flow

If COOP requirements are too restrictive for popup flow:

```javascript
// Instead of acquireTokenPopup, use acquireTokenRedirect
try {
    const result = await msalInstance.acquireTokenSilent(request);
    // Use token
} catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
        // Use redirect instead of popup
        await msalInstance.acquireTokenRedirect(request);
    }
}
```

## Browser Compatibility

COOP support varies across browsers:

-   **Chrome/Edge**: Full support since version 83
-   **Firefox**: Full support since version 79
-   **Safari**: Partial support since version 15.5
-   **Internet Explorer**: Not supported

## Additional Resources

-   [Cross-Origin Opener Policy (COOP) - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy)
-   [MSAL.js Browser Configuration](./configuration.md)
-   [MSAL.js Popup vs Redirect](./initialization.md#choosing-an-interaction-type)
-   [MSAL.js Error Handling](./errors.md)
