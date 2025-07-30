# Implementation Plan

-   [x] 1. Implement network client layer
-   [x] 1.1 Add required constants and types

    -   Add REGISTRATION_REQUIRED constant to `lib/msal-browser/src/custom_auth/core/network_client/custom_auth_api/types/ApiSuberrors.ts`
    -   Add new API endpoint constants for register endpoints to `lib/msal-browser/src/custom_auth/core/network_client/custom_auth_api/CustomAuthApiEndpoint.ts`
    -   Add JIT-specific PublicApiId constants to `lib/msal-browser/src/custom_auth/core/telemetry/PublicApiId.ts`
    -   _Requirements: 1.1, 7.1_

-   [x] 1.2 Define API request and response types

    -   Create RegisterIntrospectRequest/Response interfaces in `lib/msal-browser/src/custom_auth/core/network_client/custom_auth_api/types/ApiRequestTypes.ts`
    -   Create RegisterChallengeRequest/Response interfaces in `lib/msal-browser/src/custom_auth/core/network_client/custom_auth_api/types/ApiRequestTypes.ts`
    -   Create RegisterContinueRequest/Response interfaces in `lib/msal-browser/src/custom_auth/core/network_client/custom_auth_api/types/ApiRequestTypes.ts`
    -   Add corresponding response types in `lib/msal-browser/src/custom_auth/core/network_client/custom_auth_api/types/ApiResponseTypes.ts`
    -   Add type validation and ensure proper inheritance from base types
    -   _Requirements: 1.1, 1.2, 6.1_

-   [x] 1.3 Create RegisterApiClient for JIT endpoints

    -   Implement RegisterApiClient extending BaseApiClient in `lib/msal-browser/src/custom_auth/core/network_client/custom_auth_api/RegisterApiClient.ts`
    -   Add introspect method for /register/v1.0/introspect endpoint
    -   Add challenge method for /register/v1.0/challenge endpoint
    -   Add continue method for /register/v1.0/continue endpoint (supports both grant_type=continuation_token for fast-pass and grant_type=oob for normal verification)
    -   Create unit tests in `test/custom_auth/core/network_client/custom_auth_api/RegisterApiClient.spec.ts`
    -   _Requirements: 1.1, 1.2, 7.1_

-   [x] 1.4 Update CustomAuthApiClient to include RegisterApiClient

    -   Add registerApi property to `lib/msal-browser/src/custom_auth/core/network_client/custom_auth_api/ICustomAuthApiClient.ts`
    -   Update CustomAuthApiClient constructor in `lib/msal-browser/src/custom_auth/core/network_client/custom_auth_api/CustomAuthApiClient.ts`
    -   Update API client factory patterns to include register client
    -   _Requirements: 7.1_

-   [x] 2. Implement interaction client layer
-   [x] 2.1 Define JIT client parameter interfaces

    -   Create JitGetAuthMethodsParams interface in `lib/msal-browser/src/custom_auth/core/interaction_client/jit/parameter/JitParams.ts`
    -   Create JitChallengeAuthMethodParams interface in `lib/msal-browser/src/custom_auth/core/interaction_client/jit/parameter/JitParams.ts`
    -   Create JitSubmitChallengeParams interface in `lib/msal-browser/src/custom_auth/core/interaction_client/jit/parameter/JitParams.ts`
    -   Add parameter validation and type safety
    -   _Requirements: 1.1, 1.2, 5.1_

-   [x] 2.2 Create JIT action result types

    -   Implement JitGetAuthMethodsResult with factory methods in `lib/msal-browser/src/custom_auth/core/interaction_client/jit/result/JitActionResult.ts`
    -   Implement JitVerificationRequiredResult with factory methods in `lib/msal-browser/src/custom_auth/core/interaction_client/jit/result/JitActionResult.ts`
    -   Implement JitCompletedResult with factory methods in `lib/msal-browser/src/custom_auth/core/interaction_client/jit/result/JitActionResult.ts`
    -   Add result type constants and helper methods
    -   Create unit tests in `test/custom_auth/core/interaction_client/jit/result/JitActionResult.spec.ts`
    -   _Requirements: 4.1, 4.2, 4.3, 7.1_

-   [x] 2.3 Create JitClient for orchestrating JIT flows

    -   ✅ Implement JitClient extending CustomAuthInteractionClientBase in `lib/msal-browser/src/custom_auth/core/interaction_client/jit/JitClient.ts`
    -   ✅ Add getAuthMethods method calling register/introspect endpoint
    -   ✅ Add challengeAuthMethod method with fast-pass scenario handling (calls /register/v1.0/continue with grant_type=continuation_token when challenge_type is "preverified")
    -   ✅ Add submitChallenge method integrating with /register/v1.0/continue (with configurable grant_type) and token endpoint
    -   ✅ Create unit tests in `test/custom_auth/core/interaction_client/jit/JitClient.spec.ts`
    -   _Requirements: 1.1, 1.2, 1.3, 7.1, 7.2, 7.3_

