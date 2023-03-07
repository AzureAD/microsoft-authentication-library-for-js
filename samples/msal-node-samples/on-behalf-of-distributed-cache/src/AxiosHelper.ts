import axios from "axios";

class AxiosHelper {

    /**
     * Makes an Authorization Bearer request with the given accessToken to the given endpoint.
     * @param endpoint 
     * @param accessToken 
     */
    static async callEndpointWithToken(endpoint: string, accessToken: string | undefined): Promise<any> {
        const options = {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        };

        console.log(`Request to ${endpoint} made at: ${new Date().toString()}`);

        const response = await axios.get(endpoint, options);
        return (await response.data);
    }
}

export default AxiosHelper;