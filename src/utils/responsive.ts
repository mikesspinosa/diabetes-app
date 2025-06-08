// Breakpoints para diferentes dispositivos (en píxeles)
export const deviceBreakpoints = {
  // Teléfonos pequeños
  xs: 320, // iPhone SE, Galaxy S5
  sm: 375, // iPhone X/11/12/13/14, Galaxy S8/S9
  md: 390, // iPhone 12/13/14 Pro
  lg: 414, // iPhone 8/7/6 Plus, Galaxy Note
  
  // Tablets
  tablet: {
    sm: 768, // iPad Mini, iPad
    md: 834, // iPad Air, iPad Pro 11"
    lg: 1024, // iPad Pro 12.9"
  },
  
  // Laptops y Desktops
  laptop: {
    sm: 1280, // 13" laptops
    md: 1366, // 14" laptops
    lg: 1440, // 15" laptops
    xl: 1536, // Laptops más grandes
  },
  
  // Monitores grandes
  desktop: {
    sm: 1680,
    md: 1920,
    lg: 2560,
    xl: 3840, // 4K
  },
};

// Función para generar media queries
export const createMediaQuery = (minWidth: number) => 
  `@media (min-width: ${minWidth}px)`;

// Media queries comunes
export const mediaQueries = {
  phoneXs: createMediaQuery(deviceBreakpoints.xs),
  phoneSm: createMediaQuery(deviceBreakpoints.sm),
  phoneMd: createMediaQuery(deviceBreakpoints.md),
  phoneLg: createMediaQuery(deviceBreakpoints.lg),
  
  tabletSm: createMediaQuery(deviceBreakpoints.tablet.sm),
  tabletMd: createMediaQuery(deviceBreakpoints.tablet.md),
  tabletLg: createMediaQuery(deviceBreakpoints.tablet.lg),
  
  laptopSm: createMediaQuery(deviceBreakpoints.laptop.sm),
  laptopMd: createMediaQuery(deviceBreakpoints.laptop.md),
  laptopLg: createMediaQuery(deviceBreakpoints.laptop.lg),
  laptopXl: createMediaQuery(deviceBreakpoints.laptop.xl),
  
  desktopSm: createMediaQuery(deviceBreakpoints.desktop.sm),
  desktopMd: createMediaQuery(deviceBreakpoints.desktop.md),
  desktopLg: createMediaQuery(deviceBreakpoints.desktop.lg),
  desktopXl: createMediaQuery(deviceBreakpoints.desktop.xl),
};

// Orientaciones
export const orientation = {
  portrait: '@media (orientation: portrait)',
  landscape: '@media (orientation: landscape)',
};

// Utilidad para detectar dispositivos táctiles
export const touch = {
  coarse: '@media (pointer: coarse)', // Dispositivos táctiles
  fine: '@media (pointer: fine)', // Mouse/Trackpad
};

// Preferencias de movimiento reducido
export const motion = {
  reduced: '@media (prefers-reduced-motion: reduce)',
  normal: '@media (prefers-reduced-motion: no-preference)',
}; 