-   [x] 3. Implement JIT auth flow state machine and components
-   [x] 3.1 Create JIT state parameter interfaces

    -   ✅ Create JitStateParameters interface in `lib/msal-browser/src/custom_auth/core/auth_flow/jit/state/JitStateParameters.ts`
    -   ✅ Add AuthMethodRegistrationStateParameters extending AuthFlowActionRequiredStateParameters
    -   ✅ Add AuthMethodRegistrationRequiredStateParameters with authMethods array
    -   ✅ Add AuthMethodVerificationRequiredStateParameters with challenge details (channel, target, code length)
    -   ✅ Add proper type definitions and parameter validation
    -   _Requirements: 4.1, 6.1, 6.2, 6.3, 7.1_

-   [x] 3.2 Create AuthMethodDetails interface

    -   ✅ Create AuthMethodDetails interface in `lib/msal-browser/src/custom_auth/core/auth_flow/jit/AuthMethodDetails.ts`
    -   ✅ Add authMethodType, verificationContact properties
    -   ✅ Add proper type definitions and optional field handling
    -   ✅ Ensure compatibility with existing AuthenticationMethod interface
    -   _Requirements: 6.1, 6.2, 6.3_

-   [x] 3.3 Implement JIT error types

    -   ✅ Create AuthMethodRegistrationChallengeMethodError in `lib/msal-browser/src/custom_auth/core/auth_flow/jit/error_type/JitError.ts`
    -   ✅ Create AuthMethodRegistrationSubmitChallengeError extending base error class
    -   ✅ Add isRedirectRequired and isIncorrectVerificationContact helper methods
    -   ✅ Add isIncorrectChallenge method for challenge submission errors
    -   ✅ Follow existing MFA error patterns from `core/auth_flow/mfa/error_type/MfaError.ts`
    -   ✅ Create unit tests in `test/custom_auth/core/auth_flow/jit/error_type/JitError.spec.ts`
    -   _Requirements: 5.1, 5.2, 5.3, 5.4_

-   [x] 3.4 Implement JIT state machine core components
    -   ✅ Implement AuthMethodRegistrationCompletedState in `lib/msal-browser/src/custom_auth/core/auth_flow/jit/state/AuthMethodRegistrationCompletedState.ts`
    -   ✅ Implement AuthMethodRegistrationFailedState in `lib/msal-browser/src/custom_auth/core/auth_flow/jit/state/AuthMethodRegistrationFailedState.ts`
    -   ✅ Follow existing MFA completion/failure state patterns from `core/auth_flow/mfa/state/MfaCompletedState.ts` and `core/auth_flow/mfa/state/MfaFailedState.ts`
    -   ✅ Add proper state parameter interfaces
    -   ✅ Implement AuthMethodRegistrationChallengeMethodResult in `lib/msal-browser/src/custom_auth/core/auth_flow/jit/result/AuthMethodRegistrationChallengeMethodResult.ts`
    -   ✅ Implement AuthMethodRegistrationSubmitChallengeResult in `lib/msal-browser/src/custom_auth/core/auth_flow/jit/result/AuthMethodRegistrationSubmitChallengeResult.ts`
    -   ✅ Add createWithError static methods following existing patterns
    -   ✅ Add result type checking methods (isVerificationRequired, isCompleted)
    -   ✅ Follow existing MFA result patterns from `core/auth_flow/mfa/result/`
    -   ✅ Create abstract JitState base class in `lib/msal-browser/src/custom_auth/core/auth_flow/jit/state/JitState.ts`
    -   ✅ Implement AuthMethodRegistrationRequiredState extending JitState with getAuthMethods and challengeAuthMethod methods
    -   ✅ Implement AuthMethodVerificationRequiredState extending JitState with submitChallenge, challengeAuthMethod methods and getter methods for challenge details
    -   ✅ Follow existing MFA state patterns from `core/auth_flow/mfa/state/MfaState.ts` (multiple state classes in single file)
    -   ✅ Add proper state transitions to completion or failure states (from Step 1)
    -   ✅ Add parameter validation and error handling throughout
    -   ✅ Create base unit tests in `test/custom_auth/core/auth_flow/jit/state/JitState.spec.ts`
    -   _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3, 3.4, 4.1, 6.1, 7.1_

-   [x] 4. Integrate with existing sign-in flows
-   [x] 4.1 Update SignInClient for JIT error handling

    -   Modify performTokenRequest in `lib/msal-browser/src/custom_auth/sign_in/interaction_client/SignInClient.ts`
    -   Create SignInJitRequiredResult type in `lib/msal-browser/src/custom_auth/sign_in/interaction_client/result/SignInActionResult.ts`
    -   Update submitPassword and signInWithContinuationToken methods
    -   Create unit tests in `test/custom_auth/sign_in/interaction_client/SignInClient.spec.ts`
    -   _Requirements: 2.1, 2.2, 2.3, 4.4_

