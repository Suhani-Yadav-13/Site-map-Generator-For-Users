module.exports = {
  ensureAuth: (req, res, next) => {
    if (req.session && req.session.userId) {
      next();
    } else {
      req.flash('error', 'Please login first');
      res.redirect('/login');
    }
  }
};


