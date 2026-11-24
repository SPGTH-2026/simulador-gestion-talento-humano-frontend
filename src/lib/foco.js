// Foco programático que no mueve la página. El navegador, al enfocar un elemento, desplaza lo necesario para mostrarlo; en el marco de
// la aplicación (contenido con su propio desplazamiento) eso podía arrastrar el documento entero y sacar la barra superior de la
// pantalla. Un campo editable es la excepción: si se enfoca por código, el usuario necesita verlo (y que quede visible al abrir el
// teclado), así que ahí se deja el comportamiento normal.
const EDITABLES = 'input:not([type=button]):not([type=submit]):not([type=checkbox]):not([type=radio]), textarea, select, [contenteditable]'

export function esEditable(elemento) {
  return Boolean(elemento?.matches?.(EDITABLES))
}

export function enfocar(elemento) {
  if (!elemento?.focus) return
  if (esEditable(elemento)) elemento.focus()
  else elemento.focus({ preventScroll: true })
}
