const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Sitemap = require('../models/Sitemap');
const { ensureAuth } = require('../middlewares/auth');

const upload = multer({ dest: 'uploads/' });

// Extract links from HTML
function extractLinks(html) {
  const regex = /href="(.*?)"/g;
  let matches, links = [];
  while ((matches = regex.exec(html)) !== null) {
    links.push(matches[1]);
  }
  return links;
}

// Convert flat links into tree structure
function buildTree(links) {
  const root = { name: "Home", children: [] };

  links.forEach(link => {
    const parts = link.split('/').filter(Boolean);
    let current = root;

    parts.forEach(part => {
      let child = current.children.find(c => c.name === part);
      if (!child) {
        child = { name: part, children: [] };
        current.children.push(child);
      }
      current = child;
    });
  });

  return root;
}

// ---------------- Routes ----------------

// GET /generate
router.get('/generate', ensureAuth, (req, res) => {
  const data = req.session.generationResult || null;
  delete req.session.generationResult;

  res.render('generate', {
    sitemap: data?.sitemap || null,
    links: data?.links || [],
    projectName: data?.projectName || '',
    xml: data?.xml || '',
    rawhtml: data?.rawhtml || '',
    treeData: data?.treeData || null,
    currentPage: 'generate'
  });
});

// POST /generate
router.post('/generate', ensureAuth, upload.single('htmlfile'), async (req, res) => {
  try {
    let html = '';
    const projectName = req.body.projectName || 'Untitled Sitemap';
    const rawhtml = req.body.rawhtml || '';

    if (req.file) {
      html = fs.readFileSync(req.file.path, 'utf-8');
      fs.unlinkSync(req.file.path);
    } else if (rawhtml) {
      html = rawhtml;
    }

    const links = extractLinks(html);

    // Generate XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    links.forEach(link => {
      xml += `  <url>\n    <loc>${link}</loc>\n  </url>\n`;
    });
    xml += `</urlset>`;

    // Build tree
    const treeData = buildTree(links);

    // Save files
    const fileDir = path.join(__dirname, '../public/sitemaps');
    if (!fs.existsSync(fileDir)) fs.mkdirSync(fileDir, { recursive: true });
    const filenameBase = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    fs.writeFileSync(path.join(fileDir, `${filenameBase}.xml`), xml);
    fs.writeFileSync(path.join(fileDir, `${filenameBase}.txt`), links.join('\n'));

    // Save in DB
    const sitemap = await Sitemap.create({
      userId: req.session.userId,
      projectName,
      links,
      dateGenerated: new Date(),
      downloadPath: `sitemaps/${filenameBase}`
    });

    req.session.generationResult = { sitemap, links, projectName, xml, rawhtml, treeData };

    res.redirect('/generate');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to generate sitemap');
    res.redirect('/generate');
  }
});

// GET /history
router.get('/history', ensureAuth, async (req, res) => {
  try {
    const sitemaps = await Sitemap.find({ userId: req.session.userId }).sort({ dateGenerated: -1 });
    res.render('history', { sitemaps, currentPage: 'history' });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to fetch history');
    res.redirect('/generate');
  }
});

// DELETE /history/:id
router.delete('/history/:id', ensureAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const sitemap = await Sitemap.findByIdAndDelete(id);
    if (sitemap) {
      const fileDir = path.join(__dirname, '../public/sitemaps');
      fs.unlinkSync(path.join(fileDir, `${sitemap.downloadPath.split('/')[1]}.txt`));
      fs.unlinkSync(path.join(fileDir, `${sitemap.downloadPath.split('/')[1]}.xml`));
    }
    req.flash('success', 'Sitemap deleted successfully!');
    res.redirect('/history');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to delete sitemap');
    res.redirect('/history');
  }
});

// ✅ GET /sitemap/visual/:id
router.get('/sitemap/visual/:id', ensureAuth, async (req, res) => {
  try {
    const sitemap = await Sitemap.findById(req.params.id);
    if (!sitemap) {
      req.flash('error', 'Sitemap not found');
      return res.redirect('/history');
    }

    const treeData = buildTree(sitemap.links);

    res.render('visual', {
      sitemap,
      treeData: JSON.stringify(treeData), // Pass JSON to frontend
      currentPage: 'visual'
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to load visual sitemap');
    res.redirect('/history');
  }
});

module.exports = router;
