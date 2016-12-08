var express = require('express'),
    User = require('../models/User');
    Room = require('../models/Room');
var router = express.Router();
var _ = require('lodash');

var pbkdf2Password = require('pbkdf2-password');
var hasher = pbkdf2Password();

var findOrCreate = require('mongoose-findorcreate');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;

router.use(passport.initialize());
router.use(passport.session());

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

var countries = ["서울", "부산", "인천", "대구", "대전", "광주", "수원", "울산", "창원", "고양", "용인", "성남", "부천", "청주", "안산",
 "전주", "천안", "남양주", "화성", "안양", "김해", "포항", "평택", "제주", "시흥", "의정부", "구미", "파주", "김포", "진주", "광명", 
 "원주", "아산", "경기도광주", "익산", "양산", "군포", "춘천", "경산", "군산", "여수", "경주", "거제", "목포", "강릉", "오산", "충주",
  "이천", "양주", "세종", "안성", "구리", "서산", "안동", "당진", "포천", "의왕", "하남", "서귀포", "광양", "김천", "통영", "제천", 
  "논산", "공주", "사천", "정읍," ,"여주", "영주", "밀양", "보령", "상주", "영천", "동두천"  , "나주", "동해", "김제", "남원", "속초", 
  "문경", "삼척", "과천", "태백", "계룡"];

// GET
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

// 로그인 페이지
router.get('/signin', function(req, res, next) {
  res.render('signin');
});

// 검색창에 입력중
router.get('/suggest', function(req, res, next) {
  var search = req.query.search;

  var ret = _.filter(countries, function(name) {
      return name.toLowerCase().indexOf(search.toLowerCase()) > -1;
  });

  res.json(ret);
});

// 회원가입화면
router.get('/new', function(req, res, next) {
  res.render('new', {messages: req.flash()});
});

// 로그아웃
router.get('/signout', function(req, res, next) {
  req.logout();
  req.flash('success', '로그아웃 되었습니다.');
  res.redirect('/');
});

//POST
// 검색 버튼 누름
router.post('/search', function(req, res, next) {
    Room.find({city: req.body.search}, function(err, rooms){
      res.render('rooms/list', {rooms:rooms});
    });
});

// 회원가입
router.post('/new', function(req, res, next) {
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


// PUT
// 사용자 정보변경
router.put('/:id/edit', function(req, res, next) {
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

// PASSPORT!
// passport 및 암호화(hash)를 통한 로그인
// passport 처음에 로그인헀을때 실행 4
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

// passport 첫 로그인 이후 3
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    return done(err, user);
  });
});

// passport 규칙에 따라 실행 2
passport.use(new LocalStrategy({ // or whatever you want to use
    usernameField: 'email',    // define the parameter in req.body that passport can use as username and password
    passwordField: 'password'
  },
  function(username, password, done) { // depending on your strategy, you might not need this function ...
      User.findOne({ email:username }, function(err, user) {
        if (err) { 
          return done(err); 
        }
        if (!user) {
          return done(null, false, { message: ('존재하지 않는 사용자 입니다.') });
        }
        return hasher({password:password, salt:user.salt}, function(err, pass, salt, hash){
          if(hash === user.password){
            return done(null, user ,{message: ('로그인 되었습니다.')});
          }else{
            return done(null, false, { message: ('비밀번호가 일치하지 않습니다.')});
          }
        });
      });
  }
));

// passport facebook 규칙에 따라 실행 2
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "/signin/facebook/callback",
    profileFields:['id','email','displayName']
  },
  function(accessToken, refreshToken, profile, done) {
    // profile : 페이스북 상에서의 id가 담겨있다.
    User.findOrCreate({facebook_id: profile.id, name : profile.displayName, email: profile.emails[0].value || null}, function(err, user) {
      if (err) { 
        return done(err); 
      }
      done(null, user);
    });
  }
));

// passport local 첫번째로 실행 1
router.post('/signin', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: 'back',
    failureFlash: true
}));

// passport facebook 첫번째로 실행 1
router.get('/signin/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);


// passport facebook callbackURL로 인증 실행 3
router.get('/signin/facebook/callback',
  passport.authenticate('facebook', { 
    successRedirect: '/',
    failureRedirect: '/signin'  
  }));


module.exports = router;