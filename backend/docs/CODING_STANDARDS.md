# Padrões de Código - Backend X Salgados

Este documento define os padrões de escrita de código para o backend do sistema X Salgados, garantindo consistência, manutenibilidade e conformidade com a stack tecnológica definida.

---

## 1. Estilo de Código

### 1.1. Sistema de Módulos

O projeto utiliza **ES Modules (ESM)** como sistema de módulos padrão:

```json
// package.json
{
  "type": "module"
}
```

**Regras:**

- Use `import` e `export` ao invés de `require()` e `module.exports`
- Sempre inclua a extensão `.js` nos imports de arquivos locais
- Use `export default` apenas para o export principal do módulo
- Prefira `named exports` para múltiplas funções ou constantes

**Exemplos:**

```javascript
// ✅ CORRETO
import express from "express";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import knex from "../db.js";

export async function register(req, res) {
  /* ... */
}
export async function login(req, res) {
  /* ... */
}

// ❌ INCORRETO
const express = require("express");
import { authenticate } from "../middlewares/authMiddleware"; // Falta .js
```

### 1.2. Convenções de Nomenclatura

**Variáveis e Funções**: `camelCase`

```javascript
const userData = {...};
const validatedData = schema.parse(req.body);
async function registerUser() { /* ... */ }
```

**Constantes Globais**: `UPPER_SNAKE_CASE`

```javascript
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_PAGE_SIZE = 20;
```

**Classes e Tipos**: `PascalCase` (quando aplicável)

```javascript
class RouteOptimizer {
  /* ... */
}
```

**Arquivos**: `camelCase` para controllers/services, `kebab-case` para migrations

```javascript
// ✅ CORRETO
authController.js
authMiddleware.js
001_initial.js

// ❌ INCORRETO
AuthController.js
auth_middleware.js
```

### 1.3. Funções Assíncronas

**OBRIGATÓRIO**: Use `async/await` para operações assíncronas ao invés de Promises com `.then()`.

```javascript
// ✅ CORRETO
export async function login(req, res) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    return res.status(200).json({ session: data.session });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// ❌ INCORRETO
export function login(req, res) {
  supabase.auth
    .signInWithPassword({ email, password })
    .then((data) => res.json(data))
    .catch((error) => res.status(500).json(error));
}
```

### 1.4. Comentários e Documentação

Use **JSDoc** para documentar funções exportadas:

```javascript
/**
 * Registra um novo usuário no sistema
 *
 * Fluxo:
 * 1. Valida os dados com Zod
 * 2. Cria usuário no Supabase Auth
 * 3. Insere registro na tabela users
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<Object>} Dados do usuário criado
 */
export async function register(req, res) {
  // Implementação...
}
```

**Comentários em linha** devem explicar o "porquê", não o "o quê":

```javascript
// ✅ CORRETO
// Role é sempre COMPRADOR para registro público (segurança)
const role = "COMPRADOR";

// ❌ INCORRETO
// Define role como COMPRADOR
const role = "COMPRADOR";
```

---

## 2. Padrão de Resposta API

Todas as respostas da API devem seguir uma estrutura consistente em JSON.

### 2.1. Resposta de Sucesso

```javascript
// Sucesso com dados
return res.status(200).json({
  message: "Operação realizada com sucesso", // Opcional
  data: {
    id: 1,
    email: "usuario@example.com",
    // ... outros campos
  },
});

// Sucesso sem dados (ex: DELETE)
return res.status(204).send();

// Criação de recurso
return res.status(201).json({
  message: "Recurso criado com sucesso",
  data: { id: 1 /* ... */ },
});
```

### 2.2. Resposta de Erro

```javascript
// Erro de validação (400 Bad Request)
return res.status(400).json({
  error: "Erro de validação",
  details: [
    {
      field: "email",
      message: "Email inválido",
    },
  ],
});

// Erro de autenticação (401 Unauthorized)
return res.status(401).json({
  error: "Token inválido ou expirado",
  message: "Usuário não autenticado",
});

// Erro de autorização (403 Forbidden)
return res.status(403).json({
  error: "Acesso negado",
  message: "Você não tem permissão para acessar este recurso",
});

// Recurso não encontrado (404 Not Found)
return res.status(404).json({
  error: "Recurso não encontrado",
  message: "Pedido com ID 123 não existe",
});

// Erro interno (500 Internal Server Error)
return res.status(500).json({
  error: "Erro interno do servidor",
  message: error.message,
});

// Serviço indisponível (503 Service Unavailable)
return res.status(503).json({
  error: "Serviço de autenticação não disponível",
  message: "Variáveis de ambiente não configuradas",
});
```

