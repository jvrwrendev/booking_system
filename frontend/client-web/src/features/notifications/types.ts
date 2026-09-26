export type NotificationVariant = "destructive" | "warning" | "info";

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  href: string;
  variant: NotificationVariant;
  read: boolean;
}
