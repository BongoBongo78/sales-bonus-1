/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
   const { discount, sale_price, quantity } = purchase;

   // Переводим скидку из процентов в десятичное число
   const discountDecimal = discount / 100;

   // Считаем полную стоимость без скидки
   const fullPrice = sale_price * quantity;

   // Применяем скидку и получаем выручку
   const revenue = fullPrice * (1 - discountDecimal);

   return revenue;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const { profit } = seller;

    // Определяем процент бонуса в зависимости от позиции в рейтинге
    let bonusPercent = 0;

    if (index === 0) {
        // Первое место - 15%
        bonusPercent = 0.15;
    } else if (index === 1 || index === 2) {
        // Второе и третье место - 10%
        bonusPercent = 0.10;
    } else if (index < total - 1) {
        // Все остальные, кроме последнего - 5%
        bonusPercent = 0.05;
    } else {
        // Последнее место - 0%
        bonusPercent = 0;
    }

    // Рассчитываем бонус в рублях
    const bonus = profit * bonusPercent;

    return bonus;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    if (!data
        || !Array.isArray(data.customers) || data.customers.length === 0
        || !Array.isArray(data.products) || data.products.length === 0
        || !Array.isArray(data.sellers) || data.sellers.length === 0
        || !Array.isArray(data.purchase_records) || data.purchase_records.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    }

    const { customers, products, sellers, purchase_records } = data;

    // @TODO: Проверка наличия опций
    const { calculateRevenue, calculateBonus } = options;

    if (!calculateRevenue || !calculateBonus) {
        throw new Error('Отсутствуют необходимые функции в опциях');
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики
    // Создаем объект для хранения статистики по каждому продавцу
    const sellersStats = {};

    sellers.forEach(seller => {
        sellersStats[seller.id] = {
            id: seller.id,
            name: `${seller.first_name} ${seller.last_name}`,
            revenue: 0,
            profit: 0,
            sales_count: 0,
            products_sold: {} // { sku: количество }
        };
    });

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    // Создаем индекс товаров для быстрого доступа по SKU
    const productsIndex = {};
    products.forEach(product => {
        productsIndex[product.sku] = product;
    });

    // @TODO: Расчет выручки и прибыли для каждого продавца
    // Обрабатываем все записи о продажах
    purchase_records.forEach(record => {
        const sellerId = record.seller_id;
        const sellerStats = sellersStats[sellerId];

        // Увеличиваем счетчик продаж
        sellerStats.sales_count += 1;

        // Обрабатываем каждый товар в чеке
        record.items.forEach(item => {
            const product = productsIndex[item.sku];

            // Рассчитываем выручку с использованием переданной функции
            const itemRevenue = calculateRevenue(item, product);
            sellerStats.revenue += itemRevenue;

            // Рассчитываем себестоимость (закупочная цена * количество)
            const itemCost = product.purchase_price * item.quantity;

            // Рассчитываем прибыль (выручка - себестоимость)
            const itemProfit = itemRevenue - itemCost;
            sellerStats.profit += itemProfit;

            // Учитываем проданные товары
            if (!sellerStats.products_sold[item.sku]) {
                sellerStats.products_sold[item.sku] = 0;
            }
            sellerStats.products_sold[item.sku] += item.quantity;
        });
    });

    // @TODO: Сортировка продавцов по прибыли
    // Преобразуем объект статистики в массив для сортировки
    const sellersArray = Object.values(sellersStats);

    // Сортируем продавцов по прибыли (по убыванию)
    sellersArray.sort((a, b) => b.profit - a.profit);

    // @TODO: Назначение премий на основе ранжирования
    // Рассчитываем бонусы для каждого продавца
    const totalSellers = sellersArray.length;
    sellersArray.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, totalSellers, seller);
    });

    // @TODO: Подготовка итоговой коллекции с нужными полями
    // Формируем итоговый отчет с нужными полями
    const report = sellersArray.map(seller => {
        // Получаем топ-10 товаров
        const productsArray = Object.entries(seller.products_sold).map(([sku, quantity]) => ({
            sku,
            quantity
        }));

        // Сортируем товары по количеству (по убыванию) и берем топ-10
        productsArray.sort((a, b) => b.quantity - a.quantity);
        const top_products = productsArray.slice(0, 10);

        return {
            seller_id: seller.id,
            name: seller.name,
            revenue: +seller.revenue.toFixed(2),
            profit: +seller.profit.toFixed(2),
            sales_count: seller.sales_count,
            top_products: top_products,
            bonus: +seller.bonus.toFixed(2)
        };
    });

    return report;
}
