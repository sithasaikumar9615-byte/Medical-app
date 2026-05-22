# GLP-1 Receptor Agonists Patient Education

A plain-language patient-education guide on GLP-1 receptor agonists: what they are, how they manage blood sugar, how they support weight loss, the cardiovascular and kidney signals from the major outcome trials, the common side effects, the serious warnings on the FDA labels, and the questions a patient can take to their own clinician. The content is written for adults with type 2 diabetes, prediabetes, or obesity, and for the people who care for them.

## Files

| File | What it is |
|---|---|
| `glp1_patient_guide.md` | Master document. Layperson-friendly explanation with inline numbered citations to FDA prescribing labels, ADA Standards of Care 2024, the 2022 ADA/EASD consensus, NICE NG28, and the named LEADER, SUSTAIN-6, REWIND, STEP, SURPASS, and SURMOUNT trials. |
| `glp1_patient_guide.html` | Same content, styled for printing. **Open in any browser then Ctrl+P, Save as PDF** to get a final PDF directly from the browser. |
| `glp1_patient_guide.pdf` | Pre-rendered, paginated PDF produced by `build_pdf.py`. Checked in so the in-app download button has something to serve without anyone having to run the toolchain. |
| `build_html.py` | Python 3 stdlib-only Markdown to HTML converter. Re-run after editing the `.md`. |
| `build_pdf.py` | Python 3 stdlib-only Markdown to PDF converter. Re-run after editing the `.md`. |

## How to get a PDF

There are two supported ways. Both produce a paginated, printable PDF.

**Option A: regenerate locally with the bundled scripts (recommended for committers).**

```
python3 docs/glp1-education/build_html.py docs/glp1-education/glp1_patient_guide.md docs/glp1-education/glp1_patient_guide.html
python3 docs/glp1-education/build_pdf.py  docs/glp1-education/glp1_patient_guide.md docs/glp1-education/glp1_patient_guide.pdf
```

The scripts are pure Python with no third-party dependencies; they only use `re`, `html`, `sys`, `zlib`, `pathlib`, and `typing`. Any Python 3.7+ interpreter will run them.

**Option B: open the HTML in a browser.**

1. Open `glp1_patient_guide.html` in Chrome, Edge, or Firefox.
2. Press **Ctrl + P** (or **Cmd + P** on Mac).
3. Choose **Save as PDF**, paper size A4 or Letter, default margins.
4. Save anywhere on your computer.

After regenerating the PDF, refresh the copy that the in-app download button serves:

```
cp docs/glp1-education/glp1_patient_guide.pdf public/education/glp1_patient_guide.pdf
```

The `public/education/` copy step is performed by FEAT-002 when the in-app patient-education page is wired up. The master copy in this folder remains the source of truth.

## What's inside

- **Section 1: Who this guide is for.** Audience and the boilerplate disclaimer.
- **Section 2: What is GLP-1?** The endogenous incretin, where it comes from in the gut, why its action is short-lived, and the incretin effect explained without jargon.
- **Section 3: What are GLP-1 receptor agonists?** The actual approved drugs by generic and brand: exenatide (Byetta, Bydureon), liraglutide (Victoza, Saxenda), dulaglutide (Trulicity), semaglutide (Ozempic, Wegovy, Rybelsus), lixisenatide (Adlyxin), and tirzepatide (Mounjaro, Zepbound) explained as a dual GIP/GLP-1 agonist.
- **Section 4: How they lower blood sugar (mechanism).** Glucose-dependent insulin release, suppression of inappropriate glucagon, slowed gastric emptying, and reduced hepatic glucose output.
- **Section 5: How they cause weight loss.** Central appetite pathways, slowed gastric emptying, the magnitudes seen in STEP and SURMOUNT, and the honest result from the STEP 4 extension when the drug is stopped.
- **Section 6: Cardiovascular and kidney signals.** LEADER, SUSTAIN-6, and REWIND for MACE; the renal composite signals; what is and is not claimed.
- **Section 7: Common side effects and how to manage them.** GI symptoms, slow titration, smaller meals, hydration, gallbladder events, and injection-site reactions.
- **Section 8: Serious warnings and contraindications.** The FDA boxed warning on medullary thyroid carcinoma and MEN-2, the pancreatitis signal, hypoglycaemia risk when combined with insulin or sulfonylureas, and pregnancy considerations.
- **Section 9: Who typically gets prescribed a GLP-1 RA.** ADA Standards of Care 2024, the 2022 ADA/EASD consensus on hyperglycaemia management, and the NICE NG28 UK pathway.
- **Section 10: What this is NOT.** Not a magic bullet, not a substitute for diet and activity, not a short course (STEP 4 weight regain), not first-line in type 1 diabetes.
- **Section 11: Talking to your doctor.** A short, practical question list patients can take into a consultation.
- **Section 12: Further reading and educational videos.** Official channels (NIH/NIDDK, ADA, Mayo Clinic, NHS, Cleveland Clinic) named only as starting points; no specific video is cited as evidence.
- **Section 13: References.** Deduplicated numbered list. Inline numbered citations like `[1]`, `[2]` are placed after substantive clinical claims.
- **Closing Disclaimer.** The same boilerplate restated at the bottom.

## Disclaimer

This guide is general health education. It is not a substitute for personalised medical advice. Talk to your physician, pharmacist, or qualified diabetes educator before starting, stopping, or changing any medication.

## Copyright

All written content is original. References are cited only by author, journal, year, and, where it can be verified, volume and pages. Citing a primary source is fair use. The build scripts are part of this repository and inherit its licence.
