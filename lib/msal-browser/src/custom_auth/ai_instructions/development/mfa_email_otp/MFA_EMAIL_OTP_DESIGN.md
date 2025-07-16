# Problem description

The Native Authentication APIs do not currently support Multi-Factor Authentication (MFA), which is crucial in today’s digital environment. The native auth APIs currently only support one factor with either Email OTP or email and password.

This document aims to address this limitation by building support for email OTP MFA in the MSAL Android and Obj-C SDKs and enhancing the security of our Native Authentication capabilities.

# Solution Description

With the introduction of MFA we will introduce MFA-related states to the native auth SDK state machine. These states will be part of the sign in flow, and allow the developer to challenge the default auth method, fetch all available auth methods for a user and challenge a specific auth method.

## In Scope:

For the current release, we will only support Email OTP as the strong authentication method.

## Out of Scope:

While the new API is designed to potentially support multiple MFA methods, the inclusion of these methods such as SMS will not be part of this release.

## Glossary

Native Authentication APIs: APIs hosted in ESTS allow Native clients to interact with these APIs to fulfill an authentication, SSPR and SSSU flow. Refer to References for more details.

Native auth SDK: MSAL SDKs for Android and Obj-C that include native auth capabilities.

Email OTP Strong auth: This is an authentication method that can be used within Consumer users’ scenarios in CIAM as Strong Authentication for second factor.

## Design

### High level flow

1. signIn(email, password): Developers start the authentication process by calling the SDK’s signIn() method in the entry point.

   1. This will call /oauth2/initiate, followed by /oauth2/challenge.
   2. Once /challenge returns a “challenge_type=password”, indicating that a password is needed, the SDK sends the password to the /token endpoint.
   3. /token will return an “mfa_required” error when MFA is needed.

2. onAwaitingMFA: The SDK will return an onAwaitingMFA result back to the developer. This allows the developer to pause execution before sending the code to the user’s email, to for example build additional UI to inform the user.

3. requestChallenge(): The developer calls requestChallenge(), triggering a challenge of the default auth method.

   1. This will call the /oauth2/challenge endpoint.
   2. eSTS will send an email with the OTP code to the user’s registered email address.
   3. If no default auth method is available, the API will return an error “introspect_required”. If this error is received, the SDK will immediately call /introspect.

4. getAuthMethods(): The developer has the option to call getAuthMethods(), to retrieve all auth methods of a user and build UI that allows the user to pick a different auth method.
   1. This will call the /oauth2/introspect endpoint and return a list of all the available strong authentication methods for the user.

5. requestChallenge(challenge_id): The developer has the option to call requestChallenge(challenge_id), passing the ID from one of the auth methods received from getAuthMethods().
   1. This will call /challenge with a specific auth method in the body of the request.

6. submitChallenge(challenge): Once the code has been submitted by the user, the developer calls submitChallenge(challenge).
   1. This will call the /token endpoint and submit the OTP. MFA requirements should now be satisfied, and the endpoint should return an HTTP 200 with tokens, completing the sign in flow.

## Flow diagram
[Sequence Diagram](MFA_EMAIL_OTP.png)

## Sample codes

### How to handle MFA required scenario after calling CustomAuthPublicClientApplication.signIn()

