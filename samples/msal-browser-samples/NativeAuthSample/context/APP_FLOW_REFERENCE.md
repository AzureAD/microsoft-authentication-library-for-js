# Native Auth Sample - Application Flow Reference

This document provides a comprehensive guide to understanding how the Native Auth Sample application works from a user perspective. It documents all authentication flows, UI components, configuration options, and user journeys to help test developers understand what they're testing.

## 🎯 Application Overview

The Native Auth Sample demonstrates Microsoft's Native Authentication flows for web applications. It supports multiple authentication scenarios including sign-in, sign-up, password reset, multi-factor authentication (MFA), and just-in-time (JIT) registration.

## 📋 Table of Contents

- [URL Configuration Parameters](#url-configuration-parameters)
- [Application Navigation](#application-navigation)
- [Sign In Flows](#sign-in-flows)
- [Sign Up Flows](#sign-up-flows)
- [Reset Password Flow](#reset-password-flow)
- [Sign Out Flow](#sign-out-flow)
- [Multi-Factor Authentication (MFA)](#multi-factor-authentication-mfa)
- [Just-In-Time (JIT) Registration](#just-in-time-jit-registration)
- [UI Components Reference](#ui-components-reference)
- [Error Handling](#error-handling)
- [Success States](#success-states)

---

## 🔧 URL Configuration Parameters

The application behavior is controlled by URL query parameters that determine which authentication flows are enabled:

### Core Flow Configuration
| Parameter | Values | Purpose | Example |
|-----------|--------|---------|---------|
| `usePwdConfig` | `true` | Enables Email + Password flows | `?usePwdConfig=true` |
| `useOtpConfig` | `true` | Enables Email + OTP flows | `?useOtpConfig=true` |
| `usePwdAttributesConfig` | `true` | Enables Email + Password with user attributes | `?usePwdAttributesConfig=true` |
| `useOtpAttributesConfig` | `true` | Enables Email + OTP with user attributes | `?useOtpAttributesConfig=true` |

### Advanced Configuration
| Parameter | Values | Purpose | Example |
|-----------|--------|---------|---------|
| `useMFA` | `true` | Enables Multi-Factor Authentication | `?usePwdConfig=true&useMFA=true` |
| `useRedirectConfig` | `true` | Forces redirect-only flows (limits challenge types) | `?useOtpConfig=true&useRedirectConfig=true` |

### Common Configurations
```
Email + Password:           ?usePwdConfig=true
Email + OTP:               ?useOtpConfig=true
Email + Password + MFA:    ?usePwdConfig=true&useMFA=true
Redirect-only scenario:    ?useOtpConfig=true&useRedirectConfig=true
```

---

## 🧭 Application Navigation

### Main Navigation Buttons
The application has a navigation bar at the top with these buttons:

| Button ID | Label | Purpose | Shows Card |
|-----------|-------|---------|------------|
| `#showSignInBtn` | "Sign In" | Switch to sign-in flow | `#signInCard` |
| `#showSignUpBtn` | "Sign Up" | Switch to sign-up flow | `#signUpCard` |
| `#showResetPasswordBtn` | "Reset Password" | Switch to password reset flow | `#resetPasswordCard` |
| `#navSignOutBtn` | "Sign Out" | Sign out current user | N/A |

### Navigation Behavior
- Only one form card is visible at a time
- Clicking a navigation button hides all other cards and shows the selected one
- The active button has the `.active` CSS class
- All authentication flow cards are hidden when switching between forms

---

## 🔐 Sign In Flows

### Sign In - Email + Password Flow

**Configuration:** `?usePwdConfig=true`

**User Journey:**
1. **Initial State**
   - User clicks `#showSignInBtn`
   - App shows `#signInCard`
   - User sees email input field (`#username`)

2. **Email Entry**
   - User types email address
   - User clicks `#signInBtn` ("Sign In")
   - App validates email and determines next step

3. **Password Input State**
   - App shows `#passwordInputCard`
   - App hides `#signInCard`
   - User sees password field (`#signInPassword`)
   - User types password
   - User clicks `#submitPasswordBtn` ("Submit Password")

4. **Success State**
   - Authentication completes
   - User is automatically signed in
   - `#authStatusBanner` shows "Signed in" message
   - Tokens are stored in sessionStorage

**Error Scenarios:**
- Non-registered email → Shows error banner with "user_not_found"
- Incorrect password → Shows error banner with "AADSTS50126"
- Already signed in → Shows error banner with "user_already_signed_in"

### Sign In - Email + OTP Flow

**Configuration:** `?useOtpConfig=true`

**User Journey:**
1. **Initial State**
   - User clicks `#showSignInBtn`
   - App shows `#signInCard`
   - User enters email and clicks `#signInBtn`

2. **OTP Verification State**
   - App shows `#codeVerificationCard`
   - App hides `#signInCard`
   - User receives OTP via email
   - User enters 8-digit code in `#verificationCode`
   - User clicks `#submitCodeBtn` ("Verify Code")

3. **Resend OTP (Optional)**
   - User can click `#resendCodeBtn` ("Resend Code")
   - New OTP is sent to email
   - User enters new code and submits

4. **Success State**
   - Authentication completes immediately after valid OTP
   - User is automatically signed in

**Error Scenarios:**
- Incorrect OTP → Shows error banner, user can resend or try again
- Redirect scenario → Shows error with "redirect" message

---

## 📝 Sign Up Flows

### Sign Up - Email + Password Flow

**Configuration:** `?usePwdConfig=true`

**User Journey:**
1. **Initial State**
   - User clicks `#showSignUpBtn`
   - App shows `#signUpCard`
   - User sees form fields:
     - `#signUpFirstName` (First Name)
     - `#signUpLastName` (Last Name)
     - `#signUpCity` (City) - optional
     - `#signUpCountry` (Country) - optional
     - `#signUpUsername` (Email)

2. **Form Submission**
   - User fills required fields
   - User clicks `#signUpBtn` ("Sign Up")
   - App validates input and initiates sign-up

3. **OTP Verification State**
   - App shows `#codeVerificationCard`
   - App hides `#signUpCard`
   - User receives OTP via email
   - User enters code in `#verificationCode`
   - User clicks `#submitCodeBtn` ("Verify Code")

4. **Password Creation State**
   - App shows `#signUpPasswordCard`
   - App hides `#codeVerificationCard`
   - User sees password field (`#signUpPassword`)
   - User creates password meeting requirements
   - User clicks `#submitSignUpPasswordBtn` ("Create Account")

5. **Automatic Sign-In**
   - Account is created successfully
   - User is automatically signed in
   - Authentication completes without additional steps

**Error Scenarios:**
- Invalid email format → Shows "AADSTS90100" error
- Existing email → Shows "user_already_exists: AADSTS1003037" error
- Invalid OTP → Shows "AADSTS50181" error with resend option
- Weak password → Shows password complexity error
- Already signed in → Shows "sign out first" error

### Sign Up - Email + OTP Flow

**Configuration:** `?useOtpConfig=true`

**User Journey:**
1. **Initial State**
   - User clicks `#showSignUpBtn`
   - App shows `#signUpCard`
   - User fills form fields (same as password flow)

2. **Form Submission**
   - User clicks `#signUpBtn`
   - App validates and initiates sign-up

3. **OTP Verification State**
   - App shows `#codeVerificationCard`
   - User receives and enters OTP
   - User clicks `#submitCodeBtn`

4. **Automatic Sign-In**
   - No password creation step
   - Account created and user signed in immediately
   - Authentication completes after OTP verification

---

## 🔄 Reset Password Flow

**Configuration:** `?usePwdConfig=true`

**User Journey:**
1. **Initial State**
   - User clicks `#showResetPasswordBtn`
   - App shows `#resetPasswordCard`
   - User sees email field (`#resetPasswordEmail`)

2. **Email Submission**
   - User enters email address
   - User clicks `#resetPasswordBtn` ("Reset Password")
   - App validates email and sends OTP

3. **OTP Verification State**
   - App shows `#codeVerificationCard`
   - App hides `#resetPasswordCard`
   - User receives OTP via email
   - User enters code in `#verificationCode`
   - User clicks `#submitCodeBtn` ("Verify Code")

4. **New Password Creation**
   - App shows `#resetPasswordNewPasswordCard`
   - App hides `#codeVerificationCard`
   - User sees password field (`#resetPasswordNewPassword`)
   - User creates new password
   - User clicks `#submitResetPasswordNewPasswordBtn` ("Reset Password")

5. **Automatic Sign-In**
   - Password reset successful
   - User is automatically signed in
   - Authentication completes

**Error Scenarios:**
- Non-existent email → Shows account not found error
- OTP-only account → Shows password not supported error
- Invalid OTP → Shows "AADSTS50181" error
- Weak password → Shows password complexity error
- Redirect scenario → Shows "AADSTS500222" error

---

## 🚪 Sign Out Flow

**Configuration:** Any configuration (sign-out available when user is signed in)

**Availability:** The sign-out button is available when a user is successfully authenticated.

**User Journey:**
1. **Pre-requisite State**
   - User must be successfully signed in
   - `#authStatusBanner` shows "Signed in as [email]"
   - `#navSignOutBtn` ("Sign Out") button is visible in navigation

2. **Sign Out Action**
   - User clicks `#navSignOutBtn` ("Sign Out")
   - App immediately processes sign-out request
   - No confirmation dialog or additional steps required

3. **Sign Out Complete**
   - Authentication session is terminated
   - All tokens are cleared from `sessionStorage`
   - `#authStatusBanner` updates to show "No user signed in"
   - User returns to unauthenticated state

**Behavior Notes:**
- Sign-out is immediate - no loading states or confirmation prompts
- All authentication forms remain accessible after sign-out
- User can immediately start a new authentication flow
- Browser session storage is completely cleared
- No network round-trip required for sign-out completion

**Success Indicators:**
- `#authStatusBanner` text contains "No user signed in"
- `sessionStorage` contains no authentication tokens
- User can navigate to any authentication form (sign-in, sign-up, reset password)

---

## 🔐 Multi-Factor Authentication (MFA)

**Configuration:** `?usePwdConfig=true&useMFA=true`

**Triggers:** MFA is required after successful primary authentication when enabled.

**User Journey:**
1. **Primary Authentication**
   - User completes normal sign-in flow (email + password)
   - Instead of completing authentication, MFA is triggered

2. **MFA Method Selection**
   - App shows `#mfaMethodSelectionCard`
   - User sees dropdown (`#mfaAuthMethodSelect`) with available methods
   - Methods may include: Email OTP, SMS, etc.
   - User selects preferred method
   - User clicks `#submitMfaMethodBtn` ("Continue")

3. **MFA Challenge**
   - App shows `#mfaChallengeCard`
   - App hides `#mfaMethodSelectionCard`
   - User receives verification code via selected method
   - User enters code in `#mfaChallengeCode`
   - User clicks `#submitMfaChallengeBtn` ("Verify Code")

4. **Authentication Complete**
   - MFA verification successful
   - User is fully authenticated
   - Tokens include MFA claims

---

## ⚡ Just-In-Time (JIT) Registration

**Configuration:** `?usePwdConfig=true&useMFA=true`

**Triggers:** JIT is required when a user completes an authentication flow but hasn't set up required MFA methods. JIT can be triggered in three scenarios:
- **During Sign-Up:** After account creation when MFA setup is required
- **During Sign-In:** When existing account lacks required authentication methods  
- **After Reset Password:** When password reset succeeds but account needs MFA setup

### Scenario 1: During Sign-Up
**User Journey:**
1. **Normal Sign-Up Flow**
   - User completes sign-up with email, OTP verification, and password creation
   - Instead of completing authentication, JIT is triggered

2. **JIT Method Selection**
   - App shows `#jitMethodSelectionCard`
   - User sees dropdown (`#jitAuthMethodSelect`) with available methods
   - User sees contact field (`#jitVerificationContact`)
   - User selects method and enters contact information
   - User clicks `#submitJitMethodBtn` ("Continue")

3. **JIT Challenge**
   - App shows `#jitChallengeCard`
   - User receives verification code via selected method
   - User enters code in `#jitChallengeCode`
   - User clicks `#submitJitChallengeBtn` ("Verify Code")

4. **Authentication Complete**
   - JIT registration successful
   - User is automatically signed in
   - User is fully authenticated

### Scenario 2: During Sign-In
**User Journey:**
1. **Normal Sign-In Flow**
   - User signs in with existing account (email + password)
   - Account exists but lacks required authentication methods

2. **JIT Triggered**
   - App shows `#jitMethodSelectionCard` instead of completing sign-in
   - Flow continues same as Scenario 1

### Scenario 3: After Reset Password (MFA Configuration)
**Configuration:** `?usePwdConfig=true&useMFA=true`

**User Journey:**
1. **Normal Reset Password Flow**
   - User completes reset password flow (email → OTP verification → new password creation)
   - Password reset is successful

2. **JIT Triggered Instead of Auto Sign-In**
   - Instead of automatic sign-in, JIT is triggered because account lacks required MFA methods
   - App shows `#jitMethodSelectionCard` instead of completing authentication

3. **JIT Method Selection**
   - User sees dropdown (`#jitAuthMethodSelect`) with available authentication methods
   - User sees contact field (`#jitVerificationContact`)
   - User selects method and enters contact information
   - User clicks `#submitJitMethodBtn` ("Continue")

4. **JIT Challenge**
   - App shows `#jitChallengeCard`
   - User receives verification code via selected method
   - User enters code in `#jitChallengeCode`
   - User clicks `#submitJitChallengeBtn` ("Verify Code")

5. **Authentication Complete**
   - JIT registration successful
   - User is automatically signed in
   - User is fully authenticated with MFA methods registered

---

## 🎨 UI Components Reference

### Main Cards
| Card ID | Purpose | Visible When |
|---------|---------|--------------|
| `#signInCard` | Sign-in form | User clicks "Sign In" |
| `#signUpCard` | Sign-up form | User clicks "Sign Up" |
| `#resetPasswordCard` | Password reset form | User clicks "Reset Password" |
| `#codeVerificationCard` | OTP input form | OTP verification needed |
| `#passwordInputCard` | Password input for sign-in | Password required for sign-in |
| `#signUpPasswordCard` | Password creation for sign-up | Password creation in sign-up |
| `#resetPasswordNewPasswordCard` | New password for reset | New password creation |
| `#mfaMethodSelectionCard` | MFA method selection | MFA setup required |
| `#mfaChallengeCard` | MFA verification | MFA challenge needed |
| `#jitMethodSelectionCard` | JIT method selection | JIT registration required |
| `#jitChallengeCard` | JIT verification | JIT challenge needed |

### Form Fields
| Field ID | Type | Purpose | Used In |
|----------|------|---------|---------|
| `#username` | text | Email/username input | Sign-in |
| `#signUpFirstName` | text | First name | Sign-up |
| `#signUpLastName` | text | Last name | Sign-up |
| `#signUpCity` | text | City (optional) | Sign-up |
| `#signUpCountry` | text | Country (optional) | Sign-up |
| `#signUpUsername` | email | Email for sign-up | Sign-up |
| `#resetPasswordEmail` | email | Email for password reset | Reset password |
| `#signInPassword` | password | Password for sign-in | Sign-in |
| `#signUpPassword` | password | Password creation | Sign-up |
| `#resetPasswordNewPassword` | password | New password | Reset password |
| `#verificationCode` | text | OTP code input | All OTP flows |
| `#mfaAuthMethodSelect` | select | MFA method selection | MFA |
| `#mfaChallengeCode` | text | MFA verification code | MFA |
| `#jitAuthMethodSelect` | select | JIT method selection | JIT |
| `#jitVerificationContact` | text | JIT contact info | JIT |
| `#jitChallengeCode` | text | JIT verification code | JIT |

### Action Buttons
| Button ID | Label | Purpose | Card |
|-----------|-------|---------|------|
| `#signInBtn` | "Sign In" | Submit sign-in form | `#signInCard` |
| `#signUpBtn` | "Sign Up" | Submit sign-up form | `#signUpCard` |
| `#resetPasswordBtn` | "Reset Password" | Submit reset request | `#resetPasswordCard` |
| `#submitPasswordBtn` | "Submit Password" | Submit password | `#passwordInputCard` |
| `#submitSignUpPasswordBtn` | "Create Account" | Submit new password | `#signUpPasswordCard` |
| `#submitResetPasswordNewPasswordBtn` | "Reset Password" | Submit new password | `#resetPasswordNewPasswordCard` |
| `#submitCodeBtn` | "Verify Code" | Submit OTP code | `#codeVerificationCard` |
| `#resendCodeBtn` | "Resend Code" | Request new OTP | `#codeVerificationCard` |
| `#cancelCodeBtn` | "Cancel" | Cancel OTP flow | `#codeVerificationCard` |
| `#submitMfaMethodBtn` | "Continue" | Submit MFA method | `#mfaMethodSelectionCard` |
| `#submitMfaChallengeBtn` | "Verify Code" | Submit MFA code | `#mfaChallengeCard` |
| `#submitJitMethodBtn` | "Continue" | Submit JIT method | `#jitMethodSelectionCard` |
| `#submitJitChallengeBtn` | "Verify Code" | Submit JIT code | `#jitChallengeCard` |

---

## ❌ Error Handling

### Error Banner System
- **Element:** `#errorBanner` - The main error container
- **Message:** `#errorMessage` - Contains the error text
- **Dismiss:** `#dismissErrorBtn` - Button to close error banner
- **Behavior:** Error banner appears above content, can be dismissed by user

### Common Error Messages
| Error Type | Error Message Contains | When It Occurs |
|------------|------------------------|----------------|
| User not found | "user_not_found" | Non-registered email in sign-in |
| Wrong password | "AADSTS50126" | Incorrect password |
| Invalid email format | "AADSTS90100" | Malformed email address |
| User already exists | "user_already_exists" | Email already registered |
| Invalid OTP | "AADSTS50181" | Wrong verification code |
| Password complexity | "password" or "requirement" | Password doesn't meet rules |
| Already signed in | "user_already_signed_in" | Attempting operation while signed in |
| Redirect required | "redirect" | Unsupported flow configuration |
| Reset password error | "AADSTS500222" | Reset not supported for account type |

### Error Flow Behavior
1. Error occurs during form submission
2. `#errorBanner` becomes visible with appropriate message
3. User can dismiss error by clicking `#dismissErrorBtn`
4. User remains on current form to retry or correct input
5. Some errors allow retry (OTP), others require different action

---

## ✅ Success States

### Authentication Status Banner
- **Element:** `#authStatusBanner`
- **Signed In:** Shows "Signed in as [email]" with green styling (`.auth-status-signed-in`)
- **Signed Out:** Shows "Not signed in" with red styling (`.auth-status-signed-out`)

### Authentication Completion
**Successful Authentication Results In:**
1. **UI Updates:**
   - `#authStatusBanner` shows signed-in status
   - All auth forms are hidden/reset
   - User sees authenticated state

2. **Token Storage:**
   - Access tokens stored in `sessionStorage`
   - ID tokens with user claims available
   - Refresh tokens for token renewal

3. **Account Information:**
   - User profile data accessible
   - Account claims and attributes available
   - Authentication methods registered (for MFA/JIT scenarios)

### Flow Completion Indicators
| Flow Type | Completion Indicator |
|-----------|---------------------|
| Sign In | Authentication banner + tokens in storage |
| Sign Up | Auto sign-in after account creation |
| Password Reset | Auto sign-in after password update |
| Password Reset + JIT | Full authentication after MFA method registration |
| MFA | Full authentication with MFA claims |
| JIT | Full authentication with registered methods |

---

## 🔧 Developer Testing Notes

### URL Testing Patterns
```
# Basic flows
/app?usePwdConfig=true          # Email + Password
/app?useOtpConfig=true          # Email + OTP

# Advanced flows  
/app?usePwdConfig=true&useMFA=true     # With MFA
/app?useOtpConfig=true&useRedirectConfig=true  # Redirect scenario

# Attributes
/app?usePwdAttributesConfig=true       # Sign-up with attributes
```

### State Validation Points
1. **Page Load:** Verify `#pca-initialized` element contains "true"
2. **Form Display:** Check correct card is visible and others are hidden
3. **Navigation:** Verify active button state and card switching
4. **Authentication:** Check `#authStatusBanner` and sessionStorage tokens
5. **Errors:** Verify `#errorBanner` visibility and message content

### Common Test Scenarios
- **Positive flows:** Happy path with valid inputs
- **Negative flows:** Invalid inputs, error handling, retry scenarios
- **Navigation flows:** Switching between forms, maintaining state
- **Configuration flows:** Different URL parameters and their effects
- **Edge cases:** Already signed in, missing methods, unsupported scenarios

This reference provides the complete application behavior context needed for comprehensive test development and validation.
