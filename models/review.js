const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const reviewSchema = new Schema({
  rating:{
      type:String,
      required:true
  },  
  summary:{
    type:String,
    required:true
  },
  text:{
    type:String,
    required:true
  },
  productId:{
    type:Schema.Types.ObjectId,
    ref:'Product',
    required:true
  },
  userId:{
    type:Schema.Types.ObjectId,
    ref:'User',
    required:true
  },
  userName:{
    type:String,
    required:true
  }
});

module.exports = mongoose.model('Review',reviewSchema);
