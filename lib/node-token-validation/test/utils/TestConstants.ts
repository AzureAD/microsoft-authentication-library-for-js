/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError, ICrypto, PkceCodes } from "@azure/msal-common";

export const TEST_CONSTANTS = {
    CLIENT_ID: "b41a6fbb-c728-4e03-aa59-d25b0fd383b6",
    DEFAULT_AUTHORITY: "https://login.microsoftonline.com/common/",
    AUTHORITY: "https://login.microsoftonline.com/TenantId",
    DEFAULT_JWKS_URI_AAD: "https://login.microsoftonline.com/common/discovery/v2.0/keys",
    DEFAULT_JWKS_URI_OIDC: "https://login.microsoftonline.com/common/discovery/keys",
    JWKS_URI_AAD: "https://login.microsoftonline.com/TenantId/discovery/v2.0/keys",
    JWKS_URI_OIDC: "https://login.microsoftonline.com/TenantId/discovery/keys",
    DEFAULT_CLOCK_SKEW: 0,
    DEFAULT_ALGORITHM: "RS256",
    DEFAULT_TYPE: "JWT",
    WELL_KNOWN_ENDPOINT: "https://login.microsoftonline.com/common/.well-known/openid-configuration",
    WELL_KNOWN_ENDPOINT_AAD: "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration",
    NONCE: "123523",
    ISSUER_SIGNING_KEYS: [
        {
          kty: 'RSA',
          e: 'AQAB',
          n: '12oBZRhCiZFJLcPg59LkZZ9mdhSMTKAQZYq32k_ti5SBB6jerkh-WzOMAO664r_qyLkqHUSp3u5SbXtseZEpN3XPWGKSxjsy-1JyEFTdLSYe6f9gfrmxkUF_7DTpq0gn6rntP05g2-wFW50YO7mosfdslfrTJYWHFhJALabAeYirYD7-9kqq9ebfFMF4sRRELbv9oi36As6Q9B3Qb5_C1rAzqfao_PCsf9EPsTZsVVVkA5qoIAr47lo1ipfiBPxUCCNSdvkmDTYgvvRm6ZoMjFbvOtgyts55fXKdMWv7I9HMD5HwE9uW839PWA514qhbcIsXEYSFMPMV6fnlsiZvQQ',
          alg: 'PS256'
        },
        {
          crv: 'P-256',
          kty: 'EC',
          x: 'ySK38C1jBdLwDsNWKzzBHqKYEE5Cgv-qjWvorUXk9fw',
          y: '_LeQBw07cf5t57Iavn4j-BqJsAD1dpoz8gokd3sBsOo',
          alg: 'ES256'
        }
      ]
};

export const TEST_HASH_CONSTANTS = {
    CODE: "OAAABAAAA0TWEUN3YUUq5vuCvmnaQiV2K0FwRHqI7u-VXhnGiX0U5u__oid-BUXdlqsWGfHTWV9cIBzYj_S5OoR06m_-b4CbNA-QMMNTCt6VUiynMIRHJvrJMgzuVzkrwnsyfbtMvvpnUoHLH1_qbdkM3dGQj0YgiN_-CcIIzzqtw5KtGmusuZQK8OYQG-KcDqxw1q56mEan2wWrS2U70gWkB0pylkJrOS09BgSmYKZrPCwO7VAco_e9RP8M1fMVP1k5bXCkBwVTCuWm23IXt1CxxJmtQGGEKxH5lETAFqRpFq_P57QDtzjhAPOy6uwM6IXbk2ZU4s3O81M_CTtm3dUlFsYKaPntCgSELZvL0X-6uv5DNXmymJY5hoxcPWlMOOofU7X6fe3U1fBlUsa4ifgaZQsaqQeQO3LR8rYRu3wBKRpGStIvsanGfF9Sdan66EwOmlsdkDhWNgxzM3v0fAvPEg6nyiD7jyfqXBuJCvlGxXdewj82M9xK32xxqB965b9ubR_Ncjki7T4vF0LiO4r85P9yuWktNc_tbnQ0kqFenzozAVQX4t33i-pCk94Me4FUrirRwLvkfwsn0Zmc_aEPa98YHes3cSvA2JZG71SqciA33dV0sTaFOjecjZgk_3_hFO2iTooI27tEBnnkhZNxDIsGpgE4dM0q1wldP-s4UT9QkRmd_LJke7WLyXsdMC9K4x2P6b8P7cngVEzc6yXwbhsq_p3tY5YFDDUecUclgTgeYy1MgAA",
    INVALID_CODE: "PAAABAAAA0TWEUN3YUUq5vuCvmnaQiV2K0FwRHqI7u-VXhnGiX0U5u__oid-BUXdlqsWGfHTWV9cIBzYj_S5OoR06m_-b4CbNA-QMMNTCt6VUiynMIRHJvrJMgzuVzkrwnsyfbtMvvpnUoHLH1_qbdkM3dGQj0YgiN_-CcIIzzqtw5KtGmusuZQK8OYQG-KcDqxw1q56mEan2wWrS2U70gWkB0pylkJrOS09BgSmYKZrPCwO7VAco_e9RP8M1fMVP1k5bXCkBwVTCuWm23IXt1CxxJmtQGGEKxH5lETAFqRpFq_P57QDtzjhAPOy6uwM6IXbk2ZU4s3O81M_CTtm3dUlFsYKaPntCgSELZvL0X-6uv5DNXmymJY5hoxcPWlMOOofU7X6fe3U1fBlUsa4ifgaZQsaqQeQO3LR8rYRu3wBKRpGStIvsanGfF9Sdan66EwOmlsdkDhWNgxzM3v0fAvPEg6nyiD7jyfqXBuJCvlGxXdewj82M9xK32xxqB965b9ubR_Ncjki7T4vF0LiO4r85P9yuWktNc_tbnQ0kqFenzozAVQX4t33i-pCk94Me4FUrirRwLvkfwsn0Zmc_aEPa98YHes3cSvA2JZG71SqciA33dV0sTaFOjecjZgk_3_hFO2iTooI27tEBnnkhZNxDIsGpgE4dM0q1wldP-s4UT9QkRmd_LJke7WLyXsdMC9K4x2P6b8P7cngVEzc6yXwbhsq_p3tY5YFDDUecUclgTgeYy1MgAA",
    C_HASH: "4_VbjhfR5g6MSxOYZcvQdw",
    ACCESS_TOKEN_FOR_AT_HASH: "ThisIsAnAccessT0ken",
    INVALID_ACCESS_TOKEN_FOR_AT_HASH: "ThisIsNotAnAccessToken",
    AT_HASH: "C3UQODVYE3EWwqgApo3SYA"
};

