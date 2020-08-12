import { InteractionType, BrokerMessageType } from "../utils/BrowserConstants";
import { PopupRequest } from "../request/PopupRequest";
import { RedirectRequest } from "../request/RedirectRequest";
import { BrokerMessage } from "./BrokerMessage";

export class BrokerAuthRequest extends BrokerMessage {
    public embeddedClientId: string;
    public interactionType: InteractionType;
    public request: RedirectRequest | PopupRequest;

    constructor(embeddedClientId: string, interactionType: InteractionType, request: RedirectRequest | PopupRequest) {
        super("BrokerAuthRequest");
        this.embeddedClientId = embeddedClientId;
        this.interactionType = interactionType;
        this.request = request;
    }

    static validate(message: MessageEvent): BrokerAuthRequest| null {
        // First, validate message type
        if (message.data && 
            message.data.messageType === BrokerMessageType.AUTH_REQUEST &&
            message.data.embeddedClientId &&
            message.data.interactionType &&
            message.data.request) {

            // TODO, verify version compatibility

            return new BrokerAuthRequest(message.data.embeddedClientId, message.data.interactionType, message.data.request);
        }

        return null;
    }
}
