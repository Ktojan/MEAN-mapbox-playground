var express = require('express');
var fs = require('fs');
var datafile = 'server/data/draws.json';
var router = express.Router();

router.route('/')
    .get(function(req, res) {
        var data = getDrawsData(req.query?.location);
        res.send(data);
    })

    .post(function(req, res) {
        var data = getDrawsData();
        var newDraw = { ...req.body };
        data.push(newDraw);
        saveDrawData(data);
        res.set('Content-Type', 'application/json');
        res.status(201).send(newDraw);
    });

router.route('/:name')   

    .delete(function(req, res) {
        var data = getDrawsData();
        var pos = data.map(function(e) {
            return e.name;
        }).indexOf(req.params.name);
        if (pos > -1) {
            data.splice(pos, 1);
        } else {
            res.sendStatus(404);
        }
        saveDrawData(data);
        res.sendStatus(204);
    })


function getDrawsData(location) {
    var data = fs.readFileSync(datafile, 'utf8');
    return location ? JSON.parse(data).filter(draw => draw.location == location) : JSON.parse(data);
}

function saveDrawData(data) {
    fs.writeFile(datafile, JSON.stringify(data, null, 4), function (err) {
        if (err) {
            console.log(err);
        }
    });
}

module.exports = router;
