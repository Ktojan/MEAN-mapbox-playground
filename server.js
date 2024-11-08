var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var markers = require('./server/routes/markers');
var draws = require('./server/routes/draws');
var mapboxConfig = require('./server/routes/mapbox-config');
var errors = require('./server/routes/errors');
const cors = require('cors')

var app = express();

// view engine setup
app.set('views', path.join(__dirname, '/server/views'));
app.set('view engine', 'jade');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'dist')));
app.use(cors());

app.use('/api/markers', markers);
app.use('/api/draws', draws);
app.use('/api/mapbox-config', mapboxConfig);
app.use('/api/errors', errors);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


app.set('port', process.env.PORT || 3000);

app.listen(app.get('port'));

console.log('Listening on port: ' + app.get('port'));

module.exports = app;
