const sql = require('./db.js');
const crypto = require('crypto');
const dayjs = require('dayjs');
/* 시간 설정 
var now = dayjs();
const regData = now.format('YYYY-MM-DD HH:mm:ss');
*/

const Wallet = function (wallet) {};

Wallet.getBlackToken = (request, result) => {
  let sql_query = `Select
      tb_member.mIdx, tb_member.id, tb_member.email, tb_wallet_info.walletName, tb_wallet_info.walletAddress, tb_member.blackCoin, tb_member.originCoin
  from
      tb_member cross join tb_wallet_info
  On
      tb_member.mIdx = tb_wallet_info.mIdx
  where
      walletAddress='${request}' and walletName='KLAY';`;

  sql.query(sql_query, (err, res) => {
    if (err) {
      console.error(`error`, err);
      result(err, null);
      return;
    }
    result(null, res);
    return;
  });
};

Wallet.findAddress = (email, result) => {
  let sql_query = `
  Select
      tb_member.mIdx, tb_member.id, tb_member.email, tb_wallet_info.walletName, tb_wallet_info.walletAddress
  from
      tb_member cross join tb_wallet_info
  On
      tb_member.mIdx = tb_wallet_info.mIdx
  where
      email='${email}'
    and 
    (walletName='KLAY' or walletName='GRBT')`;
  sql.query(sql_query, (err, res) => {
    if (err) {
      console.error(`error`, err);
      result(err, null);
      return;
    }
    result(null, res);
    return;
  });
};

Wallet.findMobileAddress = (request, result) => {
  let sql_query = `
  Select * tb_member from `;
};

Wallet.findTransaction = (request, result) => {
  const { address, pageCount, pageIndex, type } = request;
  let start = pageIndex == 1 ? 0 : (pageIndex - 1) * pageCount;
  let end = pageCount * pageIndex;
  let sql_query = `SELECT * FROM tb_transaction where division='${type}' and
   ( tokenTo='${address}' or fromAddress='${address}' or toAddress='${address}') 
   order by regDate desc Limit ${start}, ${end};`;
  sql.query(sql_query, (err, data) => {
    if (err) {
      console.log(err);
      result(err, null);
      return;
    }
    for (let i = 0; i < data.length; i++) {
      data[i].fromAddress.toLowerCase() === address.toLowerCase() ? (data[i].txState = 'S') : (data[i].txState = 'R');
    }
    result(null, data);
    return;
  });
};

Wallet.getTotal = (request, result) => {
  const { address, pageCount, pageIndex, type } = request;
  let sql_query = `SELECT count(*) as total FROM tb_transaction where division='${type}' and ( tokenTo='${address}' or fromAddress='${address}' or toAddress='${address}')`;
  sql.query(sql_query, (err, res) => {
    if (err) {
      console.error(err);
      result(err, null);
      return;
    }
    result(null, res);
  });
};

Wallet.getPass = async (reqeust, result) => {
  const { from, midx, id } = reqeust;
  const sql_query = `select * from tb_wallet_info where (midx=${midx} and walletAddress='${from}');`;
  //   const sql_query = `Select
  //   tb_member.mIdx, tb_member.id, tb_member.email, tb_wallet_info.walletName, tb_wallet_info.walletAddress, tb_member.blackCoin, tb_member.originCoin
  // from
  //   tb_member cross join tb_wallet_info
  // On
  //   tb_member.mIdx = tb_wallet_info.mIdx
  // where
  // (id='${id}' and walletAddress='${from}' and walletName='GRBT');`;
  sql.query(sql_query, (err, res) => {
    if (err) {
      console.error(err);
      result(err, null);
      return;
    }
    if (res.length > 0) {
      if (res[0].mIdx == midx) {
        const password = crypto.createHash('sha256').update(`${midx}qlc_@^&`).digest('base64');
        result(null, password);
      } else {
        result({ message: 'Unmatch User Info' }, null);
      }
    } else {
      const message = { message: 'Unclear information.' };
      console.error(message);
      result(message, null);
      return;
    }
  });
};

