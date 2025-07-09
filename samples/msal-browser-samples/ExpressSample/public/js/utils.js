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

export function showErrorHTML(htmlContent) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        // Set HTML content directly
        errorDiv.innerHTML = htmlContent;
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
        // Fallback to alert with text content only
        const textContent = htmlContent.replace(/<br>/g, '\n').replace(/<[^>]*>/g, '');
        alert('Error: ' + textContent);
    }
}

export function showSuccess(message) {
    const successDiv = document.getElementById('success-message');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 3000);
    } else {
        console.log('Success: ' + message);
    }
}
