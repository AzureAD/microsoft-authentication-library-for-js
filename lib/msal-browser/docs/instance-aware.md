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
