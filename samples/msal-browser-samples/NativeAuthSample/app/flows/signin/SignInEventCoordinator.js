/*
 * Sign-In Event Coordinator for MSAL Native Auth Sample
 *
 * Coordinates event handling for SignIn flow by:
 * 1. Managing basic authentication handlers (signin, code, password)
 * 2. Delegating JIT registration to shared JitAuthHandlers (via BaseEventCoordinator)
 * 3. Delegating MFA verification to shared MfaAuthHandlers (via BaseEventCoordinator)
 */

import uiManager from "../../ui/ui.js";
import { BaseEventCoordinator } from "../../shared/BaseEventCoordinator.js";
import { codeVerificationManager } from "../../ui/CodeVerificationManager.js";
import { getClaimsForAuth } from "../../configParser.js";

export class SignInEventCoordinator extends BaseEventCoordinator {
    constructor(uiManager, msalInstance) {
        // Call parent constructor with msalInstance and flowType
        super(uiManager, msalInstance, "signin");

        // Store SDK state for continuation methods
        this.signInState = null;
    }

    /**
     * Initialize sign-in specific event listeners
     * Called by BaseEventCoordinator.initializeEventListeners()
     */
    initializeFlowSpecificListeners() {
        // Form submissions
        const signInForm = document.getElementById("signInForm");
        if (signInForm) {
            signInForm.addEventListener(
                "submit",
                this.handleSignInSubmit.bind(this)
            );
            console.log("Sign-in form event listener attached");
        } else {
            console.warn("Sign-in form not found in DOM");
        }

        // Code verification form handlers are now set up dynamically in setupCodeVerificationHandlers
        // This prevents conflicts with SignUpUIManager handlers

        // Password input form
        const passwordInputForm = document.getElementById("passwordInputForm");
        if (passwordInputForm) {
            passwordInputForm.addEventListener(
                "submit",
                this.handlePasswordSubmit.bind(this)
            );
        }

        const cancelPasswordBtn = document.getElementById("cancelPasswordBtn");
        if (cancelPasswordBtn) {
            cancelPasswordBtn.addEventListener(
                "click",
                this.handleCancelPassword.bind(this)
            );
        }

        // Navigation buttons
        const showSignInBtn = document.getElementById("showSignInBtn");
        if (showSignInBtn) {
            showSignInBtn.addEventListener(
                "click",
                this.uiManager.showSignInForm.bind(this.uiManager)
            );
        }
    }

    // ========== Sign-In Flow Handlers ==========
    async handleSignInSubmit(event) {
        event.preventDefault();

        const signInBtn = document.getElementById("signInBtn");
        const originalText = signInBtn ? signInBtn.textContent : "Sign In";

        try {
            // Show loading state
            if (signInBtn)
                this.uiManager.setButtonLoading(signInBtn, "Signing in...");

            // Get form data
            const formData = new FormData(event.target);
            const username = formData.get("username");

            if (!username) {
                throw new Error("Username is required");
            }

            // Get claims if useMFA=true in URL params (must be JSON string)
            const claimsObject = getClaimsForAuth();
            const claims = claimsObject
                ? JSON.stringify(claimsObject)
                : undefined;

            // Call MSAL SDK directly
            const result = await this.msalInstance.signIn({
                username: username,
                ...(claims && { claims }),
            });

            // Store state for continuation methods
            this.signInState = result.state;

            // Log flow state for debugging
            console.log("Sign-in flow state:", {
                isCompleted: result.isCompleted(),
                isCodeRequired: result.isCodeRequired(),
                isPasswordRequired: result.isPasswordRequired(),
                isAuthMethodRegistrationRequired:
                    result.isAuthMethodRegistrationRequired(),
                isMfaRequired: result.isMfaRequired(),
                isFailed: result.isFailed(),
            });

            if (result.isCompleted()) {
                // Notify main UI manager about successful sign-in
                const account = result.data;
                if (account) {
                    uiManager.updateAccountInfo(account);
                }

                // Clear the form on success
                event.target.reset();
            } else if (result.isCodeRequired()) {
                // Show code verification form
                this.uiManager.showCodeVerificationForm(username);
            } else if (result.isPasswordRequired()) {
                // Show password input form
                this.uiManager.showPasswordInputForm(username);
            } else if (result.isAuthMethodRegistrationRequired()) {
                // Show JIT method selection form
                const authMethods = this.signInState.getAuthMethods();
                this.uiManager.showJitMethodForm(authMethods);
            } else if (result.isMfaRequired()) {
                // Show MFA method selection form
                const authMethods = this.signInState.getAuthMethods();
                this.uiManager.showMfaMethodForm(authMethods);
            } else if (result.isFailed()) {
                // Handle other failure cases
                const error = result.error?.errorData;
                console.error("Sign-in failed");
                throw new Error(
                    error?.message ||
                        error ||
                        "An error occurred during sign-in"
                );
            }
        } catch (error) {
            console.error(`Sign-in error: ${error.message || error}`);
            if (error.errorData) {
                console.error(
                    `Error details: ${JSON.stringify(error.errorData, null, 2)}`
                );
            } else if (error.error && error.error.errorData) {
                console.error(
                    `Error details: ${JSON.stringify(
                        error.error.errorData,
                        null,
                        2
                    )}`
                );
            }

            // Check if error is "User has already signed in" - if so, update account info
            if (error.message && error.message.includes("already signed in")) {
                console.log(
                    "🔍 SIGNIN: User already signed in, fetching current account"
                );
                try {
                    const accountResult =
                        await this.msalInstance.getCurrentAccount();
                    if (accountResult.success && accountResult.account) {
                        uiManager.updateAccountInfo(accountResult.account);
                        console.log(
                            "🔍 SIGNIN: Account info updated for already signed-in user"
                        );
                        // Don't show error banner for "already signed in" case
                        return;
                    }
                } catch (getAccountError) {
                    console.error(
                        `Error getting current account: ${getAccountError}`
                    );
                }
            }

            // Show error in the UI for other errors
            uiManager.showErrorBanner(error.message, "signin");
        } finally {
            if (signInBtn) this.uiManager.resetButton(signInBtn, originalText);
        }
    }

