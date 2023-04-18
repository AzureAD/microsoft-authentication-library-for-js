const express = require('express');
const router = express.Router();

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
    todolistController.getTodos
);

router.delete(
    '/',
    isAuthenticated,
    todolistController.deleteTodo
);

router.post(
    '/',
    isAuthenticated,
    todolistController.postTodo
);

module.exports = router;