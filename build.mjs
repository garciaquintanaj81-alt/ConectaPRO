// Script de compilación de ConectaPRO
// - Empaqueta React + TypeScript con esbuild
// - Genera el CSS de Tailwind v4 a partir de las clases usadas en /src
// - Copia /public e index.html a /docs (carpeta que publica GitHub Pages)
//
// Uso:  npm run build        (compila una vez)
//       npm run dev          (compila y sirve en http://localhost:5173 con recarga al guardar)

import { build, context } from "esbuild";
import { compile } from "tailwindcss";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(ROOT, "docs");
const watch = process.argv.includes("--watch");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]
  );
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const d of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, d.name), t = path.join(dst, d.name);
    d.isDirectory() ? copyDir(s, t) : fs.copyFileSync(s, t);
  }
}

async function buildCss() {
  const twDir = path.dirname(require.resolve("tailwindcss/package.json"));
  const input = fs.readFileSync(path.join(ROOT, "src/styles.css"), "utf8");
  const compiler = await compile(input, {
    base: ROOT,
    async loadStylesheet(id, base) {
      let file;
      if (id === "tailwindcss") file = path.join(twDir, "index.css");
      else if (id.startsWith("tailwindcss/")) file = path.join(twDir, id.slice(12));
      else file = path.resolve(base, id);
      return { path: file, base: path.dirname(file), content: fs.readFileSync(file, "utf8") };
    },
  });
  // Candidatos: todas las "palabras" de los archivos fuente que podrían ser clases
  const candidates = new Set();
  for (const f of walk(path.join(ROOT, "src")).filter((f) => /\.(tsx?|css)$/.test(f))) {
    for (const m of fs.readFileSync(f, "utf8").matchAll(/[^\s"'`{}()<>;,]+/g)) candidates.add(m[0]);
  }
  fs.writeFileSync(path.join(OUT, "assets/app.css"), compiler.build([...candidates]));
}

function copyStatic() {
  fs.mkdirSync(path.join(OUT, "assets"), { recursive: true });
  copyDir(path.join(ROOT, "public"), OUT);
  fs.copyFileSync(path.join(ROOT, "index.html"), path.join(OUT, "index.html"));
  fs.copyFileSync(path.join(ROOT, "index.html"), path.join(OUT, "404.html"));
  fs.writeFileSync(path.join(OUT, ".nojekyll"), "");
}

const esbuildOptions = {
  entryPoints: [path.join(ROOT, "src/main.tsx")],
  bundle: true,
  minify: !watch,
  sourcemap: watch,
  outfile: path.join(OUT, "assets/app.js"),
  jsx: "automatic",
  target: ["es2020"],
  loader: { ".tsx": "tsx", ".ts": "ts" },
  define: { "process.env.NODE_ENV": watch ? '"development"' : '"production"' },
  logLevel: "info",
};

copyStatic();
if (watch) {
  const ctx = await context({
    ...esbuildOptions,
    plugins: [{ name: "css", setup(b) { b.onEnd(() => buildCss().catch(console.error)); } }],
  });
  await ctx.watch();
  const { port } = await ctx.serve({ servedir: OUT, port: 5173 });
  console.log(`\n  ConectaPRO corriendo en http://localhost:${port}\n`);
} else {
  await build(esbuildOptions);
  await buildCss();
  console.log("Compilación lista en /docs");
}
