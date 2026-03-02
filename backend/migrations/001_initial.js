exports.up = function(knex) {
  return knex.schema
    .createTable('bairro', table => {
      table.increments('id').primary();
      table.string('nome').notNullable();
    })
    .createTable('agenda_regional', table => {
      table.increments('id').primary();
      table.integer('bairroId').unsigned().references('id').inTable('bairro').onDelete('CASCADE');
      table.string('dia_semana').notNullable();
    })
    .createTable('users', table => {
      table.increments('id').primary();
      table.string('email').notNullable().unique();
      table.string('password').notNullable();
      table.string('role').notNullable();
      table.float('lat');
      table.float('lng');
      table.integer('bairroId').unsigned().references('id').inTable('bairro');
    })
    .createTable('produto', table => {
      table.increments('id').primary();
      table.string('nome').notNullable();
      table.integer('qtd_estoque').notNullable();
      table.integer('caixas_por_unidade').notNullable();
    })
    .createTable('veiculo', table => {
      table.increments('id').primary();
      table.string('tipo').notNullable();
      table.integer('capacidade_caixas').notNullable();
      table.float('consumo_medio').notNullable();
      table.float('autonomia_max').notNullable();
    })
    .createTable('rota', table => {
      table.increments('id').primary();
      table.integer('veiculoId').unsigned().references('id').inTable('veiculo');
    })
    .createTable('pedido', table => {
      table.increments('id').primary();
      table.integer('clienteId').unsigned().references('id').inTable('users');
      table.integer('total_caixas').notNullable();
      table.string('status').notNullable();
      table.timestamp('data_entrega').notNullable();
      table.integer('rotaId').unsigned().references('id').inTable('rota');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('pedido')
    .dropTableIfExists('rota')
    .dropTableIfExists('veiculo')
    .dropTableIfExists('produto')
    .dropTableIfExists('users')
    .dropTableIfExists('agenda_regional')
    .dropTableIfExists('bairro');
};
