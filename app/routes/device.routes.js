const express = require('express');
const router = express.Router();

const device = require('../controllers/device.controller.js');

router.post('/:email', device.register);

router.get('/', device.getlist);

module.exports = router;
