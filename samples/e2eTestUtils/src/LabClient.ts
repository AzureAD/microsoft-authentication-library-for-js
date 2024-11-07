import { AccessToken, ClientCertificateCredential } from "@azure/identity";
import axios from "axios";
import {
    ENV_VARIABLES,
    LAB_SCOPE,
    LAB_API_ENDPOINT,
    ParamKeys,
} from "./Constants";
import { LabApiQueryParams } from "./LabApiQueryParams";
import * as dotenv from "dotenv";

// Try 1p repo config first
dotenv.config({ path: __dirname + `/../../../../.env` });
// If CLIENT_ID is not set, try the 3p repo for test env config
if (!process.env[ENV_VARIABLES.CLIENT_ID]) {
    dotenv.config({ path: __dirname + `/../../../.env` });
}

export class LabClient {
    private credentials: ClientCertificateCredential;
    private currentToken: AccessToken | null;
    constructor() {
        const tenant = process.env[ENV_VARIABLES.TENANT];
        const clientId = process.env[ENV_VARIABLES.CLIENT_ID];
        const client_cert_path = process.env[ENV_VARIABLES.CERTIFICATE_PATH];
        this.currentToken = null;
        if (!tenant || !clientId || !client_cert_path) {
            throw "Environment variables not set!";
        }
        this.credentials = new ClientCertificateCredential(
            tenant,
            clientId,
            client_cert_path,
            {
                sendCertificateChain: true,
            }
        );
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

    private async requestLabApi(
        endpoint: string,
        accessToken: string
    ): Promise<any> {
        try {
            const response = await axios(`${LAB_API_ENDPOINT}${endpoint}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            return response.data;
        } catch (e) {
            console.error(e);
        }

        return null;
    }

    /**
     * Queries the lab API for an app environment based on the provided parameters
     * See: https://docs.msidlab.com/labapi/intro.html
     * @param labApiParams
     * @returns
     */
    async getVarsByCloudEnvironment(
        labApiParams: LabApiQueryParams
    ): Promise<any> {
        const accessToken = await this.getCurrentToken();
        const apiParams: Array<string> = [];

        if (labApiParams.azureEnvironment) {
            apiParams.push(
                `${ParamKeys.AZURE_ENVIRONMENT}=${labApiParams.azureEnvironment}`
            );
        }

        if (labApiParams.userType) {
            apiParams.push(`${ParamKeys.USER_TYPE}=${labApiParams.userType}`);
        }

        if (labApiParams.federationProvider) {
            apiParams.push(
                `${ParamKeys.FEDERATION_PROVIDER}=${labApiParams.federationProvider}`
            );
        }

        if (labApiParams.b2cProvider) {
            apiParams.push(
                `${ParamKeys.B2C_PROVIDER}=${labApiParams.b2cProvider}`
            );
        }

        if (labApiParams.homeDomain) {
            apiParams.push(
                `${ParamKeys.HOME_DOMAIN}=${labApiParams.homeDomain}`
            );
        }

        if (labApiParams.appType) {
            apiParams.push(`${ParamKeys.APP_TYPE}=${labApiParams.appType}`);
        }

        if (labApiParams.signInAudience) {
            apiParams.push(
                `${ParamKeys.SIGN_IN_AUDIENCE}=${labApiParams.signInAudience}`
            );
        }

        if (labApiParams.publicClient) {
            apiParams.push(
                `${ParamKeys.PUBLIC_CLIENT}=${labApiParams.publicClient}`
            );
        }

        if (labApiParams.appPlatform) {
            apiParams.push(
                `${ParamKeys.APP_PLATFORM}=${labApiParams.appPlatform}`
            );
        }

        if (labApiParams.guestHomedIn) {
            apiParams.push(
                `${ParamKeys.GUEST_HOMED_IN}=${labApiParams.guestHomedIn}`
            );
        }

        if (apiParams.length <= 0) {
            throw "Must provide at least one param to getVarsByCloudEnvironment";
        }
        const apiUrl = "/Config?" + apiParams.join("&");

        return await this.requestLabApi(apiUrl, accessToken);
    }

    async getSecret(secretName: string): Promise<any> {
        const accessToken = await this.getCurrentToken();

        return await this.requestLabApi(
            `/LabSecret?&Secret=${secretName}`,
            accessToken
        );
    }
}
