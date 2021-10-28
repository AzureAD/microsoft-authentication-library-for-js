# Ephemeral SSH Certificates

In addition to `Bearer` and `PoP` access tokens, MSAL Browser supports the acquisition of Ephemeral SSH certificates that allow users to access Azure Linux Virtual Machines remotely through the SSH protocol. This document outlines the recommended usage pattern of MSAL's `acquireToken` APIs when acquiring these SSH Certificates.

## Acquiring an SSH Certificate

### Pre-requsities

MSAL takes care of acquiring, caching and renewing (or "refreshing") the SSH certificate being requested. The following actions are the client application's responsibility:

* Generating an RSA keypair that the SSH certificate is meant to sign
* Securely storing said keypair 
* Retrieving and providing the public key from the aforementioned keypair and it's unique key ID to the MSAL `acquireToken` APIs used
* Enabling the required resources, scopes and permissions on the client application's AzureAD App Registration
* Making use of the SSH Certificate to make authorized requests to the resource in question

### SSH Certificate Request

In order to acquire an SSH certificate, the following parameters need to be added to the authentication request:

| Parameter |    Value    | Description |
|-----------|-------------|-------------|
| `authenticationScheme`| `ssh-cert` (`AuthenticationScheme.SSH`)| The request's authentication scheme tells MSAL what kind of credential to request. The options are `Bearer`, `pop`, and `ssh-cert`. MSAL provides the `AuthenticationScheme` enum which lists these options. |
| `sshJwk` | A stringified RSA Public Key in JSON Web Key format | The SSH JWK is the serialized (stringified) version of the public key component of the RSA key that the application generates.|
| `sshKid` | A string that uniquely identifes the `sshJwk` RSA key. | The SSH Key ID is used to uniquely identify and match the SSH certificate that MSAL obtains on behalf of the application. 

MSAL makes no use of the private key componenet of the RSA key in question. It is the client application's responsibility to securely store and retrieve the private key when necessary.

#### Acquire Token Redirect Request Example

```typescript
// Configure SSH Key Data
const sshKeyData = {
    key: PUBLIC_KEY_JWK, // Replace with your SSH Public Key in JSON Web Key object format
    keyId: "PUBLIC_KEY_ID" // Replace with the SSH Public Key's unique ID
};

// Configure SSH Certificate Request
const sshCertificateRequest = {
    scopes: ["SAMPLE_SSH_SCOPE"], // Replace with your resource's scope
    authenticationScheme: msal.AuthenticationScheme.SSH,
    sshJwk: JSON.stringify(sshKeyData.key),
    sshKid: sshKeyData.keyId
}
```

*Note: Setting the `authenticationScheme` to `AuthenticationScheme.SSH` will make the `sshJwk` and `sshKid` attributes mandatory, causing the request to fail with a `ClientConfigurationError` if either is omitted.*

Once the request has been configured and `SSH` is set as the `authenticationScheme`, it can be sent into the `acquireToken` MSAL v2 API.

```typescript
// The SSH Certificate will be the string value contained in the accessToken property of the AuthenticationResult object
const { accessToken } = await myMSALObj.acquireTokenRedirect(sshCertificateRequest);
```

#### Acquire Token Silent Request Example

Silently acquiring SSH Certificates requires the same changes to the token request configuration as with the interactive `acquireToken` APIs:

```typescript
// Configure SSH Key Data
const sshKeyData = {
    key: PUBLIC_KEY_JWK, // Replace with your SSH Public Key in JSON Web Key object format
    keyId: "PUBLIC_KEY_ID" // Replace with the SSH Public Key's unique ID
};

// Configure SSH Certificate Request
const silentSshCertificateRequest = {
    scopes: ["SAMPLE_SSH_SCOPE"], // Replace with your resource's scope
    authenticationScheme: msal.AuthenticationScheme.SSH,
    sshJwk: JSON.stringify(sshKeyData.key),
    sshKid: sshKeyData.keyId
}

// Try to acquire certificate silently
const { accessToken } = await myMSALObj.acquireTokenSilent(silentSshTokenRequest).catch(async (error) => {
        console.log("Silent token acquisition failed.");
        if (error instanceof msal.InteractionRequiredAuthError) {
            // Fallback to interaction if silent call fails
            console.log("Acquiring SSH Certificate using redirect");
            myMSALObj.acquireTokenRedirect(silentSshCertificateRequest);
        } else {
            console.error(error);
        }
    });
```

## Code samples

* [JavaScript SPA acquiring SSH Certificates](../../../samples/msal-browser-samples/VanillaJSTestApp2.0/app/ssh)