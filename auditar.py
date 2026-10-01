#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
auditar.py - Busca texto corrupto en los .md de docs/

Detecta: caracteres CJK o cirilicos, palabras inglesas que no deberian estar
en la prosa, encabezados malformados y lineas pegadas sin separador.
"""
import re
import sys
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
DOCS = RAIZ / "docs"

# La consola de Windows suele ser cp1252: sin esto, imprimir un caracter
# acentuado o CJK revienta con UnicodeEncodeError.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

CJK = re.compile(r"[\u4E00-\u9FFF\u3000-\u303F\uFF00-\uFFEF\u0400-\u04FF\uAC00-\uD7AF]")

# Palabras inglesas que aparecen solo cuando hay un error de redaccion.
# Se excluyen las que son legitimas: "rebranding" es jerga tecnica en espanol,
# y las que viven dentro de codigo o nombres de archivo.
INGLES = re.compile(
    r"\b(weight|Often|bulk|affected|paintedarlo|remembers|touchle|"
    r"were|have|would|should|could|"
    r"this|that|with|from|then|than|they|there|their|which|while|where)\b"
)

# Palabras que indican que se empalmaron dos frases en una.
COLGADAS = re.compile(
    r"[a-zA-Z\u00e1\u00e9\u00ed\u00f3\u00fa\u00f1\u00c1\u00c9\u00cd\u00d3\u00da\u00d1]"
    r"(?:weight|Soon|Draft|Tests|Reel|Slant|Wrap|Yarn|Zinc)\b"
    r"|###.*###"
)


def auditar(ruta):
    texto = ruta.read_text(encoding="utf-8")
    lineas = texto.replace("\r\n", "\n").split("\n")
    problemas = []

    dentro_de_codigo = False
    for i, linea in enumerate(lineas, 1):
        if linea.lstrip().startswith("```"):
            dentro_de_codigo = not dentro_de_codigo
            continue
        if dentro_de_codigo:
            continue

        if CJK.search(linea):
            problemas.append((i, "CJK/cirilico", linea.strip()[:95]))

        if not linea.lstrip().startswith(("|", "```", "http")):
            for m in INGLES.finditer(linea):
                # tolerado dentro de codigo en linea o rutas de archivo
                ctx = linea
                if "`" in ctx or re.search(r"[\w/.-]+\.(js|jsx|md|json|css|html)", ctx):
                    continue
                problemas.append((i, "ingles: " + m.group(0), linea.strip()[:95]))
                break

        if COLGADAS.search(linea):
            problemas.append((i, "EMPALMADA", linea.strip()[:95]))

    return problemas


def main():
    rutas = sorted(DOCS.glob("*.md"))
    if len(sys.argv) > 1:
        rutas = [RAIZ / a for a in sys.argv[1:]]

    total = 0
    for ruta in rutas:
        problemas = auditar(ruta)
        if problemas:
            print("\n=== %s ===" % ruta.name)
            for num, tipo, texto in problemas:
                print("  L%-5d %-18s %s" % (num, tipo, texto))
            total += len(problemas)

    print("\n%s" % ("-" * 60))
    if total:
        print("%d problema(s) en %d fichero(s)." % (total, len(rutas)))
        sys.exit(1)
    print("Limpio: %d ficheros sin texto corrupto." % len(rutas))


if __name__ == "__main__":
    main()
