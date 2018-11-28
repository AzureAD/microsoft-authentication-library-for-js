
import {MSALException} from "./MSALException";

export class MSALClientException extends MSALException {


    constructor(errorCode: string, errorMessage: string) {
        super(errorCode, errorMessage);
    }


}