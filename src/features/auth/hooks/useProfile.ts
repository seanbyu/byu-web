"use client";

import useSWR from "swr";
import useSWRMutation from "swr/mutation";

// ─── Types ───────────────────────────────────────────────────

interface UserIdentity {
  id: string;
  provider: string;
  provider_user_id: string | null;
  profile: {
    displayName?: string;
    pictureUrl?: string;
    statusMessage?: string;
    lineUserId?: string;
  } | null;
  is_primary: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  profile_image: string | null;
  user_identities: UserIdentity[];
}

// ─── Fetchers ────────────────────────────────────────────────

const profileFetcher = async (url: string): Promise<UserProfile> => {
  const response = await fetch(url);
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.message || "Profile fetch failed");
  }
  return result.data as UserProfile;
};

async function updatePhone(
  url: string,
  { arg }: { arg: { phone: string } }
): Promise<UserProfile> {
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Phone save failed");
  }
  return result.data as UserProfile;
}

// ─── Hooks ───────────────────────────────────────────────────

export function useProfile(enabled: boolean) {
  const { data, error, isLoading, mutate } = useSWR(
    enabled ? "/api/users/me" : null,
    profileFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  const {
    trigger: savePhone,
    isMutating: isSavingPhone,
  } = useSWRMutation("/api/users/me", updatePhone, {
    onSuccess: (updatedData) => {
      mutate(updatedData, false);
    },
  });

  return {
    profile: data ?? null,
    isLoading,
    error,
    savePhone,
    isSavingPhone,
    mutate,
  };
}
