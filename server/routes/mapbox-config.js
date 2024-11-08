var express = require('express');
var fs = require('fs');
var router = express.Router();

router.route('/projections')
    .get(function(req, res) {
        var data = getProjectionsData(req.query?.projectionName);
        res.send(data);
    })

router.route('/locations')
    .get(function(req, res) {
        var data = getLocationsData();
        res.send(data);
    })   

function getProjectionsData(projectionName) {
    var data = fs.readFileSync('server/data/projections.json', 'utf8');
    return projectionName ? JSON.parse(data).find(el => el.name == projectionName) : JSON.parse(data);
}

function getLocationsData() {
    var data = fs.readFileSync('server/data/locations.json', 'utf8');
    return JSON.parse(data);
}

module.exports = router;
