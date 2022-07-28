using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.Web.WebView2;
using Newtonsoft.Json;
using System;
using System.Diagnostics;
using System.Threading.Tasks;
using Windows.Security.Credentials;
using Windows.Security.Authentication.Web.Core;
using Newtonsoft.Json.Linq;
using System.Collections.Generic;
using Windows.Data.Json;

public class Extension
{
    public async Task ExecuteExtensionAsync(WebView2 WebView)
    {
        await WebView.ExecuteScriptAsync(
            "window.addEventListener(\"message\", function (event) {" +
                "const channelId = \"53ee284d-920a-4b59-9d30-a60315b26836\";" +
                "if (event && event.data && event.data.channel && (event.data.channel == channelId)) {" +
                    "try {" +
                        "if (event.source != window) {" +
                            "return;" +
                        "}" +
                        "var request = event.data;" +
                        "var method = request.body.method;" +
                        "const extensionId = \"ppnbnpeolgkicgegkbkbjmhlideopiji\";" +
                        "console.log(method);" +
                        "if (method === \"CreateProviderAsync\") {" +
                            "var extList = document.getElementById(`ch -${channelId}`);" +
                            "if (extList) {" +
                                "var extElement = document.createElement('div');" +
                                "extElement.id = extensionId;" +
                                "const extensionVersion = 1.0;" +
                                "if (extensionVersion) {" +
                                    "extElement.setAttribute(\"ver\", extensionVersion);" +
                                "}" +
                                "extList.appendChild(extElement);" +
                            "}" +
                            "return;" +
                        "}" +
                        "if (method === \"Handshake\" && (!request.extensionId || request.extensionId === extensionId) && event.ports && event.ports.length) {" +
                            "event.stopImmediatePropagation();" +
                            "var req = {" +
                                "channel: channelId," +
                                "extensionId: \"ppnbnpeolgkicgegkbkbjmhlideopiji\"," +
                                "responseId: request.responseId," +
                                "body: {" +
                                    "method: \"HandshakeResponse\"," +
                                    "version: 1.0" +
                                "}" +
                            "};" +
                            "var port = event.ports [0];" + 
                            "port.onmessage = (event) => {" +
                                "var request = event.data;" +
                                "chrome.webview.postMessage(request);" + 
                            "};" +
                            "window.addEventListener(\"message\", (event) => {" +
                                //"console.log(event);" +
                                "if(event.data.account && event.data.properties && event.source == window) {" +
                                    "var resp = {" +
                                        "channel: \"53ee284d-920a-4b59-9d30-a60315b26836\"," +
                                        "extensionId: \"ppnbnpeolgkicgegkbkbjmhlideopiji\"," +
                                        "responseId: request.responseId," +
                                        "body: {" +
                                            "method: \"Response\", " +
                                            "response: {" +
                                                "status: \"Success\"," +
                                                "result: event.data" +
                                            "}" +
                                        "}" +
                                    "};" +
                                    "console.log(resp);" +
                                    "port.postMessage(resp);" +
                                "}" +
                            "});" +
                            "port.postMessage(req);" +
                        "}" +
                    "}" +
                "catch (e) {" +
                    "console.error(e)" +
                "}" +
            "}" +
        "}, true);");
        await WebView.ExecuteScriptAsync("init()");
    }
    public async Task SetUpWAMCallAsync(WebView2 WebView, Microsoft.Web.WebView2.Core.CoreWebView2WebMessageReceivedEventArgs args)
    {
        await WebView.ExecuteScriptAsync(
            "function RespondWithError(response, sendResponse) {" +
                "if (IsInvalidMethod(response)) {" +
                    "sendResponse(CreateInvalidMethodResponse());" +
                "} else {" +
                    "sendResponse(response);" +
                "}" +
            "}" +
            "function IsInvalidMethod(response) {" +
                "return response.ext && response.ext.error == -2147186943;" +
            "}" +
            "function CreateInvalidMethodResponse() {" +
                "return {" +
                    "status: \"Fail\"," +
                    "code: \"OSError\"," +
                    "description: \"Error processing request.\"," +
                    "ext: { error: -2147186943 }" +
                "};" +
            "}");
        await WebView.ExecuteScriptAsync(
                "request = " + args.WebMessageAsJson + ";" +
                "if(request && request.body && request.body.method && request.body.method == \"GetToken\") {" +
                    "try {" +
                        "request.sender = window.origin;" +
                        "if (\"GetSupportedUrls\".localeCompare(request.body.method, undefined, { sensitivity: \"base\" }) == 0) {" +
                            "RespondWithError(CreateInvalidMethodResponse(), sendResponse);" +
                        "} else {" +
                            "chrome.webview.postMessage(\"Executing WAM\" + JSON.stringify(request));" +
                        "}" +
                    "}" +
                    "catch (e) {" +
                        "console.log(\"error\");" +
                        "RespondWithError({" +
                            "status: \"Fail\"," +
                            "code: \"NoSupport\"," +
                            "description: e.toString()," +
                        "}, sendResponse);" +
                    "}" +
                "}");
    }
    public void HandleWebMessage(WebView2 WebView, Microsoft.Web.WebView2.Core.CoreWebView2WebMessageReceivedEventArgs args, Window window)
    {
        String flag = "\"Executing WAM";
        if(args.WebMessageAsJson.Contains(flag))
        {
            Task t = this.CallWAMAsync(WebView, args, window, flag);
        }
    }

