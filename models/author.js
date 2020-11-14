const mongoose = require('mongoose');
const { strike } = require('../util/path');

const Schema = mongoose.Schema;

const authorSchema = new Schema({
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
    description:{
        type:String
    },
    imageUrl:{
        type:String
    },
    follow:{
        followers:[
            {
                followerId:{type:Schema.Types.ObjectId,ref:'User'}
            }
        ]
    }
});

authorSchema.methods.addFollow = function(fuser) {
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

authorSchema.methods.removeFollow = function(fuser) {
    const updatedFollowers = this.follow.followers.find(follower => {
        return follower.followerId.toString() !== fuser._id.toString();
    });

    this.follow.followers=updatedFollowers;
    return this.save();

}

module.exports=mongoose.model('Author',authorSchema);