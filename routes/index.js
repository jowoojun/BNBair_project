var express = require('express'),
    User = require('../models/User');
    Room = require('../models/Room');
var router = express.Router();
var _ = require('lodash');

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


router.post('/signin', function(req, res, next) {
  User.findOne({email: req.body.email}, function(err, user) {
    if (err) {
      res.render('error', {message: "Error", error: err});
    } else if (!user) {
      req.flash('danger', '존재하지 않는 사용자 입니다.');
      res.redirect('back');
    } else if (user.password !== req.body.password) {
      req.flash('danger', '비밀번호가 일치하지 않습니다.');
      res.redirect('back');
    } else {
      req.session.user = user;
      req.flash('success', '로그인 되었습니다.');
      res.redirect('/');
    }
  });
});

router.get('/signout', function(req, res, next) {
  delete req.session.user;
  req.flash('success', '로그아웃 되었습니다.');
  res.redirect('/');
});

module.exports = router;
