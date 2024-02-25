const express = require('express');
const router = express.Router();
const User = require('../models/users');
const multer= require('multer');
const fs = require('fs');

// upload img

var storage= multer.diskStorage({
    destination : function(req,file,cb){
        cb(null, './uploads');
    },
    filename : function(req,file,cb){
        cb(null,file.fieldname+"_"+Date.now()+"_"+file.originalname)
    },
})

var upload  = multer({
    storage: storage,
}).single('image')

// insert user into db route
// console.log("::upload",upload)
router.post('/add', upload, (req,res) => {
    // console.log("::response",res);
    const user = new User({
        name: req.body.name,
        email:req.body.email,
        phone: req.body.phone,
        image: req.file.filename
    })
    user.save().then(()=>{
        req.session.message = {
            type:"success",
            message :"User added successfully!"
        }
        res.redirect('/');
    }).catch((err)=>{
        res.json({message: err.message, type: 'danger'})
    })
    // user.save((err)=>{
    //     if(err){
    //         res.json({message: err.message, type: 'danger'})
    //     }
    //     else{
    //         req.session.message = {
    //             type:"success",
    //             message :"User added successfully!"
    //         }
    //         res.redirect('/');
    //     }
    // });
});

//get all users route
router.get('/', (req,res) =>{
    User.find({}).then((users) => {
        // console.log("::users",users);
        res.render('index',{
            title: 'Home Page',
            users: users,
        })
      }).catch((err) => {
        res.json({message: err.message, type: 'danger'})
      });

});

router.get('/add', (req,res) =>{
    res.render('add_users',{title: 'Add Users'})
});

//edit an user routes

router.get('/edit/:id', (req,res) =>{
    let id = req.params.id;
    
    User.findById(id).then((user) => {
        // console.log("::user info to update",user)
        if(user==null)
        {
            res.redirect('/');
        }
        else{
            res.render('edit_users',{
                title: 'Edit User',
                user: user,
            })

        }
      }).catch((err) => {
        res.redirect('/');
      });

});

// update user routes
router.post('/update/:id', upload , (req,res) =>{
    let id = req.params.id;
    let new_img ='';

    if(req.file){
        new_img = req.file.filename;
        try{
            fs.unlinkSync("/uploads"+req.body.old_image)
        }
        catch(err){
            console.error(err);
        }
    }
    else{
        new_img =req.body.old_image;
    }
    
    User.findByIdAndUpdate(id, {name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        image: new_img,})
    .then((updatedUser)=>{
        console.log("::updated user",updatedUser);
        req.session.message = {
            type:"success",
            message :"User Updated successfully!"
        }
        res.redirect('/');
    }).catch((err)=>{
        res.json({message: err.message, type: 'danger'})
    }) 
})


//Delete user route
router.get('/delete/:id', (req,res) =>{
    let id = req.params.id;
    
    if(res.image !='')
    {
        try{
            fs.unlinkSync('/uploads/'+res.image)
        }
        catch(err){
            console.log(err)
        }
    }
    User.findByIdAndRemove(id)
    .then(()=>{
            req.session.message = {
            type:"success",
            message :"User deleted successfully!"
        }
        res.redirect('/');
    }).catch((err)=>{
        res.json({message: err.message, type: 'danger'})
    }) 

});


//search user

router.get('/search/:name', async (req,res) => {
    try {
        const findname = req.params.name;
        const objs = await User.find({name:{ $regex:'.*'+findname+'.*'} });
        console.log("::objs",objs);
        res.json(objs);
    } catch (error) {
        res.json({message: error});        
    }
})
module.exports = router;
