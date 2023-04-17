const express = require('express');
const router = express.Router();

const todolistController = require('../controller/todolistController');
const { protectedResources } = require('../authConfig');
const { getToken } = require('./auth');

// custom middleware to check auth state
function isAuthenticated(req, res, next) {
    if (!req.session.isAuthenticated) {
        return res.redirect('/auth/signin'); // redirect to sign-in route
    }

    next();
}

router.get(
    '/',
    isAuthenticated, // check if user is authenticated
    getToken(protectedResources.apiTodoList.scopes.read),
    todolistController.getTodos
);

router.delete(
    '/',
    isAuthenticated,
    getToken(protectedResources.apiTodoList.scopes.write),
    todolistController.deleteTodo
);

router.post(
    '/',
    isAuthenticated,
    getToken(protectedResources.apiTodoList.scopes.write),
    todolistController.postTodo
);

module.exports = router;