using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.Web.WebView2;
using System;
using System.Threading.Tasks;
public class Extension
{
    public async Task ExecuteExtensionAsync(WebView2 WebView)
    {
        //await WebView.ExecuteScriptAsync("chrome.webview.postMessage(window.document.URL)");
    }
    public void HandleWebMessage(Microsoft.Web.WebView2.Core.CoreWebView2WebMessageReceivedEventArgs args)
    {
        //Console.WriteLine(args.ToString());
    }
}
