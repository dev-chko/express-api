const jwt = require('jsonwebtoken');


// check if Token exists on request Header and attach token to request as attribute
exports.checkTokenMW = (req, res, next) => {
    // Get auth header value
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== 'undefined') {
        req.token = bearerHeader.split(' ')[1];
        next();
    } else {
        res.json({
            result: 'FAIL',
            reason:'403',
            message:'Unauthorization'
        });
    }
};

// Verify Token validity and attach token data as request attribute
exports.verifyToken = (req, res, next) => {
    jwt.verify(req.token, 'key-secert', (err, authData) => {
        console.log(Object.keys(req));
        console.log(req.body);
        if(err.name ==='TokenExpiredError') {
            var token = jwt.sign({
                address:user.walletAddress
              },
              'key-secert',
              {
                subject : 'grinbit.io_jwt',
                expiresIn: '10m',
                issuer: user.id,
              })
              res(null, token)
        } else if(err) { 
            res(err,null)
        } else {
            res(null,authData);
        } 
    })
};

// Issue Token
exports.signToken = (req, res) => {
    jwt.sign({userId: req.user._id}, 'secretkey', {expiresIn:'5 min'}, (err, token) => {
        if(err){
            res.sendStatus(500);
        } else {
            res.json({token});
        }
    });
}