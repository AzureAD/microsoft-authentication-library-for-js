/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthenticationResult,
    PasswordGrantConstants,
} from "@azure/msal-common";
import {
    AuthenticationScheme,
    Constants,
    ONE_DAY_IN_MS,
} from "@azure/msal-common";
import {
    DEFAULT_AUTHORITY_FOR_MANAGED_IDENTITY,
    DEFAULT_MANAGED_IDENTITY_ID,
} from "../../src/utils/Constants";

// This file contains the string constants used by the test classes.

// Test Tokens
export const TEST_TOKENS = {
    /*
     * idTokens referenced from MSFT docs: https://docs.microsoft.com/en-us/azure/active-directory/develop/id-tokens
     * accessTokens referenced from MSFT docs: https://docs.microsoft.com/en-us/azure/active-directory/develop/access-tokens
     */
    IDTOKEN_V1:
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IjdfWnVmMXR2a3dMeFlhSFMzcTZsVWpVWUlHdyIsImtpZCI6IjdfWnVmMXR2a3dMeFlhSFMzcTZsVWpVWUlHdyJ9.eyJhdWQiOiJiMTRhNzUwNS05NmU5LTQ5MjctOTFlOC0wNjAxZDBmYzljYWEiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9mYTE1ZDY5Mi1lOWM3LTQ0NjAtYTc0My0yOWYyOTU2ZmQ0MjkvIiwiaWF0IjoxNTM2Mjc1MTI0LCJuYmYiOjE1MzYyNzUxMjQsImV4cCI6MTUzNjI3OTAyNCwiYWlvIjoiQVhRQWkvOElBQUFBcXhzdUIrUjREMnJGUXFPRVRPNFlkWGJMRDlrWjh4ZlhhZGVBTTBRMk5rTlQ1aXpmZzN1d2JXU1hodVNTajZVVDVoeTJENldxQXBCNWpLQTZaZ1o5ay9TVTI3dVY5Y2V0WGZMT3RwTnR0Z2s1RGNCdGsrTExzdHovSmcrZ1lSbXY5YlVVNFhscGhUYzZDODZKbWoxRkN3PT0iLCJhbXIiOlsicnNhIl0sImVtYWlsIjoiYWJlbGlAbWljcm9zb2Z0LmNvbSIsImZhbWlseV9uYW1lIjoiTGluY29sbiIsImdpdmVuX25hbWUiOiJBYmUiLCJpZHAiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC83MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDcvIiwiaXBhZGRyIjoiMTMxLjEwNy4yMjIuMjIiLCJuYW1lIjoiYWJlbGkiLCJub25jZSI6IjEyMzUyMyIsIm9pZCI6IjA1ODMzYjZiLWFhMWQtNDJkNC05ZWMwLTFiMmJiOTE5NDQzOCIsInJoIjoiSSIsInN1YiI6IjVfSjlyU3NzOC1qdnRfSWN1NnVlUk5MOHhYYjhMRjRGc2dfS29vQzJSSlEiLCJ0aWQiOiJmYTE1ZDY5Mi1lOWM3LTQ0NjAtYTc0My0yOWYyOTU2ZmQ0MjkiLCJ1bmlxdWVfbmFtZSI6IkFiZUxpQG1pY3Jvc29mdC5jb20iLCJ1dGkiOiJMeGVfNDZHcVRrT3BHU2ZUbG40RUFBIiwidmVyIjoiMS4wIn0=.UJQrCA6qn2bXq57qzGX_-D3HcPHqBMOKDPx4su1yKRLNErVD8xkxJLNLVRdASHqEcpyDctbdHccu6DPpkq5f0ibcaQFhejQNcABidJCTz0Bb2AbdUCTqAzdt9pdgQvMBnVH1xk3SCM6d4BbT4BkLLj10ZLasX7vRknaSjE_C5DI7Fg4WrZPwOhII1dB0HEZ_qpNaYXEiy-o94UJ94zCr07GgrqMsfYQqFR7kn-mn68AjvLcgwSfZvyR_yIK75S_K37vC3QryQ7cNoafDe9upql_6pB2ybMVlgWPs_DmbJ8g0om-sPlwyn74Cc1tW3ze-Xptw_2uVdPgWyqfuWAfq6Q",
    IDTOKEN_V2:
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjFMVE16YWtpaGlSbGFfOHoyQkVKVlhlV01xbyJ9.eyJ2ZXIiOiIyLjAiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vOTE4ODA0MGQtNmM2Ny00YzViLWIxMTItMzZhMzA0YjY2ZGFkL3YyLjAiLCJzdWIiOiJBQUFBQUFBQUFBQUFBQUFBQUFBQUFJa3pxRlZyU2FTYUZIeTc4MmJidGFRIiwiYXVkIjoiNmNiMDQwMTgtYTNmNS00NmE3LWI5OTUtOTQwYzc4ZjVhZWYzIiwiZXhwIjoxNTM2MzYxNDExLCJpYXQiOjE1MzYyNzQ3MTEsIm5iZiI6MTUzNjI3NDcxMSwibmFtZSI6IkFiZSBMaW5jb2xuIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiQWJlTGlAbWljcm9zb2Z0LmNvbSIsIm9pZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC02NmYzLTMzMzJlY2E3ZWE4MSIsInRpZCI6IjMzMzgwNDBkLTZjNjctNGM1Yi1iMTEyLTM2YTMwNGI2NmRhZCIsIm5vbmNlIjoiMTIzNTIzIiwiYWlvIjoiRGYyVVZYTDFpeCFsTUNXTVNPSkJjRmF0emNHZnZGR2hqS3Y4cTVnMHg3MzJkUjVNQjVCaXN2R1FPN1lXQnlqZDhpUURMcSFlR2JJRGFreXA1bW5PcmNkcUhlWVNubHRlcFFtUnA2QUlaOGpZIn0=.1AFWW-Ck5nROwSlltm7GzZvDwUkqvhSQpm55TQsmVo9Y59cLhRXpvB8n-55HCr9Z6G_31_UbeUkoz612I2j_Sm9FFShSDDjoaLQr54CreGIJvjtmS3EkK9a7SJBbcpL1MpUtlfygow39tFjY7EVNW9plWUvRrTgVk7lYLprvfzw-CIqw3gHC-T7IK_m_xkr08INERBtaecwhTeN4chPC4W3jdmw_lIxzC48YoQ0dB1L9-ImX98Egypfrlbm0IBL5spFzL6JDZIRRJOu8vecJvj1mq-IUhGt0MacxX8jdxYLP-KUu2d9MbNKpCKJuZ7p8gwTL5B7NlUdh_dmSviPWrw",
    IDTOKEN_V2_NEWCLAIM:
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjFMVE16YWtpaGlSbGFfOHoyQkVKVlhlV01xbyJ9.ewogICJ2ZXIiOiAiMi4wIiwKICAiaXNzIjogImh0dHBzOi8vbG9naW4ubWljcm9zb2Z0b25saW5lLmNvbS85MTg4MDQwZC02YzY3LTRjNWItYjExMi0zNmEzMDRiNjZkYWQvdjIuMCIsCiAgInN1YiI6ICJBQUFBQUFBQUFBQUFBQUFBQUFBQUFJa3pxRlZyU2FTYUZIeTc4MmJidGFRIiwKICAiYXVkIjogIjZjYjA0MDE4LWEzZjUtNDZhNy1iOTk1LTk0MGM3OGY1YWVmMyIsCiAgImV4cCI6IDE1MzYzNjE0MTEsCiAgImlhdCI6IDE1MzYyNzQ3MTEsCiAgIm5iZiI6IDE1MzYyNzQ3MTEsCiAgIm5hbWUiOiAiQWJlIExpbmNvbG4iLAogICJwcmVmZXJyZWRfdXNlcm5hbWUiOiAiQWJlTGlAbWljcm9zb2Z0LmNvbSIsCiAgIm9pZCI6ICIwMDAwMDAwMC0wMDAwLTAwMDAtNjZmMy0zMzMyZWNhN2VhODEiLAogICJlbWFpbCI6ICJBYmVMaUBtaWNyb3NvZnQuY29tIiwKICAidGlkIjogIjMzMzgwNDBkLTZjNjctNGM1Yi1iMTEyLTM2YTMwNGI2NmRhZCIsCiAgIm5vbmNlIjogIjEyMzUyMyIsCiAgImFpbyI6ICJEZjJVVlhMMWl4IWxNQ1dNU09KQmNGYXR6Y0dmdkZHaGpLdjhxNWcweDczMmRSNU1CNUJpc3ZHUU83WVdCeWpkOGlRRExxIWVHYklEYWt5cDVtbk9yY2RxSGVZU25sdGVwUW1ScDZBSVo4alkiCn0=.1AFWW-Ck5nROwSlltm7GzZvDwUkqvhSQpm55TQsmVo9Y59cLhRXpvB8n-55HCr9Z6G_31_UbeUkoz612I2j_Sm9FFShSDDjoaLQr54CreGIJvjtmS3EkK9a7SJBbcpL1MpUtlfygow39tFjY7EVNW9plWUvRrTgVk7lYLprvfzw-CIqw3gHC-T7IK_m_xkr08INERBtaecwhTeN4chPC4W3jdmw_lIxzC48YoQ0dB1L9-ImX98Egypfrlbm0IBL5spFzL6JDZIRRJOu8vecJvj1mq-IUhGt0MacxX8jdxYLP-KUu2d9MbNKpCKJuZ7p8gwTL5B7NlUdh_dmSviPWrw",
    LOGIN_AT_STRING:
        "O35pBcPgsXxS0K54JcJ2bO2lPQzy59r98BM3TLUNV5lJfzLYv5ZL2c8i3IODbS9qx93DzmpKlOgdQLrFDctgSbutgFXUKLdNIeR1ZvzCSEbwtV4zOe0EJU0CkVaWo1Vg8iKrdJdGtEqOtOB3Pbqe2zMg0cuMXW4B6xtbDy5gYO78McdjKWiljdltJqPTZkb1ESbGOGM2",
    ACCESS_TOKEN: "thisIs.an.accessT0ken",
    POP_TOKEN:
        "eyJ0eXAiOiJKV1QiLCJub25jZSI6InFMZmZKT255c2dnVnhhdGxSbVhvR0dnYkx3NDV5LTdsWkswaHJWSm9zeDQiLCJhbGciOiJSUzI1NiIsIng1dCI6InZhcF9pdmtIdHRMRmNubm9CWEF3SjVIWDBLNCIsImtpZCI6InZhcF9pdmtIdHRMRmNubm9CWEF3SjVIWDBLNCJ9.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTAwMDAtYzAwMC0wMDAwMDAwMDAwMDAiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLXBwZS5uZXQvMTllZWEyZjgtZTE3YS00NzBmLTk1NGQtZDg5N2M0N2YzMTFjLyIsImlhdCI6MTYxODAwNzU2MCwibmJmIjoxNjE4MDA3NTYwLCJleHAiOjE2MTgwMTE0NjAsImFjY3QiOjAsImFjciI6IjEiLCJhY3JzIjpbInVybjp1c2VyOnJlZ2lzdGVyc2VjdXJpdHlpbmZvIiwidXJuOm1pY3Jvc29mdDpyZXExIiwidXJuOm1pY3Jvc29mdDpyZXEyIiwidXJuOm1pY3Jvc29mdDpyZXEzIiwiYzEiLCJjMiIsImMzIiwiYzQiLCJjNSIsImM2IiwiYzciLCJjOCIsImM5IiwiYzEwIiwiYzExIiwiYzEyIiwiYzEzIiwiYzE0IiwiYzE1IiwiYzE2IiwiYzE3IiwiYzE4IiwiYzE5IiwiYzIwIiwiYzIxIiwiYzIyIiwiYzIzIiwiYzI0IiwiYzI1Il0sImFpbyI6IkUyTmdZRGo3Y0dVWEczT1p4OXhXSjVNRWg5MXU2NVFTZnAzVXYycVpLSHByaHRtVkY2d0EiLCJhbXIiOlsicHdkIl0sImFwcF9kaXNwbGF5bmFtZSI6IlBLLU1TQUxUZXN0Mi4wIiwiYXBwaWQiOiIzZmJhNTU2ZS01ZDRhLTQ4ZTMtOGUxYS1mZDU3YzEyY2I4MmUiLCJhcHBpZGFjciI6IjAiLCJjbmYiOnsia2lkIjoiVjZOX0hNUGFnTnBZU193eE0xNFg3M3EzZVd6YlRyOVozMVJ5SGtJY04wWSIsInhtc19rc2wiOiJzdyJ9LCJmYW1pbHlfbmFtZSI6IkJhc2ljIFVzZXIiLCJnaXZlbl9uYW1lIjoiQ2xvdWQgSURMQUIiLCJpZHR5cCI6InVzZXIiLCJpcGFkZHIiOiIyNC4xNy4yNDYuMjA5IiwibmFtZSI6IkNsb3VkIElETEFCIEJhc2ljIFVzZXIiLCJvaWQiOiJiZTA2NGMzNy0yNjE3LTQ2OGMtYjYyNy0yNWI0ZTQ4MTdhZGYiLCJwbGF0ZiI6IjMiLCJwdWlkIjoiMTAwMzQwMDAwMDU0NzdCQSIsInJoIjoiMC5BQUFBLUtMdUdYcmhEMGVWVGRpWHhIOHhIRzVWdWo5S1hlTklqaHI5VjhFc3VDNEJBTmsuIiwic2NwIjoiRmlsZXMuUmVhZCBNYWlsLlJlYWQgb3BlbmlkIHByb2ZpbGUgVXNlci5SZWFkIGVtYWlsIiwic2lnbmluX3N0YXRlIjpbImttc2kiXSwic3ViIjoidExjaFl1bUczSXZZT1VrQlprU0EzbWhnOEVfYnNGZDhuU2licUlOX0UxVSIsInRpZCI6IjE5ZWVhMmY4LWUxN2EtNDcwZi05NTRkLWQ4OTdjNDdmMzExYyIsInVuaXF1ZV9uYW1lIjoiSURMQUJAbXNpZGxhYjAuY2NzY3RwLm5ldCIsInVwbiI6IklETEFCQG1zaWRsYWIwLmNjc2N0cC5uZXQiLCJ1dGkiOiJ5a2tPd3dyTkFVT1k5SUVXejRITEFBIiwidmVyIjoiMS4wIiwid2lkcyI6WyJiNzlmYmY0ZC0zZWY5LTQ2ODktODE0My03NmIxOTRlODU1MDkiXSwieG1zX3N0Ijp7InN1YiI6Imx2QnRkdmVkdDRkT1pyeGZvQjdjbV9UTkU3THFucG5lcGFHc3EtUmZkS2MifSwieG1zX3RjZHQiOjE1NDQ1NzQzNjN9.VPBqUrMDc-H1T4paZoSbGaec0lBoJqSiu13chxJmgee1lDxUFr2pM52tqzPPH6N_Yk-VQ0_AKTyvfnbAQw4mryhp3SJytZbU7FedrXX7oq2laLh9s0K_Hz1EZSj5xg3SSUxXmKEjdePN6d0_5MLlt1P-LcL2PAGgkEEBhUfDm6pAxyTMO8Mw1DUYbq7kr_IzyQ71V-kuoYHDjazghSIwOkidoWMCPP-HIENVbFEKUDKFGDiOzU76IagUBAYUQ4JD1bC9hHA-OO6AV8xLK7UoPyx9UH7fLbiImzhARBxMkmAQu9v2kwn5Hl9hoBEBhlu48YOYOr4O3GxwKisff87R9Q",
    POP_TOKEN_PAYLOAD:
        "eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTAwMDAtYzAwMC0wMDAwMDAwMDAwMDAiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLXBwZS5uZXQvMTllZWEyZjgtZTE3YS00NzBmLTk1NGQtZDg5N2M0N2YzMTFjLyIsImlhdCI6MTYxODAwNzU2MCwibmJmIjoxNjE4MDA3NTYwLCJleHAiOjE2MTgwMTE0NjAsImFjY3QiOjAsImFjciI6IjEiLCJhY3JzIjpbInVybjp1c2VyOnJlZ2lzdGVyc2VjdXJpdHlpbmZvIiwidXJuOm1pY3Jvc29mdDpyZXExIiwidXJuOm1pY3Jvc29mdDpyZXEyIiwidXJuOm1pY3Jvc29mdDpyZXEzIiwiYzEiLCJjMiIsImMzIiwiYzQiLCJjNSIsImM2IiwiYzciLCJjOCIsImM5IiwiYzEwIiwiYzExIiwiYzEyIiwiYzEzIiwiYzE0IiwiYzE1IiwiYzE2IiwiYzE3IiwiYzE4IiwiYzE5IiwiYzIwIiwiYzIxIiwiYzIyIiwiYzIzIiwiYzI0IiwiYzI1Il0sImFpbyI6IkUyTmdZRGo3Y0dVWEczT1p4OXhXSjVNRWg5MXU2NVFTZnAzVXYycVpLSHByaHRtVkY2d0EiLCJhbXIiOlsicHdkIl0sImFwcF9kaXNwbGF5bmFtZSI6IlBLLU1TQUxUZXN0Mi4wIiwiYXBwaWQiOiIzZmJhNTU2ZS01ZDRhLTQ4ZTMtOGUxYS1mZDU3YzEyY2I4MmUiLCJhcHBpZGFjciI6IjAiLCJjbmYiOnsia2lkIjoiVjZOX0hNUGFnTnBZU193eE0xNFg3M3EzZVd6YlRyOVozMVJ5SGtJY04wWSIsInhtc19rc2wiOiJzdyJ9LCJmYW1pbHlfbmFtZSI6IkJhc2ljIFVzZXIiLCJnaXZlbl9uYW1lIjoiQ2xvdWQgSURMQUIiLCJpZHR5cCI6InVzZXIiLCJpcGFkZHIiOiIyNC4xNy4yNDYuMjA5IiwibmFtZSI6IkNsb3VkIElETEFCIEJhc2ljIFVzZXIiLCJvaWQiOiJiZTA2NGMzNy0yNjE3LTQ2OGMtYjYyNy0yNWI0ZTQ4MTdhZGYiLCJwbGF0ZiI6IjMiLCJwdWlkIjoiMTAwMzQwMDAwMDU0NzdCQSIsInJoIjoiMC5BQUFBLUtMdUdYcmhEMGVWVGRpWHhIOHhIRzVWdWo5S1hlTklqaHI5VjhFc3VDNEJBTmsuIiwic2NwIjoiRmlsZXMuUmVhZCBNYWlsLlJlYWQgb3BlbmlkIHByb2ZpbGUgVXNlci5SZWFkIGVtYWlsIiwic2lnbmluX3N0YXRlIjpbImttc2kiXSwic3ViIjoidExjaFl1bUczSXZZT1VrQlprU0EzbWhnOEVfYnNGZDhuU2licUlOX0UxVSIsInRpZCI6IjE5ZWVhMmY4LWUxN2EtNDcwZi05NTRkLWQ4OTdjNDdmMzExYyIsInVuaXF1ZV9uYW1lIjoiSURMQUJAbXNpZGxhYjAuY2NzY3RwLm5ldCIsInVwbiI6IklETEFCQG1zaWRsYWIwLmNjc2N0cC5uZXQiLCJ1dGkiOiJ5a2tPd3dyTkFVT1k5SUVXejRITEFBIiwidmVyIjoiMS4wIiwid2lkcyI6WyJiNzlmYmY0ZC0zZWY5LTQ2ODktODE0My03NmIxOTRlODU1MDkiXSwieG1zX3N0Ijp7InN1YiI6Imx2QnRkdmVkdDRkT1pyeGZvQjdjbV9UTkU3THFucG5lcGFHc3EtUmZkS2MifSwieG1zX3RjZHQiOjE1NDQ1NzQzNjN9",
    DECODED_POP_TOKEN_PAYLOAD: `{
        "cnf": {
            "kid": "V6N_HMPagNpYS_wxM14X73q3eWzbTr9Z31RyHkIcN0Y",
            "xms_ksl": "sw"
        }
      }`,
    SSH_CERTIFICATE:
        "AAAAHHNzaC1yc2EtY2VydC12MDFAb3BlbnNzaC5jb20AAAAgrk+wGrNoM6ZcU8/aVc+O9nMQArnTpgQcN2nDOojq3LwAAAADAQABAAABAQCiPcGP8PriIUKC1EAiepduIitPFswHDoPpAUJqbzgKNLdTdy86OoGFpY9yKo9kVgCTdPj/v8cO76/+I1vlHk1p7Q9DeFe333LefRnBUT8tDiFC4wtYJDxhpCcuOsEIlHVhYPp33ZQZePomb9rzTCatzFnrP9b62FRpx0Y3pjk/lstOr50Bh/3ZlDFPH36chXwEDSOcW3QX+0y4FT6x5zxna9KrwpCOWVaBdqsHpoqruDhGwkCAaoL6RXCyQTZatcqJNWCcD6a8GFHAkTZMxh2LR0xPZ4JkIDofKbauP/s9FPlAJN+VhY+HthrduVzgRP3ELxqSCE8xmNV8R/AVv1OxAAAAAAAAAAAAAAABAAAASTE4ZmRhY2MyLThkMWEtNDMzOC04NWM4LTAwMjY1ZmI2NWVmNkA3MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDcAAAAZAAAAFWhlbW9yYWxAbWljcm9zb2Z0LmNvbQAAAABhcFyFAAAAAGFwa8EAAAAAAAABTAAAACBkaXNwbGF5bmFtZUBzc2hzZXJ2aWNlLmF6dXJlLm5ldAAAABIAAAAOSGVjdG9yIE1vcmFsZXMAAAAYb2lkQHNzaHNlcnZpY2UuYXp1cmUubmV0AAAAKAAAACQxOGZkYWNjMi04ZDFhLTQzMzgtODVjOC0wMDI2NWZiNjVlZjYAAAAVcGVybWl0LVgxMS1mb3J3YXJkaW5nAAAAAAAAABdwZXJtaXQtYWdlbnQtZm9yd2FyZGluZwAAAAAAAAAWcGVybWl0LXBvcnQtZm9yd2FyZGluZwAAAAAAAAAKcGVybWl0LXB0eQAAAAAAAAAOcGVybWl0LXVzZXItcmMAAAAAAAAAGHRpZEBzc2hzZXJ2aWNlLmF6dXJlLm5ldAAAACgAAAAkNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3AAAAAAAAARcAAAAHc3NoLXJzYQAAAAMBAAEAAAEBALH7FzF1rjvnZ4i2iBC2tz8qs/WP61n3/wFawgJxUnTx2vP/z5pG7f8qvumd7taOII0aSlp648SIfMw59WdUUtup5CnDYOcX1sUdivAj20m2PIDK6f+KWZ+7YKxJqCzJMH4GGlQvuDIhRKNT9oHfZgnYCCAmjXmJBtWyD052qqrkzOSn0/e9TKbjlTnTNcrIno3XDQ7xG+79vOD2GZMNopsKogWNxUdLFRu44ClKLRb4Xe00eVrANtBkv+mSJFFJS1Gxv611hpdGI2S0v1H+KvB26O7vuzGhZ/AevRemGhXQ5V5vwNEqXnVRVkBRszLKeN/+rxM436xQyVQGJMG+sVEAAAEUAAAADHJzYS1zaGEyLTI1NgAAAQBlbiFgkvtKprsj96PD2uIJ7ZypzE/t/iba7/eDvXXc3ixI8fBns2bSuNx7LF3i2vlAUgz6UHe4xW0voc+jmZKEI8jXj91C84npo7J4kCxAkfO4GmdwGhQMjNRoN+pZliPNtj5jQLsuVxgXoJARAEP8nSp372i2bn7iFzolXWPiWkF1MVFV9BLwL3uPDeqTZqurYcpXJnSX30owMyC9qf913MGvWujN2AKNyoX1OIm19EKUSVLMM7S65A5nuuOMrkaajumdEgCgiVQSgHjqD5gDix+EZy7w6L6b8nKqT2mu481dM2yMqejAWxgife4oPI07sGXf1kIOn8kTuZAHkiSH",
    REFRESH_TOKEN: "thisIsARefreshT0ken",
    AUTHORIZATION_CODE:
        "0.ASgAqPq4kJXMDkamGO53C-4XWVm3ypmrKgtCkdhePY1PBjsoAJg.AQABAAIAAAAm-06blBE1TpVMil8KPQ41DOje1jDj1oK3KxTXGKg89VjLYJi71gx_npOoxVfC7X49MqOX7IltTJOilUId-IAHndHXlfWzoSGq3GUmwAOLMisftceBRtq3YBsvHX7giiuSZXJgpgu03uf3V2h5Z3GJNpnSXT1f7iVFuRvGh1-jqjWxKs2un8AS5rhti1ym1zxkeicKT43va5jQeHVUlTQo69llnwQJ3iKmKLDVq_Q25Au4EQjYaeEx6TP5IZSqPPm7x0bynmjE8cqR5r4ySP4wH8fjnxlLySrUEZObk2VgREB1AdH6-xKIa04EnJEj9dUgTwiFvQumkuHHetFOgH7ep_9diFOdAOQLUK8C9N4Prlj0JiOcgn6l0xYd5Q9691Ylw8UfifLwq_B7f30mMLN64_XgoBY9K9CR1L4EC1kPPwIhVv3m6xmbhXZ3efx-A-bbV2SYcO4D4ZlnQztHzie_GUlredtsdEMAOE3-jaMJs7i2yYMuIEEtRcHIjV_WscVooCDdKmVncHOObWhNUSdULAejBr3pFs0v3QO_xZ269eLu5Z0qHzCZ_EPg2aL-ERz-rpgdclQ_H_KnEtMsC4F1RgAnDjVmSRKJZZdnNLfKSX_Wd40t_nuo4kjN2cSt8QzzeL533zIZ4CxthOsC4HH2RcUZDIgHdLDLT2ukg-Osc6J9URpZP-IUpdjXg_uwbkHEjrXDMBMo2pmCqaWbMJKo5Lr7CrystifnDITXzZmmOah8HV83Xyb6EP8Gno6JRuaG80j8BKDWyb1Yof4rnLI1kZ59n_t2d0LnRBXz50PdWCWX6vtkg-kAV-bGJQr45XDSKBSv0Q_fVsdLMk24NacUZcF5ujUtqv__Bv-wATzCHWlbUDGHC8nHEi84PcYAjSsgAA",
    SAMPLE_JWT_HEADER: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
    SAMPLE_JWT_PAYLOAD:
        "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ",
    SAMPLE_JWT_SIG: "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    SAMPLE_MALFORMED_JWT:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ",
    CACHE_IDTOKEN:
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6Imk2bEdrM0ZaenhSY1ViMkMzbkVRN3N5SEpsWSIsImtpZCI6Imk2bEdrM0ZaenhSY1ViMkMzbkVRN3N5SEpsWSJ9.eyJvaWQiOiAib2JqZWN0MTIzNCIsICJwcmVmZXJyZWRfdXNlcm5hbWUiOiAiSm9obiBEb2UiLCAic3ViIjogInN1YiJ9.D3H6pMUtQnoJAGq6AHd",
};

