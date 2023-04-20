const authProvider = require('../auth/AuthProvider');

exports.signIn = async (req, res, next) => {
    return authProvider.login(req, res, next);
};

exports.handleRedirect = async (req, res, next) => {
    return authProvider.handleRedirect(req, res, next);
}

exports.signOut = async (req, res, next) => {
    return authProvider.logout(req, res, next);
};