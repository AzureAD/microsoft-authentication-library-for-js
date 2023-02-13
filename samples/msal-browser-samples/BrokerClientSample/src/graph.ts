export const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me"
};

export async function invokeRestMsGraphAsync(httpVerb: string, accessToken: string, headers: Headers, uri: string, requestBody: string | null): Promise<string> {
    const bearer = `Bearer ${accessToken}`;

    headers.append("Authorization", bearer);

    const options = {
        method: httpVerb,
        headers: headers
    };

    try
    {
        const response = await fetch(uri, options);
        return response.json();
    }
    catch (ex)
    {
        return JSON.stringify(ex);
    }
}