# Instance Aware flow

When passing `instance_aware=true` on the `/authorize` call to retrieve the code, the STS will send back additional parameters to specify where the tokens should be retrieved from. 

- Sample Request using instance_aware

```javascript
const tokenRequest = {
    scopes: ["Mail.Read"],
    extraQueryParameters: {
        "instance_aware": "true"
    }
};
```

- Sample Response from the `/authorize` endpoint

```text
http://localhost:30662/
#code=0.AAAA-KLuGXrhD0eVTd...
&cloud_instance_name=windows-ppe.net
&cloud_instance_host_name=login.windows-ppe.net
&cloud_graph_host_name=graph.ppe.windows.net
&msgraph_host=graph.microsoft-ppe.com
&client_info=eyJ1aWQiOiJiZT...
```

MSAL will read the data returned in this response and use it to construct the endpoint to trade the code for tokens. If the `cloud_instance_host_name` is different from the one used in the `/authorize` call, MSAL must perform endpoint discovery before making the request to the `/token` endpoint. The authority host name may change if the user's home tenant is in a different cloud.


## Using the correct graph hosts

The MSAL response object will also inform you which graph hosts to use for a given account. The Graph hosts are specific to the tenant that the user's account resides in, and must change if `instance_aware=true` is used.

### Difference Between cloud_graph_host_name and msgraph_host

The STS will return two graph host names: `cloud_graph_host_name` and `msgraph_host`. `cloud_graph_host_name` is the AAD graph host, and is used for [AAD graph calls](https://docs.microsoft.com/en-us/azure/active-directory/develop/active-directory-graph-api). `msgraph_host` is the Microsoft Graph, and is used for [MS Graph API calls](https://docs.microsoft.com/en-us/graph/overview).

### Using the graph hosts from the response

You can do this for either the AAD graph host or the MS Graph Host.

```javascript
function getGraphMeEndpoint(msGraphHost) {
    if (!msGraphHost) {
        return "https://graph.microsoft-ppe.com/v1.0/me";
    }
    return `https://${msGraphHost}/v1.0/me`
}

async function seeProfile() {
    const currentAcc = myMSALObj.getAccountByHomeId(accountId);
    if (currentAcc) {
        const response = await getTokenPopup(loginRequest, currentAcc).catch(error => {
            console.log(error);
        });
        callMSGraph(getGraphMeEndpoint(response.msGraphHost), response.accessToken, updateUI);
        profileButton.style.display = 'none';
    }
}
```
