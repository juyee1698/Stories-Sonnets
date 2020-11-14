const mongoose = require('mongoose');
const { strike } = require('../util/path');

const Schema = mongoose.Schema;

const genreSchema = new Schema({
    tag:{
        type:String,
        required:true
    }
});

module.exports=mongoose.model('Genre',genreSchema);