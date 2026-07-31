#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const MAX_POSTS_PER_LANGUAGE = 12;
const fields = ["slug", "title", "date", "tags", "thumbnail"];

function readPosts(language) {
  const source = resolve(`src/data/posts-${language}.json`);
  const posts = JSON.parse(readFileSync(source, "utf8"));

  return posts
    .map((post) => Object.fromEntries(fields.map((field) => [field, post[field] ?? null])))
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
    .slice(0, MAX_POSTS_PER_LANGUAGE);
}

const output = {
  fr: readPosts("fr"),
  en: readPosts("en"),
};

const destination = resolve("src/data/home-posts-index.json");
writeFileSync(destination, `${JSON.stringify(output, null, 2)}\n`);
console.log(`home-posts-index.json written: ${output.fr.length} FR + ${output.en.length} EN`);
