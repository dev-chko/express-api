const express = require('express');
const router = express.Router();

const member = require('../controllers/member.controller.js');
const validator = require('../middleware/member.validation');

router.get('/', (req, res) => {
  res.send({ message: 'Health Check' });
});

// router.get('/find/:user', validator.emailCheck, member.findOne);

router.post('/email', validator.emailCheck, member.mailSend);

router.post('/email/check', validator.authEmaiilCheck, member.mailCheck);

router.post('/sms', validator.smsSendCheck, member.smsSend);

router.post('/sms/check', validator.smsAuthCheck, member.checkSMS);

router.post('/pin', validator.setPinCheck, member.setPin);

router.post('/pin/check', validator.pinAuthCheck, member.checkPin);

router.post('/signup', validator.signUpCheck, member.signUp);

router.post('/resetpw', validator.resetPw, member.resetPassword);

router.post('/admin/signin', member.adminSignIn);

module.exports = router;
