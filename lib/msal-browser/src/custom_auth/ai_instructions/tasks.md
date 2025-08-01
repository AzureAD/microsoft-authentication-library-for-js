# Implementation Tasks for Backward Compatibility Requirements

This document outlines the specific implementation tasks required to add backward compatibility support for the Native Authentication feature, including capabilities configuration, redirect response support, and enhanced error handling.

## Overview

Based on the `backward_compatibility_requirement.md` specification, this implementation adds three core features:
1. Optional "capabilities" parameter in configuration
2. Redirect response support for all 11 native auth endpoints
3. Enhanced "redirect_reason" parameter for better error context

## Task Categories

### Phase 1: Configuration and Type Definitions
### Phase 2: Request Processing and API Integration  
### Phase 3: Testing and Validation

---

## Phase 1: Configuration and Type Definitions

### Task 1.1: Enhance CustomAuthConfiguration Types ✅ COMPLETED
**File:** `lib/msal-browser/src/custom_auth/configuration/CustomAuthConfiguration.ts`
**Priority:** High
**Dependencies:** None
**Status:** ✅ COMPLETED

**Changes Made:**
```typescript
export type CustomAuthOptions = {
    challengeTypes?: Array<string>;
    authApiProxyUrl: string;
    capabilities?: Array<string>; // NEW: Optional capabilities parameter
};
```

### Task 1.2: Create Native Auth Capabilities Constants ✅ COMPLETED
**File:** `lib/msal-browser/src/custom_auth/CustomAuthConstants.ts`
**Priority:** High
**Dependencies:** None
**Status:** ✅ COMPLETED

**Changes Made:**
```typescript
export const NATIVE_AUTH_CAPABILITIES = {
    MFA_REQUIRED: "mfa_required",
    REGISTRATION_REQUIRED: "registration_required",
} as const;

export type NativeAuthCapability =
    (typeof NATIVE_AUTH_CAPABILITIES)[keyof typeof NATIVE_AUTH_CAPABILITIES];
```

### Task 1.3: Enhance Existing CustomAuthConfiguration Validation ✅ COMPLETED
**File:** `lib/msal-browser/src/custom_auth/CustomAuthPublicClientApplication.ts`
**Priority:** Medium
**Dependencies:** Task 1.1, Task 1.2
**Status:** ✅ COMPLETED

**Changes Made:**
Extended the existing `validateConfig` method to include capabilities validation following the same pattern as challengeTypes:

```typescript
// Added import for capabilities constants
import { NATIVE_AUTH_CAPABILITIES, NativeAuthCapability } from "./CustomAuthConstants.js";

// Extended the existing validateConfig method
const capabilities = config.customAuth.capabilities;

if (!!capabilities && capabilities.length > 0) {
    capabilities.forEach((capability) => {
        if (
            capability !== NATIVE_AUTH_CAPABILITIES.MFA_REQUIRED &&
            capability !== NATIVE_AUTH_CAPABILITIES.REGISTRATION_REQUIRED
        ) {
            throw new InvalidConfigurationError(
                "InvalidCapabilities",
                `Capability ${capability} in the configuration is not valid. Supported capabilities are ${Object.values(
                    NATIVE_AUTH_CAPABILITIES
                )}`
            );
        }
    });
}
```

### Task 1.4: Update Request Types with Capabilities ✅ COMPLETED
**File:** `lib/msal-browser/src/custom_auth/core/network_client/custom_auth_api/types/ApiRequestTypes.ts`
**Priority:** High
**Dependencies:** Task 1.1
**Status:** ✅ COMPLETED

**Changes Made:**
```typescript
// ✅ ALL COMPLETED - All start/initiate request types updated
export interface SignInInitiateRequest extends ApiRequestBase {
    challenge_type: string;
    username: string;
    capabilities?: string; // NEW: Optional capabilities parameter
}

export interface SignUpStartRequest extends ApiRequestBase {
    username: string;
    challenge_type: string;
    password?: string;
    attributes?: Record<string, string>;
    capabilities?: string; // NEW: Optional capabilities parameter
}

export interface ResetPasswordStartRequest extends ApiRequestBase {
    challenge_type: string;
    username: string;
    capabilities?: string; // NEW: Optional capabilities parameter
}
```

---

## Phase 2: Request Processing and API Integration

### Task 2.1: Enhance RedirectError Class ✅ COMPLETED
**File:** `lib/msal-browser/src/custom_auth/core/error/CustomAuthApiError.ts`
**Priority:** High
**Dependencies:** None
**Status:** ✅ COMPLETED

