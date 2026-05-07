import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useThemeContext } from '../store/ThemeContext';

interface ClickBurst {
  id: number;
  x: number;
  y: number;
  themeId: string;
}

interface StarTrail {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

const interactiveSelector = [
  'a',
  'button',
  '[role="button"]',
  'input',
  'textarea',
  'select',
  '.ant-select',
  '.ant-dropdown-trigger',
  '.md-editor-toolbar-item',
].join(',');

const textSelector = [
  'input',
  'textarea',
  '[contenteditable="true"]',
  '.cm-content',
  '.md-editor-input',
].join(',');

function isFinePointer() {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

function isReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function GlobalCursorEffect() {
  const { cursorThemeId } = useThemeContext();
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const burstIdRef = useRef(0);
  const trailIdRef = useRef(0);
  const lastTrailAtRef = useRef(0);
  const [enabled, setEnabled] = useState(false);
  const [bursts, setBursts] = useState<ClickBurst[]>([]);
  const [starTrail, setStarTrail] = useState<StarTrail[]>([]);

  useEffect(() => {
    function syncEnabled() {
      setEnabled(cursorThemeId !== 'system' && isFinePointer() && !isReducedMotion());
    }

    syncEnabled();
    const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    pointerQuery.addEventListener('change', syncEnabled);
    motionQuery.addEventListener('change', syncEnabled);
    return () => {
      pointerQuery.removeEventListener('change', syncEnabled);
      motionQuery.removeEventListener('change', syncEnabled);
    };
  }, [cursorThemeId]);

  useEffect(() => {
    document.documentElement.classList.toggle('custom-cursor-enabled', enabled);
    if (!enabled) {
      return undefined;
    }

    function handlePointerMove(event: PointerEvent) {
      if (event.pointerType !== 'mouse') {
        return;
      }
      const cursor = cursorRef.current;
      const dot = dotRef.current;
      if (!cursor || !dot) {
        return;
      }
      cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      dot.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;

      const target = event.target instanceof Element ? event.target : null;
      const interactive = Boolean(target?.closest(interactiveSelector));
      const text = Boolean(target?.closest(textSelector));
      cursor.dataset.variant = text ? 'text' : interactive ? 'interactive' : 'default';

      if (cursorThemeId === 'starlight' && performance.now() - lastTrailAtRef.current > 42) {
        lastTrailAtRef.current = performance.now();
        const id = trailIdRef.current + 1;
        trailIdRef.current = id;
        const drift = (id % 2 === 0 ? 1 : -1) * (8 + (id % 3) * 4);
        setStarTrail((items) => [...items.slice(-12), { id, x: event.clientX + drift, y: event.clientY - 4, size: 8 + (id % 4) * 2, delay: (id % 3) * 0.03 }]);
        window.setTimeout(() => {
          setStarTrail((items) => items.filter((item) => item.id !== id));
        }, 720);
      }
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.pointerType !== 'mouse') {
        return;
      }
      const id = burstIdRef.current + 1;
      burstIdRef.current = id;
      const burst = { id, x: event.clientX, y: event.clientY, themeId: cursorThemeId };
      setBursts((items) => [...items, burst]);
      window.setTimeout(() => {
        setBursts((items) => items.filter((item) => item.id !== id));
      }, 620);
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      document.documentElement.classList.remove('custom-cursor-enabled');
    };
  }, [enabled, cursorThemeId]);

  if (!enabled) {
    return null;
  }

  return createPortal(
    <div className="global-cursor-layer" data-cursor-theme={cursorThemeId} aria-hidden="true">
      <div ref={cursorRef} className="global-cursor-ring" />
      <div ref={dotRef} className="global-cursor-dot" />
      {bursts.map((item) => (
        item.themeId === 'starlight' ? (
          <span key={item.id} className="global-magic-burst" style={{ left: item.x, top: item.y }}>
            {Array.from({ length: 8 }, (_, index) => (
              <i key={index} style={{ '--burst-angle': `${index * 45}deg`, '--burst-distance': `${22 + (index % 2) * 10}px` } as CSSProperties} />
            ))}
          </span>
        ) : (
          <span key={item.id} className="global-click-burst" style={{ left: item.x, top: item.y }} />
        )
      ))}
      {starTrail.map((item) => (
        <span
          key={item.id}
          className="global-star-trail"
          style={{ left: item.x, top: item.y, width: item.size, height: item.size, animationDelay: `${item.delay}s` }}
        />
      ))}
    </div>,
    document.body,
  );
}
