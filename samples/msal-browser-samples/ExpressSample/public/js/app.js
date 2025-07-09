/*
 * Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the source repository root for complete license information.
 */

// Main application entry point using ES6 modules
import { showError, showErrorHTML, showSuccess } from './utils.js';
import { 
    initializeMsal, 
    handleRedirectPromise, 
    setUpdateUIFunction,
    signInPopup,
    signInRedirect,
    signInRedirectWithPrompt,
    signOut,
    signOutPopup,
    signOutRedirect,
    getAccessTokenSilent,
    isAuthenticatedUser,
    getCurrentUser,
    getAllAccounts,
    getMsalInstance,
    handleProtectedRouteAuth,
    debugAuthState,
    refreshAuthState
} from './auth.js';
import { updateUI, updateNavigation, toggleDropdown, closeDropdown, closeAllDropdowns } from './ui.js';
import { showAccountPickerModal, closeAccountPickerModal } from './account.js';
import { navigate, handleRouting, setupSPANavigation } from './navigation.js';

// Setup event listeners
function setupEventListeners() {
    // Sign in dropdown
    const signInButton = document.getElementById('signInButton');
    const signInDropdown = document.getElementById('signInDropdown');
    const signInPopupBtn = document.getElementById('signInPopup');
    const signInRedirectBtn = document.getElementById('signInRedirect');
    
    // Account dropdown (for authenticated users)
    const accountButton = document.getElementById('accountButton');
    const accountDropdown = document.getElementById('accountDropdown');
    const switchAccountBtn = document.getElementById('switchAccount');
    const signOutPopupBtn = document.getElementById('signOutPopup');
    const signOutRedirectBtn = document.getElementById('signOutRedirect');
    
    // Account picker modal
    const accountPickerModal = document.getElementById('accountPickerModal');
    const modalClose = document.querySelector('.modal-close');
    
    // Toggle sign-in dropdown
    if (signInButton && signInDropdown) {
        signInButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleDropdown(signInButton.parentElement);
        });
    }
    
    // Toggle account dropdown
    if (accountButton && accountDropdown) {
        accountButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleDropdown(accountButton.parentElement);
        });
    }
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        const dropdowns = document.querySelectorAll('.dropdown');
        dropdowns.forEach(dropdown => {
            const button = dropdown.querySelector('.dropdown-toggle');
            const menu = dropdown.querySelector('.dropdown-menu');
            if (button && menu && !button.contains(e.target) && !menu.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
    });
    
    // Handle keyboard navigation for dropdowns
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllDropdowns();
            closeAccountPickerModal();
        }
    });
    
    // Sign in event handlers
    if (signInPopupBtn) {
        signInPopupBtn.addEventListener('click', function(e) {
            e.preventDefault();
            closeAllDropdowns();
            signInPopup();
        });
    }
    
    if (signInRedirectBtn) {
        signInRedirectBtn.addEventListener('click', function(e) {
            e.preventDefault();
            closeAllDropdowns();
            signInRedirect();
        });
    }
    
    // Account management event handlers
    if (switchAccountBtn) {
        switchAccountBtn.addEventListener('click', function(e) {
            e.preventDefault();
            closeAllDropdowns();
            showAccountPickerModal();
        });
    }
    
    if (signOutPopupBtn) {
        signOutPopupBtn.addEventListener('click', function(e) {
            e.preventDefault();
            closeAllDropdowns();
            signOutPopup();
        });
    }
    
    if (signOutRedirectBtn) {
        signOutRedirectBtn.addEventListener('click', function(e) {
            e.preventDefault();
            closeAllDropdowns();
            signOutRedirect();
        });
    }
    
    // Modal event handlers
    if (modalClose) {
        modalClose.addEventListener('click', closeAccountPickerModal);
    }
    
    if (accountPickerModal) {
        accountPickerModal.addEventListener('click', function(e) {
            if (e.target === accountPickerModal) {
                closeAccountPickerModal();
            }
        });
    }
    
    // Setup SPA Navigation
    setupSPANavigation();
}

// DOM ready function
document.addEventListener('DOMContentLoaded', async function() {
    // Set the updateUI function in the auth module
    setUpdateUIFunction(updateUI);
    
    // Initialize MSAL first
    await initializeMsal();
    
    // Handle any redirect promises
    await handleRedirectPromise();
    
    // Refresh authentication state (this will also call updateUI)
    refreshAuthState();
    
    // Setup all event listeners
    setupEventListeners();
    
    // Handle initial route
    await handleRouting();
    
    // Debug authentication state (can be removed in production)
    debugAuthState();
});

// Handle browser back/forward
window.addEventListener('popstate', function() {
    handleRouting();
});

// Handle page visibility changes (user switching tabs/windows)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // Page became visible, refresh auth state
        setTimeout(() => {
            refreshAuthState();
        }, 100);
    }
});

// Export main app functions for global access (backward compatibility)
// This maintains compatibility with existing code that expects these on window
window.msalApp = {
    // Authentication methods
    signInPopup,
    signInRedirect,
    signInRedirectWithPrompt,
    signOut,
    signOutPopup,
    signOutRedirect,
    getAccessTokenSilent,
    
    // Navigation methods
    navigate,
    
    // Account methods
    showAccountPickerModal,
    closeAccountPickerModal,
    
    // State methods
    isAuthenticated: isAuthenticatedUser,
    getCurrentUser,
    getAllAccounts
};

// Export utility functions globally (backward compatibility)
window.showError = showError;
window.showErrorHTML = showErrorHTML;
window.showSuccess = showSuccess;

// Export debug function globally for troubleshooting
window.debugAuthState = debugAuthState;
