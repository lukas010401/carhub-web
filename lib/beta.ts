export function isBetaMode(): boolean {
  return process.env.NEXT_PUBLIC_BETA_MODE === 'true';
}
