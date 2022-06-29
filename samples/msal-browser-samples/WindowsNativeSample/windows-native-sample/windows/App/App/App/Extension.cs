using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.Web.WebView2.Core;
using System;
using System.Threading.Tasks;
public class Extension
{
    public async Task ExecuteExtensionAsync(WebView2 WebView)
    {
        await WebView.ExecuteScriptAsync("alert(window.document.URL);");
    }
}
