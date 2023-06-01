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
  request: AuthorizationCodeRequest;
};

export class AuthProvider {
  configuration: Configuration;
  cacheClient: ICacheClient;
  partitionManagerFactory: PartitionManagerFactory;
  cryptoProvider: CryptoProvider;
  redirectUri: string;

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

  async getAuthCodeUrl(
    request: Omit<AuthorizationUrlRequest, "redirectUri">,
    returnTo: string
  ) {
    const instance = await this.getInstance();

    const requestWithRedirectUri = {
      ...request,
      redirectUri: this.redirectUri,
    };

    const state = this.cryptoProvider.base64Encode(
      JSON.stringify({
        request: requestWithRedirectUri,
        returnTo,
      })
    );

    return await instance.getAuthCodeUrl({
      ...requestWithRedirectUri,
      state: state,
    });
  }

  async handleAuthCodeCallback(url: URL) {
    const instance = await this.getInstance();

    const stateString = url.searchParams.get("state");

    if (!stateString) {
      throw new Error("No state found.");
    }

    const state: AuthCodeRequestState = JSON.parse(
      this.cryptoProvider.base64Decode(stateString)
    );

    const code = url.searchParams.get("code");

    if (!code) {
      throw new Error("No code found.");
    }

    const authResult = await instance.acquireTokenByCode({
      ...state.request,
      code,
    });

    return {
      account: authResult.account,
      returnTo: state.returnTo,
    };
  }

  authenticate = cache(async () => {
    const partitionManager = await this.partitionManagerFactory();
    const homeAccountId = await partitionManager.getKey();

    const instance = await this.getInstance();

    const account = homeAccountId
      ? await instance.getTokenCache().getAccountByHomeId(homeAccountId)
      : null;

    return { account, instance };
  });

  getAccount = cache(async () => {
    const partitionManager = await this.partitionManagerFactory();
    const homeAccountId = await partitionManager.getKey();

    if (!homeAccountId) {
      return null;
    }

    const instance = await this.getInstance();

    return await instance.getTokenCache().getAccountByHomeId(homeAccountId);
  });

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
