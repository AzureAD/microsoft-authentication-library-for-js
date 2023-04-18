const { callEndpointWithToken } = require('../fetch');
const { msalConfig, REDIRECT_URI, POST_LOGOUT_REDIRECT_URI, protectedResources } = require('../authConfig');

const AuthProvider = require('../auth/AuthProvider');

const authProvider = new AuthProvider({
    msalConfig: msalConfig,
    redirectUri: REDIRECT_URI,
    postLogoutRedirectUri: POST_LOGOUT_REDIRECT_URI,
});

exports.getTodos = async (req, res, next) => {
    try {
        await authProvider.getToken(req, res, next, protectedResources.apiTodoList.scopes.read);
        const todoResponse = await callEndpointWithToken(
            protectedResources.apiTodoList.endpoint,
            req.session.accessToken,
            'GET'
        );
        res.render('todos', { isAuthenticated: req.session.isAuthenticated, todos: todoResponse.data });
    } catch (error) {
        next(error);
    }
};

exports.postTodo = async (req, res, next) => {
    try {
        if (!!req.body.description) {
            let todoItem = {
                description: req.body.description,
                owner: req.session.account.idTokenClaims.oid,
            };

            await authProvider.getToken(req, res, next, protectedResources.apiTodoList.scopes.write);
            await callEndpointWithToken(
                protectedResources.apiTodoList.endpoint,
                req.session.accessToken,
                'POST',
                todoItem
            );
            res.redirect('todos');
        } else {
            throw { error: 'empty request' };
        }
    } catch (error) {
        next(error);
    }
};

exports.deleteTodo = async (req, res, next) => {
    try {
        await authProvider.getToken(req, res, next, protectedResources.apiTodoList.scopes.write);
        await callEndpointWithToken(
            protectedResources.apiTodoList.endpoint,
            req.session.accessToken,
            'DELETE',
            req.body._id
        );
        res.redirect('todos');
    } catch (error) {
        next(error);
    }
};
