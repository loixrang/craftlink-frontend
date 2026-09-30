import { useEffect } from 'react'

type SeoMetadataProps = {
  title: string
  description: string
  canonicalPath: string
  indexable?: boolean
}

export function SeoMetadata({ title, description, canonicalPath, indexable = true }: SeoMetadataProps) {
  useEffect(() => {
    document.title = title
    setMeta('name', 'description', description)
    setMeta('name', 'robots', indexable ? 'index, follow' : 'noindex, nofollow')
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', canonicalUrl(canonicalPath))
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setLink('canonical', canonicalUrl(canonicalPath))
  }, [title, description, canonicalPath, indexable])

  return null
}

function canonicalUrl(path: string) {
  return __SITE_ORIGIN__ ? new URL(path, __SITE_ORIGIN__).toString() : ''
}

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.append(element)
  }
  if (content) element.content = content
}

function setLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!href) {
    element?.remove()
    return
  }
  if (!element) {
    element = document.createElement('link')
    element.rel = rel
    document.head.append(element)
  }
  element.href = href
}
