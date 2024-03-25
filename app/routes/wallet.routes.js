const express = require('express');
const router = express.Router();

const wallet = require('../controllers/wallet.controller.js');
const validation = require('../middleware/wallet.validation');
const authService = require('../middleware/checkJwt');

require('../middleware/jwt');
/*
router.all('*', authService.checkTokenMW, (req, res, next) => {
  authService.verifyToken(req, (err, data) => {
    if (null === data) {
      console.error('error');
      res.json({
        result: 'FAIL',
        reason: '406',
        message: 'Unauthorization',
      });
      return;
    } else if (err) {
      console.error(err);
      res.send(err);
    } else {
      next();
    }
  });
});
*/

router.get('/address/:email', validation.emailCheck, wallet.address);

// router.get('/mobile/:number',mobileCheck, wallet.phoneToAaddress);

router.get('/balance/:address', validation.addressCheck, wallet.balance);

router.get('/transaction/:address', validation.transactionCheck, wallet.transaction);

router.get('/validate/:address', validation.addressCheck, wallet.validate);

router.post('/feesend', validation.sendCheck, wallet.feeSend);

router.post('/send', validation.sendCheck, wallet.send);

router.post('/newaccount', validation.midxCheck, wallet.newUserAddress);

router.get('/books', validation.midxCheck, wallet.getAdBooks);

router.get('/books/latest', validation.lastestCheck, wallet.latestFrom);

router.post('/books', validation.addBookCheck, wallet.addBooks);

router.delete('/books', validation.delBookCheck, wallet.deletAdBook);
// router.get('/grinbitTx', wallet.grinbit);

router.post('/grbtswap', validation.swapCheck, wallet.swap);

// router.get('/wallet/recive', wallet.recive);

module.exports = router;
