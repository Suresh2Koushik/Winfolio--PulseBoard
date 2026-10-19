import { ReactNode, useEffect } from "react";
import { Link } from "react-router-dom";
import { WinfolioLogo } from "@/components/brand/Brand";

// Plain-English privacy policy and terms. Keep these in sync with what the app actually does
// (see docs/LAUNCH_CHECKLIST.md) and update LAST_UPDATED whenever the text changes.
const LAST_UPDATED = "19 October 2026";
const OPERATOR = "[Your full name]";
const CONTACT = "kanna.suresh.2000@gmail.com";

function H2({ children }: { children: ReactNode }) {
  return <h2 className="mt-10 text-xl font-extrabold tracking-tight">{children}</h2>;
}

function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  useEffect(() => {
    document.title = `${title} · Winfolio`;
    return () => { document.title = "Winfolio · Your personal work journal"; };
  }, [title]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" aria-label="Winfolio home"><WinfolioLogo variant="pastel" /></Link>
          <nav aria-label="Legal" className="flex gap-4 text-sm font-semibold">
            <Link to="/privacy" className="hover:underline">Privacy</Link>
            <Link to="/terms" className="hover:underline">Terms</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 [&_li]:mt-1.5 [&_p]:mt-3 [&_p]:leading-relaxed [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6">
        <h1 className="text-[clamp(1.8rem,4vw,2.4rem)] font-extrabold tracking-[-0.02em]">{title}</h1>
        <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        {children}
        <p className="mt-12 border-t pt-6 text-sm text-muted-foreground">
          Questions? Email <a className="font-semibold text-accent underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>.
        </p>
      </main>
    </div>
  );
}

export function Privacy() {
  return (
    <LegalPage title="Privacy policy">
      <p>
        Winfolio is a personal work journal. You write down your wins and reflections so they are there when you need
        them, for example at review time. This policy explains, in plain words, what we collect, why, who can see it, and
        the choices you have.
      </p>
      <p>
        Winfolio is run by {OPERATOR}, an individual based in India ("we", "us"). For the purposes of India's Digital
        Personal Data Protection Act, 2023, we are the Data Fiduciary for your personal data.
      </p>

      <H2>What we collect</H2>
      <ul>
        <li><strong>Account details:</strong> your name, email address and password. Passwords are handled by Google's Firebase Authentication and stored in a protected, hashed form; we never see them.</li>
        <li><strong>Profile:</strong> the kind of work you do and your team name, if you add them.</li>
        <li><strong>Your journal:</strong> everything you write in Winfolio: wins, what changed because of them, details, kudos, weekly reflections, goals and your categories.</li>
        <li><strong>Basic technical data:</strong> like any website, our hosting and security providers process your IP address, browser type and similar request data to deliver pages, keep the service secure and block automated abuse (see "Bot protection" below).</li>
      </ul>
      <p>
        We do <strong>not</strong> use analytics or advertising trackers, we do not build advertising profiles, and we do
        not sell or rent your data to anyone.
      </p>

      <H2>Why we use it</H2>
      <ul>
        <li>To run your account and show you your own journal.</li>
        <li>To create the summaries and PDFs you ask for, such as a performance review.</li>
        <li>To keep Winfolio secure, prevent abuse and fix problems.</li>
        <li>To send account emails you trigger, such as password resets.</li>
      </ul>
      <p>We use your data only for these purposes, on the basis of the consent you give when you create an account.</p>

      <H2>Who can see your journal</H2>
      <ul>
        <li><strong>You.</strong> Your wins, reflections and goals are private to your account.</li>
        <li><strong>Winfolio administrators</strong> can see account details (name, email, team, role) to manage accounts. The app does not let them read your journal.</li>
        <li><strong>The service operator.</strong> Because we run the database, we technically have access to all stored data. We only look at it when needed to keep the service working, to fix a problem you report, or when the law requires it.</li>
        <li><strong>Our service providers</strong> (below), only to provide the service to us.</li>
      </ul>

      <H2>Service providers and where data is stored</H2>
      <ul>
        <li><strong>Google Firebase</strong> (Google LLC) hosts the website, handles sign-in and stores your journal. Your journal is stored in Google's Mumbai, India region. Some account and security processing by Google may happen outside India.</li>
        <li><strong>Google reCAPTCHA</strong> (part of Google Cloud Fraud Defense) checks that requests come from the real Winfolio website and not automated scripts. It collects device and browser signals under <a className="text-accent underline" href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google's Privacy Policy</a> and <a className="text-accent underline" href="https://policies.google.com/terms" target="_blank" rel="noreferrer">Terms</a>.</li>
        <li><strong>Google Fonts</strong> serves the typefaces the site uses, which means your browser requests them from Google.</li>
      </ul>

      <H2>Cookies and browser storage</H2>
      <p>
        We do not use advertising or tracking cookies. Your browser stores your sign-in session (so you stay signed in)
        and your light or dark theme choice. reCAPTCHA may set its own cookies to tell people from bots.
      </p>

      <H2>How long we keep it</H2>
      <p>
        We keep your data while your account is open. If you ask us to delete your account, we delete your account and
        journal within 30 days. If backups are in use, deleted data disappears from them as they expire, within a further
        30 days.
      </p>

      <H2>Your rights and choices</H2>
      <ul>
        <li><strong>Access and download:</strong> you can see everything in the app, and download your wins any time from Settings → Your data.</li>
        <li><strong>Correction:</strong> you can edit or delete any entry, and edit your profile, yourself.</li>
        <li><strong>Deletion:</strong> email <a className="text-accent underline" href={`mailto:${CONTACT}`}>{CONTACT}</a> from your account's email address to delete your account and journal.</li>
        <li><strong>Withdraw consent:</strong> you can stop using Winfolio and ask us to delete your data at any time.</li>
        <li><strong>Nominate someone</strong> to exercise these rights for you if you die or become unable to, by emailing us.</li>
        <li><strong>Complaints:</strong> contact our grievance contact below first. We reply within 30 days. If you are not satisfied, you may complain to the Data Protection Board of India.</li>
      </ul>

      <H2>Security</H2>
      <p>
        Your connection to Winfolio is encrypted (HTTPS). Database rules ensure each person can only read and change their
        own journal, and bot protection limits automated abuse. No system is perfectly secure, but if we learn of a breach
        affecting your data we will tell you and the authorities as the law requires.
      </p>

      <H2>Children</H2>
      <p>Winfolio is for adults at work. You must be 18 or older to create an account.</p>

      <H2>Changes to this policy</H2>
      <p>
        If we change this policy, we will update the date above. For important changes, we will tell you in the app or by
        email before they take effect.
      </p>

      <H2>Grievance contact</H2>
      <p>
        {OPERATOR}, <a className="text-accent underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>
      </p>
    </LegalPage>
  );
}

