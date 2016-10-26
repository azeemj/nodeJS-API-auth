




var mongoose = require('mongoose');
var accesstokenSchema = mongoose.Schema({
  clientId: String,
  device_id :String,
  token:String,
  ipadd:String,
  os:String,
  user_id:String,
  date: {type: Date, default: Date.now}
});

module.exports = mongoose.model('myaccesstokens', accesstokenSchema);