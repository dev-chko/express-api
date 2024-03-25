const exchangeModel = require('../models/exchange.model.js');

exports.kline = (request, result) => {
  exchangeModel
    .getKline(request.query)
    .then((data) => {
      result.send({
        result: 'OK',
        reason: '200',
        data: data,
      });
    })
    .catch((err) => {
      result.send({
        result: 'FAIL',
        reason: '400',
        message: err.message,
      });
    });
};
