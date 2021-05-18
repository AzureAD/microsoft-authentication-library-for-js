/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * AuthErrorMessage class containing string constants used by error codes and messages.
 */
export const TestErrorMessage = {
    testSetupError: {
        code: "test_setup_error",
        desc: "Error in test setup"
    }
};

/**
 * General error class thrown by the MSAL.js library.
 */
export class TestError extends Error {

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

        this.errorCode = errorCode || "";
        this.errorMessage = errorMessage || "";
        this.subError = suberror || "";
        this.name = "TestError";
    }

    /**
     * Creates an error that is thrown when something unexpected happens in the library.
     * @param errDesc
     */
    static createTestSetupError(errDesc: string): TestError {
        return new TestError(TestErrorMessage.testSetupError.code, `${TestErrorMessage.testSetupError.desc}: ${errDesc}`);
    }

    static createTestFailureError(errDesc: string): TestError {
        return new TestError(TestErrorMessage.testSetupError.code, `${TestErrorMessage.testSetupError.desc}: ${errDesc}`);
    }
}
