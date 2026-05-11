/*
 * Sign-Up Event Coordinator for MSAL Native Auth Sample
 *
 * Coordinates event handling for SignUp flow by:
 * 1. Managing signup-specific authentication handlers (signup, code, password, attributes)
 * 2. Delegating JIT registration to shared JitAuthHandlers (via BaseEventCoordinator)
 * 3. Delegating MFA verification to shared MfaAuthHandlers (via BaseEventCoordinator)
 *
 * NOTE: This coordinator maintains its own event listener tracking system (boundHandlers, activeListeners)
 * for advanced cleanup capabilities specific to the signup flow.
 */

import uiManager from "../../ui/ui.js";
import { BaseEventCoordinator } from "../../shared/BaseEventCoordinator.js";
import { codeVerificationManager } from "../../ui/CodeVerificationManager.js";
import { getClaimsForAuth } from "../../configParser.js";

export class SignUpEventCoordinator extends BaseEventCoordinator {
    constructor(uiManager, msalInstance) {
        // Store SDK state for continuation methods
        // Must initialize BEFORE super() because BaseEventCoordinator will call initializeFlowSpecificListeners
        // which needs these Maps to exist

        // Call parent constructor with msalInstance and flowType
        super(uiManager, msalInstance, "signup");

        this.signUpState = null;
        this.signInState = null; // State for JIT/MFA continuation after auto sign-in

        // SignUp-specific tracking for advanced event listener management
        this.currentContext = null; // Track current context (signup/signin)
        this.boundHandlers = new Map(); // Store bound event handlers for cleanup
        this.activeListeners = new Map(); // Track active event listeners by element and event type
    }

    /**
     * Initialize sign-up specific event listeners
     * Called by BaseEventCoordinator.initializeEventListeners()
     */
    initializeFlowSpecificListeners() {
        // Bind handlers to maintain proper 'this' context
        const signUpFormHandler = (e) => this.handleSignUpSubmit(e);
        const showSignUpHandler = (e) => this.uiManager.showSignUpForm(e);

        // Store bound handlers for cleanup
        this.boundHandlers.set("signUpForm", signUpFormHandler);
        this.boundHandlers.set("showSignUp", showSignUpHandler);

        // Add event listeners with tracking
        this.addEventListenerWithTracking(
            "signUpForm",
            "submit",
            signUpFormHandler
        );
        this.addEventListenerWithTracking(
            "showSignUpBtn",
            "click",
            showSignUpHandler
        );
    }

