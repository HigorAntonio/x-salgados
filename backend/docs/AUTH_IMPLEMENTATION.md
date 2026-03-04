# Sistema de Autenticação - X Salgados API

Este documento descreve a implementação do sistema de autenticação usando Supabase e Zod.

## 📋 Arquivos Criados

### 1. **authSchemas.js** (`src/schemas/authSchemas.js`)

Define os schemas de validação usando Zod para registro e login:

- `registerSchema`: Valida email, password e role (ADMIN, COMPRADOR ou MOTORISTA)
- `loginSchema`: Valida email e password

### 2. **authController.js** (`src/controllers/authController.js`)

Contém a lógica de negócio para autenticação:

- `register`: Registra novo usuário no Supabase Auth e na tabela local
- `login`: Autentica usuário e retorna sessão com tokens
- `logout`: Finaliza a sessão do usuário

### 3. **authRoutes.js** (`src/routes/authRoutes.js`)

Define as rotas HTTP para autenticação:

- `POST /auth/register`: Registro de novo usuário
- `POST /auth/login`: Login de usuário existente
- `POST /auth/logout`: Logout de usuário autenticado

### 4. **supabase.js** (`src/config/supabase.js`)

Configura e exporta o cliente Supabase para uso na aplicação.

## 🚀 Configuração

### 1. Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure as variáveis do Supabase:

```bash
cp .env.example .env
```

No arquivo `.env`, adicione suas credenciais do Supabase:

```env
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="your-anon-key-here"
```

Para obter essas credenciais:

1. Acesse [https://app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie a **URL** e a **anon/public key**

### 2. Executar Migrações

Certifique-se de que o banco de dados está configurado:

```bash
npm run migrate
```

### 3. Iniciar o Servidor

```bash
npm run dev
```

## 📡 Endpoints da API

### 1. Registro de Usuário

**Endpoint:** `POST /auth/register`

**Body:**

```json
{
  "email": "cliente@example.com",
  "password": "senha123",
  "role": "COMPRADOR"
}
```

**Roles aceitos:**

- `ADMIN`: Administrador do sistema
- `COMPRADOR`: Cliente que realiza pedidos
- `MOTORISTA`: Motorista que realiza entregas

**Resposta de Sucesso (201):**

```json
{
  "message": "Usuário registrado com sucesso",
  "user": {
    "id": 1,
    "email": "cliente@example.com",
    "role": "COMPRADOR",
    "supabase_id": "uuid-from-supabase",
    "created_at": "2026-03-03T10:00:00.000Z"
  },
  "session": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_at": 1234567890,
    "expires_in": 3600
  }
}
```

**Erros Possíveis:**

- `400`: Erro de validação (email inválido, senha curta, role inválido)
- `500`: Erro ao criar usuário no Supabase ou banco local

---

### 2. Login de Usuário

**Endpoint:** `POST /auth/login`

**Body:**

```json
{
  "email": "cliente@example.com",
  "password": "senha123"
}
```

**Resposta de Sucesso (200):**

```json
{
  "message": "Login realizado com sucesso",
  "user": {
    "id": 1,
    "email": "cliente@example.com",
    "role": "COMPRADOR",
    "supabase_id": "uuid-from-supabase",
    "created_at": "2026-03-03T10:00:00.000Z",
    "updated_at": "2026-03-03T10:00:00.000Z"
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "...",
    "expires_at": 1234567890,
    "expires_in": 3600
  }
}
```

**Erros Possíveis:**

- `400`: Erro de validação (email inválido, senha vazia)
- `401`: Credenciais inválidas
- `404`: Usuário não encontrado no banco local
- `500`: Erro interno do servidor

---

### 3. Logout de Usuário

**Endpoint:** `POST /auth/logout`

**Headers:**

```
Authorization: Bearer <access_token>
```

**Resposta de Sucesso (200):**

```json
{
  "message": "Logout realizado com sucesso"
}
```

**Erros Possíveis:**

- `401`: Token não fornecido ou inválido
- `500`: Erro ao finalizar sessão no Supabase

## 🔐 Fluxo de Autenticação

### Registro (Register)

1. Cliente envia `email`, `password` e `role`
2. Sistema valida os dados com Zod
3. Cria usuário no **Supabase Auth** (gerenciamento de senhas)
4. Insere registro correspondente na tabela `users` do banco local
5. Retorna dados do usuário e sessão (tokens)

### Login

1. Cliente envia `email` e `password`
2. Sistema valida os dados com Zod
3. Autentica via **Supabase Auth**
4. Busca dados complementares (role, etc.) na tabela `users` local
5. Retorna dados do usuário e tokens de sessão

### Logout

1. Cliente envia token no header `Authorization: Bearer <token>`
2. Sistema finaliza a sessão no **Supabase Auth**
3. Cliente deve descartar os tokens armazenados

## 🛡️ Validação com Zod

As validações são feitas automaticamente nos controllers:

**Email:**

- Deve ser um email válido
- Convertido para lowercase
- Espaços removidos (trim)

**Password:**

- Mínimo 6 caracteres
- Máximo 100 caracteres

**Role:**

- Deve ser exatamente: `ADMIN`, `COMPRADOR` ou `MOTORISTA`

## 🧪 Testando a API

### Usando cURL

**Registro:**

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "senha123",
    "role": "COMPRADOR"
  }'
```

**Login:**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "senha123"
  }'
```

**Logout:**

```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Usando Swagger

Acesse a documentação interativa em:

```
http://localhost:3000/api-docs
```

## 📝 Notas Importantes

1. **Senhas:** São gerenciadas pelo Supabase Auth. No banco local, armazenamos apenas `'supabase_managed'` como placeholder.

2. **Sincronização:** O `email` é a chave que conecta o usuário do Supabase com o registro local. Certifique-se de que ambos sempre estejam sincronizados.

3. **Tokens:** O `access_token` retornado deve ser incluído no header `Authorization: Bearer <token>` em futuras requisições protegidas.

4. **Migration:** A tabela `users` usa ID incremental local. O UUID do Supabase pode ser armazenado em uma coluna adicional se necessário para sincronização futura.

## 🔄 Próximos Passos

- [ ] Implementar middleware de autenticação para proteger rotas
- [ ] Adicionar refresh token automático
- [ ] Implementar recuperação de senha
- [ ] Adicionar verificação de email
- [ ] Criar testes unitários e de integração
