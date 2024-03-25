const sql = require('./db.js');
const crypto = require('crypto');
const dayjs = require('dayjs');
/* 시간 설정 
var now = dayjs();
const regData = now.format('YYYY-MM-DD HH:mm:ss');
*/

const Defi = function (defi) {};

Defi.getProduct = (request, result) => {
  const sql_query = `Select * from stakingList where sidx=${request}`;
  sql.query(sql_query, (err, res) => {
    if (err) {
      console.error(err);
      result(err, null);
      return;
    }
    result(null, res);
  });
};

Defi.stakingAllList = (result) => {
  const sql_query = `Select
      *
  from
      stakingList
  order by recruitmentStart desc, productRange asc `;

  sql.query(sql_query, (err, res) => {
    if (err) {
      console.error(`error :>> `, err);
      result(err, null);
      return;
    }
    result(null, res);
    return;
  });
};

Defi.getOptionProduct = (request, result) => {
  console.log('request :>> ', request);
  const sql_query = `select * from stakingList where round=${request}`;

  sql.query(sql_query, (err, data) => {
    if (err) {
      console.error(err);
      result(err, null);
      return;
    }
    result(null, data);
  });
};

Defi.getTotalRound = (result) => {
  const sql_query = `select DISTINCT round from stakingList`;
  sql.query(sql_query, (err, res) => {
    if (err) {
      console.error(err);
      result(err, null);
      return;
    } else {
      result(null, res);
    }
  });
};

Defi.checkProduct = (request, result) => {
  var now = dayjs();
  const regData = now.format('YYYY-MM-DD HH:mm:ss');
  const sql_query = `select * from stakingList where (sidx=${request.sidx} and recruitmentEnd > '${regData}')`;
  sql.query(sql_query, (err, data) => {
    if (err) {
      console.error(err);
      result(err, null);
    } else {
      data.length > 0 ? result(null, data[0]) : result('Do not Match Product', null);
    }
  });
};

Defi.stakingList = (request, result) => {
  var now = dayjs();
  const regData = now.format('YYYY-MM-DD HH:mm:ss');
  var retry = '';
  var rootSidx = '';
  console.log('request :>> ', request);
  request?.retry === 'true' ? (retry = `&& (productStatus=3)`) : (retry = `&& (productStatus=0)`);
  if (request?.rootsidx) {
    rootSidx = `&& rootSidx='${request?.rootsidx}'`;
  }
  const sql_query = `Select
      *
  from
      stakingList
  where recruitmentEnd > '${regData}' ${retry} ${rootSidx}
  order by round desc, productRange asc `;
  sql.query(sql_query, (err, res) => {
    if (err) {
      console.error(`error :>> `, err);
      result(err, null);
      return;
    }
    result(null, res);
    return;
  });
};

Defi.mobileStaking = (request, result) => {
  var now = dayjs();
  const regData = now.format('YYYY-MM-DD HH:mm:ss');
  var retry = '';
  request === 'true' ? (retry = `&& (productStatus=3)`) : (retry = `&& (productStatus=0)`);
  const sql_query = ` Select * from stakingList where (recruitmentEnd > '${regData}') && (recruitmentStart < '${regData}') ${retry} order by productRange asc;`;
  sql.query(sql_query, (err, res) => {
    if (err) {
      console.error(`error :>> `, err);
      result(err, null);
      return;
    }
    result(null, res);
    return;
  });
};

Defi.avoidDuplication = (request, result) => {
  const { midx, round } = request;
  let sql_query = `select count(*) as count  from contractTable where (midx=${midx} && round=${round})`;
  sql.query(sql_query, (err, data) => {
    if (err) {
      console.error(err);
      result(err, null);
    }
    if (data[0].count > 0) {
      // console.log('Already Contract');
      result(null, true);
    } else {
      // console.log('Contract, start');
      result(null, false);
    }
  });
};

