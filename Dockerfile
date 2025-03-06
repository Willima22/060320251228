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

# Criar diretório para logs
RUN mkdir -p /var/log/nginx

# Dar permissões corretas
RUN chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Mudar para o usuário nginx
USER nginx

# Expor a porta que o Coolify fornecerá
ENV PORT=80
EXPOSE $PORT

# Iniciar nginx com a porta dinâmica
CMD sed -i -e 's/$PORT/'"$PORT"'/g' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;' 