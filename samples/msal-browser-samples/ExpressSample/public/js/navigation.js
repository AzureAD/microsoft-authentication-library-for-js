/*
 * Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the source repository root for complete license information.
 */

// Navigation module - handles SPA routing and navigation

import { msalInstance, handleProtectedRouteAuth, signOutRedirect } from './auth.js';
import { updateNavigation, updateUI } from './ui.js';
import { waitForElement, showSuccess } from './utils.js';
import { loadProfileData } from "./graph.js";
import { initializePlayground } from "./playground.js";

// Navigation function - SPA style routing
export function navigate(path) {
    // Update URL without page reload
    history.pushState(null, '', path);

    // Load content via AJAX
    loadPageContentSPA(path);
}

// Handle routing (for initial page load and browser back/forward)
export async function handleRouting() {
    const path = window.location.pathname;

    // Refresh authentication state before checking routes
    updateUI(msalInstance.getActiveAccount());

    // Check if route requires authentication
    if (path === '/profile' && !msalInstance.getActiveAccount()) {
        const authSuccess = await handleProtectedRouteAuth(path);
        if (!authSuccess) {
            return; // Authentication in progress or failed
        }
    }

    // Update navigation active states and UI
    updateNavigation();
    updateUI(msalInstance.getActiveAccount());

    // Handle page-specific logic for all routes
    await handlePageSpecificLogic(path);
}

// Load page content via AJAX for SPA navigation
async function loadPageContentSPA(path) {
    const spaContent = document.getElementById('spa-content');
    const spaLoading = document.getElementById('spa-loading');

    if (!spaContent) {
        // Fallback to full page navigation if SPA container not found
        window.location.href = path;
        return;
    }

    try {
        // Show loading indicator
        if (spaLoading) {
            spaLoading.style.display = 'block';
        }

        // Fetch content from server
        const response = await fetch(getContentAPIPath(path), {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();

        // Update content area
        spaContent.innerHTML = html;

        // Update page title
        updatePageTitle(path);

        // Update navigation
        updateNavigation();

        // IMPORTANT: Update UI after content change to handle auth-required elements
        updateUI(msalInstance.getActiveAccount());

        // Handle specific page logic
        await handlePageSpecificLogic(path);

    } catch (error) {
        console.error('Error loading SPA content:', error);

        // Fallback to full page navigation on error
        window.location.href = path;

    } finally {
        // Hide loading indicator
        if (spaLoading) {
            spaLoading.style.display = 'none';
        }
    }
}

// Get API path for content loading
function getContentAPIPath(path) {
    const pathMap = {
        '/': '/api/content/home',
        '/profile': '/api/content/profile',
        '/logout': '/api/content/logout',
        '/playground': '/api/content/playground'
    };

    return pathMap[path] || path;
}

// Update page title based on route
function updatePageTitle(path) {
    const titleMap = {
        '/': 'MSAL Express Sample - Home',
        '/profile': 'MSAL Express Sample - Profile',
        '/logout': 'MSAL Express Sample - Logout',
        '/playground': 'MSAL Express Sample - Playground'
    };

    const newTitle = titleMap[path] || 'MSAL Express Sample';
    document.title = newTitle;
}

// Handle page-specific logic after content load
async function handlePageSpecificLogic(path) {
    if (path === '/profile' && msalInstance.getActiveAccount()) {
        // Wait for profile container to be available before loading data
        try {
            await waitForElement('#profile-content, .profile-container, .spa-content');
            await loadProfileData();
        } catch (error) {
            console.error('Error loading profile data:', error);
        }
    } else if (path === '/playground') {
        // Initialize playground page
        try {
            await waitForElement('.playground-container');
            initializePlayground();
        } catch (error) {
            console.error('Error initializing playground:', error);
        }
    } else if (path === '/logout') {
        try {
            // Show immediate feedback to user
            showSuccess('Signing you out...');

            // Proceed with logout immediately
            if (msalInstance.getActiveAccount()) {
                signOutRedirect();
            } else {
                // If not authenticated, redirect to home
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Error during logout:', error);
            // Fallback to home page
            window.location.href = '/';
        }
    }
}

// Setup SPA navigation event listeners
export function setupSPANavigation() {
    // Handle all SPA links
    document.addEventListener('click', async function (e) {
        const target = e.target.closest('.spa-link');
        if (target && target.classList.contains('spa-link')) {
            e.preventDefault();

            const path = target.getAttribute('href');
            if (path) {
                // Refresh authentication state before navigation
                updateUI(msalInstance.getActiveAccount());

                // Check authentication for protected routes
                if (path === '/profile' && !msalInstance.getActiveAccount()) {
                    const authSuccess = await handleProtectedRouteAuth(path);
                    if (!authSuccess) {
                        return;
                    }
                }

                navigate(path);
            }
        }
    });

    // Handle browser back/forward navigation
    window.addEventListener('popstate', function (e) {
        const path = window.location.pathname;
        loadPageContentSPA(path);
    });
}
