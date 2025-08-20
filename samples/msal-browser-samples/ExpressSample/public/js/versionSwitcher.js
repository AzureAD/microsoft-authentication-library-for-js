/*
 * Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the source repository root for complete license information.
 */

// Version Switcher functionality
let versionSwitcher = {
    availableVersions: {},
    currentVersion: '',
    isReloading: false
};

// Initialize version switcher
document.addEventListener('DOMContentLoaded', function () {
    initVersionSwitcher();
});

async function initVersionSwitcher() {
    try {
        // Fetch available versions from server
        const response = await fetch('/api/version');
        const versionInfo = await response.json();

        versionSwitcher.availableVersions = versionInfo.available;
        versionSwitcher.currentVersion = versionInfo.current;

        // Setup UI
        setupVersionSwitcherUI();
        populateVersionDropdown();

    } catch (error) {
        console.error('Failed to initialize version switcher:', error);
    }
}

function setupVersionSwitcherUI() {
    const versionButton = document.getElementById('versionButton');
    const versionDropdown = document.getElementById('versionDropdown');

    if (versionButton && versionDropdown) {
        // Toggle dropdown
        versionButton.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            toggleVersionDropdown();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function (e) {
            if (!versionButton.contains(e.target) && !versionDropdown.contains(e.target)) {
                closeVersionDropdown();
            }
        });

        // Handle keyboard navigation
        versionButton.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleVersionDropdown();
            } else if (e.key === 'Escape') {
                closeVersionDropdown();
            }
        });
    }
}

function populateVersionDropdown() {
    const versionDropdown = document.getElementById('versionDropdown');
    if (!versionDropdown) return;

    versionDropdown.innerHTML = '';

    // Add version options
    Object.keys(versionSwitcher.availableVersions).forEach(versionKey => {
        const version = versionSwitcher.availableVersions[versionKey];
        const item = createVersionItem(versionKey, version);
        versionDropdown.appendChild(item);
    });

    // Add separator and actions
    const separator = document.createElement('div');
    separator.className = 'dropdown-separator';
    versionDropdown.appendChild(separator);

    // Add custom version action
    const customVersionItem = createActionItem('🎯 Custom Version...', 'Specify a custom MSAL version', () => {
        showCustomVersionModal();
    });
    versionDropdown.appendChild(customVersionItem);

    // Add reload action
    const reloadItem = createActionItem('🔄 Reload Page', 'Reload page with current version', () => {
        window.location.reload();
    });
    versionDropdown.appendChild(reloadItem);

    // Add refresh versions action
    const refreshItem = createActionItem('🔄 Refresh Versions', 'Update version information from NPM', async () => {
        await refreshVersionInfo();
    });
    versionDropdown.appendChild(refreshItem);
}

function createVersionItem(versionKey, version) {
    const item = document.createElement('div');
    item.className = 'dropdown-item version-item';
    item.id = versionKey;

    const isActive = versionKey === versionSwitcher.currentVersion;
    if (isActive) {
        item.classList.add('active');
    }

    item.innerHTML = `
        <div class="version-item-content">
            <div class="version-name">${version.name}</div>
            <div class="version-description">${version.description}</div>
            ${isActive ? '<div class="version-active-badge">Current</div>' : ''}
        </div>
    `;

    if (!isActive) {
        item.addEventListener('click', () => switchVersion(versionKey));
    }

    return item;
}

function createActionItem(text, title, action) {
    const item = document.createElement('div');
    item.className = 'dropdown-item action-item';
    item.textContent = text;
    item.title = title;
    item.addEventListener('click', action);
    return item;
}

function toggleVersionDropdown() {
    const versionSwitcher = document.querySelector('.version-switcher');
    if (versionSwitcher) {
        versionSwitcher.classList.toggle('active');
    }
}

function closeVersionDropdown() {
    const versionSwitcher = document.querySelector('.version-switcher');
    if (versionSwitcher) {
        versionSwitcher.classList.remove('active');
    }
}

