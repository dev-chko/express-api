const express = require('express');
const passport = require('passport');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');

const authService = require('./app/middleware/checkJwt');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

//
const httpsApp = express();
const cors = require('cors');
httpsApp.use(cors({ origin: '*' }));
httpsApp.use(compression());

//cors Error
httpsApp.all('/*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');
  next();
});
httpsApp.use(
  morgan(':remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length]', {
    skip: function (req, res) {
      return req.url.startsWith('/static/') || (res.statusCode >= 400 && res.statusCode < 500);
    },
  }),
);
httpsApp.use(cookieParser());

httpsApp.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const wallet = require('./app/routes/wallet.routes');
const member = require('./app/routes/member.routes');
const user = require('./app/routes/user.routes');
const board = require('./app/routes/board.routes');
const defi = require('./app/routes/defi.routes');
const exchange = require('./app/routes/exchange.routes');
const device = require('./app/routes/device.routes');

// const jwtConfig = require('./app/middleware/jwt.js');
const appleRouter = require('./app/passport/oauth.apple.routes.js');
const googleRouter = require('./app/passport/oauth.google.routes.js');
const naverRouter = require('./app/passport/oauth.naver.routes.js');
const kakaoRouter = require('./app/passport/oauth.kakao.routes.js');

const credentials = {
  key: fs.readFileSync('./privkey.pem'),
  cert: fs.readFileSync('./fullchain.pem'),
};

httpsApp.use(express.json());
httpsApp.use(express.urlencoded({ extended: true }));
httpsApp.set('trust proxy', true);

// passport
httpsApp.use(passport.initialize());
// jwtConfig();

passport.serializeUser((user, done) => {
  console.log('serializeUser_user :>> ', user);
  done(null, user.id);
});

passport.deserializeUser((user, done) => {
  console.log('deserializeUser: ', user);
  done(null, user);
});

// Oauth
httpsApp.use(appleRouter);
httpsApp.use(googleRouter);
httpsApp.use(kakaoRouter);
httpsApp.use(naverRouter);

// REST API
httpsApp.use('/api/v1/wallet', wallet);
httpsApp.use('/api/v1/me', user);
httpsApp.use('/api/v1/user', member);
httpsApp.use('/api/v1/board', board);
httpsApp.use('/api/v1/defi', defi);
httpsApp.use('/api/v1/exchange', exchange);
httpsApp.use('/api/v1/device', device);

// Serve Satic files
httpsApp.use('/', express.static(path.join(__dirname, '/build')));
httpsApp.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '/build/index.html'));
});

// https server
https.createServer(credentials, httpsApp).listen(process.env.NODE_HTTPS_PORT || 8443, '0.0.0.0', () => {
  console.log('HTTPS Server is listening on port', process.env.NODE_HTTPS_PORT || 8443);
});

// http server
const httpApp = express();
httpApp.use(morgan(':remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length]'));

// for certbot renew - test : sudo certbot renew --dry-run
// httpApp.use('/.well-known/acme-challenge', express.static(path.join(__dirname, '/build/.well-known/acme-challenge')));
httpApp.get('*', function (request, response) {
  var to = `https://${request.hostname}${request.url}`;

  if (request.url.startsWith('/.well-known/acme-challenge')) {
    const options = {
      root: path.join(__dirname, '/build'),
    };
    const fileName = request.url;
    response.sendFile(fileName, options);
  } else {
    console.info('proxy to ', to);

    response.redirect(to);
  }
});

http.createServer(httpApp).listen(process.env.NODE_HTTP_PORT || 8000, '0.0.0.0', () => {
  console.log('HTTP Server is listening on port', process.env.NODE_HTTP_PORT || 8000);
});

// print production/debug mode
if (process.env.NODE_ENV === 'production') console.info('===== running in production mode =====');
else console.info('----- running in debug mode -----');
