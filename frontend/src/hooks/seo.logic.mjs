/**
 * SEO head metadata.
 *
 * Split out of the hook so it can run under `node --test`, following the
 * same pattern as AdminConsole.logic.mjs.
 *
 * react-router never reloads the document, so navigating /essay/5 -> /
 * leaves the previous route's title in the tab. Every route sets its own.
 */

export const SITE_URL = "https://essayannotator.com";

/**
 * The head tags a route needs, as plain data.
 *
 * Each descriptor identifies a tag by a key attribute (so repeated calls
 * update the existing tag instead of appending a duplicate).
 */
export function seoTagsFor({ title, description, path } = {}) {
  const tags = [];

  if (title) {
    tags.push({ tag: "meta", key: "property", id: "og:title", attr: "content", value: title });
  }

  if (description) {
    tags.push({ tag: "meta", key: "name", id: "description", attr: "content", value: description });
    tags.push({ tag: "meta", key: "property", id: "og:description", attr: "content", value: description });
  }

  if (path) {
    tags.push({ tag: "link", key: "rel", id: "canonical", attr: "href", value: SITE_URL + path });
  }

  return tags;
}

/**
 * Create the tag if it is missing, otherwise update the one already there.
 */
export function upsertTag(doc, { tag, key, id, attr, value }) {
  let el = doc.head.querySelector(`${tag}[${key}="${id}"]`);

  if (!el) {
    el = doc.createElement(tag);
    el.setAttribute(key, id);
    doc.head.appendChild(el);
  }

  el.setAttribute(attr, value);
  return el;
}

/**
 * Apply a route's title and head tags to the document.
 */
export function applySeo(doc, meta = {}) {
  if (meta.title) {
    doc.title = meta.title;
  }

  for (const descriptor of seoTagsFor(meta)) {
    upsertTag(doc, descriptor);
  }
}
