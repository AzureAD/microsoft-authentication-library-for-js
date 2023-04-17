const { protectedResources } = require('../authConfig');
const { callEndpointWithToken } = require('../fetch');

exports.getTodos = async (req, res, next) => {
    try {
        const response = await callEndpointWithToken(
            protectedResources.apiTodoList.endpoint,
            req.session.accessToken,
            'GET'
        );
        res.render('todos', { isAuthenticated: req.session.isAuthenticated, todos: response.data });
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
