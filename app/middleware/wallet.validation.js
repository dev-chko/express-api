const { check, validationResult } = require('express-validator');

const addressCheck = async (req, res, next) => {
  check('address').trim().isEthereumAddress('address').run(req);

  if (!validationResult(req).isEmpty()) {
    res.json({
      reason: 'FAIL',
      result: '303',
      message: 'Invalid Address',
    });
    return;
  }
  next();
};

const emailCheck = async (req, res, next) => {
  await check('email').isEmail().normalizeEmail({ gmail_remove_dots: false }).run(req);
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

const sendCheck = async (req, res, next) => {
  await check('id').trim().isEmail().notEmpty().normalizeEmail({ gmail_remove_dots: false }).run(req);

  await check('midx').trim().isString().notEmpty().run(req);

  await check('amount').trim().notEmpty().isString().run(req);

  await check('to').trim().isEthereumAddress('address').notEmpty().run(req);

  await check('from').trim().isEthereumAddress('address').notEmpty().run(req);

  await check('token_type').trim().isLength(4).notEmpty().run(req);

  if (!validationResult(req).isEmpty()) {
    res.json({
      reason: 'FAIL',
      result: '303',
      message: 'Invalid Body.',
    });
    return;
  }
  next();
};

const transactionCheck = async (req, res, next) => {
  await check('address').trim().isEthereumAddress('address').notEmpty().run(req);

  await check('pagecount').trim().notEmpty().run(req);

  await check('pageindex').trim().notEmpty().run(req);

  await check('type').trim().isLength({ min: 4, max: 4 }).notEmpty().isString().run(req);

  if (!validationResult(req).isEmpty()) {
    res.json({
      reason: 'FAIL',
      result: '303',
      message: 'Invalid Body.',
    });
    return;
  }
  next();
};

const swapCheck = async (req, res, next) => {
  await check('address').trim().notEmpty().isEthereumAddress('address').run(req);

  await check('amount').trim().notEmpty().run(req);

  await check('swap').trim().notEmpty().run(req);

  await check('midx').trim().isString().notEmpty().run(req);

  await check('id').trim().isEmail().notEmpty().normalizeEmail({ gmail_remove_dots: false }).run(req);

  if (!validationResult(req).isEmpty()) {
    res.json({
      reason: 'FAIL',
      result: '303',
      message: 'Invalid Body.',
    });
    return;
  }
  next();
};

const mobileCheck = async (req, res, next) => {
  await check('number')
  .isString()
  .run(req);

  if (!validationResult(req).isEmpty()) {
    res.json({
      reason: 'FAIL',
      result: '303',
      message: 'Invalid Body.',
    });
    return;
  }
  next();
}

const booksCheck = async (req,res,next) => {
  await check('midx')
  .notEmpty()
  .isInt()
  .run(req);

  if (!validationResult(req).isEmpty()) {
    res.json({
      reason: 'FAIL',
      result: '303',
      message: 'Invalid Body.',
    });
    return;
  }
  next();
}

const midxCheck = async ( req,res,next) => {
  await check('midx')
  .trim()
  .notEmpty()
  .isInt()
  .run(req);

  if (!validationResult(req).isEmpty()) {
    res.json({
      reason: 'FAIL',
      result: '303',
      message: 'Invalid Body.',
    });
    return;
  }
  next();
}

const lastestCheck = async (req,res,next) => {
  await check('address')
  .isEthereumAddress()
  .trim()
  .notEmpty()
  .run(req);

  await check('type')
  .trim()
  .notEmpty()
  .isLength(4)
  .run(req);

  
  if (!validationResult(req).isEmpty()) {
    res.json({
      reason: 'FAIL',
      result: '303',
      message: 'Invalid Body.',
    });
    return;
  }
  next();
}

const addBookCheck = async (req,res,next) => {
  await check('midx')
  .trim()
  .isInt()
  .notEmpty()
  .run(req);

  await check('nickName')
  .notEmpty()
  .trim()
  .run(req)

  await check('address')
  .isEthereumAddress()
  .notEmpty()
  .trim()
  .run(req)

    if (!validationResult(req).isEmpty()) {
    res.json({
      reason: 'FAIL',
      result: '303',
      message: 'Invalid Body.',
    });
    return;
  }
  next();
}
const delBookCheck = async (req,res,next) => {
  await check('midx')
  .trim()
  .isInt()
  .notEmpty()
  .run(req);

  await check('adbookIdx')
  .notEmpty()
  .trim()
  .isInt()
  .run(req)

    if (!validationResult(req).isEmpty()) {
    res.json({
      reason: 'FAIL',
      result: '303',
      message: 'Invalid Body.',
    });
    return;
  }
  next();
}


module.exports = {
  addressCheck,
  emailCheck,
  sendCheck,
  transactionCheck,
  swapCheck,
  mobileCheck,
  booksCheck,
  midxCheck,
  lastestCheck,
  addBookCheck,
  delBookCheck
};
