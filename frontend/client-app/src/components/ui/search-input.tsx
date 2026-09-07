import React from "react";
import { TextInput, View } from "react-native";
import { Search } from "lucide-react-native";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChangeText,
  placeholder = "Search...",
  className,
}: SearchInputProps) {
  return (
    <View
      className={cn(
        "flex-row items-center h-11 rounded-md border border-border bg-background px-3",
        className,
      )}
    >
      <Search color="#64748B" size={16} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        className="flex-1 ml-2 text-sm text-foreground"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
    </View>
  );
}
