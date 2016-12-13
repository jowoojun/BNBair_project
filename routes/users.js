var express = require('express'),
    User = require('../models/User');
    Room = require('../models/Room');
    Booking = require('../models/Booking');
    Favorite = require('../models/Favorite');
var router = express.Router();
var multer = require('multer');
var upload = multer({ dest: '/tmp' });

function needAuth(req, res, next) {
    if (req.user) {
      next();
    } else {
      req.flash('danger', '로그인이 필요합니다.');
      res.redirect('/signin');
    }
}

function Room_validateForm(form){
  var title = form.title || "";
  var city = form.city || "";
  title = title.trim();
  city = city.trim();

  if(!title){
    return '방이름을 입력해주세요.';
  }

  if(!city){
    return '도시를 입력해주세요.'; 
  }

  if(!form.start_date){
    return '시작날짜를 입력해주세요.';
  }
  
  if(!form.end_date){
    return '종료날짜를 입력해주세요.';
  }

  if(!form.address){
    return '방 주소를 입력해주세요.';
  }

  if(!form.price){
    return '가격을 입력해주세요.';
  }

  if(!form.max_occupancy){
    return '최대 숙박인원을 입력해주세요.';
  }
  return null;
}

// GET
// 사용자 목록 화면
router.get('/', needAuth, function(req, res, next) {
    var email = req.user.email.trim();

    if(email === "root@com"){
       User.find({}, function(err, users) {
          if (err) {
            return next(err);
          }
          User.findById(req.user, function(err, user) {
            if (err) {
              return next(err);
            }
            res.render('users/userList', {users: users,user:user});
          });
        });
    }
    else{
        res.redirect('../');
    }
});

// 개인 화면
router.get('/:id', function(req, res, next) {
  User.findById(req.params.id, function(err, user) {
    if (err) {
      return next(err);
    }

    res.render('users/show', {user: user});
  });
});

// 사용자 정보 편집 화면
router.get('/:id/edit', needAuth, function(req, res, next) {
  User.findById(req.params.id, function(err, user) {
    if (err) {
      return next(err);
    }
    res.render('users/edit', {user: user});
  });
});

// 프로필보기
router.get('/:id/profile', function(req, res, next) {
  User.findById(req.params.id, function(err, user) {
    Post.find({user_id: req.params.id},function(err,posts){
      Favorite.find({user_id: req.params.id}, function(err, favorites){
        if (err) {
          return next(err);
        }

        res.render('users/profile', {user: user, posts: posts, favorites: favorites});
      });
    });
  });
});

// 예약확인 화면
router.get('/:id/reservation',needAuth,  function(req, res, next) {
  User.findById(req.params.id, function(err, user) {
    if (err) {
      return next(err);
    }
    
    Booking.find({user_id: req.params.id}, function(err, bookings){
      Booking.find({owner_id:req.params.id}, function(err, bookeds){
        res.render('users/reservation', {user:user, bookings:bookings, bookeds: bookeds});
      });
    });
  });
});

// 메시지 화면
router.get('/:id/message',needAuth,  function(req, res, next) {
  User.findById(req.params.id, function(err, user) {
    if (err) {
      return next(err);
    }

    Booking.find({owner_id: req.params.id, currentState : false}, function(err, bookings){
      res.render('users/message', {user:user, bookings:bookings});
    });
  });
});

// Favorite 화면
router.get('/:id/favorite',needAuth,  function(req, res, next) {
  User.findById(req.params.id, function(err, user) {
    Favorite.find({user_id:req.params.id}, function(err, favorites){
      if (err) {
        return next(err);
      }

      res.render('users/favorite', {user:user, favorites:favorites});
    });
  });
});

// 호스트 되기 화면
router.get('/:id/host',needAuth,  function(req, res, next) {
    User.findById(req.params.id, function(err, user) {
    if (err) {
      return next(err);
    }
    
    res.render('users/host', {user: user});
  });
});

// 숙소등록화면
router.get('/:id/register',needAuth,  function(req, res, next) {
  User.findById(req.params.id, function(err, user) {
    if (err) {
      return next(err);
    }
    
    res.render('user_host/register', {user: user});
  });
});

// 숙소정보화면
router.get('/:id/rooms', needAuth, function(req, res, next) {
  User.findById({_id: req.params.id}, function(err, user) {
    if (err) {
      return next(err);
    }
    Room.find({owner_id: user._id},function(err, rooms){
      res.render('user_host/rooms', {user: user, rooms:rooms});
    });
  });
});

// POST
// 호스트 등록
router.post('/:id', function(req, res, next) {
  User.findById(req.params.id, function(err, user) {
    if (err) {
      return next(err);
    }

    user.ifHost = true;
    
    user.save(function(err) {
      if (err) {
        return next(err);
      } else {
        req.flash('success', 'Host로 등록되셨습니다.');
        res.redirect('/');
      }
    });
  });
});

// 숙소등록
router.post('/:id/register', upload.single("file"), function(req, res, next) {
  var err = Room_validateForm(req.body);
    if (err) {
      req.flash('danger', err);
      return res.redirect('back');
    }

  User.findById(req.params.id, function(err, user) {
    if (err) {
      return next(err);
    }    
    
    var newRoom = new Room({
      owner_id: req.params.id,
      owner_name: user.name,
      title: req.body.title,
      description: req.body.description,
      city: req.body.city,
      post_number:req.body.post_number,
      address: req.body.address,
      price: req.body.price,
      facilities: req.body.facilities,
      role: req.body.role,
      max_occupancy : req.body.max_occupancy,
      start_date: req.body.start_date,
      end_date: req.body.end_date,
      filePath : req.body.url
    }); 

    newRoom.save(function(err) {
      if (err) {
        req.flash('danger',err);
        res.redirect('back');
      } else {
        req.flash('success', '새로운 숙소가 등록되었습니다.');
        res.redirect('/');
      }
    });
  });
});

// 예약 승인
router.post('/:id/confirm',function(req,res) {
    Booking.findById(req.params.id, function(err, booking){
      Booking.update({_id:req.params.id,currentState:false}, {$set:{ currentState:true }}, function(err, results) {
          Room.update({_id: booking.room_id}, {$inc:{ "reservation_count" : 1}}, function(err, room){
              if(err){
                  res.send(err);
              }
              req.flash('success', '예약이 승인처리되었습니다.');
              res.redirect('back');
          
          });
        });
    });
});

// DELETE
// 예약 거절
router.delete('/:id/message', function(req, res) {
  Booking.findOneAndRemove({_id: req.params.id}, function(err) {
    if (err) {
        return console.log(err);
    }
    req.flash('success', '예약 요청을 거절했습니다.');
    res.redirect('back');
  });
});

// 예약 취소
router.delete('/:id/reservation', function(req, res) {
  Booking.findById(req.params.id, function(err, booking){
    Room.update({_id: booking.room_id}, {$inc:{ "reservation_count" : -1}}, function(err, room){
      Booking.findOneAndRemove({_id: req.params.id}, function(err) {
          if (err) {
              return console.log(err);
          }
          req.flash('success', '예약을 취소했습니다.');
          res.redirect('back');
      });
    });
  });
});

// favorite 삭제
router.delete('/:id/favorite', function(req, res) {
    Favorite.findOneAndRemove({_id: req.params.id}, function(err) {
        if (err) {
            return console.log(err);
        }
        req.flash('success', 'favorite를 삭제했습니다.');
        res.redirect('back');
    });
});

module.exports = router;