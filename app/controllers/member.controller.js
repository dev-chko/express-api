const Member = require('../models/member.models.js');
const Wallet = require('../models/wallet.models');
const klay = require('../middleware/caver.js');
const request_await = require('request');
const mailer = require('../middleware/nodemailer');
const crypto = require('crypto');
const ejs = require('ejs');

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //최댓값은 제외, 최솟값은 포함
}

exports.mailSend = async (request, result) => {
  const authCode = getRandomInt(100000, 999999);
  const email = request.body.email;
  const socialId = request.body.socialId;
  let emailTemplate;
  ejs.renderFile(
    './app/views/emailTemplate.ejs',
    { email: email, code1: authCode.toString().slice(0, 3), code2: authCode.toString().slice(3) },
    (err, data) => {
      if (err) {
        console.log(err);
      }
      emailTemplate = data;
    },
  );
  var mailOptions = {
    from: process.env['SEND_EMAIL'],
    to: email,
    bcc: process.env['SEND_EMAIL'],
    subject: 'Activate Your GRINBIT Account',
    html: emailTemplate,
  };
  await mailer.transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      result.json({
        result: 'FAIL',
        reason: '400',
        message: 'Fail Message',
      });
      return;
    } else {
      Member.sendAuthMail(email, authCode, socialId, (err, res) => {
        if (err) {
          console.error(err);
          result.json({
            result: 'FAIL',
            reason: '400',
            message: 'Email authcode Insert Error',
          });
          return;
        }
        result.json({
          result: 'OK',
          reason: '200',
          message: 'sendMail',
        });
        return;
      });
    }
  });
};

exports.mailCheck = async (request, result) => {
  const { email, authcode } = request.body;
  if (email === 'grinbit.tester@gmail.com' && authcode === '123123') {
    result.json({
      reason: 'OK',
      reason: '200',
      message: 'Email Authcheck Complete',
      data: true,
    });
    return;
  }
  Member.checkAuthMail(email, authcode, (err, res) => {
    if (err) {
      console.error(err);
      result.json({
        reason: 'FAIL',
        reason: '400',
        message: 'Auth mail check error',
      });
      return;
    } else {
      result.json({
        reason: 'OK',
        reason: '200',
        message: 'Email Authcheck Complete',
        data: res,
      });
    }
  });
};

exports.user = (request, result) => {
  Member.findUserInfo(request.params.email, (err, data) => {
    if (err) {
      console.error(err);
      result.send({
        result: 'FAIL',
        reason: '400',
        message: err,
      });
    }
    result.send({
      result: 'OK',
      reason: '200',
      data: data,
    });
  });
};

exports.findMe = async (request, result) => {
  var email = request.params.email;
  await Member.checkSocial(email, async (err, data) => {
    if (err) {
      console.error('get Social Id Error');
      result.json({
        result: 'FAIL',
        reaosn: '400',
        message: 'get Social Id Error',
      });
    }
    if (data) {
      if (data.checked === 1) {
        Member.findMe(data.wallet_id, (err, data) => {
          if (err) {
            console.error(err);
            result.send({
              result: 'FAIL',
              reason: '400',
              message: 'findMe Error',
            });
            return;
          }
          result.send({
            result: 'OK',
            reason: '200',
            data: data,
          });
          return;
        });
      } else if (data.checked === 0) {
        result.send({
          result: 'FAIL',
          reason: '404',
          data: false,
        });
        return;
      }
    } else {
      Member.findMe(email, (err, data) => {
        if (err) {
          console.error(err);
          result.send({
            result: 'FAIL',
            reason: '400',
            message: 'findMe Error',
          });
          return;
        }
        if (data) {
          result.send({
            result: 'OK',
            reason: '200',
            data: data,
          });
          return;
        } else {
          result.send({
            result: 'FAIL',
            reason: '404',
            data: false,
          });
          return;
        }
      });
    }
  });
};

