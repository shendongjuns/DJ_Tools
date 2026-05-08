import { Empty, Tree } from 'antd';
import type { DataNode, EventDataNode } from 'antd/es/tree';
import type { Key, ReactNode } from 'react';
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

function scrollHeadingIntoView(headingElement: HTMLElement, fallback?: HTMLElement | null, scrollOffset = 12) {
  if (fallback) {
    const scrollTop = headingElement.getBoundingClientRect().top - fallback.getBoundingClientRect().top + fallback.scrollTop - scrollOffset;
    fallback.scrollTo({ top: Math.max(scrollTop, 0), behavior: 'smooth' });
    return;
  }

  headingElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function findHeadingElement(item: MarkdownHeading, scrollElement?: HTMLElement | null) {
  const root = scrollElement ?? document;
  const byId = document.getElementById(item.id);
  if (byId && (!scrollElement || scrollElement.contains(byId))) {
    return byId;
  }

  const byLine = root.querySelector<HTMLElement>(`h${item.level}[data-line="${item.line}"]`);
  if (byLine) {
    return byLine;
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
    heading: item,
  }));
}

function stringKeys(keys: Key[]) {
  return keys.map(String);
}

function scrollActiveCatalogItemIntoView(catalogElement: HTMLElement | null, key: string) {
  if (!catalogElement) {
    return;
  }

  const treeElement = catalogElement.querySelector<HTMLElement>('.markdown-catalog');
  const activeItem = catalogElement.querySelector<HTMLElement>(`[data-catalog-key="${CSS.escape(key)}"]`)?.closest<HTMLElement>('.ant-tree-treenode');
  if (!treeElement || !activeItem) {
    return;
  }

  const scrollTop = activeItem.getBoundingClientRect().top - treeElement.getBoundingClientRect().top + treeElement.scrollTop;
  const targetTop = Math.max(scrollTop - treeElement.clientHeight / 2 + activeItem.clientHeight / 2, 0);
  treeElement.scrollTo({ top: targetTop, behavior: 'smooth' });
}

export function MarkdownCatalog({ content, scrollElementId, className, offsetTop = 18, scrollOffset = 12 }: MarkdownCatalogProps) {
  const headings = useMemo(() => extractMarkdownHeadings(content), [content]);
  const flatHeadings = useMemo(() => flattenHeadings(headings), [headings]);
  const treeData = useMemo(() => toTreeData(headings), [headings]);
  const headingByKey = useMemo(() => new Map(flatHeadings.map((item) => [item.key, item])), [flatHeadings]);
  const [expandedKeys, setExpandedKeys] = useState<Key[]>(() => defaultExpandedKeys(headings));
  const [activeKey, setActiveKey] = useState<string>();
  const activeKeyRef = useRef<string | undefined>(undefined);
  const catalogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const firstKey = flatHeadings[0]?.key;
    setExpandedKeys(defaultExpandedKeys(headings));
    setActiveKey(firstKey);
    activeKeyRef.current = firstKey;
  }, [headings, flatHeadings]);

  useEffect(() => {
    if (!activeKey) {
      return;
    }

    window.requestAnimationFrame(() => scrollActiveCatalogItemIntoView(catalogRef.current, activeKey));
  }, [activeKey, expandedKeys]);

  useEffect(() => {
    if (!flatHeadings.length) {
      return undefined;
    }

    const scrollElement = document.getElementById(scrollElementId);
    const scrollTarget: HTMLElement | Window = scrollElement ?? window;
    let frame = 0;

    function syncActiveHeading() {
      if (frame) {
        cancelAnimationFrame(frame);
      }

      frame = requestAnimationFrame(() => {
        const containerTop = scrollElement ? scrollElement.getBoundingClientRect().top : 0;
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
          keysToCollapseForLevel(current, flatHeadings).forEach((key) => next.delete(key));
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

    scrollHeadingIntoView(headingElement, scrollElement, scrollOffset);
  }

  function openHeading(item: MarkdownHeading) {
    expandBranch(item, true);
    window.setTimeout(() => jumpToHeading(item), 0);
  }

  function handleSelect(_selectedKeys: Key[], info: { node: EventDataNode<DataNode> }) {
    const heading = headingByKey.get(String(info.node.key));
    if (!heading) {
      return;
    }
    openHeading(heading);
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
    <div ref={catalogRef} className={`markdown-catalog-wrapper ${className || ''}`}>
      <Tree
        className="markdown-catalog"
        treeData={treeData}
        expandedKeys={expandedKeys}
        selectedKeys={activeKey ? [activeKey] : []}
        titleRender={(node) => (
        <span
          className="markdown-catalog-title"
          data-catalog-key={String(node.key)}
          onClick={(event) => {
            event.stopPropagation();
            const heading = (node as DataNode & { heading?: MarkdownHeading }).heading;
            if (heading) {
              openHeading(heading);
            }
          }}
        >
          {node.title as ReactNode}
        </span>
      )}
        onSelect={handleSelect}
        onExpand={handleExpand}
        autoExpandParent={false}
        blockNode
      />
    </div>
  );
}
