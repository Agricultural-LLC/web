import type { MarkdownHeading } from "astro";
import type { HeadingHierarchy } from "@/types/index";

// Create headings for table of contents
export function createHeadingHierarchy(
  headings: MarkdownHeading[],
): HeadingHierarchy[] {
  const topLevelHeadings: HeadingHierarchy[] = [];

  headings.forEach((heading) => {
    const h: HeadingHierarchy = {
      ...heading,
      subheadings: [],
    };

    if (h.depth >= 2) {
      topLevelHeadings.push(h);
    } else {
      let parent = topLevelHeadings[topLevelHeadings.length - 1];
      if (parent) {
        parent.subheadings.push(h);
      }
    }
  });

  return topLevelHeadings;
}
