

/**
 * 
 * importing all necessary libraries
 */
var nodemailer = require('nodemailer');
var passport = require('passport');
var multer  = require('multer');
var bcrypt = require('bcrypt-nodejs');
var async = require('async');
var crypto = require('crypto');
var express = require('express'),

glob = require('glob'),
mongoose = require('mongoose');
require('./config/passport')(passport);
var cors = require('cors')
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(cors());
var mongoose = require('mongoose');
var configDB = require('./config/database.js');
//configuration ===============================================================
mongoose.connect(configDB.url); 
var db = mongoose.connection;
db.on('error', function () {
  throw new Error('unable to connect to database at ' + config.db);
});

app.use(require('./app/controllers/apicontroller.js'))

// routes ======================================================================
require('./config/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

port=8001;
//launch ======================================================================

var models = glob.sync(configDB.root + '/app/models/*.js');
models.forEach(function (model) {
  require(model);
});
 var controllers = glob.sync(configDB.root + '/app/controllers/*.js');
  controllers.forEach(function (controller) {
    require(controller)(app);
  });

//catch 404 and forward to error handler
app.use(function (req, res, next) {
  return res.json({success: 404, content: {message: 'Sorry, page not found.'}});
});

app.use(function (req, res, next) {
    //res.status(500).render('404', {title: "Sorry, page not found"});
     return res.json({success: 404, content: {message: 'Sorry, page not found.'}});
});
exports = module.exports = app;

/**
 * 
 * Establising a node js intance serivce 
 *
 */
app.listen(port, function () {
  console.log('Express server listening on port ' + port);
});

