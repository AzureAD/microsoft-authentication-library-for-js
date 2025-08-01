# Backward Compatibility Requirements for Native Authentication

## 1. Overview

This specification defines backward compatibility requirements for enhancing the Native Authentication (Custom Auth) feature in the MSAL Browser SDK. These requirements ensure that new capabilities can be introduced without breaking existing GA (Generally Available) scenarios.

The specification addresses three core requirements:

1. **Optional "capabilities" parameter**: A new optional configuration parameter to communicate client capabilities to the server
2. **"Redirect" response support**: Ensure all native auth endpoints can return redirect responses when fallback to web-based authentication is required
3. **"redirect_reason" parameter**: Provide contextual information when redirect responses are returned

## 2. Backward Compatibility Guarantees

### Core Principles
- **Additive Changes Only**: All modifications must be additive and optional
- **GA Scenario Preservation**: Existing GA scenarios must continue to function unchanged
- **Optional Parameters**: New parameters must be optional with sensible defaults
- **No Breaking Changes**: API contracts and response structures must remain compatible

### Compatibility Matrix
| Feature | Current GA Support | New Enhancement | Backward Compatible |
|---------|-------------------|------------------|-------------------|
| Configuration | ✅ Existing options | ➕ Optional capabilities | ✅ Yes |
| Response Processing | ✅ Current response types | ➕ Redirect responses | ✅ Yes |
| Error Handling | ✅ Existing error types | ➕ Enhanced redirect handling | ✅ Yes |

## 3. Technical Requirements

### 3.1 Optional "capabilities" Configuration Parameter

#### 3.1.1 CustomAuthConfiguration Enhancement

The `CustomAuthOptions` type must be enhanced with an optional `capabilities` parameter:

```typescript
// Enhanced CustomAuthConfiguration
export type CustomAuthOptions = {
    challengeTypes?: Array<string>;
    authApiProxyUrl: string;
    capabilities?: Array<string>; // NEW: Optional capabilities parameter
};

export type CustomAuthConfiguration = Configuration & {
    customAuth: CustomAuthOptions;
};

export type CustomAuthBrowserConfiguration = BrowserConfiguration & {
    customAuth: CustomAuthOptions;
};
```

#### 3.1.2 Capabilities Definition

The `capabilities` parameter contains a list of values indicating which advanced flows the client supports. This allows the server to determine whether to trigger native authentication flows or redirect to web-based authentication.

```typescript
// Standard capability values
export const NATIVE_AUTH_CAPABILITIES = {
    MFA_REQUIRED: "mfa_required",
    REGISTRATION_REQUIRED: "registration_required"
} as const;

type NativeAuthCapability = typeof NATIVE_AUTH_CAPABILITIES[keyof typeof NATIVE_AUTH_CAPABILITIES];
```

#### 3.1.3 Capability Descriptions

**`mfa_required`**: Indicates the client is able to handle the native auth MFA loop, which is triggered by the `/token` endpoint returning an `mfa_required` error response.

**`registration_required`**: Indicates the client is able to handle the native auth strong auth registration JIT (Just-In-Time) loop, which is triggered by the `/token` endpoint returning a `registration_required` error response.

#### 3.1.4 Configuration Usage Patterns

```typescript
// Example: Client supporting both MFA and registration flows
const customAuthConfig: CustomAuthConfiguration = {
    auth: {
        clientId: "your-client-id",
        authority: "your-authority"
    },
    customAuth: {
        authApiProxyUrl: "https://your-api-proxy.com",
        capabilities: ["mfa_required", "registration_required"] // Client can handle both advanced flows
    }
};

// Example: Client supporting only MFA flow
const mfaOnlyConfig: CustomAuthConfiguration = {
    auth: {
        clientId: "your-client-id", 
        authority: "your-authority"
    },
    customAuth: {
        authApiProxyUrl: "https://your-api-proxy.com",
        capabilities: ["mfa_required"] // Client can handle MFA but not registration
    }
};

// Example: Existing GA scenario (unchanged)
const legacyConfig: CustomAuthConfiguration = {
    auth: {
        clientId: "your-client-id",
        authority: "your-authority"
    },
    customAuth: {
        authApiProxyUrl: "https://your-api-proxy.com"
        // No capabilities parameter - server will redirect to web auth for advanced flows
    }
};
```

#### 3.1.5 Capabilities String Formatting

