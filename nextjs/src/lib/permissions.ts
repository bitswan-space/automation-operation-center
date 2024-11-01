export function isUserAdmin(userID: string) {
  return true;
}

export function canMutateGroups(userID: string) {
  return isUserAdmin(userID);
}

export function canMutateSidebarItems(userID: string) {
  return isUserAdmin(userID);
}
