// Основные константы
const tpuTimeMultiplier = 1.25;
const printerPower = {a1: 0.3, h2s: 0.5};
const electricityPrice = 7;
const amortization = 16;

// Данные о пластиках (вместо базы данных)
const plasticsStock = [
    {id: 1, type: 'PLA', color: 'Черный', qty_kg: 5.50, qty_pcs: 3},
    {id: 2, type: 'PLA', color: 'Белый', qty_kg: 3.20, qty_pcs: 2},
    {id: 3, type: 'PLA', color: 'Красный', qty_kg: 2.00, qty_pcs: 1},
    {id: 4, type: 'PLA', color: 'Синий', qty_kg: 1.50, qty_pcs: 1},
    {id: 5, type: 'PETG', color: 'Прозрачный', qty_kg: 2.10, qty_pcs: 1},
    {id: 6, type: 'PETG', color: 'Черный', qty_kg: 1.80, qty_pcs: 1},
    {id: 7, type: 'ABS', color: 'Красный', qty_kg: 1.80, qty_pcs: 1},
    {id: 8, type: 'ABS', color: 'Серый', qty_kg: 1.20, qty_pcs: 1},
    {id: 9, type: 'ASA', color: 'Черный', qty_kg: 1.00, qty_pcs: 1},
    {id: 10, type: 'Nylon', color: 'Белый', qty_kg: 0.50, qty_pcs: 1},
    {id: 11, type: 'TPU', color: 'Черный', qty_kg: 0.90, qty_pcs: 1},
    {id: 12, type: 'TPU', color: 'Прозрачный', qty_kg: 0.75, qty_pcs: 1}
];

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadStock();
    loadSavedCalculations();
    setupEventListeners();
    setupDefaults();
});

// Загрузка материалов в селект
function loadStock() {
    const select = document.getElementById('material');
    select.innerHTML = plasticsStock.map(p =>
        `<option value="${p.id}" data-type="${p.type}" data-color="${p.color}" data-kg="${p.qty_kg}">
            ${p.type} | ${p.color} — ${p.qty_kg} кг (${p.qty_pcs} шт.)
        </option>`
    ).join('');
    updateColor();
}

// Обновление поля цвета
function updateColor() {
    const sel = document.getElementById('material');
    const opt = sel.options[sel.selectedIndex];
    document.getElementById('color').value = opt ? opt.dataset.color : '';
}

// Настройка обработчиков событий
function setupEventListeners() {
    document.getElementById('material').addEventListener('change', updateColor);
    
    document.getElementById('printer').addEventListener('change', function() {
        const customContainer = document.getElementById('customPowerContainer');
        if (this.value === 'custom') {
            customContainer.classList.remove('hidden');
        } else {
            customContainer.classList.add('hidden');
        }
    });
    
    // Обработчики чекбоксов
    ['useModeling', 'usePostprocess', 'usePackaging'].forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
            if (id === 'useModeling') toggleInput(id, 'modelingCost', 'modelingTime');
            else if (id === 'usePostprocess') toggleInput(id, 'postprocessCost', 'postprocessTime');
            else toggleInput(id, 'packagingCost', null);
        });
        // Инициализация состояния
        if (id === 'useModeling') toggleInput(id, 'modelingCost', 'modelingTime');
        else if (id === 'usePostprocess') toggleInput(id, 'postprocessCost', 'postprocessTime');
        else toggleInput(id, 'packagingCost', null);
    });
    
    // Автоматический расчет при изменении значений
    ['weight', 'time', 'complexity', 'printer', 'materialCostField', 'printCost', 
     'modelingCost', 'modelingTime', 'postprocessCost', 'postprocessTime', 'packagingCost']
    .forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', calculate);
        }
    });
}

// Управление состоянием полей через чекбоксы
function toggleInput(checkboxId, costId, timeId) {
    const chk = document.getElementById(checkboxId);
    const cost = document.getElementById(costId);
    const time = timeId ? document.getElementById(timeId) : null;
    const disabled = !chk.checked;
    
    [cost, time].forEach(el => {
        if (!el) return;
        el.disabled = disabled;
        el.classList.toggle('opacity-50', disabled);
        el.classList.toggle('cursor-not-allowed', disabled);
    });
}

// Установка значений по умолчанию
function setupDefaults() {
    document.getElementById('weight').value = 100;
    document.getElementById('time').value = 5;
    document.getElementById('materialCostField').value = 600;
    calculate(); // Первоначальный расчет
}

// Вспомогательная функция для строк таблицы
function row(name, value, icon = '') {
    const iconHtml = icon ? `<i class="${icon} mr-2"></i>` : '';
    return `
        <tr>
            <td class="py-2 text-zinc-400">${iconHtml}${name}</td>
            <td class="py-2 text-right font-medium">${value.toFixed(2)} ₽</td>
        </tr>`;
}

