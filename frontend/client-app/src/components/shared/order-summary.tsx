import React from "react";
import { View } from "react-native";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Divider } from "@/components/ui/divider";
import { formatCurrency } from "@/lib/utils";

export interface OrderLine {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface OrderSummaryProps {
  lines: OrderLine[];
  discount?: number;
  totalLabel?: string;
  className?: string;
}

export function OrderSummary({
  lines,
  discount = 0,
  totalLabel = "Total",
  className,
}: OrderSummaryProps) {
  const subtotal = lines.reduce((acc, l) => acc + l.subtotal, 0);
  const total = Math.max(0, subtotal - discount);

  return (
    <Card className={className}>
      <Text variant="title" weight="semibold" className="mb-3">
        Order Summary
      </Text>

      {lines.map((line, idx) => (
        <View key={line.id} className={idx === 0 ? "" : "mt-2"}>
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-2">
              <Text weight="medium" numberOfLines={2}>
                {line.name}
              </Text>
              <Text variant="small" tone="muted" className="mt-0.5">
                {line.quantity} × {formatCurrency(line.unitPrice)}
              </Text>
            </View>
            <Text weight="semibold">{formatCurrency(line.subtotal)}</Text>
          </View>
          {idx < lines.length - 1 && <Divider className="mt-2" />}
        </View>
      ))}

      <Divider className="my-3" />

      <View className="flex-row items-center justify-between">
        <Text tone="muted">Subtotal</Text>
        <Text weight="medium">{formatCurrency(subtotal)}</Text>
      </View>
      {discount > 0 && (
        <View className="flex-row items-center justify-between mt-1">
          <Text tone="muted">Discount</Text>
          <Text tone="danger" weight="medium">
            −{formatCurrency(discount)}
          </Text>
        </View>
      )}
      <View className="flex-row items-center justify-between mt-2">
        <Text weight="semibold">{totalLabel}</Text>
        <Text weight="bold">{formatCurrency(total)}</Text>
      </View>
    </Card>
  );
}
