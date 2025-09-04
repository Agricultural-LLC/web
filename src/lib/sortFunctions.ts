import type { GenericEntry } from "@/types";

// Sort by date
export const sortByDate = (entries: GenericEntry[]): GenericEntry[] => {
  const sortedEntries = entries.sort((a, b) => {
    const dateA =
      "date" in (a as any).data && (a as any).data.date
        ? new Date((a as any).data.date).valueOf()
        : 0;
    const dateB =
      "date" in (b as any).data && (b as any).data.date
        ? new Date((b as any).data.date).valueOf()
        : 0;
    return dateB - dateA;
  });
  return sortedEntries;
};

// Sort by title
export const sortByTitle = (entries: GenericEntry[]): GenericEntry[] => {
  const sortedEntries = entries.sort((a, b) =>
    (a as any).data.title.localeCompare((b as any).data.title),
  );
  return sortedEntries;
};

// Sort by complexity
export const sortByComplexity = (entries: GenericEntry[]): GenericEntry[] => {
  const sortedEntries = entries.sort((a, b) => {
    const complexityA =
      "complexity" in (a as any).data ? (a as any).data.complexity : 1;
    const complexityB =
      "complexity" in (b as any).data ? (b as any).data.complexity : 1;
    return complexityB - complexityA;
  });
  return sortedEntries;
};
