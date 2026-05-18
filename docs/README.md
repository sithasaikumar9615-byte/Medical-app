# Nutrition research docs

This folder holds the evidence-based research synthesis that we plan to surface
inside the Medical-app patient resources module.

## Files

- `Diet_for_Male_Infertility_and_Obesity.pdf` — 16-page synthesis covering:
  - Disclaimer and intended audience
  - Executive summary and macronutrient targets
  - Why obesity and male infertility share a diet (sperm parameters,
    BMI link, BMI 28+ context)
  - Dietary patterns with the strongest evidence (Mediterranean foundation,
    higher-protein modification for weight loss, DASH overlay)
  - 23 **food monographs** — for each food: nutrition per 100 g (USDA-aligned),
    key bioactive compounds, and the mechanism by which it benefits sperm
    quality, hormones, and metabolic health
  - Foods and substances to limit or avoid
  - Sample 7-day meal plan (~1800 kcal)
  - Practical 12-week protocol (phasing, labs, supplements with caveats,
    red flags)
  - Selected references organized by topic (real PubMed-indexed titles —
    no fabricated PMIDs)

- `generate_nutrition_pdf.py` — pure-stdlib (no external dependencies) Python
  script that builds the PDF. Re-run with `python3 generate_nutrition_pdf.py`
  to regenerate after edits.

## How this will be used in the app (next step, not done yet)

Two natural integrations:

1. **Static download.** Add a `/resources` route that links to the PDF for
   patients to download. The PDF lives in `public/docs/` for direct serving.

2. **Structured content.** Convert the food monograph data block in
   `generate_nutrition_pdf.py` into a JSON file (or Prisma `NutritionFood`
   model) and render food cards at `/patient/nutrition`, with filters by
   dietary goal (fertility / weight loss / both).

## Important note on scope

This document is an educational synthesis of published research. It is **not**
medical advice. Caloric targets, macronutrient ratios, and supplement doses
should be tailored to the individual after a clinical evaluation (semen
analysis, hormone panel, metabolic labs, comorbidities, allergies, current
medications). Some supplements (e.g., high-dose selenium) are harmful in
excess.
