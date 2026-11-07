/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import ts from "typescript";

describe("bridge package type resolution", () => {
    it.each([
        ["redirect-bridge", "redirect_bridge"],
        ["popup-relay", "popup_relay"],
        ["web-broker-bridge", "webBrokerBridge"],
    ])("resolves %s with the legacy Node resolver", (subpath, directory) => {
        const resolution = ts.resolveModuleName(
            `@azure/msal-browser/${subpath}`,
            __filename,
            { moduleResolution: ts.ModuleResolutionKind.NodeJs },
            ts.sys
        );
        expect(
            resolution.resolvedModule?.resolvedFileName.replace(/\\/g, "/")
        ).toContain(`/types/${directory}/index.d.ts`);
    });
});
