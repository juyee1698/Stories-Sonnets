const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const blogSchema = new Schema({
    title:{
      type:String,
      required:true
    },
    text:{
      type:String,
      required:true
    },
    quote:{
      type:String
    },
    imageUrl:{
      type:String,
      required:true
    },
    tags:{
      type:Array,
      required:true
    },
    date:{
      type:Date,
      required:true
    },
    dateString:{
      type:String,
      required:true
    },
    userId:{
      type:Schema.Types.ObjectId,
      ref:'User',
      required:true
    },
    views:{
      type:Number
    }
});

blogSchema.methods.incrementView = function() {
  if(!this.views) {
    this.views = 1;
  }
  else {
    this.views=+this.views+1;
  }
  return this.save();
}

module.exports = mongoose.model('Blog',blogSchema);