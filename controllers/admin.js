const Product = require('../models/product');
const { validationResult } = require('express-validator');
const fileHelper = require('../util/file');
const Author = require('../models/author');
const Genre = require('../models/genre');
const Event = require('../models/event');
//const author = require('../models/author');

exports.getGenres = (req,res,next) => {
  res.status(200).json(
      ['New Adult','Young Adult','Mystery','Thriller','Romance','Dystopia','Contemporary','Classic',
      'History','Feminism','AutoBiography','Philosophy','Nonfiction','Self Help','Fantasy','Paranormal','Fiction']
  );
};

exports.getProfile = (req, res, next) => {
    let allProducts;
    let message = req.flash('error');
      //console.log(message);
      if(message.length>0) {
          message=message[0];
      }
      else {
          message=null;
      }
    Author.find({_id:req.author._id})
    .then(author => {
      Product.find({authorId:req.author._id})
      //.populate('userId')
        .then(products => {
          allProducts = products;
          let randomTags = products.map(product => {
            return product.tags.map(tag => {
                return tag.toString();
            });
          });
          let finalTags = Array.prototype.concat.apply([], randomTags);
          return Genre.find({tag:{$in:finalTags}});
        })
        .then(tags => {
          res.render('admin/profile', {
            prods: allProducts,
            tags:tags,
            author:author[0],
            pageTitle: 'Your Profile',
            path: '/admin/profile',
            errorMessage:message
          });
        })
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });

};

exports.postProfile = (req,res,next) => {
  const authorId = req.body.authorId;
  const email = req.body.email;
  const name = req.body.name;
  const image = req.file;
  const desc = req.body.description;

  
  const errors = validationResult(req);
  //console.log(errors);
  if(!errors.isEmpty()) {
    return res.status(422).render('admin/profile', {
      pageTitle: 'Your Profile',
      path: '/admin/profile',
      author: {
        name:name,
        email:email,
        description:desc,
        _id : authorId
      },
      errorMessage:errors.array()[0].msg,
      validationErrors:errors.array()
    });
  }

  Author.findById(authorId)
  .then(author => {
    //console.log(author);
    author.name = name;
    author.email = email;
    author.description = desc;
    if(image) {
      if(author.imageUrl!=='images/author/profile.png') {
        fileHelper.deleteFile(author.imageUrl);
      }
      author.imageUrl = image.path;
    }

    return author.save()
    .then(result => {
      console.log('UPDATED AUTHOR!');
      res.redirect('/admin/profile');
    });
  })
  .catch(err => {
    console.log(err);
    const error = new Error('A server error has occurred. We are working on fixing this. Please try again in a while. Sorry for your inconvenience.');
    error.httpStatusCode = 500;
    return next(error);
  });
}

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError:false,
    errorMessage:null,
    validationErrors:[]
  });
};

exports.getAddEvent = (req,res,next) => {
  res.render('admin/edit-event', {
    pageTitle: 'Create Event',
    path: '/admin/add-event',
    editing: false,
    hasError:false,
    errorMessage:null,
    validationErrors:[]
  });
};

exports.postAddEvent = (req,res,next) => {
    const title = req.body.title;
    const image = req.file;
    const link = req.body.link;
    const location = req.body.location;
    const date = req.body.date;
    const startTime = req.body.starttime;
    const endTime = req.body.endtime;
    const speakerName1 = req.body.name1;
    const speakerName2 = req.body.name2;
    const speakerName3 = req.body.name3;
    const description = req.body.description;
    if(!image) {
      return res.status(422).render('admin/edit-event', {
        pageTitle: 'Create Event',
        path: '/admin/add-event',
        editing: false,
        hasError:true,
        event: {
          title:title,
          link:link,
          location:location,
          date:date,
          startTime:startTime,
          endTime:endTime,
          description:description,
          speakerName1:speakerName1,
          speakerName2:speakerName2,
          speakerName3:speakerName3
        },
        errorMessage:'Attached file is not an image!',
        validationErrors:[]
      });
    }
    
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(422).render('admin/edit-event', {
        pageTitle: 'Create Event',
        path: '/admin/add-event',
        editing: false,
        hasError:true,
        event: {
          title:title,
          link:link,
          location:location,
          date:date,
          startTime:startTime,
          endTime:endTime,
          description:description,
          speakerName1:speakerName1,
          speakerName2:speakerName2,
          speakerName3:speakerName3
        },
        errorMessage:errors.array()[0].msg,
        validationErrors:errors.array()
      });
    }
    const imageUrl = image.path;
    //console.log(imageUrl);
    //const imageUrl = image.path.replace('/', '/books');

    const event = new Event({title:title, description:description, imageUrl:imageUrl,link:link,date:date,startTime:startTime,endTime:endTime,
      speakerName1:speakerName1,speakerName2:speakerName2,speakerName3:speakerName3,location:location,authorId:req.author});
    event
      .save()
      .then(result => {
        // console.log(result);
        console.log('Created Event');
        res.redirect('/admin/events');
      })
      .catch(err => {
        const error = new Error('A server error has occurred. We are working on fixing this. Please try again in a while. Sorry for your inconvenience.');
        error.httpStatusCode = 500;
        return next(error);
      });

}

