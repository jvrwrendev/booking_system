import type { AccountStatus, AuthUser } from "@/types/auth";
import type {
  AccountStatusDto,
  CreateUserPayloadDto,
  PublicUserDto,
  UpdateUserPayloadDto,
} from "@/types/api";

/**
 * Translates between the API's user DTOs and the `AuthUser` the UI renders.
 *
 * The API stores a single `name` column and uses uppercase status codes; the
 * UI wants a `fullName` and lowercase status. Keeping the conversion in one
 * place means no component has to know the wire format.
 */

const STATUS_TO_UI: Record<AccountStatusDto, AccountStatus> = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
};

const STATUS_TO_API: Record<AccountStatus, AccountStatusDto> = {
  active: "ACTIVE",
  inactive: "INACTIVE",
  suspended: "SUSPENDED",
};

export function toAuthUser(dto: PublicUserDto): AuthUser {
  return {
    id: dto.id,
    fullName: dto.name,
    email: dto.email,
    role: dto.role,
    status: STATUS_TO_UI[dto.status],
    createdAt: dto.createdAt,
  };
}

export function toStatusDto(status: AccountStatus): AccountStatusDto {
  return STATUS_TO_API[status];
}

export interface UserFormValues {
  name: string;
  email: string;
  role: AuthUser["role"];
  status: AccountStatus;
  password?: string;
}

export function toCreateUserPayload(
  values: UserFormValues & { password: string }
): CreateUserPayloadDto {
  return {
    name: values.name.trim(),
    email: values.email.trim(),
    password: values.password,
    role: values.role,
    status: toStatusDto(values.status),
  };
}

/**
 * The edit form exposes status, so it is sent through the generic update.
 * The API rejects role/status changes aimed at your own account, and returns
 * a message explaining why — that message is surfaced to the user as-is.
 */
export function toUpdateUserPayload(values: UserFormValues): UpdateUserPayloadDto {
  return {
    name: values.name.trim(),
    email: values.email.trim(),
    role: values.role,
    status: toStatusDto(values.status),
  };
}

export function formatStatus(status: AccountStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
