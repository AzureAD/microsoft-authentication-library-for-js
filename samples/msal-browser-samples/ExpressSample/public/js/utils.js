/*
 * Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the source repository root for complete license information.
 */

// Utils module - utility functions for messages, helpers, and common functionality

// Required environment variables for the application to function
const REQUIRED_ENV_VARS = {
    CLIENT_ID: {
        name: 'CLIENT_ID',
        description: 'Application (client) ID from Azure portal',
        example: 'e.g., 12345678-1234-1234-1234-123456789012'
    },
    AUTHORITY: {
        name: 'AUTHORITY',
        description: 'Azure AD authority URL',
        example: 'e.g., https://login.microsoftonline.com/your-tenant-id'
    },
    REDIRECT_URI: {
        name: 'REDIRECT_URI',
        description: 'Redirect URI configured in Azure portal',
        example: 'e.g., http://localhost:3000'
    },
    POST_LOGOUT_REDIRECT_URI: {
        name: 'POST_LOGOUT_REDIRECT_URI',
        description: 'Post logout redirect URI',
        example: 'e.g., http://localhost:3000'
    }
};

// Environment variable validation function
export function validateEnvironmentVariables() {
    const envConfig = window.envConfig || {};
    const missingVars = [];
    const emptyVars = [];
    
    // Check each required environment variable
    Object.entries(REQUIRED_ENV_VARS).forEach(([key, config]) => {
        const value = envConfig[key];
        if (value === undefined || value === null) {
            missingVars.push(config);
        } else if (typeof value === 'string' && value.trim() === '') {
            emptyVars.push(config);
        }
    });
    
    // If there are missing or empty variables, show a prominent alert
    if (missingVars.length > 0 || emptyVars.length > 0) {
        showEnvironmentVariableAlert(missingVars, emptyVars);
        return false;
    }
    
    return true;
}

// Show a prominent alert for missing environment variables
function showEnvironmentVariableAlert(missingVars, emptyVars) {
    const allProblematicVars = [...missingVars, ...emptyVars];
    
    let alertMessage = `<div class="env-alert-header">
        <h3>⚠️ Configuration Required</h3>
        <p>The following environment variables need to be configured for this application to work properly:</p>
    </div>`;
    
    alertMessage += '<div class="env-alert-vars">';
    
    allProblematicVars.forEach(config => {
        const status = missingVars.includes(config) ? 'Missing' : 'Empty';
        alertMessage += `
            <div class="env-var-item">
                <strong>${config.name}</strong> - <span class="env-status ${status.toLowerCase()}">${status}</span>
                <div class="env-description">${config.description}</div>
                <div class="env-example">${config.example}</div>
            </div>
        `;
    });
    
    alertMessage += '</div>';
    
    alertMessage += `
        <div class="env-alert-instructions">
            <h4>How to fix this:</h4>
            <ol>
                <li>Create a <code>.env</code> file in the ExpressSample directory</li>
                <li>Add the missing environment variables:</li>
            </ol>
            <div class="env-example-code">
                <pre>${allProblematicVars.map(config => `${config.name}=${config.example.replace('e.g., ', '')}`).join('\n')}</pre>
            </div>
            <p>For detailed setup instructions, see the <a href="https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/v4-lts/samples/msal-browser-samples/ExpressSample#configure-the-application" target="_blank">README.md</a></p>
        </div>
    `;
    
    // Show the alert using the existing error message infrastructure
    showError(alertMessage);
    
    // Add custom CSS for the environment alert
    addEnvironmentAlertStyles();
}

// Add custom styles for environment variable alert
function addEnvironmentAlertStyles() {
    // Check if styles already exist
    if (document.getElementById('env-alert-styles')) {
        return;
    }
    
    const style = document.createElement('style');
    style.id = 'env-alert-styles';
    style.textContent = `
        .env-alert-header h3 {
            margin: 0 0 10px 0;
            color: #d32f2f;
            font-size: 1.2em;
        }
        
        .env-alert-header p {
            margin: 0 0 15px 0;
            color: #333;
        }
        
        .env-alert-vars {
            margin: 15px 0;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            background: #f9f9f9;
        }
        
        .env-var-item {
            padding: 12px;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .env-var-item:last-child {
            border-bottom: none;
        }
        
        .env-var-item strong {
            font-family: 'Courier New', monospace;
            color: #1976d2;
        }
        
        .env-status {
            font-weight: bold;
            text-transform: uppercase;
            font-size: 0.8em;
        }
        
        .env-status.missing {
            color: #d32f2f;
        }
        
        .env-status.empty {
            color: #f57c00;
        }
        
        .env-description {
            margin: 5px 0;
            color: #666;
            font-size: 0.9em;
        }
        
        .env-example {
            margin: 5px 0;
            color: #888;
            font-size: 0.85em;
            font-style: italic;
        }
        
        .env-alert-instructions h4 {
            margin: 15px 0 10px 0;
            color: #333;
        }
        
        .env-alert-instructions ol {
            margin: 10px 0;
            padding-left: 20px;
        }
        
        .env-alert-instructions li {
            margin: 5px 0;
        }
        
        .env-example-code {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 15px;
            border-radius: 4px;
            margin: 10px 0;
            overflow-x: auto;
        }
        
        .env-example-code pre {
            margin: 0;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            white-space: pre;
        }
        
        .env-alert-instructions a {
            color: #1976d2;
            text-decoration: underline;
        }
        
        .env-alert-instructions a:hover {
            color: #0d47a1;
        }
        
        .env-alert-instructions code {
            background: #e8e8e8;
            padding: 2px 4px;
            border-radius: 2px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
    `;
    
    document.head.appendChild(style);
}

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

