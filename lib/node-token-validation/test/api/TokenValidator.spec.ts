import { TokenValidator } from './../../src/api/TokenValidator';
import { Configuration } from './../../src/config/Configuration';
import { TEST_CONSTANTS, TEST_HASH_CONSTANTS } from './../utils/TestConstants';
import { TokenValidationParameters } from '../../src';
import { ValidationConfigurationError, ValidationConfigurationErrorMessage } from '../../src/error/ValidationConfigurationError';
import { createLocalJWKSet, createRemoteJWKSet, JSONWebKeySet, JWTPayload, jwtVerify, JWTVerifyResult, ResolvedKey } from 'jose';
import { mocked } from 'jest-mock';
import { TokenType } from '../../src/utils/Constants';
import { BaseValidationParameters } from '../../src/config/TokenValidationParameters';
import { ValidationError, ValidationErrorMessage } from '../../src/error/ValidationError';
import { OpenIdConfigProvider } from '../../src/config/OpenIdConfigProvider';
import 'regenerator-runtime';

jest.mock('jose');

describe("TokenValidator", () => {
    let config: Configuration = {
        auth: {
            clientId: TEST_CONSTANTS.CLIENT_ID
        }
    };

    let joseMockResult: (JWTVerifyResult & ResolvedKey) = {
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

    let defaultOptions: TokenValidationParameters = {
        validIssuers: ["issuer"],
        validAudiences: ["audiences"]
    };

    let defaultValidationParams: BaseValidationParameters = {
        validIssuers: ["issuer"],
        validAudiences: ["audiences"],
        validAlgorithms: [TEST_CONSTANTS.DEFAULT_ALGORITHM],
        validTypes: [TEST_CONSTANTS.DEFAULT_TYPE],
        requireExpirationTime: true,
        requireSignedTokens: true,
    };

    let defaultPayload: JWTPayload = {
        aud: "audience"
    }
    let validator: TokenValidator;

    beforeEach(() => {
        validator = new TokenValidator(config);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("exports a class", () => {
        const validator = new TokenValidator(config);
        expect(validator).toBeInstanceOf(TokenValidator);
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
            }

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
            jest.spyOn(OpenIdConfigProvider.prototype, 'fetchJwksUriFromEndpoint').mockReturnValue(Promise.resolve(TEST_CONSTANTS.DEFAULT_JWKS_URI_AAD));
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
                validator.setIssuerParams(testValidationParams)
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
                validator.setIssuerParams(testValidationParams)
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
                validator.setAudienceParams(testValidationParams)
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
                validator.setAudienceParams(testValidationParams)
            } catch (e) {
                expect(e).toBeInstanceOf(ValidationConfigurationError);

                const error = e as ValidationConfigurationError;
                expect(error.errorCode).toContain(ValidationConfigurationErrorMessage.emptyAudience.code);
                expect(error.errorMessage).toContain(ValidationConfigurationErrorMessage.emptyAudience.desc);
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