**Changes Required:**
```typescript
// Update existing RedirectError constructor
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

### Task 2.2: Add Capabilities Method to CustomAuthInteractionClientBase ✅ COMPLETED
**File:** `lib/msal-browser/src/custom_auth/core/interaction_client/CustomAuthInteractionClientBase.ts`
**Priority:** High
**Dependencies:** Task 1.1
**Status:** ✅ COMPLETED

**Changes Made:**
```typescript
// Add new method similar to existing getChallengeTypes()
protected getCapabilities(
    configuredCapabilities: string[] | undefined
): string | undefined {
    if (!configuredCapabilities || configuredCapabilities.length === 0) {
        return undefined;
    }
    return configuredCapabilities.join(" ");
}
```

**Benefits:**
- Reuses existing pattern (getChallengeTypes())
- Available to all interaction clients via inheritance
- No new file needed
- Consistent with current architecture

### Task 2.3: Update BaseApiClient for Redirect Processing ✅ COMPLETED
**File:** `lib/msal-browser/src/custom_auth/core/network_client/custom_auth_api/BaseApiClient.ts`
**Priority:** High
**Dependencies:** Task 2.1, Task 1.3
**Status:** ✅ COMPLETED

**Changes Made:**
```typescript
// Updated existing error processing logic
if (responseError.error === "redirect") {
    throw new RedirectError(correlationId, responseError.redirect_reason);
}

// Also handle challenge_type: "redirect" format
if (responseData.challenge_type === ChallengeType.REDIRECT) {
    throw new RedirectError(correlationId, responseData.redirect_reason);
}
```

### Task 2.4: Update Interaction Clients with Capabilities Processing ✅ COMPLETED
**Files:**
- `lib/msal-browser/src/custom_auth/sign_in/interaction_client/SignInClient.ts` ✅
- `lib/msal-browser/src/custom_auth/sign_up/interaction_client/SignUpClient.ts` ✅
- `lib/msal-browser/src/custom_auth/reset_password/interaction_client/ResetPasswordClient.ts` ✅
**Priority:** High
**Dependencies:** Task 2.2
**Status:** ✅ COMPLETED

**Changes Made:**
```typescript
// Updated SignInClient initiate method to use inherited getCapabilities() method
capabilities: this.getCapabilities(
    (this.config as CustomAuthBrowserConfiguration).customAuth.capabilities
),
```

**Benefits:**
- Uses inherited `getCapabilities()` method from CustomAuthInteractionClientBase
- No additional imports needed
- Consistent with existing `getChallengeTypes()` usage pattern

### Task 2.5: Consolidate Redirect Error Handling in AuthActionErrorBase ✅ COMPLETED
**File:** `lib/msal-browser/src/custom_auth/core/auth_flow/AuthFlowErrorBase.ts`
**Priority:** Medium
**Dependencies:** Task 2.1
**Status:** ✅ COMPLETED

**Changes Made:**
```typescript
// Added to AuthActionErrorBase class
export abstract class AuthActionErrorBase extends AuthFlowErrorBase {
    /**
     * Checks if the error is due to the expired continuation token.
     */
    isTokenExpired(): boolean {
        return this.isTokenExpiredError();
    }

