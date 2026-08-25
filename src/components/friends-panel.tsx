"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { SectionGroup } from "@/components/ui/section";
import {
  Check,
  ChevronRight,
  Loader2,
  Search,
  UserPlus,
  X,
} from "lucide-react";

interface UserLite {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
}

interface FriendsData {
  friends: Array<{ friendshipId: string; user: UserLite; since: number }>;
  incoming: Array<{ friendshipId: string; user: UserLite }>;
  outgoing: Array<{ friendshipId: string; user: UserLite }>;
}

export function FriendsPanel() {
  const t = useTranslations("friends");
  const [data, setData] = useState<FriendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [searchResults, setSearchResults] = useState<UserLite[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const r = await fetch("/api/friends");
    if (r.ok) {
      const d = (await r.json()) as FriendsData;
      setData(d);
    }
    setLoading(false);
  }

  useEffect(() => {
    // Fetch the initial friend state after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchResults([]);
      return;
    }
    const tm = setTimeout(async () => {
      setSearching(true);
      const r = await fetch(
        `/api/users/search?q=${encodeURIComponent(q.trim())}`,
      );
      if (r.ok) {
        const d = (await r.json()) as { users: UserLite[] };
        setSearchResults(d.users);
      }
      setSearching(false);
    }, 250);
    return () => clearTimeout(tm);
  }, [q]);

  async function sendRequest(username: string) {
    setError(null);
    const r = await fetch("/api/friends", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username }),
    });
    if (!r.ok) {
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? "Failed");
      return;
    }
    await refresh();
    setQ("");
    setSearchResults([]);
  }

  async function respond(id: string, status: "accepted" | "rejected") {
    await fetch(`/api/friends/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await refresh();
  }

  async function remove(id: string) {
    if (!confirm("Remove friend?")) return;
    await fetch(`/api/friends/${id}`, { method: "DELETE" });
    await refresh();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const showSearchSection = q.trim().length >= 2;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-card p-4">
        <label className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-7 flex-1"
          />
        </label>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {t("searchHint")}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-2xl bg-destructive/15 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {showSearchSection && (
        <SectionGroup title={t("searchResults")}>
          {searching && (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="inline h-4 w-4 animate-spin" />
            </div>
          )}
          {!searching && searchResults.length === 0 && (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              {t("noResults")}
            </div>
          )}
          {searchResults.map((u) => (
            <div
              key={u.id}
              className="relative flex items-center gap-3 px-4 py-3 before:absolute before:bottom-0 before:left-4 before:right-0 before:h-px before:bg-border last:before:hidden"
            >
              <div className="flex-1 min-w-0">
                <p className="truncate text-[15px] font-medium">
                  @{u.username}
                </p>
                {u.name && (
                  <p className="truncate text-xs text-muted-foreground">
                    {u.name}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => u.username && sendRequest(u.username)}
                className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-background"
                aria-label={t("sendRequest")}
              >
                <UserPlus className="h-4 w-4" />
              </button>
            </div>
          ))}
        </SectionGroup>
      )}

      {data && data.incoming.length > 0 && (
        <SectionGroup title={t("incoming")}>
          {data.incoming.map((r) => (
            <div
              key={r.friendshipId}
              className="relative flex items-center gap-3 px-4 py-3 before:absolute before:bottom-0 before:left-4 before:right-0 before:h-px before:bg-border last:before:hidden"
            >
              <div className="flex-1 min-w-0">
                <p className="truncate text-[15px] font-medium">
                  @{r.user.username ?? "—"}
                </p>
                {r.user.name && (
                  <p className="truncate text-xs text-muted-foreground">
                    {r.user.name}
                  </p>
                )}
              </div>
              <button
                onClick={() => respond(r.friendshipId, "accepted")}
                className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-background"
                aria-label={t("accept")}
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={() => respond(r.friendshipId, "rejected")}
                className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-foreground/10"
                aria-label={t("reject")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </SectionGroup>
      )}

      <SectionGroup title={t("myFriends")}>
        {data && data.friends.length === 0 && !showSearchSection ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            {t("empty")}
          </div>
        ) : (
          data?.friends.map((f) => (
            <Link
              key={f.friendshipId}
              href={`/friends/${f.user.username}`}
              className="relative flex w-full items-center gap-3 px-4 py-3.5 transition-colors hover:bg-foreground/[0.03] before:absolute before:bottom-0 before:left-4 before:right-0 before:h-px before:bg-border last:before:hidden"
            >
              <div className="flex-1 min-w-0">
                <p className="truncate text-[15px] font-medium">
                  @{f.user.username}
                </p>
                {f.user.name && (
                  <p className="truncate text-xs text-muted-foreground">
                    {f.user.name}
                  </p>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  remove(f.friendshipId);
                }}
                className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-destructive"
                aria-label={t("remove")}
              >
                <X className="h-4 w-4" />
              </button>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            </Link>
          ))
        )}
      </SectionGroup>

      {data && data.outgoing.length > 0 && (
        <SectionGroup title={t("outgoing")}>
          {data.outgoing.map((r) => (
            <div
              key={r.friendshipId}
              className="relative flex items-center gap-3 px-4 py-3 before:absolute before:bottom-0 before:left-4 before:right-0 before:h-px before:bg-border last:before:hidden"
            >
              <div className="flex-1 min-w-0">
                <p className="truncate text-[15px] font-medium">
                  @{r.user.username}
                </p>
              </div>
              <button
                onClick={() => remove(r.friendshipId)}
                className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-foreground/10"
                aria-label={t("cancel")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </SectionGroup>
      )}
    </div>
  );
}
