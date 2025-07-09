/*
 * Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the source repository root for complete license information.
 */

// Utils module - utility functions for messages, helpers, and common functionality

// Utility functions for showing messages
export function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        // Handle multi-line messages by converting to HTML
        const htmlMessage = message.replace(/\n/g, '<br>');
        errorDiv.innerHTML = htmlMessage;
        errorDiv.style.display = 'block';
        
        // Add dismiss button if not already present
        let dismissBtn = errorDiv.querySelector('.dismiss-btn');
        if (!dismissBtn) {
            dismissBtn = document.createElement('button');
            dismissBtn.className = 'dismiss-btn';
            dismissBtn.innerHTML = '×';
            dismissBtn.title = 'Dismiss';
            dismissBtn.addEventListener('click', () => {
                errorDiv.style.display = 'none';
            });
            errorDiv.appendChild(dismissBtn);
        }
        
        // No automatic timeout - user must dismiss manually
    } else {
        alert('Error: ' + message);
    }
}

export function showSuccess(message) {
    const successDiv = document.getElementById('success-message');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        successDiv.classList.add('show');
        
        // Use CSS animation events for better control
        const hideMessage = () => {
            successDiv.classList.remove('show');
            successDiv.addEventListener('transitionend', () => {
                successDiv.style.display = 'none';
            }, { once: true });
        };
        
        // Auto-hide after 3 seconds using animation frame for better performance
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                // Double RAF ensures the show class is applied first
                setTimeout(hideMessage, 3000);
            });
        });
    } else {
        console.log('Success: ' + message);
    }
}

// Utility function to wait for DOM elements to be available
export function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            return resolve(element);
        }
        
        const observer = new MutationObserver((mutations, obs) => {
            const element = document.querySelector(selector);
            if (element) {
                obs.disconnect();
                resolve(element);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Timeout fallback
        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        }, timeout);
    });
}

