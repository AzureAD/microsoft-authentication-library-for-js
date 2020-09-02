import { BrokerMessage } from "./BrokerMessage";
import { BrokerAuthenticationResult } from "@azure/msal-common";
import { InteractionType, BrokerMessageType } from "../utils/BrowserConstants";

export class BrokerAuthResult extends BrokerMessage {
    public interactionType: InteractionType;
    public result: BrokerAuthenticationResult;
    public error: Error;

    constructor(interactionType: InteractionType, authResult: BrokerAuthenticationResult, authError?: Error) {
        super(BrokerMessageType.AUTH_RESULT);
        this.interactionType = interactionType;
        this.result = authResult;
        this.error = authError;
    }

    static validate(message: MessageEvent): BrokerAuthResult | null {
        if (message.data &&
            message.data.messageType === BrokerMessageType.AUTH_RESULT &&
            message.data.interactionType &&
            (message.data.result || message.data.error)) {

            // TODO: verify version compat

            return new BrokerAuthResult(message.data.interactionType, message.data.result);
        }

        return null;
    }
}
