require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const path = require('path');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');

const app = express();

// ------------------ MongoDB connection ------------------
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// ------------------ EJS setup ------------------
app.engine('ejs', ejsMate);
app.set('views', path.join(__dirname, '../frontend/views'));
app.set('view engine', 'ejs');

// ------------------ Static files & middlewares ------------------
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.json());


app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI
  }),
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 2   // 2 hours
  }
}));


// process.on('SIGINT', async () => {
//   console.log('Server is shutting down. Clearing sessions...');
//   const client = await mongoose.connection.getClient();
//   const db = client.db();
//   const collection = db.collection('sessions');
//   await collection.deleteMany({});
//   console.log('All sessions cleared. Goodbye!');
//   process.exit(0);
// });

app.use(flash());

// // ------------------ Middleware to set globals ------------------
app.use(async (req, res, next) => {
  res.locals.currentPage = '';

  if (req.session.userId) {
    const User = require('./models/User');
    res.locals.user = await User.findById(req.session.userId);
  } else {
    res.locals.user = null;
  }

  next();
});


// ------------------ Routes ------------------
app.use('/', require('./routes/index'));
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/sitemap'));   // includes /sitemap/visual/:id
app.use('/', require('./routes/profile'));   // ✅ Profile route added

// // ------------------ Logout ------------------
// app.get('/logout', (req, res) => {
//   req.session.destroy(err => {
//     if (err) console.error(err);
//     res.redirect('/');
//   });
// });

// ------------------ Start server ------------------
module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`🚀 Server running on http://localhost:${port}`));
}
