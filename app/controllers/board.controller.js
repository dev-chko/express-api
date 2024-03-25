const Board = require('../models/board.models.js');

exports.findAll = (request, result) => {
  const data = {
    lang: request.query.lang,
    pageCount: request.query.pagecount,
    pageIndex: request.query.pageindex,
    type: request.query.type,
  };
  if (!request.query.lang && !request.query.pagecount && !request.query.pageindex && !request.query.type) {
    result.json({
      result: 'FAIL',
      reason: '400',
      message: 'Unenough query',
    });
  }
  Board.getTotal(data, (err, data1) => {
    if (err) {
      result.json({
        result: 'FAIL',
        reason: '400',
        message: err,
      });
    }
    Board.getAll(data, (err, data) => {
      if (err) {
        result.json({
          result: 'FAIL',
          reason: '400',
          message: err,
        });
      }
      result.json({
        result: 'OK',
        reason: '200',
        data: data,
        total: data1[0].total,
      });
    });
  });
};

exports.editOne = (request, result) => {
  const input = request.body;
  const idx = request.params.id;
  Board.editNotice(idx, input, (err, res) => {
    if (err) {
      console.error(err);
      result.json({
        result: 'FAIL',
        reason: '400',
        message: 'Notice Update error',
      });
    }
    result.json({
      result: 'OK',
      reason: '200',
      message: 'Notice Update Complete',
      data: res,
    });
  });
};

exports.createOne = (request, result) => {
  const input = request.body;
  Board.newNotice(input, (err, res) => {
    if (err) {
      console.error(err);
      result.json({
        result: 'FAIL',
        reason: '400',
        message: 'notice Input error',
      });
    }
    result.json({
      result: 'OK',
      reason: '200',
      message: 'Create Notice Complete',
      data: res,
    });
  });
};

exports.deleteOne = (request, result) => {
  const idx = request.params.id;
  Board.deleteNotice(idx, (err, res) => {
    if (err) {
      console.error(err);
      result.json({
        result: 'FAIL',
        reason: '400',
        message: 'Delete Notice Error',
      });
    }
    result.json({
      result: 'OK',
      reason: '200',
      message: 'Delte Notice Complete',
    });
  });
};

exports.findOne = (request, result) => {
  const idx = request.params.id;
  Board.findNotice(idx, (err, res) => {
    if (err) {
      console.error(err);
      result.json({
        result: 'FAIL',
        reason: '400',
        message: 'Find Notice Error',
      });
    }
    result.json({
      result: 'OK',
      reason: '200',
      data: res,
    });
  });
};
