import { z } from "zod";

/**
 * Schema de validação para criação de produto
 *
 * Campos obrigatórios:
 * - nome: Nome do produto (string)
 * - preco_venda: Preço de venda (número positivo)
 * - volumes_por_unidade: Espaço ocupado em caixas padrão (inteiro >= 1)
 *
 * Campos opcionais:
 * - descricao: Descrição do produto
 * - qtd_estoque: Quantidade em estoque (default: 0)
 */
export const createProductSchema = z.object({
  nome: z
    .string({
      required_error: "Nome é obrigatório",
      invalid_type_error: "Nome deve ser uma string",
    })
    .min(1, "Nome não pode ser vazio")
    .max(255, "Nome deve ter no máximo 255 caracteres")
    .trim(),

  descricao: z
    .string({
      invalid_type_error: "Descrição deve ser uma string",
    })
    .trim()
    .optional(),

  preco_venda: z
    .number({
      required_error: "Preço de venda é obrigatório",
      invalid_type_error: "Preço de venda deve ser um número",
    })
    .positive("Preço de venda deve ser um número positivo")
    .finite("Preço de venda deve ser um número finito"),

  qtd_estoque: z
    .number({
      invalid_type_error: "Quantidade em estoque deve ser um número",
    })
    .int("Quantidade em estoque deve ser um número inteiro")
    .nonnegative("Quantidade em estoque deve ser maior ou igual a zero")
    .default(0),

  volumes_por_unidade: z
    .number({
      required_error: "Volumes por unidade é obrigatório",
      invalid_type_error: "Volumes por unidade deve ser um número",
    })
    .int("Volumes por unidade deve ser um número inteiro")
    .positive("Volumes por unidade deve ser no mínimo 1"),
});

/**
 * Schema de validação para atualização de produto
 *
 * Todos os campos são opcionais, mas mantêm as mesmas regras
 * de validação quando fornecidos
 */
export const updateProductSchema = z.object({
  nome: z
    .string({
      invalid_type_error: "Nome deve ser uma string",
    })
    .min(1, "Nome não pode ser vazio")
    .max(255, "Nome deve ter no máximo 255 caracteres")
    .trim()
    .optional(),

  descricao: z
    .string({
      invalid_type_error: "Descrição deve ser uma string",
    })
    .trim()
    .optional()
    .nullable(),

  preco_venda: z
    .number({
      invalid_type_error: "Preço de venda deve ser um número",
    })
    .positive("Preço de venda deve ser um número positivo")
    .finite("Preço de venda deve ser um número finito")
    .optional(),

  qtd_estoque: z
    .number({
      invalid_type_error: "Quantidade em estoque deve ser um número",
    })
    .int("Quantidade em estoque deve ser um número inteiro")
    .nonnegative("Quantidade em estoque deve ser maior ou igual a zero")
    .optional(),

  volumes_por_unidade: z
    .number({
      invalid_type_error: "Volumes por unidade deve ser um número",
    })
    .int("Volumes por unidade deve ser um número inteiro")
    .positive("Volumes por unidade deve ser no mínimo 1")
    .optional(),
});
