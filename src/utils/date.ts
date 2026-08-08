export const toLocalDateOnly = (dateInput: string): Date | null => {
  if (!dateInput || typeof dateInput !== "string") {
    return null;
  }

  const normalizedInput = dateInput.trim();
  if (!normalizedInput) {
    return null;
  }

  const directParse = new Date(normalizedInput);
  if (!Number.isNaN(directParse.getTime())) {
    return new Date(
      directParse.getFullYear(),
      directParse.getMonth(),
      directParse.getDate(),
    );
  }

  const [year, month, day] = normalizedInput
    .split("-")
    .map((value) => Number.parseInt(value, 10))
    .map((value) => (Number.isNaN(value) ? NaN : value));

  if (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    Number.isInteger(day)
  ) {
    return new Date(year, month - 1, day);
  }

  return null;
};

