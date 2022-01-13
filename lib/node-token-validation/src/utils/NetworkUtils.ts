import { INetworkModule } from "@azure/msal-common";
import { HttpClient } from "../network/HttpClient";

export class NetworkUtils {
    static getNetworkClient(): INetworkModule {
        return new HttpClient();
    };
}
