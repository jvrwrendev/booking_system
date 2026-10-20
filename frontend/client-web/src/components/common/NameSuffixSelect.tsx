import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SUFFIXES = ["Jr.", "Sr.", "II", "III", "IV", "V"] as const;

const NONE = "__none__";

interface NameSuffixSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function NameSuffixSelect({ value, onChange }: NameSuffixSelectProps) {
  const handleChange = (v: string) => {
    if (v === NONE) {
      onChange("");
      return;
    }
    onChange(v);
  };

  return (
    <Select value={value || NONE} onValueChange={handleChange}>
      <SelectTrigger className="h-10 w-full">
        <SelectValue placeholder="—" />
      </SelectTrigger>
      <SelectContent>
        {SUFFIXES.map((s) => (
          <SelectItem key={s} value={s}>
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
