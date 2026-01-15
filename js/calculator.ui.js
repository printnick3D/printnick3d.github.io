export function renderBreakdown(target, rows) {
  target.innerHTML = '';

  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="py-2">${r.label}</td>
      <td class="text-right">${r.value} ₽</td>
    `;
    target.appendChild(tr);
  });
}

export function setTotal(el, value) {
  el.textContent = `Итого: ${value} ₽`;
}
