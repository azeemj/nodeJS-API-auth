



var mongoose = require('mongoose');
var clientSchema = mongoose.Schema({
   name: String,
  clientId: String,
  clientSecret :String,
  token:String
});

module.exports = mongoose.model('clients', clientSchema);