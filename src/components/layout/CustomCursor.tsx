"use client";

import { useEffect, useRef } from "react";

/**
 * CustomCursor: Renders a premium, smooth custom cursor with a spring-loaded
 * follower ring that scales and changes color on hover states.
 * Updated to use requestAnimationFrame LERP + CSS GPU acceleration to run smoothly at 120Hz+.
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  // Track position using mutable refs to avoid React re-render cycles entirely
  const mousePos = useRef({ x: -100, y: -100 });
  const dotPos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const isVisible = useRef(false);
  const isHovered = useRef(false);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    // Hide standard system cursor on desktop screen widths >= 768px
    if (window.innerWidth >= 768) {
      document.documentElement.style.cursor = "none";
    }

    const onMouseMove = (e: MouseEvent) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;

      if (!isVisible.current) {
        isVisible.current = true;
        if (dotRef.current) dotRef.current.style.opacity = "1";
        if (ringRef.current) ringRef.current.style.opacity = isHovered.current ? "0.9" : "0.45";
      }
    };

    const onMouseLeave = () => {
      isVisible.current = false;
      if (dotRef.current) dotRef.current.style.opacity = "0";
      if (ringRef.current) ringRef.current.style.opacity = "0";
    };

    const onMouseEnter = () => {
      isVisible.current = true;
      if (dotRef.current) dotRef.current.style.opacity = "1";
      if (ringRef.current) ringRef.current.style.opacity = isHovered.current ? "0.9" : "0.45";
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const isClickable =
        target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        target.closest("button") ||
        target.closest("a") ||
        target.getAttribute("role") === "button" ||
        target.classList.contains("cursor-pointer") ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT";

      const nextHover = !!isClickable;
      if (isHovered.current !== nextHover) {
        isHovered.current = nextHover;
        if (ringRef.current) {
          if (nextHover) {
            ringRef.current.classList.add("is-hovered");
          } else {
            ringRef.current.classList.remove("is-hovered");
          }
        }
      }
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);
    window.addEventListener("mouseover", onMouseOver, { passive: true });

    // Tick function running inside requestAnimationFrame
    const tick = () => {
      // 1. Instantly move dot to mouse position (zero lag)
      dotPos.current.x = mousePos.current.x;
      dotPos.current.y = mousePos.current.y;

      // 2. Smoothly LERP the ring follower position (fast, sub-pixel follow)
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * 0.25;
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * 0.25;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dotPos.current.x}px, ${dotPos.current.y}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) translate(-50%, -50%)`;
      }

      animationFrameId.current = requestAnimationFrame(tick);
    };

    animationFrameId.current = requestAnimationFrame(tick);

    return () => {
      document.documentElement.style.cursor = "auto";
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      window.removeEventListener("mouseover", onMouseOver);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return (
    <>
      <style>{`
        .vanikara-cursor-dot {
          position: fixed;
          top: 0;
          left: 0;
          width: 8px;
          height: 8px;
          background-color: var(--accent-color);
          border-radius: 50%;
          pointer-events: none;
          z-index: 9999;
          will-change: transform;
          opacity: 0;
          transform: translate3d(-100px, -100px, 0) translate(-50%, -50%);
          transition: opacity 0.15s ease-out;
        }
        .vanikara-cursor-ring {
          position: fixed;
          top: 0;
          left: 0;
          width: 22px;
          height: 22px;
          border: 1.5px solid var(--text-secondary);
          border-radius: 50%;
          pointer-events: none;
          z-index: 9998;
          will-change: transform, width, height, border-color, background-color, box-shadow, opacity;
          opacity: 0;
          background-color: transparent;
          transform: translate3d(-100px, -100px, 0) translate(-50%, -50%);
          transition: opacity 0.15s ease-out,
                      width 0.15s cubic-bezier(0.25, 1, 0.5, 1),
                      height 0.15s cubic-bezier(0.25, 1, 0.5, 1),
                      border-color 0.15s cubic-bezier(0.25, 1, 0.5, 1),
                      border-width 0.15s cubic-bezier(0.25, 1, 0.5, 1),
                      background-color 0.15s cubic-bezier(0.25, 1, 0.5, 1),
                      box-shadow 0.15s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .vanikara-cursor-ring.is-hovered {
          width: 42px;
          height: 42px;
          border-color: var(--accent-color);
          border-width: 2px;
          background-color: rgba(30, 107, 214, 0.08);
          box-shadow: 0 0 12px rgba(30, 107, 214, 0.25);
          opacity: 0.9;
        }
      `}</style>
      <div ref={dotRef} className="vanikara-cursor-dot hidden md:block" />
      <div ref={ringRef} className="vanikara-cursor-ring hidden md:block" />
    </>
  );
}