// Основная функция расчета
function calculate() {
    const materialId = document.getElementById('material').value;
    const materialObj = plasticsStock.find(p => p.id == materialId);
    const weight = parseFloat(document.getElementById('weight').value) || 0;
    let time = parseFloat(document.getElementById('time').value) || 0;
    const complexity = parseFloat(document.getElementById('complexity').value);
    const printer = document.getElementById('printer').value;
    
    if (!materialObj) return;
    
    let type = materialObj.type;
    
    // Коррекция времени для TPU
    if (type.toLowerCase() === 'tpu') {
        time *= tpuTimeMultiplier;
    }
    
    // Учет сложности
    time *= complexity;
    
    // Получение мощности принтера
    let power;
    if (printer === 'custom') {
        power = parseFloat(document.getElementById('customPower').value) || 0.3;
    } else {
        power = printerPower[printer] || 0.3;
    }
    
    // Получение стоимости материалов и услуг
    const materialCostInput = parseFloat(document.getElementById('materialCostField').value) || 0;
    const modelingEnabled = document.getElementById('useModeling').checked;
    const modelingCost = modelingEnabled ? parseFloat(document.getElementById('modelingCost').value) || 0 : 0;
    const modelingTime = modelingEnabled ? parseFloat(document.getElementById('modelingTime').value) || 1 : 0;
    const postEnabled = document.getElementById('usePostprocess').checked;
    const postCost = postEnabled ? parseFloat(document.getElementById('postprocessCost').value) || 0 : 0;
    const postTime = postEnabled ? parseFloat(document.getElementById('postprocessTime').value) || 1 : 0;
    const packagingEnabled = document.getElementById('usePackaging').checked;
    const packagingCost = packagingEnabled ? parseFloat(document.getElementById('packagingCost').value) || 0 : 0;
    const printCost = parseFloat(document.getElementById('printCost').value) || 0;
    
    // Расчет составляющих стоимости
    const electricity = time * power * electricityPrice;
    const printWorkCost = time * printCost;
    const amort = time * amortization;
    const materialCost = (weight / 1000) * materialCostInput;
    const estimatedPrice = (weight / 1000) * getEstimatedPrice(type);
    const modelingTotal = modelingCost * modelingTime;
    const postTotal = postCost * postTime;
    
    // Итоговая стоимость
    const total = estimatedPrice + electricity + printWorkCost + amort + 
                  (modelingEnabled ? modelingTotal : 0) + 
                  (postEnabled ? postTotal : 0) + 
                  (packagingEnabled ? packagingCost : 0);
    
    // Формирование таблицы результатов
    let html = '';
    html += row('Пластик (себестоимость)', materialCost, 'fas fa-box-open');
    html += row('Пластик (оценочная стоимость)', estimatedPrice, 'fas fa-tag');
    html += row('Электроэнергия', electricity, 'fas fa-bolt');
    html += row('Печать', printWorkCost, 'fas fa-print');
    html += row('Амортизация принтера', amort, 'fas fa-cogs');
    html += row('Моделирование', modelingEnabled ? modelingTotal : 0, 'fas fa-cube');
    html += row('Постобработка', postEnabled ? postTotal : 0, 'fas fa-paint-roller');
    html += row('Упаковка', packagingEnabled ? packagingCost : 0, 'fas fa-box');
    
    // Отображение результатов
    document.getElementById('breakdown').innerHTML = html;
    document.getElementById('total').innerHTML = `
        <div class="text-2xl font-bold text-emerald-400">${total.toFixed(2)} ₽</div>
        <div class="text-sm text-zinc-500 mt-1">Итоговая стоимость</div>
    `;
    document.getElementById('materialCostDisplay').innerText = `${materialCost.toFixed(2)} ₽`;
    
    // Сохранение текущих параметров для возможного сохранения
    window.currentCalculation = {
        material: `${materialObj.type} (${materialObj.color})`,
        weight: weight,
        time: time,
        complexity: complexity,
        printer: printer,
        total: total,
        details: {
            materialCost,
            estimatedPrice,
            electricity,
            printWorkCost,
            amort,
            modelingTotal: modelingEnabled ? modelingTotal : 0,
            postTotal: postEnabled ? postTotal : 0,
            packagingCost: packagingEnabled ? packagingCost : 0
        }
    };
}

// Функция оценки стоимости пластика
function getEstimatedPrice(type) {
    const prices = {
        PLA: 1200,
        PETG: 1000,
        ABS: 1500,
        ASA: 1600,
        Nylon: 1800,
        TPU: 2000
    };
    return prices[type] || 1000;
}

// Сохранение расчета
function saveCalculation() {
    document.getElementById('saveModal').classList.remove('hidden');
    document.getElementById('calculationName').focus();
}

// Закрытие модального окна
function closeSaveModal() {
    document.getElementById('saveModal').classList.add('hidden');
    document.getElementById('calculationName').value = '';
}

