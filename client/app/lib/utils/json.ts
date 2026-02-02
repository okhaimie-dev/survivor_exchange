export function safeParseJSON<T>(jsonString: string | null | undefined): T | null {
  if (!jsonString) return null;
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return null;
  }
}

