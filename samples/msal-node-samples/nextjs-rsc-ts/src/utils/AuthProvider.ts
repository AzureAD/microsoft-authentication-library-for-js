import {
  AuthorizationCodePayload,
  AuthorizationCodeRequest,
  AuthorizationUrlRequest,
  ConfidentialClientApplication,
  Configuration,
  CryptoProvider,
  DistributedCachePlugin,
  ICacheClient,
  IPartitionManager,
  ResponseMode,
} from "@azure/msal-node";
import { cache } from "react";

export type PartitionManagerFactory = () => Promise<IPartitionManager>;

type AuthCodeRequestState = {
  returnTo: string;
  request: Pick<
    AuthorizationCodeRequest,
    "correlationId" | "scopes" | "claims" | "azureCloudOptions"
  >;
};

/**
 * Light wrapper for msal-node's ConfidentialClientApplication.
 */
export class AuthProvider {
  configuration: Configuration;
  cacheClient: ICacheClient;
  partitionManagerFactory: PartitionManagerFactory;
  cryptoProvider: CryptoProvider;
  redirectUri: string;

  /**
   * Initialize the AuthProvider.
   * @param configuration The msal configuration object
   * @param redirectUri Uri that authentication requests will redirect back to
   * @param cacheClient The cache client used to store the token cache
   * @param partitionManagerFactory Factory that returns a PartitionManager for the current executing context
   */
  constructor(
    configuration: Configuration,
    redirectUri: string,
    cacheClient: ICacheClient,
    partitionManagerFactory: PartitionManagerFactory
  ) {
    this.configuration = configuration;
    this.redirectUri = redirectUri;
    this.cacheClient = cacheClient;
    this.partitionManagerFactory = cache(partitionManagerFactory);

    this.cryptoProvider = new CryptoProvider();
  }

  /**
   * Get url for an auth code request
   * @param request Authorization request to initialize the flow
   * @param returnTo Where the user should be redirected to after a successful flow
   * @returns The url to redirect the client to
   */
  async getAuthCodeUrl(
    request: Omit<AuthorizationUrlRequest, "redirectUri" | "responseMode">,
    returnTo: string
  ) {
    const instance = await this.getInstance();

    const state: AuthCodeRequestState = {
      request: {
        correlationId: request.correlationId,
        scopes: request.scopes,
        claims: request.claims,
        azureCloudOptions: request.azureCloudOptions,
      },
      returnTo,
    };

    const encodedState = this.cryptoProvider.base64Encode(
      JSON.stringify(state)
    );

    return await instance.getAuthCodeUrl({
      ...request,
      responseMode: ResponseMode.FORM_POST,
      redirectUri: this.redirectUri,
      state: encodedState,
    });
  }

  /**
   * Handles token acquisition based on the url that the user was sent to from Azure.
   * @param url The return url from Azure
   * @returns An object containing the logged in account, and where the user should be redirected to.
   */
  async handleAuthCodeCallback(formData: FormData) {
    const payload = this.getAuthorizationCodePayload(formData);

    const instance = await this.getInstance();

    const state: AuthCodeRequestState = JSON.parse(
      this.cryptoProvider.base64Decode(payload.state)
    );

    const authResult = await instance.acquireTokenByCode(
      {
        ...state.request,
        redirectUri: this.redirectUri,
        code: payload.code,
      },
      payload
    );

    return {
      account: authResult.account,
      returnTo: state.returnTo,
    };
  }

  /**
   * Authenticate a user.
   * @returns The logged in account along with an instance that is configured with a partitioned cache.
   * @remarks Can safely be called in multiple server components.
   */
  authenticate = cache(async () => {
    const partitionManager = await this.partitionManagerFactory();
    const homeAccountId = await partitionManager.getKey();

    const instance = await this.getInstance();

    const account = homeAccountId
      ? await instance.getTokenCache().getAccountByHomeId(homeAccountId)
      : null;

    return { account, instance };
  });

  /**
   * Get the current logged in account.
   * @returns An account object if a user is logged in, or null if no user is logged in.
   * @remarks Can safely be called in multiple server components.
   * @remarks Prefer authenticate() in Server Actions and Route Handlers
   */
  getAccount = cache(async () => {
    const partitionManager = await this.partitionManagerFactory();
    const homeAccountId = await partitionManager.getKey();

    if (!homeAccountId) {
      return null;
    }

    const instance = await this.getInstance();

    return await instance.getTokenCache().getAccountByHomeId(homeAccountId);
  });