export const ID_TOKEN_CLAIMS = {
    ver: "2.0",
    iss: "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
    sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
    aud: "6cb04018-a3f5-46a7-b995-940c78f5aef3",
    exp: 1536361411,
    iat: 1536274711,
    nbf: 1536274711,
    name: "Abe Lincoln",
    preferred_username: "AbeLi@microsoft.com",
    oid: "00000000-0000-0000-66f3-3332eca7ea81",
    tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
    nonce: "123523",
    aio: "Df2UVXL1ix!lMCWMSOJBcFatzcGfvFGhjKv8q5g0x732dR5MB5BisvGQO7YWByjd8iQDLq!eGbIDakyp5mnOrcdqHeYSnltepQmRp6AIZ8jY",
    auth_time: Date.now() - ONE_DAY_IN_MS * 2,
};

// Test Expiration Vals
export const TEST_TOKEN_LIFETIMES = {
    DEFAULT_EXPIRES_IN: 3599,
    TEST_ID_TOKEN_EXP: 1536361411,
    TEST_ACCESS_TOKEN_EXP: 1537234948,
};

// Test CLIENT_INFO
export const TEST_DATA_CLIENT_INFO = {
    TEST_UID: "123-test-uid",
    TEST_UTID: "456-test-utid",
    TEST_DECODED_CLIENT_INFO: '{"uid":"123-test-uid","utid":"456-test-utid"}',
    TEST_INVALID_JSON_CLIENT_INFO:
        '{"uid":"123-test-uid""utid":"456-test-utid"}',
    TEST_RAW_CLIENT_INFO:
        "eyJ1aWQiOiIxMjMtdGVzdC11aWQiLCJ1dGlkIjoiNDU2LXRlc3QtdXRpZCJ9",
    TEST_CLIENT_INFO_B64ENCODED: "eyJ1aWQiOiIxMjM0NSIsInV0aWQiOiI2Nzg5MCJ9",
    TEST_ENCODED_HOME_ACCOUNT_ID: "MTIzLXRlc3QtdWlk.NDU2LXRlc3QtdXRpZA==",
    TEST_DECODED_HOME_ACCOUNT_ID: "123-test-uid.456-test-utid",
    TEST_LOCAL_ACCOUNT_ID: "00000000-0000-0000-66f3-3332eca7ea81s",
    TEST_CACHE_RAW_CLIENT_INFO: "eyJ1aWQiOiJ1aWQiLCAidXRpZCI6InV0aWQifQ==",
    TEST_CACHE_DECODED_CLIENT_INFO: '{"uid":"uid", "utid":"utid"}',
    TEST_RAW_CLIENT_INFO_GUIDS:
        "eyJ1aWQiOiIwMDAwMDAwMC0wMDAwLTAwMDAtNjZmMy0zMzMyZWNhN2VhODEiLCJ1dGlkIjoiMzMzODA0MGQtNmM2Ny00YzViLWIxMTItMzZhMzA0YjY2ZGFkIn0=",
    TEST_CACHE_DECODED_CLIENT_INFO_GUIDS:
        '{"uid":"00000000-0000-0000-66f3-3332eca7ea81","utid":"3338040d-6c67-4c5b-b112-36a304b66dad"}',
};

