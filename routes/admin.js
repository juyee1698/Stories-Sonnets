const express = require('express');
const path = require('path');
const { body } = require('express-validator');
//const rootDir = require('../util/path');

const adminController = require('../controllers/admin');
const authMiddleware = require('../middleware/is-auth');
const router = express.Router();

router.get('/genre',authMiddleware.isAuthorAuth,adminController.getGenres);

router.get('/add-product',authMiddleware.isAuthorAuth,adminController.getAddProduct);

router.get('/add-event',authMiddleware.isAuthorAuth,adminController.getAddEvent);

router.get('/events',authMiddleware.isAuthorAuth,adminController.getEvents);

router.get('/products',authMiddleware.isAuthorAuth,adminController.getProducts);

router.get('/profile',authMiddleware.isAuthorAuth,adminController.getProfile);

router.post('/profile',[
    body('name','Please enter a valid name!').isString().trim().isLength({min:3}),
    body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
    body('description','The description should be minimum 50 characters and maximum 1000 characters!').trim().isLength({min:50,max:1000})
    ],
    authMiddleware.isAuthorAuth,
    adminController.postProfile);

router.post('/add-product', [
    body('title','Please enter a valid title!').isString().trim().isLength({min:3}),
    body('price','The price can only be in integer!').isInt(),
    body('description','The description should be minimum 50 characters and maximum 2000 characters!').trim().isLength({min:50,max:2000})
    ],
    authMiddleware.isAuthorAuth,
    adminController.postAddProduct);

router.post('/add-event', [
    body('title','Please enter a valid title!').isString().trim().isLength({min:3}),
    body('description','The description should be minimum 50 characters and maximum 2000 characters!').trim().isLength({min:50,max:2000})
    ],
    authMiddleware.isAuthorAuth,
    adminController.postAddEvent);

router.get('/edit-product/:productId',authMiddleware.isAuthorAuth,adminController.getEditProduct);

router.post('/edit-product',
    [
    body('title','Please enter a valid title!').isString().trim().isLength({min:3}),
    body('price','The price can only be in integer!').isInt(),
    body('description','The description should be minimum 50 characters and maximum 1000 characters!').trim().isLength({min:50,max:1000})
    ],
    authMiddleware.isAuthorAuth,
    adminController.postEditProduct);

router.delete('/product/:productId',authMiddleware.isAuthorAuth,adminController.deleteProduct);

module.exports = router;