var express = require('express'),
    User = require('../models/User');
    Room = require('../models/Room');
    Booking = require('../models/Booking');
    Post = require('../models/Post');
    Favorite = require('../models/Favorite');
var router = express.Router();

function needAuth(req, res, next) {
    if (req.user) {
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

// 숙소 예약 페이지
router.get('/:id/booking',function(req,res) {
  Room.findById(req.params.id, function(err, room) {
      Post.find({room_id : req.params.id}, function(err, posts){
          User.findById(req.user.id, function(err, user){
            res.render('rooms/book', {user:user, room:room, posts:posts});
        });
      });
  });
});


// 숙소 상세정보 페이지
router.get('/:id', function(req,res,next){
  Room.findById(req.params.id, function(err, room) {
    Post.find({room_id : req.params.id}, function(err, posts){
      if(!(req.user)){
        res.render('rooms/room',{user:{}, room:room, posts:posts});
      }else{
        User.findById(req.user.id, function(err, user){
          res.render('rooms/room', {user:user, room:room, posts:posts});
        });
      }
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
  User.findById(req.user.id, function(err, user){
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

// 후기남기기
router.post('/:id/post',needAuth,function(req,res) {
  Room.update({_id:req.params.id}, {$inc: {"reply_count" : 1}}, function(err, result){
    User.findById(req.user.id, function(err,user){
      Room.findById(req.params.id, function(err, room){ 
          var newPost = new Post({
              room_id: req.params.id,
              room_hostname: room.owner_name,
              user_id: req.user.id,
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
});

router.post('/:id/comment',needAuth,function(req,res) {
  Post.update(req.params._id, {$set:{ comment : req.body.comment }}, function(err, results) {
    if (err) {
      res.send(err);
    } else {
      res.redirect('back');
    }
  });
});

router.post('/:id/Favorite',needAuth,function(req,res) {
  Room.findById(req.params.id, function(err, room){ 
    User.findById(req.user.id, function(err,user){
      var newFavorite = new Favorite({
          room_id: req.params.id,
          user_id: req.user.id,
          room_title : room.title,
          room_city : room.city
      });  

      newFavorite.save(function(err){
        if (err) {
          res.send(err);
        } else {
          req.flash('success', 'Favorite 목록에 추가되었습니다.');
          res.redirect('back');
        }
      });
    });
  });
});
module.exports = router;
