export const STATIC_ROUNDS_CONFIG = [
    {
        id: "round1",
        title: "Round-1",
        subtitle: "Idea, Feasibility & Basic Progress",
        color: "text-orange-500",
        bg: "bg-orange-500",
        dayOffset: 0,
        hour: 14,
        minute: 30,
        criteria: [
            { id: "r1q1", label: "Problem Understanding", desc: "Does the team clearly understand the problem they are trying to solve?" },
            { id: "r1q2", label: "Problem Relevance", desc: "Is the problem actually worth solving, or is it trivial?" },
            { id: "r1q3", label: "Solution Clarity", desc: "Is their proposed solution logical and easy to understand?" },
            { id: "r1q4", label: "Target Audience", desc: "Do they have a clear idea of who would actually use their solution?" },
            { id: "r1q5", label: "Feasibility for Beginners", desc: "Is this realistic for a beginner team to build during the hackathon?" },
            { id: "r1q6", label: "Clarity of Scope", desc: "Are they focused on a core feature, or trying to do too many things at once?" },
            { id: "r1q7", label: "Execution Progress", desc: "Have they actually started building something, or is it still just an idea?" },
            { id: "r1q8", label: "Resource Utilization", desc: "Are they using appropriate basic tools and resources for their skill level?" },
            { id: "r1q9", label: "Seriousness & Attitude", desc: "Is the team serious about the hackathon and putting in genuine effort?" },
            { id: "r1q10", label: "Coachability", desc: "Do they listen to feedback and accept advice from mentors/judges?" },
        ]
    },
    {
        id: "round2",
        title: "Round-2",
        subtitle: "Technical Execution & Prototype",
        color: "text-pink-400",
        bg: "bg-pink-500",
        dayOffset: 0,
        hour: 21,
        minute: 30,
        criteria: [
            { id: "r2q1", label: "Core Functionality", desc: "Does the main feature of the prototype actually work without crashing?" },
            { id: "r2q2", label: "Effort & Coding", desc: "Did the team write original code and put in effort, or rely entirely on templates?" },
            { id: "r2q3", label: "Tech Stack Knowledge", desc: "Can the team explain what tools/languages they used and why?" },
            { id: "r2q4", label: "User Interface (UI)", desc: "Is the app/website visually presentable and decent to look at?" },
            { id: "r2q5", label: "User Experience (UX)", desc: "Is the prototype easy to navigate and understand for a normal user?" },
            { id: "r2q6", label: "Creativity & Twist", desc: "Did they add any unique or fun elements to their project?" },
            { id: "r2q7", label: "Overcoming Challenges", desc: "Could they explain the bugs they faced and how they tried to fix them?" },
            { id: "r2q8", label: "Practical Usefulness", desc: "Does this project actually solve the problem in a practical way?" },
            { id: "r2q9", label: "Teamwork & Collaboration", desc: "Did everyone contribute, or was it a one-person show?" },
            { id: "r2q10", label: "Pitch & Presentation", desc: "How confidently and clearly did they demonstrate their project?" },
        ]
    },
];

export const TRACKS = [
    "SaaSsum AI (IT & AI)",
    "Maceco (Analytics)",
    "Tobofu (Marketing)",
    "Promtal (HR Tech)",
    "Skill Tank (EdTech)",
    "Vriddhi (FinTech)",
    "Open Innovation"
];

export const MAX_TEAM_MEMBERS = 4;
export const MAX_PROPOSED_IDEA_CHARACTERS = 500;
export const MAX_OPEN_INNOVATION_PROBLEM_CHARACTERS = 60;

