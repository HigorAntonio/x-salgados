import express from "express";
import {
  getAll,
  getById,
  create,
  update,
  deleteProduct,
} from "../controllers/productController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Produtos
 *   description: Gerenciamento de produtos (salgados)
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Lista todos os produtos
 *     description: Retorna todos os produtos cadastrados no sistema com paginação. Rota pública.
 *     tags: [Produtos]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Quantidade de itens por página (máximo 100)
 *     responses:
 *       200:
 *         description: Lista de produtos retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Produtos listados com sucesso"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nome:
 *                         type: string
 *                       descricao:
 *                         type: string
 *                       preco_venda:
 *                         type: number
 *                       qtd_estoque:
 *                         type: integer
 *                       volumes_por_unidade:
 *                         type: integer
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     hasNext:
 *                       type: boolean
 *                       example: true
 *                     hasPrev:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: Parâmetros inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.get("/", getAll);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Busca um produto por ID
 *     description: Retorna os detalhes de um produto específico. Rota pública.
 *     tags: [Produtos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do produto
 *     responses:
 *       200:
 *         description: Produto encontrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Produto encontrado com sucesso"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nome:
 *                       type: string
 *                     descricao:
 *                       type: string
 *                     preco_venda:
 *                       type: number
 *                     qtd_estoque:
 *                       type: integer
 *                     volumes_por_unidade:
 *                       type: integer
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Produto não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get("/:id", getById);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Cria um novo produto
 *     description: Cadastra um novo produto no sistema. Restrito a usuários ADMIN.
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - preco_venda
 *               - volumes_por_unidade
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome do produto
 *                 example: "Coxinha de Frango"
 *               descricao:
 *                 type: string
 *                 description: Descrição do produto
 *                 example: "Coxinha tradicional recheada com frango desfiado"
 *               preco_venda:
 *                 type: number
 *                 description: Preço de venda (deve ser positivo)
 *                 example: 5.50
 *               qtd_estoque:
 *                 type: integer
 *                 description: Quantidade em estoque (default 0)
 *                 example: 100
 *               volumes_por_unidade:
 *                 type: integer
 *                 description: Espaço ocupado em caixas padrão (mínimo 1)
 *                 example: 1
 *     responses:
 *       201:
 *         description: Produto criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Produto criado com sucesso"
 *                 data:
 *                   type: object
 *       400:
 *         description: Erro de validação
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão (apenas ADMIN)
 *       409:
 *         description: Produto com este nome já existe
 *       500:
 *         description: Erro interno do servidor
 */
router.post("/", authenticate, authorize(["ADMIN"]), create);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Atualiza um produto existente
 *     description: Atualiza os dados de um produto. Restrito a usuários ADMIN.
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do produto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome do produto
 *               descricao:
 *                 type: string
 *                 description: Descrição do produto
 *               preco_venda:
 *                 type: number
 *                 description: Preço de venda
 *               qtd_estoque:
 *                 type: integer
 *                 description: Quantidade em estoque
 *               volumes_por_unidade:
 *                 type: integer
 *                 description: Espaço ocupado em caixas padrão
 *           example:
 *             preco_venda: 6.00
 *             qtd_estoque: 150
 *     responses:
 *       200:
 *         description: Produto atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Produto atualizado com sucesso"
 *                 data:
 *                   type: object
 *       400:
 *         description: Erro de validação ou ID inválido
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão (apenas ADMIN)
 *       404:
 *         description: Produto não encontrado
 *       409:
 *         description: Nome de produto já existe
 *       500:
 *         description: Erro interno do servidor
 */
router.put("/:id", authenticate, authorize(["ADMIN"]), update);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Remove um produto
 *     description: Remove um produto do sistema. Restrito a usuários ADMIN.
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do produto
 *     responses:
 *       204:
 *         description: Produto removido com sucesso
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão (apenas ADMIN)
 *       404:
 *         description: Produto não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.delete("/:id", authenticate, authorize(["ADMIN"]), deleteProduct);

export default router;
