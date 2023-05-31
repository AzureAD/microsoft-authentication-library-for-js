/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const { execSync } = require("child_process");

const checkPackageAndVersion = (packageName, version) => {
	// It is expected npm view will fail for packages that are about to be published. 2> dev/null/ is used to suppress the error.
	try {
		execSync(`npm view --silent ${packageName}@${version} `).toString().trim();
		return true;
	} catch (error) {
		return false;
	}
}

module.exports = checkPackageAndVersion;
