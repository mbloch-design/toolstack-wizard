import fs from "node:fs";
import path from "node:path";

const assetsDir = path.resolve("dist/assets");
const legacyIndexAssets = ["index-BgnDl2XC.js"];

if (!fs.existsSync(assetsDir)) {
  process.exit(0);
}

const currentIndex = fs
  .readdirSync(assetsDir)
  .filter((file) => /^index-[A-Za-z0-9_-]+\.js$/.test(file))
  .sort((a, b) => {
    const aTime = fs.statSync(path.join(assetsDir, a)).mtimeMs;
    const bTime = fs.statSync(path.join(assetsDir, b)).mtimeMs;
    return bTime - aTime;
  })[0];

if (!currentIndex) {
  process.exit(0);
}

for (const legacyAsset of legacyIndexAssets) {
  fs.copyFileSync(path.join(assetsDir, currentIndex), path.join(assetsDir, legacyAsset));
}

console.log(`Legacy asset aliases: ${legacyIndexAssets.join(", ")} -> ${currentIndex}`);
