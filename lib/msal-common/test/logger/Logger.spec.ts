import { LoggerOptions } from "../../src/config/ClientConfiguration";
import { LogLevel, Logger } from "../../src/logger/Logger";
import sinon from "sinon";

describe("Logger.ts Class Unit Tests", () => {

    let loggerOptions: LoggerOptions;
    let logStore = {};
    beforeEach(() => {
        loggerOptions = {
            loggerCallback: (level: LogLevel, message: string, containsPii: boolean): void => {
                logStore[level] = message;
            },
            piiLoggingEnabled: true,
            logLevel: LogLevel.Verbose
        };
    });

    afterEach(() => {
        logStore = {};
        sinon.restore();
    });

    describe("Constructor and Getters", () => {
        it("Creates a logger with the given logger options", () => {
            const logger = new Logger(loggerOptions);
            expect(logger.isPiiLoggingEnabled()).toBe(true);
        });

        it("Creates a logger with level Error", () => {
            const options = { ...loggerOptions, logLevel: LogLevel.Error };
            const logger = new Logger(options);
            logger.error("Message");
            logger.warning("Message");
            logger.info("Message");
            logger.verbose("Message");
            logger.trace("Message")
            expect(logStore[LogLevel.Error]).toBeTruthy();
            expect(logStore[LogLevel.Warning]).toBe(undefined);
            expect(logStore[LogLevel.Info]).toBe(undefined);
            expect(logStore[LogLevel.Verbose]).toBe(undefined);
            expect(logStore[LogLevel.Trace]).toBe(undefined);
        });

        it("Creates a logger with level Warning", () => {
            const options = { ...loggerOptions, logLevel: LogLevel.Warning };
            const logger = new Logger(options);
            logger.error("Message");
            logger.warning("Message");
            logger.info("Message");
            logger.verbose("Message");
            logger.trace("Message")
            expect(logStore[LogLevel.Error]).toBeTruthy();
            expect(logStore[LogLevel.Warning]).toBeTruthy();
            expect(logStore[LogLevel.Info]).toBe(undefined);
            expect(logStore[LogLevel.Verbose]).toBe(undefined);
            expect(logStore[LogLevel.Trace]).toBe(undefined);
        });

        it("Creates a logger with level Info", () => {
            const options = { ...loggerOptions, logLevel: LogLevel.Info };
            const logger = new Logger(options);
            logger.error("Message");
            logger.warning("Message");
            logger.info("Message");
            logger.verbose("Message");
            logger.trace("Message")
            expect(logStore[LogLevel.Error]).toBeTruthy();
            expect(logStore[LogLevel.Warning]).toBeTruthy();
            expect(logStore[LogLevel.Info]).toBeTruthy();
            expect(logStore[LogLevel.Verbose]).toBe(undefined);
            expect(logStore[LogLevel.Trace]).toBe(undefined);
        });

        it("Creates a logger with level Verbose", () => {
            const options = { ...loggerOptions, logLevel: LogLevel.Verbose };
            const logger = new Logger(options);
            logger.error("Message");
            logger.warning("Message");
            logger.info("Message");
            logger.verbose("Message");
            logger.trace("Message")
            expect(logStore[LogLevel.Error]).toBeTruthy();
            expect(logStore[LogLevel.Warning]).toBeTruthy();
            expect(logStore[LogLevel.Info]).toBeTruthy();
            expect(logStore[LogLevel.Verbose]).toBeTruthy();
            expect(logStore[LogLevel.Trace]).toBe(undefined);
        });
        
        it("Creates a logger with level Trace", () => {
            const options = { ...loggerOptions, logLevel: LogLevel.Trace };
            const logger = new Logger(options);
            logger.error("Message");
            logger.warning("Message");
            logger.info("Message");
            logger.verbose("Message");
            logger.trace("Message")
            expect(logStore[LogLevel.Error]).toBeTruthy();
            expect(logStore[LogLevel.Warning]).toBeTruthy();
            expect(logStore[LogLevel.Info]).toBeTruthy();
            expect(logStore[LogLevel.Verbose]).toBeTruthy();
            expect(logStore[LogLevel.Trace]).toBeTruthy();
        });

        it("Creates a logger with level Info if logLevel isn't passed in", () => {
            loggerOptions = {
                loggerCallback: (level: LogLevel, message: string, containsPii: boolean): void => {
                    logStore[level] = message;
                },
                piiLoggingEnabled: true
            };
            const logger = new Logger(loggerOptions);
            logger.error("Message");
            logger.warning("Message");
            logger.info("Message");
            logger.verbose("Message");
            logger.trace("Message")
            expect(logStore[LogLevel.Error]).toBeTruthy();
            expect(logStore[LogLevel.Warning]).toBeTruthy();
            expect(logStore[LogLevel.Info]).toBeTruthy();
            expect(logStore[LogLevel.Verbose]).toBe(undefined);
            expect(logStore[LogLevel.Trace]).toBe(undefined);
        });

        it("Creates a logger with level Info if logLevel passed in is a string", () => {
            loggerOptions = {
                loggerCallback: (level: LogLevel, message: string, containsPii: boolean): void => {
                    logStore[level] = message;
                },
                piiLoggingEnabled: true,
                //@ts-ignore
                logLevel: "Verbose"
            };
            const logger = new Logger(loggerOptions);
            logger.error("Message");
            logger.warning("Message");
            logger.info("Message");
            logger.verbose("Message");
            logger.trace("Message")
            expect(logStore[LogLevel.Error]).toBeTruthy();
            expect(logStore[LogLevel.Warning]).toBeTruthy();
            expect(logStore[LogLevel.Info]).toBeTruthy();
            expect(logStore[LogLevel.Verbose]).toBe(undefined);
            expect(logStore[LogLevel.Trace]).toBe(undefined);
        });

        it("Creates a logger with level Info if logLevel passed in is an array", () => {
            loggerOptions = {
                loggerCallback: (level: LogLevel, message: string, containsPii: boolean): void => {
                    logStore[level] = message;
                },
                piiLoggingEnabled: true,
                //@ts-ignore
                logLevel: [LogLevel.Verbose]
            };
            const logger = new Logger(loggerOptions);
            logger.error("Message");
            logger.warning("Message");
            logger.info("Message");
            logger.verbose("Message");
            logger.trace("Message")
            expect(logStore[LogLevel.Error]).toBeTruthy();
            expect(logStore[LogLevel.Warning]).toBeTruthy();
            expect(logStore[LogLevel.Info]).toBeTruthy();
            expect(logStore[LogLevel.Verbose]).toBe(undefined);
            expect(logStore[LogLevel.Trace]).toBe(undefined);
        });

        it("Creates a logger with level Info if logLevel passed in is null", () => {
            loggerOptions = {
                loggerCallback: (level: LogLevel, message: string, containsPii: boolean): void => {
                    logStore[level] = message;
                },
                piiLoggingEnabled: true,
                //@ts-ignore
                logLevel: null
            };
            const logger = new Logger(loggerOptions);
            logger.error("Message");
            logger.warning("Message");
            logger.info("Message");
            logger.verbose("Message");
            logger.trace("Message")
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
            expect(loggerClone.isPiiLoggingEnabled()).toBe(logger.isPiiLoggingEnabled());
        });

        it("Creates a new logger with package name and package version", () => {
            const logger = new Logger(loggerOptions);
            const loggerClone = logger.clone("msal-common", "2.0.0");
            loggerClone.info("Message");
            expect(logStore[LogLevel.Info].includes("msal-common")).toBe(true);
            expect(logStore[LogLevel.Info].includes("2.0.0")).toBe(true);
            expect(logStore[LogLevel.Info].includes("msal-common@2.0.0")).toBe(true);
        });
    });

    describe("clone() tests", () => {

        it("Creates a new logger with logger configurations of existing logger", () => {
            const logger = new Logger(loggerOptions);
            const loggerClone = logger.clone("msal-common", "1.0.0");
            expect(loggerClone.isPiiLoggingEnabled()).toBe(logger.isPiiLoggingEnabled());
        });

        it("Creates a new logger with package name and package version", () => {
            const logger = new Logger(loggerOptions);
            const loggerClone = logger.clone("msal-common", "2.0.0");
            loggerClone.info("Message");
            expect(logStore[LogLevel.Info].includes("msal-common")).toBe(true);
            expect(logStore[LogLevel.Info].includes("2.0.0")).toBe(true);
            expect(logStore[LogLevel.Info].includes("msal-common@2.0.0")).toBe(true);
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
            const executeCbSpy = sinon.spy(Logger.prototype, "executeCallback");

            const logger = new Logger(loggerOptions);
            logger.error("Message");
            expect(executeCbSpy.calledWith(LogLevel.Error)).toBe(true);
        });

        it("Executes errorPii APIs", () => {
            const executeCbSpy = sinon.spy(Logger.prototype, "executeCallback");

            const logger = new Logger(loggerOptions);
            logger.errorPii("Message");
            expect(executeCbSpy.calledWith(LogLevel.Error)).toBe(true);
        });

        it("Does not execute errorPii APIs if piiLogging is disabled", () => {
            loggerOptions.piiLoggingEnabled = false;
            const executeCbSpy = sinon.spy(Logger.prototype, "executeCallback");

            const logger = new Logger(loggerOptions);
            logger.errorPii("Message");
            expect(executeCbSpy.called).toBe(false);
        });
    });

    describe("Warning APIs", () => {

        it("Executes warning APIs", () => {
            const executeCbSpy = sinon.spy(Logger.prototype, "executeCallback");

            const logger = new Logger(loggerOptions);
            logger.warning("Message");
            expect(executeCbSpy.calledWith(LogLevel.Warning)).toBe(true);
        });

        it("Executes warningPii APIs", () => {
            const executeCbSpy = sinon.spy(Logger.prototype, "executeCallback");

            const logger = new Logger(loggerOptions);
            logger.warningPii("Message");
            expect(executeCbSpy.calledWith(LogLevel.Warning)).toBe(true);
        });

        it("Does not execute warningPii APIs if piiLogging is disabled", () => {
            loggerOptions.piiLoggingEnabled = false;
            const executeCbSpy = sinon.spy(Logger.prototype, "executeCallback");

            const logger = new Logger(loggerOptions);
            logger.warningPii("Message");
            expect(executeCbSpy.called).toBe(false);
        });
    });

    describe("Info APIs", () => {

        it("Executes info APIs", () => {
            const executeCbSpy = sinon.spy(Logger.prototype, "executeCallback");

            const logger = new Logger(loggerOptions);
            logger.info("Message");
            expect(executeCbSpy.calledWith(LogLevel.Info)).toBe(true);
        });

        it("Executes infoPii APIs", () => {
            const executeCbSpy = sinon.spy(Logger.prototype, "executeCallback");

            const logger = new Logger(loggerOptions);
            logger.infoPii("Message");
            expect(executeCbSpy.calledWith(LogLevel.Info)).toBe(true);
        });

        it("Does not execute infoPii APIs if piiLogging is disabled", () => {
            loggerOptions.piiLoggingEnabled = false;
            const executeCbSpy = sinon.spy(Logger.prototype, "executeCallback");

            const logger = new Logger(loggerOptions);
            logger.infoPii("Message");
            expect(executeCbSpy.called).toBe(false);
        });
    });

    describe("Verbose APIs", () => {

        it("Executes verbose APIs", () => {
            const executeCbSpy = sinon.spy(Logger.prototype, "executeCallback");

            const logger = new Logger(loggerOptions);
            logger.verbose("Message");
            expect(executeCbSpy.calledWith(LogLevel.Verbose)).toBe(true);
        });

        it("Executes verbosePii APIs", () => {
            const executeCbSpy = sinon.spy(Logger.prototype, "executeCallback");

            const logger = new Logger(loggerOptions);
            logger.verbosePii("Message");
            expect(executeCbSpy.calledWith(LogLevel.Verbose)).toBe(true);
        });

        it("Does not execute verbosePii APIs if piiLogging is disabled", () => {
            loggerOptions.piiLoggingEnabled = false;
            const executeCbSpy = sinon.spy(Logger.prototype, "executeCallback");

            const logger = new Logger(loggerOptions);
            logger.verbosePii("Message");
            expect(executeCbSpy.called).toBe(false);
        });
    });

    describe("CorrelationId tests", () => {

        it("CorrelationId is included in log message if set on Logger configurations", () => {
            const testCorrelationId = "12345";
            const logger = new Logger({...loggerOptions, correlationId: testCorrelationId});

            logger.verbose("Message");
            expect(logStore[LogLevel.Verbose].includes(testCorrelationId)).toBe(true);
        });

        it("CorrelationId is included in log message if passed in log message", () => {
            const testCorrelationId = "23456";
            const logger = new Logger(loggerOptions);

            logger.verbose("Message", testCorrelationId);
            expect(logStore[LogLevel.Verbose].includes(testCorrelationId)).toBe(true);
        });

        it("CorrelationId passed in log message takes precedence over correlationId in Logger configurations", () => {
            const optionsCorrelationId = "34567";
            const testCorrelationId = "45678";
            const logger = new Logger({...loggerOptions, correlationId: optionsCorrelationId});

            logger.verbose("Message", testCorrelationId);
            expect(logStore[LogLevel.Verbose].includes(testCorrelationId)).toBe(true);
            expect(logStore[LogLevel.Verbose].includes(optionsCorrelationId)).toBe(false);
        });

        it("CorrelationId on Logger will be used if an empty string is passed in the log message", () => {
            const testCorrelationId = "56789";
            const logger = new Logger(loggerOptions, testCorrelationId);

            logger.verbose("Message", "");
            expect(logStore[LogLevel.Verbose].includes(testCorrelationId)).toBe(true);
        });
    });

});
