var express = require('express');
var fs = require('fs');
var router = express.Router();

router.route('/500')
    .get(function(req, res) {
        res.status(500).send('Server error.');
    });

router.route('/401')
    .get(function(req, res) {
        res.status(401).send('#########  unauthorized.');
    });

module.exports = router;
