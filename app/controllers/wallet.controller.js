const Wallet = require('../models/wallet.models.js');
const klay = require('../middleware/caver.js');

exports.swap = async (request, result) => {
  const whiteList = ['36.38.26.187', '36.38.26.186', '211.63.197.89', '36.38.26.190', '127.0.0.1'];
  // const whiteList = ['36.38.26.187', '36.38.26.186', '211.63.197.89'];
  var ip = request.headers['x-real-ip'] || request.connection.remoteAddress;
  if (whiteList.indexOf(ip) === -1) {
    result.send({
      result: 'FAIL',
      reason: '400',
      message: 'Do not attch server',
    });
    console.error('Unkown IP :>> ', ip);
    return;
  }

  const burn_storage = process.env['BURN_STORAGE'];
  const swap_address = process.env['SWAP_ADDRESS'];
  const swap_pass = process.env['SWAP_PASSWORD'];
  const { address, amount, swap, midx, id } = request.body;
  if (amount <= 80) {
    console.log(`${id} minimum quantity underachievement`);
    result.send({
      result: 'FAIL',
      reason: '400',
      message: 'minimum quantity underachievement',
    });
    return;
  }
  console.log(`${address} do swap`);
  Wallet.getPass({ id: id, from: address, midx: midx }, (err, res) => {
    if (err) {
      console.error(err);
      result.send({
        result: 'FAIL',
        reason: '400',
        message: 'Get Pass Error',
      });
    }
    klay.FeeSendTransferKIP_OLD(burn_storage, address, res, amount, (err, data) => {
      if (err) {
        console.error(err);
        result.send({
          result: 'FAIL',
          reason: '400',
          message: 'GRBT Send Error',
        });
      }
      const input = {
        toToken: burn_storage,
        from: address,
        amount: amount,
        data: data,
      };
      if (!data) return;
      Wallet.putKIP7Transaction(input, (err, res) => {
        if (err) {
          console.error(err);
          result.send({
            result: 'FAIL',
            reason: '400',
            message: 'Transaction input error 1',
          });
          return;
        }
        console.log(`${id} send storage`);
        klay.FeeSendTransferKIP(address, swap_address, swap_pass, swap, (err, data2) => {
          if (err) {
            console.error(err);
            result.send({
              result: 'FAIL',
              reason: '400',
              message: err,
            });
          }
          const input_2 = {
            toToken: address,
            from: swap_address,
            amount: swap,
            data: data2,
          };
          if (!data2) return;
          Wallet.putKIP7Transaction(input_2, (err, res) => {
            if (err) {
              console.error(err);
              result.send({
                result: 'FAIL',
                reason: '400',
                message: 'Transaction input error 2',
              });
            }
            console.log(`${id} swap Complete`);
            result.send({
              result: 'OK',
              reason: '200',
              message: 'GRBT swap complete',
            });
          });
        });
      });
    });
  });
};

exports.address = (request, result) => {
  Wallet.findAddress(request.params.email, (err, data) => {
    if (err) {
      result.send({
        result: 'FAIL',
        reason: '400',
        message: 'find Address Error',
      });
    }
    result.send({
      result: 'OK',
      reason: '200',
      data: data,
    });
  });
};

exports.phoneToAaddress = (request, result) => {
  Wallet.findMobileAddress(request.params.number, (err, data) => {
    if (err) {
      result.send({
        result: 'FAIL',
        reason: '400',
        message: 'find Address Error',
      });
    }
    result.send({
      result: 'OK',
      reason: '200',
      data: data,
    });
  });
};

exports.balance = async (request, result) => {
  const fee = await klay.gasPrice();
  const address = request.params.address;
  const getCheck = await klay.validateAddress(address);
  if (!getCheck) {
    result.send({
      result: 'FAIL',
      reason: '400',
      message: 'Invalid Wallet Address',
    });
    return;
  }
  Wallet.getBlackToken(address, (err, black) => {
    if (err) {
      console.error(err);
      result.json({
        result: 'FAIL',
        reason: '400',
        message: 'Get BlackToken Error',
      });
      return;
    }
    klay.getBalance(address, (err, data) => {
      if (err) {
        console.log(err);
        result.send({
          result: 'FAIL',
          reason: '400',
          message: err,
        });
        return;
      } else {
        data.fee = `${fee}`;
        data.blackBalance = black[0].blackCoin || '0';
        data.blackCoin = black[0].originCoin || '0';
        result.send({
          result: 'OK',
          reason: '200',
          data: data,
        });
      }
    });
  });
};

