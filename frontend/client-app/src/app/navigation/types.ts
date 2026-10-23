import type { NavigatorScreenParams } from "@react-navigation/native";

export type AgentStackParamList = {
  AgentTabs: undefined;
  CustomerAdd: undefined;
  CustomerDetail: { customerId: string };
  BookingCreate:
    | {
        customerId?: string;
        initialStep?: "customer" | "products" | "cart" | "review";
      }
    | undefined;
  BookingDetail: { bookingId: string };
  CatalogProductDetail: { productId: string };
  ProfileEdit: undefined;
  ProfileChangePassword: undefined;
  ProfileTerms: undefined;
};

export type AgentTabParamList = {
  Dashboard: undefined;
  Customers: undefined;
  Bookings: undefined;
  Catalog: undefined;
  Profile: undefined;
};

export type BranchStackParamList = {
  BranchTabs: undefined;
  ProductDetail: { productId: string };
  CatalogProductDetail: { productId: string };
  OrderCreate:
    | { initialStep?: "products" | "cart" | "review" }
    | undefined;
  OrderDetail: { orderId: string };
  ProfileEdit: undefined;
  ProfileChangePassword: undefined;
  ProfileTerms: undefined;
};

export type ProfileStackParamList = {
  ProfileEdit: undefined;
  ProfileChangePassword: undefined;
  ProfileTerms: undefined;
};

export type BranchTabParamList = {
  Dashboard: undefined;
  Catalog: undefined;
  Favorites: undefined;
  Orders: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  VerifyEmail: { email: string };
  VerificationSuccess: undefined;
  VerificationFailure: { email?: string; message?: string };
  Agent: NavigatorScreenParams<AgentStackParamList>;
  Branch: NavigatorScreenParams<BranchStackParamList>;
};
