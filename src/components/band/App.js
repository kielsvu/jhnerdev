'use client';
import React, { useEffect, useState } from 'react';
import Lanyard from './Lanyard';

export default function App() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (isMobile) return null;

  return (
    <Lanyard
      frontImage="/assets/PP.png"
      backImage="/assets/PP.png"
      strapImage="/assets/bandd.png"
      strapColor="#111111"
      finish="glossy"
      anchor="right"
      size={0.55}
      strapLength={0.6}
      interactive
      intro
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
        overflow: 'visible',
      }}
    />
  );
}
