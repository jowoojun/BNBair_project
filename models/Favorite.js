var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var schema = new Schema({
    room_id : {type:String, required:true, index:true},
    user_id : {type:String, required:true},

    room_title : {type:String},
    room_city : {type:String},
});

var Favorite = mongoose.model('Favorite ', schema);

module.exports = Favorite;