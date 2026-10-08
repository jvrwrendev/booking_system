import type { NavigatorScreenParams } from "@react-navigation/native";

export type AgentStackParamList = {
  AgentTabs: undefined;
  CustomerAdd: undefined;
  CustomerDetail: { customerId: string };
  BookingCreate: { customerId?: string } | undefined;
  BookingDetail: { bookingId: string };
};

export type AgentTabParamList = {
  Dashboard: undefined;
  Customers: undefined;
  Bookings: undefined;
  Profile: undefined;
};

export type BranchStackParamList = {
  BranchTabs: undefined;
  ProductDetail: { productId: string };
  OrderReview: undefined;
  OrderDetail: { orderId: string };
};

export type BranchTabParamList = {
  Dashboard: undefined;
  Inventory: undefined;
  Orders: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  Agent: NavigatorScreenParams<AgentStackParamList>;
  Branch: NavigatorScreenParams<BranchStackParamList>;
};


