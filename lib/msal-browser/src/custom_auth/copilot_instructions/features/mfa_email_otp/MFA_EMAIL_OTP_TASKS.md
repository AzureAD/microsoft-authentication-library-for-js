# MFA EMAIL OTP Implementation Tasks

## Task 1: Core MFA Auth Flow Foundation (Network Layer)

**Justification**: This task creates the foundational network layer components needed for MFA flows. According to the feature requirements, a new `/oauth2/introspect` endpoint needs to be added to SignInApiClient, and the network layer must be implemented before interaction clients can use it.

**Changes Required**:

-   Add new API endpoint and request/response types for MFA introspect operation
-   Extend SignInApiClient with introspect method to get available authentication methods
-   Add new types for authentication methods and MFA-related API responses

**Files to Create/Modify**:

**Modify** `/core/network_client/custom_auth_api/CustomAuthApiEndpoint.ts`:

-   Add `SIGNIN_INTROSPECT` endpoint constant for the `/oauth2/v2.0/introspect` API

**Modify** `/core/network_client/custom_auth_api/types/ApiRequestTypes.ts`:

-   Add `SignInIntrospectRequest` interface with `client_id` and `continuation_token` properties

**Modify** `/core/network_client/custom_auth_api/types/ApiResponseTypes.ts`:

-   Add `AuthenticationMethod` interface with `id`, `challenge_type`, `challenge_channel`, and `login_hint` properties
-   Add `SignInIntrospectResponse` interface with `continuation_token` and `methods` properties

**Modify** `lib/msal-browser/src/custom_auth/core/network_client/custom_auth_api/SignInApiClient.ts`:

-   Add `requestAuthMethods()` method (following the existing naming pattern like `requestChallenge()`, `requestTokensWithPassword()`) that calls the `/oauth2/v2.0/introspect` endpoint
-   Method should validate continuation token and return authentication methods

## Task 2: MFA Interaction Client

**Justification**: The sample code shows that MFA operations need their own interaction client to handle MFA-specific API calls and state transitions. This follows the existing pattern where each flow has its own interaction client. This task must be completed before Task 3 since MFA states depend on the MFA client.

**Changes Required**:

-   Create MFA interaction client that follows the same patterns as existing SignInClient, SignUpClient, etc.
-   Implement methods for requesting challenges, submitting challenges, and getting auth methods
-   Handle communication with the MFA API endpoints through the network layer
-   Define result types for MFA operations following the established patterns

**Files to Create/Modify**:

**Create** `/core/interaction_client/mfa/MfaClient.ts`:

-   Create `MfaClient` class extending `CustomAuthInteractionClientBase`
-   Add `requestChallenge(params?: MfaRequestChallengeParams)` method that calls SignInApiClient.requestChallenge - Returns `MfaVerificationRequiredResult | MfaMethodSelectionRequiredResult`
-   Add `submitChallenge(params: MfaSubmitChallengeParams)` method that calls SignInApiClient.requestTokensWithOob - Returns `MfaCompletedResult`
-   Add `getAuthMethods(params: MfaGetAuthMethodsParams)` method that calls SignInApiClient.requestAuthMethods - Returns `MfaGetAuthMethodsResult`
-   Handle API responses and return appropriate result objects using factory functions

**Create** `/core/interaction_client/mfa/parameter/MfaClientParameters.ts`:

-   Define `MfaRequestChallengeParams` interface with optional `authMethodId?: string`, `continuationToken: string`, `correlationId: string`
-   Define `MfaSubmitChallengeParams` interface with `challenge: string`, `continuationToken: string`, `correlationId: string`, `scopes?: string[]`
-   Define `MfaGetAuthMethodsParams` interface with `continuationToken: string`, `correlationId: string`

**Create** `/core/interaction_client/mfa/result/MfaActionResult.ts`:

