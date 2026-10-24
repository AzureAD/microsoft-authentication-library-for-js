using System.IO;
using System.Text.Json;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Interop;
using System.Windows.Media;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.Wpf;
using Identity.NativeBridge;
using Identity.NativeBridge.WebView2;
using Identity.NativeBridge.OneAuthPoc;

namespace NativeBridgeTokenSample;

public record SampleSettings(string ClientId, string TenantId, string[] Scopes);

public static class Program
{
    [STAThread]
    public static void Main(string[] args)
    {
        var application = new Application();
        application.Run(new BridgeWindow(args.Contains("--smoke"), args.Contains("--smoke-tabs") || args.Contains("--smoke-inspection"),
            args.Contains("--broker"), args.Contains("--smoke-inspection")));
    }
}

public sealed class BridgeWindow : Window
{
    private readonly TabControl tabs = new();
    private readonly Dictionary<int, EmbeddedApp> apps = new();
    private readonly Button openApp2 = new() { Content = "Open nested app 2", IsEnabled = false, Padding = new Thickness(12, 7, 12, 7), Margin = new Thickness(0, 0, 10, 0) };
    private readonly Button openApp3 = new() { Content = "Open nested app 3", IsEnabled = false, Padding = new Thickness(12, 7, 12, 7) };
    private readonly TextBlock embeddedLabel = new() { FontSize = 13, FontWeight = FontWeights.SemiBold, Margin = new Thickness(0, 8, 0, 0), TextWrapping = TextWrapping.Wrap };
    private SampleSettings? settings;
    private WamExecutor? executor;
    private BrokerSettings? brokerSettings;
    private readonly bool brokerMode;
    private NativeOneAuth? oneAuth;
    private OneAuthInitializationInspection initialization = new(null, "not_initialized: awaiting Initialize native OneAuth");
    private readonly bool smokeInspection;
    private bool stoppingOneAuth;
    private readonly Button initializeOneAuth = new() { Content = "Initialize native OneAuth", Padding = new Thickness(12, 7, 12, 7) };
    private readonly TextBlock oneAuthStatus = new() { Text = "OneAuth: Not initialized", Foreground = Brushes.White, TextWrapping = TextWrapping.Wrap };
    private CoreWebView2Environment? environment;
    private readonly TextBlock hostIdentity = new() { Text = "Loading registration...", TextWrapping = TextWrapping.Wrap, Foreground = Brushes.White, FontSize = 12 };
    private readonly TextBox output = new() { IsReadOnly = true, TextWrapping = TextWrapping.Wrap, VerticalScrollBarVisibility = ScrollBarVisibility.Auto, FontFamily = new("Consolas"), FontSize = 12 };
    private readonly CancellationTokenSource lifetime = new();
    private readonly string dataDirectory = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "MSALNativeBridgePOC");
    private readonly string logPath;
    private readonly bool smoke;
    private readonly bool smokeTabs;
    private System.Windows.Threading.DispatcherTimer? smokeDeadline;

    private sealed class EmbeddedApp(int number)
    {
        public int Number { get; } = number;
        public string Name => $"Nested App {Number}";
        public string HostName => Number == 1 ? "bridge-poc.local" : $"app{Number}.bridge-poc.local";
        public string PageUrl => $"https://{HostName}/index.html";
        public WebView2 Browser { get; } = new();
        public TabItem Tab { get; } = new() { Header = $"Nested App {number}" };
        public WebView2Bridge? Bridge { get; set; }
        public TextBox Inspection { get; } = new() { IsReadOnly = true, IsUndoEnabled = false, AcceptsReturn = true, TextWrapping = TextWrapping.Wrap,
            VerticalScrollBarVisibility = ScrollBarVisibility.Auto, FontFamily = new("Consolas"), FontSize = 12, Height = 220 };
        public List<OneAuthInspection> Invocations { get; } = new();
        public bool Inspecting { get; set; }
        public object? InspectionError { get; set; }
        public TaskCompletionSource<bool> Ready { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
    }

    public BridgeWindow(bool smoke, bool smokeTabs = false, bool brokerMode = false, bool smokeInspection = false)
    {
        this.smokeInspection = smokeInspection;
        this.brokerMode = brokerMode;
        this.smoke = smoke || smokeTabs;
        this.smokeTabs = smokeTabs;
        Title = "MSAL Native Bridge POC";
        Width = 1100;
        Height = 960;
        MinWidth = 680;
        MinHeight = 720;
        Directory.CreateDirectory(dataDirectory);
        logPath = Path.Combine(dataDirectory, $"bridge-{DateTime.UtcNow:yyyyMMdd-HHmmss}.jsonl");
        var grid = new Grid { Background = Brushes.WhiteSmoke };
        grid.RowDefinitions.Add(new() { Height = GridLength.Auto });
        grid.RowDefinitions.Add(new() { Height = GridLength.Auto });
        grid.RowDefinitions.Add(new() { Height = new GridLength(1, GridUnitType.Star) });
        grid.RowDefinitions.Add(new() { Height = GridLength.Auto });
        grid.RowDefinitions.Add(new() { Height = new GridLength(150) });
        var hostHeader = new StackPanel();
        hostHeader.Children.Add(new TextBlock { Text = "Host App | Native Windows", Foreground = Brushes.White, FontSize = 22, FontWeight = FontWeights.SemiBold });
        hostHeader.Children.Add(new TextBlock { Text = brokerMode ? "Two-child OneAuth POC | Direct native adapter | No WAM fallback" : "Legacy transport harness | Shared-client MSAL.NET + WAM", Foreground = Brushes.White, FontSize = 13, TextWrapping = TextWrapping.Wrap, Margin = new Thickness(0, 6, 0, 8) });
        hostHeader.Children.Add(hostIdentity);
        if (brokerMode)
        {
            hostHeader.Children.Add(initializeOneAuth);
            hostHeader.Children.Add(oneAuthStatus);
        }
        grid.Children.Add(new Border { Background = new SolidColorBrush(Color.FromRgb(48, 52, 56)), Padding = new Thickness(20, 16, 20, 16), Child = hostHeader });
        var embeddedToolbar = new StackPanel { Margin = new Thickness(16, 12, 16, 8) };
        var openButtons = new StackPanel { Orientation = Orientation.Horizontal };
        openButtons.Children.Add(openApp2);
        if (!brokerMode) openButtons.Children.Add(openApp3);
        embeddedToolbar.Children.Add(openButtons);
        embeddedToolbar.Children.Add(embeddedLabel);
        Grid.SetRow(embeddedToolbar, 1);
        grid.Children.Add(embeddedToolbar);
        var embeddedSurface = new Border { BorderBrush = new SolidColorBrush(Color.FromRgb(0, 127, 115)), BorderThickness = new Thickness(2), Margin = new Thickness(16, 0, 16, 8), Child = tabs };
        Grid.SetRow(embeddedSurface, 2);
        grid.Children.Add(embeddedSurface);
        var hostLogLabel = new TextBlock { Text = "Host App | Native Bridge Events", FontSize = 13, FontWeight = FontWeights.SemiBold, Margin = new Thickness(16, 4, 16, 8) };
        Grid.SetRow(hostLogLabel, 3);
        grid.Children.Add(hostLogLabel);
        output.Margin = new Thickness(16, 0, 16, 12);
        Grid.SetRow(output, 4);
        grid.Children.Add(output);
        Content = grid;
        initializeOneAuth.Click += async (_, _) => await InitializeOneAuthAsync();
        openApp2.Click += async (_, _) => await OpenNestedAppAsync(2);
        openApp3.Click += async (_, _) => await OpenNestedAppAsync(3);
        tabs.SelectionChanged += (_, _) =>
        {
            var selected = apps.Values.FirstOrDefault(app => app.Tab == tabs.SelectedItem);
            if (selected is not null) embeddedLabel.Text = $"Embedded WebView2 | {selected.Name} | {selected.PageUrl}";
        };
        Loaded += async (_, _) => await InitializeAsync();
        Closing += async (_, args) =>
        {
            if (oneAuth is null) return;
            args.Cancel = true;
            if (stoppingOneAuth) return;
            stoppingOneAuth = true;
            initializeOneAuth.IsEnabled = false;
            lifetime.Cancel();
            try { await oneAuth.DisposeAsync(); }
            catch { Log(new("oneauth", "shutdown_failed")); }
            oneAuth = null;
            Close();
        };
        Closed += (_, _) =>
        {
            lifetime.Cancel();
            smokeDeadline?.Stop();
            initialization = new(null, "closed");
            foreach (var app in apps.Values) { ClearInspection(app); app.Bridge?.Dispose(); app.Browser.Dispose(); }
        };
        if (this.smoke)
        {
            smokeDeadline = new() { Interval = TimeSpan.FromSeconds(smokeTabs ? 60 : 20) };
            smokeDeadline.Tick += (_, _) => { smokeDeadline.Stop(); Log(new("host", "smoke_failed", Code: "startup_timeout")); Application.Current.Shutdown(1); };
            smokeDeadline.Start();
        }
    }

    private void Log(BridgeEvent entry) => Log(entry, null);

    private async Task InitializeOneAuthAsync()
    {
        initializeOneAuth.IsEnabled = false;
        ObserveInitialization(new(null, "pending: loading host settings"));
        try
        {
            if (brokerSettings is null) throw new InvalidOperationException("Broker settings are not ready.");
            var options = JsonSerializer.Deserialize<OneAuthSettings>(await File.ReadAllTextAsync(Path.Combine(AppContext.BaseDirectory, "oneauthsettings.json")),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? throw new InvalidOperationException("Invalid OneAuth settings.");
            lifetime.Token.ThrowIfCancellationRequested();
            if (!string.Equals(options.ClientId, brokerSettings.HostClientId, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("OneAuth host client ID must match the broker manifest host.");
            oneAuth = new NativeOneAuth(options.ApplicationId, options.ClientId, options.RedirectUri, options.DefaultSignInScope,
                new WindowInteropHelper(this).Handle, options.TestSlice, ObserveInitialization);
            oneAuthStatus.Text = "OneAuth: Native adapter initialized";
            Log(new("oneauth", "startup_success"));
        }
        catch (Exception error)
        {
            if (initialization.State != "failed")
                ObserveInitialization(new(null, "failed", Error: new { type = error.GetType().Name }));
            oneAuthStatus.Text = "OneAuth startup failed. Check native SDK deployment and host settings.";
            Log(new("oneauth", "startup_failed", Code: error.GetType().Name));
            initializeOneAuth.IsEnabled = !lifetime.IsCancellationRequested;
        }
    }

    private void ObserveInitialization(OneAuthInitializationInspection snapshot)
    {
        if (lifetime.IsCancellationRequested) return;
        initialization = snapshot;
        foreach (var app in apps.Values) RenderInspection(app);
    }

    private void RenderInspection(EmbeddedApp app) => app.Inspection.Text = JsonSerializer.Serialize(new
    {
        initialization,
        invocations = app.Invocations,
        error = app.InspectionError
    }, new JsonSerializerOptions { WriteIndented = true });

    private static void ClearInspection(EmbeddedApp app)
    {
        app.Inspecting = false;
        app.Invocations.Clear();
        app.InspectionError = null;
        app.Inspection.Clear();
    }

    private void BeginInspection(EmbeddedApp app)
    {
        app.Invocations.Clear();
        app.InspectionError = null;
        app.Inspecting = true;
        RenderInspection(app);
    }

    private void ObserveInvocation(EmbeddedApp app, OneAuthInspection snapshot)
    {
        if (!app.Inspecting || lifetime.IsCancellationRequested) return;
        var index = app.Invocations.FindIndex(item => ReferenceEquals(item.Request, snapshot.Request));
        if (index < 0) app.Invocations.Add(snapshot);
        else app.Invocations[index] = snapshot;
        RenderInspection(app);
    }

    private void ObserveInspectionError(EmbeddedApp app, Exception error)
    {
        if (!app.Inspecting || lifetime.IsCancellationRequested) return;
        app.InspectionError = error is ExecutorException executorError
            ? new { type = error.GetType().Name, executorError.Status, executorError.Code }
            : (object)new { type = error.GetType().Name };
        RenderInspection(app);
    }


    private void Log(BridgeEvent entry, int? appNumber)
    {
        var line = JsonSerializer.Serialize(new { timestamp = DateTimeOffset.UtcNow, appNumber, entry.Layer, entry.Event,
            entry.RequestId, entry.CorrelationId, entry.Method, entry.ElapsedMs, entry.Code, entry.TokenSource });
        Dispatcher.Invoke(() =>
        {
            File.AppendAllText(logPath, line + Environment.NewLine);
            if (output.Text.Length > 100000) output.Clear();
            output.AppendText(line + Environment.NewLine);
            output.ScrollToEnd();
        });
    }

    private async Task InitializeAsync()
    {
        try
        {
            if (brokerMode)
            {
                var brokerPath = Path.Combine(AppContext.BaseDirectory, "brokersettings.json");
                if (!smoke && !File.Exists(brokerPath)) throw new InvalidOperationException("Create brokersettings.json from brokersettings.example.json, then restart.");
                brokerSettings = smoke ? BrokerSettings.Placeholders()
                    : JsonSerializer.Deserialize<BrokerSettings>(await File.ReadAllTextAsync(brokerPath), new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
                        ?? throw new InvalidOperationException("Invalid broker manifest.");
                brokerSettings.Validate();
            }
            var configPath = Path.Combine(AppContext.BaseDirectory, "appsettings.json");
            if (!brokerMode && !smoke && !File.Exists(configPath)) throw new InvalidOperationException("Create appsettings.json from appsettings.example.json, then restart.");
            settings = brokerSettings is not null ? new SampleSettings(brokerSettings.HostClientId, brokerSettings.TenantId, ["User.Read"]) : smoke ? new SampleSettings("11111111-1111-1111-1111-111111111111", "organizations", ["User.Read"]) : JsonSerializer.Deserialize<SampleSettings>(await File.ReadAllTextAsync(configPath), new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
                ?? throw new InvalidOperationException("Invalid sample configuration.");
            if (!Guid.TryParse(settings.ClientId, out var clientId) || clientId == Guid.Empty ||
                !(Guid.TryParse(settings.TenantId, out _) || settings.TenantId == "organizations") ||
                settings.Scopes is not { Length: > 0 }) throw new InvalidOperationException("Configure a native public-client ID, tenant ID, and allowed scopes.");
            if (!File.Exists(Path.Combine(AppContext.BaseDirectory, "web", "msal-browser.js")))
                throw new InvalidOperationException("Run Prepare.ps1 to build and copy the sibling 3P MSAL bundle.");
            var authority = $"https://login.microsoftonline.com/{settings.TenantId}";
            hostIdentity.Text = brokerMode
                ? $"Host client ID: {settings.ClientId} | App1 + App2"
                : $"Client ID: {settings.ClientId} | Legacy harness shares this identity across all three embedded apps.";
            if (!brokerMode) executor = new WamExecutor(settings.ClientId, authority, () => new WindowInteropHelper(this).Handle, Log);
            environment = await CoreWebView2Environment.CreateAsync(userDataFolder: Path.Combine(dataDirectory, "WebView2"));
            await OpenNestedAppAsync(1);
            openApp2.IsEnabled = true;
            openApp3.IsEnabled = !brokerMode;
            if (smokeTabs) await VerifyTabsAsync();
        }
        catch (Exception error)
        {
            Log(new("host", "startup_failed", Code: error.GetType().Name));
            output.AppendText("Startup: " + (error is InvalidOperationException ? error.Message : "See package/runtime prerequisites in the sample README.md.") + Environment.NewLine);
            if (smoke) Application.Current.Shutdown(1);
        }
    }

    private async Task OpenNestedAppAsync(int number)
    {
        if (apps.TryGetValue(number, out var existing))
        {
            tabs.SelectedItem = existing.Tab;
            return;
        }
        if (settings is null || (!brokerMode && executor is null) || environment is null || lifetime.IsCancellationRequested) return;
        var app = new EmbeddedApp(number);
        if (brokerMode)
        {
            var surface = new DockPanel();
            var inspectionPanel = new StackPanel { Margin = new Thickness(8) };
            var clearInspection = new Button { Content = "Clear Native Request / Response", HorizontalAlignment = HorizontalAlignment.Left,
                Padding = new Thickness(8, 4, 8, 4) };
            clearInspection.Click += (_, _) => ClearInspection(app);
            inspectionPanel.Children.Add(new TextBlock { Text = "Native OneAuth invocation / response | Sensitive local display (full tokens)",
                TextWrapping = TextWrapping.Wrap, FontWeight = FontWeights.SemiBold });
            inspectionPanel.Children.Add(clearInspection);
            inspectionPanel.Children.Add(app.Inspection);
            var inspector = new Expander { Header = "Native SDK boundary (not wire HTTP)", Content = inspectionPanel, IsExpanded = true };
            DockPanel.SetDock(inspector, Dock.Bottom);
            surface.Children.Add(inspector);
            surface.Children.Add(app.Browser);
            app.Tab.Content = surface;
            RenderInspection(app);
        }
        else app.Tab.Content = app.Browser;
        apps.Add(number, app);
        tabs.Items.Add(app.Tab);
        tabs.SelectedItem = app.Tab;
        Action<BridgeEvent> appLog = entry => Log(entry, number);
        try
        {
            var authority = $"https://login.microsoftonline.com/{settings.TenantId}";
            var child = brokerSettings?.Children.Single(candidate => candidate.Number == number);
            var clientId = child?.ClientId ?? settings.ClientId;
            var scopes = child?.Scopes ?? settings.Scopes;
            IBridgeTokenExecutor acquire = brokerMode
                ? new NativeBrokerExecutor(brokerSettings!, child!, () => oneAuth, snapshot => ObserveInvocation(app, snapshot),
                    () => BeginInspection(app), error => ObserveInspectionError(app, error))
                : executor!;
            var protocol = new NativeExecutorBoundary(clientId, authority, scopes, acquire, appLog, app.PageUrl);
            var appEnvironment = brokerMode
                ? await CoreWebView2Environment.CreateAsync(userDataFolder: Path.Combine(dataDirectory, "BrokerWebView2", brokerSettings!.HostClientId, clientId))
                : environment;
            await app.Browser.EnsureCoreWebView2Async(appEnvironment);
            if (lifetime.IsCancellationRequested) return;
            var core = app.Browser.CoreWebView2;
            core.Settings.IsStatusBarEnabled = false;
            core.SetVirtualHostNameToFolderMapping(app.HostName, Path.Combine(AppContext.BaseDirectory, "web"), CoreWebView2HostResourceAccessKind.DenyCors);
            app.Bridge = await WebView2Bridge.AttachAsync(core, protocol, appLog);
            var nativeRequests = 0;
            core.WebMessageReceived += async (_, args) =>
            {
                try
                {
                    if (args.Source != app.PageUrl || core.Source != app.PageUrl) return;
                    var message = args.TryGetWebMessageAsString();
                    if (message.Length > 1_048_576) return;
                    using var envelope = JsonDocument.Parse(message);
                    var messageType = envelope.RootElement.GetProperty("messageType").GetString();
                    if (messageType == "NestedAppAuthRequest")
                    {
                        if (envelope.RootElement.GetProperty("method").GetString() is "GetToken" or "GetTokenPopup") nativeRequests++;
                        return;
                    }
                    if (messageType == "BridgePocReady")
                    {
                        if (smoke && (nativeRequests != 0 || await core.ExecuteScriptAsync(
                            "Boolean(globalThis.NestedAppAuthBridge && window.nestedAppAuthBridge)") != "true"))
                        {
                            app.Ready.TrySetResult(false);
                            Log(new("host", "smoke_failed", Code: "javascript_initialization_not_isolated"));
                            Application.Current.Shutdown(1);
                            return;
                        }
                        appLog(new("host", "web_initialized"));
                        app.Ready.TrySetResult(true);
                        if (smoke && !smokeTabs)
                        {
                            smokeDeadline?.Stop();
                            using var image = File.Create(Path.Combine(dataDirectory, "smoke-preview.png"));
                            await core.CapturePreviewAsync(CoreWebView2CapturePreviewImageFormat.Png, image);
                            Log(new("host", "smoke_passed"));
                            Application.Current.Shutdown(0);
                        }
                        return;
                    }
                }
                catch (Exception error)
                {
                    appLog(new("host", "transport_failed", Code: error.GetType().Name));
                }
            };
            var configJson = JsonSerializer.Serialize(new { appName = app.Name, clientId, authority, scopes, brokerHostClientId = child?.BrokerHostClientId, nestedRedirectUri = child?.RedirectUri });
            await core.AddScriptToExecuteOnDocumentCreatedAsync($"if (window.top === window && location.href === {JsonSerializer.Serialize(app.PageUrl)}) {{ window.bridgePocConfig = {configJson}; }}");
            appLog(new("host", "ready"));
            core.Navigate(app.PageUrl);
        }
        catch (Exception error)
        {
            app.Ready.TrySetResult(false);
            appLog(new("host", "app_startup_failed", Code: error.GetType().Name));
            if (!lifetime.IsCancellationRequested)
            {
                app.Bridge?.Dispose();
                app.Browser.Dispose();
                tabs.Items.Remove(app.Tab);
                apps.Remove(number);
            }
        }
    }

    private async Task VerifyTabsAsync()
    {
        if (apps.Count != 1 || tabs.Items.Count != 1 || !await apps[1].Ready.Task.WaitAsync(lifetime.Token))
            throw new InvalidOperationException("Default app did not load alone.");
        Log(new("host", "smoke_default_app_passed"));
        await apps[1].Browser.CoreWebView2.ExecuteScriptAsync("window.tabSmokeMarker = 'app1';");
        foreach (var button in brokerMode ? new[] { openApp2 } : new[] { openApp2, openApp3 })
        {
            button.RaiseEvent(new RoutedEventArgs(Button.ClickEvent));
            var number = button == openApp2 ? 2 : 3;
            if (!await apps[number].Ready.Task.WaitAsync(lifetime.Token))
                throw new InvalidOperationException($"App {number} failed to initialize.");
            var core = apps[number].Browser.CoreWebView2;
            var identity = await core.ExecuteScriptAsync("document.getElementById('app-name').textContent");
            if (JsonSerializer.Deserialize<string>(identity) != apps[number].Name || core.Source != apps[number].PageUrl)
                throw new InvalidOperationException("Tab identity or trusted origin mismatch.");
            if (brokerSettings is not null)
            {
                var expected = brokerSettings.Children.Single(child => child.Number == number);
                var boundClient = await core.ExecuteScriptAsync("window.bridgePocConfig.clientId");
                if (JsonSerializer.Deserialize<string>(boundClient) != expected.ClientId)
                    throw new InvalidOperationException("Child registration binding mismatch.");
            }
            if (await core.ExecuteScriptAsync("typeof window.tabSmokeMarker") != "\"undefined\"")
                throw new InvalidOperationException("JavaScript state leaked between apps.");
            using var image = File.Create(Path.Combine(dataDirectory, $"smoke-app{number}.png"));
            await core.CapturePreviewAsync(CoreWebView2CapturePreviewImageFormat.Png, image);
        }
        openApp2.RaiseEvent(new RoutedEventArgs(Button.ClickEvent));
        if (brokerSettings is not null)
        {
            foreach (var child in brokerSettings.Children)
            {
                var core = apps[child.Number].Browser.CoreWebView2;
                var configured = await core.ExecuteScriptAsync("JSON.stringify([window.bridgePocConfig.clientId, window.bridgePocConfig.brokerHostClientId, window.bridgePocConfig.nestedRedirectUri])");
                var fields = JsonSerializer.Deserialize<string[]>(JsonSerializer.Deserialize<string>(configured)!);
                if (fields is null || !fields.SequenceEqual(new[] { child.ClientId, brokerSettings.HostClientId, child.RedirectUri }))
                    throw new InvalidOperationException("Host/child/redirect injection mismatch.");
            }
            if (apps.Values.Select(app => app.Browser.CoreWebView2.Environment.UserDataFolder).Distinct(StringComparer.OrdinalIgnoreCase).Count() != brokerSettings.Children.Length)
                throw new InvalidOperationException("Broker children share a browser profile.");
            Log(new("host", "smoke_broker_bindings_passed"));
        }
        var expectedCount = brokerSettings?.Children.Length ?? 3;
        if (apps.Count != expectedCount || tabs.Items.Count != expectedCount || tabs.SelectedItem != apps[2].Tab)
            throw new InvalidOperationException("Reopening created a duplicate tab.");
        tabs.SelectedItem = apps[1].Tab;
        if (await apps[1].Browser.CoreWebView2.ExecuteScriptAsync("window.tabSmokeMarker") != "\"app1\"")
            throw new InvalidOperationException("App state was lost on tab switching.");
        if (smokeInspection) await VerifyInitializationInspectionAsync();
        smokeDeadline?.Stop();
        Log(new("host", "smoke_tabs_passed"));
        Application.Current.Shutdown(0);
    }

    private async Task VerifyInitializationInspectionAsync()
    {
        if (!brokerMode || oneAuth is not null) throw new InvalidOperationException("Inspection smoke requires an uninitialized broker.");
        var request = new OneAuthInitializationRequest("synthetic-app", brokerSettings!.HostClientId, "msauth://synthetic", "User.Read", true, "");
        foreach (var app in apps.Values)
        {
            using var pending = JsonDocument.Parse(app.Inspection.Text);
            if (!pending.RootElement.GetProperty("initialization").GetProperty("State").GetString()!.StartsWith("not_initialized"))
                throw new InvalidOperationException("Startup pending state is missing.");
        }
        ObserveInitialization(new(request, "failed", new(-1, false), new { type = "SyntheticCreateFailure" }));
        foreach (var app in apps.Values)
        {
            using var failed = JsonDocument.Parse(app.Inspection.Text);
            if (failed.RootElement.GetProperty("initialization").GetProperty("Response").GetProperty("Status").GetInt32() != -1)
                throw new InvalidOperationException("Startup error is missing from a child pane.");
        }
        ObserveInitialization(new(request, "completed", new(0, true)));
        foreach (var app in apps.Values)
        {
            var expectedInitialization = JsonSerializer.Serialize(initialization);
            using (var before = JsonDocument.Parse(app.Inspection.Text))
                if (JsonSerializer.Serialize(before.RootElement.GetProperty("initialization")) != expectedInitialization)
                    throw new InvalidOperationException("Initialization request/result missing before acquisition.");
            var child = brokerSettings.Children.Single(candidate => candidate.Number == app.Number);
            var executor = new NativeBrokerExecutor(brokerSettings, child, () => null, snapshot => ObserveInvocation(app, snapshot),
                () => BeginInspection(app), error => ObserveInspectionError(app, error));
            try
            {
                await executor.ExecuteAsync(new NativeRequest(false, child.Scopes, Guid.NewGuid(), null, null), default);
                throw new InvalidOperationException("Synthetic uninitialized acquisition unexpectedly succeeded.");
            }
            catch (ExecutorException error) when (error.Code == "oneauth_adapter_not_initialized") { }
            var invocation = new OneAuthInvocation(new("synthetic-app", request.ClientId, request.RedirectUri, request.DefaultScope, 1, ""),
                "https://example.test", "User.Read", child.ClientId, child.RedirectUri, "", "synthetic-correlation", "", 1, 0);
            var snapshot = new OneAuthInspection(invocation, "completed", new("SYNTHETIC_ACCESS", "SYNTHETIC_ID", 3600, "synthetic-home", "example.test", "User.Read"));
            ObserveInvocation(app, snapshot);
            using (var after = JsonDocument.Parse(app.Inspection.Text))
                if (JsonSerializer.Serialize(after.RootElement.GetProperty("initialization")) != expectedInitialization ||
                    after.RootElement.GetProperty("invocations").GetArrayLength() != 1)
                    throw new InvalidOperationException("Acquisition erased initialization request/result.");
            ClearInspection(app);
            ObserveInvocation(app, snapshot);
            if (app.Inspection.Text.Length != 0 || app.Invocations.Count != 0)
                throw new InvalidOperationException("Clear retained data or accepted a late acquisition update.");
            BeginInspection(app);
            using var restored = JsonDocument.Parse(app.Inspection.Text);
            if (JsonSerializer.Serialize(restored.RootElement.GetProperty("initialization")) != expectedInitialization)
                throw new InvalidOperationException("New acquisition did not restore initialization.");
        }
        Log(new("host", "smoke_initialization_inspection_passed"));
    }
}