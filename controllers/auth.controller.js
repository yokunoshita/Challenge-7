const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {JWT_KEY} = process.env;

const Sentry = require('../libs/sentry');
const {sendMail, getHtml} = require('../libs/nodemailer');

module.exports = {
    register: async (req, res, next) => {
        try {
            let {name, email, password} = req.body;
            console.log(name, email, password);
            if (!name || !email || !password) {
                return res.status(400).json({
                    status: false,
                    message: "Fill all the requirments !",
                    data: null
                });
            }

            let exist = await prisma.user.findFirst({where: {email}});
            if (exist) {
                return res.status(400).json({
                    status: false,
                    message: "Email already been used !",
                    data: null
                })
            }

            let encryptedPw = await bcrypt.hash(password, 10);
            let dataUser = {
                name, email,
                password: encryptedPw
            };

            let user = await prisma.user.create({data: dataUser});
            delete user.password;

            let notif = await prisma.notification.create({
                data: {
                    title: 'Registration success !',
                    body: 'Your account has been created',
                    User: {connect: {id: user.id}}
                }
            });

            req.io.emit(`user-${user.id}`, notif);

            return res.render('login')

        } catch (error) {
            Sentry.captureException(error);
            next(error);
        }
    },

    login: async (req, res, next) => {
        try {
            let {email, password} = req.body;
            if (!email || !password) {
                return res.status(400).json({
                    status: false,
                    message: "Fill all requirments !",
                    data: null
                })
            }

            let user = await prisma.user.findFirst({where: {email}});
            if (!user) {
                return res.status(400).json({
                    status: false,
                    message: "Incorrect email or password",
                    data: null
                })
            }

            let checkPw = await bcrypt.compare(password, user.password);
            if (!checkPw) {
                return res.status(400).json({
                    status: false,
                    message: "Incorrect email or password",
                    data: null
                })
            }

            delete user.password;
            let key = jwt.sign(user, JWT_KEY);
            res.redirect(`/challenge/notif/user/${user.id}`);

        } catch (error) {
            Sentry.captureException(error);
            next(error);
        }
    },

    email: async (req, res, next) => {
        try {
            let {email} = req.body;
            let user = await prisma.user.findUnique({where: {email}});
            if (!user) {
                return res.status(404).json({
                    status: false,
                    message: "User is not registered",
                    data: null
                })
            }

            let key = jwt.sign({email: user.email}, JWT_KEY);
            let html = await getHtml(
                'mail.ejs', {    
                    name: user.name,
                    url: `${req.protocol}://${req.get('host')}/challenge/resetPw?key=${key}`
                }
            );

            await sendMail(email, 'Reset Password', html);
            res.json({status: true});

        } catch (error) {
            Sentry.captureException(error);
            next(error);
        }
    },

    reset: async (req, res, next) => {
        try {
            let {key} = req.query;
            let {password1, password2} = req.body;

            if (!password1 || !password2) {
                return res.status(400).json({
                    status: false,
                    message: "Fill all requirments !",
                    data: null
                })
            }

            if (password1 !== password2) {
                return res.status(400).json({
                    status: false,
                    message: "Password doesnt match",
                    data: null
                })
            }

            let encryptedPw = await bcrypt.hash(password1, 10);
            jwt.verify(key, JWT_KEY, async (error, data) => {
                if (error) {
                    return res.json({
                        status: false,
                        message: error.message,
                        data: null
                    })
                }

                let update = await prisma.user.update({
                    where: {email: data.email},
                    data: {password: encryptedPw},
                    select: {id: true, name: true, email: true}
                });

                let notif = await prisma.notification.create({
                    data: {
                        title: "Change password succees !",
                        body: "Your password has been changed !!",
                        User: {
                            connect: {
                                id: update.id,
                            }
                        }
                    }
                });
    
                req.io.emit(`user-${update.id}`, notif);

                res.render('login')
            })
        } catch (error) {
            Sentry.captureException(error);
            next(error);
        }
    }
}