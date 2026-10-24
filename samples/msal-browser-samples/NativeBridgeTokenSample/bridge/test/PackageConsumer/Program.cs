using System.IO;
using System.Text.Json;
using Identity.NativeBridge;
using Identity.NativeBridge.WebView2;

const string documentUrl = "https://consumer.example/index.html";
if (typeof(NativeExecutorBoundary).Assembly.GetType("Identity.NativeBridge.BridgeProtocol") is not null)
    throw new Exception("Obsolete BridgeProtocol compatibility alias is still packaged.");
var bindingAssembly = typeof(WebView2Bridge).Assembly.GetName().Name;
if (bindingAssembly != "Identity.NativeBridge.WebView2") throw new Exception("Packaged binding is missing.");
var protocol = new NativeExecutorBoundary("11111111-1111-1111-1111-111111111111",
    "https://login.microsoftonline.com/organizations", ["User.Read"],
    (request, _) => Task.FromResult(new NativeToken("CONSUMER-ACCESS", "CONSUMER-ID", 3600, "home", "login.microsoftonline.com")), _ => { }, documentUrl);
var script = BridgeScript.Create(documentUrl);
var resources = typeof(BridgeScript).Assembly.GetManifestResourceNames();
if (resources.Count(name => name.EndsWith(".js", StringComparison.Ordinal)) != 1 ||
    resources.Contains("Identity.NativeBridge.protocol.js") || resources.Contains("Identity.NativeBridge.nativeBridge.js"))
    throw new Exception("Only the canonical compiled browser transport may be embedded.");
using var facade = typeof(BridgeScript).Assembly.GetManifestResourceStream("Identity.NativeBridge.msal-bridge.js");
if (facade is null) throw new Exception("Packaged browser transport is missing.");
using var facadeReader = new StreamReader(facade);
var facadeSource = facadeReader.ReadToEnd();
if (!script.Contains(documentUrl) || !script.Contains("window.top === window") ||
    !script.Contains(facadeSource, StringComparison.Ordinal) || !facadeSource.Contains("NestedAppAuthBridge") ||
    script.Contains(protocol.ConfigurationJson) || script.Contains("window.installNativeBridge({configuration:") ||
    BridgeScript.Create(documentUrl, "ignored compatibility configuration") != script)
    throw new Exception("Packaged browser transport or trusted document guard is incorrect.");
var message = JsonSerializer.Serialize(new { messageType = "NestedAppAuthRequest", requestId = Guid.NewGuid().ToString(), method = "GetToken",
    tokenParams = new { clientId = "11111111-1111-1111-1111-111111111111", authority = "https://login.microsoftonline.com/organizations",
        scope = "User.Read", correlationId = Guid.NewGuid().ToString() } });
using var reply = JsonDocument.Parse(await protocol.HandleAsync(message, documentUrl, CancellationToken.None));
if (!reply.RootElement.GetProperty("success").GetBoolean() || reply.RootElement.GetProperty("messageType").GetString() != "NestedAppAuthResponse" ||
    reply.RootElement.GetProperty("token").GetProperty("access_token").GetString() != "CONSUMER-ACCESS")
    throw new Exception("Packaged executor boundary failed.");
Console.WriteLine("PASS: NuGet-only consumer loads binding, single compiled browser transport, trusted top-document guard, and direct NAA response without project references.");