export const DEFAULT_CRYPTO_IMPLEMENTATION: ICrypto = {
  createNewGuid: (): string => {
      const notImplErr = "Crypto interface - createNewGuid() has not been implemented";
      throw AuthError.createUnexpectedError(notImplErr);
  },
  base64Decode: (): string => {
      const notImplErr = "Crypto interface - base64Decode() has not been implemented";
      throw AuthError.createUnexpectedError(notImplErr);
  },
  base64Encode: (): string => {
      const notImplErr = "Crypto interface - base64Encode() has not been implemented";
      throw AuthError.createUnexpectedError(notImplErr);
  },
  async generatePkceCodes(): Promise<PkceCodes> {
      const notImplErr = "Crypto interface - generatePkceCodes() has not been implemented";
      throw AuthError.createUnexpectedError(notImplErr);
  },
  async getPublicKeyThumbprint(): Promise<string> {
      const notImplErr = "Crypto interface - getPublicKeyThumbprint() has not been implemented";
      throw AuthError.createUnexpectedError(notImplErr);
  },
  async removeTokenBindingKey(): Promise<boolean> {
      const notImplErr = "Crypto interface - removeTokenBindingKey() has not been implemented";
      throw AuthError.createUnexpectedError(notImplErr);
  },
  async clearKeystore(): Promise<boolean> {
      const notImplErr = "Crypto interface - clearKeystore() has not been implemented";
      throw AuthError.createUnexpectedError(notImplErr);
  },
  async signJwt(): Promise<string> {
      const notImplErr = "Crypto interface - signJwt() has not been implemented";
      throw AuthError.createUnexpectedError(notImplErr);
  },
  async hashString(): Promise<string> {
      const notImplErr = "Crypto interface - hashString() has not been implemented";
      throw AuthError.createUnexpectedError(notImplErr);
  }
};

export const DEFAULT_OPENID_CONFIG_RESPONSE = {
  body: {
      "token_endpoint": "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
      "token_endpoint_auth_methods_supported": [
          "client_secret_post",
          "private_key_jwt",
          "client_secret_basic"
      ],
      "jwks_uri": "https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys",
      "response_modes_supported": [
          "query",
          "fragment",
          "form_post"
      ],
      "subject_types_supported": ["pairwise"],
      "id_token_signing_alg_values_supported": ["RS256"],
      "response_types_supported": ["code", "id_token", "code id_token", "id_token token"],
      "scopes_supported": ["openid", "profile", "email", "offline_access"],
      "issuer": "https://login.microsoftonline.com/{tenant}/v2.0",
      "request_uri_parameter_supported": false,
      "userinfo_endpoint": "https://graph.microsoft.com/oidc/userinfo",
      "authorization_endpoint": "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize",
      "http_logout_supported": true,
      "frontchannel_logout_supported": true,
      "end_session_endpoint": "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/logout",
      "claims_supported": ["sub", "iss", "cloud_instance_name", "cloud_instance_host_name", "cloud_graph_host_name", "msgraph_host", "aud", "exp", "iat", "auth_time", "acr", "nonce", "preferred_username", "name", "tid", "ver", "at_hash", "c_hash", "email"],
      "tenant_region_scope": null,
      "cloud_instance_name": "microsoftonline.com",
      "cloud_graph_host_name": "graph.windows.net",
      "msgraph_host": "graph.microsoft.com",
      "rbac_url": "https://pas.windows.net"
  }
};
