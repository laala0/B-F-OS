// Shared return shape for every Server Action, so the UI never has to
// guess whether a call succeeded — see actions/auth.ts for the pattern.
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export function actionOk<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function actionError(
  error: string,
  fieldErrors?: Record<string, string[]>
): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}