-   [x] 4.2 Update SignInResult types

    -   Add AuthMethodRegistrationRequiredState to possible states in `lib/msal-browser/src/custom_auth/sign_in/auth_flow/result/SignInResult.ts`
    -   Update SignInResult.isAuthMethodRegistrationRequired method
    -   Add AuthMethodRegistrationRequiredState to possible states in `lib/msal-browser/src/custom_auth/sign_in/auth_flow/result/SignInSubmitPasswordResult.ts`
    -   Update SignInSubmitPasswordResult.isAuthMethodRegistrationRequired method in `lib/msal-browser/src/custom_auth/sign_in/auth_flow/result/SignInSubmitPasswordResult.ts`
    -   Add proper type checking and state validation
    -   _Requirements: 2.1, 2.2, 2.3, 3.1_

-   [x] 4.3 Update SignInStateParameters

    -   Add jitClient to SignInStateParameters interface in `lib/msal-browser/src/custom_auth/sign_in/auth_flow/state/SignInStateParameters.ts`
    -   Update state parameter passing in sign-in flow
    -   Ensure proper dependency injection for JIT client
    -   _Requirements: 2.1, 2.2, 2.3, 6.1_

-   [x] 5. Update controller and public API
-   [x] 5.1 Update CustomAuthStandardController

    -   Add jitClient initialization in constructor in `lib/msal-browser/src/custom_auth/controller/CustomAuthStandardController.ts`
    -   Update signIn method to handle JIT required results
    -   Add proper state creation for AuthMethodRegistrationRequiredState
    -   Create integration tests in `test/custom_auth/controller/CustomAuthStandardController.spec.ts`
    -   _Requirements: 2.1, 2.2, 2.3, 3.1, 6.1_

-   [x] 5.2 Update SignInPasswordRequiredState for JIT integration

    -   Update submitPassword method in `lib/msal-browser/src/custom_auth/sign_in/auth_flow/state/SignInPasswordRequiredState.ts` to handle SIGN_IN_JIT_REQUIRED_RESULT_TYPE
    -   Add logic to check submitPasswordResult.type for JIT scenarios and return AuthMethodRegistrationRequiredState when needed
    -   Add JIT client to SignInPasswordRequiredStateParameters if not already present
    -   Update unit tests in `test/custom_auth/sign_in/auth_flow/state/SignInPasswordRequiredState.spec.ts` to test JIT scenarios
    -   _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 3.1, 7.1_

-   [x] 5.3 Update SignInContinuationState for proper JIT integration

    -   Update signIn method in `lib/msal-browser/src/custom_auth/sign_in/auth_flow/state/SignInContinuationState.ts` to properly handle JIT scenarios instead of throwing error
    -   Replace current error throwing with proper state creation for AuthMethodRegistrationRequiredState
    -   Ensure continuation token scenarios from sign-up and SSPR properly support JIT flow
    -   Update unit tests in `test/custom_auth/sign_in/auth_flow/state/SignInContinuationState.spec.ts` to test JIT scenarios
    -   _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 3.1, 7.1_

-   [x] 5.4 Update additional state scenarios for comprehensive JIT support

    -   Review and update ResetPasswordPasswordRequiredState.submitNewPassword in `lib/msal-browser/src/custom_auth/reset_password/auth_flow/state/ResetPasswordPasswordRequiredState.ts` if JIT can be triggered during SSPR completion
    -   Review and update SignUpPasswordRequiredState.submitPassword in `lib/msal-browser/src/custom_auth/sign_up/auth_flow/state/SignUpPasswordRequiredState.ts` if JIT scenarios can occur during sign-up password submission
    -   Review other scenarios like SignUpCompletedState.signIn and ResetPasswordCompletedState.signIn that use continuation tokens
    -   Add appropriate error handling and JIT client integration where needed
    -   Create targeted unit tests for any updated scenarios
    -   _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 3.1, 7.1_

-   [x] 6. Final integration and testing
-   [x] 6.1 Integration testing

    -   Update the integration tests to support JIT scenario in sign-in, sign-up, sspr.
    -   Test complete JIT flow from sign-in to completion
    -   Test complete JIT flow during the sign in with continuation token after sign-up and sspr
    -   Verify fast-pass scenario works correctly (challenge_type="preverified" → /register/v1.0/continue with grant_type=continuation_token → token endpoint)
    -   _Requirements: 1.1, 1.2, 1.3, 7.1, 7.2, 7.3_

-   [x] 6.2 Performance and security validation

    -   Verify no memory leaks or performance regressions
    -   Validate proper cleanup of sensitive data
    -   Test continuation token security and expiration
    -   Ensure no reduction in security posture
    -   _Requirements: 4.5, 6.1_
