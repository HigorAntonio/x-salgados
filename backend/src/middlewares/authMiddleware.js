import supabase from "../config/supabase.js";
import knex from "../db.js";

/**
 * Middleware de autenticação
 *
 * Verifica se o usuário está autenticado via token Supabase
 * e adiciona os dados do usuário ao objeto req
 *
 * Uso:
 * import { authenticate } from './middlewares/authMiddleware.js';
 * router.get('/protected', authenticate, (req, res) => {
 *   res.json({ user: req.user });
 * });
 */
export async function authenticate(req, res, next) {
  try {
    // Verificar se o Supabase está configurado
    if (!supabase) {
      return res.status(503).json({
        error: "Serviço de autenticação não disponível",
        message:
          "Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY não estão configuradas",
      });
    }

    // 1. Obter o token do header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Token não fornecido",
        message: "Header Authorization deve conter um Bearer token",
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    // 2. Verificar o token no Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: "Token inválido ou expirado",
        message: error?.message || "Usuário não autenticado",
      });
    }

    // 3. Buscar dados complementares na tabela local usando UUID
    const localUser = await knex("users")
      .where({ id: user.id }) // Buscar pelo UUID do Supabase
      .first(["id", "email", "role", "created_at", "updated_at"]);

    if (!localUser) {
      return res.status(404).json({
        error: "Usuário não encontrado",
        message: "Usuário autenticado mas não existe no banco local",
      });
    }

    // 4. Adicionar dados do usuário ao objeto req
    req.user = {
      id: localUser.id, // UUID do Supabase
      email: localUser.email,
      role: localUser.role,
      created_at: localUser.created_at,
      updated_at: localUser.updated_at,
    };

    req.token = token;

    // 5. Continuar para a próxima função
    next();
  } catch (error) {
    console.error("Erro no middleware de autenticação:", error);
    return res.status(500).json({
      error: "Erro interno do servidor",
      message: error.message,
    });
  }
}

/**
 * Middleware de autorização por role
 *
 * Verifica se o usuário tem um dos roles permitidos
 *
 * IMPORTANTE: Deve ser usado DEPOIS do middleware authenticate
 *
 * Uso:
 * import { authenticate, authorize } from './middlewares/authMiddleware.js';
 * router.post('/admin-only', authenticate, authorize(['ADMIN']), (req, res) => {
 *   res.json({ message: 'Acesso permitido para admin' });
 * });
 *
 * @param {Array<string>} allowedRoles - Array de roles permitidos (ex: ['ADMIN', 'MOTORISTA'])
 */
export function authorize(allowedRoles) {
  return (req, res, next) => {
    // Verificar se o middleware authenticate foi executado
    if (!req.user) {
      return res.status(401).json({
        error: "Usuário não autenticado",
        message: "Execute o middleware authenticate antes do authorize",
      });
    }

    // Verificar se o role do usuário está na lista de permitidos
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Acesso negado",
        message: `Você não tem permissão para acessar este recurso. Roles permitidos: ${allowedRoles.join(", ")}`,
      });
    }

    // Role permitido, continuar
    next();
  };
}

export default {
  authenticate,
  authorize,
};