export function Terms() {
  return (
    <LegalPage title="Terms of use">
      <p>
        These terms are an agreement between you and {OPERATOR} ("we", "us"), who runs Winfolio. By creating an account
        or using Winfolio, you agree to them. If you do not agree, please do not use Winfolio.
      </p>

      <H2>The service</H2>
      <p>
        Winfolio lets you record your work wins and reflections and turn them into summaries, such as a performance review.
        It is currently free. We may change, add or remove features, and if we ever introduce paid plans we will tell you
        in advance; nothing you have already written will be put behind a paywall without notice.
      </p>

      <H2>Your account</H2>
      <ul>
        <li>You must be 18 or older and give accurate details when you sign up.</li>
        <li>Keep your password safe. You are responsible for what happens in your account.</li>
        <li>Tell us straight away at <a className="text-accent underline" href={`mailto:${CONTACT}`}>{CONTACT}</a> if you think someone else has accessed it.</li>
      </ul>

      <H2>Your content is yours</H2>
      <p>
        You own what you write in Winfolio. You give us permission to store, process and display it only so we can run the
        service for you (for example, to show it to you and create your PDFs). We do not claim ownership and do not use it
        for anything else.
      </p>
      <p>
        You are responsible for what you write. Please do not put in information you are not allowed to share, such as your
        employer's confidential or secret information, or other people's sensitive personal data.
      </p>

      <H2>Acceptable use</H2>
      <p>Do not:</p>
      <ul>
        <li>break the law, or use Winfolio to harass, deceive or harm anyone;</li>
        <li>try to access other people's accounts or data, or get around our security;</li>
        <li>overload, disrupt, scrape or reverse-engineer the service, or use bots to access it;</li>
        <li>upload malware or content that infringes someone else's rights.</li>
      </ul>

      <H2>Ending your use</H2>
      <p>
        You can stop using Winfolio at any time and ask us to delete your account. We may suspend or close an account that
        breaks these terms or puts the service or other people at risk. Where reasonable, we will warn you first and give
        you a chance to download your data.
      </p>

      <H2>No guarantees</H2>
      <p>
        We work hard to keep Winfolio running and your data safe, but the service is provided "as is" and "as available".
        We do not promise it will always be available, error-free, or that data can never be lost. Please download your
        wins from time to time (Settings → Your data) if they are important to you.
      </p>

      <H2>Limits on our responsibility</H2>
      <p>
        To the extent the law allows, we are not responsible for indirect or consequential losses, such as lost
        opportunities or the outcome of a performance review. Since Winfolio is free, our total responsibility to you for
        any claim is limited to INR 1,000. Nothing in these terms limits responsibility that cannot be limited by law.
      </p>

      <H2>Changes to these terms</H2>
      <p>
        We may update these terms. We will change the date above and, for important changes, tell you in the app or by email
        before they apply. If you keep using Winfolio after that, the new terms apply.
      </p>

      <H2>Law and disputes</H2>
      <p>
        These terms are governed by the laws of India. Please contact us first so we can try to sort out any problem.
        If we cannot, disputes will be handled by the courts of India.
      </p>

      <H2>Privacy</H2>
      <p>
        How we handle your personal data is explained in our <Link className="text-accent underline" to="/privacy">privacy policy</Link>.
      </p>
    </LegalPage>
  );
}
