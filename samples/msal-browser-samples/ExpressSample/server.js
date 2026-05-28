/*
 * Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the source repository root for complete license information.
 */

const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const https = require('https');
const fs = require('fs');
require('dotenv').config();

const execAsync = promisify(exec);

const CDN_TIMEOUT_MS = 30_000;

const app = express();
const PORT = process.env.PORT || 3000;

// Set up Handlebars view engine with custom helpers
const hbs = exphbs.create({
    defaultLayout: 'main',
    extname: '.hbs',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials'),
    helpers: {
        json: function (context) {
            return JSON.stringify(context);
        },
        eq: function (a, b) {
            return a === b;
        }
    }
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // Parse JSON bodies

// Serve MSAL library from local build
app.use('/lib/msal-browser', express.static(path.join(__dirname, '../../../lib/msal-browser/lib')));

// Serve locally cached CDN bundles when running in E2E test mode
const CDN_CACHE_DIR = path.join(__dirname, 'test/cdn-cache');
if (process.env.NODE_ENV === 'test' || process.env.E2E_LOCAL_CDN === 'true') {
    app.use('/lib/msal-cdn-cache', express.static(CDN_CACHE_DIR));
}

const localBuildName = 'Local Build';
const localBuildDebugName = 'Local Build (Debug)';
// Dynamic MSAL version management
let currentMsalVersion = 'local'; // Default to local build
let availableVersions = {
    'local': {
        name: localBuildName,
        path: '/lib/msal-browser/msal-browser.min.js',
        description: 'Locally built version from repository'
    },
    'local-debug': {
        name: localBuildDebugName,
        path: '/lib/msal-browser/msal-browser.js',
        description: 'Locally built debug version from repository'
    },
    'latest': {
        name: 'Latest',
        path: 'https://cdn.jsdelivr.net/npm/@azure/msal-browser@latest/lib/msal-browser.min.js',
        description: 'Latest stable release from NPM'
    },
    'latest-v4': {
        name: 'Latest v4.x',
        path: 'https://cdn.jsdelivr.net/npm/@azure/msal-browser@4/lib/msal-browser.min.js',
        description: 'Latest stable release from NPM'
    },
    'latest-v3': {
        name: 'Latest v3.x',
        path: 'https://cdn.jsdelivr.net/npm/@azure/msal-browser@3/lib/msal-browser.min.js',
        description: 'Latest version of previous major (v3.x)'
    }
};

// Cache for version info to avoid excessive NPM calls
let versionCache = {
    latest: { version: null, lastFetched: 0 },
    'latest-v4': { version: null, lastFetched: 0 },
    'latest-v3': { version: null, lastFetched: 0 }
};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Function to fetch latest version from NPM
async function fetchLatestVersion(versionRange = 'latest') {
    try {
        const now = Date.now();

        // Return cached version if still valid
        if (versionCache[versionRange].version && (now - versionCache[versionRange].lastFetched) < CACHE_DURATION) {
            return versionCache[versionRange].version;
        }

        let version;

        switch (versionRange) {
            case 'latest':
                const { stdout } = await execAsync('npm view @azure/msal-browser version --silent');
                version = stdout.trim();
                break;
            case 'latest-v4':
                const { stdout: stdoutV4 } = await execAsync('npm view @azure/msal-browser@4 version --silent --json');
                const versions = JSON.parse(stdoutV4);
                version = versions.pop();
                break;
            case 'latest-v3':
                const { stdout: stdoutV3 } = await execAsync('npm view @azure/msal-browser@3 version --silent --json');
                const versionsV3 = JSON.parse(stdoutV3);
                version = versionsV3.pop();
                break;
            default:
                throw new Error("Invalid version range given!");
        }

        if (!version) {
            throw "Unable to determine latest version";
        }

        // Update cache
        versionCache[versionRange] = {
            version: version,
            lastFetched: now
        };

        return version;
    } catch (error) {
        console.warn(`Failed to fetch ${versionRange} version:`, error.message);
        throw new Error(`Failed to fetch ${versionRange} version`);
    }
}

// Function to update version descriptions with actual version numbers
async function updateVersionDescriptions() {
    try {
        const [latestVersion, latest4xVersion, latest3xVersion] = await Promise.all([
            fetchLatestVersion('latest'),
            fetchLatestVersion('latest-v4'),
            fetchLatestVersion('latest-v3')
        ]);

        if (latestVersion) {
            availableVersions.latest = {
                ...availableVersions.latest,
                name: `Latest (v${latestVersion})`,
                description: `Latest stable release from NPM`
            };
        }

        if (latest4xVersion) {
            availableVersions['latest-v4'] = {
                ...availableVersions['latest-v4'],
                name: `Latest v4.x (v${latest4xVersion})`,
                description: `Latest version of v4`
            };
        }

        if (latest3xVersion) {
            availableVersions['latest-v3'] = {
                ...availableVersions['latest-v3'],
                name: `Latest v3.x (v${latest3xVersion})`,
                description: `Latest version of v3`
            };
        }

        console.log('Version descriptions updated:', {
            latest: latestVersion,
            'latest-v4': latest4xVersion,
            'latest-v3': latest3xVersion
        });

    } catch (error) {
        console.warn('Failed to update version descriptions:', error.message);
    }
}

// Initialize version descriptions on startup
updateVersionDescriptions();

/**
 * Downloads a CDN bundle to the local cache directory.
 * Returns the local URL path to serve the cached file.
 */
async function downloadCdnBundle(versionKey, cdnUrl) {
    const cacheDir = path.join(CDN_CACHE_DIR, versionKey);
    const fileName = path.basename(cdnUrl.split('?')[0]);
    const filePath = path.join(cacheDir, fileName);
    const localPath = `/lib/msal-cdn-cache/${versionKey}/${fileName}`;

    if (fs.existsSync(filePath)) {
        return localPath;
    }

    fs.mkdirSync(cacheDir, { recursive: true });

    return new Promise((resolve, reject) => {
        function fetchUrl(url) {
            const file = fs.createWriteStream(filePath);
            const cleanup = (err) => {
                file.close();
                fs.unlink(filePath, () => {});
                reject(err);
            };

            const req = https.get(url, (response) => {
                if (response.statusCode === 301 || response.statusCode === 302) {
                    const location = response.headers.location;
                    file.close();
                    fs.unlink(filePath, () => {});
                    if (!location) {
                        reject(new Error(`Redirect with no Location header from ${url}`));
                        return;
                    }
                    fetchUrl(location);
                    return;
                }
                if (response.statusCode < 200 || response.statusCode >= 300) {
                    cleanup(new Error(`HTTP ${response.statusCode} downloading ${url}`));
                    return;
                }
                response.pipe(file);
                file.on('finish', () => { file.close(); resolve(localPath); });
                file.on('error', cleanup);
            });
            req.setTimeout(CDN_TIMEOUT_MS, () => {
                req.destroy(new Error(`CDN request timed out after ${CDN_TIMEOUT_MS}ms`));
            });
            req.on('error', cleanup);
        }

        fetchUrl(cdnUrl);
    });
}

/**
 * Pre-downloads all CDN bundles at startup so version switches use localhost instead of CDN.
 * Only runs when NODE_ENV=test or E2E_LOCAL_CDN=true.
 */
async function initializeCdnCache() {
    if (process.env.NODE_ENV !== 'test' && process.env.E2E_LOCAL_CDN !== 'true') {
        return;
    }

    console.log('E2E mode: pre-caching CDN bundles to eliminate network latency during tests...');
    const cdnEntries = Object.entries(availableVersions)
        .filter(([, info]) => info.path && info.path.startsWith('https://'));

    const results = await Promise.allSettled(
        cdnEntries.map(async ([key, info]) => {
            const localPath = await downloadCdnBundle(key, info.path);
            availableVersions[key] = { ...info, path: localPath };
            console.log(`  Cached ${key} -> ${localPath}`);
        })
    );

    const failed = results.filter(r => r.status === 'rejected').length;
    for (const [i, result] of results.entries()) {
        if (result.status === 'rejected') {
            const [key] = cdnEntries[i];
            const reason = result.reason;
            console.warn(`  Failed to cache ${key}: ${reason instanceof Error ? reason.message : String(reason)} (will use CDN fallback)`);
        }
    }
    console.log(`CDN cache ready (${cdnEntries.length - failed}/${cdnEntries.length} versions cached).`);
}

function getCurrentVersionInfo() {
    return {
        current: currentMsalVersion,
        info: availableVersions[currentMsalVersion] || availableVersions['local'],
        available: availableVersions
    };
}

// Helper function to pass environment variables and version info to templates
const getEnvConfig = (version) => {
    const majorVersion = parseInt(version.info.name.match(/v(\d+)\.(?:x|\d+)/)?.[1] || "0", 10);
    const config = {
        CLIENT_ID: process.env.CLIENT_ID,
        AUTHORITY: process.env.AUTHORITY,
        REDIRECT_URI: version.info.name === localBuildName || version.info.name === localBuildDebugName || majorVersion >= 5 ? `${process.env.REDIRECT_URI}/redirect` : process.env.REDIRECT_URI,
        POST_LOGOUT_REDIRECT_URI: process.env.POST_LOGOUT_REDIRECT_URI
    };

    // Check for missing environment variables and log warnings
    const missingVars = Object.entries(config)
        .filter(([key, value]) => !value || value.trim() === '')
        .map(([key]) => key);

    if (missingVars.length > 0) {
        console.warn('\n⚠️  WARNING: Missing environment variables detected!');
        console.warn('The following environment variables are not set or are empty:');
        missingVars.forEach(varName => {
            console.warn(`  - ${varName}`);
        });
        console.warn('\nTo fix this:');
        console.warn('1. Create a .env file in the ExpressSample directory');
        console.warn('2. Add the missing environment variables');
        console.warn('3. See README.md for detailed setup instructions');
        console.warn('');
    }

    return config;
};

// Enhanced environment config with version info
const getEnvConfigWithVersion = () => ({
    ...getEnvConfig(getCurrentVersionInfo()),
    version: getCurrentVersionInfo()
});

// API endpoint to get current version info
app.get('/api/version', async (req, res) => {
    // Optionally refresh version info if requested or cache is stale
    const refreshParam = req.query.refresh === 'true';
    const cacheStale = Object.values(versionCache).some(cache =>
        !cache.version || (Date.now() - cache.lastFetched) > CACHE_DURATION
    );

    if (refreshParam || cacheStale) {
        await updateVersionDescriptions();
    }

    res.json(getCurrentVersionInfo());
});

// API endpoint to manually refresh version information
app.post('/api/version/refresh', async (req, res) => {
    try {
        await updateVersionDescriptions();
        res.json({
            success: true,
            message: 'Version information refreshed successfully',
            version: getCurrentVersionInfo()
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to refresh version information',
            message: error.message
        });
    }
});

// Function to validate if a version exists on NPM
async function validateVersionExists(version) {
    try {
        const { stdout } = await execAsync(`npm view @azure/msal-browser@${version} version --silent`);
        return stdout.trim() === version;
    } catch (error) {
        return false;
    }
}

// API endpoint to switch MSAL version
app.post('/api/version/switch', express.json(), async (req, res) => {
    const { version, customVersion } = req.body;

    let targetVersion = version;
    const previousVersion = currentMsalVersion; // Store previous version for rollback

    // Handle custom version input
    if (version === 'custom' && customVersion) {
        // Validate custom version format (basic semver check)
        const versionRegex = /^(\d+)\.(\d+)\.(\d+)(-[a-zA-Z0-9.-]+)?$/;
        if (!versionRegex.test(customVersion)) {
            return res.status(400).json({
                error: 'Invalid version format',
                message: `The version "${customVersion}" is not a valid semantic version format.`,
                format: 'Expected format: major.minor.patch[-prerelease] (e.g., 4.0.0, 3.5.1-beta)',
                previousVersion: previousVersion,
                suggestion: 'Please check your version format and try again.'
            });
        }

        // Check if the version exists on NPM
        const versionExists = await validateVersionExists(customVersion);
        if (!versionExists) {
            return res.status(404).json({
                error: 'Version not found',
                message: `MSAL Browser version "${customVersion}" does not exist on NPM.`,
                previousVersion: previousVersion,
                suggestion: 'Please verify the version number exists on NPM and try again.',
                npmLink: `https://www.npmjs.com/package/@azure/msal-browser?activeTab=versions`
            });
        }

        // Create a dynamic version entry for the custom version
        const customVersionKey = `custom-${customVersion}`;
        availableVersions[customVersionKey] = {
            name: `MSAL v${customVersion}`,
            path: `https://cdn.jsdelivr.net/npm/@azure/msal-browser@${customVersion}/lib/msal-browser.min.js`,
            description: `Custom version v${customVersion} from CDN`,
            isCustom: true
        };

        targetVersion = customVersionKey;

        // In E2E mode, cache the bundle locally so subsequent switches use localhost instead of CDN
        if (process.env.NODE_ENV === 'test' || process.env.E2E_LOCAL_CDN === 'true') {
            try {
                const localPath = await downloadCdnBundle(customVersionKey, availableVersions[customVersionKey].path);
                availableVersions[customVersionKey] = { ...availableVersions[customVersionKey], path: localPath };
            } catch (err) {
                console.warn(`Failed to cache custom version ${customVersion}: ${err instanceof Error ? err.message : String(err)}`);
            }
        }
    }

    if (!targetVersion || (!availableVersions[targetVersion] && targetVersion !== 'custom')) {
        return res.status(400).json({
            error: 'Invalid version specified',
            message: 'The requested version is not available.',
            available: Object.keys(availableVersions),
            previousVersion: previousVersion,
            hint: 'Use "custom" with customVersion parameter for unlisted versions'
        });
    }

    currentMsalVersion = targetVersion;

    res.json({
        success: true,
        message: `Switched from ${previousVersion} to ${targetVersion}`,
        previous: availableVersions[previousVersion],
        current: availableVersions[targetVersion],
        version: getCurrentVersionInfo()
    });
});

// Routes
app.get('/', (req, res) => {
    res.render('home', {
        title: 'MSAL Express Sample - Home',
        envConfig: getEnvConfigWithVersion()
    });
});

app.get('/redirect', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'redirect.html'));
});

