namespace Msal {

    /**
    * @hidden
    */
    export class Telemetry {
        private static instance: Telemetry;
        private receiverCallback: (r: Array<Object>) => void;

        constructor() {
        }

        RegisterReceiver(receiverCallback: (receiver: Array<Object>) => void): void {
            this.receiverCallback = receiverCallback;
        }

        static GetInstance(): Telemetry {
            return this.instance || (this.instance = new this());
        }
    }
}