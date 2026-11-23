// Narrow an unknown thrown value to a message.
//
// `catch (error: any)` disables type checking on the whole catch block and the
// linter rejects it. With strict mode the binding is `unknown`, so every read
// of `.message` has to be narrowed first. One helper, used everywhere.

export function errMsg(error: unknown, fallback = 'Internal server error'): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  return fallback;
}

// Mongo duplicate-key failures arrive as a plain object with `code: 11000`,
// not as an Error subclass.
export function isDuplicateKey(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000;
}
