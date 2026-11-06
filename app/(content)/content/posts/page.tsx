/* eslint-disable @next/next/no-img-element -- signed Storage URLs */
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PostControls } from "./post-controls";

const ACCOUNT_LABELS = { manpreet_linkedin: "Manpreet's LinkedIn", f2f: "Form2Finish" };

// One post at a time, in the order they'd go out. Nothing publishes from here: a
// yes writes a ready-to-post folder on the Mac, and scheduling is its own step.
export default async function PostsPage() {
  await requireRole("admin");
  const supabase = await createClient();

  const [{ data: post }, { count: left }, { count: approved }] = await Promise.all([
    supabase
      .from("posts")
      .select("*")
      .eq("status", "captioned")
      .order("scheduled_for", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "captioned"),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "approved"),
  ]);

  if (!post) {
    return (
      <div className="py-20 text-center">
        <p className="font-[family-name:var(--font-display)] text-4xl uppercase">No posts waiting</p>
        <p className="mt-2 text-[#a5a29b]">{approved ? `${approved} approved and packed.` : "New drafts land here."}</p>
      </div>
    );
  }

  const { data: approval } = await supabase
    .from("agent_approvals")
    .select("payload")
    .eq("kind", "approve_post")
    .eq("status", "pending")
    .contains("payload", { post_id: post.id })
    .maybeSingle();
  const warnings = ((approval?.payload as { warnings?: string[] } | null)?.warnings ?? []) as string[];

  const { data: signed } = post.preview_paths.length
    ? await supabase.storage.from("content").createSignedUrls(post.preview_paths, 3600)
    : { data: [] };

  const when = post.scheduled_for
    ? new Date(post.scheduled_for).toLocaleString("en-CA", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Vancouver",
      })
    : "No date";

  return (
    <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
      <div className="flex snap-x gap-2 overflow-x-auto pb-2">
        {(signed ?? []).map((image, i) =>
          image.signedUrl ? (
            <img
              key={image.path}
              src={image.signedUrl}
              alt={`Slide ${i + 1} of ${signed?.length}`}
              className="max-h-[70vh] w-[85%] shrink-0 snap-center bg-black object-contain sm:w-[70%]"
            />
          ) : null
        )}
      </div>
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold text-[#ff8340]">{ACCOUNT_LABELS[post.account]}</p>
          <p className="text-sm text-[#a5a29b]">
            {when} · {post.post_type.replace("_", " ")} · {left ?? 0} left
          </p>
        </div>
        {warnings.length > 0 ? (
          <ul className="border-l-4 border-[#ff6b1a] pl-3 text-sm text-[#ffb68c]">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        ) : null}
        <PostControls key={post.id} postId={post.id} caption={post.caption ?? ""} firstComment={post.first_comment} />
      </div>
    </div>
  );
}
