export function NotasFaturamentoExplanation() {
  return (
    <div className="explanation-content">
      <p className="explanation-content__lead">Transforma os arquivos de:</p>
      <ul className="explanation-content__list">
        <li>Serviços tomados modelo I56052026.txt</li>
        <li>Entrada modelo E052026.txt</li>
        <li>Retenção.pdf</li>
        <li>Serviços prestados modelo I51052026.txt</li>
      </ul>

      <section className="explanation-content__section">
        <h3 className="explanation-content__heading">Local dos arquivos:</h3>
        <p>
          Deve selecionar uma pasta principal onde, dentro, estarão as pastas dos
          consórcios.
        </p>
        <p className="explanation-content__label">Exemplo:</p>
        <pre className="explanation-tree">{`LBR
├── CONSORCIOA
├── CONSORCIOB
├── CONSORCIOC
└── ...`}</pre>
      </section>

      <section className="explanation-content__section">
        <p>
          Dentro de cada pasta de consórcio deve haver as pastas de{' '}
          <strong>Serviços tomados</strong> (com o arquivo de retenção e o .txt
          específico), <strong>Entrada</strong> (com seu .txt) e{' '}
          <strong>Serviços prestados</strong> (para faturamento).
        </p>
        <p className="explanation-content__label">Exemplo CONSORCIOA:</p>
        <pre className="explanation-tree">{`Serviços tomados
├── I56052026.txt
└── Retenção.pdf
Entrada
└── E052026.txt
Serviços prestados
└── I51052026.txt`}</pre>
      </section>

      <p className="explanation-content__obs">
        <strong>OBS:</strong> a pasta <strong>Serviços prestados</strong> só é
        obrigatória se for realizar faturamento.
      </p>

      <p className="explanation-content__footnote">
        Os campos de mês e ano são referentes à data no nome dos arquivos, por
        exemplo em <span className="explanation-filename">I56052026.txt</span>:
        mês <span className="explanation-month">05</span> e ano{' '}
        <span className="explanation-year">2026</span>.
      </p>

      <section className="explanation-content__section explanation-content__section--continued">
        <h3 className="explanation-content__heading">Pesquisar CNPJ</h3>
        <p>
          Antes de gerar as notas ou faturamento, pesquisa os CNPJs que não estão
          no banco de dados com o nome preenchido.
        </p>
        <p>
          Após a pesquisa, é possível ver a <strong>lista de CNPJs consultados</strong>{' '}
          e <strong>alterar o nome diretamente na tabela</strong>, corrigindo o que
          vier errado, antes de clicar em <strong>Salvar dados pesquisados</strong> para
          gravar no banco.
        </p>
        <p>
          Se quiser um arquivo Excel com CNPJ e nomes que tem no banco, use o
          botão <strong>Exportar banco</strong>. Se quiser importar dados de
          algum Excel, clique em <strong>Importar banco</strong> e selecione o
          arquivo.
        </p>
        <p className="explanation-content__obs">
          <strong>OBS:</strong> para importar, o arquivo Excel deve ter somente
          as colunas <strong>CNPJ</strong> e <strong>NOME</strong>, com os dados
          preenchidos abaixo.
        </p>
      </section>

      <section className="explanation-content__section explanation-content__section--continued">
        <h3 className="explanation-content__heading">Editar CNPJ</h3>
        <p>
          Pelo botão <strong>Editar CNPJ</strong>, na aba de notas, é possível
          consultar um CNPJ que já esteja no banco e corrigir o nome manualmente.
        </p>
        <p>
          Serve para arrumar registros que vieram errados na pesquisa ou na
          importação, ou quando quiser ajustar o que foi inserido — por exemplo,
          removendo alguma parte do nome que não deveria estar lá — antes de salvar
          novamente no banco.
        </p>
        <p>
          Informe o CNPJ, clique em <strong>Pesquisar</strong> para trazer o nome
          atual do banco, edite o campo <strong>Nome</strong> e use{' '}
          <strong>Salvar</strong> para atualizar ou incluir o registro.
        </p>
      </section>
    </div>
  )
}
