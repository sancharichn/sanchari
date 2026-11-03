import "server-only";

type MetaError = { error?: { message?: string; code?: number } };

async function graphJson(url: string, body?: URLSearchParams) {
  const response = await fetch(url, body ? { method: "POST", body, signal: AbortSignal.timeout(20000) } : { signal: AbortSignal.timeout(12000), cache: "no-store" });
  const data = await response.json() as MetaError & Record<string, unknown>;
  if (!response.ok) throw new Error(data.error?.message || `Instagram request failed (${response.status}).`);
  return data;
}

export function instagramPublishingConfigured() {
  return Boolean(process.env.INSTAGRAM_ACCESS_TOKEN?.trim());
}

export async function publishInstagramImage(imageUrl: string, caption: string, altText: string) {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  if (!token) throw new Error("Instagram is not connected.");

  let accountId = process.env.INSTAGRAM_USER_ID?.trim();
  if (!accountId) {
    const me = await graphJson(`https://graph.instagram.com/me?fields=id,user_id,username&access_token=${encodeURIComponent(token)}`);
    accountId = String(me.user_id || me.id || "");
  }
  if (!/^\d+$/.test(accountId)) throw new Error("The connected Instagram professional account could not be identified.");

  const container = await graphJson(`https://graph.instagram.com/${accountId}/media`, new URLSearchParams({ image_url: imageUrl, caption, alt_text: altText.slice(0, 1000), access_token: token }));
  const creationId = String(container.id || "");
  if (!creationId) throw new Error("Instagram did not create a media container.");
  const published = await graphJson(`https://graph.instagram.com/${accountId}/media_publish`, new URLSearchParams({ creation_id: creationId, access_token: token }));
  const mediaId = String(published.id || "");
  if (!mediaId) throw new Error("Instagram did not confirm publication.");
  return mediaId;
}
