export const ENV_VARIABLES = {
    TENANT: "AZURE_TENANT_ID",
    CLIENT_ID: "AZURE_CLIENT_ID",
    CERTIFICATE_PATH: "AZURE_CLIENT_CERTIFICATE_PATH",
};

export const LAB_API_ENDPOINT = "https://msidlab.com/api";
export const LAB_SCOPE = "https://request.msidlab.com/.default";
export const LAB_KEY_VAULT_URL = "https://msidlabs.vault.azure.net";
export const LAB_CERT_NAME = "LabAuth";

export const MOBILE_BUILD_VAULT_URL = "https://mobilebuildvault.vault.azure.net";
export const MSAL_TEAM_KEY_VAULT_URL = "https://id4skeyvault.vault.azure.net";
export const UPN_JSON_SECRET_NAME = "JS-ID4SLab2-User-Identifiers";
export const KEY_VAULT_SCOPE = "https://vault.azure.net/.default";

/**
 * Key Vault secret names for app configuration (stored in MsalTeam KV).
 * Each secret contains a JSON object with an "app" property holding the AppConfig.
 */
export const AppConfigSecrets = {
    S2S: "App-S2S-Config",
    PCAClient: "App-PCAClient-Config",
    WebApi: "App-WebApi-Config",
    WebApp: "App-WebApp-Config",
} as const;

export const ParamKeys = {
    AZURE_ENVIRONMENT: "azureenvironment",
    USER_TYPE: "usertype",
    FEDERATION_PROVIDER: "federationprovider",
    B2C_PROVIDER: "b2cprovider",
    HOME_DOMAIN: "homedomain",
    APP_TYPE: "apptype",
    SIGN_IN_AUDIENCE: "signInAudience",
    PUBLIC_CLIENT: "publicClient",
    APP_PLATFORM: "appPlatform",
    GUEST_HOMED_IN: "guesthomedin",
};

// Lab API Query Param Values
export const AzureEnvironments = {
    B2C_CLOUD: "azureb2ccloud",
    CHINA_CLOUD: "azurechinacloud",
    CLOUD: "azurecloud",
    GERMANY_CLOUD: "azuregermanycloud",
    PPE: "azureppe",
    US_GOV: "azureusgovernment",
    US_GOV_JEDI_PROD: "usgovernmentjediprod",
    US_GOV_MIGRATED: "azureusgovernmentmigrated",
};

export const B2cProviders = {
    NONE: "none",
    AMAZON: "amazon",
    FACEBOOK: "facebook",
    GOOGLE: "google",
    LOCAL: "local",
    MICROSOFT: "microsoft",
    TWITTER: "twitter",
};

export const FederationProviders = {
    NONE: "none",
    ADFSV2: "adfsv2",
    ADFSV3: "adfsv3",
    ADFSV4: "adfsv4",
    ADFS2019: "adfsv2019",
    B2C: "b2c",
    PING: "ping",
    SHIBBOLETH: "shibboleth",
};

export const HomeDomains = {
    NONE: "none",
    LAB2: "msidlab2.com",
    LAB3: "msidlab3.com",
    LAB4: "msidlab4.com",
    LAB8: "msidlab8.com",
};

export const UserTypes = {
    CLOUD: "cloud",
    FEDERATED: "federated",
    ONPREM: "onprem",
    GUEST: "guest",
    MSA: "msa",
    B2C: "b2c",
};

export const AppTypes = {
    CLOUD: "cloud",
    ONPREM: "onprem",
};

export const AppPlatforms = {
    SPA: "spa",
    WEB: "web",
};

export const GuestHomedIn = {
    HOSTAZUREAD: "hostazuread",
    ONPREM: "onprem",
};

export const UsernameSelectors = {
    I0116: "#i0116, input[name='i0116']",
    USERNAME_ENTRY: "#usernameEntry, input[name='usernameEntry']",
    LOGON_IDENTIFIER: "#logonIdentifier, input[type='email']",
}

export const SubmitButtonSelectors = {
    IDSIBUTTON9: "#idSIButton9, input[name='idSIButton9']",
    IDBTNBACK: "#idBtn_Back, input[name='idBtn_Back']",
    NEXT: "#next, input[name='next']",
    ACCEPTBUTTON: "#acceptButton, input[name='acceptButton']",
    REMOTE_CONNECT_SUBMIT: "#remoteConnectSubmit, input[name='remoteConnectSubmit']",
    SUBMITBUTTON: "#submitButton, input[name='submitButton']",
    INPUT_SUBMIT: "input[type='submit']",
    SUBMIT: "button[type='submit']"
}

export const PasswordInputSelectors = {
    PASSWORD: "#password, input[name='password']",
    PASSWORD_INPUT: "#passwordInput, input[name='passwordInput']",
    I0118: "#i0118, input[name='i0118']",
    PASSWORDENTRY: "#passwordEntry, input[type='password']",
}

export const HtmlSelectors = {
    AAD_TITLE: "#aadTile, input[name='aadTile']",
    B2C_AAD_ID4SLAB2_SIGNIN_PAGE:
        "#ID4SLab2_AzureAD, input[name='ID4SLab2_AzureAD']",
    B2C_MSA_SIGNIN_PAGE:
        "#MicrosoftAccountExchange, input[name='MicrosoftAccountExchange']",
    KMSI_PAGE: "#kmsiTitle, input[name='kmsiTitle']",
    REMOTE_LOCATION_DESCRPITION:
        "#remoteConnectDescription, input[name='remoteConnectDescription']",
    DEVICE_OTC_INPUT_SELECTOR: "#otc, input[name='otc']",
};
