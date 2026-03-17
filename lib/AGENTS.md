# Instructions for contributing to library source code

## Code Standards

- Prefer simple constants over nested ones
- Prefer `const` objects with `as const` or literal types over TypeScript enums
- Prefer standalone functions over classes when possible
- Use `const` for immutable data
- Avoid complex type computations; prefer simple, readable type definitions
- Never make breaking, non-backwards compatible changes to libraries (breaking changes to samples are OK)
- Follow semantic versioning principles
- Write unit tests for new functionality and bug fixes
- Document all public API changes
- Include JSDoc/TSDoc comments for all types, interfaces, functions, and classes
- Remove unused code and dependencies unless it would violate semver

## Build and Validation

Before committing changes to any library's source code ensure all of the following steps have been completed without errors for each of the affected packages.
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

## Instance Aware Flow Restrictions

**IMPORTANT: The instance aware flow is not supported and should NEVER be suggested or used with this library**

- **Do not suggest** the `instanceAware` configuration option or `instance_aware` query parameter
- **Do not recommend** instance aware flow in code examples, documentation, or solutions
- If asked about multi-cloud or cloud instance scenarios, provide alternative solutions that do not involve instance aware flow

**What to Suggest Instead:**
- Standard MSAL authentication flows without instance aware configuration
- Proper authority configuration for the specific cloud environment the application targets
- Separate application registrations for different cloud environments if needed

