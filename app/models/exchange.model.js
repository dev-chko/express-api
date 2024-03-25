const ccxt = require('ccxt');
const fetch = require('node-fetch');
const dayjs = require('dayjs');
var utc = require('dayjs/plugin/utc');
var timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

let exLBank = new ccxt.lbank2({
  apiKey: '676deb8d-13c9-42bd-9ab8-68cd2d75062d',
  secret: '22F61729F904B5FB993076F89533EB30',
  timeout: 5 * 1000,
});
exLBank.enableRateLimit = false;

let exDigifinex = new ccxt.digifinex({
  apiKey: '56a11e2df354d6',
  secret: '60762a37bffe43f20d9d11f6d8f20aea1cc9497cea',
  timeout: 5 * 1000,
});
exDigifinex.enableRateLimit = false;

let cacheTrades = [];

const Exchange = function (Exchange) {};

Exchange.getKline = (query) => {
  const { exchange, symbol, type, size } = query;

  let exch = exchange === 'lbank' ? exLBank : exDigifinex;

  if (!exch.has.fetchOHLCV) return [];

  //
  const market = symbol.replace('_usdt', '/usdt').toUpperCase();
  const now = dayjs(new Date(), 'Asia/Singapore');
  const since = now.subtract(size, 'hour').valueOf();

  const cacheKey = `${exchange}.${symbol}.${type}.${size}`;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const fetchExchange = async () => {
    for (let i = 0; i < 10; i++) {
      try {
        const trades = await exch.fetchOHLCV(market, type, since);
        cacheTrades[cacheKey] = trades;
        return trades;
      } catch (e) {
        if (e.name === 'RequestTimeout') {
          await sleep(exch.rateLimit);
          continue;
        }

        console.error(e);
        return [];
      }
    }
    console.log('[RequestTimeout]');
    if (cacheTrades[cacheKey]) return cacheTrades[cacheKey];
    else return [];
  };
  // ccxt 모듈로 OHLCV호출시 타임아웃 발생으로 디비파이넥스에 직접호출
  const fetchDigiFinex = async () => {
    const url = `https://openapi.digifinex.com/v3/kline?symbol=grbt_usdt&period=60&start_time=${since / 1000}&end_time=${
      now.valueOf() / 1000
    }`;

    return fetch(url, { method: 'GET', headers: { rt: 1 } })
      .then((res) => res.json())
      .then((res) => {
        if (res.code === 0) {
          res.data.forEach((element) => {
            // tVCHLO to tOHLCV
            let temp = element[1];
            element[1] = element[5];
            element[5] = temp;
            temp = element[2];
            element[2] = element[3];
            element[3] = element[4];
            element[4] = temp;
          });
          return res.data;
        } else {
          return [];
        }
      })
      .catch((err) => {
        return [];
      });
  };

  return exchange === 'digifinex' ? fetchDigiFinex() : fetchExchange();
};

module.exports = Exchange;
