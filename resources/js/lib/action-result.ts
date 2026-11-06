/** Единый результат Server Action для обработки на клиенте. */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export function actionOk<T>(data?: T): ActionResult<T> {
  return { ok: true, data };
}

export function actionError<T = undefined>(
  error: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<T> {
  return { ok: false, error, fieldErrors };
}
