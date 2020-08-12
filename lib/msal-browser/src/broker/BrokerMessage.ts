export abstract class BrokerMessage {
    public messageType: string;

    constructor(messageType: string) {
        this.messageType = messageType;
    }

    static validateMessage(message: MessageEvent): MessageEvent|null {
        if (message.data && message.data.messageType) {
            // TODO validate messageType here
            return message;
        } else {
            return null;
        }
    }
}
