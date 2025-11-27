# Guia de Deploy

## Configuração para Railway

### 1. Variáveis de Ambiente

Configure as seguintes variáveis de ambiente no Railway:

- `DATABASE_URL`: URL de conexão PostgreSQL (fornecida automaticamente pelo Railway se usar o plugin PostgreSQL)
- `NEXTAUTH_URL`: URL da sua aplicação (ex: `https://your-app.railway.app`)
- `NEXTAUTH_SECRET`: Chave secreta para NextAuth (gere uma com: `openssl rand -base64 32`)

### 2. Setup do Banco de Dados

1. Adicione o plugin PostgreSQL ao seu projeto no Railway
2. O Railway irá fornecer automaticamente a variável `DATABASE_URL`
3. Execute as migrações:
   ```bash
   npm run db:push
   ```
   Ou crie uma migração:
   ```bash
   npm run db:migrate
   ```

### 4. Seed do Banco de Dados

Execute o script de seed para criar o utilizador admin inicial:

```bash
npm run db:seed
```

**Credenciais padrão do admin:**
- Email: `admin@example.com`
- Password: `admin123`

⚠️ **IMPORTANTE**: Altere a palavra-passe do admin após o primeiro login!

### 5. Build e Deploy

O Railway irá automaticamente:
1. Detectar que é um projeto Next.js
2. Instalar dependências (`npm install`)
3. Executar o build (`npm run build`)
4. Iniciar a aplicação (`npm start`)

### 6. Verificação

Após o deploy, acesse:
- Aplicação: `https://your-app.railway.app`
- Login admin: Use as credenciais acima

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

