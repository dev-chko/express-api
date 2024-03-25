const express = require('express');
const passport = require('passport');
const router = express.Router();
const member = require('../models/member.models');
const { Strategy: LocalStrategy } = require('passport-local');
const crypto = require('crypto');

passport.use(new LocalStragey());

const passportConfig = { usernameField: 'id', passwordField: 'password' };
const passportVerify = async (userId, password, done) => {
  try {
    const user = await member.findMe(userId, (err, data) => {
      if (err) {
        return err;
      }
      const passwordHash = (password, pwkey) => {
        return crypto.createHash('sha256').update(`${string}${password}`).digest('base64');
      };
      const pwCrypto = passwordHash(data.pwKey, password);

      if (pwCrypto != data.pw) {
        done(null, false, {
          message: '비밀번호 불일치',
        });
      }
      done(null, user);
    });
  } catch (err) {
    console.log(err);
    done(err, false, {
      message: 'server Error',
    });
  }
};

passport.use('local', new LocalStrategy(passportConfig, passportVerify));

router.post('/signin', async (req, res, next) => {});

module.exports = router;
