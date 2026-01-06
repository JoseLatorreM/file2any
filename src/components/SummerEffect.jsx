import { useEffect, useState, useMemo, useCallback } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';

const SummerEffect = ({ theme = 'light' }) => {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    }).catch((err) => {
      console.error('Error initializing particles:', err);
    });
  }, []);

  const particlesLoaded = useCallback((container) => {
    // Particles loaded successfully
  }, []);

  const options = useMemo(() => ({
    fullScreen: {
      enable: true,
      zIndex: 1
    },
    background: {
      color: {
        value: 'transparent'
      }
    },
    fpsLimit: 60,
    interactivity: {
      events: {
        onClick: { enable: false },
        onHover: { enable: false }
      }
    },
    particles: {
      number: {
        value: 40,
        density: {
          enable: true,
          area: 800
        }
      },
      color: {
        value: ['#0EA5E9', '#38BDF8', '#7DD3FC', '#0284C7', '#60A5FA', '#3B82F6']
      },
      shape: {
        type: 'circle'
      },
      opacity: {
        value: { min: 0.15, max: 0.4 }
      },
      size: {
        value: { min: 3, max: 8 }
      },
      move: {
        enable: true,
        speed: 2,
        direction: 'top',
        random: true,
        straight: false,
        outModes: {
          default: 'out'
        }
      },
      wobble: {
        enable: true,
        distance: 10,
        speed: 5
      }
    },
    detectRetina: true
  }), [theme]);

  if (!init) return null;

  return (
    <Particles
      id="summer-particles"
      particlesLoaded={particlesLoaded}
      options={options}
    />
  );
};

export default SummerEffect;
