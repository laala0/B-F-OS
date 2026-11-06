// The Form2Finish row in `companies`. Content, leads and job sites all live under
// it, which is what keeps them out of Boss & Friends logins (see migration 0014).
export const FORM2FINISH_COMPANY_ID = "a0fd73e5-f5d7-4525-a587-c7321c9b73fd";

export const FORM2FINISH_HOST = "form2finish.yeinc.ca";

// Paths anyone can open without logging in.
export const CAPABILITY_PATH = "/capability";

// Photos cleared for the public sheet sit in the public `site-public` bucket
// because this repo is public and job photos never go in it. Local previews point
// NEXT_PUBLIC_SITE_PHOTOS_BASE at a git-ignored folder instead.
export function sitePhoto(name: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_PHOTOS_BASE ??
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-public`;
  return `${base}/${name}.jpg`;
}
