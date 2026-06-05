# 💸 Сплиттер счетов

Приложение для разделения ресторанного счёта между участниками компании.
Поддерживает личные заказы, совместные позиции (кальян, пицца на компанию), разделение позиций между выбранными участниками и оптимизацию переводов.

## Стек

- **Backend:** Java 17, Spring Boot 3.2.5, Maven (хранение в localStorage на фронте)
- **Frontend:** React 18, Vite 5, CSS

## Структура проекта

```
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/splitter/
│       ├── SplitterApplication.java
│       ├── config/CorsConfig.java
│       ├── controller/SplitController.java
│       ├── service/SplitService.java
│       └── dto/
│           ├── SplitRequest.java
│           ├── SplitResponse.java
│           ├── ParticipantDto.java
│           ├── OrderItemDto.java
│           ├── SharedItemDto.java
│           ├── DebtDto.java
│           ├── PressureDto.java
│           └── SplitResultResponse.java
│   └── src/main/resources/application.properties
├── frontend/
│   ├── package.json
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── services/api.js
│       ├── styles/App.css
│       └── components/
│           ├── CreateCompany.jsx
│           ├── OrderEntry.jsx
│           ├── ResultTable.jsx
│           └── PressureGauge.jsx
└── README.md
```

## Запуск

### Backend (порт 8080)

```bash
cd backend && ./mvnw spring-boot:run
```

> Если `./mvnw` не запускается — дайте права: `chmod +x mvnw`

### Frontend (порт 5173)

```bash
cd frontend && npm run dev
```

Откройте http://localhost:5173 в браузере.

## API

### POST /api/split/calculate

**Request body:**

```json
{
  "organizerName": "Аделина",
  "participants": [
    {
      "name": "Аделина",
      "items": [
        { "name": "Стейк", "amount": 500, "sharedWith": [] },
        { "name": "Пицца", "amount": 800, "sharedWith": ["Аделина", "Настя"] }
      ],
      "contribution": 0
    },
    {
      "name": "Настя",
      "items": [
        { "name": "Салат", "amount": 400, "sharedWith": [] }
      ],
      "contribution": 0
    }
  ],
  "sharedItems": [
    {
      "name": "Кальян",
      "amount": 1200,
      "paidBy": "Саша",
      "sharedWith": ["Аделина", "Настя", "Наташа"]
    }
  ]
}
```

**Response:**

```json
{
  "average": 725.0,
  "total": 2900.0,
  "debts": [
    { "debtor": "Наташа", "creditor": "Аделина", "amount": 800.0 },
    { "debtor": "Настя", "creditor": "Саша", "amount": 600.0 },
    { "debtor": "Настя", "creditor": "Аделина", "amount": 100.0 }
  ],
  "pressureData": [
    { "name": "Аделина", "deviationPercent": 10, "level": "LOW" },
    { "name": "Саша", "deviationPercent": -17, "level": "LOW" }
  ]
}
```

## Функционал

1. **Создание компании** — выбор количества участников (2–8), название события
2. **Ввод расходов** — личные траты с редактируемыми именами, множественные позиции, общие позиции с выбором плательщика и участников
3. **Результаты** — таблица с долгами/переводами, оптимизация переводов (минимальное число транзакций), кнопка копирования напоминалки, чекбокс «Оплачено»
4. **Сайдбар событий** — хранение истории всех событий в localStorage, переключение между ними, индикатор ✅ для закрытых событий

## Расчёты

- **Личные позиции** — если указаны участники (`sharedWith`), сумма делится поровну между ними
- **Общие позиции** — делятся между выбранными участниками; плательщик получает кредит на полную сумму
- **Взаимозачёт** — взаимные долги схлопываются (если А должен Б, а Б должен А)
- **Оптимизация переводов** — жадный алгоритм минимизирует количество транзакций

## Что не успел

- Полноценные юнит-тесты (бэкенд и фронтенд)
- Опциональная БД (используется localStorage — сброс при очистке браузера)
- Аутентификация / сохранение истории между сессиями