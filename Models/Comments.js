
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    user_id:{
        type: mongoose.Schema.Types.ObjectId, ref:'User',
    },
    post_id:{
        type: mongoose.Schema.Types.ObjectId, ref:'BlogPost',
    },
    title: String,
    comment: {
        type: String
    },
    CreationDate: {
        type: Date,
        default: Date.now,
    },
    
})

const CommentModel = mongoose.model('Comment', CommentSchema);

module.exports = CommentModel;

