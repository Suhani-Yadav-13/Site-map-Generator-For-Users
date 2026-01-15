const express = require("express");
const { ensureAuth } = require("../middlewares/auth");
const User = require("../models/User");
const Sitemap = require("../models/Sitemap");
const router = express.Router();

// Home page (accessible to everyone)
router.get('/', async (req, res) => {
  const User = require('../models/User');
  let user = null;
  if (req.session.userId) {
    user = await User.findById(req.session.userId);
  }
  res.render('index', { 
    currentPage: 'home',
    user
  });
});

// Dashboard
router.get("/dashboard", ensureAuth, async (req, res) => {
  const user = await User.findById(req.session.userId);
  const lastSitemaps = await Sitemap.find({ userId: user._id })
    .sort({ dateGenerated: -1 })
    .limit(5);
  res.render("dashboard", {
    lastSitemaps,
    currentPage: "dashboard",
  }); // user is available via res.locals.user
});

module.exports = router;
