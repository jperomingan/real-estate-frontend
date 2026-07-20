const apiUrl =
  process.env.NEXT_PUBLIC_API_URL;

export function getApiAssetUrl(
  value: string,
): string {
  if (
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  if (!apiUrl) {
    return value;
  }

  try {
    const apiOrigin =
      new URL(apiUrl).origin;

    return new URL(
      value,
      `${apiOrigin}/`,
    ).toString();
  } catch {
    return value;
  }
}
