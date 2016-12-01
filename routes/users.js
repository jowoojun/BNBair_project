var express = require('express'),
    User = require('../models/User');
    Room = require('../models/Room');
    Booking = require('../models/Booking');
    Favorite = require('../models/Favorite');
var pbkdf2Password = require('pbkdf2-password');
var fs = require("fs");
var multer = require('multer');
var upload = multer({ dest: '/tmp' });
var router = express.Router();
var hasher = pbkdf2Password();
function needAuth(req, res, next) {
    if (req.user) {
      next();
    } else {
      req.flash('danger', '로그인이 필요합니다.');
      res.redirect('/signin');
    }
}

function validateForm(form, options) {
  var name = form.name || "";
  var email = form.email || "";
  name = name.trim();
  email = email.trim();

  if (!name) {
    return '이름을 입력해주세요.';
  }

  if (!email) {
    return '이메일을 입력해주세요.';
  }

  if (!form.password && options.needPassword) {
    return '비밀번호를 입력해주세요.';
  }

  if (form.password !== form.password_confirmation) {
    return '비밀번호가 일치하지 않습니다.';
  }

  if (form.password.length < 6) {
    return '비밀번호는 6글자 이상이어야 합니다.';
  }

  return null;
}

function edit_validateForm(form, options) {
  var name = form.name || "";
  var email = form.email || "";
  name = name.trim();
  email = email.trim();

  if (!name) {
    return '이름을 입력해주세요.';
  }

  if (!email) {
    return '이메일을 입력해주세요.';
  }

  if (!form.password && options.needPassword) {
    return '비밀번호를 입력해주세요.';
  }

  if (form.change_password !== form.password_confirmation) {
    return '비밀번호가 일치하지 않습니다.';
  }

  if (form.change_password.length < 6) {
    return '비밀번호는 6글자 이상이어야 합니다.';
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
            res.render('users/index', {users: users,user:user});
          });
        });
    }
    else{
        res.redirect('../');
    }
});

// 회원가입화면
router.get('/new', function(req, res, next) {
  res.render('new', {messages: req.flash()});
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

// 개인 화면
router.get('/:id', function(req, res, next) {
  User.findById(req.params.id, function(err, user) {
    if (err) {
      return next(err);
    }

    res.render('users/show', {user: user});
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
router.get('/:id/register', needAuth,  function(req, res, next) {
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
// 회원가입
router.post('/', function(req, res, next) {
  var err = validateForm(req.body, {needPassword: true});
  if (err) {
    req.flash('danger', err);
    return res.redirect('back');
  }
  User.findOne({email: req.body.email}, function(err, user) {
    if (err) {
      return next(err);
    }
    if (user) {
      req.flash('danger', '동일한 이메일 주소가 이미 존재합니다.');
      res.redirect('back');
    }
    
    hasher({password:req.body.password}, function(err, pass, salt, hash){
        var newUser = new User({
          name: req.body.name,
          email: req.body.email,
          password:hash,
          salt: salt
        });

        if(newUser.email === 'root@com')
          newUser.ifRoot = true;

        newUser.save(function(err) {
          if (err) {
            return next(err);
          } else {
            req.flash('success', '가입이 완료되었습니다. 로그인 해주세요.');
            res.redirect('/');
          }
        });
    });
  });
});

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

// PUT
// 사용자 정보변경
router.put('/:id', function(req, res, next) {
  var err = edit_validateForm(req.body);
  if (err) {
    req.flash('danger', err);
    return res.redirect('/');
  }

  User.findById(req.params.id, function(err, user) {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash('danger', '존재하지 않는 사용자입니다.');
      return res.redirect('back');
    }
    hasher({password:req.body.password, salt:user.salt}, function(err, pass, salt, hash){
      if(err){
        console.log(err);
      }
      if(hash === user.password){
          return hasher({password:req.body.change_password}, function(err, pass, salt, hash){
              if(err){
                console.log(err);
              }

              User.update({_id: req.params.id}, {$set:{
                name : req.body.name,
                email : req.body.email,
                password : hash,
                salt : salt,
              }},function(err, results) {
                if (err) {
                  return console.log(err);
                }else{
                  req.flash('success', '사용자 정보가 변경되었습니다.');
                  res.redirect('/');
                }
              });
          });
      }else{
          req.flash('danger', '현재 비밀번호가 일치하지 않습니다.');
          return res.redirect('back');
      }
    });
  });
});

// DELETE
// 사용자 삭제
router.delete('/:id', function(req, res, next) {
  req.logout();
  User.findOneAndRemove({_id: req.params.id}, function(err) {
    if (err) {
      return next(err);
    }
    req.flash('success', '사용자 계정이 삭제되었습니다.');
    res.redirect('/');
  });
});


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