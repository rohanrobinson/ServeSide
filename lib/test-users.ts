export const TEST_USERS = [
  "Rohan",
  "Adithi",
  "Emily",
  "Subash",
  "Akash",
  "Shyon",
  "Sidd",
  "Sarah",
  "Priyal",
  "Michael",
  "Sahil",
  "Aaron",
  "Sebastian",
  "Kysah",
  "Dhruvit",
] as const;

export type TestUser = (typeof TEST_USERS)[number];

export function isTestUser(value: string): value is TestUser {
  return TEST_USERS.includes(value as TestUser);
}

export const DEFAULT_TEST_USER: TestUser = "Rohan";
export const ACTIVE_USER_COOKIE = "serveside_active_user";
