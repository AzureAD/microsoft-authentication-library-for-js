import { InvalidArgumentError } from "../../../src/core/error/InvalidArgumentError.js";
import { ArgumentValidator } from "../../../src/core/utils/ArgumentValidator.js";

describe("ArgumentValidator", () => {
    describe("ensureArgumentIsNotEmptyString", () => {
        it("should not throw an error if the string is non-empty", () => {
            expect(() => {
                ArgumentValidator.ensureArgumentIsNotEmptyString(
                    "testArg",
                    "validString",
                );
            }).not.toThrow();
        });

        it("should throw InvalidArgumentError if the string is empty", () => {
            expect(() => {
                ArgumentValidator.ensureArgumentIsNotEmptyString("testArg", "");
            }).toThrow(InvalidArgumentError);
        });

        it("should throw InvalidArgumentError if the string is only whitespace", () => {
            expect(() => {
                ArgumentValidator.ensureArgumentIsNotEmptyString(
                    "testArg",
                    "   ",
                );
            }).toThrow(InvalidArgumentError);
        });

        it("should pass correlationId to the error when the string is invalid", () => {
            const correlationId = "12345";
            try {
                ArgumentValidator.ensureArgumentIsNotEmptyString(
                    "testArg",
                    "",
                    correlationId,
                );
            } catch (error) {
                if (error instanceof InvalidArgumentError) {
                    expect(error.correlationId).toBe(correlationId);
                } else {
                    throw error;
                }
            }
        });
    });

    describe("ensureArgumentIsNotNullOrUndefined", () => {
        it("should not throw an error if the argument is not null or undefined", () => {
            expect(() => {
                ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
                    "testArg",
                    "validValue",
                );
            }).not.toThrow();

            expect(() => {
                ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
                    "testArg",
                    42,
                );
            }).not.toThrow();

            expect(() => {
                ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
                    "testArg",
                    {},
                );
            }).not.toThrow();
        });

        it("should throw InvalidArgumentError if the argument is null", () => {
            expect(() => {
                ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
                    "testArg",
                    null,
                );
            }).toThrow(InvalidArgumentError);
        });

        it("should throw InvalidArgumentError if the argument is undefined", () => {
            expect(() => {
                ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
                    "testArg",
                    undefined,
                );
            }).toThrow(InvalidArgumentError);
        });

        it("should pass correlationId to the error when the argument is invalid", () => {
            const correlationId = "12345";
            try {
                ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
                    "testArg",
                    null,
                    correlationId,
                );
            } catch (error) {
                if (error instanceof InvalidArgumentError) {
                    expect(error.correlationId).toBe(correlationId);
                } else {
                    throw error;
                }
            }
        });
    });
});
