import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Fireworks } from '@fireworks-js/react';

const ConfettiSideCannons = () => {
  const fireworksRef = useRef(null);

  useEffect(() => {
    // Colores festivos
    const colors = ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'];

    const isMobile = window.innerWidth < 768;
    
    // Duración de la ráfaga (250ms)
    const duration = 250;
    const end = Date.now() + duration;

    // Detener los fuegos artificiales cuando termine el confeti (aprox 3s para que caigan)
    const stopFireworks = setTimeout(() => {
      if (fireworksRef.current) {
        fireworksRef.current.waitStop();
      }
    }, 3000);

    const frame = () => {
      // Lado Izquierdo: Dispara desde altura aleatoria
      confetti({
        particleCount: 5,
        angle: isMobile ? 60 : 60, // Un poco hacia arriba (60°) se ve mejor que recto (0°) al caer
        spread: 55,
        origin: { x: 0, y: 0.2 + Math.random() * 0.6 }, // Altura aleatoria entre 20% y 80%
        colors: colors,
        disableForReducedMotion: true,
        startVelocity: isMobile ? 25 : 35
      });

      // Lado Derecho: Dispara desde altura aleatoria
      confetti({
        particleCount: 5,
        angle: isMobile ? 120 : 120, // Un poco hacia arriba (120°)
        spread: 55,
        origin: { x: 1, y: 0.2 + Math.random() * 0.6 }, // Altura aleatoria entre 20% y 80%
        colors: colors,
        disableForReducedMotion: true,
        startVelocity: isMobile ? 25 : 35
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    return () => clearTimeout(stopFireworks);
  }, []);

  return (
    <Fireworks
      ref={fireworksRef}
      options={{
        opacity: 0.5,
        particles: 50,
        explosion: 5,
        intensity: 30,
        friction: 0.97,
        gravity: 1.5,
        rocketsPoint: {
          min: 0,
          max: 100
        }
      }}
      style={{
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 50,
        background: 'transparent'
      }}
    />
  );
};

export default ConfettiSideCannons;
