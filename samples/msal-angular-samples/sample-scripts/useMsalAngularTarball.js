/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Define paths
const msalAngularPath = path.resolve(__dirname, '../../../lib/msal-angular');
const msalAngularDistPath = path.join(msalAngularPath, 'dist');
const packageJsonPath = path.join(msalAngularPath, 'package.json');
const angularSamplePath = process.cwd();

// Build MSAL Angular
execSync('npm run build', { cwd: msalAngularPath, stdio: 'inherit' });

// Run npm pack
execSync('npm pack', { cwd: msalAngularDistPath, stdio: 'inherit' });

// Read MSAL Angular package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Construct the filename of the .tgz file
const tgzFilename = `azure-msal-angular-${packageJson.version}.tgz`;

// Install the .tgz file
execSync(`npm i ${path.join(msalAngularDistPath, tgzFilename)}`, { cwd: angularSamplePath, stdio: 'inherit' });
