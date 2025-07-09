/*
 * Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the source repository root for complete license information.
 */

// MS Graph API call functionality
async function callMsGraph(accessToken) {
    if (!accessToken) {
        accessToken = await window.msalApp.getAccessTokenSilent();
    }

    const headers = new Headers();
    const bearer = `Bearer ${accessToken}`;

    headers.append("Authorization", bearer);

    const options = {
        method: "GET",
        headers: headers
    };

    try {
        const response = await fetch(window.graphConfig.graphMeEndpoint, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error calling MS Graph:', error);
        throw error;
    }
}

// Load and display profile data
async function loadProfileData() {
    const loadingElement = document.getElementById('profile-loading');
    const contentElement = document.getElementById('profile-content');
    const errorElement = document.getElementById('profile-error');

    try {
        if (loadingElement) loadingElement.style.display = 'block';
        if (contentElement) contentElement.style.display = 'none';
        if (errorElement) errorElement.style.display = 'none';

        const profileData = await callMsGraph();
        displayProfileData(profileData);

        if (loadingElement) loadingElement.style.display = 'none';
        if (contentElement) contentElement.style.display = 'block';
    } catch (error) {
        console.error('Failed to load profile data:', error);
        
        if (loadingElement) loadingElement.style.display = 'none';
        if (errorElement) {
            errorElement.textContent = 'Failed to load profile data: ' + error.message;
            errorElement.style.display = 'block';
        }
    }
}

// Display profile data in the UI
function displayProfileData(profileData) {
    const elements = {
        'profile-display-name': profileData.displayName,
        'profile-email': profileData.mail || profileData.userPrincipalName,
        'profile-username': profileData.userPrincipalName,
        'profile-id': profileData.id,
        'profile-given-name': profileData.givenName,
        'profile-surname': profileData.surname,
        'profile-job-title': profileData.jobTitle,
        'profile-department': profileData.department,
        'profile-office-location': profileData.officeLocation,
        'profile-mobile-phone': profileData.mobilePhone,
        'profile-business-phones': profileData.businessPhones ? profileData.businessPhones.join(', ') : ''
    };

    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element && elements[id]) {
            element.textContent = elements[id];
        }
    });

    // Display the full JSON data
    const jsonElement = document.getElementById('profile-json');
    if (jsonElement) {
        jsonElement.textContent = JSON.stringify(profileData, null, 2);
    }
}

// Initialize profile page if we're on the profile route
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname === '/profile') {
        // Wait a bit for MSAL to initialize
        setTimeout(() => {
            if (window.msalApp && window.msalApp.isAuthenticated()) {
                loadProfileData();
            }
        }, 500);
    }
});

// Export for global access
window.graphUtils = {
    callMsGraph,
    loadProfileData,
    displayProfileData
};
