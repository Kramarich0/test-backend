# KKM Central Office Management API

[![NestJS](https://img.shields.io/badge/NestJS-12-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?style=flat&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-NodeNext-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Swagger](https://img.shields.io/badge/Swagger-OpenAPI%203.0-85EA2D?style=flat&logo=swagger&logoColor=black)](http://localhost:3000/api/docs)

> 🌐 **Language / Язык:**
>
> **[🇷🇺 Перейти к русской версии](#центральный-офис-ккм--api-панели-управления)** | **[🇬🇧 Switch to English Version](#central-office-kkm--management-api)**

---

<a name="russian"></a>

## Центральный офис ККМ — API панели управления

Серверная часть (REST API) веб-приложения для центрального офиса (ЦО). Сервис обеспечивает управление торговыми точками, терминалами ККМ, обработку заявок на подключение и ролевой доступ администраторов (Root / Manager).

### ⚡ Быстрый старт (запуск одной командой)

Вся инфраструктура (база данных PostgreSQL, автоматическое применение миграций, начальный сид данных и бэкенд на NestJS) поднимается одной командой:

```bash
docker compose up -d --build
# или при использовании Podman:
podman compose up -d --build
```

После запуска доступны:

- 📑 **Интерактивная документация Swagger UI**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- 🚀 **Базовый URL REST API**: [http://localhost:3000](http://localhost:3000)

> 💡 В `docker-compose.yml` описаны два сервиса: `backend` (NestJS) и `postgres` (PostgreSQL 17). При первом старте бэкенд автоматически применяет миграции Prisma (`prisma migrate deploy`) и запускает сид данных — ничего настраивать вручную не нужно.

### 🔑 Тестовые учетные записи (pre-seeded data)

База данных автоматически инициализируется следующими учетными записями:

| Роль                      | Email / Логин       | Пароль            | Уровень доступа                                   |
| :------------------------ | :------------------ | :---------------- | :------------------------------------------------ |
| **Главный админ (ROOT)**  | `root@kkm.local`    | `RootAdmin123!`   | Полный доступ ЦО + управление менеджерами         |
| **Менеджер (MANAGER)**    | `manager@kkm.local` | `ManagerPass123!` | Операционный доступ (магазины, терминалы, заявки) |
| **Торговая точка (Shop)** | `shop_ivan`         | `ShopPass123!`    | Учетные данные кассовой точки                     |

### 🛡️ Ключевые архитектурные решения

1. **Контроль «одна сессия — одно устройство»**:
   - Каждая учетная запись содержит атомарную версию токена `tokenV`.
   - При повторном логине, логауте или смене пароля `tokenV` инкрементируется в базе данных, мгновенно инвалидируя старый Access/Refresh токен без необходимости поднимать Redis.
2. **Ролевой доступ (RBAC)**:
   - Операции управления администраторами закрыты составным мета-декоратором `@Auth('ROOT')`.
   - В системе гарантированно существует только один ROOT (защищен от удаления и повторного создания через API).
3. **Атомарные транзакции (ACID)**:
   - Одобрение заявки на кассу (`PATCH /requests/:id/approve`) выполняется в `prisma.$transaction`: статус заявки переводится в `APPROVED`, и одновременно создается активный терминал по аппаратному MAC-адресу — оба действия коммитятся атомарно.
4. **Heartbeat терминалов**:
   - `POST /terminals/alive` принимает физический `macAddress` оборудования, обновляет статус в `ACTIVE` и время последней активности без раскрытия внутренних UUID.
   - Эндпоинт **публичный**: кассовое оборудование шлёт heartbeat без JWT-токена.
5. **Безопасность паролей (OWASP + защита от Bcrypt DoS)**:
   - Проверка сложности `@IsStrongPassword` на регистрацию и смену паролей.
   - Ограничение `@MaxLength(64)` защищает алгоритм bcrypt от перегрузки CPU длинными строками (CPU-exhaustion DoS).
   - Вход через `LoginDto` не раскрывает правил сложности, что предотвращает перебор пользователей.
6. **Fail-Fast валидация окружения**:
   - При старте `ConfigModule` строго валидирует типы портов, URL базы данных и JWT-таймауты через `class-validator` / `class-transformer`.

#### 🔐 Архитектурное допущение: аутентификация торговых точек

Данный сервис — REST API Центрального Офиса (ЦО), поэтому JWT-аутентификация реализована для администраторов и менеджеров: `POST /auth/login` принимает `email` администратора и работает только с таблицей `admins`. Учётные данные торговой точки (`login` / `password` из модели `Shop`) хранятся в ЦО и предназначены для внешних кассовых модулей / кассового шлюза. Инкремент `tokenV` при вызове `PATCH /shops/:id/credentials` мгновенно инвалидирует активные сессии кассы на стороне шлюза; повторная авторизация кассы выполняется уже по новым учётным данным.

### 📋 Сводная таблица эндпоинтов API

| Модуль          |  Метод   | Путь                     |   Доступ    | Описание                                            |
| :-------------- | :------: | :----------------------- | :---------: | :-------------------------------------------------- |
| **Auth**        |  `POST`  | `/auth/login`            |  Публичный  | Вход по email и паролю, выдача пары JWT             |
|                 |  `POST`  | `/auth/refresh`          |  Публичный  | Обновление пары JWT по refresh-токену               |
|                 |  `POST`  | `/auth/logout`           | Авторизован | Завершение сессии и инвалидация токена              |
| **Admins**      |  `GET`   | `/admins`                |   `ROOT`    | Список всех администраторов ЦО                      |
|                 |  `POST`  | `/admins`                |   `ROOT`    | Создание менеджера (роль `MANAGER`)                 |
|                 | `PATCH`  | `/admins/:id/password`   |   `ROOT`    | Смена пароля администратора со сбросом сессии       |
|                 | `DELETE` | `/admins/:id`            |   `ROOT`    | Удаление менеджера (удаление ROOT запрещено)        |
| **Profile**     | `PATCH`  | `/profile/password`      | Авторизован | Смена пароля текущего пользователя                  |
| **Shop Owners** |  `GET`   | `/shops-owners`          | Авторизован | Список владельцев точек со счетчиками магазинов     |
|                 |  `GET`   | `/shops-owners/:id`      | Авторизован | Карточка владельца с привязанными магазинами        |
|                 |  `POST`  | `/shops-owners`          | Авторизован | Создание владельца (ИП / юрлицо)                    |
|                 | `PATCH`  | `/shops-owners/:id`      | Авторизован | Обновление контактов владельца                      |
|                 | `DELETE` | `/shops-owners/:id`      | Авторизован | Удаление владельца (каскадное удаление точек)       |
| **Shops**       |  `GET`   | `/shops`                 | Авторизован | Список магазинов с терминалами и владельцами        |
|                 |  `GET`   | `/shops/:id`             | Авторизован | Карточка магазина со списком касс и заявок          |
|                 |  `POST`  | `/shops`                 | Авторизован | Создание магазина с привязкой к владельцу           |
|                 | `PATCH`  | `/shops/:id/credentials` | Авторизован | Смена логина/пароля кассы и сброс сессий            |
| **Terminals**   |  `GET`   | `/terminals`             | Авторизован | Список всех кассовых терминалов ККМ                 |
|                 |  `GET`   | `/terminals/:id`         | Авторизован | Карточка терминала с данными торговой точки         |
|                 | `PATCH`  | `/terminals/:id/status`  | Авторизован | Ручное обновление статуса (`ACTIVE`/`INACTIVE`)     |
|                 |  `POST`  | `/terminals/alive`       |  Публичный  | Heartbeat от кассы по аппаратному MAC-адресу        |
| **Requests**    |  `GET`   | `/requests`              | Авторизован | Список заявок на подключение терминалов             |
|                 | `PATCH`  | `/requests/:id/approve`  | Авторизован | Одобрение заявки ➡️ создание терминала (транзакция) |
|                 | `PATCH`  | `/requests/:id/reject`   | Авторизован | Отклонение заявки на подключение                    |
|                 |  `POST`  | `/requests/:id/comment`  | Авторизован | Добавление комментария оператора к заявке           |

### 📦 Контракты ключевых эндпоинтов (входные/выходные данные)

#### `POST /auth/login` — вход администратора / менеджера (публичный)

```json
// Request (application/json)
{
  "email": "manager@kkm.local",
  "password": "ManagerPass123!"
}
```

```json
// Response 200 OK
{
  "admin": {
    "id": "b1e8c8d3-...-uuid",
    "email": "manager@kkm.local",
    "name": "Alex Manager",
    "role": "MANAGER",
    "tokenV": 1,
    "createdAt": "2026-09-23T10:00:00.000Z",
    "updatedAt": "2026-09-23T10:00:00.000Z"
  },
  "tokens": {
    "accessToken": "<JWT>",
    "refreshToken": "<JWT>"
  }
}
```

`401 Unauthorized` — неверный email или пароль.

#### `POST /shops` — создание торговой точки (авторизован)

```json
// Request
{
  "name": "Location No.1 \"Sport-Bar Center\"",
  "requisites": "Tax ID 777777777777, Registration No. 123456788765432",
  "address": "Moscow, Tverskaya Str., 31",
  "login": "shop_ivan",
  "password": "ShopPass123!",
  "ownerId": "<shop-owner-uuid>"
}
```

`201 Created` — созданная запись `Shop` (`id`, `name`, `requisites`, `address`, `login`, хеш `password`, `ownerId`, `tokenV: 0`, `createdAt`, `updatedAt`). `404` — владелец не найден; `409` — логин уже занят.

#### `PATCH /requests/:id/approve` — одобрение заявки (авторизован)

```json
// Response 200 OK
{
  "request": {
    "id": "9f4a-...-uuid",
    "macAddress": "AA:BB:CC:DD:EE:01",
    "status": "APPROVED",
    "comment": "Request for terminal at Entrance No.2",
    "shopId": "<shop-uuid>"
  },
  "terminal": {
    "id": "7cf2-...-uuid",
    "macAddress": "AA:BB:CC:DD:EE:01",
    "status": "ACTIVE",
    "shopId": "<shop-uuid>"
  }
}
```

`400` — заявка не в статусе `PENDING`; `409` — терминал с таким MAC уже существует.

#### `POST /terminals/alive` — heartbeat кассы (публичный)

```json
// Request
{
  "macAddress": "00:1B:44:11:3A:B7"
}
```

`200 OK` — обновлённый терминал со `status: "ACTIVE"`. `404` — терминал с таким MAC не зарегистрирован. `400` — `macAddress` не является корректным MAC-адресом.

#### `PATCH /shops/:id/credentials` — смена учётных данных кассы (авторизован)

```json
// Request (минимум одно из полей)
{
  "login": "shop_ivan_new",
  "password": "NewShopPass123!"
}
```

`200 OK` — обновлённая запись `Shop` с инкрементированным `tokenV` (сессии кассы инвалидированы). `409` — новый логин уже занят.

### 🛠️ Инструменты качества кода и разработка

```bash
# Локальный запуск в режиме разработки (с генерацией Prisma Client)
pnpm run start:dev

# Проверка линтером (Oxlint)
pnpm run lint

# Архитектурный анализ зависимостей и циклов (Dependency-Cruiser)
pnpm run arch:check

# Запуск тестов (Vitest)
pnpm run test
```

---

<a name="english"></a>

## Central Office KKM — Management API

Production-ready REST API backend for managing Central Office retail spots, POS/KKM terminals, connection requests, and role-based administrator access (Root / Manager).

### ⚡ Quick Start (single command)

The full stack (PostgreSQL database, automated migrations, data seeding, and NestJS server) starts with one command:

```bash
docker compose up -d --build
# or using Podman:
podman compose up -d --build
```

- 📑 **Interactive Swagger UI**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- 🚀 **REST API Base URL**: [http://localhost:3000](http://localhost:3000)

> 💡 The `docker-compose.yml` defines two services: `backend` (NestJS) and `postgres` (PostgreSQL 17). On the first start the backend automatically applies Prisma migrations (`prisma migrate deploy`) and runs the seed — no manual configuration required.

### 🔑 Test Credentials

| Role             | Email / Login       | Password          | Access Level                                     |
| :--------------- | :------------------ | :---------------- | :----------------------------------------------- |
| **ROOT Admin**   | `root@kkm.local`    | `RootAdmin123!`   | Full Central Office access + Manager management  |
| **MANAGER**      | `manager@kkm.local` | `ManagerPass123!` | Operational access (stores, terminals, requests) |
| **Store (Shop)** | `shop_ivan`         | `ShopPass123!`    | POS terminal authentication credentials          |

### 🛡️ Architecture Highlights

1. **Single-Session Enforcement per Device**:
   - Each account carries an atomic token version (`tokenV`).
   - Atomic `tokenV` increment on login, logout, and password change guarantees instant invalidation of old Access/Refresh tokens without Redis.
2. **Strict RBAC & Root Protection**:
   - Central Office admin management is restricted via a composite `@Auth('ROOT')` decorator. The system guarantees exactly one ROOT account (protected against deletion and re-creation via API).
3. **Atomic Database Transactions (ACID)**:
   - `PATCH /requests/:id/approve` executes an interactive `prisma.$transaction`: the request status is moved to `APPROVED` and an `ACTIVE` terminal is provisioned by hardware MAC address in a single atomic commit.
4. **Hardware Heartbeat Protocol**:
   - `POST /terminals/alive` uses the hardware `macAddress` to confirm terminal connectivity, flipping the status to `ACTIVE` without exposing internal UUIDs.
   - The endpoint is **public**: POS hardware sends heartbeats without a JWT token.
5. **OWASP Password Security & Bcrypt DoS Protection**:
   - Enforced password complexity with `@IsStrongPassword` on registration and password change.
   - `@MaxLength(64)` prevents CPU exhaustion during hashing (bcrypt 72-byte limit / CPU-exhaustion DoS).
   - The `LoginDto` deliberately avoids leaking complexity rules to prevent user enumeration.
6. **Fail-Fast Environment Validation**:
   - Strict runtime configuration checks (ports, database URLs, JWT duration formats) via `class-validator` / `class-transformer` upon application bootstrap.

#### 🔐 Architectural Assumption: Store Authentication

This service is the REST API of the Central Office, so JWT authentication is implemented for administrators and managers: `POST /auth/login` accepts an administrator `email` and only queries the `admins` table. Store credentials (`login` / `password` in the `Shop` model) are stored in the Central Office and are provided to external POS modules / the cash-register gateway. Incrementing `tokenV` on `PATCH /shops/:id/credentials` instantly invalidates the store's active sessions on the gateway side; the POS then re-authenticates with the new credentials.

### 📋 Complete API Overview Table

| Domain          |  Method  | Endpoint                 |    Access     | Summary                                          |
| :-------------- | :------: | :----------------------- | :-----------: | :----------------------------------------------- |
| **Auth**        |  `POST`  | `/auth/login`            |    Public     | Authenticate administrator, issue JWT pair       |
|                 |  `POST`  | `/auth/refresh`          |    Public     | Refresh JWT access token                         |
|                 |  `POST`  | `/auth/logout`           | Authenticated | Terminate session and invalidate token           |
| **Admins**      |  `GET`   | `/admins`                |    `ROOT`     | List all administrators                          |
|                 |  `POST`  | `/admins`                |    `ROOT`     | Create manager (`MANAGER` role)                  |
|                 | `PATCH`  | `/admins/:id/password`   |    `ROOT`     | Change manager password & invalidate session     |
|                 | `DELETE` | `/admins/:id`            |    `ROOT`     | Delete manager (ROOT deletion forbidden)         |
| **Profile**     | `PATCH`  | `/profile/password`      | Authenticated | Change current user password                     |
| **Shop Owners** |  `GET`   | `/shops-owners`          | Authenticated | List owners with shop counts                     |
|                 |  `GET`   | `/shops-owners/:id`      | Authenticated | Get owner details and attached stores            |
|                 |  `POST`  | `/shops-owners`          | Authenticated | Create shop owner (individual / entity)          |
|                 | `PATCH`  | `/shops-owners/:id`      | Authenticated | Update shop owner contacts                       |
|                 | `DELETE` | `/shops-owners/:id`      | Authenticated | Delete owner with cascading stores               |
| **Shops**       |  `GET`   | `/shops`                 | Authenticated | List shops with owner & terminal metrics         |
|                 |  `GET`   | `/shops/:id`             | Authenticated | Shop details with terminals & requests           |
|                 |  `POST`  | `/shops`                 | Authenticated | Register store linked to owner                   |
|                 | `PATCH`  | `/shops/:id/credentials` | Authenticated | Rotate POS login/password & kill active sessions |
| **Terminals**   |  `GET`   | `/terminals`             | Authenticated | List all POS/KKM terminals                       |
|                 |  `GET`   | `/terminals/:id`         | Authenticated | Get terminal details                             |
|                 | `PATCH`  | `/terminals/:id/status`  | Authenticated | Override status (`ACTIVE`/`INACTIVE`)            |
|                 |  `POST`  | `/terminals/alive`       |    Public     | Hardware heartbeat ping by MAC address           |
| **Requests**    |  `GET`   | `/requests`              | Authenticated | List connection requests                         |
|                 | `PATCH`  | `/requests/:id/approve`  | Authenticated | Atomically approve request & provision terminal  |
|                 | `PATCH`  | `/requests/:id/reject`   | Authenticated | Reject connection request                        |
|                 |  `POST`  | `/requests/:id/comment`  | Authenticated | Add internal operator audit comment              |

### 📦 Key Endpoint Contracts (Request / Response)

#### `POST /auth/login` — administrator / manager sign-in (public)

```json
// Request (application/json)
{
  "email": "manager@kkm.local",
  "password": "ManagerPass123!"
}
```

```json
// Response 200 OK
{
  "admin": {
    "id": "b1e8c8d3-...-uuid",
    "email": "manager@kkm.local",
    "name": "Alex Manager",
    "role": "MANAGER",
    "tokenV": 1,
    "createdAt": "2026-09-23T10:00:00.000Z",
    "updatedAt": "2026-09-23T10:00:00.000Z"
  },
  "tokens": {
    "accessToken": "<JWT>",
    "refreshToken": "<JWT>"
  }
}
```

`401 Unauthorized` — invalid email or password.

#### `POST /shops` — register a retail shop (authenticated)

```json
// Request
{
  "name": "Location No.1 \"Sport-Bar Center\"",
  "requisites": "Tax ID 777777777777, Registration No. 123456788765432",
  "address": "Moscow, Tverskaya Str., 31",
  "login": "shop_ivan",
  "password": "ShopPass123!",
  "ownerId": "<shop-owner-uuid>"
}
```

`201 Created` — created `Shop` record (`id`, `name`, `requisites`, `address`, `login`, `password` hash, `ownerId`, `tokenV: 0`, `createdAt`, `updatedAt`). `404` — owner not found; `409` — login already taken.

#### `PATCH /requests/:id/approve` — approve a request (authenticated)

```json
// Response 200 OK
{
  "request": {
    "id": "9f4a-...-uuid",
    "macAddress": "AA:BB:CC:DD:EE:01",
    "status": "APPROVED",
    "comment": "Request for terminal at Entrance No.2",
    "shopId": "<shop-uuid>"
  },
  "terminal": {
    "id": "7cf2-...-uuid",
    "macAddress": "AA:BB:CC:DD:EE:01",
    "status": "ACTIVE",
    "shopId": "<shop-uuid>"
  }
}
```

`400` — request is not in `PENDING` status; `409` — a terminal with this MAC already exists.

#### `POST /terminals/alive` — hardware heartbeat (public)

```json
// Request
{
  "macAddress": "00:1B:44:11:3A:B7"
}
```

`200 OK` — updated terminal with `status: "ACTIVE"`. `404` — no terminal registered with this MAC. `400` — `macAddress` is not a valid MAC address.

#### `PATCH /shops/:id/credentials` — rotate store credentials (authenticated)

```json
// Request (at least one of the fields)
{
  "login": "shop_ivan_new",
  "password": "NewShopPass123!"
}
```

`200 OK` — updated `Shop` record with incremented `tokenV` (store sessions invalidated). `409` — new login already taken.

### 🛠️ Local Development & Quality Gates

```bash
# Local development with watch mode (generates Prisma Client first)
pnpm run start:dev

# Linting (Oxlint)
pnpm run lint

# Architectural dependency & cycle analysis (Dependency-Cruiser)
pnpm run arch:check

# Vitest test suite
pnpm run test
```

---

## 📚 Project Structure (project layout)

```
src/
├── common/                  # Shared decorators, guards, constants, utils
├── config/                  # Fail-fast environment validation (class-validator)
├── modules/
│   ├── auth/                # Login / refresh / logout, JWT strategy, RBAC guard
│   ├── admins/              # Root-only administrator management
│   ├── profile/             # Current user password change
│   ├── shop-owners/         # Shop owner CRUD
│   ├── shops/               # Shops CRUD + credentials rotation
│   ├── terminals/           # Terminals + hardware heartbeat
│   └── requests/            # Terminal connection requests (approve/reject/comment)
└── main.ts                  # Bootstrap, Swagger /api/docs
```
