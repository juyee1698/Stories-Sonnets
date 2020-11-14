const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const messageSchema = new Schema({
    comment:{
      type:String,
      required:true
    },
    discussionId:{
      type:Schema.Types.ObjectId,
      ref:'Discussion',
      required:true
    },
    userId:{
      type:Schema.Types.ObjectId,
      ref:'User',
      required:true
    },
    date:{
      type:Date,
      required:true
    }
});

module.exports = mongoose.model('Message',messageSchema);
