# Requirements Document

## Introduction

The Just-In-Time (JIT) MFA feature enables Native Authentication users to register strong authentication methods on-demand during sign-in when multi-factor authentication is required. This aligns the Native Authentication experience with web-based CIAM scenarios by removing automatic email registration during sign-up and allowing users to choose their preferred strong authentication method when MFA is triggered.

## Requirements

### Requirement 1

**User Story:** As a Native Authentication user, I want to register a strong authentication method during sign-in when MFA is required, so that I can complete the authentication flow with my preferred method.

#### Acceptance Criteria

1. WHEN a user signs in and MFA is required AND no strong authentication method is registered THEN the system SHALL present available authentication methods for registration
2. WHEN the user selects an authentication method THEN the system SHALL initiate the challenge process for that method
3. WHEN the challenge is successfully verified THEN the system SHALL register the authentication method and complete the sign-in flow
4. IF the user chooses the same email used during sign-up THEN the system SHALL use fast-pass verification without requiring additional email verification

### Requirement 2

**User Story:** As a Native Authentication user, I want to receive and verify challenges for my chosen authentication method, so that I can prove ownership of the method being registered.

#### Acceptance Criteria

1. WHEN an authentication method is selected for registration THEN the system SHALL send a challenge to the specified contact (email/phone)
2. WHEN a challenge is sent THEN the system SHALL provide feedback about the challenge delivery including target contact and expected code length
3. WHEN the user submits a verification code THEN the system SHALL validate the code against the sent challenge
4. IF the verification code is incorrect THEN the system SHALL return an error with helper method `isIncorrectChallenge()`
5. WHEN the user requests to resend a challenge THEN the system SHALL send a new challenge to the same contact

### Requirement 3

**User Story:** As a Native Authentication user, I want the JIT flow to integrate seamlessly with existing sign-in flows, so that my authentication experience remains consistent.

#### Acceptance Criteria

1. WHEN JIT is required during standard sign-in THEN the system SHALL transition to JIT flow after password submission
2. WHEN JIT is required during sign-in with continuation token after sign-up THEN the system SHALL transition to JIT flow
3. WHEN JIT is required during sign-in with continuation token after SSPR THEN the system SHALL transition to JIT flow
4. WHEN JIT is required during non-interactive token acquisition THEN the system SHALL return an error directing the user to sign in interactively
5. WHEN JIT flow is completed THEN the system SHALL return to the original sign-in flow and complete authentication

### Requirement 4

**User Story:** As a developer using the Native Authentication SDK, I want clear state machine patterns for JIT flow, so that I can build predictable user experiences.

#### Acceptance Criteria

1. WHEN JIT is required THEN the system SHALL return `AuthMethodRegistrationRequiredState` with available authentication methods
2. WHEN an authentication method is challenged THEN the system SHALL return either `AuthMethodVerificationRequiredState` or `AuthMethodRegistrationCompletedState`
3. WHEN verification is required THEN the state SHALL provide `submitChallenge()` and `challengeAuthMethod()` methods
4. WHEN JIT flow is completed THEN the system SHALL return `AuthMethodRegistrationCompletedState` with authentication result
5. IF JIT flow fails THEN the system SHALL return `AuthMethodRegistrationFailedState` with error details

### Requirement 5

**User Story:** As a developer using the Native Authentication SDK, I want comprehensive error handling for JIT scenarios, so that I can provide meaningful feedback to users.

#### Acceptance Criteria

1. WHEN an incorrect verification contact is provided THEN the error SHALL have helper method `isIncorrectVerificationContact()`
2. WHEN an incorrect challenge code is submitted THEN the error SHALL have helper method `isIncorrectChallenge()`
3. WHEN redirect is required for fallback authentication THEN the error SHALL have helper method `isRedirectRequired()`
4. WHEN JIT is required during non-interactive flows THEN the system SHALL return a specific error directing to interactive sign-in
5. IF any JIT API call fails THEN the system SHALL return structured error data without throwing exceptions

### Requirement 6

**User Story:** As a Native Authentication user, I want support for multiple authentication method types, so that I can choose the method that works best for me.

#### Acceptance Criteria

1. WHEN authentication methods are enumerated THEN the system SHALL support email authentication method type
2. WHEN the system is extended THEN it SHALL support adding SMS and voice methods without breaking changes
3. WHEN an authentication method is selected THEN the system SHALL validate the method is available for the user
4. WHEN method details are provided THEN the system SHALL accept `authMethodType` and `verificationContact` parameters
5. IF an unsupported method is requested THEN the system SHALL return an appropriate error

### Requirement 7

**User Story:** As a developer integrating Native Authentication, I want the JIT feature to follow existing SDK patterns, so that the learning curve is minimal.

#### Acceptance Criteria

1. WHEN using JIT APIs THEN they SHALL follow the same result object patterns as other Native Auth flows
2. WHEN JIT states are created THEN they SHALL extend base state classes and follow naming conventions
3. WHEN JIT network calls are made THEN they SHALL use the existing HTTP client infrastructure
4. WHEN JIT errors occur THEN they SHALL follow the same error handling patterns as other flows
5. WHEN JIT is integrated THEN it SHALL maintain backward compatibility for existing sign-in flows

### Requirement 8

**User Story:** As a Native Authentication user, I want fast-pass verification when using the same email from sign-up, so that I don't need to verify the same email twice.

#### Acceptance Criteria

1. WHEN the user selects the same email used during sign-up for MFA registration THEN the system SHALL use fast-pass verification
2. WHEN fast-pass is available THEN the challenge endpoint SHALL return `preverified` challenge type
3. WHEN fast-pass is used THEN the system SHALL complete registration without requiring code verification
4. WHEN fast-pass is not available THEN the system SHALL proceed with normal challenge verification
5. IF the user chooses a different email than sign-up THEN the system SHALL require normal verification process
