import { useEffect } from "react";

import { applySeo } from "./seo.logic.mjs";

/**
 * Set the document title and head metadata for the current route.
 *
 * Googlebot picks these up on its render pass, and react-router does not
 * reset them between routes, so each page calls this with its own values.
 *
 * Usage:
 *   useSeo({
 *     title: "Essay Annotator — ...",
 *     description: "...",
 *     path: "/",
 *   });
 */
export function useSeo({ title, description, path }) {
  useEffect(() => {
    applySeo(document, { title, description, path });
  }, [title, description, path]);
}

export default useSeo;
