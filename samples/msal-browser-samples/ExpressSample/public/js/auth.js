/*
 * Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the source repository root for complete license information.
 */

import { showError, showSuccess } from './utils.js';

// Authentication module - handles all MSAL authentication logic

// MSAL instance
let msalInstance;

// Application state
let currentUser = null;
let isAuthenticated = false;

// Forward declaration for updateUI (will be provided by ui module)
let updateUI = null;

// Set updateUI function (called by main app)
export function setUpdateUIFunction(fn) {
    updateUI = fn;
}

// Initialize MSAL
export async function initializeMsal() {
    try {
        msalInstance = new msal.PublicClientApplication(window.msalConfig);
        await msalInstance.initialize();
        
        // Set active account if it exists
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
            msalInstance.setActiveAccount(accounts[0]);
            currentUser = accounts[0];
            isAuthenticated = true;
        }
        
        // Update UI after initialization
        if (updateUI) {
            updateUI();
        }
    } catch (error) {
        console.error('MSAL initialization failed:', error);
    }
}

// Refresh authentication state (useful after account changes)
export function refreshAuthState() {
    if (!msalInstance) {
        currentUser = null;
        isAuthenticated = false;
        if (updateUI) {
            updateUI();
        }
        return;
    }
    
    const activeAccount = msalInstance.getActiveAccount();
    const allAccounts = msalInstance.getAllAccounts();
    
    if (activeAccount) {
        currentUser = activeAccount;
        isAuthenticated = true;
    } else if (allAccounts.length > 0) {
        // If no active account but accounts exist, set the first one as active
        msalInstance.setActiveAccount(allAccounts[0]);
        currentUser = allAccounts[0];
        isAuthenticated = true;
    } else {
        currentUser = null;
        isAuthenticated = false;
    }
    
    if (updateUI) {
        updateUI();
    }
}

// Handle redirect promise
export async function handleRedirectPromise() {
    try {
        const response = await msalInstance.handleRedirectPromise();
        if (response) {
            currentUser = response.account;
            isAuthenticated = true;
            msalInstance.setActiveAccount(response.account);
            if (updateUI) {
                updateUI();
            }
        }
    } catch (error) {
        console.error('Error handling redirect:', error);
        showError('Authentication failed: ' + error.message);
    }
}

