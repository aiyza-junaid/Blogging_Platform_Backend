
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: String,
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        unique: true
     },
    password: {
        type: String,
        required: true
     },
    role: { 
        type: String, 
        enum: ['user', 'admin'],
        default: 'user' 
    },
    followers:[{
        type: mongoose.Schema.Types.ObjectId, ref:'User',
    }],
    following:[{
        type: mongoose.Schema.Types.ObjectId, ref:'User',
    }],
    isDisabled: {
        type: Boolean, 
        default: false
    }
        

})

const Model = mongoose.model('User', userSchema);

module.exports = Model;
