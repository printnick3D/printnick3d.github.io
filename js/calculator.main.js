import { materials } from './data.materials.js';
import { calculateTotal } from './calculator.logic.js';
import { renderBreakdown, setTotal } from './calculator.ui.js';
import { saveCalculation } from './api.js';

const materialSelect = document.getElementById('material');
const colorInput = document.getElementById('color');

Object.keys(materials).forEach(key => {
  const opt = document.createElement('option');
  opt.value = key;
  opt.textContent = key;
  materialSelect.appendChild(opt);
});

materialSelect.addEventListener('change', () => {
  colorInput.value = materials[materialSelect.value].colors.join(', ');
});

window.calculate = () => {
  const data = {
    materialPrice: materials[materialSelect.value].price,
    weight: +weight.value,
    time: +time.value,
    printRate: +printCost.value,
    complexity: +complexity.value,
    modeling: useModeling.checked && {
      rate: +modelingCost.value,
      hours: +modelingTime.value
    },
    postprocess: usePostprocess.checked && {
      rate: +postprocessCost.value,
      hours: +postprocessTime.value
    },
    packaging: usePackaging.checked && {
      cost: +packagingCost.value
    }
  };

  const result = calculateTotal(data);

  renderBreakdown(breakdown, [
    { label: 'Материал', value: result.materialCost.toFixed(0) },
    { label: 'Печать', value: result.printCost.toFixed(0) },
    { label: 'Дополнительно', value: result.extra.toFixed(0) }
  ]);

  setTotal(total, result.total);
};

window.saveCalculation = async () => {
  await saveCalculation({
    total: total.textContent,
    date: new Date().toISOString()
  });
  alert('Расчёт сохранён');
};
