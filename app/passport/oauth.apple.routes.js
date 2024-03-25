const express = require('express');
const passport = require('passport');
const router = express.Router();
const jwt = require('jsonwebtoken');
const path = require('path');
const util = require('util');

const member = require('../models/member.models.js');

var AppleStrategy = require('passport-apple').Strategy;

passport.use(
  new AppleStrategy(
    {
      clientID: process.env['APPLE_CLIENT_ID'],
      teamID: process.env['APPLE_TEAM_ID'],
      callbackURL: `https://${process.env['NODE_HTTP_HOST']}${
        process.env['NODE_ENV'] === 'production' ? '' : ':' + process.env['NODE_HTTPS_PORT']
      }/oauth/apple/callback`,
      keyID: process.env['APPLE_KEY_ID'],
      privateKeyLocation: path.join(__dirname, '../config/apple-AuthKey.p8'),
      // privateKeyString: `-----BEGIN PRIVATE KEY-----\n
      //   MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgSqaqncGwojPhyr6o\n
      //   76k1X3DlgMW0WVYVzOJuhCx6USWgCgYIKoZIzj0DAQehRANCAAQxe2e89gxKv5Fu\n
      //   digvZGwvv+DCEO+fDCJJ2PFC3BwYSkGCdj84COKjH/EvL5AwIg3JSoZ3YEKpSQtv\n
      //   +cwg9iYg\n
      //   -----END PRIVATE KEY-----\n`,
      passReqToCallback: true,
    },
    function (req, accessToken, refreshToken, idToken, profile, cb) {
      // decodedToken: 사용자가 이메일을 허용한 경우...
      // at_hash:'KEQoyqaJ5RuTlQb6KkvT5Q'
      // aud:'io.grinbit.service'
      // auth_time:1649544626
      // email:'grinbit.korea@gmail.com'
      // email_verified:'true'
      // exp:1649631027
      // iat:1649544627
      // iss:'https://appleid.apple.com'
      // nonce_supported:true
      // sub:'000149.da84206bd789466e932d3d1c4d9350eb.1457'
      const decodedToken = jwt.decode(idToken);

      const findUserInfo = util.promisify(member.findUserInfo);
      findUserInfo(decodedToken.email)
        .then((user) => cb(null, user && user[0] ? user[0] : {}))
        .catch((err) => cb(err, null));
    },
  ),
);

router.get('/oauth/apple', passport.authenticate('apple'));

router.post('/oauth/apple/callback', function (req, res, next) {
  passport.authenticate('apple', function (err, user, info) {
    if (err) {
      // if (err == 'AuthorizationError') {
      // } else if (err == 'TokenError') {
      // }
      // req.json({});
      console.log(err);
      res.redirect('/signin');
    } else {
      // res.json(user);
      // Successful authentication, redirect home.
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
    }
  })(req, res, next);
});

module.exports = router;
