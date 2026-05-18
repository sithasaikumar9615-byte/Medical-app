#!/usr/bin/env python3
"""
Generate a short companion PDF: "Quick Insights - Foods to Eat & Avoid".

This is the condensed version of sections 4 and 5 of
Diet_for_Male_Infertility_and_Obesity.pdf - one-liner cards optimised for
fast scanning. Reuses the PDF engine from generate_nutrition_pdf.py.

Output: Diet_Quick_Insights.pdf
"""
from __future__ import annotations
import os

from generate_nutrition_pdf import (
    PDF, MARGIN_L, MARGIN_R, PAGE_W, PAGE_H,
)

# --- Quick-insight content -------------------------------------------------
# (food, "why it helps" tagline, top nutrient/bioactive, daily/weekly dose)

EAT = [
    ("Walnuts",
     "Best-studied nut for sperm motility & morphology.",
     "ALA omega-3, polyphenols, l-arginine, zinc",
     "30 g/day"),
    ("Salmon (or sardines, mackerel)",
     "DHA enriches sperm membranes; vitamin D supports testosterone.",
     "EPA + DHA, vitamin D, selenium",
     "150 g, 2-3x/week"),
    ("Pumpkin seeds",
     "Top plant source of zinc - core mineral for spermatogenesis.",
     "Zinc, magnesium, l-arginine",
     "30 g/day"),
    ("Brazil nuts",
     "One nut covers your daily selenium for GPx4 antioxidant defense.",
     "Selenium (very high - do not over-eat)",
     "1-2 nuts/day, never more"),
    ("Eggs",
     "Cheap high-quality protein with choline + vitamin D.",
     "Choline, vitamin D, B12, selenium",
     "2-3/day acceptable"),
    ("Greek yogurt (0-2% fat, plain)",
     "Satiating protein anchor in a calorie deficit.",
     "Casein/whey protein, calcium, probiotics",
     "200 g/day"),
    ("Lentils",
     "Folate-rich plant protein; lowers sperm aneuploidy risk.",
     "Folate, fiber, plant protein, iron",
     "3+ servings/week"),
    ("Chickpeas",
     "Resistant starch feeds the gut; improves insulin sensitivity.",
     "Folate, manganese, fiber",
     "3+ servings/week"),
    ("Spinach",
     "Folate + dietary nitrates - boosts NO and blood flow.",
     "Folate, nitrates, magnesium, iron",
     "Daily, lightly cooked"),
    ("Broccoli",
     "Sulforaphane activates Nrf2 antioxidant pathway.",
     "Sulforaphane, vitamin C, folate, fiber",
     "200 g, 3+ times/week"),
    ("Tomatoes (cooked, with oil)",
     "Lycopene improves motility & morphology in RCTs.",
     "Lycopene, vitamin C, potassium",
     "Daily; cook with olive oil"),
    ("Pomegranate",
     "Punicalagins reduce seminal lipid peroxidation.",
     "Punicalagins, urolithins, anthocyanins",
     "150 g arils/day or 200 mL juice"),
    ("Berries",
     "Anthocyanins protect endothelium and sperm DNA.",
     "Anthocyanins, vitamin C, fiber",
     "100-150 g/day"),
    ("Oats (rolled or steel-cut)",
     "Beta-glucan flattens glucose spikes; aids satiety.",
     "Beta-glucan, magnesium, zinc",
     "60 g dry/day"),
    ("Extra virgin olive oil",
     "Replace butter/refined seed oil; oleocanthal is anti-inflammatory.",
     "Oleic acid, oleocanthal, vitamin E, polyphenols",
     "2-3 tbsp/day"),
    ("Avocado",
     "Mono-unsaturated fat + 7 g fiber; lifts HDL quality.",
     "Oleic acid, fiber, potassium, folate",
     "1/2 fruit/day"),
    ("Green tea",
     "EGCG - antioxidant + mild thermogenic effect.",
     "EGCG, l-theanine, caffeine",
     "2-3 cups/day"),
    ("Dark chocolate (>=85%)",
     "Cocoa flavanols improve endothelial function.",
     "Flavanols, magnesium",
     "10-20 g/day max"),
    ("Whole grains (barley, bulgur, rye)",
     "Stable energy; supports microbiome diversity.",
     "Fiber, B vitamins, magnesium, zinc",
     "Default starch at meals"),
    ("Tofu / tempeh / edamame",
     "Whole-food soy is safe for testosterone in normal amounts.",
     "Soy protein, isoflavones, calcium",
     "1-3 servings/week"),
    ("Skinless chicken / turkey breast",
     "Lean protein anchor; preserves muscle in a deficit.",
     "Protein 31 g/100 g, niacin, B6, selenium",
     "Several times/week"),
    ("Garlic & onion",
     "Allium organosulfurs lower BP & lipids modestly.",
     "Allicin, S-allyl cysteine, quercetin",
     "Daily in cooking"),
    ("Water / unsweetened tea",
     "Replacing one daily soda is the biggest single win.",
     "Hydration; 0 kcal",
     "2-3 L total fluid/day"),
]

