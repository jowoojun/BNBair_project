var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var schema = new Schema({
  name: {type: String, required: true, trim: true},
  email: {type: String, required: true, index: true, unique: true, trim: true},
  password: {type: String, required: true},
  passwordSalt: {type:String},
  ifHost : {type:Boolean, default:false},
  ifRoot : {type:Boolean, default:false},
  reservation : {type:Array},
  rooms : {type: Array},
  createdAt: {type: Date, default: Date.now}
});

var User = mongoose.model('User', schema);

module.exports = User;