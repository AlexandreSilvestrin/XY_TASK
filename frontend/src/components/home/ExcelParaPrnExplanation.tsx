type PrnExampleRow = {
  b?: string
  c?: string
  d?: string
  e?: string
  f?: string
  h?: string
  k?: string
  l?: string
}

const EXCEL_EXAMPLE_ROWS: PrnExampleRow[] = [
  {
    b: '402',
    c: '735',
    d: '314',
    e: '28213',
    f: '28/02/2026',
    h: 'DNIT-1 - CONSORCIO PPV',
    k: '1.10.020',
    l: '28213',
  },
  {
    b: '402',
    c: '664',
    d: '314',
    e: '54767',
    f: '28/02/2026',
    h: 'DNIT-2 - CONSORCIO PIAF',
    k: '1.10.088',
    l: '54767',
  },
  {
    b: '402',
    c: '1314',
    d: '314',
    e: '802214',
    f: '28/02/2026',
    h: 'ARTESP-8 - CONSORCIO LBR MODERA',
    k: '1.10.167',
    l: '802214',
  },
  {
    b: '402',
    c: '562',
    d: '314',
    e: '150000',
    f: '28/02/2026',
    h: 'CDHU-9 - CONSORCIO EXEMPLO',
    k: '1.10.200',
    l: '150000',
  },
]

const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'] as const

const COLUMN_DESCRIPTIONS = [
  { col: 'A', label: 'Vazia' },
  { col: 'B', label: 'Código da conta a débito' },
  { col: 'C', label: 'Código da conta a crédito' },
  { col: 'D', label: 'Código histórico' },
  { col: 'E', label: 'Valor' },
  { col: 'F', label: 'Data' },
  { col: 'G', label: 'Vazia' },
  { col: 'H', label: 'Descrição' },
  { col: 'I', label: 'Vazia' },
  { col: 'J', label: 'Vazia' },
  { col: 'K', label: 'Código centro de custo' },
  { col: 'L', label: 'Valor centro de custo' },
] as const

function renderCell(value: string | undefined, type: 'code' | 'value' | 'date' | 'text') {
  if (!value) {
    return <td className="excel-preview__empty" />
  }

  const className =
    type === 'value'
      ? 'excel-preview__value'
      : type === 'date'
        ? 'excel-preview__date'
        : type === 'text'
          ? 'excel-preview__text'
          : 'excel-preview__value'

  return <td className={className}>{value}</td>
}

export function ExcelParaPrnExplanation() {
  return (
    <div className="explanation-content">
      <p>
        Ao selecionar arquivos para transformar, é possível fazer um arquivo único
        clicando no botão <strong>Selecionar arquivo</strong>, ou o botão{' '}
        <strong>Selecionar pasta</strong> para fazer vários arquivos de uma vez.
      </p>

      <p className="explanation-content__obs">
        <strong>obs:</strong> a pasta deve conter somente arquivos Excel (
        <strong>.xlsx</strong>) com padrão especificado e, quando for pasta, apenas
        arquivos do <strong>mesmo consórcio</strong>.
      </p>

      <section className="explanation-content__section">
        <h3 className="explanation-content__heading">Padrão do Excel</h3>

        <p className="explanation-content__column-order">
          {COLUMN_DESCRIPTIONS.map(({ col, label }, index) => (
            <span key={col}>
              {index > 0 && <span className="explanation-content__sep"> — </span>}
              <strong>
                Coluna {col}: {label}
              </strong>
            </span>
          ))}
        </p>

        <div
          className="excel-preview prn-excel-preview"
          role="img"
          aria-label="Exemplo de planilha Excel para PRN"
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
            </thead>
            <tbody>
              {EXCEL_EXAMPLE_ROWS.map((row, index) => (
                <tr key={index}>
                  <td className="excel-preview__empty" />
                  {renderCell(row.b, 'code')}
                  {renderCell(row.c, 'code')}
                  {renderCell(row.d, 'code')}
                  {renderCell(row.e, 'value')}
                  {renderCell(row.f, 'date')}
                  <td className="excel-preview__empty" />
                  {renderCell(row.h, 'text')}
                  <td className="excel-preview__empty" />
                  <td className="excel-preview__empty" />
                  {renderCell(row.k, 'code')}
                  {renderCell(row.l, 'value')}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="explanation-content__list">
          <li>
            Linhas que tiverem valores vazios serão removidas automaticamente — não há
            problema em mantê-las na planilha.
          </li>
          <li>
            Acentos nos nomes e descrições são removidos automaticamente — não há
            problema em mantê-los na planilha.
          </li>
          <li>
            O tamanho dos espaços e a largura das colunas no Excel também não interferem
            no processamento.
          </li>
        </ul>
      </section>

      <p className="explanation-content__footnote">
        Algumas informações foram tiradas de layout de importação de movimentos.
      </p>
    </div>
  )
}
