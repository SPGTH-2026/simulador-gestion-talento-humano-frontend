#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
generar_docx.py - Convierte la documentacion Markdown del frontend en .docx

Uso:
    python generar_docx.py                 # convierte todos los .md de docs/
    python generar_docx.py un-archivo.md  # convierte solo ese
    python generar_docx.py --manual        # ademas genera el manual consolidado

Que hace:
    - Lee los .md de docs/ (o el que se le indique)
    - Escribe documentos Word con portada, indice navegable, estilos SENA,
      tablas reales, bloques de codigo sombreados y pie con numero de pagina
    - No toca el codigo del proyecto: solo escribe en documentos/

Requiere: python-docx
"""

import re
import unicodedata
import sys
from pathlib import Path

try:
    from docx import Document
    from docx.enum.section import WD_SECTION
    from docx.enum.table import WD_TABLE_ALIGNMENT
    from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
    from docx.oxml import OxmlElement
    from docx.oxml.ns import qn
    from docx.shared import Cm, Pt, RGBColor
except ImportError:
    sys.exit("Falta python-docx. Instala con:  pip install python-docx")


# --- Paleta institucional SENA (los mismos valores que src/index.css) ---

SENA_VERDE = RGBColor(0x39, 0xA9, 0x00)
SENA_VERDE_OSCURO = RGBColor(0x00, 0x78, 0x32)
SENA_AZUL = RGBColor(0x00, 0x30, 0x4D)
SENA_VIOLETA = RGBColor(0x71, 0x27, 0x7A)
GRIS_TEXTO = RGBColor(0x33, 0x33, 0x33)
GRIS_SUAVE = RGBColor(0x60, 0x66, 0x6A)
BLANCO = RGBColor(0xFF, 0xFF, 0xFF)

HEX_CODIGO_BG = "F2F4F3"
HEX_BORDE_CODIGO = "39A900"
HEX_CABECERA_TABLA = "00304D"
HEX_FILA_TABLA = "EFF4F7"
HEX_CITA_BG = "F4F8F4"
HEX_CITA_BARRA = "39A900"

FUENTE_TEXTO = "Calibri"
FUENTE_CODIGO = "Consolas"
FUENTE_TITULO = "Calibri Light"


# --- Utilidades XML (python-docx no expone sombreado ni campos) ---


def _sombrear(elemento_pr, color_hex):
    """Aplica un color de fondo a un pPr o tcPr."""
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), color_hex)
    elemento_pr.append(shd)


def _borde_izquierdo(elemento_pr, color_hex, grosor=18):
    """Barra vertical a la izquierda (estilo de bloque destacado)."""
    borders = OxmlElement("w:pBdr")
    left = OxmlElement("w:left")
    left.set(qn("w:val"), "single")
    left.set(qn("w:sz"), str(grosor))
    left.set(qn("w:space"), "8")
    left.set(qn("w:color"), color_hex)
    borders.append(left)
    elemento_pr.append(borders)


def _campo(parrafo, instruccion):
    """Inserta un campo de Word (TOC, PAGE, NUMPAGES...)."""
    inicio = OxmlElement("w:fldChar")
    inicio.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = instruccion
    separador = OxmlElement("w:fldChar")
    separador.set(qn("w:fldCharType"), "separate")
    fin = OxmlElement("w:fldChar")
    fin.set(qn("w:fldCharType"), "end")

    run = parrafo.add_run()
    run._r.append(inicio)
    run._r.append(instr)
    run._r.append(separador)
    run._r.append(fin)
    return run


def _enlace(parrafo, texto, url):
    """Hipervinculo real (no solo texto azul)."""
    parte_id = OxmlElement("w:hyperlink")
    parte_id.set(qn("r:id"), parrafo.part.relate_to(
        url,
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink",
        is_external=True,
    ))
    run = OxmlElement("w:r")
    props = OxmlElement("w:rPr")
    color = OxmlElement("w:color")
    color.set(qn("w:val"), "007832")
    props.append(color)
    subrayado = OxmlElement("w:u")
    subrayado.set(qn("w:val"), "single")
    props.append(subrayado)
    fuente = OxmlElement("w:rFonts")
    fuente.set(qn("w:ascii"), FUENTE_TEXTO)
    fuente.set(qn("w:hAnsi"), FUENTE_TEXTO)
    props.append(fuente)
    run.append(props)
    texto_el = OxmlElement("w:t")
    texto_el.text = texto
    run.append(texto_el)
    parte_id.append(run)
    parrafo._p.append(parte_id)


# --- Analizador de marcas en linea (negrita, codigo, enlaces) ---

RE_ENLACE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
RE_CODIGO = re.compile(r"`([^`]+)`")
RE_NEGRITA = re.compile(r"\*\*([^*]+)\*\*")
RE_CURSIVA = re.compile(r"(?<![\*\w])\*([^*\n]+)\*(?!\*)")


def escribir_en_linea(parrafo, texto, base_negrita=False, base_color=None,
                      base_mono=False, tamano=None):
    """Escribe texto con **negrita**, *cursiva*, `codigo` y [enlace](url)."""
    posicion = 0
    # Se busca el cambio mas cercano entre los tres patrones.
    patrones = [
        ("enlace", RE_ENLACE, "enlace"),
        ("codigo", RE_CODIGO, "codigo"),
        ("negrita", RE_NEGRITA, "negrita"),
        ("cursiva", RE_CURSIVA, "cursiva"),
    ]
    while posicion < len(texto):
        mejor = None
        for nombre, patron, tipo in patrones:
            m = patron.search(texto, posicion)
            if m and (mejor is None or m.start() < mejor[1].start()):
                mejor = (nombre, m, tipo)
        if mejor is None:
            break
        _, m, tipo = mejor
        if m.start() > posicion:
            _anadir_run(parrafo, texto[posicion:m.start()], base_negrita,
                        base_color, base_mono, tamano)
        if tipo == "enlace":
            _anadir_run(parrafo, m.group(1), base_negrita, base_color, base_mono, tamano)
            destino = m.group(2)
            if not destino.startswith(("http://", "https://", "mailto:")):
                destino = "https://" + destino
            _enlace(parrafo, m.group(1), destino)
        elif tipo == "codigo":
            _anadir_run(parrafo, m.group(1), base_negrita, RGBColor(0xA0, 0x30, 0x00),
                        True, tamano or 9.5)
        elif tipo == "negrita":
            escribir_en_linea(parrafo, m.group(1), True, base_color, base_mono, tamano)
        else:
            escribir_en_linea(parrafo, m.group(1), base_negrita, base_color,
                              base_mono, tamano)
            _marcar_ultimo_cursiva(parrafo)
        posicion = m.end()
    if posicion < len(texto):
        _anadir_run(parrafo, texto[posicion:], base_negrita, base_color,
                    base_mono, tamano)


def _anadir_run(parrafo, texto, negrita, color, mono, tamano):
    if not texto:
        return
    run = parrafo.add_run(texto)
    run.bold = bool(negrita)
    if color is not None:
        run.font.color.rgb = color
    if mono:
        run.font.name = FUENTE_CODIGO
        run._element.rPr.rFonts.set(qn("w:eastAsia"), FUENTE_CODIGO)
    if tamano:
        run.font.size = Pt(tamano)
    return run


def _marcar_ultimo_cursiva(parrafo):
    for run in reversed(parrafo.runs):
        if run.text:
            run.italic = True
            return


# --- El generador de documentos ---


class Documentador:
    def __init__(self, titulo, subtitulo):
        self.doc = Document()
        self.titulo = titulo
        self.subtitulo = subtitulo
        self._configurar_pagina()
        self._configurar_estilos()

    # -- presentacion --

    def _configurar_pagina(self):
        sec = self.doc.sections[0]
        sec.page_height = Cm(29.7)   # A4 alto
        sec.page_width = Cm(21.0)    # A4 ancho
        sec.top_margin = Cm(2.5)
        sec.bottom_margin = Cm(2.2)
        sec.left_margin = Cm(2.5)
        sec.right_margin = Cm(2.2)

    def _configurar_estilos(self):
        d = self.doc
        normal = d.styles["Normal"]
        normal.font.name = FUENTE_TEXTO
        normal.font.size = Pt(10.5)
        normal.font.color.rgb = GRIS_TEXTO
        normal.paragraph_format.space_after = Pt(7)
        normal.paragraph_format.line_spacing = 1.13

        titulos = [
            ("Title", 30, SENA_AZUL, FUENTE_TITULO),
            ("Heading 1", 20, SENA_VERDE_OSCURO, FUENTE_TITULO),
            ("Heading 2", 15.5, SENA_VERDE, FUENTE_TITULO),
            ("Heading 3", 12.5, SENA_AZUL, FUENTE_TEXTO),
            ("Heading 4", 11, SENA_VIOLETA, FUENTE_TEXTO),
        ]
        for nombre, tam, color, fuente in titulos:
            st = d.styles[nombre]
            st.font.name = fuente
            st.font.size = Pt(tam)
            st.font.color.rgb = color
            st.font.bold = nombre != "Title"
            st.paragraph_format.space_before = Pt(16 if nombre == "Heading 1" else 11)
            st.paragraph_format.space_after = Pt(6)
            st.paragraph_format.keep_with_next = True

    # -- portada --

    def portada(self, proyecto="Simulador de Gestion de Talento Humano"):
        d = self.doc
        for _ in range(4):
            d.add_paragraph()
        p = d.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(proyecto)
        r.font.size = Pt(13)
        r.font.color.rgb = SENA_VERDE
        r.bold = True

        p = d.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(10)
        r = p.add_run(self.titulo)
        r.font.name = FUENTE_TITULO
        r.font.size = Pt(34)
        r.font.color.rgb = SENA_AZUL

        p = d.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(self.subtitulo)
        r.font.size = Pt(14)
        r.font.color.rgb = GRIS_SUAVE

        p = d.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(6)
        r = p.add_run("_" * 46)
        r.font.color.rgb = SENA_VERDE
        r.font.size = Pt(14)

        d.add_paragraph()
        d.add_paragraph()
        p = d.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run("Frontend  ·  React 19  ·  Vite 8  ·  Tailwind CSS 4")
        r.font.size = Pt(11)
        r.font.color.rgb = GRIS_SUAVE

        d.add_paragraph().add_run().add_break(WD_BREAK.PAGE)

    # -- indice navegable --

    def indice(self, aviso="Para ver los numeros de pagina: clic derecho sobre el "
                          "indice > Actualizar campos > Actualizar toda la tabla."):
        d = self.doc
        p = d.add_paragraph()
        r = p.add_run("Contenido")
        r.font.name = FUENTE_TITULO
        r.font.size = Pt(22)
        r.font.color.rgb = SENA_VERDE_OSCURO
        r.bold = True
        p.paragraph_format.space_after = Pt(4)

        p = d.add_paragraph()
        r = p.add_run(aviso)
        r.italic = True
        r.font.size = Pt(8.5)
        r.font.color.rgb = GRIS_SUAVE

        p = d.add_paragraph()
        _campo(p, r'TOC \o "1-3" \h \z \u')
        d.add_paragraph().add_run().add_break(WD_BREAK.PAGE)

    # -- pie de pagina con numeracion --

    def pie_de_pagina(self):
        for sec in self.doc.sections:
            p = sec.footer.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run("Pagina ")
            r.font.size = Pt(8.5)
            r.font.color.rgb = GRIS_SUAVE
            _campo(p, "PAGE")
            r = p.add_run(" de ")
            r.font.size = Pt(8.5)
            r.font.color.rgb = GRIS_SUAVE
            _campo(p, "NUMPAGES")
            for run in p.runs:
                run.font.size = Pt(8.5)
                run.font.color.rgb = GRIS_SUAVE
                run.font.name = FUENTE_TEXTO

    # -- bloques de contenido --

    def h1(self, texto):
        p = self.doc.add_heading("", 1)
        escribir_en_linea(p, texto, base_color=SENA_VERDE_OSCURO, base_mono=False)
        for run in p.runs:
            run.font.color.rgb = SENA_VERDE_OSCURO
            run.font.name = FUENTE_TITULO
            run.font.size = Pt(20)
        return p

    def h2(self, texto):
        p = self.doc.add_heading("", 2)
        escribir_en_linea(p, texto)
        for run in p.runs:
            run.font.color.rgb = SENA_VERDE
            run.font.name = FUENTE_TITULO
            run.font.size = Pt(15.5)
        return p

    def h3(self, texto):
        p = self.doc.add_heading("", 3)
        escribir_en_linea(p, texto)
        for run in p.runs:
            run.font.color.rgb = SENA_AZUL
            run.font.name = FUENTE_TEXTO
            run.font.size = Pt(12.5)
        return p

    def h4(self, texto):
        p = self.doc.add_heading("", 4)
        escribir_en_linea(p, texto)
        for run in p.runs:
            run.font.color.rgb = SENA_VIOLETA
            run.font.name = FUENTE_TEXTO
            run.font.size = Pt(11)
        return p

    def parrafo(self, texto, cursiva=False):
        p = self.doc.add_paragraph()
        if cursiva:
            p.paragraph_format.left_indent = Cm(0.4)
        escribir_en_linea(p, texto)
        if cursiva:
            for run in p.runs:
                run.italic = True
                run.font.color.rgb = GRIS_SUAVE
        return p

    def vineta(self, texto, nivel=0):
        p = self.doc.add_paragraph(style="List Bullet")
        p.paragraph_format.left_indent = Cm(0.75 + nivel * 0.6)
        p.paragraph_format.space_after = Pt(2)
        escribir_en_linea(p, texto)
        return p

    def numerado(self, texto):
        p = self.doc.add_paragraph(style="List Number")
        p.paragraph_format.left_indent = Cm(0.75)
        p.paragraph_format.space_after = Pt(2)
        escribir_en_linea(p, texto)
        return p

    def codigo(self, texto, lenguaje=""):
        lineas = texto.rstrip("\n").split("\n")
        total = len(lineas)
        for i, linea in enumerate(lineas):
            p = self.doc.add_paragraph()
            pf = p.paragraph_format
            pf.left_indent = Cm(0.5)
            pf.right_indent = Cm(0.1)
            pf.space_before = Pt(6 if i == 0 else 0)
            pf.space_after = Pt(6 if i == total - 1 else 0)
            pf.line_spacing = 1.0
            if i < total - 1:
                pf.keep_with_next = True
            _sombrear(p._p.get_or_add_pPr(), HEX_CODIGO_BG)
            _borde_izquierdo(p._p.get_or_add_pPr(), HEX_BORDE_CODIGO, 12)
            r = p.add_run(linea if linea else " ")
            r.font.name = FUENTE_CODIGO
            r._element.rPr.rFonts.set(qn("w:eastAsia"), FUENTE_CODIGO)
            r.font.size = Pt(9)
            r.font.color.rgb = RGBColor(0x1B, 0x1B, 0x1B)
        return None

    def cita(self, texto):
        p = self.doc.add_paragraph()
        pf = p.paragraph_format
        pf.left_indent = Cm(0.5)
        pf.right_indent = Cm(0.1)
        pf.space_before = Pt(7)
        pf.space_after = Pt(9)
        _sombrear(p._p.get_or_add_pPr(), HEX_CITA_BG)
        _borde_izquierdo(p._p.get_or_add_pPr(), HEX_CITA_BARRA, 24)
        escribir_en_linea(p, texto)
        for run in p.runs:
            run.italic = True
            if run.font.color.rgb is None:
                run.font.color.rgb = SENA_AZUL
        return p

    def tabla(self, cabeceras, filas):
        t = self.doc.add_table(rows=1, cols=len(cabeceras))
        t.style = "Table Grid"
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        t.autofit = True

        # cabecera
        for i, texto in enumerate(cabeceras):
            celda = t.rows[0].cells[i]
            celda.text = ""
            p = celda.paragraphs[0]
            p.paragraph_format.space_before = Pt(3)
            p.paragraph_format.space_after = Pt(3)
            escribir_en_linea(p, texto, base_negrita=True, base_color=BLANCO)
            for run in p.runs:
                run.bold = True
                run.font.size = Pt(9.5)
                run.font.color.rgb = BLANCO
                run.font.name = FUENTE_TEXTO
            _sombrear(celda._tc.get_or_add_tcPr(), HEX_CABECERA_TABLA)

        # filas
        for indice, fila in enumerate(filas):
            celdas = t.add_row().cells
            for i in range(len(cabeceras)):
                texto = fila[i] if i < len(fila) else ""
                celda = celdas[i]
                celda.text = ""
                p = celda.paragraphs[0]
                p.paragraph_format.space_before = Pt(2)
                p.paragraph_format.space_after = Pt(2)
                escribir_en_linea(p, texto)
                for run in p.runs:
                    run.font.size = Pt(9.5)
                    if not run.bold:
                        run.font.color.rgb = GRIS_TEXTO
                if indice % 2 == 1:
                    _sombrear(celda._tc.get_or_add_tcPr(), HEX_FILA_TABLA)
        self.doc.add_paragraph().paragraph_format.space_after = Pt(2)
        return t

    def separador(self):
        p = self.doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(8)
        pPr = p._p.get_or_add_pPr()
        borders = OxmlElement("w:pBdr")
        abajo = OxmlElement("w:bottom")
        abajo.set(qn("w:val"), "single")
        abajo.set(qn("w:sz"), "6")
        abajo.set(qn("w:space"), "1")
        abajo.set(qn("w:color"), "C9D3D0")
        borders.append(abajo)
        pPr.append(borders)

    def salto_de_pagina(self):
        self.doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)

    def guardar(self, ruta):
        self.pie_de_pagina()
        self.doc.save(str(ruta))
        return ruta


# --- Analizador de Markdown -> llamadas al Documentador ---


def _partir_tabla(linea):
    """Convierte una fila |a|b|c| en lista de celdas, respetando \\| y `|`."""
    cuerpo = linea.strip()
    if cuerpo.startswith("|"):
        cuerpo = cuerpo[1:]
    if cuerpo.endswith("|"):
        cuerpo = cuerpo[:-1]
    celdas, actual, en_codigo = [], [], False
    i = 0
    while i < len(cuerpo):
        c = cuerpo[i]
        if c == "\\" and i + 1 < len(cuerpo) and cuerpo[i + 1] == "|":
            actual.append("|")
            i += 2
            continue
        if c == "`":
            en_codigo = not en_codigo
            actual.append(c)
        elif c == "|" and not en_codigo:
            celdas.append("".join(actual).strip())
            actual = []
        else:
            actual.append(c)
        i += 1
    celdas.append("".join(actual).strip())
    return celdas


def _es_separador_tabla(linea):
    if "|" not in linea:
        return False
    celdas = _partir_tabla(linea)
    return bool(celdas) and all(re.fullmatch(r":?-{2,}:?", c.strip()) for c in celdas if c.strip())


def convertir(md_texto, doc, opciones=None):
    opciones = opciones or {}
    lineas = md_texto.replace("\r\n", "\n").split("\n")
    i = 0
    n = len(lineas)
    primer_titulo_visto = False

    while i < n:
        linea = lineas[i]
        vacia = not linea.strip()

        # --- bloque de codigo ---
        if linea.lstrip().startswith("```"):
            lenguaje = linea.lstrip()[3:].strip()
            i += 1
            buffer = []
            while i < n and not lineas[i].lstrip().startswith("```"):
                buffer.append(lineas[i])
                i += 1
            i += 1  # cerrar ```
            doc.codigo("\n".join(buffer), lenguaje)
            continue

        # --- tabla ---
        if "|" in linea and i + 1 < n and _es_separador_tabla(lineas[i + 1]):
            cabeceras = _partir_tabla(linea)
            i += 2
            filas = []
            while i < n and "|" in lineas[i] and lineas[i].strip():
                filas.append(_partir_tabla(lineas[i]))
                i += 1
            doc.tabla(cabeceras, filas)
            continue

        # --- titulos ---
        m = re.match(r"^(#{1,6})\s+(.*)$", linea)
        if m:
            nivel = len(m.group(1))
            texto = m.group(2).strip()
            if nivel == 1 and not primer_titulo_visto:
                # el primer H1 es el titulo del documento: ya va en la portada
                primer_titulo_visto = True
                if opciones.get("titulo_h1_como_titulo", True):
                    i += 1
                    continue
            metodo = {2: doc.h1, 3: doc.h2, 4: doc.h3}.get(nivel)
            if metodo:
                metodo(texto)
            elif nivel >= 5:
                doc.h4(texto)
            i += 1
            continue

        # --- cita ---
        if linea.lstrip().startswith(">"):
            buffer = []
            while i < n and lineas[i].lstrip().startswith(">"):
                buffer.append(re.sub(r"^\s*>\s?", "", lineas[i]))
                i += 1
            doc.cita(" ".join(x.strip() for x in buffer if x.strip()))
            continue

        # --- separador ---
        if re.fullmatch(r"\s*(-{3,}|\*{3,}|_{3,})\s*", linea):
            doc.separador()
            i += 1
            continue

        # --- listas ---
        m_num = re.match(r"^\s*(\d+)\.\s+(.*)$", linea)
        m_vin = re.match(r"^(\s*)[-*+]\s+(.*)$", linea)
        if m_num or m_vin:
            if m_num:
                doc.numerado(m_num.group(2).strip())
                i += 1
            else:
                sangria = len(m_vin.group(1))
                doc.vineta(m_vin.group(2).strip(), nivel=1 if sangria >= 2 else 0)
                i += 1
            # continuar con los items seguidos
            while i < n:
                s = lineas[i]
                if re.match(r"^\s*(\d+)\.\s+", s):
                    doc.numerado(re.sub(r"^\s*(\d+)\.\s+", "", s).strip())
                elif re.match(r"^(\s*)[-*+]\s+", s):
                    sangria = len(re.match(r"^(\s*)[-*+]\s+", s).group(1))
                    doc.vineta(re.sub(r"^(\s*)[-*+]\s+", "", s).strip(),
                               nivel=1 if sangria >= 2 else 0)
                else:
                    break
                i += 1
            continue

        # --- parrafo ---
        if not vacia:
            buffer = [linea.strip()]
            i += 1
            while i < n and lineas[i].strip():
                siguiente = lineas[i]
                if (siguiente.lstrip().startswith(("#", ">", "```"))
                        or re.match(r"^\s*(\d+)\.\s+", siguiente)
                        or re.match(r"^(\s*)[-*+]\s+", siguiente)
                        or re.fullmatch(r"\s*(-{3,}|\*{3,}|_{3,})\s*", siguiente)
                        or ("`" not in siguiente and "|" in siguiente
                            and i + 1 < n and _es_separador_tabla(lineas[i + 1]))):
                    break
                buffer.append(siguiente.strip())
                i += 1
            doc.parrafo(" ".join(buffer))
            continue

        i += 1


# --- Programa principal ---

DOCS = Path(__file__).resolve().parent / "docs"
SALIDA = Path(__file__).resolve().parent / "documentos"


def _nombre_legible(archivo_md):
    """20-historial-de-commits.md -> ('20', 'Historial de commits')"""
    nombre = archivo_md.stem
    if nombre in ("index", "indice"):
        return "00", "Índice"
    if "-" in nombre:
        numero, resto = nombre.split("-", 1)
        resto = re.sub(r"[-_]+", " ", resto).strip()
        return numero, resto[0].upper() + resto[1:]
    return "", nombre


def _clave_orden(archivo):
    """El indice va primero; despues, por numero de documento."""
    numero, _ = _nombre_legible(archivo)
    if numero == "00" and archivo.stem in ("index", "indice"):
        return (0, 0, "")
    try:
        return (1, int(numero), archivo.name)
    except ValueError:
        return (2, 0, archivo.name)


def _subtitulo_desde(numero, titulo):
    return "Documento %s  ·  Documentacion tecnica del frontend" % (numero or "00")


def _slug(texto):
    """'Índice' -> 'Indice', 'Año' -> 'Ano'.

    Sin acentos ni eñes: los nombres de archivo van a un repositorio que
    usan Windows, macOS y Linux a la vez, y una ruta no ASCII sale escapada
    en el `git status` de cualquiera de los tres.
    """
    sin_acentos = unicodedata.normalize("NFKD", texto)
    plano = "".join(c for c in sin_acentos if not unicodedata.combining(c))
    plano = plano.replace("ñ", "n").replace("Ñ", "N")
    limpio = re.sub(r"[^\w\s-]", "", plano, flags=re.UNICODE)
    return re.sub(r"[\s_]+", "-", limpio.strip())


def main():
    args = [a for a in sys.argv[1:]]
    manual = "--manual" in args
    args = [a for a in args if a != "--manual"]

    SALIDA.mkdir(exist_ok=True)

    if args:
        origenes = [Path(a) if Path(a).is_absolute() else Path(a) for a in args]
    else:
        origenes = sorted(DOCS.glob("*.md"), key=_clave_orden)

    if not origenes:
        sys.exit("No hay archivos .md en %s" % DOCS)

    generados = []
    for md in origenes:
        numero, titulo = _nombre_legible(md)
        doc = Documentador(titulo, _subtitulo_desde(numero, titulo))
        doc.portada()
        doc.indice()
        convertir(md.read_text(encoding="utf-8"), doc)
        destino = SALIDA / ("%s-%s.docx" % (numero or "00", _slug(titulo)))
        doc.guardar(destino)
        generados.append(destino)
        print("  OK  %-52s %6.1f KB" % (destino.name, destino.stat().st_size / 1024))

    if manual and len(origenes) > 1:
        # El manual se construye en una sola pasada sobre un unico documento.
        # Pegar el cuerpo de otros .docx dentro de este NO funciona: cada
        # documento tiene sus propia tabla de estilos y su numeracion, y al
        # copiar los elementos quedan referencias que Word no puede resolver
        # (el archivo sale corrupto). Convertir los .md otra vez aqui es lo
        # unico que produce un documento limpio.
        print("\nGenerando el manual completo...")
        total_palabras = 0
        manual_doc = Documentador(
            "Manual completo del frontend",
            "Los %d documentos en uno solo" % len(origenes))
        manual_doc.portada()
        manual_doc.indice()

        for md in origenes:
            _, titulo = _nombre_legible(md)
            if md.stem in ("index", "indice"):
                continue          # el indice ya esta en la portada
            manual_doc.salto_de_pagina()
            p = manual_doc.doc.add_heading("", 1)
            r = p.add_run("Documento %s" % titulo)
            r.font.color.rgb = SENA_VERDE_OSCURO
            r.font.name = FUENTE_TITULO
            r.font.size = Pt(22)
            r.bold = True
            convertir(md.read_text(encoding="utf-8"), manual_doc)
            total_palabras += 1

        final = SALIDA / "Manual-completo-del-frontend.docx"
        manual_doc.guardar(final)
        print("  OK  %-52s %6.1f KB  (%d documentos)"
              % (final.name, final.stat().st_size / 1024, total_palabras))

    print("\n%d documento(s) generado(s) en %s" % (len(generados), SALIDA))


if __name__ == "__main__":
    main()