### 2.3. Códigos HTTP Padrão

| Código | Uso                                  |
| ------ | ------------------------------------ |
| 200    | Sucesso (GET, PUT, PATCH)            |
| 201    | Recurso criado (POST)                |
| 204    | Sucesso sem conteúdo (DELETE)        |
| 400    | Erro de validação / dados inválidos  |
| 401    | Não autenticado                      |
| 403    | Não autorizado (sem permissão)       |
| 404    | Recurso não encontrado               |
| 500    | Erro interno do servidor             |
| 503    | Serviço temporariamente indisponível |

---

## 3. Camada de Validação (Zod)

**REGRA OBRIGATÓRIA**: Todo endpoint que recebe dados do cliente (`req.body`, `req.params`, `req.query`) DEVE validar com Zod ANTES de qualquer operação no banco de dados.

### 3.1. Estrutura dos Schemas

Schemas devem ser criados em arquivos separados na pasta `src/schemas/`:

```javascript
// src/schemas/authSchemas.js
import { z } from "zod";

/**
 * Schema de validação para registro público
 * Aceita APENAS email e password
 * O role 'COMPRADOR' é automaticamente atribuído no servidor
 */
export const publicRegisterSchema = z
  .object({
    email: z
      .string({
        required_error: "Email é obrigatório",
        invalid_type_error: "Email deve ser uma string",
      })
      .email("Email inválido")
      .toLowerCase()
      .trim(),

    password: z
      .string({
        required_error: "Senha é obrigatória",
        invalid_type_error: "Senha deve ser uma string",
      })
      .min(6, "Senha deve ter no mínimo 6 caracteres")
      .max(100, "Senha deve ter no máximo 100 caracteres"),
  })
  .strict(); // Rejeita campos extras
```

### 3.2. Validação no Controller

```javascript
import { publicRegisterSchema } from "../schemas/authSchemas.js";

export async function register(req, res) {
  try {
    // 1. SEMPRE validar PRIMEIRO com Zod
    const validatedData = publicRegisterSchema.parse(req.body);
    const { email, password } = validatedData;

    // 2. Apenas após validação, realizar operações no banco
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    // ... resto da lógica
  } catch (error) {
    // Tratamento de erro do Zod
    if (error.issues || error.name === "ZodError") {
      return res.status(400).json({
        error: "Erro de validação",
        details: (error.issues || error.errors || []).map((err) => ({
          field: err.path?.join(".") || "unknown",
          message: err.message,
        })),
      });
    }

    // Outros erros
    return res.status(500).json({
      error: "Erro interno",
      message: error.message,
    });
  }
}
```

### 3.3. Boas Práticas Zod

```javascript
// ✅ Mensagens customizadas e claras
z.string({ required_error: "Campo obrigatório" })
  .email("Email inválido")
  .min(5, "Email deve ter no mínimo 5 caracteres");

// ✅ Transformações (lowercase, trim)
z.string().email().toLowerCase().trim();

// ✅ Use .strict() para rejeitar campos extras
z.object({ email: z.string() }).strict();

// ✅ Validações customizadas
z.string().refine(
  (val) => !val.includes("@test.com"),
  "Emails de teste não são permitidos",
);

// ✅ Enums para valores fixos
z.enum(["ADMIN", "MOTORISTA", "COMPRADOR"], {
  errorMap: () => ({ message: "Role inválido" }),
});
```

---

## 4. Camada de Dados (Knex)

### 4.1. Configuração e Conexão

A instância do Knex é exportada de `src/db.js` e deve ser importada em todos os arquivos que acessam o banco:

```javascript
import knex from "../db.js";

const users = await knex("users").select("*");
```

### 4.2. Tipos e Schema da Migration

**IMPORTANTE**: Sempre respeite os tipos definidos na migration principal ([001_initial.js](backend/src/database/migrations/001_initial.js)).

#### Tabelas Principais

**users** (Integrado com Supabase Auth):

```javascript
{
  id: UUID,           // UUID do Supabase Auth (Primary Key)
  email: String,      // Unique, Not Null
  role: Enum,         // 'ADMIN' | 'MOTORISTA' | 'COMPRADOR'
  created_at: Timestamp,
  updated_at: Timestamp
}
```

