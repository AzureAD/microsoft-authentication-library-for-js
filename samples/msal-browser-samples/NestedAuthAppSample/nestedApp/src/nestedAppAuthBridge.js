/*
 * Nested App Authentication (NAA) bridge shim — nested (child) side.
 *
 * The nested app runs in an iframe on a different origin from the host, so MSAL
 * inside the iframe cannot reach the host's bridge object directly. This shim
 * installs `window.nestedAppAuthBridge` (the interface `createNestablePublicClientApplication`
 * looks for) and relays every message to the host over `postMessage`.
 *
 * Wire protocol (see `lib/msal-browser/src/naa`):
 *   - Nested -> Host: JSON `BridgeRequestEnvelope` strings (GetInitContext, GetToken, GetTokenPopup).
 *   - Host -> Nested: JSON `BridgeResponseEnvelope` strings, delivered to the
 *     "message" listener MSAL registers via `addEventListener`.
 *
 * This shim must be installed BEFORE `createNestablePublicClientApplication` so
 * the bridge exists when MSAL probes for it.
 */

/**
 * Installs the nested-side `window.nestedAppAuthBridge`.
 *
 * @returns {boolean} true when the bridge was installed (the app is embedded),
 * false when the app is running as a top-level frame (no host to broker with).
 */
export function installNestedAppAuthBridge() {
    if (typeof window === "undefined" || window.parent === window) {
        // Not embedded in a host frame — nothing to bridge to.
        return false;
    }

    // Resolve the host (parent) origin so we never post tokens to the wrong frame.
    let hostOrigin = "*";
    try {
        if (document.referrer) {
            hostOrigin = new URL(document.referrer).origin;
        }
    } catch {
        hostOrigin = "*";
    }

    const listeners = new Map();

    window.nestedAppAuthBridge = {
        addEventListener(eventName, callback) {
            const wrapper = (event) => {
                if (event.source !== window.parent) {
                    return;
                }
                if (hostOrigin !== "*" && event.origin !== hostOrigin) {
                    return;
                }
                if (typeof event.data !== "string") {
                    return;
                }
                // Only forward NAA responses; MSAL's listener JSON.parses every
                // payload it receives, so unrelated postMessages must be dropped.
                let parsed;
                try {
                    parsed = JSON.parse(event.data);
                } catch {
                    return;
                }
                if (!parsed || parsed.messageType !== "NestedAppAuthResponse") {
                    return;
                }
                callback(event.data);
            };
            listeners.set(callback, wrapper);
            window.addEventListener(eventName, wrapper);
        },
        postMessage(message) {
            window.parent.postMessage(message, hostOrigin);
        },
        removeEventListener(eventName, callback) {
            const wrapper = listeners.get(callback);
            if (wrapper) {
                window.removeEventListener(eventName, wrapper);
                listeners.delete(callback);
            }
        },
    };

    return true;
}
