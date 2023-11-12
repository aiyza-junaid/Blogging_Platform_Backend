
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const blogPostSchema = new Schema({
    user_id:{
        type: mongoose.Schema.Types.ObjectId, ref:'User',
    },
    title: String,
    author: {
        type: String
    },
    CreationDate: {
        type: Date,
        default: Date.now,
    },
    blogContent: String,
    avgRating: Number,
    comments: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Comment',
        },
      ],
    
    ratings: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Rating',
        },
      ],
      isDisabled: {
        type: Boolean, 
        default: false
    }, 
    categories: [
        {
            type:String
        }
    ]
    
})

const blogPostModel = mongoose.model('BlogPost', blogPostSchema);

module.exports = blogPostModel;