**Important**: The SDK must convert the capabilities array from configuration to a whitespace-separated string when sending requests:

```typescript
// Configuration processing logic
function formatCapabilitiesForRequest(capabilities?: Array<string>): string | undefined {
    if (!capabilities || capabilities.length === 0) {
        return undefined;
    }
    return capabilities.join(" "); // Convert array to whitespace-separated string
}

// Example transformations:
// ["mfa_required"] → "mfa_required"
// ["mfa_required", "registration_required"] → "mfa_required registration_required"
// [] or undefined → undefined
```

#### 3.1.6 Request Type Integration

The capabilities from configuration must be converted to string format and included in all start/initiate requests:

```typescript
// Enhanced request types (capabilities as string, formatted from configuration array)
export interface SignInInitiateRequest extends ApiRequestBase {
    challenge_type: string;
    username: string;
    capabilities?: string; // Whitespace-separated string converted from configuration array
}

export interface SignUpStartRequest extends ApiRequestBase {
    username: string;
    challenge_type: string;
    password?: string;
    attributes?: Record<string, string>;
    capabilities?: string; // Whitespace-separated string converted from configuration array
}

export interface ResetPasswordStartRequest extends ApiRequestBase {
    challenge_type: string;
    username: string;
    capabilities?: string; // Whitespace-separated string converted from configuration array
}
```

### 3.2 Redirect Response Support

#### 3.2.1 Redirect Response Format

Server redirect responses use a specific format with `challenge_type: "redirect"` and a descriptive `redirect_reason`. However, these are immediately converted to `RedirectError` exceptions by the SDK, maintaining the existing error-based flow.

#### 3.2.2 Standard Server Redirect Response Examples

```typescript
// Example redirect responses from server (converted to RedirectError by BaseApiClient)

// MFA capability missing
const mfaRedirectResponse = {
    challenge_type: "redirect",
    redirect_reason: "Client is not capable: missing mfa_required capability",
    correlation_id: "..."
};

// Registration capability missing
const registrationRedirectResponse = {
    challenge_type: "redirect", 
    redirect_reason: "Client is not capable: missing registration_required capability",
    correlation_id: "..."
};
```

#### 3.2.3 Error-Based Redirect Handling

**Important Note**: The implementation uses the existing error-based flow instead of response union types. Redirect responses are converted to `RedirectError` exceptions by `BaseApiClient`, maintaining consistency with MSAL's error handling patterns.

**Current Flow**:
1. Server sends response with `challenge_type: "redirect"` and `redirect_reason`
2. `BaseApiClient.handleApiResponse()` detects it and throws enhanced `RedirectError`
3. Error bubbles up through `SignInResult.createWithError(error)`
4. Users check `result.isRedirectRequired()` and `result.error.getRedirectReason()`

**No Response Union Types Needed**: Since redirects are handled as errors (not successful responses), the existing response types remain unchanged.

#### 3.2.4 Enhanced RedirectError Integration

The existing `RedirectError` must be enhanced to handle the new redirect response format:

```typescript
// Enhanced RedirectError implementation
export class RedirectError extends CustomAuthError {
    constructor(
        correlationId?: string,
        public redirectReason?: string // NEW: Optional redirect reason parameter
    ) {
        super(
            "redirect",
            redirectReason || "No required authentication method by Microsoft Entra is supported, a fallback to the web-based authentication flow is needed.",
            correlationId
        );
        Object.setPrototypeOf(this, RedirectError.prototype);
    }
}
```

#### 3.2.5 Response Processing Logic

```typescript
// Enhanced BaseApiClient processing for redirect responses
if (response.challenge_type === "redirect") {
    throw new RedirectError(
        response.correlation_id,
        response.redirect_reason
    );
}
```

### 3.3 Complete Endpoint Redirect Response Support

#### 3.3.1 All Native Auth Endpoints

All native authentication endpoints must be capable of returning redirect responses with `challenge_type: "redirect"` and `redirect_reason`. These responses are immediately converted to `RedirectError` exceptions by `BaseApiClient`:

**Sign-up Endpoints:**
- `/signup/v1.0/start` → Can return redirect response (converted to `RedirectError`)
- `/signup/v1.0/challenge` → Can return redirect response (converted to `RedirectError`)
- `/signup/v1.0/continue` → Can return redirect response (converted to `RedirectError`)

