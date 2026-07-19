"use client";

import { useEffect, useRef, useState } from 'react';

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('');
  const rafId = useRef(null);

  useEffect(() => {
    // Detect touch device
    const isTouch = window.matchMedia('(hover: none)').matches;
    if (isTouch) return;

    const cursor = cursorRef.current;

    const onMouseMove = (e) => {
      target.current = { x: e.clientX, y: e.clientY };
      if (!cursor.classList.contains('visible')) {
        cursor.classList.add('visible');
        pos.current = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseDown = () => cursor.classList.add('clicking');
    const onMouseUp = () => cursor.classList.remove('clicking');
    const onMouseLeave = () => cursor.classList.remove('visible');

    // Hover detection for interactive elements
    const onMouseOver = (e) => {
      const interactive = e.target.closest('[data-cursor-interactive="true"], button, a, input, .control-color, .control-font, .control-shadow, .magnetic-btn, .explore__swatch');
      if (interactive) {
        cursor.classList.add('hovering');
        
        const customColor = interactive.getAttribute('data-cursor-color');
        if (customColor) setColor(customColor);
        
        const customLabel = interactive.getAttribute('data-cursor-label');
        if (customLabel) {
          setLabel(customLabel);
          cursor.classList.add('has-label');
        } else {
          setLabel('');
          cursor.classList.remove('has-label');
        }
      }
    };

    const onMouseOut = (e) => {
      const interactive = e.target.closest('[data-cursor-interactive="true"], button, a, input, .control-color, .control-font, .control-shadow, .magnetic-btn, .explore__swatch');
      if (interactive) {
        cursor.classList.remove('hovering');
        cursor.classList.remove('has-label');
        setColor('');
        setLabel('');
      }
    };

    // Lerped animation loop
    const animate = () => {
      const lerp = 0.15;
      pos.current.x += (target.current.x - pos.current.x) * lerp;
      pos.current.y += (target.current.y - pos.current.y) * lerp;
      cursor.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%)`;
      rafId.current = requestAnimationFrame(animate);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseover', onMouseOver);
    document.addEventListener('mouseout', onMouseOut);
    rafId.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div 
      ref={cursorRef} 
      className="custom-cursor" 
      style={{ 
        backgroundColor: color || undefined,
        mixBlendMode: color ? 'normal' : 'difference'
      }}
    >
      {label && <span className="custom-cursor__label">{label}</span>}
    </div>
  );
}
