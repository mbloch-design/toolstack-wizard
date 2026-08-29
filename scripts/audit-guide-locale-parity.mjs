#!/usr/bin/env node

import { readFileSync } from "node:fs";

const frenchPosts = JSON.parse(readFileSync("src/data/posts-fr.json", "utf8"));
const englishPosts = JSON.parse(readFileSync("src/data/posts-en.json", "utf8"));
const latestDate = (posts) => posts.reduce((latest, post) => (
  String(post.date || "") > latest ? String(post.date) : latest
), "");

const latestFrenchDate = latestDate(frenchPosts);
const latestEnglishDate = latestDate(englishPosts);
const recentFrenchOnly = frenchPosts.filter((post) => String(post.date || "") > latestEnglishDate);

console.log(`Guides FR: ${frenchPosts.length}, latest ${latestFrenchDate || "unknown"}`);
console.log(`Guides EN: ${englishPosts.length}, latest ${latestEnglishDate || "unknown"}`);

if (recentFrenchOnly.length > 0) {
  console.warn(`${recentFrenchOnly.length} recent guide(s) are available only in French:`);
  recentFrenchOnly
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
    .forEach((post) => console.warn(`  ${post.date}  ${post.slug}`));
  if (process.argv.includes("--strict")) process.exitCode = 1;
} else {
  console.log("Guide locale parity: OK");
}
