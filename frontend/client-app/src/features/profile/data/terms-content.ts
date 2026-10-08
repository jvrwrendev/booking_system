export interface TermsSection {
  title: string;
  paragraphs: string[];
}

export interface TermsGroup {
  id: string;
  heading: string;
  description: string;
  sections: TermsSection[];
}

export const TERMS_UPDATED_AT = "October 9, 2026";

export const TERMS_GROUPS: TermsGroup[] = [
  {
    id: "terms",
    heading: "Terms of Service",
    description:
      "The agreement that governs your use of the Agrivet Supply booking and inventory app.",
    sections: [
      {
        title: "Acceptance of terms",
        paragraphs: [
          "By creating an account or using this application, you agree to be bound by these Terms of Service and all policies referenced within them. If you do not agree, do not use the application.",
          "These terms apply to all agents and branch accounts issued by Agrivet Supply Co.",
        ],
      },
      {
        title: "Your account",
        paragraphs: [
          "You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. Credentials are issued to you personally and must not be shared.",
          "Notify your administrator immediately of any unauthorized use of your account or any security breach.",
        ],
      },
      {
        title: "Bookings and branch orders",
        paragraphs: [
          "Agents may create bookings on behalf of their assigned customers, and branches may submit inventory orders. Submitted transactions enter a review workflow and may be accepted, assigned, processed, completed, or rejected by the administrator.",
          "Product availability, pricing, and stock levels shown in the app are indicative and may change before an order is confirmed.",
        ],
      },
      {
        title: "Acceptable use",
        paragraphs: [
          "You agree not to misuse the application, including attempting to access data you are not authorized to view, interfering with the service, reverse engineering any part of it, or submitting false or fraudulent transactions.",
        ],
      },
      {
        title: "Intellectual property",
        paragraphs: [
          "All content, branding, and software in this application are the property of Agrivet Supply Co. or its licensors. No rights are granted except the limited right to use the application as intended during your employment or engagement.",
        ],
      },
      {
        title: "Suspension and termination",
        paragraphs: [
          "We may suspend or deactivate accounts that violate these terms, compromise security, or remain inactive. On termination, your access ends immediately, though records of transactions may be retained for operational and legal purposes.",
        ],
      },
      {
        title: "Changes to these terms",
        paragraphs: [
          "We may update these terms from time to time. Continued use of the application after an update constitutes acceptance of the revised terms. The date of the latest revision is shown above.",
        ],
      },
      {
        title: "Contact",
        paragraphs: [
          "Questions about these terms may be directed to your Agrivet administrator or to support@agrivet.ph.",
        ],
      },
    ],
  },
  {
    id: "privacy",
    heading: "Privacy Policy",
    description:
      "How Agrivet Supply Co. collects, uses, and protects information in this application.",
    sections: [
      {
        title: "Information we collect",
        paragraphs: [
          "We collect account details you provide (name, email, contact number, address), the transactions you create (bookings, customers, and orders), and basic usage metadata such as your most recent sign-in.",
        ],
      },
      {
        title: "How we use your information",
        paragraphs: [
          "Information is used to operate the booking and inventory workflow, display relevant data to your assigned role, authenticate you, and generate operational reports for Agrivet Supply Co.",
        ],
      },
      {
        title: "Sharing and disclosure",
        paragraphs: [
          "Your information is visible to administrators and, where relevant, to the branch or agent responsible for fulfilling a transaction. We do not sell personal information to third parties.",
        ],
      },
      {
        title: "Data security",
        paragraphs: [
          "Access to data is limited by role. Passwords are stored using secure hashing, and sessions are maintained on your device. You are responsible for securing the device you use to access the application.",
        ],
      },
      {
        title: "Retention",
        paragraphs: [
          "Records are retained for as long as needed to provide the service and to comply with legal and accounting obligations, after which they are deleted or anonymized.",
        ],
      },
      {
        title: "Your rights",
        paragraphs: [
          "You may request access to, correction of, or deletion of your personal information by contacting your administrator or privacy@agrivet.ph.",
        ],
      },
      {
        title: "Contact",
        paragraphs: [
          "For privacy-related concerns, reach out to privacy@agrivet.ph or contact your Agrivet Supply Co. administrator.",
        ],
      },
    ],
  },
];
