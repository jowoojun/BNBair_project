var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var schema = new Schema({
    title: {type: String, required: true, trim: true},
    description: {type: String, trim: true},
    city: {type: String, required: true, index: true},
    postNumber:{type: String, required:true, index:true},
    address: {type: String, required: true},
    price:{type: String, required: true},
    facilities:{type: String},
    role: {type: String},
    uid : {type:String}
});

var Room = mongoose.model('Room', schema);

module.exports = Room;