// Function to refresh version information from the server
async function refreshVersionInfo() {
    try {
        closeVersionDropdown();

        if (window.showSuccess) {
            window.showSuccess('Refreshing version information...');
        }

        // Call the refresh endpoint
        const response = await fetch('/api/version/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            // Update local version information
            versionSwitcher.availableVersions = result.version.available;
            versionSwitcher.currentVersion = result.version.current;

            // Refresh the dropdown
            populateVersionDropdown();

            // Update the current version display
            const versionText = document.getElementById('currentVersionText');
            if (versionText && result.version.info) {
                versionText.textContent = result.version.info.name;
            }

            if (window.showSuccess) {
                window.showSuccess('✅ Version information refreshed successfully!');
            }
        } else {
            throw new Error(result.message || 'Failed to refresh version information');
        }

    } catch (error) {
        console.error('Failed to refresh version info:', error);
        if (window.showError) {
            window.showError(`❌ Failed to refresh version info: ${error.message}`);
        }
    }
}

// Custom Version Modal Functions
function showCustomVersionModal() {
    closeVersionDropdown();
    const modal = document.getElementById('customVersionModal');
    const input = document.getElementById('customVersionInput');
    const errorDiv = document.getElementById('customVersionError');

    if (modal && input) {
        // Reset form
        input.value = '';
        errorDiv.style.display = 'none';

        // Show modal
        modal.style.display = 'flex';

        // Focus input after modal is displayed
        requestAnimationFrame(() => {
            input.focus();
        });

        // Setup event handlers if not already setup
        setupCustomVersionModal();
    }
}

function setupCustomVersionModal() {
    // Prevent duplicate event listeners
    if (window.customVersionModalSetup) return;
    window.customVersionModalSetup = true;

    const modal = document.getElementById('customVersionModal');
    const input = document.getElementById('customVersionInput');
    const submitBtn = document.getElementById('customVersionSubmit');
    const cancelBtn = document.getElementById('customVersionCancel');
    const errorDiv = document.getElementById('customVersionError');

    // Close modal handlers
    const closeModal = () => {
        modal.style.display = 'none';
        input.value = '';
        errorDiv.style.display = 'none';
    };

    // Close button
    modal.querySelector('.modal-close').addEventListener('click', closeModal);

    // Cancel button
    cancelBtn.addEventListener('click', closeModal);

    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeModal();
        }
    });

    // Input validation
    const validateInput = () => {
        const version = input.value.trim();
        const versionRegex = /^(\d+)\.(\d+)\.(\d+)(-[a-zA-Z0-9.-]+)?$/;

        if (!version) {
            showCustomVersionError('Please enter a version number');
            return false;
        }

        if (!versionRegex.test(version)) {
            showCustomVersionError('Invalid version format. Use semantic versioning (e.g., 4.0.0, 3.5.1-beta)');
            return false;
        }

        hideCustomVersionError();
        return true;
    };

    // Submit handler
    const handleSubmit = async () => {
        if (!validateInput()) return;

        const customVersion = input.value.trim();

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Switching...';

            await switchVersion('custom', customVersion);
            closeModal();

        } catch (error) {
            // Parse enhanced error information
            let errorInfo;
            try {
                errorInfo = JSON.parse(error.message);
            } catch {
                errorInfo = { message: error.message };
            }

            let errorMessage = errorInfo.message;
            if (errorInfo.suggestion) {
                errorMessage += `\n${errorInfo.suggestion}`;
            }

            showCustomVersionError(errorMessage);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Switch to Version';
        }
    };

    // Submit button
    submitBtn.addEventListener('click', handleSubmit);

    // Enter key to submit
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        }
    });

    // Real-time validation
    input.addEventListener('input', () => {
        if (input.value.trim()) {
            validateInput();
        } else {
            hideCustomVersionError();
        }
    });
}

