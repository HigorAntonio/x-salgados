import express from "express";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * EXEMPLOS DE ROTAS PROTEGIDAS
 *
 * Este arquivo demonstra como usar os middlewares de autenticação e autorização
 * para proteger rotas que requerem login ou roles específicos.
 */

/**
 * @swagger
 * /examples/profile:
 *   get:
 *     summary: Obtém o perfil do usuário autenticado
 *     tags: [Examples]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil do usuário
 *       401:
 *         description: Não autenticado
 */
router.get("/profile", authenticate, (req, res) => {
  // req.user foi adicionado pelo middleware authenticate
  res.json({
    message: "Perfil do usuário",
    user: req.user,
  });
});

/**
 * @swagger
 * /examples/admin-only:
 *   get:
 *     summary: Rota acessível apenas para ADMIN
 *     tags: [Examples]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Acesso permitido
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão (não é ADMIN)
 */
router.get("/admin-only", authenticate, authorize(["ADMIN"]), (req, res) => {
  res.json({
    message: "Acesso permitido apenas para ADMIN",
    user: req.user,
  });
});

/**
 * @swagger
 * /examples/delivery-staff:
 *   get:
 *     summary: Rota para motoristas e administradores
 *     tags: [Examples]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Acesso permitido
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 */
router.get(
  "/delivery-staff",
  authenticate,
  authorize(["MOTORISTA", "ADMIN"]),
  (req, res) => {
    res.json({
      message: "Acesso permitido para motoristas e administradores",
      user: req.user,
    });
  },
);

/**
 * @swagger
 * /examples/buyers-only:
 *   get:
 *     summary: Rota exclusiva para compradores
 *     tags: [Examples]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Acesso permitido
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão (não é COMPRADOR)
 */
router.get(
  "/buyers-only",
  authenticate,
  authorize(["COMPRADOR"]),
  (req, res) => {
    res.json({
      message: "Acesso permitido apenas para compradores",
      user: req.user,
    });
  },
);

/**
 * @swagger
 * /examples/public:
 *   get:
 *     summary: Rota pública (sem autenticação)
 *     tags: [Examples]
 *     responses:
 *       200:
 *         description: Acesso público
 */
router.get("/public", (req, res) => {
  res.json({
    message: "Esta rota é pública e não requer autenticação",
  });
});

export default router;
