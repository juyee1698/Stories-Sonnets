const mongoose = require('mongoose');
const { strike } = require('../util/path');

const Schema = mongoose.Schema;

const eventSchema = new Schema({
    title:{
        type:String,
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
    link:{
        type:String,
        required:true
    },
    date:{
        type:Date,
        required:true
    },
    location:{
        type:String,
        required:true
    },
    startTime:{
        type:String,
        required:true
    },
    endTime:{
        type:String,
        required:true
    },
    speakerName1:{
        type:String
    },
    
    speakerName2:{
        type:String
    },  
    speakerName3:{
        type:String
    },
    authorId:{
        type:Schema.Types.ObjectId,
        ref:'Author',
        required:true
    },
    category:{
        type:String,
        required:true
    }
    
});

module.exports=mongoose.model('Event',eventSchema);