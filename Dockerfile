# 1. Берем Linux с Node.js версии 20
FROM node:20-alpine

# 2. Создаем папку приложения внутри контейнера
WORKDIR /app

# 3. Копируем файлы зависимостей (package.json и lock файл)
COPY package*.json ./

# 4. Скачиваем библиотеки
RUN npm install

# 5. Копируем весь остальной код проекта
COPY . .

# 6. Генерируем Prisma Client (для Linux)
RUN npx prisma generate

# 7. Собираем проект (TypeScript -> JavaScript)
RUN npm run build

# 8. Открываем порт
EXPOSE 3000

# 9. Команда запуска (будет переопределена в docker-compose, но пусть будет)
CMD ["node", "dist/main"]