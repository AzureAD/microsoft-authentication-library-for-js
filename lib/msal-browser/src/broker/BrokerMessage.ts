export abstract class BrokerMessage {
    public messageType: string;

    constructor(messageType: string) {
        this.messageType = messageType;
    }
}
