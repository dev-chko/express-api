const sql = require('./db.js');
const crypto = require('crypto');
const util = require('util');
const dayjs = require('dayjs');
const cms_sql = require('./CMS_db.js');
const cloud_sql = require('./Cloud_db');

const Member = function (member) {
  var now = dayjs();
  this.id = member.id;
  this.pw = member.pw;
  this.pwKey = String(Date.now() * 0.001);
  this.pinNumber = member.pinNumber || null;
  this.name = member.name;
  this.email = member.id;
  this.emailAuth = member.emailAuth || '1';
  this.language = member.language || 'en';
  this.countryNumber = member.countryNumber || '82';
  this.mobile = member.mobile;
  this.googleOtpUsed = member.googleOtpUsed || '2';
  this.googleOtpKeyStr = member.googleOtpKeyStr || null;
  this.status = member.status || '1';
  this.isSend = member.isSend || '1';
  this.isKyc = member.isKyc || '2';
  this.p2pAuth = member.p2pAuth || '4';
  this.lastLoginDate = now.format('YYYY-MM-DD HH:mm:ss');
  this.regIp = member.regIp || null;
  this.regDate = now.format('YYYY-MM-DD HH:mm:ss');
};

Member.findMe = async (email, result) => {
  var sql_query = `select * from tb_member where id='${email}' limit 1;`;
  sql.query(sql_query, (err, res) => {
    if (err) {
      console.error(err);
      result(err, null);
      return;
    }
    if (res.length > 0) {
      var data = res[0];
      delete data.pw;
      delete data.pwKey;
      data.pinNumber = data.pinNumber ? true : false;
      delete data.emailAuthCode;
      delete data.googleOtpKeyStr;
      result(null, data);
    } else {
      result(null, null);
    }
  });
};

Member.findUserInfo = (email, result) => {
  let sql_query = `
  Select
    tb_member.mIdx, tb_member.id, tb_member.name, tb_member.mobile,
    tb_member.email, tb_wallet_info.walletName,
    tb_wallet_info.walletAddress, tb_member.blackCoin, tb_member.regDate
  from
    tb_member
  cross join
    tb_wallet_info
  On
    tb_member.mIdx = tb_wallet_info.mIdx
  where
    (email='${email}'and walletName='KLAY');`;

  sql.query(sql_query, (err, res) => {
    if (err) {
      console.error(err);
      result(err, null);
      return;
    }
    result(null, res);
  });

  // const query = util.promisify(sql.query).bind(sql);

  // query(sql_query)
  //   .then((data) => result(null, data))
  //   .catch((err) => result(err, null));
};

Member.findOne = (email, result) => {
  var sql_query = `select email from tb_member where id='${email}' limit 1;`;
  sql.query(sql_query, (err, res) => {
    if (err) {
      result(err, null);
      console.error(err);
      return;
    }
    result(null, res);
  });
};
//   const query = util.promisify(sql.query).bind(sql);

//   query(sql_query)
//     .then((data) => result(null, data))
//     .catch((err) => result(err, null));
// };

//require id,pw, email,
Member.creatUser = (newTable, ip, result) => {
  /*
  $pwKey = microtime(true);  //현재 마이크로타임
  //비밀번호 암호화
  $hashedStr =  hashedStr($pwKey.$objParams->memberPw,'SYS_FIX_KEY');
  */
  var now = dayjs();
  delete newTable.type;
  const pwKey = String(Date.now() * 0.001);
  const pwCrypto = crypto.createHash('sha256').update(`${pwKey}${newTable.pw}`).digest('base64');
  const nowTime = now.format('YYYY-MM-DD HH:mm:ss');
  const newData = {
    ...newTable,
    pwKey: pwKey,
    pw: pwCrypto,
    email: newTable.id,
    regDate: nowTime,
    lastLoginDate: nowTime,
    isKyc: '2',
    regIp: ip,
  };
  sql.query(`Insert Into tb_member SET ?`, newData, (err, mem_res) => {
    if (err) {
      console.error(`err create user member`, err);
      result(err, null);
    }
    const cloudData = {
      mIdx: mem_res.insertId,
      name: newData.name,
      email: newData.id,
      pw: newData.pw,
      pwKey: newData.pwKey,
      mobile: newData.mobile,
      mobileAuth: newData.mobileAuth,
    };
    cloud_sql.query(`Insert Into tb_cloud_user set ?`, cloudData, (err, cloud_res) => {
      if (err) {
        console.error(`err create Cloud memeber`, err);
      }
      result(null, { id: mem_res.insertId });
      return;
    });
  });
};

