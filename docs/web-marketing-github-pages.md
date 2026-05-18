# Web marketing y GitHub Pages

## Decisión

Usamos una web estática para SEO/marketing y reservamos Flutter Web para flujos transaccionales.

```text
/                 marketing SEO
/diario-embarazo/ landing SEO diario
/libro-embarazo/  landing SEO libro
/regalo-embarazo/ landing SEO regalo
/ca/              versión catalana
/privacidad/      privacidad
/terminos/        términos
/cookies/         cookies
/app/*            futuro Flutter Web transaccional
```

## Hosting inicial

La primera versión se publica con GitHub Pages desde `site/` mediante `.github/workflows/deploy-github-pages.yml`.

URL esperada:

```text
https://milibroembarazo-tech.github.io/mi-embarazo-web/
```

## Contenido incluido

- HTML estático indexable.
- Metadata SEO y Open Graph.
- `robots.txt`.
- `sitemap.xml`.
- JSON-LD de `Organization`, `WebSite`, `SoftwareApplication`, `FAQPage` y `Product`.
- Imagen hero generada con GPT Image y guardada optimizada en `site/assets/hero-memory-book.jpg`.
- Imagen Open Graph dedicada en `site/assets/og-mi-embarazo.jpg`.
- Página 404 de marca.
- Versión catalana inicial.

## Pendiente antes de campañas

- Sustituir `mailto:contacto@miembarazo.app` por el destino real.
- Añadir dominio propio y actualizar canonical/sitemap.
- Conectar CTA principal con App Store, Google Play o waitlist real.
- Mover Flutter Web transaccional a `/app/*`.
- Configurar `APP_BASE_URL` con la URL pública definitiva.
- Añadir Search Console cuando haya dominio final.
- Validar textos legales antes de campañas con captación o pagos.
