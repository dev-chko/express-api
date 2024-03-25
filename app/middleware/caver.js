const Caver = require('caver-js');
const keyFile = require('../middleware/keyfile.js');
// const keyFile = require('./app/middleware/keyfile.js')
const crypto = require('crypto');

const caver = new Caver(process.env['WALLET_ADDRESS']);
// const contractAddr_OLD = process.env['WALLET_KIP7_OLD']
const contractAddr = process.env['WALLET_KIP7_NEW'];

var getFeepayer = {
  address: process.env['WALLET_FEE_ADDRESS'],
  pass: process.env['WALLET_FEE_PASSWORD'],
};

const KIP7 = caver.kct.kip7.create(contractAddr);
// const KIP7 = caver.kct.kip7.create('0xe91b524f88277d17c1b302505e12f74fb88c7efe')

exports.validateAddress = async (addr) => {
  const checkAddr = await caver.utils.isAddress(addr);
  return checkAddr;
};

exports.gasPrice = async () => {
  const gasPrice = await caver.klay.gasPriceAt();
  const fee = (await caver.utils.fromPeb(parseInt(gasPrice), 'KLAY')) * 75000;
  return fee;
};

exports.getBalance = async (addr, result) => {
  const KLAY = await caver.klay.getBalance(addr);
  const GRBT = await KIP7.balanceOf(addr);
  const amount = {
    KLAY: caver.utils.fromPeb(KLAY, 'KLAY'),
    GRBT: `${caver.utils.fromPeb(GRBT, 'KLAY')}`,
  };
  result(null, amount);
  return;
};

exports.FeeSendTransferKIP = async (To, From, FPassword, Amount, result) => {
  const FromPass = await caver.klay.personal.unlockAccount(From, FPassword);
  const FeePass = await caver.klay.personal.unlockAccount(getFeepayer.address, getFeepayer.pass);
  var balance = Number.MAX_SAFE_INTEGER;
  await KIP7.balanceOf(From).then((res) => {
    balance = caver.utils.fromPeb(res);
  });
  // console.log('parseInt(balance) < parseInt(Amount) :>> ', mathjs.bignumber(balance), Amount);
  if (parseFloat(balance) < parseFloat(Amount)) {
    console.log('blance < Amount');
    console.log('Balance Lacked', From, '->', Amount, '->', To);
    result('more Amount', null);
    return;
  }
  await KIP7.transfer(
    To,
    caver.utils.toPeb(`${Amount}`, 'KLAY'),
    {
      from: From,
      feeDelegation: true,
      feePayer: getFeepayer.address,
      gas: '75000',
    },
    // getFeepayer.pass,
  )
    .then((res) => {
      result(null, res);
      return;
    })
    .catch((error) => {
      console.error('error :>> ', To, error);
      if (error.toString() === 'Error: Returned error: gas required exceeds allowance or always failing transaction') {
        result({ reason: '601', message: `${error.toString().slice(23)}` }, null);
      } else if (error.toString() === 'Error: Returned error: insufficient funds of the sender for value ') {
        console.log(error.toString().slice(23));
        result({ reason: '602', message: `${error.toString().slice(23)}` }, null);
      } else if (error.toString() === 'Error: Returned error: intrinsic gas too low ') {
        result({ reason: '603', message: `${error.toString().slice(23)}` }, null);
      } else {
        console.error(`${To} GRBT Send Error`);
        result({ reason: '600', message: `${error}` }, null);
      }
    });
  caver.klay.personal.lockAccount(From);
  caver.klay.personal.lockAccount(getFeepayer.address);
};

exports.FeeSendTransferKIP_OLD = async (To, From, FPassword, Amount, result) => {
  const KIP7_OLD = caver.kct.kip7.create(process.env['WALLET_KIP7_OLD']);
  const FromPass = await caver.klay.personal.unlockAccount(From, FPassword);
  const FeePass = await caver.klay.personal.unlockAccount(getFeepayer.address, getFeepayer.pass);
  const feePayerKIP7 = await KIP7_OLD.transfer(
    To,
    caver.utils.toPeb(`${Amount}`, 'KLAY'),
    { from: From, feeDelegation: true, feePayer: getFeepayer.address, gas: '75000' },
    getFeepayer.pass,
  )
    .then((res) => {
      result(null, res);
    })
    .catch((error) => {
      console.log('error :>> ', To, error.toString().slice(23));
      if (error.toString() === 'Error: Returned error: gas required exceeds allowance or always failing transaction') {
        result({ reason: '601', message: `${error.toString().slice(23)}` }, null);
      } else if (error.toString() === 'Error: Returned error: insufficient funds of the sender for value ') {
        console.log(error.toString().slice(23));
        result({ reason: '602', message: `${error.toString().slice(23)}` }, null);
      } else if (error.toString() === 'Error: Returned error: intrinsic gas too low ') {
        result({ reason: '603', message: `${error.toString().slice(23)}` }, null);
      } else {
        console.error(`${To} GRBT Send Error`);
        result({ reason: '600', message: `${error.toString().slice(23)}` }, null);
      }
    });
  caver.klay.personal.lockAccount(From);
  caver.klay.personal.lockAccount(getFeepayer.address);
};

