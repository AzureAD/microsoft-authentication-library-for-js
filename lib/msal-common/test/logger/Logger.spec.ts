import { LoggerOptions } from "../../src/config/ClientConfiguration.js";
import { LogLevel, Logger, getLogsFromCache, getAndFlushLogsFromCache, getCachedCorrelationIds } from "../../src/logger/Logger.js";

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
            logger.error("Message");
            logger.warning("Message");
            logger.info("Message");
            logger.verbose("Message");
            logger.trace("Message");
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
            logger.trace("Message");
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
            logger.trace("Message");
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
            logger.trace("Message");
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
            logger.trace("Message");
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
            logger.error("Message");
            logger.warning("Message");
            logger.info("Message");
            logger.verbose("Message");
            logger.trace("Message");
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
            logger.error("Message");
            logger.warning("Message");
            logger.info("Message");
            logger.verbose("Message");
            logger.trace("Message");
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
            logger.error("Message");
            logger.warning("Message");
            logger.info("Message");
            logger.verbose("Message");
            logger.trace("Message");
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
            logger.error("Message");
            logger.warning("Message");
            logger.info("Message");
            logger.verbose("Message");
            logger.trace("Message");
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
            loggerClone.info("Message");
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
            loggerClone.info("Message");
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
            logger.error("Message");
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
            logger.errorPii("Message");
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
            logger.errorPii("Message");
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
            logger.warning("Message");
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
            logger.warningPii("Message");
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
            logger.warningPii("Message");
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
            logger.info("Message");
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
            logger.infoPii("Message");
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
            logger.infoPii("Message");
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
            logger.verbose("Message");
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
            logger.verbosePii("Message");
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
            logger.verbosePii("Message");
            expect(executeCbSpy).not.toHaveBeenCalled();
        });
    });

    describe("CorrelationId tests", () => {
        it("CorrelationId is included in log message if set on Logger configurations", () => {
            const testCorrelationId = "12345";
            const logger = new Logger({
                ...loggerOptions,
                correlationId: testCorrelationId,
            });

            logger.verbose("Message");
            expect(logStore[LogLevel.Verbose]).toContain(testCorrelationId);
        });

        it("CorrelationId is included in log message if passed in log message", () => {
            const testCorrelationId = "23456";
            const logger = new Logger(loggerOptions);

            logger.verbose("Message", testCorrelationId);
            expect(logStore[LogLevel.Verbose]).toContain(testCorrelationId);
        });

        it("CorrelationId passed in log message takes precedence over correlationId in Logger configurations", () => {
            const optionsCorrelationId = "34567";
            const testCorrelationId = "45678";
            const logger = new Logger({
                ...loggerOptions,
                correlationId: optionsCorrelationId,
            });

            logger.verbose("Message", testCorrelationId);
            expect(logStore[LogLevel.Verbose]).toContain(testCorrelationId);
            expect(logStore[LogLevel.Verbose]).not.toContain(
                optionsCorrelationId
            );
        });

        it("CorrelationId on Logger will be used if an empty string is passed in the log message", () => {
            const testCorrelationId = "56789";
            const logger = new Logger(loggerOptions, testCorrelationId);

            logger.verbose("Message", "");
            expect(logStore[LogLevel.Verbose]).toContain(testCorrelationId);
        });
    });

    describe("Log caching", () => {
        describe("Basic cache operations", () => {
            it("should cache log messages with correct metadata", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "test-correlation-1";
                const message = "Test log message";

                // Log a message
                logger.info(message, correlationId);

                // Retrieve cached logs
                const cachedLogs = getLogsFromCache(correlationId);

                expect(cachedLogs).toHaveLength(1);
                expect(cachedLogs[0]).toMatchObject({
                    hash: expect.any(String),
                    level: LogLevel.Info,
                    containsPii: false,
                    milliseconds: expect.any(Number)
                });
                expect(cachedLogs[0].hash).toHaveLength(6);
            });

            it("should cache PII logs with correct containsPii flag", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "test-correlation-2";
                const message = "Test PII message";

                // Log a PII message
                logger.infoPii(message, correlationId);

                // Retrieve cached logs
                const cachedLogs = getLogsFromCache(correlationId);

                expect(cachedLogs).toHaveLength(1);
                expect(cachedLogs[0].containsPii).toBe(true);
                expect(cachedLogs[0].level).toBe(LogLevel.Info);
            });

            it("should use empty string correlation ID when none provided", () => {
                const logger = new Logger(loggerOptions);
                const message = "Test message without correlation";

                // Log without correlation ID
                logger.error(message);

                // Check that empty string correlation ID is used
                const correlationIds = getCachedCorrelationIds();
                expect(correlationIds).toContain("");

                const cachedLogs = getLogsFromCache("");
                expect(cachedLogs.length).toBeGreaterThan(0);
                expect(cachedLogs[cachedLogs.length - 1].level).toBe(LogLevel.Error);
            });

            it("should handle empty string correlation ID as default", () => {
                const logger = new Logger(loggerOptions);
                const message = "Test message with empty correlation";

                // Log with empty correlation ID
                logger.warning(message, "");

                // Both empty string and no correlation should use default
                const logsWithEmpty = getLogsFromCache("");
                const logsWithUndefined = getLogsFromCache("");

                expect(logsWithEmpty).toEqual(logsWithUndefined);
                expect(logsWithEmpty).toHaveLength(1);
            });
        });

        describe("Multiple log levels", () => {
            it("should cache logs from all log levels correctly", () => {
                // Set log level to Trace to allow all levels
                const traceOptions = { ...loggerOptions, logLevel: LogLevel.Trace };
                const logger = new Logger(traceOptions);
                const correlationId = "multi-level-test";

                // Log messages at different levels
                logger.error("Error message", correlationId);
                logger.warning("Warning message", correlationId);
                logger.info("Info message", correlationId);
                logger.verbose("Verbose message", correlationId);
                logger.trace("Trace message", correlationId);

                const cachedLogs = getLogsFromCache(correlationId);

                expect(cachedLogs).toHaveLength(5);
                expect(cachedLogs.map(log => log.level)).toEqual([
                    LogLevel.Error,
                    LogLevel.Warning,
                    LogLevel.Info,
                    LogLevel.Verbose,
                    LogLevel.Trace
                ]);
            });

            it("should always cache logs despite the configured log level", () => {
                // Set log level to Warning (should exclude Info, Verbose, Trace)
                const restrictedOptions = { ...loggerOptions, logLevel: LogLevel.Warning };
                const logger = new Logger(restrictedOptions);
                const correlationId = "restricted-level-test";

                // Try to log at all levels
                logger.error("Error message", correlationId);
                logger.warning("Warning message", correlationId);
                logger.info("Info message", correlationId);
                logger.verbose("Verbose message", correlationId);
                logger.trace("Trace message", correlationId);

                const cachedLogs = getLogsFromCache(correlationId);

                // Only Error and Warning should be cached
                expect(cachedLogs).toHaveLength(5);
                expect(cachedLogs.map(log => log.level)).toEqual([
                    LogLevel.Error,
                    LogLevel.Warning,
                    LogLevel.Info,
                    LogLevel.Verbose,
                    LogLevel.Trace
                ]);
            });
        });

        describe("LRU cache behavior", () => {
            it("should maintain LRU order for correlation IDs", () => {
                const logger = new Logger(loggerOptions);

                // Add correlation IDs to test LRU behavior
                const uniquePrefix = `lru-test-${Date.now()}`;
                logger.info("Message 1", `${uniquePrefix}-1`);
                logger.info("Message 2", `${uniquePrefix}-2`);
                logger.info("Message 3", `${uniquePrefix}-3`);

                let correlationIds = getCachedCorrelationIds();
                expect(correlationIds).toContain(`${uniquePrefix}-1`);
                expect(correlationIds).toContain(`${uniquePrefix}-2`);
                expect(correlationIds).toContain(`${uniquePrefix}-3`);

                // Access an older correlation ID to make it more recent
                getLogsFromCache(`${uniquePrefix}-1`);

                // Add more correlation IDs
                for (let i = 4; i <= 15; i++) {
                    logger.info(`Message ${i}`, `${uniquePrefix}-${i}`);
                }

                correlationIds = getCachedCorrelationIds();

                // The most recent correlation IDs should still be present
                expect(correlationIds).toContain(`${uniquePrefix}-15`);
                expect(correlationIds).toContain(`${uniquePrefix}-14`);

                // The cache should respect some reasonable limit (allowing for other tests)
                expect(correlationIds.length).toBeLessThan(100); // Reasonable upper bound
            });

            it("should move accessed correlation ID to end (most recent)", () => {
                const logger = new Logger(loggerOptions);

                // Clear cache and create fresh test
                const existingIds = getCachedCorrelationIds();
                existingIds.forEach((id: string) => {
                    getAndFlushLogsFromCache(id);
                });

                // Create 3 correlation IDs
                logger.info("Message 1", "correlation-1");
                logger.info("Message 2", "correlation-2");
                logger.info("Message 3", "correlation-3");

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

            it("should update LRU order when adding logs to existing correlation", () => {
                const logger = new Logger(loggerOptions);

                // Clear and start fresh
                const existingIds = getCachedCorrelationIds();
                existingIds.forEach((id: string) => {
                    getAndFlushLogsFromCache(id);
                });

                // Create 3 correlation IDs
                logger.info("Message 1", "correlation-1");
                logger.info("Message 2", "correlation-2");
                logger.info("Message 3", "correlation-3");

                // Add another log to correlation-1 (should move to end)
                logger.info("Another message", "correlation-1");

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
            });
        });

        describe("Log count limits", () => {
            it("should limit logs per correlation to MAX_LOGS_PER_CORRELATION (300)", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "high-volume-test";

                // Add more than 300 logs
                for (let i = 0; i < 350; i++) {
                    logger.info(`Message ${i}`, correlationId);
                }

                const cachedLogs = getLogsFromCache(correlationId);
                expect(cachedLogs).toHaveLength(300);

                // Should contain the most recent 300 logs (250-349)
                // The first 50 logs should have been evicted
                expect(cachedLogs[0].hash).not.toEqual(cachedLogs[299].hash);
            });

            it("should maintain chronological order when evicting old logs", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "chronological-test";

                // Add logs with distinctive messages
                for (let i = 0; i < 305; i++) {
                    logger.info(`Unique message ${i}`, correlationId);
                }

                const cachedLogs = getLogsFromCache(correlationId);
                expect(cachedLogs).toHaveLength(300);

                // Verify that milliseconds are in ascending order
                for (let i = 1; i < cachedLogs.length; i++) {
                    expect(cachedLogs[i].milliseconds).toBeGreaterThanOrEqual(cachedLogs[i - 1].milliseconds);
                }
            });
        });

        describe("Flush operations", () => {
            it("should flush and return logs, then clear the cache", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "flush-test";

                // Add some logs
                logger.info("Message 1", correlationId);
                logger.error("Message 2", correlationId);
                logger.warning("Message 3", correlationId);

                // Verify logs exist
                let cachedLogs = getLogsFromCache(correlationId);
                expect(cachedLogs).toHaveLength(3);

                // Flush logs
                const flushedLogs = getAndFlushLogsFromCache(correlationId);
                expect(flushedLogs).toHaveLength(3);
                expect(flushedLogs).toEqual(cachedLogs);

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

            it("should allow adding logs after flush", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "post-flush-test";

                // Add and flush logs
                logger.info("Before flush", correlationId);
                getAndFlushLogsFromCache(correlationId);

                // Add new logs after flush
                logger.error("After flush", correlationId);
                logger.warning("Another after flush", correlationId);

                const cachedLogs = getLogsFromCache(correlationId);
                expect(cachedLogs).toHaveLength(2);
                expect(cachedLogs[0].level).toBe(LogLevel.Error);
                expect(cachedLogs[1].level).toBe(LogLevel.Warning);
            });
        });

        describe("Cross-instance cache sharing", () => {
            it("should share cache across multiple Logger instances", () => {
                const logger1 = new Logger(loggerOptions);
                const logger2 = new Logger(loggerOptions);
                const correlationId = "shared-cache-test";

                // Log from first instance
                logger1.info("Message from logger1", correlationId);

                // Log from second instance
                logger2.error("Message from logger2", correlationId);

                // Both instances should see both logs
                const logs1 = getLogsFromCache(correlationId);
                const logs2 = getLogsFromCache(correlationId);

                expect(logs1).toHaveLength(2);
                expect(logs2).toHaveLength(2);
                expect(logs1).toEqual(logs2);

                expect(logs1[0].level).toBe(LogLevel.Info);
                expect(logs1[1].level).toBe(LogLevel.Error);
            });

            it("should share LRU eviction across instances", () => {
                const logger1 = new Logger(loggerOptions);
                const logger2 = new Logger(loggerOptions);

                // Clear existing cache
                const existingIds = getCachedCorrelationIds();
                existingIds.forEach((id: string) => {
                    getAndFlushLogsFromCache(id);
                });

                // Fill cache from first instance
                logger1.info("Message 1", "correlation-1");
                logger1.info("Message 2", "correlation-2");
                logger1.info("Message 3", "correlation-3");

                // Add from second instance
                logger2.info("Message 4", "correlation-4");

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

                // Add logs from both instances
                logger1.info("Message from logger1", correlationId);
                logger2.error("Message from logger2", correlationId);

                // Flush from first instance
                const flushedLogs = getAndFlushLogsFromCache(correlationId);
                expect(flushedLogs).toHaveLength(2);

                // Second instance should also see empty cache
                const remainingLogs = getLogsFromCache(correlationId);
                expect(remainingLogs).toHaveLength(0);
            });
        });

        describe("Hash generation and consistency", () => {
            it("should generate consistent 6-character hashes", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "hash-test";
                const message = "Test message for hashing";

                // Log the same message multiple times
                logger.info(message, correlationId);
                logger.info(message, correlationId);

                const cachedLogs = getLogsFromCache(correlationId);
                expect(cachedLogs).toHaveLength(2);

                // Both logs should have the same hash for the same message
                expect(cachedLogs[0].hash).toBe(cachedLogs[1].hash);
                expect(cachedLogs[0].hash).toHaveLength(6);
                expect(/^[a-zA-Z0-9]{6}$/.test(cachedLogs[0].hash)).toBe(true);
            });

            it("should generate different hashes for different messages", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "different-hash-test";

                logger.info("First message", correlationId);
                logger.info("Second message", correlationId);

                const cachedLogs = getLogsFromCache(correlationId);
                expect(cachedLogs).toHaveLength(2);
                expect(cachedLogs[0].hash).not.toBe(cachedLogs[1].hash);
            });

            it("should handle already hashed strings correctly", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "pre-hashed-test";
                const hashedMessage = "abc123"; // 6-character alphanumeric string

                logger.info(hashedMessage, correlationId);

                const cachedLogs = getLogsFromCache(correlationId);
                expect(cachedLogs).toHaveLength(1);
                // Should use the string as-is since it looks like a hash
                expect(cachedLogs[0].hash).toBe(hashedMessage);
            });
        });

        describe("Edge cases and error Handling", () => {
            it("should handle null/undefined correlation IDs gracefully", () => {
                const logger = new Logger(loggerOptions);

                // Clear existing cache first
                const existingIds = getCachedCorrelationIds();
                existingIds.forEach((id: string) => {
                    getAndFlushLogsFromCache(id);
                });

                // Test with various falsy values
                logger.info("Message with null", null as any);
                logger.info("Message with undefined", undefined as any);
                logger.info("Message with empty string", "");

                // All should be treated as empty string correlation
                const emptyLogs = getLogsFromCache("");
                const undefinedLogs = getLogsFromCache("");

                expect(emptyLogs).toHaveLength(3);
                expect(undefinedLogs).toEqual(emptyLogs);
            });

            it("should handle very long messages", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "long-message-test";
                const longMessage = "x".repeat(10000); // 10KB message

                logger.info(longMessage, correlationId);

                const cachedLogs = getLogsFromCache(correlationId);
                expect(cachedLogs).toHaveLength(1);
                expect(cachedLogs[0].hash).toHaveLength(6);
            });

            it("should handle special characters in messages", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "special-chars-test";
                const specialMessage = "Message with éñ¡cöde and 🚀 emoji and \n newlines";

                logger.info(specialMessage, correlationId);

                const cachedLogs = getLogsFromCache(correlationId);
                expect(cachedLogs).toHaveLength(1);
                expect(cachedLogs[0].hash).toHaveLength(6);
            });

            it("should return copies of cached logs to prevent external modification", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "immutable-test";

                logger.info("Original message", correlationId);

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
                    milliseconds: 0
                });

                expect(cachedLogs1).toHaveLength(2);
                expect(cachedLogs2).toHaveLength(1);
            });

            it("should handle concurrent access safely", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "concurrent-test";

                // Simulate concurrent logging
                const promises = Array.from({ length: 100 }, (_, i) =>
                    Promise.resolve(logger.info(`Concurrent message ${i}`, correlationId))
                );

                return Promise.all(promises).then(() => {
                    const cachedLogs = getLogsFromCache(correlationId);
                    expect(cachedLogs).toHaveLength(100);

                    // All logs should have valid hashes
                    cachedLogs.forEach(log => {
                        expect(log.hash).toHaveLength(6);
                        expect(log.level).toBe(LogLevel.Info);
                        expect(typeof log.milliseconds).toBe('number');
                    });
                });
            });
        });

        describe("Performance and memory", () => {
            it("should not cause memory leaks with many correlation IDs", () => {
                const logger = new Logger(loggerOptions);

                // Use a unique prefix to avoid conflicts with other tests
                const uniquePrefix = `memory-test-${Date.now()}`;

                // Record initial cache size
                const initialCacheSize = getCachedCorrelationIds().length;

                // Create many correlation IDs
                for (let i = 0; i < 50; i++) {
                    logger.info(`Message ${i}`, `${uniquePrefix}-${i}`);
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
                const ourCorrelationIds = correlationIds.filter(id => id.startsWith(uniquePrefix));
                expect(ourCorrelationIds.length).toBeGreaterThan(0);
            });

            it("should handle rapid logging without issues", () => {
                const logger = new Logger(loggerOptions);
                const correlationId = "rapid-test";
                const startTime = Date.now();

                // Log many messages rapidly
                for (let i = 0; i < 1000; i++) {
                    logger.info(`Rapid message ${i}`, correlationId);
                }

                const endTime = Date.now();
                const cachedLogs = getLogsFromCache(correlationId);

                expect(cachedLogs).toHaveLength(300); // Limited by MAX_LOGS_PER_CORRELATION
                expect(endTime - startTime).toBeLessThan(1000); // Should complete quickly

                // Verify milliseconds are in order
                for (let i = 1; i < cachedLogs.length; i++) {
                    expect(cachedLogs[i].milliseconds).toBeGreaterThanOrEqual(cachedLogs[i - 1].milliseconds);
                }
            });
        });
    });
});
