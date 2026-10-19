const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.join(__dirname, "cfo-news-collector-index.ts"),
  "utf8",
);

assert.match(
  source,
  /const editorialStatuses = new Set\(\["review", "validated", "published", "ignored"\]\)/,
  "editorial decisions must be identified explicitly",
);
assert.match(
  source,
  /\.select\("id,thumbnail_url,status,category,metadata,decision_note,published_at"\)/,
  "the refresh must read the fields it is required to preserve",
);
assert.match(
  source,
  /if \(preserveEditorial\) delete payload\.category/,
  "a collector refresh must not overwrite a reviewed category",
);
assert.match(
  source,
  /payload\.metadata = \{[\s\S]*existing\.metadata[\s\S]*payload\.metadata/,
  "collector metadata must be merged with supervised metadata",
);
assert.match(
  source,
  /if \(existing\.published_at && !payload\.published_at\) delete payload\.published_at/,
  "a missing source timestamp must not erase an existing publication date",
);

console.log("news collector editorial-preservation checks passed");
