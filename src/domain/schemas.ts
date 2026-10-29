import { z } from "zod";
import { cpfValido, somenteDigitos } from "./cpf";

const cpf = z.string().refine(cpfValido, "CPF inválido");
const digitos = (min: number, max: number, mensagem: string) =>
  z.string().refine((v) => somenteDigitos(v).length >= min && somenteDigitos(v).length <= max, mensagem);

export const itensSchema = z
  .array(z.object({ slug: z.string().min(1).max(120), quantidade: z.number().int().min(1).max(10) }))
  .min(1, "O carrinho está vazio")
  .max(20);

export const cotacaoSchema = z.object({ itens: itensSchema });

export const pedidoSchema = z.object({
  nome: z.string().trim().min(3).max(160),
  email: z.email().max(200),
  cpf,
  itens: itensSchema,
  aceiteAcademico: z.literal(true, "Confirme que entende que este é um projeto acadêmico"),
});

export const pagamentoSchema = z.discriminatedUnion("metodo", [
  z.object({ metodo: z.literal("pix") }),
  z.object({ metodo: z.literal("debito") }),
  z.object({
    metodo: z.literal("credito"),
    parcelas: z.number().int().min(1).max(21),
    cartao: z.object({
      nome: z.string().trim().min(3).max(100),
      numero: digitos(13, 19, "Número do cartão inválido"),
      mes: z.string().regex(/^(0[1-9]|1[0-2])$/, "Mês inválido"),
      ano: z.string().regex(/^\d{4}$/, "Ano inválido"),
      cvv: z.string().regex(/^\d{3,4}$/, "CVV inválido"),
    }),
    titular: z.object({
      nome: z.string().trim().min(3).max(160),
      email: z.email(),
      cpf,
      cep: digitos(8, 8, "CEP inválido"),
      numeroEndereco: z.string().trim().min(1).max(10),
      telefone: digitos(10, 11, "Telefone inválido"),
    }),
  }),
]);

export const webhookSchema = z.object({
  id: z.string().min(1),
  event: z.string(),
  payment: z.object({ id: z.string() }).optional(),
});
