using Capacitor;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using System;

// To learn more about WinUI, the WinUI project structure,
// and more about our project templates, see: http://aka.ms/winui-project-info.

namespace App {
    /// <summary>
    /// An empty window that can be used on its own or navigated to within a Frame.
    /// </summary>
    public sealed partial class MainWindow : Window {
        CapacitorApp CapacitorAppInstance { get; set; }

        public MainWindow() {
            this.InitializeComponent();
            Title = "Capacitor Windows (WinUI3/WebView2)";

            CapacitorAppInstance = new CapacitorApp(this, CapacitorWebView);
            CapacitorAppInstance.LoadDefaultPlugins();
            CapacitorAppInstance.Load();
        }
    }
}
