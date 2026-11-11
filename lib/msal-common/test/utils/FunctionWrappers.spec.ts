import {
    AuthError,
    IPerformanceClient,
    Logger,
    LogLevel,
    ServerError,
    StubPerformanceClient,
    invoke,
    invokeAsync,
} from "../../src";

describe("FunctionWrappers Unit Tests", () => {
    const perfClient: IPerformanceClient = new StubPerformanceClient();
    const logger: Logger = new Logger({});

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("invoke", () => {
        it("success", () => {
            let end;
            const start = jest
                .spyOn(perfClient, "startMeasurement")
                .mockImplementationOnce(() => {
                    const inProgressMeasurement = perfClient.startMeasurement(
                        "testEventName",
                        "testCorrelationId"
                    );
                    end = jest.spyOn(inProgressMeasurement, "end");
                    return inProgressMeasurement;
                });
            const loggerSpy = jest.spyOn(logger, "trace");

            const testCallback = (arg1: string, arg2: number): string => {
                expect(arg1).toBe("arg1");
                expect(arg2).toBe(20);

                return "Success";
            };

            const result = invoke(
                testCallback,
                "testEventName",
                logger,
                perfClient,
                "testCorrelationId"
            )("arg1", 20);
            expect(result).toBe("Success");
            expect(start).toHaveBeenCalledWith(
                "testEventName",
                "testCorrelationId"
            );
            expect(end).toHaveBeenCalledWith({ success: true });
            expect(loggerSpy).toHaveBeenCalledTimes(2);
        });

        it("failure", () => {
            let end;
            const start = jest
                .spyOn(perfClient, "startMeasurement")
                .mockImplementationOnce(() => {
                    const inProgressMeasurement = perfClient.startMeasurement(
                        "testEventName",
                        "testCorrelationId"
                    );
                    end = jest.spyOn(inProgressMeasurement, "end");
                    return inProgressMeasurement;
                });
            const loggerSpy = jest.spyOn(logger, "trace");

            const error = new AuthError("Failure", "Call Failed");

            const testCallback = (arg1: string, arg2: number): string => {
                expect(arg1).toBe("arg1");
                expect(arg2).toBe(20);

                throw error;
            };

            try {
                invoke(
                    testCallback,
                    "testEventName",
                    logger,
                    perfClient,
                    "testCorrelationId"
                )("arg1", 20);
                throw "Unexpected, this call should throw";
            } catch (e) {
                expect(e).toBe(error);
            }
            expect(start).toHaveBeenCalledWith(
                "testEventName",
                "testCorrelationId"
            );
            expect(end).toHaveBeenCalledWith({ success: false }, error);
            expect(loggerSpy).toHaveBeenCalledTimes(2);
        });

        it.each([false, true])(
            "does not log exception contents when PII logging is %s",
            (piiLoggingEnabled) => {
                const messages: string[] = [];
                const testLogger = new Logger({
                    logLevel: LogLevel.Trace,
                    piiLoggingEnabled,
                    loggerCallback: (_level, message) => messages.push(message),
                });
                const error = Object.assign(
                    new ServerError(
                        "invalid_grant",
                        "synthetic-user@example.invalid"
                    ),
                    {
                        accessToken: "synthetic-access-token",
                        details: { privateKey: "synthetic-private-key" },
                    }
                );

                expect(() =>
                    invoke(
                        () => {
                            throw error;
                        },
                        "testEventName",
                        testLogger,
                        perfClient,
                        "testCorrelationId"
                    )()
                ).toThrow(error);
                expect(messages).toEqual(
                    expect.arrayContaining([
                        expect.stringContaining(
                            "Error occurred in 'testEventName'"
                        ),
                    ])
                );
                expect(messages.join("\n")).not.toContain("synthetic-");
            }
        );

        it("does not serialize thrown errors", () => {
            const error = Object.assign(new Error("Call Failed"), {
                toJSON: jest.fn().mockReturnValue("synthetic-access-token"),
            });

            expect(() =>
                invoke(
                    () => {
                        throw error;
                    },
                    "testEventName",
                    logger,
                    perfClient,
                    "testCorrelationId"
                )()
            ).toThrow(error);
            expect(error.toJSON).not.toHaveBeenCalled();
        });
    });

    describe("invokeAsync", () => {
        it("success", async () => {
            let end;
            const start = jest
                .spyOn(perfClient, "startMeasurement")
                .mockImplementationOnce(() => {
                    const inProgressMeasurement = perfClient.startMeasurement(
                        "testEventName",
                        "testCorrelationId"
                    );
                    end = jest.spyOn(inProgressMeasurement, "end");
                    return inProgressMeasurement;
                });
            const loggerSpy = jest.spyOn(logger, "trace");

            const testCallback = (
                arg1: string,
                arg2: number
            ): Promise<string> => {
                expect(arg1).toBe("arg1");
                expect(arg2).toBe(20);

                return Promise.resolve("Success");
            };

            const result = await invokeAsync(
                testCallback,
                "testEventName",
                logger,
                perfClient,
                "testCorrelationId"
            )("arg1", 20);
            expect(result).toBe("Success");
            expect(start).toHaveBeenCalledWith(
                "testEventName",
                "testCorrelationId"
            );
            expect(end).toHaveBeenCalledWith({ success: true });
            expect(loggerSpy).toHaveBeenCalledTimes(2);
        });

        it("failure", async () => {
            let end;
            const start = jest
                .spyOn(perfClient, "startMeasurement")
                .mockImplementationOnce(() => {
                    const inProgressMeasurement = perfClient.startMeasurement(
                        "testEventName",
                        "testCorrelationId"
                    );
                    end = jest.spyOn(inProgressMeasurement, "end");
                    return inProgressMeasurement;
                });
            const loggerSpy = jest.spyOn(logger, "trace");

            const error = new AuthError("Failure", "Call Failed");

            const testCallback = (
                arg1: string,
                arg2: number
            ): Promise<string> => {
                expect(arg1).toBe("arg1");
                expect(arg2).toBe(20);
                return Promise.reject(error);
            };

            try {
                await invokeAsync(
                    testCallback,
                    "testEventName",
                    logger,
                    perfClient,
                    "testCorrelationId"
                )("arg1", 20);
                throw "Unexpected, this call should throw";
            } catch (e) {
                expect(e).toBe(error);
            }
            expect(start).toHaveBeenCalledWith(
                "testEventName",
                "testCorrelationId"
            );
            expect(end).toHaveBeenCalledWith({ success: false }, error);
            expect(loggerSpy).toHaveBeenCalledTimes(2);
        });

        it.each([false, true])(
            "does not log exception contents when PII logging is %s",
            async (piiLoggingEnabled) => {
                const messages: string[] = [];
                const testLogger = new Logger({
                    logLevel: LogLevel.Trace,
                    piiLoggingEnabled,
                    loggerCallback: (_level, message) => messages.push(message),
                });
                const error = Object.assign(
                    new ServerError(
                        "invalid_grant",
                        "synthetic-user@example.invalid"
                    ),
                    {
                        accessToken: "synthetic-access-token",
                        details: { privateKey: "synthetic-private-key" },
                    }
                );

                await expect(
                    invokeAsync(
                        () => Promise.reject(error),
                        "testEventName",
                        testLogger,
                        perfClient,
                        "testCorrelationId"
                    )()
                ).rejects.toBe(error);
                expect(messages).toEqual(
                    expect.arrayContaining([
                        expect.stringContaining(
                            "Error occurred in 'testEventName'"
                        ),
                    ])
                );
                expect(messages.join("\n")).not.toContain("synthetic-");
            }
        );

        it("does not serialize rejected errors", async () => {
            const error = Object.assign(new Error("Call Failed"), {
                toJSON: jest.fn().mockReturnValue("synthetic-access-token"),
            });

            await expect(
                invokeAsync(
                    () => Promise.reject(error),
                    "testEventName",
                    logger,
                    perfClient,
                    "testCorrelationId"
                )()
            ).rejects.toBe(error);
            expect(error.toJSON).not.toHaveBeenCalled();
        });
    });
});
