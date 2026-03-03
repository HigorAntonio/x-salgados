exports.up = function(knex) {
  return knex.schema
    // 1. REGIOES (Clusters Geográficos)
    .createTable('regioes', (table) => {
      table.increments('id').primary();
      table.string('cidade').notNullable();
      table.string('bairro').notNullable();
      table.string('rua');
      table.timestamps(true, true);
    })

    // 2. USERS
    .createTable('users', (table) => {
      table.increments('id').primary();
      table.string('email').unique().notNullable();
      table.string('password').notNullable();
      table.enum('role', ['ADMIN', 'COMPRADOR', 'MOTORISTA']).notNullable();
      table.timestamps(true, true);
    })

    // 3. ENDEREÇOS
    .createTable('enderecos', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      table.integer('regiao_id').unsigned().references('id').inTable('regioes');
      table.string('descricao').notNullable(); // Ex: "Rua das Coxinhas, 123"
      table.decimal('lat', 10, 8).notNullable(); // Precisão para GPS
      table.decimal('lng', 11, 8).notNullable();
      table.timestamps(true, true);
    })

    // 4. PRODUTOS (Salgados)
    .createTable('produtos', (table) => {
      table.increments('id').primary();
      table.string('nome').notNullable();
      table.integer('qtd_estoque').defaultTo(0);
      table.integer('volumes_por_unidade').notNullable(); // Espaço em caixas padrão
      table.timestamps(true, true);
    })

    // 5. VEÍCULOS
    .createTable('veiculos', (table) => {
      table.increments('id').primary();
      table.string('tipo').notNullable(); // Ex: "Van Sprinter", "Caminhão 3/4"
      table.integer('capacidade_em_volumes').notNullable();
      table.decimal('consumo_medio', 5, 2).notNullable(); // km/l
      table.integer('autonomia_max').notNullable(); // em km
      table.timestamps(true, true);
    })

    // 6. CARREGAMENTOS (As "Rotas" do dia)
    .createTable('carregamentos', (table) => {
      table.increments('id').primary();
      table.integer('veiculo_id').unsigned().references('id').inTable('veiculos');
      table.integer('motorista_id').unsigned().references('id').inTable('users');
      table.date('data_saida').notNullable();
      table.decimal('distancia_total_estimada', 8, 2);
      table.decimal('custo_combustivel_estimado', 10, 2);
      table.enum('status', ['PLANEJADO', 'EM_TRANSITO', 'CONCLUIDO']).defaultTo('PLANEJADO');
      table.timestamps(true, true);
    })

    // 7. PEDIDOS
    .createTable('pedidos', (table) => {
      table.increments('id').primary();
      table.integer('cliente_id').unsigned().references('id').inTable('users');
      table.integer('endereco_id').unsigned().references('id').inTable('enderecos');
      table.integer('carregamento_id').unsigned().references('id').inTable('carregamentos').nullable();
      table.integer('total_de_volumes').notNullable();
      table.date('data_entrega').notNullable();
      table.enum('status', ['PENDENTE', 'FATURADO', 'EM_ROTA', 'ENTREGUE', 'CANCELADO']).defaultTo('PENDENTE');
      table.timestamps(true, true);
    })

    // 8. AGENDA REGIONAL
    .createTable('agenda_regional', (table) => {
      table.increments('id').primary();
      table.integer('regiao_id').unsigned().references('id').inTable('regioes').onDelete('CASCADE');
      table.enum('dia_semana', ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO']).notNullable();
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('agenda_regional')
    .dropTableIfExists('pedidos')
    .dropTableIfExists('carregamentos')
    .dropTableIfExists('veiculos')
    .dropTableIfExists('produtos')
    .dropTableIfExists('enderecos')
    .dropTableIfExists('users')
    .dropTableIfExists('regioes');
};