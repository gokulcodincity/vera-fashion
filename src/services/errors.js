export function userMessage(error, fallback = 'Something went wrong. Please try again.') {
  const message = String(error?.message || '');
  if (/not configured|network|fetch/i.test(message)) return 'The store is temporarily unavailable. Please try again shortly.';
  if (/no longer available|requested quantity|out of stock/i.test(message)) return message;
  if (/not authorized|permission|row-level security/i.test(message)) return 'You do not have permission to do that.';
  return fallback;
}

export function throwIfError(error, fallback) {
  if (error) throw new Error(userMessage(error, fallback));
}