**produtos**:

```javascript
{
  id: Integer (Auto-increment),
  nome: String,
  descricao: Text,
  preco_venda: Decimal(10, 2),    // Preço em reais
  qtd_estoque: Integer,            // Quantidade em estoque
  volumes_por_unidade: Integer,    // Espaço em caixas padrão
  created_at: Timestamp,
  updated_at: Timestamp
}
```

**pedidos**:

```javascript
{
  id: Integer (Auto-increment),
  cliente_id: UUID,                      // FK -> users.id
  endereco_id: Integer,                  // FK -> enderecos.id
  carregamento_id: Integer (Nullable),   // FK -> carregamentos.id
  total_de_volumes: Integer,             // Calculado
  valor_total: Decimal(10, 2),           // Soma dos itens
  data_entrega: Date,
  status: Enum,  // 'PENDENTE' | 'FATURADO' | 'EM_ROTA' | 'ENTREGUE' | 'CANCELADO'
  created_at: Timestamp,
  updated_at: Timestamp
}
```

**pedido_itens** (Relacionamento N:N entre pedidos e produtos):

```javascript
{
  id: Integer (Auto-increment),
  pedido_id: Integer,        // FK -> pedidos.id (CASCADE)
  produto_id: Integer,       // FK -> produtos.id
  quantidade: Integer,       // Quantidade do produto
  preco_unitario: Decimal(10, 2),  // Snapshot do preço no momento
  subtotal: Decimal(10, 2)   // quantidade * preco_unitario
}
```

### 4.3. Queries: Boas Práticas

**Seleção explícita de campos**:

```javascript
// ✅ CORRETO - Seleciona apenas campos necessários
const user = await knex("users")
  .where({ id: userId })
  .first(["id", "email", "role", "created_at"]);

// ❌ EVITAR - Select * retorna campos desnecessários
const user = await knex("users").where({ id: userId }).first();
```

**Joins**:

```javascript
// ✅ CORRETO - Join explícito com alias
const pedidos = await knex("pedidos as p")
  .join("users as u", "p.cliente_id", "u.id")
  .join("enderecos as e", "p.endereco_id", "e.id")
  .select(
    "p.id",
    "p.valor_total",
    "u.email as cliente_email",
    "e.descricao as endereco",
  )
  .where("p.status", "PENDENTE");
```

**Inserção com returning**:

```javascript
// ✅ CORRETO - Retorna dados inseridos
const [newProduct] = await knex("produtos")
  .insert({
    nome: "Coxinha de Frango",
    preco_venda: 5.5,
    qtd_estoque: 100,
    volumes_por_unidade: 50,
  })
  .returning(["id", "nome", "preco_venda", "created_at"]);
```

**Atualização**:

```javascript
// ✅ CORRETO - Update com where e returning
const [updatedProduct] = await knex("produtos")
  .where({ id: productId })
  .update({
    qtd_estoque: knex.raw("qtd_estoque - ?", [quantidadeVendida]),
    updated_at: knex.fn.now(),
  })
  .returning(["id", "nome", "qtd_estoque"]);
```

### 4.4. Transações

Use transações para operações que modificam múltiplas tabelas:

```javascript
// ✅ CORRETO - Transação manual
export async function createOrder(req, res) {
  const trx = await knex.transaction();

  try {
    // 1. Inserir pedido
    const [pedido] = await trx("pedidos")
      .insert({
        cliente_id: req.user.id,
        endereco_id: validatedData.endereco_id,
        data_entrega: validatedData.data_entrega,
        total_de_volumes: totalVolumes,
        valor_total: valorTotal,
        status: "PENDENTE",
      })
      .returning(["id", "valor_total"]);

    // 2. Inserir itens do pedido
    const itemsData = validatedData.items.map((item) => ({
      pedido_id: pedido.id,
      produto_id: item.produto_id,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      subtotal: item.quantidade * item.preco_unitario,
    }));

    await trx("pedido_itens").insert(itemsData);

    // 3. Atualizar estoque
    for (const item of validatedData.items) {
      await trx("produtos")
        .where({ id: item.produto_id })
        .decrement("qtd_estoque", item.quantidade);
    }

    // 4. Commit da transação
    await trx.commit();

    return res.status(201).json({
      message: "Pedido criado com sucesso",
      data: pedido,
    });
  } catch (error) {
    // Rollback em caso de erro
    await trx.rollback();
    throw error;
  }
}
```

