const router = require('express').Router();
const auth = require('../controllers/auth.controller');
const view = require('../controllers/views.controller');
const jwt = require('jsonwebtoken');
const {JWT_KEY} = process.env;

let restrict = (req, res, next) => {
    let {authorization} = req.headers;
    if (!authorization) {
        return res.status(401).json({
            status: false,
            message: "Include the key !",
            data: null
        })
    }

    let key = authorization.split(' ')[1];
    jwt.verify(key, JWT_KEY, (error, user) => {
        if (error) {
            return res.status(401).json({
                status: false,
                message: error.message,
                data: null
            })
        }

        delete user.iat;
        req.user = user;
        next();
    });
};

router.post('/register', auth.register);
router.post('/login', auth.login);
router.post('/forgotPw', auth.email);
router.post('/resetPw', auth.reset);

router.get('/register', view.registerPage);
router.get('/login', view.loginPage);
router.get('/forgotPw', view.forgotPwPage);
router.get('/resetPw', view.resetPw);

router.get('/notif/user/:id', view.notifPage);


module.exports = router