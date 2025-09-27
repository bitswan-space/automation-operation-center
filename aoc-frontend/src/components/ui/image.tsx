import React from 'react';

interface ImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  [key: string]: any;
}

export const Image: React.FC<ImageProps> = ({ 
  src, 
  alt, 
  className, 
  width, 
  height, 
  ...props 
}) => {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      {...props}
    />
  );
};
