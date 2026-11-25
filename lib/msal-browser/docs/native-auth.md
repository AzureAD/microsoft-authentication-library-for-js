# Native authentication API navigation

Native authentication for Microsoft Entra External ID lets an application drive supported sign-in experiences in its own UI. It is separate from MSAL Browser's normal redirect/popup flows and from the operating-system broker used by MSAL Node.

The public entry point is `@azure/msal-browser/custom-auth`. Its [export index](../src/custom_auth/index.ts) links to the API declarations, parameter documentation, result types, states, and errors in this repository. Use documentation from the same package version as your application; do not assume every native-authentication export appears in the standard MSAL Browser generated reference.

## Application and configuration

Create the application with the asynchronous [`CustomAuthPublicClientApplication.create`](../src/custom_auth/CustomAuthPublicClientApplication.ts) factory rather than calling its constructor. Supply a valid External ID authority, client registration, and the supported challenge types using [`CustomAuthConfiguration`](../src/custom_auth/configuration/CustomAuthConfiguration.ts).

Configure `customAuth.authApiProxyUrl` for your deployment's trusted authentication API proxy. Do not send credentials or authentication payloads to an untrusted proxy, or embed confidential-client credentials in browser configuration.

The application's advertised challenge types must match what its UI can actually handle. A custom UI does not make every identity-provider scenario available without a browser. Handle a browser/redirect requirement explicitly rather than treating an unsupported challenge as successful authentication.

See the [application interface](../src/custom_auth/ICustomAuthPublicClientApplication.ts) and [operation inputs](../src/custom_auth/CustomAuthActionInputs.ts) for the public contracts.

## Operations, results, and states

Native authentication is a stateful sequence of operations, not a single call that always returns tokens. Each result identifies the next state or an error. Only present actions supported by that state and use the newly returned state after each operation.

| Scenario | API families and source reference |
| --- | --- |
| Sign-in | `signIn`, code/password/continuation/completed/failed states, and submit/resend results. Start with [`SignInResult`](../src/custom_auth/sign_in/auth_flow/result/SignInResult.ts). |
| Sign-up | `signUp`, account attributes, code/password/completed/failed states, and submit/resend results. Start with [`SignUpResult`](../src/custom_auth/sign_up/auth_flow/result/SignUpResult.ts) and [`UserAccountAttributes`](../src/custom_auth/UserAccountAttributes.ts). |
| Password reset | `resetPassword`, code/password/completed/failed states, and submit/resend results. Start with [`ResetPasswordStartResult`](../src/custom_auth/reset_password/auth_flow/result/ResetPasswordStartResult.ts). |
| Authentication-method registration | Registration-required and verification-required states, challenge/submit operations, and completed/failed states. See [registration states](../src/custom_auth/core/auth_flow/jit/state/AuthMethodRegistrationState.ts). |
| MFA | Awaiting/verification-required states, challenge/submit operations, and completed/failed states. See [MFA states](../src/custom_auth/core/auth_flow/mfa/state/MfaState.ts). |
| Current account, access tokens, and sign-out | `getCurrentAccount` and the operations exposed by [`CustomAuthAccountData`](../src/custom_auth/get_account/auth_flow/CustomAuthAccountData.ts), with dedicated result/error types. |

Use the result's documented state-checking helpers to narrow the next state before submitting a password, code, attributes, or MFA response. Do not retain and reuse an earlier state after advancing the flow. A completed password reset or method-registration step is not automatically a completed sign-in.

## Error handling and sensitive data

Handle operation-specific errors from results as well as exceptions during application creation and asynchronous operations. Native-authentication result/error contracts are not interchangeable with the standard popup/redirect `AuthenticationResult` and `InteractionRequiredAuthError` pattern.

The [public export index](../src/custom_auth/index.ts) includes the operation-specific error types and shared configuration, argument, HTTP, and unexpected-error types. Use their documented codes and predicates for UI decisions rather than displaying raw diagnostic messages.

