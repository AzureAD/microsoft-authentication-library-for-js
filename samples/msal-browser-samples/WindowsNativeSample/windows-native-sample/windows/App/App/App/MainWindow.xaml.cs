using Capacitor;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using System.Threading;
using System.Threading.Tasks;
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

            CapacitorAppInstance = new CapacitorApp(this, CapacitorWebView);
            CapacitorAppInstance.LoadDefaultPlugins();
            CapacitorAppInstance.Load();
        }

        private void CapacitorWebView_WebMessageReceived(WebView2 sender, Microsoft.Web.WebView2.Core.CoreWebView2WebMessageReceivedEventArgs args)
        {
            if (args.Source == sender.Source.OriginalString) // validate source
            {  
                this.Extension.HandleWebMessage(CapacitorWebView, args, this);
                Task t = this.Extension.SetUpWAMCallAsync(CapacitorWebView, args);
            }
        }

        private void CapacitorWebView_NavigationCompleted(WebView2 sender, Microsoft.Web.WebView2.Core.CoreWebView2NavigationCompletedEventArgs args)
        {
            Task t = this.Extension.ExecuteExtensionAsync(CapacitorWebView);
            if(sender.Source == new System.Uri("https://login.microsoftonline.com/common/oauth2/v2.0/logoutsession"))
            {
                Thread.Sleep(3000);
                CapacitorWebView.Source = new System.Uri("http://localhost/tab1");
            }
        }
    }
}
