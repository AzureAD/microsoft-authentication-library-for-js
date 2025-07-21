# Prompts for MFA EMAIL OTP Implmentation

## Prompt for Generating Tasks

### Context to Use

1. You must read all sections in the doc `custom_auth/ai_instructions/AI_INSTRUCTIONS.md` for an overview of the native authentication feature in the msal-browser SDK. Especially focus on the following section.
    - Folder Structure: help you understand where the codes should be placed.
    - Project Layers: help you understand the architecture of Native Auth feature.
    - Error Handling: help you understand how to handle the errors when generating the codes.
    - AI-Specific Instructions: help you understand the standard when generating the codes.
    - Sample Code: Sign-In Flow. provide you a understanding how this feature be used by the SDK consumer.
2. You must read all sections in the doc `custom_auth/ai_instructions/development/MFA/MFA_EMAIL_OTP_DESIGN.md` to understand the requirements for the new native auth feature - MFA with Email OTP. Focus on:
    - Design section: help you understand the required changes for this new feature.
    - Flow diagram: help you understand the new MFA flow.
    - Codes in Sample codes section. Compare them with the sample codes in `custom_auth/ai_instructions/AI_INSTRUCTIONS.md` `Sample Code: Sign-In Flow` section to understand what changes are required.
3. You must review all relevant code in the [custom_auth](../../../../custom_auth/) folder to understand the current structure and avoid redundant or conflicting suggestions.

### Requirements

You must follow ALL rules below, create a list of tasks required for implementating the MFA EMAIL OTP feature and the add the required changes in each task.

#### Generic Rules:

