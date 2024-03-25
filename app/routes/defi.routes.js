const express = require('express');
const router = express.Router();

const defi = require('../controllers/defi.controller.js');
// const authService = require('../middleware/checkJwt');
// require('../middleware/jwt');

// router.all('*', authService.checkTokenMW, (req, res, next) => {
//   authService.verifyToken(req, (err, data) => {
//     if (null === data) {
//       console.error('error');
//       res.json({
//         result: 'FAIL',
//         reason: '406',
//         message: 'Unauthorization',
//       });
//       return;
//     } else if (err) {
//       console.error(err);
//       res.send(err);
//     } else {
//       next();
//     }
//   });
// });

router.get('/staking/list', defi.productList); //상품 리스트

router.get('/staking/listall', defi.productAllList);

router.get('/staking/product/:sidx', defi.getProduct);

router.post('/staking/product', defi.creatProduct); //Only Admin

router.put('/staking/product/:sidx', defi.editProduct); // Only Admin

router.delete('/staking/product/:sidx', defi.deletProduct); //Only Admin

router.get('/admin/contract', defi.getAllContract);

router.get('/admin/csv/contract', defi.getDownload);

router.get('/contract/:ctidx', defi.getUserContract);

router.get('/contract', defi.getUserAllContract); //해당 유저 계약 전체 가져오기

router.post('/contract/:midx', defi.creatContract); //계약

router.post('/contract/admin/:midx', defi.AdminContract);

router.post('/contract/reward/:ctidx', defi.stakingReward);

router.post('/contract/recontract/:ctidx', defi.stakingReContract);

router.patch('/contract/:midx', defi.editContract); //정산

router.get('/contract/dashboard/:midx', defi.summaryContract); //대쉬보드 요약정보

module.exports = router;
