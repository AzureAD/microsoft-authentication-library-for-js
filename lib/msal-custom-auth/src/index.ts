/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// Application and Controller
export { CustomAuthPublicClientApplication } from "./CustomAuthPublicClientApplication.js";
export { ICustomAuthPublicClientApplication } from "./ICustomAuthPublicClientApplication.js";
export { ICustomAuthStandardController } from "./controller/ICustomAuthStandardController.js";

// Configuration
export { CustomAuthConfiguration } from "./configuration/CustomAuthConfiguration.js";

// Account Data
export { CustomAuthAccountData } from "./get_account/auth_flow/CustomAuthAccountData.js";

// Operation Inputs
export {
    CustomAuthActionInputs,
    SignInInputs,
    SignUpInputs,
    ResetPasswordInputs,
    AccountRetrievalInputs,
} from "./CustomAuthActionInputs.js";

// Operation Results
export { GetAccountResult } from "./get_account/auth_flow/result/GetAccountResult.js";
export { SignInResult } from "./sign_in/auth_flow/result/SignInResult.js";
export { SignOutResult } from "./get_account/auth_flow/result/SignOutResult.js";
export { SignUpResult } from "./sign_up/auth_flow/result/SignUpResult.js";
export { ResetPasswordStartResult } from "./reset_password/auth_flow/result/ResetPasswordStartResult.js";

// Operation Errors
export { GetAccountError } from "./get_account/auth_flow/error_type/GetAccountError.js";
export { SignInError } from "./sign_in/auth_flow/error_type/SignInError.js";
export { SignUpError } from "./sign_up/auth_flow/error_type/SignUpError.js";
export { ResetPasswordError } from "./reset_password/auth_flow/error_type/ResetPasswordError.js";

// Handler Factory
export { AuthFlowStateHandlerFactory } from "./core/auth_flow/AuthFlowStateHandlerFactory.js";

// Sign-in Handlers
export { SignInCodeRequiredStateHandler } from "./sign_in/auth_flow/state_handler/SignInCodeRequiredStateHandler.js";
export { SignInContinuationStateHandler } from "./sign_in/auth_flow/state_handler/SignInContinuationStateHandler.js";
export { SignInPasswordRequiredStateHandler } from "./sign_in/auth_flow/state_handler/SignInPasswordRequiredStateHandler.js";

// Sign-in Handler Results
export { SignInSubmitCodeResult } from "./sign_in/auth_flow/result/SignInSubmitCodeResult.js";
export { SignInResendCodeResult } from "./sign_in/auth_flow/result/SignInResendCodeResult.js";
export { SignInSubmitPasswordResult } from "./sign_in/auth_flow/result/SignInSubmitPasswordResult.js";

// Sign up User Account Attributes
export { UserAccountAttributes } from "./UserAccountAttributes.js";

// Sign-up Handlers
export { SignUpAttributesRequiredStateHandler } from "./sign_up/auth_flow/state_handler/SignUpAttributesRequiredStateHandler.js";
export { SignUpCodeRequiredStateHandler } from "./sign_up/auth_flow/state_handler/SignUpCodeRequiredStateHandler.js";
export { SignUpPasswordRequiredStateHandler } from "./sign_up/auth_flow/state_handler/SignUpPasswordRequiredStateHandler.js";

// Sign-up handler results
export { SignUpSubmitAttributesResult } from "./sign_up/auth_flow/result/SignUpSubmitAttributesResult.js";
export { SignUpSubmitCodeResult } from "./sign_up/auth_flow/result/SignUpSubmitCodeResult.js";
export { SignUpResendCodeResult } from "./sign_up/auth_flow/result/SignUpResendCodeResult.js";
export { SignUpSubmitPasswordResult } from "./sign_up/auth_flow/result/SignUpSubmitPasswordResult.js";

// Reset Password Handlers
export { ResetPasswordCodeRequiredStateHandler } from "./reset_password/auth_flow/state_handler/ResetPasswordCodeRequiredStateHandler.js";
export { ResetPasswordPasswordRequiredStateHandler } from "./reset_password/auth_flow/state_handler/ResetPasswordPasswordRequiredStateHandler.js";

// Reset Password handler results
export { ResetPasswordSubmitCodeResult } from "./reset_password/auth_flow/result/ResetPasswordSubmitCodeResult.js";
export { ResetPasswordResendCodeResult } from "./reset_password/auth_flow/result/ResetPasswordResendCodeResult.js";
export { ResetPasswordSubmitPasswordResult } from "./reset_password/auth_flow/result/ResetPasswordSubmitPasswordResult.js";

// Get Access Token
export { GetAccessTokenResult } from "./get_account/auth_flow/result/GetAccessTokenResult.js";

// Errors
export { CustomAuthApiError } from "./core/error/CustomAuthApiError.js";
export { CustomAuthError } from "./core/error/CustomAuthError.js";
export { HttpError } from "./core/error/HttpError.js";
export { InvalidArgumentError } from "./core/error/InvalidArgumentError.js";
export { InvalidConfigurationError } from "./core/error/InvalidConfigurationError.js";
export { MethodNotImplementedError } from "./core/error/MethodNotImplementedError.js";
export { MsalCustomAuthError } from "./core/error/MsalCustomAuthError.js";
export { NoCachedAccountFoundError } from "./core/error/NoCachedAccountFoundError.js";
export { ParsedUrlError } from "./core/error/ParsedUrlError.js";
export { UnexpectedError } from "./core/error/UnexpectedError.js";
export { UnsupportedEnvironmentError } from "./core/error/UnsupportedEnvironmentError.js";
export { UserAccountAttributeError } from "./core/error/UserAccountAttributeError.js";
export { UserAlreadySignedInError } from "./core/error/UserAlreadySignedInError.js";

// Components from msal_browser
export { LogLevel } from "@azure/msal-browser";
