import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const publicPages = {
  "/": {
    title: "College Essay Examples & Draft Comparison | Essay Annotator",
    description: "Explore college application essay examples and personal statements. Find essays similar to your draft and compare structure, storytelling, and reflection with Essay Annotator.",
  },
  "/faqs": {
    title: "College Essay Search & Feedback FAQs | Essay Annotator",
    description: "Learn how to find college essay examples, compare personal statement drafts, and use Essay Annotator's writing feedback. Answers about accounts and privacy.",
  },
};

function setMeta(attribute, key, content) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

export default function SearchMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    const path = pathname.replace(/\/+$/, "") || "/";
    const page = publicPages[path] ?? (/^\/essay\/[^/]+$/.test(path) ? { title: "College Essay Example | Essay Annotator", description: "Read a college application essay example and study its structure, storytelling, and reflection with Essay Annotator." } : undefined);
    const title = page?.title ?? "Essay Annotator";
    const description = page?.description ?? "Search essay examples and compare your writing with Essay Annotator.";
    document.title = title;
    setMeta("name", "description", description);
    // Public pages and essay examples remain indexable; account tools are not landing pages.
    setMeta("name", "robots", page ? "index, follow" : "noindex, follow");
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (page) {
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = `https://essayannotator.com${path}`;
      setMeta("property", "og:url", canonical.href);
    } else {
      canonical?.remove();
      document.head.querySelector('meta[property="og:url"]')?.remove();
    }
  }, [pathname]);

  return null;
}
