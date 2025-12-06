---
applyTo: "**/samples/**"
---

# Best Practices

## Instance Aware Flow Restrictions

**IMPORTANT: The instance aware flow is not supported and should NEVER be suggested or used with this library**

- **Do not suggest** the `instanceAware` configuration option or `instance_aware` query parameter
- **Do not recommend** instance aware flow in code examples, documentation, or solutions
- If asked about multi-cloud or cloud instance scenarios, provide alternative solutions that do not involve instance aware flow

**What to Suggest Instead:**
- Standard MSAL authentication flows without instance aware configuration
- Proper authority configuration for the specific cloud environment the application targets
- Separate application registrations for different cloud environments if needed
