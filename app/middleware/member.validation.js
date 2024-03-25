const { check, validationResult } = require('express-validator');

const emailCheck = async (req, res, next) => {
  await check('email').notEmpty().isEmail().normalizeEmail({ gmail_remove_dots: false }).run(req);

  if (!validationResult(req).isEmpty()) {
    res.json({
      reason: 'FAIL',
      result: '303',
      message: 'Invalid Email.',
    });
    return;
  }
  next();
};

const authEmaiilCheck = async (req, res, next) => {
  await check('email').trim().isEmail().notEmpty().normalizeEmail({ gmail_remove_dots: false }).run(req);

  await check('authcode').trim().isString().isLength(6).notEmpty().run(req);

  if (!validationResult(req).isEmpty()) {
    res.json({
      reason: 'FAIL',
      result: '303',
      message: 'Invalid Email.',
    });
    return;
  }
  next();
};

const smsSendCheck = async (req, res, next) => {
  await check('type');

  await check('id');

  await check('smsCountry');

  await check('smsRecipient');

  if (!validationResult(req).isEmpty()) {
    res.json({
      reason: 'FAIL',
      result: '303',
      message: 'Invalid Email.',
    });
    return;
  }
  next();
};

const smsAuthCheck = async (req, res, next) => {
  console.log('req :>> ', req);
  await check('type').trim().isLength(1).notEmpty().run(req);

  await check('smsRecipient').notEmpty().trim().run(req);

  await check('smsAuth').isInt().isLength(4).notEmpty().run(req);

  if (!validationResult(req).isEmpty()) {
    res.json({
      reason: 'FAIL',
      result: '303',
      message: 'Invalid Email.',
    });
    return;
  }
  next();
};

const setPinCheck = async (req, res, next) => {
  await check('id').notEmpty().isEmail().normalizeEmail({ gmail_remove_dots: false }).run(req);
  await check('pw').trim().notEmpty().run(req);
  await check('pinNum').notEmpty().isLength(4).isInt().run(req);

  if (!validationResult(req).isEmpty()) {
    res.json({
      reason: 'FAIL',
      result: '303',
      message: 'Invalid Email.',
    });
    return;
  }
  next();
};

const pinAuthCheck = async (req, res, next) => {
  await check('id').notEmpty().isEmail().normalizeEmail({ gmail_remove_dots: false }).run(req);
  await check('pinNum').notEmpty().isLength(4).isInt().run(req);

  if (!validationResult(req).isEmpty()) {
    res.json({
      reason: 'FAIL',
      result: '303',
      message: 'Invalid Email.',
    });
    return;
  }
  next();
};
const signUpCheck = async (req, res, next) => {
  await check('id').notEmpty().isEmail().normalizeEmail({ gmail_remove_dots: false }).run(req);
  await check('pw').notEmpty().trim().run(req);
  await check('name').notEmpty().trim().run(req);
  await check('mobile').notEmpty().trim().run(req);
  await check('mobileAuth').isLength(1).notEmpty().trim().run(req);

  if (!validationResult(req).isEmpty()) {
    res.json({
      reason: 'FAIL',
      result: '303',
      message: 'Invalid Email.',
    });
    return;
  }
  next();
};

const resetPw = async (req, res, next) => {
  await check('id').notEmpty().isEmail().normalizeEmail({ gmail_remove_dots: false }).run(req);
  await check('password').notEmpty().trim().run(req);
  await check('smsRecipient').notEmpty().trim().run(req);

  if (!validationResult(req).isEmpty()) {
    res.json({
      reason: 'FAIL',
      result: '303',
      message: 'Invalid data.',
    });
    return;
  }
};

module.exports = {
  emailCheck,
  authEmaiilCheck,
  smsSendCheck,
  smsAuthCheck,
  setPinCheck,
  pinAuthCheck,
  signUpCheck,
  resetPw,
};