exports.transaction = (request, result) => {
  const req = {
    address: request.params.address,
    pageCount: request.query.pagecount,
    pageIndex: request.query.pageindex,
    type: request.query.type,
  };
  Wallet.findTransaction(req, (err, data) => {
    if (err) {
      result.send({
        result: 'FAIL',
        reason: '400',
        message: err,
      });
    }
    Wallet.getTotal(req, (err, data2) => {
      if (err) {
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
        total: data2[0].total,
      });
    });
  });
};

exports.feeSend = async (request, result) => {
  const { from, to, amount, midx, id, token_type } = request.body;
  if (token_type === 'GRBT') {
    Wallet.getPass({ id: id, from: from, midx: midx }, (err, res) => {
      if (err) {
        console.error(err);
        result.send({
          result: 'FAIL',
          reason: '400',
          message: err,
        });
        return;
      }
      klay.FeeSendTransferKIP(to, from, res, amount, (err, data) => {
        if (err) {
          console.error(err);
          result.send({
            result: 'FAIL',
            reason: '400',
            message: err,
          });
          return;
        }
        const input = {
          toToken: to,
          from: from,
          amount: amount,
          data: data,
        };
        if (!data) return;
        Wallet.putKIP7Transaction(input, (err, res) => {
          if (err) {
            console.error(err);
            result.send({
              result: 'FAIL',
              reason: '400',
              message: 'Transaction input error 3',
            });
            return;
          }
          console.log(`${id} send Complete`);
          result.send({
            result: 'OK',
            reason: '200',
            message: 'GRBT send complete',
          });
          return;
        });
      });
    });
  } else if (token_type === 'KLAY') {
    Wallet.getPass({ id: id, from: from, midx: midx }, (err, res) => {
      if (err) {
        console.error(err);
        result.send({
          result: 'FAIL',
          reason: '400',
          message: 'Get Pass Error',
        });
        return;
      }
      klay.FeeSendTransferKlay(to, from, res, amount, (err, data) => {
        if (err) {
          console.err(err);
          result.send({
            result: 'FAIL',
            reason: '400',
            message: 'Klay Send Error',
          });
          return;
        }
        const input = {
          toToken: to,
          from: from,
          amount: amount,
          data: data,
        };
        if (!data) return;
        Wallet.putKlayTransaction(input, (err, res) => {
          if (err) {
            console.error(err);
            result.send({
              result: 'FAIL',
              reason: '400',
              message: 'Transaction input error 4',
            });
            return;
          }
          console.log(`${id} send Complete`);
          result.send({
            result: 'OK',
            reason: '200',
            message: 'KLAY send complete',
          });
          return;
        });
      });
    });
  } else {
    result.send({
      message: 'unkwon type',
    });
    return;
  }
};

