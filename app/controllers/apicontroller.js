/* 
 * This is used to build API communication over RESTFUL API
 */

var bcrypt = require('bcrypt-nodejs');
var jwt = require('jsonwebtoken');
var express = require('express'), approuter = express.Router(),
mongoose = require('mongoose');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var app = express();
var forEach = require('async-foreach').forEach;
var util = require('util');
var User = require('../.././app/models/myuser'); // get our mongoose model
var Client = require('../.././app/models/myclients');
var Accesstoken = require('../.././app/models/myaccesstoken');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var passport = require('passport');


//create a route with prefix
var apiRoutes_mobile = express.Router();

module.exports = app.use('/mobil-api/v1', apiRoutes_mobile);


/**
 * initilizing JWT token based authnetication in order to protect the API access 
 * @param {string} devic_token
 * @param string api_id
 * @param {string} password
 * @param String email
 * @return {json}array 
 */
apiRoutes_mobile.use(function (req, res, next) {
    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['token'];
    //get last parameter
    var requested_url = req.path;
    var requested_url_array = requested_url.split('/');
    var lastsegment = requested_url_array[requested_url_array.length - 1];

    // decode token
    if (token) {
        // verifies secret and checks exp
        jwt.verify(token, 'ilovescot', function (err, decoded) {
            if (err) {
                return res.json({success: false, content: {message: 'Failed to authenticate ,please try again.'}});
            } else {
                // if everything is good, save to request for use in other routes
                var api_id = req.body.api_id || req.query.api_id || req.headers['api_id'];
                Accesstoken.count({$and: [{'token': token}, {'user_id': req.headers.user_id}, {'clientId': api_id}]}, function (err, clientdata) {
                    if (clientdata == 0) {
                        return res.json({success: false, content: {message: 'Failed to authenticate ,please try again.'}});
                    } else {
                        req.decoded = decoded;
                        next();
                    }
                }
                );
            }
        });
    } else if (req.path == "/auth" || req.path == "/register") {

        next();
    } else {
        var err = new Error('Not Found');
        console.log(req.path);
        return res.status(403).send({
            success: false,
            content: {message: 'No token provided.'}
        });
        return res.status(404).send({
            success: false,
            content: {message: 'Page not found.'}
        });
    }


});

apiRoutes_mobile.get('/test', function (req, res) {
    console.log("test");
});

/**
 * tyhis is used to authenticate the user account
 * @param string name
 * @param string device_id
 * @param string api_id
 * @param string password
 * @return JSON
 * 
 */
