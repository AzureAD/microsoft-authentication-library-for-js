/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 *
 * MsalMtlsMsiHelper — thin .NET wrapper around msal-dotnet's Managed Identity
 * mTLS PoP flow. Spawned as a child process by @azure/msal-node-mtls-extensions.
 *
 * Input  (command-line arguments):
 *   --resource       <string>   Azure resource URI  (e.g. https://management.azure.com)
 *   --identity-type  <string>   "SystemAssigned" | "UserAssigned"
 *   --identity-id    <string>   Client ID / resource ID (UserAssigned only)
 *   --with-attestation           Include KeyGuard attestation (MAA JWT) in the request
 *   --correlation-id <string>   Optional GUID for telemetry
 *
 * Output (JSON on stdout, exit code 0):
 *   {
 *     "access_token":         "<string>",
 *     "token_type":           "mtls_pop",
 *     "expires_in":           <number>,       // seconds from now
 *     "binding_certificate":  "<PEM string>"  // public cert bound to the token
 *   }
 *
 * Error (JSON on stderr, non-zero exit code):
 *   { "error": "<code>", "error_description": "<message>" }
 */

using System.Security.Cryptography.X509Certificates;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Identity.Client;
using Microsoft.Identity.Client.AppConfig;
using Microsoft.Identity.Client.KeyAttestation;

try
{
    var parsedArgs = CliArgs.Parse(Environment.GetCommandLineArgs()[1..]);

    var identityId = parsedArgs.IdentityType == "UserAssigned"
        ? ManagedIdentityId.WithUserAssignedClientId(parsedArgs.IdentityId
            ?? throw new ArgumentException("--identity-id is required for UserAssigned identity"))
        : ManagedIdentityId.SystemAssigned;

    var app = ManagedIdentityApplicationBuilder
        .Create(identityId)
        .Build();

    var tokenRequestBuilder = app
        .AcquireTokenForManagedIdentity(parsedArgs.Resource)
        .WithMtlsProofOfPossession();

    if (parsedArgs.WithAttestation)
    {
        tokenRequestBuilder = tokenRequestBuilder.WithAttestationSupport();
    }

    if (!string.IsNullOrEmpty(parsedArgs.CorrelationId) &&
        Guid.TryParse(parsedArgs.CorrelationId, out var correlationGuid))
    {
        tokenRequestBuilder = tokenRequestBuilder.WithCorrelationId(correlationGuid);
    }

    var result = await tokenRequestBuilder.ExecuteAsync();

    var bindingCertPem = result.BindingCertificate != null
        ? ExportCertificateToPem(result.BindingCertificate)
        : null;

    var expiresIn = (int)(result.ExpiresOn - DateTimeOffset.UtcNow).TotalSeconds;

    var output = new TokenResponse
    {
        AccessToken = result.AccessToken,
        TokenType = result.TokenType,
        ExpiresIn = Math.Max(0, expiresIn),
        BindingCertificate = bindingCertPem,
    };

    Console.WriteLine(JsonSerializer.Serialize(output, JsonContext.Default.TokenResponse));
    return 0;
}
catch (MsalException ex)
{
    var error = new ErrorResponse
    {
        Error = ex.ErrorCode,
        ErrorDescription = ex.Message,
    };
    Console.Error.WriteLine(JsonSerializer.Serialize(error, JsonContext.Default.ErrorResponse));
    return 1;
}
catch (Exception ex)
{
    var error = new ErrorResponse
    {
        Error = "unexpected_error",
        ErrorDescription = ex.Message,
    };
    Console.Error.WriteLine(JsonSerializer.Serialize(error, JsonContext.Default.ErrorResponse));
    return 1;
}

static string ExportCertificateToPem(X509Certificate2 cert)
{
    var base64 = Convert.ToBase64String(cert.Export(X509ContentType.Cert));
    var lines = Enumerable.Range(0, (base64.Length + 63) / 64)
        .Select(i => base64.Substring(i * 64, Math.Min(64, base64.Length - i * 64)));
    return "-----BEGIN CERTIFICATE-----\n" + string.Join("\n", lines) + "\n-----END CERTIFICATE-----";
}

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
                case "--resource":
                    resource = argv[++i];
                    break;
                case "--identity-type":
                    identityType = argv[++i];
                    break;
                case "--identity-id":
                    identityId = argv[++i];
                    break;
                case "--with-attestation":
                    withAttestation = true;
                    break;
                case "--correlation-id":
                    correlationId = argv[++i];
                    break;
                default:
                    break;
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
}

internal sealed class ErrorResponse
{
    [JsonPropertyName("error")]
    public string Error { get; set; } = string.Empty;

    [JsonPropertyName("error_description")]
    public string ErrorDescription { get; set; } = string.Empty;
}

[JsonSerializable(typeof(TokenResponse))]
[JsonSerializable(typeof(ErrorResponse))]
internal partial class JsonContext : JsonSerializerContext { }
