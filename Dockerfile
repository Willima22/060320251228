# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Copiar arquivos de dependência
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Production stage
FROM nginx:alpine

# Copiar configuração do nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Remover configuração padrão do nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar arquivos de build
COPY --from=build /app/dist /usr/share/nginx/html

# Expor porta 80
EXPOSE 80

# Comando para iniciar o nginx
CMD ["nginx", "-g", "daemon off;"] 