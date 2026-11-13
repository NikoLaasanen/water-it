/**
 * The email typed on the sign-in screen, kept while moving between sign-in
 * and "Forgot password?" so it doesn't have to be typed twice.
 *
 * In memory only, never in the URL: a query string would put the address in
 * Hosting's request logs.
 */
export const signinDraft = $state({ email: '' });
