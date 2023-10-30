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

export function nanoToFormattedTime(nanoTimestamp: number): string {
  // Convert nanoseconds timestamp to milliseconds
  const date = new Date(nanoTimestamp / 1000000);

  console.log("date", date);

  // Use date-fns to format most parts of the date
  const formattedDate = format(date, "dd-MMM-yyyy HH:mm:ss.SSS");

  // Get the remaining nanoseconds
  const nanoseconds = (nanoTimestamp % 1000000).toString().padStart(6, "0");

  // Return the full formatted date string
  return `${formattedDate}${nanoseconds}`;
}
