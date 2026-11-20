/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { DefaultNestedAppAuthBridge } from "./bridge.js";
import { createNestedAppAuthTransport } from "./transports.js";
import {
    NestedAppAuthBridge,
    NestedAppAuthBridgeOptions,
    NestedAppAuthWindow,
} from "./types.js";

/**
 * Installs `window.nestedAppAuthBridge` for a supported native webview host.
 *
 * @param options - Host selection, transport, and bridge lifecycle options.
 * @returns The installed bridge, or the existing bridge when replacement is
 * not requested.
 *
 * @public
 */
export function installNestedAppAuthBridge(
    options: NestedAppAuthBridgeOptions = {}
): NestedAppAuthBridge {
    const hostWindow = (options.window ?? window) as NestedAppAuthWindow;
    if (hostWindow.nestedAppAuthBridge && !options.replaceExisting) {
        return hostWindow.nestedAppAuthBridge;
    }

    if (hostWindow.nestedAppAuthBridge) {
        hostWindow.nestedAppAuthBridge.dispose();
    }

    const transport =
        options.transport ??
        createNestedAppAuthTransport(
            hostWindow,
            options.host,
            options.handlerName
        );
    const bridge = new DefaultNestedAppAuthBridge(
        transport,
        options.maxMessageLength
    );
    hostWindow.nestedAppAuthBridge = bridge;

    return bridge;
}
