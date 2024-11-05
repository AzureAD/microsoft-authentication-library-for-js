export const ENV_VARIABLES = {
    TENANT: "AZURE_TENANT_ID",
    CLIENT_ID: "AZURE_CLIENT_ID",
    CERTIFICATE_PATH: "AZURE_CLIENT_CERTIFICATE_PATH",
};

export const LAB_API_ENDPOINT = "https://msidlab.com/api";
export const LAB_SCOPE = "https://request.msidlab.com/.default";
export const LAB_KEY_VAULT_URL = "https://msidlabs.vault.azure.net";
export const LAB_CERT_NAME = "LabAuth";

export const B2C_MSA_TEST_UPN = "b2cmsatest@outlook.com";

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

export const HtmlSelectors = {
    BUTTON9SELECTOR: "#idSIButton9, input[name='idSIButton9']",
    USERNAME_INPUT: "#i0116, input[name='i0116']",
    AAD_TITLE: "#aadTile, input[name='aadTile']",
    B2C_LOCAL_ACCOUNT_USERNAME:
        "#logonIdentifier, input[name='logonIdentifier']",
    B2C_LOCAL_ACCOUNT_PASSWORD: "#password, input[name='password']",
    NEXT_BUTTON: "#next, input[name='next']",
    B2C_AAD_MSIDLAB4_SIGNIN_PAGE:
        "#MSIDLAB4_AzureAD, input[name='MSIDLAB4_AzureAD']",
    B2C_MSA_SIGNIN_PAGE:
        "#MicrosoftAccountExchange, input[name='MicrosoftAccountExchange']",
    FORGOT_PASSWORD_LINK:
        "#idA_PWD_ForgotPassword, input[name='idA_PWD_ForgotPassword']",
    PASSWORD_INPUT_TEXTBOX: "#i0118, input[name='i0118']",
    KMSI_PAGE: "#kmsiTitle, input[name='kmsiTitle']",
    STAY_SIGNEDIN_BUTTON: "#acceptButton, input[name='acceptButton']",
    REMOTE_LOCATION_DESCRPITION:
        "#remoteConnectDescription, input[name='remoteConnectDescription']",
    REMOTE_LOCATION_SUBMIT_BUTTON:
        "#remoteConnectSubmit, input[name='remoteConnectSubmit']",
    PASSWORD_INPUT_SELECTOR: "#passwordInput, input[name='passwordInput']",
    CREDENTIALS_SUBMIT_BUTTON: "#submitButton, input[name='submitButton']",
    DEVICE_OTC_INPUT_SELECTOR: "#otc, input[name='otc']",
};
