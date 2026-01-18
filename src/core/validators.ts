export function assertValidDateRange(startAt: string, endAt: string) {
  if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
    throw new Error('endAt debe ser mayor a startAt');
  }
}
