# msal-browser Instructions

## Supported Environments

- msal-browser supports all modern mainstream browsers (Chrome, Firefox, Safari, Edge)

Never use or suggest APIs or features that are not supported by the environments listed above.

## Telemetry and Performance Monitoring

Add telemetry for any new operations or significant code paths in msal-browser and msal-common where observability would be useful.

### When to Add Telemetry

Add performance measurements for:
- New public API methods
- Significant internal operations (cache operations, network calls, crypto operations)
- Error-prone or complex code paths
- Operations that could impact user experience, performance or reliability

### How to Add Telemetry

- Use `invoke` or `invokeAsync` wrapper functions to measure duration and capture errors.
- Use PerformanceClient's `addFields` function to add additional arbitrary fields to telemetry payload
- Define new events in `lib/msal-common/src/telemetry/performance/PerformanceEvents.ts` or `lib/msal-browser/src/telemetry/BrowserPerformanceEvents.ts` depending on which library emits the event

#### Performance Event Naming Convention

- Use camelCase
- Be descriptive but concise
- Include the component/class name for clarity
- Examples: `silentCacheClientAcquireToken`, `standardInteractionClientGetDiscoveredAuthority`

### Telemetry Best Practices

- **Always include correlationId** for request tracing
- **Add relevant fields** like operation counts, cache hit/miss, and custom error details or additional error context not automatically captured by invoke/invokeAsync
- **Use existing PerformanceEvents** when possible rather than creating new ones
- **Add telemetry for new operations** following the guidelines above