var express = require('express'),
    User = require('../models/User');
    Room = require('../models/Room');
var router = express.Router();
var _ = require('lodash');
var findOrCreate = require('mongoose-findorcreate');
var pbkdf2Password = require('pbkdf2-password');
var hasher = pbkdf2Password();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;



router.use(passport.initialize());
router.use(passport.session());
var countries = ["서울", "부산", "인천", "대구", "대전", "광주", "수원", "울산", "창원", "고양", "용인", "성남", "부천", "청주", "안산",
 "전주", "천안", "남양주", "화성", "안양", "김해", "포항", "평택", "제주", "시흥", "의정부", "구미", "파주", "김포", "진주", "광명", 
 "원주", "아산", "경기도광주", "익산", "양산", "군포", "춘천", "경산", "군산", "여수", "경주", "거제", "목포", "강릉", "오산", "충주",
  "이천", "양주", "세종", "안성", "구리", "서산", "안동", "당진", "포천", "의왕", "하남", "서귀포", "광양", "김천", "통영", "제천", 
  "논산", "공주", "사천", "정읍," ,"여주", "영주", "밀양", "보령", "상주", "영천", "동두천"  , "나주", "동해", "김제", "남원", "속초", 
  "문경", "삼척", "과천", "태백", "계룡"];

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

// 로그인 페이지
router.get('/signin', function(req, res, next) {
  res.render('signin');
});

// 검색
router.get('/suggest', function(req, res, next) {
  var search = req.query.search;

  var ret = _.filter(countries, function(name) {
      return name.toLowerCase().indexOf(search.toLowerCase()) > -1;
  });

  res.json(ret);
});


router.post('/search', function(req, res, next) {
    Room.find({city: req.body.search}, function(err, rooms){
      res.render('rooms/list', {rooms:rooms});
    });
});

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
    // clientID: process.env.FACEBOOK_APP_ID,
    // clientSecret: process.env.FACEBOOK_APP_SECRET,
    clientID: 1723350404659483,
    clientSecret: 'e0b9ce51849d6701d192dc4831845252',
    callbackURL: "/signin/facebook/callback",
    profileFields:['id','email','displayName']
  },
  function(accessToken, refreshToken, profile, done) {
    // profile : 페이스북 상에서의 id가 담겨있다.
    User.findOrCreate({facebook_id: profile.id, name : profile.displayName, email: profile.emails[0].value.trim()}, function(err, user) {
      if (err) { 
        return done(err); 
      }
      console.log(user);
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
  passport.authenticate('facebook', { scope: 'email' })
);


// passport facebook callbackURL로 인증 실행 3
router.get('/signin/facebook/callback',
  passport.authenticate('facebook', { 
    successRedirect: '/',
    failureRedirect: '/signin'  
  }));

// 로그아웃
router.get('/signout', function(req, res, next) {
  req.logout();
  req.flash('success', '로그아웃 되었습니다.');
  res.redirect('/');
});

module.exports = router;
