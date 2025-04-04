import { useState, useEffect } from 'react';
import { Slider } from "@/components/ui/slider";

interface SUDSScaleProps {
  onValueChange: (value: number) => void;
  initialValue?: number;
  readOnly?: boolean;
  improvementPercentage?: number;
  isImprovement?: boolean;
  sudsDifference?: number;
}

const SUDSScale = ({
  onValueChange,
  initialValue = 0,
  readOnly = false,
  improvementPercentage,
  isImprovement,
  sudsDifference,
}: SUDSScaleProps) => {
  const [value, setValue] = useState<number>(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const getSUDSDescription = (level: number): { text: string; color: string } => {
    if (level >= 90) return { text: "Extremely anxious/distressed", color: "rgb(254,100,121)" };
    if (level >= 80) return { text: "Very anxious/distressed; can't concentrate. Physiological signs present", color: "rgb(255,87,87)" };
    if (level >= 70) return { text: "Quite anxious/distressed; interfering with functioning", color: "rgb(255,139,87)" };
    if (level >= 60) return { text: "Moderate-to-strong anxiety or distress", color: "rgb(255,191,87)" };
    if (level >= 50) return { text: "Moderate anxiety/distress; uncomfortable but functioning", color: "rgb(255,223,87)" };
    if (level >= 40) return { text: "Mild-to-moderate anxiety or distress", color: "rgb(226,255,172)" };
    if (level >= 30) return { text: "Mild anxiety/distress; no interference", color: "rgb(172,255,189)" };
    if (level >= 20) return { text: "Minimal anxiety/distress", color: "rgb(172,255,223)" };
    if (level >= 10) return { text: "Alert and awake; concentrating well", color: "rgb(172,236,255)" };
    return { text: "No distress; totally relaxed", color: "rgb(172,198,255)" };
  };

  const description = getSUDSDescription(value);

  return (
    <div className="w-full space-y-6 p-6 rounded-xl bg-black/30 backdrop-blur-sm border border-white/10">
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <h3 className="text-lg font-medium tracking-wide text-white">SUDS Level</h3>
          <span className="text-2xl font-bold" style={{ color: description.color }}>
            {value}
          </span>
        </div>
        <p className="text-sm text-white/70">{description.text}</p>
      </div>
      
      <div className="h-24 relative">
        <div className="absolute inset-0 rounded-lg overflow-hidden">
          <div className="h-full w-full bg-gradient-to-r from-[#172,198,255] via-[#254,100,121] to-[#F97316]" />
        </div>
        <Slider
          value={[value]}
          onValueChange={(vals) => {
            if (!readOnly) {
              setValue(vals[0]);
              onValueChange(vals[0]);
            }
          }}
          max={100}
          step={1}
          className="relative z-10"
          disabled={readOnly}
        />
      </div>

      {/* Display Improvement Percentage as a Progress Bar */}
      {improvementPercentage !== undefined && sudsDifference !== undefined && (
        <div className="space-y-2 mt-2">
          {/* Progress Bar */}
          <div className="relative h-8 w-full rounded-full overflow-hidden bg-black/20 shadow-md">
            <div
              className={`h-full transition-all duration-300 ${
                improvementPercentage === 0
                  ? 'bg-white/20'
                  : isImprovement
                  ? 'bg-green-500'
                  : 'bg-red-500'
              } flex items-center justify-center text-white text-sm font-medium`}
              style={{ width: `${Math.abs(improvementPercentage)}%` }}
            >
              {improvementPercentage !== 0 && `${Math.abs(improvementPercentage).toFixed(0)}%`}
            </div>
          </div>
          {/* Text Labels */}
          <div className="space-y-1">
            <p
              className={`text-sm font-normal ${
                improvementPercentage === 0
                  ? 'text-white/70'
                  : isImprovement
                  ? 'text-green-500'
                  : 'text-red-500'
              }`}
            >
              Improvement from initial calibration:{' '}
              {improvementPercentage === 0
                ? 'no change'
                : `${Math.abs(improvementPercentage).toFixed(0)}% ${
                    isImprovement ? 'improvement' : 'decline'
                  }`}
            </p>
            <p className="text-sm text-white/70">
              SUDS Difference: {sudsDifference}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SUDSScale;