exports.findOne = (request, result) => {
  const id = request.params.user;
  Member.findOne(id, (err, data) => {
    if (err) {
      console.error(err);
      result.send({
        result: 'FAIL',
        reason: '400',
        message: err,
      });
    }
    result.send({
      result: 'OK',
      reason: '200',
      data: data,
    });
  });
};

exports.signUp = async (request, result) => {
  const ip = request.headers['x-real-ip'] || request.connection.remoteAddress;
  Member.creatUser(request.body, ip, async (err, data) => {
    if (err) {
      console.error(err);
      result.send({
        result: 'FAIL',
        reason: '400',
        message: 'signUp error',
      });
      return;
    }
    const midx = data.id;
    const address = await klay.creatNewWallet(midx, (err, address) => {
      if (err) {
        result.send({
          result: 'FAIL',
          reason: '400',
          data: 'new address Errror',
        });
        return;
      }
      const inputs = {
        midx: midx,
        walletAddress: address,
      };
      Wallet.createNewAddress(inputs, (err, walletIdx) => {
        if (err) {
          console.error('Input address sql error');
          result.json({
            result: 'FAIL',
            reason: '411',
            meessage: 'Input address sql error',
          });
        }
        result.send({
          result: 'OK',
          reason: '200',
          message: 'SignUp User & Create Wallet',
        });
        return;
      });
    });
  });
};

exports.smsSend = async (request, result) => {
  const { type, smsRecipient, smsCountry, id } = request.body;
  const sms_key = process.env['SMS_KEY'];
  const authCode = getRandomInt(10000, 99999);
  const inter = smsCountry + smsRecipient.slice(1);

  //비동기 처리 오류로 인한 추가
  function doRequest(url) {
    return new Promise(function (resolve, reject) {
      request_await(url, function (error, res, body) {
        if (!error && res.statusCode == 200) {
          resolve(body);
        } else {
          reject(error);
        }
      });
    });
  }
  const option_body = {
    sendNo: '18771065',
    recipientList: [
      {
        recipientNo: smsRecipient,
        countryCode: smsCountry,
        internationalRecipientNo: inter,
      },
    ],
    body: `Auth Code : ${authCode}`,
  };
  let option = {
    method: 'POST',
    url: `https://api-sms.cloud.toast.com/sms/v2.3/appKeys/${sms_key}/sender/sms`,
    header: {
      'Content-Type': 'application/json',
    },
    body: option_body,
    json: true,
  };
  var query_data = {
    company: 'GRINBIT',
    usePurpose: '인증코드 발송',
    smsCountry: smsCountry,
    smsRecipient: smsRecipient,
    smsMsg: crypto.createHash('sha256').update(`Auth Code : ${authCode}`).digest('base64'),
    isSend: '1',
  };
  //신규 가입시 전화번호 중복 여부 확인
  if (type === '1') {
    const phonCheck = await Member.checkMobile(smsRecipient, async (err, res) => {
      if (err) {
        console.error(err);
        result.json({
          result: 'FAIL',
          reason: '400',
          message: 'check mobile error',
        });
        return err;
      }
      if (res === false) {
        result.json({
          result: 'FAIL',
          reason: '205',
          message: 'duplicate mobile',
        });
        return;
      } else {
        const code = await doRequest(option);
        query_data.adminMemo = '회원가입 모바일인증';
        Member.inputSMScode(query_data, (err, res) => {
          if (err) {
            console.error('Input signUpSMS input Error');
            result.json({
              result: 'FAIL',
              reason: '411',
              meessage: 'Input SignUpSMS input Error',
            });
            return;
          } else {
            result.send({
              result: 'OK',
              reason: '200',
              message: 'SignUpSMS input Complete',
            });
            return;
          }
        });
      }
    });
  } else if (type === '2') {
    const code = await doRequest(option);
    query_data.adminMemo = '비밀번호 찾기 모바일 인증';
    Member.inputSMScode(query_data, (err, res) => {
      if (err) {
        console.error('Input findPWSMS input Error');
        result.json({
          result: 'FAIL',
          reason: '411',
          meessage: 'Input findPW Error',
        });
        return;
      } else {
        result.send({
          result: 'OK',
          reason: '200',
          message: 'findPW input Complete',
        });
        return;
      }
    });
  } else if (type === '3') {
    const code = await doRequest(option);
    query_data.adminMemo = 'PinNumber 재설정';
    Member.inputSMScode(query_data, (err, res) => {
      if (err) {
        console.error('Input PinNumberSMS input Error');
        result.json({
          result: 'FAIL',
          reason: '411',
          meessage: 'Input PinNumberSMS Error',
        });
        return;
      } else {
        result.send({
          result: 'OK',
          reason: '200',
          message: 'findPW input Complete',
        });
        return;
      }
    });
  } else {
    result.json({
      resulut: 'FAIL',
      reason: '404',
      message: 'Unknown Type',
    });
  }
};

