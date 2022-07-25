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
                        "const extensionId = 0;" + 
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
                                "extensionId: extensionId," +
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
                await WebView.ExecuteScriptAsync("console.log(\"Success\");");
                await WebView.ExecuteScriptAsync("showWelcomeMessage(" + webTokenRequestResult.ResponseData[0].WebAccount + ");");
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
}
