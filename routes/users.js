var express = require('express'),
    User = require('../models/User');
    Room = require('../models/Room');
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

function searchUser(room_id, users){
  var i, j;
  var user;
  for(i = 0; i < Object.keys(users).length; i++){
    user = users[i];
    if(user.ifHost === true){
      if(user.rooms !== null){
        for(j = 0; j < user.rooms.length; j++){
          if(user.rooms[j]._id == room_id){
            return user._id;
          }
        }
      }
    }
  }
  return null;
}
// GET
// 사용자 목록 화면
router.get('/', needAuth, function(req, res, next) {
    var email = req.session.user.email.trim();

    if(email === "root@com"){
       User.find({}, function(err, users) {
          if (err) {
            return next(err);
          }
          User.findById(req.session.user, function(err, user) {
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
router.get('/:id/edit', function(req, res, next) {
  User.findById(req.params.id, function(err, user) {
    if (err) {
      return next(err);
    }
    res.render('users/edit', {user: user});
  });
});

// 호스트 되기 화면
router.get('/:id/host', function(req, res, next) {
    User.findById(req.params.id, function(err, user) {
    if (err) {
      return next(err);
    }
    // res.send(user);
    res.render('users/host', {user: user});
  });
});

// profile화면
router.get('/:id', function(req, res, next) {
  User.findById(req.params.id, function(err, user) {
    if (err) {
      return next(err);
    }
    // res.send(user);
    res.render('users/show', {user: user});
  });
});

// 예약확인 화면
router.get('/:id/reservation', function(req, res, next) {
  User.findById(req.params.id, function(err, user) {
    if (err) {
      return next(err);
    }
    res.render('users/reservation', {user: user});
  });
});

// 메시지 화면
router.get('/:id/message', function(req, res, next) {
  User.findById(req.params.id, function(err, user) {
    if (err) {
      return next(err);
    }
    res.render('users/message', {user: user});
  });
});

// 숙소등록화면
router.get('/:id/register', function(req, res, next) {
  User.findById(req.params.id, function(err, user) {
    if (err) {
      return next(err);
    }
    res.render('user_host/register', {user: user});
  });
});

// 숙소정보화면
router.get('/:id/rooms', function(req, res, next) {
  User.findById({_id: req.params.id}, function(err, user) {
    if (err) {
      return next(err);
    }
    res.render('user_host/rooms', {user: user});
  });
});

// POST
// 새로운 사용자 등록
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
    var newUser = new User({
      name: req.body.name,
      email: req.body.email,
    });
    newUser.password = req.body.password;
    newUser.rooms = [];
    newUser.reservation = [];
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
router.post('/:id/register', function(req, res, next) {
  User.findById(req.params.id, function(err, user) {
    if (err) {
      return next(err);
    }

    var newRoom = new Room({
      title: req.body.title,
      description: req.body.description,
      city: req.body.city,
      address: req.body.address,
      price: req.body.price,
      facilities: req.body.facilities,
      role: req.body.role,
    }); 

    newRoom.save();
    user.rooms.push(newRoom);

    user.save(function(err) {
      if (err) {
        return next(err);
      } else {
        req.flash('success', '새로운 숙소가 등록되었습니다.');
        res.redirect('/');
      }
    });
  });
});

// PUT
// 사용자 정보변경
router.put('/:id', function(req, res, next) {
  var err = validateForm(req.body);
  if (err) {
    req.flash('danger', err);
    return res.redirect('back');
  }

  User.findById(req.params.id, function(err, user) {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash('danger', '존재하지 않는 사용자입니다.');
      return res.redirect('back');
    }

    if (user.password !== req.body.current_password) {
      req.flash('danger', '현재 비밀번호가 일치하지 않습니다.');
      return res.redirect('back');
    }

    user.name = req.body.name;
    user.email = req.body.email;
    if (req.body.password) {
      user.password = req.body.password;
    }

    user.save(function(err) {
      if (err) {
        return next(err);
      }
      req.flash('success', '사용자 정보가 변경되었습니다.');
      res.redirect('/users');
    });
  });
});

// DELETE
// 사용자 삭제
router.delete('/:id', function(req, res, next) {
  User.findOneAndRemove({_id: req.params.id}, function(err) {
    if (err) {
      return next(err);
    }
    req.flash('success', '사용자 계정이 삭제되었습니다.');
    res.redirect('/users');
  });
});

module.exports = router;
