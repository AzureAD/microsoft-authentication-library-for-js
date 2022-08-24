/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult } from "@azure/msal-common";
import { createLocalJWKSet, createRemoteJWKSet, JSONWebKeySet, JWTPayload, jwtVerify, JWTVerifyResult, ResolvedKey } from "jose";
import { mocked } from "jest-mock";
import { TokenValidator } from "../../src/api/TokenValidator";
import { TEST_CONSTANTS, TEST_HASH_CONSTANTS } from "../utils/TestConstants";
import { TokenValidationParameters } from "../../src";
import { ValidationConfigurationError, ValidationConfigurationErrorMessage } from "../../src/error/ValidationConfigurationError";
import { TokenType } from "../../src/utils/Constants";
import { BaseValidationParameters } from "../../src/config/TokenValidationParameters";
import { ValidationError, ValidationErrorMessage } from "../../src/error/ValidationError";
import { OpenIdConfigProvider } from "../../src/config/OpenIdConfigProvider";
import "regenerator-runtime";

jest.mock("jose");

describe("TokenValidator", () => {
    const joseMockResult: (JWTVerifyResult & ResolvedKey) = {
        payload: {
            aud: "audience"
        },
        protectedHeader: {
            alg: ""
        },
        key: {
            type: "type"
        }
    };

    const defaultOptions: TokenValidationParameters = {
        validIssuers: ["issuer"],
        validAudiences: ["audiences"]
    };

    const defaultValidationParams: BaseValidationParameters = {
        validIssuers: ["issuer"],
        validAudiences: ["audiences"],
        validAlgorithms: [TEST_CONSTANTS.DEFAULT_ALGORITHM],
        validTypes: [TEST_CONSTANTS.DEFAULT_TYPE],
        requireExpirationTime: true,
        requireSignedTokens: true,
    };

    const defaultPayload: JWTPayload = {
        aud: "audience"
    };
    let validator: TokenValidator;

    beforeEach(() => {
        validator = new TokenValidator();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("exports a class", () => {
        const validator = new TokenValidator();
        expect(validator).toBeInstanceOf(TokenValidator);
    });

    describe("validateTokenMiddleware", () => {

        it("adds access token to request header if resource passed in and access token exists on session", (done) => {
            const req = {
                session: {
                    protectedResources: {
                        myApi: {
                            accessToken: "access-token"
                        }
                    }
                },
                headers: {
                    authorization: ""
                }
            };

            const validateTokenResponse = {
                token: "Bearer access-token",
                tokenType: "JWT"
            };

            const validateTokenSpy = jest.spyOn(validator, "validateTokenFromRequest").mockReturnValue(Promise.resolve(validateTokenResponse));

            const next = jest.fn((error) => {
                expect(validateTokenSpy).toHaveBeenCalledTimes(1);
                expect(req.headers.authorization).toEqual(validateTokenResponse.token);
                
                expect(error).toBeUndefined();
                done();
            });

            const middlewareFunction = validator.validateTokenMiddleware(defaultOptions, "myApi");
            
            middlewareFunction(req, {}, next);
        });

        it("calls next with missing token error if resource exists but has no access token in req sessions", (done) => {
            const req = {
                session: {
                    protectedResources: {
                        myApi: {}
                    }
                },
                headers: {
                    authorization: ""
                }
            };

            const next = jest.fn((error) => {
                expect(error).toBeInstanceOf(ValidationConfigurationError);
                expect(error.errorCode).toContain(ValidationConfigurationErrorMessage.missingToken.code);
                expect(error.errorMessage).toContain(ValidationConfigurationErrorMessage.missingToken.desc);
                done();
            });

            const middlewareFunction = validator.validateTokenMiddleware(defaultOptions, "myApi");
            
            middlewareFunction(req, {}, next);
        });

        it("calls next with missing token error if resource does not exist in req sessions", (done) => {
            const req = {
                session: {
                    protectedResources: {
                        anotherApi: {}
                    }
                },
                headers: {
                    authorization: ""
                }
            };

            const next = jest.fn((error) => {
                expect(error).toBeInstanceOf(ValidationConfigurationError);
                expect(error.errorCode).toContain(ValidationConfigurationErrorMessage.missingToken.code);
                expect(error.errorMessage).toContain(ValidationConfigurationErrorMessage.missingToken.desc);
                done();
            });

            const middlewareFunction = validator.validateTokenMiddleware(defaultOptions, "myApi");
            
            middlewareFunction(req, {}, next);
        });

    });

    describe("validateTokenFromRequest", () => {

        it("validates token from request authorization header", async () => {
            const validateTokenResponse = {
                token: "access-token-from-header",
                tokenType: "JWT"
            };

            const request = {
                headers: {
                    authorization: "Bearer access-token-from-header"
                },
                body: {
                    access_token: "access-token-from-body"
                }
            };

            const validateTokenSpy = jest.spyOn(validator, "validateToken").mockReturnValue(Promise.resolve(validateTokenResponse));

            const result = await validator.validateTokenFromRequest(request, defaultOptions);

            expect(result.token).toEqual("access-token-from-header");
            expect(validateTokenSpy).toHaveBeenCalledTimes(1);
            expect(validateTokenSpy).toHaveBeenCalledWith("access-token-from-header", defaultOptions);
            expect(validateTokenSpy).toReturnWith(Promise.resolve(validateTokenResponse));
        });

        it("throws error if authorization header in request is not bearer, and no token in body", async () => {
            const request = {
                headers: {
                    authorization: "Basic access-token"
                }
            };

            await validator.validateTokenFromRequest(request, defaultOptions)
                .catch((e) => {
                    expect(e).toBeInstanceOf(ValidationConfigurationError);
                    expect(e.errorCode).toContain(ValidationConfigurationErrorMessage.missingToken.code);
                    expect(e.errorMessage).toContain(ValidationConfigurationErrorMessage.missingToken.desc);
                });
        });

        it("validates token from request body", async () => {
            const validateTokenResponse = {
                token: "access-token-from-body",
                tokenType: "JWT"
            };

            const request = {
                headers: {},
                body: {
                    access_token: "access-token-from-body"
                }
            };

            const validateTokenSpy = jest.spyOn(validator, "validateToken").mockReturnValue(Promise.resolve(validateTokenResponse));

            const result = await validator.validateTokenFromRequest(request, defaultOptions);

            expect(result.token).toEqual("access-token-from-body");
            expect(validateTokenSpy).toHaveBeenCalledTimes(1);
            expect(validateTokenSpy).toHaveBeenCalledWith("access-token-from-body", defaultOptions);
            expect(validateTokenSpy).toReturnWith(Promise.resolve(validateTokenResponse));
        });

    });

    describe("validateTokenFromResponse", () => {

        it("validates id token if present on msal response and options provided", async () => {
            const msalResponse = {
                idToken: "id-token",
                tokenType: "Bearer"
            } as AuthenticationResult;

            const validateTokenResponse = {
                token: "id-token",
                tokenType: "JWT"
            };

            const validateTokenSpy = jest.spyOn(validator, "validateToken").mockReturnValue(Promise.resolve(validateTokenResponse));

            const result = await validator.validateTokenFromResponse(msalResponse, defaultOptions);

            expect(result).toEqual([validateTokenResponse]);

            expect(validateTokenSpy).toHaveBeenCalledTimes(1);
            expect(validateTokenSpy).toHaveBeenCalledWith("id-token", defaultOptions);
            expect(validateTokenSpy).toReturnWith(Promise.resolve(validateTokenResponse));
        });

        it("does not validate id token if present but idTokenOptions not passed in", async () => {
            const msalResponse = {
                idToken: "id-token",
                tokenType: "Bearer"
            } as AuthenticationResult;

            const validateTokenSpy = jest.spyOn(validator, "validateToken");

            const result = await validator.validateTokenFromResponse(msalResponse);

            expect(result).toEqual([]);

            expect(validateTokenSpy).toHaveBeenCalledTimes(0);
        });

        it("validates id token with code if code returned in response", async () => {
            const msalResponse = {
                idToken: "id-token",
                tokenType: "Bearer",
                code: "code1234"
            } as AuthenticationResult;

            const validateTokenResponse = {
                token: "id-token",
                tokenType: "JWT"
            };

            const idTokenOptions = {
                validIssuers: ["issuer"],
                validAudiences: ["audiences"]
            };

            const validateTokenOptionsWithCode = {
                ...idTokenOptions,
                code: "code1234"
            };

            const validateTokenSpy = jest.spyOn(validator, "validateToken").mockReturnValue(Promise.resolve(validateTokenResponse));

            const result = await validator.validateTokenFromResponse(msalResponse, idTokenOptions);

            expect(result).toEqual([validateTokenResponse]);

            expect(validateTokenSpy).toHaveBeenCalledTimes(1);
            expect(validateTokenSpy).toHaveBeenCalledWith("id-token", validateTokenOptionsWithCode);
            expect(validateTokenSpy).toReturnWith(Promise.resolve(validateTokenResponse));
        });

        it("validates id token with accessToken if accessToken returned in response", async () => {
            const msalResponse = {
                idToken: "id-token",
                tokenType: "Bearer",
                accessToken: "access-token"
            } as AuthenticationResult;

            const validateTokenResponse = {
                token: "id-token",
                tokenType: "JWT"
            };

            const idTokenOptions = {
                validIssuers: ["issuer"],
                validAudiences: ["audiences"]
            };

            const validateTokenOptionsWithAccessToken = {
                ...idTokenOptions,
                accessTokenForAtHash: "access-token"
            };

            const validateTokenSpy = jest.spyOn(validator, "validateToken").mockReturnValue(Promise.resolve(validateTokenResponse));

            const result = await validator.validateTokenFromResponse(msalResponse, idTokenOptions);

            expect(result).toEqual([validateTokenResponse]);

            expect(validateTokenSpy).toHaveBeenCalledTimes(1);
            expect(validateTokenSpy).toHaveBeenCalledWith("id-token", validateTokenOptionsWithAccessToken);
            expect(validateTokenSpy).toReturnWith(Promise.resolve(validateTokenResponse));
        });

        it("validates access token if present on msal response and options provided", async () => {
            const msalResponse = {
                accessToken: "access-token",
                tokenType: "Bearer"
            } as AuthenticationResult;

            const validateTokenResponse = {
                token: "access-token",
                tokenType: "JWT"
            };

            const validateTokenSpy = jest.spyOn(validator, "validateToken").mockReturnValue(Promise.resolve(validateTokenResponse));

            const result = await validator.validateTokenFromResponse(msalResponse, undefined, defaultOptions);

            expect(result).toEqual([validateTokenResponse]);

            expect(validateTokenSpy).toHaveBeenCalledTimes(1);
            expect(validateTokenSpy).toHaveBeenCalledWith("access-token", defaultOptions);
            expect(validateTokenSpy).toReturnWith(Promise.resolve(validateTokenResponse));
        });

        it("does not validate access token if present but accessTokenOptions not passed in", async () => {
            const msalResponse = {
                accessToken: "access-token",
                tokenType: "Bearer"
            } as AuthenticationResult;

            const validateTokenSpy = jest.spyOn(validator, "validateToken");

            const result = await validator.validateTokenFromResponse(msalResponse);

            expect(result).toEqual([]);

            expect(validateTokenSpy).toHaveBeenCalledTimes(0);
        });

        it("returns empty response array if no id token or access token on response", async () => {
            const msalResponse = {
                tokenType: "Bearer"
            } as AuthenticationResult;

            const validateTokenSpy = jest.spyOn(validator, "validateToken");

            const result = await validator.validateTokenFromResponse(msalResponse);

            expect(result).toEqual([]);

            expect(validateTokenSpy).toHaveBeenCalledTimes(0);
        });

        it("throws error if tokenType in response is not bearer", async () => {
            const msalResponse = {
                accessToken: "access-token",
                tokenType: "Basic"
            } as AuthenticationResult;

            await validator.validateTokenFromResponse(msalResponse)
                .catch((e) => {
                    expect(e).toBeInstanceOf(ValidationConfigurationError);
                    expect(e.errorCode).toContain(ValidationConfigurationErrorMessage.invalidAuthenticationScheme.code);
                    expect(e.errorMessage).toContain(ValidationConfigurationErrorMessage.invalidAuthenticationScheme.desc);
                });
        });

    });

    describe("validateToken", () => {

        it("returns defaults", async () => {
            const getJWKSSpy = jest.spyOn(validator, "getJWKS").mockReturnValue(Promise.resolve(TEST_CONSTANTS.DEFAULT_JWKS_URI_OIDC));

            mocked(jwtVerify).mockResolvedValue(joseMockResult);

            const validateClaimsSpy = jest.spyOn(validator, "validateClaims");

            const result = await validator.validateToken("token", defaultOptions);
            expect(result.token).toEqual("token");
            expect(result.payload).toBe(joseMockResult.payload);
            expect(result.protectedHeader).toBe(joseMockResult.protectedHeader);
            expect(result.tokenType).toBe(TokenType.JWT);

            expect(getJWKSSpy).toHaveBeenCalledTimes(1);
            expect(getJWKSSpy).toHaveBeenCalledWith(defaultValidationParams);
            expect(getJWKSSpy).toReturnWith(Promise.resolve(TEST_CONSTANTS.DEFAULT_JWKS_URI_OIDC));

            expect(validateClaimsSpy).toHaveBeenCalledTimes(1);
            expect(validateClaimsSpy).toHaveBeenCalledWith(joseMockResult.payload, defaultValidationParams);
        });

        it("throws missing token error when token is empty string", async () => {
            const testOptions: TokenValidationParameters = {
                validIssuers: [],
                validAudiences: []
            };

            await validator.validateToken("", testOptions)
                .catch((e) => {
                    expect(e).toBeInstanceOf(ValidationConfigurationError);
                    expect(e.errorCode).toContain(ValidationConfigurationErrorMessage.missingToken.code);
                    expect(e.errorMessage).toContain(ValidationConfigurationErrorMessage.missingToken.desc);
                });
        });

    });

    describe("getJWKS", () => {
        
        it("calls createLocalJWKSet with issuerSigningKeys if provided in params", async () => {
            const testParams: BaseValidationParameters = {
                ...defaultValidationParams,
                issuerSigningKeys: TEST_CONSTANTS.ISSUER_SIGNING_KEYS,
                issuerSigningJwksUri: TEST_CONSTANTS.DEFAULT_JWKS_URI_OIDC
            };
            const testJSONWebKeySet: JSONWebKeySet = {
                keys: TEST_CONSTANTS.ISSUER_SIGNING_KEYS
            };

            const mock = mocked(createLocalJWKSet);

            await validator.getJWKS(testParams);

            expect(mock).toHaveBeenCalledTimes(1);
            expect(mock).toHaveBeenCalledWith(testJSONWebKeySet);
        });
        
        it("calls createRemoteJWKSet with issuerSigningJwksUri if provided in params, and no issuerSigningKeys are provided", async () => {
            const testParams: BaseValidationParameters = {
                ...defaultValidationParams,
                issuerSigningJwksUri: TEST_CONSTANTS.DEFAULT_JWKS_URI_AAD
            };
            const testUri = new URL(TEST_CONSTANTS.DEFAULT_JWKS_URI_AAD);

            const mock = mocked(createRemoteJWKSet);

            await validator.getJWKS(testParams);

            expect(mock).toHaveBeenCalledTimes(1);
            expect(mock).toHaveBeenCalledWith(testUri);
        });
        
        it("calls createRemoteJWKSet with uri retrieved from metadata endpoint if no issuerSigningKeys or issuerSigningJwksUri provided in params", async () => {
            jest.spyOn(OpenIdConfigProvider.prototype, "fetchJwksUriFromEndpoint").mockReturnValue(Promise.resolve(TEST_CONSTANTS.DEFAULT_JWKS_URI_AAD));
            const mock = mocked(createRemoteJWKSet);

            await validator.getJWKS(defaultValidationParams);

            expect(mock).toHaveBeenCalledTimes(1);
            expect(mock).toHaveBeenCalledWith(new URL(TEST_CONSTANTS.DEFAULT_JWKS_URI_AAD));

        });

    });

    describe("setIssuerParams", () => {

        it("returns issuer if not empty", () => {
            const result = validator.setIssuerParams(defaultValidationParams);

            expect(result).toEqual(defaultValidationParams.validIssuers);
        });

        it("throw error if validIssuers is empty array", async () => {
            const testValidationParams: BaseValidationParameters = {
                ...defaultValidationParams,
                validIssuers: []
            };

            try {
                validator.setIssuerParams(testValidationParams);
            } catch (e) {
                expect(e).toBeInstanceOf(ValidationConfigurationError);

                const error = e as ValidationConfigurationError;
                expect(error.errorCode).toContain(ValidationConfigurationErrorMessage.emptyIssuer.code);
                expect(error.errorMessage).toContain(ValidationConfigurationErrorMessage.emptyIssuer.desc);
            }
        });

        it("throw error if validIssuers array contains empty string", async () => {
            const testValidationParams: BaseValidationParameters = {
                ...defaultValidationParams,
                validIssuers: [""]
            };

            try {
                validator.setIssuerParams(testValidationParams);
            } catch (e) {
                expect(e).toBeInstanceOf(ValidationConfigurationError);

                const error = e as ValidationConfigurationError;
                expect(error.errorCode).toContain(ValidationConfigurationErrorMessage.emptyIssuer.code);
                expect(error.errorMessage).toContain(ValidationConfigurationErrorMessage.emptyIssuer.desc);
            }

        });

    });

    describe("setAudienceParams", () => {

        it("returns audience if not empty", () => {
            const result = validator.setAudienceParams(defaultValidationParams);

            expect(result).toEqual(defaultValidationParams.validAudiences);
        });

        it("throw error if validAudiences is empty array", () => {
            const testValidationParams: BaseValidationParameters = {
                ...defaultValidationParams,
                validAudiences: []
            };

            try {
                validator.setAudienceParams(testValidationParams);
            } catch (e) {
                expect(e).toBeInstanceOf(ValidationConfigurationError);

                const error = e as ValidationConfigurationError;
                expect(error.errorCode).toContain(ValidationConfigurationErrorMessage.emptyAudience.code);
                expect(error.errorMessage).toContain(ValidationConfigurationErrorMessage.emptyAudience.desc);
            }
        });

        it("throw error if validAudiences array contains empty string", () => {
            const testValidationParams: BaseValidationParameters = {
                ...defaultValidationParams,
                validAudiences: [""]
            };

            try {
                validator.setAudienceParams(testValidationParams);
            } catch (e) {
                expect(e).toBeInstanceOf(ValidationConfigurationError);

                const error = e as ValidationConfigurationError;
                expect(error.errorCode).toContain(ValidationConfigurationErrorMessage.emptyAudience.code);
                expect(error.errorMessage).toContain(ValidationConfigurationErrorMessage.emptyAudience.desc);
            }
        });

    });

    describe("setClockTolerance", () => {

        it("returns clockSkew if set to positive integer", () => {
            const result = validator.setClockTolerance(300);

            expect(result).toEqual(300);
        });

        it("returns clockSkew if set to zero", () => {
            const result = validator.setClockTolerance(0);

            expect(result).toEqual(0);
        });

        it("throw error if validAudiences is negative integer", () => {
            try {
                validator.setClockTolerance(-1);
            } catch (e) {
                expect(e).toBeInstanceOf(ValidationConfigurationError);

                const error = e as ValidationConfigurationError;
                expect(error.errorCode).toContain(ValidationConfigurationErrorMessage.negativeClockSkew.code);
                expect(error.errorMessage).toContain(ValidationConfigurationErrorMessage.negativeClockSkew.desc);
            }
        });

    });

    describe("validateClaims", () => {

        it("throws error if nonce present in token but not passed in params", async () => {
            const testPayload: JWTPayload = {
                ...defaultPayload,
                nonce: TEST_CONSTANTS.NONCE
            };

            await validator.validateClaims(testPayload, defaultValidationParams)
                .catch((e) => {
                    expect(e).toBeInstanceOf(ValidationConfigurationError);
                    expect(e.errorCode).toContain(ValidationConfigurationErrorMessage.missingNonce.code);
                    expect(e.errorMessage).toContain(ValidationConfigurationErrorMessage.missingNonce.desc);
                });
        });

        it("throws error if nonce in token and nonce in params do not match", async () => {
            const testPayload: JWTPayload = {
                ...defaultPayload,
                nonce: TEST_CONSTANTS.NONCE
            };
            const testOptions: BaseValidationParameters = {
                ...defaultValidationParams,
                nonce: "12345"
            };

            await validator.validateClaims(testPayload, testOptions)
                .catch((e) => {
                    expect(e).toBeInstanceOf(ValidationError);
                    expect(e.errorCode).toContain(ValidationErrorMessage.invalidNonce.code);
                    expect(e.errorMessage).toContain(ValidationErrorMessage.invalidNonce.desc);
                });
        });
        
        it("does not check hash value if c_hash is not in token", async () => {
            const testOptions: BaseValidationParameters = {
                ...defaultValidationParams,
                code: TEST_HASH_CONSTANTS.CODE
            };
            const spy = jest.spyOn(validator, "checkHashValue");

            await validator.validateClaims(defaultPayload, testOptions); 

            expect(spy).toHaveBeenCalledTimes(0);
        });

        it("does not check hash value if c_hash is present in token but code not provided in params", async () => {
            const testPayload: JWTPayload = {
                ...defaultPayload,
                c_hash: TEST_HASH_CONSTANTS.C_HASH
            };

            const spy = jest.spyOn(validator, "checkHashValue");

            await validator.validateClaims(testPayload, defaultValidationParams); 

            expect(spy).toHaveBeenCalledTimes(0);
        });

        it("checks hash value if c_hash in token and code in params", async () => {
            const testPayload: JWTPayload = {
                ...defaultPayload,
                c_hash: TEST_HASH_CONSTANTS.C_HASH
            };
            const testOptions: BaseValidationParameters = {
                ...defaultValidationParams,
                code: TEST_HASH_CONSTANTS.CODE
            };
            const spy = jest.spyOn(validator, "checkHashValue");

            await validator.validateClaims(testPayload, testOptions); 

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith(TEST_HASH_CONSTANTS.CODE, TEST_HASH_CONSTANTS.C_HASH);
        });

        it("throws error if c_hash in payload and code in params, but does not pass hash check", async () => {
            const testPayload: JWTPayload = {
                ...defaultPayload,
                c_hash: TEST_HASH_CONSTANTS.C_HASH
            };
            const testOptions: BaseValidationParameters = {
                ...defaultValidationParams,
                code: TEST_HASH_CONSTANTS.INVALID_CODE
            };
            const spy = jest.spyOn(validator, "checkHashValue");

            await validator.validateClaims(testPayload, testOptions)
                .catch((e) => {
                    expect(e).toBeInstanceOf(ValidationError);
                    expect(e.errorCode).toContain(ValidationErrorMessage.invalidCHash.code);
                    expect(e.errorMessage).toContain(ValidationErrorMessage.invalidCHash.desc);

                    expect(spy).toHaveBeenCalledTimes(1);
                    expect(spy).toHaveBeenCalledWith(TEST_HASH_CONSTANTS.INVALID_CODE, TEST_HASH_CONSTANTS.C_HASH);
                });
        });
        
        it("does not check hash value if at_hash is not in token", async () => {
            const testOptions: BaseValidationParameters = {
                ...defaultValidationParams,
                accessTokenForAtHash: TEST_HASH_CONSTANTS.ACCESS_TOKEN_FOR_AT_HASH
            };
            const spy = jest.spyOn(validator, "checkHashValue");

            await validator.validateClaims(defaultPayload, testOptions); 

            expect(spy).toHaveBeenCalledTimes(0);
        });

        it("does not check hash value if at_hash is present in token but access token not provided in params", async () => {
            const testPayload: JWTPayload = {
                ...defaultPayload,
                at_hash: TEST_HASH_CONSTANTS.AT_HASH
            };

            const spy = jest.spyOn(validator, "checkHashValue");

            await validator.validateClaims(testPayload, defaultValidationParams); 

            expect(spy).toHaveBeenCalledTimes(0);
        });

        it("checks hash value if at_hash in token and access token in params", async () => {
            const testPayload: JWTPayload = {
                ...defaultPayload,
                at_hash: TEST_HASH_CONSTANTS.AT_HASH
            };
            const testOptions: BaseValidationParameters = {
                ...defaultValidationParams,
                accessTokenForAtHash: TEST_HASH_CONSTANTS.ACCESS_TOKEN_FOR_AT_HASH
            };
            const spy = jest.spyOn(validator, "checkHashValue");

            await validator.validateClaims(testPayload, testOptions); 

            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith(TEST_HASH_CONSTANTS.ACCESS_TOKEN_FOR_AT_HASH, TEST_HASH_CONSTANTS.AT_HASH);
        });

        it("throws error if at_hash in payload and access token in params, but does not pass hash check", async () => {
            const testPayload: JWTPayload = {
                ...defaultPayload,
                at_hash: TEST_HASH_CONSTANTS.AT_HASH
            };
            const testOptions: BaseValidationParameters = {
                ...defaultValidationParams,
                accessTokenForAtHash: TEST_HASH_CONSTANTS.INVALID_ACCESS_TOKEN_FOR_AT_HASH
            };
            const spy = jest.spyOn(validator, "checkHashValue");

            await validator.validateClaims(testPayload, testOptions)
                .catch((e) => {
                    expect(e).toBeInstanceOf(ValidationError);
                    expect(e.errorCode).toContain(ValidationErrorMessage.invalidAtHash.code);
                    expect(e.errorMessage).toContain(ValidationErrorMessage.invalidAtHash.desc);

                    expect(spy).toHaveBeenCalledTimes(1);
                    expect(spy).toHaveBeenCalledWith(TEST_HASH_CONSTANTS.INVALID_ACCESS_TOKEN_FOR_AT_HASH, TEST_HASH_CONSTANTS.AT_HASH);
                });
        });

    });

});
