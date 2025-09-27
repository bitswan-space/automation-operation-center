export function splitArrayUpToElementAndJoin<T>(
  array: T[],
  element: T,
): string {
  const elementIndex = array.indexOf(element);
  if (elementIndex === -1) {
    throw new Error(`Element ${element as string} not found in the array`);
  }
  return array.slice(0, elementIndex + 1).join("/");
}
