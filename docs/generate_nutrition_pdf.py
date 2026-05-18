#!/usr/bin/env python3
"""
Generate a multi-page PDF: "Evidence-Based Diet for Male Infertility and
Obesity (BMI >= 28)" with no external dependencies (pure stdlib).

The PDF is hand-built per the PDF 1.4 spec. Layout supports H1/H2/H3,
paragraphs, bullets, key/value rows, food monograph cards, and references.

Usage:
    python3 generate_nutrition_pdf.py
    -> writes ./Diet_for_Male_Infertility_and_Obesity.pdf
"""

from __future__ import annotations
import os
import zlib
from dataclasses import dataclass
from typing import List

# ---------------------------------------------------------------------------
# Helvetica AFM glyph widths (1/1000 em) -- subset; defaults to 500 for any
# glyph not listed. Source: Adobe Core Font Helvetica metrics (public).
# ---------------------------------------------------------------------------
HELV_W = {
    " ": 278, "!": 278, '"': 355, "#": 556, "$": 556, "%": 889, "&": 667,
    "'": 191, "(": 333, ")": 333, "*": 389, "+": 584, ",": 278, "-": 333,
    ".": 278, "/": 278, "0": 556, "1": 556, "2": 556, "3": 556, "4": 556,
    "5": 556, "6": 556, "7": 556, "8": 556, "9": 556, ":": 278, ";": 278,
    "<": 584, "=": 584, ">": 584, "?": 556, "@": 1015, "A": 667, "B": 667,
    "C": 722, "D": 722, "E": 667, "F": 611, "G": 778, "H": 722, "I": 278,
    "J": 500, "K": 667, "L": 556, "M": 833, "N": 722, "O": 778, "P": 667,
    "Q": 778, "R": 722, "S": 667, "T": 611, "U": 722, "V": 667, "W": 944,
    "X": 667, "Y": 667, "Z": 611, "[": 278, "\\": 278, "]": 278, "^": 469,
    "_": 556, "`": 333, "a": 556, "b": 556, "c": 500, "d": 556, "e": 556,
    "f": 278, "g": 556, "h": 556, "i": 222, "j": 222, "k": 500, "l": 222,
    "m": 833, "n": 556, "o": 556, "p": 556, "q": 556, "r": 333, "s": 500,
    "t": 278, "u": 556, "v": 500, "w": 722, "x": 500, "y": 500, "z": 500,
    "{": 334, "|": 260, "}": 334, "~": 584,
}
HELV_B = HELV_W  # bold has wider metrics but for layout estimation reuse


def text_width(s: str, size: float) -> float:
    return sum(HELV_W.get(c, 500) for c in s) * size / 1000.0


def wrap(text: str, max_w: float, size: float) -> List[str]:
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = w if not cur else cur + " " + w
        if text_width(trial, size) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            # if a single word is longer than max_w, hard-break it
            if text_width(w, size) > max_w:
                buf = ""
                for c in w:
                    if text_width(buf + c, size) <= max_w:
                        buf += c
                    else:
                        lines.append(buf)
                        buf = c
                cur = buf
            else:
                cur = w
    if cur:
        lines.append(cur)
    return lines


# ---------------------------------------------------------------------------
# PDF builder
# ---------------------------------------------------------------------------
PAGE_W, PAGE_H = 595.0, 842.0           # A4 in points
MARGIN_L, MARGIN_R = 56.0, 56.0
MARGIN_T, MARGIN_B = 64.0, 64.0
USABLE_W = PAGE_W - MARGIN_L - MARGIN_R


@dataclass
class Block:
    kind: str        # h1 | h2 | h3 | p | bullet | small | rule | space | kv
    text: str = ""
    text2: str = ""  # for kv (key/value)


