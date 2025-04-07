interface SUDSScaleProps {
  value: number;
  onChange: (value: number) => void;
  readOnly?: boolean;
}

export const SUDSScale: React.FC<SUDSScaleProps> = ({
  value,
  onChange,
  readOnly = false,
}) => {
// ... existing code ...
} 