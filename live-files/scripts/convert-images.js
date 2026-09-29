const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const imageRoot = path.join(root, 'images');
const sourceExtensions = new Set(['.png', '.jpg', '.jpeg']);
const textExtensions = new Set(['.html', '.css', '.js', '.json', '.md']);
const ignoredDirectories = new Set(['.git', 'node_modules', 'dist']);

async function walk(directory, filter) {
  const results = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...await walk(absolute, filter));
    else if (filter(absolute)) results.push(absolute);
  }
  return results;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function referencePattern(relativePath) {
  const encodedPath = relativePath.split('/').map(encodeURIComponent).join('/');
  const alternatives = [...new Set([relativePath, encodedPath])]
    .map(escapeRegExp)
    .join('|');
  return new RegExp(`((?:\\.\\./)*\\/?images\\/)(?:${alternatives})`, 'gi');
}

async function main() {
  const sources = await walk(imageRoot, file => sourceExtensions.has(path.extname(file).toLowerCase()));
  if (!sources.length) {
    console.log('No PNG, JPG, or JPEG files remain to convert. SVG files were not touched.');
    return;
  }

  const conversions = sources.map(source => {
    const relative = path.relative(imageRoot, source).split(path.sep).join('/');
    const target = source.slice(0, -path.extname(source).length) + '.webp';
    const targetRelative = relative.slice(0, -path.extname(relative).length) + '.webp';
    return { source, relative, target, targetRelative, temporary: `${target}.tmp` };
  });

  const targets = new Set();
  for (const item of conversions) {
    const key = item.target.toLowerCase();
    if (targets.has(key)) throw new Error(`Multiple source images map to ${item.targetRelative}`);
    targets.add(key);
  }

  try {
    const convert = async item => {
      const extension = path.extname(item.source).toLowerCase();
      const webpOptions = extension === '.png'
        ? { lossless: true, effort: 6 }
        : { quality: 92, effort: 6, smartSubsample: true };
      await sharp(item.source).rotate().webp(webpOptions).toFile(item.temporary);
    };
    const concurrency = 4;
    for (let index = 0; index < conversions.length; index += concurrency) {
      await Promise.all(conversions.slice(index, index + concurrency).map(convert));
    }

    for (const item of conversions) {
      await fs.rm(item.target, { force: true });
      await fs.rename(item.temporary, item.target);
    }

    const textFiles = await walk(root, file => textExtensions.has(path.extname(file).toLowerCase()));
    let changedFiles = 0;
    for (const file of textFiles) {
      let content = await fs.readFile(file, 'utf8');
      const original = content;
      for (const item of conversions) {
        content = content.replace(referencePattern(item.relative), `$1${item.targetRelative}`);
      }
      if (content !== original) {
        await fs.writeFile(file, content);
        changedFiles += 1;
      }
    }

    const unresolved = [];
    for (const file of textFiles) {
      const content = await fs.readFile(file, 'utf8');
      for (const item of conversions) {
        if (referencePattern(item.relative).test(content)) unresolved.push(`${path.relative(root, file)} -> ${item.relative}`);
      }
    }
    if (unresolved.length) throw new Error(`Unresolved image references:\n${unresolved.join('\n')}`);

    for (const item of conversions) await fs.rm(item.source);

    console.log(`Converted ${conversions.length} images to WebP.`);
    console.log(`Updated references in ${changedFiles} files.`);
    console.log('Removed the converted PNG/JPG/JPEG originals. SVG files were not touched.');
  } catch (error) {
    await Promise.all(conversions.map(item => fs.rm(item.temporary, { force: true })));
    throw error;
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