export const EXTENDED_PROBLEM_STATEMENTS: Record<string, {statement: string, mvp: string}[]> = {
    "SaaSsum AI (IT & AI)": [
        { statement: "Build an AI agent where users describe the website they want and the system generates a complete website layout, content and preview.", mvp: "Chat interface, AI-generated website, editable sections, regenerate content, preview and export/share link." },
        { statement: "Build a no-code website builder similar to WordPress, Wix, Webflow or Sitejet using reusable blocks.", mvp: "Drag/drop sections, templates, hero/services/contact blocks, live preview, theme customization and save project." },
        { statement: "Generate high-converting landing pages for startups, campaigns and product launches from a simple idea input.", mvp: "Idea form, hero section, features, CTA, pricing, testimonials, waitlist/contact form and preview." },
        { statement: "Generate complete presentation decks from a topic, prompt, document or business idea.", mvp: "Topic input, outline generation, 6-10 slides, theme selection, speaker notes and export." },
        { statement: "Build a Zapier-like tool where users create automations between forms, sheets, emails and notifications.", mvp: "Workflow builder, triggers, actions, execution logs, sample workflow and enable/disable controls." },
        { statement: "Allow businesses to upload FAQs or documents and deploy an AI chatbot that answers customer queries.", mvp: "FAQ upload, chatbot UI, lead capture, escalation option, chat history and analytics." },
        { statement: "Convert meeting notes or transcripts into summaries, action items, owners, deadlines and follow-up emails.", mvp: "Upload/paste notes, summary, task extraction, deadline detection, follow-up email draft and export." },
        { statement: "Create a lightweight AI agent that summarizes Gmail/email messages into actionable insights.", mvp: "Email input, summary, priority score, action items, reply suggestion and follow-up reminders." },
        { statement: "Build a secure chatbot platform where multiple companies can use isolated AI chat environments.", mvp: "Tenant login, tenant-wise document upload, isolated chat environment, admin panel and usage logs." },
        { statement: "Let companies upload internal documents and allow employees to ask questions across the knowledge base.", mvp: "Document upload, search/chat interface, source-backed answers, folders/categories and admin controls." },
        { statement: "Extract title, date, parties, type, keywords, summary and routing suggestions from uploaded documents.", mvp: "Document upload, metadata extraction, summary, tags, classification and workflow routing suggestion." },
        { statement: "Analyze legal or business documents to extract risks, deadlines, obligations and key clauses.", mvp: "PDF upload, summary, key clauses, risk highlights, obligation checklist and export report." },
        { statement: "Build a voice assistant that controls PC actions like opening apps, scrolling, searching, volume and navigation.", mvp: "Voice command input, command mapping, open/close app, scroll, volume control and confirmation prompts." },
        { statement: "Control a computer using hand gestures and voice commands for cursor, click, zoom, scroll and system controls.", mvp: "Webcam hand tracking, cursor movement, air tap click, pinch zoom, scroll, brightness/volume and voice commands." },
        { statement: "Build an Android accessibility-style app where users control basic phone actions through voice and gestures.", mvp: "Voice commands, camera gesture detection, scroll/swipe/back/open app controls and permission flow." },
        { statement: "Build a form builder that uses AI to generate questions and analyze responses automatically.", mvp: "Create forms, AI question suggestions, response collection, charts, summaries and export." },
        { statement: "Generate standard operating procedures for business processes, teams and departments.", mvp: "Process input, SOP generation, checklist, roles/responsibilities, approval workflow mockup and PDF export." },
        { statement: "Help startups generate basic website policies such as privacy policy, terms, refund policy and disclaimers.", mvp: "Business input, policy generation, editable output, download/copy and compliance checklist disclaimer." },
        { statement: "Build an AI agent that can take operations instructions and generate tasks, reminders and workflows.", mvp: "Instruction input, task generation, workflow suggestion, reminders, dashboard and execution status." },
        { statement: "Upload messy Excel or CSV files and clean, normalize, deduplicate and restructure them automatically.", mvp: "Upload file, duplicate removal, missing value detection, column normalization, restructure data and download." },
    ],
    "Maceco (Analytics)": [
        { statement: "Upload CSV/Excel files and instantly generate charts, filters, summaries and dashboards.", mvp: "CSV upload, auto column detection, charts, filters, AI insight cards and share/export dashboard." },
        { statement: "Help companies track revenue, expenses, cash flow, profits and business performance.", mvp: "Financial upload, revenue/expense charts, profit trends, category analysis, AI recommendations and PDF report." },
        { statement: "Let users ask questions about business data in natural language and get charts or summaries.", mvp: "Dataset upload, natural language query, chart/table answer, AI explanation and export." },
        { statement: "Convert user questions into database or spreadsheet queries and display results.", mvp: "Upload data, ask questions, query translation, visual response and explanation." },
        { statement: "Convert articles, PDFs and reports into structured research briefs.", mvp: "Upload/paste sources, summary, key points, pros/cons, citation/source list and export." },
        { statement: "Fetch and organize news from multiple public sources with filters and AI summaries.", mvp: "Source database, categories, keyword search, source/date filters, AI summary and bookmarks." },
        { statement: "Curate finance, technology, survey, ranking, startup and business insights into short cards.", mvp: "Category feed, short insights, source links, bookmarks, trending section and share." },
        { statement: "Turn news and research insights into social media posts, tweet threads and reel scripts.", mvp: "News input, summary, LinkedIn post, tweet thread, carousel/reel script and hashtags." },
        { statement: "Track company strategies, market moves, news, business models and investment-style insights.", mvp: "Company search, insight cards, news feed, watchlist, strategy notes and category filters." },
        { statement: "Monitor competitor websites, pricing, social posts, offers and product updates.", mvp: "Competitor list, comparison table, update log, AI summary and alert mockup." },
        { statement: "Analyze reviews, survey responses and feedback to identify sentiment and improvement areas.", mvp: "Upload reviews, sentiment analysis, keyword extraction, themes, recommendations and report." },
        { statement: "Help event sponsors view reach, impressions, clicks, social posts, leads and impact.", mvp: "Sponsor profile, reach metrics, post count, click tracking, lead count and PDF impact report." },
        { statement: "Track real estate demand, supply, average pricing and trends across localities.", mvp: "Area search, listings, average price, demand indicator, map view and trend chart." },
        { statement: "Map-based land discovery platform with area-wise pricing and buyer/seller intelligence.", mvp: "Map listings, seller price, buyer interest, price comparison and enquiry flow." },
        { statement: "Predict revenue, expenses, room revenue or category-wise financial performance from past data.", mvp: "Historical data upload, forecast chart, category prediction, explanation and export report." },
        { statement: "Analyze financial reports, comments, write-ups or customer text for sentiment and risk patterns.", mvp: "Text upload, sentiment score, risk keywords, trend chart and AI summary." },
        { statement: "Analyze CRM or sales data through a chat interface and generate summaries and visualizations.", mvp: "CRM CSV upload, chat query, sales summaries, charts and export." },
        { statement: "Unify manufacturing data to show operational metrics, sales performance and trends.", mvp: "Multiple CSV upload, KPI dashboard, defect/sales trends, AI recommendations and report." },
        { statement: "Help businesses identify market gaps and opportunities based on customer, competitor and location inputs.", mvp: "Business/category input, competitor notes, opportunity score, persona and recommendation report." },
        { statement: "Help founders validate ideas through waitlist pages, user interest scoring and feedback.", mvp: "Landing page, waitlist form, user feedback, signup dashboard and validation score." },
    ],
    "Tobofu (Marketing)": [
        { statement: "Generate 30-day content calendars for brands, creators, students and founders.", mvp: "Brand input, content pillars, calendar, captions, hashtags and export." },
        { statement: "Generate ad copies for Instagram, Google, LinkedIn and WhatsApp campaigns.", mvp: "Campaign input, platform selection, copy variants, CTA suggestions and A/B variations." },
        { statement: "Generate short-form video scripts, hooks, captions and shot breakdowns.", mvp: "Topic input, hook, script, caption, hashtags and shot list." },
        { statement: "Help students, founders and professionals build online personal brands.", mvp: "Bio generator, content pillars, weekly post ideas, profile checklist and brand score." },
        { statement: "Generate color palettes, typography, taglines, tone of voice and brand guidelines.", mvp: "Brand input, colors, fonts, tagline, tone guide and PDF brand kit." },
        { statement: "Generate landing pages for startups, campaigns and lead generation.", mvp: "Idea input, landing page sections, CTA, waitlist form and preview." },
        { statement: "Generate website copy for home, about, services, FAQs and SEO metadata.", mvp: "Business input, page copy, service descriptions, FAQs and SEO title/meta." },
        { statement: "Convert news and research into social posts, threads, carousels and reels scripts.", mvp: "News input, summary, LinkedIn post, tweet thread, reel script and hashtags." },
        { statement: "Build a platform for memers to create, post, compete and work with brands.", mvp: "Meme upload, categories, voting, leaderboard and brand campaign section." },
        { statement: "Allow brands to launch meme challenges and collect user-generated content.", mvp: "Brand campaign, submission portal, voting, winners and analytics." },
        { statement: "Help brands find micro-creators based on location, niche, audience and engagement.", mvp: "Creator profiles, filters, engagement score, shortlist and enquiry." },
        { statement: "Create a public link hub for projects, social links, resume, portfolio and achievements.", mvp: "Profile page, links, portfolio blocks, theme selection and public URL." },
        { statement: "Turn product screenshots or text into interactive demos or walkthroughs.", mvp: "Upload screenshots, step annotations, demo flow, shareable link and CTA." },
        { statement: "Show sponsors the brand visibility and engagement generated by campaigns or events.", mvp: "Sponsor profile, impressions, clicks, social reach, post count and report." },
        { statement: "Generate event captions, reminders, emails, WhatsApp messages, FAQs and announcements.", mvp: "Event input, message generator, FAQ generator, email generator and reminder calendar." },
        { statement: "Manage communities across WhatsApp, Discord, LinkedIn and event groups.", mvp: "Member list, engagement score, announcements, referrals and inactive member alerts." },
        { statement: "Help brands run user-generated content campaigns and track submissions.", mvp: "Campaign setup, submission portal, approval flow, leaderboard and analytics." },
        { statement: "Generate startup pitch decks from idea, market, business model and traction inputs.", mvp: "Startup input, 8-10 slides, market slide, business model slide and export." },
        { statement: "Generate proposals, scope documents, pricing tables and timelines for agencies.", mvp: "Requirement form, proposal output, timeline, pricing and PDF export." },
        { statement: "Digitize public screen advertising with inventory, slot booking and campaign tracking.", mvp: "Screen locations, pricing, booking slot, ad upload and campaign report." },
    ],
    "Promtal (HR Tech)": [
        { statement: "Screen resumes against job descriptions and rank candidates with explainable scores.", mvp: "JD upload, resumes upload, match score, ranking, skill gap and shortlist export." },
        { statement: "Generate personalized interview preparation using candidate resume and job description.", mvp: "Resume upload, JD upload, HR questions, technical questions and model answers." },
        { statement: "Generate likely interview questions and personalized answers based on resume and JD.", mvp: "Resume/JD parsing, question bank, answer suggestions, practice mode and feedback." },
        { statement: "Conduct mock interviews and score candidate answers.", mvp: "Role selection, AI interviewer, candidate answers, scoring and improvement report." },
        { statement: "Connect job seekers with vacancies across software, hotels, shops, salons, tutors and local businesses.", mvp: "Employer job post, seeker profile, location/category filters, apply/contact flow." },
        { statement: "Match students with internships based on skills, interests and hackathon performance.", mvp: "Student profile, listings, AI match score, apply button and admin shortlist." },
        { statement: "Generate clear job descriptions, responsibilities, skills and interview criteria.", mvp: "Role input, JD output, skills, responsibilities, interview questions and export." },
        { statement: "Manage candidates, jobs, interviews, hiring stages and recruiter notes.", mvp: "Candidate database, job database, pipeline, interview status and reminders." },
        { statement: "Help recruiters shortlist candidates using filters, AI scores and skill matching.", mvp: "Candidate upload, filters, scoring, shortlist and export." },
        { statement: "Automate candidate updates about applications, interviews and next steps.", mvp: "Candidate status tracker, chatbot, reminders, FAQs and recruiter dashboard." },
        { statement: "Recommend the best technician for a job based on skill, availability, location and price.", mvp: "Technician DB, job requirement, ranking, availability and price suggestion." },
        { statement: "Verify whether workers are qualified to perform assigned tasks and flag compliance gaps.", mvp: "Worker profile, certificate upload, job requirement, qualification match and alerts." },
        { statement: "Build a consent-based facial recognition attendance system for employees or students.", mvp: "Face registration, check-in recognition, attendance log, dashboard and privacy controls." },
        { statement: "QR-based system to check in event participants and track attendance.", mvp: "Participant upload, QR generation, scan check-in, attendance dashboard and export." },
        { statement: "Match workforce certifications with job requirements.", mvp: "Worker profile, certificate upload, job mapping, eligibility score and compliance warning." },
        { statement: "Manage campus drives, student applications, tests, interviews and final selections.", mvp: "Student registration, company dashboard, interview stages, shortlist and reports." },
        { statement: "Let HR teams ask questions about hiring, salary, skills and workforce datasets.", mvp: "HR CSV upload, chatbot, salary/skill insights, charts and export." },
        { statement: "Answer employee questions about payroll, leave, HR policies and onboarding.", mvp: "Policy upload, chatbot, employee query flow, escalation and logs." },
        { statement: "Automate offer letters, document collection and onboarding checklists.", mvp: "Candidate form, offer letter generator, checklist, document upload and status dashboard." },
        { statement: "Analyze job market trends by role, skills, location and salary.", mvp: "Job dataset upload, skill trends, role demand, salary chart and recommendations." },
    ],
    "Skill Tank (EdTech)": [
        { statement: "Help students create ATS-friendly resumes using AI and multiple templates.", mvp: "Resume form, 10 templates, live preview, AI tips, ATS suggestions and PDF export." },
        { statement: "Generate personalized interview preparation based on a student resume and target JD.", mvp: "Resume upload, JD upload, question generation, answer suggestions and practice mode." },
        { statement: "Conduct AI-powered mock interviews and provide detailed feedback.", mvp: "Role selection, AI questions, candidate answers, score and improvement report." },
        { statement: "Connect students with seniors or mentors for low-cost mock interviews.", mvp: "Student registration, interviewer profiles, booking, feedback and payment mockup." },
        { statement: "Guide students and parents on the right career path based on interest, goals and background.", mvp: "Student profile, interest test, career suggestions, counselor booking and roadmap." },
        { statement: "Help BTech students plan skills, projects, internships and placement preparation year-wise.", mvp: "Year selection, roadmap, skill checklist, project suggestions and progress tracker." },
        { statement: "Assess students across coding, aptitude, communication and domain knowledge.", mvp: "Test modules, scoring, skill report, readiness score and improvement suggestions." },
        { statement: "Identify talented or gifted students using scores, rules and profile evaluation.", mvp: "Student profile, assessment input, talent category, scorecard and roadmap." },
        { statement: "Recommend learning paths and mini-projects based on evolving technology trends.", mvp: "Tech stack selection, skill test, roadmap, mini-projects and AI feedback." },
        { statement: "Help tutors customize lesson plans based on student level, pace and learning goals.", mvp: "Lesson upload, level selection, improved plan, activities, quiz and teaching notes." },
        { statement: "Allow trainers to create micro-courses, quizzes, assignments and certificates.", mvp: "Course creator, lesson entry, quiz generation, student progress and certificate." },
        { statement: "Generate exam questions, assignments and answer keys for college faculty.", mvp: "Subject input, difficulty levels, question generation, answer key and PDF export." },
        { statement: "Convert notes, PDFs or text into flashcards for revision.", mvp: "Upload notes, flashcard generation, quiz mode, save deck and progress." },
        { statement: "Create professional student portfolios with projects, resume, skills and certificates.", mvp: "Profile page, project showcase, skills, certificates, resume and public link." },
        { statement: "Recommend projects based on a student's skills and target job role.", mvp: "Skill input, role input, project ideas, tech stack, difficulty and roadmap." },
        { statement: "Teach personal finance, budgeting and money habits to students.", mvp: "Income/expense input, budget plan, savings tips, stress guidance and learning cards." },
        { statement: "Create a Telugu stock market course platform with quizzes and demat referral tracking.", mvp: "Course page, Telugu lessons, registration, quiz, certificate and referral tracker." },
        { statement: "Connect learners with English speakers for affordable speaking practice.", mvp: "Learner registration, tutor profiles, booking flow, session categories and subscription mockup." },
        { statement: "Provide daily useful knowledge cards across careers, finance, startups, tech and current affairs.", mvp: "Daily feed, categories, bookmarks, quiz, streaks and share." },
        { statement: "Help students track goals, habits, assignments, learning and projects.", mvp: "Goal tracker, task board, study timer, progress dashboard and AI suggestions." },
    ],
    "Vriddhi (FinTech)": [
        { statement: "Create low-cost websites or simple apps for small businesses.", mvp: "Business form, generated site/app, service list, gallery, contact and WhatsApp CTA." },
        { statement: "Help MSMEs track sales, expenses, customers, leads and growth recommendations.", mvp: "Sales entry, expense entry, customer list, dashboard and AI growth tips." },
        { statement: "Help businesses respond to WhatsApp queries, share catalogues and follow up with leads.", mvp: "Catalogue, inquiry tracker, suggested replies, follow-up reminders and lead status." },
        { statement: "Help freelancers and small businesses create invoices and track unpaid payments.", mvp: "Invoice creator, client list, payment status, reminders and PDF download." },
        { statement: "A simple CRM for shops, service providers and local businesses.", mvp: "Customer list, lead pipeline, follow-up reminders, notes and dashboard." },
        { statement: "Marketplace for DJ boxes, orchestra teams and sound systems for events.", mvp: "Vendor profiles, location filter, pricing, booking request and reviews." },
        { statement: "Book photographers and videographers for weddings, events and shoots.", mvp: "Photographer profiles, portfolio, packages, pricing calculator and enquiry." },
        { statement: "Marketplace for wedding photographers, decorators, DJs, venues and planners.", mvp: "Vendor categories, profiles, packages, location filters and enquiry flow." },
        { statement: "Matrimony platform with traditional filters and AI compatibility scoring.", mvp: "Profile creation, family details, preferences, compatibility score and shortlist." },
        { statement: "A safe social discovery app with matching, chat and moderation.", mvp: "Profiles, interests, swipe/match, chat, reporting and privacy controls." },
        { statement: "Map-based land marketplace with area-wise price intelligence.", mvp: "Map listing, seller price, area filter, buyer interest and enquiry." },
        { statement: "Broker-light platform for land owners and buyers.", mvp: "Land listing, filters, owner contact, price comparison and map view." },
        { statement: "Connect home owners with construction builders and mestris.", mvp: "Project requirement, builder profiles, bids, negotiation and commission flow." },
        { statement: "BlaBlaCar-like app for city-to-village and intercity travel.", mvp: "Driver route, seats, passenger request, pickup point and cost sharing." },
        { statement: "Affordable travel planning platform for BTech and college students.", mvp: "Destination packages, group discounts, itinerary, vendor tie-ups and enquiry." },
        { statement: "OYO-like hostel discovery platform near colleges.", mvp: "College search, hostel listings, food/facilities, pricing, reviews and enquiry." },
        { statement: "Quick-commerce model for chopped vegetables, meal kits and recipe cards.", mvp: "Vegetable packs, recipe kits, weekly menu, order flow and delivery slot." },
        { statement: "Connect cooks with bachelors, shared flats and working professionals.", mvp: "Cook profiles, cuisine type, area filter, pricing and booking." },
        { statement: "CRM for insurance agents to manage leads, policies, premiums and renewals.", mvp: "Lead list, policy tracker, premium reminder, follow-up dashboard and reports." },
        { statement: "Help individuals organize tax documents and understand filing readiness.", mvp: "Questionnaire, document checklist, income category, tax summary and expert connect." },
        { statement: "Check invoices and GST data for missing fields and mismatches.", mvp: "Invoice upload, GSTIN validation mockup, mismatch detection, risk checklist and report." },
        { statement: "Help new employees plan savings, SIPs and investment allocation.", mvp: "Income input, risk profile, goal planning, allocation suggestions and report." },
        { statement: "Teach stock market basics and track course purchases and demat referrals.", mvp: "Course registration, lessons, quiz, payment mockup, referral tracking and dashboard." },
        { statement: "Manage and sell ad slots on public digital screens.", mvp: "Screen inventory, location pricing, slot booking, ad upload and campaign report." },
        { statement: "SaaS for photography teams to manage bookings, albums, selections and delivery.", mvp: "Event booking, photo upload link, customer selection, package pricing and delivery tracker." },
    ],
};

