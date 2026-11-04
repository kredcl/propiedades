# LOSA · Casas de hormigón y acero (demo)

Sitio de demostración para una desarrolladora inmobiliaria ficticia de Santiago. LOSA, sus residencias, los precios, la sala de ventas y los datos de contacto son **ficticios**.

Mezcla dos referencias de interacción:
- **Héroe** al estilo de Emarat Realty.
- **Resto del sitio** al estilo de Stillform.

La marca, los textos, la maqueta 3D y la composición son propios del proyecto.

## Identidad

- **Paleta "hormigón y metal":**
  - grafito `#21262B`
  - acero `#A9A9A9`
  - niebla `#F1F1F1`
  - pizarra `#778899`
  - acento óxido `#C4663A`, para acciones y para la capa activa de la maqueta
- **Tipografía:**
  - Instrument Serif para los titulares de voz
  - Familjen Grotesk para todo lo demás

## Secciones

1. **Héroe:**
   - un video aéreo avanza cuadro a cuadro con el scroll, desde la vista amplia hasta la piscina;
   - en `canvas`, 80 cuadros en WebP, con un juego para escritorio y otro vertical para teléfono;
   - tres frases se reemplazan.
2. **Una forma más tranquila de vivir:**
   - una nube de fotos converge en un marco;
   - después las fotos cambian con el scroll o con las flechas.
3. **Declaración:** la frase se ilumina palabra por palabra.
4. **LOSA / CASAS:** marquesina gigante con la foto de la Residencia 01, que crece hasta ocupar la pantalla.
5. **Estructura:**
   - maqueta 3D hecha en CSS que se separa por capas en 7 pasos: vista completa, muros, losas, techo, pilares, escalera, ventanas y puertas;
   - la capa activa se pinta en óxido.
6. **Residencias:** tarjetas que se apilan con la ficha de cada casa.
7. **No todo espacio necesita ser grande:** una foto pequeña se abre a pantalla completa (departamentos).
8. **Departamento piloto:** recorrido por 4 ambientes con fotos que se revelan y textos que cambian.
9. **Pasa adelante:** llamado a agendar una visita.
10. **Pie** con el cierre "Espacio, pensado.".

Con `prefers-reduced-motion` o sin JavaScript, todas las secciones se muestran estáticas y completas.

## Uso

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Medios

- **Video del héroe:** "Outdoor pool near a villa" de [Coverr](https://coverr.co) (licencia Coverr). Está convertido en cuadros invertidos y algo desaturados.
- **Fotos:** [Unsplash](https://unsplash.com) (licencia Unsplash). Hay que reemplazarlas por fotos reales de cada proyecto.
