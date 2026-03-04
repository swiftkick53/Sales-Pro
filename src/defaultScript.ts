
import { ScriptConfig } from './types';

export const DEFAULT_SCRIPT_ID = 'homestars-default';

export function createDefaultHomeStarsScript(): ScriptConfig {
  return {
    id: DEFAULT_SCRIPT_ID,
    name: 'HomeStars Default',
    description: 'The standard HomeStars sales call script',
    isBuiltIn: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
    quickTags: ["Pain Point", "Decision Maker", "Budget Confirmed", "Timeline", "Partner Needed", "ROI Shown", "Verified Pitch"],
    sections: [
      {
        id: 'intro',
        title: "Intro",
        subtitle: "Reason for the call",
        moveOn: "Prospect agrees to engage in the conversation.",
        blocks: [
          {
            label: "ATI Accounts",
            lines: [
              { text: "Hey [Name]? This is [Rep] with HomeStars on a recorded line. I see you registered your business on our site. What were you looking to do when you signed up?" },
              { text: "Let them talk.", isAction: true },
              { text: "The reason I'm calling is we are making some exciting changes at HomeStars based on feedback from tradespeople just like you!" },
              { text: "Would it be easier to use HomeStars if you knew how much you were going to spend every month?" },
              { text: "Would you like to spend less for more shortlists every month?" },
              { text: "Would it be easier to reach out to more homeowners if you could predict your budget every month?" }
            ]
          },
          {
            label: "Non-ATI Account",
            lines: [
              { text: "[SP Name]? This is [Rep] with HomeStars on a recorded line. Quick question — I see your account here but it's inactive. Was there a reason you never got it set up so our members could find you?" }
            ]
          }
        ],
        objections: [
          { objection: "I'm busy right now.", response: "Totally get it—this will take 60 seconds and will determine if HomeStars is even worth your time. If it isn't, we're done. Can I give you the 60-second version?" },
          { objection: "I already get work elsewhere.", response: "That's great—what I want is to add predictable volume on top of what's already working for you. Most of our pros use us as a high-margin filler. Does that make sense?" },
          { objection: "Is this a cold call?", response: "Actually, I'm following up on your registration! I wanted to see if the recent changes we made to the platform could help you scale this quarter. Have you noticed the new Verified badge yet?" },
          { objection: "I've heard bad things about HomeStars.", response: "I appreciate the honesty. Usually, that comes from pros who didn't have a strategy for their profile. My job is to show you the 'Winning Formula' so that doesn't happen to you. Fair enough?" }
        ]
      },
      {
        id: 'upfront-contract',
        title: "Upfront Contract",
        subtitle: "Agenda for the call",
        moveOn: "Prospect accepts the upfront contract and agrees to the call framework.",
        blocks: [
          {
            label: "Upfront Contract (UFC)",
            lines: [
              { text: "This is super easy. To get you what you want, I just need to confirm:" },
              { text: "- WHAT type of work you want customers to find you for" },
              { text: "- HOW much of it you can handle" },
              { text: "- WHERE you want the work to come from" },
              { text: "Then I'll show you how this works, build a program together, and if it makes sense we can jump into pricing for the next year and get you signed up right now on this call. Sound fair?" }
            ]
          }
        ],
        objections: [
          { objection: "I don't have time for all that.", response: "Totally fair. The good news is this takes about 10 minutes, and by the end you'll know exactly whether HomeStars can help you or not. Can I get those 10 minutes?" },
          { objection: "Just tell me the price.", response: "I would love to — but our pricing depends on your area, your trade, and the volume you want. That's exactly what we'll figure out together in the next few minutes. Fair enough?" }
        ]
      },
      {
        id: 'discovery',
        title: "Discovery",
        subtitle: "Why they would, why they would not",
        moveOn: "You know both WHY they would sign up and WHY they might not (pain + obstacles).",
        hasInputCapture: true,
        inputParseRules: [
          { lineTextContains: "How much was your last", targetField: "avgJobValue" },
          { lineTextContains: "How many of those could you add", targetField: "jobsPerMonth" }
        ],
        blocks: [
          {
            label: "Qualification",
            lines: [
              { text: "What made you decide to put your business on HomeStars?" },
              { text: "Who else helps you run the business?" },
              { text: "Crew size? Full-time? How soon could you take new work?" }
            ]
          },
          {
            label: "Money Funnel",
            lines: [
              { text: "What type of work do you want?" },
              { text: "When you say [x], what does that mean specifically?" },
              { text: "How much was your last [specific job]? Is that normal or average?" },
              { text: "How many of those could you add each month?" },
              { text: "Recap: So, if you added [X jobs at Y], that's [Z per month/year]. Is that what you'd like help with?" }
            ]
          },
          {
            label: "Advertising Funnel",
            lines: [
              { text: "Where are you paying for customers now?" },
              { text: "What works best? Why?" },
              { text: "How much do you invest? What do you get back?" }
            ]
          },
          {
            label: "Referral Funnel",
            lines: [
              { text: "Do you get work through referrals?" },
              { text: "What do you like about them?" },
              { text: "Why do people refer YOU?" }
            ]
          },
          {
            label: "Pain",
            lines: [
              { text: "What problem are you solving for the pro?" }
            ]
          }
        ],
        objections: [
          { objection: "I don't track my numbers.", response: "No problem, let's just use some rough averages to see if this model can even pay for itself for you. What's a typical job usually worth to you?" },
          { objection: "Why do you need to know my revenue?", response: "Because if the math doesn't work for you, I won't recommend you spend a dime. I need to make sure you'll see a 5x-10x ROI. Fair?" },
          { objection: "I don't want to talk about my competition.", response: "I'm not looking for names—I just want to see where you're currently winning so we can duplicate that success on our platform." }
        ],
        followUps: [
          "Why is that?",
          "What do you mean by that?",
          "Why do you think that is?",
          "What does _____ mean to you?",
          "When you say ______ what do you mean by that?",
          "Can you elaborate on that?",
          "How is that working for you?",
          "What happens if things don't change?",
          "Is that normal or average for your area?",
          "What would you want back to be happy?",
          "How does that impact your bottom line?",
          "If you could fix one thing in your sales process today, what would it be?",
          "How long has that been a problem?"
        ]
      },
      {
        id: 'value',
        title: "Value Pitch",
        subtitle: "Something everyone likes",
        moveOn: "Prospect agrees value aligns with their goals.",
        blocks: [
          {
            label: "National Reliability",
            lines: [
              { text: "There are two ways homeowners choose who to hire: referrals or going online. You already said referrals are the best — we've just made that happen online." },
              { text: "Homeowners across Canada are tired of the risks that come with the 'underground economy.' That is exactly where HomeStars sets you apart." },
              { text: "We don't just list you; we validate you with our Verified Badge and Confidence Program, proving to clients that you are a legitimate, registered business." },
              { text: "Unlike other platforms, we don't cap your success—you can keep securing leads even after you hit your subscription limit." }
            ]
          },
          {
            label: "Winning Formula",
            lines: [
              { text: "All you need to win here is: 1. Get reviews. 2. Respond quickly. 3. Keep profile updated." },
              { text: "What questions do you have about how this works?" }
            ]
          }
        ],
        objections: [
          { objection: "I already have a good reputation.", response: "Exactly—let's weaponize that reputation online so people who don't know you yet can trust you immediately. Your offline reputation is silent online right now, isn't it?" },
          { objection: "I tried leads before and they were low quality.", response: "HomeStars focuses on high-intent homeowners looking for 'Verified' pros, not just price shoppers. We filter the noise so you get the signal. Does that address your concern?" },
          { objection: "I don't have time to manage a profile.", response: "Our app makes it take less than 5 minutes a week. If 5 minutes a week resulted in 2 extra high-value jobs, would you make the time?" }
        ]
      },
      {
        id: 'triple-down',
        title: "Triple Down",
        subtitle: "Asking for the sale",
        moveOn: "All objections (except price) are cleared and decision authority confirmed.",
        blocks: [
          {
            label: "Pre-Close",
            lines: [
              { text: "I think this is a great fit, and it sounds like you do too. Let me make sure I covered everything:" },
              { text: "Other than price, what would stop you from signing up right now?" },
              { text: "If I give you a price that makes sense, you can sign up right now?" }
            ]
          }
        ],
        objections: [
          { objection: "I need to talk to my wife/partner.", response: "Of course. Usually they want to know three things: Will it work? Can we afford it? And how much time does it take? Which of those do you think they'll ask first? Let's prep you for that conversation." },
          { objection: "Send me an email first.", response: "I definitely will, but an email won't answer your specific business needs like we just did. If the price is right, is there any other reason to wait?" },
          { objection: "I need to think about it.", response: "Usually when people say that, it's either because I didn't explain something well or the price is scary. Which one is it for you?" }
        ]
      },
      {
        id: 'close',
        title: "Close",
        subtitle: "Negotiating not selling — remind them of discovery",
        moveOn: "Payment is secured and contract agreed.",
        blocks: [
          {
            label: "The Ask",
            lines: [
              { text: "My job is to show you what's available. You're in control of what you spend — more spend = more opportunity." },
              { text: "Right now, for your area, we have [X–Y opportunities] available, which would be [$Z per month/year]." },
              { text: "You can choose how much of that you want to start with. What amount makes sense for you right now?" }
            ]
          }
        ],
        objections: [
          { objection: "It's too expensive.", response: "Expensive compared to what? If we get you just 1 extra job from our ROI calc, it pays for itself 5x over. Does that change how you look at the cost? Let's look at the math again." },
          { objection: "I can't afford that monthly.", response: "I understand. What if we started with a smaller territory to prove the concept, then scaled up as the jobs started paying for the subscription? What's a number you're comfortable testing?" },
          { objection: "Can I get a discount?", response: "The 'Subscribe and Save' deal I'm showing you is already the deepest discount we offer for Verified pros. It's designed to reward partners who are in it for the long term. Sound fair?" }
        ]
      },
      {
        id: 'terms',
        title: "Terms and Conditions",
        subtitle: "You must read these",
        moveOn: "Customer says 'I agree' or 'Yes' to the read terms.",
        blocks: [
          {
            label: "Offer & Billing",
            lines: [
              { text: "This offer is valid until [DD/MM]. You'll receive $[X] worth of shortlist fee credits for just $[X](+tax) per month and will be billed the day after we activate your deal." }
            ]
          },
          {
            label: "How it Works",
            lines: [
              { text: "Respond to leads as usual through the app or website, and shortlist fees will be automatically deducted from your balance when you receive the customer's contact details." },
              { text: "You can exceed your promotional balance, but the discount will no longer apply. If you exceed your balance, shortlist fees will be invoiced at the advertised rate." },
              { text: "Credits are available immediately after activation. Use your credits within 30 days of receiving them - they don't carry over into the next month." }
            ]
          },
          {
            label: "Commitment & Renewal",
            lines: [
              { text: "Your Subscribe and Save Deal is committed for [X] months. At the end of the [X] months, you'll be automatically enrolled to a 12-month subscription with a monthly discount of [X]%, paying $[X](+tax) per month for $[X] worth of shortlist fee credits." },
              { text: "To cancel, email us 1 month before your subscribe and save offer ends. The email address will be included in my follow up email and in the full deal terms and conditions. If you do cancel you will remain on monthly invoicing." }
            ]
          },
          {
            label: "The Agreement",
            lines: [
              { text: "Do you agree to the terms we just read to you?" }
            ]
          }
        ],
        objections: [
          { objection: "Why don't credits carry over?", response: "Because we reserve this high-intent capacity for you every month. To keep the deep discount possible, we need to ensure the volume is utilized within that billing cycle. It keeps our network efficient for you." },
          { objection: "I don't like long commitments.", response: "Think of it as a partnership commitment. We're investing in your brand verification; we just ask for your commitment to respond to the homeowners we send your way." }
        ]
      },
      {
        id: 'follow-through',
        title: "Follow-Through",
        subtitle: "Build them back up, help them win",
        moveOn: "Customer is activated, supported, and clear on next steps.",
        blocks: [
          {
            label: "Activation Steps",
            lines: [
              { text: "Walk them through app download.", isAction: true },
              { text: "Help request first 5–10 reviews.", isAction: true },
              { text: "Confirm onboarding steps (background check → activation → support)." }
            ]
          }
        ],
        objections: []
      },
      {
        id: 'update-notes',
        title: "Update Notes",
        subtitle: "Copy all notes onto the call object in the CRM",
        moveOn: "All call intelligence has been transferred to the CRM.",
        blocks: [
          {
            label: "CRM Update",
            lines: [
              { text: "Copy all notes from the Continuous Log into the CRM call object.", isAction: true },
              { text: "Include discovery answers, pain points, and any commitments made.", isAction: true },
              { text: "Log the outcome of the call (sold, follow-up, not interested).", isAction: true }
            ]
          }
        ],
        objections: []
      }
    ]
  };
}
