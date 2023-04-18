const AuthProvider = require('../auth/AuthProvider');
const { msalConfig, REDIRECT_URI, POST_LOGOUT_REDIRECT_URI } = require('../authConfig');

const authProvider = new AuthProvider({
    msalConfig: msalConfig,
    redirectUri: REDIRECT_URI,
    postLogoutRedirectUri: POST_LOGOUT_REDIRECT_URI,
});


exports.signinUser = async (req, res, next) => {
    let postLoginRedirectUri;
    let scopesToConsent;

    if (req.query && req.query.postLoginRedirectUri) {
        postLoginRedirectUri = decodeURIComponent(req.query.postLoginRedirectUri);
    }

    if (req.query && req.query.scopesToConsent) {
        scopesToConsent = decodeURIComponent(req.query.scopesToConsent);
    }

    return authProvider.login(req, res, next, { postLoginRedirectUri, scopesToConsent });
};

exports.handleRedirect = async (req, res, next) => {
    return authProvider.handleRedirect(req, res, next);
}

exports.signoutUser = async (req, res, next) => {
    return authProvider.logout(req, res, next);
};