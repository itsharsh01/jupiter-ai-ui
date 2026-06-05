import { useEffect, useRef } from 'react';

const STAR_COUNT = 150;

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkle: boolean;
  duration: number;
}

function generateStars(): Star[] {
  return Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2,
    opacity: Math.random(),
    twinkle: Math.random() > 0.5,
    duration: Math.random() * 5 + 3,
  }));
}

const stars = generateStars();

export default function Starfield() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = '';

    stars.forEach((s) => {
      const div = document.createElement('div');
      div.className = 'star';
      div.style.width = `${s.size}px`;
      div.style.height = `${s.size}px`;
      div.style.left = `${s.x}%`;
      div.style.top = `${s.y}%`;
      div.style.opacity = String(s.opacity);
      if (s.twinkle) {
        div.style.animation = `twinkle ${s.duration}s infinite ease-in-out`;
      }
      el.appendChild(div);
    });
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className="fixed inset-0 pointer-events-none z-0"
      />
      <div className="galaxy-orb" />
    </>
  );
}
