type PrnExampleRow = {
  b?: string
  c?: string
  d?: string
  e?: string
  f?: string
  h?: string
  spacer?: boolean
}

const EXCEL_EXAMPLE_ROWS: PrnExampleRow[] = [
  {
    b: '103',
    c: '9',
    d: '1',
    e: '855527',
    f: '31/01/2026',
    h: 'PROVISÃO DE FÉRIAS REF. 01/2026',
  },
  {
    b: '104',
    c: '10',
    d: '1',
    e: '68440',
    f: '31/01/2026',
    h: 'FGTS S/ PROVISÃO DE FÉRIAS REF. 01/2026',
  },
  {
    b: '105',
    c: '11',
    d: '1',
    e: '245394',
    f: '31/01/2026',
    h: 'INSS S/ PROVISÃO DE FÉRIAS REF. 01/2026',
  },
  {
    b: '179',
    c: '240',
    d: '1',
    e: '2788159',
    f: '31/01/2026',
    h: 'PROVISÃO DE 13º SALÁRIO REF. 01/2026',
  },
  {
    b: '180',
    c: '242',
    d: '1',
    e: '223052',
    f: '31/01/2026',
    h: 'FGTS S/ PROVISÃO DE 13º SALÁRIO REF. 01/2026',
  },
  {
    b: '181',
    c: '241',
    d: '1',
    e: '838982',
    f: '31/01/2026',
    h: 'INSS S/ PROVISÃO DE 13º SALÁRIO REF. 01/2026',
  },
  { spacer: true },
  {
    b: '9',
    c: '103',
    f: '31/01/2026',
    h: 'BAIXA PROVISÃO DE FÉRIAS REF. 01/2026',
  },
  {
    b: '10',
    c: '104',
    f: '31/01/2026',
    h: 'BAIXA FGTS S/ PROVISÃO DE FÉRIAS REF. 01/2026',
  },
  {
    b: '11',
    c: '105',
    f: '31/01/2026',
    h: 'BAIXA INSS S/ PROVISÃO DE FÉRIAS REF. 01/2026',
  },
  {
    b: '240',
    c: '179',
    f: '31/01/2026',
    h: 'BAIXA PROVISÃO DE 13º SALÁRIO REF. 01/2026',
  },
  {
    b: '242',
    c: '180',
    f: '31/01/2026',
    h: 'BAIXA FGTS S/ PROVISÃO DE 13º SALÁRIO REF. 01/2026',
  },
  {
    b: '241',
    c: '181',
    f: '31/01/2026',
    h: 'BAIXA INSS S/ PROVISÃO DE 13º SALÁRIO REF. 01/2026',
  },
]

const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const

const COLUMN_DESCRIPTIONS = [
  { col: 'A', label: 'Vazia' },
  { col: 'B', label: 'Código da conta a débito' },
  { col: 'C', label: 'Código da conta a crédito' },
  { col: 'D', label: 'Código histórico' },
  { col: 'E', label: 'Valor' },
  { col: 'F', label: 'Data' },
  { col: 'G', label: 'Vazia' },
  { col: 'H', label: 'Descrição' },
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
        arquivos do <strong>mesmo consórcio</strong> — o nome informado será
        atribuído a todos os arquivos processados.
      </p>

      <section className="explanation-content__section">
        <h3 className="explanation-content__heading">Nome do arquivo gerado</h3>
        <p>
          Na tela, digite apenas o nome base, <strong>sem ponto e sem extensão</strong>.
          Por exemplo, informe <strong>FI02960296</strong>.
        </p>
        <p>
          O arquivo final será gerado como <strong>FI02960296.03</strong>. O sufixo{' '}
          <strong>.03</strong> é adicionado automaticamente na transformação, de acordo
          com o mês da data de cada planilha.
        </p>
      </section>

      <section className="explanation-content__section">
        <h3 className="explanation-content__heading">Padrão do Excel</h3>

        <p className="explanation-content__lead">
          Modelo <strong>Sem centro de custo</strong>
        </p>

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

        <div className="excel-preview" role="img" aria-label="Exemplo de planilha Excel para PRN">
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
              {EXCEL_EXAMPLE_ROWS.map((row, index) =>
                row.spacer ? (
                  <tr key={`spacer-${index}`}>
                    {COL_LABELS.map((col) => (
                      <td key={col} className="excel-preview__empty" />
                    ))}
                  </tr>
                ) : (
                  <tr key={index}>
                    <td className="excel-preview__empty" />
                    {renderCell(row.b, 'code')}
                    {renderCell(row.c, 'code')}
                    {renderCell(row.d, 'code')}
                    {renderCell(row.e, 'value')}
                    {renderCell(row.f, 'date')}
                    <td className="excel-preview__empty" />
                    {renderCell(row.h, 'text')}
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>

        <ul className="explanation-content__list">
          <li>
            Linhas que tiverem valores vazios serão removidas automaticamente — não há
            problema em mantê-las na planilha.
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

      <section className="explanation-content__section explanation-content__section--continued">
        <h3 className="explanation-content__heading">Modelo Com centro de custo</h3>
        <p>
          O modelo <strong>Com centro de custo</strong> ainda está em processo de
          definição. De acordo com o que for enviado, esta explicação e o tratamento
          serão atualizados.
        </p>
      </section>
    </div>
  )
}
