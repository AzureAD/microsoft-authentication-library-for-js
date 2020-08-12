import { InteractionType } from "../utils/BrowserConstants";
import { PopupRequest } from "../request/PopupRequest";
import { RedirectRequest } from "../request/RedirectRequest";
import { BrokerMessage } from "./BrokerMessage";

export class BrokerAuthRequest extends BrokerMessage {
    public clientId: string;
    public interactionType: InteractionType;
    public request: RedirectRequest | PopupRequest;

    constructor(clientId: string, interactionType: InteractionType, request: RedirectRequest | PopupRequest) {
        super("BrokerAuthRequest");
        this.clientId = clientId;
        this.interactionType = interactionType;
        this.request = request;
    }

    static validate(message: MessageEvent): BrokerAuthRequest| null {
        return null;
    }
}
