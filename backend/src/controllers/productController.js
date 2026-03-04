import knex from "../db.js";
import {
  createProductSchema,
  updateProductSchema,
} from "../schemas/productSchemas.js";

/**
 * Lista todos os produtos cadastrados com paginação
 *
 * Query params:
 * - page: Número da página (default: 1)
 * - limit: Itens por página (default: 10, max: 100)
 *
 * Retorna todos os produtos ordenados por nome (A-Z)
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

    // Buscar produtos com paginação
    const produtos = await knex("produtos")
      .select("*")
      .orderBy("nome", "asc")
      .limit(limit)
      .offset(offset);

    // Contar total de produtos
    const [{ count }] = await knex("produtos").count("* as count");
    const total = parseInt(count, 10);
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      message: "Produtos listados com sucesso",
      data: produtos,
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
    console.error("Erro ao listar produtos:", error);
    return res.status(500).json({
      error: "Erro interno do servidor",
      message: error.message,
    });
  }
}

/**
 * Busca um produto específico por ID
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function getById(req, res) {
  try {
    const { id } = req.params;

    // Validar se o ID é um número
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return res.status(400).json({
        error: "ID inválido",
        message: "O ID do produto deve ser um número",
      });
    }

    const produto = await knex("produtos").where({ id: productId }).first();

    if (!produto) {
      return res.status(404).json({
        error: "Produto não encontrado",
        message: `Produto com ID ${productId} não existe`,
      });
    }

    return res.status(200).json({
      message: "Produto encontrado com sucesso",
      data: produto,
    });
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    return res.status(500).json({
      error: "Erro interno do servidor",
      message: error.message,
    });
  }
}

/**
 * Cria um novo produto
 *
 * Fluxo:
 * 1. Valida os dados com Zod
 * 2. Insere o produto no banco de dados
 * 3. Retorna o produto criado
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function create(req, res) {
  try {
    // 1. Validação do corpo da requisição com Zod
    const validatedData = createProductSchema.parse(req.body);

    // 2. Verificar se já existe um produto com o mesmo nome
    const existingProduct = await knex("produtos")
      .where({ nome: validatedData.nome })
      .first();

    if (existingProduct) {
      return res.status(409).json({
        error: "Produto já existe",
        message: `Já existe um produto cadastrado com o nome "${validatedData.nome}"`,
      });
    }

    // 3. Inserir o produto no banco de dados
    const [newProduct] = await knex("produtos")
      .insert({
        nome: validatedData.nome,
        descricao: validatedData.descricao || null,
        preco_venda: validatedData.preco_venda,
        qtd_estoque: validatedData.qtd_estoque,
        volumes_por_unidade: validatedData.volumes_por_unidade,
      })
      .returning("*");

    return res.status(201).json({
      message: "Produto criado com sucesso",
      data: newProduct,
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
    console.error("Erro ao criar produto:", error);
    return res.status(500).json({
      error: "Erro interno do servidor",
      message: error.message,
    });
  }
}

/**
 * Atualiza um produto existente
 *
 * Fluxo:
 * 1. Valida os dados com Zod
 * 2. Verifica se o produto existe
 * 3. Atualiza o produto no banco de dados
 * 4. Retorna o produto atualizado
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function update(req, res) {
  try {
    const { id } = req.params;

    // Validar se o ID é um número
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return res.status(400).json({
        error: "ID inválido",
        message: "O ID do produto deve ser um número",
      });
    }

    // 1. Validação do corpo da requisição com Zod
    const validatedData = updateProductSchema.parse(req.body);

    // Verificar se há pelo menos um campo para atualizar
    if (Object.keys(validatedData).length === 0) {
      return res.status(400).json({
        error: "Nenhum campo para atualizar",
        message: "Informe pelo menos um campo para atualizar",
      });
    }

    // 2. Verificar se o produto existe
    const existingProduct = await knex("produtos")
      .where({ id: productId })
      .first();

    if (!existingProduct) {
      return res.status(404).json({
        error: "Produto não encontrado",
        message: `Produto com ID ${productId} não existe`,
      });
    }

    // 3. Se o nome está sendo atualizado, verificar se não há conflito
    if (validatedData.nome && validatedData.nome !== existingProduct.nome) {
      const conflictProduct = await knex("produtos")
        .where({ nome: validatedData.nome })
        .first();

      if (conflictProduct) {
        return res.status(409).json({
          error: "Nome de produto já existe",
          message: `Já existe um produto cadastrado com o nome "${validatedData.nome}"`,
        });
      }
    }

    // 4. Atualizar o produto no banco de dados
    const [updatedProduct] = await knex("produtos")
      .where({ id: productId })
      .update({
        ...validatedData,
        updated_at: knex.fn.now(),
      })
      .returning("*");

    return res.status(200).json({
      message: "Produto atualizado com sucesso",
      data: updatedProduct,
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
    console.error("Erro ao atualizar produto:", error);
    return res.status(500).json({
      error: "Erro interno do servidor",
      message: error.message,
    });
  }
}

/**
 * Remove um produto do banco de dados
 *
 * Fluxo:
 * 1. Verifica se o produto existe
 * 2. Remove o produto do banco de dados
 * 3. Retorna status 204 (No Content)
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    // Validar se o ID é um número
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return res.status(400).json({
        error: "ID inválido",
        message: "O ID do produto deve ser um número",
      });
    }

    // 1. Verificar se o produto existe
    const existingProduct = await knex("produtos")
      .where({ id: productId })
      .first();

    if (!existingProduct) {
      return res.status(404).json({
        error: "Produto não encontrado",
        message: `Produto com ID ${productId} não existe`,
      });
    }

    // 2. Remover o produto do banco de dados
    await knex("produtos").where({ id: productId }).delete();

    // 3. Retornar status 204 (No Content)
    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar produto:", error);
    return res.status(500).json({
      error: "Erro interno do servidor",
      message: error.message,
    });
  }
}