**Reset Password Endpoints:**
- `/resetpassword/v1.0/start` → Can return redirect response (converted to `RedirectError`)
- `/resetpassword/v1.0/challenge` → Can return redirect response (converted to `RedirectError`)
- `/resetpassword/v1.0/continue` → Can return redirect response (converted to `RedirectError`)
- `/resetpassword/v1.0/submit` → Can return redirect response (converted to `RedirectError`)
- `/resetpassword/v1.0/poll_completion` → Can return redirect response (converted to `RedirectError`)

**Sign-in Endpoints (OAuth2):**
- `/oauth2/v2.0/initiate` → Can return redirect response (converted to `RedirectError`)
- `/oauth2/v2.0/challenge` → Can return redirect response (converted to `RedirectError`)
- `/oauth2/v2.0/token` → Can return redirect response (converted to `RedirectError`)

#### 3.3.2 Endpoint Error Handling

All endpoints use the same error-based pattern for handling redirect responses:

```typescript
// All endpoints follow this pattern in BaseApiClient.handleApiResponse()
if (response.challenge_type === "redirect") {
    throw new RedirectError(
        response.correlation_id,
        response.redirect_reason
    );
}

// The error then bubbles up through:
// 1. API Client → throws RedirectError
// 2. Interaction Client → catches and wraps in Result.createWithError()  
// 3. Application → checks result.isRedirectRequired() and result.error.getRedirectReason()
```

#### 3.3.3 Error Handling Integration

The existing error handling system must be extended to support redirect detection for all endpoints:

```typescript
// Enhanced error detection methods
// In AuthFlowErrorBase.ts
protected isRedirectError(): boolean {
    return this.errorData instanceof RedirectError;
}

// In flow-specific error types (SignInError, SignUpError, ResetPasswordError)
isRedirectRequired(): boolean {
    return this.isRedirectError();
}

// NEW: Access to redirect reason through error data
getRedirectReason(): string | undefined {
    if (this.errorData instanceof RedirectError) {
        return this.errorData.redirectReason;
    }
    return undefined;
}
```

## 4. Implementation Examples

### 4.1 Application Configuration

```typescript
import {
    CustomAuthPublicClientApplication,
    NATIVE_AUTH_CAPABILITIES,
    CustomAuthConfiguration
} from "@azure/msal-browser/custom-auth";

// Enhanced configuration with MFA and registration capabilities
const advancedConfig: CustomAuthConfiguration = {
    auth: {
        clientId: "your-client-id",
        authority: "https://your-tenant.ciamlogin.com/"
    },
    customAuth: {
        authApiProxyUrl: "https://your-api-proxy.com",
        capabilities: [
            NATIVE_AUTH_CAPABILITIES.MFA_REQUIRED,
            NATIVE_AUTH_CAPABILITIES.REGISTRATION_REQUIRED
        ] // Will be converted to "mfa_required registration_required" in requests
    }
};

// Partial capabilities configuration
const mfaOnlyConfig: CustomAuthConfiguration = {
    auth: {
        clientId: "your-client-id",
        authority: "https://your-tenant.ciamlogin.com/"
    },
    customAuth: {
        authApiProxyUrl: "https://your-api-proxy.com",
        capabilities: [NATIVE_AUTH_CAPABILITIES.MFA_REQUIRED] // Will be converted to "mfa_required" in requests
    }
};

// Legacy configuration (unchanged)
const legacyConfig: CustomAuthConfiguration = {
    auth: {
        clientId: "your-client-id",
        authority: "https://your-tenant.ciamlogin.com/"
    },
    customAuth: {
        authApiProxyUrl: "https://your-api-proxy.com"
        // No capabilities - will redirect for advanced flows
    }
};
```

### 4.2 Configuration-to-Request Processing

```typescript
// Internal SDK logic for processing capabilities
class SignInClient {
    constructor(private config: CustomAuthConfiguration) {}
    
    private formatCapabilities(): string | undefined {
        const capabilities = this.config.customAuth.capabilities;
        if (!capabilities || capabilities.length === 0) {
            return undefined;
        }
        return capabilities.join(" "); // Convert array to whitespace-separated string
    }
    
    async initiate(username: string): Promise<SignInResult> {
        const request: SignInInitiateRequest = {
            username,
            challenge_type: "password",
            capabilities: this.formatCapabilities(), // "mfa_required registration_required" or undefined
            correlationId: generateCorrelationId(),
            telemetryManager: this.telemetryManager
        };
        
        return this.apiClient.signInInitiate(request);
    }
}

// Example request formatting results:
// Config: capabilities: ["mfa_required"] → Request: capabilities: "mfa_required"
// Config: capabilities: ["mfa_required", "registration_required"] → Request: capabilities: "mfa_required registration_required"
// Config: capabilities: undefined → Request: capabilities: undefined
```

