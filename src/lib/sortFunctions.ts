import type { GenericEntry } from "@/types";

// Sort by date
export const sortByDate = (entries: GenericEntry[]): GenericEntry[] => {
  const sortedEntries = entries.sort(
    (a, b) => {
      const dateA = 'date' in a.data && a.data.date ? new Date(a.data.date).valueOf() : 0;
      const dateB = 'date' in b.data && b.data.date ? new Date(b.data.date).valueOf() : 0;
      return dateB - dateA;
    }
  );
  return sortedEntries;
};

// Sort by title
export const sortByTitle = (entries: GenericEntry[]): GenericEntry[] => {
  const sortedEntries = entries.sort((a, b) =>
    a.data.title.localeCompare(b.data.title)
  );
  return sortedEntries;
};

// Sort by complexity
export const sortByComplexity = (entries: GenericEntry[]): GenericEntry[] => {
  const sortedEntries = entries.sort((a, b) => {
    const complexityA = 'complexity' in a.data ? a.data.complexity : 1;
    const complexityB = 'complexity' in b.data ? b.data.complexity : 1;
    return complexityB - complexityA;
  });
  return sortedEntries;
};
