# Using Access Tokens in Requests

To use the token as a bearer in an HTTP request to call the Microsoft Graph or a Web API:

```JavaScript
    var headers = new Headers();
    var bearer = "Bearer " + token;
    headers.append("Authorization", bearer);
    var options = {
         method: "GET",
         headers: headers
    };
    var graphEndpoint = "https://graph.microsoft.com/v1.0/me";

    fetch(graphEndpoint, options)
        .then(resp => {
             //do something with response
        });
```

You can find complete [code samples](./samples).
