import { Activity } from "@/types";
import { getWeekNumber } from "./categorization";
import { saveActivities, loadActivities } from "./storage";

export function seedInitialData() {
  const existingActivities = loadActivities();
  if (existingActivities.length > 0) {
    return false; // Already has data
  }

  const seedActivities: Omit<Activity, "id" | "createdAt" | "updatedAt" | "weekNumber" | "userId">[] = [
    // Q1 2025 - Roofing Core Vertical
    {
      date: "2025-01-15",
      title: "Set up Roofing Golden Account",
      description: "SVP's idea to create a reusable demo environment. Implemented the company's first Roofing Golden Account.",
      category: "Roofing Core Vertical",
      teams: ["Sales", "CX", "Marketing"],
      impactNotes: "Built the company's first Roofing Golden Account — reduced setup time for demo environments by ~80%, enabling Sales and Marketing to run independent showcases without engineering dependency.",
      status: "Done",
    },
    {
      date: "2025-01-28",
      title: "Golden Account maintenance and planning",
      description: "Ongoing maintenance of the Golden Account and planning for future updates based on team feedback.",
      category: "Roofing Core Vertical",
      teams: ["Sales", "CX"],
      impactNotes: "Maintained environment stability and gathered requirements for v2.0 from 4 internal organizations.",
      status: "Done",
    },
    {
      date: "2025-02-10",
      title: "Worked with RevOps to monitor Golden Account usage data",
      description: "Collaborated with RevOps to set up tracking and monitoring for how the Golden Account was being used across teams.",
      category: "Roofing Core Vertical",
      teams: ["RevOps"],
      impactNotes: "Introduced data visibility by providing leadership with the first quantitative lens on Roofing vertical engagement.",
      status: "Done",
    },
    {
      date: "2025-02-20",
      title: "Trained peers on Roofing Golden Account (1:1 knowledge sharing)",
      description: "Conducted individual training sessions with team members across different departments on how to use the Golden Account.",
      category: "Roofing Core Vertical",
      teams: ["Sales", "CX", "Marketing"],
      impactNotes: "Trained 10+ team members, increasing internal adoption of Roofing best practices across 4 orgs (CX, Sales, RevOps, Marketing).",
      status: "Done",
    },
    {
      date: "2025-03-05",
      title: "Worked with Marketing to set up their Golden Account for content",
      description: "Helped Marketing team set up and configure their own Golden Account environment for content creation purposes.",
      category: "Roofing Core Vertical",
      teams: ["Marketing"],
      impactNotes: "Enabled Marketing to create authentic product content independently, reducing dependency on Product team by 60%.",
      status: "Done",
    },
    {
      date: "2025-03-18",
      title: "Worked with Sales on Roofing calls as solutioning expert",
      description: "Joined sales calls to provide technical expertise and solution architecture for Roofing prospects.",
      category: "Roofing Core Vertical",
      teams: ["Sales"],
      impactNotes: "Supported 8+ high-value sales calls, contributing to technical win rate and customer confidence.",
      status: "Done",
    },
    
    // Q2 2025 - Roofing Core Vertical
    {
      date: "2025-04-08",
      title: "Trained SVP Sales and set up a demo account",
      description: "Provided dedicated training for SVP of Sales and configured a personalized demo account for executive presentations.",
      category: "Roofing Core Vertical",
      teams: ["Sales"],
      impactNotes: "Enabled C-level Sales leadership to run demos independently, improving executive-level deal engagement.",
      status: "Done",
    },
    {
      date: "2025-04-22",
      title: "Strategy + build of Golden Account 2.0 (projects focus)",
      description: "Led the strategic planning and build-out of Golden Account 2.0, shifting focus from Jobs to Projects module based on market feedback.",
      category: "Roofing Core Vertical",
      teams: ["Product", "Sales", "CX"],
      impactNotes: "Drove roadmap iteration for Golden Account 2.0, shifting focus from Jobs → Projects module to align with market feedback from 15+ Roofing customers.",
      status: "Done",
    },
    {
      date: "2025-05-12",
      title: "Worked with co-founder on guided user flows for new customers",
      description: "Collaborated directly with co-founder to design and implement guided onboarding flows for new Roofing customers.",
      category: "Roofing Core Vertical",
      teams: ["Product", "Design"],
      impactNotes: "Created simplified onboarding path that reduced time-to-first-value for new Roofing customers by ~40%.",
      status: "Done",
    },

    // Q1 2025 - Product & Features
    {
      date: "2025-01-22",
      title: "Built the Checklist Builder",
      description: "Developed an internal tool for creating and managing checklists, now used company-wide by Implementation and CX teams.",
      category: "Product & Features",
      teams: ["Implementation", "CX", "Product"],
      impactNotes: "Launched Checklist Builder, cutting checklist setup time by 50% and standardizing project onboarding across Implementation and CX teams.",
      status: "Done",
    },
    {
      date: "2025-02-15",
      title: "Guided implementation team on AI side projects",
      description: "Mentored Implementation team on exploring AI and LLM-based workflow experiments.",
      category: "Product & Features",
      teams: ["Implementation"],
      impactNotes: "Drove 4+ internal AI initiatives, introducing LLM-based workflow experiments and establishing early-stage AI literacy framework across Implementation org.",
      status: "Done",
    },
    {
      date: "2025-03-10",
      title: "Worked with Product and QA for beta testing Roofing features",
      description: "Collaborated with Product and QA teams to test beta releases of new Roofing-specific features before production launch.",
      category: "Product & Features",
      teams: ["Product", "Engineering"],
      impactNotes: "Tested beta releases of Roofing features, ensuring customer pain signals translated into stable production releases. Triaged 50+ feature requests.",
      status: "Done",
    },

    // Q2 2025 - Product & Features
    {
      date: "2025-04-18",
      title: "Feature request grooming & QA",
      description: "Ongoing triage and prioritization of feature requests from customers and internal teams, plus quality assurance testing.",
      category: "Product & Features",
      teams: ["Product", "CX"],
      impactNotes: "Acted as product-CX bridge, triaging feature requests and ensuring alignment between customer needs and product roadmap.",
      status: "In Progress",
    },
    {
      date: "2025-05-25",
      title: "Solved complex CX use cases",
      description: "Provided technical solutions for escalated customer use cases that required deep product knowledge and cross-team coordination.",
      category: "Product & Features",
      teams: ["CX", "Product", "Engineering"],
      impactNotes: "Reduced escalations from complex use cases by providing rapid cross-team solutioning — shortening TAT for customer blockers by ~25%.",
      status: "Done",
    },

    // Q3 2025 - Partnerships & Expansion
    {
      date: "2025-07-10",
      title: "Built Roofing Booking Widget for TSSG (strategic partner)",
      description: "Developed a custom booking widget specifically for TSSG partnership to enable faster lead capture and appointment management.",
      category: "Partnerships & Expansion",
      teams: ["Product", "Sales"],
      impactNotes: "Co-built and deployed Roofing Booking Widget for TSSG, enabling faster lead capture and creating a replicable playbook for future partner verticals.",
      status: "Done",
    },
    {
      date: "2025-08-15",
      title: "Helped AD build a Golden Account for TSSG",
      description: "Supported Account Director in replicating the Golden Account framework for TSSG partner vertical.",
      category: "Partnerships & Expansion",
      teams: ["Sales", "CX"],
      impactNotes: "Established Zuper's first cross-vertical demo infrastructure by replicating Golden Account for TSSG, setting groundwork for next trade expansion initiative.",
      status: "Done",
    },

    // Q2 2025 - Knowledge & Enablement
    {
      date: "2025-04-05",
      title: "Prepared Roofing documentation (company-wide use)",
      description: "Authored comprehensive Roofing documentation suite covering workflows, best practices, and module-specific guidance.",
      category: "Knowledge & Enablement",
      teams: ["CX", "Sales", "Product"],
      impactNotes: "Created the first standardized knowledge base used across Product, CX, and Sales to align vertical-specific workflows, reducing redundant queries and onboarding time for new hires.",
      status: "Done",
    },
    {
      date: "2025-05-20",
      title: "Conducted training for CX on different modules",
      description: "Delivered product enablement sessions for CX organization covering various product modules and their use cases.",
      category: "Knowledge & Enablement",
      teams: ["CX"],
      impactNotes: "Improved module understanding and reduced dependency on Product Managers for functional clarifications by 40%.",
      status: "Done",
    },
  ];

  const activities: Activity[] = seedActivities.map((activity, index) => {
    const date = new Date(activity.date);
    return {
      ...activity,
      id: `seed-${index}-${Date.now()}`,
      userId: 'seed-user',
      weekNumber: getWeekNumber(date),
      createdAt: activity.date,
      updatedAt: activity.date,
    };
  });

  saveActivities(activities);
  return true;
}
