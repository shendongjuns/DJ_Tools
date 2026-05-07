import { Empty, Tree } from 'antd';
import type { DataNode, EventDataNode } from 'antd/es/tree';
import type { Key } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { extractMarkdownHeadings } from '../utils/markdown';
import type { MarkdownHeading } from '../utils/markdown';

interface MarkdownCatalogProps {
  content: string;
  scrollElementId: string;
  className?: string;
  offsetTop?: number;
  scrollOffset?: number;
}

function flattenHeadings(headings: MarkdownHeading[]): MarkdownHeading[] {
  return headings.flatMap((item) => [item, ...flattenHeadings(item.children)]);
}

function defaultExpandedKeys(headings: MarkdownHeading[]) {
  return flattenHeadings(headings).filter((item) => item.level <= 2 && item.children.length > 0).map((item) => item.key);
}

function descendants(item: MarkdownHeading): MarkdownHeading[] {
  return item.children.flatMap((child) => [child, ...descendants(child)]);
}

function keysToCollapseForLevel(item: MarkdownHeading, flatHeadings: MarkdownHeading[]) {
  const collapse = new Set<string>();
  flatHeadings.forEach((heading) => {
    if (heading.level === item.level && heading.key !== item.key) {
      collapse.add(heading.key);
      descendants(heading).forEach((child) => collapse.add(child.key));
    }
  });
  return collapse;
}

function isScrollable(element: HTMLElement) {
  return element.scrollHeight > element.clientHeight + 1;
}

function findHeadingElement(item: MarkdownHeading, scrollElement?: HTMLElement | null) {
  const root = scrollElement ?? document;
  const escapedId = CSS.escape(item.id);
  const direct = root.querySelector<HTMLElement>(`#${escapedId}, [id="${escapedId}"]`);
  if (direct) {
    return direct;
  }

  const candidates = Array.from(root.querySelectorAll<HTMLElement>(`h${item.level}`));
  return candidates.find((element) => element.textContent?.trim() === item.text) ?? null;
}

function toTreeData(headings: MarkdownHeading[]): DataNode[] {
  return headings.map((item) => ({
    key: item.key,
    title: item.text,
    className: `markdown-catalog-tree-node level-${item.level}`,
    children: item.children.length ? toTreeData(item.children) : undefined,
  }));
}

function stringKeys(keys: Key[]) {
  return keys.map(String);
}

export function MarkdownCatalog({ content, scrollElementId, className, offsetTop = 18, scrollOffset = 12 }: MarkdownCatalogProps) {
  const headings = useMemo(() => extractMarkdownHeadings(content), [content]);
  const flatHeadings = useMemo(() => flattenHeadings(headings), [headings]);
  const treeData = useMemo(() => toTreeData(headings), [headings]);
  const headingByKey = useMemo(() => new Map(flatHeadings.map((item) => [item.key, item])), [flatHeadings]);
  const [expandedKeys, setExpandedKeys] = useState<Key[]>(() => defaultExpandedKeys(headings));
  const [activeKey, setActiveKey] = useState<string>();
  const activeKeyRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const firstKey = flatHeadings[0]?.key;
    setExpandedKeys(defaultExpandedKeys(headings));
    setActiveKey(firstKey);
    activeKeyRef.current = firstKey;
  }, [headings, flatHeadings]);

  useEffect(() => {
    if (!flatHeadings.length) {
      return undefined;
    }

    const scrollElement = document.getElementById(scrollElementId);
    const scrollTarget = scrollElement && isScrollable(scrollElement) ? scrollElement : window;
    let frame = 0;

    function syncActiveHeading() {
      if (frame) {
        cancelAnimationFrame(frame);
      }

      frame = requestAnimationFrame(() => {
        const containerTop = scrollElement && isScrollable(scrollElement) ? scrollElement.getBoundingClientRect().top : 0;
        let current = flatHeadings[0];

        for (const item of flatHeadings) {
          const element = findHeadingElement(item, scrollElement);
          if (!element) {
            continue;
          }
          if (element.getBoundingClientRect().top - containerTop <= offsetTop) {
            current = item;
          } else {
            break;
          }
        }

        if (!current || activeKeyRef.current === current.key) {
          return;
        }

        activeKeyRef.current = current.key;
        setActiveKey(current.key);
        setExpandedKeys((previous) => {
          const next = new Set(stringKeys(previous));
          current.ancestorKeys.forEach((key) => next.add(key));
          return Array.from(next);
        });
      });
    }

    syncActiveHeading();
    scrollTarget.addEventListener('scroll', syncActiveHeading, { passive: true });
    window.addEventListener('resize', syncActiveHeading);
    return () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
      scrollTarget.removeEventListener('scroll', syncActiveHeading);
      window.removeEventListener('resize', syncActiveHeading);
    };
  }, [flatHeadings, offsetTop, scrollElementId]);

  function expandBranch(item: MarkdownHeading, expandSelf: boolean) {
    activeKeyRef.current = item.key;
    setActiveKey(item.key);
    setExpandedKeys((previous) => {
      const next = new Set(stringKeys(previous));
      keysToCollapseForLevel(item, flatHeadings).forEach((key) => next.delete(key));
      item.ancestorKeys.forEach((key) => next.add(key));
      if (expandSelf && item.children.length) {
        next.add(item.key);
      }
      return Array.from(next);
    });
  }

  function collapseBranch(item: MarkdownHeading) {
    setExpandedKeys((previous) => {
      const next = new Set(stringKeys(previous));
      next.delete(item.key);
      descendants(item).forEach((child) => next.delete(child.key));
      return Array.from(next);
    });
  }

  function jumpToHeading(item: MarkdownHeading) {
    const scrollElement = document.getElementById(scrollElementId);
    const headingElement = findHeadingElement(item, scrollElement);
    if (!headingElement) {
      return;
    }

    if (!scrollElement || !isScrollable(scrollElement)) {
      headingElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const scrollTop = headingElement.getBoundingClientRect().top - scrollElement.getBoundingClientRect().top + scrollElement.scrollTop - scrollOffset;
    scrollElement.scrollTo({ top: scrollTop, behavior: 'smooth' });
  }

  function handleSelect(selectedKeys: Key[]) {
    const key = String(selectedKeys[0] ?? '');
    const heading = headingByKey.get(key);
    if (!heading) {
      return;
    }
    expandBranch(heading, true);
    jumpToHeading(heading);
  }

  function handleExpand(nextExpandedKeys: Key[], info: { expanded: boolean; node: EventDataNode<DataNode> }) {
    const heading = headingByKey.get(String(info.node.key));
    if (!heading) {
      setExpandedKeys(nextExpandedKeys);
      return;
    }

    if (info.expanded) {
      expandBranch(heading, true);
    } else {
      collapseBranch(heading);
    }
  }

  if (!headings.length) {
    return <Empty className="markdown-catalog-empty" image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无目录" />;
  }

  return (
    <Tree
      className={`markdown-catalog ${className || ''}`}
      treeData={treeData}
      expandedKeys={expandedKeys}
      selectedKeys={activeKey ? [activeKey] : []}
      onSelect={handleSelect}
      onExpand={handleExpand}
      autoExpandParent={false}
      blockNode
      showLine
    />
  );
}
