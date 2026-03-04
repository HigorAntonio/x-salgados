import supabase, { supabaseAdmin } from "../config/supabase.js";
import knex from "../db.js";
import {
  publicRegisterSchema,
  adminRegisterSchema,
  loginSchema,
} from "../schemas/authSchemas.js";

/**
 * Registro público de novo usuário (COMPRADOR)
 *
 * Fluxo:
 * 1. Valida os dados (apenas email e password)
 * 2. Cria o usuário no Supabase Auth
 * 3. Insere o registro na tabela 'users' com role fixo 'COMPRADOR'
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function register(req, res) {
  try {
    // Verificar se o Supabase está configurado
    if (!supabase) {
      return res.status(503).json({
        error: "Serviço de autenticação não disponível",
        message:
          "Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY não estão configuradas",
      });
    }

    // 1. Validação do corpo da requisição com Zod
    const validatedData = publicRegisterSchema.parse(req.body);
    const { email, password } = validatedData;

    // 2. Role é SEMPRE 'COMPRADOR' para registro público
    const role = "COMPRADOR";

    // 3. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return res.status(400).json({
        error: "Erro ao criar usuário no Supabase",
        message: authError.message,
      });
    }

    if (!authData.user) {
      return res.status(500).json({
        error: "Erro ao criar usuário",
        message: "Dados do usuário não retornados pelo Supabase",
      });
    }

    // 4. Inserir na tabela 'users' do banco local usando o UUID do Supabase
    try {
      const [newUser] = await knex("users")
        .insert({
          id: authData.user.id, // UUID do Supabase Auth
          email: authData.user.email,
          role, // Sempre COMPRADOR
        })
        .returning(["id", "email", "role", "created_at"]);

      return res.status(201).json({
        message: "Usuário registrado com sucesso",
        user: {
          id: newUser.id, // UUID do Supabase
          email: newUser.email,
          role: newUser.role,
          created_at: newUser.created_at,
        },
        session: authData.session,
      });
    } catch (dbError) {
      // Se falhou ao inserir no banco local, tentar limpar o usuário do Supabase
      console.error("Erro ao inserir usuário no banco local:", dbError);

      // Nota: Em produção, considere implementar uma estratégia de rollback mais robusta
      return res.status(500).json({
        error: "Erro ao salvar usuário no banco de dados",
        message: dbError.message,
      });
    }
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
    console.error("Erro no registro:", error);
    return res.status(500).json({
      error: "Erro interno do servidor",
      message: error.message,
    });
  }
}

/**
 * Registro administrativo de novo usuário (ADMIN ou MOTORISTA)
 *
 * Permite que um administrador crie usuários com roles ADMIN ou MOTORISTA
 * sem deslogar da própria sessão, usando o Service Role do Supabase
 *
 * Requer: middleware authenticate + authorize(['ADMIN'])
 *
 * Fluxo:
 * 1. Valida os dados (email, password e role)
 * 2. Verifica se o role é ADMIN ou MOTORISTA
 * 3. Usa admin.createUser do Supabase (Service Role)
 * 4. Insere o registro na tabela 'users' do banco local
 *
 * @param {Object} req - Request object (req.user deve estar presente via middleware)
 * @param {Object} res - Response object
 */
