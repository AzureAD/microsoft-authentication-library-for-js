/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    MSALError
} from "../src/MSALError";

import { TestBed } from "@angular/core/testing";

describe("MsalError tests", () => {
    afterEach(() => {
        TestBed.resetTestEnvironment();
        TestBed.resetTestingModule();
    });

    it("error property getter", () => {
        const error = new MSALError("testErrorCode");
        expect(error.error).toBe("testErrorCode");
    });

    it("errorDesc property getter", () => {
        const error = new MSALError("testErrorCode", "testErrorDesc");
        expect(error.errorDesc).toBe("testErrorDesc");
    });

    it("error scopes property getter", () => {
        const error = new MSALError("testErrorCode", "testErrorDesc", "testScopes");
        expect(error.scopes).toBe("testScopes");
    });

    it("error property setter", () => {
        const error = new MSALError("testErrorCode");
        error.error = "differentTestError";
        expect(error.error).toBe("differentTestError");
    });

    it("errorDesc property getter", () => {
        const error = new MSALError("testErrorCode");
        error.errorDesc = "testErrorDesc";
        expect(error.errorDesc).toBe("testErrorDesc");
    });

    it("error scopes property getter", () => {
        const error = new MSALError("testErrorCode");
        error.scopes = "testScopes";
        expect(error.scopes).toBe("testScopes");
    });
});
