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

Dominio canónico previsto (DNS y configuración de Pages pendientes):

```text
https://miembarazo.app/
```

La URL técnica de GitHub Pages se conserva como origen mientras se completa el cambio:

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
- Apuntar el DNS de Porkbun a GitHub Pages y verificar HTTPS en el dominio propio.
- Conectar CTA principal con App Store, Google Play o waitlist real.
- Mover Flutter Web transaccional a `/app/*`.
- Configurar `APP_BASE_URL=https://miembarazo.app/` cuando el dominio esté activo.
- Verificar el dominio en Search Console después del cambio de DNS.
- Validar textos legales antes de campañas con captación o pagos.
- Completar y revisar la política de privacidad de la app antes de publicar las URLs de soporte/OAuth: proveedores y regiones, IA, conservación/borrado, transferencias y datos que puedan revelar salud.
- El canonical, sitemap, robots y `site/CNAME` ya apuntan al dominio previsto; completar DNS y activar el dominio en GitHub Pages después de revisar el PR.
- URLs previstas para Apple/Google: soporte `https://miembarazo.app/soporte-app/`; privacidad `https://miembarazo.app/privacidad-app/`; portada OAuth `https://miembarazo.app/`. No configurar Apple/Google hasta que el DNS esté activo y la política se valide.
