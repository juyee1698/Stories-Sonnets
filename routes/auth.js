const express = require('express');

const router = express.Router();
const authController = require('../controllers/auth');
const { check,body } = require('express-validator');
const User = require('../models/user');
const Author = require('../models/author');
const notAuth = require('../middleware/not-auth');

router.get('/login',notAuth,authController.getLogin);

router.get('/signup', notAuth,authController.getSignup);

router.get('/seller-login',notAuth,authController.getSellerLogin);

router.get('/seller-signup', notAuth,authController.getSellerSignup);

router.post('/login',
    body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
    body('password','Password has to be valid')
    .trim()
    .isLength({min:5})
    .isAlphanumeric(),
    authController.postLogin);

router.post('/signup',
    [
    check('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .custom((value,{ req }) => {
        return User.findOne({email:value})
        .then(userDoc => {
            if(userDoc) {
                return Promise.reject('Sorry, this email already exists!');
            }
        });
    })
    .normalizeEmail(),
    body('password','Please enter a password with only numbers and text and at least 5 characters')
    .trim()
    .isLength({min:5})
    .isAlphanumeric(),
    body('confirmPassword').trim().custom((value,{ req }) => {
        if(value!==req.body.password) {
            throw new Error('Passwords have to match');
        }
        return true;
    })
    ],
    authController.postSignup);

    router.post('/seller-login',
    body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
    body('password','Password has to be valid')
    .trim()
    .isLength({min:5})
    .isAlphanumeric(),
    authController.postSellerLogin);

router.post('/seller-signup',
    [
    check('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .custom((value,{ req }) => {
        return Author.findOne({email:value})
        .then(userDoc => {
            if(userDoc) {
                return Promise.reject('Sorry, this email already exists!');
            }
        });
    })
    .normalizeEmail(),
    body('password','Please enter a password with only numbers and text and at least 5 characters')
    .trim()
    .isLength({min:5})
    .isAlphanumeric(),
    body('confirmPassword').trim().custom((value,{ req }) => {
        if(value!==req.body.password) {
            throw new Error('Passwords have to match');
        }
        return true;
    })
    ],
    authController.postSellerSignup);

router.post('/logout',authController.postLogout);

router.get('/reset',notAuth,authController.getReset);

router.post('/reset',authController.postReset);

router.get('/reset/:token',notAuth,authController.getNewPassword);

router.post('/new-password',authController.postNewPassword);

module.exports = router;