```typescript
// Create the client
const client = await CustomAuthPublicClientApplication.create(customAuthConfig);

async function signInWithPassword(username: string, password: string): Promise<CustomAuthAccountData | undefined> {
    // Start the sign-in process
    const result: SignInResult = await client.signIn({ username, password });

    if (result.isFailed()) {
        // Handle errors
    }

    if (result.isCompleted()) {
        // Success! Access account data
        const account: CustomAuthAccountData = result.data;
        showSuccess(`Signed in as ${account.getAccount().username}`);
        return account;
    }

    // Mfa is required during the sign-in flow.
    if (result.isMfaRequired()) {
        // result.isMfaRequired() method will check the state in the result is MfaAwaitingState.
        // result.state.requestChallenge() method will be used to request the server to send the OTP to user by a default authentication method.
        const mfaResult: MfaRequestChallengeResult = await result.state.requestChallenge();

        if (mfaResult.isFailed()) {
            // Handle errors
        }

        if (mfaResult.isVerificationRequired()) {
            // mfaResult.isVerificationRequired() method will check whether the state in the mfaResult is MfaVerificationRequiredState.
            // the challenge value used when calling submitChallenge method should be collected from users, the challenge can be an Email OTP.

            // check the sent OTP code length
            const codeLength = mfaResult.state.getCodeLength();

            // check the channel of sending OTP code
            const channel = mfaResult.state.getChannel();

            // check where the OTP code is sent
            const sentTo = mfaResult.state.sentTo();

            const submitChallengeResult: MfaSubmitChallengeResult = await mfaResult.state.submitChallenge(challenge);

            if (submitChallengeResult.isFailed()) {
                // handle errors.
            }

            if (submitChallengeResult.isCompleted()) {
                // Success! Access account data
                const account: CustomAuthAccountData = result.data;
                showSuccess(`Signed in as ${account.getAccount().username}`);
                return account;
            }

            /*
            The MfaVerificationRequiredState should have 3 available methods:
            1. submitChallenge(challenge: string): MfaSubmitChallengeResult - submit challenge like OTP to server to complete the sign-in flow by calling /oauth2/token endpoint.
            2. getAuthMethods(): MfaGetAuthMethodsResult - get available authentication methods by calling /oauth2/introspect endpoint.
            3. requestChallenge(authMethod?: AuthMethod): MfaRequestChallengeResult - calling the /oauth2/challenge endpoint to request server sends an OTP by the provided authentication method. If no method provided, then try to use the default authentication method.
            */
        }

        if (mfaResult.isMethodSelectionRequired()) {
            /*
                mfaResult.isMethodSelectionRequired() method will check whether the state in the mfaResult is MfaMethodSelectionRequiredState.
                MfaMethodSelectionRequiredState has the same methods as MfaVerificationRequiredState: submitChallenge, getAuthMethods, and requestChallenge.
            */
            const authMethods: AuthMethods[] = mfaResult.state.getAuthMethods();

            // UI needs to show the auth methods to user and return the user's selection here.
            // for example: const selectedMethod = getUserSelectionFromUI();

            const requestChallengeResult: MfaRequestChallengeResult = await mfaResult.state.requestChallenge(selectedMethod);

            if (requestChallengeResult.isFailed()) {
                // Handle errors
            }

            if (requestChallengeResult.isVerificationRequired()) {
                // the challenge value used when calling submitChallenge method should be collected from users, the challenge can be an Email OTP.

                const submitChallengeResult: MfaSubmitChallengeResult = await requestChallengeResult.state.submitChallenge(challenge);

                if (submitChallengeResult.isFailed()) {
                    // handle errors.
                }

                if (submitChallengeResult.isCompleted()) {
                    // Success! Access account data
                    const account: CustomAuthAccountData = result.data;
                    showSuccess(`Signed in as ${account.getAccount().username}`);
                    return account;
                }
            }
        }
    }
}
```

### How to handle MFA required scenario after submitting password

```typescript
// Create the client
const client = await CustomAuthPublicClientApplication.create(customAuthConfig);

async function signInWithPassword(username: string, password: string): Promise<CustomAuthAccountData | undefined> {
    // Start the sign-in process
    const result: SignInResult = await client.signIn({ username });

    if (result.isFailed()) {
        // Handle errors
    }

    // Password is required during the sign-in flow.
    if (result.isPasswordRequired()) {
        // result.isPasswordRequired() method checks the state in the result is SignInPasswordRequiredState.
        const submitPasswordResult = await result.state.submitPassword(password);

        if (submitPasswordResult.isFailed()) {
            // Handle errors
        }

        if (submitPasswordResult.isCompleted()) {
            // Success! Access account data
            const account: CustomAuthAccountData = submitPasswordResult.data;
            showSuccess(`Signed in as ${account.getAccount().username}`);
            return account;
        }

        // Mfa is required during the sign-in flow.
        if (submitPasswordResult.isMfaRequired()) {
            // The logic inside this if block will be same as the sample codes in the section "How to handle MFA required scenario after calling CustomAuthPublicClientApplication.signIn()"
            const mfaResult: MfaRequestChallengeResult = await result.state.requestChallenge();

            if (mfaResult.isFailed()) {
                // Handle errors
            }

            if (mfaResult.isVerificationRequired()) {
                const submitChallengeResult: MfaSubmitChallengeResult = await mfaResult.state.submitChallenge(challenge);

                if (submitChallengeResult.isFailed()) {
                    // handle errors.
                }

                if (submitChallengeResult.isCompleted()) {
                    // Success! Access account data
                    const account: CustomAuthAccountData = result.data;
                    showSuccess(`Signed in as ${account.getAccount().username}`);
                    return account;
                }
            }
        }
    }
}
```
