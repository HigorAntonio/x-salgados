import { z } from "zod";

/**
 * Schema de validação para registro de usuário
 * Valida: email, password e role
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