AVOID = [
    ("Sugar-sweetened beverages",
     "Each daily 250 mL serving is linked to lower sperm motility and weight gain.",
     "Replace with water, sparkling water, or unsweetened tea."),
    ("Processed & cured meats",
     "Bacon, sausage, hot dogs, deli meats - linked to lower sperm morphology.",
     "Use fish, eggs, legumes, or fresh poultry instead."),
    ("Trans-fat foods",
     "Industrial partially hydrogenated oils accumulate in seminal lipids.",
     "Read labels; avoid 'partially hydrogenated' anything."),
    ("Deep-fried fast food",
     "High energy density, oxidised fats, low micronutrients.",
     "Reserve for rare occasions, not weekly habit."),
    ("Refined grains & added sugar",
     "Drive insulin resistance, which impairs Leydig cell function.",
     "Swap white bread/rice for whole grains; cap added sugar at 25 g/day."),
    ("High-mercury fish",
     "King mackerel, swordfish, shark, tilefish, big-eye tuna.",
     "Choose salmon, sardines, anchovies, trout, light tuna."),
    ("Excess alcohol",
     ">7 drinks/week dose-dependently lowers sperm parameters.",
     "Ideally abstain during preconception."),
    ("High-dose soy isoflavone supplements",
     "Whole-food soy is fine; isolated mega-dose isoflavones are not.",
     "Skip 'fertility' products with concentrated isoflavones."),
    ("Tobacco, vaping, daily cannabis, anabolic steroids",
     "Highest-impact non-food modifiable harms after weight.",
     "Quitting is the single biggest fertility intervention available."),
]


def build_quick_pdf() -> PDF:
    pdf = PDF()

    # --- Title ---
    pdf.space(20)
    pdf._draw_text(MARGIN_L, pdf.y - 24, 24, "F2", "Quick Insights")
    pdf.y -= 30
    pdf._draw_text(MARGIN_L, pdf.y - 16, 16, "F1", "Foods to Eat & Foods to Avoid")
    pdf.y -= 24
    pdf._line(MARGIN_L, pdf.y, PAGE_W - MARGIN_R, pdf.y, w=1.0, gray=0.3)
    pdf.y -= 10
    pdf.p("A condensed scan-friendly companion to the main research PDF. "
          "For each food: one-line benefit, top bioactive, and a practical "
          "daily/weekly dose. For evidence and references, see "
          "'Diet_for_Male_Infertility_and_Obesity.pdf'.",
          size=10.5, leading=13.5)
    pdf.space(4)
    pdf.small("Educational synthesis. Not medical advice.")
    pdf.space(10)

    # --- Eat ---
    pdf.h1("Eat (sections 4: food monographs - condensed)")
    pdf.p(f"{len(EAT)} foods, sorted by category. Build meals around them.",
          size=10.5)
    pdf.space(4)

    for name, why, nutrient, dose in EAT:
        # compact 3-line card
        pdf._ensure(46)
        # title bar
        pdf._draw_rect(MARGIN_L, pdf.y - 18, PAGE_W - MARGIN_L - MARGIN_R, 18, "1f3a5f")
        pdf.cur.append("1 1 1 rg")
        pdf._draw_text(MARGIN_L + 6, pdf.y - 13, 11.5, "F2", name)
        # right-aligned dose chip
        from generate_nutrition_pdf import text_width
        dw = text_width(dose, 9.5)
        pdf._draw_text(PAGE_W - MARGIN_R - 6 - dw, pdf.y - 13, 9.5, "F1", dose)
        pdf.cur.append("0 0 0 rg")
        pdf.y -= 22
        pdf.p(why, size=10, leading=12.5)
        pdf.kv("Key", nutrient, size=9.5, leading=12)
        pdf.space(2)

    pdf.page_break()

    # --- Avoid ---
    pdf.h1("Avoid or limit (section 5)")
    pdf.p("Frequency is the lever - occasional intake is fine; daily/weekly "
          "habits are the problem.", size=10.5)
    pdf.space(4)

    for name, why, swap in AVOID:
        pdf._ensure(54)
        # red-ish title bar
        pdf._draw_rect(MARGIN_L, pdf.y - 18, PAGE_W - MARGIN_L - MARGIN_R, 18, "8a2424")
        pdf.cur.append("1 1 1 rg")
        pdf._draw_text(MARGIN_L + 6, pdf.y - 13, 11.5, "F2", name)
        pdf.cur.append("0 0 0 rg")
        pdf.y -= 22
        pdf.kv("Why", why, size=9.5, leading=12)
        pdf.kv("Swap", swap, size=9.5, leading=12)
        pdf.space(2)

    pdf.space(8)
    pdf.rule()
    pdf.small("End of quick-insight summary. For full nutrition tables, "
              "mechanisms, 7-day plan, 12-week protocol, and references, "
              "see Diet_for_Male_Infertility_and_Obesity.pdf in this folder.")
    return pdf


def main():
    pdf = build_quick_pdf()
    data = pdf.build("Quick Insights - Foods to Eat and Avoid")
    out = os.path.join(os.path.dirname(__file__), "Diet_Quick_Insights.pdf")
    with open(out, "wb") as f:
        f.write(data)
    print(f"Wrote {out} ({len(data):,} bytes, {len(pdf.pages)} pages)")


if __name__ == "__main__":
    main()
