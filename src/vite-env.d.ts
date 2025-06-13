// FILE: src/vite-env.d.ts

/// <reference types="vite/client" />

// This declaration is for Vite's built-in `?react` suffix for SVGs
// Keep it if you use this import style for ANY OTHER SVG.
declare module '*.svg?react' {
  import * as React from 'react';
  const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;
  export default ReactComponent;
}

// This declaration is for `vite-plugin-svgr` style imports
// Keep it if you use `import { ReactComponent as ... }` for ANY OTHER SVG.
declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;
  // If you also need to import SVGs as a URL (e.g., for <img> src)
  // const src: string;
  // export default src; 
}