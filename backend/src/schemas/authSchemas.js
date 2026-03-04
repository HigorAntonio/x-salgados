import { z } from "zod";

/**
 * Schema de validação para registro público (rota /register)
 * Aceita APENAS email e password
 * O role 'COMPRADOR' é automaticamente atribuído no servidor
 */
export const publicRegisterSchema = z
  .object({
    email: z
      .string({
        required_error: "Email é obrigatório",
        invalid_type_error: "Email deve ser uma string",
      })
      .email("Email inválido")
      .toLowerCase()
      .trim(),

    password: z
      .string({
        required_error: "Senha é obrigatória",
        invalid_type_error: "Senha deve ser uma string",
      })
      .min(6, "Senha deve ter no mínimo 6 caracteres")
      .max(100, "Senha deve ter no máximo 100 caracteres"),
  })
  .strict(); // Rejeita campos extras como "role"

/**
 * Schema de validação para registro administrativo (rota /admin/register-user)
 * Permite criar usuários com roles MOTORISTA ou ADMIN
 * Requer autenticação e autorização de ADMIN
 */
export const adminRegisterSchema = z.object({
  email: z
    .string({
      required_error: "Email é obrigatório",
      invalid_type_error: "Email deve ser uma string",
    })
    .email("Email inválido")
    .toLowerCase()
    .trim(),

  password: z
    .string({
      required_error: "Senha é obrigatória",
      invalid_type_error: "Senha deve ser uma string",
    })
    .min(6, "Senha deve ter no mínimo 6 caracteres")
    .max(100, "Senha deve ter no máximo 100 caracteres"),

  role: z
    .enum(["ADMIN", "MOTORISTA"], {
      required_error: "Role é obrigatório",
      invalid_type_error: "Role deve ser ADMIN ou MOTORISTA",
    })
    .describe("Papel do usuário no sistema (ADMIN ou MOTORISTA)"),
});

/**
 * Schema de validação para registro de usuário (DEPRECATED)
 * Mantido para compatibilidade com código existente
 * Use publicRegisterSchema ou adminRegisterSchema
 */
export const registerSchema = z.object({
  email: z
    .string({
      required_error: "Email é obrigatório",
      invalid_type_error: "Email deve ser uma string",
    })
    .email("Email inválido")
    .toLowerCase()
    .trim(),

  password: z
    .string({
      required_error: "Senha é obrigatória",
      invalid_type_error: "Senha deve ser uma string",
    })
    .min(6, "Senha deve ter no mínimo 6 caracteres")
    .max(100, "Senha deve ter no máximo 100 caracteres"),

  role: z
    .enum(["ADMIN", "COMPRADOR", "MOTORISTA"], {
      required_error: "Role é obrigatório",
      invalid_type_error: "Role deve ser ADMIN, COMPRADOR ou MOTORISTA",
    })
    .describe("Papel do usuário no sistema"),
});

/**
 * Schema de validação para login
 * Valida: email e password
 */
export const loginSchema = z.object({
  email: z
    .string({
      required_error: "Email é obrigatório",
      invalid_type_error: "Email deve ser uma string",
    })
    .email("Email inválido")
    .toLowerCase()
    .trim(),

  password: z
    .string({
      required_error: "Senha é obrigatória",
      invalid_type_error: "Senha deve ser uma string",
    })
    .min(1, "Senha não pode estar vazia"),
});
