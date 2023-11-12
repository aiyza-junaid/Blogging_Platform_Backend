
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const RatingSchema = new Schema({
    user_id:{
        type: mongoose.Schema.Types.ObjectId, ref:'User',
    },
    post_id:{
        type: mongoose.Schema.Types.ObjectId, ref:'BlogPost',
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
    },
    CreationDate: {
        type: Date,
        default: Date.now,
    },
})

const RatingModel = mongoose.model('Rating', RatingSchema);

module.exports = RatingModel;