// Test Hashes
export const TEST_HASHES = {
    TEST_SUCCESS_ID_TOKEN_HASH: `#id_token=${TEST_TOKENS.IDTOKEN_V2}&client_info=${TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO}&state=RANDOM-GUID-HERE|`,
    TEST_SUCCESS_ACCESS_TOKEN_HASH: `#access_token=${TEST_TOKENS.ACCESS_TOKEN}&id_token=${TEST_TOKENS.IDTOKEN_V2}&scope=test&expiresIn=${TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN}&client_info=${TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO}&state=RANDOM-GUID-HERE|`,
    TEST_SUCCESS_CODE_HASH: `#code=thisIsATestCode&client_info=${TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO}&state=RANDOM-GUID-HERE|testState`,
    TEST_ERROR_HASH:
        "#error=error_code&error_description=msal+error+description&state=RANDOM-GUID-HERE|",
    TEST_INTERACTION_REQ_ERROR_HASH1:
        "#error=interaction_required&error_description=msal+error+description&state=RANDOM-GUID-HERE|",
    TEST_INTERACTION_REQ_ERROR_HASH2:
        "#error=interaction_required&error_description=msal+error+description+interaction_required&state=RANDOM-GUID-HERE|",
    TEST_LOGIN_REQ_ERROR_HASH1:
        "#error=login_required&error_description=msal+error+description&state=RANDOM-GUID-HERE|",
    TEST_LOGIN_REQ_ERROR_HASH2:
        "#error=login_required&error_description=msal+error+description+login_required&state=RANDOM-GUID-HERE|",
    TEST_CONSENT_REQ_ERROR_HASH1:
        "#error=consent_required&error_description=msal+error+description&state=RANDOM-GUID-HERE|",
    TEST_CONSENT_REQ_ERROR_HASH2:
        "#error=consent_required&error_description=msal+error+description+consent_required&state=RANDOM-GUID-HERE|",
};

