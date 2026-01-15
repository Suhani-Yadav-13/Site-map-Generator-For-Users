// main.js

/**
 * Render a tree structure for the given links array in a DOM container.
 * Assumes links is a flat array of hrefs like ['/','/about','/contact','/products/item1']
 */
function renderSitemapTree(links, containerId = "tree-root") {
  // Convert paths into a nested tree structure
  function buildTree(paths) {
    const root = {};
    for (const path of paths) {
      const parts = path.replace(/^\//, '').split('/'); // Remove leading slash and split
      let node = root;
      for (const part of parts) {
        if (!part) continue;
        node[part] = node[part] || {};
        node = node[part];
      }
    }
    return root;
  }

  function renderNode(node, label) {
    const li = document.createElement('li');
    if (label) li.innerHTML = `<span>${label}</span>`;
    const keys = Object.keys(node);
    if (keys.length) {
      const ul = document.createElement('ul');
      for (const k of keys) {
        ul.appendChild(renderNode(node[k], k));
      }
      li.appendChild(ul);
    }
    return li;
  }

  // Remove duplicates
  const uniqueLinks = [...new Set(links)];
  const tree = buildTree(uniqueLinks);

  const rootEl = document.getElementById(containerId);
  rootEl.innerHTML = '';
  const ul = document.createElement('ul');
  for (const top of Object.keys(tree)) {
    ul.appendChild(renderNode(tree[top], top));
  }
  rootEl.appendChild(ul);
}

// Optional usage for alerts, etc.
window.showAlert = function (msg, type = 'success') {
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = msg;
  document.body.prepend(alert);
  setTimeout(() => alert.remove(), 3000);
};
