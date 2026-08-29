#!/usr/bin/env node

import { readFileSync } from "node:fs";

const frenchPosts = JSON.parse(readFileSync("src/data/posts-fr.json", "utf8"));
const englishPosts = JSON.parse(readFileSync("src/data/posts-en.json", "utf8"));
const parityStartDate = "2026-05-01";
const latestDate = (posts) => posts.reduce((latest, post) => (
  String(post.date || "") > latest ? String(post.date) : latest
), "");

const latestFrenchDate = latestDate(frenchPosts);
const latestEnglishDate = latestDate(englishPosts);
const englishSlugs = new Set(englishPosts.map((post) => post.slug));
const frenchOnly = frenchPosts.filter((post) => (
  String(post.date || "") >= parityStartDate && !englishSlugs.has(post.slug)
));

console.log(`Guides FR: ${frenchPosts.length}, latest ${latestFrenchDate || "unknown"}`);
console.log(`Guides EN: ${englishPosts.length}, latest ${latestEnglishDate || "unknown"}`);

if (frenchOnly.length > 0) {
  console.warn(`${frenchOnly.length} guide(s) are available only in French:`);
  frenchOnly
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
    .forEach((post) => console.warn(`  ${post.date}  ${post.slug}`));
  if (process.argv.includes("--strict")) process.exitCode = 1;
} else {
  console.log("Guide locale parity: OK");
}