### 4.5. Paginação

Para listagens longas, sempre implemente paginação:

```javascript
// ✅ CORRETO - Paginação com limit/offset
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 20;
const offset = (page - 1) * limit;

const [pedidos, [{ total }]] = await Promise.all([
  knex("pedidos")
    .select("*")
    .limit(limit)
    .offset(offset)
    .orderBy("created_at", "desc"),
  knex("pedidos").count("* as total"),
]);

return res.json({
  data: pedidos,
  pagination: {
    page,
    limit,
    total: parseInt(total),
    pages: Math.ceil(total / limit),
  },
});
```

---

## 5. Segurança e Autenticação

### 5.1. Middleware de Autenticação

O middleware `authenticate` verifica se o usuário está autenticado via token Supabase:

```javascript
import { authenticate } from "../middlewares/authMiddleware.js";

// Rota protegida
router.get("/profile", authenticate, async (req, res) => {
  // req.user contém: { id, email, role, created_at, updated_at }
  return res.json({ user: req.user });
});
```

### 5.2. Middleware de Autorização (RBAC)

O middleware `authorize` verifica se o usuário tem uma das roles permitidas:

```javascript
import { authenticate, authorize } from "../middlewares/authMiddleware.js";

// Acesso apenas para ADMIN
router.post(
  "/admin/register-user",
  authenticate,
  authorize(["ADMIN"]),
  adminRegisterUser,
);

// Acesso para ADMIN ou MOTORISTA
router.get(
  "/carregamentos",
  authenticate,
  authorize(["ADMIN", "MOTORISTA"]),
  getCarregamentos,
);
```

### 5.3. Roles do Sistema

| Role        | Descrição                                          |
| ----------- | -------------------------------------------------- |
| `ADMIN`     | Acesso total: gestão de produtos, rotas e usuários |
| `MOTORISTA` | Acesso às rotas atribuídas e navegação GPS         |
| `COMPRADOR` | Realização de pedidos e consulta de histórico      |

### 5.4. Validação de Propriedade de Recurso

Além de verificar o role, valide se o usuário tem acesso ao recurso específico:

```javascript
// ✅ CORRETO - Verifica se o pedido pertence ao usuário
export async function getOrderById(req, res) {
  const { id } = req.params;

  const pedido = await knex("pedidos").where({ id }).first();

  if (!pedido) {
    return res.status(404).json({
      error: "Pedido não encontrado",
    });
  }

  // COMPRADOR só pode ver seus próprios pedidos
  if (req.user.role === "COMPRADOR" && pedido.cliente_id !== req.user.id) {
    return res.status(403).json({
      error: "Acesso negado",
      message: "Você não tem permissão para visualizar este pedido",
    });
  }

  return res.json({ data: pedido });
}
```

### 5.5. Proteção contra Injeção SQL

**NUNCA** concatene strings diretamente em queries. Use placeholders do Knex:

```javascript
// ❌ PERIGOSO - Vulnerável a SQL Injection
const email = req.query.email;
const user = await knex.raw(`SELECT * FROM users WHERE email = '${email}'`);

// ✅ CORRETO - Usa placeholders
const email = req.query.email;
const user = await knex("users").where({ email }).first();

// ✅ CORRETO - Raw query com binding
const user = await knex.raw("SELECT * FROM users WHERE email = ?", [email]);
```

---

## 6. Estrutura de Pastas e Arquivos

```
backend/
├── src/
│   ├── app.js                  # Configuração do Express (middlewares, rotas)
│   ├── server.js               # Inicialização do servidor
│   ├── db.js                   # Conexão com banco (Knex)
│   ├── routes.js               # Agregador de rotas
│   │
│   ├── config/                 # Configurações externas
│   │   ├── supabase.js         # Cliente Supabase
│   │   └── swagger.js          # Configuração Swagger
│   │
│   ├── controllers/            # Lógica de negócio
│   │   ├── authController.js
│   │   ├── productsController.js
│   │   └── ordersController.js
│   │
│   ├── middlewares/            # Middlewares customizados
│   │   ├── authMiddleware.js
│   │   └── errorHandler.js
│   │
│   ├── schemas/                # Validações Zod
│   │   ├── authSchemas.js
│   │   ├── productSchemas.js
│   │   └── orderSchemas.js
│   │
│   ├── routes/                 # Definição de rotas
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   └── orderRoutes.js
│   │
│   ├── database/
│   │   └── migrations/         # Migrations do Knex
│   │       └── 001_initial.js
│   │
│   └── __tests__/              # Testes unitários e integração
│       ├── auth.test.js
│       └── setup.js
│
├── docs/                       # Documentação
│   ├── AUTH_IMPLEMENTATION.md
│   ├── SWAGGER_EXAMPLES.md
│   └── CODING_STANDARDS.md     # Este arquivo
│
├── knexfile.js                 # Configuração do Knex
├── jest.config.js              # Configuração do Jest
├── package.json
└── README.md
```

