import { useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
const languages = ['Any language', 'Assembly', 'Bash', 'C', 'C#', 'C++', 'Clojure', 'CSS', 'Dart', 'Elixir', 'Go', 'Groovy', 'Haskell', 'HTML', 'Java', 'JavaScript', 'Julia', 'Kotlin', 'Lua', 'Objective-C', 'PHP', 'Python', 'R', 'Ruby', 'Rust', 'Scala', 'Shell', 'SQL', 'Swift', 'TypeScript']
export default function LanguageAutocomplete({ value, onChange }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const input = useRef(null)
  const options = useMemo(() => languages.filter(language => !value.some(item => item.toLowerCase() === language.toLowerCase()) && language.toLowerCase().includes(query.trim().toLowerCase())), [query, value])
  useEffect(() => { if (open) document.getElementById(`language-option-${active}`)?.scrollIntoView({ block: 'nearest' }) }, [active, open])
  const add = language => { onChange(language === 'Any language' ? [] : [...value, language]); setQuery(''); setOpen(false); setActive(0); input.current?.focus() }
  const keyDown = e => {
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false) }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setOpen(true); setActive(previous => !open ? 0 : options.length ? (previous + (e.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length : 0) }
    if (e.key === 'Enter' && open) { e.preventDefault(); if (options[active]) add(options[active]) }
  }
  return <div className="language-field"><label htmlFor="languages">Your languages </label><div className="language-input-wrap"><input ref={input} id="languages" autoComplete="off" value={query} onChange={e => { setQuery(e.target.value); setOpen(true); setActive(0) }} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onKeyDown={keyDown} placeholder="Search languages, e.g. Python, TypeScript…" role="combobox" aria-expanded={open} aria-controls={open ? 'language-options' : undefined} aria-autocomplete="list" aria-activedescendant={open && options[active] ? `language-option-${active}` : undefined} /><span className="input-symbol" aria-hidden="true">⌕</span>{open && <div id="language-options" role="listbox" aria-label="Programming languages" className="language-options">{options.length ? options.map((language, i) => <div id={`language-option-${i}`} key={language} role="option" aria-selected={i === active} onMouseEnter={() => setActive(i)} onMouseDown={e => e.preventDefault()} onClick={() => add(language)}>{language}<span aria-hidden="true">+</span></div>) : <div role="option" aria-selected="false">No matching languages</div>}</div>}</div><div className="selected-languages">{value.length === 0 && <span className="any-language-tag">Any language</span>}{value.map(language => <span key={language}>{language}<button type="button" aria-label={`Remove ${language}`} onClick={() => onChange(value.filter(item => item !== language))}>×</button></span>)}</div></div>
}
LanguageAutocomplete.propTypes = { value: PropTypes.arrayOf(PropTypes.string).isRequired, onChange: PropTypes.func.isRequired }


