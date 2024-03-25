const express = require('express');
const router = express.Router();

const board = require('../controllers/board.controller.js');

router.get('/', (req, res) => {
  res.send({ message: 'Health Check' });
});

router.get('/notices', board.findAll);

router.post('/notices', board.createOne);

router.get('/notices/:id', board.findOne);

router.put('/notices/:id', board.editOne);

router.delete('/notices/:id', board.deleteOne);

module.exports = router;
