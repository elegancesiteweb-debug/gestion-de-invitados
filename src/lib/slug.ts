import { nanoid } from "nanoid";

const DIACRITICS_REGEX = /[̀-ͯ]/g;

export function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `${base || "evento"}-${nanoid(6)}`;
}
