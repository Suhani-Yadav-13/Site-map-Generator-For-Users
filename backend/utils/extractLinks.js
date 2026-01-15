const cheerio = require('cheerio');
const url = require('url');

function extractLinks(html, baseUrl = '') {
  const $ = cheerio.load(html);
  let links = [];

  $('a').each((i, el) => {
    let href = $(el).attr('href');

    if (href && !href.startsWith('mailto:') && !href.startsWith('javascript:')) {
      // If relative link → resolve it against baseUrl
      if (baseUrl && !href.startsWith('http')) {
        href = url.resolve(baseUrl, href);
      }
      links.push(href);
    }
  });

  // Remove duplicates
  links = Array.from(new Set(links));
  return links;
}

module.exports = extractLinks;
