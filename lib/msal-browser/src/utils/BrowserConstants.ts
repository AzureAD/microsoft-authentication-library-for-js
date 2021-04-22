/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { OIDC_DEFAULT_SCOPES } from "@azure/msal-common";
import { PopupRequest } from "../request/PopupRequest";
import { RedirectRequest } from "../request/RedirectRequest";

/**
 * Constants
 */
export const BrowserConstants = {
    /**
     * Interaction in progress cache value
     */
    INTERACTION_IN_PROGRESS_VALUE: "interaction_in_progress",
    /**
     * Invalid grant error code
     */
    INVALID_GRANT_ERROR: "invalid_grant",
    /**
     * Default popup window width
     */
    POPUP_WIDTH: 483,
    /**
     * Default popup window height
     */
    POPUP_HEIGHT: 600,
    /**
     * Name of the popup window starts with
     */
    POPUP_NAME_PREFIX: "msal",
    /**
     * Default popup monitor poll interval in milliseconds
     */
    POLL_INTERVAL_MS: 50,
    /**
     * Msal-browser SKU
     */
    MSAL_SKU: "msal.js.browser",
};

export enum BrowserCacheLocation {
    LocalStorage = "localStorage",
    SessionStorage = "sessionStorage",
    MemoryStorage = "memoryStorage"
}

/**
 * HTTP Request types supported by MSAL.
 */
export enum HTTP_REQUEST_TYPE {
    GET = "GET",
    POST = "POST"
}

/**
 * Temporary cache keys for MSAL, deleted after any request.
 */
export enum TemporaryCacheKeys {
    AUTHORITY = "authority",
    ACQUIRE_TOKEN_ACCOUNT = "acquireToken.account",
    SESSION_STATE = "session.state",
    REQUEST_STATE = "request.state",
    NONCE_IDTOKEN = "nonce.id_token",
    ORIGIN_URI = "request.origin",
    RENEW_STATUS = "token.renew.status",
    URL_HASH = "urlHash",
    REQUEST_PARAMS = "request.params",
    SCOPES = "scopes",
    INTERACTION_STATUS_KEY = "interaction.status"
}

/**
 * API Codes for Telemetry purposes. 
 * Before adding a new code you must claim it in the MSAL Telemetry tracker as these number spaces are shared across all MSALs
 * 0-99 Silent Flow
 * 800-899 Auth Code Flow
 */
export enum ApiId {
    acquireTokenRedirect = 861,
    acquireTokenPopup = 862,
    ssoSilent = 863,
    acquireTokenSilent_authCode = 864,
    handleRedirectPromise = 865,
    acquireTokenSilent_silentFlow = 61,
    logout = 961,
    logoutPopup = 962
}

/*
 * Interaction type of the API - used for state and telemetry
 */
export enum InteractionType {
    Redirect = "redirect",
    Popup = "popup",
    Silent = "silent"
}

/**
 * Types of interaction currently in progress.
 * Used in events in wrapper libraries to invoke functions when certain interaction is in progress or all interactions are complete.
 */
export enum InteractionStatus {
    /**
     * Initial status before interaction occurs
     */
    Startup = "startup",
    /**
     * Status set when all login calls occuring
     */
    Login = "login",
    /**
     * Status set when logout call occuring
     */ 
    Logout = "logout",
    /**
     * Status set for acquireToken calls
     */
    AcquireToken = "acquireToken",
    /**
     * Status set for ssoSilent calls
     */
    SsoSilent = "ssoSilent",
    /**
     * Status set when handleRedirect in progress
     */
    HandleRedirect = "handleRedirect",
    /**
     * Status set when interaction is complete
     */
    None = "none"
}

export const DEFAULT_REQUEST: RedirectRequest|PopupRequest = {
    scopes: OIDC_DEFAULT_SCOPES
};

/**
 * JWK Key Format string (Type MUST be defined for window crypto APIs)
 */
export const KEY_FORMAT_JWK = "jwk";

// Supported wrapper SKUs
export enum WrapperSKU {
    React = "@azure/msal-react",
    Angular = "@azure/msal-angular"
}

// Supported Cryptographic Key Types
export enum CryptoKeyTypes {
    req_cnf = "req_cnf",
    stk_jwk = "stk_jwk"
}

