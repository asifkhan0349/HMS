import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Modern Device Mockups with Frame Overlay
 */

const MockupContainer = ({ children, className }) => (
  <div className={cn("relative mx-auto w-full aspect-square flex items-center justify-center select-none overflow-hidden", className)}>
    {children}
  </div>
);

export const LaptopMockup = ({ src, alt, className }) => (
  <MockupContainer className={cn("max-w-[850px]", className)}>
    {/* Frame Image */}
    <img 
      src="/mockups/laptop_frame.png" 
      alt="Laptop Frame" 
      className="absolute inset-0 w-full h-full object-contain z-10 pointer-events-none"
    />
    
    {/* Screen Content - Positioned to fit the laptop screen area */}
    <div 
      className="absolute z-20 overflow-hidden bg-black"
      style={{
        top: '19.8%',
        width: '74.6%',
        height: '46.6%',
        borderRadius: '2px',
        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.6)'
      }}
    >
      <img src={src} alt={alt} className="w-full h-full object-cover" />
      {/* Glossy overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
    </div>
  </MockupContainer>
);

export const TabletMockup = ({ src, alt, className }) => (
  <MockupContainer className={cn("max-w-[480px]", className)}>
    <img 
      src="/mockups/tablet_frame.png" 
      alt="Tablet Frame" 
      className="absolute inset-0 w-full h-full object-contain z-10 pointer-events-none"
    />
    
    <div 
      className="absolute z-20 overflow-hidden bg-black"
      style={{
        top: '12.2%',
        width: '58.8%',
        height: '75.6%',
        borderRadius: '1.5%',
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.4)'
      }}
    >
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    </div>
  </MockupContainer>
);

export const SmartphoneMockup = ({ src, alt, className }) => (
  <MockupContainer className={cn("max-w-[320px]", className)}>
    <img 
      src="/mockups/mobile_frame.png" 
      alt="Smartphone Frame" 
      className="absolute inset-0 w-full h-full object-contain z-10 pointer-events-none"
    />
    
    <div 
      className="absolute z-20 overflow-hidden bg-black"
      style={{
        top: '13.2%',
        width: '30.4%',
        height: '73.6%',
        borderRadius: '6% / 2.5%',
        boxShadow: 'inset 0 0 15px rgba(0,0,0,0.4)'
      }}
    >
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    </div>
  </MockupContainer>
);