### 4.3 Client-Side Usage Examples

```typescript
// Enhanced sign-in with advanced capabilities
async function signInWithAdvancedCapabilities(username: string): Promise<void> {
    const client = await CustomAuthPublicClientApplication.create(advancedConfig);
    const result = await client.signIn({ username });
    
    if (result.isMfaRequired()) {
        await handleNativeMfaFlow(result);
    } else if (result.isRegistrationRequired()) {
        await handleNativeRegistrationFlow(result);
    } else if (result.isFailed() && result.error?.isRedirectRequired()) {
        const redirectReason = result.error.getRedirectReason();
        await handleWebAuthFallback(redirectReason);
    }
}

// Enhanced sign-up with capabilities
async function signUpWithCapabilities(username: string, password: string): Promise<void> {
    const client = await CustomAuthPublicClientApplication.create(advancedConfig);
    const result = await client.signUp({ username, password });
    
    if (result.isFailed() && result.error?.isRedirectRequired()) {
        const redirectReason = result.error.getRedirectReason();
        console.log(`Sign-up redirect required: ${redirectReason}`);
        await handleWebAuthFallback(redirectReason);
    }
}

// Enhanced reset password with capabilities
async function resetPasswordWithCapabilities(username: string): Promise<void> {
    const client = await CustomAuthPublicClientApplication.create(advancedConfig);
    const result = await client.resetPassword({ username });
    
    if (result.isFailed() && result.error?.isRedirectRequired()) {
        const redirectReason = result.error.getRedirectReason();
        console.log(`Reset password redirect required: ${redirectReason}`);
        await handleWebAuthFallback(redirectReason);
    }
}
```

### 4.4 Server Response Handling by Endpoint

```typescript
// Example redirect responses from different endpoints

// /oauth2/v2.0/initiate endpoint redirect
const signInInitiateRedirect = {
    challenge_type: "redirect",
    redirect_reason: "Client is not capable: missing mfa_required capability",
    correlation_id: "..."
};

// /oauth2/v2.0/token endpoint redirect  
const tokenEndpointRedirect = {
    challenge_type: "redirect",
    redirect_reason: "Client is not capable: missing registration_required capability",
    correlation_id: "..."
};

// /signup/v1.0/start endpoint redirect
const signUpStartRedirect = {
    challenge_type: "redirect",
    redirect_reason: "Client is not capable: missing mfa_required capability", 
    correlation_id: "..."
};

// /resetpassword/v1.0/start endpoint redirect
const resetPasswordStartRedirect = {
    challenge_type: "redirect",
    redirect_reason: "Client is not capable: missing registration_required capability",
    correlation_id: "..."
};

// /resetpassword/v1.0/poll_completion endpoint redirect
const pollCompletionRedirect = {
    challenge_type: "redirect",
    redirect_reason: "Client is not capable: missing mfa_required capability",
    correlation_id: "..."
};

// Processing any redirect response
function processRedirectResponse(response: any, endpointName: string): void {
    if (response.challenge_type === "redirect") {
        const redirectError = new RedirectError(
            response.correlation_id,
            response.redirect_reason
        );
        
        console.log(`Redirect from ${endpointName}: ${redirectError.redirectReason}`);
        
        if (redirectError.redirectReason?.includes("missing mfa_required capability")) {
            handleMfaCapabilityRedirect();
        } else if (redirectError.redirectReason?.includes("missing registration_required capability")) {
            handleRegistrationCapabilityRedirect();
        } else {
            handleGenericRedirect();
        }
    }
}
```

## 5. Flow Decision Logic

### 5.1 Server-Side Decision Matrix

The server uses the `capabilities` string parameter (converted from client configuration array) to determine the appropriate response for any endpoint:

