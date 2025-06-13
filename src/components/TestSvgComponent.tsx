// FILE: src/components/TestSvgComponent.tsx

import React from 'react';

interface TestSvgComponentProps extends React.SVGProps<SVGSVGElement> {
  // Allows standard SVG props like width, height, className to be passed.
}

const TestSvgComponent: React.FC<TestSvgComponentProps> = (props) => {
  // Destructure width and height from props, providing defaults if not passed.
  const { width = "100%", height = "100%", ...restProps } = props;

  return (
    <svg 
      viewBox="0 0 100 100" 
      xmlns="http://www.w3.org/2000/svg" 
      width={width}
      height={height}
      {...restProps}
    >
      <circle cx="50" cy="50" r="40" stroke="green" strokeWidth="4" fill="yellow" />
      <text x="50" y="55" textAnchor="middle" fill="#000000" fontSize="10">TEST</text>
    </svg>
  );
};

export default TestSvgComponent;