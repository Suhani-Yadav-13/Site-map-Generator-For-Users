const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// ===================== SIGNUP =====================
router.get('/signup', (req, res) => {
  res.render('auth/signup', {
    errorMessage: req.flash('error'),
    successMessage: req.flash('success'),
    oldInput: req.flash('oldInput')[0] || {}
  });
});

router.post('/signup', async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.toLowerCase().trim();
    const password = req.body.password?.trim(); // ✅ trim password

    if (!name || !email || !password) {
      req.flash('error', 'All fields are required');
      req.flash('oldInput', { name, email });
      return res.redirect('/signup');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash('error', 'Email already registered. Please login.');
      req.flash('oldInput', { name, email });
      return res.redirect('/signup');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    req.session.userId = user._id;
    req.session.userName = user.name;

    req.flash('success', 'Signup successful! Welcome!');
    res.redirect('/dashboard');

  } catch (err) {
    console.error('SIGNUP ERROR 👉', err);
    req.flash('error', 'Signup failed. Please try again.');
    req.flash('oldInput', { name: req.body.name, email: req.body.email });
    res.redirect('/signup');
  }
});

// ===================== LOGIN =====================
router.get('/login', (req, res) => {
  res.render('auth/login', {
    errorMessage: req.flash('error'),
    successMessage: req.flash('success'),
    oldInput: req.flash('oldInput')[0] || {}
  });
});

router.post('/login', async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const password = req.body.password?.trim();

    if (!email || !password) {
      req.flash('error', 'Email and password are required');
      req.flash('oldInput', { email });
      return res.redirect('/login');
    }

    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'Invalid email or password');
      req.flash('oldInput', { email });
      return res.redirect('/login');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.flash('error', 'Invalid email or password');
      req.flash('oldInput', { email });
      return res.redirect('/login');
    }

    req.session.userId = user._id;
    req.session.userName = user.name;

    req.flash('success', `Welcome, ${user.name}!`);
    res.redirect('/dashboard');

  } catch (err) {
    console.error('LOGIN ERROR 👉', err);
    req.flash('error', 'Login failed. Please try again.');
    res.redirect('/login');
  }
});

// ===================== LOGOUT =====================
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
