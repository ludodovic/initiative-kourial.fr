const fs = require('fs');
const path = require('path');

const libraryRoot = path.join(process.cwd(), 'assets', 'library');
const imageExtension = /\.(png|gif)$/i;

function walk(directory) {
  const entries = fs
    .readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name, 'fr'));
  const relativePath = path.relative(libraryRoot, directory).replace(/\\/g, '/');

  const node = {
    name: relativePath ? path.basename(directory) : 'library',
    path: relativePath,
    folders: [],
    files: []
  };

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      node.folders.push(walk(fullPath));
      continue;
    }

    if (imageExtension.test(entry.name) && !entry.name.startsWith('PREV')) {
      node.files.push({
        name: entry.name,
        path: path.relative(libraryRoot, fullPath).replace(/\\/g, '/'),
        type: path.extname(entry.name).slice(1).toLowerCase()
      });
    }
  }

  return node;
}

if (!fs.existsSync(libraryRoot)) {
  fs.mkdirSync(libraryRoot, { recursive: true });
}

fs.writeFileSync(
  path.join(libraryRoot, 'library-manifest.json'),
  `${JSON.stringify(walk(libraryRoot), null, 2)}\n`
);
