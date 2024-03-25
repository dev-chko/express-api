const express = require('express');
const router = express.Router();

const exchangeController = require('../controllers/exchange.controller.js');

router.get('/kline', exchangeController.kline);

module.exports = router;
