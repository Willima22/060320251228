# Sistema de Pesquisas

Sistema de gerenciamento de pesquisas desenvolvido com React, TypeScript e Supabase.

## Requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase
- Conta no Coolify (para deploy)

## Configuração do Ambiente

1. Clone o repositório:
```bash
git clone https://github.com/Willima22/060320251228.git
cd 060320251228
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
- Copie o arquivo `.env.example` para `.env`
- Preencha as variáveis com suas credenciais do Supabase

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## Deploy no Coolify

1. Certifique-se de que todos os arquivos de deploy estão presentes:
   - `Dockerfile`
   - `nginx.conf`
   - `.dockerignore`

2. No Coolify:
   - Crie uma nova aplicação
   - Selecione o repositório
   - Configure o método de build como `Dockerfile`
   - Configure a porta como `80`
   - Adicione as variáveis de ambiente:
     ```
     VITE_SUPABASE_URL=sua_url_do_supabase
     VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
     ```
   - Clique em "Deploy"

## Estrutura do Projeto

```
src/
  ├── components/     # Componentes reutilizáveis
  ├── pages/         # Páginas da aplicação
  ├── store/         # Gerenciamento de estado
  ├── types/         # Definições de tipos
  └── lib/           # Utilitários e configurações
```

## Tecnologias Utilizadas

- React
- TypeScript
- Vite
- Supabase
- TailwindCSS
- Zustand 