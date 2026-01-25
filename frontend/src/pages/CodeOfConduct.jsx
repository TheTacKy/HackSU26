import { Link } from 'react-router-dom'

function CodeOfConduct() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      {/* Navigation Bar */}
      <nav className="bg-zinc-900/90 backdrop-blur-sm border-b border-zinc-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-white hover:text-emerald-400 transition-colors">
              HackSU26
            </Link>
            <div className="space-x-6">
              <Link to="/" className="text-zinc-300 hover:text-emerald-400 transition-colors">
                Home
              </Link>
              <Link to="/code-of-conduct" className="text-emerald-400 font-semibold">
                Code of Conduct
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">Open Source Community Code of Conduct</h1>
            <p className="text-xl text-zinc-300">
              Our commitment to fostering an inclusive, respectful, and welcoming community for all contributors.
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8 text-zinc-300">
            {/* Introduction */}
            <section className="bg-zinc-800/60 backdrop-blur-sm border border-zinc-700 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Our Pledge</h2>
              <p className="leading-relaxed">
                We as members, contributors, and leaders pledge to make participation in our community a harassment-free experience for everyone, regardless of age, body size, visible or invisible disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, caste, color, religion, or sexual identity and orientation.
              </p>
            </section>

            {/* Standards */}
            <section className="bg-zinc-800/60 backdrop-blur-sm border border-zinc-700 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Our Standards</h2>
              <p className="mb-4 leading-relaxed">
                Examples of behavior that contributes to a positive environment for our community include:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-6 ml-4">
                <li>Demonstrating empathy and kindness toward other people</li>
                <li>Being respectful of differing opinions, viewpoints, and experiences</li>
                <li>Giving and gracefully accepting constructive feedback</li>
                <li>Accepting responsibility and apologizing to those affected by our mistakes, and learning from the experience</li>
                <li>Focusing on what is best not just for us as individuals, but for the overall community</li>
              </ul>

              <p className="mb-4 leading-relaxed">
                Examples of unacceptable behavior include:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>The use of sexualized language or imagery, and sexual attention or advances of any kind</li>
                <li>Trolling, insulting or derogatory comments, and personal or political attacks</li>
                <li>Public or private harassment</li>
                <li>Publishing others' private information, such as a physical or email address, without their explicit permission</li>
                <li>Other conduct which could reasonably be considered inappropriate in a professional setting</li>
              </ul>
            </section>

            {/* Enforcement */}
            <section className="bg-zinc-800/60 backdrop-blur-sm border border-zinc-700 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Enforcement Responsibilities</h2>
              <p className="leading-relaxed">
                Community leaders are responsible for clarifying and enforcing our standards of acceptable behavior and will take appropriate and fair corrective action in response to any behavior that they deem inappropriate, threatening, offensive, or harmful.
              </p>
            </section>

            {/* Scope */}
            <section className="bg-zinc-800/60 backdrop-blur-sm border border-zinc-700 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Scope</h2>
              <p className="leading-relaxed">
                This Code of Conduct applies within all community spaces, and also applies when an individual is officially representing the community in public spaces. Examples of representing our community include using an official e-mail address, posting via an official social media account, or acting as an appointed representative at an online or offline event.
              </p>
            </section>

            {/* Getting Help */}
            <section className="bg-zinc-800/60 backdrop-blur-sm border border-zinc-700 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Reporting & Getting Help</h2>
              <p className="mb-4 leading-relaxed">
                If you experience or witness unacceptable behavior, or have any other concerns:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Report to community moderators or project maintainers</li>
                <li>Contact the project's code of conduct team</li>
                <li>Document the incident with details and evidence</li>
                <li>All reports will be reviewed and investigated promptly</li>
              </ul>
              <p className="leading-relaxed">
                All community leaders are obligated to respect the privacy and security of the reporter of any incident.
              </p>
            </section>

            {/* Guidelines */}
            <section className="bg-zinc-800/60 backdrop-blur-sm border border-zinc-700 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Contributing Guidelines</h2>
              <p className="mb-4 leading-relaxed">
                To make your open source journey positive and productive:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Read the README and CONTRIBUTING files</strong> - Each project has specific guidelines</li>
                <li><strong>Start small</strong> - Look for "good first issue" or "beginner-friendly" labels</li>
                <li><strong>Communicate respectfully</strong> - Ask questions, don't demand answers</li>
                <li><strong>Follow the project's coding standards</strong> - Consistency matters</li>
                <li><strong>Test your changes</strong> - Run tests before submitting pull requests</li>
                <li><strong>Be patient</strong> - Maintainers are volunteers; reviews may take time</li>
                <li><strong>Learn from feedback</strong> - Code review is an opportunity to grow</li>
                <li><strong>Give back</strong> - Help others once you're comfortable with the codebase</li>
              </ul>
            </section>

            {/* Attribution */}
            <section className="bg-zinc-800/60 backdrop-blur-sm border border-zinc-700 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Attribution</h2>
              <p className="leading-relaxed">
                This Code of Conduct is adapted from the <a href="https://www.contributor-covenant.org" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline">Contributor Covenant</a>, version 2.1, available at <a href="https://www.contributor-covenant.org/version/2/1/code_of_conduct.html" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline">https://www.contributor-covenant.org/version/2/1/code_of_conduct.html</a>.
              </p>
            </section>

            {/* CTA */}
            <section className="text-center py-8">
              <p className="text-lg text-zinc-300 mb-6">
                Ready to find your perfect open source project?
              </p>
              <Link
                to="/search"
                className="inline-block px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-lg transition-all duration-200 shadow-lg hover:shadow-emerald-500/50 transform hover:scale-105"
              >
                Get Started
              </Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CodeOfConduct