export const PROBLEM_STATEMENTS: Record<string, string[]> = {
    "Open Innovation": [
        "Propose and solve any problem statement of your choice.",
        "Build a tool that improves local community engagement.",
        "Create a sustainability-focused tech solution."
    ],
    "Open Innovation (Any Domain)": [
        "Propose and solve any problem statement of your choice.",
        "Build a tool that improves local community engagement.",
        "Create a sustainability-focused tech solution."
    ]
};

// Map the extended statements into the simple string array format for backward compatibility
for (const [track, items] of Object.entries(EXTENDED_PROBLEM_STATEMENTS)) {
    PROBLEM_STATEMENTS[track] = items.map(i => i.statement);
    // Add aliases for track names
    if (track === "SaaSsum AI (IT & AI)") {
        PROBLEM_STATEMENTS["SaaSum AI (IT & AI)"] = PROBLEM_STATEMENTS[track];
        PROBLEM_STATEMENTS["SaaSsum AI"] = PROBLEM_STATEMENTS[track];
        PROBLEM_STATEMENTS["SaaSum AI"] = PROBLEM_STATEMENTS[track];
    } else if (track.includes('(')) {
        const shortName = track.split(' (')[0];
        PROBLEM_STATEMENTS[shortName] = PROBLEM_STATEMENTS[track];
    }
}


