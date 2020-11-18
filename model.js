const mongoose=require('mongoose');

const userschema=new mongoose.Schema({
    username:{
        type : String,
        required : true, 
    },
    password:{
        type : String,
        required : true, 
    },
    messages:[{
        type: String,
    }],
    urls:[{
        type:String,
    }]
})

module.exports=new mongoose.model('user',userschema);