/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the 'Software'), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import { Utils } from "./Utils";
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Error"] = 0] = "Error";
    LogLevel[LogLevel["Warning"] = 1] = "Warning";
    LogLevel[LogLevel["Info"] = 2] = "Info";
    LogLevel[LogLevel["Verbose"] = 3] = "Verbose";
})(LogLevel || (LogLevel = {}));
var Logger = /** @class */ (function () {
    function Logger(correlationId) {
        /*
         * @hidden
         */
        this._level = LogLevel.Info;
        /*
         * @hidden
         */
        this._piiLoggingEnabled = false;
        if (Logger._instance) {
            return Logger._instance;
        }
        this._correlationId = correlationId;
        Logger._instance = this;
        return Logger._instance;
    }
    Object.defineProperty(Logger.prototype, "correlationId", {
        get: function () { return this._correlationId; },
        set: function (correlationId) {
            this._correlationId = correlationId;
        },
        enumerable: true,
        configurable: true
    });
    ;
    Object.defineProperty(Logger.prototype, "level", {
        get: function () { return this._level; },
        set: function (logLevel) {
            if (LogLevel[logLevel]) {
                this._level = logLevel;
            }
            else
                throw new Error("Provide a valid value for level. Possibles range for logLevel is 0-3");
        },
        enumerable: true,
        configurable: true
    });
    ;
    Object.defineProperty(Logger.prototype, "piiLoggingEnabled", {
        get: function () { return this._piiLoggingEnabled; },
        set: function (piiLoggingEnabled) {
            this._piiLoggingEnabled = piiLoggingEnabled;
        },
        enumerable: true,
        configurable: true
    });
    ;
    Object.defineProperty(Logger.prototype, "localCallback", {
        get: function () { return this._localCallback; },
        set: function (localCallback) {
            if (this.localCallback) {
                throw new Error("MSAL logging callback can only be set once per process and should never change once set.");
            }
            this._localCallback = localCallback;
        },
        enumerable: true,
        configurable: true
    });
    ;
    /*
     * @hidden
     */
    Logger.prototype.logMessage = function (logMessage, logLevel, containsPii) {
        if ((logLevel > this.level) || (!this.piiLoggingEnabled && containsPii)) {
            return;
        }
        var timestamp = new Date().toUTCString();
        var log;
        if (!Utils.isEmpty(this.correlationId)) {
            log = timestamp + ":" + this._correlationId + "-" + Utils.getLibraryVersion() + "-" + LogLevel[logLevel] + " " + logMessage;
        }
        else {
            log = timestamp + ":" + Utils.getLibraryVersion() + "-" + LogLevel[logLevel] + " " + logMessage;
        }
        this.executeCallback(logLevel, log, containsPii);
    };
    /*
     * @hidden
     */
    Logger.prototype.executeCallback = function (level, message, containsPii) {
        if (this.localCallback) {
            this.localCallback(level, message, containsPii);
        }
    };
    /*
     * @hidden
     */
    Logger.prototype.error = function (message) {
        this.logMessage(message, LogLevel.Error, false);
    };
    /*
     * @hidden
     */
    Logger.prototype.errorPii = function (message) {
        this.logMessage(message, LogLevel.Error, true);
    };
    /*
     * @hidden
     */
    Logger.prototype.warning = function (message) {
        this.logMessage(message, LogLevel.Warning, false);
    };
    /*
     * @hidden
     */
    Logger.prototype.warningPii = function (message) {
        this.logMessage(message, LogLevel.Warning, true);
    };
    /*
     * @hidden
     */
    Logger.prototype.info = function (message) {
        this.logMessage(message, LogLevel.Info, false);
    };
    /*
     * @hidden
     */
    Logger.prototype.infoPii = function (message) {
        this.logMessage(message, LogLevel.Info, true);
    };
    /*
     * @hidden
     */
    Logger.prototype.verbose = function (message) {
        this.logMessage(message, LogLevel.Verbose, false);
    };
    /*
     * @hidden
     */
    Logger.prototype.verbosePii = function (message) {
        this.logMessage(message, LogLevel.Verbose, true);
    };
    return Logger;
}());
export { Logger };
//# sourceMappingURL=Logger.js.map