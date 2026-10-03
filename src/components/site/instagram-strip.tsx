import { buttonVariants } from "@/components/ui/button";
import { getInstagramPosts } from "@/lib/instagram";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/site";

function shorten(text: string, max = 140) {
  const single = text.replace(/\s+/g, " ").trim();
  return single.length > max ? `${single.slice(0, max - 1)}…` : single;
}

/** Latest Instagram posts, or a plain link to the profile when the feed isn't available. */
export async function InstagramStrip({ limit = 6 }: { limit?: number }) {
  const posts = await getInstagramPosts(limit);

  return (
    <section aria-labelledby="instagram-heading" className="container mt-24 md:mt-32">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="instagram-heading" className="stretch-semiwide text-3xl font-bold">
          On Instagram
        </h2>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-signal underline-offset-4 hover:underline"
        >
          Follow @{INSTAGRAM_HANDLE}
        </a>
      </div>

      {posts.length > 0 ? (
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {posts.map((post) => (
            <li key={post.id}>
              <a
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-square overflow-hidden rounded-[12px] border border-ridge bg-basalt"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- Instagram's CDN URLs are short-lived; no point optimising them */}
                <img
                  src={post.imageUrl}
                  alt={post.caption ? shorten(post.caption) : "Instagram post"}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="size-full object-cover transition-opacity group-hover:opacity-85"
                />
                {post.kind !== "IMAGE" ? (
                  <span className="absolute right-2 top-2 rounded-full bg-black/75 px-2 py-0.5 text-xs font-semibold text-mist">
                    {post.kind === "VIDEO" ? "Video" : "Album"}
                  </span>
                ) : null}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-8 flex flex-col gap-4 rounded-panel border border-ridge bg-basalt p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-mist">Trip announcements and photos from the trail go up on Instagram first.</p>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline", size: "sm", className: "shrink-0" })}
          >
            Open @{INSTAGRAM_HANDLE}
          </a>
        </div>
      )}
    </section>
  );
}
