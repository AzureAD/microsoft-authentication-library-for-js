var express = require('express');
var crypto = require("node:crypto");
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    const randomBytes = crypto.randomBytes(48);
    res.render('index', { 
        title: 'Express',
        entropy: randomBytes.join(",")
    });
});

module.exports = router;