// Test URIs
export const TEST_URIS = {
    DEFAULT_INSTANCE: "https://login.microsoftonline.com/",
    ALTERNATE_INSTANCE: "https://login.windows.net/",
    TEST_REDIR_URI: "https://localhost:8081/index.html",
    TEST_LOGOUT_URI: "https://localhost:8081/logout.html",
    TEST_AUTH_ENDPT:
        "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    TEST_AUTH_ENDPT_ORGS:
        "https://login.microsoftonline.com/organizations/oauth2/v2.0/authorize",
    TEST_AUTH_ENDPT_TENANT_ID:
        "https://login.microsoftonline.com/sample-tenantID/oauth2/v2.0/authorize",
    TEST_AUTH_ENDPT_WITH_PARAMS1:
        "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?param1=value1",
    TEST_AUTH_ENDPT_WITH_PARAMS2:
        "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?param1=value1&param2=value2",
    TEST_RESOURCE_ENDPT_WITH_PARAMS:
        "https://localhost:8081/endpoint?param1=value1&param2=value2",
    TEST_REDIRECT_URI_LOCALHOST: "https://localhost:3000",
};

// Test Crypto Values
export const TEST_CRYPTO_VALUES = {
    TEST_SHA256_HASH: "vdluSPGh34Y-nFDCbX7CudVKZIXRG1rquljNBbn7xuE",
    TEST_USER_ASSERTION_HASH: "nFDCbX7CudvdluSPGh34Y-VKZIXRG1rquljNBbn7xuE",
};