    /**
     * Check if client app supports the challenge type configured in Entra.
     * @returns {boolean} True if client app doesn't support the challenge type configured in Entra, "loginPopup" function is required to continue the operation.
     */
    isRedirectRequired(): boolean {
        return this.isRedirectError();
    }
}
```

**Impact on Flow Error Files:**
- **Removed** individual `isRedirectRequired()` methods from ResetPasswordError classes
- All flow errors inherit this functionality automatically from AuthActionErrorBase
- Reduces code duplication and centralizes redirect handling logic

**Benefits:**
- Single source of truth for redirect error handling
- Consistent behavior across all flows
- Easier maintenance and testing
- Follows DRY principle

---

## Phase 3: Testing and Validation

### Task 3.1: Create Capabilities Method Tests 🔄 PENDING
**File:** `lib/msal-browser/test/custom_auth/core/interaction_client/CustomAuthInteractionClientBase.spec.ts`
**Priority:** High
**Dependencies:** Task 2.2
**Status:** 🔄 PENDING

**Description:** Test the new `getCapabilities()` method in CustomAuthInteractionClientBase

### Task 3.2: Create RedirectError Enhancement Tests 🔄 PENDING
**File:** `lib/msal-browser/test/custom_auth/core/error/CustomAuthApiError.spec.ts`
**Priority:** High
**Dependencies:** Task 2.1
**Status:** 🔄 PENDING

### Task 3.3: Create Configuration Integration Tests 🔄 PENDING
**File:** `lib/msal-browser/test/custom_auth/configuration/CustomAuthConfiguration.spec.ts`
**Priority:** High
**Dependencies:** Task 1.1
**Status:** 🔄 PENDING

### Task 3.4: Create Endpoint Redirect Response Tests 🔄 PENDING
**File:** Multiple test files for each endpoint
**Priority:** High
**Dependencies:** All implementation tasks
**Status:** 🔄 PENDING

### Task 3.5: Create Backward Compatibility Tests 🔄 PENDING
**File:** `lib/msal-browser/test/custom_auth/backward_compatibility.spec.ts` (new file)
**Priority:** High
**Dependencies:** All previous tasks
**Status:** 🔄 PENDING

### Task 3.6: Create Integration Tests 🔄 PENDING
**File:** `lib/msal-browser/test/custom_auth/integration/CapabilitiesIntegration.spec.ts` (new file)
**Priority:** Medium
**Dependencies:** All previous tasks
**Status:** 🔄 PENDING

---

## Implementation Progress Summary

### ✅ Completed Tasks (9/12):
- Task 1.1: Enhanced CustomAuthConfiguration Types
- Task 1.2: Created Native Auth Capabilities Constants  
- Task 1.3: Enhanced Existing CustomAuthConfiguration Validation
- Task 1.4: Updated Request Types with Capabilities
- Task 2.1: Enhanced RedirectError Class
- Task 2.2: Added Capabilities Method to CustomAuthInteractionClientBase
- Task 2.3: Updated BaseApiClient for Redirect Processing
- Task 2.4: Updated All Interaction Clients with Capabilities Processing (SignIn, SignUp, ResetPassword)
- Task 2.5: Consolidated Redirect Error Handling in AuthActionErrorBase

### 🔄 Phase 1 Status: ✅ COMPLETED (4/4 tasks)
All Phase 1 tasks have been successfully implemented with proper validation and type safety.

### 🔄 Phase 2 Status: ✅ COMPLETED (5/5 tasks)
All Phase 2 tasks have been successfully implemented with enhanced redirect handling and capabilities support.

### 🔄 Pending Tasks (3/12):
- All Phase 3 tasks (3.1 - 3.6)

### Next Immediate Tasks:
1. **Start Task 3.1**: Create Capabilities Method Tests
2. **Start Task 3.2**: Create RedirectError Enhancement Tests  
3. **Start Task 3.3**: Create Configuration Integration Tests

---

## Critical Path Dependencies

1. **Phase 1** must be completed before Phase 2 can begin
2. **Task 2.2** (Capabilities Utility) is required for Task 2.4 (Interaction Clients)
3. **Task 2.1** (RedirectError) is required for Task 2.3 (BaseApiClient) and Task 2.5 (Error Types)
4. **Phase 2** must be completed before Phase 3 can begin
5. **Phase 3** must be completed before comprehensive testing in Phase 4

---

## Validation Checkpoints

### ✅ Phase 1 Checkpoint (75% Complete):
- [x] Configuration types compile and export correctly
- [x] Constants are properly defined and exported
- [x] RedirectResponse type is defined
- [ ] All request types include capabilities parameter
- [ ] All response types include redirect union

### 🔄 Phase 2 Checkpoint (Not Started):
- [ ] RedirectError enhanced with redirect reason
- [ ] Capabilities utility function created and tested
- [ ] BaseApiClient handles redirect responses
- [ ] Interaction clients process capabilities correctly
- [ ] Error types expose redirect reason access

### 🔄 Phase 3 Checkpoint (Not Started):
- [ ] All API clients handle redirect responses
- [ ] State machine integrates with redirect handling
- [ ] Exports updated with new functionality

### 🔄 Phase 4 Checkpoint (Not Started):
- [ ] All unit tests pass
- [ ] Integration tests validate end-to-end flows
- [ ] Backward compatibility confirmed

### 🔄 Phase 5 Checkpoint (Not Started):
- [ ] Documentation updated
- [ ] Examples created and validated
- [ ] Type definitions exported correctly

---

## Risk Assessment

### 🟡 Medium Risk Areas:
- **Task 1.4 & 1.5**: Type changes affect many consumers
- **Task 2.3**: BaseApiClient changes affect all endpoints
- **Task 2.4**: Interaction client changes affect all flows

### 🟢 Low Risk Areas:
- **Task 1.1, 1.2, 1.3**: Additive changes, fully backward compatible
- **Task 2.2**: Standalone utility function
- **Phase 4 & 5**: Testing and documentation

### ✅ Mitigation Strategies:
- Comprehensive backward compatibility testing after each phase
- Incremental rollout with feature flags if needed
- Extensive unit and integration testing coverage

---

This task file will be updated as implementation progresses, with completed tasks marked and new issues or dependencies documented.
