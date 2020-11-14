const Product = require('../models/product');
//const Cart = require('../models/cart');
const Order = require('../models/order');
const Author = require('../models/author');
const Genre = require('../models/genre');
const Review = require('../models/review');
const Blog = require('../models/blog');
const BlogTag = require('../models/blogtag');
const User = require('../models/user');
const Comment = require('../models/comment');
const Event = require('../models/event');
const Discussion = require('../models/discussion');
const Message = require('../models/message');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const stripe = require('stripe')('sk_test_51HT73HHLn8bJ7czIpE3EJSdBbjEcKNsHQcLqhNPxMBMsJz9tiUoqtJXdDqwtR0E6wlSQfKETC6V9AbYZrj0cHlB100Z6yCxp05');
const ITEMS_PER_PAGE_INDEX = 5; 
const ITEMS_PER_PAGE_PRODUCTS = 12;
const ITEMS_PER_PAGE_BLOGS = 5;
const fetch = require("node-fetch");
const { validationResult } = require('express-validator');
const { generateKeyPair } = require('crypto');
const blog = require('../models/blog');
const fileHelper = require('../util/file');
const blogtag = require('../models/blogtag');
const message = require('../models/message');
var LocalStorage = require('node-localstorage').LocalStorage;
const localStorage = new LocalStorage('./scratch');

exports.getProducts = (req,res,next) => {
    //console.log(localStorage.getItem('viewed'));
    //fetchAll takes a function it should execute once its done
    const page = +req.query.page || 1;
    let totalItems;
    let totalGenres;
    Genre.find().limit(5)
    .then(genres => {
        return genres;
    })
    .then(genres => {
        totalGenres=genres;
        return Product.find().countDocuments();
    })
    .then(numProducts => {
        totalItems = numProducts;
        return Product.find().skip((page-1)*ITEMS_PER_PAGE_PRODUCTS).limit(ITEMS_PER_PAGE_PRODUCTS).sort({'views':-1});
    })
    .then(products => {
        Author.find().limit(5)
        .then(authors => {
            res.render('shop/product-list',{
                prods:products,
                pageTitle:'All products',
                path:'/products',
                current:page,
                next:page+1,
                prev:page-1,
                hasNextPage: ITEMS_PER_PAGE_PRODUCTS*page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: (page + 1),
                PreviousPage: (page - 1),
                lastPage:Math.ceil(totalItems/ITEMS_PER_PAGE_PRODUCTS),
                tagFilter:null,
                totalGenres:totalGenres,
                authors:authors
            });
        });
        
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });

}