### 6.1. Responsabilidades de Cada Camada

| Camada          | Responsabilidade                                                    |
| --------------- | ------------------------------------------------------------------- |
| **Routes**      | Definir endpoints, aplicar middlewares, chamar controllers          |
| **Controllers** | Validar dados (Zod), executar lógica de negócio, retornar respostas |
| **Schemas**     | Definir regras de validação com Zod                                 |
| **Middlewares** | Autenticação, autorização, logging, tratamento de erros             |
| **Config**      | Configurações de serviços externos (Supabase, Swagger)              |

---

## 7. Testes

### 7.1. Estrutura de Testes

Use **Jest** com **Supertest** para testes de integração:

```javascript
import request from "supertest";
import app from "../app.js";

describe("POST /auth/register", () => {
  it("deve registrar um novo usuário com sucesso", async () => {
    const response = await request(app).post("/auth/register").send({
      email: "test@example.com",
      password: "senha123",
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("user");
    expect(response.body.user.email).toBe("test@example.com");
    expect(response.body.user.role).toBe("COMPRADOR");
  });

  it("deve retornar erro 400 para email inválido", async () => {
    const response = await request(app).post("/auth/register").send({
      email: "invalid-email",
      password: "senha123",
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "Erro de validação");
  });
});
```

### 7.2. Mocks

Use mocks para Supabase e banco de dados em testes:

```javascript
// __mocks__/db.js
export default {
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  first: jest.fn(),
  insert: jest.fn().mockReturnThis(),
  returning: jest.fn(),
};
```

---

## 8. Variáveis de Ambiente

Todas as configurações sensíveis devem estar em `.env`:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/xsalgados

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server
PORT=3000
NODE_ENV=development
```

**Carregamento**:

```javascript
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 3000;
```

---

## 9. Tratamento de Erros

### 9.1. Try-Catch em Controllers

Sempre use try-catch em funções assíncronas:

```javascript
export async function myController(req, res) {
  try {
    // Lógica principal
    const data = await knex("users").select("*");
    return res.json({ data });
  } catch (error) {
    console.error("Erro em myController:", error);
    return res.status(500).json({
      error: "Erro interno do servidor",
      message: error.message,
    });
  }
}
```

### 9.2. Middleware de Erro Global (Opcional)

Crie um middleware para capturar erros não tratados:

```javascript
// middlewares/errorHandler.js
export function errorHandler(err, req, res, next) {
  console.error("Erro não tratado:", err);

  return res.status(err.status || 500).json({
    error: err.message || "Erro interno do servidor",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

// app.js - No final, após todas as rotas
app.use(errorHandler);
```

---

## 10. Checklist de Revisão de Código

Antes de fazer commit, verifique:

- [ ] Todos os imports usam `.js` no final
- [ ] Funções assíncronas usam `async/await`
- [ ] Validação Zod aplicada ANTES de operações no banco
- [ ] Respostas seguem padrão JSON definido
- [ ] Rotas protegidas usam `authenticate` e `authorize`
- [ ] Queries Knex respeitam tipos da migration
- [ ] Transações usadas em operações multi-tabela
- [ ] Comentários JSDoc em funções exportadas
- [ ] Nomenclatura em camelCase (variáveis/funções)
- [ ] Try-catch em todos os controllers
- [ ] Testes escritos para novos endpoints

---

## 11. Recursos Adicionais

- **Documentação Knex**: https://knexjs.org/
- **Documentação Zod**: https://zod.dev/
- **Documentação Supabase**: https://supabase.com/docs
- **Documentação Express**: https://expressjs.com/

---

**Última Atualização**: Março de 2026  
**Mantenedores**: Equipe X Salgados