Passwords, verification codes, continuation tokens, account attributes, and authentication responses are sensitive. Do not log them or persist flow state as application navigation state. After sign-in, request an access token for the intended resource, handle acquisition failure, and clear the application's authenticated UI when signing out.

## Native authentication V2

V2 uses the same `@azure/msal-browser/custom-auth` entry point, with separate operation inputs, results, states, and a shared flow-error type.

### V2 application and configuration

Create the application using `CustomAuthPublicClientApplication.create` and `CustomAuthConfiguration`, as described in [Application and configuration](#application-and-configuration).

Use the [V2 interface](../src/custom_auth/ICustomAuthPublicClientApplicationV2.ts), `ICustomAuthPublicClientApplicationV2`, for the V2 application contract. Start flows with `SignInInputsV2`, `SignUpInputsV2`, or `ResetPasswordInputsV2`, defined in the [operation inputs](../src/custom_auth/CustomAuthActionInputs.ts). Supply passwords and verification codes through the actions exposed by the returned states rather than the initial V2 inputs.

### V2 operations, results, and states

| Scenario | API families and source reference |
| --- | --- |
| Sign-in | `signInV2`, password/code-required states, and authentication-method selection. Start with [`SignInStartResultV2`](../src/custom_auth/sign_in/auth_flow/v2/result/SignInStartResultV2.ts). |
| Sign-up | `signUpV2`, account verification, attributes, password setup, and existing-account states. Start with [`SignUpStartResultV2`](../src/custom_auth/sign_up/auth_flow/v2/result/SignUpStartResultV2.ts). |
| Password reset | `resetPasswordV2`, authentication-method selection, code verification, and new-password submission. Start with [`ResetPasswordStartResultV2`](../src/custom_auth/core/auth_flow/v2/result/ResetPasswordStartResultV2.ts). |
| Authentication-method registration | [`AuthMethodRegistrationRequiredStateV2`](../src/custom_auth/core/auth_flow/v2/state/AuthMethodRegistrationRequiredStateV2.ts) selects a method to register; [`AuthMethodVerificationRequiredStateV2`](../src/custom_auth/core/auth_flow/v2/state/AuthMethodVerificationRequiredStateV2.ts) handles verification. |
| MFA | [`AuthMethodSelectionRequiredStateV2`](../src/custom_auth/core/auth_flow/v2/state/AuthMethodSelectionRequiredStateV2.ts) selects a method when required; [`MFAVerificationRequiredStateV2`](../src/custom_auth/core/auth_flow/v2/state/MFAVerificationRequiredStateV2.ts) handles verification. |
| Sign-in continuation | [`SignInContinuationStateV2.signIn()`](../src/custom_auth/sign_in/auth_flow/v2/state/SignInContinuationStateV2.ts) continues sign-in after a preceding flow. |
| Current account, access tokens, and sign-out | Use the shared `getCurrentAccount` API and operations exposed by [`CustomAuthAccountData`](../src/custom_auth/get_account/auth_flow/CustomAuthAccountData.ts). |

V2 operation-specific result aliases use the shared [`CustomAuthResultV2`](../src/custom_auth/core/auth_flow/v2/CustomAuthResultV2.ts) class with state unions describing each operation's possible outcomes. Use `result.isState(...)` or `result.state.stateType` to identify the next state and invoke only the actions that state supports.

Pass each returned result through state handling again: submitting a password, code, attributes, or registration challenge can require another step. Do not reuse an earlier state after advancing the flow.

### V2 error handling and sensitive data

Check `result.isFailed()` and inspect `result.error`, which uses the shared [`AuthFlowErrorV2`](../src/custom_auth/core/auth_flow/v2/error/AuthFlowErrorV2.ts) type. Its helpers identify actionable conditions such as invalid input, invalid passwords, invalid codes or challenges, and browser-required responses.

Use `scenario` to identify the flow associated with a result or error. Handle application-creation exceptions separately from flow-result failures.

Keep V1 and V2 input, result, and state contracts distinct. The same sensitive-data precautions apply to both versions: do not log credentials, verification codes, continuation tokens, account attributes, or authentication responses.
