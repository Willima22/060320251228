# Build stage
FROM node:18.17-alpine3.17 as builder

WORKDIR /app

# Definir variáveis de ambiente para o build
ENV VITE_SUPABASE_URL=https://iqqtecondicfclncwjio.supabase.co
ENV VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxcXRlY29uZGljZmNsbmN3amlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyNzM3OTMsImV4cCI6MjA1Njg0OTc5M30.c83RWUSzxgfJwcM6t44vWQqjgjlVu3PhtFho4X9bzfo

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Construir a aplicação
RUN npm run build

# Production stage
FROM nginx:1.24-alpine

# Copiar os arquivos construídos
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 