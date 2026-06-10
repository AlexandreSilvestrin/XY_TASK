export function ProvisoesExplanation() {
  return (
    <div className="explanation-content">
      <p>
        A pasta selecionada deve conter <strong>todos os arquivos de provisões juntos</strong>,
        referentes aos <strong>dois meses</strong> que serão processados.
      </p>

      <section className="explanation-content__section">
        <h3 className="explanation-content__heading">Padrão do nome dos arquivos</h3>

        <p>
          Cada arquivo Excel deve seguir o padrão abaixo, com hífens, espaços e extensão
          exatamente como no exemplo.
        </p>

        <p className="explanation-content__label">Partes do nome</p>
        <ul className="explanation-content__list">
          <li>
            <strong>Texto fixo (obrigatório):</strong> Provisão Férias e 13º
          </li>
          <li>
            <strong>Nome do consórcio:</strong> referente ao consórcio (ex.:{' '}
            <strong>CDHU-9</strong>)
          </li>
          <li>
            <strong>Data:</strong> mês e ano com espaço entre eles (ex.:{' '}
            <strong>04 2026</strong>)
          </li>
          <li>
            <strong>Extensão:</strong> <strong>.xlsx</strong>
          </li>
        </ul>

        <p className="explanation-content__label">Formato</p>
        <p className="provisoes-filename-pattern">
          <span className="provisoes-filename-pattern__fixed">Provisão Férias e 13º</span>
          <span className="provisoes-filename-pattern__sep"> - </span>
          <span className="provisoes-filename-pattern__variable">NOME</span>
          <span className="provisoes-filename-pattern__sep"> - </span>
          <span className="provisoes-filename-pattern__date">MÊS ANO</span>
          <span className="provisoes-filename-pattern__fixed">.xlsx</span>
        </p>

        <p className="explanation-content__label">Exemplo</p>
        <p className="provisoes-filename-example">
          Provisão Férias e 13º - CDHU-9 - 04 2026.xlsx
        </p>

        <p className="explanation-content__obs">
          Os hífens com espaços (<strong> - </strong>) fazem parte do padrão e devem ser
          mantidos igual ao exemplo.
        </p>
      </section>
    </div>
  )
}
