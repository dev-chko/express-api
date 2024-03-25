const deviceModel = require('../models/device.models.js');

// device register
exports.register = (request, result) => {
  const email = request.params.email;
  const ip = request.headers['x-forwarded-for'] || request.socket.remoteAddress;

  const deviceInfo = { ...request.body, email, ip };

  if (!deviceInfo.mIdx || deviceInfo.mIdx === 0 || !deviceInfo.email || deviceInfo.email === '' || !deviceInfo.os || deviceInfo.os === '') {
    console.warn('Invalid values', deviceInfo);

    return result.json({
      result: 'FAIL',
      reason: '400',
      message: 'Invalid values',
    });
  }

  deviceModel.register(deviceInfo, (err, res) => {
    if (err) {
      console.error(err);

      return result.json({
        result: 'FAIL',
        reason: '400',
        message: 'notice Input error',
      });
    }

    return result.json({
      result: 'OK',
      reason: '200',
      message: 'registered device info',
      data: res,
    });
  });
};

exports.getlist = (request, result) => {
  const mail = request.query?.email;
  deviceModel.getList(mail, (err, res) => {
    if (err) {
      console.error(err);
      result.json({
        result: 'FAIL',
        reason: '400',
        message: 'Get Device Error',
      });
      return;
    }
    result.json({
      result: 'OK',
      reason: '200',
      data: res,
    });
  });
};
