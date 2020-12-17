import { expect } from "chai";
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
            expect(logger.isPiiLoggingEnabled()).to.be.true;
        });
    });

    describe("clone() tests", () => {

        it("Creates a new logger with logger configurations of existing logger", () => {
            const logger = new Logger(loggerOptions);
            const loggerClone = logger.clone("msal-common", "1.0.0");
            expect(loggerClone.isPiiLoggingEnabled()).to.equal(logger.isPiiLoggingEnabled());
        });

        it("Creates a new logger with package name and package version", () => {
            const logger = new Logger(loggerOptions);
            const loggerClone = logger.clone("msal-common", "2.0.0");
            loggerClone.info("Message");
            expect(logStore[LogLevel.Info]).to.include("msal-common");
            expect(logStore[LogLevel.Info]).to.include("2.0.0");
            expect(logStore[LogLevel.Info]).to.include("msal-common@2.0.0");
        });
    });

    describe("clone() tests", () => {

        it("Creates a new logger with logger configurations of existing logger", () => {
            const logger = new Logger(loggerOptions);
            const loggerClone = logger.clone("msal-common", "1.0.0");
            expect(loggerClone.isPiiLoggingEnabled()).to.equal(logger.isPiiLoggingEnabled());
        });

        it("Creates a new logger with package name and package version", () => {
            const logger = new Logger(loggerOptions);
            const loggerClone = logger.clone("msal-common", "2.0.0");
            loggerClone.info("Message");
            expect(logStore[LogLevel.Info]).to.include("msal-common");
            expect(logStore[LogLevel.Info]).to.include("2.0.0");
            expect(logStore[LogLevel.Info]).to.include("msal-common@2.0.0");
        });
    });

    describe("executeCallback() tests", () => {

        it("Executes a callback if assigned", () => {
            const logger = new Logger(loggerOptions);
            logger.executeCallback(LogLevel.Error, "Message", true);
            expect(logStore[LogLevel.Error]).to.be.eq("Message");
        });
    });

    describe("Error APIs", () => {

        it("Executes error APIs", () => {
            const executeCbSpy = sinon.spy(Logger.prototype, "executeCallback");

            const logger = new Logger(loggerOptions);
            logger.error("Message");
            expect(executeCbSpy.calledWith(LogLevel.Error)).to.be.true;
        });

        it("Executes errorPii APIs", () => {
            const executeCbSpy = sinon.spy(Logger.prototype, "executeCallback");

            const logger = new Logger(loggerOptions);
            logger.errorPii("Message");
            expect(executeCbSpy.calledWith(LogLevel.Error)).to.be.true;
        });

        it("Does not execute errorPii APIs if piiLogging is disabled", () => {
            loggerOptions.piiLoggingEnabled = false;
            const executeCbSpy = sinon.spy(Logger.prototype, "executeCallback");

            const logger = new Logger(loggerOptions);
            logger.errorPii("Message");
            expect(executeCbSpy.called).to.be.false;
        });
    });

    describe("Warning APIs", () => {

        it("Executes warning APIs", () => {
            const executeCbSpy = sinon.spy(Logger.prototype, "executeCallback");

            const logger = new Logger(loggerOptions);
            logger.warning("Message");
            expect(executeCbSpy.calledWith(LogLevel.Warning)).to.be.true;
        });

        it("Executes warningPii APIs", () => {
            const executeCbSpy = sinon.spy(Logger.prototype, "executeCallback");

            const logger = new Logger(loggerOptions);
            logger.warningPii("Message");
            expect(executeCbSpy.calledWith(LogLevel.Warning)).to.be.true;
        });

        it("Does not execute warningPii APIs if piiLogging is disabled", () => {
            loggerOptions.piiLoggingEnabled = false;
            const executeCbSpy = sinon.spy(Logger.prototype, "executeCallback");

            const logger = new Logger(loggerOptions);
            logger.warningPii("Message");
            expect(executeCbSpy.called).to.be.false;
        });
    });

    describe("Info APIs", () => {

        it("Executes info APIs", () => {
            const executeCbSpy = sinon.spy(Logger.prototype, "executeCallback");

            const logger = new Logger(loggerOptions);
            logger.info("Message");
            expect(executeCbSpy.calledWith(LogLevel.Info)).to.be.true;
        });

        it("Executes infoPii APIs", () => {
            const executeCbSpy = sinon.spy(Logger.prototype, "executeCallback");

            const logger = new Logger(loggerOptions);
            logger.infoPii("Message");
            expect(executeCbSpy.calledWith(LogLevel.Info)).to.be.true;
        });

        it("Does not execute infoPii APIs if piiLogging is disabled", () => {
            loggerOptions.piiLoggingEnabled = false;
            const executeCbSpy = sinon.spy(Logger.prototype, "executeCallback");

            const logger = new Logger(loggerOptions);
            logger.infoPii("Message");
            expect(executeCbSpy.called).to.be.false;
        });
    });

    describe("Verbose APIs", () => {

        it("Executes verbose APIs", () => {
            const executeCbSpy = sinon.spy(Logger.prototype, "executeCallback");

            const logger = new Logger(loggerOptions);
            logger.verbose("Message");
            expect(executeCbSpy.calledWith(LogLevel.Verbose)).to.be.true;
        });

        it("Executes verbosePii APIs", () => {
            const executeCbSpy = sinon.spy(Logger.prototype, "executeCallback");

            const logger = new Logger(loggerOptions);
            logger.verbosePii("Message");
            expect(executeCbSpy.calledWith(LogLevel.Verbose)).to.be.true;
        });

        it("Does not execute verbosePii APIs if piiLogging is disabled", () => {
            loggerOptions.piiLoggingEnabled = false;
            const executeCbSpy = sinon.spy(Logger.prototype, "executeCallback");

            const logger = new Logger(loggerOptions);
            logger.verbosePii("Message");
            expect(executeCbSpy.called).to.be.false;
        });
    });
});
