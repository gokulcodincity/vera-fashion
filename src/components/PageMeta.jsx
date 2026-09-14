import { useEffect } from 'react';
import { store } from '../config/store';

const upsertMeta = (attribute, key, content) => {
  if (!content) return;
  let tag = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

/**
 * Per-route document title and meta description.
 * A small hand-rolled alternative to pulling in a head-management library.
 */
export default function PageMeta({ title, description }) {
  useEffect(() => {
    const fullTitle = title ? `${store.storeName} | ${title}` : `${store.storeName} | Premium Fashion`;
    document.title = fullTitle;
    upsertMeta('name', 'description', description);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', description);
  }, [title, description]);

  return null;
}
