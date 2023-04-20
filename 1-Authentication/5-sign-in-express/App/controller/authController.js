const AuthProvider = require('../auth/AuthProvider');

const { 
    msalConfig, 
    REDIRECT_URI, 
    POST_LOGOUT_REDIRECT_URI 
} = require('../authConfig');

const authProvider = new AuthProvider({
    msalConfig: msalConfig,
    redirectUri: REDIRECT_URI,
    postLogoutRedirectUri: POST_LOGOUT_REDIRECT_URI,
});

exports.signIn = async (req, res, next) => {
    return authProvider.login(req, res, next);
};

exports.handleRedirect = async (req, res, next) => {
    return authProvider.handleRedirect(req, res, next);
}

exports.signOut = async (req, res, next) => {
    return authProvider.logout(req, res, next);
};
