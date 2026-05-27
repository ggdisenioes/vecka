import Link from 'next/link'
import { createElement } from 'react'

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function ButtonLink({ href, children, variant = 'primary', className = '', ...props }) {
  return (
    <Link href={href} className={cn('vk-button', variant !== 'primary' && variant, className)} {...props}>
      {children}
    </Link>
  )
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  return (
    <button className={cn('vk-button', variant !== 'primary' && variant, className)} {...props}>
      {children}
    </button>
  )
}

export function Badge({ children, tone = '', className = '' }) {
  return <span className={cn('vk-badge', tone, className)}>{children}</span>
}

export function Card({ children, as: Component = 'article', padded = true, className = '', ...props }) {
  return createElement(
    Component,
    { className: cn('vk-card', padded && 'vk-card-padded', className), ...props },
    children,
  )
}

export function MetricCard({ value, label, className = '' }) {
  return (
    <article className={cn('vk-metric-card', className)}>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  )
}

export function PageHeader({ kicker, title, lede, actions = null, className = '' }) {
  return (
    <header className={cn('vk-page-header', className)}>
      <div className="vk-page-header-copy">
        {kicker ? <p className="vk-kicker">{kicker}</p> : null}
        <h1 className="vk-page-title">{title}</h1>
        {lede ? <p className="vk-page-lede">{lede}</p> : null}
      </div>
      {actions ? <div className="vk-cluster">{actions}</div> : null}
    </header>
  )
}

export function EmptyState({ children, className = '', ...props }) {
  return <div className={cn('vk-empty', className)} {...props}>{children}</div>
}
