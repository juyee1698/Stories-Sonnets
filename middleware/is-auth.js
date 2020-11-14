exports.isUserAuth = (req,res,next) => {
    if(!req.session.userIsLoggedIn) {
        if(req.session.authorIsLoggedIn) {
            return res.redirect('/');
        }
        return res.redirect('/login');
    }
    next();
}

exports.isAuthorAuth = (req,res,next) => {
    if(!req.session.authorIsLoggedIn) {
        if(req.session.userIsLoggedIn) {
            return res.redirect('/');
        }
        return res.redirect('/seller-login');
    }
    next();
}
