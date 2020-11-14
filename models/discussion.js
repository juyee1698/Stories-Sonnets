const mongoose = require('mongoose');
const { strike } = require('../util/path');

const Schema = mongoose.Schema;

const discussionSchema = new Schema({
    title:{
        type:String,
        required:true
    },
    comment:{
        type:String,
        required:true
    },
    date:{
        type:Date,
        required:true
    },
    bookId:{
        type:Schema.Types.ObjectId,
        ref:'Product'
    },
    bookExists:{
        type:Boolean,
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

discussionSchema.methods.incrementView = function() {
    if(!this.views) {
      this.views = 1;
    }
    else {
      this.views=+this.views+1;
    }
    return this.save();
  }

module.exports=mongoose.model('Discussion',discussionSchema);