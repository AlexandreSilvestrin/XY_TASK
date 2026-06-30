export function ApuracaoPisCofinsExplanation() {
  return (
    <div className="explanation-content">
      <p>
        A pasta selecionada deve conter <strong>apenas arquivos Excel de um consórcio único</strong>{' '}
        sendo <strong>LBR</strong>, <strong>SONDOTECNICA</strong> ou <strong>PLANSERVI</strong>, e
        deve selecionar qual você está fazendo no momento clicando nos botões.
      </p>

      <section className="explanation-content__section">
        <h3 className="explanation-content__heading">Nome do consórcio nos códigos</h3>

        <p>
          Ao adicionar ou alterar os códigos de PIS e COFINS, use o nome que está dentro do arquivo
          Excel, <strong>sem</strong> escrever <strong>CONSORCIO</strong>, <strong>acentos</strong> e{' '}
          <strong>pontos</strong>. Deve ter apenas <strong>letras maiúsculas</strong>.
        </p>

        <p className="explanation-content__label">Exemplo</p>
        <p className="apuracao-nome-example">
          <span className="apuracao-nome-example__origem">
            CONSORCIO LBR - BONIN - J.A.GARRELHAS
          </span>
          <span className="apuracao-nome-example__arrow" aria-hidden>
            →
          </span>
          <span className="apuracao-nome-example__destino">LBR BONIN J A GARRELHAS</span>
        </p>

        <p className="explanation-content__obs">
          <strong>obs:</strong> espaços a mais ou outros caracteres podem não pegar corretamente.
        </p>
      </section>

      <section className="explanation-content__section">
        <h3 className="explanation-content__heading">Ordem dos códigos</h3>

        <p>
          Se for adicionar códigos, coloque na <strong>ordem das colunas</strong> que aparecem no
          Excel.
        </p>
      </section>
    </div>
  )
}
