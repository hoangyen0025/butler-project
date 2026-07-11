export function Badge({ type, value }) {
  return <span className={`badge badge--${type}`}>{value}</span>;
}
