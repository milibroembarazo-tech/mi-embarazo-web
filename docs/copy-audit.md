# Auditoría de copy de la web

Alcance de esta pasada: páginas públicas de marketing en castellano/catalán, páginas legales y 404. No es una validación legal ni un inventario semántico completo de cada frase.

## Cambios y cobertura

- Se completaron en catalán las secciones ausentes de portada, diario, libro y regalo; se corrigieron artículos y el sentido de los titulares para conservar el original castellano.
- Se añadieron rutas catalanas de privacidad, términos y cookies, con canonical, enlaces desde navegación/pie y entradas en sitemap.
- El borrador de privacidad de la app ya usa «comentarios/comentaris» en vez de los restos ingleses «feedback/checkout».
- El 404 tiene selector Español/Català que funciona por ancla CSS sin JavaScript; se verificó en navegador que el texto y los enlaces catalanes quedan visibles al elegir Català.
- `npm run test:copy` comprueba la paridad de secciones, titulares, rutas legales, sitemap y contrato del 404. El mismo check corre en validación de PR y antes del job de publicación.

## Verificación reproducible

Precondiciones: Node.js 22; no requiere dependencias de red ni credenciales.

Desde la raíz:

```sh
npm run validate
npm run test:copy
npm run test:nav
npm run test:validate
git diff --check
```

Esperado: HTML válido, contenido catalán y rutas coherentes, navegación sin regresiones y diff sin whitespace inválido. Obtenido en este worktree: 19 HTML validados; los tres scripts de test pasaron y `git diff --check` no reportó errores.

Inspección manual del 404: `python3 -m http.server 4174 --bind 127.0.0.1 --directory site`; abrir `http://127.0.0.1:4174/404.html`, elegir Català y confirmar el titular «Aquesta pàgina no està disponible.» y los dos enlaces catalanes. Resultado observado: los nodos castellanos se ocultan y quedan visibles el titular, la descripción y las rutas CA. La portada catalana se revisó a 375×812 en el hero y primeras secciones, y a 1440×900 en una sección añadida; esta pasada no comprobó todas las secciones/páginas en ambos tamaños.

## Pendientes

- La política de privacidad dice que se actualizará cuando se incorporen pagos, mientras el sitio ofrece un checkout de prueba con aviso de que no se cobrará. No se verificó el modo configurado en Stripe ni se hizo revisión legal; confirmar los hechos antes de convertir las páginas legales en versión definitiva o publicitar pagos.
- Las pruebas automatizadas no evalúan calidad jurídica ni cada frase traducida. La revisión visual fue de portada CA y 404; no constituye revisión completa de cada página en todos los anchos.
- El merge de este repo despliega GitHub Pages mediante `deploy-github-pages.yml`; hace falta autorización específica para publicar estos cambios.
