require('dotenv').config();
const http = require('http');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const app = express();

const MONGODB_URI = process.env.mongo_uri;
const store = new MongoDBStore({
    uri:MONGODB_URI,
    collection:'sessions'
});

const csrfProtection = csrf();
app.use(flash());

const fileStorage = multer.diskStorage({
    destination: (req,file,cb) => {
        cb(null,'images')
    },
    filename: (req,file,cb) => {
        cb(null,new Date().getTime()+'-'+file.originalname)
    }
});

const fileFilter = (req,file,cb) => {
    if(file.mimetype==='image/png' || file.mimetype==='image/jpg' || file.mimetype==='image/jpeg') {
        cb(null,true);
    }
    else {
        cb(null,false);
    }
};

//const mongoConnect = require('./util/database').mongoConnect;
const User = require('./models/user');
const Author = require('./models/author');
app.set('view engine','ejs');
app.set('views','views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const errorController = require('./controllers/error');


app.use(bodyParser.urlencoded({extended: true}));
app.use(multer({storage:fileStorage,fileFilter:fileFilter}).single('image'));
app.use(express.static(path.join(__dirname,'public')));
app.use('/images',express.static(path.join(__dirname,'images')));

app.use(session({

    secret:'my secret',
    resave:false,
    saveUninitialized:false,
    store:store
}));

app.use(csrfProtection);

app.use((req,res,next) => {
    res.locals.userIsLoggedIn = req.session.userIsLoggedIn;
    res.locals.authorIsLoggedIn = req.session.authorIsLoggedIn;
    res.locals.notifications = req.session.notifications;
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use((req,res,next)=> {
    if(!req.session.user && !req.session.author) {
        return next();
    }
    else if(req.session.user) {
        User.findById(req.session.user._id)
            .then(user => {
                if(!user) {
                    next();
                }
                req.user=user;
                next();
            })
            .catch(err => {
                next(new Error(err));
            });
    }

    else if(req.session.author) {
        Author.findById(req.session.author._id)
            .then(author => {
                if(!author) {
                    next();
                }
                req.author=author;
                next();
            })
            .catch(err => {
                next(new Error(err));
            });
    }
});


app.use('/admin',adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500',errorController.get500);

app.use(errorController.get404);

app.use((error,req,res,next) => {
    
    res.status(500).render('500',
    {
        pageTitle:'Error',
        path:'/500',
        userIsLoggedIn:req.session.userIsLoggedIn,
        authorIsLoggedIn:req.session.authorIsLoggedIn,
        message:error.message
    });
})

const server = http.createServer(app);


mongoose.connect(process.env.mongoose_connect)
.then(result => {
    console.log('Connected');
    app.listen(3000);
})
.catch(err => {
    console.log(err);
});