-   Define base `MfaActionResult` interface with `type: string`, `correlationId: string` properties
-   Define `MfaContinuationTokenResult` interface extending `MfaActionResult` with `continuationToken: string`
-   Define `MfaVerificationRequiredResult` interface extending `MfaContinuationTokenResult` with `type: typeof MFA_VERIFICATION_REQUIRED_RESULT_TYPE`, `challengeChannel: string`, `challengeTargetLabel: string`, `codeLength: number`, `bindingMethod: string`
-   Define `MfaMethodSelectionRequiredResult` interface extending `MfaContinuationTokenResult` with `type: typeof MFA_METHOD_SELECTION_REQUIRED_RESULT_TYPE`, `authMethods: AuthenticationMethod[]`
-   Define `MfaCompletedResult` interface extending `MfaActionResult` with `type: typeof MFA_COMPLETED_RESULT_TYPE`, `authenticationResult: AuthenticationResult`
-   Define `MfaGetAuthMethodsResult` interface extending `MfaContinuationTokenResult` with `type: typeof MFA_GET_AUTH_METHODS_RESULT_TYPE`, `authMethods: AuthenticationMethod[]`
-   Export result type constants: `MFA_VERIFICATION_REQUIRED_RESULT_TYPE = "MfaVerificationRequiredResult"`, `MFA_METHOD_SELECTION_REQUIRED_RESULT_TYPE = "MfaMethodSelectionRequiredResult"`, `MFA_COMPLETED_RESULT_TYPE = "MfaCompletedResult"`, `MFA_GET_AUTH_METHODS_RESULT_TYPE = "MfaGetAuthMethodsResult"`
-   Create factory functions: `createMfaVerificationRequiredResult()`, `createMfaMethodSelectionRequiredResult()`, `createMfaCompletedResult()`, `createMfaGetAuthMethodsResult()`

## Task 3: Update SignInClient to Handle MFA Required Response

**Justification**: According to the design document, MFA is detected when the `/token` endpoint returns an "mfa_required" suberror. The SignInClient needs to be updated to catch this specific suberror and return an MFA-awaiting result instead of throwing an error. This ensures the sign-in flow can transition to MFA states when required.

**Changes Required**:

-   Add MFA_REQUIRED suberror code to API suberror codes
-   Create SignInMfaRequiredResult type for the SignInClient to return
-   Update performTokenRequest method to catch mfa_required suberrors and return appropriate result
-   Import and use MFA result types from the interaction client layer

**Files to Create/Modify**:

**Modify** `/core/network_client/custom_auth_api/types/ApiSuberrors.ts`:

-   Add `MFA_REQUIRED = "mfa_required"` constant to match the API suberror response

**Modify** `/sign_in/interaction_client/result/SignInActionResult.ts`:

-   Add `SignInMfaRequiredResult` interface extending `SignInContinuationTokenResult` with `type: typeof SIGN_IN_MFA_REQUIRED_RESULT_TYPE`
-   Export `SIGN_IN_MFA_REQUIRED_RESULT_TYPE = "SignInMfaRequiredResult"` constant
-   Create `createSignInMfaRequiredResult()` factory function

**Modify** `/sign_in/interaction_client/SignInClient.ts`:

-   Update `submitPassword()` method return type to include `SignInMfaRequiredResult`: `Promise<SignInCompletedResult | SignInMfaRequiredResult>`
-   Update `submitCode()` method return type to include `SignInMfaRequiredResult`: `Promise<SignInCompletedResult | SignInMfaRequiredResult>`
-   Update `performTokenRequest()` method to catch `CustomAuthApiError` with `MFA_REQUIRED` suberror code
-   When MFA_REQUIRED suberror is caught, return `createSignInMfaRequiredResult()` with continuation token from the error response
-   Add try-catch block around `tokenEndpointCaller()` to handle MFA required scenarios by checking the suberror field

## Task 4: Core MFA Auth Flow States and Results

**Justification**: The sample code shows new MFA states and results that are needed for the state machine pattern. These must be placed in the `core/auth_flow` folder as they are shared across flows. MFA states will need MFA interaction client, so this task depends on Task 2.

