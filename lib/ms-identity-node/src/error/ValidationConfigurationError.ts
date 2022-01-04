import { ClientConfigurationError } from "@azure/msal-common";

export const ValidationConfigurationErrorMessage = {

};

export class ValidationConfigurationError extends ClientConfigurationError {

    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);
        this.name = "ValidationConfigurationError";
        Object.setPrototypeOf(this, ValidationConfigurationError.prototype);
    }


}