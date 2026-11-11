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
            const piiLoggerSpy = jest.spyOn(logger, "tracePii");

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
            expect(piiLoggerSpy).toHaveBeenCalledWith(
                JSON.stringify(error),
                "testCorrelationId"
            );
        });

        it.each([false, true])(
            "respects the PII logging setting (%s) for exception contents",
            (piiLoggingEnabled) => {
                const messages: { message: string; containsPii: boolean }[] =
                    [];
                const testLogger = new Logger({
                    logLevel: LogLevel.Trace,
                    piiLoggingEnabled,
                    loggerCallback: (_level, message, containsPii) =>
                        messages.push({ message, containsPii }),
                });
                const error = new ServerError(
                    "invalid_grant",
                    "testCorrelationId",
                    "synthetic-user@example.invalid"
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
                        {
                            message: expect.stringContaining(
                                "Error occurred in 'testEventName'"
                            ),
                            containsPii: false,
                        },
                    ])
                );
                expect(
                    messages.filter(({ message }) =>
                        message.includes("synthetic-user@example.invalid")
                    )
                ).toEqual(
                    piiLoggingEnabled
                        ? [
                              {
                                  message: expect.stringContaining(
                                      JSON.stringify(error)
                                  ),
                                  containsPii: true,
                              },
                          ]
                        : []
                );
            }
        );

        it("preserves the original error when serialization fails", () => {
            const loggerSpy = jest.spyOn(logger, "trace");
            const error = Object.assign(new Error("Call Failed"), {
                toJSON: () => {
                    throw new Error("Serialization failed");
                },
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
            expect(loggerSpy).toHaveBeenCalledWith(
                "Unable to print error message.",
                "testCorrelationId"
            );
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
            const piiLoggerSpy = jest.spyOn(logger, "tracePii");

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
            expect(piiLoggerSpy).toHaveBeenCalledWith(
                JSON.stringify(error),
                "testCorrelationId"
            );
        });

        it.each([false, true])(
            "respects the PII logging setting (%s) for exception contents",
            async (piiLoggingEnabled) => {
                const messages: { message: string; containsPii: boolean }[] =
                    [];
                const testLogger = new Logger({
                    logLevel: LogLevel.Trace,
                    piiLoggingEnabled,
                    loggerCallback: (_level, message, containsPii) =>
                        messages.push({ message, containsPii }),
                });
                const error = new ServerError(
                    "invalid_grant",
                    "testCorrelationId",
                    "synthetic-user@example.invalid"
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
                        {
                            message: expect.stringContaining(
                                "Error occurred in 'testEventName'"
                            ),
                            containsPii: false,
                        },
                    ])
                );
                expect(
                    messages.filter(({ message }) =>
                        message.includes("synthetic-user@example.invalid")
                    )
                ).toEqual(
                    piiLoggingEnabled
                        ? [
                              {
                                  message: expect.stringContaining(
                                      JSON.stringify(error)
                                  ),
                                  containsPii: true,
                              },
                          ]
                        : []
                );
            }
        );

        it("preserves the original error when serialization fails", async () => {
            const loggerSpy = jest.spyOn(logger, "trace");
            const error = Object.assign(new Error("Call Failed"), {
                toJSON: () => {
                    throw new Error("Serialization failed");
                },
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
            expect(loggerSpy).toHaveBeenCalledWith(
                "Unable to print error message.",
                "testCorrelationId"
            );
        });
    });
});
