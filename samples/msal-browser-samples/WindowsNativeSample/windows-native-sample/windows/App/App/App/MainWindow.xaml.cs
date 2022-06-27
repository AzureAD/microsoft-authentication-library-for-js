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

        public MainWindow()
        {
            this.InitializeComponent();
            Title = "Windows Sample App";

            Extension WindowsAccounts = new Extension();

            Task InitializeExtensionTask = WindowsAccounts.InitializeExtensionAsync(CapacitorWebView);
            //await InitializeExtensionTask;

            CapacitorAppInstance = new CapacitorApp(this, CapacitorWebView);

            CapacitorAppInstance.LoadDefaultPlugins();

            CapacitorAppInstance.Load();

            Task AddExtensionTask = WindowsAccounts.AddExtensionAsync(CapacitorWebView, InitializeExtensionTask);
            //await AddExtensionTask;
        }
    }
}
