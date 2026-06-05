# 💸 Сплиттер счетов с социальным давлением

Приложение для справедливого разделения счёта в компании с элементами социального давления на тех, кто заказал дороже остальных.

## Стек

- **Backend:** Java 17, Spring Boot 3.2.5, Maven (in-memory HashMap)
- **Frontend:** React 18, Vite 5, CSS

## Структура проекта

```
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/splitter/
│       ├── SplitterApplication.java
│       ├── controller/SplitController.java
│       ├── service/SplitService.java
│       └── dto/
│           ├── SplitRequest.java
│           ├── SplitResponse.java
│           ├── ParticipantDto.java
│           ├── DebtDto.java
│           └── PressureDto.java
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
  "organizerName": "Человек 1",
  "participants": [
    { "name": "Человек 1", "order": "Стейк", "amount": 1200 },
    { "name": "Человек 2", "order": "Салат", "amount": 600 }
  ]
}
```

**Response:**

```json
{
  "average": 900.0,
  "total": 1800.0,
  "debts": [
    { "debtor": "Человек 2", "creditor": "Человек 1", "amount": 600.0 }
  ],
  "pressureData": [
    { "name": "Человек 1", "deviationPercent": 33, "level": "MEDIUM" },
    { "name": "Человек 2", "deviationPercent": -33, "level": "LOW" }
  ]
}
```

## Функционал

1. **Создание компании** — выбор количества участников (2–8) и организатора
2. **Ввод заказов** — редактируемые имена, описание заказа, сумма. В реальном времени показывается общая сумма и среднее на человека
3. **Результаты** — таблица с отклонениями, шкала социального давления (прогресс-бар + звук при >70%), подсчёт долгов, кнопка копирования напоминалки в буфер, чекбокс «Я заплатил» с зачёркиванием

## Расчёты

- `total` = сумма всех `amount`
- `average` = total / количество участников
- `deviation%` = round((amount - average) / average * 100)
- Каждый не-организатор переводит организатору ровно свою `amount`

## Что не успел

- Полноценные юнит-тесты (бэкенд и фронтенд)
- Опциональная БД (используется HashMap в памяти — сброс при перезапуске)
- Аутентификация / сохранение истории между сессиями