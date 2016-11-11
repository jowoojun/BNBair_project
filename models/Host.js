var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var schema = new Schema({
  name: {type: String, required: true, trim: true},
  email: {type: String, required: true, index: true, unique: true, trim: true},
  password: {type: String, required: true},
  ifHost : {type:Boolean, default:false},
  ifRoot : {type:Boolean, default:false},
  rooms : {type: Array}
});

var Host = mongoose.model('Host', schema);

module.exports = Host;