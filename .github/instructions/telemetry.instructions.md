---
applyTo: "**/lib/msal-browser/src, **/lib/msal-common/src"
---

# Telemetry and Performance Monitoring

**IMPORTANT: Add telemetry for any new operations or significant code paths in msal-browser and msal-common where observability would be useful.**

## When to Add Telemetry

Add performance measurements for:
- New public API methods
- Significant internal operations (cache operations, network calls, crypto operations)
- Error-prone or complex code paths
- Operations that could impact user experience, performance or reliability

## How to Add Telemetry

### 1. To Measure Duration of Async Functions - Use `invokeAsync` wrapper:

```typescript
import { invokeAsync, PerformanceEvents } from '@azure/msal-common';

// Example: Wrapping an async function
const result = await invokeAsync(
    this.someAsyncFunction.bind(this),
    PerformanceEvents.YourEventName,  // Use existing or add new event name
    this.logger,
    this.performanceClient,
    correlationId
)(param1, param2);
```

### 2. To Measure Duration of Sync Functions - Use `invoke` wrapper:

```typescript
import { invoke, PerformanceEvents } from '@azure/msal-common';

// Example: Wrapping a sync function
const result = invoke(
    this.someSyncFunction.bind(this),
    PerformanceEvents.YourEventName,
    this.logger,
    this.performanceClient,
    correlationId
)(param1, param2);
```

### 3. To add additional fields:

```typescript
// Add additional fields if useful
this.performanceClient.addFields({
    customField: "value",
    operationCount: 5
}, correlationId);
```

### 4. Adding New Performance Events:

If you need a new performance event that will be referenced in msal-common, you may define it in `lib/msal-common/src/telemetry/performance/PerformanceEvents.ts`
If you need a new performance event that will be referenced in msal-browser only, you may define it in `lib/msal-browser/src/telemetry/BrowserPerformanceEvents.ts`:
```typescript
/**
 * Your new event description
 */
export const YourNewEventName = "yourNewEventName";
```

## Performance Event Naming Convention

- Use camelCase
- Be descriptive but concise
- Include the component/class name for clarity
- Examples: `silentCacheClientAcquireToken`, `standardInteractionClientGetDiscoveredAuthority`

## Telemetry Best Practices

- **Always include correlationId** for request tracing
- **Add relevant fields** like operation counts, cache hit/miss, error codes using `performanceClient.addFields()`
- **Use existing PerformanceEvents** when possible rather than creating new ones
- **Add telemetry for new operations** following the guidelines above