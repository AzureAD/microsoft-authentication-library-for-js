import { InvalidArgumentError } from "../../../../src/custom_auth/core/error/InvalidArgumentError.js";
import {
    ensureArgumentIsNotEmptyString,
    ensureArgumentIsNotNullOrUndefined,
    ensureArgumentIsJSONString,
} from "../../../../src/custom_auth/core/utils/ArgumentValidator.js";

describe("ArgumentValidator", () => {
    describe("ensureArgumentIsNotEmptyString", () => {
        it("should not throw an error if the string is non-empty", () => {
            expect(() => {
                ensureArgumentIsNotEmptyString("testArg", "validString");
            }).not.toThrow();
        });

        it("should throw InvalidArgumentError if the string is empty", () => {
            expect(() => {
                ensureArgumentIsNotEmptyString("testArg", "");
            }).toThrow(InvalidArgumentError);
        });

        it("should throw InvalidArgumentError if the string is only whitespace", () => {
            expect(() => {
                ensureArgumentIsNotEmptyString("testArg", "   ");
            }).toThrow(InvalidArgumentError);
        });

        it("should pass correlationId to the error when the string is invalid", () => {
            const correlationId = "12345";
            try {
                ensureArgumentIsNotEmptyString("testArg", "", correlationId);
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
                ensureArgumentIsNotNullOrUndefined("testArg", "validValue");
            }).not.toThrow();

            expect(() => {
                ensureArgumentIsNotNullOrUndefined("testArg", 42);
            }).not.toThrow();

            expect(() => {
                ensureArgumentIsNotNullOrUndefined("testArg", {});
            }).not.toThrow();
        });

        it("should throw InvalidArgumentError if the argument is null", () => {
            expect(() => {
                ensureArgumentIsNotNullOrUndefined("testArg", null);
            }).toThrow(InvalidArgumentError);
        });

        it("should throw InvalidArgumentError if the argument is undefined", () => {
            expect(() => {
                ensureArgumentIsNotNullOrUndefined("testArg", undefined);
            }).toThrow(InvalidArgumentError);
        });

        it("should pass correlationId to the error when the argument is invalid", () => {
            const correlationId = "12345";
            try {
                ensureArgumentIsNotNullOrUndefined(
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
        it("should not throw an error when argValue is undefined", () => {
            expect(() => {
                ensureArgumentIsJSONString("testArg", undefined);
            }).not.toThrow();
        });

        it("should not throw an error when argValue is a valid JSON string", () => {
            expect(() => {
                ensureArgumentIsJSONString("testArg", '{"key": "value"}');
            }).not.toThrow();

            expect(() => {
                ensureArgumentIsJSONString("testArg", "[]");
            }).not.toThrow();

            expect(() => {
                ensureArgumentIsJSONString("testArg", '"string"');
            }).not.toThrow();

            expect(() => {
                ensureArgumentIsJSONString("testArg", '""'); // JSON string (empty string value)
            }).not.toThrow();

            expect(() => {
                ensureArgumentIsJSONString("testArg", "123");
            }).not.toThrow();

            expect(() => {
                ensureArgumentIsJSONString("testArg", "true");
            }).not.toThrow();

            expect(() => {
                ensureArgumentIsJSONString("testArg", "null");
            }).not.toThrow();
        });

        it("should not throw an error when argValue is a valid JSON string with whitespace", () => {
            expect(() => {
                ensureArgumentIsJSONString("testArg", '  {"key": "value"}  ');
            }).not.toThrow();
        });

        it("should throw InvalidArgumentError when argValue is an empty string", () => {
            expect(() => {
                ensureArgumentIsJSONString("testArg", "");
            }).toThrow(InvalidArgumentError);
        });

        it("should throw InvalidArgumentError when argValue is only whitespace", () => {
            expect(() => {
                ensureArgumentIsJSONString("testArg", "   ");
            }).toThrow(InvalidArgumentError);

            expect(() => {
                ensureArgumentIsJSONString("testArg", "\t\n ");
            }).toThrow(InvalidArgumentError);
        });

        it("should throw InvalidArgumentError when argValue is not valid JSON", () => {
            expect(() => {
                ensureArgumentIsJSONString("testArg", "invalid json");
            }).toThrow(InvalidArgumentError);

            expect(() => {
                ensureArgumentIsJSONString("testArg", '{"key": value}'); // missing quotes around value
            }).toThrow(InvalidArgumentError);

            expect(() => {
                ensureArgumentIsJSONString("testArg", '{key: "value"}'); // missing quotes around key
            }).toThrow(InvalidArgumentError);

            expect(() => {
                ensureArgumentIsJSONString("testArg", '{"key": "value",}'); // trailing comma
            }).toThrow(InvalidArgumentError);

            expect(() => {
                ensureArgumentIsJSONString("testArg", "undefined");
            }).toThrow(InvalidArgumentError);
        });

        it("should pass correlationId to the error when argValue is empty", () => {
            const correlationId = "test-correlation-id";
            try {
                ensureArgumentIsJSONString("testArg", "", correlationId);
            } catch (error) {
                if (error instanceof InvalidArgumentError) {
                    expect(error.correlationId).toBe(correlationId);
                } else {
                    throw error;
                }
            }
        });

        it("should pass correlationId to the error when argValue is invalid JSON", () => {
            const correlationId = "test-correlation-id";
            try {
                ensureArgumentIsJSONString(
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
                ensureArgumentIsJSONString("testArg", complexJson);
            }).not.toThrow();
        });

        it("should handle arrays as valid JSON", () => {
            const arrayJson = JSON.stringify([
                { name: "item1", value: 1 },
                { name: "item2", value: 2 },
            ]);

            expect(() => {
                ensureArgumentIsJSONString("testArg", arrayJson);
            }).not.toThrow();
        });
    });
});