exports.FeeSendTransferKlay = async (To, From, Password, Amount, result) => {
  const sendWallet = await keyFile.getPrivKey(From, Password);
  const sender = await caver.klay.accounts.wallet.add(sendWallet.privateKey);
  const feeWallet = await keyFile.getPrivKey(getFeepayer.address, getFeepayer.pass);
  const feePayer = await caver.klay.accounts.wallet.add(feeWallet.privateKey);
  await caver.klay.accounts
    .signTransaction(
      { type: 'FEE_DELEGATED_VALUE_TRANSFER', from: sender.address, to: To, gas: '35000', value: caver.utils.toPeb(Amount, 'KLAY') },
      sender.privateKey,
    )
    .then(async (rawTransaction) => {
      result(null, res);
      await caver.klay
        .sendTransaction({ senderRawTransaction: rawTransaction.rawTransaction, feePayer: getFeepayer.address })
        .then((res) => {
          result(null, res);
        })
        .catch((error1) => {
          console.error(error1);
          result(error1, null);
        });
    })
    .catch((error2) => {
      console.error(error2);
      result(error2, null);
    });
  caver.klay.accounts.wallet.remove(getFeepayer.address);
  caver.klay.accounts.wallet.remove(sendWallet.address);
};

exports.sendKIPTransfer = async (To, From, Password, Amount, result) => {
  const FromPass = await caver.klay.personal.unlockAccount(From, Password);
  await KIP7.transfer(To, caver.utils.toPeb(`${Amount}`, 'KLAY'), { from: From })
    .then((res) => {
      result(null, res);
    })
    .catch((error) => {
      console.log('error :>> ', To, error.toString().slice(23));
      if (error.toString() === 'Error: Returned error: gas required exceeds allowance or always failing transaction') {
        result({ reason: '601', message: `${error.toString().slice(23)}` }, null);
      } else if (error.toString() === 'Error: Returned error: insufficient funds of the sender for value ') {
        console.log(error.toString().slice(23));
        result({ reason: '602', message: `${error.toString().slice(23)}` }, null);
      } else if (error.toString() === 'Error: Returned error: intrinsic gas too low ') {
        result({ reason: '603', message: `${error.toString().slice(23)}` }, null);
      } else {
        console.error(`${To} GRBT Send Error`);
        result({ reason: '600', message: `${error.toString().slice(23)}` }, null);
      }
    });
  await caver.klay.personal.lockAccount(From);
};

exports.sendTransferKlay = async (To, From, Password, Amount, result) => {
  const sendWallet = await keyFile.getPrivKey(From, Password);
  const sender = await caver.klay.accounts.wallet.add(sendWallet.privateKey);
  await caver.klay
    .sendTransaction({
      type: 'VALUE_TRANSFER',
      from: sender.address,
      to: To,
      gas: '35000',
      value: caver.utils.toPeb(Amount, 'KLAY'),
    })
    .then((res) => {
      result(null, res);
    })
    .catch((error) => {
      console.log('error :>> ', To, error.toString().slice(23));
      if (error.toString() === 'Error: Returned error: gas required exceeds allowance or always failing transaction') {
        result({ reason: '601', message: `${error.toString().slice(23)}` }, null);
      } else if (error.toString() === 'Error: Returned error: insufficient funds of the sender for value ') {
        console.log(error.toString().slice(23));
        result({ reason: '602', message: `${error.toString().slice(23)}` }, null);
      } else if (error.toString() === 'Error: Returned error: intrinsic gas too low ') {
        result({ reason: '603', message: `${error.toString().slice(23)}` }, null);
      } else {
        console.error(`${To} KLAY Send Error`);
        result({ reason: '600', message: `${error.toString().slice(23)}` }, null);
      }
    });
  await caver.klay.accounts.wallet.remove(From);
};

exports.creatNewWallet = async (password, result) => {
  const wallet_pw = crypto.createHash('sha256').update(`${password}qlc_@^&`).digest('base64');
  // const address = await caver.klay.personal.newAccount(wallet_pw).then((address) => {})
  const address = await caver.klay.personal.newAccount(wallet_pw);
  if (!address) {
    console.error('New address Error');
    result('New address Error', null);
    return;
  }
  result(null, address);
};
