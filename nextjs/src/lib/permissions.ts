"use client";

import { type Session } from "next-auth";

export function isUserAdmin(session: Session | null) {
  return session?.user.group_membership?.some((membership) =>
    membership.toLowerCase().endsWith("/admin"),
  );
}

export function canSeeSettingsPage(session: Session | null) {
  return isUserAdmin(session);
}

export function canMutateGroups(session: Session | null) {
  return isUserAdmin(session);
}

export function canMutateGitops(session: Session | null) {
  return isUserAdmin(session);
}

export function canMutateUsers(session: Session | null) {
  return isUserAdmin(session);
}

export function canMutateSidebarItems(session: Session | null) {
  return isUserAdmin(session);
}