class PDF:
    def __init__(self):
        self.pages: List[List[str]] = []  # each page = list of content lines
        self.cur: List[str] = []          # current page commands
        self.y = PAGE_H - MARGIN_T
        self._new_page(first=True)

    def _new_page(self, first: bool = False):
        if not first:
            self.pages.append(self.cur)
        self.cur = []
        self.y = PAGE_H - MARGIN_T
        # page footer placeholder will be drawn at finalize

    def _ensure(self, needed: float):
        if self.y - needed < MARGIN_B:
            self._new_page()

    def _draw_text(self, x: float, y: float, size: float, font: str, text: str):
        # Escape special PDF string chars
        s = text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
        self.cur.append(
            f"BT /{font} {size} Tf {x:.2f} {y:.2f} Td ({s}) Tj ET"
        )

    def _draw_rect(self, x: float, y: float, w: float, h: float, fill: str):
        # fill = "ccc" hex shorthand to rgb 0..1
        r = int(fill[0]*2 if len(fill) == 3 else fill[0:2], 16) / 255.0
        g = int(fill[1]*2 if len(fill) == 3 else fill[2:4], 16) / 255.0
        b = int(fill[2]*2 if len(fill) == 3 else fill[4:6], 16) / 255.0
        self.cur.append(f"{r:.3f} {g:.3f} {b:.3f} rg {x:.2f} {y:.2f} {w:.2f} {h:.2f} re f 0 0 0 rg")

    def _line(self, x1, y1, x2, y2, w=0.5, gray=0.7):
        self.cur.append(
            f"{gray:.2f} G {w} w {x1:.2f} {y1:.2f} m {x2:.2f} {y2:.2f} l S 0 G"
        )

    # --- public layout API ---
    def h1(self, text: str):
        self._ensure(40)
        self.y -= 6
        self._draw_text(MARGIN_L, self.y - 22, 22, "F2", text)
        self.y -= 28
        self._line(MARGIN_L, self.y, PAGE_W - MARGIN_R, self.y, w=1.2, gray=0.2)
        self.y -= 10

    def h2(self, text: str):
        self._ensure(32)
        self.y -= 8
        self._draw_text(MARGIN_L, self.y - 16, 16, "F2", text)
        self.y -= 22

    def h3(self, text: str):
        self._ensure(24)
        self.y -= 4
        self._draw_text(MARGIN_L, self.y - 13, 13, "F2", text)
        self.y -= 18

    def p(self, text: str, size: float = 11.0, indent: float = 0.0,
          font: str = "F1", leading: float = 14.5):
        max_w = USABLE_W - indent
        for line in wrap(text, max_w, size):
            self._ensure(leading)
            self._draw_text(MARGIN_L + indent, self.y - size, size, font, line)
            self.y -= leading
        self.y -= 2

    def bullet(self, text: str, size: float = 11.0, leading: float = 14.0):
        bullet_indent = 14.0
        max_w = USABLE_W - bullet_indent
        lines = wrap(text, max_w, size)
        for i, line in enumerate(lines):
            self._ensure(leading)
            if i == 0:
                self._draw_text(MARGIN_L + 2, self.y - size, size, "F1", "\u2022".encode("latin-1", "replace").decode("latin-1") if False else "-")
            self._draw_text(MARGIN_L + bullet_indent, self.y - size, size, "F1", line)
            self.y -= leading

    def kv(self, key: str, value: str, size: float = 10.5, leading: float = 13.5):
        # bold key, regular value, wrapped
        key_str = f"{key}: "
        kw = text_width(key_str, size)
        max_w_first = USABLE_W - 14 - kw
        if max_w_first < 80:  # if key too long, put value on next line
            self._ensure(leading)
            self._draw_text(MARGIN_L + 2, self.y - size, size, "F2", key_str)
            self.y -= leading
            self.p(value, size=size, indent=14, leading=leading)
            return
        words = value.split()
        first_line, rest = "", []
        cur = ""
        for w in words:
            t = w if not cur else cur + " " + w
            if text_width(t, size) <= max_w_first:
                cur = t
            else:
                first_line = cur
                # remainder
                buf = w
                for w2 in words[words.index(w)+1:]:
                    nt = buf + " " + w2
                    if text_width(nt, size) <= USABLE_W - 14:
                        buf = nt
                    else:
                        rest.append(buf); buf = w2
                rest.append(buf)
                break
        else:
            first_line = cur
        self._ensure(leading)
        self._draw_text(MARGIN_L + 2, self.y - size, size, "F2", key_str)
        self._draw_text(MARGIN_L + 2 + kw, self.y - size, size, "F1", first_line)
        self.y -= leading
        for line in rest:
            self._ensure(leading)
            self._draw_text(MARGIN_L + 14, self.y - size, size, "F1", line)
            self.y -= leading

    def small(self, text: str):
        self.p(text, size=9.0, leading=12.0)

    def space(self, h: float = 6):
        self.y -= h

    def rule(self):
        self._ensure(8)
        self.y -= 2
        self._line(MARGIN_L, self.y, PAGE_W - MARGIN_R, self.y, gray=0.85)
        self.y -= 6

    def card_start(self, title: str, subtitle: str = ""):
        # ensure room for at least the title + a few lines
        self._ensure(80)
        self.y -= 2
        # background bar for title
        bar_h = 22
        self._draw_rect(MARGIN_L, self.y - bar_h + 4, USABLE_W, bar_h, "1f3a5f")
        self.cur.append("1 1 1 rg")  # white text
        self._draw_text(MARGIN_L + 8, self.y - 14, 13, "F2", title)
        if subtitle:
            sub_w = text_width(subtitle, 10)
            self._draw_text(PAGE_W - MARGIN_R - 8 - sub_w, self.y - 14, 10, "F1", subtitle)
        self.cur.append("0 0 0 rg")
        self.y -= bar_h + 4

    def page_break(self):
        self._new_page()

    # --- finalize PDF ---
    def build(self, title: str) -> bytes:
        self.pages.append(self.cur)  # commit final page

        objects: List[bytes] = []

        def add_obj(body: bytes) -> int:
            objects.append(body)
            return len(objects)  # 1-based id

        # Object 1: Catalog
        catalog_id = add_obj(b"<< /Type /Catalog /Pages 2 0 R >>")
        # Object 2: Pages (placeholder, fill later)
        pages_id = add_obj(b"")  # placeholder index 2

        # Font objects
        f1_id = add_obj(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")
        f2_id = add_obj(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>")

        # Page + content objects
        page_ids: List[int] = []
        total = len(self.pages)
        for i, content_lines in enumerate(self.pages, start=1):
            footer = f"BT /F1 9 Tf {MARGIN_L:.2f} {MARGIN_B - 30:.2f} Td (Diet for Male Infertility and Obesity  -  Page {i} of {total}) Tj ET"
            stream = "\n".join(content_lines + [footer]).encode("latin-1", "replace")
            compressed = zlib.compress(stream)
            content_obj = (
                b"<< /Length " + str(len(compressed)).encode() +
                b" /Filter /FlateDecode >>\nstream\n" + compressed + b"\nendstream"
            )
            content_id = add_obj(content_obj)
            page_obj = (
                f"<< /Type /Page /Parent {pages_id} 0 R "
                f"/MediaBox [0 0 {PAGE_W} {PAGE_H}] "
                f"/Resources << /Font << /F1 {f1_id} 0 R /F2 {f2_id} 0 R >> >> "
                f"/Contents {content_id} 0 R >>"
            ).encode()
            page_id = add_obj(page_obj)
            page_ids.append(page_id)

        # Fix Pages object
        kids = " ".join(f"{pid} 0 R" for pid in page_ids)
        objects[pages_id - 1] = (
            f"<< /Type /Pages /Count {len(page_ids)} /Kids [{kids}] >>".encode()
        )

        # Info object
        info_id = add_obj(
            f"<< /Title ({title}) /Author (Kiro - Educational Synthesis) "
            f"/Subject (Diet for male infertility and obesity BMI 28+) "
            f"/Creator (Kiro PDF builder) >>".encode("latin-1", "replace")
        )

        # Build byte stream with xref
        out = bytearray()
        out += b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"
        offsets = [0] * (len(objects) + 1)  # 1-based
        for i, body in enumerate(objects, start=1):
            offsets[i] = len(out)
            out += f"{i} 0 obj\n".encode() + body + b"\nendobj\n"
        xref_pos = len(out)
        out += f"xref\n0 {len(objects)+1}\n".encode()
        out += b"0000000000 65535 f \n"
        for i in range(1, len(objects) + 1):
            out += f"{offsets[i]:010d} 00000 n \n".encode()
        out += (
            f"trailer\n<< /Size {len(objects)+1} /Root {catalog_id} 0 R "
            f"/Info {info_id} 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n"
        ).encode()
        return bytes(out)


# ---------------------------------------------------------------------------
# Content
# ---------------------------------------------------------------------------
def build_doc() -> PDF:
    pdf = PDF()

    # ===== Title page =====
    pdf.space(40)
    pdf._draw_text(MARGIN_L, pdf.y - 28, 28, "F2", "Evidence-Based Diet for")
    pdf.y -= 36
    pdf._draw_text(MARGIN_L, pdf.y - 28, 28, "F2", "Male Infertility & Obesity")
    pdf.y -= 36
    pdf._draw_text(MARGIN_L, pdf.y - 16, 16, "F1", "(Body Mass Index >= 28)")
    pdf.y -= 24
    pdf._line(MARGIN_L, pdf.y, PAGE_W - MARGIN_R, pdf.y, w=0.8, gray=0.5)
    pdf.y -= 14
    pdf.p("A research synthesis of dietary patterns, food-by-food nutritional "
          "values, and the mechanisms by which specific foods support sperm "
          "quality, hormonal balance, metabolic health, and weight loss.",
          size=12, leading=16)
    pdf.space(10)
    pdf.p("Compiled from peer-reviewed systematic reviews, meta-analyses, "
          "and randomized controlled trials indexed in PubMed/MEDLINE.",
          size=11)
    pdf.space(20)
    pdf.kv("Audience", "Adult men with sub-fertility and/or BMI 28+")
    pdf.kv("Document type", "Educational synthesis (not medical advice)")
    pdf.kv("Prepared for", "Integration into the Medical-app patient resources module")
    pdf.kv("Version", "1.0")
    pdf.space(20)
    pdf._line(MARGIN_L, pdf.y, PAGE_W - MARGIN_R, pdf.y, w=0.5, gray=0.85)
    pdf.space(10)
    pdf.h3("Important disclaimer")
    pdf.p("This document is a structured summary of the published research "
          "literature. It is intended for educational use only and is NOT a "
          "substitute for personalized advice from a licensed urologist, "
          "reproductive endocrinologist, internist, or registered dietitian. "
          "Caloric targets, macronutrient ratios, and supplement doses should "
          "be tailored to the individual after appropriate clinical "
          "evaluation (semen analysis, hormone panel, metabolic labs, "
          "comorbidities, allergies, and current medications). Some "
          "supplements (e.g., high-dose selenium) are harmful in excess.",
          size=10, leading=13)
    pdf.page_break()

    # ===== Executive summary =====
    pdf.h1("1. Executive summary")
    pdf.p("Two clinical problems are addressed jointly in this document because "
          "they are biologically coupled: excess adiposity is one of the most "
          "common modifiable causes of poor semen quality and low testosterone, "
          "and the same dietary pattern that produces durable weight loss in "
          "BMI >= 28 also improves sperm parameters.")
    pdf.h3("Key conclusions from the literature")
    pdf.bullet("A Mediterranean-style diet, with optional DASH features, has "
               "the strongest and most consistent evidence base for both weight "
               "loss in adults with BMI >= 25 and improvement of conventional "
               "semen parameters (concentration, total motility, normal morphology).")
    pdf.bullet("Even modest weight loss (5-10% of body weight) in obese men is "
               "associated with measurable increases in serum total testosterone, "
               "SHBG, and sperm concentration, and reductions in estradiol and "
               "sperm DNA fragmentation.")
    pdf.bullet("Specific foods - oily fish, walnuts and other tree nuts, leafy "
               "greens, tomatoes, pomegranate, eggs, legumes, oats, and extra "
               "virgin olive oil - deliver the bioactive compounds (omega-3, "
               "folate, zinc, selenium, lycopene, polyphenols, vitamin E, "
               "L-carnitine, CoQ10, vitamin D) that drive these benefits.")
    pdf.bullet("Western dietary patterns (ultra-processed foods, sugar-sweetened "
               "beverages, processed red meats, trans fats, high refined-carb "
               "load) are consistently associated with worse semen parameters "
               "and weight gain.")
    pdf.bullet("A practical 12-week program combining a 500 kcal/day energy "
               "deficit, ~1.4 g/kg target-body-weight protein, Mediterranean "
               "food choices, 150 minutes/week of moderate aerobic activity, "
               "and 2 resistance sessions/week is the recommended starting "
               "intervention.")
    pdf.space(8)
    pdf.h3("Targets used in this document")
    pdf.kv("Energy intake (BMI 28-30)", "1700-2000 kcal/day (500 kcal deficit from TDEE)")
    pdf.kv("Energy intake (BMI 30+)", "1500-1800 kcal/day, reassess every 4 weeks")
    pdf.kv("Protein", "1.2-1.6 g per kg target body weight per day")
    pdf.kv("Fat", "30-35% of energy, mostly mono- and polyunsaturated")
    pdf.kv("Carbohydrate", "40-50% of energy, predominantly low glycemic index")
    pdf.kv("Fiber", ">= 30 g/day")
    pdf.kv("Added sugar", "< 25 g/day")
    pdf.kv("Alcohol", "<= 7 standard drinks/week, ideally none during preconception")
    pdf.page_break()

    # ===== Background =====
    pdf.h1("2. Why obesity and male infertility share a diet")
    pdf.h2("2.1 Sperm parameters that respond to diet")
    pdf.p("A standard semen analysis reports volume, concentration, total motility, "
          "progressive motility, and morphology. Advanced tests add DNA "
          "fragmentation index (DFI) and reactive oxygen species (ROS). "
          "Diet influences each of these:")
    pdf.bullet("Concentration and total count: respond to overall energy balance, "
               "trans fat avoidance, and adequate folate, zinc, and vitamin D.")
    pdf.bullet("Motility: responds strongly to omega-3 (DHA), L-carnitine, "
               "coenzyme Q10, and selenium.")
    pdf.bullet("Morphology: responds to antioxidant intake (vitamin C, E, "
               "lycopene, polyphenols) and to walnuts/tree nut intake.")
    pdf.bullet("DNA fragmentation: responds to antioxidants and to a reduction "
               "in oxidative load (reduced ultra-processed food, alcohol, smoking).")
    pdf.h2("2.2 The obesity link")
    pdf.p("Excess visceral adipose tissue increases peripheral aromatization of "
          "testosterone to estradiol, lowers SHBG, drives chronic low-grade "
          "inflammation, raises scrotal temperature via suprapubic fat, and "
          "elevates seminal oxidative stress. Meta-analyses report that men "
          "with BMI >= 30 have lower sperm concentration, total motility, "
          "and normal morphology, and higher DNA fragmentation than "
          "normal-weight men. Importantly, these changes are at least "
          "partially reversible with weight loss.")
    pdf.h2("2.3 What 'BMI 28+' means in practice")
    pdf.p("BMI 25.0-29.9 is classified as overweight; BMI >= 30 is obese. A man "
          "at BMI 28 is in the upper overweight range with elevated metabolic "
          "and reproductive risk. The intervention threshold and the diet "
          "structure are essentially identical from BMI 28 upward; only the "
          "energy deficit, monitoring intensity, and likely duration of "
          "treatment differ.")
    pdf.page_break()

    # ===== Dietary patterns =====
    pdf.h1("3. Dietary patterns with the strongest evidence")
    pdf.h2("3.1 Mediterranean diet (foundation pattern)")
    pdf.p("Defined by high intake of vegetables, fruit, whole grains, legumes, "
          "nuts, olive oil, and fish; moderate intake of poultry, eggs, dairy "
          "(especially yogurt and fresh cheese); low intake of red meat, "
          "processed meat, and added sugar. Multiple meta-analyses show this "
          "pattern is associated with weight loss in adults with overweight or "
          "obesity and with improved conventional semen parameters in men.")
    pdf.h3("Operational rules used in this plan")
    pdf.bullet(">= 5 servings of vegetables and fruit per day (mostly vegetables).")
    pdf.bullet(">= 3 servings of legumes per week.")
    pdf.bullet(">= 30 g of mixed nuts per day (walnuts, almonds, hazelnuts).")
    pdf.bullet("Extra virgin olive oil as the main added fat (>= 2 tablespoons/day).")
    pdf.bullet("Oily fish 2-3 times per week (salmon, sardines, mackerel, anchovies).")
    pdf.bullet("Whole grains instead of refined (oats, barley, bulgur, whole rye).")
    pdf.bullet("Red meat <= 1 serving/week; processed meat avoided.")
    pdf.bullet("Sugar-sweetened beverages avoided.")
    pdf.h2("3.2 Higher-protein modification for weight loss")
    pdf.p("For men with BMI >= 28 the basic Mediterranean template is modified "
          "in two ways: total energy is reduced by ~500 kcal/day below "
          "estimated total daily energy expenditure, and protein is raised to "
          "1.2-1.6 g/kg of target body weight (preserves lean mass during "
          "deficit, increases satiety, and elevates the thermic effect of "
          "feeding). Practically: every meal contains a deliberate protein "
          "anchor (eggs, Greek yogurt, fish, lentils, tofu, skinless poultry, "
          "low-fat dairy, whey).")
    pdf.h2("3.3 DASH features layered on top")
    pdf.p("If blood pressure is elevated, the DASH (Dietary Approaches to Stop "
          "Hypertension) emphasis on potassium-rich produce and reduced sodium "
          "(< 2 g/day) is layered on. DASH and Mediterranean overlap heavily.")
    pdf.h2("3.4 Patterns to avoid")
    pdf.bullet("'Western' pattern: processed meat, refined grains, sugary "
               "drinks, fried foods, ultra-processed snacks. Associated with "
               "lower sperm count and motility and with weight gain.")
    pdf.bullet("Very-low-carbohydrate (ketogenic) for general weight loss is "
               "effective short term but evidence for fertility benefit is "
               "weaker than Mediterranean; sustainability and lipid profile "
               "responses vary.")
    pdf.bullet("Liquid meal-replacement-only protocols can produce rapid "
               "weight loss but, without dietary education, weight regain is "
               "common; not preferred for the preconception period.")
    pdf.page_break()

    # ===== Food monographs =====
    pdf.h1("4. Food monographs")
    pdf.p("Each card lists the food, an approximate macro/micronutrient profile "
          "per 100 g of edible portion (rounded; from USDA FoodData Central and "
          "EuroFIR-aligned national databases), the bioactive compounds that "
          "matter for fertility and weight management, and the mechanisms by "
          "which the food acts. Serving sizes given are practical, not strict.")

    foods = build_food_monographs()
    for food in foods:
        emit_food_card(pdf, food)

    pdf.page_break()

    # ===== Foods to avoid =====
    pdf.h1("5. Foods and substances to limit or avoid")
    pdf.p("These are associated with worse semen parameters, weight gain, "
          "and/or metabolic deterioration. Frequency is the key concept: "
          "occasional intake is fine; daily/weekly habit is the problem.")
    avoid = [
        ("Sugar-sweetened beverages",
         "Sodas, energy drinks, sweetened juices. Each daily 250 mL serving is "
         "associated with measurable reductions in sperm motility and with "
         "weight gain in cohort studies."),
        ("Processed and cured meats",
         "Bacon, sausage, hot dogs, deli meats. High in sodium, nitrites, "
         "saturated fat; associated with lower sperm morphology scores and "
         "higher cardiometabolic risk."),
        ("Trans-fat-containing foods",
         "Industrially produced partially hydrogenated oils (legacy bakery "
         "items, some margarines, some fried fast food). Trans fats appear "
         "in seminal lipids and are associated with reduced total sperm count."),
        ("Deep-fried fast food",
         "High energy density, oxidized fats, trans fats, low micronutrient "
         "yield. Strongly associated with the Western dietary pattern."),
        ("Refined grains and added sugar",
         "White bread, white rice in excess, pastries, candy. High glycemic "
         "load worsens insulin sensitivity, which independently impairs "
         "Leydig cell function."),
        ("High-mercury fish",
         "King mackerel, swordfish, shark, tilefish, big-eye tuna. Mercury "
         "is reproductively toxic; choose salmon, sardines, anchovies, "
         "trout, light canned tuna in moderation instead."),
        ("Excess alcohol",
         "More than 7 standard drinks/week is dose-dependently associated "
         "with reduced sperm parameters and with hepatic and metabolic harm. "
         "During preconception, abstinence is the safest choice."),
        ("Soy in pharmacologic amounts",
         "Whole-food soy in normal dietary amounts (tofu, edamame, tempeh) is "
         "fine and useful for protein. Very high isoflavone supplements are "
         "where caution is warranted."),
        ("Tobacco and recreational drugs",
         "Not foods, but the highest-impact modifiable factors after weight: "
         "smoking, vaping nicotine, cannabis (especially daily), and anabolic "
         "steroids profoundly impair fertility."),
    ]
    for title, body in avoid:
        pdf.h3(title)
        pdf.p(body)
    pdf.page_break()

    # ===== 7-day plan =====
    pdf.h1("6. Sample 7-day meal plan (~1800 kcal)")
    pdf.p("Calibrated for a man around 90 kg targeting ~5-7 kg loss over 12 weeks. "
          "Adjust portions of starch and oil up or down by ~15% to match the "
          "individual's TDEE. All days include >= 30 g fiber and >= 110 g protein.")
    days = [
        ("Day 1 (Mon)",
         ["Breakfast: Steel-cut oats 60 g (dry) cooked in 250 mL skim milk + "
          "30 g walnuts + 100 g blueberries + 1 tsp cinnamon.",
          "Lunch: Grilled salmon 150 g + quinoa 60 g (dry) + roasted broccoli "
          "200 g + 1 tbsp extra virgin olive oil + lemon.",
          "Snack: Greek yogurt (0% fat) 200 g + 1 tsp honey + 10 almonds.",
          "Dinner: Lentil and spinach stew (lentils 80 g dry, spinach 150 g, "
          "tomato, onion, garlic, cumin) + 1 small whole-grain pita.",
          "Optional: 1 small apple."]),
        ("Day 2 (Tue)",
         ["Breakfast: 3 eggs scrambled in 1 tsp olive oil + 2 slices "
          "whole-grain bread + 1 tomato sliced + spinach.",
          "Lunch: Chickpea salad (chickpeas 150 g cooked, cucumber, tomato, "
          "red onion, parsley, feta 30 g, olive oil 1 tbsp, lemon).",
          "Snack: 30 g pumpkin seeds + 1 pear.",
          "Dinner: Grilled chicken breast 150 g + bulgur 60 g (dry) + roasted "
          "zucchini and bell pepper + tzatziki (Greek yogurt + cucumber)."]),
        ("Day 3 (Wed)",
         ["Breakfast: Smoothie (250 mL skim milk + 1 banana + 1 tbsp "
          "ground flaxseed + 25 g whey protein + handful spinach).",
          "Lunch: Whole-grain pasta 70 g (dry) with sardines 100 g, garlic, "
          "olive oil, cherry tomatoes, capers, parsley.",
          "Snack: 2 Brazil nuts + 1 orange.",
          "Dinner: Tofu stir-fry (tofu 150 g, broccoli, snow peas, mushrooms, "
          "1 tsp sesame oil, soy sauce, ginger) over brown rice 50 g (dry)."]),
        ("Day 4 (Thu)",
         ["Breakfast: Greek yogurt 250 g + oats 30 g + 100 g pomegranate "
          "arils + 10 walnut halves.",
          "Lunch: Tuna (light, canned in water) 120 g over mixed greens + "
          "white beans 100 g + olives + olive oil + balsamic.",
          "Snack: Carrot and cucumber sticks + 3 tbsp hummus.",
          "Dinner: Baked mackerel 150 g + roasted sweet potato 200 g + "
          "steamed green beans + olive oil and lemon."]),
        ("Day 5 (Fri)",
         ["Breakfast: 2 eggs + 1 slice whole-grain toast + 1/2 avocado + "
          "1 tomato sliced + 1 cup green tea.",
          "Lunch: Lentil soup 400 mL + side salad with olive oil + 1 small "
          "whole-grain roll.",
          "Snack: 1 apple + 30 g almonds.",
          "Dinner: Grilled shrimp 150 g + farro 60 g (dry) + roasted "
          "asparagus + cherry tomatoes."]),
        ("Day 6 (Sat)",
         ["Breakfast: Overnight oats (oats 50 g, skim milk 200 mL, chia 1 tbsp, "
          "berries 100 g, walnut halves 10).",
          "Lunch: Grain bowl (quinoa 60 g dry, roasted vegetables, chickpeas "
          "100 g, tahini-lemon dressing, pumpkin seeds 15 g).",
          "Snack: Cottage cheese 150 g + pineapple 100 g.",
          "Dinner: Lean beef sirloin 120 g (once-weekly red meat) + roasted "
          "Brussels sprouts + barley 60 g (dry)."]),
        ("Day 7 (Sun)",
         ["Breakfast: Whole-grain pancakes (oats + egg + banana + cinnamon) + "
          "Greek yogurt + 100 g berries.",
          "Lunch: Whole-grain wrap with grilled chicken 120 g, hummus, "
          "spinach, tomato, cucumber.",
          "Snack: 2 squares 85% dark chocolate + 1 cup green tea.",
          "Dinner: Baked salmon 150 g + couscous (whole-wheat) 60 g + "
          "Mediterranean salad (tomato, cucumber, olives, feta, olive oil)."]),
    ]
    for title, items in days:
        pdf.h3(title)
        for it in items:
            pdf.bullet(it)
        pdf.space(2)
    pdf.page_break()

    # ===== 12-week protocol =====
    pdf.h1("7. A practical 12-week protocol")
    pdf.h2("7.1 Phases")
    pdf.h3("Weeks 1-2: Establish")
    pdf.bullet("Baseline: weight, waist circumference, BP, fasting glucose, "
               "HbA1c, lipids, total testosterone, SHBG, prolactin, TSH, "
               "vitamin D, ferritin; semen analysis if seeking conception.")
    pdf.bullet("Replace sugar-sweetened beverages with water, unsweetened tea, "
               "or sparkling water.")
    pdf.bullet("Add a daily 30 g serving of mixed nuts (include walnuts).")
    pdf.bullet("Add oily fish 2x/week.")
    pdf.h3("Weeks 3-6: Deficit and structure")
    pdf.bullet("Move to ~500 kcal/day deficit using the meal plan.")
    pdf.bullet("Walk 30 min/day, 5 days/week; begin 2x/week resistance training.")
    pdf.bullet("Eliminate processed meat and trans fat sources.")
    pdf.bullet("Sleep target: 7-8 hours, dark and cool room.")
    pdf.h3("Weeks 7-12: Consolidate")
    pdf.bullet("Re-evaluate weight; if loss < 2% of body weight by week 6, "
               "re-check portions and revise energy target.")
    pdf.bullet("Repeat hormone panel and (if applicable) semen analysis at "
               "week 12. Spermatogenesis takes ~74 days, so the week-12 "
               "result reflects the diet started at week 0.")
    pdf.bullet("Plan for maintenance: protein and produce stay high, energy "
               "intake returns to maintenance once goal weight is reached.")
    pdf.h2("7.2 Considered supplements (only with clinician oversight)")
    pdf.bullet("Vitamin D3 1000-2000 IU/day if 25-OH-D < 30 ng/mL.")
    pdf.bullet("Folate 400-800 microg/day in food + supplement.")
    pdf.bullet("Omega-3 (EPA+DHA) 1-2 g/day if fish intake is low.")
    pdf.bullet("Zinc 15-25 mg/day; do not exceed 40 mg/day chronically.")
    pdf.bullet("L-carnitine and coenzyme Q10 have RCT evidence in idiopathic "
               "asthenozoospermia; discuss with a urologist.")
    pdf.bullet("Selenium: prefer 1-2 Brazil nuts/day rather than supplements; "
               "selenium toxicity is real.")
    pdf.h2("7.3 Red flags to escalate to a clinician immediately")
    pdf.bullet("BMI >= 35 with comorbidities (consider pharmacotherapy or "
               "bariatric evaluation in addition to diet).")
    pdf.bullet("Total testosterone < 300 ng/dL on two morning samples.")
    pdf.bullet("Azoospermia or severe oligozoospermia on semen analysis.")
    pdf.bullet("Symptoms of obstructive sleep apnea, which independently "
               "depresses testosterone and worsens metabolic health.")
    pdf.page_break()

    # ===== References =====
    pdf.h1("8. Selected references")
    pdf.small("Citations are listed by topic. Articles can be retrieved by "
              "searching the title in PubMed (pubmed.ncbi.nlm.nih.gov). "
              "This list is illustrative, not exhaustive.")
    pdf.space(4)

    refs_by_topic = [
        ("Mediterranean diet and male fertility", [
            "Salas-Huetos A, et al. Adherence to the Mediterranean diet and "
            "semen quality: a systematic review with meta-analysis. (multiple cohort studies).",
            "Ricci E, et al. Mediterranean diet and outcomes of assisted "
            "reproduction. Adv Nutr (2025).",
            "Karayiannis D, et al. Adherence to the Mediterranean diet and "
            "seminal quality. Hum Reprod (2017).",
            "Influence of the Mediterranean diet on seminal quality: "
            "systematic review (PMC10902424, 2024).",
        ]),
        ("Healthy dietary patterns and semen", [
            "Salas-Huetos A, et al. The effect of healthy dietary patterns "
            "on male semen quality: systematic review and meta-analysis. "
            "Asian J Androl (2022).",
            "Salas-Huetos A, et al. The effect of nutrients and dietary "
            "supplements on sperm quality parameters: systematic review and "
            "meta-analysis of RCTs. Adv Nutr (2018).",
            "Diet and male fertility: nutrients and antioxidants on sperm "
            "energetic metabolism. Antioxidants (2022, PMC8910394).",
        ]),
        ("Antioxidants, micronutrients and sperm", [
            "Cochrane review: Antioxidants for male subfertility (Smits RM, "
            "et al., updated editions).",
            "Antioxidant supplementation on sperm DNA fragmentation and "
            "sperm parameters: systematic review and meta-analysis. "
            "Turk J Urol (2022).",
            "Antioxidant supplementation on male fertility - systematic "
            "review. Antioxidants (2023, PMC10135082).",
            "Network meta-analysis of antioxidants in idiopathic male "
            "infertility: L-carnitine, CoQ10, omega-3, selenium. "
            "Front Endocrinol (2022).",
            "Micronutrient supplements as antioxidants in improving sperm "
            "quality and reducing DNA fragmentation. Basic Clin Androl (2023).",
        ]),
        ("Specific foods - walnuts, fish, pomegranate", [
            "Robbins WA, et al. Walnuts improve semen quality in men "
            "consuming a Western-style diet: RCT. Biol Reprod (2012).",
            "Salas-Huetos A, et al. Effect of nut consumption on semen "
            "quality and functionality in healthy men. Am J Clin Nutr (2018).",
            "Safarinejad MR. Effect of omega-3 PUFA supplementation on "
            "semen profile and antioxidant capacity. Andrologia (2011).",
            "Pomegranate / galangal extract and motile sperm count: "
            "double-blinded RCT (PMC4190413).",
        ]),
        ("Obesity, weight loss and male fertility", [
            "BMI is associated with sperm quality and sex hormones in men: "
            "meta-analysis. Front Endocrinol (2025).",
            "Association between body mass index and semen quality: "
            "systematic review and meta-analysis (2024).",
            "Weight loss as therapeutic option to restore fertility in "
            "obese men. (Andrology review, 2024).",
            "Obesity and male fertility disorders. Rev Endocr Metab "
            "Disord (2024).",
            "The effect of obesity interventions on male fertility "
            "(Hum Reprod Update style, 2025).",
            "Effect of bariatric surgery on male infertility: updated "
            "meta-analysis (2025).",
        ]),
        ("Diet patterns and weight loss in BMI 25+", [
            "Esposito K, et al. Mediterranean diet and weight loss: "
            "meta-analysis of RCTs. Metab Syndr Relat Disord (2011).",
            "Mediterranean diet in the management and prevention of "
            "obesity. Rev Endocr Metab Disord (2023).",
            "Mediterranean diet and obesity-related disorders: evidence "
            "review (PMC9729142).",
            "Optimal diet strategies for weight loss and weight loss "
            "maintenance. J Obes Metab Syndr (2020).",
            "Effects of popular diets on anthropometric and "
            "cardiometabolic parameters: umbrella review of meta-analyses "
            "of RCTs.",
            "Mediterranean diet effects on insulin resistance and "
            "secretion in overweight/obese (PMC10648830).",
        ]),
        ("Nutritional values per 100 g (data sources)", [
            "USDA FoodData Central (fdc.nal.usda.gov).",
            "EuroFIR - European Food Information Resource Network.",
            "McCance and Widdowson's The Composition of Foods, 7th edition.",
        ]),
    ]
    for topic, items in refs_by_topic:
        pdf.h3(topic)
        for it in items:
            pdf.bullet(it, size=10, leading=12.5)
        pdf.space(2)

    pdf.space(8)
    pdf.rule()
    pdf.small("End of document. Compiled as an educational synthesis. "
              "Not a substitute for individualized medical advice.")
    return pdf


# ---------------------------------------------------------------------------
# Food monograph data + renderer
# ---------------------------------------------------------------------------
def emit_food_card(pdf: PDF, food: dict):
    pdf.card_start(food["name"], food.get("serving", ""))
    pdf.kv("Nutrition per 100 g", food["nutrition"])
    pdf.kv("Key bioactives", food["bioactives"])
    pdf.kv("Mechanism / benefit", food["mechanism"])
    pdf.kv("Practical use", food["use"])
    pdf.space(6)


def build_food_monographs() -> list:
    return [
        {
            "name": "Walnuts (Juglans regia)",
            "serving": "30 g serving (~14 halves)",
            "nutrition": "654 kcal; protein 15 g; fat 65 g (of which alpha-linolenic acid (ALA, omega-3) ~9 g, linoleic acid ~38 g, monounsaturated ~9 g); carbohydrate 14 g; fiber 6.7 g; magnesium 158 mg; phosphorus 346 mg; zinc 3.1 mg; copper 1.6 mg; manganese 3.4 mg; folate 98 microg; vitamin E 0.7 mg.",
            "bioactives": "Alpha-linolenic acid (plant omega-3), polyphenols (ellagitannins, urolithins after gut metabolism), gamma-tocopherol, l-arginine, melatonin.",
            "mechanism": "RCTs (Robbins 2012; Salas-Huetos 2018) showed 75 g/day of walnuts for 12 weeks improved sperm vitality, motility, morphology, and reduced sperm aneuploidy in men on Western diets. Mechanisms: ALA-derived DHA enrichment of sperm membranes, polyphenol-driven reduction of seminal oxidative stress, l-arginine support of nitric-oxide-mediated vasodilation in the testis, and zinc/copper cofactor delivery.",
            "use": "30 g/day as snack or salad/oats topping. Replace, do not add, calorie-equivalent ultra-processed snacks.",
        },
        {
            "name": "Salmon (wild or responsibly farmed Atlantic)",
            "serving": "150 g cooked portion 2-3x/week",
            "nutrition": "Per 100 g cooked: 208 kcal; protein 22 g; fat 13 g (EPA ~0.7 g, DHA ~1.4 g); vitamin D 526 IU; vitamin B12 3.2 microg; selenium 36 microg; potassium 363 mg; phosphorus 252 mg; choline 95 mg.",
            "bioactives": "Long-chain omega-3 EPA and DHA, vitamin D, selenium, astaxanthin, B12, choline.",
            "mechanism": "DHA is incorporated into sperm tail membranes and is required for motility and acrosome integrity; EPA reduces systemic inflammation. Vitamin D supports Leydig-cell testosterone production. Selenium is a cofactor for glutathione peroxidase, the principal sperm antioxidant defense. Combined effect: improved motility, reduced DNA fragmentation, support of testosterone.",
            "use": "Baked, grilled, or pan-seared 2-3 times per week. Sardines and mackerel deliver similar omega-3 at lower cost; anchovies are a high-yield option.",
        },
        {
            "name": "Pumpkin seeds (Cucurbita pepo, kernels)",
            "serving": "30 g handful",
            "nutrition": "Per 100 g: 559 kcal; protein 30 g; fat 49 g (mostly linoleic and oleic acid); carbohydrate 11 g; fiber 6 g; magnesium 592 mg; phosphorus 1233 mg; zinc 7.8 mg; iron 8.8 mg; manganese 4.5 mg; potassium 809 mg.",
            "bioactives": "Zinc, magnesium, plant sterols, l-arginine, tryptophan, gamma-tocopherol.",
            "mechanism": "Zinc is concentrated in seminal plasma and is required for spermatogenesis, sperm membrane stability, and testosterone synthesis. Magnesium supports insulin sensitivity and sleep quality. Plant sterols modestly reduce LDL cholesterol.",
            "use": "30 g/day as snack, on yogurt, or stirred into salads. Avoid heavily salted or candied versions.",
        },
        {
            "name": "Brazil nuts (Bertholletia excelsa)",
            "serving": "1-2 nuts/day - do not exceed",
            "nutrition": "Per 100 g: 659 kcal; protein 14 g; fat 67 g; carbohydrate 12 g; fiber 7.5 g; selenium 1917 microg (varies widely); magnesium 376 mg; thiamine 0.6 mg.",
            "bioactives": "Selenium (the densest dietary source on earth), tocopherols, magnesium.",
            "mechanism": "Selenium incorporates into selenoproteins including glutathione peroxidase 4 (GPx4), which is essential for sperm structural integrity. Even 1-2 Brazil nuts/day raises plasma selenium into the optimal range for sperm motility. Crucially, selenium toxicity occurs above ~400 microg/day, so 1-2 nuts is the ceiling, not a target.",
            "use": "1 nut/day if other selenium sources are present; 2 nuts/day if not. Store in cool dark conditions.",
        },
        {
            "name": "Eggs (whole, large, ~50 g each)",
            "serving": "2-3 per day acceptable in this pattern",
            "nutrition": "Per 100 g (~2 large): 143 kcal; protein 12.6 g; fat 9.5 g (saturated 3.1 g); cholesterol 372 mg; vitamin A 540 IU; vitamin D 82 IU; vitamin B12 0.9 microg; choline 294 mg; selenium 30 microg; lutein + zeaxanthin 503 microg; iodine ~25 microg.",
            "bioactives": "High-biological-value protein, choline, vitamin D, B12, lutein/zeaxanthin, selenium, iodine.",
            "mechanism": "Choline is required for one-carbon metabolism and sperm membrane phosphatidylcholine. Eggs are one of the few dietary vitamin D sources outside oily fish. High-quality protein (DIAAS ~1.13) supports satiety in a calorie deficit. Current evidence does not link normal egg intake (up to ~1/day in most cohorts; up to 2-3/day in metabolically healthy men) with cardiovascular harm.",
            "use": "Boiled, poached, or scrambled in olive oil. Pair with vegetables and a complex carbohydrate.",
        },
        {
            "name": "Greek yogurt (plain, 0-2% fat)",
            "serving": "200 g per serving",
            "nutrition": "Per 100 g (0% fat): 59 kcal; protein 10 g; fat 0.4 g; carbohydrate 3.6 g; calcium 110 mg; phosphorus 135 mg; potassium 141 mg; vitamin B12 0.8 microg.",
            "bioactives": "Whey- and casein-derived branched-chain amino acids, conjugated linoleic acid (in fuller-fat versions), probiotic cultures (Lactobacillus, Streptococcus thermophilus).",
            "mechanism": "Dense, satiating protein source for use in calorie deficits; supports lean mass preservation and muscle protein synthesis. Probiotic cultures may modestly improve gut barrier function and inflammation profile. Calcium contributes to blood pressure regulation.",
            "use": "200 g/day as breakfast or snack base; pair with berries, nuts, oats. Avoid pre-sweetened flavored varieties.",
        },
        {
            "name": "Lentils (red, green, brown, cooked)",
            "serving": "1 cup cooked (~200 g)",
            "nutrition": "Per 100 g cooked: 116 kcal; protein 9 g; fat 0.4 g; carbohydrate 20 g; fiber 8 g; folate 181 microg; iron 3.3 mg; magnesium 36 mg; potassium 369 mg; zinc 1.3 mg.",
            "bioactives": "Folate, soluble + insoluble fiber, plant protein, polyphenols (catechins, procyanidins).",
            "mechanism": "Folate is a one-carbon donor required for spermatogenesis and DNA synthesis; men in higher folate quartiles have lower rates of sperm aneuploidy. High fiber improves glycemic control and satiety, supporting weight loss. Plant protein replaces processed meat in this pattern.",
            "use": "3+ servings/week. Use as base for soups, stews, or grain bowls. Soaking and rinsing reduces phytate and gas.",
        },
        {
            "name": "Chickpeas (Cicer arietinum, cooked)",
            "serving": "1 cup cooked (~165 g)",
            "nutrition": "Per 100 g cooked: 164 kcal; protein 8.9 g; fat 2.6 g; carbohydrate 27 g; fiber 7.6 g; folate 172 microg; iron 2.9 mg; magnesium 48 mg; manganese 1 mg; phosphorus 168 mg; zinc 1.5 mg.",
            "bioactives": "Folate, manganese, resistant starch, saponins, polyphenols.",
            "mechanism": "Resistant starch acts as a prebiotic, generating short-chain fatty acids that improve insulin sensitivity. Manganese is a cofactor for superoxide dismutase, an antioxidant relevant to sperm.",
            "use": "Hummus, salads, stews. 3+ servings/week.",
        },
        {
            "name": "Spinach (raw or lightly cooked)",
            "serving": "150 g cooked or 250 g raw",
            "nutrition": "Per 100 g raw: 23 kcal; protein 2.9 g; fat 0.4 g; carbohydrate 3.6 g; fiber 2.2 g; folate 194 microg; vitamin K 483 microg; vitamin A 9377 IU; vitamin C 28 mg; iron 2.7 mg; magnesium 79 mg; potassium 558 mg; nitrates ~0.7 g/kg.",
            "bioactives": "Folate, beta-carotene, lutein/zeaxanthin, vitamin C, dietary nitrates, magnesium.",
            "mechanism": "Folate-rich; nitrates convert to nitric oxide, improving endothelial function and erectile/penile blood flow. Magnesium supports insulin sensitivity. High micronutrient density per kcal supports a calorie deficit.",
            "use": "Daily; lightly cooked spinach has higher iron bioavailability per serving than raw.",
        },
        {
            "name": "Broccoli",
            "serving": "200 g cooked",
            "nutrition": "Per 100 g cooked: 35 kcal; protein 2.4 g; fat 0.4 g; carbohydrate 7.2 g; fiber 3.3 g; vitamin C 65 mg; folate 108 microg; vitamin K 141 microg; potassium 293 mg; calcium 40 mg.",
            "bioactives": "Sulforaphane, indole-3-carbinol, vitamin C, folate.",
            "mechanism": "Sulforaphane activates the Nrf2 antioxidant pathway, reducing oxidative stress relevant to sperm DNA integrity. Indole-3-carbinol modulates estrogen metabolism toward less mitogenic forms. Volume-dense and low-energy: helps with satiety in a calorie deficit.",
            "use": "Steam or roast, do not over-cook (preserves sulforaphane). Pair with olive oil for vitamin K absorption.",
        },
        {
            "name": "Tomatoes (especially cooked / paste)",
            "serving": "200 g raw or 50 g paste",
            "nutrition": "Per 100 g raw: 18 kcal; protein 0.9 g; fat 0.2 g; carbohydrate 3.9 g; fiber 1.2 g; vitamin C 13.7 mg; potassium 237 mg; lycopene ~3 mg; folate 15 microg. Tomato paste (100 g): 82 kcal; lycopene up to 30 mg.",
            "bioactives": "Lycopene (highest bioavailability after cooking with oil), beta-carotene, vitamin C, potassium.",
            "mechanism": "Lycopene supplementation has been associated with improved sperm motility, morphology, and concentration in meta-analyses of RCTs. As a singlet-oxygen quencher it reduces seminal oxidative stress; it also accumulates in the testis and prostate.",
            "use": "Daily. Cook with olive oil to maximize lycopene absorption (e.g., a Mediterranean tomato sauce).",
        },
        {
            "name": "Pomegranate (arils and 100% juice)",
            "serving": "150 g arils or 200 mL juice",
            "nutrition": "Per 100 g arils: 83 kcal; protein 1.7 g; fat 1.2 g; carbohydrate 19 g; fiber 4 g; vitamin C 10 mg; vitamin K 16 microg; folate 38 microg; potassium 236 mg.",
            "bioactives": "Punicalagins and ellagitannins, anthocyanins, ellagic acid (gut metabolites: urolithins).",
            "mechanism": "Animal and small human RCT data report increased sperm motility and reduced lipid peroxidation in seminal plasma. Mechanism: potent antioxidant and anti-inflammatory activity, with mitochondrial-supportive urolithin A acting on sperm energetics.",
            "use": "150 g arils as snack or salad addition; 200 mL unsweetened juice no more than once daily (sugar load).",
        },
        {
            "name": "Berries (blueberry, strawberry, raspberry, blackberry)",
            "serving": "100-150 g/day",
            "nutrition": "Per 100 g (mixed average): 50 kcal; protein 1 g; carbohydrate 12 g; fiber 3-6 g; vitamin C 10-60 mg; manganese 0.3-0.6 mg; folate 6-25 microg; total polyphenols 200-700 mg.",
            "bioactives": "Anthocyanins, flavonols (quercetin), ellagic acid, vitamin C, fiber.",
            "mechanism": "Anthocyanins reduce oxidative stress and improve endothelial function. Low glycemic index helps glycemic control. High satiety per kcal helps weight loss adherence.",
            "use": "Daily in oats, yogurt, or as a snack. Frozen berries are nutritionally equivalent and cheaper.",
        },
        {
            "name": "Oats (Avena sativa, rolled or steel-cut)",
            "serving": "60 g dry / day",
            "nutrition": "Per 100 g dry: 379 kcal; protein 13.2 g; fat 6.5 g; carbohydrate 67 g; fiber 10 g (of which beta-glucan ~4 g); magnesium 138 mg; iron 4.7 mg; zinc 4 mg; manganese 3.6 mg; phosphorus 410 mg.",
            "bioactives": "Beta-glucan (soluble fiber), avenanthramides (oat-specific polyphenols), magnesium.",
            "mechanism": "Beta-glucan slows gastric emptying, blunts postprandial glucose excursions, and lowers LDL cholesterol via bile acid binding. Avenanthramides have anti-inflammatory and antioxidant activity. Together: better satiety in a calorie deficit and better cardiometabolic profile.",
            "use": "Daily breakfast base; combine with milk, walnuts, berries.",
        },
        {
            "name": "Extra virgin olive oil (Mediterranean primary fat)",
            "serving": "2-3 tbsp/day (30-45 mL)",
            "nutrition": "Per 100 g: 884 kcal; fat 100 g (oleic acid 73 g, palmitic 11 g, linoleic 7 g); vitamin E 14 mg; vitamin K 60 microg; polyphenols 50-800 mg/kg in EVOO.",
            "bioactives": "Oleic acid, oleocanthal, oleuropein, hydroxytyrosol, vitamin E.",
            "mechanism": "Oleocanthal is a natural ibuprofen-like COX inhibitor; olive polyphenols reduce LDL oxidation and improve endothelial function. Replacing butter, palm oil, or refined seed oils with EVOO is one of the most reliable single dietary changes for cardiometabolic risk.",
            "use": "Use cold for dressings and finishing; sufficient smoke point for moderate-heat cooking (180-190 C).",
        },
        {
            "name": "Avocado (Persea americana)",
            "serving": "1/2 fruit (~100 g)",
            "nutrition": "Per 100 g: 160 kcal; protein 2 g; fat 14.7 g (oleic acid 9.8 g, palmitic 2.1 g); carbohydrate 8.5 g; fiber 6.7 g; potassium 485 mg; folate 81 microg; vitamin E 2.1 mg; vitamin K 21 microg; magnesium 29 mg.",
            "bioactives": "Monounsaturated fat, soluble + insoluble fiber, lutein, beta-sitosterol.",
            "mechanism": "Improves HDL particle quality, supports satiety, displaces saturated-fat-heavy spreads. Beta-sitosterol modestly lowers LDL cholesterol.",
            "use": "1/2 fruit/day as spread, salad, or topping. Watch energy density if total deficit is tight.",
        },
        {
            "name": "Green tea (Camellia sinensis)",
            "serving": "2-3 cups/day",
            "nutrition": "Per 240 mL brewed: ~2 kcal; caffeine 25-50 mg; EGCG 100-300 mg; theanine 25-60 mg; fluoride ~0.2 mg.",
            "bioactives": "Epigallocatechin gallate (EGCG) and other catechins, l-theanine, caffeine.",
            "mechanism": "Catechins are potent antioxidants and have a small but reproducible thermogenic and lipid-oxidation effect; l-theanine smooths the caffeine response. Useful behavioral substitute for sweetened beverages.",
            "use": "2-3 cups/day; avoid late-day intake if sleep is sensitive.",
        },
        {
            "name": "Dark chocolate (>= 85% cacao)",
            "serving": "10-20 g/day (1-2 squares)",
            "nutrition": "Per 100 g (85% cacao): 600 kcal; protein 7.8 g; fat 46 g; carbohydrate 24 g; fiber 11 g; iron 12 mg; magnesium 230 mg; copper 1.8 mg; flavanols ~300-700 mg.",
            "bioactives": "Cocoa flavanols (epicatechin), magnesium, theobromine.",
            "mechanism": "Cocoa flavanols improve flow-mediated dilation (a marker of endothelial function), modestly lower blood pressure, and may improve insulin sensitivity. The energy density is high, so portion control matters.",
            "use": "1-2 small squares as a planned dessert. Choose >= 85% cacao to limit sugar.",
        },
        {
            "name": "Whole grains (oats, barley, bulgur, whole rye, whole-wheat)",
            "serving": "60-80 g dry/meal",
            "nutrition": "Approximate per 100 g cooked: 110-150 kcal; protein 3-6 g; fiber 3-7 g; B vitamins; magnesium; iron; zinc.",
            "bioactives": "Beta-glucan (oats, barley), arabinoxylans (rye, wheat), lignans, B vitamins, magnesium, zinc, selenium.",
            "mechanism": "Replacement of refined grains with whole grains lowers postprandial glucose and insulin spikes, supports gut microbiota diversity, and is associated in cohort studies with lower body weight gain over time and lower all-cause mortality.",
            "use": "Default starch source at all meals.",
        },
        {
            "name": "Tofu / tempeh / edamame (whole-food soy)",
            "serving": "100-150 g/serving",
            "nutrition": "Tofu firm per 100 g: 144 kcal; protein 17 g; fat 9 g; carbohydrate 3 g; calcium 350 mg (calcium-set); iron 2.7 mg; magnesium 58 mg; isoflavones 20-30 mg.",
            "bioactives": "Soy protein, isoflavones (genistein, daidzein), calcium (in calcium-set tofu).",
            "mechanism": "Whole-food soy in normal dietary amounts has not been shown to reduce testosterone in healthy men; meta-analyses are reassuring. It is a useful low-saturated-fat protein replacement for processed meat.",
            "use": "1-3 servings/week as part of legume rotation. Avoid high-dose isolated isoflavone supplements unless prescribed.",
        },
        {
            "name": "Skinless poultry (chicken or turkey breast)",
            "serving": "120-150 g cooked",
            "nutrition": "Per 100 g cooked breast: 165 kcal; protein 31 g; fat 3.6 g; selenium 27 microg; phosphorus 220 mg; B vitamins (niacin, B6).",
            "bioactives": "High-biological-value protein, niacin, B6, selenium.",
            "mechanism": "Lean protein anchor for meals during a calorie deficit; preserves lean mass; high satiety per kcal.",
            "use": "Several times per week as lean protein. Bake, grill, or poach; avoid deep-frying or breaded preparations.",
        },
        {
            "name": "Garlic and onion (Allium spp.)",
            "serving": "Daily, in cooking",
            "nutrition": "Garlic per 100 g: 149 kcal; vitamin C 31 mg; manganese 1.7 mg; selenium 14 microg; allicin (formed from alliin when crushed).",
            "bioactives": "Allicin, S-allyl cysteine, quercetin (onion), organosulfur compounds.",
            "mechanism": "Modest blood-pressure-lowering and lipid-lowering effects in meta-analyses; antioxidant and antimicrobial activities in vitro. Useful flavour foundation that allows reduction of salt and added fat.",
            "use": "Daily aromatic base for Mediterranean cooking.",
        },
        {
            "name": "Water and unsweetened beverages",
            "serving": "2-3 L total fluid/day",
            "nutrition": "0 kcal.",
            "bioactives": "Hydration; electrolyte balance with adequate dietary potassium and modest sodium.",
            "mechanism": "Adequate hydration supports semen volume and metabolic function. Replacing one daily 350 mL sugar-sweetened beverage with water is one of the largest single-leverage moves for weight loss in this BMI range.",
            "use": "Water, sparkling water, unsweetened tea, black coffee. Avoid sweetened beverages.",
        },
    ]


# ---------------------------------------------------------------------------
def main():
    pdf = build_doc()
    data = pdf.build("Diet for Male Infertility and Obesity (BMI 28+)")
    out_path = os.path.join(os.path.dirname(__file__), "Diet_for_Male_Infertility_and_Obesity.pdf")
    with open(out_path, "wb") as f:
        f.write(data)
    print(f"Wrote {out_path} ({len(data):,} bytes, {len(pdf.pages)} pages)")


if __name__ == "__main__":
    main()
