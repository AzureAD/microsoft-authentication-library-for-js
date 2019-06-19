import { BrowserCrypto } from './BrowserCrypto';
import { Base64 } from 'js-base64';
import { HashAlgorithm, getStringFromArrayBuffer, KeyFormat, utf8Encode, getArrayBufferFromString, KeyUsages, KeyGenAlgorithm, getJwkString } from './PopTokenCommon';
import { Utils } from './Utils';
import { DatabaseCache } from './DatabaseCache';
import { AuthenticationParameters } from './AuthenticationParameters';

type CachedKeyPair = {
    publicKey: CryptoKey,
    privateKey: CryptoKey,
    requestMethod: string,
    requestUri: string
}

export class PopTokenGenerator {
    private _crypto: BrowserCrypto;

    private static DB_VERSION = 1;
    private static DB_NAME = 'msal.db';
    private static TABLE_NAME =`${PopTokenGenerator.DB_NAME}.keys`;
    private _cache: DatabaseCache<CachedKeyPair>;

    // https://developer.mozilla.org/en-US/docs/Web/API/RsaHashedKeyGenParams
    private static MODULUS_LENGTH: number = 2048;
    private static PUBLIC_EXPONENT: Uint8Array = new Uint8Array([0x01, 0x00, 0x01]);
    private static HASH_LENGTH = 43; // 256 bit digest / 6 bits per char = 43

    private static KEY_USAGES = [KeyUsages.sign, KeyUsages.verify];
    private static EXTRACTABLE = true;

    constructor() {
        this._crypto = new BrowserCrypto(KeyGenAlgorithm.rsassa_pkcs1_v15,HashAlgorithm.sha256, PopTokenGenerator.MODULUS_LENGTH, PopTokenGenerator.PUBLIC_EXPONENT);

        this._cache = new DatabaseCache<CachedKeyPair>(PopTokenGenerator.DB_NAME, PopTokenGenerator.TABLE_NAME, PopTokenGenerator.DB_VERSION);
        this._cache.open();
    }

    /**
     * Generates a new proof-of-possession token.
     */
    async getNewToken(request: AuthenticationParameters): Promise<string> {
        // Generate new key pair
        const { publicKey, privateKey } = await this._crypto.generateKey(PopTokenGenerator.EXTRACTABLE, PopTokenGenerator.KEY_USAGES);

        // Export public to jwk, private key to unextractable CryptoKey
        const publicKeyJwk = await this._crypto.exportKey(publicKey, KeyFormat.jwk);
        const privateKeyJwk = await this._crypto.exportKey(privateKey, KeyFormat.jwk);
        const unextractablePrivateKey = await this._crypto.importKey(privateKeyJwk, KeyFormat.jwk, false, [ KeyUsages.sign ]);

        // Generate hash of public key
        const publicJwkString = getJwkString(publicKeyJwk);
        const publicJwkBuffer = await this._crypto.digest(HashAlgorithm.sha256, publicJwkString);
        const publicKeyDigest = getStringFromArrayBuffer(publicJwkBuffer);

        const publicKeyHash = Utils.encode(publicKeyDigest).substr(0, PopTokenGenerator.HASH_LENGTH);

        // Save key pair in cache
        await this._cache.put(publicKeyHash, {
            publicKey,
            privateKey: unextractablePrivateKey,
            requestMethod: request.requestMethod,
            requestUri: request.requestUri
        });

        const popTokenString = JSON.stringify({
            kid: publicKeyHash
        })

        return popTokenString;
    }

    /**
     * Signs an access token with the given pop key.
     * @param publicKeyHash Public key to sign payload with
     * @param payload Payload to sign
     */
    async signToken(accessToken: string): Promise<string> {
        const {
            cnf: {
                jwk: {
                    kid: publicKeyHash
                }
            }
        } = Utils.extractIdToken(accessToken);

        const {
            publicKey,
            privateKey,
            requestMethod,
            requestUri
        } = await this._cache.get(publicKeyHash);

        const publicKeyJwk = await this._crypto.exportKey(publicKey, KeyFormat.jwk);
        const publicJwkString = getJwkString(publicKeyJwk);

        const header = {
            alg: publicKeyJwk.alg,
            type: KeyFormat.jwk,
            jwk: JSON.parse(publicJwkString)
        };

        const encodedHeader = Utils.base64EncodeStringUrlSafe(utf8Encode(JSON.stringify(header)));

        const urlComponents = Utils.GetUrlComponents(requestUri);
        const uriPath = (urlComponents.AbsolutePath || "").replace(/\/+$/, "");
        const uriHost = urlComponents.HostNameAndPort || "";
        const uriQueryString = urlComponents.QueryString || "";

        const pS256 = await this._crypto.digest(HashAlgorithm.sha256, uriPath);
        const qS256 = await this._crypto.digest(HashAlgorithm.sha256, uriQueryString);

        const payload = {
            at: accessToken,
            ts: Utils.now(),
            m: requestMethod.toUpperCase(),
            u: uriHost,
            "p#S256": Utils.base64EncodeStringUrlSafe(getStringFromArrayBuffer(pS256)),
            "q#S256": Utils.base64EncodeStringUrlSafe(getStringFromArrayBuffer(qS256))
        }

        const encodedPayload = Utils.base64EncodeStringUrlSafe(utf8Encode(JSON.stringify(payload)));

        const tokenString = `${encodedHeader}.${encodedPayload}`;
        const tokenBuffer = getArrayBufferFromString(tokenString);

        const signatureBuffer = await this._crypto.sign(privateKey, tokenBuffer);
        const encodedSignature = Utils.base64EncodeStringUrlSafe(getStringFromArrayBuffer(signatureBuffer));
        const signedToken = `${tokenString}.${encodedSignature}`;

        return signedToken;
    }

    /**
     * Verifies a token is signed with the given pop key.
     * @param publicKeyHash Public key used to sign token
     * @param signedToken Signed pop token
     */
    async verifyToken(publicKeyHash: string, signedToken: string) {
        const [
            header,
            payload,
            signature
        ] = signedToken.split(".");

        const tokenString = `${header}.${payload}`;
        const tokenBuffer = getArrayBufferFromString(tokenString);
        const signatureBuffer = getArrayBufferFromString(Base64.decode(signature));

        const { publicKey } = await this._cache.get(publicKeyHash);

        return this._crypto.verify(publicKey, signatureBuffer, tokenBuffer);
    }
}
