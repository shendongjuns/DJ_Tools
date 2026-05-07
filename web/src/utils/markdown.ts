export interface MarkdownHeading {
  key: string;
  id: string;
  text: string;
  level: number;
  index: number;
  parentKey?: string;
  ancestorKeys: string[];
  children: MarkdownHeading[];
}

export function headingId(text: string, _level: number, index: number) {
  const slug = text.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w一-龥-]/g, '');
  return slug ? `${slug}-${index}` : `heading-${index}`;
}

function cleanHeadingText(text: string) {
  return text
    .replace(/#+\s*$/, '')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/[*_~`]/g, '')
    .trim();
}

export function extractMarkdownHeadings(markdown: string): MarkdownHeading[] {
  const roots: MarkdownHeading[] = [];
  const stack: MarkdownHeading[] = [];
  let inFence = false;
  let headingIndex = 0;

  for (const line of markdown.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      continue;
    }

    const match = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (!match) {
      continue;
    }

    const level = match[1].length;
    const text = cleanHeadingText(match[2]);
    if (!text) {
      continue;
    }

    const index = headingIndex;
    const key = `${level}-${index}`;
    const parent = [...stack].reverse().find((item) => item.level < level);
    const ancestorKeys = parent ? [...parent.ancestorKeys, parent.key] : [];
    const heading: MarkdownHeading = {
      key,
      id: headingId(text, level, index),
      text,
      level,
      index,
      parentKey: parent?.key,
      ancestorKeys,
      children: [],
    };

    while (stack.length && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    const currentParent = stack[stack.length - 1];
    if (currentParent) {
      heading.parentKey = currentParent.key;
      heading.ancestorKeys = [...currentParent.ancestorKeys, currentParent.key];
      currentParent.children.push(heading);
    } else {
      roots.push(heading);
    }

    stack.push(heading);
    headingIndex += 1;
  }

  return roots;
}
