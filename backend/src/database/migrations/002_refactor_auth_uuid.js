/**
 * Migration: Refatoração para UUID e Integração com Supabase Auth
 *
 * Esta migration refatora a estrutura de autenticação para usar UUID
 * do Supabase Auth como chave primária da tabela users.
 *
 * Alterações:
 * 1. Users: id incremental -> UUID (do Supabase)
 * 2. Remove coluna password (gerenciada pelo Supabase)
 * 3. Atualiza todas as FKs que referenciam users.id
 */

export async function up(knex) {
  // Esta migration requer recriar as tabelas devido à mudança de tipo do ID
  // Em produção, considere uma estratégia de migração de dados

  return (
    knex.schema
      // 1. Drop tabelas que dependem de users (ordem reversa de criação)
      .dropTableIfExists("agenda_regional")
      .dropTableIfExists("pedidos")
      .dropTableIfExists("carregamentos")
      .dropTableIfExists("enderecos")
      .dropTableIfExists("veiculos")
      .dropTableIfExists("produtos")
      .dropTableIfExists("users")
      .dropTableIfExists("regioes")

      // 2. Recriar REGIOES (sem alterações)
      .createTable("regioes", (table) => {
        table.increments("id").primary();
        table.string("cidade").notNullable();
        table.string("bairro").notNullable();
        table.string("rua");
        table.timestamps(true, true);
      })

      // 3. Recriar USERS com UUID (do Supabase Auth)
      .createTable("users", (table) => {
        table.uuid("id").primary(); // UUID do Supabase Auth
        table.string("email").unique().notNullable();
        table.enum("role", ["ADMIN", "COMPRADOR", "MOTORISTA"]).notNullable();
        table.timestamps(true, true);

        // Índice para otimizar buscas por email
        table.index("email");
      })

      // 4. Recriar ENDEREÇOS com FK uuid
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
        table.string("descricao").notNullable();
        table.decimal("lat", 10, 8).notNullable();
        table.decimal("lng", 11, 8).notNullable();
        table.timestamps(true, true);

        table.index("user_id");
        table.index("regiao_id");
      })

      // 5. Recriar PRODUTOS com coluna descrição
      .createTable("produtos", (table) => {
        table.increments("id").primary();
        table.string("nome").notNullable();
        table.text("descricao");
        table.integer("qtd_estoque").defaultTo(0);
        table.integer("volumes_por_unidade").notNullable();
        table.timestamps(true, true);
      })

      // 6. Recriar VEÍCULOS (sem alterações)
      .createTable("veiculos", (table) => {
        table.increments("id").primary();
        table.string("tipo").notNullable();
        table.integer("capacidade_em_volumes").notNullable();
        table.decimal("consumo_medio", 5, 2).notNullable();
        table.integer("autonomia_max").notNullable();
        table.timestamps(true, true);
      })

      // 7. Recriar CARREGAMENTOS com FK uuid para motorista
      .createTable("carregamentos", (table) => {
        table.increments("id").primary();
        table
          .integer("veiculo_id")
          .unsigned()
          .references("id")
          .inTable("veiculos");
        table.uuid("motorista_id").references("id").inTable("users"); // Alterado para UUID
        table.date("data_saida").notNullable();
        table.decimal("distancia_total_estimada", 8, 2);
        table.decimal("custo_combustivel_estimado", 10, 2);
        table
          .enum("status", ["PLANEJADO", "EM_TRANSITO", "CONCLUIDO"])
          .defaultTo("PLANEJADO");
        table.timestamps(true, true);

        table.index("veiculo_id");
        table.index("motorista_id");
        table.index(["data_saida", "status"]);
      })

      // 8. Recriar PEDIDOS com FK uuid para cliente
      .createTable("pedidos", (table) => {
        table.increments("id").primary();
        table.uuid("cliente_id").references("id").inTable("users"); // Alterado para UUID
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
        table.integer("total_de_volumes").notNullable();
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

        table.index("cliente_id");
        table.index("carregamento_id");
        table.index(["data_entrega", "status"]);
      })

      // 9. Recriar AGENDA REGIONAL (sem alterações)
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

        table.index(["regiao_id", "dia_semana"]);
      })
  );
}

export async function down(knex) {
  // Rollback: restaurar estrutura anterior
  return (
    knex.schema
      .dropTableIfExists("agenda_regional")
      .dropTableIfExists("pedidos")
      .dropTableIfExists("carregamentos")
      .dropTableIfExists("veiculos")
      .dropTableIfExists("produtos")
      .dropTableIfExists("enderecos")
      .dropTableIfExists("users")
      .dropTableIfExists("regioes")

      // Recriar com estrutura original (da migration 001)
      .createTable("regioes", (table) => {
        table.increments("id").primary();
        table.string("cidade").notNullable();
        table.string("bairro").notNullable();
        table.string("rua");
        table.timestamps(true, true);
      })
      .createTable("users", (table) => {
        table.increments("id").primary();
        table.string("email").unique().notNullable();
        table.string("password").notNullable();
        table.enum("role", ["ADMIN", "COMPRADOR", "MOTORISTA"]).notNullable();
        table.timestamps(true, true);
      })
      .createTable("enderecos", (table) => {
        table.increments("id").primary();
        table
          .integer("user_id")
          .unsigned()
          .references("id")
          .inTable("users")
          .onDelete("CASCADE");
        table
          .integer("regiao_id")
          .unsigned()
          .references("id")
          .inTable("regioes");
        table.string("descricao").notNullable();
        table.decimal("lat", 10, 8).notNullable();
        table.decimal("lng", 11, 8).notNullable();
        table.timestamps(true, true);

        table.index("user_id");
        table.index("regiao_id");
      })
      .createTable("produtos", (table) => {
        table.increments("id").primary();
        table.string("nome").notNullable();
        table.text("descricao");
        table.integer("qtd_estoque").defaultTo(0);
        table.integer("volumes_por_unidade").notNullable();
        table.timestamps(true, true);
      })
      .createTable("veiculos", (table) => {
        table.increments("id").primary();
        table.string("tipo").notNullable();
        table.integer("capacidade_em_volumes").notNullable();
        table.decimal("consumo_medio", 5, 2).notNullable();
        table.integer("autonomia_max").notNullable();
        table.timestamps(true, true);
      })
      .createTable("carregamentos", (table) => {
        table.increments("id").primary();
        table
          .integer("veiculo_id")
          .unsigned()
          .references("id")
          .inTable("veiculos");
        table
          .integer("motorista_id")
          .unsigned()
          .references("id")
          .inTable("users");
        table.date("data_saida").notNullable();
        table.decimal("distancia_total_estimada", 8, 2);
        table.decimal("custo_combustivel_estimado", 10, 2);
        table
          .enum("status", ["PLANEJADO", "EM_TRANSITO", "CONCLUIDO"])
          .defaultTo("PLANEJADO");
        table.timestamps(true, true);

        table.index("veiculo_id");
        table.index("motorista_id");
        table.index(["data_saida", "status"]);
      })
      .createTable("pedidos", (table) => {
        table.increments("id").primary();
        table
          .integer("cliente_id")
          .unsigned()
          .references("id")
          .inTable("users");
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
        table.integer("total_de_volumes").notNullable();
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

        table.index("cliente_id");
        table.index("carregamento_id");
        table.index(["data_entrega", "status"]);
      })
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

        table.index(["regiao_id", "dia_semana"]);
      })
  );
}
