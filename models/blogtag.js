const mongoose = require('mongoose');
const { strike } = require('../util/path');

const Schema = mongoose.Schema;

const blogTagSchema = new Schema({
    tag:{
        type:String,
        required:true
    }
});

module.exports=mongoose.model('BlogTag',blogTagSchema);