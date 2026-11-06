// The Form2Finish row in `companies`. Content, leads and job sites all live under
// it, which is what keeps them out of Boss & Friends logins (see migration 0014).
export const FORM2FINISH_COMPANY_ID = "a0fd73e5-f5d7-4525-a587-c7321c9b73fd";

export const FORM2FINISH_HOST = "form2finish.yeinc.ca";

export const CAPABILITY_PATH = "/capability";

// The go-live switch for the public sheet. It names Boss & Friends, so it stays
// behind login until Manni has agreed and LAALA says go. Flip to true in a commit,
// which also makes form2finish.yeinc.ca open on the sheet. Local dev always shows it.
export const SHEET_LIVE = false;
export const sheetIsPublic = SHEET_LIVE || process.env.NODE_ENV === "development";

// Public by design: this is the project's own public URL, not a secret.
const PUBLIC_STORAGE = "https://ggcjzivteaamwiehzwdj.supabase.co/storage/v1/object/public";

// Photos cleared for the public sheet sit in the public `site-public` bucket
// because this repo is public and job photos never go in it. Local previews point
// NEXT_PUBLIC_SITE_PHOTOS_BASE at a git-ignored folder instead.
export function sitePhoto(name: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_PHOTOS_BASE ?? `${PUBLIC_STORAGE}/site-public`;
  return `${base}/${name}.jpg`;
}
