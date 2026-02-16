export function isValidDateRange(startAt: string, endAt: string) {
  return new Date(endAt).getTime() > new Date(startAt).getTime();
}
