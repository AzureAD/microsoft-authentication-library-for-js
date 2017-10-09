import { Utils } from './Utils';

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

export interface ILoggerCallback {
  (level: LogLevel, message: string, containsPii: boolean): void;
}

export enum LogLevel {
  Error,
  Warning,
  Info,
  Verbose
}

export class Logger {// Singleton Class

  /**
  * @hidden
  */
  private static _instance: Logger;

  /**
  * @hidden
  */
  private _correlationId: string;

  get correlationId(): string { return this._correlationId; }

  set correlationId(correlationId: string) {
    this._correlationId = correlationId;
  };

  /**
  * @hidden
  */
  private _level: LogLevel = LogLevel.Info;

  get level(): LogLevel { return this._level; }

  set level(logLevel: LogLevel) {
    if (LogLevel[logLevel]) {
      this._level = logLevel;
    }

    else throw new Error("Provide a valid value for level. Possibles range for logLevel is 0-3");
  };

  /**
  * @hidden
  */
  private _piiLoggingEnabled: boolean = false;

  get piiLoggingEnabled(): boolean { return this._piiLoggingEnabled; }

  set piiLoggingEnabled(piiLoggingEnabled: boolean) {
    this._piiLoggingEnabled = piiLoggingEnabled;
  };

  /**
  * @hidden
  */
  private _localCallback: ILoggerCallback;

  get localCallback(): ILoggerCallback { return this._localCallback; }

  set localCallback(localCallback: ILoggerCallback) {
    if (this.localCallback) {
      throw new Error("MSAL logging callback can only be set once per process and should never change once set.");
    }
    this._localCallback = localCallback;
  };

  constructor(correlationId: string) {
    if (Logger._instance) {
      return Logger._instance;
    }
    this._correlationId = correlationId;
    Logger._instance = this;
    return Logger._instance;
  }

  /**
  * @hidden
  */
  private logMessage(logMessage: string, logLevel: LogLevel, containsPii: boolean): void {
    if ((logLevel > this.level) || (!this.piiLoggingEnabled && containsPii)) {
      return;
    }
    var timestamp = new Date().toUTCString();
    var log: string;
    if (!Utils.isEmpty(this.correlationId)) {
      log = timestamp + ":" + this._correlationId + "-" + Utils.getLibraryVersion() + "-" + LogLevel[logLevel] + " " + logMessage;
    }
    else {
      log = timestamp + ":" + Utils.getLibraryVersion() + "-" + LogLevel[logLevel] + " " + logMessage;
    }
    this.executeCallback(logLevel, log, containsPii);
  }

  /**
  * @hidden
  */
  executeCallback(level: LogLevel, message: string, containsPii: boolean) {
    if (this.localCallback) {
      this.localCallback(level, message, containsPii);
    }
  }

  /**
  * @hidden
  */
  error(message: string): void {
    this.logMessage(message, LogLevel.Error, false);
  }

  /**
  * @hidden
  */
  errorPii(message: string): void {
    this.logMessage(message, LogLevel.Error, true);
  }

  /**
  * @hidden
  */
  warning(message: string): void {
    this.logMessage(message, LogLevel.Warning, false);
  }

  /**
  * @hidden
  */
  warningPii(message: string): void {
    this.logMessage(message, LogLevel.Warning, true);
  }

  /**
  * @hidden
  */
  info(message: string): void {
    this.logMessage(message, LogLevel.Info, false);
  }

  /**
  * @hidden
  */
  infoPii(message: string): void {
    this.logMessage(message, LogLevel.Info, true);
  }

  /**
  * @hidden
  */
  verbose(message: string): void {
    this.logMessage(message, LogLevel.Verbose, false);
  }

  /**
  * @hidden
  */
  verbosePii(message: string): void {
    this.logMessage(message, LogLevel.Verbose, true);
  }
}
