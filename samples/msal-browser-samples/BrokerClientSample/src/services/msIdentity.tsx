import { ControllerFactory } from "@azure/msal-browser";
import { AccountInfo, Configuration } from "@azure/msal-browser";
import { IPublicClientApplication } from "@azure/msal-browser"
import { OperatingMode } from "@azure/msal-browser/dist/config/Configuration";
import { IController } from "@azure/msal-browser/dist/controllers/IController";
import { MockAuthenticationChannel } from "../components/MockAuthenticationChannel";

export const msalConfig: Configuration = {
    auth: {
        clientId: "0c1dafa7-6ad0-4edf-9338-e84839a91234",
        redirectUri: "https://amarsin-zg8:3000/"
        // redirectUri: "https://metaos.z5.web.core.windows.net/"
    },
    system: {
        operatingMode: OperatingMode.BrokerClient | OperatingMode.Standard
    }
};

export const loginRequest = {
    scopes: ["User.Read"]
};

export class MsIdentity {
    client: IPublicClientApplication | undefined;
    account: AccountInfo | undefined;
    isStandalone: boolean = true;

    private factory: ControllerFactory | null = null;

    constructor() {
        try
        {
            // Try to initialize the mock auth channel
            MockAuthenticationChannel.initialize();
        }
        catch
        {
            // Do nothing here, app will run in standalone mode
        }

        this.factory = new ControllerFactory(msalConfig);
        this.factory.createController().then((v: IController) => this.client = v);
    }
}

export const msIdentity = new MsIdentity();