    public async Task CallWAMAsync(WebView2 WebView, Microsoft.Web.WebView2.Core.CoreWebView2WebMessageReceivedEventArgs args, Window window, String flag)
    {
        //isolate the request and turn it into a Json
        String request = args.WebMessageAsJson.Substring(flag.Length, args.WebMessageAsJson.Length - flag.Length - 1);
        request = request.Replace("\\\"", "\"");
        request = request.Replace("\\\\", "\\");
        dynamic requestJson = JObject.Parse(request);

        //Process.Start(info);
        try
        {
            WebAccountProvider Provider = await WebAuthenticationCoreManager.FindAccountProviderAsync("https://login.windows.local");
            this.AuthenticateWithRequestToken(WebView, Provider, requestJson, window);
        }
        catch (Exception ex)
        {
            await WebView.ExecuteScriptAsync("console.log(\"Web Token request failed: \"" + ex + ");");
        }
    }

    public async void AuthenticateWithRequestToken(WebView2 WebView, WebAccountProvider Provider, dynamic request, Window window)
    {
        try
        {
            WebTokenRequest webTokenRequest = new WebTokenRequest(Provider, request["body"]["request"]["scopes"].ToString(), request["body"]["request"]["clientId"].ToString());

            // Azure Active Directory requires a resource to return a token
            if (Provider.Id == "https://login.microsoft.com" && Provider.Authority == "organizations")
            {
                webTokenRequest.Properties.Add("resource", "https://graph.windows.net");
            }

            webTokenRequest.Properties.Add("redirectUri", request["body"]["request"]["redirectUri"].ToString());
 
            webTokenRequest.Properties.Add("wam_compat", "2.0");

            // If the user selected a specific account, RequestTokenAsync will return a token for that account.
            // The user may be prompted for credentials or to authorize using that account with your app
            // If the user selected a provider, the user will be prompted for credentials to login to a new account

            var hWnd = WinRT.Interop.WindowNative.GetWindowHandle(window);

            WebTokenRequestResult webTokenRequestResult = await WebAuthenticationCoreManagerInterop.RequestTokenForWindowAsync(hWnd, webTokenRequest);

            if (webTokenRequestResult.ResponseStatus == WebTokenRequestStatus.Success)
            {
                //await WebView.ExecuteScriptAsync("signIn(redirect);");
                JsonObject successResponse = this.ConstructSuccessResponse(webTokenRequestResult);
                //WebAccount webAccount = webTokenRequestResult.ResponseData[0].WebAccount;
                await WebView.ExecuteScriptAsync("console.log(\"Success\");");
                await WebView.ExecuteScriptAsync(
                    "try {" +
                        "window.postMessage(" + successResponse + ");" +
                    "} catch (e) {" +
                        "console.log(e);" +
                    "}");
                //await WebView.ExecuteScriptAsync("window.location.href = \"http://localhost/tab1\";");
                //await WebView.ExecuteScriptAsync("showWelcomeMessage(" + webAccount + ");");
            }
            else
            {
                await WebView.ExecuteScriptAsync("console.log(\"Error: \"" + webTokenRequestResult.ResponseError.ErrorMessage + ");");
            }
        }
        catch (Exception ex)
        {
            await WebView.ExecuteScriptAsync("console.log(\"Web Token request failed: \"" + ex + ");");
        }
    }