**Changes Required**:

-   Create new MFA-specific auth flow states, results, and error types
-   Follow the existing pattern used by other flows but place in core for reusability
-   Create abstract base state for shared MFA methods
-   Implement state machine transitions and methods as shown in sample code

**Files to Create/Modify**:

**Create** `/core/auth_flow/mfa/state/MfaState.ts`:

-   Create base `MfaState` class extending `AuthFlowState` with common MFA state parameters

**Create** `/core/auth_flow/mfa/state/MfaStateParameters.ts`:

-   Define `MfaStateParameters` interface with common MFA state properties like username, continuation token, correlation ID, logger, config, mfaClient

**Create** `/core/auth_flow/mfa/state/MfaAwaitingState.ts`:

-   Create `MfaAwaitingState` class extending `AuthFlowStateBase` (like `SignInCompletedState`, `SignInFailedState`)
-   Add `requestChallenge()` method to initiate MFA challenge using MFA client

**Create** `/core/auth_flow/mfa/state/MfaRequiredState.ts`:

-   Create abstract base state with shared methods: `submitChallenge()`, `getAuthMethods()`, `requestChallenge()`
-   Contains common logic for both verification and method selection states

**Create** `/core/auth_flow/mfa/state/MfaVerificationRequiredState.ts`:

-   Create `MfaVerificationRequiredState` class extending `MfaRequiredState`
-   Add specific methods: `getCodeLength()`, `getChannel()`, `sentTo()`

**Create** `/core/auth_flow/mfa/state/MfaMethodSelectionRequiredState.ts`:

-   Create `MfaMethodSelectionRequiredState` class extending `MfaRequiredState`
-   Add `getAuthMethods()` method that returns pre-fetched methods

**Create** `/core/auth_flow/mfa/state/MfaCompletedState.ts`:

-   Create `MfaCompletedState` class extending `AuthFlowStateBase` (like `SignInCompletedState`)

**Create** `/core/auth_flow/mfa/state/MfaFailedState.ts`:

-   Create `MfaFailedState` class extending `AuthFlowStateBase` (like `SignInFailedState`)

**Create** `/core/auth_flow/mfa/result/MfaRequestChallengeResult.ts`:

-   Create result class with `isVerificationRequired()`, `isMethodSelectionRequired()`, and `isFailed()` methods

**Create** `/core/auth_flow/mfa/result/MfaSubmitChallengeResult.ts`:

-   Create result class with `isCompleted()` and `isFailed()` methods
-   Include `CustomAuthAccountData` as data type when completed (like `SignInSubmitPasswordResult`)

**Create** `/core/auth_flow/mfa/result/MfaGetAuthMethodsResult.ts`:

-   Create result class for getting authentication methods with `isSuccessful()` and `isFailed()` methods

**Create** `/core/auth_flow/mfa/error_type/MfaError.ts`:

-   Create MFA error classes: `MfaError`, `MfaRequestChallengeError`, `MfaSubmitChallengeError`, `MfaGetAuthMethodsError`
-   Add helper methods for common MFA errors like `isInvalidChallenge()`, `isRedirectRequired()`

## Task 5: Integrate MFA Client into Factory and Controller

**Justification**: The MFA interaction client needs to be integrated into the existing infrastructure so it can be created and used by the controller layer. This follows the established pattern for other clients. Additionally, the controller's signIn method needs to handle the new MFA required result from the SignInClient.

**Changes Required**:

-   Use existing `create()` method in CustomAuthInterationClientFactory to support MFA client creation
-   Ensure MFA client can be injected into sign-in states that need MFA functionality
-   Update controller to handle MFA client creation and injection
-   Update controller's signIn method to handle SignInMfaRequiredResult and create MfaAwaitingState

**Files to Create/Modify**:

**Modify** `lib/msal-browser/src/custom_auth/controller/CustomAuthStandardController.ts`:

