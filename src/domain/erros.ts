// Erro que a API mostra ao comprador como está, com o status HTTP dele.
export class ErroDeNegocio extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
