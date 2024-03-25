const express = require('express');
const passport = require('passport');
const router = express.Router();
const util = require('util');

const member = require('../models/member.models.js');

var NaverStrategy = require('passport-naver').Strategy;

passport.use(new NaverStrategy({
    clientID: process.env['NAVER_CLIENT_ID'],
    clientSecret: process.env['NAVER_CLIENT_SECRET'],
    callbackURL: `https://${process.env['NODE_HTTP_HOST']}${process.env['NODE_ENV'] === 'production' ? '' : ':'+process.env['NODE_HTTPS_PORT']}/oauth/naver/callback`,
  },
  function(accessToken, refreshToken, profile, cb) {
    const findUserInfo = util.promisify(member.findUserInfo);
    const email = profile.emails[0].value;
    findUserInfo(email)
      .then((user) => cb(null, user && user[0] ? user[0]: {}))
      .catch((err) => cb(err, null));
  }
));

router.get('/oauth/naver', passport.authenticate('naver', null));

router.get('/oauth/naver/callback', passport.authenticate('naver', {
    failureRedirect: '/signin'
  }), function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/dashboard');
  });

module.exports = router;
