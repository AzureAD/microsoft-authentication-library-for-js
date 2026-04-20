#!/usr/bin/env node
/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Validates that every file path declared in a package's exports map (and top-level
 * types/main/module fields) exists on disk after a build. Run from the package directory.
 *
 * Usage: node ../../scripts/check-exports.js
 */

"use strict";

const fs = require("fs");
const path = require("path");

const pkgDir = process.cwd();
const pkgPath = path.join(pkgDir, "package.json");

if (!fs.existsSync(pkgPath)) {
    console.error(`No package.json found at ${pkgDir}`);
    process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
const missing = [];

function checkPath(filePath, context) {
    if (typeof filePath !== "string" || !filePath.startsWith("./")) return;
    const resolved = path.join(pkgDir, filePath);
    if (!fs.existsSync(resolved)) {
        missing.push({ path: filePath, context });
    }
}

function walk(value, context) {
    if (typeof value === "string") {
        checkPath(value, context);
    } else if (Array.isArray(value)) {
        value.forEach((item, i) => walk(item, `${context}[${i}]`));
    } else if (value && typeof value === "object") {
        for (const [key, val] of Object.entries(value)) {
            walk(val, `${context}["${key}"]`);
        }
    }
}

if (pkg.exports) {
    walk(pkg.exports, "exports");
}

for (const field of ["types", "typings", "main", "module"]) {
    if (pkg[field]) checkPath(pkg[field], field);
}

if (missing.length > 0) {
    console.error(`\nExport path validation failed for ${pkg.name}:`);
    for (const { path: p, context } of missing) {
        console.error(`  ✗  ${p}  (referenced by ${context})`);
    }
    console.error(`\n${missing.length} missing file(s)`);
    process.exit(1);
}

console.log(`All export paths exist for ${pkg.name} ✓`);
