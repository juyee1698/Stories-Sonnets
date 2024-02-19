require('dotenv').config();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const Author = require('../models/author');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator/check');

const transporter = nodemailer.createTransport(sendgridTransport({
    auth:{
        api_key: process.env.sengrid_key
    }
}));

exports.getSellerLogin = (req,res,next) => {
    let message = req.flash('error');
    //console.log(message);
    if(message.length>0) {
        message=message[0];
    }
    else {
        message=null;
    }
    res.render('auth/seller-login',{
        path:'/seller-login',
        pageTitle:'Seller Login',
        errorMessage : message,
        oldInput:{email:'',password:''},
        validationErrors:[]
    });
}

exports.postSellerLogin = (req,res,next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        res.status(422).render('auth/seller-login',{
            path:'/seller-login',
            pageTitle:'Seller Login',
            errorMessage : errors.array()[0].msg,
            oldInput: {email:email,password:password},
            validationErrors:errors.array()
        });
    }
        Author.findOne({email:email})
        .then(author => {
            if(!author) {
                req.flash('error','Invalid email or password');
                res.status(422).render('auth/seller-login',{
                    path:'/login',
                    pageTitle:'Login',
                    errorMessage : 'Invalid email or password',
                    oldInput: {email:email,password:password},
                    validationErrors:[]
                });
                
            }
            bcrypt.compare(password,author.password)
            .then(doMatch => {
                if(doMatch) {
                    req.session.authorIsLoggedIn=true;
                    req.session.author=author;
                    return req.session.save((err) => {
                        res.redirect('/admin/profile');
                    });
                }
                req.flash('error','Invalid email or password');
                res.status(422).render('auth/seller-login',{
                    path:'/seller-login',
                    pageTitle:'Seller Login',
                    errorMessage : 'Invalid email or password',
                    oldInput: {email:email,password:password},
                    validationErrors:[]
                });
            })
           
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
    
}

exports.getSellerSignup = (req, res, next) => {
    let message = req.flash('error');
    //console.log(message);
    if(message.length>0) {
        message=message[0];
    }
    else {
        message=null;
    }
    res.render('auth/seller-signup', {
      path: '/seller-signup',
      pageTitle: 'Signup as Seller',
      errorMessage:message,
      oldInput: {name:'',email:'',password:'',confirmPassword:''},
      validationErrors:[]
    });
};

exports.postSellerSignup = (req, res, next) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(422).render('auth/seller-signup', {
            path: '/seller-signup',
            pageTitle: 'Signup as Seller',
            errorMessage:errors.array()[0].msg,
            oldInput: {name:name,email:email,password:password,confirmPassword:req.body.confirmPassword},
            validationErrors:errors.array()
        });
    }
    bcrypt
    .hash(password,12)
    .then(hashedPasswd => {
        const author = new Author({
            name:name,
            email:email,
            password:hashedPasswd,
            description:'',
            imageUrl:'images/author/profile.png'
        });
        return author.save();
    })
    .then(result => {
        res.redirect('/seller-login');
            return transporter.sendMail({
                to:email,
                from:'sabadejuyee21@gmail.com',
                subject:'Seller Signup succeeded!',
                html:`<h1>Hello ${name}! You have successfully signed up as a Stories and Sonnets Seller. Welcome aboard!</h1><p>We wish you good luck for your business!</p>`

        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
    
};

exports.getLogin = (req,res,next) => {
    let message = req.flash('error');
    //console.log(message);
    if(message.length>0) {
        message=message[0];
    }
    else {
        message=null;
    }
    res.render('auth/login',{
        path:'/login',
        pageTitle:'Login',
        errorMessage : message,
        oldInput:{email:'',password:''},
        validationErrors:[]
    });
}

exports.postLogin = (req,res,next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        res.status(422).render('auth/login',{
            path:'/login',
            pageTitle:'Login',
            errorMessage : errors.array()[0].msg,
            oldInput: {email:email,password:password},
            validationErrors:errors.array()
        });
    }
        User.findOne({email:email})
        .then(user => {
            if(!user) {
                req.flash('error','Invalid email or password');
                return res.status(422).render('auth/login',{
                    path:'/login',
                    pageTitle:'Login',
                    errorMessage : 'Invalid email or password',
                    oldInput: {email:email,password:password},
                    validationErrors:[]
                });
                
            }
            bcrypt.compare(password,user.password)
            .then(doMatch => {
                if(doMatch) {
                    req.session.userIsLoggedIn=true;
                    req.session.notifications = user.notifications;
                    req.session.user=user;
                    return req.session.save((err) => {
                        res.redirect('/');
                    });
                }
                req.flash('error','Invalid email or password');
                res.status(422).render('auth/login',{
                    path:'/login',
                    pageTitle:'Login',
                    errorMessage : 'Invalid email or password',
                    oldInput: {email:email,password:password},
                    validationErrors:[]
                });
            })
           
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
    
}

exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    //console.log(message);
    if(message.length>0) {
        message=message[0];
    }
    else {
        message=null;
    }
    res.render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage:message,
      oldInput: {name:'',email:'',password:'',confirmPassword:''},
      validationErrors:[]
    });
};

exports.postSignup = (req, res, next) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'Signup',
            errorMessage:errors.array()[0].msg,
            oldInput: {name:name,email:email,password:password,confirmPassword:req.body.confirmPassword},
            validationErrors:errors.array()
        });
    }
    bcrypt
    .hash(password,12)
    .then(hashedPasswd => {
        const user = new User({
            name:name,
            email:email,
            password:hashedPasswd,
            cart:{items:[]},
            imageUrl:'images/user/profile.png',
            description:'',
            city:'',
            country:'',
            address:'',
            phoneno:0,
            postal:0
        });
        return user.save();
    })
    .then(result => {
        res.redirect('/login');
            return transporter.sendMail({
                to:email,
                from:'sabadejuyee21@gmail.com',
                subject:'Signup succeeded!',
                html:`<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
                    <link rel="icon" href="/img/bookicon.png" type="image/png">
                    <!-- Bootstrap CSS -->
                    <link rel="stylesheet" href="/css/bootstrap.css">
                    <link rel="stylesheet" href="/vendors/linericon/style.css">
                    <link rel="stylesheet" href="/css/font-awesome.min.css">
                    <link rel="stylesheet" href="/vendors/owl-carousel/owl.carousel.min.css">
                    <link rel="stylesheet" href="/vendors/lightbox/simpleLightbox.css">
                    <link rel="stylesheet" href="/vendors/nice-select/css/nice-select.css">
                    <link rel="stylesheet" href="/vendors/animate-css/animate.css">
                    <link rel="stylesheet" href="/vendors/jquery-ui/jquery-ui.css">
                    <!-- main css -->
                    <link rel="stylesheet" href="/css/style.css">
                    <link rel="stylesheet" href="/css/responsive.css">
                    <link rel="stylesheet" href="/css/main.css">
                    </head>
                    <body>
                    <section class="cat_product_area section_gap">
                        <div class="container-fluid">
                            <div class="row flex-row-reverse">
                                <div class="col-lg-2"></div>
                                <div class="col-lg-8">
                                    <div class="left_sidebar_area">
                                        <aside class="left_widgets cat_widgets">
                                            <div class="l_w_logo">
                                                <img src="https://e7798270d121.ngrok.io/img/logo4.png" alt="Icon">
                                            </div>
                                            <div class="l_w_email">
                                                <h3>Thank you for signing up</h3>
                                            </div>
                                            <div class="widgets_inner">
                                                <p style="color:rgb(56, 39, 28)">Hello ${name}! You have successfully signed up to Stories and Sonnets. Welcome aboard!</p>
                                                <p>We are a community of avid readers and aspiring writers and we are more than happy to have you as a part of this family.
                                                    Engage in blogging, events and community forums and find amazing people like yourself.
                                                </p>
                                                <br>
                                                <h3 style="color:rgb(122, 81, 54)">So, What are you waiting for...? </h3>
                                            </div>
                                            <div class="br"></div>
                                            <div class="single-footer-widget f_social_wd">
                                                <h6 class="footer_email">Follow Us</h6>
                                                <div class="f_social">
                                                    <a href="#">
                                                        <i class="fa fa-facebook"></i>
                                                    </a>
                                                    <a href="#">
                                                        <i class="fa fa-twitter"></i>
                                                    </a>
                                                    <a href="#">
                                                        <i class="fa fa-dribbble"></i>
                                                    </a>
                                                    <a href="#">
                                                        <i class="fa fa-behance"></i>
                                                    </a>
                                                </div>
                                            </div>
                                            <div class="br"></div>
                                        
                                    </div>
                                    
                                </div>
                                <div class="col-lg-2"></div>
                            </div>
                        </div>
                    </section>
                    <script src="/js/jquery-3.2.1.min.js"></script>
                    <script src="/js/popper.js"></script>
                    <script src="/js/bootstrap.min.js"></script>
                    <script src="/js/stellar.js"></script>
                    <script src="/vendors/lightbox/simpleLightbox.min.js"></script>
                    <script src="/vendors/nice-select/js/jquery.nice-select.min.js"></script>
                    <script src="/vendors/isotope/imagesloaded.pkgd.min.js"></script>
                    <script src="/vendors/isotope/isotope-min.js"></script>
                    <script src="/vendors/owl-carousel/owl.carousel.min.js"></script>
                    <script src="/js/jquery.ajaxchimp.min.js"></script>
                    <script src="/vendors/counter-up/jquery.waypoints.min.js"></script>
                    <script src="/vendors/flipclock/timer.js"></script>
                    <script src="/vendors/counter-up/jquery.counterup.js"></script>
                    <script src="/js/mail-script.js"></script>
                    <script src="/js/theme.js"></script>
                    </body>

                    </html>`
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
    
};

exports.postLogout = (req,res,next) => {
    req.session.destroy((err) => {
        
        res.redirect('/');
    });
}

exports.getReset = (req,res,next) => {
    let message = req.flash('error');
    //console.log(message);
    if(message.length>0) {
        message=message[0];
    }
    else {
        message=null;
    }
    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Reset Password',
        errorMessage:message
      });
};

exports.postReset = (req,res,next) => {
    crypto.randomBytes(32,(err,buffer) => {
        if(err) {
            console.log(err);
            return res.render('/reset');
        }
        const token = buffer.toString('hex');
        console.log(req.body);
        User.findOne({ email: req.body.email })
        .then(user => {
            if(!user) {
                req.flash('error','No account with that email found');
                return res.redirect('/reset');
            }
            user.resetToken = token;
            user.resetTokenExpiration = Date.now()+3600000;
            return user.save();
        })
        .then(result => {
            res.redirect('/login');
            transporter.sendMail({
                to:req.body.email,
                from:'sabadejuyee21@gmail.com',
                subject:'Password reset.',
                html:`<p>You requested a password reset. If you did not, please ignore this mail.</p>
                <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password. Please not that it is only valid for an hour.`

            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
    })
}

exports.getNewPassword = (req,res,next) => {
    const token = req.params.token;
    User.findOne({
        resetToken:token,
        resetTokenExpiration:{$gt:Date.now()}
    })
    .then(user => {
        if (!user) {
            req.flash(
              'error',
              'Oops! That reset password link has already been used. If you still need to reset your password, submit a new request.'
            );
            return res.redirect('/login');
        }
        let message = req.flash('error');
        //console.log(message);
        if(message.length>0) {
            message=message[0];
        }
        else {
            message=null;
        }
        res.render('auth/new-password', {
            path: '/new-password',
            pageTitle: 'New Password',
            errorMessage:message,
            userId:user._id.toString(),
            passwordToken:token
        });
        })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    })
}


exports.postNewPassword = (req,res,next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;

    User.findOne({
        resetToken:passwordToken,
        resetTokenExpiration:
        {
            $gt:Date.now()
        },
        _id:userId
    })
    .then(user => {
        resetUser = user;
        return bcrypt.hash(newPassword,12);
    })
    .then(hashedPasswd => {
        resetUser.password = hashedPasswd;
        resetUser.resetToken = undefined;
        resetUser.resetTokenExpiration = undefined;
        return resetUser.save();
    })
    .then(result => {
        res.redirect('/login');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};