import { CustomAuthError } from "./CustomAuthError.js";

export class MsalCustomAuthError extends CustomAuthError {
    constructor(
        public error: string,
        public errorDescription?: string,
        public correlationId?: string,
    ) {
        super(error, errorDescription, correlationId);

        Object.setPrototypeOf(this, MsalCustomAuthError.prototype);
    }
}
