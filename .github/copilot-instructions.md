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

## Pull Request Review Guidelines

When reviewing pull requests, GitHub Copilot should provide comprehensive feedback focusing on four key areas:

1. Suggest documentation updates for new public methods, properties and APIs, changes to existing APIs, new error scenarios or codes, performance considerations, breaking changes, and usage examples. See `.github/instructions/doc_review.instructions.md` for the full documentation review checklist.
1. Suggest adding test coverage (if not included) for new functions, properties, error and edge cases. Complex features should include E2E tests. 
1. Suggest adding telemetry for any changes that may impact performance or reliability and for any areas that may be useful for debugging or monitoring.
1. Changefiles should be included for all changes to the source code for core libraries (lib/) or extensions (extensions/) and should adhere to the guidelines specified in `.github/instructions/changefiles.instructions.md`