// Подтверждение сохранения
function confirmSave() {
    const name = document.getElementById('calculationName').value.trim();
    if (!name) {
        alert('Введите название расчета');
        return;
    }
    
    if (!window.currentCalculation) {
        alert('Сначала выполните расчет');
        return;
    }
    
    const calculation = {
        id: Date.now(),
        name: name,
        timestamp: new Date().toLocaleString(),
        ...window.currentCalculation
    };
    
    // Сохранение в localStorage
    const saved = JSON.parse(localStorage.getItem('3dPrintCalculations') || '[]');
    saved.unshift(calculation); // Добавляем в начало
    localStorage.setItem('3dPrintCalculations', JSON.stringify(saved.slice(0, 20))); // Храним последние 20 расчетов
    
    closeSaveModal();
    loadSavedCalculations();
    
    // Показать уведомление
    showNotification(`Расчет "${name}" сохранен!`);
}

// Загрузка сохраненных расчетов
function loadSavedCalculations() {
    const saved = JSON.parse(localStorage.getItem('3dPrintCalculations') || '[]');
    const container = document.getElementById('savedCalculations');
    
    if (saved.length === 0) {
        container.innerHTML = '<div class="text-center text-zinc-500 text-sm py-4">Нет сохраненных расчетов</div>';
        return;
    }
    
    container.innerHTML = saved.map(calc => `
        <div class="mb-3 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
            <div class="flex justify-between items-start">
                <div>
                    <div class="font-medium text-sm">${calc.name}</div>
                    <div class="text-xs text-zinc-500 mt-1">${calc.timestamp}</div>
                </div>
                <div class="text-right">
                    <div class="font-bold text-emerald-400">${calc.total.toFixed(2)} ₽</div>
                    <div class="text-xs text-zinc-500">${calc.material}, ${calc.weight}г</div>
                </div>
            </div>
            <div class="mt-2 flex justify-end space-x-2">
                <button onclick="loadCalculation(${calc.id})" class="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded">
                    <i class="fas fa-undo mr-1"></i>Загрузить
                </button>
                <button onclick="deleteCalculation(${calc.id})" class="text-xs px-2 py-1 bg-red-600 hover:bg-red-500 rounded">
                    <i class="fas fa-trash mr-1"></i>Удалить
                </button>
            </div>
        </div>
    `).join('');
}

// Загрузка сохраненного расчета
function loadCalculation(id) {
    const saved = JSON.parse(localStorage.getItem('3dPrintCalculations') || '[]');
    const calculation = saved.find(c => c.id === id);
    
    if (!calculation) return;
    
    // Здесь можно реализовать загрузку параметров расчета в форму
    // Это сложно, так как нужно знать конкретные значения полей
    // Вместо этого просто покажем информацию
    alert(`Расчет: ${calculation.name}\nМатериал: ${calculation.material}\nВес: ${calculation.weight}г\nВремя: ${calculation.time}ч\nИтого: ${calculation.total.toFixed(2)} ₽`);
    
    showNotification(`Расчет "${calculation.name}" загружен!`);
}

// Удаление расчета
function deleteCalculation(id) {
    if (!confirm('Удалить этот расчет?')) return;
    
    const saved = JSON.parse(localStorage.getItem('3dPrintCalculations') || '[]');
    const filtered = saved.filter(c => c.id !== id);
    localStorage.setItem('3dPrintCalculations', JSON.stringify(filtered));
    
    loadSavedCalculations();
    showNotification('Расчет удален!');
}

// Очистка истории
function clearHistory() {
    if (!confirm('Очистить всю историю расчетов?')) return;
    
    localStorage.removeItem('3dPrintCalculations');
    loadSavedCalculations();
    showNotification('История очищена!');
}

// Сброс калькулятора
function resetCalculator() {
    if (!confirm('Сбросить все значения к начальным?')) return;
    
    document.getElementById('weight').value = 100;
    document.getElementById('time').value = 5;
    document.getElementById('materialCostField').value = 600;
    document.getElementById('printCost').value = 50;
    document.getElementById('modelingCost').value = 300;
    document.getElementById('modelingTime').value = 1;
    document.getElementById('postprocessCost').value = 100;
    document.getElementById('postprocessTime').value = 1;
    document.getElementById('packagingCost').value = 20;
    document.getElementById('complexity').value = 1;
    document.getElementById('printer').value = 'a1';
    
    calculate();
    showNotification('Калькулятор сброшен!');
}

// Показ уведомления
function showNotification(message) {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 transform transition-transform duration-300 translate-y-0';
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-check-circle mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Автоматическое скрытие через 3 секунды
    setTimeout(() => {
        notification.style.transform = 'translateY(-100px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Экспорт/импорт данных (дополнительная функция)
function exportData() {
    const data = {
        plastics: plasticsStock,
        calculations: JSON.parse(localStorage.getItem('3dPrintCalculations') || '[]'),
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `3d-calculator-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('Данные экспортированы!');
}