// Test MSAL config params
export const TEST_CONFIG = {
    TENANT: "common",
    MSAL_CLIENT_ID: "0813e1d1-ad72-46a9-8665-399bba48c201",
    MSAL_CLIENT_SECRET: "ThisIsASecret",
    MSAL_TENANT_ID: "3338040d-6c67-4c5b-b112-36a304b66dad",
    validAuthority: TEST_URIS.DEFAULT_INSTANCE + "common",
    alternateValidAuthority: TEST_URIS.ALTERNATE_INSTANCE + "common",
    ADFS_VALID_AUTHORITY: "https://on.prem/adfs",
    DSTS_VALID_AUTHORITY: "https://domain.dsts.subdomain/dstsv2/tenant",
    b2cValidAuthority:
        "https://fabrikamb2c.b2clogin.com/fabrikamb2c.onmicrosoft.com/b2c_1_susi",
    applicationName: "msal.js-tests",
    applicationVersion: "msal.js-tests.1.0.fake",
    STATE: "1234",
    NONCE: "a1b2c3",
    TEST_VERIFIER:
        "Y5LnOOlAWK0kt370Bjm0ZcrW9Sc2pMXR1slip9TFZXoyUV8Y8lCn0WHXyyQ1QcTnALMbrUAj85dC7WIe6gYqc8o8jsHCezP3xiUNB143A5IfwtSfO6Kb8oy7pNqcT9vN",
    TEST_CHALLENGE: "JsjesZmxJwehdhNY9kvyr0QOeSMEvryY_EHZo3BKrqg",
    CODE_CHALLENGE_METHOD: "S256",
    TOKEN_TYPE_BEARER: "Bearer",
    DEFAULT_SCOPES: ["openid", "profile", "offline_access"],
    DSTS_TEST_SCOPE: [
        "https://testserviceprincipalname-6df5cfbb-2ff9-45bb-b27a-595f48f4c7e4/.default",
    ],
    DEFAULT_GRAPH_SCOPE: ["User.Read"],
    LOGIN_HINT: "user@test.com",
    DOMAIN_HINT: "test.com",
    SID: "session-id",
    CORRELATION_ID: "7821e1d3-ad52-42t9-8666-399gea483401",
    CLAIMS: '{"access_token":{"example_claim":{"values":["example_value"]}}}',
    TEST_SKU: "test.sku",
    TEST_VERSION: "1.1.0",
    TEST_OS: "win32",
    TEST_CPU: "x86",
    TEST_APP_NAME: "MSAL.js Unit Test",
    TEST_APP_VER: "1.0.0",
    TEST_ASSERTION_TYPE: "jwt_bearer",
    THE_FAMILY_ID: "1",
    DEFAULT_TOKEN_RENEWAL_OFFSET: 300,
    TEST_CONFIG_ASSERTION: "DefaultAssertion",
    TEST_REQUEST_ASSERTION: "RequestAssertion",
};

const ADDITIONAL_CLAIM = '"additional_claim":{"key":"value"}';
const NBF_CLAIM = '"nbf":{"essential":true,"value":"1701477303"}';
const NEW_CLAIM = '"new_claim":{"new_key":"new_value"}';
const XMS_CC_CLAIM = '"xms_cc":{"values":["cp1","cp2"]}';
export const CAE_CONSTANTS = {
    CLIENT_CAPABILITIES: ["cp1", "cp2"],
    EMPTY_CLAIMS: "{}",
    MERGED_EMPTY_CLAIMS: `{"access_token":{${XMS_CC_CLAIM}}}`,
    CLAIMS_WITH_ADDITIONAL_CLAIMS: `{"access_token":{${NBF_CLAIM},${ADDITIONAL_CLAIM}}}`,
    MERGED_CLAIMS_WITH_ADDITIONAL_CLAIMS: `{"access_token":{${NBF_CLAIM},${ADDITIONAL_CLAIM},${XMS_CC_CLAIM}}}`,
    CLAIMS_WITH_ADDITIONAL_KEY: `{"access_token":{${NBF_CLAIM},${ADDITIONAL_CLAIM},${NEW_CLAIM}},"some_other_key":{${NBF_CLAIM},${ADDITIONAL_CLAIM},${NEW_CLAIM}}}`,
    MERGED_CLAIMS_WITH_ADDITIONAL_KEY: `{"access_token":{${NBF_CLAIM},${ADDITIONAL_CLAIM},${NEW_CLAIM},${XMS_CC_CLAIM}},"some_other_key":{${NBF_CLAIM},${ADDITIONAL_CLAIM},${NEW_CLAIM}}}`,
    CLAIM_WITH_ADDITIONAL_KEY_AND_ACCESS_KEY: `{"some_other_key":{${NBF_CLAIM},${ADDITIONAL_CLAIM},${NEW_CLAIM}},"access_token":{${NBF_CLAIM},${ADDITIONAL_CLAIM},${NEW_CLAIM}}}`,
    MERGED_CLAIM_WITH_ADDITIONAL_KEY_AND_ACCESS_KEY: `{"some_other_key":{${NBF_CLAIM},${ADDITIONAL_CLAIM},${NEW_CLAIM}},"access_token":{${NBF_CLAIM},${ADDITIONAL_CLAIM},${NEW_CLAIM},${XMS_CC_CLAIM}}}`,
};

export const RANDOM_TEST_GUID = "11553a9b-7116-48b1-9d48-f6d4a8ff8371";

export const TEST_POP_VALUES = {
    CLIENT_CLAIMS:
        '{"customClaim":"CustomClaimValue","anotherClaim":"AnotherValue"}',
    KID: "NzbLsXh8uDCcd-6MNwXF4W_7noWXFZAfHkxZsRGC9Xs",
    URLSAFE_ENCODED_REQCNF:
        "eyJraWQiOiJOemJMc1hoOHVEQ2NkLTZNTndYRjRXXzdub1dYRlpBZkhreFpzUkdDOVhzIiwieG1zX2tzbCI6InN3In0",
    ENCODED_REQ_CNF:
        "eyJraWQiOiJOemJMc1hoOHVEQ2NkLTZNTndYRjRXXzdub1dYRlpBZkhreFpzUkdDOVhzIiwieG1zX2tzbCI6InN3In0=",
    DECODED_REQ_CNF:
        '{"kid":"NzbLsXh8uDCcd-6MNwXF4W_7noWXFZAfHkxZsRGC9Xs","xms_ksl":"sw"}',
    SAMPLE_POP_AT:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJjbmYiOnsia2lkIjoiTnpiTHNYaDh1RENjZC02TU53WEY0V183bm9XWEZaQWZIa3hac1JHQzlYcyJ9fQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    SAMPLE_POP_AT_PAYLOAD_ENCODED:
        "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJjbmYiOnsia2lkIjoiTnpiTHNYaDh1RENjZC02TU53WEY0V183bm9XWEZaQWZIa3hac1JHQzlYcyJ9fQ",
    SAMPLE_POP_AT_PAYLOAD_DECODED:
        '{"sub":"1234567890","name":"John Doe","iat":1516239022,"cnf":{"kid":"NzbLsXh8uDCcd-6MNwXF4W_7noWXFZAfHkxZsRGC9Xs"}}',
    SHR_NONCE:
        "eyJhbGciOiJIUzI1NiIsImtpZCI6IktJRCIsInR5cCI6IkpXVCJ9.eyJ0cyI6IjE2MjU2NzI1MjkifQ.rA5ho63Lbdwo8eqZ_gUtQxY3HaseL0InIVwdgf7L_fc",
};