-   Based on the layers mentioned in the [Project Layers](../../AI_INSTRUCTIONS.md#3-project-layers) section to create the tasks so that the task can be assigned the different developers without conflicts. Note: not all layers need changes for this new feature.
-   The tasks must be oreded by the their dependencies. For example, the changes in network client layer should be started before the changes in the interaction client layer.
-   If you suggest a task, briefly justify its necessity based on the sample code, requirements, or project structure.
-   Read the [Folder Structure](../../AI_INSTRUCTIONS.md#2-folder-structure) section to understand where to place the new required components.
-   Analyze ALL sample code sections in `custom_auth/ai_instructions/AI_INSTRUCTIONS.md` and `custom_auth/ai_instructions/development/MFA/MFA_EMAIL_OTP_DESIGN.md`, and identify EVERY place where new methods or state transitions are shown.
-   Do not include tasks for documentation, UI, or testing unless they are explicitly required.
-   Each task should follow the template below to provide the detailed requirements which can be used by you to generate the codes correctly.
    -   The task must contain the following sections.
        -   Justification - provide the reason why this task should be created.
        -   Changes Required - provide the details what changes should be required in this task.
        -   Files to Create/Modify - list ALL files which need to be update or create. Add a tag in the begining of file to indicate whether the file is needed to be created or modified. For example: Create XXXX or Modify XXXX. For each file, must list what the required changes should be added/modified there. For example, if a new module `NewModule` need to be created, you must provide the required updates in this module, such as two methods AAAA() and BBBB() need to be created in this module and provide the description the purpose of each method. If a method in an existing module need to be udpate, you must provide a description what updates need to be done there.

#### Feature Specific Rules

-   A new flow mfa need to be added. It should has its own results and states. Since the mfa is a shared flow used by sign-in (sign-up or sspr in the future), it should be placed in the core/auth_flow folder. For more detais, check the section [Sample codes](./MFA_EMAIL_OTP_DESIGN.md#sample-codes). In addition, you must follow existing folder structure used by other flow, like [sign_in](../../../sign_in/), [sign_in](../../../sign_in/) and [reset_password](../../../reset_password/), to place the results, states, error types and interaction client.
-   A new interfaction client need be added for the new MFA flow. You need to follow the exact same folder structure and file patterns as existing flows like sign_in/interaction_client, sign_up/interaction_client, reset_password/interaction_client".
-   A new network call need to be introduced for the endpoint /oauth2/introspect for getting auth methods. Regarding the request and response payload for this endpoint, you must check the section Appendex 1 below. In addition, for the endpoint /oauth2/introspect, you must place the logic in the SignInApiClient.

## Appendex 1

API: POST /{tenant}/oauth2/v2.0/introspect

### Request Property

-   client_id - it is required string value.
-   continuation_token - it is a required string value.

### Response Property

-   continuation_token - it is a required string value.
-   methods - it is an Array<AuthenticationMethod>

### AuthenticationMethod Type

-   id: string
-   challenge_type: string
-   challenge_channel: string
-   login_hint: string

### Redirect Response:

This response will be returned in case the client application does not support “OOB” challenge, and the registered MFA method for the user is Email OTP.
This will prompt the client application to redirect to the web to restart the authentication flow since the application cannot complete the flow with required credentials.
The reason we would return such a response on this API and not the “initiate” endpoint, is because we don’t verify that strong-auth is required on “initiate” endpoint, this is done within the pipeline on the Token endpoint when auth policies are evaluated.

#### Response Property

-   challenge_type: string - describes a redirect response, only supported value is “redirect”

### Response Example:

POST /{tenant}/oauth2/v2.0/introspect

#### Request:

Content-Type: application/x-www-form-urlencoded
continuation_token=...
client_id…

#### Response:

Content-Type: application/json

200 - OK

{

"continuation_token": "...",

"methods": [

{

"id": "01488-13……",

"challenge_type": "oob",

"challenge_channel": "email",

"login_hint": "**o\*@c\*\***so.com"

}

]

}

## Prompt for generating codes for [Task 1](./MFA_EMAIL_OTP_TASKS.md#task-1-core-mfa-auth-flow-foundation-network-layer).

### Context to Use

1. You must read all sections in the doc `custom_auth/ai_instructions/AI_INSTRUCTIONS.md` for an overview of the native authentication feature in the msal-browser SDK. Especially focus on the following section.
    - Folder Structure: help you understand where the codes should be placed.
    - Project Layers: help you understand the architecture of Native Auth feature.
    - Error Handling: help you understand how to handle the errors when generating the codes.
    - AI-Specific Instructions: help you understand the standard when generating the codes.
    - Sample Code: Sign-In Flow. provide you a understanding how this feature be used by the SDK consumer.
2. You must read all sections in the doc `custom_auth/ai_instructions/development/MFA/MFA_EMAIL_OTP_DESIGN.md` to understand the requirements for the new native auth feature - MFA with Email OTP. Focus on:
    - Design section: help you understand the required changes for this new feature.
    - Flow diagram: help you understand the new MFA flow.
    - Codes in Sample codes section. Compare them with the sample codes in `custom_auth/ai_instructions/AI_INSTRUCTIONS.md` `Sample Code: Sign-In Flow` section to understand what changes are required.
3. You must review all relevant code in the [custom_auth](../../../../custom_auth/) folder to understand the current structure and avoid redundant or conflicting suggestions. Expecially focus on ALL codes in the folder `custom_auth/core/networ_client` since you need to understand the current pattern for the network client and generate the codes based on the requirements below.
4. You must read ALL tasks listed in `MFA_EMAIL_OTP_TASKS.md` to understand the relationship between each task for implmeneting the MFA Email OTP feature.

### Requirements

You must follow ALL rules below and generate the codes for the Task 1 listed in `MFA_EMAIL_OTP_TASKS.md`.

#### Generic Rules:

-   You must read the Appendex 1 below to understand the endpooint `POST /{tenant}/oauth2/v2.0/introspect`.
-   You must read the task 1 requirements to understand what changes you need to make.
-   During code generation, if you find any required changes which are not list in the task description, must add it. But provide the description why you make this change is required in your chat.
-   You must follow the instructions listed in the section `AI-Specific Instructions` in the doc `custom_auth/ai_instructions/AI_INSTRUCTIONS.md`.
-   After codes generated, run the build command. If there are any errors, fixed them until the build are successful. The build command can be found in [Development Commands](../../AI_INSTRUCTIONS.md#5-development-commands) section.

## Appendex 1

API: POST /{tenant}/oauth2/v2.0/introspect

### Request Property

-   client_id - it is required string value.
-   continuation_token - it is a required string value.

### Response Property

-   continuation_token - it is a required string value.
-   methods - it is an Array<AuthenticationMethod>

### AuthenticationMethod Type

-   id: string
-   challenge_type: string
-   challenge_channel: string
-   login_hint: string

### Redirect Response:

This response will be returned in case the client application does not support “OOB” challenge, and the registered MFA method for the user is Email OTP.
This will prompt the client application to redirect to the web to restart the authentication flow since the application cannot complete the flow with required credentials.
The reason we would return such a response on this API and not the “initiate” endpoint, is because we don’t verify that strong-auth is required on “initiate” endpoint, this is done within the pipeline on the Token endpoint when auth policies are evaluated.

#### Response Property

-   challenge_type: string - describes a redirect response, only supported value is “redirect”

### Response Example:

POST /{tenant}/oauth2/v2.0/introspect

#### Request:

Content-Type: application/x-www-form-urlencoded
continuation_token=...
client_id…

#### Response:

Content-Type: application/json

200 - OK

{

"continuation_token": "...",

"methods": [

{

"id": "01488-13……",

"challenge_type": "oob",

"challenge_channel": "email",

"login_hint": "**o\*@c\*\***so.com"

}

]

}

## Prompt for generating codes for [Task 2](./MFA_EMAIL_OTP_TASKS.md#task-2-mfa-interaction-client).

### Context to Use

1. You must read all sections in the doc `custom_auth/ai_instructions/AI_INSTRUCTIONS.md` for an overview of the native authentication feature in the msal-browser SDK. Especially focus on the following section.
    - Folder Structure: help you understand where the codes should be placed.
    - Project Layers: help you understand the architecture of Native Auth feature.
    - Error Handling: help you understand how to handle the errors when generating the codes.
    - AI-Specific Instructions: help you understand the standard when generating the codes.
    - Sample Code: Sign-In Flow. provide you a understanding how this feature be used by the SDK consumer.
2. You must read all sections in the doc `custom_auth/ai_instructions/development/MFA/MFA_EMAIL_OTP_DESIGN.md` to understand the requirements for the new native auth feature - MFA with Email OTP. Focus on:
    - Design section: help you understand the required changes for this new feature.
    - Flow diagram: help you understand the new MFA flow.
    - Codes in Sample codes section. Compare them with the sample codes in `custom_auth/ai_instructions/AI_INSTRUCTIONS.md` `Sample Code: Sign-In Flow` section to understand what changes are required.
3. You must review all relevant code in the [custom_auth](../../../../custom_auth/) folder to understand the current structure and avoid redundant or conflicting suggestions.
4. You must read ALL tasks listed in `MFA_EMAIL_OTP_TASKS.md` to understand the relationship between each task for implmeneting the MFA Email OTP feature.

### Requirements

You must follow ALL rules below and generate the codes for the Task 2 listed in `MFA_EMAIL_OTP_TASKS.md`.

#### Generic Rules:

-   You must read the task 2 requirements to understand what changes you need to make.
-   You must specifically read ALL codes in the folders `custom_auth/sign_in/interaction_client`, `custom_auth/sign_up/interaction_client` and `custom_auth/reset_password/interaction_client` since you need to understand the current interaction client code pattern.
-   During code generation, if you find any required changes which are not list in the task description, must add it. But provide the description why you make this change is required in your chat.
-   You must follow ALL rules listed in the section `AI-Specific Instructions` in the doc `custom_auth/ai_instructions/AI_INSTRUCTIONS.md`.
-   You must follow the existing error handling pattern listed in the section `4. Error Handling` in the doc `custom_auth/ai_instructions/AI_INSTRUCTIONS.md`.
-   After codes generated, run the build command. If there are any errors, fixed them until the build are successful. The build command can be found in [Development Commands](../../AI_INSTRUCTIONS.md#5-development-commands) section.

## Prompt for generating unit tests for [Task 2](./MFA_EMAIL_OTP_TASKS.md#task-2-mfa-interaction-client).

### Context to Use

1. You must read ALL sections `custom_auth/ai_instructions/AI_TESTING.md` to understand the stardard of write unit tests.
2. You must read ALL codes in the folder `lib/msal-browser/test/custom_auth` to understand the existing tests code to understand the patterns.

### Requirements

1. Write the unit tests to cover ALL scenarios (successful and failed) for ALL MfaClient methods. Check SignInClient.spec.ts to understand how the tests should be created for interaction clients.
2. Update the eixsting SignInClient.spec.ts to reflect its new changes.

## Prompt for generating codes for [Task 3](./MFA_EMAIL_OTP_TASKS.md#task-3-update-signinclient-to-handle-mfa-required-response).

### Context to Use

1. You must read all sections in the doc `custom_auth/ai_instructions/AI_INSTRUCTIONS.md` for an overview of the native authentication feature in the msal-browser SDK. Especially focus on the following section.
    - Folder Structure: help you understand where the codes should be placed.
    - Project Layers: help you understand the architecture of Native Auth feature.
    - Error Handling: help you understand how to handle the errors when generating the codes.
    - AI-Specific Instructions: help you understand the standard when generating the codes.
    - Sample Code: Sign-In Flow. provide you a understanding how this feature be used by the SDK consumer.
2. You must read all sections in the doc `custom_auth/ai_instructions/development/MFA/MFA_EMAIL_OTP_DESIGN.md` to understand the requirements for the new native auth feature - MFA with Email OTP. Focus on:
    - Design section: help you understand the required changes for this new feature.
    - Flow diagram: help you understand the new MFA flow.
    - Codes in Sample codes section. Compare them with the sample codes in `custom_auth/ai_instructions/AI_INSTRUCTIONS.md` `Sample Code: Sign-In Flow` section to understand what changes are required.
3. You must review all relevant code in the [custom_auth](../../../../custom_auth/) folder to understand the current structure and avoid redundant or conflicting suggestions.
4. You must read ALL tasks listed in `MFA_EMAIL_OTP_TASKS.md` to understand the relationship between each task for implmeneting the MFA Email OTP feature.

### Requirements

You must follow ALL rules below and generate the codes for the Task 3 listed in `MFA_EMAIL_OTP_TASKS.md`.

#### Generic Rules:

-   You must read the task 3 requirements to understand what changes you need to make.
-   During code generation, if you find any required changes which are not list in the task description, must add it. But provide the description why you make this change is required in your chat.
-   You must follow ALL rules listed in the section `AI-Specific Instructions` in the doc `custom_auth/ai_instructions/AI_INSTRUCTIONS.md`.
-   You must follow the existing error handling pattern listed in the section `4. Error Handling` in the doc `custom_auth/ai_instructions/AI_INSTRUCTIONS.md`.
-   After codes generated, run the build command. If there are any errors, fixed them until the build are successful. The build command can be found in [Development Commands](../../AI_INSTRUCTIONS.md#5-development-commands) section.

## Prompt for generating unit tests for [Task 3](./MFA_EMAIL_OTP_TASKS.md#task-3-update-signinclient-to-handle-mfa-required-response).

### Context to Use

1. You must read ALL sections `custom_auth/ai_instructions/AI_TESTING.md` to understand the stardard of write unit tests.
2. You must read ALL codes in the folder `lib/msal-browser/test/custom_auth` to understand the existing tests code to understand the patterns.

### Requirements

1. Write the unit tests to cover ALL scenarios (successful and failed) which introduced by the latest changes in SignInClient.

## Prompt for generating codes for [Task 4](./MFA_EMAIL_OTP_TASKS.md#task-4-core-mfa-auth-flow-states-and-results).

### Context to Use

1. You must read all sections in the doc `custom_auth/ai_instructions/AI_INSTRUCTIONS.md` for an overview of the native authentication feature in the msal-browser SDK. Especially focus on the following section.
    - Folder Structure: help you understand where the codes should be placed.
    - Project Layers: help you understand the architecture of Native Auth feature.
    - Error Handling: help you understand how to handle the errors when generating the codes.
    - AI-Specific Instructions: help you understand the standard when generating the codes.
    - Sample Code: Sign-In Flow. provide you a understanding how this feature be used by the SDK consumer.
2. You must read all sections in the doc `custom_auth/ai_instructions/development/MFA/MFA_EMAIL_OTP_DESIGN.md` to understand the requirements for the new native auth feature - MFA with Email OTP. Focus on:
    - Design section: help you understand the required changes for this new feature.
    - Flow diagram: help you understand the new MFA flow.
    - Codes in Sample codes section. Compare them with the sample codes in `custom_auth/ai_instructions/AI_INSTRUCTIONS.md` `Sample Code: Sign-In Flow` section to understand what changes are required.
3. You must review all relevant code in the [custom_auth](../../../../custom_auth/) folder to understand the current structure and avoid redundant or conflicting suggestions.
4. You must read ALL tasks listed in `MFA_EMAIL_OTP_TASKS.md` to understand the relationship between each task for implmeneting the MFA Email OTP feature.

### Requirements

You must follow ALL rules below and generate the codes for the Task 4 listed in `MFA_EMAIL_OTP_TASKS.md`.

#### Generic Rules:

-   You must read the task 4 requirements to understand what changes you need to make.
-   During code generation, if you find any required changes which are not list in the task description, must add it. But provide the description why you make this change is required in your chat.
-   You must follow ALL rules listed in the section `AI-Specific Instructions` in the doc `custom_auth/ai_instructions/AI_INSTRUCTIONS.md`.
-   You must follow the existing error handling pattern listed in the section `4. Error Handling` in the doc `custom_auth/ai_instructions/AI_INSTRUCTIONS.md`.
-   After codes generated, run the build command. If there are any errors, fixed them until the build are successful. The build command can be found in [Development Commands](../../AI_INSTRUCTIONS.md#5-development-commands) section.

## Prompt for generating unit tests for [Task 4](./MFA_EMAIL_OTP_TASKS.md#task-4-core-mfa-auth-flow-states-and-results).

### Context to Use

1. You must read ALL sections `custom_auth/ai_instructions/AI_TESTING.md` to understand the stardard of write unit tests.
2. You must read ALL codes in the folder `lib/msal-browser/test/custom_auth` to understand the existing tests code to understand the patterns.

### Requirements

1. Write the unit tests to cover ALL scenarios (successful and failed) for MfaError.
2. Write the unit tests to cover ALL scenarios (successful and failed) for MfaAwaitingState, MfaVerificationRequiredState and MfaMethodSelectionRequiredState in file MfaState.ts.

## Prompt for generating codes for [Task 5](./MFA_EMAIL_OTP_TASKS.md#task-5-integrate-mfa-client-into-factory-and-controller).

### Context to Use

1. You must read all sections in the doc `custom_auth/ai_instructions/AI_INSTRUCTIONS.md` for an overview of the native authentication feature in the msal-browser SDK. Especially focus on the following section.
    - Folder Structure: help you understand where the codes should be placed.
    - Project Layers: help you understand the architecture of Native Auth feature.
    - Error Handling: help you understand how to handle the errors when generating the codes.
    - AI-Specific Instructions: help you understand the standard when generating the codes.
    - Sample Code: Sign-In Flow. provide you a understanding how this feature be used by the SDK consumer.
2. You must read all sections in the doc `custom_auth/ai_instructions/development/MFA/MFA_EMAIL_OTP_DESIGN.md` to understand the requirements for the new native auth feature - MFA with Email OTP. Focus on:
    - Design section: help you understand the required changes for this new feature.
    - Flow diagram: help you understand the new MFA flow.
    - Codes in Sample codes section. Compare them with the sample codes in `custom_auth/ai_instructions/AI_INSTRUCTIONS.md` `Sample Code: Sign-In Flow` section to understand what changes are required.
3. You must review all relevant code in the [custom_auth](../../../../custom_auth/) folder to understand the current structure and avoid redundant or conflicting suggestions.
4. You must read ALL tasks listed in `MFA_EMAIL_OTP_TASKS.md` to understand the relationship between each task for implmeneting the MFA Email OTP feature.

### Requirements

You must follow ALL rules below and generate the codes for the Task 5 listed in `MFA_EMAIL_OTP_TASKS.md`.

#### Generic Rules:

-   You must read the task 4 requirements to understand what changes you need to make.
-   During code generation, if you find any required changes which are not list in the task description, must add it. But provide the description why you make this change is required in your chat.
-   You must follow ALL rules listed in the section `AI-Specific Instructions` in the doc `custom_auth/ai_instructions/AI_INSTRUCTIONS.md`.
-   You must follow the existing error handling pattern listed in the section `4. Error Handling` in the doc `custom_auth/ai_instructions/AI_INSTRUCTIONS.md`.
-   After codes generated, run the build command. If there are any errors, fixed them until the build are successful. The build command can be found in [Development Commands](../../AI_INSTRUCTIONS.md#5-development-commands) section.

## Prompt for generating unit tests for [Task 5](./MFA_EMAIL_OTP_TASKS.md#task-4-core-mfa-auth-flow-states-and-results).

### Context to Use

1. You must read ALL sections `custom_auth/ai_instructions/AI_TESTING.md` to understand the stardard of write unit tests.
2. You must read ALL codes in the folder `lib/msal-browser/test/custom_auth` to understand the existing tests code to understand the patterns.

### Requirements

1. Fix all failed tests in the folder `lib/msal-browser/test/custom_auth`.
1. Write the unit tests to cover ALL uncovered scenarios (successful and failed) in the SignInPasswordRequiredState.
1. Write the unit tests to cover ALL uncovered scenarios (successful and failed) in the CustomAuthStandardController.

## Prompt for generating codes for [Task 7](./MFA_EMAIL_OTP_TASKS.md#task-7-update-type-exports-and-public-api).

### Context to Use

1. You must read all sections in the doc `custom_auth/ai_instructions/AI_INSTRUCTIONS.md` for an overview of the native authentication feature in the msal-browser SDK. Especially focus on the following section.
    - Folder Structure: help you understand where the codes should be placed.
    - Project Layers: help you understand the architecture of Native Auth feature.
    - Error Handling: help you understand how to handle the errors when generating the codes.
    - AI-Specific Instructions: help you understand the standard when generating the codes.
    - Sample Code: Sign-In Flow. provide you a understanding how this feature be used by the SDK consumer.
2. You must read all sections in the doc `custom_auth/ai_instructions/development/MFA/MFA_EMAIL_OTP_DESIGN.md` to understand the requirements for the new native auth feature - MFA with Email OTP. Focus on:
    - Design section: help you understand the required changes for this new feature.
    - Flow diagram: help you understand the new MFA flow.
    - Codes in Sample codes section. Compare them with the sample codes in `custom_auth/ai_instructions/AI_INSTRUCTIONS.md` `Sample Code: Sign-In Flow` section to understand what changes are required.
3. You must review all relevant code in the [custom_auth](../../../../custom_auth/) folder to understand the current structure and avoid redundant or conflicting suggestions.
4. You must read ALL tasks listed in `MFA_EMAIL_OTP_TASKS.md` to understand the relationship between each task for implmeneting the MFA Email OTP feature.

### Requirements

You must follow ALL rules below and generate the codes for the Task 7 listed in `MFA_EMAIL_OTP_TASKS.md`.

#### Generic Rules:

-   You must read the task 7 requirements to understand what changes you need to make. Ensure the export path is correct.
-   During code generation, if you find any required changes which are not list in the task description, must add it. But provide the description why you make this change is required in your chat.
-   You must follow ALL rules listed in the section `AI-Specific Instructions` in the doc `custom_auth/ai_instructions/AI_INSTRUCTIONS.md`.
-   You must follow the existing error handling pattern listed in the section `4. Error Handling` in the doc `custom_auth/ai_instructions/AI_INSTRUCTIONS.md`.
-   After codes generated, run the build command. If there are any errors, fixed them until the build are successful. The build command can be found in [Development Commands](../../AI_INSTRUCTIONS.md#5-development-commands) section.

## Prompt for generating integration tests

### Context to Use

1. You must read all sections in the doc `custom_auth/ai_instructions/AI_INSTRUCTIONS.md` for an overview of the native authentication feature in the msal-browser SDK. Especially focus on the following section.
    - Folder Structure: help you understand where the codes should be placed.
    - Project Layers: help you understand the architecture of Native Auth feature.
    - Error Handling: help you understand how to handle the errors when generating the codes.
    - AI-Specific Instructions: help you understand the standard when generating the codes.
    - Sample Code: Sign-In Flow. provide you a understanding how this feature be used by the SDK consumer.
2. You must read all sections in the doc `custom_auth/ai_instructions/development/MFA/MFA_EMAIL_OTP_DESIGN.md` to understand the requirements for the new native auth feature - MFA with Email OTP. Focus on:
    - Design section: help you understand the required changes for this new feature.
    - Flow diagram: help you understand the new MFA flow.
    - Codes in Sample codes section. Compare them with the sample codes in `custom_auth/ai_instructions/AI_INSTRUCTIONS.md` `Sample Code: Sign-In Flow` section to understand what changes are required.
3. You must review all relevant code in the [custom_auth](../../../../custom_auth/) folder to understand the current structure and avoid redundant or conflicting suggestions.
4. You must read ALL tasks listed in `MFA_EMAIL_OTP_TASKS.md` to understand the relationship between each task for implmeneting the MFA Email OTP feature.
5. You must read ALL sections `custom_auth/ai_instructions/AI_TESTING.md` to understand the stardard of write unit tests.
6. You must read ALL codes in the folder `lib/msal-browser/test/custom_auth` to understand the existing tests code to understand the patterns.

### Requirements

You must follow ALL rules below to generate the integration tests for new added MFA Email OTP feature the sign-in scenarios.

#### Generic Rules:

-   You must read all codes placed in the `lib/msal-browser/test/custom_auth/integration_tests`.
-   You must read the ALL sample codes in Sample codes section in `custom_auth/ai_instructions/development/MFA/MFA_EMAIL_OTP_DESIGN.md` to understand how the MFA Email OTP feature works in the sign-in flow.
-   The integration test you generate must for the sign in scenarios which place in the `lib/msal-browser/test/custom_auth/integration_tests/SignIn.spec.ts`
