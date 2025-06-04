/*
 * Utilities Module
 * 
 * This module contains utility functions shared across the MSAL Native Auth sample.
 */

export class Utilities {
    static logMessage(message, type = 'info') {
        const resultsDiv = document.getElementById('results');
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}\n`;
        
        const span = document.createElement('span');
        span.className = type;
        span.textContent = logEntry;
        
        resultsDiv.appendChild(span);
        resultsDiv.scrollTop = resultsDiv.scrollHeight;
    }

    static clearResults() {
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = '<p>Results will appear here...</p>';
    }
}
