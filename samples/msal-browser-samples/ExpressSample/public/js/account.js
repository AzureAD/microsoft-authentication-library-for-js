/*
 * Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the source repository root for complete license information.
 */

// Account module - handles account management and picker functionality

import { getMsalInstance, getCurrentUser } from './auth.js';
import { showError } from './utils.js';

// Account picker modal functionality
export function showAccountPickerModal() {
    const modal = document.getElementById('accountPickerModal');
    
    if (modal) {
        try {
            populateAccountList();
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        } catch (error) {
            console.error('Error showing account picker modal:', error);
            // Reset overflow if there was an error
            document.body.style.overflow = '';
            showError('Failed to show account picker: ' + error.message);
        }
    } else {
        console.error('Account picker modal element not found');
        showError('Account picker modal not available');
    }
}

export function closeAccountPickerModal() {
    const modal = document.getElementById('accountPickerModal');
    if (modal) {
        modal.style.display = 'none';
    }
    // Always reset body overflow, regardless of modal state
    document.body.style.overflow = '';
}

function populateAccountList() {
    const accountList = document.getElementById('accountList');
    const msalInstance = getMsalInstance();
    
    if (!accountList || !msalInstance) {
        console.error('Missing required elements for account list');
        return;
    }
    
    const accounts = msalInstance.getAllAccounts();
    const activeAccount = msalInstance.getActiveAccount();
    
    accountList.innerHTML = '';
    
    // Add existing accounts
    accounts.forEach((account, index) => {
        const accountItem = createAccountItem(account, account === activeAccount);
        accountList.appendChild(accountItem);
    });
    
    // Add "Add account" option
    const addAccountItem = createAddAccountItem();
    accountList.appendChild(addAccountItem);
}

function createAccountItem(account, isActive) {
    const item = document.createElement('div');
    item.className = 'account-item';
    item.addEventListener('click', () => selectAccount(account));
    
    const avatar = document.createElement('div');
    avatar.className = 'account-avatar';
    avatar.textContent = getAccountInitials(account.name || account.username);
    
    const info = document.createElement('div');
    info.className = 'account-info';
    
    const name = document.createElement('div');
    name.className = 'account-name';
    name.textContent = account.name || account.username;
    
    const username = document.createElement('div');
    username.className = 'account-username';
    username.textContent = account.username;
    
    info.appendChild(name);
    info.appendChild(username);
    
    item.appendChild(avatar);
    item.appendChild(info);
    
    if (isActive) {
        const indicator = document.createElement('div');
        indicator.className = 'account-active-indicator';
        indicator.textContent = 'Active';
        item.appendChild(indicator);
    }
    
    return item;
}

function createAddAccountItem() {
    const item = document.createElement('div');
    item.className = 'account-item add-account';
    item.addEventListener('click', () => addAccount());
    
    const avatar = document.createElement('div');
    avatar.className = 'account-avatar add-icon';
    avatar.textContent = '+';
    
    const info = document.createElement('div');
    info.className = 'account-info';
    
    const name = document.createElement('div');
    name.className = 'account-name';
    name.textContent = 'Add account';
    
    info.appendChild(name);
    
    item.appendChild(avatar);
    item.appendChild(info);
    
    return item;
}

function getAccountInitials(name) {
    if (!name) return '?';
    
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    } else {
        return name.substring(0, 2).toUpperCase();
    }
}

function selectAccount(account) {
    try {
        const msalInstance = getMsalInstance();
        
        if (!msalInstance) {
            console.error('MSAL instance not available');
            showError('MSAL instance not available');
            return;
        }
        
        // Set the active account
        msalInstance.setActiveAccount(account);
        
        // Close the modal
        closeAccountPickerModal();
        
        // Simply reload the page to ensure everything reflects the account change
        // This is the most reliable way to ensure all state is properly updated
        window.location.reload();
    } catch (error) {
        console.error('Error selecting account:', error);
        showError('Failed to switch account: ' + error.message);
    }
}

function addAccount() {
    closeAccountPickerModal();
    // Import dynamically to avoid circular dependency
    import('./auth.js').then(auth => {
        auth.signInRedirectWithPrompt();
    });
}

// Emergency function to fix scrolling if modal breaks
export function resetBodyScroll() {
    document.body.style.overflow = '';
    console.log('Body scroll reset');
}

// Also expose it globally for debugging
if (typeof window !== 'undefined') {
    window.resetBodyScroll = resetBodyScroll;
}
