import { useState } from 'react';
import logoPoliClaro from '../assets/imagenes/logo-poli-claro.png';
import logoPoliClaro2 from '../assets/imagenes/logo-poli-claro2.png';

interface BrandLogoProps {
  variant?: 'light' | 'dark';
  className?: string;
}

export function BrandLogo({ variant = 'dark', className = '' }: BrandLogoProps) {
  const [available, setAvailable] = useState(true);
  const source = variant === 'light' ? logoPoliClaro2 : logoPoliClaro;

  if (!available) {
    return <span className={`font-bold tracking-tight ${className}`}>PoliThesis</span>;
  }

  return (
    <img
      src={source}
      alt="PoliThesis"
      className={`max-h-10 w-auto object-contain ${className}`}
      onError={() => setAvailable(false)}
    />
  );
}
