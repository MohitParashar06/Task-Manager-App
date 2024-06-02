const express = require('express')
const auth = require('../middleware/auth')
const User = require('../models/user')
const Tasks = require('../models/tasks')
const multer = require('multer')
const sharp = require('sharp')

const router = new express.Router()


router.post('/users', async (req, res) => {

    const user = new User(req.body)

    try {
        await user.save();
        const token = await user.generateAuthtoken()
        res.status(201).send({user,token})
    } catch (e) {
        res.status(400).send(e);
    }
})

router.post('/users/login', async (req, res) => {
    try {

        const user = await User.findByCredentials(req.body.email, req.body.password);

        const token = await user.generateAuthtoken();

        res.send({user,token})
    } catch (e) {
        res.status(400).send()
    }
})

router.post('/users/logout', auth, async (req,res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token 
        })

        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.post('/users/logoutAll', auth, async(req,res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/users/me',auth, async (req, res) => {
    // console.log(req.user.schema.obj);
    res.send(req.user)

})

router.get('/users/:id', async (req, res) => {
    const _id = req.params.id;

    try {
        const user = await User.findById(_id);
        if (!user) {
            return res.status(404).send('user not found');
        }
        res.status(200).send(user)
    } catch (e) {
        res.status(500).send('server error')
    }

})


router.patch('/users/me', auth, async (req, res) => {

    const updates = Object.keys(req.body);

    const allowedupdate = ['name', 'email', 'password', 'age'];

    const isvalid = updates.every((update) => {
        return allowedupdate.includes(update)
    })

    if (!isvalid) {
        return res.status(400).send({ 'error': "invalid operation" });
    }

    try {



        // const user = await User.findById(req.user._id);



        updates.forEach((update) => {
            req.user[update] = req.body[update]
        })

        await req.user.save()
        res.send(req.user);
    } catch (e) {
        res.status(400).send(e);
    }
})

router.delete('/users/me',auth,  async (req, res) => {

    try {
        await User.findByIdAndDelete(req.user._id)
        await Tasks.deleteMany({owner : req.user._id})
        res.send(req.user)
    } catch (e) {
        res.status(500).send(e + ' some error');
    }
})


const uploads = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req,file,cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error('file is not of supported format'))
        }

        cb(undefined,true)
    }
})

router.post('/users/me/avatars', auth, uploads.single('avatars'), async (req,res) => {
    const buffer = await sharp(req.file.buffer).png().resize({width:250, height:250}).toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
},(error,req,res,next) => {
    res.status(400).send({error: error.message})
})

router.delete('/users/me/avatars', auth, async (req,res)=>{
    try {
        req.user.avatar = undefined;
        await req.user.save()
    res.send()
    } catch (e) {
        res.status(500).send()
    }
    
})

router.get('/users/:id/avatar', async (req,res)=>{
    try {
        const user = await User.findById(req.params.id)

        if(!user || !user.avatar){
            throw new Error()
        }

        res.set('Content-Type', 'image/png')

        res.send(user.avatar)
    } catch (e) {
        res.status(404).send()
    }
})


module.exports = router