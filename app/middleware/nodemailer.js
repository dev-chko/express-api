const smtpTransport = require('nodemailer-smtp-transport');
const nodemailer = require('nodemailer');

exports.transporter = nodemailer.createTransport(smtpTransport({
  host: 'Input your mail Host',
  port: 587,
  auth: {
    user: 'Input Email',
    pass: 'Input pwd',
    secure:true
  }
}));