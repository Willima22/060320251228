# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Construir a aplicação
RUN npm run build

# Production stage
FROM nginx:alpine

# Copiar os arquivos construídos
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuração do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta 80
EXPOSE 80

# Iniciar nginx
CMD ["nginx", "-g", "daemon off;"] 