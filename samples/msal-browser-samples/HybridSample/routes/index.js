var express = require('express');
const dotenv = require('dotenv');
var router = express.Router();

dotenv.config();

const data = {
    title: 'MSAL Hybrid Sample App',
    clientId: process.env.MSAL_CLIENT_ID
}

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', {
        ...data,
        isAuthenticated: req.session.isAuthenticated
    });
});

module.exports = router;
