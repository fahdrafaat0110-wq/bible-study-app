/**
 * Age is DERIVED from date_of_birth, never stored.
 * Computed at read time so it is always accurate for today's date.
 */
export function computeAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const hadBirthdayThisYear =
    today.getMonth() > dateOfBirth.getMonth() ||
    (today.getMonth() === dateOfBirth.getMonth() && today.getDate() >= dateOfBirth.getDate());
  return age - (hadBirthdayThisYear ? 0 : 1);
}