import { slug } from "github-slugger";
import { marked } from "marked";
import type { MarkdownHeading } from "@/types";

// Configure marked with GFM support and disable deprecated headerIds
marked.use({
  mangle: false,
  headerIds: false,
  gfm: true,
});

// slugify
export const slugify = (content: string) => {
  return slug(content);
};

// markdownify with custom header ID injection
export const markdownify = (content: string, div?: boolean) => {
  if (div) {
    let html = marked.parse(content);
    // Add IDs to headers manually for table of contents linking
    html = html.replace(/<h([1-6])>([^<]+)<\/h([1-6])>/g, (match, level, text, closingLevel) => {
      const headingSlug = slugify(text.trim());
      return `<h${level} id="${headingSlug}">${text}</h${closingLevel}>`;
    });
    return html;
  } else {
    return marked.parseInline(content);
  }
};

// hyphen to space, uppercase only first letter in each word
export const upperHumanize = (content: string) => {
  return content
    .toLowerCase()
    .replace(/-/g, " ")
    .replace(/(^\w{1})|(\s{1}\w{1})/g, (match) => match.toUpperCase());
};

// hyphen to space, lowercase all letters
export const lowerHumanize = (content: string) => {
  return content.toLowerCase().replace(/-/g, " ");
};

// plainify
export const plainify = (content: string) => {
  const parseMarkdown = marked.parse(content);
  const filterBrackets = parseMarkdown.replace(/<\/?[^>]+(>|$)/gm, "");
  const filterSpaces = filterBrackets.replace(/[\r\n]\s*[\r\n]/gm, "");
  const stripHTML = htmlEntityDecoder(filterSpaces);
  return stripHTML;
};

// 文章の自然な区切りを考慮したテキスト処理
export const smartTruncate = (content: string, maxLength: number = 200) => {
  const plainText = plainify(content);

  if (plainText.length <= maxLength) {
    return plainText;
  }

  // 句読点や文章の区切りを優先的に探す
  const truncatePoints = [
    /[。！？]/g, // 句点、感嘆符、疑問符
    /[、，]/g, // 読点、カンマ
    /[；：]/g, // セミコロン、コロン
    /[．]/g, // ピリオド
    /\s+/g, // 空白文字
  ];

  let truncated = plainText.substring(0, maxLength);

  // 句読点で終わるように調整
  for (const pattern of truncatePoints) {
    const matches = [...truncated.matchAll(pattern)];
    if (matches.length > 0) {
      // 最後の句読点の位置を探す
      const lastMatch = matches[matches.length - 1];
      const lastIndex = lastMatch.index!;

      // 句読点の後で切る（句読点を含む）
      if (lastIndex < maxLength - 10) {
        // 最低10文字は残す
        truncated = plainText.substring(0, lastIndex + 1);
        break;
      }
    }
  }

  // 単語の途中で切れている場合は、前の単語の終わりで切る
  if (truncated.length < plainText.length) {
    const lastSpaceIndex = truncated.lastIndexOf(" ");
    if (lastSpaceIndex > maxLength * 0.8) {
      // 80%以上残っている場合
      truncated = truncated.substring(0, lastSpaceIndex);
    }
  }

  return truncated.trim();
};

// extract headings from markdown for table of contents
export const extractHeadings = (markdown: string): MarkdownHeading[] => {
  const headings: MarkdownHeading[] = [];
  
  // Parse headings from markdown using regex
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  let match;
  
  while ((match = headingRegex.exec(markdown)) !== null) {
    const depth = match[1].length;
    const text = match[2].trim();
    const headingSlug = slugify(text);
    
    headings.push({
      depth,
      slug: headingSlug,
      text,
    });
  }
  
  return headings;
};

// strip entities for plainify
const htmlEntityDecoder = (htmlWithEntities: string) => {
  let entityList: { [key: string]: string } = {
    "&nbsp;": " ",
    "&lt;": "<",
    "&gt;": ">",
    "&amp;": "&",
    "&quot;": '"',
    "&#39;": "'",
  };
  let htmlWithoutEntities: string = htmlWithEntities.replace(
    /(&amp;|&lt;|&gt;|&quot;|&#39;)/g,
    (entity: string): string => {
      return entityList[entity];
    },
  );
  return htmlWithoutEntities;
};
