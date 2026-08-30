export function pickedOptionValue<T extends string | number>(
  options: Array<{ value: T }>,
  raw: string,
): T | null {
  const match = options.find((option) => String(option.value) === raw)
  return match ? match.value : null
}
