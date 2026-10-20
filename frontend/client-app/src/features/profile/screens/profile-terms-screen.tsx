import React from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FileText, ShieldCheck } from "lucide-react-native";
import { BUSINESS_NAME } from "@/constants";
import {
  TERMS_GROUPS,
  TERMS_UPDATED_AT,
} from "@/features/profile/data/terms-content";
import { ScreenHeader } from "@/components/shared/screen-header";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";

export function ProfileTermsScreen() {
  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <ScreenHeader
          title="Terms & Policy"
          subtitle="Please read carefully before using the app"
        />

        <Card className="mb-5">
          <Text variant="label" tone="muted">
            Last updated
          </Text>
          <Text weight="semibold" className="mt-1">
            {TERMS_UPDATED_AT}
          </Text>
          <Text variant="small" tone="muted" className="mt-2 leading-5">
            This document covers the terms of service and privacy policy for
            {BUSINESS_NAME} booking and inventory application. By continuing to
            use the app you accept the terms below.
          </Text>
        </Card>

        {TERMS_GROUPS.map((group, groupIndex) => {
          const Icon = groupIndex === 0 ? FileText : ShieldCheck;
          return (
            <View key={group.id} className="mb-5">
              <View className="mb-3 flex-row items-start gap-3">
                <View className="h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon size={17} color="#16A34A" />
                </View>
                <View className="flex-1">
                  <Text variant="h3" weight="semibold">
                    {group.heading}
                  </Text>
                  <Text
                    variant="small"
                    tone="muted"
                    className="mt-0.5 leading-5"
                  >
                    {group.description}
                  </Text>
                </View>
              </View>

              <Card className="gap-5">
                {group.sections.map((section, index) => (
                  <View key={section.title} className="gap-2">
                    <View className="flex-row items-start gap-2.5">
                      <View className="mt-0.5 h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Text
                          variant="small"
                          weight="bold"
                          tone="primary"
                          className="text-[10px] leading-none"
                        >
                          {index + 1}
                        </Text>
                      </View>
                      <Text weight="semibold" className="flex-1">
                        {section.title}
                      </Text>
                    </View>
                    {section.paragraphs.map((paragraph, pIndex) => (
                      <Text
                        key={pIndex}
                        className="pl-7 text-sm leading-6 text-foreground"
                      >
                        {paragraph}
                      </Text>
                    ))}
                  </View>
                ))}
              </Card>
            </View>
          );
        })}

        <View className="mt-1 items-center">
          <Text variant="small" tone="muted" className="text-center">
            © {new Date().getFullYear()} {BUSINESS_NAME}. All rights reserved.
          </Text>
          <Text variant="small" tone="muted" className="mt-1 text-center">
            support@agrivet.ph · privacy@agrivet.ph
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
