namespace MSAL {
    export enum LoggingLevel {
        ERROR,
        WARN,
        INFO,
        VERBOSE
    }

    export class Logger {
        static log(level: number, message: string, error: string): void {
            if (level <= Logging._logLevel) {
                var timestamp = new Date().toUTCString();
                var formattedMessage = '';
                if (Logging._correlationId)
                    formattedMessage = timestamp + ':' + Logging._correlationId + '-' + this.libVersion() + '-' + LoggingLevel[level] + ' ' + message;
                else
                    formattedMessage = timestamp + ':' + this.libVersion() + '-' + LoggingLevel[level] + ' ' + message;
                if (error) {
                    formattedMessage += '\nstack:\n' + error;
                }

                if (Logging._loginCallback)
                    Logging._loginCallback(formattedMessage);
            }
        }

        static error(message: string, error: string): void {
            this.log(LoggingLevel.ERROR, message, error);
        }

        static warn(message: string): void {
            this.log(LoggingLevel.WARN, message, null);
        }

        static info(message: string): void {
            this.log(LoggingLevel.INFO, message, null);
        }

        static verbose(message: string): void {
            this.log(LoggingLevel.VERBOSE, message, null);
        }

        static libVersion(): string {
            return '1.0.0';
        }
    }
}