    /**
     * Set up handlers for code verification form
     * Uses the CodeVerificationManager to properly manage handlers for the shared
     * code verification form across different flows (signin/signup/resetpassword).
     */
    setupCodeVerificationHandlers(context = "signin") {
        console.log(
            `Setting up code verification handlers for context: ${context}`
        );

        // Use CodeVerificationManager to set up handlers for signin context
        codeVerificationManager.setupForContext(
            "signin",
            this.handleCodeSubmit.bind(this),
            this.handleResendCode.bind(this),
            this.handleCancelCode.bind(this)
        );
    }

    async handleCodeSubmit(event) {
        event.preventDefault();

        console.log("🔍 SIGNIN UI MANAGER: handleCodeSubmit called");

        const submitCodeBtn = document.getElementById("submitCodeBtn");
        const originalText = submitCodeBtn
            ? submitCodeBtn.textContent
            : "Verify Code";

        try {
            // Show loading state
            if (submitCodeBtn)
                this.uiManager.setButtonLoading(submitCodeBtn, "Verifying...");

            // Get form data
            const formData = new FormData(event.target);
            const code = formData.get("code");

            if (!code) {
                throw new Error("Verification code is required");
            }

            if (!this.signInState) {
                throw new Error("No pending sign-in operation");
            }

            // Call the code submission method using stored state
            const result = await this.signInState.submitCode(code);

            // Only update state if not failed - preserve the state that has submitCode/resendCode methods
            // If failed, keep the previous state so user can retry with resendCode
            if (!result.isFailed()) {
                this.signInState = result.state;
            }

            // Log flow state after code submission
            console.log("Code submit result state:", {
                isCompleted: result.isCompleted(),
                isAuthMethodRegistrationRequired:
                    result.isAuthMethodRegistrationRequired(),
                isMfaRequired: result.isMfaRequired(),
                isFailed: result.isFailed(),
            });

            if (result.isCompleted()) {
                // Notify main UI manager about successful verification
                const account = result.data;
                if (account) {
                    uiManager.updateAccountInfo(account);
                }
                this.uiManager.hideCodeVerificationForm();

                // Clear the form on success
                event.target.reset();
            } else if (result.isAuthMethodRegistrationRequired()) {
                // Reset button before transitioning to JIT flow
                if (submitCodeBtn)
                    this.uiManager.resetButton(submitCodeBtn, originalText);

                // Show JIT method selection form
                const authMethods = this.signInState.getAuthMethods();
                this.uiManager.showJitMethodForm(authMethods);
            } else if (result.isMfaRequired()) {
                // Reset button before transitioning to MFA flow
                if (submitCodeBtn)
                    this.uiManager.resetButton(submitCodeBtn, originalText);

                // Show MFA method selection form
                const authMethods = this.signInState.getAuthMethods();
                this.uiManager.showMfaMethodForm(authMethods);
            } else if (result.isFailed()) {
                const error = result.error?.errorData;
                throw new Error(
                    error.message || error || "Code verification failed"
                );
            }
        } catch (error) {
            console.error(`Code verification error: ${error.message || error}`);
            if (error.errorData) {
                console.error(
                    `Error details: ${JSON.stringify(error.errorData, null, 2)}`
                );
            } else if (error.error && error.error.errorData) {
                console.error(
                    `Error details: ${JSON.stringify(
                        error.error.errorData,
                        null,
                        2
                    )}`
                );
            }
            // Show error in the UI
            uiManager.showErrorBanner(
                error.message || "An error occurred during code verification",
                "signin"
            );
        } finally {
            if (submitCodeBtn)
                this.uiManager.resetButton(submitCodeBtn, originalText);
        }
    }

