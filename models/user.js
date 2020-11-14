const mongoose = require('mongoose');
const { strike } = require('../util/path');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    resetToken:String,
    resetTokenExpiration:Date,
    cart:{
        items:[
            {
                productId:{type:Schema.Types.ObjectId,ref:'Product',required:true},
                quantity:{type:Number,required:true}
            }
        ]
    },
    session:{
        viewedBooks:[
            {
                productId:{type:Schema.Types.ObjectId,ref:'Product'}
            }
        ]
    },
    notifications:{
        comments:[
            {
                blogId:{type:Schema.Types.ObjectId,ref:'Blog'},
                commentorId:{type:Schema.Types.ObjectId,ref:'User'}
            }
        ],
        blogs:[
            {
                blogId:{type:Schema.Types.ObjectId,ref:'Blog'},
                bloggerId:{type:Schema.Types.ObjectId,ref:'User'}
            }
        ]
    },
    follow:{
        followers:[
            {
                followerId:{type:Schema.Types.ObjectId,ref:'User'}
            }
        ]
    },
    phoneno:{
        type:Number
    },
    postal:{
        type:Number
    },
    imageUrl:{
        type:String
    },
    address:{
        type:String
    },
    city:{
        type:String
    },
    country:{
        type:String
    },
    description:{
        type:String
    }
});

userSchema.methods.addToCart = function(product) {
    if (!this.cart.items) {
        this.cart = { items: [] };
    }
    const cartProductIndex = this.cart.items.findIndex(cp => {
        return cp.productId.toString() === product._id.toString();
    });
    let newQuantity = 1;
    const updatedCartItems = [...this.cart.items];

    if (cartProductIndex >= 0) {
        newQuantity = this.cart.items[cartProductIndex].quantity + 1;
        updatedCartItems[cartProductIndex].quantity = newQuantity;
    } else {
        updatedCartItems.push({
            productId: product._id, //mongoose automatically wraps it into object
            quantity: newQuantity
        });
    }
    const updatedCart = {
        items: updatedCartItems
    };
    this.cart=updatedCart;
    return this.save();
}
userSchema.methods.updateCartQuantity = function(product,quantity) {
    const cartProductIndex = this.cart.items.findIndex(cp => {
        return cp.productId.toString() === product._id.toString();
    });
    const updatedCartItems = [...this.cart.items];
    updatedCartItems[cartProductIndex].quantity = quantity;

    const updatedCart = {
        items: updatedCartItems
    };
    this.cart=updatedCart;
    return this.save();
}

userSchema.methods.deleteItemFromCart = function(productId) {
    const updatedCartItems = this.cart.items.find(item => {
        return item.productId.toString() !== productId.toString();
    });

    this.cart.items=updatedCartItems;
    return this.save();

}

userSchema.methods.clearCart = function() {
    this.cart = {items:[]};
    this.save();
}

userSchema.methods.addSession = function(product) {
    if (!this.session.viewedBooks) {
        this.session = { viewedBooks: [] };
    }
    const productIndex = this.session.viewedBooks.findIndex(sv => {
        return sv.productId.toString() === product._id.toString();
    });

    const updatedSessionBooks = [...this.session.viewedBooks];

    if (productIndex < 0) {
        if(updatedSessionBooks.length==5) {
            updatedSessionBooks.shift();
        }
        updatedSessionBooks.push({
            productId: product._id, //mongoose automatically wraps it into object
        });
    } 
    const updatedSession = {
        viewedBooks: updatedSessionBooks
    };
    this.session=updatedSession;
    return this.save();
}

userSchema.methods.deleteNotif = function(commentId) {
    const updatedComments = this.notifications.comments.find(comment => {
        return comment._id.toString() !== commentId.toString();
    });

    this.notifications.comments=updatedComments;
    return this.save();

}

userSchema.methods.deleteNotifBlog = function(blogId) {
    const updatedBlogs = this.notifications.blogs.find(blog => {
        return blog._id.toString() !== blogId.toString();
    });

    this.notifications.blogs=updatedBlogs;
    return this.save();

}

userSchema.methods.addFollow = function(fuser) {
    if (!this.follow) {
        this.follow = { followers: [] };
    }

    const userIndex = this.follow.followers.findIndex(follower => {
        return follower.followerId.toString() === this._id.toString();
    });

    const updatedFollowers = [...this.follow.followers]

    if(userIndex<0) {
        updatedFollowers.push({
            followerId:fuser._id
        });
    }

    const updatedFollow = {
        followers: updatedFollowers
    };
    this.follow = updatedFollow;
    return this.save();
}

userSchema.methods.removeFollow = function(fuser) {
    const updatedFollowers = this.follow.followers.find(follower => {
        return follower.followerId.toString() !== fuser._id.toString();
    });

    this.follow.followers=updatedFollowers;
    return this.save();

}

userSchema.methods.addCommentNotification = function(blog,commentor) {
    if (!this.notifications) {
        this.notifications = { comments: [],blogs:[] };
    }

    if(!this.notifications.blogs) {
        this.notifications.blogs = [];
    }

    if(!this.notifications.comments) {
        this.notifications.comments = [];
    }
    const notifBlogs = [...this.notifications.blogs];

    const updatedComments = [...this.notifications.comments]

    updatedComments.push({
        blogId: blog._id,
        commentorId: commentor._id
    });

    const updatedNotifications = {
        comments: updatedComments,
        blogs:notifBlogs
    };
    this.notifications = updatedNotifications;
    return this.save();
}

userSchema.methods.addBlogNotification = function(blog,blogger) {
    if(!this.notifications) {
        this.notifications = {comments:[],blogs:[]};
    }
    if(!this.notifications.comments) {
        this.notifications.comments = [];
    }
    if(!this.notifications.blogs) {
        this.notifications.blogs = [];
    }

    const notifComments = [...this.notifications.comments];

    const updatedBlogs = [...this.notifications.blogs];

    updatedBlogs.push({
        blogId:blog._id,
        bloggerId:blogger._id
    });
    
    const updatedNotifications = {
        comments: notifComments,
        blogs:updatedBlogs
    };

    this.notifications = updatedNotifications;
    return this.save()
}


module.exports=mongoose.model('User',userSchema);
