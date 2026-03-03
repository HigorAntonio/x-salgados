# Backend - X Salgados

API REST para o sistema de gestão X Salgados.

## Tecnologias

- **Node.js** - Runtime JavaScript (ES Modules)
- **Express 5** - Framework web
- **PostgreSQL** - Banco de dados relacional
- **Knex.js** - Query builder e migrations
- **Swagger/OpenAPI** - Documentação da API
- **Jest & Supertest** - Testes unitários e de integração

## Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

## Configuração

1. Copie o arquivo de exemplo de variáveis de ambiente:
```bash
cp .env.example .env
```

2. Configure a string de conexão do banco de dados no arquivo `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/x_salgados"
PORT=3000
NODE_ENV=development
```

3. Instale as dependências:
```bash
npm install
```

4. Execute as migrations para criar as tabelas:
```bash
npm run migrate
```

## Scripts Disponíveis

- `npm start` - Inicia o servidor em modo produção
- `npm run dev` - Inicia o servidor em modo desenvolvimento com hot-reload
- `npm run migrate` - Executa as migrations pendentes
- `npm run migrate:rollback` - Reverte a última migration
- `npm run migrate:status` - Mostra o status das migrations
- `npm test` - Executa os testes unitários
- `npm run test:watch` - Executa os testes em modo watch
- `npm run test:coverage` - Executa os testes e gera relatório de cobertura

## Estrutura do Banco de Dados

O schema completo está definido em `src/database/migrations/001_initial.js` e inclui:

- **regioes** - Clusters geográficos (cidade/bairro/rua)
- **users** - Usuários do sistema (RBAC: Admin, Comprador, Motorista)
- **enderecos** - Endereços geocodificados dos clientes
- **produtos** - Catálogo de salgados com controle de estoque
- **veiculos** - Frota com capacidade e consumo
- **carregamentos** - Rotas/manifestos de carga
- **pedidos** - Vendas realizadas pelos compradores
- **agenda_regional** - Dias de entrega por região

## Endpoints

### Health Check

```
GET /status
```

Verifica a saúde da aplicação e conexão com o banco de dados.

**Resposta de sucesso:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-03T10:30:00.000Z"
}
```

### Documentação da API (Swagger)

A documentação completa da API está disponível via Swagger UI:

```
http://localhost:3000/api-docs
```

Você também pode acessar a especificação OpenAPI em formato JSON:

```
http://localhost:3000/api-docs.json
```

## Desenvolvimento

O servidor utiliza `--watch` flag do Node.js para reiniciar automaticamente quando arquivos são modificados.

### Boas Práticas

- Use variáveis de ambiente para configurações sensíveis
- Nunca commite o arquivo `.env`
- Execute migrations antes de iniciar o desenvolvimento
- Teste a conexão com o banco usando `/status`

## Testes

O projeto utiliza **Jest** e **Supertest** para testes unitários e de integração.

### Executar Testes

```bash
# Executar todos os testes
npm test

# Executar em modo watch (útil durante desenvolvimento)
npm run test:watch

# Gerar relatório de cobertura
npm run test:coverage
```

### Estrutura de Testes

```
src/
└── __tests__/
    ├── setup.js         # Configuração global dos testes
    ├── app.test.js      # Testes da configuração do Express
    └── routes.test.js   # Testes dos endpoints da API
```

### Cobertura de Código

O projeto mantém alta cobertura de testes. Para visualizar o relatório de cobertura:

```bash
npm run test:coverage
```

O relatório HTML é gerado em `coverage/lcov-report/index.html`.

### Mocking de Dependências

Os testes utilizam mocks do módulo de banco de dados para evitar dependência de conexões reais durante a execução dos testes.

## Documentação da API

A API utiliza **Swagger/OpenAPI 3.0** para documentação interativa.

### Acessar a Documentação

Após iniciar o servidor, acesse:

- **Swagger UI (interativa)**: http://localhost:3000/api-docs
- **OpenAPI JSON**: http://localhost:3000/api-docs.json

### Documentar Novos Endpoints

Para documentar um novo endpoint, adicione comentários JSDoc com anotações Swagger acima da rota:

```javascript
/**
 * @swagger
 * /api/exemplo:
 *   get:
 *     summary: Descrição breve do endpoint
 *     tags: [NomeDaTag]
 *     responses:
 *       200:
 *         description: Sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.get('/api/exemplo', (req, res) => {
  res.json({ message: 'Exemplo' });
});
```

A configuração do Swagger está em [src/config/swagger.js](src/config/swagger.js) e inclui:
- Schemas reutilizáveis
- Respostas de erro padrão
- Configuração de autenticação JWT (preparado para implementação futura)
- Tags para organização dos endpoints

## Estrutura de Arquivos

```
backend/
├── docs/               # Documentação adicional
│   └── SWAGGER_EXAMPLES.md
├── src/
│   ├── __tests__/      # Testes unitários e de integração
│   │   ├── setup.js
│   │   ├── app.test.js
│   │   └── routes.test.js
│   ├── __mocks__/      # Mocks para testes
│   │   └── db.js
│   ├── config/         # Arquivos de configuração
│   │   └── swagger.js  # Configuração do Swagger/OpenAPI
│   ├── database/       # Banco de dados
│   │   ├── migrations/ # Migrations do banco de dados
│   │   │   └── 001_initial.js
│   │   └── seeds/      # Seeds para popular o banco
│   ├── app.js          # Configuração do Express e middlewares
│   ├── routes.js       # Definição de rotas da API
│   ├── db.js           # Configuração do Knex
│   └── server.js       # Inicialização do servidor
├── coverage/           # Relatórios de cobertura (gerado)
├── .env.example        # Exemplo de variáveis de ambiente
├── jest.config.js      # Configuração do Jest
├── knexfile.js         # Configuração do Knex
├── package.json        # Dependências e scripts
└── README.md
```

## Arquitetura

O projeto utiliza **ES Modules** (type: "module") e segue uma arquitetura separando responsabilidades:

- **app.js**: Contém a configuração do Express, middlewares e error handlers
- **routes.js**: Define todas as rotas da API com documentação Swagger
- **server.js**: Responsável por inicializar o servidor, verificar conexão DB e gerenciar shutdown
- **db.js**: Exporta uma instância configurada do Knex para uso em toda aplicação
- **config/swagger.js**: Configuração do Swagger/OpenAPI para documentação da API
