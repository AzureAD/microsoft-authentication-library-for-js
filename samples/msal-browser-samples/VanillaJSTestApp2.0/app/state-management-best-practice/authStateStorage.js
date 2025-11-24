/**
 * @file authStateStorage.js
 * @description Utility module for securely managing authentication state with URL preservation
 * 
 * This module demonstrates the RECOMMENDED pattern for using the OAuth state parameter
 * when you need to preserve the user's location during authentication flows.
 * 
 * ANTI-PATTERN (Do NOT do this):
 *   msalInstance.loginRedirect({
 *       scopes: ["user.read"],
 *       state: window.location.pathname  // ❌ Security risk!
 *   });
 * 
 * RECOMMENDED PATTERN (Use this instead):
 *   const stateKey = AuthStateStorage.saveReturnUrl(window.location.pathname);
 *   msalInstance.loginRedirect({
 *       scopes: ["user.read"],
 *       state: stateKey  // ✅ Secure reference key
 *   });
 */

class AuthStateStorage {
    /**
     * Prefix for all state keys in storage
     * @private
     */
    static STATE_KEY_PREFIX = 'msal.state.';

    /**
     * State expiration time in milliseconds (default: 10 minutes)
     * After this time, stored state is considered invalid
     * @private
     */
    static STATE_EXPIRATION_MS = 10 * 60 * 1000;

    /**
     * Generates a unique, unpredictable reference key for storing state
     * @returns {string} A unique state key
     * @private
     */
    static generateStateKey() {
        const timestamp = Date.now();
        const randomPart = Math.random().toString(36).substring(2, 15) + 
                          Math.random().toString(36).substring(2, 15);
        return `${this.STATE_KEY_PREFIX}${timestamp}.${randomPart}`;
    }

    /**
     * Validates that a return URL is safe to navigate to
     * Only allows relative URLs to prevent open redirect vulnerabilities
     * 
     * @param {string} url - The URL to validate
     * @returns {boolean} True if the URL is safe
     * @private
     */
    static isValidReturnUrl(url) {
        if (typeof url !== 'string' || url.length === 0) {
            return false;
        }

        try {
            // Only allow relative URLs (same origin)
            // URLs starting with / but not // are relative
            if (url.startsWith('/') && !url.startsWith('//')) {
                return true;
            }

            // Optionally allow specific absolute URLs from same origin
            const urlObj = new URL(url, window.location.origin);
            return urlObj.origin === window.location.origin;
        } catch (e) {
            console.error('Invalid URL format:', url);
            return false;
        }
    }

    /**
     * Saves a return URL to browser storage and returns a reference key
     * Use this key in the OAuth state parameter instead of the URL itself
     * 
     * @param {string} returnUrl - The URL to preserve (usually window.location.pathname)
     * @param {object} options - Optional configuration
     * @param {boolean} options.usePersistent - Use localStorage instead of sessionStorage
     * @returns {string} A unique reference key to use in the state parameter
     * 
     * @example
     * // Save current location before authentication
     * const stateKey = AuthStateStorage.saveReturnUrl(window.location.pathname);
     * 
     * msalInstance.loginRedirect({
     *     scopes: ["user.read"],
     *     state: stateKey
     * });
     */
    static saveReturnUrl(returnUrl, options = {}) {
        // Validate the URL before storing
        if (!this.isValidReturnUrl(returnUrl)) {
            console.warn('Invalid return URL, using default:', returnUrl);
            returnUrl = '/';
        }

        const stateKey = this.generateStateKey();
        const stateData = {
            returnUrl: returnUrl,
            timestamp: Date.now(),
            origin: window.location.origin
        };

        const storage = options.usePersistent ? localStorage : sessionStorage;
        storage.setItem(stateKey, JSON.stringify(stateData));

        return stateKey;
    }

    /**
     * Saves complex application state to browser storage
     * Use this when you need to preserve more than just the URL
     * 
     * @param {object} state - Application state to preserve
     * @param {string} state.returnUrl - The URL to return to after authentication
     * @param {*} state.* - Additional state properties
     * @param {object} options - Optional configuration
     * @param {boolean} options.usePersistent - Use localStorage instead of sessionStorage
     * @returns {string} A unique reference key to use in the state parameter
     * 
     * @example
     * const stateKey = AuthStateStorage.saveApplicationState({
     *     returnUrl: window.location.pathname,
     *     scrollPosition: window.scrollY,
     *     activeTab: 'profile'
     * });
     */
    static saveApplicationState(state, options = {}) {
        if (!state || typeof state !== 'object') {
            throw new Error('State must be an object');
        }

        if (!state.returnUrl) {
            state.returnUrl = window.location.pathname;
        }

        // Validate the return URL
        if (!this.isValidReturnUrl(state.returnUrl)) {
            console.warn('Invalid return URL in state, using default');
            state.returnUrl = '/';
        }

        const stateKey = this.generateStateKey();
        const stateData = {
            ...state,
            timestamp: Date.now(),
            origin: window.location.origin
        };

        const storage = options.usePersistent ? localStorage : sessionStorage;
        storage.setItem(stateKey, JSON.stringify(stateData));

        return stateKey;
    }