| Client Capabilities (Array) | Converted String | Server Requirement | Server Response | Applicable Endpoints |
|----------------------------|------------------|-------------------|-----------------|---------------------|
| `["mfa_required"]` | `"mfa_required"` | MFA needed | Return appropriate native auth challenge | All endpoints |
| `["registration_required"]` | `"registration_required"` | Registration needed | Return appropriate native auth challenge | All endpoints |
| `["mfa_required", "registration_required"]` | `"mfa_required registration_required"` | Either needed | Return appropriate native auth challenge | All endpoints |
| `[]` or missing | `undefined` | MFA needed | `challenge_type: "redirect"`, `redirect_reason: "Client is not capable: missing mfa_required capability"` | All endpoints |
| `[]` or missing | `undefined` | Registration needed | `challenge_type: "redirect"`, `redirect_reason: "Client is not capable: missing registration_required capability"` | All endpoints |
| `["mfa_required"]` | `"mfa_required"` | Registration needed | `challenge_type: "redirect"`, `redirect_reason: "Client is not capable: missing registration_required capability"` | All endpoints |

### 5.2 Endpoint-Specific Redirect Scenarios

```typescript
// Scenarios where each endpoint might return redirect responses

// Sign-up endpoints
// /signup/v1.0/start - Can redirect if MFA or registration required for sign-up completion
// /signup/v1.0/challenge - Can redirect if challenge requires unsupported capability  
// /signup/v1.0/continue - Can redirect if continuation requires unsupported capability

// Reset Password endpoints  
// /resetpassword/v1.0/start - Can redirect if reset flow requires unsupported capability
// /resetpassword/v1.0/challenge - Can redirect if challenge requires unsupported capability
// /resetpassword/v1.0/continue - Can redirect if continuation requires unsupported capability
// /resetpassword/v1.0/submit - Can redirect if submission requires unsupported capability
// /resetpassword/v1.0/poll_completion - Can redirect if completion requires unsupported capability

// Sign-in endpoints
// /oauth2/v2.0/initiate - Can redirect if initiation requires unsupported capability
// /oauth2/v2.0/challenge - Can redirect if challenge requires unsupported capability
// /oauth2/v2.0/token - Can redirect if token issuance requires unsupported capability (most common)
```

## 6. Migration and Compatibility

### 6.1 Existing Applications

**No Changes Required**: Existing applications using native authentication will continue to function without modification:

- Configuration types remain backward compatible (optional parameters)
- All endpoints will automatically redirect to web auth with descriptive messages for advanced flows
- Existing error handling patterns continue to work
- State machine flows unaffected

### 6.2 Enhanced Applications

Applications can opt-in to enhanced functionality by adding capabilities to their configuration:

```typescript
// Gradual adoption pattern
const existingConfig: CustomAuthConfiguration = {
    auth: { /* existing auth config */ },
    customAuth: {
        authApiProxyUrl: "https://your-api-proxy.com"
        // No capabilities - all endpoints will redirect for advanced flows
    }
};

// Add MFA support - reduces redirects from all endpoints
const enhancedConfig: CustomAuthConfiguration = {
    ...existingConfig,
    customAuth: {
        ...existingConfig.customAuth,
        capabilities: ["mfa_required"] // Sent as "mfa_required" in requests
    }
};

// Add full support - minimizes redirects from all endpoints
const fullyEnhancedConfig: CustomAuthConfiguration = {
    ...existingConfig,
    customAuth: {
        ...existingConfig.customAuth,
        capabilities: ["mfa_required", "registration_required"] // Sent as "mfa_required registration_required"
    }
};
```

## 7. Testing Requirements

### 7.1 Backward Compatibility Tests

- **Legacy Configuration**: Verify applications without capabilities configuration continue to work
- **Automatic Redirect**: Confirm all endpoints redirect with descriptive messages for clients without capabilities
- **Existing Error Flows**: Confirm current redirect error handling remains unchanged
- **GA Scenario Preservation**: Test all existing authentication flows across all endpoints

### 7.2 Enhanced Functionality Tests

- **Capabilities String Conversion**: Test that configuration arrays are correctly converted to whitespace-separated strings
- **Configuration-Based Capabilities**: Test capabilities from CustomAuthConfiguration are correctly formatted and sent to all requests
- **Native Flow Handling**: Verify MFA and registration flows work with appropriate capabilities across all endpoints
- **Partial Capabilities**: Test clients with only some capabilities across all endpoints
- **Redirect Response Processing**: Verify redirect responses with descriptive reasons are handled correctly from all endpoints

