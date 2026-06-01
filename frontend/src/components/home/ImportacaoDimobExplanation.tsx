const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'] as const

const HEADER_ROW_1 = [
  'CLIENTE',
  'RAZÃO SOCIAL',
  'CPF/CNPJ',
  'INICIO DA LOCAÇÃO',
  'DATA BAIXA',
  'VALOR RECEBIMENTO',
  '',
  'NBB CONSULTORIA LTDA',
  '',
  '',
  '',
  '',
] as const

const HEADER_ROW_2 = [
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  'RECEBTO BRUTO',
  'INVESTIMENTOS',
  'COMISSÃO',
  'DESPESAS',
  'RECEBTO LÍQUIDO',
] as const

const EXAMPLE_ROWS = [
  {
    cells: [
      '0073',
      'BLUE WHALE COMERCIO DE ELETRON',
      '46.139.478/0001-40',
      '24/12/2024',
      '15/08/2025',
      '1.000,00',
      '',
      '1.000,00',
      '0,00',
      '200,00',
      '200,00',
      '800,00',
    ],
  },
  {
    cells: [
      '0074',
      'EXEMPLO LOCADORA LTDA',
      '12.345.678/0001-90',
      '01/01/2024',
      '30/06/2025',
      '2.500,00',
      '',
      '2.500,00',
      '100,00',
      '300,00',
      '150,00',
      '2.150,00',
    ],
  },
] as const

const COLUMN_ORDER = [
  'Cliente',
  'Razão social',
  'CPF/CNPJ',
  'Início da locação',
  'Data baixa',
  'Valor recebimento',
  'Recebimento bruto',
  'Investimentos',
  'Comissão',
  'Despesas',
  'Recebto líquido',
] as const

export function ImportacaoDimobExplanation() {
  return (
    <div className="explanation-content">
      <p>
        O arquivo selecionado para transformar na importação deve ser um Excel com
        algumas regras obrigatórias para sair corretamente.
      </p>

      <ol className="explanation-content__list explanation-content__list--ordered">
        <li>
          <strong>Os dados devem começar na terceira linha do Excel.</strong> As
          linhas 1 e 2 servem somente para cabeçalho ou podem ficar vazias — nenhum
          registro de cliente ou valor pode aparecer antes da linha 3.
        </li>
        <li>A ordem das colunas deve ser a seguinte:</li>
      </ol>

      <p className="explanation-content__obs">
        <strong>Regra essencial:</strong> a primeira linha com informações de
        importação (código, razão social, CPF/CNPJ, datas e valores) precisa ser a{' '}
        <strong>linha 3</strong> da planilha.
      </p>

      <p className="explanation-content__column-order">
        {COLUMN_ORDER.map((label, index) => (
          <span key={label}>
            {index > 0 && <span className="explanation-content__sep"> — </span>}
            <strong>{label}</strong>
          </span>
        ))}
      </p>

      <section className="explanation-content__section">
        <h3 className="explanation-content__heading">Exemplo de planilha</h3>

        <div
          className="excel-preview dimob-excel-preview"
          role="img"
          aria-label="Exemplo de planilha Excel para importação DIMOB"
        >
          <table className="excel-preview__table">
            <thead>
              <tr>
                {COL_LABELS.map((col) => (
                  <th key={col} className="excel-preview__col-head">
                    {col}
                  </th>
                ))}
              </tr>
              <tr>
                {HEADER_ROW_1.map((cell, index) => (
                  <th
                    key={`h1-${index}`}
                    className={
                      cell
                        ? 'excel-preview__text excel-preview__header-cell'
                        : 'excel-preview__empty'
                    }
                  >
                    {cell}
                  </th>
                ))}
              </tr>
              <tr>
                {HEADER_ROW_2.map((cell, index) => (
                  <th
                    key={`h2-${index}`}
                    className={
                      cell
                        ? 'excel-preview__text excel-preview__header-cell'
                        : 'excel-preview__empty'
                    }
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EXAMPLE_ROWS.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.cells.map((cell, cellIndex) => {
                    if (!cell) {
                      return <td key={cellIndex} className="excel-preview__empty" />
                    }
                    const isDate = cellIndex === 3 || cellIndex === 4
                    const isMoney = cellIndex >= 5 && cellIndex !== 6
                    return (
                      <td
                        key={cellIndex}
                        className={
                          isDate
                            ? 'excel-preview__date'
                            : isMoney
                              ? 'excel-preview__value'
                              : 'excel-preview__text'
                        }
                      >
                        {cell}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="explanation-content__footnote">
        Não é obrigatório que os nomes das colunas estejam escritos corretamente ou
        que existam — apenas a <strong>ordem</strong> das informações importa. Se
        alguma coluna de dado não tiver valor, preencha com <strong>0</strong> (no
        mínimo). Se houver alguma coluna vazia entre outras, não há problema, desde
        que ela esteja <strong>totalmente vazia</strong> (sem texto, números ou
        fórmulas em nenhuma linha).
      </p>
    </div>
  )
}
