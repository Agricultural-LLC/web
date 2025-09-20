import type { BlogEntry } from '@/types';

interface SimilarItem {
  id: string;
  data: {
    categories: string[];
    tags: string[];
  };
}

/**
 * Find similar items based on categories and tags
 * @param currentItem - The current item to find similar items for
 * @param allItems - All available items to search through
 * @param id - The ID of the current item to exclude from results
 * @returns Array of similar items sorted by relevance
 */
const findSimilarItems = (
  currentItem: SimilarItem,
  allItems: SimilarItem[],
  id: string
): SimilarItem[] => {
  const categories = currentItem.data?.categories || [];
  const tags = currentItem.data?.tags || [];

  // Filter by categories
  const filterByCategories = allItems.filter((item) =>
    categories.some((category) => item.data.categories?.includes(category))
  );

  // Filter by tags
  const filterByTags = allItems.filter((item) =>
    tags.some((tag) => item.data.tags?.includes(tag))
  );

  // Merge filtered items
  const mergedItems = [...filterByCategories, ...filterByTags];

  // Remove self from list
  const filteredByID = mergedItems.filter((item) => item.id !== id);

  // Count instances of each item
  const itemCount = filteredByID.reduce((accumulator, item) => {
    accumulator[item.id] = (accumulator[item.id] || 0) + 1;
    return accumulator;
  }, {} as Record<string, number>);

  // Sort items by number of instances
  const sortedItems = filteredByID.sort(
    (a, b) => itemCount[b.id] - itemCount[a.id]
  );

  // Remove items with fewer than 2 instances
  const filteredItems = sortedItems.filter(
    (item) => itemCount[item.id] > 1
  );

  // Remove duplicates
  const uniqueItems = [
    ...new Set(filteredItems.map((item) => item.id)),
  ].map((itemId) => {
    return filteredItems.find((item) => item.id === itemId);
  }).filter(Boolean) as SimilarItem[];

  return uniqueItems;
};

export default findSimilarItems;
