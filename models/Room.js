var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var schema = new Schema({
    owner_id : {type:String, required:true},
    owner_name : {type:String, required:true},
    title: {type: String, required: true, trim: true},
    description: {type: String, trim: true},
    city: {type: String, required: true, index: true},
    post_number:{type: String, required:true, index:true},
    address: {type: String, required: true},
    price:{type: String, required: true},
    max_occupancy: {type:String, required: true},
    facilities:{type: String},
    role: {type: String},
    start_date: {type: Date, required:true},
    end_date: {type: Date, required:true},
    reply_count : {type:Number, default:0},
    reservation_count : {type:Number, default:0},
    filePath: {type: String, trim:true},
});

var Room = mongoose.model('Room', schema);

module.exports = Room;