// The HTML contains a fresh inventory on every dev-page request and each build.
// No probes for missing files, and no fetch dependency in the standalone version.
export function cardArtUrl(card,manifest=globalThis.__GEOPOLITIX_ART__||{}) {
 return manifest[`${card.faction}/${card.key}`]||null;
}
