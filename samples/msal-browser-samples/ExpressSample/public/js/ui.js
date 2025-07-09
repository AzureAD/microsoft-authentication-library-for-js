/*
 * Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the source repository root for complete license information.
 */

// UI module - handles UI updates, dropdowns, and event listeners

// Update UI based on authentication state
export function updateUI(currentUser) {    
    const authElements = document.querySelectorAll('[data-auth-required]');
    const unauthElements = document.querySelectorAll('[data-unauth-required]');
    const userNameElements = document.querySelectorAll('[data-user-name]');
    
    authElements.forEach((el, index) => {
        const newDisplay = !!currentUser ? '' : 'none';
        el.style.display = newDisplay;
    });
    
    unauthElements.forEach((el, index) => {
        const newDisplay = !!currentUser ? 'none' : '';
        el.style.display = newDisplay;
    });
    
    userNameElements.forEach(el => {
        if (currentUser) {
            el.textContent = currentUser.name || currentUser.username;
        }
    });
    
    // Update navigation
    updateNavigation();
}

// Update navigation links
export function updateNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPath = window.location.pathname;
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Dropdown functionality
export function toggleDropdown(dropdownElement) {
    if (dropdownElement) {
        dropdownElement.classList.toggle('active');
    }
}

export function closeDropdown(dropdownElement) {
    if (dropdownElement) {
        dropdownElement.classList.remove('active');
    }
}

export function closeAllDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
        dropdown.classList.remove('active');
    });
}
