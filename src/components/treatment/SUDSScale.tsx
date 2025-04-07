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
  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>0 - No distress</span>
        <span>100 - Extreme distress</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={readOnly}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="absolute -top-2 left-0 right-0 flex justify-between text-xs text-muted-foreground">
          <span>0</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>100</span>
        </div>
      </div>
      <div className="text-center">
        <span className="text-lg font-semibold">{value}</span>
      </div>
    </div>
  );
}; 