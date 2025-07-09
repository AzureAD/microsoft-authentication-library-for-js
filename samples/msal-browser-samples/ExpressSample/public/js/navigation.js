/*
 * Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the source repository root for complete license information.
 */

// Navigation module - handles SPA routing and navigation

import { isAuthenticatedUser, handleProtectedRouteAuth } from './auth.js';
import { updateNavigation } from './ui.js';

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
    const { refreshAuthState } = await import('./auth.js');
    refreshAuthState();
    
    // Check if route requires authentication
    if (path === '/profile' && !isAuthenticatedUser()) {
        const authSuccess = await handleProtectedRouteAuth(path);
        if (!authSuccess) {
            return; // Authentication in progress or failed
        }
    }
    
    // Update navigation active states and UI
    updateNavigation();
    
    // Update UI to ensure auth state is reflected
    const { updateUI } = await import('./ui.js');
    updateUI();
    
    // If on profile page and authenticated, load profile data
    if (path === '/profile' && isAuthenticatedUser()) {
        setTimeout(() => {
            if (window.graphUtils && window.graphUtils.loadProfileData) {
                window.graphUtils.loadProfileData();
            }
        }, 100);
    }
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
        // Import dynamically to avoid circular dependency
        const { updateUI } = await import('./ui.js');
        updateUI();
        
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
        '/logout': '/api/content/logout'
    };
    
    return pathMap[path] || path;
}

// Update page title based on route
function updatePageTitle(path) {
    const titleMap = {
        '/': 'MSAL Express Sample - Home',
        '/profile': 'MSAL Express Sample - Profile',
        '/logout': 'MSAL Express Sample - Logout'
    };
    
    const newTitle = titleMap[path] || 'MSAL Express Sample';
    document.title = newTitle;
}

// Handle page-specific logic after content load
async function handlePageSpecificLogic(path) {
    if (path === '/profile' && isAuthenticatedUser()) {
        setTimeout(() => {
            if (window.graphUtils && window.graphUtils.loadProfileData) {
                window.graphUtils.loadProfileData();
            }
        }, 100);
    } else if (path === '/logout') {
        setTimeout(() => {
            // Import dynamically to avoid circular dependency
            import('./auth.js').then(auth => {
                if (auth.isAuthenticatedUser()) {
                    auth.signOutRedirect();
                }
            });
        }, 1000);
    }
}

// Setup SPA navigation event listeners
export function setupSPANavigation() {
    // Handle all SPA links
    document.addEventListener('click', async function(e) {
        const target = e.target.closest('.spa-link');
        if (target && target.classList.contains('spa-link')) {
            e.preventDefault();
            
            const path = target.getAttribute('href');
            if (path) {
                // Refresh authentication state before navigation
                const { refreshAuthState } = await import('./auth.js');
                refreshAuthState();
                
                // Check authentication for protected routes
                if (path === '/profile' && !isAuthenticatedUser()) {
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
    window.addEventListener('popstate', function(e) {
        const path = window.location.pathname;
        loadPageContentSPA(path);
    });
}
