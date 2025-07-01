# Managed Identity as a Federated Identity Credential

In addition to using certificates as credentials, applications can also be configured to accept an access token issued by a trusted identity provider as a credential. This flow is known as a Federated Identity Credential (FIC). First-party applications can be configured to accept these access tokens as a credential when issued by certain Microsoft Entra tenants (for example, AME and PME) and when the token subject is an Azure Managed Identity.

While certificate authentication requires a client to create and sign a JSON Web Token (JWT) to provide as a client assertion, with Federated Identity Credentials the access token issued by the trusted identity provider is passed directly as the client_assertion value.

## Note

-   Managed Identity as a Federated Identity Credential is not a third-party offering at this time. This sample is for internal use only and is used for internal testing.
