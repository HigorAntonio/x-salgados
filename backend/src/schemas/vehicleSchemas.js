import { z } from "zod";

/**
 * Schema de validação para criação de veículo
 *
 * Campos obrigatórios:
 * - tipo: Tipo do veículo (string)
 * - placa: Placa do veículo (string, formato brasileiro)
 * - capacidade_em_volumes: Capacidade em caixas padrão (inteiro >= 1)
 * - consumo_medio: Consumo médio em km/l (número positivo)
 * - autonomia_max: Autonomia máxima em km (inteiro positivo)
 *
 * Regras de negócio:
 * - Autonomia e consumo devem ser valores positivos
 */
export const createVehicleSchema = z.object({
  tipo: z
    .string({
      required_error: "Tipo é obrigatório",
      invalid_type_error: "Tipo deve ser uma string",
    })
    .min(1, "Tipo não pode ser vazio")
    .max(100, "Tipo deve ter no máximo 100 caracteres")
    .trim(),

  placa: z
    .string({
      required_error: "Placa é obrigatória",
      invalid_type_error: "Placa deve ser uma string",
    })
    .min(1, "Placa não pode ser vazia")
    .max(20, "Placa deve ter no máximo 20 caracteres")
    .trim()
    .refine(
      (val) => {
        // Validação básica de placa brasileira (formatos aceitos: ABC-1234 ou ABC1D234)
        const placaRegex = /^[A-Z]{3}-?\d{1}[A-Z0-9]{1}\d{2}$/i;
        return placaRegex.test(val.replace(/\s/g, ""));
      },
      {
        message:
          "Placa inválida. Formato esperado: ABC-1234 ou ABC1D23 (Mercosul)",
      }
    ),

  capacidade_em_volumes: z
    .number({
      required_error: "Capacidade em volumes é obrigatória",
      invalid_type_error: "Capacidade em volumes deve ser um número",
    })
    .int("Capacidade em volumes deve ser um número inteiro")
    .positive("Capacidade em volumes deve ser no mínimo 1"),

  consumo_medio: z
    .number({
      required_error: "Consumo médio é obrigatório",
      invalid_type_error: "Consumo médio deve ser um número",
    })
    .positive("Consumo médio deve ser um número positivo")
    .finite("Consumo médio deve ser um número finito")
    .refine((val) => val > 0, {
      message: "Consumo médio deve ser maior que zero",
    }),

  autonomia_max: z
    .number({
      required_error: "Autonomia máxima é obrigatória",
      invalid_type_error: "Autonomia máxima deve ser um número",
    })
    .int("Autonomia máxima deve ser um número inteiro")
    .positive("Autonomia máxima deve ser um número positivo")
    .refine((val) => val > 0, {
      message: "Autonomia máxima deve ser maior que zero",
    }),
});

/**
 * Schema de validação para atualização de veículo
 *
 * Todos os campos são opcionais, mas mantêm as mesmas regras
 * de validação quando fornecidos
 */
export const updateVehicleSchema = z.object({
  tipo: z
    .string({
      invalid_type_error: "Tipo deve ser uma string",
    })
    .min(1, "Tipo não pode ser vazio")
    .max(100, "Tipo deve ter no máximo 100 caracteres")
    .trim()
    .optional(),

  placa: z
    .string({
      invalid_type_error: "Placa deve ser uma string",
    })
    .min(1, "Placa não pode ser vazia")
    .max(20, "Placa deve ter no máximo 20 caracteres")
    .trim()
    .refine(
      (val) => {
        // Validação básica de placa brasileira
        const placaRegex = /^[A-Z]{3}-?\d{1}[A-Z0-9]{1}\d{2}$/i;
        return placaRegex.test(val.replace(/\s/g, ""));
      },
      {
        message:
          "Placa inválida. Formato esperado: ABC-1234 ou ABC1D23 (Mercosul)",
      }
    )
    .optional(),

  capacidade_em_volumes: z
    .number({
      invalid_type_error: "Capacidade em volumes deve ser um número",
    })
    .int("Capacidade em volumes deve ser um número inteiro")
    .positive("Capacidade em volumes deve ser no mínimo 1")
    .optional(),

  consumo_medio: z
    .number({
      invalid_type_error: "Consumo médio deve ser um número",
    })
    .positive("Consumo médio deve ser um número positivo")
    .finite("Consumo médio deve ser um número finito")
    .refine((val) => val > 0, {
      message: "Consumo médio deve ser maior que zero",
    })
    .optional(),

  autonomia_max: z
    .number({
      invalid_type_error: "Autonomia máxima deve ser um número",
    })
    .int("Autonomia máxima deve ser um número inteiro")
    .positive("Autonomia máxima deve ser um número positivo")
    .refine((val) => val > 0, {
      message: "Autonomia máxima deve ser maior que zero",
    })
    .optional(),
});
