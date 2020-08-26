const path = require('path');
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');

const { host, port, user, pass } = require('../config/mail.json');

var transport = nodemailer.createTransport({
    host,
    port,
    secure: true,
    auth: {
        user,
        pass
    },
    tls: {
        rejectUnauthorized: false
    },
});

transport.use('compile', hbs({
    viewEngine: 'handlebars',
    viewPath: path.resolve('./src/resources/mail/'),
    extName: '.html'
    
}));

module.exports = transport;