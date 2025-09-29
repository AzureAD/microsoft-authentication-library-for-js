import { LoggerOptions } from "../../src/config/ClientConfiguration.js";
import { LogLevel, Logger } from "../../src/logger/Logger.js";
import { TEST_CONFIG } from "../test_kit/StringConstants.js";

describe("Logger.ts Class Unit Tests", () => {
    let loggerOptions: LoggerOptions;
    let logStore: {
        [LogLevel.Error]?: string;
        [LogLevel.Warning]?: string;
        [LogLevel.Info]?: string;
        [LogLevel.Verbose]?: string;
        [LogLevel.Trace]?: string;
    } = {};
    beforeEach(() => {
        loggerOptions = {
            loggerCallback: (
                level: LogLevel,
                message: string,
                containsPii: boolean
            ): void => {
                logStore[level] = message;
            },
            piiLoggingEnabled: true,
            logLevel: LogLevel.Verbose,
        };
    });

    afterEach(() => {
        logStore = {};
        jest.restoreAllMocks();
    });

    describe("Constructor and Getters", () => {
        it("Creates a logger with the given logger options", () => {
            const logger = new Logger(loggerOptions);
            expect(logger.isPiiLoggingEnabled()).toBe(true);
        });

        it("Creates a logger with level Error", () => {
            const options = { ...loggerOptions, logLevel: LogLevel.Error };
            const logger = new Logger(options);
            logger.error("Message", "");
            logger.warning("Message", "");
            logger.info("Message", "");
            logger.verbose("Message", "");
            logger.trace("Message", "");
            expect(logStore[LogLevel.Error]).toBeTruthy();
            expect(logStore[LogLevel.Warning]).toBe(undefined);
            expect(logStore[LogLevel.Info]).toBe(undefined);
            expect(logStore[LogLevel.Verbose]).toBe(undefined);
            expect(logStore[LogLevel.Trace]).toBe(undefined);
        });

        it("Creates a logger with level Warning", () => {
            const options = { ...loggerOptions, logLevel: LogLevel.Warning };
            const logger = new Logger(options);
            logger.error("Message", "");
            logger.warning("Message", "");
            logger.info("Message", "");
            logger.verbose("Message", "");
            logger.trace("Message", "");
            expect(logStore[LogLevel.Error]).toBeTruthy();
            expect(logStore[LogLevel.Warning]).toBeTruthy();
            expect(logStore[LogLevel.Info]).toBe(undefined);
            expect(logStore[LogLevel.Verbose]).toBe(undefined);
            expect(logStore[LogLevel.Trace]).toBe(undefined);
        });

        it("Creates a logger with level Info", () => {
            const options = { ...loggerOptions, logLevel: LogLevel.Info };
            const logger = new Logger(options);
            logger.error("Message", "");
            logger.warning("Message", "");
            logger.info("Message", "");
            logger.verbose("Message", "");
            logger.trace("Message", "");
            expect(logStore[LogLevel.Error]).toBeTruthy();
            expect(logStore[LogLevel.Warning]).toBeTruthy();
            expect(logStore[LogLevel.Info]).toBeTruthy();
            expect(logStore[LogLevel.Verbose]).toBe(undefined);
            expect(logStore[LogLevel.Trace]).toBe(undefined);
        });

        it("Creates a logger with level Verbose", () => {
            const options = { ...loggerOptions, logLevel: LogLevel.Verbose };
            const logger = new Logger(options);
            logger.error("Message", "");
            logger.warning("Message", "");
            logger.info("Message", "");
            logger.verbose("Message", "");
            logger.trace("Message", "");
            expect(logStore[LogLevel.Error]).toBeTruthy();
            expect(logStore[LogLevel.Warning]).toBeTruthy();
            expect(logStore[LogLevel.Info]).toBeTruthy();
            expect(logStore[LogLevel.Verbose]).toBeTruthy();
            expect(logStore[LogLevel.Trace]).toBe(undefined);
        });

        it("Creates a logger with level Trace", () => {
            const options = { ...loggerOptions, logLevel: LogLevel.Trace };
            const logger = new Logger(options);
            logger.error("Message", "");
            logger.warning("Message", "");
            logger.info("Message", "");
            logger.verbose("Message", "");
            logger.trace("Message", "");
            expect(logStore[LogLevel.Error]).toBeTruthy();
            expect(logStore[LogLevel.Warning]).toBeTruthy();
            expect(logStore[LogLevel.Info]).toBeTruthy();
            expect(logStore[LogLevel.Verbose]).toBeTruthy();
            expect(logStore[LogLevel.Trace]).toBeTruthy();
        });

        it("Creates a logger with level Info if logLevel is not passed in", () => {
            loggerOptions = {
                loggerCallback: (
                    level: LogLevel,
                    message: string,
                    containsPii: boolean
                ): void => {
                    logStore[level] = message;
                },
                piiLoggingEnabled: true,
            };
            const logger = new Logger(loggerOptions);
            logger.error("Message", "");
            logger.warning("Message", "");
            logger.info("Message", "");
            logger.verbose("Message", "");
            logger.trace("Message", "");
            expect(logStore[LogLevel.Error]).toBeTruthy();
            expect(logStore[LogLevel.Warning]).toBeTruthy();
            expect(logStore[LogLevel.Info]).toBeTruthy();
            expect(logStore[LogLevel.Verbose]).toBe(undefined);
            expect(logStore[LogLevel.Trace]).toBe(undefined);
        });

        it("Creates a logger with level Info if logLevel passed in is a string", () => {
            loggerOptions = {
                loggerCallback: (
                    level: LogLevel,
                    message: string,
                    containsPii: boolean
                ): void => {
                    logStore[level] = message;
                },
                piiLoggingEnabled: true,
                //@ts-ignore
                logLevel: "Verbose",
            };
            const logger = new Logger(loggerOptions);
            logger.error("Message", "");
            logger.warning("Message", "");
            logger.info("Message", "");
            logger.verbose("Message", "");
            logger.trace("Message", "");
            expect(logStore[LogLevel.Error]).toBeTruthy();
            expect(logStore[LogLevel.Warning]).toBeTruthy();
            expect(logStore[LogLevel.Info]).toBeTruthy();
            expect(logStore[LogLevel.Verbose]).toBe(undefined);
            expect(logStore[LogLevel.Trace]).toBe(undefined);
        });

        it("Creates a logger with level Info if logLevel passed in is an array", () => {
            loggerOptions = {
                loggerCallback: (
                    level: LogLevel,
                    message: string,
                    containsPii: boolean
                ): void => {
                    logStore[level] = message;
                },
                piiLoggingEnabled: true,
                //@ts-ignore
                logLevel: [LogLevel.Verbose],
            };
            const logger = new Logger(loggerOptions);
            logger.error("Message", "");
            logger.warning("Message", "");
            logger.info("Message", "");
            logger.verbose("Message", "");
            logger.trace("Message", "");
            expect(logStore[LogLevel.Error]).toBeTruthy();
            expect(logStore[LogLevel.Warning]).toBeTruthy();
            expect(logStore[LogLevel.Info]).toBeTruthy();
            expect(logStore[LogLevel.Verbose]).toBe(undefined);
            expect(logStore[LogLevel.Trace]).toBe(undefined);
        });

        it("Creates a logger with level Info if logLevel passed in is null", () => {
            loggerOptions = {
                loggerCallback: (
                    level: LogLevel,
                    message: string,
                    containsPii: boolean
                ): void => {
                    logStore[level] = message;
                },
                piiLoggingEnabled: true,
                //@ts-ignore
                logLevel: null,
            };
            const logger = new Logger(loggerOptions);
            logger.error("Message", "");
            logger.warning("Message", "");
            logger.info("Message", "");
            logger.verbose("Message", "");
            logger.trace("Message", "");
            expect(logStore[LogLevel.Error]).toBeTruthy();
            expect(logStore[LogLevel.Warning]).toBeTruthy();
            expect(logStore[LogLevel.Info]).toBeTruthy();
            expect(logStore[LogLevel.Verbose]).toBe(undefined);
            expect(logStore[LogLevel.Trace]).toBe(undefined);
        });
    });

    describe("clone() tests", () => {
        it("Creates a new logger with logger configurations of existing logger", () => {
            const logger = new Logger(loggerOptions);
            const loggerClone = logger.clone("msal-common", "1.0.0");
            expect(loggerClone.isPiiLoggingEnabled()).toBe(
                logger.isPiiLoggingEnabled()
            );
        });

        it("Creates a new logger with package name and package version", () => {
            const logger = new Logger(loggerOptions);
            const loggerClone = logger.clone("msal-common", "2.0.0");
            loggerClone.info("Message", TEST_CONFIG.CORRELATION_ID);
            expect(logStore[LogLevel.Info]).toContain("msal-common");
            expect(logStore[LogLevel.Info]).toContain("2.0.0");
            expect(logStore[LogLevel.Info]).toContain("msal-common@2.0.0");
        });
    });

    describe("clone() tests", () => {
        it("Creates a new logger with logger configurations of existing logger", () => {
            const logger = new Logger(loggerOptions);
            const loggerClone = logger.clone("msal-common", "1.0.0");
            expect(loggerClone.isPiiLoggingEnabled()).toBe(
                logger.isPiiLoggingEnabled()
            );
        });

        it("Creates a new logger with package name and package version", () => {
            const logger = new Logger(loggerOptions);
            const loggerClone = logger.clone("msal-common", "2.0.0");
            loggerClone.info("Message", TEST_CONFIG.CORRELATION_ID);
            expect(logStore[LogLevel.Info]).toContain("msal-common");
            expect(logStore[LogLevel.Info]).toContain("2.0.0");
            expect(logStore[LogLevel.Info]).toContain("msal-common@2.0.0");
        });
    });

    describe("executeCallback() tests", () => {
        it("Executes a callback if assigned", () => {
            const logger = new Logger(loggerOptions);
            logger.executeCallback(LogLevel.Error, "Message", true);
            expect(logStore[LogLevel.Error]).toBe("Message");
        });
    });

    describe("Error APIs", () => {
        it("Executes error APIs", () => {
            const executeCbSpy = jest.spyOn(
                Logger.prototype,
                "executeCallback"
            );

            const logger = new Logger(loggerOptions);
            logger.error("Message", "");
            expect(executeCbSpy).toHaveBeenCalledWith(
                LogLevel.Error,
                expect.anything(),
                expect.anything()
            );
        });

        it("Executes errorPii APIs", () => {
            const executeCbSpy = jest.spyOn(
                Logger.prototype,
                "executeCallback"
            );

            const logger = new Logger(loggerOptions);
            logger.errorPii("Message", TEST_CONFIG.CORRELATION_ID);
            expect(executeCbSpy).toHaveBeenCalledWith(
                LogLevel.Error,
                expect.anything(),
                expect.anything()
            );
        });

        it("Does not execute errorPii APIs if piiLogging is disabled", () => {
            loggerOptions.piiLoggingEnabled = false;
            const executeCbSpy = jest.spyOn(
                Logger.prototype,
                "executeCallback"
            );

            const logger = new Logger(loggerOptions);
            logger.errorPii("Message", TEST_CONFIG.CORRELATION_ID);
            expect(executeCbSpy).not.toHaveBeenCalled();
        });
    });

    describe("Warning APIs", () => {
        it("Executes warning APIs", () => {
            const executeCbSpy = jest.spyOn(
                Logger.prototype,
                "executeCallback"
            );

            const logger = new Logger(loggerOptions);
            logger.warning("Message", "");
            expect(executeCbSpy).toHaveBeenCalledWith(
                LogLevel.Warning,
                expect.anything(),
                expect.anything()
            );
        });

        it("Executes warningPii APIs", () => {
            const executeCbSpy = jest.spyOn(
                Logger.prototype,
                "executeCallback"
            );

            const logger = new Logger(loggerOptions);
            logger.warningPii("Message", TEST_CONFIG.CORRELATION_ID);
            expect(executeCbSpy).toHaveBeenCalledWith(
                LogLevel.Warning,
                expect.anything(),
                expect.anything()
            );
        });

        it("Does not execute warningPii APIs if piiLogging is disabled", () => {
            loggerOptions.piiLoggingEnabled = false;
            const executeCbSpy = jest.spyOn(
                Logger.prototype,
                "executeCallback"
            );

            const logger = new Logger(loggerOptions);
            logger.warningPii("Message", TEST_CONFIG.CORRELATION_ID);
            expect(executeCbSpy).not.toHaveBeenCalled();
        });
    });

    describe("Info APIs", () => {
        it("Executes info APIs", () => {
            const executeCbSpy = jest.spyOn(
                Logger.prototype,
                "executeCallback"
            );

            const logger = new Logger(loggerOptions);
            logger.info("Message", "");
            expect(executeCbSpy).toHaveBeenCalledWith(
                LogLevel.Info,
                expect.anything(),
                expect.anything()
            );
        });

        it("Executes infoPii APIs", () => {
            const executeCbSpy = jest.spyOn(
                Logger.prototype,
                "executeCallback"
            );

            const logger = new Logger(loggerOptions);
            logger.infoPii("Message", TEST_CONFIG.CORRELATION_ID);
            expect(executeCbSpy).toHaveBeenCalledWith(
                LogLevel.Info,
                expect.anything(),
                expect.anything()
            );
        });

        it("Does not execute infoPii APIs if piiLogging is disabled", () => {
            loggerOptions.piiLoggingEnabled = false;
            const executeCbSpy = jest.spyOn(
                Logger.prototype,
                "executeCallback"
            );

            const logger = new Logger(loggerOptions);
            logger.infoPii("Message", TEST_CONFIG.CORRELATION_ID);
            expect(executeCbSpy).not.toHaveBeenCalled();
        });
    });

    describe("Verbose APIs", () => {
        it("Executes verbose APIs", () => {
            const executeCbSpy = jest.spyOn(
                Logger.prototype,
                "executeCallback"
            );

            const logger = new Logger(loggerOptions);
            logger.verbose("Message", "");
            expect(executeCbSpy).toHaveBeenCalledWith(
                LogLevel.Verbose,
                expect.anything(),
                expect.anything()
            );
        });

        it("Executes verbosePii APIs", () => {
            const executeCbSpy = jest.spyOn(
                Logger.prototype,
                "executeCallback"
            );

            const logger = new Logger(loggerOptions);
            logger.verbosePii("Message", "");
            expect(executeCbSpy).toHaveBeenCalledWith(
                LogLevel.Verbose,
                expect.anything(),
                expect.anything()
            );
        });

        it("Does not execute verbosePii APIs if piiLogging is disabled", () => {
            loggerOptions.piiLoggingEnabled = false;
            const executeCbSpy = jest.spyOn(
                Logger.prototype,
                "executeCallback"
            );

            const logger = new Logger(loggerOptions);
            logger.verbosePii("Message", "");
            expect(executeCbSpy).not.toHaveBeenCalled();
        });
    });

    describe("CorrelationId tests", () => {
        it("CorrelationId is included in log message if passed in log message", () => {
            const testCorrelationId = "23456";
            const logger = new Logger(loggerOptions);

            logger.verbose("Message", testCorrelationId);
            expect(logStore[LogLevel.Verbose]).toContain(testCorrelationId);
        });
    });
});
