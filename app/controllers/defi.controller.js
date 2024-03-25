const Mdefi = require('../models/defi.models');
const klay = require('../middleware/caver');
const Wallet = require('../models/wallet.models');
const Defi = require('../models/defi.models');
const dayjs = require('dayjs');

//------------Notify--------------------//
const fetch = require('node-fetch');

const notifyToLINE = async (title, log) => {
  //
  var body = [];
  body.push('message=' + encodeURIComponent(`${title}\n${log}`));

  await fetch('https://notify-api.line.me/api/notify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Authorization: `Bearer ${
        process.env['NODE_HTTP_HOST'] === 'cms.grinbit.io'
          ? 'J7gx3DipEO2DdpYM3GJzU7Bj2cn5cuElEyZ61Qr6jKq'
          : 'W3gpfHnAN16x5iADZ5xZMZAR3ZCD4MrPjxw8bIELZW1'
      }`,
    },
    body: body,
  })
    .then((res) => res.json())
    .then((json) => console.log(json))
    .catch((err) => console.warn(err));
};

//------------Notify--------------------//

exports.getProduct = (request, result) => {
  const sidx = request?.params.sidx;
  Mdefi.getProduct(sidx, (err, data) => {
    if (err) {
      console.error(err);
      result.json({
        result: 'FAIL',
        reason: '400',
        message: 'Get Product Error',
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

exports.productList = (request, result) => {
  const addQuery = request?.query;
  if (request.get('user-agent')?.slice(0, 7) === 'Mozilla') {
    Mdefi.stakingList(addQuery, (err, data) => {
      if (err) {
        result.json({
          result: 'FAIL',
          reason: '400',
          message: 'Get Staking List Error',
        });
        return;
      }
      result.json({
        result: 'OK',
        reason: '200',
        data: data,
      });
    });
  } else {
    Mdefi.mobileStaking(addQuery, (err, data) => {
      if (err) {
        result.json({
          result: 'FAIL',
          reason: '400',
          message: 'Get Staking List Error',
        });
        return;
      }
      result.json({
        result: 'OK',
        reason: '200',
        data: data,
      });
    });
  }
};

exports.productAllList = (request, result) => {
  Mdefi.stakingAllList((err, data) => {
    if (err) {
      result.json({
        result: 'FAIL',
        reason: '400',
        message: 'Get Staking List Error',
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

exports.creatProduct = (request, result) => {
  Mdefi.makeProduct(request, (err, data) => {
    if (err) {
      result.json({
        result: 'FAIL',
        reason: '400',
        message: 'Create Product Error',
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

exports.editProduct = (request, result) => {
  const id = request.params.sidx;
  Mdefi.eidtProduct(id, request, (err, data) => {
    if (err) {
      result.json({
        result: 'FAIL',
        reason: '400',
        message: 'Edit product Error',
      });
    }
    result.json({
      result: 'OK',
      reason: '200',
      data: data,
    });
  });
};

exports.deletProduct = (request, result) => {
  const idx = request.params.sidx;
  Mdefi.deletProduct(idx, (err, res) => {
    if (err) {
      result.json({
        result: 'FAIL',
        reason: '400',
        message: 'Delete Product Error',
      });
    }
    result.json({
      result: 'OK',
      reason: '200',
      data: res,
    });
  });
};

exports.getUserContract = (request, result) => {
  Mdefi.getOneContract(request.params.ctidx, (err, data) => {
    if (err) {
      result.json({
        result: 'FAIL',
        reason: '400',
        message: `Get ${request.params.midx} Contract Error`,
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

exports.getUserAllContract = (request, result) => {
  Mdefi.getMyContract(request.query.midx, (err, data) => {
    if (err) {
      result.json({
        result: 'FAIL',
        reason: '400',
        message: `Get ${request.params.midx} Contract Error`,
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

exports.creatContract = async (request, result) => {
  var now = dayjs();
  const newData = { ...request.body };
  const console_data = {
    sidx: newData.sidx,
    midx: newData.midx,
    amount: newData.amount,
    period: newData.period,
    round: newData.round,
  };
  const today = now.get('date'),
    toMonth = now.get('month');
  await Mdefi.checkProduct(console_data, async (err, data) => {
    if (!data) {
      console.error(console_data);
      result.json({
        result: 'Fail',
        reason: '409',
        message: 'End Staking',
      });
      return;
    } else if (parseInt(data.minAmount) > parseInt(console_data.amount) || parseInt(data.maxAmount) <= parseInt(console_data.amount)) {
      console.error('Contract Amount Error');
      console.error(console_data);
      result.json({
        result: 'Fail',
        reason: '408',
        message: 'Contract Amount Error',
      });
      return;
    }
    var blackBalance = '';
    const balacne = await Wallet.getBlackToken(newData.walletAddress, (err, data) => {});
    const staking_address = process.env['STAKING_ADDRESS'];
    const staking_pass = process.env['STAKING_PASSWORD'];
    Defi.avoidDuplication(newData, (err, res) => {
      if (err) {
        console.error(console_data);
        console.error(err);
        result.json({
          result: 'FAIL',
          reason: '400',
          message: 'Contract duplication check Error',
        });
        return;
      }
      if (res === true) {
        console.error(console_data);
        result.json({
          result: 'FAIL',
          reason: '204',
          message: 'Already Contract',
        });
        return;
      } else {
        Wallet.getPass({ from: newData.walletAddress, midx: newData.midx }, (err, pass) => {
          if (err) {
            console.error(err);
            console.error(console_data);
            result.send({
              result: 'FAIL',
              reason: '400',
              message: err,
            });
            return;
          }
          klay.FeeSendTransferKIP(staking_address, newData.walletAddress, pass, newData.amount, (err, recipe) => {
            if (err) {
              console.error(err);
              console.error(console_data);
              result.json({
                result: 'FAIL',
                reason: '400',
                message: 'Staking Send Error',
              });
              return;
            }
            const input = {
              toToken: staking_address,
              from: newData.walletAddress,
              amount: newData.amount,
              data: recipe,
            };
            // Wallet.putKIP7Transaction(input, (err, res) => {
            //   if (err) {
            //     console.error(err);
            //     result.json({
            //       result: 'FAIL',
            //       reason: '400',
            //       message: 'Staking transaction Input Error',
            //     });
            //     return;
            //   }
            const defi = {
              sidx: newData.sidx,
              midx: newData.midx,
              round: newData.round,
              walletAddress: newData.walletAddress,
              amount: newData.amount,
              period: newData.period,
              interestRate: newData.interestRate,
              txHash: recipe.transactionHash,
              contractStatus: 0,
            };
            Defi.createContract(defi, (err, res) => {
              if (err) {
                console.error(err);
                result.json({
                  result: 'FAIL',
                  reason: '400',
                  message: 'Defi Input Error',
                });
                return;
              }
              console.log(`\x1b[32m${console_data.midx} contract Complete`);
              result.json({
                result: 'OK',
                reason: '200',
                data: res,
              });
            });
            // });
          });
        });
      }
    });
  });
};

exports.summaryContract = (request, result) => {
  Mdefi.getSummery(request.params.midx, (err, data) => {
    if (err) {
      result.json({
        result: 'FAIL',
        reason: '400',
        message: 'Get Contract Summery Error',
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

exports.AdminContract = async (request, result) => {
  var now = dayjs();
  const newData = { ...request.body };
  const console_data = {
    sidx: newData.sidx,
    midx: newData.midx,
    amount: newData.amount,
    period: newData.period,
    round: newData.round,
  };
  const today = now.get('date'),
    toMonth = now.get('month');
  console.log('Contract Data:>> ', newData);
  if (newData.amount < 2000 || newData.amount > 2000000) {
    console.log('Contract Amount Error');
    result.json({
      result: 'Fail',
      reason: '408',
      message: 'Contract Amount Error',
    });
    return;
  }
  var blackBalance = '';
  const balacne = await Wallet.getBlackToken(newData.walletAddress, (err, data) => {});
  const staking_address = process.env['STAKING_ADDRESS'];
  const staking_pass = process.env['STAKING_PASSWORD'];
  Defi.avoidDuplication(newData, (err, res) => {
    if (err) {
      console.error(err);
      result.json({
        result: 'FAIL',
        reason: '400',
        message: 'Contract duplication check Error',
      });
      return;
    }
    if (res === true) {
      result.json({
        result: 'FAIL',
        reason: '204',
        message: 'Already Contract',
      });
      return;
    } else {
      Wallet.getPass({ from: newData.walletAddress, midx: newData.midx }, (err, pass) => {
        if (err) {
          console.error(err);
          result.send({
            result: 'FAIL',
            reason: '400',
            message: err,
          });
          return;
        }
        klay.FeeSendTransferKIP(staking_address, newData.walletAddress, pass, newData.amount, (err, recipe) => {
          if (err) {
            console.error(err);
            console.error(console_data);
            result.json({
              result: 'FAIL',
              reason: '400',
              message: 'Staking Send Error',
            });
            return;
          }
          const input = {
            toToken: staking_address,
            from: newData.walletAddress,
            amount: newData.amount,
            data: recipe,
          };
          const defi = {
            sidx: newData.sidx,
            midx: newData.midx,
            round: newData.round,
            walletAddress: newData.walletAddress,
            amount: newData.amount,
            period: newData.period,
            interestRate: newData.interestRate,
            txHash: recipe.transactionHash,
            contractStatus: 0,
          };
          Defi.createContract(defi, (err, res) => {
            if (err) {
              console.error(err);
              result.json({
                result: 'FAIL',
                reason: '400',
                message: 'Defi Input Error',
              });
              return;
            }
            console.log(`${console_data.midx} contract Complete`);
            result.json({
              result: 'OK',
              reason: '200',
              data: res,
            });
          });
          // });
        });
      });
    }
  });
};

exports.getAllContract = async (request, result) => {
  Mdefi.getAllContract(request, async (err, data) => {
    if (err) {
      console.error(err);
      result.json({
        result: 'FAIL',
        reason: '400',
        message: 'Get Contract Error',
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

exports.getDownload = async (req, res) => {
  Mdefi.getDownload(request, async (err, data) => {
    if (err) {
      console.error(err);
      result.json({
        result: 'FAIL',
        reason: '400',
        message: 'Get Contract Error',
      });
      return;
    }
    for (let i = 0; i < data.length; i++) {
      await klay.getBalance(data[i].walletAddress, (err, res) => {
        const balance = res;
        data[i].balance = balance.GRBT;
      });
    }
    result.json({
      result: 'OK',
      reason: '200',
      data: data,
    });
  });
};

exports.stakingReward = async (request, result) => {
  const data = { ...request.body };
  //Check Contract List
  Mdefi.getOneContract(data.ctidx, async (err, res) => {
    if (err) {
      console.error(err);
      result.json({
        result: 'FAIL',
        message: '400',
        message: 'Reward Staking in check Contract Error',
      });
      return;
    } else if (res.length <= 0) {
      console.error(`Do not Contract ${data.rewardAddress}`);
    } else {
      if (res[0]?.walletAddress !== data.rewardAddress) {
        console.error(`Unmatch contract rewardAddress ::> ${data.rewardAddress}`);
        result.json({
          result: 'FAIL',
          message: '400',
          message: `Unmatch contract rewardAddress`,
        });
        return;
      } else {
        //send Staking Token
        const staking_address = process.env['STAKING_ADDRESS'];
        const staking_pass = process.env['STAKING_PASSWORD'];
        await klay.FeeSendTransferKIP(data.rewardAddress, staking_address, staking_pass, data.amount, async (err, principalRecipe) => {
          if (err) {
            console.error(err);
            result.json({
              result: 'FAIL',
              reason: '400',
              message: `Staking ${data.rewardAddress} principal Send Error`,
            });
            return;
          } else {
            await Wallet.getPass({ from: data.sendAddress, midx: data.sendMidx }, async (err, pass) => {
              await klay.FeeSendTransferKIP(data.rewardAddress, data.sendAddress, pass, data.reward, async (err, rewardRecipe) => {
                if (err) {
                  console.error(err);
                  result.json({
                    result: 'FAIL',
                    reason: '400',
                    message: `Staking ${data.rewardAddress} principal Send Error`,
                  });
                  return;
                }
                //Update Staking DB
                Mdefi.RewardToken(
                  {
                    ctidx: data.ctidx,
                    Hash: `${rewardRecipe.transactionHash},${principalRecipe.transactionHash}`,
                    contractStatus: 7,
                  },
                  (err, res) => {
                    if (err) {
                      console.error(err);
                      result.json({
                        result: 'FAIL',
                        reason: '400',
                        message: `${data.ctidx} DB Staking Update Error`,
                      });
                      return;
                    } else {
                      console.log(`${data.midx} GRBT Staking  Reward Complete`);
                      //Reward End
                      result.json({
                        result: 'OK',
                        reason: '200',
                        message: `${data.midx} GRBT Staking  Reward Complete`,
                      });
                      //
                    }
                  },
                );
              });
            });
          }
        });
      }
    }
  });
};

exports.editContract = async (request, result) => {
  const data = { ...request.body };
  console.log('data :>> ', data);
  Mdefi.eidtContract(data, (err, res) => {
    if (err) {
      console.error(err);
      result.json({
        result: 'FAIL',
        reason: '400',
        message: `${data.midx}  Contract  ${data.ctidx} Status change Error`,
      });
      return;
    }
    console.log(`${data.midx} Staking  status change complete`);
    const message = `${data?.email}\n 회원번호: ${data.midx}\n 계약번호: ${data.ctidx}\n`;
    var contractStatus = '';
    data.contractStatus == '3' ? (contractStatus = '연장신청') : (contractStatus = '정산신청');

    notifyToLINE('GRBT스테이킹', `${message} 신청: ${contractStatus}`);
    result.json({
      result: 'OK',
      reason: '200',
      message: `${data.midx} Staking ${data.ctidx} status change complete`,
    });
    return;
  });
};

exports.stakingReContract = async (request, result) => {
  const data = { ...request?.body };
  await Mdefi.getProduct(data.sidx, async (err, res) => {
    if (err) {
      console.error(err);
      result.json({
        result: 'FAIL',
        reason: '400',
        message: 'recontract get round error',
      });
    } else {
      data.round = res[0].round;
      const staking_address = process.env['STAKING_ADDRESS'];
      const staking_pass = process.env['STAKING_PASSWORD'];
      //staking Wallet -> customer
      await klay.FeeSendTransferKIP(data.rewardAddress, staking_address, staking_pass, data.amount, async (err, principalRecipe) => {
        if (err) {
          console.error(err);
          result.json({
            result: 'FAIL',
            reason: '400',
            message: `Staking ${data.rewardAddress} principal Send Error`,
          });
          return;
        } else {
          await Wallet.getPass({ from: data.sendAddress, midx: data.sendMidx }, async (err, sendpass) => {
            // reward wallet -> customer
            await klay.FeeSendTransferKIP(data.rewardAddress, data.sendAddress, sendpass, data.reward, async (err, rewardRecipe) => {
              if (err) {
                console.error(err);
                result.json({
                  result: 'FAIL',
                  reason: '400',
                  message: `Staking ${data.rewardAddress} principal Send Error`,
                });
                return;
              }
              //Update Staking DB
              Mdefi.RewardToken(
                {
                  ctidx: data.ctidx,
                  Hash: `${rewardRecipe.transactionHash},${principalRecipe.transactionHash}`,
                  contractStatus: 4,
                },
                async (err, res) => {
                  if (err) {
                    console.error(err);
                    result.json({
                      result: 'FAIL',
                      reason: '400',
                      message: `${data.ctidx} DB Staking Update Error`,
                    });
                    return;
                  } else {
                    console.log(`${data.midx} GRBT Staking Return Complete`);
                    //recontract Send To user -> staking Address
                    await Wallet.getPass({ from: data.rewardAddress, midx: data.midx }, async (err, pass) => {
                      if (err) {
                        console.error(err);
                        result.json({
                          result: 'FAIL',
                          reason: '400',
                          message: 'Admin Wallet getPass Error',
                        });
                      }
                      await klay.FeeSendTransferKIP(staking_address, data.rewardAddress, pass, data.amount, async (err, recipe) => {
                        if (err) {
                          console.error(err);
                          result.json({
                            result: 'FAIL',
                            reason: '400',
                            message: 'GRBT Staking Send Error',
                          });
                          return;
                        } else {
                          const defi = {
                            sidx: data.sidx,
                            round: data.round,
                            midx: data.midx,
                            walletAddress: data.rewardAddress,
                            amount: data.amount,
                            period: data.period,
                            interestRate: data.interestRate,
                            txHash: recipe.transactionHash,
                            contractStatus: 0,
                          };
                          await Defi.createContract(defi, (err, res) => {
                            if (err) {
                              console.error(err);
                              result.json({
                                result: 'FAIL',
                                reason: '400',
                                message: 'Defi Input Error',
                              });
                              return;
                            }
                            console.log(`\x1b[32m${defi.midx} contract Complete`);
                            result.json({
                              result: 'OK',
                              reason: '200',
                              data: res,
                            });
                          });
                        }
                      });
                    });
                  }
                },
              );
            });
          });
        }
      });
    }
  });
};