// Crypto Key Usage sets
export const KEY_USAGES = {
    AT_BINDING: {
        KEYPAIR: ["sign", "verify"],
        PRIVATE_KEY: ["sign"]
    },
    RT_BINDING: {
        KEYPAIR: ["encrypt", "decrypt"],
        PRIVATE_KEY: ["decrypt"]
    }
};

// Cryptographic Constants
export const BROWSER_CRYPTO = {
    PKCS1_V15_KEYGEN_ALG: "RSASSA-PKCS1-v1_5",
    RSA_OAEP: "RSA-OAEP",
    AES_GCM: "AES-GCM",
    DIRECT: "dir",
    S256_HASH_ALG: "SHA-256",
    MODULUS_LENGTH: 2048
};

export const KEY_DERIVATION_LABELS = {
    DECRYPTION: "AzureAD-SecureConversation-BoundRT-AES-GCM-SHA256",
    SIGNING: "AzureAD-SecureConversation-BoundRT-HS256"
};

// The following are sizes in bits
export const KEY_DERIVATION_SIZES = {
    DERIVED_KEY_LENGTH: 256, // L
    PRF_OUTPUT_LENGTH: 256, // h
    COUNTER_LENGTH: 256 // r
};

export const RT_POP_TEST_VALUES = {
    STK_PRIV: {"alg":"RSA-OAEP-256","d":"D_LzLRNiU_uWue-5vMMnKJRDbvF1UtmnugP_JkJE1rMOgJ7vn9r-sDKBnR7iKCAg6Cy-fuNG-oqU4hY4oo_ZSN4XBfK2ryxEalOuuTntGOYjZczR__070UyKYJA_tjR-KRSrE6Ii8HruQ4lL9-R_TVWbr1rdewyB6miLJhglr0xYF8dDF7H7bL8-Ya24mLiKZ3zgw8eTDR3Hb5w1ukO1gjqCGwXxvNeLwXWVa4yLod8W3j3kCka3oVXTo7kOTf6DGL_h_tKIRrjNGuVXKgje4F5Z5k5VPOWkUGwQrX6HWt_Uvo7YozHF4c8F17H7Uxt1VM4QdmOFGbld9BxtpX-1qQ","dp":"a9JvyiXYyEWkBAJAT0MRMiLpHTaQi-2y05LAyTFF2vzHroisptUL9uzRNfyFnCa4eDmApGJISscho8msDfn6xRP9-TQNlbI6E_bi48POqlNJ30WmFAbe1r9ZN1dUv4uMcxXNeHaUUy3mpXxDULHl-T4M77MM7Ss5PDgP0x26skE","dq":"cih4fwOzdBJfxe5w_2CZtOlSzASIwVm08EKRBmLxBtnaoa3ldQtPLKMhW0SQICpBEoCop2GMAeY5LFwyP6uxteZnQREn10jPtqGm3zjH5kZIPL6qT3Dtr9WjKQh1127k68g5JoXKROpbJpUwaIRIu8x5HzxxKjo7_6VrG0n2Vrs","e":"AQAB","ext":true,"key_ops":["decrypt"],"kty":"RSA","n":"uzhn0D8RKoCbDgGLR4bCf4my1osht2m3_rQS_rw7p2gBRORckZE-L6aTuQqmlguxsjdr99PiAOWbnIxvvCi1-r54abnfh9DX_0VVMQwTBWvoJ0K1KIuRs3DsGrcmxFqfjPIdFb6MKBHqvtJx3OXH3hwzZmqCljco_TlXp77gv5V6rs9lwMvWyiHr_Q0A3D5AiIWOVaBrZkueFmrNaZDUQPjmNnoTnkOqcj-37ivNb-Qpimf9EUvmySEHciiA3dRYS9nwIu0ZwVjjNKz0aZdc56VIsUIOutlskNfpqAWimVXUpllr04EjxmlRqXEFd_wucbT0bcMynpS3d3Q0WUXK0w","p":"9Tj14KLsFU624cd3ISY9mCE4Jc6oCRTiTajnqFDe_VKb47d20878RLuzjUUvRMPFtj7DkgHRfjfUmeZFSq3G2Zw-F3i9a-KTB_f1bxLI1PKtAtavEHYlgTEuZevsTZzj_FMEP7dWFVdc_eTJY9S0nvOwPNZSce3c0IkiElCTZwU","q":"w3LaWey3Nz8LVnecGOpz4cPSXzBWZDZR25NEFLR8HBS97b753DnIlcRs8imbaGsQzEgrH3C-mM2TLlXLXdlCrkUXkhwbov3EKvHFmFngmfdjvbsELjh3J2SY0cByELzWX5NRLJETZHlemrdpRQ44RW1Dhi_EOr24JWhGCesa4fc","qi":"Cmp8ZlwOmH2QJeN9MlpPJ5dkqWAOxkRVJw1e8LEqlvIvn9KeZr_ZQ3Og-8mzYkHm5Vnu67ZsuQRwVDtsILYL3fQE6Mngk9-XF_e1J_fmSIDZSB4-CAUr7NPuQM5-IycjnHk_LDrdzQojNIIsrf76LGI7GNfTl8a1f9Me7aqVmN0"},
    STK_PUB: {"alg":"RSA-OAEP-256","e":"AQAB","ext":true,"key_ops":["encrypt"],"kty":"RSA","n":"uzhn0D8RKoCbDgGLR4bCf4my1osht2m3_rQS_rw7p2gBRORckZE-L6aTuQqmlguxsjdr99PiAOWbnIxvvCi1-r54abnfh9DX_0VVMQwTBWvoJ0K1KIuRs3DsGrcmxFqfjPIdFb6MKBHqvtJx3OXH3hwzZmqCljco_TlXp77gv5V6rs9lwMvWyiHr_Q0A3D5AiIWOVaBrZkueFmrNaZDUQPjmNnoTnkOqcj-37ivNb-Qpimf9EUvmySEHciiA3dRYS9nwIu0ZwVjjNKz0aZdc56VIsUIOutlskNfpqAWimVXUpllr04EjxmlRqXEFd_wucbT0bcMynpS3d3Q0WUXK0w"},
    RESPONSE: {"session_key_jwe":"eyJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAtMjU2In0.iuoRV4TBxk7WCHPjid2SG0nf499uZcYZwQKRzocKf2aDhCJ02Czkai2EbhcNGI64h3CnM0pE5sQ_4QryWzxok3zU3ebGNx-ZcNpDDTCBHvWTUOOTq7Rr6Apu4KszM-Tzv5omyLNpr6bISyz4TZzzoyFyCkPJ62IFf7K1pkgE1bNxX2yvCqkdNpQykv4zUBCYbs3HNL24OkjQ8lUg0NsTnIYW5Q7gxfLTe0vL8TRXnehUEiG_6Eo94_jxesqeolMSg3w-n_CpFLA4_ehX6uHONCe38kAx_BRuLiuEBTEV-SoGRqON06sEAwzCaAPSC3Z4am6WLxzeXElfwjrTJTQVnw.WM0tv2pmmKLuj7_D.Xg.jqlbuHmaEeW3moU3RnkTIw","response_jwe":"eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIiwiY3R4IjoiN3ZGRk5vRFh3S2dyRjEveGJMVk9EVmMvVjF0Y0ZXSmoiLCJraWQiOiJzZXNzaW9uIn0..Y7ESZ3nak9jCrEBM.JHryHnZ2DLigH1XR3VF69gduhu38BaTTGECBYO8i7nlVJ_gpgum-L0J7tR_OUP-59GdWarnANB0-lynJSwMQUqUsSzxIiIQGStddkhzvQN3WkmPPJKbfzf_TNXxbBGNXnrzc-Y8VjFfjgRH_RQ1DKEsa8IiNKJfxOywefS-ttBNHWYcnQpr2dEd66m7Ng1VcLS1yQBBUWaqpKdhs-8sizuIhPnuMcAc9tldU-qnqJ8KS3FIgwqCwoBw2kgUWKUW2vDAU8cpckXa5B8GGy6ZfNJhrO61Oxu8IHmppMEpm1sN3PJv1LnLJwzYdGZ07FsR2ERSL40bgO9vJs2-ExqenOL_vjNh0VWNMjzylF8AtbjHtwOv7UKrueT0UtBTVqNpdYLU_ebbZ3T9jBIPeSdHq_8RGqiP5Ka38WLgDxw9DSI_Vw2FpmSULhGWAM6SSoIyWFa6esIr3KJlQPl16Je7odtI57rxmaM_AnkGa-O6F56CxysbwTvQzxwNCIdZu5PZ84dMtOWnwYLJHdb-MumHDpxu46WntmL9_qsP23OsDIq2T8h8up_Bx3Jk1-T3AzSq-nJ2xA8wV2DSb7qmC3XdzQKTfTp5UGiTMY69znbS3qcTG-o-NgvxgIOWLEHRHJ4wSIkCNJH2A_D7b7cemfBmRa49wOaZLSv-vtGyiwe53wJW8D9UHGYevp3v9iCqDbndvu3IUS1dB3aE3cA4w4IB-o8UQ5WXtFhCKl0csWl08U1lonXLGeAsS7vwK124z0hr6Bn02VeUZj4x1VxfdOkYzVaC5RUF2yZjKD5k3V6jFojUlWyKnsHehsjgGoqJu7g6eQcPZuo7v66bIw4C61dLkO4hhj78Jjmm_SAHy4xd_hUx2BjKvbtlrq-NisYFnwmdkn19_fqNbxKgBAGebrlzk8kAo-e2JkLlH7Zq-GiNrGiz7SQYvyf9OqN2DFzUX7YMXvFNxR6oDjmkCq8xNqsAoL9Bsy9Fv2LMyf4knZo_gD-Eh-qflGMb0BgH1cm_pi_poCUKzSRbrsFDgYrJ0Bjt7eH7BLqcQaiyc1awZgIxIyD1SJ4eVQLQ7OR8xgWbapVeusgMCI9lEYNiR5Q5tQBOqrUrRv6baQ3-K3Bagy3fDq79WAxs0qp54fJ5Hd-6AoZk8J3bZFv5pzM_9EOGAdMrIiGFaje0s0betqEqdVSHC6cYB8RB_J3N0E582eM8Z-mnuBXJfzjXVDZRxPbYB3hRyz8bkszxsGM1lnnxP8gN8gT9vBbqQAFtP4rrltkTqrFXjHnZnyvQec_sxfHv0TWmMxejdyqjNKmVZv2akTM44MgG8z6HVHbQR-WAIjcwqtTRmVel68iaB8NJ5veDk5EbqFdXosc1e7uULPNWYcBzkaPvzeqNF9BMKX33JiFs-YJrYpC4xHtk5zrSS4DHimGrsZ0zvoHiLidtBSl3mjgMpDj8BKPHzoj9UMVy9iKQKzOsZGM2O8nQyFP0Czy9uWCb79ujVjfuwU9Z6M-9MUMw0sdXn5MxXfWhYqIZd3aQudsonUA2iWe2-KdmOQ1vQ2auGq1zopcNNgms-wU6Y1XGnrXQuOdPoWkeLhS-9fLjU_tqx_ZY2xTm7lq998obfFWSLyvZHNBiwBDJi0nW9e5Z29M3seMiOOfsusre4AKvnzlJNS-ygh_ISMLtmGZyOESPx9g7Wz3iypNozesYHVV1ugcL92XGbiGqX5YnWuhyBcn83P2mUSSV7DjXU3FAT2bpkosXxvM2SfoBquYBLr2CFR970a7P9O7OM0e8_P3q-RwumueW2dPZd6nYPh14oBro3i66QynZXmnObO3k8rAUnAOif1ny5MTbdWGtloiuK0AlXuD4wh4cJOnK3JYEHi1vopthRTRidHRWBLHeOmCP9cIpIJE5tfQtk_LMBIlJe59tBlaNq6FazwURcRO3HttfUOVoUVV9IVKD43mIg5gzIixtdpIq0yYbBWDy1cBV0o_agD8GsFF8EPfBJxwwRTFX-PrNQCpZztz0U1xl-kiqaRbjQPdGxn-0c2Y5vbA8fxmzMf2ckKytDKmuEvNY6QNDuQJwqVOKqNiTF3g5JGUHRYQ0qWEFENAfg3ovTqQ-7ZPnJCkQh32eoj8exkddRHVKvAZgQBdSu0CWs-vXyU_Z_GohcERsrGamp0jc7A09vBNrKyvwy-xTi9jH8tCpSsks9WBULM2Bgw1_GP8tICKo1bHZEDDQvFQT7-Gn7fq6DUEC1A1MRpo3GsnVTP4t0TQ_E37HO1F-OTPlUIEIK4Y11SUSCZF-jQ_5EaZ1BTwlCBa8MAzS_VGJL3QqnawD3mqxgdTkE39PHhR7BX65Vfl7ArcFbD5LH0Tawgu1B8eVF0izDvZf80tEyGuozhHFR2a5HnFg7y9WXDC67pXOVrGOBMy4gNGgsoCni6M2bxDUH8t7nf8UXKNw8ia8BvLP4Y261E-kkbCu--xp7PMKchzbIQyvTuauJ3b6BcZe9qWG1jZackOeo0SVVniodwdKH0P2IIxSJ-K0ytXFQzQl-zBccI1XKZvzBrSJR4JseqCizpz04MLvhaIHrwNAweOE2sH4D1cLyAKlaLubXU1By0r4N4jD0T1wY3rzgFtTt7bPiSHDzb-TxKHnhubCIIEJ0mu4MPfhzgoKR71bvpC_xkRQQi-XyqVHQfruusstjcZsUR1gXvX7d2TrLx9O--KuhvAdO0-6DY8CS_Gs2V7UOzddXdwkvEStGaoZqHDpw5o3rLSYy-R2TpQLpJMulvrLAwouEaLnhM_H9nv_WwtKqim0VhP8r9BuJAaTFNvpFm9DbH7jCfDl48dlSRB3v6IsXNW1OaIVJuHCUQbuWtwAQTq2_lrKJXU5n3XDn3cNJnwDAcLCeyoKi_A9WH6BmJWFhDVTBcfPxTBN4AutKQei6ZaVSm436N40-z32-sWawlPWKjzRmvOy-9OMl9ZLNaACZtzbkI5kqREUZxBfp9laDmnVtGNdmDbE7zHgjgzr3ygJVfKPGSpC1gOOu-krKiUb1sOPyihs8lEpI1TtimoT4hbmDzUtIcAHk4Izz1USjzLirtFbu5-Vmxr-WfWu3UyrywRiCtIWaYOMakmT3Q5k42Dq1oSk8oZ6UnwdubwrpKC-5Jt24ec1cTMH-vNeZ-4Sj1mc1e88No4RLwSsf4AVvLYoSH8G1AiY5THWgpjnzR4CxYeqTPteRZnr4gLpStjtRQoz2Z06dKn43nY0VB-7O9_6eFDsX4ahJcHgxLYTMt_9sL9mgjyejFLMdB0qCTYER1XNT8Bk2IhO1dneW8HVc43-Z42wnz6Nlz8R-owN-SjFzX5-pMjX_9_o3x9h_T2KgEZZjV2ergsU3tos6gbRknVsPgS7SCnHyu6ZOFFulw7_7C5patl_2KVboE9D3nK84B4bb-xwnYLSD1s9b6wb3HcPM9_CyhodIeOdYpu8nTMAwOIjtST1T8RIw2AHEAFlmy4idaOwXwPNnsZDes0hLl96DeVg7FqlpiGJB_MN264M3oskGcfPdzoYWXM-2Cj04nTh3uU-Epn-VM5fL2DNvskR1hOXOKR4US8SmbG8J3SSQm0LsoRq5F17RvdyugEkxyCoR1CENueZU3DmAFMHwQAcDqHwdhEAIqCPPBnJ7lZj50_iDf4xQ2aU9kFSgpN48YTiu9HSoWDxM3BF6roDiv8ktDE9hk3Mpyh6zlOtQPDNEruCPytATWT94sAMlq3Y5xhQ8J3nV1qDoD6uASQbnCynKazHnGqmqRyExYkvQrqhnVk-UkWyVdLYSl5mgI3f9MxFmiaIhOXlrI5wHZUYcg8TDbUfvhuVV5MrYRW-iZZupoznfTRY7mZyLYFgj22kfgCLTgkoRfo37ntLl5hkY1Kb-ovJUibjtiORfAlhSNP0H4hkk9Meljk1k7w69dpix67OWWi4t4p572Wz6pRZ3Q7Pd3DdtSSwyNORNzIaSMVpi8q6sEG0Wv4UdoWp5gJ6D_SXplzx3kTzGKRrRWc0ATfgDloQICCoGns6CPCe9UwuTUtthkHL7UBJVMBvMGKCtKu2uN2B7YycEMMmDbnoIPYxhP4Bh6MIjLxEOMfnFgI3sdM37oIK03mdbxTGsg-vzGpMeNmqAyDjIi-asqkMg_pLr8zJ4TAX-B_0OxGRom7fg0buZswQOuju8FfbGPTLLZZ3ad9DRfVhlSM8zbaZQQA1sHaUmabX0uGrbrcr5sv6xMxsy9yURublL2XYrkRG7yoJpp3xLYGCH7lOby_8adbFX7lm7YBkqqFRHMMBShhpnFhlh7Xmol4I8ImIw7CPizPq0XjRPXWc54mHvt-Fqd-1y4gksTg-SoBabeeHlM23-aMSVYwP3VrDyJuyeNCgtSkCzgpbPVgagZJkPesWJLHSs97kwRlbe8-nEuVomHw0ImMDnULKmzi2HgQSrd5pl2NhvdcgjbfAw54YDuuc_YSSn78D6WCJudYAv9Kl4sUZdQ7vdYN1Jh7zHoXppfbigNoyWRxOB0k11Ht2-x7pUnxu8xlLYH4Cf5-YVEryM7uU63yTFVUMCt7MyzH8arEpzrZN8Pv2oA8zl4kxqNXwR2WvjPNTWu8nfeaHuTF3dAL6iKaCWL52nNg9u9WDgvdzV_bluXiuyNE8ixmkBIEdJJ6lapqOQPskGKc5u7kvJU7DY6fWUugV0hq9C_PZ_0ornWCJNmMBLslvAUoGE7O2ygoWSW7x7_e6bgJXnCVBzoQCQjDhzKjhT0ZEjyQhR27fThUNi_uZZHf04vqgqST5O769yvSWtLw0Bfngi0s3Sd3mn_VjU28RGRG6cBBdUim9LLK_uyCPG4NssNDIhEYssHypVxoIb_JS-vBh0RZs4AwjeFZwsHGa9hiL4iQ6Jxul_BVRTBU3S5KJKYRGU2fhNaYpHx0i72xFYjh-TLZP_jkg0NUj5_DsdTCzx_wTIL4d933nrXuiHSP1B3m8olADPfASJFYkRUSj2qGRLKiCuDHegqTj61MdaZsAEC0tpZgEkGq0L44PmIh4g8mSUi5KTDxi7j2craNerm2Wo6eHGqja5qAG894vhexgAuGSdWMLUGxMIXyL2iqFPNYjQQMVPq53wr_qk3coiam7m7rxAbd2Geq3mI_o3c74VagBtvKjxSMaeYGau6OEZ0FqfkRR3z1wHigdHXIJT8XeCk9MwGdEws3t1q1vpHfEnL33yNTZry70tWR76wIwC6fn6bQjmiye_6oTUQG-dP1WU3L9FJn7BUTzqwkQk5dvM0wmF8a6cw3lOZUuClLYxpmV6oCmwCg289yTH5QKtPi0kqVTzFoRpQdUAGcddZHqyWiHUCKgVd8BAF-qExl6ncU5kACqG4vLmLPwLuzzX-16AqxS23sBvMwFQ4I0PXdsFKe3yUL6e0hOKZyA3LJw_4YX98K4Ko8M5o1UxAIbd3a2vVk-XscexSfGq_mjtR4PH9uMFHYhqj7gLppvef0eDz2yLhquAC70hQvUyUhzEJUfB2CIC8EKCVdIOUtkfxXYHO8r_Dfc8C393tS4zFEzx8aEV0R2iwk8Y7FfjnR1_6fb63sUPG6MPwq9Rl8IzY2v3P6h2plPMcwAr6SGFlIDcqwHVNIaVLsgL_-P7ZRajFGE6UA5U934cJBZe8GrDT2PvjfGk5zySxCZw5UuFf75FWShHGj8re-W2JZIhJyqq0pLyVgPHxb1Gr5_xqd2DCCdyt-owNgXCFAvit1Acu7BngirtfXE3sUdgLD780CJba4I8aiW2pdrDLL2HMfGJuIoSQN-QPpIBQtZwFNnDJYbjTJI31O67TjmJP6aHP9gg56Ep1JSmTylhsBOOczHR7IIEFkdvRulUzj2umDT_9Tk8mcygKMWQ7kYYu54sK-TehvxrFLU4Ixed2c7wraq1kcwou15jS1aYQDy6O1cXEGV7H6vUmn0WRq2q1kfKQue1Sex5K_xbQp_WZdF2cjQf0jR61RZ4ANAAeJx0qD4Y_ECycympeNGPf6-Y9a-o0s83WAs9aDT4nEvEqlEYdeCWngOmCxSK7FiKqP34vkhxCioeejFSfeT7X8vjjw17yX6Sat0NFdp59ZRvwR0pgl-dxb3GMcxm0jCocvW1i0x7xOyr6wjjFAowjkkSDfp_9Nzj0cbrbd-JlFxK08R5ASfnA941yilaEqGVFrF4nyFCDZa-gWbPkvwPvwTMiY7Vy7Jx0rm3K5e7UEBon7TlTcSzLQoLBxw0st-JVsQUWaHZK92uYjPvwSM4aC2sdhXM94x6YgSXihsG98Q16CnBtJx7RHaM0ZgWKevxqu27i6FHHq58cT7cU4Suutg7LRkVrHb3M1NkN25iCxMm6ohV_hFbj3HTKb4y2ZgmUQ5iQC8dwiySJTVAEn22BfKJ3m_PkennHZsU-Uq9KmqbxJsUpVFAH47wUI5MaVBtesHxEwDBurBT4CANuibmeKrKEi6eunRUl3DiTWcktwqBODwi8kt7JCelFCc9spAWRFJE_saRy3i3AlEBMY352oezJPvJu2RE_hLr2VYm1yhPOsSc6KNUkO7kqDB9NJrTS7NnonF5rEOP8qwIx31ESsws-6zkKvfceKzbKdfSZPr2X5v8aWPx558NnRRAHvDgBv_qo9-eBcoFMnnm03BE6WC24ioK9pROAnEkywORmlyGd8n7hnitjaCWeT7jNa-_eZl2mS1A5zLlW3j0fiO4YCLEGONjYoyVIMEnaGHKkeo_mefqi8e7xBxdSA6E4D3UfppAEmal4nDj_6MFXfTmgw__tB_119p7rQcm2QAzTv-ocdClsWpTON2YReylTNhngqN3Ex3yO5cbxVN7rRFhdOhKxJvDAmKFOGqHFf97DzYTCMhNVcmt8mD_ERSWtVvl_9mV42Eiq1XoJ3f29UiR6S-P1n5AA1XAi-1M0GOuk1jXVJokFtz2SWb1q35UvXXxtCg_H1kcnBth66ntpjeiSw96_Sy9Dxpr3G-Qov5qgyGJjc8Yu4dRti_usvJxaZECv0YXWKN57vV1mWHHxVP_YOgip95SLS5ZjbhGNNIO2aaWiIf4gD_-PfncpzKfxsiQApgrOqwyx0s1yvnqO2DN2Iq2SbO2EMNNgcBMYwPk3QAGl7y4DGVq9qyQSVLGPdpMYAkxiIS6WVNpV4MlBU_fMypBVdbwDZcK5R4hh5D6fkQQtveTHe0-c9zcrC6uOp5l7vJOohKA7SXnQJruul3BTm-tUEO8SuIxCzlxjtuSz6Y8fhvJFfd-BAIFyd2cX0sJ_XvV3YPbg2RTKDFjO3M1yekHhq4QKGx0UwNPNo-pJWcXj4h120QT-J2mISzu1lMDQaBnisSZMRF_YyHbhMus6Cfu7HdOcF1pO0yZZ6vb-x9HcnYdtHIhhIGgwNIVRp5nadcww9LsYB4rehWu8fW0HBFUqrnhDv5mDP_kYS8nW-s9dnvZRSeFkunBRgY2IHnLFTc-A6s5QZwkFk-Iao82cfBExnSeFW4ExHvg_TEb1vYSJ52KE9o8C9wd-b6HhUQW0pPkixyHtGsKNc53kn-W25bE56g24TU2ND7WkmK9pNZAKNu61xj_HUz_T--eDoMFDsgUqMT7MOEtpvBc37LhbYnJM8XWOGGx5II7fUv3Bh0PJDvcONsvdvvpFNoHy-XNHdbYwoY6cOQgX5itIT9V9v8UwBw198n_zGp-og1iAInmQijHZ5c0qpgQkIkHr9aUG31sH4V_qgueUaYycPoVul-JhqUmZB5cqDnFpqnjA3KMaP2kirKYmMcBAfCayIbIDr2mH0AiTW6yxtRUdDOtbKIHSeQQndD6c3kAb4HkpLRD5BR9SuLUJvY6GDDxmq4KGMunmp9EdMPsTFo9HKuN_rQ_oa3toF8rP4Syt3dPz72r3xmhXgilRMwRKJ5A84SXhfugpSJ3EubYpfClM9thBcIiPH4KmuSLWKzuofVx56C_uPq1KfomgztZmj-lti7n2m6XDZCVBPah1uPM18wXc9J8oWE7Ga0x7S9vQ4HbAcK0DmeR1xRNoqPlnBZPHbX07CQItvzFVdtVigYvd-uYJgdxgsfIqbZ7N4mLVSsRQcdHKPV_xStaIbwgB-Q9bz9Urvo4OTWJb_WEwfYgM4wEVPoPpdXRN4jAjQK3S6Qg8jkdJwA0DUGkerMUAWEy16Q46aPWTErxfJrNv41hNxV8dofntMmyav967BMIGwi43RzQOzDoeUYfZ6JnMH1J98ElD2ocpTBZ9y2pUbNHxJIMf226PUoWOY83EnETqFIKe-CnmaH68-WS7_yEa1Nc2-DnmhAKbAjwl7sk54hbulHJB8Ybq1gDayTctWxcXJ-6oGedr56V7lHKt6kJgrP-yxoLHsRGJqgd82Ajy4KSf5i6t6rNHcJe2nacGrGSfzX0VfPehjqb7lAVfP4lFKbqQ1Si-2Et6j0NLmMus4ceQ3EfRPMkaWko-0RzYpUmDtK0N9NhdANPlYAm6lVWKvThz1NpmiWQtN-AlJ5DHXhtY8mfMeRrmbdQGE1Mr7xX4UHuq3Q0Vf-PQvV6roIgZMZoSTo-6ULeF4S_V96Tr-ft8g-2-SHcY57Aw1xfaisZrlfcO0C0y1OgbPLrStl-PvshxgwuCQiufACv6Cjiqvcmt3S_OlWouxB8fpc41jOle57uyvXJnpeU0lEIix8ApJxGOOAF2PT9gvG3xc2tLh1AHeI-5oyj2Rt5z3mZCv0NdQSDItfVpquHV-qRs1UcrdnGK-UaiAcQwK_NXuWNqdYoBdhnKHeBGPEDasv7M-KzVtw5ZIOvi3h6qaY17y5-fuSPa9jTKw2UjimpnMUlksw750ZCbTf0bQO8dxOLienSeJONzhJWJvbe_4VLYRJQ_HVRn5zVB4TDe89GOfMe7vD0MdYY6CblzVDlfxLR5UCj6fJ5SHZggTbZti9s_gY49S22rEm5zoNZbktbhu-jMmi_qrV1R4IBjZSqi-hYxTOct7jYl-hCUim2pycd_Qqm9c0SAb-rYoyscPX7BZsGwi6l39eQuBPqWePkN4-Pm-F2GWFN__tz5JKI6HeWLEeQUrWhEz4vsjC6Pt_CIKyTwqGeuiC6gKFsDlDtwFqrIX6H5_A_Nyi1nFME_6UbktsKmN51AdfbEprYQBQ6ml2hgJv-kU9TQM3qxtUzkWbq-NCLSJoOSTbYf54ouS1uQ4C31rH42muZR73wG5-zWMLpul5YZnhg3x8XTDleP8VHPy96TgFmA74GXDmIP9yOg1eX3cmUeBYbi627r2ZeqPSC1mw1EfcMyr3Qj0TQmOJOI2xPQyrlGKgL08HWxnWZft10KPT2zUjefDFEpCSQ76l5qhRYrjUMQma2XlLtpJkQjPCtGee2Y4ZGzYnHvIg.hPTiVCanfWgN8f9U1A68Pg"}
};
