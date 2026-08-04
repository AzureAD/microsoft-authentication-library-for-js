# MSAL Node Standalone Sample: Client Credentials Grant with mTLS Proof-of-Possession (SN/I certificate)

This sample demonstrates how to use an MSAL Node [confidential client application](../../../lib/msal-node/docs/initialize-confidential-client-application.md) to acquire an **mTLS-bound Proof-of-Possession (`mtls_pop`)** access token from Microsoft Entra ID using a **Subject Name + Issuer (SN/I)** certificate.

Instead of using the SN/I certificate to sign a `private_key_jwt` client assertion (which yields a **Bearer** token — the existing "SNI + Bearer" flow), MSAL presents the **same certificate as the client TLS certificate** in the mutual-TLS handshake to the token endpoint. Entra ID (ESTS) then returns a token whose `token_type` is `mtls_pop`, cryptographically bound to that certificate (`cnf`/`x5t#S256`).

See the [mTLS Proof-of-Possession docs](../../../lib/msal-node/docs/mtls-proof-of-possession.md) for the full concept and region guidance.

## Scenarios covered

1. **Vanilla SN/I → mTLS PoP** (`getMtlsPopToken` in `app.ts`): the app is configured with an SN/I certificate and requests a token with `mtlsProofOfPossession: true`. The certificate is the client TLS certificate; no `client_assertion` is sent.

## Requirements / limitations

-   Node.js — MSAL owns the mTLS transport via the built-in `node:https` HttpClient. A custom `networkClient` cannot attach the client certificate, so it is not supported with `mtlsProofOfPossession`.
-   The authority must be **tenanted** — `/common` and `/organizations` are rejected on the mTLS path.
-   Only the **public** commercial cloud is supported today (host becomes `mtlsauth.microsoft.com`, or `{region}.mtlsauth.microsoft.com` when a region is set). US Gov / China clouds fail fast.
-   ESTS gates mTLS PoP on the **resource audience** (must be ESTS allow-listed, e.g. Microsoft Graph or Azure Key Vault), not the client app.

## Setup

Locate the folder where `package.json` resides in your terminal. Then type:

```console
    npm install
```

## Register

Register a confidential-client app and upload your certificate exactly as for the [certificate client-credentials sample](../client-credentials-with-cert-from-key-vault/README.md#register).

Before running the sample you will need to retrieve the certificate and create a `.env` file:

```typescript
const credentials = new DefaultAzureCredential();
[thumbprint, privateKey, x5c] = await getCertificateInfo(
    credentials,
    "KEY_VAULT_URL", // e.g. "https://msidlabs.vault.azure.net"
    "CERT_NAME" // e.g. "LabAuth"
);
```

```
CLIENT_ID=YOUR_CLIENT_ID_HERE
TENANT_ID=YOUR_TENANT_ID_HERE
CLIENT_CERTIFICATE_THUMBPRINT_SHA_256=YOUR_CLIENT_CERTIFICATE_THUMBPRINT_SHA_256_HERE
CLIENT_CERTIFICATE_PRIVATE_KEY=YOUR_CLIENT_CERTIFICATE_PRIVATE_KEY_HERE
CLIENT_CERTIFICATE_X5C=YOUR_CLIENT_CERTIFICATE_X5C_HERE
```

## Usage

Vanilla SN/I → mTLS PoP:

```typescript
const result = await cca.acquireTokenByClientCredential({
    scopes: ["https://graph.microsoft.com/.default"],
    azureRegion: "westus3", // recommended; falls back to the global mTLS endpoint if omitted
    mtlsProofOfPossession: true,
});

result.tokenType; // "mtls_pop"
result.bindingCertificate; // { x5c, thumbprintSha256 } the token is bound to
```

## Run the app

Before running the sample (and every time changes are made to the sample), the TypeScript will need to be compiled. In the same folder, type:

```console
    npx tsc
```

This will compile the TypeScript into JavaScript and put the compiled files in the `/dist` folder.

The sample can now be run by typing:

```console
    node dist/app.js
```

An npm script, which will run the above `npx tsc` and `node` command, has been configured in `package.json`. To compile and start the sample, type:

```console
    npm start
```

The token type (`mtls_pop`) and the binding certificate thumbprint should be displayed in the terminal.
