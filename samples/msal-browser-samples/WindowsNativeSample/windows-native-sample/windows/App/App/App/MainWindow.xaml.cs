using Capacitor;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using System;
using System.Threading.Tasks;
using System.Threading;
using static Extension;

// To learn more about WinUI, the WinUI project structure,
// and more about our project templates, see: http://aka.ms/winui-project-info.

namespace App {
    /// <summary>
    /// An empty window that can be used on its own or navigated to within a Frame.
    /// </summary>
    public sealed partial class MainWindow : Window {
        CapacitorApp CapacitorAppInstance { get; set; }

        Extension Extension;

        public MainWindow()
        {
            this.InitializeComponent();
            Title = "Windows Sample App";
            
            this.Extension = new Extension();

            Task InitializeExtensionTask = this.Extension.InitializeExtensionAsync(CapacitorWebView);

            CapacitorAppInstance = new CapacitorApp(this, CapacitorWebView);
            CapacitorAppInstance.LoadDefaultPlugins();
            CapacitorAppInstance.Load();

        }

        private void CapacitorWebView_NavigationStarting(WebView2 sender, Microsoft.Web.WebView2.Core.CoreWebView2NavigationStartingEventArgs args)
        {

        }

        private void CapacitorWebView_WebMessageReceived(WebView2 sender, Microsoft.Web.WebView2.Core.CoreWebView2WebMessageReceivedEventArgs args)
        {
            //Console.WriteLine(args.TryGetWebMessageAsString());
        }

        private void CapacitorWebView_CoreWebView2Initialized(WebView2 sender, CoreWebView2InitializedEventArgs args)
        {
            CapacitorAppInstance.Load();
            Task AddExtensionTask = this.Extension.AddExtensionAsync(CapacitorWebView);
        }
    }
}