function showCustomVersionError(message) {
    const errorDiv = document.getElementById('customVersionError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

function hideCustomVersionError() {
    const errorDiv = document.getElementById('customVersionError');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

// Update the switchVersion function to handle custom versions
async function switchVersion(newVersion, customVersion = null) {
    if (versionSwitcher.isReloading) return;

    try {
        versionSwitcher.isReloading = true;
        closeVersionDropdown();

        // Show loading state
        showVersionSwitchLoading(newVersion, customVersion);

        // Prepare request body
        const requestBody = { version: newVersion };
        if (customVersion) {
            requestBody.customVersion = customVersion;
        }

        // Call API to switch version
        const response = await fetch('/api/version/switch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();

        if (!response.ok) {
            // Enhanced error handling with detailed error info
            const errorInfo = {
                message: result.message || result.error || `HTTP ${response.status}`,
                suggestion: result.suggestion || '',
                npmLink: result.npmLink || '',
                previousVersion: result.previousVersion || versionSwitcher.currentVersion
            };

            throw new Error(JSON.stringify(errorInfo));
        }

        if (result.success) {
            // Show success message
            showVersionSwitchSuccess(result);
            window.location.reload();
        } else {
            throw new Error(JSON.stringify({
                message: result.error || 'Failed to switch version',
                previousVersion: versionSwitcher.currentVersion
            }));
        }

    } catch (error) {
        console.error('Failed to switch version:', error);

        // Parse enhanced error information
        let errorInfo;
        try {
            errorInfo = JSON.parse(error.message);
        } catch {
            errorInfo = { message: error.message };
        }

        // Show enhanced error message and revert
        showVersionSwitchError(errorInfo);
        versionSwitcher.isReloading = false;
        throw error; // Re-throw for modal error handling
    }
}

function showVersionSwitchLoading(newVersion, customVersion) {
    const versionText = document.getElementById('currentVersionText');
    if (versionText) {
        versionText.textContent = 'Switching...';
    }

    const displayVersion = customVersion || (versionSwitcher.availableVersions[newVersion]?.name || newVersion);

    if (window.showSuccess) {
        window.showSuccess(`Switching to ${displayVersion}...`);
    }
}

function showVersionSwitchSuccess(result) {
    if (window.showSuccess) {
        window.showSuccess(`✅ Switched to ${result.current.name}! Reloading page...`);
    }
}

function showVersionSwitchError(errorInfo) {
    // Parse error info if it's a string
    const error = typeof errorInfo === 'string' ? { message: errorInfo } : errorInfo;

    // Build error message with HTML formatting
    let errorHTML = `❌ ${error.message}`;

    // Add suggestion if provided
    if (error.suggestion) {
        errorHTML += `<br><br>💡 ${error.suggestion}`;
    }

    // Add NPM link as clickable link if provided
    if (error.npmLink) {
        errorHTML += `<br><br>🔗 Check available versions: <a href="${error.npmLink}" target="_blank" rel="noopener noreferrer" style="color: #0066cc; text-decoration: underline;">NPM Package Versions</a>`;
    }

    if (window.showErrorHTML) {
        window.showErrorHTML(errorHTML);
    } else if (window.showError) {
        // Fallback to plain text if showErrorHTML is not available
        let errorMessage = `❌ ${error.message}`;
        if (error.suggestion) {
            errorMessage += `\n\n💡 ${error.suggestion}`;
        }
        if (error.npmLink) {
            errorMessage += `\n\n🔗 Check available versions: ${error.npmLink}`;
        }
        window.showError(errorMessage);
    }

    // Revert UI to previous version
    const versionText = document.getElementById('currentVersionText');
    if (versionText && versionSwitcher.availableVersions[versionSwitcher.currentVersion]) {
        versionText.textContent = versionSwitcher.availableVersions[versionSwitcher.currentVersion].name;
    }

    console.log('Version switch failed, staying on current version:', versionSwitcher.currentVersion);
}

// Export for global access
window.versionSwitcher = {
    switch: switchVersion,
    refresh: initVersionSwitcher,
    refreshVersions: refreshVersionInfo,
    customVersion: showCustomVersionModal,
    getCurrent: () => versionSwitcher.currentVersion,
    getAvailable: () => versionSwitcher.availableVersions
};
