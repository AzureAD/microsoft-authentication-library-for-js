import { Constants } from "@azure/msal-browser";
import { CustomAuthError } from "./CustomAuthError.js";

export class MsalCustomAuthError extends CustomAuthError {
    subError: string | undefined;

    constructor(error: string, errorDescription?: string, subError?: string, correlationId?: string) {
        super(error, errorDescription, correlationId);
        Object.setPrototypeOf(this, MsalCustomAuthError.prototype);

        this.subError = subError || Constants.EMPTY_STRING;
    }
}