    public JsonObject ConstructSuccessResponse(WebTokenRequestResult result)
    {
        JsonValue id = JsonValue.CreateStringValue(result.ResponseData[0].WebAccount.Id);
        JsonValue userName = JsonValue.CreateStringValue(result.ResponseData[0].WebAccount.UserName);
        JsonValue token = JsonValue.CreateStringValue(result.ResponseData[0].Token);
        //JsonValue wamStatus = JsonValue.CreateStringValue(result.ResponseStatus.ToString());

        JsonObject account = new JsonObject();
        account.Add("id", id);
        account.Add("userName", userName);

        JsonObject accountProperties = new JsonObject();
        JsonObject properties = new JsonObject();
        IReadOnlyDictionary<string, string> accProp = result.ResponseData[0].WebAccount.Properties;
        foreach (var keyValue in accProp)
        {
            accountProperties.Add(keyValue.Key, JsonValue.CreateStringValue(keyValue.Value));
            properties.Add(keyValue.Key, JsonValue.CreateStringValue(keyValue.Value));
        }
        account.Add("properties", accountProperties);

        JsonObject response = new JsonObject();
        response.Add("account", account);
        response.Add("access_token", token);

        IDictionary<string, string> prop = result.ResponseData[0].Properties;
        properties.Add("wamStatus", JsonValue.CreateStringValue(result.ResponseStatus.ToString()));
        foreach (var keyValue in prop)
        {
            string key = keyValue.Key;
            string value = keyValue.Value;

            if(properties.ContainsKey(key))
            {
                //skip if it already has that key
            }
            else if(key == "TokenExpiresOn") // how do you convert this
            {
                ulong expiresIn;
                ulong expiresOn = Convert.ToUInt64(value);

                // 11644473600 is the difference in seconds between universal time and time_t
                if (expiresOn <= 11644473600 || expiresOn >= ulong.MaxValue)
                {
                    expiresIn = 0;
                }
                else
                {
                    DateTime expiresOnTime = new DateTime(1970, 1, 1, 0, 0, 0, 0);
                    expiresOnTime = expiresOnTime.AddSeconds(expiresOn - 11644473600);

                    DateTime now = DateTime.Now;

                    TimeSpan expiresInTS = expiresOnTime.Subtract(now);
                    long expiresInS = (long) expiresInTS.TotalSeconds;
                    if (expiresInS < 0 || expiresInS >= long.MaxValue)
                    {
                        expiresIn = 0;
                    }
                    else
                    {
                        expiresIn = (ulong)expiresInS;
                    }
                }
                response.Add("expires_in", JsonValue.CreateNumberValue(expiresIn));
            }
            else if (key == "ExtendedLifetimeToken")
            {
                if(value == "true")
                {
                    response.Add("extendedLifetimeToken", JsonValue.CreateBooleanValue(true));
                }
                else
                {
                    response.Add("extendedLifetimeToken", JsonValue.CreateBooleanValue(false));
                }
            }
            else if (key == "wamcompat_id_token")
            {
                response.Add("id_token", JsonValue.CreateStringValue(value.ToString()));
            }
            else if (key == "wamcompat_client_info")
            {
                response.Add("client_info", JsonValue.CreateStringValue(value.ToString()));
            }
            else if (key == "wamcompat_scopes")
            {
                response.Add("scope", JsonValue.CreateStringValue(value.ToString()));
                response.Add("scopes", JsonValue.CreateStringValue(value.ToString()));
            }
            else if (key == "exp")
            {
                // skip "exp" as it applies to the id_token and shouldn't be returned to MSAL JS
            }
            else
            {
                properties.Add(key, JsonValue.CreateStringValue(value));
            }
        }

        response.Add("properties", properties);

        return response;
    }
}
