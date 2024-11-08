var express = require('express');
var fs = require('fs');
var datafile = 'server/data/markers.json';
var router = express.Router();

router.route('/')
    .get(function(req, res) {
        var data = getMarkersData(req.query?.location);
        res.send(data);
    })

    .post(function(req, res) {
        var data = getMarkersData();
        var nextID = getNextAvailableID(data);

        var newMarker = {
            id: nextID,
            name: req.body.name,
            location: req.body.location,
            coords: req.body.coords
        };

        data.push(newMarker);
        saveMarkerData(data);
        res.set('Content-Type', 'application/json');
        res.status(201).send(newMarker);
    });

router.route('/:id')

    .put(function(req, res) {
        var markers = getMarkersData();
        var markerToUpdate = markers.find(function(item) {
            return item.id == req.params.id;
        });
        if(!markerToUpdate) {
            res.sendStatus(404);
        } else {
            markerToUpdate.coords = req.body.coords;
            saveMarkerData(markers);
            res.sendStatus(204);
        }
    })

    .delete(function(req, res) {
        var data = getMarkersData();
        var pos = data.map(function(e) {
            return e.id;
        }).indexOf(parseInt(req.params.id, 10));
        if (pos > -1) {
            data.splice(pos, 1);
        } else {
            res.sendStatus(404);
        }
        saveMarkerData(data);
        res.sendStatus(204);
    })

   

function getNextAvailableID(allMarkers) {
    var maxID = 0;
    allMarkers.forEach(function(element, index, array) {
        if(element.id > maxID) {
            maxID = element.id;
        }
    });
    return ++maxID;
}

function getMarkersData(location) {
    var data = fs.readFileSync(datafile, 'utf8');
    return location ? JSON.parse(data).filter(marker => marker.location == location) : JSON.parse(data);
}

function saveMarkerData(data) {
    fs.writeFile(datafile, JSON.stringify(data, null, 4), function (err) {
        if (err) {
            console.log(err);
        }
    });
}

module.exports = router;
