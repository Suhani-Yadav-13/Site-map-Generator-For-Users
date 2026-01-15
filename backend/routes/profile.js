// routes/profile.js
const express = require("express");
const router = express.Router();
const { ensureAuth } = require("../middlewares/auth");
const User = require("../models/User");

// Profile page
router.get("/profile", ensureAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).lean();

    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/login");
    }

    res.render("profile", {
      user,
      currentPage: "profile"
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
