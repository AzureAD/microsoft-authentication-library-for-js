import { Logger } from "@azure/msal-common";
import * as ResponseHandler from "../../src/response/ResponseHandler";
import { BrowserAuthErrorCodes } from "../../src";
import { createBrowserAuthError } from "../../src/error/BrowserAuthError";
import { TEST_CONFIG } from "../utils/StringConstants.js";

describe("ResponseHandler tests", () => {
    describe("deserializeResponse", () => {
        it("Returns deserialized response from hash", () => {
            // Test response with leading hash
            expect(
                ResponseHandler.deserializeResponse(
                    "#code=hello&state=state",
                    "hash",
                    new Logger({}),
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toEqual({ code: "hello", state: "state" });

            // Test response without leading hash
            expect(
                ResponseHandler.deserializeResponse(
                    "code=hello&state=state",
                    "hash",
                    new Logger({}),
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toEqual({ code: "hello", state: "state" });

            // Test error response
            expect(
                ResponseHandler.deserializeResponse(
                    "#error=errorCode&error_description=errorDescription",
                    "hash",
                    new Logger({}),
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toEqual({
                error: "errorCode",
                error_description: "errorDescription",
            });
        });

        it("Returns deserialized response from query", () => {
            // Test response with leading ?
            expect(
                ResponseHandler.deserializeResponse(
                    "?code=hello&state=state",
                    "query",
                    new Logger({}),
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toEqual({ code: "hello", state: "state" });

            // Test response without leading ?
            expect(
                ResponseHandler.deserializeResponse(
                    "code=hello&state=state",
                    "query",
                    new Logger({}),
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toEqual({ code: "hello", state: "state" });

            // Test error response
            expect(
                ResponseHandler.deserializeResponse(
                    "?error=errorCode&error_description=errorDescription",
                    "query",
                    new Logger({}),
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toEqual({
                error: "errorCode",
                error_description: "errorDescription",
            });
        });

        it("Throws error if response is empty", () => {
            expect(() =>
                ResponseHandler.deserializeResponse(
                    "#",
                    "hash",
                    new Logger({}),
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toThrowError(
                createBrowserAuthError(BrowserAuthErrorCodes.hashEmptyError, "")
            );

            expect(() =>
                ResponseHandler.deserializeResponse(
                    "",
                    "hash",
                    new Logger({}),
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toThrowError(
                createBrowserAuthError(BrowserAuthErrorCodes.hashEmptyError, "")
            );

            expect(() =>
                ResponseHandler.deserializeResponse(
                    "?",
                    "query",
                    new Logger({}),
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toThrowError(
                createBrowserAuthError(BrowserAuthErrorCodes.hashEmptyError, "")
            );

            expect(() =>
                ResponseHandler.deserializeResponse(
                    "",
                    "query",
                    new Logger({}),
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toThrowError(
                createBrowserAuthError(BrowserAuthErrorCodes.hashEmptyError, "")
            );
        });

        it("Throws error if response does not contain known properties", () => {
            expect(() =>
                ResponseHandler.deserializeResponse(
                    "#hello",
                    "hash",
                    new Logger({}),
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toThrowError(
                createBrowserAuthError(BrowserAuthErrorCodes.hashDoesNotContainKnownProperties, "")
            );
            expect(() =>
                ResponseHandler.deserializeResponse(
                    "#key=value",
                    "hash",
                    new Logger({}),
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toThrowError(
                createBrowserAuthError(BrowserAuthErrorCodes.hashDoesNotContainKnownProperties, "")
            );

            expect(() =>
                ResponseHandler.deserializeResponse(
                    "?hello",
                    "query",
                    new Logger({}),
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toThrowError(
                createBrowserAuthError(BrowserAuthErrorCodes.hashDoesNotContainKnownProperties, "")
            );

            expect(() =>
                ResponseHandler.deserializeResponse(
                    "?key=value",
                    "query",
                    new Logger({}),
                    TEST_CONFIG.CORRELATION_ID
                )
            ).toThrowError(
                createBrowserAuthError(BrowserAuthErrorCodes.hashDoesNotContainKnownProperties, "")
            );
        });
    });
});
