This repository contains JavaScript/TypeScript SDKs for integrating with Microsoft Entra for authentication and authorization. Please follow these guidelines when contributing:

## Code Standards

### Required before each commit:
- Ensure all code builds successfully by running `npm run build:all`
- Ensure all code is formatted by running `npm run format:fix`
- Ensure changes pass linting by running `npm run lint`
- Test all changes by running `npm run test`
- Update apiExtractor reports by running `npm run apiExtractor -- -- --local`
- Create changefiles by running `npm run beachball:change` from the root of the repo. Include PR number in changelog message.

## Repository Structure

- `lib/`: Contains the source code for the MSAL SDKs
- `extensions/`: Contains source code for an additional extension SDK for use with MSAL-Node
- `docs/`: Contains documentation
- `lib/*/test/`: Contains unit tests for the SDKs 
- `samples/`: Contains sample applications demonstrating how to use the SDKs

## Key guidelines
- Follow JavaScript and TypeScript best practices.
- Follow Angular and React best practices in their respective SDKs (msal-angular and msal-react).
- Never make breaking, non-backwards compatible, changes. Follow semantic versioning principles.
- Maintain existing code structure, organization and naming conventions.
- Use descriptive commit messages that explain the changes made.
- Write unit tests for new functionality and bug fixes.
- Any new public facing functionality should update samples and documentation to demonstrate usage.
- Update documentation as needed to reflect changes in functionality or usage.