import type { GenericEntry } from "@/types";

// Sort by date
export const sortByDate = (entries: GenericEntry[]): GenericEntry[] => {
  const sortedEntries = entries.sort(
    (a, b) => {
      const dateA = a.data.date ? new Date(a.data.date).valueOf() : 0;
      const dateB = b.data.date ? new Date(b.data.date).valueOf() : 0;
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
    const complexityA = a.data.complexity || 1;
    const complexityB = b.data.complexity || 1;
    return complexityB - complexityA;
  });
  return sortedEntries;
};