    async handleResendCode() {
        const resendCodeBtn = document.getElementById("resendCodeBtn");
        const originalText = resendCodeBtn
            ? resendCodeBtn.textContent
            : "Resend Code";

        try {
            // Show loading state
            if (resendCodeBtn)
                this.uiManager.setButtonLoading(resendCodeBtn, "Resending...");

            if (!this.signInState) {
                throw new Error("No pending sign-in operation");
            }

            // Call the resend code method using stored state
            const result = await this.signInState.resendCode();

            // Always update state after resendCode - this gives us a fresh state with submitCode method
            if (result.state) {
                this.signInState = result.state;
            }

            if (result.isCodeRequired()) {
                console.log("Verification code resent successfully");
            } else if (result.isFailed()) {
                const error = result.error?.errorData;
                throw new Error(
                    error.message ||
                        error ||
                        "Failed to resend verification code"
                );
            }
        } catch (error) {
            console.error(`Resend code error: ${error.message || error}`);
            if (error.errorData) {
                console.error(
                    `Error details: ${JSON.stringify(error.errorData, null, 2)}`
                );
            } else if (error.error && error.error.errorData) {
                console.error(
                    `Error details: ${JSON.stringify(
                        error.error.errorData,
                        null,
                        2
                    )}`
                );
            }
            // Show error in the UI
            uiManager.showErrorBanner(
                error.message || "Failed to resend verification code",
                "signin"
            );
        } finally {
            if (resendCodeBtn)
                this.uiManager.resetButton(resendCodeBtn, originalText);
        }
    }

    handleCancelCode() {
        // Hide the code verification form and return to sign-in
        this.uiManager.hideCodeVerificationForm();
        console.log("Code verification cancelled");

        // Clear stored state
        this.signInState = null;
    }

    async handlePasswordSubmit(event) {
        event.preventDefault();

        const submitPasswordBtn = document.getElementById("submitPasswordBtn");
        const originalText = submitPasswordBtn
            ? submitPasswordBtn.textContent
            : "Verify Password";

        try {
            // Show loading state
            if (submitPasswordBtn)
                this.uiManager.setButtonLoading(
                    submitPasswordBtn,
                    "Verifying..."
                );

            // Get form data
            const formData = new FormData(event.target);
            const password = formData.get("password");

            if (!password) {
                throw new Error("Password is required");
            }

            if (!this.signInState) {
                throw new Error("No pending sign-in operation");
            }

            // Call the password submission method using stored state
            const result = await this.signInState.submitPassword(password);

            console.log(JSON.stringify(result));

            // Update state for next continuation
            this.signInState = result.state;

            if (result.isFailed()) {
                console.log("Password verification failed");
                const error = result.error?.errorData;
                throw new Error(
                    error.message || error || "Password verification failed"
                );
            }

            if (result.isCompleted()) {
                // Notify main UI manager about successful verification
                const account = result.data;
                console.log(account);
                if (account) {
                    uiManager.updateAccountInfo(account);
                }

                // Reset button before hiding the form
                if (submitPasswordBtn)
                    this.uiManager.resetButton(submitPasswordBtn, originalText);

                this.uiManager.hidePasswordInputForm();

                // Clear the form on success
                event.target.reset();
            }

            if (result.isAuthMethodRegistrationRequired()) {
                console.log("Transitioning to JIT flow");
                // Reset button before transitioning to JIT flow
                if (submitPasswordBtn)
                    this.uiManager.resetButton(submitPasswordBtn, originalText);

                // Show JIT method selection form
                const authMethods = this.signInState.getAuthMethods();
                this.uiManager.showJitMethodForm(authMethods);
            }

            if (result.isMfaRequired()) {
                console.log("Transitioning to MFA flow");
                // Reset button before transitioning to MFA flow
                if (submitPasswordBtn)
                    this.uiManager.resetButton(submitPasswordBtn, originalText);

                // Show MFA method selection form
                const authMethods = this.signInState.getAuthMethods();
                this.uiManager.showMfaMethodForm(authMethods);
            }
        } catch (error) {
            console.error(
                `Password verification error: ${error.message || error}`
            );
            if (error.errorData) {
                console.error(
                    `Error details: ${JSON.stringify(error.errorData, null, 2)}`
                );
            } else if (error.error && error.error.errorData) {
                console.error(
                    `Error details: ${JSON.stringify(
                        error.error.errorData,
                        null,
                        2
                    )}`
                );
            }
            // Show error in the UI
            uiManager.showErrorBanner(
                error.message || "Invalid password or authentication error",
                "signin"
            );

            // Reset button so user can retry
            if (submitPasswordBtn)
                this.uiManager.resetButton(submitPasswordBtn, originalText);
        }
    }

    handleCancelPassword() {
        // Hide the password input form and return to sign-in
        this.uiManager.hidePasswordInputForm();
        console.log("Password input cancelled");

        // Clear stored state
        this.signInState = null;
    }

    // ========== Helper Methods for JIT/MFA ==========
    // These methods provide state access for shared handlers

    /**
     * Get current state object for shared handlers
     */
    getPendingState() {
        return this.signInState;
    }

    /**
     * Update state after continuation methods
     */
    setPendingState(state) {
        this.signInState = state;
    }

    /**
     * Clear pending operation
     */
    clearPendingOperation() {
        this.signInState = null;
    }
}
