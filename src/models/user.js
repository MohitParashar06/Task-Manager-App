const mongoose = require('mongoose');
const bcrypt = require('bcryptjs')
const validator = require('validator')
const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema({
    name:{
        type : String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        unique:true,
        required:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email is not valid')
            }
        },
        trim:true,
        lowercase:true
    },
    age:{
        type : Number,
        default:0,
        validate(value){
            if(value < 0){
                throw new Error('Age must be a positive number')
            }
        }
    },
    password:{
        type:String,
        required:true,
        validate(value){
            if(!validator.isLength(value,6)){
                throw new Error("Password should have at least 6 characters")
            }
            if(validator.matches(value,'password')){
                throw new Error('password cannot contain word password')
            }
        },
        trim:true,
    },
    tokens:[{
        token:{
            type:String,
            required:true
        }
    }],
    avatar:{
        type:Buffer
    }
}, {
    timestamps:true
})

userSchema.virtual('tasks', {
    ref: 'Tasks',
    localField: '_id',
    foreignField: 'owner'
})

userSchema.methods.toJSON = function (){
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

userSchema.methods.generateAuthtoken = async function(){
    const user = this;

    const token = jwt.sign({ _id : user._id.toString()},process.env.JWT_SCERET)

    user.tokens = user.tokens.concat({token})

    await user.save()

    return token;
}

userSchema.statics.findByCredentials = async (email,password)=>{
    const user = await User.findOne({email})
    // console.log(user);
    if(!user){
        throw new Error('unable to login');
    }

    const isMatch = await bcrypt.compare(password,user.password)

    if(!isMatch){
        throw new Error('unable to login')
    }
    return user
}

userSchema.pre('save',async function(next){
    const user = this;

    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password,8)
    }
 
    next();
})

const User = mongoose.model('user',userSchema)

module.exports = User