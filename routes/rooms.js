var express = require('express'),
    User = require('../models/User');
    Room = require('../models/Room');
    Booking = require('../models/Booking');
    Post = require('../models/Post');
var router = express.Router();

function needAuth(req, res, next) {
    if (req.session.user) {
      next();
    } else {
      req.flash('danger', '로그인이 필요합니다.');
      res.redirect('/signin');
    }
}

function validateForm(form, options) {

  if(form.end_date > room.end_date){
    return '체크아웃 날짜를 확인해주세요.';
  }
  if(form.start_date < room.start_date){
    return '체크인 날짜를 확인해주세요.';
  }
  if(parseInt(room.max_occupancy) < parseInt(form.occupancy)){
    return '최대 숙박인원을 확인해주세요.';
  }

  return null;
}

// GET
// 숙소 목록 페이지
router.get('/', function(req,res,next){
  Room.find({}, function(err, rooms) {
    res.render('rooms/list',{rooms:rooms});
  });
});

// 숙소 상세정보 페이지
router.get('/:id', function(req,res,next){
  Room.findById(req.params.id, function(err, room) {
    Post.find({room_id : req.params.id}, function(err, posts){
      res.render('rooms/room', {room:room, posts:posts});
    });
  });
});

// Post
// 예약 기능
router.post('/:id/booking',function(req,res) {
  // var err = validateForm(req.body);
  // if (err) {
  //   req.flash('danger', err);
  //   return res.redirect('back');
  // }
  User.findById(req.session.user, function(err, user){
    Room.findById(req.params.id, function(err, room){
      var newBooking = new Booking({
          room_id: req.params.id,
          room_title : room.title,
          occupancy: req.body.occupancy,
          start_date: req.body.start_date,
          end_date:req.body.end_date,
          user_id: user._id,
          owner_id : room.owner_id,
          user_name : user.name
      }); 

    
      newBooking.user_name = user.name; 

      newBooking.save(function(err){
        if (err) {
          res.send(err);
        } else {
          req.flash('success', '예약 신청이 완료되었습니다. 호스트가 승인하면 예약이 완료됩니다.');
          res.redirect('/rooms');
        }
      });
    });
  });
});

router.post('/:id/post',needAuth,function(req,res) {
  Room.findById(req.params._id, function(err, room){ 
    User.findById(req.session.user, function(err,user){
      var newPost = new Post({
          room_id: req.params.id,
          user_name: user.name,
          content: req.body.reply
      });  

      newPost.save(function(err){
        if (err) {
          res.send(err);
        } else {
          req.flash('success', '후기를 남겨주셔서 감사합니다.');
          res.redirect('back');
        }
      });
    });
  });
});

module.exports = router;
