export const MONTHS = Array.from({ length: 12 }, (_, index) => {
  const value = index + 1
  return { value, label: String(value).padStart(2, '0') }
})

export function buildYearRange(
  centerYear = new Date().getFullYear(),
  before = 3,
  after = 3,
) {
  return Array.from({ length: before + after + 1 }, (_, index) => centerYear - before + index)
}
