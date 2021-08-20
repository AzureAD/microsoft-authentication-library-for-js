var express = require('express');
const dotenv = require('dotenv');
var router = express.Router();

dotenv.config();

const data = {
    title: 'MSAL Hybrid Sample App',
    clientId: process.env.MSAL_CLIENT_ID
}

console.log('data', data);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', data);
});

router.get('/client-redirect', function(req, res, next) {
  res.render('index', data);
});

module.exports = router;
