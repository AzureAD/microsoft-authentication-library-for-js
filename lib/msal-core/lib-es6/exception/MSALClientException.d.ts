import { MSALException } from "./MSALException";
export declare class MSALClientException extends MSALException {
    constructor(errorCode: string, errorMessage: string);
}
