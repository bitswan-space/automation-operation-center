import { format } from "date-fns";

export function unixToNormalTime(unixTimestamp: number): string {
  // Convert Unix timestamp to milliseconds
  const date = new Date(unixTimestamp * 1000);

  // Return a formatted date string
  return date.toLocaleString();
}

export function nanoToNormalTime(nanoTimestamp: number): string {
  // Convert nanoseconds timestamp to milliseconds
  const date = new Date(nanoTimestamp / 1000000);

  // Return a formatted date string
  return date.toLocaleString();
}

export function epochToFormattedTime(epochTime: number): string {
  const date = new Date(epochTime / 1000000);

  const formattedDate = format(date, "dd-MMM-yyyy HH:mm:ss.SSSSSS");

  // Return the full formatted date string
  return formattedDate;
}
