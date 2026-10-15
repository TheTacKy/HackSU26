import { useState, useEffect, useRef } from 'react'
import Cookies from 'js-cookie'
import RepositoryList from '../components/RepositoryList'
import Pagination from '../components/Pagination'
import LanguageAutocomplete from '../components/LanguageAutocomplete'

const API = (import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:8000')).replace(/\/$/, '')
const SIZE = 12
const defaults = { tech_stack: [], interests: '', skill_level: '', open_source_experience: '' }
const examples = ['Accessible web apps', 'Tools for game developers', 'Python for climate science']
function initialProfile() {
  try {
    const saved = JSON.parse(Cookies.get('formData') || 'null')
    if (saved && Array.isArray(saved.tech_stack) && saved.tech_stack.every(x => typeof x === 'string') && ['interests', 'skill_level', 'open_source_experience'].every(key => typeof saved[key] === 'string')) return saved
  } catch { /* Ignore outdated saved preferences. */ }
  return defaults
}
function scrollToResults() {
  requestAnimationFrame(() => document.getElementById('recommended-repositories')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }))
}
export default function Search() {
  const [formData, setFormData] = useState(initialProfile)
  const [submitted, setSubmitted] = useState(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [repos, setRepos] = useState(null)
  const [page, setPage] = useState(1)
  const [issueStates, setIssueStates] = useState({})
  const generation = useRef(0)
  const controllers = useRef(new Set())
  const pending = useRef(new Set())
  const interestsRef = useRef(null)
  useEffect(() => { Cookies.set('formData', JSON.stringify(formData), { expires: 7 }) }, [formData])
  useEffect(() => {
    const active = controllers.current
    return () => { generation.current += 1; active.forEach(controller => controller.abort()) }
  }, [])
  const loadIssues = async (candidates, profile, id, retry = false) => {
    const missing = candidates.filter(repo => !repo.issuesLoaded && !pending.current.has(repo.full_name) && (retry || !issueStates[repo.full_name]))
    if (!missing.length) return
    const names = new Set(missing.map(repo => repo.full_name))
    names.forEach(name => pending.current.add(name))
    setIssueStates(prev => ({ ...prev, ...Object.fromEntries([...names].map(name => [name, 'loading'])) }))
    const controller = new AbortController()
    controllers.current.add(controller)
    const timer = setTimeout(() => controller.abort(), 15000)
    try {
      const response = await fetch(`${API}/issues/batch`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal, body: JSON.stringify({ repositories: [...names], experience: profile.open_source_experience }) })
      if (!response.ok) throw new Error('Issue request failed')
      const data = await response.json()
      if (id !== generation.current) return
      setRepos(prev => prev?.map(repo => names.has(repo.full_name) && Array.isArray(data.issues?.[repo.full_name]) ? { ...repo, issues: data.issues[repo.full_name], issuesLoaded: true } : repo))
      setIssueStates(prev => ({ ...prev, ...Object.fromEntries([...names].map(name => [name, Array.isArray(data.issues?.[name]) ? 'done' : 'error'])) }))
    } catch {
      if (id === generation.current) setIssueStates(prev => ({ ...prev, ...Object.fromEntries([...names].map(name => [name, 'error'])) }))
    } finally {
      clearTimeout(timer)
      controllers.current.delete(controller)
      if (id === generation.current) names.forEach(name => pending.current.delete(name))
    }
  }
  const search = async profile => {
    if (!profile.interests.trim()) { setError('Tell us what you would like to work on.'); return }
    controllers.current.forEach(controller => controller.abort())
    pending.current.clear()
    const id = ++generation.current
    const snapshot = { ...profile, tech_stack: [...profile.tech_stack] }
    setSubmitted(snapshot); setLoading(true); setError(null); setRepos(null); setPage(1); setIssueStates({})
    scrollToResults()
    const controller = new AbortController()
    controllers.current.add(controller)
    const timer = setTimeout(() => controller.abort(), 30000)
    const started = performance.now()
    try {
      const response = await fetch(`${API}/match?include_issues=false`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal, body: JSON.stringify(snapshot) })
      if (!response.ok) {
        const failure = await response.json().catch(() => null)
        throw new Error(failure?.detail || 'We couldn’t complete your search. Please try again.')
      }
      const data = await response.json()
      if (!Array.isArray(data.recommendations)) throw new Error('We received an unexpected response. Please try again.')
      if (id !== generation.current) return
      const next = data.recommendations.map(repo => ({ ...repo, issues: [], issuesLoaded: false }))
      setRepos(next); setLoading(false)
      console.log(`[FRONTEND] repositories_received total_time=${((performance.now() - started) / 1000).toFixed(4)}s`)
      void loadIssues(next.slice(0, SIZE), snapshot, id, true)
    } catch (err) {
      if (id === generation.current) setError(err.name === 'AbortError' ? 'This search took too long. Try again or use a more specific interest.' : err.message)
    } finally {
      clearTimeout(timer); controllers.current.delete(controller)
      if (id === generation.current) setLoading(false)
    }
  }
  const editSearch = () => { requestAnimationFrame(() => interestsRef.current?.focus()) }
  const changePage = next => { setPage(next); void loadIssues(repos.slice((next - 1) * SIZE, next * SIZE), submitted, generation.current); scrollToResults() }
  const change = e => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  const pagination = repos ? { total_pages: Math.ceil(repos.length / SIZE), total_repos: repos.length, current_page: page } : null
  return (
    <div className="site-shell">
      <a href="#search-form" className="skip-link">Skip to search</a>
      <header className="site-header">
        <a href="/" className="brand"><span className="brand-mark" aria-hidden="true">⌘</span> repo<span className="brand-light">scout</span><span className="brand-dot">.</span></a>
        <a className="header-link" href="https://github.com" target="_blank" rel="noreferrer">Explore GitHub <span aria-hidden="true">↗</span></a>
      </header>
      <main className="main-content">
        <section className={`intro ${submitted ? 'intro-compact' : ''}`}>
          <h1>Find your corner of<br /><span>open source.</span></h1>
        </section>
        <section id="search-form" className="search-panel" aria-label="Find repositories">
          <form onSubmit={e => { e.preventDefault(); void search(formData) }}>
            <div className="panel-heading"><div><span className="eyebrow">THE STARTING POINT</span><h2>What would you like to build?</h2></div></div>
            <label htmlFor="interests">Interests & goals</label>
            <textarea ref={interestsRef} id="interests" name="interests" value={formData.interests} onChange={change} rows={2} maxLength={2000} required placeholder="e.g. I’d love to build accessible web apps with React…" />
            <div className="example-row"><span>Try an idea</span>{examples.map(example => <button type="button" key={example} onClick={() => { setFormData(prev => ({ ...prev, interests: example })); interestsRef.current?.focus() }}>{example} <span aria-hidden="true">↗</span></button>)}</div>
            <div className="form-divider" />
            <LanguageAutocomplete value={formData.tech_stack} onChange={tech_stack => setFormData(prev => ({ ...prev, tech_stack }))} />
            <div className="experience-grid">
              <div><label htmlFor="skill_level">Programming experience</label><select required id="skill_level" name="skill_level" value={formData.skill_level} onChange={change}><option value="">Choose your level</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="expert">Expert</option></select></div>
              <div><label htmlFor="open_source_experience">Open-source experience</label><select required id="open_source_experience" name="open_source_experience" value={formData.open_source_experience} onChange={change}><option value="">Choose your experience</option><option value="none">My first contribution</option><option value="some">A few contributions</option><option value="experienced">Regular contributor</option><option value="maintainer">Project maintainer</option></select></div>
            </div>
            <div className="form-footer"><button className="primary-button" disabled={loading} type="submit">{loading ? 'Finding your projects…' : 'Find my next project'} <span aria-hidden="true">→</span></button></div>
          </form>
        </section>
        {error && <div role="alert" className="error-panel"><div><strong>Let’s try that again</strong><p>{error}</p></div>{submitted && <button className="secondary-button" onClick={() => search(submitted)}>Retry search</button>}</div>}
        {(loading || repos !== null) && <>
          <RepositoryList repositories={repos?.slice((page - 1) * SIZE, page * SIZE)} pagination={pagination} loading={loading} issueStates={issueStates} languages={submitted?.tech_stack || []} onEdit={editSearch} onRetryIssues={repo => loadIssues([repo], submitted, generation.current, true)} />
          <Pagination pagination={pagination} currentPage={page} onPageChange={changePage} loading={loading} />
        </>}
      </main>
    </div>
  )
}




