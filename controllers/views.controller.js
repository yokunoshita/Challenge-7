const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const Sentry = require('../libs/sentry');

module.exports = {
    registerPage: async (req, res, next) => {
        try {
            res.render('register');
        } catch (error) {
            Sentry.captureException(error);
            next(error);
        }
    },

    loginPage: async (req, res, next) => {
        try {
            res.render('login');
        } catch (error) {
            Sentry.captureException(error);
            next(error);
        }
    },

    forgotPwPage: async (req, res, next) => {
        try {
            res.render('forgotPw');
        } catch (error) {
            Sentry.captureException(error);
            next(error);
        }
    },

    resetPw: async (req, res, next) => {
        try {
            let {key} = req.query;
            res.render('resetPw', {key});
        } catch (error) {
            Sentry.captureException(error);
            next(error);
        }
    },

    notifPage: async (req, res, next) => {
        try {
            let {id} = req.params;
            console.log(id);
            let notif = await prisma.notification.findMany({
                where: {user_id: Number(id)}
            });
            res.render("notif.ejs", {
              user_id: Number(id),
              notifications: notif,
            });
          } catch (error) {
            Sentry.captureException(error);
            next(error);
          }
    },
}