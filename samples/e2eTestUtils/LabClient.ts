import { ClientSecretCredential, AccessToken } from "@azure/identity";
import axios from "axios";
import { ENV_VARIABLES, LAB_SCOPE, LAB_API_ENDPOINT, ParamKeys } from "./Constants";
import { LabApiQueryParams } from "./LabApiQueryParams";
import * as dotenv from "dotenv";

dotenv.config({
    path: "../../.env"
});

export class LabClient {

    private credentials: ClientSecretCredential;
    private currentToken: AccessToken | null;
    constructor() {
        const tenant = process.env[ENV_VARIABLES.TENANT];
        const clientId = process.env[ENV_VARIABLES.CLIENT_ID];
        const client_secret = process.env[ENV_VARIABLES.SECRET];
        this.currentToken = null;
        if (!tenant || !clientId || !client_secret) {
            throw "Environment variables not set!";
        }
        this.credentials = new ClientSecretCredential(tenant, clientId, client_secret);
    }

    private async getCurrentToken(): Promise<string> {
        if (this.currentToken) {
            if (this.currentToken.expiresOnTimestamp <= new Date().getTime()) {
                return this.currentToken.token;
            }
        }
        this.currentToken = await this.credentials.getToken(LAB_SCOPE);
        if (!this.currentToken || !this.currentToken.token) {
            throw "Unable to retrieve access token from lab API";
        }
        return this.currentToken.token;
    }

    private async requestLabApi(endpoint: string, accessToken: string): Promise<any> {
        try {
            const response = await axios(`${LAB_API_ENDPOINT}${endpoint}`, {
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            });
            return response.data;
        } catch (e) {
            console.error(e);
        }
    
        return null;
    }

    async getVarsByCloudEnvironment(labApiParams: LabApiQueryParams): Promise<any> {
        const accessToken = await this.getCurrentToken();
        const apiParams: Array<string> = [];

        if (labApiParams.azureEnvironment) {
            apiParams.push(`${ParamKeys.AZURE_ENVIRONMENT}=${labApiParams.azureEnvironment}`);
        }
        if (labApiParams.userType) {
            apiParams.push(`${ParamKeys.USER_TYPE}=${labApiParams.userType}`);
        }
        if (labApiParams.federationProvider) {
            apiParams.push(`${ParamKeys.FEDERATION_PROVIDER}=${labApiParams.federationProvider}`);
        }

        if (labApiParams.b2cProvider) {
            apiParams.push(`${ParamKeys.B2C_PROVIDER}=${labApiParams.b2cProvider}`);
        }

        if (labApiParams.homeDomain) {
            apiParams.push(`${ParamKeys.HOME_DOMAIN}=${labApiParams.homeDomain}`);
        }

        if (labApiParams.appType) {
            apiParams.push(`${ParamKeys.APP_TYPE}=${labApiParams.appType}`);
        }

        if (apiParams.length <= 0) {
            throw "Must provide at least one param to getVarsByCloudEnvironment";
        }
        const apiUrl = "/Config?" + apiParams.join("&");

        return await this.requestLabApi(apiUrl, accessToken);
    }

    async getSecret(secretName: string): Promise<any> {
        const accessToken = await this.getCurrentToken();

        return await this.requestLabApi(`/LabSecret?&Secret=${secretName}`, accessToken);
    }
}