apiRoutes_mobile.post('/auth', function (req, res) {
    var clientId = req.headers.api_id
    if (!req.headers.device_id)
        return res.json({success: false, content: {message: "Please send the device ID."}});
    if (!req.headers.api_id)
        return res.json({success: false, content: {message: "Please send the API key."}});
    if (!req.headers.email)
        return res.json({success: false, content: {message: "Please send the user email."}});
    if (!req.headers.password)
        return res.json({success: false, content: {message: "Please send the password."}});

    Client.findOne({clientId: clientId}, function (err, client) {
       if (err)
            return res.json({success: false, content: {message: "Wrong API key"}});
        console.log(client);
        if (!client) {
            return res.json({success: false, content: {message: "Wrong API key"}});
        }
        User.findOne({'local.email': req.headers.email}, function (err, user) {
            //console.log("test");process.exit();     
            if (err)
                throw err;

            if (!user) {
                console.log("three");
                return res.json({success: false, content: {message: 'Authentication failed. User not found.'}});
            } else if (user) {
                password = req.headers.password;
                username = req.headers.email;

                if (!bcrypt.compareSync(password, user.local.password)) {
                    // if password does not match

                    return res.json({success: false, content: {message: "Wrong password"}});
                } else {

                    // if everything is OK, return null as the error // and the authenticated user
                    con_cat = req.headers.device_id + '' + req.headers.email
                    var token = jwt.sign(con_cat, 'ilovescotchyscotch', {
                        expiresInMinutes: 1440// expires in 24 hours
                    });
                    var accesstok = new Accesstoken({
                        'clientId': clientId, "token": token, "device_id": req.headers.device_id, 'ip': '', 'os': "ios", 'user_id': user._id
                    });
                    Accesstoken.findOne({$and: [{'device_id': req.headers.device_id}, {'user_id': user._id}]}, function (err, checkaccesstoken) {
                        if (err)
                            throw err;


                        if (!checkaccesstoken)
                        {
                            accesstok.save(function (err, row) {
                                if (err)
                                    throw err;
                                // return the information including token as JSON
                                return res.json({
                                    success: true,
                                    content: {message: 'Authentication success',
                                        token: token,
                                        result: user, 'profile_img': profile_img}
                                });
                            });
                        } else {

                            checkaccesstoken.clientId = clientId;
                            checkaccesstoken.token = token;
                            checkaccesstoken.device_id = req.headers.device_id;
                            checkaccesstoken.ip = '198.168.1.20';
                            checkaccesstoken.os = "ios";
                            checkaccesstoken.user_id = user._id;
                            checkaccesstoken.save(function (err, row) {
                                if (err)
                                    throw err;
                                // return the information including token as JSON
                                return res.json({
                                    success: true,
                                    content: {message: 'Authentication success',
                                        token: token,
                                        result: user, 'profile_img': ''}
                                });
                            });
                        }

                    });
                }
            }

        });
    });
});


apiRoutes_mobile.post('/register', function (req, res) {
    req.headers.lname = '';
    if (!req.headers.fname)
        return res.json({success: false, content: {message: "Please enter the first name."}});
    /*if (!req.headers.lname)
     return res.json({success: false, content: {message: "Please enter the last name."}});*/
    if (!req.headers.email)
        return res.json({success: false, content: {message: "Please enter the email."}});
    if (!req.headers.password)
        return res.json({success: false, content: {message: "Please enter the  password."}});

    if (!req.headers.device_id)
        return res.json({success: false, content: {message: "Please enter the device token."}});
    if (!req.headers.api_id)
        return res.json({success: false, content: {message: "Please enter the api_id."}});
    clientId = req.headers.api_id;
    User.findOne({'local.email': req.headers.email}, {type: 0}, function (err, user) {
        // if there are any errors, return the error
        if (err)
            return done(err);
        // check to see if theres already a user with that email
        if (user) {

            return res.json({success: false, content: {message: 'The email is already registered.'}, newuser: 0});
        }
        if (req.user) {
            //var user = req.user;
            user.local.email = req.headers.email;
            user.local.password = user.generateHash(req.headers.password);
            user.local.firstName = req.headers.fname;
            user.local.lastName = req.headers.lname;

            user.save(function (err) {
                if (err)
                    throw err;
                // if everything is OK, return null as the error // and the authenticated user
                con_cat = req.headers.device_id + '' + req.headers.email
                var token = jwt.sign(con_cat, 'ilovescot', {
                    expiresInMinutes: 1440// expires in 24 hours
                });
                var accesstok = new Accesstoken({
                    'clientId': clientId, "token": token, "device_id": req.headers.device_id, 'ip': 'zxzxz', 'os': "android", 'user_id': user._id
                });
                Accesstoken.count({'device_id': req.headers.device_id}, function (err, checkaccesstoken) {
                    if (err)
                        throw err;
                    if (checkaccesstoken == 0)
                    {
                        accesstok.save(function (err, row) {
                            if (err)
                                throw err;
                            // return the information including token as JSON
                            return res.json({
                                success: true,
                                content: {message: 'Authentication success',
                                    token: token,
                                    result: user}
                            });
                        });
                    } else {

                        return res.json({
                            success: true,
                            content: {message: 'Authentication success',
                                token: token,
                                result: user}
                        });
                    }
                });
                //return res.json({success: true, content: {message: "Signup sucessfully."}});
            });



        }
    })
})
        ;
