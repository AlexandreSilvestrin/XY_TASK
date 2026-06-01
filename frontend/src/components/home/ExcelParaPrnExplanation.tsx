const EXCEL_EXAMPLE_ROWS = [
  {
    e: '83700',
    f: '01/03/2023',
    h: 'RETENÇÃO SOCIAL CF. NF 126 MV MAZZAMATI LTDA',
  },
  {
    e: '27000',
    f: '01/03/2023',
    h: 'IR RETIDO CF. NF 126 MV MAZZAMATI LTDA',
  },
  {
    e: '4816',
    f: '15/03/2023',
    h: 'RETENÇÃO SOCIAL CF. NF 10653 QUALITY CONSULTORIA LTDA',
  },
  {
    e: '1553',
    f: '15/03/2023',
    h: 'IR RETIDO CF. NF 10653 QUALITY CONSULTORIA LTDA',
  },
] as const

const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const

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
        <strong>.xlsx</strong>) com padrão especificado.
      </p>

      <section className="explanation-content__section">
        <h3 className="explanation-content__heading">Padrão do Excel</h3>

        <div className="excel-preview" role="img" aria-label="Exemplo de planilha Excel">
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
                  <td className="excel-preview__empty" />
                  <td className="excel-preview__empty" />
                  <td className="excel-preview__empty" />
                  <td className="excel-preview__value">{row.e}</td>
                  <td className="excel-preview__date">{row.f}</td>
                  <td className="excel-preview__empty" />
                  <td className="excel-preview__text">{row.h}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="explanation-content__footnote">
        É obrigatório as colunas <strong>A</strong>, <strong>B</strong>,{' '}
        <strong>C</strong>, <strong>D</strong> e <strong>G</strong> vazias, e os
        valores na coluna <strong>E</strong>, data na <strong>F</strong> e o nome
        na <strong>H</strong>. O espaçamento do Excel não é obrigatório — não
        mudando nada, isso é apenas visual para quem quer ler o Excel.
      </p>
    </div>
  )
}
