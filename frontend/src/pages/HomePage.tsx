import { useEffect, useState } from 'react'
import { fetchAppVersion, formatAppVersionLabel } from '../api/version'
import { ExplanationAccordion } from '../components/home/ExplanationAccordion'
import { ExcelParaPrnExplanation } from '../components/home/ExcelParaPrnExplanation'
import { NotasFaturamentoExplanation } from '../components/home/NotasFaturamentoExplanation'
import { ImportacaoDimobExplanation } from '../components/home/ImportacaoDimobExplanation'
import { RazaoExplanation } from '../components/home/RazaoExplanation'
import { useLicenses } from '../context/LicenseContext'

const FALLBACK_VERSION_LABEL = 'V.?.?.?'

export default function HomePage() {
  const [versionLabel, setVersionLabel] = useState(FALLBACK_VERSION_LABEL)
  const { isPageLicensed } = useLicenses()

  useEffect(() => {
    let cancelled = false

    fetchAppVersion()
      .then((result) => {
        if (cancelled) return
        if (result.version) {
          setVersionLabel(formatAppVersionLabel(result.version))
        }
      })
      .catch(() => {
        if (!cancelled) setVersionLabel(FALLBACK_VERSION_LABEL)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="explanation-page">
      <header className="explanation-page__header">
        <h1 className="font-display text-4xl font-bold tracking-wide text-accent sm:text-5xl">
          EXPLICAÇÃO
        </h1>
        <p className="explanation-page__version font-display text-3xl font-bold text-accent sm:text-4xl">
          XY Task {versionLabel}
        </p>
      </header>

      <div className="explanation-page__list">
        <ExplanationAccordion
          title="NOTAS / FATURAMENTO"
          disabled={!isPageLicensed('notas-faturamento')}
        >
          <NotasFaturamentoExplanation />
        </ExplanationAccordion>

        <ExplanationAccordion
          title="EXCEL PARA PRN"
          disabled={!isPageLicensed('excel-prn')}
        >
          <ExcelParaPrnExplanation />
        </ExplanationAccordion>

        <ExplanationAccordion
          title="RAZÃO"
          disabled={!isPageLicensed('razao')}
        >
          <RazaoExplanation />
        </ExplanationAccordion>

        <ExplanationAccordion
          title="IMPORTAÇÃO DIMOB"
          disabled={!isPageLicensed('importacao-dimob')}
        >
          <ImportacaoDimobExplanation />
        </ExplanationAccordion>
      </div>

      <p className="explanation-page__note">
        Todos os padrões de pastas e arquivos exigidos foram de acordo com o que foi
        enviado anteriormente. Caso seja necessária alguma mudança em padrões de
        Excel, TXT ou pasta, é só solicitar.
      </p>

      <footer className="explanation-page__footer">
        Criado por{' '}
        <a
          href="https://github.com/AlexandreSilvestrin"
          target="_blank"
          rel="noopener noreferrer"
          className="explanation-page__footer-link"
        >
          Alexandre Silvestrin
        </a>
      </footer>
    </div>
  )
}
