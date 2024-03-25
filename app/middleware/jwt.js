const express = require('express');
const passport = require('passport');
const JWTStrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');

const member = require('../models/member.models.js');

module.exports = () => {
  const JWTConfig = {
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET_KEY,
  };
  const JWTVerify = async (jwtPayload, done) => {
  console.log('jwtPayload :>> ', jwtPayload);
    const findOne = util.promisify(member.findOne);
    findUserInfo(jwtPayload.id)
      .then((user) => cb(null, user && user[0] ? user[0]: {}))
      .catch((err) => cb(err, null));
  };

  passport.use('jwt', new JWTStrategy(JWTConfig, JWTVerify));
}