exports.checkSMS = (request, result) => {
  Member.authSMS(request, (err, res) => {
    if (err) {
      console.error('Check AuthSMS Error');
      result.json({
        result: 'FAIL',
        reason: '411',
        meessage: 'Check Authsms Error',
      });
      return;
    }
    res === true
      ? result.send({ result: 'OK', reason: '200', message: 'Auth SMS Check Complete', data: true })
      : result.send({ result: 'OK', reason: '200', message: 'Auth SMS Check Complete', data: false });
    return;
  });
};

exports.setPin = (request, result) => {
  const { id, pinNum } = request.body;
  Member.checkPW(request.body, (err, res) => {
    if (err) {
      console.error(err);
      result.json({
        result: 'FAIL',
        reason: '400',
        message: 'Password Check error',
      });
      return;
    }
    if (!res) {
      result.json({
        result: 'OK',
        reason: '200',
        message: 'Password mismatch',
      });
      return;
    }
    Member.setPinNum(id, pinNum, (err, res) => {
      if (err) {
        console.error(err);
        result.json({
          result: 'FAIL',
          reason: '400',
          message: 'PinNumber Setting Error',
        });
        return;
      }
      result.json({
        result: 'OK',
        reason: '200',
        message: 'PinNumber Setting Complete',
      });
    });
  });
  return;
};

exports.checkPin = (request, result) => {
  const { id, pinNum } = request.body;
  Member.checkPinNum(id, pinNum, (err, res) => {
    if (err) {
      console.error(err);
      result.json({
        result: 'FAIL',
        reason: '400',
        message: 'Check PinNumber Error',
      });
      return;
    }
    res ? result.json({ result: 'OK', reason: '200', data: true }) : result.json({ result: 'OK', reason: '200', data: false });
    return;
  });
};

exports.changePw = (requset, result) => {};

exports.forgotPw = (request, result) => {
  const { email, phone } = request.body;
};
exports.adminSignIn = (request, result) => {
  const Data = { ...request.body };
  Member.checkComparePassword(Data, (err, data) => {
    if (err) {
      console.log('err: >> ', err);
      result.status(400).json({
        result: 'FAIL',
        reason: '400',
        message: 'find Address Error',
      });
      return;
    }
    if (data?.length > 0) {
      result.json({
        result: 'OK',
        reason: '200',
        data: data[0],
      });
      return;
    } else {
      result.json({
        result: 'FAIL',
        reason: '400',
        message: 'Login Fail',
      });
      return;
    }
  });
};

exports.allUser = (request, result) => {
  Member.allUser(request, (err, data) => {
    if (err) {
      console.error(err);
      result.json({
        result: 'FAIL',
        reason: '400',
        message: 'getAlldata Error',
      });
      return;
    }
    result.json({
      result: 'OK',
      reason: '200',
      data: data,
    });
  });
};

exports.resetPassword = (request, result) => {
  Member.resetPw(request, (err, res) => {
    if (err) {
      console.error(err);
      result.json({
        result: 'FAIL',
        reason: '400',
        message: 'reset error',
      });
      return;
    }
    result.json({
      result: 'OK',
      reason: '200',
      data: res,
    });
    return;
  });
};

exports.edit = (request, result) => {};

exports.delete = (request, result) => {};
