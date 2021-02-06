const jwt = require('jsonwebtoken')
const jwksClient = require('jwks-rsa');

/**
 * Validates the access token for signature 
 * and against a predefined set of claims
 */
validateAccessToken = async(accessToken) => {

    if (!accessToken || accessToken === "" || accessToken === "undefined") {
        console.log('No tokens found');
        return false;
    }

    // we will first decode to get kid parameter in header
    const decodedToken = jwt.decode(accessToken, {complete: true});

    if (!decodedToken) {
        throw new Error('Token cannot be decoded')
    }

    // obtains signing keys from discovery endpoint
    let keys;

    try {
        keys = await getSigningKeys(decodedToken.header);        
    } catch (error) {
        console.log('Signing keys cannot be obtained');
        console.log(error);
    }

    // verify the signature at header section using keys
    const verifiedToken = jwt.verify(accessToken, keys);

    if (!verifiedToken) {
        throw new Error('Token cannot be verified');
    }

    console.log(verifiedToken);

    /**
     * Validates the token against issuer, audience, scope
     * and timestamp, though implementation and extent vary. For more information, visit:
     * https://docs.microsoft.com/azure/active-directory/develop/access-tokens#validating-tokens
     */

    const now = Math.round((new Date()).getTime() / 1000); // in UNIX format

    const checkTimestamp = verifiedToken["iat"] <= now && verifiedToken["exp"] >= now ? true : false;
    const checkAudience = verifiedToken['aud'] === process.env.CLIENT_ID || verifiedToken['aud'] === 'api://' + process.env.CLIENT_ID ? true : false;
    const checkScope = verifiedToken['scp'] === process.env.CLIENT_ID ? true : false;

    if (checkTimestamp && checkAudience && checkScope) {

        // token claims will be available in the request for the controller
        return true;
    }
    return false;
};

/**
 * Fetches signing keys of an access token 
 * from the authority discovery endpoint
 */
getSigningKeys = async(header) => {

    // In single-tenant apps, discovery keys endpoint will be specific to your tenant
    const jwksUri =`https://login.microsoftonline.com/common/discovery/v2.0/keys`

    const client = jwksClient({
        jwksUri: jwksUri
    });

    return (await client.getSigningKeyAsync(header.kid)).getPublicKey();
};

module.exports = validateAccessToken 
