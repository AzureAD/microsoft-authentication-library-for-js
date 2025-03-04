import { CustomAuthError } from "./CustomAuthError.js";

export class MsalCustomAuthError extends CustomAuthError {
    constructor(error: string, errorDescription?: string, correlationId?: string) {
        super(error, errorDescription, correlationId);

        Object.setPrototypeOf(this, MsalCustomAuthError.prototype);
    }
}
