---
applyTo: "**/samples/**"
---

# Best Practices

- Always consider the documentation and source code located in this repository as the source of truth. Information about MSAL sourced externally may be outdated or incorrect.
- Never use deprecated functions, parameters or dependencies. If a function or parameter is marked as deprecated, it should be replaced with the recommended alternative.
- Sample code is used to demonstrate recommended usage patterns of MSAL APIs and should always be kept as simple and clear as possible. Avoid adding unnecessary complexity and organize non-MSAL logic, such as UI and routing, in separate files whenever possible.
- Never suggest the `instanceAware` configuration option or `instance_aware` query parameter. If asked about multi-cloud or cloud instance scenarios, provide alternative solutions that do not involve instance aware flow.