exports.newUserAddress = async (request, result) => {
  const { password } = request.body;
  const address = await klay.creatNewWallet(password, (err, data) => {
    if (err) {
      result.send({
        result: 'FAIL',
        reason: '400',
        data: 'new address Errror',
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
};

exports.send = async (request, result) => {
  const { from, to, amount, midx, id, token_type } = request.body;
  if (token_type === 'GRBT') {
    Wallet.getPass({ id: id, from: from, midx: midx }, (err, res) => {
      if (err) {
        console.error(err);
        result.send({
          result: 'FAIL',
          reason: '400',
          message: 'GetPASS Error',
        });
        return;
      }
      klay.sendKIPTransfer(to, from, res, amount, (err, data) => {
        if (err) {
          result.send({
            result: 'FAIL',
            reason: err.reason,
            message: err.message,
          });
          return;
        }
        const input = {
          toToken: to,
          from: from,
          amount: amount,
          data: data,
        };
        Wallet.putKIP7Transaction(input, (err, res) => {
          if (err) {
            console.error(err);
            result.send({
              result: 'FAIL',
              reason: '400',
              message: 'Transaction input error 5',
            });
            return;
          }
          console.log(`${id} send Complete`);
          result.send({
            result: 'OK',
            reason: '200',
            message: 'GRBT send complete',
          });
          return;
        });
      });
    });
  } else if (token_type === 'KLAY') {
    Wallet.getPass({ id: id, from: from, midx: midx }, (err, res) => {
      if (err) {
        console.error(err);
        result.send({
          result: 'FAIL',
          reason: '400',
          message: 'GetPass Error',
        });
        return;
      }
      klay.sendTransferKlay(to, from, res, amount, (err, data) => {
        if (err) {
          result.send({
            result: 'FAIL',
            reason: err.reason,
            message: err.message,
          });
          return;
        }
        data;
        const input = {
          from: from,
          amount: amount,
          data: data,
        };
        Wallet.putKlayTransaction(input, (err, res) => {
          if (err) {
            console.error(err);
            result.send({
              result: 'FAIL',
              reason: '400',
              message: 'Transaction input error',
            });
            return;
          }
          console.log(`${id} send Complete`);
          result.send({
            result: 'OK',
            reason: '200',
            message: 'KLAY send complete',
          });
        });
      });
    });
  } else {
    result.send({
      result: 'FAIL',
      reason: '400',
      message: 'Unkwon type',
    });
  }
};

exports.validate = async (request, result) => {
  const address = request.params.address;
  const valueCheck = await klay.validateAddress(address);
  result.send({
    result: 'OK',
    reason: '200',
    data: valueCheck,
  });
};

exports.getAdBooks = (request, result) => {
  const midx = request.query.midx;
  Wallet.getBookList(midx, (err, res) => {
    if (err) {
      console.error(err);
      result.send({
        result: 'FAIL',
        reason: '400',
        message: 'Get AdBook list query error',
      });
      return;
    }
    result.send({
      result: 'OK',
      reaosn: '200',
      data: res,
    });
    return;
  });
};

exports.latestFrom = (request, result) => {
  const data = {
    address: request.query.address,
    type: request.query.type,
  };
  Wallet.latest(data, (err, res) => {
    if (err) {
      console.error(err);
      result.send({
        result: 'FAIL',
        reason: '400',
        message: 'Get Address Error',
      });
      return;
    }
    result.send({
      result: 'OK',
      reason: '200',
      data: res,
    });
    return;
  });
};

exports.addBooks = (request, result) => {
  const data = {
    midx: request.body.midx,
    nickName: request.body.nickName,
    walletAddress: request.body.address,
    walletName: 'KLAY',
  };
  Wallet.pushBook(data, (err, res) => {
    if (err) {
      console.error(err);
      result.send({
        result: 'FAIL',
        reason: '400',
        message: 'Add Book Error',
      });
      return;
    }
    result.send({
      result: 'OK',
      reaosn: '200',
      data: 'Address Boook add complete',
    });
    return;
  });
};
exports.deletAdBook = (request, result) => {
  const data = {
    midx: request.body.midx,
    adbookIdx: request.body.adbookIdx,
  };
  Wallet.deletadbIdx(data, (err, res) => {
    if (err) {
      console.error(err);
      result.send({
        result: 'FAIL',
        reason: '400',
        message: 'Delete Book Error',
      });
      return;
    }
    result.send({
      result: 'OK',
      reaosn: '200',
      data: 'Address Boook Delete complete',
    });
    return;
  });
};

/*
exports.grinbit = async (req, res) => {
  var request = require('request');
  var options = {
    method: 'GET',
    url: 'https://th-api.klaytnapi.com/v2/transfer?kind=ft&presets=387&size=1000',
    headers: {
      'x-chain-id': '8217',
      'Content-Type': 'application/json',
      presets: '387',
      Authorization:
        'Basic S0FTSzVLUVpWM0RPTlZRNEcwTFQ5U1NCOmQtYnRBUWRsQ1BUdk9HZUtNeWludXkzbG05OVAwNUlKOHoycDB3QVY=',
    },
  };
  request(options, function (error, response) {
    if (error) throw new Error(error);
    var tx_list = [];
    var rt = JSON.parse(response.body);
    console.log(rt.items[0]);
    res.send(rt.items[0]);
  });
};
*/
