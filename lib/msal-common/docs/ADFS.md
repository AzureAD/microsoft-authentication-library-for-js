# ADFS Support

MSAL supports connecting to Azure AD, which signs in managed-users (users managed in Azure AD) or federated users (users managed by another identity provider such as ADFS). MSAL does not differentiate between these two types of users. As far as it’s concerned, it talks to Azure AD. The authority that you would pass in this case is the normal Azure AD Authority: `https://login.microsoftonline.com/{Enter_the_Tenant_Info_Here}`

MSAL also supports directly connection to ADFS 2019, which is Open ID Connect compliant and has support scopes and PKCE. This support requires that a service pack [KB 4490481](https://support.microsoft.com/en-us/help/4490481/windows-10-update-kb4490481) is applied to Windows Server. When connecting directly to AD FS, the authority you'll want to use to build your application will be of form `https://mysite.contoso.com/adfs/`

Currently, there are no plans to support a direct connection to ADFS 16 or ADFS v2. ADFS 16 does not support scopes, and ADFS v2 is not OIDC compliant.
