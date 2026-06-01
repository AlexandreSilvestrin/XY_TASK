export function RazaoExplanation() {
  return (
    <div className="explanation-content">
      <p>
        Pode ser selecionada uma pasta onde haja vários arquivos <strong>.txt</strong>{' '}
        de razão, ou um arquivo único por vez.
      </p>

      <section className="explanation-content__section">
        <h3 className="explanation-content__heading">Tipo de leitura</h3>

        <ul className="explanation-content__list">
          <li>
            <strong>Resumo</strong> — será feito um resumo em Excel para cada TXT.
          </li>
          <li>
            <strong>DFC</strong> — será solicitado informar as contas contrapartida
            para serem filtradas ao transformar o TXT para Excel.
          </li>
        </ul>
      </section>
    </div>
  )
}
