import { DefaultNestedAppAuthBridge, disposedBridges } from "./bridge.js";
import { createNestedAppAuthTransport } from "./transports.js";
import {
    NestedAppAuthBridge,
    NestedAppAuthBridgeOptions,
    NestedAppAuthWindow,
} from "./types.js";

/** Installs window.nestedAppAuthBridge for a supported native webview host. @public */
export function installNestedAppAuthBridge(
    options: NestedAppAuthBridgeOptions = {}
): NestedAppAuthBridge {
    const hostWindow = (options.window ?? window) as NestedAppAuthWindow;
    const existing = hostWindow.nestedAppAuthBridge;
    if (
        existing &&
        !options.replaceExisting &&
        !disposedBridges.has(existing)
    ) {
        return existing;
    }

    const transport =
        options.transport ??
        createNestedAppAuthTransport(
            hostWindow,
            options.host,
            options.handlerName
        );
    if (
        options.maxMessageLength !== undefined &&
        (!Number.isSafeInteger(options.maxMessageLength) ||
            options.maxMessageLength <= 0)
    ) {
        throw new RangeError("maxMessageLength must be a positive integer.");
    }
    if (existing) {
        existing.dispose();
    }
    const bridge = new DefaultNestedAppAuthBridge(
        transport,
        options.maxMessageLength
    );
    hostWindow.nestedAppAuthBridge = bridge;
    return bridge;
}
