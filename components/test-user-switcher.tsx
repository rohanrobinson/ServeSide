"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clearActiveUserAction, setActiveUserAction } from "@/app/actions";
import { TEST_USERS } from "@/lib/test-users";

type TestUserSwitcherProps = {
  currentUser: string;
};

export function TestUserSwitcher({ currentUser }: TestUserSwitcherProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState(currentUser);

  useEffect(() => {
    setSelectedUser(currentUser);
  }, [currentUser]);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-sky-100 bg-white px-3 py-3 text-sm sm:flex-row sm:flex-wrap sm:items-center">
      <span className="font-medium text-zinc-700">Testing as:</span>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const formData = new FormData();
            formData.set("selectedUser", selectedUser);
            await setActiveUserAction(formData);
            router.refresh();
          });
        }}
        className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center"
      >
        <select
          name="selectedUser"
          value={selectedUser}
          onChange={(event) => setSelectedUser(event.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 sm:min-w-44"
        >
          {TEST_USERS.map((user) => (
            <option key={user} value={user}>
              {user}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-sky-600 px-3 py-2 text-white hover:bg-sky-700 disabled:opacity-50"
        >
          Switch
        </button>
      </form>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await clearActiveUserAction();
            router.refresh();
          })
        }
        className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 sm:ml-auto"
      >
        Reset to Rohan
      </button>
    </div>
  );
}
