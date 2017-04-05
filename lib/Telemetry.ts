namespace MSAL {
    class Telmetry {
        private static instance: Telmetry;
        private receiverCallback: (r: Array<Object>) => void;

        private constructor() {
        }

        RegisterReceiver(receiverCallback: (receiver: Array<Object>) => void): void {
            this.receiverCallback = receiverCallback;
        }

        static GetInstance(): Telmetry {
            return this.instance || (this.instance = new this());
        }
    }
}