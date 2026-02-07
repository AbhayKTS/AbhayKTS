export function convertToChartData(contribList) {
  return {
    labels: contribList.map(d => {
      const dt = new Date(d.date);
      return `${dt.getDate()}`;
    }),
    values: contribList.map(d => d.count)
  };
}
