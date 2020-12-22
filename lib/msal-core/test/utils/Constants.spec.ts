/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { expect } from "chai";
import { libraryVersion } from "../../src/utils/Constants";

describe("Constants.ts", () => {

    it("getLibraryVersion()", () => {
        const version: string = libraryVersion();

        expect(version).to.be.string;
        expect(version.split(".").length).to.be.greaterThan(2);
    });

});
