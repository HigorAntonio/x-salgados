/**
 * Migration: Initial Database Schema
 *
 * Cria todas as tabelas do sistema X Salgados com integração ao Supabase Auth
 *
 * Características principais:
 * - Users com UUID do Supabase Auth (sem senha local)
 * - Produtos com preço de venda para dashboard financeiro
 * - Pedidos com rastreamento completo de itens e valores
 * - Tabela pedido_itens para detalhar produtos de cada pedido
 * - Snapshot de preços para histórico financeiro preciso
 *
 * Estrutura conforme REQUISITOS.md com suporte ao Dashboard Financeiro
 */

export async function up(knex) {
  return (
    knex.schema
      // 1. REGIOES (Clusters Geográficos)
      .createTable("regioes", (table) => {
        table.increments("id").primary();
        table.string("cidade").notNullable();
        table.string("bairro").notNullable();
        table.string("rua");
        table.timestamps(true, true);
      })

      // 2. USERS (Integrado com Supabase Auth)
      .createTable("users", (table) => {
        table.uuid("id").primary(); // UUID do Supabase Auth
        table.string("email").unique().notNullable();
        table.enum("role", ["ADMIN", "COMPRADOR", "MOTORISTA"]).notNullable();
        table.timestamps(true, true);

        // Índice para otimizar buscas por email
        table.index("email");
      })

      // 3. ENDEREÇOS
      .createTable("enderecos", (table) => {
        table.increments("id").primary();
        table
          .uuid("user_id")
          .references("id")
          .inTable("users")
          .onDelete("CASCADE");
        table
          .integer("regiao_id")
          .unsigned()
          .references("id")
          .inTable("regioes");
        table.string("descricao").notNullable(); // Ex: "Rua das Coxinhas, 123"
        table.decimal("lat", 10, 8).notNullable(); // Precisão para GPS
        table.decimal("lng", 11, 8).notNullable();
        table.timestamps(true, true);

        // Índices para otimizar buscas
        table.index("user_id");
        table.index("regiao_id");
      })

      // 4. PRODUTOS (Salgados)
      .createTable("produtos", (table) => {
        table.increments("id").primary();
        table.string("nome").notNullable();
        table.text("descricao"); // Descrição do produto
        table.decimal("preco_venda", 10, 2).notNullable(); // Preço de venda atual
        table.integer("qtd_estoque").defaultTo(0);
        table.integer("volumes_por_unidade").notNullable(); // Espaço em caixas padrão
        table.timestamps(true, true);
      })

      // 5. VEÍCULOS
      .createTable("veiculos", (table) => {
        table.increments("id").primary();
        table.string("tipo").notNullable(); // Ex: "Van Sprinter", "Caminhão 3/4"
        table.integer("capacidade_em_volumes").notNullable();
        table.decimal("consumo_medio", 5, 2).notNullable(); // km/l
        table.integer("autonomia_max").notNullable(); // em km
        table.timestamps(true, true);
      })

      // 6. CARREGAMENTOS (As "Rotas" do dia)
      .createTable("carregamentos", (table) => {
        table.increments("id").primary();
        table
          .integer("veiculo_id")
          .unsigned()
          .references("id")
          .inTable("veiculos");
        table.uuid("motorista_id").references("id").inTable("users"); // UUID do Supabase
        table.date("data_saida").notNullable();
        table.decimal("distancia_total_estimada", 8, 2);
        table.decimal("custo_combustivel_estimado", 10, 2);
        table
          .enum("status", ["PLANEJADO", "EM_TRANSITO", "CONCLUIDO"])
          .defaultTo("PLANEJADO");
        table.timestamps(true, true);

        // Índices para otimizar buscas
        table.index("veiculo_id");
        table.index("motorista_id");
        table.index(["data_saida", "status"]); // Busca conjunta comum
      })

      // 7. PEDIDOS
      .createTable("pedidos", (table) => {
        table.increments("id").primary();
        table.uuid("cliente_id").references("id").inTable("users"); // UUID do Supabase
        table
          .integer("endereco_id")
          .unsigned()
          .references("id")
          .inTable("enderecos");
        table
          .integer("carregamento_id")
          .unsigned()
          .references("id")
          .inTable("carregamentos")
          .nullable();
        table.integer("total_de_volumes").notNullable(); // Calculado a partir dos itens
        table.decimal("valor_total", 10, 2); // Valor total do pedido (soma dos itens)
        table.date("data_entrega").notNullable();
        table
          .enum("status", [
            "PENDENTE",
            "FATURADO",
            "EM_ROTA",
            "ENTREGUE",
            "CANCELADO",
          ])
          .defaultTo("PENDENTE");
        table.timestamps(true, true);

        // Índices para otimizar buscas
        table.index("cliente_id");
        table.index("carregamento_id");
        table.index(["data_entrega", "status"]); // Busca conjunta comum
      })

      // 8. PEDIDO_ITENS (Detalhamento dos produtos em cada pedido)
      .createTable("pedido_itens", (table) => {
        table.increments("id").primary();
        table
          .integer("pedido_id")
          .unsigned()
          .references("id")
          .inTable("pedidos")
          .onDelete("CASCADE");
        table
          .integer("produto_id")
          .unsigned()
          .references("id")
          .inTable("produtos");
        table.decimal("preco_unitario_venda", 10, 2).notNullable(); // Snapshot do preço no momento da venda
        table.integer("quantidade").notNullable(); // Quantidade de unidades/caixas
        table.decimal("subtotal_valor", 10, 2).notNullable(); // quantidade * preco_unitario_venda
        table.integer("subtotal_volumes").notNullable(); // quantidade * volumes_por_unidade
        table.timestamps(true, true);

        // Índices para otimizar buscas
        table.index("pedido_id");
        table.index("produto_id");
      })

      // 9. AGENDA REGIONAL
      .createTable("agenda_regional", (table) => {
        table.increments("id").primary();
        table
          .integer("regiao_id")
          .unsigned()
          .references("id")
          .inTable("regioes")
          .onDelete("CASCADE");
        table
          .enum("dia_semana", [
            "SEGUNDA",
            "TERCA",
            "QUARTA",
            "QUINTA",
            "SEXTA",
            "SABADO",
            "DOMINGO",
          ])
          .notNullable();

        // Índice composto para buscar rapidamente os dias de entrega por região
        table.index(["regiao_id", "dia_semana"]);
      })
  );
}

export async function down(knex) {
  return knex.schema
    .dropTableIfExists("agenda_regional")
    .dropTableIfExists("pedido_itens") // Deve ser dropada antes de pedidos e produtos
    .dropTableIfExists("pedidos")
    .dropTableIfExists("carregamentos")
    .dropTableIfExists("veiculos")
    .dropTableIfExists("produtos")
    .dropTableIfExists("enderecos")
    .dropTableIfExists("users")
    .dropTableIfExists("regioes");
}