export const TEST_SSH_VALUES = {
    SSH_JWK:
        '{"kty":"RSA","n":"wDJwv083ZhGGkpMPVcBMwtSBNLu7qhT2VmKv7AyPEz_dWb8GQzNEnWT1niNjFI0isDMFWQ7X2O-dhTL9J1QguQ==","e":"AQAB"}',
    ENCODED_SSH_JWK:
        "%7B%22kty%22%3A%22RSA%22%2C%22n%22%3A%22wDJwv083ZhGGkpMPVcBMwtSBNLu7qhT2VmKv7AyPEz_dWb8GQzNEnWT1niNjFI0isDMFWQ7X2O-dhTL9J1QguQ%3D%3D%22%2C%22e%22%3A%22AQAB%22%7D",
    SSH_KID: "TestSSHKeyId",
    ALTERNATE_SSH_JWK:
        '{"p":"zN8SHQ_QsbEMNwrA3ZpKn2ulmKGZfAfrOnouojvUIzuH13y-sWUfiDADgei4MG3j5fJHFPuMdKE5zdYKgsC3eyImeAzNd10ZDRUaMXubg1fyyvlf7hE4cvrwaQ0MftXsvlCLi1nkK_DjnPjAonqvbRMOS6YyUXAZBZyfLaZ76cU","kty":"RSA","q":"yrsb5PwGF5Lvtx1CCSX6j0fhNDjwK7LkKvfE1qhrGgv3Cu9HBUb90qoj0qewA1prPQBN3cjrKv19zIrIV2ac3-p_j6jKotd7o2-t0jXpSW7wlGFpArIf2nxDyJo1KeimDi697hbESb_gPYGeno0TJTdmIyYWB8_JHm06cGkU3P0","d":"U4A5WR4L4cqActlO0PALdBF9_Myc4Zzk401Uo3bufsI3AGw9EFkARIq7U2T4PAnPbhUr-mT3zIYsLD6Ck1-PNE9gJbeQXgBRHJWCZe6s90FoeQZl1k2ADjjwOWjf5MyTxTSmdH7ENIABLzsukz3EQnsEZIGM4bnpaC-5wfZ5THI8FFEIMh-sEro1BbI_roohwKoDiOmzpthrxbqoFXq7YfEOjZ9i_H8mvCunMuQQ0CZLZfGTKoKN5ZcQkQSdy4wAVzln5eXtm-lxWFXrB-EL8qgDUrsx9HAxKxjACKNoTdgttGy3G434OJqh7QB5iGtHaXVb5wEvUeJXXa_N44Sd4Q","e":"AQAB","use":"enc","kid":"40890f08-6b55-450f-9443-a6d5cef8b6d0","qi":"OQ2Ku_syiEvUEvixOyyBSuq5UuoQLwaecExggwUaJZF-zpRv76fsxxaKYZiTZU-80cLMIOfsYbxMU1_p_VI4gKOr8vnY10VSCBSge8UX6InuLzVGdx8UoMb-q0rhmStw2hhfFzLzrZSYvooxMX_PQQTkmyhyVck9Pp-5hVPg3hI',
    dp: 'XMccndqeqQnDvV16UCDicGXAfWmZZ2jypu3UFpY_kKER-I0-knl4GSWdQQSR_SSW03ivphnw1pR45_VplyMNNI8XmsA5gDfB84G99fDDUWzPwAnE3rwfszpfC0Pkh7_7UYiKWVYhFaEmgtzH6AzlSuEZVTrziJvaSQdPss21Sf0","dq":"MqBTMPW218A72LCXww0W6xz6Ij5ty5va2tgQ8cIRLOn8AWELjUfTLv6J_5scm1nDGfKvf0kjYRL4jVHDAgCAAHLg9BEkuVGycHf9IleQMGRh88v3m1K8HaWWj8viptqQTU5i48gPsJMX_oQWBmYYd9zDxtdF_SFoig6g311-dkk',
    n: 'oj3Bj_D64iFCgtRAInqXbiIrTxbMBw6D6QFCam84CjS3U3cvOjqBhaWPciqPZFYAk3T4_7_HDu-v_iNb5R5Nae0PQ3hXt99y3n0ZwVE_LQ4hQuMLWCQ8YaQnLjrBCJR1YWD6d92UGXj6Jm_a80wmrcxZ6z_W-thUacdGN6Y5P5bLTq-dAYf92ZQxTx9-nIV8BA0jnFt0F_tMuBU-sec8Z2vSq8KQjllWgXarB6aKq7g4RsJAgGqC-kVwskE2WrXKiTVgnA-mvBhRwJE2TMYdi0dMT2eCZCA6Hym2rj_7PRT5QCTflYWPh7Ya3blc4ET9xC8akghPMZjVfEfwFb9TsQ"}',
    ALTERNATE_ENCODED_SSH_JWK:
        "%7B%22p%22%3A%22zN8SHQ_QsbEMNwrA3ZpKn2ulmKGZfAfrOnouojvUIzuH13y-sWUfiDADgei4MG3j5fJHFPuMdKE5zdYKgsC3eyImeAzNd10ZDRUaMXubg1fyyvlf7hE4cvrwaQ0MftXsvlCLi1nkK_DjnPjAonqvbRMOS6YyUXAZBZyfLaZ76cU%22%2C%22kty%22%3A%22RSA%22%2C%22q%22%3A%22yrsb5PwGF5Lvtx1CCSX6j0fhNDjwK7LkKvfE1qhrGgv3Cu9HBUb90qoj0qewA1prPQBN3cjrKv19zIrIV2ac3-p_j6jKotd7o2-t0jXpSW7wlGFpArIf2nxDyJo1KeimDi697hbESb_gPYGeno0TJTdmIyYWB8_JHm06cGkU3P0%22%2C%22d%22%3A%22U4A5WR4L4cqActlO0PALdBF9_Myc4Zzk401Uo3bufsI3AGw9EFkARIq7U2T4PAnPbhUr-mT3zIYsLD6Ck1-PNE9gJbeQXgBRHJWCZe6s90FoeQZl1k2ADjjwOWjf5MyTxTSmdH7ENIABLzsukz3EQnsEZIGM4bnpaC-5wfZ5THI8FFEIMh-sEro1BbI_roohwKoDiOmzpthrxbqoFXq7YfEOjZ9i_H8mvCunMuQQ0CZLZfGTKoKN5ZcQkQSdy4wAVzln5eXtm-lxWFXrB-EL8qgDUrsx9HAxKxjACKNoTdgttGy3G434OJqh7QB5iGtHaXVb5wEvUeJXXa_N44Sd4Q%22%2C%22e%22%3A%22AQAB%22%2C%22use%22%3A%22enc%22%2C%22kid%22%3A%2240890f08-6b55-450f-9443-a6d5cef8b6d0%22%2C%22qi%22%3A%22OQ2Ku_syiEvUEvixOyyBSuq5UuoQLwaecExggwUaJZF-zpRv76fsxxaKYZiTZU-80cLMIOfsYbxMU1_p_VI4gKOr8vnY10VSCBSge8UX6InuLzVGdx8UoMb-q0rhmStw2hhfFzLzrZSYvooxMX_PQQTkmyhyVck9Pp-5hVPg3hI%22%2C%22dp%22%3A%22XMccndqeqQnDvV16UCDicGXAfWmZZ2jypu3UFpY_kKER-I0-knl4GSWdQQSR_SSW03ivphnw1pR45_VplyMNNI8XmsA5gDfB84G99fDDUWzPwAnE3rwfszpfC0Pkh7_7UYiKWVYhFaEmgtzH6AzlSuEZVTrziJvaSQdPss21Sf0%22%2C%22dq%22%3A%22MqBTMPW218A72LCXww0W6xz6Ij5ty5va2tgQ8cIRLOn8AWELjUfTLv6J_5scm1nDGfKvf0kjYRL4jVHDAgCAAHLg9BEkuVGycHf9IleQMGRh88v3m1K8HaWWj8viptqQTU5i48gPsJMX_oQWBmYYd9zDxtdF_SFoig6g311-dkk%22%2C%22n%22%3A%22oj3Bj_D64iFCgtRAInqXbiIrTxbMBw6D6QFCam84CjS3U3cvOjqBhaWPciqPZFYAk3T4_7_HDu-v_iNb5R5Nae0PQ3hXt99y3n0ZwVE_LQ4hQuMLWCQ8YaQnLjrBCJR1YWD6d92UGXj6Jm_a80wmrcxZ6z_W-thUacdGN6Y5P5bLTq-dAYf92ZQxTx9-nIV8BA0jnFt0F_tMuBU-sec8Z2vSq8KQjllWgXarB6aKq7g4RsJAgGqC-kVwskE2WrXKiTVgnA-mvBhRwJE2TMYdi0dMT2eCZCA6Hym2rj_7PRT5QCTflYWPh7Ya3blc4ET9xC8akghPMZjVfEfwFb9TsQ%22%7D",
    ALTERNATE_SSH_KID: "AlternateSSHKeyId",
};

