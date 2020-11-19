import { ClientSecretCredential, AccessToken } from "@azure/identity";
import axios from "axios";
const labApiUri = "https://msidlab.com/api"

export interface ILabApiParams {
    envName?: string,
    azureEnvironment?: string,
    userType?: string,
    b2cProvider?: string,
    federationProvider?: string
};

export class LabClient {

    private credentials: ClientSecretCredential;
    private currentToken: AccessToken;
    constructor() {
        this.credentials = new ClientSecretCredential(process.env["AZURE_TENANT_ID"], process.env["AZURE_CLIENT_ID"], process.env["AZURE_CLIENT_SECRET"]);   
    }

    private async getCurrentToken(): Promise<string> {
        if (this.currentToken) {
            if (this.currentToken.expiresOnTimestamp <= new Date().getTime()) {
                return this.currentToken.token;
            }
        }
        this.currentToken = await this.credentials.getToken("https://msidlab.com/.default");
        return this.currentToken.token;
    }

    private async requestLabApi(endpoint: string, accessToken: string): Promise<any> {
        try {
            const response = await axios(`${labApiUri}${endpoint}`, {
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

    async getUserVarsByCloudEnvironment(apiParams: ILabApiParams): Promise<any> {
        const accessToken = await this.getCurrentToken();
        let queryParams: Array<string> = [];

        if (apiParams.envName) {
            queryParams.push(`envname=${apiParams.envName}`);
        }
        if (apiParams.azureEnvironment) {
            queryParams.push(`azureenvironment=${apiParams.azureEnvironment}`);
        }
        if (apiParams.userType) {
            queryParams.push(`usertype=${apiParams.userType}`);
        }
        if (apiParams.b2cProvider) {
            queryParams.push(`b2cprovider=${apiParams.b2cProvider}`);
        }
        if (apiParams.federationProvider) {
            queryParams.push(`federationprovider=${apiParams.federationProvider}`);
        }

        if (queryParams.length <= 0) {
            throw "Must provide at least one param to getUserVarsByCloudEnvironment";
        }
        const apiUrl = '/user?' + queryParams.join("&");

        return await this.requestLabApi(apiUrl, accessToken);
    }

    async getSecret(secretName: string): Promise<any> {
        const accessToken = await this.getCurrentToken();

        return await this.requestLabApi(`/LabSecret?&Secret=${secretName}`, accessToken);
    }
}
