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
  /** Ties the trigger to the surrounding `<Label>`. */
  id?: string;
}

export function NameSuffixSelect({ value, onChange, id }: NameSuffixSelectProps) {
  const handleChange = (v: string) => {
    if (v === NONE) {
      onChange("");
      return;
    }
    onChange(v);
  };

  return (
    <Select value={value || NONE} onValueChange={handleChange}>
      <SelectTrigger id={id} className="h-10 w-full">
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
