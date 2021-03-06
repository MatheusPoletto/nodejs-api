const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mailer = require('../../modules/mailer');

const authConfig = require('../../config/auth.json');

const User = require('../models/User');

const router = express.Router();

function generateToken(params = {}){
    return jwt.sign( params , authConfig.secret, {
        expiresIn: 86400
    });
}

router.post('/register', async (req, res) => {
    const { email } = req.body;
    try{

        if(await User.findOne({email}))
            return res.status(400).send({ error: 'Usuário já existe'});

        const user = await User.create(req.body);

        user.password = undefined;

        res.send({ 
            user, 
            token: generateToken({ id: user.id }) 
        });
    }catch(error){
        
        return res.status(400).send({ error: error });
    }
});

router.post('/authenticate', async (req, res) => {
    const { email, password} = req.body;

    const user = await (await User.findOne({ email }).select('+password'));

    if(!user)
        return res.status(400).send({ error: 'User not found' });

    if(!await bcrypt.compare(password, user.password))
        return res.status(400).send({ error: 'Incorrect password' });

    user.password = undefined;

    res.send({ 
        user, 
        token: generateToken({ id: user.id }) 
    });
});

router.post('/forgot_password', async(req, res) => {
    const { email } = req.body;
    
    try{

        const user = await User.findOne( { email });

        if(!user)
            return res.status(400).send({ error: 'User not found' });

        const token = crypto.randomBytes(20).toString('hex');

        const now = new Date();
        now.setHours(now.getHours() + 1);
    
        await User.findByIdAndUpdate(user.id, {
            '$set': {
                passwordResetToken: token,
                passwordResetExpires: now
            }
        });

        mailer.sendMail({
            to: email,
            from: 'motaviop@gmail.com',
            template: 'auth/forgot_password',
            context: { token }
        }, (err) => {
            if(err){
                return res.status(400).send({a: 'Cannot send forgot password email', obj: err});}

            return res.send();
        });

        
        

    }catch(err){
        console.log(err);
        res.status(400).send( {error: 'Error on forgot password, try again'} );
    }
});

module.exports = app => app.use('/auth', router);