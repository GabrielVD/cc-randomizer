const modules = import.meta.glob<string>('./assets/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
})

const riskImages: Record<string, string> = {}

for (const [path, url] of Object.entries(modules)) {
  const code = path.slice(path.lastIndexOf('/') + 1, -'.webp'.length)
  riskImages[code] = url
}

export default riskImages
