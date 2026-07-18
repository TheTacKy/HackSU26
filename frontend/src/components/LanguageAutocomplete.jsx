import { useMemo, useState } from 'react'
import PropTypes from 'prop-types'

const languageSuggestions = [
  'Assembly',
  'Bash',
  'C',
  'C#',
  'C++',
  'Clojure',
  'CSS',
  'Dart',
  'Elixir',
  'Go',
  'Groovy',
  'Haskell',
  'HTML',
  'Java',
  'JavaScript',
  'Julia',
  'Kotlin',
  'Lua',
  'Objective-C',
  'PHP',
  'Python',
  'R',
  'Ruby',
  'Rust',
  'Scala',
  'Shell',
  'SQL',
  'Swift',
  'TypeScript',
]

function normalizeLanguages(languages) {
  const seen = new Set()
  return languages.filter((language) => {
    const key = language.toLowerCase()
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

function LanguageAutocomplete({ value, onChange }) {
  const [query, setQuery] = useState('')
  const [showOptions, setShowOptions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return languageSuggestions.filter((language) => {
      const alreadySelected = value.some((item) => item.toLowerCase() === language.toLowerCase())
      return !alreadySelected && (!normalizedQuery || language.toLowerCase().includes(normalizedQuery))
    })
  }, [query, value])

  const addLanguage = (language) => {
    onChange(normalizeLanguages([...value, language]))
    setQuery('')
    setShowOptions(false)
    setHighlightedIndex(0)
  }

  const removeLanguage = (language) => {
    const key = language.toLowerCase()
    onChange(value.filter((item) => item.toLowerCase() !== key))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setShowOptions(true)
      setHighlightedIndex((prev) => (
        filteredOptions.length === 0 ? 0 : (prev + 1) % filteredOptions.length
      ))
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setShowOptions(true)
      setHighlightedIndex((prev) => (
        filteredOptions.length === 0 ? 0 : (prev - 1 + filteredOptions.length) % filteredOptions.length
      ))
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      const highlightedLanguage = filteredOptions[highlightedIndex]
      if (showOptions && highlightedLanguage) {
        addLanguage(highlightedLanguage)
      }
    }
  }

  return (
    <div>
      <label className="block text-white font-semibold mb-2">
        Coding Languages
      </label>
      <div className="relative mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowOptions(true)
            setHighlightedIndex(0)
          }}
          onFocus={() => setShowOptions(true)}
          onKeyDown={handleKeyDown}
          onBlur={() => setShowOptions(false)}
          className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          placeholder="Search for a language"
          role="combobox"
          aria-expanded={showOptions}
          aria-controls="language-options"
          aria-autocomplete="list"
        />
        {showOptions && filteredOptions.length > 0 && (
          <div
            id="language-options"
            role="listbox"
            className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-lg border border-zinc-600 bg-zinc-800 shadow-xl"
          >
            {filteredOptions.map((language, index) => (
              <button
                key={language}
                type="button"
                role="option"
                aria-selected={index === highlightedIndex}
                onMouseEnter={() => setHighlightedIndex(index)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  addLanguage(language)
                }}
                className={`block w-full px-4 py-2 text-left text-sm transition-colors ${
                  index === highlightedIndex
                    ? 'bg-sky-600 text-white'
                    : 'text-zinc-200 hover:bg-zinc-700'
                }`}
              >
                {language}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex min-h-8 flex-wrap gap-2 mt-2">
        {value.map((language) => (
          <span
            key={language}
            className="inline-flex items-center px-3 py-1 bg-sky-600 text-white rounded-full text-sm"
          >
            {language}
            <button
              type="button"
              onClick={() => removeLanguage(language)}
              className="ml-2 hover:text-red-300"
              aria-label={`Remove ${language}`}
            >
              x
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}

LanguageAutocomplete.propTypes = {
  value: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
}

export default LanguageAutocomplete
