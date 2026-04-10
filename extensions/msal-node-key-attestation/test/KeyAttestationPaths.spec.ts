/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as os from "os";
import { getHelperPath } from "../src/KeyAttestationPaths";

jest.mock("os");

describe("KeyAttestationPaths.getHelperPath", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (os.platform as jest.Mock).mockReturnValue("win32");
        (os.arch as jest.Mock).mockReturnValue("x64");
    });

    it("returns a path ending in MsalMtlsMsiHelper.exe on win32/x64", () => {
        const helperPath = getHelperPath();
        expect(helperPath).toMatch(/MsalMtlsMsiHelper\.exe$/);
        expect(helperPath).toContain(`win-x64`);
    });

    it("throws on non-Windows platform", () => {
        (os.platform as jest.Mock).mockReturnValue("linux");
        expect(() => getHelperPath()).toThrow("Windows");
    });

    it("throws on unsupported architecture", () => {
        (os.arch as jest.Mock).mockReturnValue("ia32");
        expect(() => getHelperPath()).toThrow("Unsupported architecture");
    });
});
