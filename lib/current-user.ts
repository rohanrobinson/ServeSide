import { cookies } from "next/headers";
import {
  ACTIVE_USER_COOKIE,
  DEFAULT_TEST_USER,
  isTestUser,
  type TestUser,
} from "@/lib/test-users";

export async function getCurrentUser(): Promise<TestUser> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ACTIVE_USER_COOKIE)?.value;

  if (raw && isTestUser(raw)) {
    return raw;
  }

  return DEFAULT_TEST_USER;
}
