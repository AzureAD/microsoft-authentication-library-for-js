/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Constants } from "../../src/utils/Constants";

/**
 * AuthErrorMessage class containing string constants used by error codes and messages.
 */
export const TestErrorMessage = {
    unexpectedError: {
        code: "unexpected_error",
        desc: "Unexpected error in authentication."
    }
};

/**
 * General error class thrown by the MSAL.js library.
 */
export class TestError extends Error {

    static TEST_ERROR_NAME: string = "TestError";
    /**
     * Short string denoting error
     */
    errorCode: string;

    /**
     * Detailed description of error
     */
    errorMessage: string;

    /**
     * Describes the subclass of an error
     */
    subError: string;

    constructor(errorCode?: string, errorMessage?: string, suberror?: string) {
        const errorString = errorMessage ? `${errorCode}: ${errorMessage}` : errorCode;
        super(errorString);
        Object.setPrototypeOf(this, TestError.prototype);

        this.errorCode = errorCode || Constants.EMPTY_STRING;
        this.errorMessage = errorMessage || "";
        this.subError = suberror || "";
        this.name = TestError.TEST_ERROR_NAME;
    }

    /**
     * Creates an error that is thrown when something unexpected happens in the library.
     * @param errDesc
     */
    static createTestSetupError(errDesc: string): TestError {
        return new TestError(TestErrorMessage.unexpectedError.code, `${TestErrorMessage.unexpectedError.desc}: ${errDesc}`);
    }
}
