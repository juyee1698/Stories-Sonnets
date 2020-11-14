const express = require('express');
const path = require('path');
const rootDir = require('../util/path');

const shopController = require('../controllers/shop');
const authMiddleware = require('../middleware/is-auth');
const { body } = require('express-validator');
const bodyParser = require('body-parser');
const router = express.Router();

router.get('/',shopController.getIndex);

router.get('/products',shopController.getProducts);

router.get('/authors',shopController.getAuthors);

router.get('/blogs',shopController.getBlogs);

router.get('/events',shopController.getEvents);

router.get('/blogtags',authMiddleware.isUserAuth,shopController.getBlogGenres);

router.get('/myblogs',authMiddleware.isUserAuth,shopController.getUserBlogs);

router.get('/blogs/:blogId',shopController.getBlogDetails);

router.get('/create-blog',authMiddleware.isUserAuth,shopController.getCreateBlog);

router.post('/create-blog',[
    body('title','Please enter a valid title!').isString().trim().isLength({min:3}),
    body('text','The description should be minimum 50 characters and maximum 3000 characters!').trim().isLength({min:50,max:3000})
    ],authMiddleware.isUserAuth,shopController.postCreateBlog);

router.get('/edit-blog/:blogId',authMiddleware.isUserAuth,shopController.getEditBlog);

router.post('/edit-blog',[
    body('title','Please enter a valid title!').isString().trim().isLength({min:3}),
    body('text','The description should be minimum 50 characters and maximum 3000 characters!').trim().isLength({min:50,max:3000})
    ],authMiddleware.isUserAuth,shopController.postEditBlog);

router.get('/blogs/tags/:tagName',shopController.getBlogTag);

router.delete('/blog-delete/:blogId',authMiddleware.isUserAuth,shopController.deleteBlog);

router.get('/products/:productId',shopController.getProduct);

router.get('/events/:eventId',shopController.getEvent);

router.get('/discussions',shopController.getDiscussions);

router.get('/discussions/:discussionId',shopController.getDiscussion);

router.get('/products/tags/:tagName',shopController.getTag);

router.get('/book-genres',shopController.getBookGenres);

router.get('/authors/:authorId',shopController.getAuthor);

router.get('/profile',authMiddleware.isUserAuth,shopController.getProfile);

router.get('/notifications',authMiddleware.isUserAuth,shopController.getUserNotifications);

router.post('/delete-notif-comment/:commentId',authMiddleware.isUserAuth,shopController.deleteNotificatonComment);

router.post('/delete-notif-blog/:blogId',authMiddleware.isUserAuth,shopController.deleteNotificatonBlog);

router.post('/add-follower', bodyParser.json(),authMiddleware.isUserAuth,shopController.addFollower);

router.post('/remove-follower', bodyParser.json(),authMiddleware.isUserAuth,shopController.removeFollower);

router.post('/author-add-follower', bodyParser.json(),authMiddleware.isUserAuth,shopController.authorAddFollower);

router.post('/author-remove-follower', bodyParser.json(),authMiddleware.isUserAuth,shopController.authorRemoveFollower);

router.get('/cart',authMiddleware.isUserAuth,shopController.getCart);

router.post('/cart',authMiddleware.isUserAuth,shopController.postCart);

router.post('/cart-delete-item',authMiddleware.isUserAuth,shopController.postCartDeleteProduct);

router.post('/update-quantity',authMiddleware.isUserAuth,shopController.updateQuantity);

router.post('/add-review',
    bodyParser.json(),
    authMiddleware.isUserAuth,shopController.addReview);

router.post('/add-comment',
    bodyParser.json(),
    authMiddleware.isUserAuth,shopController.addComment);

router.post('/add-message',
    bodyParser.json(),
    authMiddleware.isUserAuth,shopController.addMessage);

router.post('/events/category',shopController.categorizeEvents);

router.get('/create-discussion',authMiddleware.isUserAuth,shopController.getCreateDiscussion);

router.post('/create-discussion',[
    body('title','Please enter a valid discussion title! Minimum 20 characters').isString().trim().isLength({min:20}),
    body('comment','The comment should be minimum 30 characters and maximum 1000 characters!').trim().isLength({min:30,max:1000})
    ],
authMiddleware.isUserAuth,shopController.postCreateDiscussion);

router.get('/edit-discussion/:discussionId',authMiddleware.isUserAuth,shopController.getEditDiscussion);

router.post('/delete-discussion/:discussionId',authMiddleware.isUserAuth,shopController.deleteDiscussion);

router.post('/edit-discussion',[
    body('title','Please enter a valid discussion title! Minimum 20 characters').isString().trim().isLength({min:20}),
    body('comment','The comment should be minimum 30 characters and maximum 1000 characters!').trim().isLength({min:30,max:1000})
    ],
authMiddleware.isUserAuth,shopController.postEditDiscussion);

router.get('/orders',authMiddleware.isUserAuth,shopController.getOrders);

//router.post('/create-order',isAuth,shopController.postOrder);

router.get('/orders/:orderId',authMiddleware.isUserAuth,shopController.getInvoice);

router.get('/checkout/success',authMiddleware.isUserAuth,shopController.postOrder);

router.get('/checkout/cancel',authMiddleware.isUserAuth,shopController.getCheckout);

router.get('/checkout',authMiddleware.isUserAuth,shopController.getCheckout);

router.post('/profile',[
    body('name','Please enter a valid name!').isString().trim().isLength({min:3}),
    body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
    body('postal','Please enter a valid postal code!').isInt().isLength({min:6,max:6}),
    body('phoneno','Please enter a valid phone number!').isInt().isLength({min:10,max:10})
    ],
    authMiddleware.isUserAuth,
    shopController.postProfile);

router.get('/profile/:userId',shopController.getUserProfile);

router.get('/api',authMiddleware.isUserAuth,shopController.getAPI);

module.exports = router;