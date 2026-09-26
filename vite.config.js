const { defineConfig } = require('vite')
const fs = require('node:fs')
const path = require('node:path')

module.exports = defineConfig({
  base: '/',
  plugins: [{
    name: 'eapl-custom-404',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (request.method !== 'GET' || !request.headers.accept?.includes('text/html')) return next()

        const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
        const requestedPath = path.resolve(__dirname, `.${pathname}`)
        const isInsideProject = requestedPath.startsWith(`${__dirname}${path.sep}`) || requestedPath === __dirname
        const exists = isInsideProject && (
          fs.existsSync(requestedPath) ||
          fs.existsSync(path.join(requestedPath, 'index.html'))
        )
        if (exists) return next()

        try {
          const source = fs.readFileSync(path.join(__dirname, '404.html'), 'utf8')
          const html = await server.transformIndexHtml('/404.html', source)
          response.statusCode = 404
          response.setHeader('Content-Type', 'text/html; charset=utf-8')
          response.end(html)
        } catch (error) {
          next(error)
        }
      })
    },
  }],
})
