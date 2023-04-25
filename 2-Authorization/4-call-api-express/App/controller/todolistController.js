const { callEndpointWithToken } = require('../fetch');
const { protectedResources } = require('../authConfig');

exports.getToDos = async (req, res, next) => {
    try {
        const todoResponse = await callEndpointWithToken(
            protectedResources.toDoListAPI.endpoint,
            req.session.accessToken,
            'GET'
        );
        res.render('todos', { isAuthenticated: req.session.isAuthenticated, todos: todoResponse.data });
    } catch (error) {
        next(error);
    }
};

exports.postToDo = async (req, res, next) => {
    try {
        if (!!req.body.description) {
            let todoItem = {
                description: req.body.description,
            };

            await callEndpointWithToken(
                protectedResources.toDoListAPI.endpoint,
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

exports.deleteToDo = async (req, res, next) => {
    try {
        await callEndpointWithToken(
            protectedResources.toDoListAPI.endpoint,
            req.session.accessToken,
            'DELETE',
            req.body._id
        );
        res.redirect('todos');
    } catch (error) {
        next(error);
    }
};
