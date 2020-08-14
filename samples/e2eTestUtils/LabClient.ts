import { ClientSecretCredential, AccessToken } from "@azure/identity";
import axios from "axios";
const labApiUri = "https://msidlab.com/api"

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

    async getUserVarsByCloudEnvironment(envName: string, usertype?: string, federationprovider?:string): Promise<any> {
        const accessToken = await this.getCurrentToken();
        let apiParams: Array<string> = [];


        if (envName) {
            apiParams.push(`azureenvironment=${envName}`);
        }
        if (usertype) {
            apiParams.push(`usertype=${usertype}`);
        }
        if (federationprovider) {
            apiParams.push(`federationprovider=${federationprovider}`);
        }

        if (apiParams.length <= 0) {
            throw "Must provide at least one param to getUserVarsByCloudEnvironment";
        }
        const apiUrl = '/user?' + apiParams.join("&");

        return await this.requestLabApi(apiUrl, accessToken);
    }

    async getSecret(secretName: string): Promise<any> {
        const accessToken = await this.getCurrentToken();

        return await this.requestLabApi(`/LabSecret?&Secret=${secretName}`, accessToken);
    }
}
