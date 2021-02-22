const jwt = require("jsonwebtoken")

function auth(req,res,next){
try {
    const token = req.cookies.token

    if(!token){
        res.status(401).json({errmsg:"unauthorized"});    
    }
    const verified = jwt.verify(token,process.env.JWT_SECRET); 
    req.user = verified.user;

    console.log(verified);
    next();
} catch (error) {
    res.status(401).json({errmsg:"unauthorized"});
}
}

module.exports = auth