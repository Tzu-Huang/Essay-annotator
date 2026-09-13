import test from "node:test";
import assert from "node:assert/strict";

import { SITE_URL, seoTagsFor, upsertTag, applySeo } from "./seo.logic.mjs";

/**
 * Minimal stand-in for document. There is no jsdom in this project, and the
 * only DOM surface these helpers touch is head.querySelector/createElement/
 * appendChild plus setAttribute.
 */
function fakeDocument() {
  const children = [];

  const makeEl = (tag) => ({
    tag,
    attrs: {},
    setAttribute(name, value) {
      this.attrs[name] = value;
    },
    getAttribute(name) {
      return this.attrs[name];
    },
  });

  return {
    title: "",
    head: {
      children,
      querySelector(selector) {
        // only supports the `tag[key="id"]` form these helpers emit
        const match = selector.match(/^(\w+)\[([\w-]+)="([^"]+)"\]$/);
        if (!match) throw new Error(`unsupported selector: ${selector}`);
        const [, tag, key, id] = match;
        return children.find((el) => el.tag === tag && el.attrs[key] === id) ?? null;
      },
      appendChild(el) {
        children.push(el);
      },
    },
    createElement: makeEl,
  };
}

test("seoTagsFor builds canonical from the site origin and path", () => {
  const tags = seoTagsFor({ path: "/faqs" });
  const canonical = tags.find((t) => t.id === "canonical");

  assert.equal(canonical.tag, "link");
  assert.equal(canonical.value, `${SITE_URL}/faqs`);
});

test("seoTagsFor mirrors description into og:description", () => {
  const tags = seoTagsFor({ description: "Search 200 real essays." });
  const values = tags.filter((t) => t.attr === "content").map((t) => t.value);

  assert.deepEqual(values, ["Search 200 real essays.", "Search 200 real essays."]);
});

test("seoTagsFor omits tags for fields that were not supplied", () => {
  assert.deepEqual(seoTagsFor({}), []);
  assert.deepEqual(seoTagsFor(), []);
});

test("upsertTag creates a tag that is not present yet", () => {
  const doc = fakeDocument();

  upsertTag(doc, { tag: "meta", key: "name", id: "description", attr: "content", value: "first" });

  assert.equal(doc.head.children.length, 1);
  assert.equal(doc.head.children[0].getAttribute("content"), "first");
});

test("upsertTag updates in place rather than appending a duplicate", () => {
  const doc = fakeDocument();
  const descriptor = { tag: "meta", key: "name", id: "description", attr: "content", value: "first" };

  upsertTag(doc, descriptor);
  upsertTag(doc, { ...descriptor, value: "second" });

  assert.equal(doc.head.children.length, 1);
  assert.equal(doc.head.children[0].getAttribute("content"), "second");
});

test("applySeo sets the document title", () => {
  const doc = fakeDocument();

  applySeo(doc, { title: "Essay Annotator" });

  assert.equal(doc.title, "Essay Annotator");
});

test("applySeo leaves the title alone when a route supplies none", () => {
  const doc = fakeDocument();
  doc.title = "Essay Annotator";

  applySeo(doc, { description: "no title here" });

  assert.equal(doc.title, "Essay Annotator");
});

test("navigating between routes replaces metadata instead of stacking it", () => {
  const doc = fakeDocument();

  applySeo(doc, { title: "Essay page", description: "An essay.", path: "/essay/5" });
  applySeo(doc, { title: "Essay Annotator", description: "The homepage.", path: "/" });

  assert.equal(doc.title, "Essay Annotator");
  assert.equal(doc.head.children.length, 4); // og:title, description, og:description, canonical
  assert.equal(doc.head.querySelector('link[rel="canonical"]').getAttribute("href"), `${SITE_URL}/`);
  assert.equal(
    doc.head.querySelector('meta[name="description"]').getAttribute("content"),
    "The homepage.",
  );
});