export function getProblemStatementsForTrack(track?: string | null): string[] {
    if (!track) return [];

    // 1. Direct match
    if (PROBLEM_STATEMENTS[track] && PROBLEM_STATEMENTS[track].length > 0) {
        return PROBLEM_STATEMENTS[track];
    }

    // 2. Normalized alphanumeric match
    const normalize = (val: string) => val.toLowerCase().replace(/\s*\(.*?\)/g, '').replace(/[^a-z0-9]/g, '');
    const cleanTrack = normalize(track);

    for (const [key, statements] of Object.entries(PROBLEM_STATEMENTS)) {
        if (normalize(key) === cleanTrack && statements.length > 0) {
            return statements;
        }
    }

    // 3. Substring inclusion match
    for (const [key, statements] of Object.entries(PROBLEM_STATEMENTS)) {
        const cleanKey = normalize(key);
        if (cleanTrack && (cleanKey.includes(cleanTrack) || cleanTrack.includes(cleanKey)) && statements.length > 0) {
            return statements;
        }
    }

    // 4. Fallback to Open Innovation
    return PROBLEM_STATEMENTS["Open Innovation"] || [];
}

export function isOpenInnovationTrack(track?: string | null): boolean {
    return Boolean(track && track.toLowerCase().replace(/\s*\(.*?\)/g, '').replace(/[^a-z0-9]/g, '') === 'openinnovation');
}
