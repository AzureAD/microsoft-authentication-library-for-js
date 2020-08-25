import { BrokerMessageType } from "../utils/BrowserConstants";
import { ClientAuthError } from "@azure/msal-common";

export abstract class BrokerMessage {
    public messageType: string;

    constructor(messageType: string) {
        this.messageType = messageType;
    }

    static validateMessage(message: MessageEvent): MessageEvent|null {
        if (message.data && message.data.messageType) {
            if (Object.values(BrokerMessageType).indexOf(message.data.messageType) > -1) {
                return message;
            } else {
                // TODO: Make this BrowserAuthError
                throw(new ClientAuthError("invalid_messageType", "messageType is invalid"));
            }
        } else {
            return null;
        }
    }
}
