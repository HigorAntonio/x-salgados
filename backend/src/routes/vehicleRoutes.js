import express from "express";
import {
  getAll,
  getById,
  create,
  update,
  deleteVehicle,
} from "../controllers/vehicleController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Vehicles
 *   description: Gerenciamento de veículos da frota
 */

/**
 * @swagger
 * /vehicles:
 *   get:
 *     summary: Lista todos os veículos
 *     description: Retorna todos os veículos cadastrados no sistema com paginação. Restrito a ADMIN e MOTORISTA.
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
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
 *         description: Lista de veículos retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Veículos listados com sucesso"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       tipo:
 *                         type: string
 *                       placa:
 *                         type: string
 *                       capacidade_em_volumes:
 *                         type: integer
 *                       consumo_medio:
 *                         type: number
 *                       autonomia_max:
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
 *                       example: 15
 *                     totalPages:
 *                       type: integer
 *                       example: 2
 *                     hasNext:
 *                       type: boolean
 *                       example: true
 *                     hasPrev:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão (apenas ADMIN e MOTORISTA)
 *       500:
 *         description: Erro interno do servidor
 */
router.get("/", authenticate, authorize(["ADMIN", "MOTORISTA"]), getAll);

/**
 * @swagger
 * /vehicles/{id}:
 *   get:
 *     summary: Busca um veículo por ID
 *     description: Retorna os detalhes de um veículo específico. Restrito a ADMIN e MOTORISTA.
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do veículo
 *     responses:
 *       200:
 *         description: Veículo encontrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Veículo encontrado com sucesso"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     tipo:
 *                       type: string
 *                     placa:
 *                       type: string
 *                     capacidade_em_volumes:
 *                       type: integer
 *                     consumo_medio:
 *                       type: number
 *                     autonomia_max:
 *                       type: integer
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão (apenas ADMIN e MOTORISTA)
 *       404:
 *         description: Veículo não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get("/:id", authenticate, authorize(["ADMIN", "MOTORISTA"]), getById);

/**
 * @swagger
 * /vehicles:
 *   post:
 *     summary: Cria um novo veículo
 *     description: Cadastra um novo veículo no sistema. Restrito a usuários ADMIN.
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo
 *               - placa
 *               - capacidade_em_volumes
 *               - consumo_medio
 *               - autonomia_max
 *             properties:
 *               tipo:
 *                 type: string
 *                 description: Tipo do veículo
 *                 example: "Van Sprinter"
 *               placa:
 *                 type: string
 *                 description: Placa do veículo (formato brasileiro)
 *                 example: "ABC-1234"
 *               capacidade_em_volumes:
 *                 type: integer
 *                 description: Capacidade em caixas padrão (mínimo 1)
 *                 example: 150
 *               consumo_medio:
 *                 type: number
 *                 description: Consumo médio em km/l (deve ser positivo)
 *                 example: 8.5
 *               autonomia_max:
 *                 type: integer
 *                 description: Autonomia máxima em km (deve ser positivo)
 *                 example: 600
 *     responses:
 *       201:
 *         description: Veículo criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Veículo criado com sucesso"
 *                 data:
 *                   type: object
 *       400:
 *         description: Erro de validação
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão (apenas ADMIN)
 *       409:
 *         description: Veículo com esta placa já existe
 *       500:
 *         description: Erro interno do servidor
 */
router.post("/", authenticate, authorize(["ADMIN"]), create);

/**
 * @swagger
 * /vehicles/{id}:
 *   put:
 *     summary: Atualiza um veículo existente
 *     description: Atualiza os dados de um veículo. Restrito a usuários ADMIN.
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do veículo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tipo:
 *                 type: string
 *                 description: Tipo do veículo
 *               placa:
 *                 type: string
 *                 description: Placa do veículo
 *               capacidade_em_volumes:
 *                 type: integer
 *                 description: Capacidade em caixas padrão
 *               consumo_medio:
 *                 type: number
 *                 description: Consumo médio em km/l
 *               autonomia_max:
 *                 type: integer
 *                 description: Autonomia máxima em km
 *           example:
 *             consumo_medio: 9.2
 *             autonomia_max: 650
 *     responses:
 *       200:
 *         description: Veículo atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Veículo atualizado com sucesso"
 *                 data:
 *                   type: object
 *       400:
 *         description: Erro de validação ou ID inválido
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão (apenas ADMIN)
 *       404:
 *         description: Veículo não encontrado
 *       409:
 *         description: Placa já existe
 *       500:
 *         description: Erro interno do servidor
 */
router.put("/:id", authenticate, authorize(["ADMIN"]), update);

/**
 * @swagger
 * /vehicles/{id}:
 *   delete:
 *     summary: Remove um veículo
 *     description: Remove um veículo do sistema. Restrito a usuários ADMIN.
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do veículo
 *     responses:
 *       204:
 *         description: Veículo removido com sucesso
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão (apenas ADMIN)
 *       404:
 *         description: Veículo não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.delete("/:id", authenticate, authorize(["ADMIN"]), deleteVehicle);

export default router;
