---
applyTo: "**/lib/**, **/extensions/msal-node-extensions/**"
---

# Contributing

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

## Supported Environments

- msal-browser supports all modern mainstream browsers (Chrome, Firefox, Safari, Edge)
- msal-node and msal-node-extensions support a minimum Node.js version specified in their respective `engines` field of their package.json file
- msal-common supports the superset of environments of msal-browser, msal-node and msal-node-extensions
- msal-react supports the React versions specified in the `peerDependencies` field of its package.json file
- msal-angular supports the Angular versions specified in its `README` file

Never use or suggest APIs or features that are not supported by the target environments for a given library.

## Instance Aware Flow Restrictions

**IMPORTANT: The instance aware flow is not supported and should NEVER be suggested or used with this library**

- **Do not suggest** the `instanceAware` configuration option or `instance_aware` query parameter
- **Do not recommend** instance aware flow in code examples, documentation, or solutions
- If asked about multi-cloud or cloud instance scenarios, provide alternative solutions that do not involve instance aware flow

**What to Suggest Instead:**
- Standard MSAL authentication flows without instance aware configuration
- Proper authority configuration for the specific cloud environment the application targets
- Separate application registrations for different cloud environments if needed
