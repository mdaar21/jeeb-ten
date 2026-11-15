import data from '../data/catalog.json';
import type { Category } from './game';
export const catalog = data as Category[];
export function categoryById(id: number) { return catalog.find(c => c.id === id); }
export function publicCatalog() {
  return catalog.map(({ answers, distractors, ...category }) => category);
}
