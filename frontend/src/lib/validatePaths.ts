export type PathValidationResult =
  | { ok: true }
  | { ok: false; message: string }

export function validateEntradaSaida(
  entrada: string,
  saida: string,
): PathValidationResult {
  const entradaOk = entrada.trim() !== ''
  const saidaOk = saida.trim() !== ''

  if (!entradaOk && !saidaOk) {
    return {
      ok: false,
      message:
        'Preencha o local dos arquivos e o local para salvar para enviar.',
    }
  }

  if (!entradaOk) {
    return {
      ok: false,
      message: 'Preencha o local dos arquivos para enviar.',
    }
  }

  if (!saidaOk) {
    return {
      ok: false,
      message: 'Preencha o local para salvar para enviar.',
    }
  }

  return { ok: true }
}
