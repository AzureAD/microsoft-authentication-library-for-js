// Constants
export const REDIRECT_URL = "/";
export const ERROR_MESSAGES = {
    USER_NOT_FOUND: "User not found",
    INCORRECT_PASSWORD: "Incorrect password",
    INVALID_CODE: "Invalid code",
    GENERIC_ERROR: "An unexpected error occurred",
    SIGNIN_ERROR: "An error occurred during sign in",
    CODE_ERROR: "An error occurred while verifying the code",
    PASSWORD_ERROR: "An error occurred while verifying the password",
};

// Utility functions
export const redirectToHome = () => {
    window.location.href = REDIRECT_URL;
};

export const handleError = (error: any, setError: (error: string) => void) => {
    if (error.isUserNotFound?.()) {
        setError(ERROR_MESSAGES.USER_NOT_FOUND);
    } else if (error.isPasswordIncorrect?.()) {
        setError(ERROR_MESSAGES.INCORRECT_PASSWORD);
    } else if (error.isInvalidCode?.()) {
        setError(ERROR_MESSAGES.INVALID_CODE);
    } else {
        setError(ERROR_MESSAGES.GENERIC_ERROR);
        console.error(error);
    }
};