  /**
   * Get an instance configured with a partitioned cache to the current logged in user.
   * @returns A ConfidentialClientApplication instance
   * @remarks Can safely be called in multiple server components.
   * @remarks Prefer authenticate() in Server Actions and Route Handlers
   */
  getInstance = cache(async () => {
    const cachePlugin = new DistributedCachePlugin(
      this.cacheClient,
      await this.partitionManagerFactory()
    );

    const config = {
      ...this.configuration,
      cache: {
        cachePlugin,
      },
    };

    /**
     * If the current msal configuration does not have cloudDiscoveryMetadata or authorityMetadata, we will
     * make a request to the relevant endpoints to retrieve the metadata. This allows MSAL to avoid making
     * metadata discovery calls, thereby improving performance of token acquisition process. For more, see:
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/performance.md
     */
    if (!config.auth.cloudDiscoveryMetadata || !config.auth.authorityMetadata) {
      const metadata = await this.getMetadata(
        config.auth.clientId,
        config.auth.authority ?? "https://login.microsoftonline.com/common"
      );

      if (metadata) {
        config.auth.cloudDiscoveryMetadata = metadata.cloudDiscoveryMetadata;
        config.auth.authorityMetadata = metadata.authorityMetadata;
      }
    }

    return new ConfidentialClientApplication(config);
  });

  // validate that the payload includes required fields
  private getAuthorizationCodePayload(formData: FormData) {
    // validate that we only get string entries
    const stringEntries = Array.from(formData.entries()).filter(
      ([, value]) => typeof value === "string"
    );

    const data = Object.fromEntries(stringEntries);

    if (!("state" in data)) {
      throw new Error("No state found in payload.");
    }

    if (!("code" in data)) {
      throw new Error("No code found in payload.");
    }

    return data as Omit<AuthorizationCodePayload, "state"> &
      Required<Pick<AuthorizationCodePayload, "state">>;
  }

  /**
   * Gets the cloud discovery metadata and authority metadata for the given authority
   * @param clientId Application Client ID
   * @param authority The authority configured for the application
   * @returns The cloud discovery metadata and authority metadata
   */
  private async getMetadata(clientId: string, authority: string) {
    const tenantId = authority!.split("/").pop()!;

    try {
      let [cloudDiscoveryMetadata, authorityMetadata] = await Promise.all([
        this.cacheClient.get(`${clientId}.${tenantId}.discovery-metadata`),
        this.cacheClient.get(`${clientId}.${tenantId}.authority-metadata`),
      ]);

      if (cloudDiscoveryMetadata && authorityMetadata) {
        return {
          cloudDiscoveryMetadata,
          authorityMetadata,
        };
      }

      [cloudDiscoveryMetadata, authorityMetadata] = await Promise.all([
        AuthProvider.fetchCloudDiscoveryMetadata(tenantId),
        AuthProvider.fetchOIDCMetadata(tenantId),
      ]);

      if (cloudDiscoveryMetadata && authorityMetadata) {
        await this.cacheClient.set(
          `${clientId}.${tenantId}.discovery-metadata`,
          cloudDiscoveryMetadata
        );
        await this.cacheClient.set(
          `${clientId}.${tenantId}.authority-metadata`,
          authorityMetadata
        );
      }

      return {
        cloudDiscoveryMetadata,
        authorityMetadata,
      };
    } catch (error) {
      console.log(error);

      return null;
    }
  }

  /**
   * Fetches the cloud discovery metadata for the given tenant ID
   * @param tenantId The tenant ID
   * @returns The cloud discovery metadata as a string
   */
  private static async fetchCloudDiscoveryMetadata(tenantId: string) {
    const endpoint = new URL(
      "https://login.microsoftonline.com/common/discovery/instance"
    );

    endpoint.searchParams.set("api-version", "1.1");
    endpoint.searchParams.set(
      "authorization_endpoint",
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`
    );

    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error("Could not fetch cloud discovery metadata from endpoint");
    }

    return await response.text();
  }

  /**
   * Fetches the OIDC metadata for the given tenant ID
   * @param tenantId The tenant ID
   * @returns The OIDC metadata as a string
   */
  private static async fetchOIDCMetadata(tenantId: string) {
    const endpoint = `https://login.microsoftonline.com/${tenantId}/v2.0/.well-known/openid-configuration`;

    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error("Could not fetch OIDC metadata from endpoint");
    }

    return await response.text();
  }
}
