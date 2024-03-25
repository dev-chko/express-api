const express = require('express');
const passport = require('passport');
const router = express.Router();
const util = require('util');
const jwt = require('jsonwebtoken');
const member = require('../models/member.models.js');

// 구글로인 버튼 -> router.get('oauth/google') -> passport.use에서 new GoogleStrategy실행
// cliendID,clientSecret 인증성공 -> 구글이동 및 사용자 정보 권한 승인  =>   구글 사용자 정보를 callback해줌

var GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env['GOOGLE_CLIENT_ID'],
      clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
      callbackURL: `https://${process.env['NODE_HTTP_HOST']}${
        process.env['NODE_ENV'] === 'production' ? '' : ':' + process.env['NODE_HTTPS_PORT']
      }/oauth/google/callback`,
    },
    function (accessToken, refreshToken, profile, cb) {
      const findUserInfo = util.promisify(member.findUserInfo);
      const email = profile.emails[0].value;
      console.log(`/oauth/google: ${email}`);
      findUserInfo(email, async (err, user) => {
        // console.log('user :>> ', user);
        if (err) {
          cb(err, null);
          return;
        }
        await jwt.sign({ midx: user.mIdx }, process.env.JWT_SECRET_KEY, (err, token) => {
          const addToken = {
            ...user[0],
            accessToken: token,
            refreshToken: token,
          };
          cb(null, user && user[0] ? addToken : {});
        });
        // cb(null, user && user[0] ? user[0] : {});
      });
      // .then((user) => cb(null, user && user[0] ? user[0]: {}))
      // .catch((err) => cb(err, null));
    },
  ),
);

router.get('/oauth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/oauth/google/callback', passport.authenticate('google', { failureRedirect: '/signin' }), (req, res) => {
  console.log('req.user :>> ', req.user);
  jwt.sign({ user: req.user.id, address: req.user.walletAddress }, process.env.JWT_SECRET_KEY, (err, token) => {
    if (err) {
      console.log(err);
      res.redirect('/signin');
      return;
    }
    res.cookie('jwt', token, {
      httpOnly: true,
      // sameSite: true,
      // signed: true,
      // secure: true,
    });
    res.redirect('/dashboard');
    return;
  });
});
// }), function(req, res) {
//     // Successful authentication, redirect home.
//     res.redirect('/dashboard');
//   });

module.exports = router;
