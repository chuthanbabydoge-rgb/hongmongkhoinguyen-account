import { useState, useEffect, useCallback } from "react";
import { identityStore } from "@/lib/store/identityStore";
import { UniverseIdentity } from "@/lib/types/identity";
import { useAuth } from "@/hooks/useAuth";

export function useIdentity() {
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const [identity, setIdentity] = useState<UniverseIdentity | null>(() =>
    userId ? identityStore.getIdentity(userId) : null
  );
  const [saving, setSaving] = useState(false);
  const [searchResult, setSearchResult] = useState<UniverseIdentity | null | "not_found">(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setIdentity(identityStore.getIdentity(userId));
    return identityStore.subscribe(() => setIdentity(identityStore.getIdentity(userId)));
  }, [userId]);

  const setVisibility = useCallback(async (visibility: "public" | "private") => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 350));
    identityStore.setVisibility(userId, visibility);
    setSaving(false);
  }, [userId]);

  const updateBio = useCallback(async (bio: string) => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    identityStore.updateBio(userId, bio);
    setSaving(false);
  }, [userId]);

  const searchUser = useCallback(async (query: string) => {
    setSearching(true);
    setSearchResult(null);
    await new Promise(r => setTimeout(r, 700));
    const result = identityStore.searchByUniverseId(query);
    setSearchResult(result ?? "not_found");
    setSearching(false);
  }, []);

  const clearSearch = useCallback(() => setSearchResult(null), []);

  return { identity, saving, searchResult, searching, setVisibility, updateBio, searchUser, clearSearch };
}