Member.inputSMScode = (newTable, result) => {
  const newData = { ...newTable };
  var now = dayjs();
  newData.sendDate = now.format('YYYY-MM-DD HH:mm:ss');
  newData.regDate = now.format('YYYY-MM-DD HH:mm:ss');
  sql.query(`Insert Into tb_sms SET ?`, newData, (err, res) => {
    if (err) {
      console.error(err);
      result(err, null);
      return;
    }
    result(null, res);
  });
};

Member.authSMS = (request, result) => {
  const { type, smsRecipient, smsAuth } = request.body;
  var adminMemo = '';
  type === '1' ? (adminMemo = '회원가입 모바일인증') : (adminMemo = '비밀번호 찾기 모바일 인증');
  const sql_query = `SELECT smsMsg from tb_sms  where adminMemo='${adminMemo}' and (smsRecipient=${smsRecipient} and regDate >= DATE_ADD(NOW(), INTERVAL -5 MINUTE)) order by smsidx desc limit 1`;
  sql.query(sql_query, async (err, res) => {
    if (err) {
      console.error(err);
      result(err, null);
      return;
    }
    if (res.length === 0) {
      result(null, false);
      return;
    }
    if (res['0'].smsMsg === crypto.createHash('sha256').update(`Auth Code : ${smsAuth}`).digest('base64')) {
      result(null, true);
      return;
    } else {
      result(null, false);
      return;
    }
  });
};

Member.checkMobile = (mobile, result) => {
  const sql_query = `select * from tb_member where mobile='${mobile}'`;
  sql.query(sql_query, (err, res) => {
    if (err) {
      console.error('checkMobile sql error');
      result, (err, null);
      return;
    }
    res.length === 0 ? result(null, true) : result(null, false);
  });
};

Member.checkPW = (request, result) => {
  const { id, pw } = request;
  const sql_query = `Select * from tb_member where (id ='${id}')`;
  sql.query(sql_query, (err, res) => {
    if (err) {
      console.error(err);
      result(err, null);
      return;
    }
    console.log(res[0].pw);
    res[0].pw === crypto.createHash('sha256').update(`${res[0].pwKey}${pw}`).digest('base64') ? result(null, true) : result(null, false);
  });
};

Member.setPinNum = (id, pinNum, result) => {
  const newData = { pinNumber: crypto.createHash('sha256').update(`${pinNum}`).digest('base64') };
  sql.query(`Update tb_member SET ? where id='${id}'`, newData, (err, res) => {
    if (err) {
      console.error(err);
      result(err, null);
      return;
    }
    result(null, res);
  });
};

Member.checkPinNum = (id, pinNum, result) => {
  sql.query(`Select pinNumber from tb_member where id='${id}'`, (err, res) => {
    if (err) {
      console.error(err);
      result(err, null);
      return;
    }
    const pinNumber = crypto.createHash('sha256').update(`${pinNum}`).digest('base64');
    res[0].pinNumber === pinNumber ? result(null, true) : result(null, false);
  });
};

Member.sendAuthMail = (email, authCode, socialId, result) => {
  var now = dayjs();
  const created = now.format('YYYY-MM-DD HH:mm:ss');
  const auth_sha = crypto.createHash('sha256').update(`${authCode}`).digest('base64');
  const sql_query = `Insert Into tb_social_match (social_id, wallet_id, auth_code, created ) values('${socialId}', '${email}', '${auth_sha}', '${created}') ON DUPLICATE KEY UPDATE social_id='${socialId}', auth_code='${auth_sha}', created='${created}', checked='0'`;
  cms_sql.query(sql_query, (err, res) => {
    if (err) {
      console.error(err);
      result(err, null);
      return;
    }
    result(null, true);
  });
};

