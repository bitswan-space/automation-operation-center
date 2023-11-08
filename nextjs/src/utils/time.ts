import { format, parse } from "date-fns";

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

  const formattedDate = format(date, "HH:mm:ss.SS");

  // Return the full formatted date string
  return formattedDate;
}

export function parseDateTimeStringToPandaFormat(
  dateTimeString: string,
): string {
  // Parse the date string into a Date object
  const parsedDate = parse(dateTimeString, "MM/dd/yyyy, HH:mm:ss", new Date());

  // Format the Date object into the desired format
  const formattedDate = format(parsedDate, "yyyy-MM-dd HH:mm:ss");

  return formattedDate;
}
