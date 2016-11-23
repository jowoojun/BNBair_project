var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var schema = new Schema({
    room_id : {type:String, required:true, index:true},
    owner_id :{type:String, required:true},
    user_id : {type:String, required:true},
    user_name : {type:String, required:true},

    room_title : {type:String},
    occupancy : {type:String},
    start_date: {type: Date, required:true},
    end_date: {type: Date, required:true},
    currentState: {type:Boolean, default:false}
});

var Booking = mongoose.model('Booking', schema);

module.exports = Booking;