Member.checkAuthMail = (wallet_id, auth_code, result) => {
  var now = dayjs();
  const auth_sha = crypto.createHash('sha256').update(`${auth_code}`).digest('base64');
  const sql_query = `SELECT * from tb_social_match where (wallet_id='${wallet_id}' && checked='0') and (created >= DATE_ADD(NOW(), INTERVAL -3 MINUTE))`;
  console.log(`auth_code, auth_sha :>> ${auth_code} : ${auth_sha}`);
  cms_sql.query(sql_query, async (err, res) => {
    if (err) {
      console.error(err);
      result(err, null);
      return;
    } else {
      if (res.length > 0) {
        if (res[0].auth_code === auth_sha) {
          console.log('res[0].auth_code :>> ', res[0].auth_code);
          const newData = { modifed: now.format('YYYY-MM-DD HH:mm:ss'), checked: '1' };
          cms_sql.query(`Update tb_social_match SET ? where wallet_id='${wallet_id}'`, newData, (err, res) => {
            if (err) {
              console.error('Auth Email Check input error');
              result(err, null);
              return;
            } else {
              console.log('true :>> ', true);
              result(null, true);
            }
          });
        } else {
          console.log('false :>> ', false);
          result(null, false);
          return;
        }
      } else {
        console.log('false :>> ', false);
        result(null, false);
        return;
      }
    }
  });
};

Member.checkSocial = (socialId, result) => {
  const sql_query = `SELECT wallet_id, checked from tb_social_match where(social_id='${socialId}')`;
  cms_sql.query(sql_query, (err, res) => {
    if (err) {
      console.error(err);
      result(err, null);
      return;
    }
    if (res.length > 0) {
      console.log(res[0]);
      result(null, res[0]);
      return;
    } else {
      result(null, null);
    }
  });
};

Member.checkComparePassword = async (req, res) => {
  var sql_query = `select * from tb_cms_manager where email='${req.id}'`;
  cms_sql.query(sql_query, (err, hashPw) => {
    if (err) {
      console.log(err);
      res(err, null);
      return;
    }
    if (hashPw.length == 0) {
      res('Do Not have admin1', null);
      return;
    } else {
      if (hashPw[0].password === crypto.createHash('sha256').update(`${hashPw[0].pwkey}${req.password}`).digest('base64')) {
        res(null, hashPw);
        return;
      } else {
        res('Password_error', null);
      }
    }
  });
};

Member.allUser = async (req, res) => {
  var sql_query = `Select
    tb_member.midx, tb_member.id, tb_member.name, tb_member.mobile, tb_member.countryNumber, tb_member.originCoin,
    tb_member.email, tb_wallet_info.walletName,
    tb_wallet_info.walletAddress, tb_member.blackCoin, tb_member.regDate
  from
    tb_member
  cross join
    tb_wallet_info
  On
    tb_member.mIdx = tb_wallet_info.mIdx
  where
     walletName='KLAY';`;

  sql.query(sql_query, (err, data) => {
    if (err) {
      console.error(err);
      res(err, null);
      return;
    }
    res(null, data);
    return;
  });
};

Member.resetPw = async (req, res) => {
  const { id, password, email } = req;
  const pwKey = String(Date.now() * 0.001);
  const hasedPw = crypto.createHash('sha256').update(`${pwKey}${password}`).digest('base64');
  `Update tb_notices SET ? where id=${id}`;

  const newData = {
    pwKey: pwKey,
    pw: hasedPw,
  };
  // cms_sql.query(`Update tb_social_match SET ? where wallet_id='${wallet_id}'`, newData, (err, res) => {

  sql.query(`Update  tb_memeber set ? where id=${id}`, newData, (err, res) => {
    if (err) return res(err, null);
    res(null, 'updatePw');
  });
};

module.exports = Member;
