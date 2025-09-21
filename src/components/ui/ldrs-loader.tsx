import { useEffect } from 'react';

interface LdrsLoaderProps {
  type?: 'ring' | 'hatch' | 'bouncy' | 'spiral' | 'dotSpinner' | 'lineSpinner' | 'squircle';
  size?: string;
  speed?: string;
  color?: string;
  stroke?: string;
  bgOpacity?: string;
}

export const LdrsLoader = ({ 
  type = 'ring', 
  size = '20', 
  speed = '2', 
  color = '#FFC72C',
  stroke = '3',
  bgOpacity = '0'
}: LdrsLoaderProps) => {
  
  useEffect(() => {
    const loadAnimation = async () => {
      try {
        switch (type) {
          case 'ring':
            const { ring } = await import('ldrs');
            ring.register();
            break;
          case 'hatch':
            const { hatch } = await import('ldrs');
            hatch.register();
            break;
          case 'bouncy':
            const { bouncy } = await import('ldrs');
            bouncy.register();
            break;
          case 'spiral':
            const { spiral } = await import('ldrs');
            spiral.register();
            break;
          case 'dotSpinner':
            const { dotSpinner } = await import('ldrs');
            dotSpinner.register();
            break;
          case 'lineSpinner':
            const { lineSpinner } = await import('ldrs');
            lineSpinner.register();
            break;
          case 'squircle':
            const { squircle } = await import('ldrs');
            squircle.register();
            break;
        }
      } catch (error) {
        console.error('Error loading ldrs animation:', error);
      }
    };

    loadAnimation();
  }, [type]);

  const renderLoader = () => {
    switch (type) {
      case 'ring':
        return (
          <l-ring
            size={size}
            stroke={stroke}
            bg-opacity={bgOpacity}
            speed={speed}
            color={color}
          ></l-ring>
        );
      case 'hatch':
        return (
          <l-hatch
            size={size}
            stroke={stroke}
            speed={speed}
            color={color}
          ></l-hatch>
        );
      case 'bouncy':
        return (
          <l-bouncy
            size={size}
            speed={speed}
            color={color}
          ></l-bouncy>
        );
      case 'spiral':
        return (
          <l-spiral
            size={size}
            speed={speed}
            color={color}
          ></l-spiral>
        );
      case 'dotSpinner':
        return (
          <l-dot-spinner
            size={size}
            speed={speed}
            color={color}
          ></l-dot-spinner>
        );
      case 'lineSpinner':
        return (
          <l-line-spinner
            size={size}
            stroke={stroke}
            speed={speed}
            color={color}
          ></l-line-spinner>
        );
      case 'squircle':
        return (
          <l-squircle
            size={size}
            stroke={stroke}
            stroke-length="0.15"
            bg-opacity={bgOpacity}
            speed={speed}
            color={color}
          ></l-squircle>
        );
      default:
        return null;
    }
  };

  return <div className="inline-flex items-center justify-center">{renderLoader()}</div>;
};

// Types are provided by ldrs package