Defi.getMyContract = (request, result) => {
  let sql_query = `select * from contractTable where midx=${request}`;
  sql.query(sql_query, (err, res) => {
    if (err) {
      console.error('error :>> ', err);
      result(err, null);
    }
    result(null, res);
  });
};

Defi.getOneContract = (request, result) => {
  let sql_query = `select * from contractTable where ctidx=${request}`;
  sql.query(sql_query, (err, res) => {
    if (err) {
      console.error('error :>> ', err);
      result(err, null);
    }
    result(null, res);
  });
};

Defi.makeProduct = (request, result) => {
  const newData = { ...request.body };
  sql.query(`Insert Into stakingList set ? `, newData, (err, res) => {
    if (err) {
      console.error(err);
      result(err, null);
      return;
    }
    result(null, { id: res.insertId });
  });
};

Defi.eidtProduct = (id, request, result) => {
  const newData = { ...request.body };
  // const product = {
  //   productName: newData.name,
  //   productRange: newData.range,
  //   productDesc: newData.desc,
  //   interestRate: newData.rate,
  //   productStatus: newData.status,
  // };
  console.log('newData', newData);
  sql.query(`Update stakingList set ? where sidx=${id}`, newData, (err, res) => {
    if (err) {
      console.error(err);
      result(err, null);
      return;
    }
    result(null, id);
  });
};

Defi.deletProduct = (id, result) => {
  sql.query(`Delete From stakingList where sidx=${id}`, (err, data) => {
    if (err) {
      console.error(err);
      result(err, null);
      return;
    }
    result(null, true);
  });
};

Defi.createContract = (request, result) => {
  var now = dayjs();
  const newData = { ...request };
  newData.contractStart = now.format('YYYY-MM-DD HH:mm:ss');
  newData.contractEnd = now.add(newData.period, 'day').format('YYYY-MM-DD HH:mm:ss');
  delete newData.period;
  sql.query(` Insert Into contractTable set ? `, newData, (err, res) => {
    if (err) {
      console.error(err);
      result(err, null);
      return;
    }
    result(null, { id: res.insertId });
    return;
  });
};

Defi.getSummery = (request, result) => {
  var now = dayjs();
  const sql_query_doing = `select total_wallet.contractTable.sidx, total_wallet.contractTable.contractStart, total_wallet.contractTable.contractEnd, total_wallet.contractTable.interestRate,
  total_wallet.contractTable.amount, total_wallet.stakingList.productRange from total_wallet.contractTable cross join total_wallet.stakingList
  On 
  total_wallet.contractTable.sidx = total_wallet.stakingList.sidx where (midx=${request} && contractStatus=0 )`;
  const sql_query_end = `select  count(*) as count from contractTable where (midx=${request} && (contractStatus=1 || contractStatus=3 || contractStatus=6))`;
  sql.query(sql_query_doing, (err, doing) => {
    if (err) {
      console.error(err);
      result(err, null);
    }
    var sumReward = 0;
    var totalAmount = 0;
    var totalContract = 0;
    var maxContract = 0;
    for (let i = 0; i < doing.length; i++) {
      maxContract = +doing[i].productRange;
      var startDay = dayjs(doing[i].contractStart).format('YYYY-MM-DD HH:mm:ss');
      var endDay = dayjs(doing[i].contractEnd).format('YYYY-MM-DD HH:mm:ss');
      var contractDoing = dayjs().diff(dayjs(doing[i].contractStart).format('YYYY-MM-DD HH:mm:ss'), 'day');
      const diff = dayjs(doing[i].contractEnd).diff(doing[0].contractStart, 'day');
      const dailyReward = doing[i].interestRate / diff / 100;
      maxContract > contractDoing
        ? (sumReward += parseFloat(contractDoing * dailyReward * doing[i].amount))
        : (sumReward += parseFloat(maxContract * dailyReward * doing[i].amount));
      // console.log(parseFloat(contractDoing * dailyReward * doing[i].amount));
      totalAmount += parseFloat(doing[i].amount);
      totalContract = i + 1;
    }
    const data = {
      total: totalAmount,
      reward: sumReward,
      count: totalContract,
    };
    // var diff = startDay.diff(endDay, 'day');
    sql.query(sql_query_end, (err, End) => {
      if (err) {
        console.error(err);
        result(err, null);
      }
      result(null, {
        endContract: End?.[0],
        doingContract: data,
      });
    });
  });
};

