# Guia de Instalação no Portainer

## 1. Pré-requisitos
- Docker instalado no servidor
- Acesso ao servidor via SSH
- Credenciais do Supabase (URL e Chave Anônima)

## 2. Instalação do Portainer

### 2.1. Conecte-se ao servidor via SSH
```bash
ssh usuario@seu_servidor
```

### 2.2. Instale o Portainer
```bash
# Crie um volume para persistir os dados
docker volume create portainer_data

# Instale o Portainer
docker run -d -p 8000:8000 -p 9443:9443 --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

## 3. Configuração Inicial do Portainer

1. Acesse o Portainer em seu navegador:
   ```
   https://seu_ip:9443
   ```

2. Crie sua senha de administrador
3. Faça login com as credenciais criadas
4. Selecione "Get Started" e depois "Local Environment"

## 4. Deploy da Aplicação

### 4.1. Preparação dos Arquivos
Certifique-se de que você tem os seguintes arquivos em seu projeto:
- `Dockerfile`
- `docker-compose.yml`
- `nginx.conf`
- `.env` (com suas variáveis do Supabase)

### 4.2. Deploy via Portainer

1. No menu lateral, clique em "Stacks"
2. Clique no botão "+ Add stack"
3. Preencha os campos:
   - Name: `survey-system`
   - Build method: Selecione "Upload"

4. Faça upload dos arquivos necessários:
   - Selecione o arquivo `docker-compose.yml`
   - Adicione as variáveis de ambiente:
     ```
     VITE_SUPABASE_URL=sua_url_do_supabase
     VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
     ```

5. Clique em "Deploy the stack"

## 5. Verificação do Deploy

1. Aguarde o processo de build e deploy finalizar
2. No menu lateral, vá para "Containers"
3. Verifique se o container `survey-app` está com status "Running"
4. Acesse sua aplicação:
   ```
   http://seu_ip
   ```

## 6. Monitoramento e Manutenção

### 6.1. Visualizar Logs
1. Vá para "Containers"
2. Clique no container `survey-app`
3. Clique na aba "Logs"

### 6.2. Reiniciar a Aplicação
1. Vá para "Containers"
2. Encontre o container `survey-app`
3. Clique no botão de restart (ícone circular)

### 6.3. Atualizar a Aplicação
1. Vá para "Stacks"
2. Encontre a stack `survey-system`
3. Clique em "Editor"
4. Faça as alterações necessárias
5. Clique em "Deploy the stack"

## 7. Backup e Segurança

### 7.1. Backup do Portainer
```bash
# Backup do volume do Portainer
docker run --rm -v portainer_data:/data -v /path/to/backup:/backup alpine tar -czf /backup/portainer_backup.tar.gz /data
```

### 7.2. Recomendações de Segurança
1. Mantenha o Portainer atualizado
2. Use HTTPS em produção
3. Configure um firewall (UFW)
4. Faça backups regulares
5. Monitore os logs regularmente

## 8. Troubleshooting

### 8.1. Container não inicia
1. Verifique os logs do container
2. Confirme se as variáveis de ambiente estão corretas
3. Verifique se as portas não estão em uso

### 8.2. Não consegue acessar a aplicação
1. Verifique se o container está rodando
2. Confirme se as portas estão expostas corretamente
3. Verifique o firewall do servidor

### 8.3. Problemas com as variáveis de ambiente
1. Verifique o arquivo `.env`
2. Confirme se as variáveis estão definidas no Portainer
3. Reinicie o container após alterações

## 9. Comandos Úteis

```bash
# Verificar logs do container
docker logs survey-app

# Reiniciar container
docker restart survey-app

# Verificar status dos containers
docker ps

# Verificar uso de recursos
docker stats
```

## 10. Contatos e Suporte

Em caso de problemas:
1. Verifique a documentação do Portainer: https://docs.portainer.io/
2. Consulte os logs da aplicação
3. Entre em contato com a equipe de suporte 