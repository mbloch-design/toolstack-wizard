/**
 * Génère public/icons.svg, le sprite qui porte tous les tracés d'icônes du site.
 *
 * Les 13 545 pages prérendues recopiaient chacune ~25 Ko de tracés SVG alors
 * que l'ensemble du jeu tient en 142 formes. Elles sont extraites une fois ici ;
 * `adaptIcon()` dans src/lib/icons.tsx s'y réfère par `<use href="/icons.svg#tt-nom">`.
 *
 * Le `<symbol>` ne porte que son `viewBox` et ses tracés. `fill`, `stroke-width`
 * et la couleur restent sur le `<svg>` appelant : ce sont des propriétés
 * héritées, elles traversent la référence, et les garder côté appelant préserve
 * la possibilité de passer un `strokeWidth` sur un cas particulier.
 *
 * Le script échoue plutôt que de produire un sprite partiel : une icône absente
 * ne se verrait qu'en production, sous la forme d'un vide silencieux.
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as Iconoir from "iconoir-react";
import { ICON_SOURCES } from "./icon-sprite-map.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ICONS_MODULE = path.resolve(__dirname, "../src/lib/icons.tsx");
const SPRITE_DIR = path.resolve(__dirname, "../public/assets");
const URL_MODULE = path.resolve(__dirname, "../src/lib/icon-sprite-url.ts");

/** `AlertTriangle` -> `tt-alert-triangle`. Doit rester identique côté icons.tsx. */
export function spriteId(exportName) {
  return (
    "tt-" +
    exportName
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
      .toLowerCase()
  );
}

/** Relit les identifiants réellement demandés par le module client. */
export function readDeclaredIds(source) {
  const declared = new Map();
  const re = /export const (\w+) = adaptIcon\("([^"]+)"\)/g;
  let m;
  while ((m = re.exec(source))) declared.set(m[1], m[2]);
  return declared;
}

/**
 * Compare ce que le module client demande et ce que la table sait produire.
 * Les deux fichiers étant modifiés à la main lors d'un ajout d'icône, c'est
 * exactement là qu'un oubli se glisse.
 */
export function reconcile(declared, sources) {
  const problems = [];
  for (const [name, id] of declared) {
    if (!sources[name]) problems.push(`${name} est utilisé dans icons.tsx mais absent de icon-sprite-map.mjs`);
    else if (id !== spriteId(name)) problems.push(`${name} demande "${id}" au lieu de "${spriteId(name)}"`);
  }
  for (const name of Object.keys(sources)) {
    if (!declared.has(name)) problems.push(`${name} est dans icon-sprite-map.mjs mais n'est plus exporté par icons.tsx`);
  }
  return problems;
}

function extractBody(markup, name) {
  const open = markup.indexOf(">");
  if (!markup.startsWith("<svg") || open === -1) {
    throw new Error(`Iconoir.${name} n'a pas produit de <svg> exploitable.`);
  }
  const body = markup.slice(open + 1, markup.lastIndexOf("</svg>"));
  if (!body.trim()) throw new Error(`Iconoir.${name} a produit un tracé vide.`);
  return body;
}

function main() {
  const declared = readDeclaredIds(fs.readFileSync(ICONS_MODULE, "utf-8"));
  if (declared.size === 0) {
    throw new Error("Aucune icône lue dans src/lib/icons.tsx : la forme du fichier a changé.");
  }

  const problems = reconcile(declared, ICON_SOURCES);
  if (problems.length > 0) {
    throw new Error("Le sprite et le module d'icônes ont divergé :\n  - " + problems.join("\n  - "));
  }

  // Plusieurs noms ToolTrim pointent vers la même icône Iconoir (Briefcase et
  // BriefcaseBusiness, par exemple). On garde un symbole par forme et on relie
  // les autres par un alias, qui ne coûte qu'une ligne.
  const canonicalByBody = new Map();
  const symbols = [];

  for (const [name, id] of declared) {
    const iconoirName = ICON_SOURCES[name];
    const Component = Iconoir[iconoirName];
    if (!Component) throw new Error(`Iconoir.${iconoirName} n'existe pas (icône ${name}).`);

    const body = extractBody(renderToStaticMarkup(React.createElement(Component)), iconoirName);
    const canonical = canonicalByBody.get(body);
    if (canonical) {
      symbols.push(`<symbol id="${id}" viewBox="0 0 24 24"><use href="#${canonical}"/></symbol>`);
    } else {
      canonicalByBody.set(body, id);
      symbols.push(`<symbol id="${id}" viewBox="0 0 24 24">${body}</symbol>`);
    }
  }

  const sprite = `<svg xmlns="http://www.w3.org/2000/svg">${symbols.join("")}</svg>\n`;

  // Le nom porte l'empreinte du contenu, et le fichier atterrit dans /assets,
  // que vercel.json sert déjà en `immutable`. Sans cette empreinte, un visiteur
  // gardant en cache un sprite périmé verrait un vide à la place d'une icône
  // ajoutée depuis. Les anciennes empreintes sont retirées pour qu'elles ne
  // s'accumulent pas dans le dépôt et dans chaque déploiement.
  const hash = crypto.createHash("sha256").update(sprite).digest("hex").slice(0, 8);
  const fileName = `icons.${hash}.svg`;
  fs.mkdirSync(SPRITE_DIR, { recursive: true });
  for (const stale of fs.readdirSync(SPRITE_DIR)) {
    if (/^icons\.[0-9a-f]{8}\.svg$/.test(stale) && stale !== fileName) {
      fs.unlinkSync(path.join(SPRITE_DIR, stale));
    }
  }
  fs.writeFileSync(path.join(SPRITE_DIR, fileName), sprite, "utf-8");

  fs.writeFileSync(
    URL_MODULE,
    "// Généré par scripts/gen-icon-sprite.mjs. Ne pas modifier à la main.\n" +
      "// Le fichier est commité : le module d'icônes en dépend, donc `tsc` et le\n" +
      "// serveur de dev doivent pouvoir le résoudre sans avoir lancé le build.\n" +
      `export const ICON_SPRITE_URL = "/assets/${fileName}";\n`,
    "utf-8",
  );

  console.log(
    `✓ Sprite : ${declared.size} icônes, ${canonicalByBody.size} formes distinctes, ` +
      `${(sprite.length / 1024).toFixed(1)} Ko -> public/assets/${fileName}`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