export async function adminRegisterUser(req, res) {
  try {
    // Verificar se o Supabase Admin está configurado
    if (!supabaseAdmin) {
      return res.status(503).json({
        error: "Serviço administrativo não disponível",
        message:
          "Variável de ambiente SUPABASE_SERVICE_ROLE_KEY não está configurada",
      });
    }

    // 1. Validação do corpo da requisição com Zod
    const validatedData = adminRegisterSchema.parse(req.body);
    const { email, password, role } = validatedData;

    // 2. Criar usuário no Supabase Auth usando Service Role
    // Isso permite criar usuários sem deslogar da sessão do admin
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirmar email para usuários criados pelo admin
      });

    if (authError) {
      return res.status(400).json({
        error: "Erro ao criar usuário no Supabase",
        message: authError.message,
      });
    }

    if (!authData.user) {
      return res.status(500).json({
        error: "Erro ao criar usuário",
        message: "Dados do usuário não retornados pelo Supabase",
      });
    }

    // 3. Inserir na tabela 'users' do banco local usando o UUID do Supabase
    try {
      const [newUser] = await knex("users")
        .insert({
          id: authData.user.id, // UUID do Supabase Auth
          email: authData.user.email,
          role, // ADMIN ou MOTORISTA
        })
        .returning(["id", "email", "role", "created_at"]);

      return res.status(201).json({
        message: "Usuário criado com sucesso pelo administrador",
        user: {
          id: newUser.id, // UUID do Supabase
          email: newUser.email,
          role: newUser.role,
          created_at: newUser.created_at,
        },
        created_by: {
          id: req.user.id,
          email: req.user.email,
        },
      });
    } catch (dbError) {
      // Se falhou ao inserir no banco local, tentar limpar o usuário do Supabase
      console.error("Erro ao inserir usuário no banco local:", dbError);

      // Tentar deletar o usuário do Supabase
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      } catch (deleteError) {
        console.error("Erro ao fazer rollback do usuário:", deleteError);
      }

      return res.status(500).json({
        error: "Erro ao salvar usuário no banco de dados",
        message: dbError.message,
      });
    }
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
    console.error("Erro no registro administrativo:", error);
    return res.status(500).json({
      error: "Erro interno do servidor",
      message: error.message,
    });
  }
}

/**
 * Login de usuário
 *
 * Fluxo:
 * 1. Valida os dados do corpo da requisição usando Zod
 * 2. Autentica via Supabase Auth
 * 3. Busca os dados complementares na tabela 'users' do banco local
 * 4. Retorna os dados do usuário e o token de sessão
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function login(req, res) {
  try {
    // Verificar se o Supabase está configurado
    if (!supabase) {
      return res.status(503).json({
        error: "Serviço de autenticação não disponível",
        message:
          "Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY não estão configuradas",
      });
    }

    // 1. Validação do corpo da requisição com Zod
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    // 2. Autenticar via Supabase
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      return res.status(401).json({
        error: "Credenciais inválidas",
        message: authError.message,
      });
    }

    if (!authData.user || !authData.session) {
      return res.status(500).json({
        error: "Erro na autenticação",
        message: "Sessão não foi criada",
      });
    }

    // 3. Buscar dados complementares na tabela local usando UUID
    const localUser = await knex("users")
      .where({ id: authData.user.id }) // Buscar pelo UUID do Supabase
      .first(["id", "email", "role", "created_at", "updated_at"]);

    if (!localUser) {
      return res.status(404).json({
        error: "Usuário não encontrado",
        message:
          "Usuário autenticado no Supabase mas não existe no banco local",
      });
    }

    // 4. Retornar dados do usuário e token
    return res.status(200).json({
      message: "Login realizado com sucesso",
      user: {
        id: localUser.id, // UUID do Supabase
        email: localUser.email,
        role: localUser.role,
        created_at: localUser.created_at,
        updated_at: localUser.updated_at,
      },
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at,
        expires_in: authData.session.expires_in,
      },
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
    console.error("Erro no login:", error);
    return res.status(500).json({
      error: "Erro interno do servidor",
      message: error.message,
    });
  }
}

/**
 * Logout de usuário
 *
 * Finaliza a sessão no Supabase Auth
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function logout(req, res) {
  try {
    // Verificar se o Supabase está configurado
    if (!supabase) {
      return res.status(503).json({
        error: "Serviço de autenticação não disponível",
        message:
          "Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY não estão configuradas",
      });
    }

    // Obter o token do header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Token não fornecido",
        message: "Header Authorization deve conter um Bearer token",
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    // Finalizar sessão no Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(500).json({
        error: "Erro ao fazer logout",
        message: error.message,
      });
    }

    return res.status(200).json({
      message: "Logout realizado com sucesso",
    });
  } catch (error) {
    console.error("Erro no logout:", error);
    return res.status(500).json({
      error: "Erro interno do servidor",
      message: error.message,
    });
  }
}

// Exportação para ES Modules
export default {
  register,
  adminRegisterUser,
  login,
  logout,
};
