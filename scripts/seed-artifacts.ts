/**
 * Seed PM artifacts from Lenny's Frameworks.
 * Run: npm run seed-artifacts
 * Requires: .env.local with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Idempotent: ON CONFLICT (slug) DO NOTHING
 */
import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

const ARTIFACTS: Array<{ slug: string; title: string; domains: string[]; use_case: string }> = [
  { slug: "jobs-to-be-done", title: "Jobs to be Done (JTBD)", domains: ["discovery"], use_case: "Understanding customer needs; deciding what to build" },
  { slug: "ice-framework", title: "ICE Framework", domains: ["strategy"], use_case: "Prioritising with limited data; roadmap and backlog ranking" },
  { slug: "rice-framework", title: "RICE Framework", domains: ["strategy"], use_case: "Backlog and initiative ranking; prioritising by reach and impact" },
  { slug: "north-star-metric", title: "North Star Metric", domains: ["growth"], use_case: "Aligning teams on one metric; goal-setting and focus" },
  { slug: "growth-loops", title: "Growth Loops", domains: ["growth"], use_case: "Designing viral or self-reinforcing acquisition; growth model" },
  { slug: "kano-model", title: "Kano Model", domains: ["discovery"], use_case: "Feature prioritisation; differentiation vs table stakes" },
  { slug: "lean-startup", title: "Lean Startup", domains: ["discovery"], use_case: "Validating ideas; MVPs, experiments, and pivots" },
  { slug: "gist-framework", title: "GIST Framework", domains: ["delivery"], use_case: "Breaking work into goals/ideas/steps/tasks; execution and validation" },
  { slug: "moo-framework", title: "MOO Framework", domains: ["leadership"], use_case: "Anticipating objections; stakeholder and exec communication" },
  { slug: "lno-framework", title: "LNO Framework", domains: ["delivery"], use_case: "Focusing on high-leverage work; time and energy management" },
  { slug: "pshe-framework", title: "PSHE Framework", domains: ["leadership"], use_case: "Evaluating PM talent; hiring and assessing product people" },
  { slug: "pmwheel", title: "PMwheel", domains: ["leadership"], use_case: "Coaching and hiring; PM skills assessment and development" },
  { slug: "opportunity-solution-tree", title: "Opportunity Solution Tree", domains: ["discovery"], use_case: "Deciding what to build; outcome to opportunities to solutions" },
  { slug: "product-market-fit-sean-ellis-test", title: "Product-Market Fit / Sean Ellis Test", domains: ["growth"], use_case: "Measuring product-market fit; survey and retention signal" },
  { slug: "product-market-fit", title: "Product-Market Fit", domains: ["growth"], use_case: "Creating value and retention; early-stage focus and PMF" },
  { slug: "unit-economics-ltv-cac", title: "Unit Economics (LTV/CAC)", domains: ["growth"], use_case: "Judging growth efficiency; monetisation and payback" },
  { slug: "four-ps", title: "Four Ps (Persona/Problem/Promise/Product)", domains: ["discovery"], use_case: "Pivots and positioning; aligning product to persona and promise" },
  { slug: "mece-framework", title: "MECE Framework", domains: ["strategy"], use_case: "Problem breakdown; structured analysis and options" },
  { slug: "swat-team", title: "SWAT Team", domains: ["delivery"], use_case: "Crisis or critical initiative; team structure and focus" },
  { slug: "ikigai", title: "Ikigai", domains: ["leadership"], use_case: "Career purpose; role and life alignment" },
  { slug: "vrio-framework", title: "VRIO Framework", domains: ["strategy"], use_case: "Evaluating capabilities; where to play and compete" },
  { slug: "star-method", title: "STAR Method", domains: ["leadership"], use_case: "Interviewing; assessing how someone delivered outcomes" },
  { slug: "magic-number", title: "Magic Number", domains: ["growth"], use_case: "Growth efficiency benchmark; early-stage metrics" },
  { slug: "burn-multiple", title: "Burn Multiple", domains: ["growth"], use_case: "Capital efficiency; financial metrics and runway" },
  { slug: "continuous-discovery-habits", title: "Continuous Discovery Habits", domains: ["discovery"], use_case: "Ongoing discovery; user research and opportunity habits" },
  { slug: "four-forces-jtbd", title: "Four Forces (JTBD)", domains: ["discovery"], use_case: "Switching behaviour; adoption, habits, and anxieties" },
  { slug: "product-trio", title: "Product Trio", domains: ["delivery"], use_case: "Cross-functional collaboration; product–design–engineering" },
  { slug: "daci", title: "DACI", domains: ["delivery"], use_case: "Cross-team roles; decision ownership and clarity" },
  { slug: "three-ws", title: "Three W's", domains: ["leadership"], use_case: "PM career; what you produce, bring, and how you operate" },
  { slug: "confidence-meter", title: "Confidence Meter", domains: ["discovery"], use_case: "Calibrating evidence; hypothesis and confidence levels" },
  { slug: "switch-log-switch-lock", title: "Switch Log / Switch Lock", domains: ["delivery"], use_case: "Reducing context switching; focus and time management" },
  { slug: "job-selection-framework", title: "Job Selection Framework", domains: ["leadership"], use_case: "Choosing roles; career decisions and opportunity filter" },
  { slug: "bow-and-arrow", title: "Bow and Arrow", domains: ["leadership"], use_case: "Presenting and storytelling; one key message plus proof" },
  { slug: "habit-loop", title: "Habit Loop", domains: ["growth"], use_case: "Retention; trigger–action–reward and closing the loop" },
  { slug: "flash-tags", title: "Flash Tags", domains: ["leadership"], use_case: "Feedback calibration; how strongly to act on stakeholder input" },
  { slug: "chess-points", title: "Chess Points", domains: ["strategy"], use_case: "Competitive releases; product strategy and positioning" },
  { slug: "metrics-tree", title: "Metrics Tree", domains: ["growth"], use_case: "Breaking down metrics; drivers and goal-setting" },
  { slug: "j-curve-vs-stairs", title: "J-Curve vs Stairs", domains: ["leadership"], use_case: "Career growth; promotions vs bold moves" },
  { slug: "race-car-framework", title: "Race Car Framework", domains: ["growth"], use_case: "Consumer growth model; growth strategy and loops" },
  { slug: "adjacent-user-theory", title: "Adjacent User Theory", domains: ["growth"], use_case: "Expanding beyond core ICP; growth without diluting PMF" },
  { slug: "shape-up", title: "Shape Up", domains: ["delivery"], use_case: "Time-boxed delivery; shaping and building in cycles" },
  { slug: "systems-thinking", title: "Systems Thinking", domains: ["strategy"], use_case: "Understanding system dynamics; stocks, flows, feedback" },
  { slug: "10-things-you-should-know", title: "10 Things You Should Know", domains: ["leadership"], use_case: "Stakeholder alignment; concise briefs and prioritised view" },
  { slug: "seo-forecasting", title: "SEO Forecasting", domains: ["growth"], use_case: "SEO expectations; channel and launch forecasting" },
  { slug: "homework-for-life", title: "Homework for Life", domains: ["leadership"], use_case: "Storytelling; building a personal story bank" },
  { slug: "strategy-not-self-expression", title: "Strategy Not Self-Expression", domains: ["leadership"], use_case: "Giving feedback; what they need to hear to succeed" },
  { slug: "signposting", title: "Signposting", domains: ["leadership"], use_case: "Clear communication; guiding readers and listeners" },
  { slug: "product-quality-review-pqr", title: "Product Quality Review (PQR)", domains: ["delivery"], use_case: "Quality calibration; cross-functional review and scorecard" },
  { slug: "quality-scorecard", title: "Quality Scorecard", domains: ["delivery"], use_case: "Quality rubric; tracking quality over time" },
  { slug: "customer-journey-score", title: "Customer Journey Score", domains: ["growth"], use_case: "Journey milestones; activation, retention, and KPIs" },
  { slug: "nrr-net-revenue-retention", title: "NRR (Net Revenue Retention)", domains: ["growth"], use_case: "Revenue retention target; SaaS and expansion metrics" },
  { slug: "media-mix-modeling", title: "Media Mix Modeling", domains: ["growth"], use_case: "Budget allocation; channel mix and attribution" },
  { slug: "pre-mortem", title: "Pre-mortem", domains: ["delivery"], use_case: "Risk identification; pre-project failure analysis" },
  { slug: "prfaq", title: "PRFAQ", domains: ["discovery"], use_case: "Clarifying customer needs and scope; PR/FAQ artifact" },
  { slug: "working-backwards", title: "Working Backwards", domains: ["discovery"], use_case: "Customer-first; starting with problems then solution" },
  { slug: "dory-pulse", title: "Dory/Pulse", domains: ["delivery"], use_case: "Meeting rituals; written opinions and question prioritisation" },
  { slug: "accordion-method", title: "Accordion Method", domains: ["leadership"], use_case: "Speaking practice; adaptable talks at different lengths" },
  { slug: "lighthouse-users", title: "Lighthouse Users", domains: ["discovery"], use_case: "Deep user validation; 10–100–1000 before scaling" },
  { slug: "eigenquestions", title: "Eigenquestions", domains: ["strategy"], use_case: "Finding the key question; resolving many questions at once" },
  { slug: "input-metrics", title: "Input Metrics", domains: ["growth"], use_case: "Inputs that drive experience; improvement over outputs" },
  { slug: "design-sprint", title: "Design Sprint", domains: ["discovery"], use_case: "Quick prototype and test; 5-day sprint format" },
  { slug: "double-diamond", title: "Double Diamond", domains: ["discovery"], use_case: "Divergence and convergence; product and design thinking" },
  { slug: "three-horizons", title: "Three Horizons", domains: ["strategy"], use_case: "Portfolio framing; H1/H2/H3 and resource allocation" },
  { slug: "70-20-10-model", title: "70/20/10 Model", domains: ["strategy"], use_case: "Resource allocation; core vs adjacencies vs bets" },
  { slug: "moscow-prioritization", title: "MoSCoW Prioritization", domains: ["strategy"], use_case: "Must/Should/Could/Won't; backlog and scope prioritisation" },
  { slug: "pareto-80-20-rule", title: "Pareto / 80/20 Rule", domains: ["strategy"], use_case: "Focus on few high-impact levers; 80/20 prioritisation" },
  { slug: "eisenhower-matrix", title: "Eisenhower Matrix", domains: ["strategy"], use_case: "Task prioritisation; do, defer, delegate, delete" },
  { slug: "agile", title: "Agile", domains: ["delivery"], use_case: "Iterative delivery; sprints and cross-functional coordination" },
];

async function main() {
  console.log(`Seeding ${ARTIFACTS.length} artifacts...`);
  let inserted = 0;
  let skipped = 0;

  for (const artifact of ARTIFACTS) {
    const { error } = await supabase.from("artifacts").insert(artifact).select().maybeSingle();
    if (error) {
      if (error.code === "23505") {
        skipped++;
      } else {
        console.error(`Failed to insert "${artifact.slug}":`, error.message);
      }
    } else {
      inserted++;
    }
  }

  console.log(`Done. Inserted: ${inserted}, Skipped (already exists): ${skipped}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