export const TEST_STATE_VALUES = {
    USER_STATE: "userState",
    TEST_TIMESTAMP: 1592846482,
    DECODED_LIB_STATE: `{"id":"${RANDOM_TEST_GUID}","ts":1592846482}`,
    ENCODED_LIB_STATE:
        "eyJpZCI6IjExNTUzYTliLTcxMTYtNDhiMS05ZDQ4LWY2ZDRhOGZmODM3MSIsInRzIjoxNTkyODQ2NDgyfQ==",
    URI_ENCODED_LIB_STATE:
        "eyJpZCI6IjExNTUzYTliLTcxMTYtNDhiMS05ZDQ4LWY2ZDRhOGZmODM3MSIsInRzIjoxNTkyODQ2NDgyfQ%3D%3D",
    TEST_STATE: `eyJpZCI6IjExNTUzYTliLTcxMTYtNDhiMS05ZDQ4LWY2ZDRhOGZmODM3MSIsInRzIjoxNTkyODQ2NDgyfQ==${Constants.RESOURCE_DELIM}userState`,
};
export const DEFAULT_TENANT_DISCOVERY_RESPONSE = {
    body: {
        tenant_discovery_endpoint:
            "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration",
        "api-version": "1.1",
        metadata: [
            {
                preferred_network: "login.windows.net",
                preferred_cache: "sts.windows.net",
                aliases: [
                    "login.microsoftonline.com",
                    "login.windows.net",
                    "login.microsoft.com",
                    "sts.windows.net",
                ],
            },
        ],
    },
};

export const DSTS_OPENID_CONFIG_RESPONSE = {
    body: {
        token_endpoint:
            "https://login.microsoftonline.com/dstsv2/{tenant}/oauth2/v2.0/token",
    },
};
export const DEFAULT_OPENID_CONFIG_RESPONSE = {
    body: {
        token_endpoint:
            "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
        token_endpoint_auth_methods_supported: [
            "client_secret_post",
            "private_key_jwt",
            "client_secret_basic",
        ],
        jwks_uri:
            "https://login.microsoftonline.com/{tenant}/discovery/v2.0/keys",
        response_modes_supported: ["query", "fragment", "form_post"],
        subject_types_supported: ["pairwise"],
        id_token_signing_alg_values_supported: ["RS256"],
        response_types_supported: [
            "code",
            "id_token",
            "code id_token",
            "id_token token",
        ],
        scopes_supported: ["openid", "profile", "email", "offline_access"],
        issuer: "https://login.microsoftonline.com/{tenant}/v2.0",
        request_uri_parameter_supported: false,
        userinfo_endpoint: "https://graph.microsoft.com/oidc/userinfo",
        authorization_endpoint:
            "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize",
        http_logout_supported: true,
        frontchannel_logout_supported: true,
        end_session_endpoint:
            "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/logout",
        claims_supported: [
            "sub",
            "iss",
            "cloud_instance_name",
            "cloud_instance_host_name",
            "cloud_graph_host_name",
            "msgraph_host",
            "aud",
            "exp",
            "iat",
            "auth_time",
            "acr",
            "nonce",
            "preferred_username",
            "name",
            "tid",
            "ver",
            "at_hash",
            "c_hash",
            "email",
        ],
        tenant_region_scope: null,
        cloud_instance_name: "microsoftonline.com",
        cloud_graph_host_name: "graph.windows.net",
        msgraph_host: "graph.microsoft.com",
        rbac_url: "https://pas.windows.net",
    },
};

export const AUTHENTICATION_RESULT = {
    status: 200,
    body: {
        token_type: AuthenticationScheme.BEARER,
        scope: "openid profile User.Read email",
        expires_in: 3599,
        ext_expires_in: 3599,
        access_token: "thisIs.an.accessT0ken",
        refresh_token: "thisIsARefreshT0ken",
        id_token:
            "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjFMVE16YWtpaGlSbGFfOHoyQkVKVlhlV01xbyJ9.eyJ2ZXIiOiIyLjAiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vOTE4ODA0MGQtNmM2Ny00YzViLWIxMTItMzZhMzA0YjY2ZGFkL3YyLjAiLCJzdWIiOiJBQUFBQUFBQUFBQUFBQUFBQUFBQUFJa3pxRlZyU2FTYUZIeTc4MmJidGFRIiwiYXVkIjoiNmNiMDQwMTgtYTNmNS00NmE3LWI5OTUtOTQwYzc4ZjVhZWYzIiwiZXhwIjoxNTM2MzYxNDExLCJpYXQiOjE1MzYyNzQ3MTEsIm5iZiI6MTUzNjI3NDcxMSwibmFtZSI6IkFiZSBMaW5jb2xuIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiQWJlTGlAbWljcm9zb2Z0LmNvbSIsIm9pZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC02NmYzLTMzMzJlY2E3ZWE4MSIsInRpZCI6IjMzMzgwNDBkLTZjNjctNGM1Yi1iMTEyLTM2YTMwNGI2NmRhZCIsIm5vbmNlIjoiMTIzNTIzIiwiYWlvIjoiRGYyVVZYTDFpeCFsTUNXTVNPSkJjRmF0emNHZnZGR2hqS3Y4cTVnMHg3MzJkUjVNQjVCaXN2R1FPN1lXQnlqZDhpUURMcSFlR2JJRGFreXA1bW5PcmNkcUhlWVNubHRlcFFtUnA2QUlaOGpZIn0=.1AFWW-Ck5nROwSlltm7GzZvDwUkqvhSQpm55TQsmVo9Y59cLhRXpvB8n-55HCr9Z6G_31_UbeUkoz612I2j_Sm9FFShSDDjoaLQr54CreGIJvjtmS3EkK9a7SJBbcpL1MpUtlfygow39tFjY7EVNW9plWUvRrTgVk7lYLprvfzw-CIqw3gHC-T7IK_m_xkr08INERBtaecwhTeN4chPC4W3jdmw_lIxzC48YoQ0dB1L9-ImX98Egypfrlbm0IBL5spFzL6JDZIRRJOu8vecJvj1mq-IUhGt0MacxX8jdxYLP-KUu2d9MbNKpCKJuZ7p8gwTL5B7NlUdh_dmSviPWrw",
        client_info: `${TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO}`,
    },
};

