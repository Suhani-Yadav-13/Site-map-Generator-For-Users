const mongoose = require('mongoose');

const sitemapSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  projectName: { type: String, required: true },
  links: [String],
  dateGenerated: { type: Date, default: Date.now },
  downloadPath: String
});

module.exports = mongoose.model('Sitemap', sitemapSchema);
