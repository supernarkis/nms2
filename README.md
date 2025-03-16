# Minimalist Notes System

Минималистичное веб-приложение для создания и управления заметками, вдохновленное Telegraph.

## Особенности
- Создание и редактирование заметок с автосохранением
- Поиск по заметкам (строгий и нечёткий)
- Адаптивный дизайн для мобильных устройств
- Свайп для открытия меню на мобильных устройствах
- Минималистичный интерфейс

## Технологии
- Frontend: React
- Backend: Flask
- База данных: SQLite
- API: RESTful

## Настройка окружения

1. Скопируйте `.env.example` в `.env`:
```bash
cp .env.example .env
```

2. Настройте переменные окружения в `.env`:
- `GOOGLE_CLIENT_ID`: ID вашего Google OAuth приложения
- `JWT_SECRET`: Сгенерируйте случайную строку для подписи JWT токенов
- `FLASK_ENV`: `development` для разработки, `production` для продакшена

## Установка

### Backend

```bash
# Создание виртуального окружения
python -m venv env
source env/bin/activate  # для Linux/Mac
env\Scripts\activate     # для Windows

# Установка зависимостей
pip install -r requirements.txt

# Запуск сервера
python app.py
```

### Frontend

```bash
cd frontend

# Установка зависимостей
npm install

# Запуск в режиме разработки
npm start

# Сборка для продакшена
npm run build
```

## Деплой

### Настройка на сервере

1. Установите необходимые пакеты:
```bash
sudo apt update
sudo apt install python3-venv nginx
```

2. Настройте Nginx:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /path/to/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

3. Настройте systemd сервис для бэкенда:
```ini
[Unit]
Description=Notes App Backend
After=network.target

[Service]
User=your-user
WorkingDirectory=/path/to/backend
Environment="PATH=/path/to/backend/env/bin"
ExecStart=/path/to/backend/env/bin/python app.py

[Install]
WantedBy=multi-user.target
```

## Автодеплой

Используйте GitHub Actions для автоматического деплоя при пуше в main ветку.
Конфигурация находится в `.github/workflows/deploy.yml`

## Использование

После запуска приложения:
- Бэкенд будет доступен по адресу: http://localhost:5000
- Фронтенд будет доступен по адресу: http://localhost:5173

## Функциональность

- Создание заметок с заголовком и содержанием
- Просмотр всех заметок
- Поиск по заметкам
- Удаление заметок

## Безопасность

- Все API эндпоинты защищены JWT токенами
- Токены хранятся в HttpOnly куках
- Используется механизм refresh token для продления сессии
- Secure и SameSite=Strict для защиты от CSRF атак

## Запуск

### Backend
```bash
python backend/app.py
```

### Frontend
```bash
cd frontend
npm run dev
```

## Автодеплой

1. Убедитесь, что все переменные окружения настроены на сервере
2. JWT_SECRET должен быть надежным и уникальным для каждого окружения
3. В продакшене используйте HTTPS для безопасной передачи кук 