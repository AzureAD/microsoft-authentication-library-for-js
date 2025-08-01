/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    RedirectError,
    CustomAuthApiError,
} from "../../../../src/custom_auth/core/error/CustomAuthApiError.js";

describe("CustomAuthApiError", () => {
    describe("RedirectError", () => {
        it("should create RedirectError with correlation ID only", () => {
            const correlationId = "test-correlation-id";
            const error = new RedirectError(correlationId);

            expect(error).toBeInstanceOf(RedirectError);
            expect(error.correlationId).toBe(correlationId);
            expect(error.error).toBe("redirect");
            expect(error.message).toContain("redirect:");
            expect(error.message).toContain(
                "No required authentication method"
            );
        });

        it("should create RedirectError with correlation ID and redirect reason", () => {
            const correlationId = "test-correlation-id";
            const redirectReason = "Client is missing mfa_required capability.";
            const error = new RedirectError(correlationId, redirectReason);

            expect(error).toBeInstanceOf(RedirectError);
            expect(error.correlationId).toBe(correlationId);
            expect(error.error).toBe("redirect");
            expect(error.message).toBe(`redirect: ${redirectReason}`);
            // Check that redirectReason is accessible via public property
            expect((error as any).redirectReason).toBe(redirectReason);
        });

        it("should create RedirectError with redirect reason only", () => {
            const redirectReason =
                "Client is missing registration_required capability.";
            const error = new RedirectError(undefined, redirectReason);

            expect(error).toBeInstanceOf(RedirectError);
            expect(error.correlationId).toBeUndefined();
            expect(error.error).toBe("redirect");
            expect((error as any).redirectReason).toBe(redirectReason);
        });

        it("should create RedirectError with no parameters", () => {
            const error = new RedirectError();

            expect(error).toBeInstanceOf(RedirectError);
            expect(error.correlationId).toBeUndefined();
            expect(error.error).toBe("redirect");
            expect((error as any).redirectReason).toBeUndefined();
        });

        it("should handle empty string redirect reason", () => {
            const correlationId = "test-correlation-id";
            const redirectReason = "";
            const error = new RedirectError(correlationId, redirectReason);

            expect(error).toBeInstanceOf(RedirectError);
            expect(error.correlationId).toBe(correlationId);
            expect(error.error).toBe("redirect");
            expect((error as any).redirectReason).toBe("");
        });

        it("should preserve prototype chain", () => {
            const error = new RedirectError("test-id", "test-reason");

            expect(error instanceof RedirectError).toBe(true);
            expect(error instanceof Error).toBe(true);
            expect(Object.getPrototypeOf(error)).toBe(RedirectError.prototype);
        });
    });

    describe("CustomAuthApiError", () => {
        it("should create CustomAuthApiError with all parameters", () => {
            const error = new CustomAuthApiError(
                "invalid_grant",
                "Invalid password",
                "test-correlation-id",
                [123, 456],
                "password_incorrect",
                [{ name: "username", type: "text" }],
                "continuation-token",
                "trace-id",
                "2023-01-01T00:00:00Z"
            );

            expect(error).toBeInstanceOf(CustomAuthApiError);
            expect(error.error).toBe("invalid_grant");
            expect(error.errorDescription).toBe("Invalid password");
            expect(error.correlationId).toBe("test-correlation-id");
            expect(error.errorCodes).toEqual([123, 456]);
            expect(error.subError).toBe("password_incorrect");
            expect(error.attributes).toEqual([
                { name: "username", type: "text" },
            ]);
            expect(error.continuationToken).toBe("continuation-token");
            expect(error.traceId).toBe("trace-id");
            expect(error.timestamp).toBe("2023-01-01T00:00:00Z");
        });

        it("should create CustomAuthApiError with minimal parameters", () => {
            const error = new CustomAuthApiError(
                "user_not_found",
                "User does not exist"
            );

            expect(error).toBeInstanceOf(CustomAuthApiError);
            expect(error.error).toBe("user_not_found");
            expect(error.errorDescription).toBe("User does not exist");
            expect(error.correlationId).toBeUndefined();
            expect(error.errorCodes).toEqual([]);
            expect(error.subError).toBe("");
            expect(error.attributes).toBeUndefined();
            expect(error.continuationToken).toBeUndefined();
            expect(error.traceId).toBeUndefined();
            expect(error.timestamp).toBeUndefined();
        });

        it("should preserve prototype chain", () => {
            const error = new CustomAuthApiError("test_error", "Test message");

            expect(error instanceof CustomAuthApiError).toBe(true);
            expect(error instanceof Error).toBe(true);
            expect(Object.getPrototypeOf(error)).toBe(
                CustomAuthApiError.prototype
            );
        });
    });
});
