const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const imageRoot = path.join(root, 'images');
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

function encodedPath(value) {
  return value.split('/').map(encodeURIComponent).join('/');
}

async function main() {
  const sources = await walk(imageRoot, file =>
    path.extname(file).toLowerCase() === '.webp' && !file.toLowerCase().endsWith('-compressed.webp'));
  if (!sources.length) {
    console.log('No uncompressed WebP images remain. SVG and ICO files were not touched.');
    return;
  }

  const conversions = sources.map(source => {
    const relative = path.relative(imageRoot, source).split(path.sep).join('/');
    const target = source.slice(0, -5) + '-compressed.webp';
    const targetRelative = relative.slice(0, -5) + '-compressed.webp';
    return { source, relative, target, targetRelative, temporary: `${target}.tmp` };
  });

  try {
    let originalBytes = 0;
    let compressedBytes = 0;
    const concurrency = 3;
    const compress = async item => {
      const originalStat = await fs.stat(item.source);
      const originalMeta = await sharp(item.source, { animated: true }).metadata();
      await sharp(item.source, { animated: true })
        .rotate()
        .webp({ quality: 90, alphaQuality: 100, effort: 6, smartSubsample: true })
        .toFile(item.temporary);
      const compressedMeta = await sharp(item.temporary, { animated: true }).metadata();
      if (compressedMeta.width !== originalMeta.width || compressedMeta.height !== originalMeta.height || compressedMeta.pages !== originalMeta.pages) {
        throw new Error(`Validation failed for ${item.relative}: output dimensions do not match`);
      }
      const compressedStat = await fs.stat(item.temporary);
      if (!compressedStat.size) throw new Error(`Validation failed for ${item.relative}: empty output`);
      originalBytes += originalStat.size;
      compressedBytes += compressedStat.size;
    };

    for (let index = 0; index < conversions.length; index += concurrency) {
      await Promise.all(conversions.slice(index, index + concurrency).map(compress));
    }

    const textFiles = await walk(root, file => textExtensions.has(path.extname(file).toLowerCase()));
    const updatedContents = new Map();
    for (const file of textFiles) {
      let content = await fs.readFile(file, 'utf8');
      for (const item of conversions) {
        content = content
          .split(`images/${item.relative}`).join(`images/${item.targetRelative}`)
          .split(`images/${encodedPath(item.relative)}`).join(`images/${encodedPath(item.targetRelative)}`);
      }
      updatedContents.set(file, content);
    }

    for (const item of conversions) {
      await fs.rm(item.target, { force: true });
      await fs.rename(item.temporary, item.target);
    }
    for (const [file, content] of updatedContents) await fs.writeFile(file, content);

    const unresolved = [];
    for (const [file, content] of updatedContents) {
      for (const item of conversions) {
        if (content.includes(`images/${item.relative}`) || content.includes(`images/${encodedPath(item.relative)}`)) {
          unresolved.push(`${path.relative(root, file)} -> ${item.relative}`);
        }
      }
    }
    if (unresolved.length) throw new Error(`Unresolved image references:\n${unresolved.join('\n')}`);

    for (const item of conversions) await fs.rm(item.source);

    const saving = Math.max(0, Math.round((1 - compressedBytes / originalBytes) * 100));
    console.log(`Compressed and renamed ${conversions.length} WebP images.`);
    console.log(`Reduced ${(originalBytes / 1048576).toFixed(2)} MB to ${(compressedBytes / 1048576).toFixed(2)} MB (${saving}% smaller).`);
    console.log('Validated every output before removing originals. SVG and ICO files were not touched.');
  } catch (error) {
    await Promise.all(conversions.map(item => fs.rm(item.temporary, { force: true })));
    throw error;
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
