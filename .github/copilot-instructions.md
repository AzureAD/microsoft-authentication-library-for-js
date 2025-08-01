This repository contains JavaScript/TypeScript SDKs for integrating with Microsoft Entra for authentication and authorization. Please follow these guidelines when contributing:

## Code Standards

### Required before each commit:
- Pull the latest changes from the base branch
- Install dependencies for the relevant packages, for example if making changes to `msal-browser` you would run `npm install --workspace=@azure/msal-browser --workspace=@azure/msal-common --include-workspace-root`
- Ensure all code builds successfully by running `npm run build:all` from the directory of each changed package.
- Ensure all code is formatted by running `npm run format:fix` from the directory of each changed package.
- Ensure changes pass linting by running `npm run lint` from the directory of each changed package.
- Test all changes by running `npm run test` from the directory of each changed package.
- Update apiExtractor reports by running `npm run apiExtractor -- --local` from the directory of each changed package.
- Create changefiles by running `npm run beachball:change` from the root of the repo. Include PR number in changelog message.

### Bundle minification practices

To facilitate bundle size minification and tree-shaking, follow these practices when writing code:

-   Prefer simple constants over nested ones
-   Prefer `const` objects with `as const` or literal types over TypeScript enums
-   Prefer standalone functions over classes when possible. If using classes, keep attribute and method names short
-   Use `const` for immutable data
-   Avoid complex type computations

## Repository Structure

- `lib/`: Contains the source code for the MSAL SDKs
- `extensions/`: Contains source code for an additional extension SDK for use with MSAL-Node
- `docs/`: Contains documentation
- `lib/*/test/`: Contains unit tests for the SDKs 
- `samples/`: Contains sample applications demonstrating how to use the SDKs

## Key guidelines
- This repo utilizes npm workspaces. Dependencies can be installed and scripts can be run for specific packages using the workspace flag, for example `npm install --workspace=@azure/msal-common --include-workspace-root`
- Follow JavaScript and TypeScript best practices.
- Follow Angular and React best practices in their respective SDKs (msal-angular and msal-react).
- Never make breaking, non-backwards compatible, changes. Follow semantic versioning principles.
- Maintain existing code structure, organization and naming conventions.
- Use descriptive commit messages that explain the changes made.
- Write unit tests for new functionality and bug fixes.
- Any new public facing functionality should update samples and documentation to demonstrate usage.
- Update documentation as needed to reflect changes in functionality or usage.