// SSO Silent authentication attempt
export async function attemptSSOSilent() {
    try {
        console.log('Attempting SSO silent authentication...');
        
        // Only attempt SSO if no current user or if we need to refresh
        if (!currentUser) {
            console.log('No current user, skipping SSO silent');
            return false;
        }
        
        const ssoSilentRequest = {
            scopes: window.loginRequest.scopes,
            loginHint: currentUser.username // Use loginHint for better SSO experience
        };
        
        const response = await msalInstance.ssoSilent(ssoSilentRequest);
        
        if (response) {
            console.log('SSO silent successful', response);
            currentUser = response.account;
            isAuthenticated = true;
            msalInstance.setActiveAccount(response.account);
            if (updateUI) {
                updateUI();
            }
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.log('SSO silent failed:', error);
        
        // Check if this is an interaction required error
        if (error instanceof msal.InteractionRequiredAuthError) {
            console.log('SSO silent failed - interaction required');
        } else {
            console.warn('SSO silent failed with unexpected error:', error);
        }
        
        return false;
    }
}

// Handle authentication for protected routes
export async function handleProtectedRouteAuth(path) {
    try {
        console.log(`Attempting authentication for protected route: ${path}`);
        
        // First attempt SSO silent
        const ssoSuccess = await attemptSSOSilent();
        
        if (ssoSuccess) {
            console.log('SSO silent successful, proceeding to route');
            return true;
        }
        
        // If SSO silent fails, fallback to acquireTokenRedirect
        console.log('SSO silent failed, falling back to acquireTokenRedirect');
        await msalInstance.acquireTokenRedirect(window.loginRequest);
        
        // The redirect will happen, so we return false to prevent further navigation
        return false;
        
    } catch (error) {
        console.error('Authentication failed:', error);
        showError('Authentication failed: ' + error.message);
        return false;
    }
}

// Sign in with popup
export async function signInPopup() {
    try {
        const response = await msalInstance.loginPopup(window.loginRequest);
        currentUser = response.account;
        isAuthenticated = true;
        msalInstance.setActiveAccount(response.account);
        if (updateUI) {
            updateUI();
        }
        showSuccess('Successfully signed in!');
    } catch (error) {
        console.error('Popup sign in failed:', error);
        showError('Sign in failed: ' + error.message);
    }
}

// Sign in with redirect
export async function signInRedirect() {
    try {
        await msalInstance.loginRedirect(window.loginRequest);
    } catch (error) {
        console.error('Redirect sign in failed:', error);
        showError('Sign in failed: ' + error.message);
    }
}

// Sign in with redirect and prompt for account selection
export async function signInRedirectWithPrompt() {
    try {
        await msalInstance.loginRedirect({
            ...window.loginRequest,
            prompt: "select_account"
        });
    } catch (error) {
        console.error('Redirect sign in with prompt failed:', error);
        showError('Sign in failed: ' + error.message);
    }
}

// Sign out with popup
export async function signOutPopup() {
    try {
        const logoutRequest = {
            account: currentUser
        };
        
        await msalInstance.logoutPopup(logoutRequest);
        currentUser = null;
        isAuthenticated = false;
        if (updateUI) {
            updateUI();
        }
        showSuccess('Successfully signed out!');
    } catch (error) {
        console.error('Popup sign out failed:', error);
        showError('Sign out failed: ' + error.message);
    }
}

// Sign out with redirect
export async function signOutRedirect() {
    try {
        const logoutRequest = {
            account: currentUser,
            postLogoutRedirectUri: window.msalConfig.auth.postLogoutRedirectUri
        };
        
        await msalInstance.logoutRedirect(logoutRequest);
    } catch (error) {
        console.error('Redirect sign out failed:', error);
        showError('Sign out failed: ' + error.message);
    }
}

// Sign out (legacy function for backward compatibility)
export async function signOut() {
    await signOutRedirect();
}

// Get access token silently
export async function getAccessTokenSilent() {
    try {
        const account = msalInstance.getActiveAccount();
        if (!account) {
            throw new Error('No active account found');
        }
        
        const response = await msalInstance.acquireTokenSilent({
            ...window.loginRequest,
            account: account
        });
        
        return response.accessToken;
    } catch (error) {
        console.error('Silent token acquisition failed:', error);
        
        if (error instanceof msal.InteractionRequiredAuthError) {
            // Fallback to redirect
            await msalInstance.acquireTokenRedirect({
                ...window.loginRequest,
                account: msalInstance.getActiveAccount()
            });
        }
        throw error;
    }
}

// Debug function to check authentication state
export function debugAuthState() {
    console.log('=== Auth State Debug ===');
    console.log('MSAL Instance:', msalInstance);
    console.log('Current User:', currentUser);
    console.log('Is Authenticated:', isAuthenticated);
    
    if (msalInstance) {
        const accounts = msalInstance.getAllAccounts();
        const activeAccount = msalInstance.getActiveAccount();
        console.log('All Accounts:', accounts);
        console.log('Active Account:', activeAccount);
        
        // Check if there's a mismatch
        if (accounts.length > 0 && !activeAccount) {
            console.warn('WARNING: Accounts exist but no active account set!');
        }
        if (activeAccount && !isAuthenticated) {
            console.warn('WARNING: Active account exists but isAuthenticated is false!');
        }
        if (!activeAccount && isAuthenticated) {
            console.warn('WARNING: No active account but isAuthenticated is true!');
        }
    }
    
    // Check UI elements
    const authElements = document.querySelectorAll('[data-auth-required]');
    const unauthElements = document.querySelectorAll('[data-unauth-required]');
    console.log('Auth required elements found:', authElements.length);
    console.log('Unauth required elements found:', unauthElements.length);
    
    authElements.forEach((el, index) => {
        console.log(`Auth element ${index}: display = ${el.style.display || 'default'}`);
    });
    
    unauthElements.forEach((el, index) => {
        console.log(`Unauth element ${index}: display = ${el.style.display || 'default'}`);
    });
    
    console.log('========================');
}

// Getters for state
export function isAuthenticatedUser() {
    return isAuthenticated;
}

export function getCurrentUser() {
    return currentUser;
}

export function getAllAccounts() {
    return msalInstance ? msalInstance.getAllAccounts() : [];
}

export function getMsalInstance() {
    return msalInstance;
}

// Setters for state (used by account switcher)
export function setCurrentUser(user) {
    currentUser = user;
}

export function setAuthenticated(authState) {
    isAuthenticated = authState;
}
