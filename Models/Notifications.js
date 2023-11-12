
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
    user_id:{
        type: mongoose.Schema.Types.ObjectId, ref:'User',
    },
    post_id:{
        type: mongoose.Schema.Types.ObjectId, ref:'BlogPost',
    },
    type: { 
        type: String, enum: ['follow', 'comment', 'unfollow'] 
    },
    CreationDate: {
        type: Date,
        default: Date.now,
    },
    isRead: {
        type: Boolean, default: false 
    },
})

const NotificationModel = mongoose.model('Notification', NotificationSchema);

module.exports = NotificationModel;

