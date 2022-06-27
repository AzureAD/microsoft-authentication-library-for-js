using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.Web.WebView2.Core;
using System;
using System.Threading.Tasks;
public class Extension
{
    public async Task InitializeExtensionAsync(WebView2 WebView)
    {
        await WebView.EnsureCoreWebView2Async();
    }
    public async Task AddExtensionAsync(WebView2 WebView, Task InitializeExtensionTask)
    {
        //await WebView.EnsureCoreWebView2Async();
        //InitializeExtensionTask.Wait();
        await WebView.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync("alert(window.document.URL);");
    }
}
