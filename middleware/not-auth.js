module.exports = (req,res,next) => {
    if(req.session.userIsLoggedIn || req.session.authorIsLoggedIn) {
        return res.redirect('/');
    }
    next();
}