const express = require('express');
const passport = require('passport');
const JWTStrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');
const util = require('util');

// const deviceModel = require('../models/device.models.js');
// const deviceData = require('../models/device_data.models.js');
const memberModel = require('../models/member.models.js');

const JWTConfig = {
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET_KEY,
  // issuer: 'info.endp',
  // audience: '',
  algorithms: ['HS256'],
  // ignoreExpiration: false,
  // passReqToCallback: false,
  // jsonWebTokenOptions: {
  //   complete: false,
  //   clockTolerance: '',
  // maxAge: '1h', // '2d', // 2 days
  //   // clockTimestamp: 100,
  //   nonce: 'endpinfo',
  // },
};

// 토큰이 유효해야 호출된다. 유효하지 않은 경우 authenticate('jwt', ...) 함수에서 에러값을 처리해야 한다.
// todo: 사용자 토큰에 있는 값을 읽어서 처리하는 방향으로 수정 (매번 DB쿼리는 부담)
const JWTVerify = (jwtPayload, done) => {
  console.log('jwtPayload :>> ', jwtPayload);
  const { user } = jwtPayload;

  // console.log('JWTVerify:', device, user);

  if (device) {
    const { model, did } = device;

    if (model && did) {
      memberModel.findOne(device, (err, node) => {
        if (err) {
          (err) => done(err, null);
          return;
        }
        done(null, node);
      });
    } else {
      done(null, {});
    }
  } else if (user) {
    memberModel.findOne(midx, (err, user) => {
      if (err) {
        done(err, null);
      } else {
        done(null, user && user[0] ? user[0] : {});
      }
    });
  }
};

module.exports = () => {
  passport.use('jwt', new JWTStrategy(JWTConfig, JWTVerify));
  passport.initialize();
};

module.exports.tokenErrorResponse = (info, res) => {
  if (info) {
    if (info.name === 'Error') res.json({ result: 'FAIL', reason: info.message, msg: 'No auth token' });
    else if (info.name === 'JsonWebTokenError') res.json({ result: 'FAIL', reason: info.message, msg: 'Invalid token or jwt malformed' });
    else if (info.name === 'TokenExpiredError') res.json({ result: 'FAIL', reason: info.message, msg: 'token expired' });
    else res.json({ result: 'FAIL', reason: 'unkown error', msg: 'No auth token or invalid token or token expired' });
  }
};

module.exports.generateToken = (data) => {
  let accessToken = '',
    refreshToken = '';

  console.log('data :>> ', data);

  if (data.type === 'device') {
    accessToken = jwt.sign(
      {
        device: {
          model: data.model,
          did: data.did,
        },
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: '1h',
      },
    );

    refreshToken = jwt.sign(
      {
        device: {
          model: data.model,
          did: data.did,
        },
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: '1d',
      },
    );
  } else {
    // user
    accessToken = jwt.sign(
      {
        device: {
          model: data.model,
          did: data.did,
        },
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: '8h',
      },
    );

    refreshToken = jwt.sign(
      {
        device: {
          model: data.model,
          did: data.did,
        },
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: '1d',
      },
    );
  }

  return { accessToken, refreshToken };
};
