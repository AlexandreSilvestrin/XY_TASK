import type { CnpjRow } from '../../types/cnpj'

type CnpjTableProps = {
  rows: CnpjRow[]
  onChangeRow: (index: number, field: keyof CnpjRow, value: string) => void
  onAddRow: () => void
  onRemoveRow: (index: number) => void
  disabled?: boolean
  highlightIndex?: number | null
}

export function CnpjTable({
  rows,
  onChangeRow,
  onAddRow,
  onRemoveRow,
  disabled = false,
  highlightIndex = null,
}: CnpjTableProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-intensity-3">
        <table className="cnpj-table w-full min-w-[24rem] table-fixed border-collapse">
          <thead>
            <tr>
              <th className="w-[40%]">CNPJ</th>
              <th className="w-[50%]">Nome</th>
              <th className="w-[10%] text-center"> </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-sm text-muted/80">
                  Nenhum CNPJ na tabela. Adicione uma linha para começar.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={index}
                  data-highlight={highlightIndex === index ? 'true' : undefined}
                >
                  <td>
                    <input
                      type="text"
                      value={row.cnpj}
                      onChange={(e) => onChangeRow(index, 'cnpj', e.target.value)}
                      disabled={disabled}
                      placeholder="CNPJ"
                      className="cnpj-table-input"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={row.nome}
                      onChange={(e) => onChangeRow(index, 'nome', e.target.value)}
                      disabled={disabled}
                      placeholder="Nome"
                      className="cnpj-table-input"
                    />
                  </td>
                  <td className="text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveRow(index)}
                      disabled={disabled}
                      aria-label="Remover linha"
                      className="rounded-lg border border-intensity-2 px-2 py-1 text-xs text-accent hover:bg-intensity-fill-2 disabled:opacity-40"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={onAddRow}
        disabled={disabled}
        className="self-start rounded-xl border border-intensity-3 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-accent transition-colors hover:bg-intensity-fill-2 disabled:opacity-50"
      >
        + Adicionar linha
      </button>
    </div>
  )
}
