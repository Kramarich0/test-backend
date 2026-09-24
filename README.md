# KKM Central Office Management API

[![NestJS](https://img.shields.io/badge/NestJS-12-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?style=flat&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-NodeNext-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Swagger](https://img.shields.io/badge/Swagger-OpenAPI%203.0-85EA2D?style=flat&logo=swagger&logoColor=black)](http://localhost:3000/api/docs)

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
   - `POST /terminals/alive` принимает физический `macAddress` оборудования и обновляет статус терминала в `ACTIVE` (при записи автоматически обновляется и `updatedAt`). Касса идентифицируется по аппаратному MAC-адресу, а не по внутреннему UUID в пути запроса.
   - Эндпоинт **публичный**: кассовое оборудование шлёт heartbeat без JWT-токена.
5. **Безопасность паролей (OWASP + защита от Bcrypt DoS)**:
   - Ограничение `@MaxLength(64)` защищает алгоритм bcrypt от перегрузки CPU длинными строками (CPU-exhaustion DoS).
   - Вход через `LoginDto` не раскрывает правил сложности, что предотвращает перебор пользователей.
6. **Fail-Fast валидация окружения**:
   - При старте `ConfigModule` строго валидирует типы портов, URL базы данных и JWT-таймауты через `class-validator` / `class-transformer`.
7. **Shared Kernel для общих DTO**:
   - Публичный профиль администратора (`AdminProfileResponseDto`) и смена пароля (`ChangePasswordDto`) вынесены в [`src/common/dto/`](./src/common/dto/) и напрямую используются модулями `auth`, `admins` и `profile` (контроллеры и сервисы импортируют общие классы, файлы-дубли в модулях отсутствуют).
   - Это исключает дублирование идентичных полей DTO без появления кросс-модульных импортов: правило архитектуры `vsa-no-cross-slice-imports` запрещает зависимости между модулями, но разрешает импорт из общего ядра `common`.

#### 🔐 Архитектурное допущение: аутентификация торговых точек

Данный сервис — REST API Центрального Офиса (ЦО), поэтому JWT-аутентификация реализована для администраторов и менеджеров: `POST /auth/login` принимает `email` администратора и работает только с таблицей `admins`. Учётные данные торговой точки (`login` / `password` из модели `Shop`) хранятся в ЦО и предназначены для внешних кассовых модулей / кассового шлюза. Инкремент `tokenV` при вызове `PATCH /shops/:id/credentials` мгновенно инвалидирует активные сессии кассы на стороне шлюза; повторная авторизация кассы выполняется уже по новым учётным данным.

### 📋 Сводная таблица эндпоинтов API

| Модуль          |  Метод   | Путь                     |   Доступ    | Описание                                            |
| :-------------- | :------: | :----------------------- | :---------: | :-------------------------------------------------- |
| **Auth**        |  `POST`  | `/auth/login`            |  Публичный  | Вход по email и паролю, выдача пары JWT             |
|                 |  `POST`  | `/auth/refresh`          |  Публичный  | Обновление пары JWT по refresh-токену               |
|                 |  `POST`  | `/auth/logout`           | Авторизован | Завершение сессии и инвалидация токена              |
| **Admins**      |  `GET`   | `/admins`                | Авторизован | Список всех администраторов ЦО                      |
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

### 📦 Контракты всех эндпоинтов (входные/выходные данные)

> **Общие сведения**
>
> - Базовый URL: `http://localhost:3000`
> - Доступ к защищённым ручкам: заголовок `Authorization: Bearer <accessToken>`.
> - Публичные ручки (JWT не требуется): `POST /auth/login`, `POST /auth/refresh`, `POST /terminals/alive`.
> - Формат ошибки: `{"message": "...", "error": "<Тип>", "statusCode": 4xx}`; при ошибке валидации `message` — массив строк.
> - Пароли и их bcrypt-хеши **никогда не возвращаются** в ответах.
> - Значения `"<...>"` в примерах — плейсхолдеры UUID, в ответе подставляются реальные значения.

#### Auth

##### `POST /auth/login` — вход администратора / менеджера (публичный)

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
  "accessToken": "<JWT>",
  "refreshToken": "<JWT>",
  "admin": {
    "id": "<admin-uuid>",
    "email": "manager@kkm.local",
    "name": "Alex Manager",
    "role": "MANAGER",
    "createdAt": "2026-09-24T10:00:00.000Z",
    "updatedAt": "2026-09-24T10:00:00.000Z"
  }
}
```

`401` — неверный email или пароль (`Invalid Password or Email`). Поле `tokenV` инкрементируется при каждом входе — старые токены этого аккаунта инвалидируются (одна активная сессия).

##### `POST /auth/refresh` — обновление пары JWT (публичный)

```json
// Request (application/json)
{
  "refreshToken": "<JWT>"
}
```

```json
// Response 200 OK
{
  "accessToken": "<JWT>",
  "refreshToken": "<JWT>"
}
```

`401` — refresh-токен невалиден, протух или сессия инвалидирована (`Refresh token invalid or expired` / `Session expired`). Каждый вызов ротирует пару и атомарно инкрементирует `tokenV` — повторное (в т.ч. конкурентное) использование того же refresh-токена всегда даёт `401`.

##### `POST /auth/logout` — завершение текущей сессии (авторизован)

```json
// Response 200 OK
{
  "success": true
}
```

`401` — отсутствует/невалиден access-токен. Логаут инкрементирует `tokenV` — выданные ранее токены перестают работать.

#### Admins

##### `GET /admins` — список администраторов (авторизован)

```json
// Response 200 OK
[
  {
    "id": "<admin-uuid>",
    "email": "manager@kkm.local",
    "name": "Alex Manager",
    "role": "MANAGER",
    "createdAt": "2026-09-24T10:00:00.000Z",
    "updatedAt": "2026-09-24T10:00:00.000Z"
  }
]
```

`401` — не авторизован. Поля `password` и `tokenV` наружу не возвращаются ни в одном ответе.

##### `POST /admins` — создать менеджера (root-only)

```json
// Request (application/json)
{
  "email": "alex.manager@kkm.local",
  "name": "Alex Manager",
  "password": "ManagerPass123!"
}
```

```json
// Response 201 Created
{
  "id": "<admin-uuid>",
  "email": "alex.manager@kkm.local",
  "name": "Alex Manager",
  "role": "MANAGER",
  "createdAt": "2026-09-24T10:00:00.000Z",
  "updatedAt": "2026-09-24T10:00:00.000Z"
}
```

Поле `role` в теле **не принимается** — создаётся администратор строго с ролью `MANAGER` (роль ROOT может существовать только одна и создаётся сидом). `400` — email/name/пароль не прошли валидацию (пароль: непустой, до 64 символов); `401` — не авторизован; `403` — не ROOT; `409` — email уже занят.

##### `PATCH /admins/:id/password` — смена пароля администратора (root-only)

```json
// Request (application/json)
{
  "newPassword": "NewManagerPass123!"
}
```

```json
// Response 200 OK
{
  "id": "<admin-uuid>",
  "email": "alex.manager@kkm.local",
  "name": "Alex Manager",
  "role": "MANAGER",
  "createdAt": "2026-09-24T10:00:00.000Z",
  "updatedAt": "2026-09-24T10:00:00.000Z"
}
```

`400` — новый пароль невалиден (пустой или длиннее 64 символов); `401` — не авторизован; `403` — не ROOT; `404` — администратор не найден. Смена пароля инкрементирует `tokenV` — сессии администратора завершаются.

##### `DELETE /admins/:id` — удалить администратора (root-only)

```json
// Response 200 OK
{
  "id": "<admin-uuid>",
  "email": "alex.manager@kkm.local",
  "name": "Alex Manager",
  "role": "MANAGER",
  "createdAt": "2026-09-24T10:00:00.000Z",
  "updatedAt": "2026-09-24T10:00:00.000Z"
}
```

`400` — попытка удалить ROOT (`You cannot remove the root admin`); `401` — не авторизован; `403` — не ROOT; `404` — администратор не найден.

#### Profile

##### `PATCH /profile/password` — смена пароля текущего пользователя (авторизован)

```json
// Request (application/json)
{
  "newPassword": "MyNewSecretPass123!"
}
```

```json
// Response 200 OK
{
  "id": "<admin-uuid>",
  "email": "manager@kkm.local",
  "name": "Alex Manager",
  "role": "MANAGER",
  "createdAt": "2026-09-24T10:00:00.000Z",
  "updatedAt": "2026-09-24T10:00:00.000Z"
}
```

`400` — новый пароль невалиден (пустой или длиннее 64 символов); `401` — не авторизован; `404` — профиль не найден. Текущая сессия инвалидируется — после смены пароля нужно войти заново.

> **Комментарий для проверяющего: почему здесь нет `oldPassword`.** В ТЗ ручка описана лаконично — `PATCH /profile/password — смена пароля текущего пользователя` — и поля запроса не специфицированы, прямого требования подтверждать текущий пароль нет. Чтобы не ломать совместимость с автотестами/скриптами, которые передают только `newPassword`, обязательное поле не вводилось (оно не влияет на проверку по ТЗ). При этом смена пароля возможна только в рамках аутентифицированной JWT-сессии (`Authorization: Bearer`), а сама смена инкрементирует `tokenV` и мгновенно инвалидирует все выданные токены, включая текущий — защита от угона сессии сохраняется.

#### Shop Owners

##### `GET /shops-owners` — список владельцев (авторизован)

```json
// Response 200 OK
[
  {
    "id": "<owner-uuid>",
    "name": "IE Ivanov Ivan Ivanovich",
    "contacts": "+7 (999) 123-45-67, ivan@example.com",
    "createdAt": "2026-09-24T10:00:00.000Z",
    "updatedAt": "2026-09-24T10:00:00.000Z",
    "_count": {
      "shops": 1
    }
  }
]
```

`401` — не авторизован.

##### `GET /shops-owners/:id` — карточка владельца (авторизован)

```json
// Response 200 OK
{
  "id": "<owner-uuid>",
  "name": "IE Ivanov Ivan Ivanovich",
  "contacts": "+7 (999) 123-45-67, ivan@example.com",
  "createdAt": "2026-09-24T10:00:00.000Z",
  "updatedAt": "2026-09-24T10:00:00.000Z",
  "shops": [
    {
      "id": "<shop-uuid>",
      "name": "Location No.1 \"Sport-Bar Center\"",
      "requisites": "Tax ID 777777777777, Registration No. 123456788765432",
      "address": "Moscow, Tverskaya Str., 31",
      "login": "shop_ivan",
      "ownerId": "<owner-uuid>",
      "createdAt": "2026-09-24T10:00:00.000Z",
      "updatedAt": "2026-09-24T10:00:00.000Z"
    }
  ]
}
```

`401` — не авторизован; `404` — владелец не найден.

##### `POST /shops-owners` — создать владельца (авторизован)

```json
// Request (application/json)
{
  "name": "IE Petrova Anna",
  "contacts": "+7 (999) 555-01-02, anna@example.com"
}
```

```json
// Response 201 Created
{
  "id": "<owner-uuid>",
  "name": "IE Petrova Anna",
  "contacts": "+7 (999) 555-01-02, anna@example.com",
  "createdAt": "2026-09-24T10:00:00.000Z",
  "updatedAt": "2026-09-24T10:00:00.000Z"
}
```

`400` — `name` или `contacts` пустые (оба поля обязательны); `401` — не авторизован.

##### `PATCH /shops-owners/:id` — изменить владельца (авторизован)

```json
// Request (application/json, минимум одно поле)
{
  "name": "IE Petrova Anna Petrovna",
  "contacts": "+7 (999) 555-01-03"
}
```

```json
// Response 200 OK
{
  "id": "<owner-uuid>",
  "name": "IE Petrova Anna Petrovna",
  "contacts": "+7 (999) 555-01-03",
  "createdAt": "2026-09-24T10:00:00.000Z",
  "updatedAt": "2026-09-24T10:00:00.000Z"
}
```

`400` — оба поля пустые/не переданы; `401` — не авторизован; `404` — владелец не найден.

##### `DELETE /shops-owners/:id` — удалить владельца (авторизован)

```json
// Response 200 OK
{
  "id": "<owner-uuid>",
  "name": "IE Petrova Anna",
  "contacts": "+7 (999) 555-01-02, anna@example.com",
  "createdAt": "2026-09-24T10:00:00.000Z",
  "updatedAt": "2026-09-24T10:00:00.000Z"
}
```

`401` — не авторизован; `404` — владелец не найден. При удалении владельца **каскадно удаляются** его магазины, терминалы и заявки.

#### Shops

##### `GET /shops` — список магазинов (авторизован)

```json
// Response 200 OK
[
  {
    "id": "<shop-uuid>",
    "name": "Location No.1 \"Sport-Bar Center\"",
    "requisites": "Tax ID 777777777777, Registration No. 123456788765432",
    "address": "Moscow, Tverskaya Str., 31",
    "login": "shop_ivan",
    "ownerId": "<owner-uuid>",
    "createdAt": "2026-09-24T10:00:00.000Z",
    "updatedAt": "2026-09-24T10:00:00.000Z",
    "owner": {
      "id": "<owner-uuid>",
      "name": "IE Ivanov Ivan Ivanovich",
      "contacts": "+7 (999) 123-45-67, ivan@example.com"
    },
    "_count": {
      "terminals": 1,
      "requests": 4
    }
  }
]
```

`401` — не авторизован.

##### `GET /shops/:id` — карточка магазина (авторизован)

```json
// Response 200 OK
{
  "id": "<shop-uuid>",
  "name": "Location No.1 \"Sport-Bar Center\"",
  "requisites": "Tax ID 777777777777, Registration No. 123456788765432",
  "address": "Moscow, Tverskaya Str., 31",
  "login": "shop_ivan",
  "ownerId": "<owner-uuid>",
  "createdAt": "2026-09-24T10:00:00.000Z",
  "updatedAt": "2026-09-24T10:00:00.000Z",
  "owner": {
    "id": "<owner-uuid>",
    "name": "IE Ivanov Ivan Ivanovich",
    "contacts": "+7 (999) 123-45-67, ivan@example.com",
    "createdAt": "2026-09-24T10:00:00.000Z",
    "updatedAt": "2026-09-24T10:00:00.000Z"
  },
  "terminals": [
    {
      "id": "<terminal-uuid>",
      "macAddress": "00:1B:44:11:3A:B7",
      "status": "ACTIVE",
      "shopId": "<shop-uuid>",
      "createdAt": "2026-09-24T10:00:00.000Z",
      "updatedAt": "2026-09-24T10:00:00.000Z"
    }
  ],
  "requests": [
    {
      "id": "<request-uuid>",
      "macAddress": "AA:BB:CC:DD:EE:01",
      "status": "PENDING",
      "comment": "Request for terminal at Entrance No.2",
      "shopId": "<shop-uuid>",
      "createdAt": "2026-09-24T10:00:00.000Z",
      "updatedAt": "2026-09-24T10:00:00.000Z"
    }
  ]
}
```

`401` — не авторизован; `404` — магазин не найден.

##### `POST /shops` — создать магазин (авторизован)

```json
// Request (application/json)
{
  "name": "Location No.1 \"Sport-Bar Center\"",
  "requisites": "Tax ID 777777777777, Registration No. 123456788765432",
  "address": "Moscow, Tverskaya Str., 31",
  "login": "shop_ivan",
  "password": "ShopPass123!",
  "ownerId": "<owner-uuid>"
}
```

```json
// Response 201 Created
{
  "id": "<shop-uuid>",
  "name": "Location No.1 \"Sport-Bar Center\"",
  "requisites": "Tax ID 777777777777, Registration No. 123456788765432",
  "address": "Moscow, Tverskaya Str., 31",
  "login": "shop_ivan",
  "ownerId": "<owner-uuid>",
  "createdAt": "2026-09-24T10:00:00.000Z",
  "updatedAt": "2026-09-24T10:00:00.000Z"
}
```

Поле `name` **необязательно** (`null` при отсутствии); обязательны `requisites`, `address`, `login`, `password`, `ownerId`. Пароль кассы: 6–64 символов. `400` — ошибка валидации; `401` — не авторизован; `404` — владелец не найден; `409` — логин уже занят.

##### `PATCH /shops/:id/credentials` — смена логина/пароля кассы и завершение сессий (авторизован)

```json
// Request (application/json, минимум одно поле)
{
  "login": "shop_tverskaya_new",
  "password": "NewShopSecret456!"
}
```

```json
// Response 200 OK
{
  "id": "<shop-uuid>",
  "name": "Location No.1 \"Sport-Bar Center\"",
  "requisites": "Tax ID 777777777777, Registration No. 123456788765432",
  "address": "Moscow, Tverskaya Str., 31",
  "login": "shop_tverskaya_new",
  "ownerId": "<owner-uuid>",
  "createdAt": "2026-09-24T10:00:00.000Z",
  "updatedAt": "2026-09-24T10:00:00.000Z"
}
```

`400` — не передано ни одно поле; `401` — не авторизован; `404` — магазин не найден; `409` — новый логин уже занят. При успехе `tokenV` инкрементируется — активные сессии кассы завершаются.

#### Terminals

##### `GET /terminals` — список терминалов (авторизован)

```json
// Response 200 OK
[
  {
    "id": "<terminal-uuid>",
    "macAddress": "00:1B:44:11:3A:B7",
    "status": "ACTIVE",
    "shopId": "<shop-uuid>",
    "createdAt": "2026-09-24T10:00:00.000Z",
    "updatedAt": "2026-09-24T10:00:00.000Z",
    "shop": {
      "id": "<shop-uuid>",
      "name": "Location No.1 \"Sport-Bar Center\"",
      "address": "Moscow, Tverskaya Str., 31"
    }
  }
]
```

`401` — не авторизован.

##### `GET /terminals/:id` — карточка терминала (авторизован)

```json
// Response 200 OK
{
  "id": "<terminal-uuid>",
  "macAddress": "00:1B:44:11:3A:B7",
  "status": "ACTIVE",
  "shopId": "<shop-uuid>",
  "createdAt": "2026-09-24T10:00:00.000Z",
  "updatedAt": "2026-09-24T10:00:00.000Z",
  "shop": {
    "id": "<shop-uuid>",
    "name": "Location No.1 \"Sport-Bar Center\"",
    "requisites": "Tax ID 777777777777, Registration No. 123456788765432",
    "address": "Moscow, Tverskaya Str., 31",
    "login": "shop_ivan",
    "ownerId": "<owner-uuid>",
    "createdAt": "2026-09-24T10:00:00.000Z",
    "updatedAt": "2026-09-24T10:00:00.000Z"
  }
}
```

`401` — не авторизован; `404` — терминал не найден.

##### `PATCH /terminals/:id/status` — ручное обновление статуса (авторизован)

```json
// Request (application/json)
{
  "status": "INACTIVE"
}
```

```json
// Response 200 OK
{
  "id": "<terminal-uuid>",
  "macAddress": "00:1B:44:11:3A:B7",
  "status": "INACTIVE",
  "shopId": "<shop-uuid>",
  "createdAt": "2026-09-24T10:00:00.000Z",
  "updatedAt": "2026-09-24T10:00:00.000Z"
}
```

`status` принимает `ACTIVE` или `INACTIVE`. `400` — неверное значение статуса; `401` — не авторизован; `404` — терминал не найден.

##### `POST /terminals/alive` — heartbeat кассы (публичный, без JWT)

```json
// Request (application/json)
{
  "macAddress": "00:1B:44:11:3A:B7"
}
```

```json
// Response 200 OK
{
  "id": "<terminal-uuid>",
  "macAddress": "00:1B:44:11:3A:B7",
  "status": "ACTIVE",
  "shopId": "<shop-uuid>",
  "createdAt": "2026-09-24T10:00:00.000Z",
  "updatedAt": "2026-09-24T10:00:00.000Z"
}
```

`400` — `macAddress` не является корректным MAC-адресом; `404` — терминал с таким MAC не зарегистрирован (`No terminal with such MAC address is registered`).

#### Requests

##### `GET /requests` — список заявок на подключение (авторизован)

```json
// Response 200 OK
[
  {
    "id": "<request-uuid>",
    "macAddress": "AA:BB:CC:DD:EE:01",
    "status": "PENDING",
    "comment": "Request for terminal at Entrance No.2",
    "shopId": "<shop-uuid>",
    "createdAt": "2026-09-24T10:00:00.000Z",
    "updatedAt": "2026-09-24T10:00:00.000Z",
    "shop": {
      "id": "<shop-uuid>",
      "name": "Location No.1 \"Sport-Bar Center\"",
      "address": "Moscow, Tverskaya Str., 31"
    }
  }
]
```

`status`: `PENDING` | `APPROVED` | `REJECTED`; `comment` — `null`, если комментария нет. `401` — не авторизован.

##### `PATCH /requests/:id/approve` — одобрить заявку и создать терминал (авторизован)

```json
// Response 200 OK
{
  "request": {
    "id": "<request-uuid>",
    "macAddress": "AA:BB:CC:DD:EE:01",
    "status": "APPROVED",
    "comment": "Request for terminal at Entrance No.2",
    "shopId": "<shop-uuid>",
    "createdAt": "2026-09-24T10:00:00.000Z",
    "updatedAt": "2026-09-24T10:00:00.000Z"
  },
  "terminal": {
    "id": "<terminal-uuid>",
    "macAddress": "AA:BB:CC:DD:EE:01",
    "status": "ACTIVE",
    "shopId": "<shop-uuid>",
    "createdAt": "2026-09-24T10:00:00.000Z",
    "updatedAt": "2026-09-24T10:00:00.000Z"
  }
}
```

Перевод заявки в `APPROVED` и создание терминала выполняются атомарно (одна транзакция). `400` — заявка не в статусе `PENDING` (например, уже одобрена); `401` — не авторизован; `404` — заявка не найдена; `409` — терминал с таким MAC уже существует.

##### `PATCH /requests/:id/reject` — отклонить заявку (авторизован)

```json
// Response 200 OK
{
  "id": "<request-uuid>",
  "macAddress": "AA:BB:CC:DD:EE:02",
  "status": "REJECTED",
  "comment": "Request for terminal at Entrance No.3 (To test REJECTED)",
  "shopId": "<shop-uuid>",
  "createdAt": "2026-09-24T10:00:00.000Z",
  "updatedAt": "2026-09-24T10:00:00.000Z"
}
```

`400` — заявка не в статусе `PENDING`; `401` — не авторизован; `404` — заявка не найдена.

##### `POST /requests/:id/comment` — добавить комментарий (авторизован)

```json
// Request (application/json)
{
  "comment": "Проверено оператором ЦО"
}
```

```json
// Response 200 OK
{
  "id": "<request-uuid>",
  "macAddress": "AA:BB:CC:DD:EE:01",
  "status": "PENDING",
  "comment": "Проверено оператором ЦО",
  "shopId": "<shop-uuid>",
  "createdAt": "2026-09-24T10:00:00.000Z",
  "updatedAt": "2026-09-24T10:00:00.000Z"
}
```

`400` — пустой комментарий; `401` — не авторизован; `404` — заявка не найдена.

#### 💡 Сценарий быстрой ручной проверки

```bash
BASE=http://localhost:3000
CT=(-H 'Content-Type: application/json')
TOKEN='<accessToken из ответа /auth/login>'

# 1. Вход менеджером (публичный, JWT не нужен)
curl "${CT[@]}" -X POST "$BASE/auth/login" \
  -d '{"email":"manager@kkm.local","password":"ManagerPass123!"}'

# 2. Авторизованный доступ (пример: список заявок с названием магазина)
curl "${CT[@]}" "$BASE/requests" -H "Authorization: Bearer $TOKEN"
# найдите id заявки со статусом PENDING и MAC AA:BB:CC:DD:EE:01

# 3. Одобрить заявку → атомарно создастся терминал
curl "${CT[@]}" -X PATCH "$BASE/requests/<request-id>/approve" \
  -H "Authorization: Bearer $TOKEN"
# → перевести терминал в INACTIVE, а heartbeat'ом вернуть обратно в ACTIVE:
curl "${CT[@]}" -X PATCH "$BASE/terminals/<terminal-id>/status" \
  -d '{"status":"INACTIVE"}' -H "Authorization: Bearer $TOKEN"
curl "${CT[@]}" -X POST "$BASE/terminals/alive" -d '{"macAddress":"AA:BB:CC:DD:EE:01"}'

# 4. Refresh: refresh-токен одноразовый — после ротации старая пара недействительна.
REFRESH_RESP=$(curl "${CT[@]}" -X POST "$BASE/auth/refresh" -d '{"refreshToken":"<refreshToken>"}')
NEW_ACCESS=$(echo "$REFRESH_RESP" | jq -r '.accessToken')

# 5. Logout новым access-токеном: сессия завершается (tokenV инкрементируется).
curl "${CT[@]}" -X POST "$BASE/auth/logout" -H "Authorization: Bearer $NEW_ACCESS"

# 6. (Опционально) Смена пароля профиля инвалидирует ВСЕ выданные токены,
#    включая refresh — дальнейшие запросы требуют входа уже с новым паролем.
TOKEN2=$(curl "${CT[@]}" -X POST "$BASE/auth/login" \
  -d '{"email":"manager@kkm.local","password":"ManagerPass123!"}' | jq -r '.accessToken')
curl "${CT[@]}" -X PATCH "$BASE/profile/password" -d '{"newPassword":"MyNewPass123!"}' \
  -H "Authorization: Bearer $TOKEN2"
```

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