Wallet.memberCheck = async (request, result) => {
  const { address, midx, id } = request;
  let sql_query = `
    Select
      tb_member.mIdx, tb_member.id,
        tb_member.email, tb_wallet_info.walletName,
        tb_wallet_info.walletAddress
    from
      tb_member
    cross join
      tb_wallet_info
    On (
        tb_member.mIdx = tb_wallet_info.mIdx
        and
        tb_member.midx=${midx}
        and
        tb_member.email=${id}
        and
        walletAddress=${address}
    `;
  sql.query(sql_query, (err, data) => {
    if (err) {
      console.log(err);
      result(err, null);
      return;
    }
    result(null, data);
    return;
  });
};

Wallet.putKIP7Transaction = (request, result) => {
  if (!request.data.transactionHash) {
    console.log('request.transactionHash :>> ', request.data.transactionHash);
    result('not data', null);
    return;
  }
  var now = dayjs();
  const { from, toToken, amount } = request;
  const { transactionHash, to } = request.data;
  console.log('transactionHash :>> ', transactionHash);
  const regData = now.format('YYYY-MM-DD HH:mm:ss');
  const sql_query = `Insert Into tb_transaction(division, status, txHash, fromAddress, toAddress, tokenTo, tokenValue, regDate) values('GRBT', 'C', '${transactionHash}', '${from}', '${to}', '${toToken}', '${amount}','${regData}') ON DUPLICATE KEY UPDATE txHash='${transactionHash}'`;
  sql.query(sql_query, (err, res) => {
    if (err) {
      console.log(err);
      result(err, null);
      return;
    }
    result(null, 'Transaction insert complete');
  });
};

Wallet.putKlayTransaction = (request, result) => {
  var now = dayjs();
  const { from, toToken, amount } = request;
  const { transactionHash, to } = request.data;
  const regData = now.format('YYYY-MM-DD HH:mm:ss');
  const sql_query = `Insert Into tb_transaction(division, status, txHash, fromAddress, toAddress, ethValue, regDate)values('KLAY', 'C', '${transactionHash}', '${from}', '${to}', '${amount}', '${regData}') ON DUPLICATE KEY UPDATE txHash='${transactionHash}'`;
  sql.query(sql_query, (err, res) => {
    '';
    if (err) {
      console.error(err);
      result(err, null);
      return;
    }
    result(null, 'Transaction insert complete');
  });
};

Wallet.getBookList = (request, result) => {
  var sql_query = `SELECT * FROM tb_member_address_book where midx=${request};`;
  sql.query(sql_query, (err, res) => {
    if (err) {
      console.error(err);
      result(err, null);
      return;
    }
    result(null, res);
  });
};

Wallet.latest = (request, result) => {
  const { address, type } = request;
  var sql_query = `select tokenTo,toAddress, max(regDate) as regDate from total_wallet.tb_transaction
  where division='${type}' and (fromAddress='${address}')
  group by tokenTo, toAddress limit 10`;
  sql.query(sql_query, (err, res) => {
    if (err) {
      console.error(err);
      result(err, null);
      return;
    }
    result(null, res);
  });
};

Wallet.pushBook = (request, result) => {
  const newData = { ...request };
  sql.query(`Insert Into tb_member_address_book SET ?`, newData, (err, res) => {
    if (err) {
      console.error(`err ::> ${err}`);
      result(err, null);
      return;
    }
    result(null, { id: res.insertId });
    return;
  });
};

Wallet.deletadbIdx = (request, result) => {
  const { midx, adbookIdx } = request;
  const sql_quey = `Delete from tb_member_address_book where (adbookIdx=${adbookIdx} and mIdx=${midx} )`;
  sql.query(sql_quey, (err, res) => {
    if (err) {
      console.error(err);
      result(err, null);
      return;
    }
    result(err, res);
  });
};

Wallet.createNewAddress = (request, result) => {
  const newData = { ...request };
  var now = dayjs();
  newData.regDate = now.format('YYYY-MM-DD HH:mm:ss');
  newData.walletName = 'KLAY';
  sql.query(`Insert Into tb_wallet_info SET ?`, newData, (err, res) => {
    if (err) {
      console.error(err);
      result(err, null);
    }
    newData.walletName = 'GRBT';
    sql.query(`Insert Into tb_wallet_info SET ?`, newData, (err, res) => {
      if (err) {
        console.error(err);
        result(err, null);
      }
    });
    result(null, { id: res.insertId });
  });
};
module.exports = Wallet;
