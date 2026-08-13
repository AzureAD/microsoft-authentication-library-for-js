/*
 * Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the source repository root for complete license information.
 */

// Main application entry point
import {
    initializeMsal,
    signInPopup,
    signInRedirect,
    signOutPopup,
    signOutRedirect,
    handleRetry,
    handleCancelRetry,
    ssoSilent,
    acquireTokenSilent,
    msalInstance
} from './auth.js';
import { toggleDropdown, closeAllDropdowns, updateUI } from './ui.js';
import { showAccountPickerModal, closeAccountPickerModal } from './account.js';
import { handleRouting, setupSPANavigation } from './navigation.js';
import { loadProfileData } from "./graph.js";
import { validateEnvironmentVariables } from './utils.js';

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

        signInButton.style.display = '';
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

    // Silent API buttons (authenticated home view)
    const ssoSilentBtn = document.getElementById('ssoSilentButton');
    if (ssoSilentBtn) {
        ssoSilentBtn.addEventListener('click', function(e) {
            e.preventDefault();
            ssoSilent();
        });
    }

    const acquireTokenSilentBtn = document.getElementById('acquireTokenSilentButton');
    if (acquireTokenSilentBtn) {
        acquireTokenSilentBtn.addEventListener('click', function(e) {
            e.preventDefault();
            acquireTokenSilent();
        });
    }

    // Profile page sign in buttons (may not exist on all pages)
    const profileSignInPopupBtn = document.getElementById('profileSignInPopup');    const profileSignInRedirectBtn = document.getElementById('profileSignInRedirect');

    if (profileSignInPopupBtn) {
        profileSignInPopupBtn.addEventListener('click', function(e) {
            e.preventDefault();
            signInPopup();
        });
    }

    if (profileSignInRedirectBtn) {
        profileSignInRedirectBtn.addEventListener('click', function(e) {
            e.preventDefault();
            signInRedirect();
        });
    }

    // Profile page refresh button (may not exist on all pages)
    const refreshProfileBtn = document.getElementById('refreshProfileBtn');
    if (refreshProfileBtn) {
        refreshProfileBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            try {
                loadProfileData();
            } catch (error) {
                console.error('Error refreshing profile data:', error);
            }
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

    // Retry modal event handlers
    const retryBtn = document.getElementById('retryButton');
    const cancelRetryBtn = document.getElementById('cancelRetryButton');
    const retryModal = document.getElementById('retry-modal');
    const retryModalClose = document.querySelector('#retry-modal .modal-close');

    if (retryBtn) {
        retryBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleRetry();
        });
    }

    if (cancelRetryBtn) {
        cancelRetryBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleCancelRetry();
        });
    }

    if (retryModalClose) {
        retryModalClose.addEventListener('click', handleCancelRetry);
    }

    if (retryModal) {
        retryModal.addEventListener('click', function(e) {
            if (e.target === retryModal) {
                handleCancelRetry();
            }
        });
    }

    // Setup SPA Navigation
    setupSPANavigation();
}

// DOM ready function
document.addEventListener('DOMContentLoaded', async function() {
    // Validate environment variables first and show warning if needed
    const envValid = validateEnvironmentVariables();

    // Only proceed with MSAL initialization if environment is properly configured
    if (!envValid) {
        console.warn('MSAL initialization skipped due to missing environment variables');
        // Still setup basic event listeners for UI interactions
        setupEventListeners();
        return;
    }

    // Initialize MSAL
    await initializeMsal();

    // Refresh authentication state (this will also call updateUI)
    updateUI(msalInstance.getActiveAccount());

    // Setup all event listeners
    setupEventListeners();

    // Handle initial route
    await handleRouting();
});

// Handle browser back/forward
window.addEventListener('popstate', function() {
    handleRouting();
});

// Handle page visibility changes (user switching tabs/windows)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // Page became visible, refresh auth state
        updateUI(msalInstance.getActiveAccount());
    }
});
