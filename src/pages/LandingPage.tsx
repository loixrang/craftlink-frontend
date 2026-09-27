import { ArrowRight, Armchair, Camera, Hammer, MapPin, Scissors, Search, Send, Wrench, Zap, Droplets, Paintbrush } from 'lucide-react'
import { Link } from 'react-router-dom'

const categories = [
  { name: 'Electrical Services', icon: Zap },
  { name: 'Plumbing', icon: Droplets },
  { name: 'Carpentry', icon: Hammer },
  { name: 'Painting', icon: Paintbrush },
  { name: 'Tailoring/Fashion Design', icon: Scissors },
  { name: 'Appliance Repair', icon: Wrench },
  { name: 'Photography', icon: Camera },
  { name: 'Furniture Making', icon: Armchair },
]

const steps = [
  { title: 'Start with what you need', description: 'Explore services for your home, your business or your next project.', icon: Search },
  { title: 'Get to know an artisan', description: 'Look through profiles, services and past work to find a good fit.', icon: Wrench },
  { title: 'Take the next step', description: 'Use available contact details or send a service request with your project needs.', icon: Send },
]

const primaryLink = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-accent px-5 py-3 text-sm font-semibold text-on-accent no-underline hover:bg-accent-hover hover:text-on-accent'

export function LandingPage() {
  return (
    <div className="space-y-16 sm:space-y-20">
      <section aria-labelledby="landing-title" className="grid items-center gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
        <div>
          <p className="mb-5 flex items-center gap-2 text-sm font-semibold text-accent-hover"><MapPin size={18} aria-hidden="true" />Local skills. Everyday possibilities.</p>
          <h1 id="landing-title" className="max-w-2xl text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl">Find the right hands for the job.</h1>
          <p className="mt-6 max-w-xl text-lg text-ink-muted">From the repairs that cannot wait to the projects you have been planning. Connect with skilled artisans through Craftlink.</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link to="/artisans" className={primaryLink}>Explore artisans<ArrowRight size={18} aria-hidden="true" /></Link>
            <a href="#services" className="inline-flex min-h-11 items-center px-2 text-sm font-semibold">Explore services</a>
          </div>
        </div>
        <aside aria-labelledby="project-title" className="rounded-panel border border-line bg-surface-muted p-6 sm:p-8">
          <div className="mb-8 flex items-center justify-between gap-4"><Wrench size={32} className="text-accent" aria-hidden="true" /><span className="text-sm text-ink-muted">Made for everyday needs</span></div>
          <h2 id="project-title" className="text-2xl tracking-tight">A small fix.<br />A fresh start.<br />Something made for you.</h2>
          <p className="mt-5 text-ink-muted">Find skills that help bring your plans to life, from plumbing and painting to tailoring and furniture making.</p>
          <p className="mt-8 border-t border-line pt-5 text-sm font-medium">Your project starts with a connection.</p>
        </aside>
      </section>

      <section id="services" aria-labelledby="services-title" className="scroll-mt-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div><p className="mb-2 text-sm font-semibold text-accent-hover">What do you have in mind?</p><h2 id="services-title" className="text-3xl tracking-tight">Skills for the everyday and beyond</h2></div>
          <Link to="/artisans" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold">Explore all artisans<ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
        <ul className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map(({ name, icon: Icon }) => (
            <li key={name} className="border-b border-line">
              <Link to={`/artisans?q=${encodeURIComponent(name)}`} className="group flex min-h-24 items-center gap-4 py-5 text-ink no-underline hover:text-accent-hover">
                <Icon size={24} className="shrink-0 text-accent" aria-hidden="true" />
                <span className="flex-1 text-sm font-semibold">{name}</span><ArrowRight size={16} className="shrink-0" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="steps-title" className="border-t border-line pt-12">
        <h2 id="steps-title" className="text-3xl tracking-tight">From an idea to a conversation</h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-3">
          {steps.map(({ title, description, icon: Icon }, index) => <li key={title}>
            <div className="mb-4 flex items-center gap-3 text-accent-hover"><Icon size={22} aria-hidden="true" /><span className="text-sm font-semibold">Step {index + 1}</span></div>
            <h3 className="text-lg">{title}</h3><p className="mt-3 text-ink-muted">{description}</p>
          </li>)}
        </ol>
      </section>

      <section aria-labelledby="artisan-title" className="flex flex-col items-start justify-between gap-6 rounded-panel border border-line bg-accent-soft p-6 sm:p-10 md:flex-row md:items-center">
        <div className="max-w-xl"><p className="mb-2 text-sm font-semibold text-accent-hover">For the people who make it happen</p><h2 id="artisan-title" className="text-3xl tracking-tight">Your skills deserve to be seen.</h2><p className="mt-4 text-ink-muted">Create an artisan account to share your services and work with customers looking for skills like yours.</p></div>
        <Link to="/register" className={`${primaryLink} shrink-0`}>Join as an artisan<ArrowRight size={18} aria-hidden="true" /></Link>
      </section>
    </div>
  )
}
