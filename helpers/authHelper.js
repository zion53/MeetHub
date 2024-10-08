module.exports={
    requireLogin: (req,res,next)=>{
        if(req.isAuthenticated()){
            return next();
        }else{
            res.redirect('/');
        }
    },
    ensureGuest: (req,res,next)=>{
        if(req.isAuthenticated()){
            res.redirect('/home');
        }else{
            return next();
        }
    }
};