"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { decidePost } from "@/actions/content";

export function PostControls({
  postId,
  caption,
  firstComment,
}: {
  postId: string;
  caption: string;
  firstComment: string | null;
}) {
  const [text, setText] = useState(caption);
  const [pending, startTransition] = useTransition();
  const edited = text.trim() !== caption.trim();

  function send(input: Parameters<typeof decidePost>[0]) {
    startTransition(async () => {
      const result = await decidePost(input);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <>
      <label className="grid gap-1 text-sm text-[#c9c6bf]">
        Caption
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          className="w-full border border-[#3a3f44] bg-[#1d2125] px-3 py-3 text-base text-[#f4f1ea] focus:border-[#ff6b1a] focus:outline-none"
        />
      </label>
      {firstComment ? <p className="text-sm text-[#a5a29b]">First comment: {firstComment}</p> : null}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => send({ postId, action: "reject" })}
          className="min-h-14 border border-[#5a5f64] text-lg font-semibold transition-colors hover:border-[#f4f1ea] disabled:opacity-50"
        >
          Reject
        </button>
        {edited ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => send({ postId, action: "edit", caption: text })}
            className="min-h-14 bg-[#f4f1ea] text-lg font-semibold text-[#15181b] disabled:opacity-50"
          >
            Save edit
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => send({ postId, action: "approve" })}
            className="min-h-14 bg-[#ff6b1a] text-lg font-semibold text-[#15181b] transition-colors hover:bg-[#ff8340] disabled:opacity-50"
          >
            Approve
          </button>
        )}
      </div>
      <p className="text-sm text-[#8b9096]">Approve packs it ready to post. Nothing goes live from here.</p>
    </>
  );
}
