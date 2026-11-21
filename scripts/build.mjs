import { readdir, readFile, rm, mkdir, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import CleanCSS from "clean-css";
import { minify as minifyHtml } from "html-minifier-terser";
import { minify as minifyJs } from "terser";

const root = process.cwd();
const output = path.join(root, "dist");
const allowedExtensions = new Set([
  ".html", ".js", ".json", ".xml", ".png", ".ico", ".svg", ".webmanifest"
]);
const cleanCss = new CleanCSS({});

async function copySiteFiles(source, destination) {
  await mkdir(destination, { recursive: true });
  const entries = await readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === "dist" || entry.name === "node_modules" || entry.name === ".git" ||
        entry.name === ".github" || entry.name === "scripts" ||
        entry.name === "package.json" || entry.name === "package-lock.json") continue;

    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      await copySiteFiles(sourcePath, destinationPath);
      continue;
    }

    if (entry.name === "CNAME" || entry.name === ".nojekyll" ||
        allowedExtensions.has(path.extname(entry.name).toLowerCase())) {
      await copyFile(sourcePath, destinationPath);
    }
  }
}

await rm(output, { recursive: true, force: true });
await copySiteFiles(root, output);

for (const name of await readdir(output)) {
  const filePath = path.join(output, name);
  if (name.endsWith(".js")) {
    const source = await readFile(filePath, "utf8");
    const result = await minifyJs(source, { compress: true, mangle: true, format: { comments: false } });
    if (!result.code) throw new Error(`JavaScript minification returned no output: ${name}`);
    await writeFile(filePath, result.code, "utf8");
  } else if (name.endsWith(".html")) {
    const source = await readFile(filePath, "utf8");
    const result = await minifyHtml(source, {
      collapseWhitespace: true,
      removeComments: true,
      minifyCSS: (css) => {
        const minified = cleanCss.minify(css);
        if (minified.errors.length) throw new Error(`CSS minification failed in ${name}: ${minified.errors.join("; ")}`);
        return minified.styles;
      },
      minifyJS: async (javascript) => {
        const minified = await minifyJs(javascript, {
          compress: true,
          mangle: true,
          format: { comments: false }
        });
        if (!minified.code && javascript.trim()) {
          throw new Error(`Inline JavaScript minification returned no output: ${name}`);
        }
        return minified.code || "";
      }
    });
    await writeFile(filePath, result, "utf8");
  }
}

await writeFile(path.join(output, ".nojekyll"), "", "utf8");
console.log(`Built minified site in ${output}`);
