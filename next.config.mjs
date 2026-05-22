/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // The patient education page reads its Markdown source from
    // `docs/glp1-education/` at request time. The path is built with
    // path.join(process.cwd(), "docs", ...) which Next's output tracer
    // cannot statically analyse, so the .md file would otherwise not be
    // bundled into the serverless function for `next build` and
    // serverless / Vercel deploys. Listing it here forces the tracer
    // to include it. `next dev` already works without this entry.
    outputFileTracingIncludes: {
      "/patient/education/glp1": [
        "./docs/glp1-education/glp1_patient_guide.md",
      ],
    },
  },
};

export default nextConfig;
