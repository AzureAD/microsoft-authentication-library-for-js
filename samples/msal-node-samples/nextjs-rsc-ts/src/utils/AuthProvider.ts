import {
  AuthorizationCodeRequest,
  AuthorizationUrlRequest,
  ConfidentialClientApplication,
  Configuration,
  CryptoProvider,
  DistributedCachePlugin,
  ICacheClient,
  IPartitionManager,
} from "@azure/msal-node";
import { cache } from "react";

export type PartitionManagerFactory = () => Promise<IPartitionManager>;

type AuthCodeRequestState = {
  returnTo: string;
  request: Pick<AuthorizationCodeRequest, 'correlationId' | 'scopes' | 'claims' | 'azureCloudOptions'>;
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
    request: Omit<AuthorizationUrlRequest, "redirectUri">,
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
      redirectUri: this.redirectUri,
      state: encodedState,
    });
  }

  /**
   * Handles token acquisition based on the url that the user was sent to from Azure.
   * @param url The return url from Azure
   * @returns An object containing the logged in account, and where the user should be redirected to.
   */
  async handleAuthCodeCallback(url: URL) {
    const instance = await this.getInstance();

    const encodedState = url.searchParams.get("state");

    if (!encodedState) {
      throw new Error("No state found.");
    }

    const state: AuthCodeRequestState = JSON.parse(
      this.cryptoProvider.base64Decode(encodedState)
    );

    const code = url.searchParams.get("code");

    if (!code) {
      throw new Error("No code found.");
    }

    const authResult = await instance.acquireTokenByCode({
      ...state.request,
      redirectUri: this.redirectUri,
      code,
    });

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

    return new ConfidentialClientApplication(config);
  });
}
