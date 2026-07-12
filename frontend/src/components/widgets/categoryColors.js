export const CATEGORY_CHART_COLORS = [
  '#e07a4f',
  '#4ade80',
  '#a78bfa',
  '#60a5fa',
  '#fbbf24',
  '#f87171',
  '#c4a484',
  '#a8b89f',
  '#b8a9c9',
  '#8b919a',
];

export function getCategoryColor(index) {
  return CATEGORY_CHART_COLORS[index % CATEGORY_CHART_COLORS.length];
}