    /**
     * Add event listener with tracking for easy cleanup
     * SignUp-specific method for advanced listener management
     */
    addEventListenerWithTracking(elementId, eventType, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(eventType, handler);

            // Track the listener for cleanup
            const key = `${elementId}_${eventType}`;
            this.activeListeners.set(key, { element, eventType, handler });

            console.log(`Event listener attached: ${elementId} (${eventType})`);
        } else {
            // Suppress warnings for dynamically-created JIT/MFA form elements
            // These are created by shared form components when needed
            const dynamicElements = [
                "jitMethodSelectionForm-signup",
                "jitChallengeForm-signup",
                "resendJitCode-signup",
                "cancelJitBtn-signup",
                "mfaMethodSelectionForm-signup",
                "mfaChallengeForm-signup",
                "resendMfaCode-signup",
                "cancelMfaBtn-signup",
            ];

            if (!dynamicElements.includes(elementId)) {
                console.warn(`Element not found: ${elementId}`);
            }
        }
    }

    /**
     * Remove event listener and stop tracking
     * SignUp-specific method for advanced listener management
     */
    removeEventListenerWithTracking(elementId, eventType) {
        const key = `${elementId}_${eventType}`;
        const listenerInfo = this.activeListeners.get(key);

        if (listenerInfo) {
            listenerInfo.element.removeEventListener(
                listenerInfo.eventType,
                listenerInfo.handler
            );
            this.activeListeners.delete(key);
            console.log(`Event listener removed: ${elementId} (${eventType})`);
        }
    }

    /**
     * Set up handlers for code verification form
     * Uses the CodeVerificationManager to properly manage handlers for the shared
     * code verification form across different flows (signin/signup/resetpassword).
     */
    setupCodeVerificationHandlers(context) {
        this.currentContext = context;

        console.log(
            `Setting up code verification handlers for context: ${context}`
        );

        // Use CodeVerificationManager to set up handlers for signup context
        codeVerificationManager.setupForContext(
            "signup",
            this.handleSignUpCodeSubmit.bind(this),
            this.handleSignUpResendCode.bind(this),
            this.handleCancelCode.bind(this)
        );
    }

    /**
     * Remove code verification handlers
     * Uses CodeVerificationManager to properly clean up
     */
    removeCodeVerificationHandlers() {
        console.log("Removing code verification handlers for signup");

        // Use CodeVerificationManager to remove handlers
        codeVerificationManager.removeHandlers();
    }

    /**
     * Set up password input handlers for sign-up
     */
    setupPasswordInputHandlers() {
        // Remove existing handlers first
        this.removeEventListenerWithTracking("signUpPasswordForm", "submit");
        this.removeEventListenerWithTracking(
            "cancelSignUpPasswordBtn",
            "click"
        );

        const passwordFormHandler = (e) => this.handlePasswordSubmit(e);
        const cancelPasswordHandler = (e) => this.handleCancelPassword(e);

        this.boundHandlers.set("signUpPasswordForm", passwordFormHandler);
        this.boundHandlers.set("cancelSignUpPassword", cancelPasswordHandler);

        this.addEventListenerWithTracking(
            "signUpPasswordForm",
            "submit",
            passwordFormHandler
        );
        this.addEventListenerWithTracking(
            "cancelSignUpPasswordBtn",
            "click",
            cancelPasswordHandler
        );
    }

    /**
     * Remove password input handlers
     */
    removePasswordInputHandlers() {
        this.removeEventListenerWithTracking("signUpPasswordForm", "submit");
        this.removeEventListenerWithTracking(
            "cancelSignUpPasswordBtn",
            "click"
        );

        this.boundHandlers.delete("signUpPasswordForm");
        this.boundHandlers.delete("cancelSignUpPassword");
    }

    // ========== SignUp-Specific Form Handlers ==========

    async handleSignUpSubmit(event) {
        event.preventDefault();

        const signUpBtn = document.getElementById("signUpBtn");
        const originalText = signUpBtn ? signUpBtn.textContent : "Sign Up";

        try {
            // Show loading state
            if (signUpBtn)
                this.uiManager.setButtonLoading(signUpBtn, "Signing up...");

            // Get form data
            const formData = new FormData(event.target);
            const username = formData.get("username");
            const firstName = formData.get("firstName");
            const lastName = formData.get("lastName");
            const city = formData.get("city");
            const country = formData.get("country");

            if (!username) {
                throw new Error("Username is required");
            }

            // Prepare attributes if any user attributes are provided
            const attributes = {};
            if (firstName) attributes.firstName = firstName;
            if (lastName) attributes.lastName = lastName;
            if (city) attributes.city = city;
            if (country) attributes.country = country;

            console.log("Processing sign-up form submission...");

            // Call MSAL SDK directly
            const result = await this.msalInstance.signUp({
                username,
                attributes,
            });

            // Store state for continuation methods
            this.signUpState = result.state;
            console.log(result);

            // Handle different result states
            console.log("Flow state: Checking sign-up result", result);
            if (result.isCodeRequired()) {
                console.log("Flow state: Code required", result);
                // Show code verification form for email verification
                this.uiManager.showCodeVerificationForm(username, "signup");
            } else if (result.isPasswordRequired()) {
                console.log("Flow state: Password required", result);
                // Show password input form (progressive disclosure)
                this.uiManager.showPasswordInputForm(username);
            } else if (result.isAttributesRequired()) {
                console.log("Flow state: Attributes required", result);
                // Show additional attributes form (if needed)
                this.uiManager.showAttributesForm(result);
            } else if (result.isFailed()) {
                console.log("Flow state: Sign-up failed", result);
                // Handle sign-up failure
                const error = result.error?.errorData;
                console.error(`Sign-up failed: ${error || "Unknown error"}`);
                this.uiManager.showSignUpError(
                    error?.message || "Sign-up failed. Please try again."
                );
            } else {
                // Handle other failure cases
                console.error(`Sign-up failed`);
                this.uiManager.showSignUpError(
                    "Sign-up failed. Please try again."
                );
            }
        } catch (error) {
            console.error(`Sign-up error occurred: ${error.message || error}`);
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
            this.uiManager.showSignUpError(
                error?.message || "An error occurred. Please try again."
            );
        } finally {
            if (signUpBtn) this.uiManager.resetButton(signUpBtn, originalText);
        }
    }

    async handleSignUpCodeSubmit(event) {
        event.preventDefault();

        console.log(
            "🔍 SIGNUP EVENT COORDINATOR: handleSignUpCodeSubmit called"
        );

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

            if (!this.signUpState) {
                throw new Error("No pending sign-up operation");
            }

            // Call the code submission method using stored state
            const result = await this.signUpState.submitCode(code);

            // Update state for next continuation - only if not failed to preserve valid state
            if (!result.isFailed()) {
                this.signUpState = result.state;
            }

            // Handle different result states
            console.log("Flow state: Checking code submit result", result);
            if (result.isCompleted()) {
                console.log("Flow state: Code verification completed", result);
                // Code verification successful and sign-up completed
                console.log(
                    "🔍 SIGNUP COORDINATOR: Code verification completed, performing auto sign-in"
                );

                // Get claims if useMFA=true in URL params (must be JSON string for continuation token)
                const claimsObject = getClaimsForAuth();
                const claims = claimsObject
                    ? JSON.stringify(claimsObject)
                    : undefined;

                // Perform auto sign-in after signup completion
                const signInResult = await this.signUpState.signIn(
                    claims ? { claims } : undefined
                );

                // Update state to sign-in state for continuation
                this.signInState = signInResult.state;

                if (signInResult.isFailed()) {
                    const error = signInResult.error?.errorData;
                    throw new Error(
                        error?.message ||
                            error ||
                            "Auto sign-in failed after signup"
                    );
                }

                if (signInResult.isAuthMethodRegistrationRequired()) {
                    // Reset button before transitioning to JIT flow
                    if (submitCodeBtn)
                        this.uiManager.resetButton(submitCodeBtn, originalText);

                    // Show JIT method selection form for auto sign-in after signup
                    const authMethods = signInResult.state.getAuthMethods();
                    this.uiManager.showJitMethodForm(authMethods);
                } else if (signInResult.isMfaRequired()) {
                    // Reset button before transitioning to MFA flow
                    if (submitCodeBtn)
                        this.uiManager.resetButton(submitCodeBtn, originalText);

                    // Show MFA method selection form for auto sign-in after signup
                    const authMethods = signInResult.state.getAuthMethods();
                    this.uiManager.showMfaMethodForm(authMethods);
                } else if (signInResult.isCompleted()) {
                    console.log(
                        "Flow state: Auto sign-in succeeded after sign-up",
                        signInResult
                    );
                    // Auto sign-in completed successfully
                    const account = signInResult.data;
                    if (account) {
                        console.log(
                            "🔍 SIGNUP COORDINATOR: Updating account info after auto sign-in"
                        );
                        uiManager.updateAccountInfo(account);

                        console.log(
                            "🔍 SIGNUP COORDINATOR: Account info updated successfully after auto sign-in"
                        );
                    } else {
                        console.warn(
                            "🔍 SIGNUP COORDINATOR: No account returned after auto sign-in"
                        );
                    }

                    this.uiManager.hideCodeVerificationForm();

                    // Clear the form on success
                    event.target.reset();

                    // Show initial signup form with empty fields for next signup
                    this.uiManager.showSignUpForm();
                }
            } else if (result.isPasswordRequired()) {
                console.log("Flow state: Password required after code", result);
                // Code verification successful, but password is now required
                console.log(
                    "🔍 SIGNUP COORDINATOR: Code verified successfully, password now required"
                );

                this.uiManager.hideCodeVerificationForm();

                // Clear the form
                event.target.reset();

                // Show password input form for sign-up
                // Get username from stored state if available
                const username =
                    document.getElementById("signUpUsername")?.value || "";
                this.uiManager.showPasswordInputForm(username);
            } else if (result.isAttributesRequired()) {
                console.log(
                    "Flow state: Attributes required after code",
                    result
                );
                // Code verification successful, but additional attributes required
                console.log(
                    "Code verified successfully, attributes now required"
                );

                this.uiManager.hideCodeVerificationForm();

                // Clear the form
                event.target.reset();

                // Show attributes form (if implemented)
                this.uiManager.showAttributesForm(result);
            } else if (result.isFailed()) {
                // Handle verification failure
                const error = result.error?.errorData;
                this.uiManager.showCodeVerificationError(
                    error?.message ||
                        "Code verification failed. Please try again."
                );
            } else {
                // Handle other failure cases
                this.uiManager.showCodeVerificationError(
                    "Code verification failed. Please try again."
                );
            }
        } catch (error) {
            console.error(
                `Code verification error occurred: ${error.message || error}`
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
            this.uiManager.showCodeVerificationError(error.message);
        } finally {
            if (submitCodeBtn)
                this.uiManager.resetButton(submitCodeBtn, originalText);
        }
    }

    async handleSignUpResendCode() {
        const resendCodeBtn = document.getElementById("resendCodeBtn");
        const originalText = resendCodeBtn
            ? resendCodeBtn.textContent
            : "Resend Code";

        try {
            // Show loading state
            if (resendCodeBtn)
                this.uiManager.setButtonLoading(resendCodeBtn, "Resending...");

            if (!this.signUpState) {
                throw new Error("No pending sign-up operation");
            }

            // Call the resend code method using stored state
            const result = await this.signUpState.resendCode();

            // Update state after resend - safely handle state updates
            if (result.state) {
                this.signUpState = result.state;
            }

            if (result.isCodeRequired()) {
                console.log("Verification code resent successfully");
                // Show success message to user
                this.uiManager.showCodeResendSuccess();
            } else if (result.isFailed()) {
                const error = result.error?.errorData;
                throw new Error(
                    error?.message || "Failed to resend verification code"
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
            this.uiManager.showCodeVerificationError(
                error.message || "Failed to resend verification code"
            );
        } finally {
            if (resendCodeBtn)
                this.uiManager.resetButton(resendCodeBtn, originalText);
        }
    }

    handleCancelCode() {
        // Hide the code verification form and return to sign-up
        this.uiManager.hideCodeVerificationForm();
        console.log("Code verification cancelled");

        // Clear stored state
        this.signUpState = null;
    }

    async handlePasswordSubmit(event) {
        event.preventDefault();

        console.log("🔍 SIGNUP COORDINATOR: handlePasswordSubmit called");

        const submitPasswordBtn = document.getElementById(
            "submitSignUpPasswordBtn"
        );
        const originalText = submitPasswordBtn
            ? submitPasswordBtn.textContent
            : "Create Account";

        try {
            // Show loading state
            if (submitPasswordBtn)
                this.uiManager.setButtonLoading(
                    submitPasswordBtn,
                    "Creating account..."
                );

            // Get form data
            const formData = new FormData(event.target);
            const password = formData.get("password");

            if (!password) {
                throw new Error("Password is required");
            }

            if (!this.signUpState) {
                throw new Error("No pending sign-up operation");
            }

            // Call the password submission method using stored state
            const result = await this.signUpState.submitPassword(password);

            // Update state for next continuation
            this.signUpState = result.state;

            // Handle different result states
            console.log("Flow state: Checking password submit result", result);
            if (result.isCompleted()) {
                console.log(
                    "Flow state: Password submission completed",
                    result
                );
                // Password accepted and sign-up completed
                console.log(
                    "🔍 SIGNUP COORDINATOR: Password submission completed, performing auto sign-in"
                );

                // Get claims if useMFA=true in URL params (must be JSON string for continuation token)
                const claimsObject = getClaimsForAuth();
                const claims = claimsObject
                    ? JSON.stringify(claimsObject)
                    : undefined;

                // Perform auto sign-in after signup completion
                const signInResult = await this.signUpState.signIn(
                    claims ? { claims } : undefined
                );

                // Update state to sign-in state for continuation
                this.signInState = signInResult.state;

                if (signInResult.isFailed()) {
                    const error = signInResult.error?.errorData;
                    throw new Error(
                        error?.message ||
                            error ||
                            "Auto sign-in failed after signup"
                    );
                }

                if (signInResult.isAuthMethodRegistrationRequired()) {
                    // Reset button before transitioning to JIT flow
                    if (submitPasswordBtn)
                        this.uiManager.resetButton(
                            submitPasswordBtn,
                            originalText
                        );

                    // Show JIT method selection form for auto sign-in after signup
                    const authMethods = signInResult.state.getAuthMethods();
                    this.uiManager.showJitMethodForm(authMethods);
                } else if (signInResult.isMfaRequired()) {
                    // Reset button before transitioning to MFA flow
                    if (submitPasswordBtn)
                        this.uiManager.resetButton(
                            submitPasswordBtn,
                            originalText
                        );

                    // Show MFA method selection form for auto sign-in after signup
                    const authMethods = signInResult.state.getAuthMethods();
                    this.uiManager.showMfaMethodForm(authMethods);
                } else if (signInResult.isCompleted()) {
                    console.log(
                        "Flow state: Auto sign-in succeeded after password",
                        signInResult
                    );
                    // Auto sign-in completed successfully
                    const account = signInResult.data;
                    if (account && uiManager && uiManager.updateAccountInfo) {
                        console.log(
                            "🔍 SIGNUP COORDINATOR: Updating account info after auto sign-in"
                        );
                        uiManager.updateAccountInfo(account);

                        console.log(
                            "🔍 SIGNUP COORDINATOR: Account info updated successfully after auto sign-in"
                        );
                    } else {
                        console.log(
                            "🔍 SIGNUP COORDINATOR: No account info to update or uiManager not available"
                        );
                    }
                    // Reset button in finally block will handle this
                    this.uiManager.hidePasswordInputForm();

                    // Clear the form on success
                    event.target.reset();

                    // Show initial signup form with empty fields for next signup
                    this.uiManager.showSignUpForm();
                }
            } else if (result.isFailed()) {
                console.log("Flow state: Password submission failed", result);
                // Handle password submission failure
                const error = result.error?.errorData;
                console.error(
                    `Password submission failed: ${error || "Unknown error"}`
                );
                this.uiManager.showSignUpError(
                    error?.message ||
                        "Password submission failed. Please try again."
                );
            } else {
                // Handle other failure cases
                console.error("Password submission failed");
                this.uiManager.showSignUpError(
                    "Password submission failed. Please try again."
                );
            }
        } catch (error) {
            console.error(
                `Password submission error: ${error.message || error}`
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
            this.uiManager.showSignUpError(error.message);
        } finally {
            if (submitPasswordBtn)
                this.uiManager.resetButton(submitPasswordBtn, originalText);
        }
    }

    handleCancelPassword(event) {
        event.preventDefault();
        this.uiManager.hidePasswordInputForm();

        // Clear stored state
        this.signUpState = null;
    }

    // ========== Helper Methods for JIT/MFA ==========
    // These methods provide state access for shared handlers

    /**
     * Get current state object for shared handlers
     */
    getPendingState() {
        return this.signInState || this.signUpState;
    }

    /**
     * Update state after continuation methods
     */
    setPendingState(state) {
        // if during JIT/MFA after auto sign-in, update signInState
        if (this.signInState) {
            this.signInState = state;
        } else {
            this.signUpState = state;
        }
    }

    /**
     * Clear pending operation
     */
    clearPendingOperation() {
        this.signUpState = null;
        this.signInState = null;
    }
}