-   Create MFA client instance using `interactionClientFactory.create(MfaClient)`
-   Inject MFA client into sign-in states that need MFA functionality
-   Handle MFA flow delegation in sign-in operations
-   Update `signIn()` method to check for `SIGN_IN_MFA_REQUIRED_RESULT_TYPE` from SignInClient results
-   When MFA is required, create and return `SignInResult` with `MfaAwaitingState` instead of throwing error
-   Import `SIGN_IN_MFA_REQUIRED_RESULT_TYPE` and MFA state classes

**Modify** `/sign_in/auth_flow/state/SignInStateParameters.ts`:

-   Add `mfaClient` property to state parameters for states that need MFA functionality

## Task 6: Extend SignIn Flow to Support MFA States

**Justification**: The sample code shows that SignInResult and SignInSubmitPasswordResult need new methods like `isMfaRequired()` to handle MFA transitions. The existing sign-in flow needs to be extended to support MFA states without breaking existing functionality.

**Changes Required**:

-   Add MFA state to SignInResult possible states
-   Add MFA checking methods to result classes
-   Update state transitions to handle MFA scenarios
-   Ensure MFA states can be returned from password submission
-   Use the existing `MfaAwaitingState` from Task 4 instead of creating a sign-in specific one

**Files to Create/Modify**:

**Modify** `lib/msal-browser/src/custom_auth/sign_in/auth_flow/result/SignInResult.ts`:

-   Add `MfaAwaitingState` to `SignInResultState` type union
-   Add `isMfaRequired()` method that checks if state is `MfaAwaitingState`

**Modify** `lib/msal-browser/src/custom_auth/sign_in/auth_flow/result/SignInSubmitPasswordResult.ts`:

-   Add `MfaAwaitingState` to possible result states
-   Add `isMfaRequired()` method to check for MFA requirement after password submission

**Modify** `lib/msal-browser/src/custom_auth/sign_in/auth_flow/state/SignInPasswordRequiredState.ts`:

-   Update `submitPassword()` method to handle MFA required responses from the API
-   Return `SignInSubmitPasswordResult` with `MfaAwaitingState` when MFA is required
-   Inject `MfaClient` through state parameters for MFA operations

## Task 7: Update Type Exports and Public API

**Justification**: The new MFA types, states, and results need to be exported from the main module so consumers can use them. The sample code shows these types being imported and used by consumers.

**Changes Required**:

-   Export all new MFA types from the main custom_auth/index.ts file
-   Follow the existing export pattern in the index.ts file
-   Ensure proper TypeScript module structure

**Files to Create/Modify**:

**Modify** `/index.ts`:

-   Add MFA state exports following the existing pattern:

    ```typescript
    // MFA State
    export { MfaAwaitingState } from "./core/auth_flow/mfa/state/MfaAwaitingState.js";
    export { MfaVerificationRequiredState } from "./core/auth_flow/mfa/state/MfaVerificationRequiredState.js";
    export { MfaMethodSelectionRequiredState } from "./core/auth_flow/mfa/state/MfaMethodSelectionRequiredState.js";
    export { MfaCompletedState } from "./core/auth_flow/mfa/state/MfaCompletedState.js";
    export { MfaFailedState } from "./core/auth_flow/mfa/state/MfaFailedState.js";

    // MFA Results
    export { MfaRequestChallengeResult } from "./core/auth_flow/mfa/result/MfaRequestChallengeResult.js";
    export { MfaSubmitChallengeResult } from "./core/auth_flow/mfa/result/MfaSubmitChallengeResult.js";
    export { MfaGetAuthMethodsResult } from "./core/auth_flow/mfa/result/MfaGetAuthMethodsResult.js";

    // MFA Errors
    export {
        MfaRequestChallengeError,
        MfaSubmitChallengeError,
        MfaGetAuthMethodsError,
    } from "./core/auth_flow/mfa/error_type/MfaError.js";
    ```
