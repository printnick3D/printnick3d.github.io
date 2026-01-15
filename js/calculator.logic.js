export function calculateTotal(data) {
  const materialCost =
    (data.weight / 1000) * data.materialPrice;

  const printCost =
    data.time * data.printRate;

  let extra = 0;

  if (data.modeling)
    extra += data.modeling.rate * data.modeling.hours;

  if (data.postprocess)
    extra += data.postprocess.rate * data.postprocess.hours;

  if (data.packaging)
    extra += data.packaging.cost;

  const subtotal = materialCost + printCost + extra;
  const total = subtotal * data.complexity;

  return {
    materialCost,
    printCost,
    extra,
    total: Math.round(total)
  };
}
