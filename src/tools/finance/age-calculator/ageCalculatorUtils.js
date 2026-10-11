function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function parseDateParts(value, label) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { error: `Enter a valid ${label} date.` };
  }
  const [year, month, day] = value.split("-").map(Number);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    return { error: `Enter a valid ${label} date.` };
  }
  return { year, month, day };
}

function ordinal({ year, month, day }) {
  return Date.UTC(year, month - 1, day) / 86400000;
}

function addMonthsClamped(date, count) {
  const absoluteMonth = date.year * 12 + date.month - 1 + count;
  const year = Math.floor(absoluteMonth / 12);
  const month = (absoluteMonth % 12) + 1;
  return {
    year,
    month,
    day: Math.min(date.day, daysInMonth(year, month)),
  };
}

export function getLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function calculateAge(birthDate, ageOnDate) {
  const birth = parseDateParts(birthDate, "birth");
  if (birth.error) return birth;
  const ageOn = parseDateParts(ageOnDate, "age-on");
  if (ageOn.error) return ageOn;
  if (ordinal(ageOn) < ordinal(birth)) {
    return { error: "The age-on date cannot be before the date of birth." };
  }

  let years = ageOn.year - birth.year;
  if (ordinal(addMonthsClamped(birth, years * 12)) > ordinal(ageOn)) {
    years -= 1;
  }
  const yearAnniversary = addMonthsClamped(birth, years * 12);
  let months = (ageOn.year - yearAnniversary.year) * 12 + ageOn.month - yearAnniversary.month;
  if (ordinal(addMonthsClamped(yearAnniversary, months)) > ordinal(ageOn)) {
    months -= 1;
  }
  const monthAnniversary = addMonthsClamped(yearAnniversary, months);
  const totalMonths = years * 12 + months;
  const totalDays = ordinal(ageOn) - ordinal(birth);

  let nextBirthday = {
    year: ageOn.year,
    month: birth.month,
    day: Math.min(birth.day, daysInMonth(ageOn.year, birth.month)),
  };
  if (ordinal(nextBirthday) <= ordinal(ageOn)) {
    nextBirthday = {
      year: ageOn.year + 1,
      month: birth.month,
      day: Math.min(birth.day, daysInMonth(ageOn.year + 1, birth.month)),
    };
  }
  const daysUntilNextBirthday = ordinal(nextBirthday) - ordinal(ageOn);
  const birthdayWeekday = new Date(
    Date.UTC(nextBirthday.year, nextBirthday.month - 1, nextBirthday.day)
  ).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });

  return {
    years,
    months,
    days: ordinal(ageOn) - ordinal(monthAnniversary),
    totalMonths,
    totalWeeks: Math.floor(totalDays / 7),
    totalDays,
    daysUntilNextBirthday,
    nextBirthdayWeekday: birthdayWeekday,
  };
}