Defi.getAllContract = (request, result) => {
  var status = '';
  if (request.query?.contractStatus === 'all') {
    status = `where (contractStatus=1 or contractStatus=3 || contractStatus=6) `;
  } else if (request.query?.contractStatus === '1') {
    status = `where contractStatus=1`;
  } else if (request.query?.contractStatus === '3') {
    status = `where contractStatus=3`;
  } else if (request.query?.contractStatus === '6') {
    status = `where contractStatus=6`;
  } else {
    status = '';
  }
  switch (request.query.contractStatus) {
    case 'all':
      status = '';
      break;
    case '0':
      status = `where contractStatus=0`;
      break;
    case '1':
      status = `where contractStatus=1`;
      break;
    case '3':
      status = `where contractStatus=3`;
      break;
    case '4':
      status = `where contractStatus=4`;
      break;
    case '6':
      status = `where contractStatus=6`;
      break;
    case '7':
      status = `where contractStatus=7`;
      break;
    default:
      status = '';
  }
  const sql_query = `Select 
	tb_member.midx, tb_member.id, contractTable.rewardHash, contractTable.sidx, contractTable.useStaking,
    tb_member.name, tb_member.mobile, tb_member.originCoin, tb_member.blackCoin,
	  contractTable.walletAddress, contractTable.amount, contractTable.round,
    contractTable.txHash, contractTable.interestRate, contractTable.amount,
    contractTable.contractEnd , contractTable.contractStart, contractTable.ctidx,
    contractTable.contractStatus
from 
	contractTable
cross join 
	tb_member 
On 
	tb_member.mIdx = contractTable.mIdx 
  ${status}
Order by
  ctidx desc;`;
  sql.query(sql_query, (err, data) => {
    if (err) {
      console.error(err);
      result(err, null);
    }
    result(null, data);
  });
};

Defi.getDownload = (req, res) => {
  var now = dayjs();
  const regData = now.format('YYYY-MM-DD HH:mm:ss');
  var sql_query = `select * from stakingList where recruitmentEnd < ${regData}`;
  sql.query(sql_query, (err, res) => {
    if (err) {
      result(err, Null);
      return;
    }
  });
};

Defi.RewardToken = (request, result) => {
  var now = dayjs();
  const regData = now.format('YYYY-MM-DD HH:mm:ss');
  const update = {
    contractStatus: `${request.contractStatus}`,
    rewardHash: `${request.Hash}`,
    confirmDate: regData,
  };
  var sql_query = `Update contractTable SET ? where ctidx=${request.ctidx}`;
  sql.query(sql_query, update, (err, data) => {
    if (err) {
      console.error(err);
      result(err, null);
    } else {
      result(null, 'Update Staking Complete');
    }
  });
};

Defi.eidtContract = (request, result) => {
  var now = dayjs();
  const regData = now.format('YYYY-MM-DD HH:mm:ss');
  const update = {
    contractStatus: request.contractStatus,
    useStaking: request?.useStaking,
  };
  request.contractStatus === 3 || 6 ? (update.requestDate = regData) : (update.confirmDate = regData);

  var sql_query = `Update contractTable SET ? where ctidx="${request.ctidx}"`;
  sql.query(sql_query, update, (err, res) => {
    if (err) {
      console.log('err :>> ', err);
      result(err, null);
    } else {
      result(null, { ctidx: res.changedRows });
    }
  });
};

Defi.reContract = (request, result) => {};

module.exports = Defi;
