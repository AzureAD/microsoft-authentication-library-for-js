using System.Text.Json;

namespace Identity.NativeBridge;

public static class BridgeScript
{
    public static string ValidateDocumentUrl(string documentUrl)
    {
        if (!Uri.TryCreate(documentUrl, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps ||
            !string.IsNullOrEmpty(uri.UserInfo) || !string.IsNullOrEmpty(uri.Fragment))
            throw new ArgumentException("An absolute HTTPS document URL without credentials or a fragment is required.", nameof(documentUrl));
        return uri.AbsoluteUri;
    }

    public static string Create(string trustedDocumentUrl)
    {
        var documentUrl = ValidateDocumentUrl(trustedDocumentUrl);
        var bridge = ReadResource("Identity.NativeBridge.msal-bridge.js");
        return $"if (window.top === window && location.href === {JsonSerializer.Serialize(documentUrl)}) {{ {bridge}\n}}";
    }

    public static string Create(string trustedDocumentUrl, string configJson) => Create(trustedDocumentUrl);

    private static string ReadResource(string name)
    {
        using var stream = typeof(BridgeScript).Assembly.GetManifestResourceStream(name)
            ?? throw new InvalidOperationException($"Embedded bridge script is missing: {name}");
        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }
}