const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const commentSchema = new Schema({
    comment:{
      type:String,
      required:true
    },
    blogId:{
      type:Schema.Types.ObjectId,
      ref:'Blog',
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
    },
    date:{
      type:String,
      required:true
    }
});

module.exports = mongoose.model('Comment',commentSchema);
