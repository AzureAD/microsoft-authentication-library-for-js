import { LoggerOptions } from "../../src/config/ClientConfiguration.js";
import {
    LogLevel,
    Logger,
    getLogsFromCache,
    getAndFlushLogsFromCache,
    getCachedCorrelationIds,
} from "../../src/logger/Logger.js";
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

        // Clear the shared correlation cache before each test
        // Clear all cached correlation IDs by flushing them (now completely removes them)
        const correlationIds = getCachedCorrelationIds();
        correlationIds.forEach((id: string) => {
            getAndFlushLogsFromCache(id);
        });
    });

    afterEach(() => {
        logStore = {};
        jest.restoreAllMocks();

        // Clear the shared correlation cache after each test
        const correlationIds = getCachedCorrelationIds();
        correlationIds.forEach((id: string) => {
            getAndFlushLogsFromCache(id);
        });
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

    describe("Log caching", () => {
        describe("Basic cache operations", () => {
            it("should cache hashed log messages with correct metadata", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "test-correlation-1";
                const hashedMessage = "abc123"; // Pre-hashed message

                // Log a hashed message
                logger.info(hashedMessage, correlationId);

                // Retrieve cached logs
                const cachedLogs = getLogsFromCache(correlationId);

                expect(cachedLogs).toHaveLength(1);
                expect(cachedLogs[0]).toMatchObject({
                    hash: hashedMessage,
                    level: LogLevel.Info,
                    containsPii: false,
                    milliseconds: expect.any(Number),
                });
                expect(cachedLogs[0].hash).toHaveLength(6);
            });

            it("should not cache plain text log messages", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "test-correlation-plain";
                const plainMessage = "This is a plain text message";

                // Log a plain text message
                logger.info(plainMessage, correlationId);

                // Retrieve cached logs - should be empty
                const cachedLogs = getLogsFromCache(correlationId);

                expect(cachedLogs).toHaveLength(0);
            });

            it("should cache hashed PII logs with correct containsPii flag", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "test-correlation-2";
                const hashedPiiMessage = "def456"; // Pre-hashed PII message

                // Log a hashed PII message
                logger.infoPii(hashedPiiMessage, correlationId);

                // Retrieve cached logs
                const cachedLogs = getLogsFromCache(correlationId);

                expect(cachedLogs).toHaveLength(1);
                expect(cachedLogs[0].containsPii).toBe(true);
                expect(cachedLogs[0].level).toBe(LogLevel.Info);
                expect(cachedLogs[0].hash).toBe(hashedPiiMessage);
            });

            it("should not cache plain text PII messages", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "test-correlation-plain-pii";
                const plainPiiMessage = "This is plain text PII data";

                // Log a plain text PII message
                logger.infoPii(plainPiiMessage, correlationId);

                // Retrieve cached logs - should be empty
                const cachedLogs = getLogsFromCache(correlationId);

                expect(cachedLogs).toHaveLength(0);
            });

            it("should use empty string correlation ID for hashed messages when none provided", () => {
                const logger = new Logger(loggerOptions);
                const hashedMessage = "xyz789"; // Hashed message

                // Log hashed message without correlation ID
                logger.error(hashedMessage, "");

                // Check that empty string correlation ID is used for caching
                const correlationIds = getCachedCorrelationIds();
                expect(correlationIds).toContain("");

                const cachedLogs = getLogsFromCache("");
                expect(cachedLogs.length).toBeGreaterThan(0);
                expect(cachedLogs[cachedLogs.length - 1].level).toBe(
                    LogLevel.Error
                );
                expect(cachedLogs[cachedLogs.length - 1].hash).toBe(
                    hashedMessage
                );
            });

            it("should handle empty string correlation ID as default for hashed messages", () => {
                const logger = new Logger(loggerOptions);
                const hashedMessage = "pqr123"; // Hashed message

                // Log hashed message with empty correlation ID
                logger.warning(hashedMessage, "");

                // Both empty string and no correlation should use default
                const logsWithEmpty = getLogsFromCache("");
                const logsWithUndefined = getLogsFromCache("");

                expect(logsWithEmpty).toEqual(logsWithUndefined);
                expect(logsWithEmpty).toHaveLength(1);
                expect(logsWithEmpty[0].hash).toBe(hashedMessage);
            });

            it("should not create cache entries for plain text messages with empty correlation", () => {
                const logger = new Logger(loggerOptions);
                const plainMessage = "Plain text message";

                // Log plain text message with empty correlation ID
                logger.warning(plainMessage, "");

                // Should not create any cache entries
                const logsWithEmpty = getLogsFromCache("");
                expect(logsWithEmpty).toHaveLength(0);

                // Verify no cache entries were created
                const emptyCorrelationLogs = getLogsFromCache("");
                expect(emptyCorrelationLogs).toHaveLength(0);
            });
        });

        describe("Multiple log levels", () => {
            it("should cache hashed messages from all log levels correctly", () => {
                // Set log level to Trace to allow all levels
                const traceOptions = {
                    ...loggerOptions,
                    logLevel: LogLevel.Trace,
                };
                const logger = new Logger(traceOptions);
                const correlationId = "multi-level-test";

                // Log hashed messages at different levels
                logger.error("err123", correlationId);
                logger.warning("wrn456", correlationId);
                logger.info("inf789", correlationId);
                logger.verbose("vrb012", correlationId);
                logger.trace("trc345", correlationId);

                const cachedLogs = getLogsFromCache(correlationId);

                expect(cachedLogs).toHaveLength(5);
                expect(cachedLogs.map((log) => log.level)).toEqual([
                    LogLevel.Error,
                    LogLevel.Warning,
                    LogLevel.Info,
                    LogLevel.Verbose,
                    LogLevel.Trace,
                ]);
                expect(cachedLogs.map((log) => log.hash)).toEqual([
                    "err123",
                    "wrn456",
                    "inf789",
                    "vrb012",
                    "trc345",
                ]);
            });

            it("should not cache plain text messages from any log level", () => {
                // Set log level to Trace to allow all levels
                const traceOptions = {
                    ...loggerOptions,
                    logLevel: LogLevel.Trace,
                };
                const logger = new Logger(traceOptions);
                const correlationId = "plain-multi-level-test";

                // Log plain text messages at different levels
                logger.error("Error message", correlationId);
                logger.warning("Warning message", correlationId);
                logger.info("Info message", correlationId);
                logger.verbose("Verbose message", correlationId);
                logger.trace("Trace message", correlationId);

                const cachedLogs = getLogsFromCache(correlationId);

                // No logs should be cached since they're all plain text
                expect(cachedLogs).toHaveLength(0);
            });

            it("should always cache hashed messages despite the configured log level", () => {
                // Set log level to Warning (should exclude Info, Verbose, Trace from display)
                const restrictedOptions = {
                    ...loggerOptions,
                    logLevel: LogLevel.Warning,
                };
                const logger = new Logger(restrictedOptions);
                const correlationId = "restricted-level-test";

                // Try to log hashed messages at all levels
                logger.error("err123", correlationId);
                logger.warning("wrn456", correlationId);
                logger.info("inf789", correlationId);
                logger.verbose("vrb012", correlationId);
                logger.trace("trc345", correlationId);

                const cachedLogs = getLogsFromCache(correlationId);

                // All hashed messages should be cached regardless of log level
                expect(cachedLogs).toHaveLength(5);
                expect(cachedLogs.map((log) => log.level)).toEqual([
                    LogLevel.Error,
                    LogLevel.Warning,
                    LogLevel.Info,
                    LogLevel.Verbose,
                    LogLevel.Trace,
                ]);
                expect(cachedLogs.map((log) => log.hash)).toEqual([
                    "err123",
                    "wrn456",
                    "inf789",
                    "vrb012",
                    "trc345",
                ]);
            });
        });

        describe("LRU cache behavior", () => {
            it("should evict empty string correlation ID when it is least recently used", () => {
                const logger = new Logger(loggerOptions);

                logger.info("emp001", "");

                for (let i = 0; i < 50; i++) {
                    const hashedMsg = `m${i.toString().padStart(5, "0")}`;
                    logger.info(hashedMsg, `correlation-${i}`);
                }

                const correlationIds = getCachedCorrelationIds();
                expect(correlationIds).toHaveLength(50);
                expect(correlationIds).not.toContain("");
            });

            it("should maintain LRU order for correlation IDs with hashed messages", () => {
                const logger = new Logger(loggerOptions);

                // Add correlation IDs to test LRU behavior with hashed messages
                const uniquePrefix = `lru-test-${Date.now()}`;
                logger.info("msg001", `${uniquePrefix}-1`);
                logger.info("msg002", `${uniquePrefix}-2`);
                logger.info("msg003", `${uniquePrefix}-3`);

                let correlationIds = getCachedCorrelationIds();
                expect(correlationIds).toContain(`${uniquePrefix}-1`);
                expect(correlationIds).toContain(`${uniquePrefix}-2`);
                expect(correlationIds).toContain(`${uniquePrefix}-3`);

                // Access an older correlation ID to make it more recent
                getLogsFromCache(`${uniquePrefix}-1`);

                // Add more correlation IDs with hashed messages
                for (let i = 4; i <= 15; i++) {
                    const paddedNum = i.toString().padStart(3, "0");
                    logger.info(`msg${paddedNum}`, `${uniquePrefix}-${i}`);
                }

                correlationIds = getCachedCorrelationIds();

                // The most recent correlation IDs should still be present
                expect(correlationIds).toContain(`${uniquePrefix}-15`);
                expect(correlationIds).toContain(`${uniquePrefix}-14`);

                // The cache should respect some reasonable limit (allowing for other tests)
                expect(correlationIds.length).toBeLessThan(100); // Reasonable upper bound
            });

            it("should move accessed correlation ID to end (most recent) with hashed messages", () => {
                const logger = new Logger(loggerOptions);

                // Clear cache and create fresh test
                const existingIds = getCachedCorrelationIds();
                existingIds.forEach((id: string) => {
                    getAndFlushLogsFromCache(id);
                });

                // Create 3 correlation IDs with hashed messages
                logger.info("msg001", "correlation-1");
                logger.info("msg002", "correlation-2");
                logger.info("msg003", "correlation-3");

                // Access correlation-1 (should move to end)
                getLogsFromCache("correlation-1");

                const correlationIds = getCachedCorrelationIds();
                const indexOf1 = correlationIds.indexOf("correlation-1");
                const indexOf2 = correlationIds.indexOf("correlation-2");
                const indexOf3 = correlationIds.indexOf("correlation-3");

                // correlation-1 should be after correlation-2 and correlation-3
                expect(indexOf1).toBeGreaterThan(indexOf2);
                expect(indexOf1).toBeGreaterThan(indexOf3);
            });

            it("should update LRU order when adding hashed logs to existing correlation", () => {
                const logger = new Logger(loggerOptions);

                // Clear and start fresh
                const existingIds = getCachedCorrelationIds();
                existingIds.forEach((id: string) => {
                    getAndFlushLogsFromCache(id);
                });

                // Create 3 correlation IDs with hashed messages
                logger.info("msg001", "correlation-1");
                logger.info("msg002", "correlation-2");
                logger.info("msg003", "correlation-3");

                // Add another hashed log to correlation-1 (should move to end)
                logger.info("msg004", "correlation-1");

                const correlationIds = getCachedCorrelationIds();
                const indexOf1 = correlationIds.indexOf("correlation-1");
                const indexOf2 = correlationIds.indexOf("correlation-2");
                const indexOf3 = correlationIds.indexOf("correlation-3");

                // correlation-1 should be after correlation-2 and correlation-3
                expect(indexOf1).toBeGreaterThan(indexOf2);
                expect(indexOf1).toBeGreaterThan(indexOf3);

                // Verify correlation-1 has 2 logs
                const correlation1Logs = getLogsFromCache("correlation-1");
                expect(correlation1Logs).toHaveLength(2);
                expect(correlation1Logs.map((log) => log.hash)).toEqual([
                    "msg001",
                    "msg004",
                ]);
            });
        });

        describe("Log count limits", () => {
            it("should limit hashed logs per correlation to MAX_LOGS_PER_CORRELATION (300)", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "high-volume-test";

                // Add more than 500 hashed logs (6-char format)
                for (let i = 0; i < 550; i++) {
                    const paddedNum = i.toString().padStart(3, "0");
                    logger.info(`msg${paddedNum}`, correlationId);
                }

                const cachedLogs = getLogsFromCache(correlationId);
                expect(cachedLogs).toHaveLength(500);

                // Should contain the most recent 300 logs (50-349)
                // The first 50 logs should have been evicted
                expect(cachedLogs[0].hash).not.toEqual(cachedLogs[299].hash);
                expect(cachedLogs[0].hash).toBe("msg050"); // First remaining log
                expect(cachedLogs[299].hash).toBe("msg349"); // Last log
            });

            it("should maintain chronological order when evicting old hashed logs", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "chronological-test";

                // Add hashed logs with distinctive messages
                for (let i = 0; i < 505; i++) {
                    const paddedNum = i.toString().padStart(3, "0");
                    logger.info(`log${paddedNum}`, correlationId);
                }

                const cachedLogs = getLogsFromCache(correlationId);
                expect(cachedLogs).toHaveLength(500);

                // Verify that milliseconds are in ascending order
                for (let i = 1; i < cachedLogs.length; i++) {
                    expect(cachedLogs[i].milliseconds).toBeGreaterThanOrEqual(
                        cachedLogs[i - 1].milliseconds
                    );
                }

                // Verify the remaining logs are the most recent ones (5-504)
                expect(cachedLogs[0].hash).toBe("log005");
                expect(cachedLogs[499].hash).toBe("log504");
            });
        });

        describe("Flush operations", () => {
            it("should flush and return hashed logs, then clear the cache", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "flush-test";

                // Add some hashed logs
                logger.info("msg001", correlationId);
                logger.error("msg002", correlationId);
                logger.warning("msg003", correlationId);

                // Verify logs exist
                let cachedLogs = getLogsFromCache(correlationId);
                expect(cachedLogs).toHaveLength(3);

                // Flush logs
                const flushedLogs = getAndFlushLogsFromCache(correlationId);
                expect(flushedLogs).toHaveLength(3);
                expect(flushedLogs).toEqual(cachedLogs);
                expect(flushedLogs.map((log) => log.hash)).toEqual([
                    "msg001",
                    "msg002",
                    "msg003",
                ]);

                // Verify cache is empty for this correlation
                cachedLogs = getLogsFromCache(correlationId);
                expect(cachedLogs).toHaveLength(0);

                // Verify correlation ID is completely removed from cache
                const correlationIds = getCachedCorrelationIds();
                expect(correlationIds).not.toContain(correlationId);
            });

            it("should return empty array when flushing non-existent correlation", () => {
                const flushedLogs = getAndFlushLogsFromCache("non-existent");
                expect(flushedLogs).toHaveLength(0);
                expect(Array.isArray(flushedLogs)).toBe(true);
            });

            it("should allow adding hashed logs after flush", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "post-flush-test";

                // Add and flush hashed logs
                logger.info("bef001", correlationId);
                getAndFlushLogsFromCache(correlationId);

                // Add new hashed logs after flush
                logger.error("aft001", correlationId);
                logger.warning("aft002", correlationId);

                const cachedLogs = getLogsFromCache(correlationId);
                expect(cachedLogs).toHaveLength(2);
                expect(cachedLogs[0].level).toBe(LogLevel.Error);
                expect(cachedLogs[1].level).toBe(LogLevel.Warning);
                expect(cachedLogs.map((log) => log.hash)).toEqual([
                    "aft001",
                    "aft002",
                ]);
            });
        });

        describe("Cross-instance cache sharing", () => {
            it("should share cache across multiple Logger instances for hashed messages", () => {
                const logger1 = new Logger(loggerOptions);
                const logger2 = new Logger(loggerOptions);
                const correlationId = "shared-cache-test";

                // Log hashed messages from first instance
                logger1.info("lg1001", correlationId);

                // Log hashed messages from second instance
                logger2.error("lg2001", correlationId);

                // Both instances should see both logs
                const logs1 = getLogsFromCache(correlationId);
                const logs2 = getLogsFromCache(correlationId);

                expect(logs1).toHaveLength(2);
                expect(logs2).toHaveLength(2);
                expect(logs1).toEqual(logs2);

                expect(logs1[0].level).toBe(LogLevel.Info);
                expect(logs1[1].level).toBe(LogLevel.Error);
                expect(logs1.map((log) => log.hash)).toEqual([
                    "lg1001",
                    "lg2001",
                ]);
            });

            it("should share LRU eviction across instances with hashed messages", () => {
                const logger1 = new Logger(loggerOptions);
                const logger2 = new Logger(loggerOptions);

                // Clear existing cache
                const existingIds = getCachedCorrelationIds();
                existingIds.forEach((id: string) => {
                    getAndFlushLogsFromCache(id);
                });

                // Fill cache from first instance with hashed messages
                logger1.info("msg001", "correlation-1");
                logger1.info("msg002", "correlation-2");
                logger1.info("msg003", "correlation-3");

                // Add from second instance with hashed message
                logger2.info("msg004", "correlation-4");

                // Both instances should see same correlation IDs
                const correlationIds1 = getCachedCorrelationIds();
                const correlationIds2 = getCachedCorrelationIds();

                expect(correlationIds1).toEqual(correlationIds2);
                expect(correlationIds1).toContain("correlation-1");
                expect(correlationIds1).toContain("correlation-2");
                expect(correlationIds1).toContain("correlation-3");
                expect(correlationIds1).toContain("correlation-4");
            });

            it("should share flush operations across instances", () => {
                const logger1 = new Logger(loggerOptions);
                const logger2 = new Logger(loggerOptions);
                const correlationId = "shared-flush-test";

                // Add hashed logs from both instances
                logger1.info("log001", correlationId);
                logger2.error("log002", correlationId);

                // Flush from first instance
                const flushedLogs = getAndFlushLogsFromCache(correlationId);
                expect(flushedLogs).toHaveLength(2);

                // Second instance should also see empty cache
                const remainingLogs = getLogsFromCache(correlationId);
                expect(remainingLogs).toHaveLength(0);
            });
        });

        describe("Hash detection and caching behavior", () => {
            it("should cache messages that are already hashed", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "hash-test";
                const hashedMessage = "msg001"; // 6-character alphanumeric hash

                logger.info(hashedMessage, correlationId);

                const cachedLogs = getLogsFromCache(correlationId);
                expect(cachedLogs).toHaveLength(1);
                expect(cachedLogs[0].hash).toBe(hashedMessage);
                expect(/^[a-zA-Z0-9]{6}$/.test(cachedLogs[0].hash)).toBe(true);
            });

            it("should not cache plain text messages", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "plain-text-test";
                const plainMessage = "This is a plain text message";

                logger.info(plainMessage, correlationId);

                const cachedLogs = getLogsFromCache(correlationId);
                expect(cachedLogs).toHaveLength(0); // Plain text messages are not cached
            });

            it("should distinguish between hashed and plain text messages", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "mixed-test";

                // Mix hashed and plain text messages
                logger.info("msg001", correlationId); // Should be cached
                logger.info("This is plain text", correlationId); // Should not be cached
                logger.info("msg002", correlationId); // Should be cached

                const cachedLogs = getLogsFromCache(correlationId);
                expect(cachedLogs).toHaveLength(2); // Only hashed messages cached
                expect(cachedLogs[0].hash).toBe("msg001");
                expect(cachedLogs[1].hash).toBe("msg002");
            });
        });

        describe("Edge cases and error Handling", () => {
            it("should not cache very long plain text messages", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "long-message-test";
                const longMessage = "x".repeat(10000); // 10KB plain text message

                logger.info(longMessage, correlationId);

                const cachedLogs = getLogsFromCache(correlationId);
                expect(cachedLogs).toHaveLength(0); // Plain text not cached
            });

            it("should cache hashed messages regardless of special context", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "special-context-test";
                const hashedMessage = "msg001"; // Valid hash format

                logger.info(hashedMessage, correlationId);

                const cachedLogs = getLogsFromCache(correlationId);
                expect(cachedLogs).toHaveLength(1);
                expect(cachedLogs[0].hash).toBe(hashedMessage);
            });

            it("should return copies of cached logs to prevent external modification", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "immutable-test";

                logger.info("msg001", correlationId); // Use hashed message

                const cachedLogs1 = getLogsFromCache(correlationId);
                const cachedLogs2 = getLogsFromCache(correlationId);

                // Should be separate arrays
                expect(cachedLogs1).not.toBe(cachedLogs2);
                expect(cachedLogs1).toEqual(cachedLogs2);

                // Modifying one shouldn't affect the other
                cachedLogs1.push({
                    hash: "modified",
                    level: LogLevel.Error,
                    containsPii: false,
                    milliseconds: 0,
                });

                expect(cachedLogs1).toHaveLength(2);
                expect(cachedLogs2).toHaveLength(1);
            });

            it("should handle concurrent access safely with hashed messages", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "concurrent-test";

                // Simulate concurrent logging with hashed messages
                const promises = Array.from({ length: 100 }, (_, i) => {
                    const hashedMsg = `msg${i.toString().padStart(3, "0")}`; // msg000, msg001, etc.
                    return Promise.resolve(
                        logger.info(hashedMsg, correlationId)
                    );
                });

                return Promise.all(promises).then(() => {
                    const cachedLogs = getLogsFromCache(correlationId);
                    expect(cachedLogs).toHaveLength(100);

                    // All logs should have valid hashes
                    cachedLogs.forEach((log) => {
                        expect(log.hash).toHaveLength(6);
                        expect(log.level).toBe(LogLevel.Info);
                        expect(typeof log.milliseconds).toBe("number");
                    });
                });
            });
        });

        describe("Performance and memory", () => {
            it("should not cause memory leaks with many correlation IDs using hashed messages", () => {
                const logger = new Logger(loggerOptions);

                // Use a unique prefix to avoid conflicts with other tests
                const uniquePrefix = `memory-test-${Date.now()}`;

                // Record initial cache size
                const initialCacheSize = getCachedCorrelationIds().length;

                // Create many correlation IDs with hashed messages
                for (let i = 0; i < 50; i++) {
                    const hashedMsg = `msg${i.toString().padStart(3, "0")}`; // msg000, msg001, etc.
                    logger.info(hashedMsg, `${uniquePrefix}-${i}`);
                }

                // Cache should grow but not indefinitely
                const correlationIds = getCachedCorrelationIds();
                expect(correlationIds.length).toBeGreaterThan(initialCacheSize);
                expect(correlationIds.length).toBeLessThan(200); // Reasonable upper bound

                // The newest correlation IDs should still be present
                expect(correlationIds).toContain(`${uniquePrefix}-49`);
                expect(correlationIds).toContain(`${uniquePrefix}-48`);
                expect(correlationIds).toContain(`${uniquePrefix}-47`);

                // Some correlation IDs from this test should be present
                const ourCorrelationIds = correlationIds.filter((id) =>
                    id.startsWith(uniquePrefix)
                );
                expect(ourCorrelationIds.length).toBeGreaterThan(0);
            });

            it("should handle rapid logging without issues using hashed messages", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "rapid-test";
                const startTime = Date.now();

                // Log many hashed messages rapidly
                for (let i = 0; i < 1000; i++) {
                    const hashedMsg = `rp${i.toString().padStart(4, "0")}`; // rp0000, rp0001, etc.
                    logger.info(hashedMsg, correlationId);
                }

                const endTime = Date.now();
                const cachedLogs = getLogsFromCache(correlationId);

                expect(cachedLogs).toHaveLength(500); // Limited by MAX_LOGS_PER_CORRELATION
                expect(endTime - startTime).toBeLessThan(1000); // Should complete quickly

                // Verify milliseconds are in order
                for (let i = 1; i < cachedLogs.length; i++) {
                    expect(cachedLogs[i].milliseconds).toBeGreaterThanOrEqual(
                        cachedLogs[i - 1].milliseconds
                    );
                }
            });
        });
        describe("getAndFlushLogsFromCache with empty correlation ID attachment", () => {
            it("should return logs from both empty and specific correlation ID, then clear both", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "test-specific-id";

                // Add hashed logs with empty correlation ID
                logger.info("emp001", "");
                logger.error("emp002", "");

                // Add hashed logs with specific correlation ID
                logger.info("spc001", correlationId);
                logger.warning("spc002", correlationId);

                // Verify both caches have logs
                const emptyLogs = getLogsFromCache("");
                const specificLogs = getLogsFromCache(correlationId);
                expect(emptyLogs).toHaveLength(2);
                expect(specificLogs).toHaveLength(2);

                // Flush logs for specific correlation ID
                const flushedLogs = getAndFlushLogsFromCache(correlationId);

                // Should return all 4 logs (2 from empty + 2 from specific)
                expect(flushedLogs).toHaveLength(4);

                // Verify logs contain expected levels
                const levels = flushedLogs.map((log) => log.level);
                expect(levels).toContain(LogLevel.Info);
                expect(levels).toContain(LogLevel.Error);
                expect(levels).toContain(LogLevel.Warning);

                // Verify both caches are cleared
                expect(getLogsFromCache("")).toHaveLength(0);
                expect(getLogsFromCache(correlationId)).toHaveLength(0);
            });

            it("should return only specific correlation logs when no empty correlation logs exist", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "test-only-specific";

                // Add only hashed logs with specific correlation ID
                logger.info("spc001", correlationId);
                logger.error("spc002", correlationId);

                const flushedLogs = getAndFlushLogsFromCache(correlationId);

                expect(flushedLogs).toHaveLength(2);
                expect(flushedLogs[0].level).toBe(LogLevel.Info);
                expect(flushedLogs[1].level).toBe(LogLevel.Error);
                expect(getLogsFromCache(correlationId)).toHaveLength(0);
            });

            it("should return only empty correlation logs when no specific correlation logs exist", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "non-existent-id";

                // Add only hashed logs with empty correlation ID
                logger.warning("emp001", "");
                logger.trace("emp002", "");

                const flushedLogs = getAndFlushLogsFromCache(correlationId);

                expect(flushedLogs).toHaveLength(2);
                expect(flushedLogs[0].level).toBe(LogLevel.Warning);
                expect(flushedLogs[1].level).toBe(LogLevel.Trace);
                expect(getLogsFromCache("")).toHaveLength(0);
            });

            it("should return empty array when neither correlation ID exists", () => {
                const correlationId = "completely-non-existent";

                const flushedLogs = getAndFlushLogsFromCache(correlationId);

                expect(flushedLogs).toHaveLength(0);
            });

            it("should maintain chronological order when combining logs from empty and specific correlations", async () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "chronological-test";

                // Add hashed logs in specific order with small delays to ensure different timestamps
                logger.info("emp001", "");

                // Small delay to ensure different timestamps
                await new Promise((resolve) => setTimeout(resolve, 1));

                logger.info("spc001", correlationId);
                logger.error("emp002", "");
                logger.warning("spc002", correlationId);

                const flushedLogs = getAndFlushLogsFromCache(correlationId);

                expect(flushedLogs).toHaveLength(4);

                // Verify that empty correlation logs come first, then specific correlation logs
                // This is the order they are processed in getAndFlushLogsFromCache
                expect(flushedLogs[0].level).toBe(LogLevel.Info); // First empty
                expect(flushedLogs[1].level).toBe(LogLevel.Error); // Second empty
                expect(flushedLogs[2].level).toBe(LogLevel.Info); // First specific
                expect(flushedLogs[3].level).toBe(LogLevel.Warning); // Second specific
            });

            it("should handle PII logs correctly from both correlation IDs", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "pii-test";

                // Add hashed PII logs with empty correlation ID
                logger.infoPii("emp001", "");
                logger.info("emp002", "");

                // Add hashed PII logs with specific correlation ID
                logger.errorPii("spc001", correlationId);
                logger.warning("spc002", correlationId);

                const flushedLogs = getAndFlushLogsFromCache(correlationId);

                expect(flushedLogs).toHaveLength(4);

                // Check PII flags are preserved
                const piiLogs = flushedLogs.filter((log) => log.containsPii);
                const nonPiiLogs = flushedLogs.filter(
                    (log) => !log.containsPii
                );

                expect(piiLogs).toHaveLength(2);
                expect(nonPiiLogs).toHaveLength(2);
            });

            it("should handle large number of logs from both correlations", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "large-volume-combined";

                // Add 50 hashed logs to empty correlation
                for (let i = 0; i < 50; i++) {
                    const hashedMsg = `emp${i.toString().padStart(3, "0")}`; // emp000, emp001, etc.
                    logger.info(hashedMsg, "");
                }

                // Add 75 hashed logs to specific correlation
                for (let i = 0; i < 75; i++) {
                    const hashedMsg = `spc${i.toString().padStart(3, "0")}`; // spc000, spc001, etc.
                    logger.warning(hashedMsg, correlationId);
                }

                const flushedLogs = getAndFlushLogsFromCache(correlationId);

                expect(flushedLogs).toHaveLength(125);

                // Verify we have the right mix of log levels
                const infoLogs = flushedLogs.filter(
                    (log) => log.level === LogLevel.Info
                );
                const warningLogs = flushedLogs.filter(
                    (log) => log.level === LogLevel.Warning
                );

                expect(infoLogs).toHaveLength(50);
                expect(warningLogs).toHaveLength(75);
            });

            it("should not affect other correlation IDs when flushing", () => {
                const logger = new Logger(loggerOptions);
                const correlationId1 = "keep-this-one";
                const correlationId2 = "flush-this-one";

                // Add hashed logs to multiple correlations
                logger.info("kep001", correlationId1);
                logger.info("emp001", "");
                logger.info("flu001", correlationId2);
                logger.info("kep002", correlationId1);
                logger.info("flu002", correlationId2);

                // Flush correlationId2 (should also clear empty correlation)
                const flushedLogs = getAndFlushLogsFromCache(correlationId2);

                expect(flushedLogs).toHaveLength(3); // 1 empty + 2 specific

                // correlationId1 should still have its logs
                const remainingLogs = getLogsFromCache(correlationId1);
                expect(remainingLogs).toHaveLength(2);

                // Empty correlation should be cleared
                expect(getLogsFromCache("")).toHaveLength(0);

                // correlationId2 should be cleared
                expect(getLogsFromCache(correlationId2)).toHaveLength(0);
            });

            it("should clear both correlation IDs from cache keys after flush", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "cache-key-test";

                logger.info("emp001", "");
                logger.info("spc001", correlationId);

                // Verify both correlation IDs are in cache
                const correlationIdsBefore = getCachedCorrelationIds();
                expect(correlationIdsBefore).toContain("");
                expect(correlationIdsBefore).toContain(correlationId);

                // Flush logs
                getAndFlushLogsFromCache(correlationId);

                // Verify both correlation IDs are removed from cache
                const correlationIdsAfter = getCachedCorrelationIds();
                expect(correlationIdsAfter).not.toContain("");
                expect(correlationIdsAfter).not.toContain(correlationId);
            });
        });
    });
});
