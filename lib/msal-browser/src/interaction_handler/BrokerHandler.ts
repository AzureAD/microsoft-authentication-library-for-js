import { BrokerOptions } from "../config/Configuration";

export class BrokerHandler {
    private brokerOptions: BrokerOptions;

    constructor(brokerOptions: BrokerOptions) {
        this.brokerOptions = brokerOptions;
        console.log("Broker initiated");
    }

    initiateHandshake(): void {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = ((message: MessageEvent) => {
            console.log(message);
        });
        window.top.postMessage("Hello World", "*", [messageChannel.port2]);
    }

    listenForHandshake(): void {
        window.addEventListener("message", (message: MessageEvent) => {
            console.log(message);
            message.ports[0].postMessage("Received Handshake");

            message.ports[0].onmessage = ((message: MessageEvent) => {
                console.log(message);
            });
        });
    }
}
