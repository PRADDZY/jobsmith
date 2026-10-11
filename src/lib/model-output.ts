export function boundModelText(value: string, limit: number): string {
  return value.trim().slice(0, limit).trimEnd();
}
