const express = require('express');
const passport = require('passport');
const router = express.Router();
const util = require('util');
const member = require('../models/member.models.js');

const jwtMiddleware = require('../middleware/jwt.middleware');

var KakaoStrategy = require('passport-kakao').Strategy;

passport.use(
  new KakaoStrategy(
    {
      clientID: process.env['KAKAO_CLIENT_ID'],
      clientSecret: process.env['KAKAO_CLIENT_SECRET'],
      callbackURL: `https://${process.env['NODE_HTTP_HOST']}${
        process.env['NODE_ENV'] === 'production' ? '' : ':' + process.env['NODE_HTTPS_PORT']
      }/oauth/kakao/callback`,
    },
    function (accessToken, refreshToken, profile, cb) {
      // TODO: 카카오의 경우 profile에 email주소가 선택사항이므로 email이 없는 경우 실패로 간주해야됨.
      // console.log('profile: ', profile);

      const findUserInfo = util.promisify(member.findUserInfo);
      findUserInfo(profile._json.kakao_account.email)
        .then((user) => {
          cb(null, user && user[0] ? user[0] : {});
          jwtMiddleware.generateToken();
        })
        .catch((err) => cb(err, null));
    },
  ),
);

router.get('/oauth/kakao', passport.authenticate('kakao'));

router.get(
  '/oauth/kakao/callback',
  passport.authenticate('kakao', {
    failureRedirect: '/signin',
  }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect('/dashboard');
  },
);

module.exports = router;
