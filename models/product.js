const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema({
    title:{
      type:String,
      required:true
    },
    price:{
      type:Number,
      required:true
    },
    description:{
      type:String,
      required:true
    },
    imageUrl:{
      type:String,
      required:true
    },
    tags:{
      type:Array,
      required:true
    },
    authorId:{
      type:Schema.Types.ObjectId,
      ref:'Author',
      required:true
    },
    views:{
      type:Number
    }
});

productSchema.methods.incrementView = function() {
    if(!this.views) {
      this.views = 1;
    }
    else {
      this.views=+this.views+1;
    }
    return this.save();
}

module.exports = mongoose.model('Product',productSchema);