    /**
     * Retrieves and removes a return URL from browser storage
     * Use this in your redirect handler to get the original URL
     * 
     * @param {string} stateKey - The reference key from the state parameter
     * @param {object} options - Optional configuration
     * @param {boolean} options.keepInStorage - Don't remove after retrieval
     * @returns {string|null} The preserved URL or null if not found/invalid
     * 
     * @example
     * msalInstance.handleRedirectPromise()
     *     .then((response) => {
     *         if (response && response.state) {
     *             const returnUrl = AuthStateStorage.getReturnUrl(response.state);
     *             if (returnUrl) {
     *                 window.location.href = returnUrl;
     *             }
     *         }
     *     });
     */
    static getReturnUrl(stateKey, options = {}) {
        if (!stateKey || typeof stateKey !== 'string') {
            return null;
        }

        // Validate the state key format
        if (!stateKey.startsWith(this.STATE_KEY_PREFIX)) {
            console.warn('Invalid state key format:', stateKey);
            return null;
        }

        // Try both storage types
        let stateDataJson = sessionStorage.getItem(stateKey) || localStorage.getItem(stateKey);
        
        if (!stateDataJson) {
            console.warn('State key not found in storage:', stateKey);
            return null;
        }

        try {
            const stateData = JSON.parse(stateDataJson);

            // Validate timestamp to prevent replay attacks
            const age = Date.now() - stateData.timestamp;
            if (age > this.STATE_EXPIRATION_MS) {
                console.warn('State has expired');
                this.cleanup(stateKey);
                return null;
            }

            // Validate origin
            if (stateData.origin !== window.location.origin) {
                console.warn('State origin mismatch');
                this.cleanup(stateKey);
                return null;
            }

            // Validate the URL
            if (!this.isValidReturnUrl(stateData.returnUrl)) {
                console.warn('Invalid return URL in stored state');
                this.cleanup(stateKey);
                return null;
            }

            // Clean up unless explicitly told not to
            if (!options.keepInStorage) {
                this.cleanup(stateKey);
            }

            return stateData.returnUrl;
        } catch (e) {
            console.error('Error parsing state data:', e);
            this.cleanup(stateKey);
            return null;
        }
    }

    /**
     * Retrieves and removes complex application state from browser storage
     * 
     * @param {string} stateKey - The reference key from the state parameter
     * @param {object} options - Optional configuration
     * @param {boolean} options.keepInStorage - Don't remove after retrieval
     * @returns {object|null} The preserved state object or null if not found/invalid
     * 
     * @example
     * const state = AuthStateStorage.getApplicationState(response.state);
     * if (state) {
     *     window.location.href = state.returnUrl;
     *     window.scrollTo(0, state.scrollPosition);
     * }
     */
    static getApplicationState(stateKey, options = {}) {
        if (!stateKey || typeof stateKey !== 'string') {
            return null;
        }

        if (!stateKey.startsWith(this.STATE_KEY_PREFIX)) {
            console.warn('Invalid state key format:', stateKey);
            return null;
        }

        let stateDataJson = sessionStorage.getItem(stateKey) || localStorage.getItem(stateKey);
        
        if (!stateDataJson) {
            return null;
        }

        try {
            const stateData = JSON.parse(stateDataJson);

            // Validate timestamp
            const age = Date.now() - stateData.timestamp;
            if (age > this.STATE_EXPIRATION_MS) {
                this.cleanup(stateKey);
                return null;
            }

            // Validate origin
            if (stateData.origin !== window.location.origin) {
                this.cleanup(stateKey);
                return null;
            }

            // Validate return URL if present
            if (stateData.returnUrl && !this.isValidReturnUrl(stateData.returnUrl)) {
                this.cleanup(stateKey);
                return null;
            }

            if (!options.keepInStorage) {
                this.cleanup(stateKey);
            }

            return stateData;
        } catch (e) {
            console.error('Error parsing state data:', e);
            this.cleanup(stateKey);
            return null;
        }
    }

    /**
     * Removes a specific state key from storage
     * @param {string} stateKey - The state key to remove
     * @private
     */
    static cleanup(stateKey) {
        sessionStorage.removeItem(stateKey);
        localStorage.removeItem(stateKey);
    }

    /**
     * Removes all expired state entries from storage
     * Call this periodically or on app initialization to prevent storage bloat
     * 
     * @example
     * // Clean up expired state on app load
     * AuthStateStorage.cleanupExpiredStates();
     */
    static cleanupExpiredStates() {
        const now = Date.now();
        const storages = [sessionStorage, localStorage];

        storages.forEach(storage => {
            const keys = Object.keys(storage);
            keys.forEach(key => {
                if (key.startsWith(this.STATE_KEY_PREFIX)) {
                    try {
                        const stateData = JSON.parse(storage.getItem(key));
                        const age = now - stateData.timestamp;
                        if (age > this.STATE_EXPIRATION_MS) {
                            storage.removeItem(key);
                        }
                    } catch (e) {
                        // If we can't parse it, remove it
                        storage.removeItem(key);
                    }
                }
            });
        });
    }
}

// Clean up expired states when the module loads
AuthStateStorage.cleanupExpiredStates();