### 7.3 Endpoint-Specific Tests

**Each endpoint must be tested for redirect response support:**

- `/signup/v1.0/start` redirect scenarios
- `/signup/v1.0/challenge` redirect scenarios  
- `/signup/v1.0/continue` redirect scenarios
- `/resetpassword/v1.0/start` redirect scenarios
- `/resetpassword/v1.0/challenge` redirect scenarios
- `/resetpassword/v1.0/continue` redirect scenarios
- `/resetpassword/v1.0/submit` redirect scenarios
- `/resetpassword/v1.0/poll_completion` redirect scenarios
- `/oauth2/v2.0/initiate` redirect scenarios
- `/oauth2/v2.0/challenge` redirect scenarios
- `/oauth2/v2.0/token` redirect scenarios

### 7.4 Capabilities String Formatting Tests

```typescript
// Test cases for capabilities string conversion
const testCases = [
    { input: undefined, expected: undefined },
    { input: [], expected: undefined },
    { input: ["mfa_required"], expected: "mfa_required" },
    { input: ["registration_required"], expected: "registration_required" },
    { input: ["mfa_required", "registration_required"], expected: "mfa_required registration_required" }
];
```

## 8. Documentation and Developer Experience

### 8.1 API Documentation

- **Configuration Options**: Clear documentation of capabilities configuration as string arrays and their conversion to request strings
- **Endpoint Coverage**: Complete list of endpoints supporting redirect responses
- **Flow Decision Logic**: Explanation of when native vs. web authentication is used per endpoint based on capabilities strings
- **Redirect Handling**: Updated error handling examples with descriptive redirect reasons from all endpoints
- **Migration Guide**: Step-by-step capability adoption guide

### 8.2 TypeScript Support

- **Type Safety**: Strong typing for capabilities configuration arrays and redirect responses from all endpoints
- **Intellisense**: Auto-completion for standard capability values
- **Configuration Validation**: Compile-time validation of configuration options

## 9. Security Considerations

### 9.1 Capabilities Configuration

- **Information Disclosure**: Capabilities parameter reveals client authentication support capabilities
- **Configuration Security**: Capabilities should be configured based on actual client implementation
- **Server Validation**: Server should validate and sanitize capability strings across all endpoints
- **String Format Security**: Whitespace-separated format prevents injection attacks

### 9.2 Redirect Reason

- **Information Clarity**: Redirect reasons provide clear, actionable information about capability requirements
- **Standardization**: Use consistent messaging format for redirect reasons across all endpoints
- **Client Handling**: Secure processing of redirect reason information

## 10. Future Extensibility

### 10.1 Capability Extension

- **New Flow Support**: Additional capabilities can be added to configuration arrays for future authentication flows
- **Version Compatibility**: Capability negotiation between client and server versions across all endpoints
- **Runtime Detection**: Dynamic capability discovery mechanisms
- **String Format Evolution**: Whitespace-separated format supports additional capability values

### 10.2 Redirect Reason Extension  

- **New Redirect Scenarios**: Additional redirect reasons for future requirements across all endpoints
- **Enhanced Messaging**: More detailed redirect context for better developer experience
- **Policy Evolution**: Support for evolving security policy requirements

## 11. Conclusion

This specification ensures that Native Authentication can be enhanced with advanced flow capabilities while maintaining complete backward compatibility with existing GA scenarios. The configuration-driven approach for capabilities, combined with comprehensive redirect response support across all 11 native authentication endpoints, provides complete coverage for capability-based flow decisions.

The implementation leverages existing patterns and infrastructure, with capabilities configured once at the application level as string arrays and automatically converted to whitespace-separated strings in all relevant requests. The enhanced redirect response format with descriptive reasons improves the developer experience by providing clear guidance on why redirects occur and what capabilities are needed for native handling.

Key implementation points:
- **Configuration**: Capabilities as `Array<string>` in `CustomAuthConfiguration`
- **Request Formatting**: Array converted to whitespace-separated string for all requests
- **Endpoint Coverage**: All 11 specified endpoints support redirect responses
- **Response Format**: `challenge_type: "redirect"` with descriptive `redirect_reason`
- **Error Integration**: Enhanced `RedirectError` with reason support

This approach minimizes complexity while maximizing functionality and maintaining the high standards of the MSAL Browser SDK.
