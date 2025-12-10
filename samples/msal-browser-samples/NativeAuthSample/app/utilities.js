/*
 * Utilities Module
 */

export class Utilities {
    static logMessage(message, type = 'info') {
        // Log to console instead of UI
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}`;
        
        switch (type) {
            case 'error':
                console.error(logEntry);
                break;
            case 'warning':
                console.warn(logEntry);
                break;
            case 'success':
                console.log('%c' + logEntry, 'color: green');
                break;
            case 'info':
            default:
                console.info(logEntry);
                break;
        }
    }
}
