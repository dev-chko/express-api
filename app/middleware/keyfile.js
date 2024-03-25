const request = require('request');
const crypto = require('crypto');
const sql = require('../models/db.js');

exports.getPrivKey = async (address, password) => {
  let option = {
    method: 'POST',
    url: process.env['KEYSTOREPATH'],
    header: {
      'Content-Type': 'application/json',
    },
    body: {
      address: address,
      password: password,
    },
    json: true,
  };
  //비동기 처리 오류로 인한 추가
  function doRequest(url) {
    return new Promise(function (resolve, reject) {
      request(url, function (error, res, body) {
        if (!error && res.statusCode == 200) {
          resolve(body);
        } else {
          reject(error);
        }
      });
    });
  }
  const { privKey: key } = await doRequest(option);
  return key;
};
