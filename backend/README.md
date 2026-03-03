# Backend - X Salgados

API REST para o sistema de gestão X Salgados.

## Tecnologias

- **Node.js** - Runtime JavaScript (ES Modules)
- **Express 5** - Framework web
- **PostgreSQL** - Banco de dados relacional
- **Knex.js** - Query builder e migrations

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

## Estrutura do Banco de Dados

O schema completo está definido em `database/migrations/001_initial.js` e inclui:

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

## Desenvolvimento

O servidor utiliza `--watch` flag do Node.js para reiniciar automaticamente quando arquivos são modificados.

### Boas Práticas

- Use variáveis de ambiente para configurações sensíveis
- Nunca commite o arquivo `.env`
- Execute migrations antes de iniciar o desenvolvimento
- Teste a conexão com o banco usando `/status`

## Estrutura de Arquivos

```
backend/
├── database/           # Banco de dados
│   ├── migrations/     # Migrations do banco de dados
│   │   └── 001_initial.js
│   └── seeds/          # Seeds para popular o banco
├── src/
│   ├── app.js          # Configuração do Express e rotas
│   ├── db.js           # Configuração do Knex
│   └── server.js       # Inicialização do servidor
├── .env.example        # Exemplo de variáveis de ambiente
├── knexfile.js         # Configuração do Knex
├── package.json        # Dependências e scripts
└── README.md
```

## Arquitetura

O projeto utiliza **ES Modules** (type: "module") e segue uma arquitetura separando responsabilidades:

- **app.js**: Contém a configuração do Express, middlewares, rotas e error handlers
- **server.js**: Responsável por inicializar o servidor, verificar conexão DB e gerenciar shutdown
- **db.js**: Exporta uma instância configurada do Knex para uso em toda aplicação
