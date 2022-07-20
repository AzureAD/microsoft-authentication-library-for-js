using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.Web.WebView2;
using Newtonsoft.Json;
using System;
using System.Diagnostics;
using System.Threading.Tasks;
public class Extension
{
    public async Task ExecuteExtensionAsync(WebView2 WebView)
    {
        //await WebView.ExecuteScriptAsync("alert(window.document.URL);");
        //await WebView.ExecuteScriptAsync("chrome.webview.postMessage(window.document.URL)");
        await WebView.ExecuteScriptAsync(
            "window.addEventListener(\"message\", function (event) {" +
                //"console.log(event);" + //added this
                "const channelId = \"53ee284d-920a-4b59-9d30-a60315b26836\";" +
                "if (event && event.data && event.data.channel && (event.data.channel == channelId)) {" +
                    //"console.log(\"Listened to event 2\");" + //added this
                    "try {" +
                        "if (event.source != window) {" +
                            "return;" +
                        "}" +
                        "var request = event.data;" +
                        "var method = request.body.method;" +
                        //"console.log(\"Method: \" + method);" +
                        "const extensionId = 0;" + //do not know how to get the actual id because it requires chrome.runtime
                        "if (method === \"CreateProviderAsync\") {" +
                            "var extList = document.getElementById(`ch -${channelId}`);" +
                            "if (extList) {" +
                                "var extElement = document.createElement('div');" +
                                "extElement.id = extensionId;" +
                                "const extensionVersion = 1.0;" + //do not know how to get the actual version number because it requires chrome.runtime
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
                                    "version: 1.0" + //do not know how to get the actual version number because it requires chrome.runtime
                                "}" +
                            "};" +
                            "var port = event.ports [0];" +
                            "port.onmessage = (event) => {" +
                                //"console.log(event);" +
                                "var request = event.data;" +
                                "chrome.webview.postMessage(request);" + 
                            "};" + //send back to native side in these {} (handle web message) and then send to browsercore (look at background.js for how to send to browsercore)
                            "port.postMessage(req);" +
                            //"console.log(\"handshake response\");" +
                        "}" +
                    "}" +
                "catch (e) {" +
                    "console.error(e)" +
                "}" +
            "}" +
        "}, true);");
        await WebView.ExecuteScriptAsync("init()");
    }
    public async Task CallBrowserCoreAsync(WebView2 WebView, Microsoft.Web.WebView2.Core.CoreWebView2WebMessageReceivedEventArgs args)
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
                    //"console.log(request);" +
                    "try {" +
                        "request.sender = window.origin;" +
                        "if (\"GetSupportedUrls\".localeCompare(request.body.method, undefined, { sensitivity: \"base\" }) == 0) {" +
                            "RespondWithError(CreateInvalidMethodResponse(), sendResponse);" +
                        "} else {" +
                            "chrome.webview.postMessage(\"Executing BrowserCore\" + JSON.stringify(request));" +
                            //"chrome.runtime.sendNativeMessage(" + //no chrome.runtime in webview
                            //    "\"com.microsoft.browsercore\"," + //browsercore is located in C:\Windows\BrowserCore
                            //    "request," +
                            //    "function(response) {" +
                            //        "if (response != null) {" +
                            //            "if (response.status == \"Fail\") {" +
                            //                "RespondWithError(response, sendResponse);" +
                            //            "} else {" +
                            //                "sendResponse({" +
                            //                    "status: \"Success\"," +
                            //                    "result: response" +
                            //                "});" +
                            //            "}" +
                            //        "} else {" +
                            //            "RespondWithError({" +
                            //                "status: \"Fail\"," +
                            //                "code: \"NoSupport\"," +
                            //                "description: chrome.runtime.lastError.message," +
                            //            "}, sendResponse);" +
                            //        "}" +
                            //    "});" +
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
    public void HandleWebMessage(Microsoft.Web.WebView2.Core.CoreWebView2WebMessageReceivedEventArgs args)
    {
        String flag = "\"Executing BrowserCore";
        if(args.WebMessageAsJson.Contains(flag)) {
            ProcessStartInfo info = new ProcessStartInfo(@"C:\\Windows\\BrowserCore\\BrowserCore.exe");
            //info.Arguments = @"";

            //isolate the request and turn it into a Json
            String request = args.WebMessageAsJson.Substring(flag.Length, args.WebMessageAsJson.Length - flag.Length - 1);
            request = request.Replace("\\\"", "\"");
            request = request.Replace("\\\\", "\\");
            var requestJson = JsonConvert.DeserializeObject(request);

            Process.Start(info);
        }
    }
}
