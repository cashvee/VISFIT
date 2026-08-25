import { incrementVisitorCount } from "@/db/queries";

export async function VisitorCounter() {
  const count = await incrementVisitorCount();
  const ordinal = getOrdinal(count);

  return (
    <p className="text-center text-[11px] text-white/55">
      You are the {count.toLocaleString()}
      {ordinal} visitor. Welcome to VISFIT. Try it out.
    </p>
  );
}

function getOrdinal(value: number) {
  const remainder100 = value % 100;
  if (remainder100 >= 11 && remainder100 <= 13) return "th";
  switch (value % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}