app.get('/profile', (req, res) => {
    res.render('profile', {
        title: 'MSAL Express Sample - Profile',
        envConfig: getEnvConfigWithVersion()
    });
});

app.get('/logout', (req, res) => {
    res.render('logout', {
        title: 'MSAL Express Sample - Logout',
        envConfig: getEnvConfigWithVersion()
    });
});

app.get('/playground', (req, res) => {
    res.render('playground', {
        title: 'MSAL Express Sample - Playground',
        envConfig: getEnvConfigWithVersion()
    });
});

// API endpoints for SPA routing
app.get('/api/content/home', (req, res) => {
    res.render('partials/home-content', {
        layout: false,  // Don't use main layout for partial content
        envConfig: getEnvConfigWithVersion()
    });
});

app.get('/api/content/profile', (req, res) => {
    res.render('partials/profile-content', {
        layout: false,  // Don't use main layout for partial content
        envConfig: getEnvConfigWithVersion()
    });
});

app.get('/api/content/logout', (req, res) => {
    res.render('logout', {
        layout: false,  // Don't use main layout for partial content
        envConfig: getEnvConfigWithVersion()
    });
});

app.get('/api/content/playground', (req, res) => {
    res.render('partials/playground-content', {
        layout: false,  // Don't use main layout for partial content
        envConfig: getEnvConfigWithVersion()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', {
        title: '404 - Page Not Found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        title: '500 - Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Run startup tasks then begin listening
(async () => {
    await initializeCdnCache();
    app.listen(PORT, () => {
        console.log(`Express server listening on port ${PORT}`);
        console.log(`Navigate to http://localhost:${PORT}`);
    });
})();
