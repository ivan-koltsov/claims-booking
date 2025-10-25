# Claims Booking - NestJS Matching API

API для зіставлення бронювань з страховими випадками (claims matching).

## Опис

Цей проект реалізує NestJS API з одним ендпоінтом `POST /match`, який приймає два списки:
- **bookings**: список бронювань
- **claims**: список страхових випадків

API здійснює метчинг (зіставлення) кожного бронювання з найбільш відповідним кейсом.

### Критерії матчингу

#### Обов'язкові критерії (без них матч неможливий):
1. **patient** — Ідентифікатор пацієнта має збігатися
2. **bookingDate в claim і reservationDate в booking** — дата (не час) має бути однакова

#### Додаткові критерії для підвищення точності матчу:
1. Співпадіння test і medicalServiceCode (через testsMap)
2. Співпадіння точного часу бронювання (години та хвилини)
3. Співпадіння страхової компанії (insurance)

### Алгоритм роботи

- Метч може бути **тільки 1 до 1**
- Якщо є декілька потенційних метчів, обирається той, який має найбільше співпадінь (найвищий score)
- Якщо є метч, але не всі поля співпадають, в об'єкті метчу додається поле `mismatch` з переліком полів, які не співпали

### Scoring система

- Базовий score (обов'язкові критерії виконані): **100 балів**
- Співпадіння тесту: **+50 балів**
- Співпадіння часу: **+30 балів**
- Співпадіння страхової компанії: **+20 балів**

Максимальний score: **200 балів**

## Структура проекту

```
src/
├── main.ts                           # Точка входу застосунку
├── app.module.ts                     # Головний модуль
└── matching/                         # Модуль матчингу
    ├── matching.module.ts            # Модуль
    ├── matching.controller.ts        # Контролер з ендпоінтом
    ├── matching.service.ts           # Сервіс з логікою матчингу
    ├── matching.service.spec.ts      # Unit тести
    └── dto/                          # Data Transfer Objects
        ├── booking.dto.ts
        ├── claim.dto.ts
        ├── match-request.dto.ts
        └── match-response.dto.ts
```

## Встановлення

```bash
# Встановлення залежностей
npm install
```

## Запуск

```bash
# Development режим
npm run start:dev

# Production режим
npm run build
npm run start:prod
```

Сервер запуститься на `http://localhost:3000`

## Тестування

```bash
# Unit тести
npm run test

# E2E тести
npm run test:e2e

# Покриття тестами
npm run test:cov
```

## Використання API

### Endpoint: POST /match

**URL:** `http://localhost:3000/match`

**Request Body:**
```json
{
  "bookings": [
    {
      "id": "booking_1",
      "patient": "patient_1",
      "test": "test_1",
      "insurance": "AON",
      "reservationDate": "2025-05-16T11:00:00.000Z"
    }
  ],
  "claims": [
    {
      "id": "claim_1",
      "medicalServiceCode": "medical_service_1",
      "bookingDate": "2025-05-15T10:33:00.000Z",
      "insurance": "AON",
      "patient": "patient_1"
    }
  ]
}
```

**Response:**
```json
[
  {
    "claim": "claim_10",
    "booking": "booking_9",
    "mismatch": ["time", "test"]
  }
]
```

### Приклад з cURL

```bash
curl -X POST http://localhost:3000/match \
  -H "Content-Type: application/json" \
  -d '{
    "bookings": [
      {
        "id": "booking_9",
        "patient": "patient_8",
        "test": "test_1",
        "insurance": "FASCHIM",
        "reservationDate": "2025-05-15T10:30:00.000Z"
      }
    ],
    "claims": [
      {
        "id": "claim_10",
        "medicalServiceCode": "medical_service_2",
        "bookingDate": "2025-05-15T00:00:00.000Z",
        "insurance": "FASCHIM",
        "patient": "patient_8"
      }
    ]
  }'
```

### Приклад з тестовими даними

Повний набір тестових даних знаходиться в файлі `test-data/full-test-data.json`

```bash
curl -X POST http://localhost:3000/match \
  -H "Content-Type: application/json" \
  -d @test-data/full-test-data.json
```

## Формат відповіді

Кожен об'єкт у відповіді містить:
- `claim` (string) - ID страхового випадку
- `booking` (string) - ID бронювання
- `mismatch` (string[], optional) - масив полів, які не співпали

Можливі значення в `mismatch`:
- `"test"` - тести не співпадають
- `"time"` - час не співпадає
- `"insurance"` - страхові компанії не співпадають

## Технології

- **NestJS** 10.3.0 - framework
- **TypeScript** 5.3.3
- **class-validator** - валідація DTO
- **class-transformer** - трансформація об'єктів
- **Jest** - тестування

## Додаткова інформація

- У одного пацієнта може бути декілька бронювань та декілька клеймів в один день
- В базі завжди claims менше ніж bookings
- Мап тестів (testsMap) зашитий в сервіс для співставлення тестів між системами

## Ліцензія

MIT
