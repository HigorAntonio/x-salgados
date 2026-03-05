import knex from "../db.js";
import {
  createVehicleSchema,
  updateVehicleSchema,
} from "../schemas/vehicleSchemas.js";

/**
 * Lista todos os veículos cadastrados com paginação
 *
 * Query params:
 * - page: Número da página (default: 1)
 * - limit: Itens por página (default: 10, max: 100)
 *
 * Retorna todos os veículos ordenados por tipo (A-Z)
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function getAll(req, res) {
  try {
    // Parâmetros de paginação
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const offset = (page - 1) * limit;

    // Validar parâmetros
    if (page < 1) {
      return res.status(400).json({
        error: "Parâmetro inválido",
        message: "O número da página deve ser maior ou igual a 1",
      });
    }

    if (limit < 1) {
      return res.status(400).json({
        error: "Parâmetro inválido",
        message: "O limite deve ser maior ou igual a 1",
      });
    }

    // Buscar veículos com paginação
    const veiculos = await knex("veiculos")
      .select("*")
      .orderBy("tipo", "asc")
      .limit(limit)
      .offset(offset);

    // Contar total de veículos
    const [{ count }] = await knex("veiculos").count("* as count");
    const total = parseInt(count, 10);
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      message: "Veículos listados com sucesso",
      data: veiculos,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Erro ao listar veículos:", error);
    return res.status(500).json({
      error: "Erro interno do servidor",
      message: error.message,
    });
  }
}

/**
 * Busca um veículo específico por ID
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function getById(req, res) {
  try {
    const { id } = req.params;

    // Validar se o ID é um número
    const vehicleId = parseInt(id, 10);
    if (isNaN(vehicleId)) {
      return res.status(400).json({
        error: "ID inválido",
        message: "O ID do veículo deve ser um número",
      });
    }

    const veiculo = await knex("veiculos").where({ id: vehicleId }).first();

    if (!veiculo) {
      return res.status(404).json({
        error: "Veículo não encontrado",
        message: `Veículo com ID ${vehicleId} não existe`,
      });
    }

    return res.status(200).json({
      message: "Veículo encontrado com sucesso",
      data: veiculo,
    });
  } catch (error) {
    console.error("Erro ao buscar veículo:", error);
    return res.status(500).json({
      error: "Erro interno do servidor",
      message: error.message,
    });
  }
}

/**
 * Cria um novo veículo
 *
 * Fluxo:
 * 1. Valida os dados com Zod
 * 2. Verifica se a placa já existe
 * 3. Insere o veículo no banco de dados
 * 4. Retorna o veículo criado
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function create(req, res) {
  try {
    // 1. Validação do corpo da requisição com Zod
    const validatedData = createVehicleSchema.parse(req.body);

    // 2. Verificar se já existe um veículo com a mesma placa
    const existingVehicle = await knex("veiculos")
      .where({ placa: validatedData.placa.toUpperCase() })
      .first();

    if (existingVehicle) {
      return res.status(409).json({
        error: "Veículo já existe",
        message: `Já existe um veículo cadastrado com a placa "${validatedData.placa}"`,
      });
    }

    // 3. Inserir o veículo no banco de dados
    const [newVehicle] = await knex("veiculos")
      .insert({
        tipo: validatedData.tipo,
        placa: validatedData.placa.toUpperCase(), // Armazenar sempre em maiúsculas
        capacidade_em_volumes: validatedData.capacidade_em_volumes,
        consumo_medio: validatedData.consumo_medio,
        autonomia_max: validatedData.autonomia_max,
      })
      .returning("*");

    return res.status(201).json({
      message: "Veículo criado com sucesso",
      data: newVehicle,
    });
  } catch (error) {
    // Erro de validação do Zod
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
    console.error("Erro ao criar veículo:", error);
    return res.status(500).json({
      error: "Erro interno do servidor",
      message: error.message,
    });
  }
}

/**
 * Atualiza um veículo existente
 *
 * Fluxo:
 * 1. Valida os dados com Zod
 * 2. Verifica se o veículo existe
 * 3. Se a placa está sendo atualizada, verifica se não há conflito
 * 4. Atualiza o veículo no banco de dados
 * 5. Retorna o veículo atualizado
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function update(req, res) {
  try {
    const { id } = req.params;

    // Validar se o ID é um número
    const vehicleId = parseInt(id, 10);
    if (isNaN(vehicleId)) {
      return res.status(400).json({
        error: "ID inválido",
        message: "O ID do veículo deve ser um número",
      });
    }

    // 1. Validação do corpo da requisição com Zod
    const validatedData = updateVehicleSchema.parse(req.body);

    // Verificar se há pelo menos um campo para atualizar
    if (Object.keys(validatedData).length === 0) {
      return res.status(400).json({
        error: "Nenhum campo para atualizar",
        message: "Informe pelo menos um campo para atualizar",
      });
    }

    // 2. Verificar se o veículo existe
    const existingVehicle = await knex("veiculos")
      .where({ id: vehicleId })
      .first();

    if (!existingVehicle) {
      return res.status(404).json({
        error: "Veículo não encontrado",
        message: `Veículo com ID ${vehicleId} não existe`,
      });
    }

    // 3. Se a placa está sendo atualizada, verificar se não há conflito
    if (
      validatedData.placa &&
      validatedData.placa.toUpperCase() !== existingVehicle.placa
    ) {
      const conflictVehicle = await knex("veiculos")
        .where({ placa: validatedData.placa.toUpperCase() })
        .first();

      if (conflictVehicle) {
        return res.status(409).json({
          error: "Placa já existe",
          message: `Já existe um veículo cadastrado com a placa "${validatedData.placa}"`,
        });
      }
    }

    // 4. Preparar dados para atualização (converter placa para maiúsculas se fornecida)
    const updateData = { ...validatedData };
    if (updateData.placa) {
      updateData.placa = updateData.placa.toUpperCase();
    }

    // 5. Atualizar o veículo no banco de dados
    const [updatedVehicle] = await knex("veiculos")
      .where({ id: vehicleId })
      .update({
        ...updateData,
        updated_at: knex.fn.now(),
      })
      .returning("*");

    return res.status(200).json({
      message: "Veículo atualizado com sucesso",
      data: updatedVehicle,
    });
  } catch (error) {
    // Erro de validação do Zod
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
    console.error("Erro ao atualizar veículo:", error);
    return res.status(500).json({
      error: "Erro interno do servidor",
      message: error.message,
    });
  }
}

/**
 * Remove um veículo do banco de dados
 *
 * Fluxo:
 * 1. Verifica se o veículo existe
 * 2. Remove o veículo do banco de dados
 * 3. Retorna status 204 (No Content)
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function deleteVehicle(req, res) {
  try {
    const { id } = req.params;

    // Validar se o ID é um número
    const vehicleId = parseInt(id, 10);
    if (isNaN(vehicleId)) {
      return res.status(400).json({
        error: "ID inválido",
        message: "O ID do veículo deve ser um número",
      });
    }

    // 1. Verificar se o veículo existe
    const existingVehicle = await knex("veiculos")
      .where({ id: vehicleId })
      .first();

    if (!existingVehicle) {
      return res.status(404).json({
        error: "Veículo não encontrado",
        message: `Veículo com ID ${vehicleId} não existe`,
      });
    }

    // 2. Remover o veículo do banco de dados
    await knex("veiculos").where({ id: vehicleId }).delete();

    // 3. Retornar status 204 (No Content)
    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar veículo:", error);
    return res.status(500).json({
      error: "Erro interno do servidor",
      message: error.message,
    });
  }
}
