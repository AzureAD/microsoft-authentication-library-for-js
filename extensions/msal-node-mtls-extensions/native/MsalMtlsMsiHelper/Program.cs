/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 *
 * MsalMtlsMsiHelper — thin .NET wrapper around msal-dotnet's Managed Identity
 * mTLS PoP flow. Spawned as a child process by @azure/msal-node-mtls-extensions.
 *
 * Modes:
 *
 * --mode acquire-token (default)
 *   Acquires an mTLS PoP token for a Managed Identity.
 *   Input  (command-line arguments):
 *     --resource       <string>   Azure resource URI  (e.g. https://management.azure.com)
 *     --identity-type  <string>   "SystemAssigned" | "UserAssigned"
 *     --identity-id    <string>   Client ID / resource ID (UserAssigned only)
 *     --with-attestation           Include KeyGuard attestation (MAA JWT) in the request
 *     --correlation-id <string>   Optional GUID for telemetry
 *   Output (JSON on stdout, exit code 0):
 *     {
 *       "access_token":         "<string>",
 *       "token_type":           "mtls_pop",
 *       "expires_in":           <number>,
 *       "binding_certificate":  "<PEM string>",
 *       "tenant_id":            "<string>",
 *       "client_id":            "<string>"
 *     }
 *
 * --mode http-request
 *   Makes a downstream HTTP call over mutual TLS using the KeyGuard-bound certificate.
 *   The downstream server MUST be configured for required mutual TLS — it must send
 *   a TLS CertificateRequest during the handshake. Public Azure APIs (e.g. Graph,
 *   Key Vault) use optional mTLS and will NOT trigger client cert presentation; use
 *   this mode only with servers explicitly configured to require a client certificate.
 *   Input  (command-line arguments):
 *     --url            <string>   Full URL to call
 *     --method         <string>   HTTP method (GET, POST, PUT, PATCH, DELETE)
 *     --token          <string>   The mtls_pop access token to include as Authorization header
 *     --header         <string>   Extra header in "Name: Value" format (repeatable)
 *     --body           <string>   Request body (for POST/PUT/PATCH)
 *     --content-type   <string>   Content-Type header (default: application/json)
 *     --identity-type  <string>   "SystemAssigned" | "UserAssigned" (to retrieve the right key)
 *     --identity-id    <string>   Client ID / resource ID (UserAssigned only)
 *     --with-attestation           Use attestation when re-acquiring the binding cert
 *     --correlation-id <string>   Optional GUID for telemetry
 *     --allow-insecure-tls         Skip server TLS certificate validation (self-signed certs in local testing only)
 *   Output (JSON on stdout, exit code 0):
 *     {
 *       "status":   <number>,
 *       "headers":  { "<name>": "<value>", ... },
 *       "body":     "<string>"
 *     }
 *
 * Error (JSON on stderr, non-zero exit code):
 *   { "error": "<code>", "error_description": "<message>" }
 */

using System.Net.Http.Headers;
using System.Security.Cryptography.X509Certificates;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Identity.Client;
using Microsoft.Identity.Client.AppConfig;
using Microsoft.Identity.Client.KeyAttestation;

var argv = Environment.GetCommandLineArgs()[1..];

// Determine mode
var mode = "acquire-token";
for (int i = 0; i < argv.Length; i++)
{
    if (argv[i] == "--mode" && i + 1 < argv.Length)
    {
        mode = argv[i + 1];
        break;
    }
}

try
{
    if (mode == "http-request")
    {
        var httpArgs = HttpRequestArgs.Parse(argv);
        var result = await RunHttpRequest(httpArgs);
        Console.WriteLine(JsonSerializer.Serialize(result, JsonContext.Default.HttpResponse));
        return 0;
    }
    else
    {
        var tokenArgs = CliArgs.Parse(argv);
        var result = await RunAcquireToken(tokenArgs);
        Console.WriteLine(JsonSerializer.Serialize(result, JsonContext.Default.TokenResponse));
        return 0;
    }
}
catch (MsalException ex)
{
    WriteError(ex.ErrorCode, UnwrapException(ex));
    return 1;
}
catch (Exception ex)
{
    WriteError("unexpected_error", UnwrapException(ex));
    return 1;
}

static void WriteError(string code, string description)
{
    var error = new ErrorResponse { Error = code, ErrorDescription = description };
    Console.Error.WriteLine(JsonSerializer.Serialize(error, JsonContext.Default.ErrorResponse));
}

static string UnwrapException(Exception ex)
{
    var parts = new System.Collections.Generic.List<string>();
    var current = ex;
    while (current != null)
    {
        parts.Add(current.GetType().Name + ": " + current.Message);
        current = current.InnerException;
    }
    return string.Join(" | ", parts);
}

static async Task<TokenResponse> RunAcquireToken(CliArgs parsedArgs)
{
    var identityId = parsedArgs.IdentityType == "UserAssigned"
        ? ManagedIdentityId.WithUserAssignedClientId(parsedArgs.IdentityId
            ?? throw new ArgumentException("--identity-id is required for UserAssigned identity"))
        : ManagedIdentityId.SystemAssigned;

    var app = ManagedIdentityApplicationBuilder.Create(identityId).Build();

    var tokenRequestBuilder = app
        .AcquireTokenForManagedIdentity(parsedArgs.Resource)
        .WithMtlsProofOfPossession();

    if (parsedArgs.WithAttestation)
        tokenRequestBuilder = tokenRequestBuilder.WithAttestationSupport();

    if (!string.IsNullOrEmpty(parsedArgs.CorrelationId) &&
        Guid.TryParse(parsedArgs.CorrelationId, out var correlationGuid))
        tokenRequestBuilder = tokenRequestBuilder.WithCorrelationId(correlationGuid);

    var result = await tokenRequestBuilder.ExecuteAsync();

    var bindingCertPem = result.BindingCertificate != null
        ? ExportCertificateToPem(result.BindingCertificate)
        : null;

    var expiresIn = (int)(result.ExpiresOn - DateTimeOffset.UtcNow).TotalSeconds;

    return new TokenResponse
    {
        AccessToken = result.AccessToken,
        TokenType = result.TokenType,
        ExpiresIn = Math.Max(0, expiresIn),
        BindingCertificate = bindingCertPem,
        TenantId = result.TenantId,
        ClientId = result.Account?.HomeAccountId?.ObjectId ?? string.Empty,
    };
}

static async Task<HttpResponse> RunHttpRequest(HttpRequestArgs args)
{
    // Re-acquire the binding certificate via the same Managed Identity flow.
    // This retrieves the same KeyGuard key (identified by cuId on this VM).
    var identityId = args.IdentityType == "UserAssigned"
        ? ManagedIdentityId.WithUserAssignedClientId(args.IdentityId
            ?? throw new ArgumentException("--identity-id is required for UserAssigned identity"))
        : ManagedIdentityId.SystemAssigned;

    var app = ManagedIdentityApplicationBuilder.Create(identityId).Build();

    var tokenRequestBuilder = app
        .AcquireTokenForManagedIdentity(args.Resource ?? args.Url)
        .WithMtlsProofOfPossession();

    if (args.WithAttestation)
        tokenRequestBuilder = tokenRequestBuilder.WithAttestationSupport();

    if (!string.IsNullOrEmpty(args.CorrelationId) &&
        Guid.TryParse(args.CorrelationId, out var corrGuid))
        tokenRequestBuilder = tokenRequestBuilder.WithCorrelationId(corrGuid);

    var tokenResult = await tokenRequestBuilder.ExecuteAsync();

    if (tokenResult.BindingCertificate == null)
        throw new InvalidOperationException("No binding certificate returned — cannot make mTLS request.");

    var bindingCert = tokenResult.BindingCertificate;

    // Configure an HttpClientHandler with the KeyGuard-bound certificate.
    // The downstream server must be configured to require mutual TLS so that it
    // sends a TLS CertificateRequest during the handshake — only then will the
    // client certificate be presented and the cnf.x5t#S256 claim validated.
    var handler = new HttpClientHandler();
    handler.ClientCertificates.Add(bindingCert);

    // --allow-insecure-tls skips server certificate validation.
    // Use this ONLY for local testing against self-signed server certificates.
    if (args.AllowInsecureTls)
        handler.ServerCertificateCustomValidationCallback =
            HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;

    using var client = new HttpClient(handler);

    // Build the request
    var requestMessage = new HttpRequestMessage(
        new HttpMethod(args.Method),
        args.Url
    );

    // Authorization: mtls_pop <token>
    requestMessage.Headers.Authorization =
        new AuthenticationHeaderValue("mtls_pop", args.Token);

    // Extra headers
    foreach (var header in args.Headers)
    {
        var parts = header.Split(':', 2);
        if (parts.Length == 2)
            requestMessage.Headers.TryAddWithoutValidation(parts[0].Trim(), parts[1].Trim());
    }

    // Body
    if (!string.IsNullOrEmpty(args.Body))
    {
        requestMessage.Content = new StringContent(
            args.Body,
            System.Text.Encoding.UTF8,
            args.ContentType ?? "application/json"
        );
    }

    if (!string.IsNullOrEmpty(args.CorrelationId))
        requestMessage.Headers.TryAddWithoutValidation("x-ms-client-request-id", args.CorrelationId);

    var response = await client.SendAsync(requestMessage);
    var body = await response.Content.ReadAsStringAsync();

    var responseHeaders = new Dictionary<string, string>();
    foreach (var h in response.Headers)
        responseHeaders[h.Key] = string.Join(", ", h.Value);
    foreach (var h in response.Content.Headers)
        responseHeaders[h.Key] = string.Join(", ", h.Value);

    return new HttpResponse
    {
        Status = (int)response.StatusCode,
        Headers = responseHeaders,
        Body = body,
    };
}

static string ExportCertificateToPem(X509Certificate2 cert)
{
    var base64 = Convert.ToBase64String(cert.Export(X509ContentType.Cert));
    var lines = Enumerable.Range(0, (base64.Length + 63) / 64)
        .Select(i => base64.Substring(i * 64, Math.Min(64, base64.Length - i * 64)));
    return "-----BEGIN CERTIFICATE-----\n" + string.Join("\n", lines) + "\n-----END CERTIFICATE-----";
}

// ─── Argument models ─────────────────────────────────────────────────────────

internal sealed record CliArgs
{
    public string Resource { get; init; } = string.Empty;
    public string IdentityType { get; init; } = "SystemAssigned";
    public string? IdentityId { get; init; }
    public bool WithAttestation { get; init; }
    public string? CorrelationId { get; init; }

    public static CliArgs Parse(string[] argv)
    {
        string? resource = null;
        string identityType = "SystemAssigned";
        string? identityId = null;
        bool withAttestation = false;
        string? correlationId = null;

        for (int i = 0; i < argv.Length; i++)
        {
            switch (argv[i])
            {
                case "--resource":       resource = argv[++i];      break;
                case "--identity-type":  identityType = argv[++i];  break;
                case "--identity-id":    identityId = argv[++i];    break;
                case "--with-attestation": withAttestation = true;  break;
                case "--correlation-id": correlationId = argv[++i]; break;
                default: break;
            }
        }

        if (string.IsNullOrEmpty(resource))
            throw new ArgumentException("--resource is required");

        return new CliArgs
        {
            Resource = resource,
            IdentityType = identityType,
            IdentityId = identityId,
            WithAttestation = withAttestation,
            CorrelationId = correlationId,
        };
    }
}

internal sealed record HttpRequestArgs
{
    public string Url { get; init; } = string.Empty;
    public string Method { get; init; } = "GET";
    public string Token { get; init; } = string.Empty;
    public List<string> Headers { get; init; } = new();
    public string? Body { get; init; }
    public string? ContentType { get; init; }
    public string? Resource { get; init; }
    public string IdentityType { get; init; } = "SystemAssigned";
    public string? IdentityId { get; init; }
    public bool WithAttestation { get; init; }
    public string? CorrelationId { get; init; }
    /// <summary>
    /// When true, skips server TLS certificate validation.
    /// Use ONLY for local testing against self-signed server certificates
    /// (e.g. the mtls-test-server.mjs in test-server/).
    /// </summary>
    public bool AllowInsecureTls { get; init; }

    public static HttpRequestArgs Parse(string[] argv)
    {
        string? url = null;
        string method = "GET";
        string? token = null;
        var headers = new List<string>();
        string? body = null;
        string? contentType = null;
        string? resource = null;
        string identityType = "SystemAssigned";
        string? identityId = null;
        bool withAttestation = false;
        string? correlationId = null;
        bool allowInsecureTls = false;

        for (int i = 0; i < argv.Length; i++)
        {
            switch (argv[i])
            {
                case "--url":            url = argv[++i];           break;
                case "--method":         method = argv[++i];        break;
                case "--token":          token = argv[++i];         break;
                case "--header":         headers.Add(argv[++i]);    break;
                case "--body":           body = argv[++i];          break;
                case "--content-type":   contentType = argv[++i];   break;
                case "--resource":       resource = argv[++i];      break;
                case "--identity-type":  identityType = argv[++i];  break;
                case "--identity-id":    identityId = argv[++i];    break;
                case "--with-attestation": withAttestation = true;  break;
                case "--correlation-id": correlationId = argv[++i]; break;
                case "--allow-insecure-tls": allowInsecureTls = true; break;
                default: break;
            }
        }

        if (string.IsNullOrEmpty(url))
            throw new ArgumentException("--url is required for http-request mode");
        if (string.IsNullOrEmpty(token))
            throw new ArgumentException("--token is required for http-request mode");

        return new HttpRequestArgs
        {
            Url = url,
            Method = method,
            Token = token,
            Headers = headers,
            Body = body,
            ContentType = contentType,
            Resource = resource,
            IdentityType = identityType,
            IdentityId = identityId,
            WithAttestation = withAttestation,
            CorrelationId = correlationId,
            AllowInsecureTls = allowInsecureTls,
        };
    }
}

// ─── JSON response models ─────────────────────────────────────────────────────

internal sealed class TokenResponse
{
    [JsonPropertyName("access_token")]
    public string AccessToken { get; set; } = string.Empty;

    [JsonPropertyName("token_type")]
    public string TokenType { get; set; } = string.Empty;

    [JsonPropertyName("expires_in")]
    public int ExpiresIn { get; set; }

    [JsonPropertyName("binding_certificate")]
    public string? BindingCertificate { get; set; }

    [JsonPropertyName("tenant_id")]
    public string? TenantId { get; set; }

    [JsonPropertyName("client_id")]
    public string? ClientId { get; set; }
}

internal sealed class HttpResponse
{
    [JsonPropertyName("status")]
    public int Status { get; set; }

    [JsonPropertyName("headers")]
    public Dictionary<string, string> Headers { get; set; } = new();

    [JsonPropertyName("body")]
    public string Body { get; set; } = string.Empty;
}

internal sealed class ErrorResponse
{
    [JsonPropertyName("error")]
    public string Error { get; set; } = string.Empty;

    [JsonPropertyName("error_description")]
    public string ErrorDescription { get; set; } = string.Empty;
}

[JsonSerializable(typeof(TokenResponse))]
[JsonSerializable(typeof(HttpResponse))]
[JsonSerializable(typeof(ErrorResponse))]
[JsonSerializable(typeof(Dictionary<string, string>))]
internal partial class JsonContext : JsonSerializerContext { }

