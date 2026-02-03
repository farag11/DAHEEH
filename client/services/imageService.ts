import { getApiUrl } from "@/lib/query-client";

export async function extractTextFromImages(
  base64Images: string[]
): Promise<string> {
  if (base64Images.length === 0) {
    throw new Error("No images provided");
  }

  const baseUrl = getApiUrl();
  const url = new URL("/api/ai/extract-text", baseUrl);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ images: base64Images }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to extract text: ${response.status} ${text}`);
  }

  const result = await response.json();
  return result.text;
}
