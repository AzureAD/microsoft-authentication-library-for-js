import { InvalidArgumentError } from "../../../../src/custom_auth/core/error/InvalidArgumentError.js";
import * as ArgumentValidator from "../../../../src/custom_auth/core/utils/ArgumentValidator.js";

describe("ArgumentValidator", () => {
    describe("ensureArgumentIsNotEmptyString", () => {
        it("should not throw an error if the string is non-empty", () => {
            expect(() => {
                ArgumentValidator.ensureArgumentIsNotEmptyString("testArg", "validString");
            }).not.toThrow();
        });

        it("should throw InvalidArgumentError if the string is empty", () => {
            expect(() => {
                ArgumentValidator.ensureArgumentIsNotEmptyString("testArg", "");
            }).toThrow(InvalidArgumentError);
        });

        it("should throw InvalidArgumentError if the string is only whitespace", () => {
            expect(() => {
                ArgumentValidator.ensureArgumentIsNotEmptyString("testArg", "   ");
            }).toThrow(InvalidArgumentError);
        });

        it("should pass correlationId to the error when the string is invalid", () => {
            const correlationId = "12345";
            try {
                ArgumentValidator.ensureArgumentIsNotEmptyString("testArg", "", correlationId);
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
                ArgumentValidator.ensureArgumentIsNotNullOrUndefined("testArg", "validValue");
            }).not.toThrow();

            expect(() => {
                ArgumentValidator.ensureArgumentIsNotNullOrUndefined("testArg", 42);
            }).not.toThrow();

            expect(() => {
                ArgumentValidator.ensureArgumentIsNotNullOrUndefined("testArg", {});
            }).not.toThrow();
        });

        it("should throw InvalidArgumentError if the argument is null", () => {
            expect(() => {
                ArgumentValidator.ensureArgumentIsNotNullOrUndefined("testArg", null);
            }).toThrow(InvalidArgumentError);
        });

        it("should throw InvalidArgumentError if the argument is undefined", () => {
            expect(() => {
                ArgumentValidator.ensureArgumentIsNotNullOrUndefined("testArg", undefined);
            }).toThrow(InvalidArgumentError);
        });

        it("should pass correlationId to the error when the argument is invalid", () => {
            const correlationId = "12345";
            try {
                ArgumentValidator.ensureArgumentIsNotNullOrUndefined(
                    "testArg",
                    null,
                    correlationId
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

    describe("ensureArgumentIsJSONString", () => {
        it("should not throw an error when argValue is a valid JSON object string", () => {
            expect(() => {
                ArgumentValidator.ensureArgumentIsJSONString("testArg", '{"key": "value"}');
            }).not.toThrow();

            expect(() => {
                ArgumentValidator.ensureArgumentIsJSONString("testArg", "{}"); // Empty object
            }).not.toThrow();
        });

        it("should not throw an error when argValue is a valid JSON object string with whitespace", () => {
            expect(() => {
                ArgumentValidator.ensureArgumentIsJSONString("testArg", '  {"key": "value"}  ');
            }).not.toThrow();
        });

        it("should throw InvalidArgumentError when argValue is not a JSON object", () => {
            expect(() => {
                ArgumentValidator.ensureArgumentIsJSONString("testArg", "[]"); // Array - not an object
            }).toThrow(InvalidArgumentError);

            expect(() => {
                ArgumentValidator.ensureArgumentIsJSONString("testArg", '"string"'); // String - not an object
            }).toThrow(InvalidArgumentError);

            expect(() => {
                ArgumentValidator.ensureArgumentIsJSONString("testArg", '""'); // Empty string - not an object
            }).toThrow(InvalidArgumentError);

            expect(() => {
                ArgumentValidator.ensureArgumentIsJSONString("testArg", "123"); // Number - not an object
            }).toThrow(InvalidArgumentError);

            expect(() => {
                ArgumentValidator.ensureArgumentIsJSONString("testArg", "true"); // Boolean - not an object
            }).toThrow(InvalidArgumentError);

            expect(() => {
                ArgumentValidator.ensureArgumentIsJSONString("testArg", "null"); // Null - not an object
            }).toThrow(InvalidArgumentError);

            expect(() => {
                ArgumentValidator.ensureArgumentIsJSONString("testArg", ""); // Empty string - not valid JSON
            }).toThrow(InvalidArgumentError);

            expect(() => {
                ArgumentValidator.ensureArgumentIsJSONString("testArg", "   "); // Whitespace only - not valid JSON
            }).toThrow(InvalidArgumentError);

            expect(() => {
                ArgumentValidator.ensureArgumentIsJSONString("testArg", "\t\n "); // Whitespace only - not valid JSON
            }).toThrow(InvalidArgumentError);
        });

        it("should throw InvalidArgumentError when argValue is not valid JSON", () => {
            expect(() => {
                ArgumentValidator.ensureArgumentIsJSONString("testArg", "invalid json");
            }).toThrow(InvalidArgumentError);

            expect(() => {
                ArgumentValidator.ensureArgumentIsJSONString("testArg", '{"key": value}'); // missing quotes around value
            }).toThrow(InvalidArgumentError);

            expect(() => {
                ArgumentValidator.ensureArgumentIsJSONString("testArg", '{key: "value"}'); // missing quotes around key
            }).toThrow(InvalidArgumentError);

            expect(() => {
                ArgumentValidator.ensureArgumentIsJSONString("testArg", '{"key": "value",}'); // trailing comma
            }).toThrow(InvalidArgumentError);

            expect(() => {
                ArgumentValidator.ensureArgumentIsJSONString("testArg", "undefined");
            }).toThrow(InvalidArgumentError);
        });

        it("should pass correlationId to the error when argValue is invalid JSON", () => {
            const correlationId = "test-correlation-id";
            try {
                ArgumentValidator.ensureArgumentIsJSONString(
                    "testArg",
                    "invalid json",
                    correlationId
                );
            } catch (error) {
                if (error instanceof InvalidArgumentError) {
                    expect(error.correlationId).toBe(correlationId);
                } else {
                    throw error;
                }
            }
        });

        it("should handle complex valid JSON structures", () => {
            const complexJson = JSON.stringify({
                access_token: {
                    acrs: {
                        essential: true,
                        value: "c1",
                    },
                },
                id_token: {
                    auth_time: {
                        essential: true,
                    },
                },
            });

            expect(() => {
                ArgumentValidator.ensureArgumentIsJSONString("testArg", complexJson);
            }).not.toThrow();
        });

        it("should handle arrays as invalid (not JSON objects)", () => {
            const arrayJson = JSON.stringify([
                { name: "item1", value: 1 },
                { name: "item2", value: 2 },
            ]);

            expect(() => {
                ArgumentValidator.ensureArgumentIsJSONString("testArg", arrayJson);
            }).toThrow(InvalidArgumentError);
        });
    });
});
