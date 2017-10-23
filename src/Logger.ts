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

  /*
   * @hidden
   */
  private static _instance: Logger;

  /*
   * @hidden
   */
  private _correlationId: string;

  /*
   * @hidden
   */
  private _level: LogLevel = LogLevel.Info;

  /*
   * @hidden
   */
  private _piiLoggingEnabled: boolean;

  /*
   * @hidden
   */
  private _localCallback: ILoggerCallback;

  constructor(localCallback: ILoggerCallback,
      options:
      {
          correlationId?: string,
          level?: LogLevel,
          piiLoggingEnabled?: boolean,
      } = {}) {
      const {
          correlationId = "",
          level = LogLevel.Info,
          piiLoggingEnabled = false
      } = options;

      this._localCallback = localCallback;
      this._correlationId = correlationId;
      this._level = level;
      this._piiLoggingEnabled = piiLoggingEnabled;
  }

  /*
   * @hidden
   */
  private logMessage(logLevel: LogLevel, logMessage: string, containsPii: boolean): void {
    if ((logLevel > this._level) || (!this._piiLoggingEnabled && containsPii)) {
      return;
    }
    var timestamp = new Date().toUTCString();
    var log: string;
    if (!Utils.isEmpty(this._correlationId)) {
      log = timestamp + ":" + this._correlationId + "-" + Utils.getLibraryVersion() + "-" + LogLevel[logLevel] + " " + logMessage;
    }
    else {
      log = timestamp + ":" + Utils.getLibraryVersion() + "-" + LogLevel[logLevel] + " " + logMessage;
    }
    this.executeCallback(logLevel, log, containsPii);
  }

  /*
   * @hidden
   */
  executeCallback(level: LogLevel, message: string, containsPii: boolean) {
    if (this._localCallback) {
      this._localCallback(level, message, containsPii);
    }
  }

  /*
   * @hidden
   */
  error(message: string): void {
    this.logMessage(LogLevel.Error, message, false);
  }

  /*
   * @hidden
   */
  errorPii(message: string): void {
    this.logMessage(LogLevel.Error, message, true);
  }

  /*
   * @hidden
   */
  warning(message: string): void {
    this.logMessage(LogLevel.Warning, message, false);
  }

  /*
   * @hidden
   */
  warningPii(message: string): void {
    this.logMessage(LogLevel.Warning, message, true);
  }

  /*
   * @hidden
   */
  info(message: string): void {
    this.logMessage(LogLevel.Info, message, false);
  }

  /*
   * @hidden
   */
  infoPii(message: string): void {
    this.logMessage(LogLevel.Info, message, true);
  }

  /*
   * @hidden
   */
  verbose(message: string): void {
    this.logMessage(LogLevel.Verbose, message, false);
  }

  /*
   * @hidden
   */
  verbosePii(message: string): void {
    this.logMessage(LogLevel.Verbose, message, true);
  }
}