exports.getEvents = (req,res,next) => {
    Event.find({authorId:req.author})
    .then(events => {
      res.render('admin/events', {
        pageTitle: 'Events',
        path: '/admin/events',
        events:events
      });
    })
    .catch(err => {
      const error = new Error('A server error has occurred. We are working on fixing this. Please try again in a while. Sorry for your inconvenience.');
      error.httpStatusCode = 500;
      return next(error);
    });
      
}

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  const tags = req.body.tags;
  const tagArray = tags.split(",");
  if(!image) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError:true,
      product: {
        title:title,
        price:price,
        description:description
      },
      errorMessage:'Attached file is not an image!',
      validationErrors:[]
    });
  }
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError:true,
      product: {
        title:title,
        price:price,
        tags:tags,
        description:description
      },
      errorMessage:errors.array()[0].msg,
      validationErrors:errors.array()
    });
  }

  const imageUrl = image.path;
  //console.log(imageUrl);
  //const imageUrl = image.path.replace('/', '/books');

  const product = new Product({title:title, price:price, description:description, imageUrl:imageUrl,tags:Array.from(tagArray),authorId:req.author});
  product
    .save()
    .then(result => {
      // console.log(result);
      console.log('Created Product');
      res.redirect('/admin/products');
    })
    .catch(err => {
      const error = new Error('A server error has occurred. We are working on fixing this. Please try again in a while. Sorry for your inconvenience.');
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/admin/products');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    // Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/admin/products');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
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

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file;
  const tags = req.body.tags;
  const updatedDesc = req.body.description;

  const errors = validationResult(req);
  //console.log(errors);
  if(!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: true,
      hasError:true,
      product: {
        title:updatedTitle,
        price:updatedPrice,
        tags:tags,
        description:updatedDesc,
        _id : prodId
      },
      errorMessage:errors.array()[0].msg,
      validationErrors:errors.array()
    });
  }

  Product.findById(prodId)
  .then(product => {
    if(product.authorId.toString()!==req.author._id.toString()) {
      return res.redirect('/');
    }
    product.title = updatedTitle;
    product.price = updatedPrice;
    product.tags = tags.split(',');
    product.description = updatedDesc;
    if(image) {
      fileHelper.deleteFile(product.imageUrl);
      product.imageUrl = image.path;
    }

    return product.save()
    .then(result => {
      console.log('UPDATED PRODUCT!');
      res.redirect('/admin/products');
    });
  })
  .catch(err => {
    const error = new Error('A server error has occurred. We are working on fixing this. Please try again in a while. Sorry for your inconvenience.');
    error.httpStatusCode = 500;
    return next(error);
  });
};

exports.getProducts = (req, res, next) => {
  Product.find({authorId:req.author._id})
  //.populate('userId')
    .then(products => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Your Products',
        path: '/admin/products',
        //isLoggedIn:req.session.author.isLoggedIn
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.deleteProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
    .then(product => {
      if(!product) {
        throw new Error('Product not found');
      }
      fileHelper.deleteFile(product.imageUrl);
      return Product.deleteOne({_id:prodId,authorId:req.author._id});
    })
    .then(() => {
      console.log('DESTROYED PRODUCT');
      res.status(200).json({
        message:'Success'
      });
    })
    .catch(err => {
      
      res.status(500).json({
        message:'Deleting product failed'
      });
    });
};