exports.getProduct = (req,res,next) => {
    const prodId = req.params.productId;
    //console.log(prodId);
    // items = [{ 'user': req.user._id, 'product': prodId }];
    // localStorage.setItem('viewed', JSON.stringify(items));
    if(req.session.userIsLoggedIn) {
        Product.findById(prodId)
        .then(product => {
            product.incrementView();
            req.user.addSession(product);
        })
        .then(result => {
            //console.log(result);
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
    } 
    let productDetails;
    let authorDetails;
    let reviewDetails;
    let overall;
    let overallRating;
    Product.findById(prodId)
    .then((product) => {
        productDetails=product;
        return Author.find({_id:product.authorId});
    })
    .then((author) => {
        authorDetails=author;
        return Review.find({productId:productDetails._id}).populate('userId');
    })
    .then(reviews => {
        overall=reviews.map(review=>{
            return Number(review.rating);
        });
        overallRating = overall.reduce(function(a, b){
            return a + b;
        }, 0);
        overallRating = overallRating/reviews.length;
        reviewDetails = reviews;
        return User.find({_id:{$in:reviews.map(review => review.userId)}});
    })
    .then(users => {
        res.render('shop/product-detail', {
            prod: productDetails,
            author: authorDetails[0],
            errorMessage: null,
            hasError: false,
            pageTitle: productDetails.title,
            validationErrors: [],
            reviews:reviewDetails,
            users:users,
            path: '/products',
            overall: overallRating
        });
    })
    .catch(err => {
        console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
    
}

exports.getAuthors = (req,res,next) => {
    const page = +req.query.page || 1;
    let totalItems;
    let limitedAuthors;
    let totalGenres;
    Genre.find().limit(5)
    .then(genres => {
        totalGenres=genres;
        return Author.find().countDocuments();
    })
    .then(numAuthors => {
        totalItems = numAuthors;
        return Author.find().limit(5);
    })
    .then(authors => {
        limitedAuthors = authors; 
        return Author.find().skip((page-1)*ITEMS_PER_PAGE_PRODUCTS).limit(ITEMS_PER_PAGE_PRODUCTS);
    })
    .then(authors => {
        res.render('shop/author-list', {
            authors:authors,
            limitedAuthors:limitedAuthors,
            pageTitle: 'All Authors',
            path: '/authors',
            current: page,
            next: page + 1,
            prev: page - 1,
            hasNextPage: ITEMS_PER_PAGE_PRODUCTS * page < totalItems,
            hasPreviousPage: page > 1,
            nextPage: (page + 1),
            PreviousPage: (page - 1),
            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE_PRODUCTS),
            totalGenres:totalGenres,
            tagFilter:null
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.getAuthor = (req,res,next) => {
    let productsList;
    let allTags;
    let followList;
    let following=false;
    const authorId = req.params.authorId;
    //console.log(prodId);
    Author.findById(authorId)
    .then((author) => {
        if(req.session.userIsLoggedIn) {
            followList = author.follow.followers.map(follower => {
                return follower.followerId.toString()===req.user._id.toString();
            });
            following = followList.includes(true);
        }  
        //console.log(author);
        Product.find({authorId:author._id})
        .then((products) => {
            productsList = products;
            let randomTags = products.map(product => {
                return product.tags.map(tag => {
                    return tag.toString();
                });
            });
            let finalTags = Array.prototype.concat.apply([], randomTags);
            return Genre.find({tag:{$in:finalTags}});
        })
        .then((tags) => {
            allTags=tags;
            return Event.find({authorId:authorId,date:{$gte:new Date()}})
        })
        .then((events) => {
            res.render('shop/author',{
                prods:productsList,
                author:author,
                pageTitle:author.name,
                path:'/authors',
                tags:allTags,
                events:events,
                following:following,
                current:req.user
            });
        })
       
    })
    .catch(err => {
        console.log(err);
        const error = new Error('Sorry, we are unable to load this author due to a server error. Please try again later!');
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.getEvents = (req,res,next) => {
    var countries = ["Global","Afghanistan","Albania","Algeria","Andorra","Angola","Anguilla","Antigua & Barbuda","Argentina","Armenia","Aruba","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bermuda","Bhutan","Bolivia","Bosnia & Herzegovina","Botswana","Brazil","British Virgin Islands","Brunei","Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon","Canada","Cape Verde","Cayman Islands","Central Arfrican Republic","Chad","Chile","China","Colombia","Congo","Cook Islands","Costa Rica","Cote D Ivoire","Croatia","Cuba","Curacao","Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Ethiopia","Falkland Islands","Faroe Islands","Fiji","Finland","France","French Polynesia","French West Indies","Gabon","Gambia","Georgia","Germany","Ghana","Gibraltar","Greece","Greenland","Grenada","Guam","Guatemala","Guernsey","Guinea","Guinea Bissau","Guyana","Haiti","Honduras","Hong Kong","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Isle of Man","Israel","Italy","Jamaica","Japan","Jersey","Jordan","Kazakhstan","Kenya","Kiribati","Kosovo","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Macau","Macedonia","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Montserrat","Morocco","Mozambique","Myanmar","Namibia","Nauro","Nepal","Netherlands","Netherlands Antilles","New Caledonia","New Zealand","Nicaragua","Niger","Nigeria","North Korea","Norway","Oman","Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Puerto Rico","Qatar","Reunion","Romania","Russia","Rwanda","Saint Pierre & Miquelon","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","St Kitts & Nevis","St Lucia","St Vincent","Sudan","Suriname","Swaziland","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor L'Este","Togo","Tonga","Trinidad & Tobago","Tunisia","Turkey","Turkmenistan","Turks & Caicos","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States of America","Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Virgin Islands (US)","Yemen","Zambia","Zimbabwe"];
    Event.find().populate('authorId')
    .then(events=>{
        res.render("shop/events",{
            events:events,
            countries:countries,
            category:'default',
            pageTitle:'All Events',
            path:'/events',
        });
    })
    .catch(err => {
        const error = new Error('Sorry, we are unable to load this page due to a server error. Please try again later!');
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.getEvent = (req,res,next) => {
    let eventId = req.params.eventId;
    Event.findById(eventId).populate('authorId')
    .then(event => {
        res.render("shop/event-detail",{
            event:event,
            pageTitle:event.title,
            path:'/events',
        });
    })
    .catch(err => {
        const error = new Error('Sorry, we are unable to load this author due to a server error. Please try again later!');
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.categorizeEvents = (req,res,next) => {
    const category = req.body.category;
    if(category==='c1' || category==='default') {
        //var countries = ["Global","Afghanistan","Albania","Algeria","Andorra","Angola","Anguilla","Antigua & Barbuda","Argentina","Armenia","Aruba","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bermuda","Bhutan","Bolivia","Bosnia & Herzegovina","Botswana","Brazil","British Virgin Islands","Brunei","Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon","Canada","Cape Verde","Cayman Islands","Central Arfrican Republic","Chad","Chile","China","Colombia","Congo","Cook Islands","Costa Rica","Cote D Ivoire","Croatia","Cuba","Curacao","Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Ethiopia","Falkland Islands","Faroe Islands","Fiji","Finland","France","French Polynesia","French West Indies","Gabon","Gambia","Georgia","Germany","Ghana","Gibraltar","Greece","Greenland","Grenada","Guam","Guatemala","Guernsey","Guinea","Guinea Bissau","Guyana","Haiti","Honduras","Hong Kong","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Isle of Man","Israel","Italy","Jamaica","Japan","Jersey","Jordan","Kazakhstan","Kenya","Kiribati","Kosovo","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Macau","Macedonia","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Montserrat","Morocco","Mozambique","Myanmar","Namibia","Nauro","Nepal","Netherlands","Netherlands Antilles","New Caledonia","New Zealand","Nicaragua","Niger","Nigeria","North Korea","Norway","Oman","Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Puerto Rico","Qatar","Reunion","Romania","Russia","Rwanda","Saint Pierre & Miquelon","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","St Kitts & Nevis","St Lucia","St Vincent","Sudan","Suriname","Swaziland","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor L'Este","Togo","Tonga","Trinidad & Tobago","Tunisia","Turkey","Turkmenistan","Turks & Caicos","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States of America","Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Virgin Islands (US)","Yemen","Zambia","Zimbabwe"];
        Event.find().populate('authorId')
        .then(events=>{
            res.render("shop/events",{
                events:events,
                pageTitle:'All Events',
                category:category,
                path:'/events',
            });
        })
        .catch(err => {
            const error = new Error('Sorry, we are unable to load this page due to a server error. Please try again later!');
            error.httpStatusCode = 500;
            return next(error);
        });
    }
    else {
        Event.find({category:category})
        .then(events => {
            res.render('shop/events',{
                events:events,
                category:category,
                pageTitle:'All Events',
                path:'/events',
            });
        })
        .catch(err => {
            const error = new Error('Sorry, we are unable to load this author due to a server error. Please try again later!');
            error.httpStatusCode = 500;
            return next(error);
        });
        }
    
}

exports.getBookGenres = (req,res,next) => {
    let smallGenres;
    let allGenres;
    Genre.find().limit(5)
    .then(lessGenres => {
        smallGenres = lessGenres;
        return Genre.find();
    })
    .then(genres => {
        allGenres = genres;
        return Author.find().limit(5);
    })
    .then(authors => {
        res.render('shop/book-genres',{
            genres:allGenres,
            lessGenres:smallGenres,
            authors:authors,
            pageTitle:'Book Genres',
            path:'/genres'
        })
    })
    .catch(err => {
        const error = new Error('Sorry, we are unable to load this author due to a server error. Please try again later!');
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.getBlogs = (req,res,next) => {
    const page = +req.query.page || 1;
    let totalItems;
    let totalTags;
    let allBlogs;
    
    BlogTag.find()
    .then(tags => {
        totalTags=tags;
        return Blog.find().countDocuments();
    })
    .then(numBlogs => {
        totalItems = numBlogs;
        return Blog.find().populate('userId').skip((page-1)*ITEMS_PER_PAGE_BLOGS).limit(ITEMS_PER_PAGE_BLOGS).sort({'date':-1});
    })
    .then(blogs => {
        
        allBlogs=blogs;
        return Blog.find().populate('userId').sort({'views':-1}).limit(4);
    })
    .then(popularBlogs => {
        res.render('shop/blogs', {
            pageTitle:'All Blogs',
            path:'/blogs',
            blogs:allBlogs,
            popularBlogs:popularBlogs,
            current: page,
            next: page + 1,
            prev: page - 1,
            hasNextPage: ITEMS_PER_PAGE_BLOGS * page < totalItems,
            hasPreviousPage: page > 1,
            nextPage: (page + 1),
            PreviousPage: (page - 1),
            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE_BLOGS),
            tags:totalTags,
            tagFilter:null
        });
    })
    .catch(err => {
        console.log(err);
        const error = new Error('Sorry, we are unable to load this page due to a server error. Please try again later!');
        error.httpStatusCode = 500;
        return next(error);
    });
    
};

exports.getCreateBlog = (req,res,next) => {
    res.render('shop/create-blog', {
        pageTitle: 'Add Blog',
        path: '/create-blog',
        editing: false,
        hasError:false,
        errorMessage:null,
        validationErrors:[]
      });
};

exports.postCreateBlog = (req,res,next) => {
    const title = req.body.title;
    const image = req.file;
    const text = req.body.text;
    const tags = req.body.tags;
    const tagArray = tags.split(",");
    const quote = req.body.quote;

    if(!image) {
        return res.status(422).render('shop/create-blog', {
            pageTitle: 'Add Blog',
            path: '/create-blog',
            editing: false,
            hasError:true,
            blog: {
                title:title,
                text:text
            },
            errorMessage:'Attached file is not an image!',
            validationErrors:[]
        });
    }
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(422).render('shop/create-blog', {
            pageTitle: 'Add Blog',
            path: '/create-blog',
            editing: false,
            hasError:true,
            blog: {
                title:title,
                tags:tags,
                text:text,
                quote:quote
            },
            errorMessage:errors.array()[0].msg,
            validationErrors:errors.array()
        });
    }
    const imageUrl = image.path;
    var today = new Date();
    var date = today.getDate()+'/'+(today.getMonth()+1)+'/'+today.getFullYear();
    const blog = new Blog({title:title, text:text, imageUrl:imageUrl,quote:quote,tags:Array.from(tagArray),date:today,dateString:date,userId:req.user});
    blog
        .save()
        .then(result => {
            req.user.follow.followers.map(follower => {
                User.findById(follower.followerId)
                .then(user => {
                    user.addBlogNotification(blog,req.user);
                });
               
            });
            console.log('Created Blog');
            res.redirect('/myblogs');
        })
        .catch(err => {
        const error = new Error('A server error has occurred. We are working on fixing this. Please try again in a while. Sorry for your inconvenience.');
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.getEditBlog = (req,res,next) => {
    const editMode = req.query.edit;
    if (!editMode) {
        return res.redirect('/myblogs');
    }
    const blogId = req.params.blogId;
    Blog.findById(blogId)
    .then(blog => {
      if (!blog) {
        return res.redirect('/myblogs');
      }
      res.render('shop/create-blog', {
        pageTitle: 'Edit Blog',
        path: '/create-blog',
        editing: editMode,
        blog: blog,
        hasError:false,
        errorMessage:null,
        validationErrors:[]
      });
    })
    .catch(err => {
      const error = new Error('A server error has occurred. We are working on fixing this. Please try again in a while. Sorry for your inconvenience.');
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditBlog = (req,res,next) => {
    const blogId = req.body.blogId;
    const updatedTitle = req.body.title;
    const image = req.file;
    const tags = req.body.tags;
    const updatedText = req.body.text;
    const updatedQuote = req.body.quote;

    const errors = validationResult(req);
    //console.log(errors);
    if(!errors.isEmpty()) {
        return res.status(422).render('shop/create-blog', {
        pageTitle: 'Edit Blog',
        path: '/create-blog',
        editing: true,
        hasError:true,
        blog: {
            title:updatedTitle,
            tags:tags,
            text:updatedText,
            quote:updatedQuote,
            _id : blogId
        },
        errorMessage:errors.array()[0].msg,
        validationErrors:errors.array()
        });
    }

    Blog.findById(blogId)
    .then(blog => {
        if(blog.userId.toString()!==req.user._id.toString()) {
            return res.redirect('/myblogs');
        }
        blog.title = updatedTitle;
        blog.tags = tags.split(',');
        blog.text = updatedText;
        blog.quote = updatedQuote;
        if(image) {
            fileHelper.deleteFile(blog.imageUrl);
            blog.imageUrl = image.path;
        }

        return blog.save()
        .then(result => {
        console.log('UPDATED BLOG!');
        res.redirect('/myblogs');
        });
    })
    .catch(err => {
        const error = new Error('A server error has occurred. We are working on fixing this. Please try again in a while. Sorry for your inconvenience.');
        error.httpStatusCode = 500;
        return next(error);
    });

};

exports.getBlogDetails = (req,res,next) => {
    const blogId = req.params.blogId;
    let blogDetails;
    let userDetails;
    Blog.findById(blogId)
    .then(blog => {
        if(req.user && req.user._id.toString()!==blog.userId.toString()) {
            blog.incrementView();
        }
        blogDetails=blog;
        return User.find({_id:blog.userId});
    })
    .then(user => {
        userDetails = user;
        return Comment.find({blogId:blogDetails._id}).populate('userId');
    })
    .then(comments => {
        res.render('shop/blog-detail',{
            pageTitle:blogDetails.title,
            path:'/blog-detail',
            blog:blogDetails,
            comments:comments,
            hasError:false,
            user:userDetails[0]
        });
    })
    .catch(err => {
        console.log(err);
        const error = new Error('A server error has occurred. We are working on fixing this. Please try again in a while. Sorry for your inconvenience.');
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.getUserBlogs = (req,res,next) => {
    let userDetails;
    let blogsDetails;
    User.find({_id:req.user})
    .then(user => {
        userDetails = user;
        return Blog.find({userId:req.user}).populate('userId').sort({date:-1});
    })
    .then(blogs => {
        blogsDetails = blogs;
        let randomTags = blogs.map(blog => {
            return blog.tags.map(tag => {
                return tag.toString();
            });
        });
        let finalTags = Array.prototype.concat.apply([], randomTags);
        return BlogTag.find({tag:{$in:finalTags}});
    })
    .then(blogtags =>{
        // console.log(blogs);
        res.render('shop/myblogs',{
            pageTitle:'Your Blogs',
            path:'/myblogs',
            blogs:blogsDetails,
            blogtags:blogtags,
            user:userDetails[0]
        });
    })
    .catch(err => {
        console.log(err);
        const error = new Error('A server error has occurred. We are working on fixing this. Please try again in a while. Sorry for your inconvenience.');
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.deleteBlog = (req, res, next) => {
    const blogId = req.params.blogId;
    Blog.findById(blogId)
    .then(blog => {
      if(!blog) {
        throw new Error('Blog not found');
      }
      fileHelper.deleteFile(blog.imageUrl);
      return Blog.deleteOne({_id:blogId,userId:req.user._id});
    })
    .then(() => {
      console.log('Deleted Blog');
      res.status(200).json({
        message:'Success'
      });
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
        message:'Deleting blog failed'
      });
    });
};

exports.getBlogGenres = (req,res,next) => {
    BlogTag.find()
    .then(blogtags=>{
        res.status(200).json(
            blogtags.map(t => t.tag)
            // ['Philosophy','Travel','Literature','Social','Politics','Movie','Review','Cinematography','Fitness','Beverage','Lifestyle','Architecture','Food','Wildlife']
        );
    })
   
};

exports.getProfile = (req,res,next) => {
    let message = req.flash('error');
    //console.log(message);
    if(message.length>0) {
        message=message[0];
    }
    else {
        message=null;
    }
    User.find({_id:req.user._id})
    .then(user => {
        res.render('shop/profile', {
            user: user[0],
            pageTitle: 'Your Profile',
            path: '/profile',
            errorMessage:message
        });
       
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.postProfile = (req,res,next) => {
    const userId = req.body.userId;
    const email = req.body.email;
    const name = req.body.name;
    const phoneno = req.body.phoneno;
    const image = req.file;
    const desc = req.body.description;
    const city = req.body.city;
    const country = req.body.country;
    const address = req.body.address;
    const postal = req.body.postal;
    const errors = validationResult(req);
    //console.log(errors);
    if(!errors.isEmpty()) {
        return res.status(422).render('shop/profile', {
        pageTitle: 'Your Profile',
        path: '/profile',
        user: {
            name:name,
            email:email,
            description:desc,
            phoneno:phoneno,
            city:city,
            country:country,
            address:address,
            postal:postal,
            _id : userId
        },
        errorMessage:errors.array()[0].msg,
        validationErrors:errors.array()
        });
    }

    User.findById(userId)
    .then(user => {
        //console.log(author);
        user.name = name;
        user.email = email;
        user.description = desc;
        user.address = address;
        user.city = city;
        user.country = country;
        user.postal = postal;
        user.phoneno = phoneno;
        if(image) {
        if(user.imageUrl!=='images/user/profile.png') {
            fileHelper.deleteFile(user.imageUrl);
        }
        user.imageUrl = image.path;
        }

        return user.save()
        .then(result => {
        console.log('UPDATED USER!');
        res.redirect('/profile');
        });
    })
    .catch(err => {
        console.log(err);
        const error = new Error('A server error has occurred. We are working on fixing this. Please try again in a while. Sorry for your inconvenience.');
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.getTag = (req,res,next) => {
    const page = +req.query.page || 1;
    let totalItems;
    const tagName = req.params.tagName;
    let totalGenres;
    Genre.find()
    .then(genres => {
        return genres;
    })
    .then(genres => {
        totalGenres=genres;
        return Product.find({tags:{$in:[tagName]}}).countDocuments();
    })
    .then(numProducts => {
        totalItems = numProducts;
        return Product.find({tags:{$in:[tagName]}}).skip((page-1)*ITEMS_PER_PAGE_PRODUCTS).limit(ITEMS_PER_PAGE_PRODUCTS);
    })
    .then(products => {
        Author.find()
        .then(authors => {
            res.render('shop/product-list',{
                prods:products,
                pageTitle:'All products/'+tagName,
                path:'/products',
                current:page,
                next:page+1,
                prev:page-1,
                hasNextPage: ITEMS_PER_PAGE_PRODUCTS*page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: (page + 1),
                PreviousPage: (page - 1),
                lastPage:Math.ceil(totalItems/ITEMS_PER_PAGE_PRODUCTS),
                tagFilter:tagName,
                totalGenres:totalGenres,
                authors:authors
            });
        });
        
    })
    .catch(err => {
        console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.getBlogTag = (req,res,next) => {
    const page = +req.query.page || 1;
    let totalItems;
    const tagName = req.params.tagName;
    let totalGenres;
    let allBlogs;
    BlogTag.find()
    .then(genres => {
        return genres;
    })
    .then(genres => {
        totalGenres=genres;
        return Blog.find({tags:{$in:[tagName]}}).countDocuments();
    })
    .then(numBlogs => {
        totalItems = numBlogs;
        return Blog.find({tags:{$in:[tagName]}}).skip((page-1)*ITEMS_PER_PAGE_BLOGS).limit(ITEMS_PER_PAGE_BLOGS).populate('userId').sort({'date':-1});
    })
    .then(blogs => {
        allBlogs=blogs;
        return Blog.find().populate('userId').sort({'views':-1}).limit(4);
    })
    .then(popularBlogs => {
            res.render('shop/blogs',{
                blogs:allBlogs,
                popularBlogs:popularBlogs,
                pageTitle:'All Blogs/'+tagName,
                path:'/blogs',
                current:page,
                next:page+1,
                prev:page-1,
                hasNextPage: ITEMS_PER_PAGE_BLOGS*page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: (page + 1),
                PreviousPage: (page - 1),
                lastPage:Math.ceil(totalItems/ITEMS_PER_PAGE_BLOGS),
                tagFilter:tagName,
                tags:totalGenres,
            
        });
        
    })
    .catch(err => {
        console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.getIndex = (req,res,next) => {
    const page = +req.query.page || 1;
    let totalItems;
    if(req.session.userIsLoggedIn) {
        let userDetails;
        User.findById(req.user._id).populate('session.viewedBooks.productId')
        .then(user => {   
            return res.render('shop/index',{
                user:user,
                pageTitle:'Shop',
                path:'/',
            });
        })
    }
    else {
        Product.find().countDocuments()
        .then(numProducts => {
            totalItems = 5;
            return Product.find().sort({'views':-1}).limit(5);
        })
        .then(products => {
            res.render('shop/index',{
                prods:products,
                pageTitle:'Shop',
                path:'/',
                current:page,
                next:page+1,
                prev:page-1,
                hasNextPage: ITEMS_PER_PAGE_INDEX*page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: (page + 1),
                PreviousPage: (page - 1),
                lastPage:Math.ceil(totalItems/ITEMS_PER_PAGE_INDEX)
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
    }
}

exports.getCart = (req,res,next) => {
    let products;
    let total=0;
    req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
        products=user.cart.items;
        products.forEach(p => {
            total+=p.quantity*p.productId.price;
        });

        
        res.render('shop/cart', {
            path: '/cart',
            pageTitle: 'Your Cart',
            products:products,
            sum:total,
            totalSum:total+(0.05*total)+50
        });
        
        
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.getCheckout = (req, res, next) => {
    let products;
    let total=0;
    req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
        products=user.cart.items;
        products.forEach(p => {
            total+=p.quantity*p.productId.price;
        });
        
        return stripe.checkout.sessions.create({
            payment_method_types:['card'],
            line_items:products.map(p => {
                return {
                    name:p.productId.title,
                    description:p.productId.description,
                    amount:p.productId.price*100,
                    currency:'inr',
                    quantity:p.quantity
                };
            }),
            success_url:req.protocol+'://'+req.get('host')+'/checkout/success',
            cancel_url:req.protocol+'://'+req.get('host')+'/checkout/cancel'
        });
    })
    .then(session => {
        res.render('shop/checkout', {
            path: '/checkout',
            pageTitle: 'Checkout',
            products:products,
            sum:total,
            totalSum:total+(0.05*total)+50,
            sessionId:session.id
        });

    })
    .catch(err => {
        const error = new Error("Sorry! You can't access this page unless you haven't ordered anything.");
        error.httpStatusCode = 500;
        return next(error);
    });
    
};
  
exports.postCart = (req, res, next) => {
    var prodId = req.body.productId;
    Product.findById(prodId)
    .then(product => {
        return req.user.addToCart(product);
        
    })
    .then(result => {
        //console.log(result);
        res.redirect('/cart');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    })
    
 };


// exports.getCheckout = (req,res,next) => {
//     res.render('shop/checkout',{
//         path:'/checkout',
//         pageTitle:'Checkout Page'
//     });
// }

exports.postCartDeleteProduct = (req,res,next) => {
    const prodId = req.body.productId;
    req.user.deleteItemFromCart(prodId)
    .then(result => {
        res.redirect('/cart');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    })
    
}

exports.updateQuantity = (req,res,next) => {
    const prodId = req.body.productId;
    const quantity = req.body.quantity;
    
    Product.findById(prodId)
    .then(product => {
        return req.user.updateCartQuantity(product,quantity);
    })
    .then(result => {
        res.redirect('/cart');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    })
    
}

exports.getUserProfile = (req,res,next) => {
    const userId = req.params.userId;
    let userDetails;
    let followList;
    let following=false;
    User.findById(userId)
    .then(user => {
        if(req.session.userIsLoggedIn) {
            followList = user.follow.followers.map(follower => {
                return follower.followerId.toString()===req.user._id.toString();
            });
            following = followList.includes(true);
        }  
        userDetails = user;
        return Review.find({userId:userId}).populate('productId');
    })
    .then(reviews => {
        Blog.find({userId:userId})
        .then(blogs => {
            res.render('shop/userprofile',{
                current:req.user,
                user:userDetails,
                reviews:reviews,
                blogs:blogs,
                pageTitle:userDetails.name+"'s Profile",
                path:'/profile',
                following:following
            })
        })
    })
    .catch(err => {
        console.log(err);
        const error = new Error('A server error has occurred. We are working on fixing this. Please try again in a while. Sorry for your inconvenience.');
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.getUserNotifications = (req,res,next) => {
    req.user.populate('notifications.comments.blogId notifications.comments.commentorId notifications.blogs.blogId notifications.blogs.bloggerId').execPopulate()
    .then(user => {
        res.render('shop/notifications',{
            notifications:user.notifications,
            pageTitle:user.name+"'s Notifications",
            path:'/notifications'
        })
    })
    .catch(err => {
        console.log(err);
        const error = new Error('A server error has occurred. We are working on fixing this. Please try again in a while. Sorry for your inconvenience.');
        error.httpStatusCode = 500;
        return next(error);
    });

};

exports.deleteNotificatonComment = (req,res,next) => {
    const commentId = req.params.commentId;
    req.user.deleteNotif(commentId)
    .then(result => {
        
        res.status(200).json({
            message:'Success'
        });
    })
    .catch(err => {
        res.status(500).json({
            message:'Deleting notification failed'
          });
    })
}

exports.deleteNotificatonBlog = (req,res,next) => {
    const blogId = req.params.blogId;
    
    req.user.deleteNotifBlog(blogId)
    .then(result => {
        
        res.status(200).json({
            message:'Success'
        });
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
        message:'Deleting notification failed'
      });
    })
}

exports.addFollower = (req,res,next) => {
    const user = JSON.parse(req.body.user);

    User.findById(user._id)
    .then(user => {
        return user.addFollow(req.user);
    })
    .then(result => {
        let resObj = {
            user : JSON.parse(req.body.user),
            follow : true
        };
        //console.log(resObj);
        return res.send(JSON.stringify(resObj));
    })
    .catch(err => {
        console.log(err);
        const error = new Error('A server error has occurred. We are working on fixing this. Please try again in a while. Sorry for your inconvenience.');
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.authorAddFollower = (req,res,next) => {
    const author = JSON.parse(req.body.author);

    Author.findById(author._id)
    .then(author => {
        return author.addFollow(req.user);
    })
    .then(result => {
        let resObj = {
            author : JSON.parse(req.body.author),
            follow : true
        };
        //console.log(resObj);
        return res.send(JSON.stringify(resObj));
    })
    .catch(err => {
        console.log(err);
        const error = new Error('A server error has occurred. We are working on fixing this. Please try again in a while. Sorry for your inconvenience.');
        error.httpStatusCode = 500;
        return next(error);
    });
}


exports.removeFollower = (req,res,next) => {
    const user = JSON.parse(req.body.user);
    User.findById(user._id)
    .then(user => {
        return user.removeFollow(req.user);
    })
    .then(result => {
        let resObj = {
            user : JSON.parse(req.body.user),
            message:'Removed Follower'
        };
        //console.log(resObj);
        return res.send(JSON.stringify(resObj));
    })
    .catch(err => {
        console.log(err);
        const error = new Error('A server error has occurred. We are working on fixing this. Please try again in a while. Sorry for your inconvenience.');
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.authorRemoveFollower = (req,res,next) => {
    const author = JSON.parse(req.body.author);
    Author.findById(author._id)
    .then(author => {
        return author.removeFollow(req.user);
    })
    .then(result => {
        let resObj = {
            author : JSON.parse(req.body.author),
            message:'Removed Follower'
        };
        //console.log(resObj);
        return res.send(JSON.stringify(resObj));
    })
    .catch(err => {
        console.log(err);
        const error = new Error('A server error has occurred. We are working on fixing this. Please try again in a while. Sorry for your inconvenience.');
        error.httpStatusCode = 500;
        return next(error);
    });
}


exports.getCreateDiscussion = (req,res,next) => {
    let books;
    Product.find()
    .then(products => {
        books = products.map(product => {
            return product.title;
        });
        
        res.render('shop/create-discussion',{
            books:books,
            editing:false,
            hasError:false,
            validationErrors:[],
            errorMessage:null,
            pageTitle:"Create Discussion",
            path:'/create-discussion'
        });
    })
    .catch(err => {
        console.log(err);
        const error = new Error('A server error has occurred. We are working on fixing this. Please try again in a while. Sorry for your inconvenience.');
        error.httpStatusCode = 500;
        return next(error);
    });
    
}

exports.getDiscussions = (req,res,next) => {
    const page = +req.query.page || 1;
    let totalItems;
    Discussion.find().countDocuments()
    .then(numDiscussions => {
        totalItems = numDiscussions;
        return Discussion.find().populate('bookId userId').skip((page-1)*ITEMS_PER_PAGE_PRODUCTS).limit(ITEMS_PER_PAGE_PRODUCTS).sort({'date':-1});
    })
    .then(discussions => {
        res.render('shop/discussion-forum',{
            discussions:discussions,
            current:page,
            next:page+1,
            prev:page-1,
            hasNextPage: ITEMS_PER_PAGE_PRODUCTS*page < totalItems,
            hasPreviousPage: page > 1,
            nextPage: (page + 1),
            PreviousPage: (page - 1),
            lastPage:Math.ceil(totalItems/ITEMS_PER_PAGE_PRODUCTS),
            pageTitle:"Discussion Forum",
            path:'/discussions'
        })
    })
    .catch(err => {
        console.log(err);
        const error = new Error('A server error has occurred. We are working on fixing this. Please try again in a while. Sorry for your inconvenience.');
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.getDiscussion = (req,res,next) => {
    let discussionDetail;
    const discussionId = req.params.discussionId;
    Discussion.findById(discussionId).populate('bookId userId')
    .then(discussion => {
        if(req.user && req.user._id.toString()!==discussion.userId.toString()) {
            discussion.incrementView();
        }
        discussionDetail = discussion;
        return Message.find({discussionId:discussionId}).populate('userId');
    })
    .then(messages => {
        res.render('shop/discussion-detail',{
            current:req.user,
            discussion:discussionDetail,
            messages:messages,
            pageTitle:discussionDetail.title,
            path:'/discussions'
        });
    })
    .catch(err => {
        console.log(err);
        const error = new Error('A server error has occurred. We are working on fixing this. Please try again in a while. Sorry for your inconvenience.');
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.postCreateDiscussion = (req,res,next) => {
    const title = req.body.title;
    const comment = req.body.comment;
    const bookTitle = req.body.bookTitle;

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(422).render('shop/create-discussion', {
        pageTitle: 'Create Discussion',
        path: '/create-discussion',
        editing: false,
        hasError:true,
        discussion: {
          title:title,
          comment:comment,
          bookTitle:bookTitle
        },
        errorMessage:errors.array()[0].msg,
        validationErrors:errors.array()
      });
    }

    Product.find({title:bookTitle})
    .then(book => {
        if(book.length>0) {
            const discussion = new Discussion({title:title, comment:comment,bookId:book[0]._id,bookExists:true,userId:req.user, date:new Date(),views:0});
            discussion
            .save()
            .then(result => {
                // console.log(result);
                console.log('Created Discussion');
                res.redirect('/discussions');
            })
        }
        else {
            const discussion = new Discussion({title:title, comment:comment,bookExists:false,userId:req.user, date:new Date()});
            discussion
            .save()
            .then(result => {
                // console.log(result);
                console.log('Created Discussion');
                res.redirect('/discussions');
            })
        }
        
    })
    .catch(err => {
        console.log(err);
        const error = new Error('A server error has occurred. We are working on fixing this. Please try again in a while. Sorry for your inconvenience.');
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.getEditDiscussion = (req,res,next) => {
    const editMode = req.query.edit;
    let discussionDetail;
    if (!editMode) {
        return res.redirect('/discussions');
    }
    const discussionId = req.params.discussionId;
    Discussion.findById(discussionId).populate('bookId')
    .then(discussion => {
        discussionDetail = discussion;
        return Product.find();
    })
    .then(products => {
        books = products.map(product => {
            return product.title;
        });
        if (!discussionDetail) {
            return res.redirect('/discussions');
        }
        res.render('shop/create-discussion', {
            pageTitle: 'Edit Discussion',
            path: '/create-discussion',
            editing: editMode,
            discussion:discussionDetail,
            books:books,
            hasError:false,
            errorMessage:null,
            validationErrors:[]
        });
    })
    .catch(err => {
      const error = new Error('A server error has occurred. We are working on fixing this. Please try again in a while. Sorry for your inconvenience.');
      error.httpStatusCode = 500;
      return next(error);
    });
}

exports.postEditDiscussion = (req,res,next) => { 
    const discussionId = req.body.discussionId;
    const title = req.body.title;
    const comment = req.body.comment;
    const bookTitle = req.body.bookTitle;

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(422).render('shop/create-discussion', {
        pageTitle: 'Create Discussion',
        path: '/create-discussion',
        editing: false,
        hasError:true,
        discussion: {
          title:title,
          comment:comment,
          bookTitle:bookTitle
        },
        errorMessage:errors.array()[0].msg,
        validationErrors:errors.array()
      });
    }

    Discussion.findById(discussionId)
    .then(discussion => {
        if(discussion.userId.toString()!==req.user._id.toString()) {
            return res.redirect('/discussions');
        }
        discussion.title = title;
        discussion.comment = comment;
        discussion.bookTitle = bookTitle;

        return discussion.save()
        .then(result => {
        console.log('UPDATED DISCUSSION!');
        res.redirect('/discussions/'+discussionId);
        });
    })
    .catch(err => {
        const error = new Error('A server error has occurred. We are working on fixing this. Please try again in a while. Sorry for your inconvenience.');
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.deleteDiscussion = (req,res,next) => {
    const discussionId = req.params.discussionId;
    Discussion.findById(discussionId)
    .then(discussion => {
        if(!discussion) {
            throw new Error('Discussion not found');
        }
        return Discussion.deleteOne({_id:discussionId,userId:req.user._id});
    })
    .then(result => {
        console.log("Deleted Discussion");
        res.redirect('/discussions')
    })
}

exports.addMessage = (req,res,next) => {
    const comment = req.body.comment;
    const discussion = JSON.parse(req.body.discussion);
    const current = JSON.parse(req.body.current);

    if(!comment || comment.length<10) {
        let resObj = {
            comment : req.body.comment,
            discussion : JSON.parse(req.body.discussion),
            current : JSON.parse(req.body.current),
            userName : req.user.name,
            hasError : true,
            errorMessage : 'You have to provide a valid comment! The comment should be minimum 10 characters.'
        };
        //console.log(resObj);
        return res.send(JSON.stringify(resObj));
        
    }
    var today = new Date();
    const userMessage = new Message({comment:comment,discussionId:discussion,userId:req.user,date:today});
    userMessage.save()
        .then(result => {
            console.log('Added Message');
            let resObj = {
                comment : req.body.comment,
                discussion : JSON.parse(req.body.discussion),
                current : JSON.parse(req.body.current),
                userName : req.user.name,
                date : today,
                userImage : req.user.imageUrl,
                hasError : false,
                errorMessage : null
            };
            //console.log(resObj);
            return res.send(JSON.stringify(resObj));
        })
        .catch(err => {
            console.log(err);
            const error = new Error('A server error has occurred. We are working on fixing this. Please try again in a while. Sorry for your inconvenience.');
            error.httpStatusCode = 500;
            return next(error);
        });

}

exports.addReview = (req,res,next) => {
    const rating = req.body.rating;
    const summary = req.body.summary;
    const text = req.body.text;
    const product = JSON.parse(req.body.product);
    const author = JSON.parse(req.body.author);
    
    if(!rating) {
        let resObj = {
            rating : req.body.rating,
            summary : req.body.summary,
            text : req.body.text,
            product : JSON.parse(req.body.product),
            author : JSON.parse(req.body.author),
            userName : req.user.name,
            hasError : true,
            errorMessage : 'You have to provide a valid rating!'
        };
        //console.log(resObj);
        return res.send(JSON.stringify(resObj));
        
    }
    else if(!summary || summary.length<5) {
        let resObj = {
            rating : req.body.rating,
            summary : req.body.summary,
            text : req.body.text,
            product : JSON.parse(req.body.product),
            author : JSON.parse(req.body.author),
            userName : req.user.name,
            hasError : true,
            errorMessage : 'You have to provide a valid summary! The summary should be minimum five characters.'
        };
        //console.log(resObj);
        return res.send(JSON.stringify(resObj));
        
    }
    else if(!text || text.length<20) {
        let resObj = {
            rating : req.body.rating,
            summary : req.body.summary,
            text : req.body.text,
            product : JSON.parse(req.body.product),
            author : JSON.parse(req.body.author),
            userName : req.user.name,
            hasError : true,
            errorMessage : 'You have to provide a valid review! The review should be minimum 25 characters.'
        };
        //console.log(resObj);
        return res.send(JSON.stringify(resObj));
        
    }
    let reviewDetails;
    Review.find({productId:product._id})
    .then(reviews => {
        reviewDetails = reviews;
        return User.find({_id:{$in:reviews.map(review => review.userId)}});
    })
    .then(users => {
        var userExist = users.map(user=>{
            return(user._id.toString()===req.user._id.toString());
        });
        var exists = userExist.includes(true);
        return exists;
    })
    .then(exists => {
        if(!exists) {
            const userReview = new Review({rating:rating,summary:summary, text:text,productId:product,userId:req.user,userName:req.user.name});
            userReview.save()
            .then(result => {
                console.log('Added Review');
                let resObj = {
                    rating : req.body.rating,
                    summary : req.body.summary,
                    text : req.body.text,
                    product : JSON.parse(req.body.product),
                    author : JSON.parse(req.body.author),
                    userName : req.user.name,
                    hasError : false,
                    errorMessage : null
                };
                //console.log(resObj);
                return res.send(JSON.stringify(resObj));
            })
            .catch(err => {
                console.log(err);
                const error = new Error('A server error has occurred. We are working on fixing this. Please try again in a while. Sorry for your inconvenience.');
                error.httpStatusCode = 500;
                return next(error);
            });
        }
        else {
            let resObj = {
                rating : req.body.rating,
                summary : req.body.summary,
                text : req.body.text,
                product : JSON.parse(req.body.product),
                author : JSON.parse(req.body.author),
                userName : req.user.name,
                hasError : true,
                errorMessage : 'Sorry, You have already given a review!'
            };
            //console.log(resObj);
            return res.send(JSON.stringify(resObj));
        }
    });
    
}

exports.addComment = (req,res,next) => {
    const comment = req.body.comment;
    const blog = JSON.parse(req.body.blog);
    const blogger = JSON.parse(req.body.blogger);

    if(!comment || comment.length<5) {
        let resObj = {
            comment : req.body.comment,
            blog : JSON.parse(req.body.blog),
            blogger : JSON.parse(req.body.blogger),
            userName : req.user.name,
            hasError : true,
            errorMessage : 'You have to provide a valid comment! The comment should be minimum five characters.'
        };
        //console.log(resObj);
        return res.send(JSON.stringify(resObj));
        
    }
    var today = new Date();
    var date = today.getDate()+'/'+(today.getMonth()+1)+'/'+today.getFullYear()+' '+today.getHours() + ":" + today.getMinutes();
    let commentDetails;
    Comment.find({blogId:blog._id})
    .then(comments => {
        commentDetails = comments;
        return User.find({_id:{$in:comments.map(comment => comment.userId)}});
    })
    .then(users => {
        var userExist = users.map(user=>{
            return(user._id.toString()===req.user._id.toString());
        });
        var exists = userExist.includes(true);
        return exists;
    })
    .then(exists => {
        if(!exists) {
            const userComment = new Comment({comment:comment,blogId:blog,userId:req.user,userName:req.user.name,date:date});
            userComment.save()
            .then(result => {
                console.log('Added Comment');
                
                User.findById(blogger._id)
                .then(blogger => {
                    blogger.addCommentNotification(blog,req.user);
                })
                .then(result => {
                    let resObj = {
                        comment : req.body.comment,
                        blog : JSON.parse(req.body.blog),
                        blogger : JSON.parse(req.body.blogger),
                        userName : req.user.name,
                        date : date,
                        userImage : req.user.imageUrl,
                        hasError : false,
                        errorMessage : null
                    };
                    //console.log(resObj);
                    return res.send(JSON.stringify(resObj));
                });
                
            })
            .catch(err => {
                console.log(err);
                const error = new Error('A server error has occurred. We are working on fixing this. Please try again in a while. Sorry for your inconvenience.');
                error.httpStatusCode = 500;
                return next(error);
            });
        }
        else {
            let resObj = {
                comment : req.body.comment,
                blog : JSON.parse(req.body.blog),
                blogger : JSON.parse(req.body.blogger),
                userName : req.user.name,
                hasError : true,
                errorMessage : 'Sorry, You have already given a review!'
            };
            //console.log(resObj);
            return res.send(JSON.stringify(resObj));
        }
    });
    
}


exports.postOrder = (req,res,next) => {
    req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
        const products=user.cart.items.map(i => {
            return {quantity:i.quantity,product:{...i.productId._doc}};
        });
        //console.log(products);
        const order = new Order({
            user:{
                email:req.user.email,
                userId:req.user._id
            },
            products:products
        });
        return order.save();
    })
    .then(result => {
        return req.user.clearCart();
    })
    .then(() => {
        res.redirect('/orders');
    })  
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.getOrders = (req,res,next) => {
    Order.find({"user.userId":req.user._id})
    .then(orders => {
        res.render('shop/orders',{
            path:'/orders',
            pageTitle:'Orders',
            orders:orders,
            isLoggedIn:req.session.isLoggedIn
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    })
    
};

exports.getInvoice = (req,res,next) => {
    const orderId = req.params.orderId;
    Order.findById(orderId)
    .then(order => {
        if(!order) {
            return next(new Error('Order not found'));
        }
        if(order.user.userId.toString()!==req.user._id.toString()) {
            return next(new Error('You are unauthorized to access this.'));
            //res.redirect('/');
        }
        const invoiceName = 'invoice-'+orderId+'.pdf';
        const invoicePath = path.join('data','invoices',invoiceName);
        const pdfDoc = new PDFDocument();
        res.setHeader('Content-Type','application/pdf');
        res.setHeader('Content-Disposition','inline:filename="' +invoiceName +'"');
        pdfDoc.pipe(fs.createWriteStream(invoicePath));
        pdfDoc.pipe(res);
        pdfDoc.fontSize(26).text('Invoice',{
            underline:true
        });
        pdfDoc.text('-------------------------------------------');
        let totalPrice=0;
        order.products.forEach(prod => {
            totalPrice += (prod.product.price*prod.quantity);
            pdfDoc.fontSize(14).text(prod.product.title+' - '+prod.quantity+' X '+' Rs. '+prod.product.price);
        });
        pdfDoc.fontSize(18).text('Total price is Rs.'+totalPrice);
        pdfDoc.end();
        // fs.readFile(invoicePath, (err,data) => {
        //     if(err) 
        //     {
        //         next(err);
        //     }
        //     res.setHeader('Content-Type','application/pdf');
        //     res.setHeader('Content-Disposition','inline:filename="' +invoiceName +'"');
        //     //res.download(invoicePath);
        //     res.send(data);
        // });

        // const file = fs.createReadStream(invoicePath);
        // file.pipe(res);
    })
    .catch(err => {
        next(err);
    })
};

exports.getAPI = (req,res,next) => {
    fetch('http://localhost:8080/feed/posts')
      .then(res => {
        if (res.status !== 200 && res.status !== 201) {
          throw new Error("Can't get the API data");
        }
        return res.json();
      })
      .then(resData => {
          console.log(resData.posts);
        res.render('shop/api',{
            path:'/api',
            pageTitle:'API',
            posts:resData.posts
        });
            
      })
      .catch(err => { 
          console.log(err);
      });
}