const express = require('express');
const router = express.Router();
const { getToken } = require('./auth');
const { protectedResources } = require('../authConfig');
const todolistController = require('../controller/todolistController');

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
    isAuthenticated, // check if user is authenticated
    getToken(protectedResources.apiTodoList.scopes.write),
    todolistController.deleteTodo
);

router.post(
    '/',
    isAuthenticated, // check if user is authenticated
    getToken(protectedResources.apiTodoList.scopes.write),
    todolistController.postTodo
);

module.exports = router;