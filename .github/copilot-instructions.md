# GitHub Copilot Instructions for MSAL.js Repository

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

Some samples located in the `samples/` directory contain a `test/` folder. End to End tests for the core libraries are located here. 

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

## Pull Request Review Guidelines

When reviewing pull requests, GitHub Copilot should provide comprehensive feedback focusing on four key areas:

1. Suggest documentation updates for new public methods, properties and APIs, changes to existing APIs, new error scenarios or codes, performance considerations, breaking changes, and usage examples
1. Suggest adding test coverage (if not included) for new functions, properties, error and edge cases. Complex features should include E2E tests. 
1. Suggest adding telemetry for any changes that may impact performance or reliability and for any areas that may be useful for debugging or monitoring.
1. Changefiles should be included for all changes to the source code for core libraries (lib/) or extensions (extensions/) and should adhere to the guidelines specified in `.github/instructions/changefiles.instructions.md`

## Contributing

Before committing changes to any library's source code ensure all of the following steps have been completed without errors for each of the affected packages.

### Build and Validation

All of the following commands should be run in each package directory where changes were made.

1. Run `npm run build:all` to ensure the code builds without errors
1. Run `npm run lint` to ensure the code adheres to the coding standards
1. Run `npm test` to ensure all tests pass
1. Run `npm run format:check` to ensure the code is formatted correctly
    - If there are formatting errors, run `npm run format:fix` to automatically fix them
1. Run `npm run apiExtractor` to ensure the API documentation is up to date
    - If there are changes to the API documentation, run `npm run apiExtractor -- --local` to update the API documentation

### Changefiles

- To check if changefiles are required, run `npm run beachball:check` from the root of the repo.
- To generate changefiles, run `npm run beachball:change` and complete the prompts.
- Changefiles should adhere to the guidelines outlined in `.github/instructions/changefiles.instructions.md`.