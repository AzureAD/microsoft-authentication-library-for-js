/*
 * Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the source repository root for complete license information.
 */

// MS Graph API call functionality
import { getAccessToken } from './auth.js';
import { graphConfig } from "./authConfig.js";

// MS Graph API call functionality
export async function callMsGraph() {
    const authResponse = await getAccessToken();

    const headers = new Headers();
    const bearer = `Bearer ${authResponse.accessToken}`;

    headers.append("Authorization", bearer);

    const options = {
        method: "GET",
        headers: headers
    };

    try {
        const response = await fetch(graphConfig.graphMeEndpoint, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const profileData = await response.json();
        return { profileData, authResponse };
    } catch (error) {
        console.error('Error calling MS Graph:', error);
        throw error;
    }
}

// Load and display profile data
export async function loadProfileData() {
    const loadingElement = document.getElementById('profile-loading');
    const contentElement = document.getElementById('profile-content');
    const errorElement = document.getElementById('profile-error');

    try {
        if (loadingElement) loadingElement.style.display = 'block';
        if (contentElement) contentElement.style.display = 'none';
        if (errorElement) errorElement.style.display = 'none';

        const { profileData, authResponse } = await callMsGraph();
        displayProfileData(profileData);
        displayAuthData(authResponse);

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
export function displayProfileData(profileData) {
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

// Display authentication data in the UI
export function displayAuthData(authResponse) {
    const authJsonElement = document.getElementById('auth-json');
    if (authJsonElement && authResponse) {
        // Create a sanitized version of the auth response for display
        const displayData = {
            accessToken: authResponse.accessToken ? '[REDACTED - Present]' : 'Not available',
            tokenType: authResponse.tokenType,
            expiresOn: authResponse.expiresOn,
            account: authResponse.account,
            scopes: authResponse.scopes,
            correlationId: authResponse.correlationId,
            fromCache: authResponse.fromCache,
            idToken: authResponse.idToken,
            idTokenClaims: authResponse.idTokenClaims,
            uniqueId: authResponse.uniqueId,
            tenantId: authResponse.tenantId
        };

        authJsonElement.textContent = JSON.stringify(displayData, null, 2);
        authJsonElement.style.display = '';
    }
}
