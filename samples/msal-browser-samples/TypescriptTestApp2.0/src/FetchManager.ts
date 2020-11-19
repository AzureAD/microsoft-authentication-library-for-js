import { UserInfo, MailInfo } from "./GraphReponseTypes";

/**
 * Class that handles Bearer requests for data using Fetch.
 */
export class FetchManager {

    /**
     * Makes an Authorization "Bearer"  request with the given accessToken to the given endpoint.
     * @param endpoint 
     * @param accessToken 
     */
    async callEndpointWithToken(endpoint: string, accessToken: string): Promise<UserInfo | MailInfo> {
        const headers = new Headers();
        const bearer = `Bearer ${accessToken}`;

        headers.append("Authorization", bearer);

        const options = {
            method: "GET",
            headers: headers
        };

        console.log('request made at: ' + new Date().toString());

        const response = await fetch(endpoint, options);
        return (await response.json()) as UserInfo | MailInfo;
    }
}
