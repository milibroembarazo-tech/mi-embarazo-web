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
/soporte-app/     soporte de la app móvil (iOS/Android)
/privacidad-app/  borrador de privacidad de la app, pendiente de validación
/ca/suport-app/   suport de l'app mòbil
/ca/privacitat-app/ esborrany de privacitat de l'app, pendent de validació
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
- Completar y revisar la política de privacidad de la app antes de publicar las URLs de soporte/OAuth: identidad legal, proveedores y regiones, IA, conservación/borrado, transferencias y datos que puedan revelar salud.
- Sustituir el canonical provisional de GitHub Pages por el dominio oficial y actualizar `sitemap.xml` al publicar las páginas de la app.
- URLs provisionales si se publica en GitHub Pages: soporte `https://milibroembarazo-tech.github.io/mi-embarazo-web/soporte-app/`; privacidad `https://milibroembarazo-tech.github.io/mi-embarazo-web/privacidad-app/`. La portada de OAuth sería la raíz del sitio; no configurar Apple/Google hasta que el dominio oficial esté listo y la política se valide.
