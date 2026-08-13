/*
 * Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the source repository root for complete license information.
 */

const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
require('dotenv').config();

const execAsync = promisify(exec);

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

// Serve over HTTPS when HTTPS=true (e2e harness). Secure origin needed for
// platform-broker/WAM injection. Manual `npm start` stays http.
if (process.env.HTTPS === 'true') {
    const https = require('https');
    // Throwaway in-memory self-signed cert; nothing written to disk.
    const selfsigned = require('selfsigned');
    // selfsigned v5 generate() returns a Promise (v2 was sync); handle both.
    Promise.resolve(
        selfsigned.generate(
            [{ name: 'commonName', value: 'localhost' }],
            {
                days: 1,
                keySize: 2048,
                algorithm: 'sha256',
                extensions: [
                    {
                        name: 'subjectAltName',
                        altNames: [
                            { type: 2, value: 'localhost' },
                            { type: 7, ip: '127.0.0.1' },
                        ],
                    },
                ],
            }
        )
    ).then((pems) => {
        https
            .createServer({ key: pems.private, cert: pems.cert }, app)
            .listen(PORT, () => {
                console.log(
                    `Express server listening on port ${PORT} (HTTPS)`
                );
                console.log(`Navigate to https://localhost:${PORT}`);
            });
    });
} else {
    app.listen(PORT, () => {
        console.log(`Express server listening on port ${PORT}`);
        console.log(`Navigate to http://localhost:${PORT}`);
    });
}
