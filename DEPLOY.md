# Guia de Deploy

## Configuração para Railway

### 1. Setup do Banco de Dados

1. **Adicione o plugin PostgreSQL** ao seu projeto no Railway:
   - No dashboard do Railway, clique em "New" → "Database" → "Add PostgreSQL"
   - O Railway irá fornecer automaticamente a variável `DATABASE_URL`

### 2. Variáveis de Ambiente OBRIGATÓRIAS

Configure as seguintes variáveis de ambiente no Railway (Settings → Variables):

- **`DATABASE_URL`**: Já configurada automaticamente pelo plugin PostgreSQL
- **`NEXTAUTH_URL`**: URL da sua aplicação no Railway
  - Exemplo: `https://your-app-name.up.railway.app`
  - ⚠️ **IMPORTANTE**: Use a URL exata fornecida pelo Railway (verifique em Settings → Domains)
- **`NEXTAUTH_SECRET`**: Chave secreta para NextAuth
  - Gere uma com: `openssl rand -base64 32`
  - Ou use um gerador online: https://generate-secret.vercel.app/32

### 3. Setup Inicial do Banco de Dados

Após configurar as variáveis de ambiente, você precisa executar as migrações e o seed:

**Opção A: Via Railway CLI (Recomendado)**
```bash
# Instale o Railway CLI
npm i -g @railway/cli

# Faça login
railway login

# Conecte ao projeto
railway link

# Execute as migrações
railway run npm run db:push

# Execute o seed
railway run npm run db:seed
```

**Opção B: Via Railway Dashboard**
1. Vá para o seu serviço no Railway
2. Clique em "Deployments" → "Latest Deployment"
3. Abra o terminal/console
4. Execute:
   ```bash
   npm run db:push
   npm run db:seed
   ```

### 4. Credenciais do Admin

Após executar o seed, use estas credenciais para fazer login:

- **Email**: `admin@example.com`
- **Password**: `admin123`

⚠️ **IMPORTANTE**: Altere a palavra-passe do admin após o primeiro login!

### 5. Build e Deploy

O Railway irá automaticamente:
1. Detectar que é um projeto Next.js
2. Instalar dependências (`npm install`)
3. Executar o build (`npm run build`)
4. Iniciar a aplicação (`npm start`)

⚠️ **IMPORTANTE**: Certifique-se de que configurou todas as variáveis de ambiente ANTES do deploy, caso contrário o healthcheck irá falhar!

### 6. Troubleshooting

**Problema: Healthcheck falha**
- Verifique se todas as variáveis de ambiente estão configuradas
- Verifique se o `NEXTAUTH_URL` está correto (deve ser a URL exata do Railway)
- Verifique os logs do Railway para ver erros específicos

**Problema: Erro de conexão com banco de dados**
- Verifique se o plugin PostgreSQL está adicionado
- Verifique se a variável `DATABASE_URL` está configurada
- Execute `npm run db:push` para criar as tabelas

### 7. Verificação

Após o deploy e configuração do banco de dados, acesse:
- Aplicação: `https://your-app-name.up.railway.app`
- Login admin: Use as credenciais acima (`admin@example.com` / `admin123`)

## Desenvolvimento Local

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure o `.env`:
   ```bash
   cp .env.example .env
   ```
   Edite o `.env` com as suas configurações locais.

3. Configure o banco de dados:
   ```bash
   npm run db:push
   npm run db:seed
   ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

5. Acesse `http://localhost:3000`

