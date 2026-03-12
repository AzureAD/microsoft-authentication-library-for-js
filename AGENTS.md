# AI Agent Instructions for MSAL.js Repository

## Repository Overview

This repository contains the Microsoft Authentication Library for JavaScript (MSAL.js), a comprehensive authentication solution that enables JavaScript applications to authenticate users with Microsoft Identity Platform. The repository supports work and school accounts (Azure AD), personal Microsoft accounts (MSA), and social identity providers through Azure AD B2C.

## Folder Structure

- `lib/`: core libraries
- `extensions/`: additional libraries
- `samples/`: example applications and end-to-end tests
- `shared-configs/`: shared ESLint and Rollup configurations
- `shared-test-utils/`: common test utilities
- `regression-tests/`: performance benchmarks
- `change/`: Beachball change files

Each package within `lib/` and `extensions/` is organized as follows:

- `src/`: TypeScript source code
- `test/`: unit and integration tests
- `docs/`: documentation
- `apiReview/`: API extractor files

Some samples located in the `samples/` directory contain a `test/` folder. End to End tests for the packages are located here. 

## Project Architecture and Layout

### Dependencies and Architecture

- **msal-common**: Core package - no dependencies on other MSAL packages
- **msal-browser**: Depends on msal-common
- **msal-node**: Depends on msal-common
- **msal-react**: Depends on msal-browser
- **msal-angular**: Depends on msal-browser
- **msal-node-extensions**: Depends on msal-common

**CRITICAL: Always build dependencies in correct order. msal-common must be built before msal-browser/msal-node. msal-browser must be built before msal-react/msal-angular.**

### Prerequisites and Environment Setup

1. **Always run `npm install` at repository root** to bootstrap the monorepo
1. Repository uses npm workspaces - dependencies are shared and managed at root level