export const AUTHENTICATION_RESULT_DEFAULT_SCOPES = {
    status: 200,
    body: {
        token_type: AuthenticationScheme.BEARER,
        scope: "openid profile offline_access User.Read",
        expires_in: 3599,
        ext_expires_in: 3599,
        access_token: "thisIs.an.accessT0ken",
        refresh_token: "thisIsARefreshT0ken",
        id_token:
            "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjFMVE16YWtpaGlSbGFfOHoyQkVKVlhlV01xbyJ9.eyJ2ZXIiOiIyLjAiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vOTE4ODA0MGQtNmM2Ny00YzViLWIxMTItMzZhMzA0YjY2ZGFkL3YyLjAiLCJzdWIiOiJBQUFBQUFBQUFBQUFBQUFBQUFBQUFJa3pxRlZyU2FTYUZIeTc4MmJidGFRIiwiYXVkIjoiNmNiMDQwMTgtYTNmNS00NmE3LWI5OTUtOTQwYzc4ZjVhZWYzIiwiZXhwIjoxNTM2MzYxNDExLCJpYXQiOjE1MzYyNzQ3MTEsIm5iZiI6MTUzNjI3NDcxMSwibmFtZSI6IkFiZSBMaW5jb2xuIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiQWJlTGlAbWljcm9zb2Z0LmNvbSIsIm9pZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC02NmYzLTMzMzJlY2E3ZWE4MSIsInRpZCI6IjMzMzgwNDBkLTZjNjctNGM1Yi1iMTEyLTM2YTMwNGI2NmRhZCIsIm5vbmNlIjoiMTIzNTIzIiwiYWlvIjoiRGYyVVZYTDFpeCFsTUNXTVNPSkJjRmF0emNHZnZGR2hqS3Y4cTVnMHg3MzJkUjVNQjVCaXN2R1FPN1lXQnlqZDhpUURMcSFlR2JJRGFreXA1bW5PcmNkcUhlWVNubHRlcFFtUnA2QUlaOGpZIn0=.1AFWW-Ck5nROwSlltm7GzZvDwUkqvhSQpm55TQsmVo9Y59cLhRXpvB8n-55HCr9Z6G_31_UbeUkoz612I2j_Sm9FFShSDDjoaLQr54CreGIJvjtmS3EkK9a7SJBbcpL1MpUtlfygow39tFjY7EVNW9plWUvRrTgVk7lYLprvfzw-CIqw3gHC-T7IK_m_xkr08INERBtaecwhTeN4chPC4W3jdmw_lIxzC48YoQ0dB1L9-ImX98Egypfrlbm0IBL5spFzL6JDZIRRJOu8vecJvj1mq-IUhGt0MacxX8jdxYLP-KUu2d9MbNKpCKJuZ7p8gwTL5B7NlUdh_dmSviPWrw",
        client_info: `${TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO}`,
    },
};

export const MANAGED_IDENTITY_AZURE_ARC_WWW_AUTHENTICATE_HEADER: string = `Basic ${TEST_TOKENS.ACCESS_TOKEN}`;
export const MANAGED_IDENTITY_CONTENT_TYPE_HEADER: string =
    "application/x-www-form-urlencoded;charset=utf-8";

export const MANAGED_IDENTITY_TOKEN_RETRIEVAL_ERROR: string =
    "There was an error retrieving the access token from the managed identity.";

export const MANAGED_IDENTITY_RESOURCE_BASE: string =
    "https://graph.microsoft.com";
// scopes
export const MANAGED_IDENTITY_RESOURCE: string = `${MANAGED_IDENTITY_RESOURCE_BASE}/.default`;

// client ids
export const MANAGED_IDENTITY_RESOURCE_ID: string =
    "unique_identifier_generated_by_azure_ad_for_the_azure_resource";
export const MANAGED_IDENTITY_RESOURCE_ID_2: string =
    "/subscriptions/someguid/resourcegroups/uami_group/providers/microsoft.managedidentityclient/userassignedidentities/uami";

export const getCacheKey = (resource?: string): string => {
    const resourceHelper = resource || DEFAULT_MANAGED_IDENTITY_ID;
    return `-${Constants.DEFAULT_AUTHORITY_HOST}-accesstoken-${resourceHelper}-managed_identity-${MANAGED_IDENTITY_RESOURCE_BASE}--`;
};

export const DEFAULT_MANAGED_IDENTITY_AUTHENTICATION_RESULT: Omit<
    AuthenticationResult,
    "correlationId"
> = {
    accessToken: TEST_TOKENS.ACCESS_TOKEN,
    account: null,
    authority: DEFAULT_AUTHORITY_FOR_MANAGED_IDENTITY,
    cloudGraphHostName: "",
    code: undefined,
    expiresOn: new Date(TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN),
    extExpiresOn: new Date(TEST_TOKEN_LIFETIMES.DEFAULT_EXPIRES_IN),
    familyId: "",
    fromCache: false,
    fromNativeBroker: false,
    idToken: "",
    idTokenClaims: {},
    msGraphHost: "",
    refreshOn: undefined,
    requestId: "",
    scopes: [MANAGED_IDENTITY_RESOURCE],
    state: "",
    tenantId: "",
    tokenType: AuthenticationScheme.BEARER,
    uniqueId: "",
};

export const DEFAULT_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT: AuthenticationResult =
    {
        ...DEFAULT_MANAGED_IDENTITY_AUTHENTICATION_RESULT,
        correlationId: DEFAULT_MANAGED_IDENTITY_ID,
    };
export const DEFAULT_USER_SYSTEM_ASSIGNED_MANAGED_IDENTITY_AUTHENTICATION_RESULT: AuthenticationResult =
    {
        ...DEFAULT_MANAGED_IDENTITY_AUTHENTICATION_RESULT,
        correlationId: MANAGED_IDENTITY_RESOURCE,
    };

export const CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT = {
    status: 200,
    body: {
        token_type: AuthenticationScheme.BEARER,
        expires_in: 3599,
        ext_expires_in: 3599,
        access_token: "thisIs.an.accessT0ken",
    },
};

export const DSTS_CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT = {
    status: 200,
    body: {
        token_type: AuthenticationScheme.BEARER,
        expires_in: 86396,
        ext_expires_in: 86396,
        refresh_in: 43198,
        access_token: "thisIs.a.dsts.accessT0ken",
    },
};
export const DEVICE_CODE_RESPONSE = {
    userCode: "FRWQDE7YL",
    deviceCode:
        "FAQABAAEAAAAm-06blBE1TpVMil8KPQ414yBCo3ZKuMDP8Rw0c8_mKXKdJEpKINnjC1jRfwa_uuF-yqKFw100qeiQDNGuRnS8FxCKeWCybjEPf2KoptmHGa3MEL5MXGl9yEDtaMRGBYpJNx_ssI2zYJP1uXqejSj1Kns69bdClF4BZxRpmJ1rcssZuY1-tTLw0vngmHYqRp0gAA",
    verificationUri: "https://microsoft.com/devicelogin",
    expiresIn: 900,
    interval: 5,
    message:
        "To sign in, use a web browser to open the page https://microsoft.com/devicelogin and enter the code FRWQDE7YL to authenticate.",
};

export const DEVICE_CODE_EXPIRED_RESPONSE = {
    userCode: "FRWQDE7YL",
    deviceCode:
        "FAQABAAEAAAAm-06blBE1TpVMil8KPQ414yBCo3ZKuMDP8Rw0c8_mKXKdJEpKINnjC1jRfwa_uuF-yqKFw100qeiQDNGuRnS8FxCKeWCybjEPf2KoptmHGa3MEL5MXGl9yEDtaMRGBYpJNx_ssI2zYJP1uXqejSj1Kns69bdClF4BZxRpmJ1rcssZuY1-tTLw0vngmHYqRp0gAA",
    verificationUri: "https://microsoft.com/devicelogin",
    expiresIn: 0,
    interval: 5,
    message:
        "To sign in, use a web browser to open the page https://microsoft.com/devicelogin and enter the code FRWQDE7YL to authenticate.",
    client_info: `${TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO}`,
};

export const AUTHORIZATION_PENDING_RESPONSE = {
    body: {
        error: "authorization_pending",
        error_description:
            "AADSTS70016: OAuth 2.0 device flow error. Authorization is pending. Continue polling." +
            "Trace ID: 01707a0c-640b-4049-8cbb-ee2304dc0700" +
            "Correlation ID: 78b0fdfc-dd0e-4dfb-b13a-d316333783f6" +
            "Timestamp: 2020-03-26 22:54:14Z",
        error_codes: [70016],
        timestamp: "2020-03-26 22:54:14Z",
        trace_id: "01707a0c-640b-4049-8cbb-ee2304dc0700",
        correlation_id: "78b0fdfc-dd0e-4dfb-b13a-d316333783f6",
        error_uri: "https://login.microsoftonline.com/error?code=70016",
    },
};

export const SERVER_UNEXPECTED_ERROR = {
    status: 503,
    body: {
        error: "Service Unavailable",
    },
};

export const DEFAULT_NETWORK_IMPLEMENTATION = {
    sendGetRequestAsync: async (): Promise<any> => {
        return { test: "test" };
    },
    sendPostRequestAsync: async (): Promise<any> => {
        return { test: "test" };
    },
};

export const CORS_SIMPLE_REQUEST_HEADERS = [
    "connection",
    "user-agent",
    "accept",
    "accept-language",
    "content-language",
    "content-type",
];

export const THREE_SECONDS_IN_MILLI = 3000;

export const MOCK_USERNAME = `mock_${PasswordGrantConstants.username}`;
export const MOCK_PASSWORD = `mock_${PasswordGrantConstants.password}`;
