import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors } from "../constants/theme";
import BackButton from "../components/BackButton";
import { BUSINESS } from "../config/business";

const LAST_UPDATED = "October 2026";

const BUSINESS_ROWS = [
  { label: "Business name", value: BUSINESS.legalName },
  { label: "Registration number", value: BUSINESS.registrationNumber },
  { label: "Address", value: BUSINESS.address },
  { label: "Email", value: BUSINESS.supportEmail },
  { label: "Phone", value: BUSINESS.supportPhone },
].filter((row) => row.value.trim() !== "");

interface PolicySection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

const TERMS: PolicySection[] = [
  {
    heading: "What CRAFTD is",
    paragraphs: [
      "CRAFTD connects people who need a skilled service with providers who offer one. Clients browse gigs, send a booking request and chat with the provider once the request is accepted.",
      "CRAFTD is only the meeting place. The job itself is an agreement between the client and the provider, and CRAFTD is not a party to it.",
    ],
  },
  {
    heading: "Your account",
    bullets: [
      "Give accurate details when you register and keep your password private.",
      "You are responsible for what happens under your account.",
      "One person, one account. Do not pretend to be someone else.",
    ],
  },
  {
    heading: "Providers",
    bullets: [
      "Only list services you can actually deliver, and describe them honestly.",
      "Use your own photos for gigs and portfolio images.",
      "Each provider can list up to three gigs.",
      "Respond to booking requests promptly, and decline the ones you cannot take.",
    ],
  },
  {
    heading: "Bookings and payment",
    bullets: [
      "A booking request is a request, not a confirmed job. It is confirmed only when the provider accepts it.",
      "Gigs do not list a price. The client and the provider agree the price between themselves, in chat or by phone.",
      "CRAFTD does not collect, hold or refund payment for jobs. Agree the price and how it will be paid directly with the other person.",
      "Either side can cancel a booking before the job is done. Please do it early.",
    ],
  },
  {
    heading: "Free bookings and subscription",
    bullets: [
      "Browsing gigs and sending booking requests is always free.",
      "Each account gets a number of free bookings: jobs you accept as a provider, and accepted bookings you make as a client. Settings, then Subscription, shows how many you have left.",
      "After your free bookings, new ones stay locked until you subscribe. A locked booking hides the other person's details, chat and contact options.",
      "A subscription unlocks all your bookings for as long as it is active. If it ends, bookings beyond your free ones lock again.",
      "The price and length of a subscription are shown to you before you pay.",
    ],
  },
  {
    heading: "Refunds and cancellations",
    bullets: [
      "CRAFTD takes no payment for the jobs themselves, so there is nothing for CRAFTD to refund on a job.",
      "For subscriptions, the refund terms are shown to you before you pay.",
      "Any deposit or payment is made directly to the provider. A refund is a matter between you and that provider, so agree the terms in chat before you pay.",
      "A client can cancel a pending or accepted booking in My Bookings. A provider can decline a request in Job Requests.",
      "If a job goes wrong, tell us. We can remove listings and suspend accounts, but we cannot recover money paid outside the app.",
    ],
  },
  {
    heading: "Reviews and messages",
    bullets: [
      "Reviews must reflect a real job booked through CRAFTD.",
      "No abuse, threats, harassment, spam or fraud in chat, reviews or listings.",
      "You can report anyone from their profile, and block them so they can't book or message you.",
      "We may remove content or suspend accounts that break these rules.",
    ],
  },
  {
    heading: "Safety and liability",
    paragraphs: [
      "CRAFTD does not vet, employ or guarantee any provider or client. Check reviews, agree the details in chat and take sensible precautions when meeting someone.",
      "To the extent the law allows, CRAFTD is not liable for the quality of a job, for loss or damage arising from it, or for disputes between users.",
    ],
  },
];

const PRIVACY: PolicySection[] = [
  {
    heading: "What we collect",
    bullets: [
      "Account: your name, email address and password.",
      "Profile: bio, phone number, profile photo, city and state.",
      "Location: your device location, if you allow it, or the city and state you type in.",
      "Listings: gig titles, descriptions, photos and portfolio images.",
      "Activity: booking requests, proposed dates, messages, reviews and ratings.",
      "Device: a push notification token, so we can alert you about bookings and messages.",
    ],
  },
  {
    heading: "How we use it",
    bullets: [
      "To run your account and keep you signed in.",
      "To show clients the providers and gigs near them.",
      "To deliver booking requests, messages and notifications.",
      "To show ratings and reviews on provider profiles.",
    ],
    paragraphs: ["We do not sell your personal information."],
  },
  {
    heading: "What other users can see",
    bullets: [
      "Provider profiles, gigs, portfolio photos, ratings and reviews are visible to other users.",
      "The name you choose is shown on your gigs, bookings, reviews and chat. Your email address is not shown to other users.",
      "Your city and state are shown on your profile, and your location is used to tell nearby users how far away you are.",
      "Your phone number is shared with the other person only once a booking is accepted, so you can call or message each other.",
      "Chat messages are visible to the two people in the conversation, including whether a message has been read.",
    ],
  },
  {
    heading: "Where it is kept",
    paragraphs: [
      "Your data is stored on our servers. Photos you upload are stored with a third-party media hosting service. Push notifications are delivered through Expo and your phone's notification service.",
    ],
  },
  {
    heading: "Cookies and tracking",
    bullets: [
      "CRAFTD does not use advertising or analytics cookies, and it does not track you across other apps or websites.",
      "On the website, one item is kept in your browser's local storage: the sign-in token that keeps you logged in. It is removed when you log out.",
      "On the phone app, the same token is kept in your device's secure storage.",
      "Because that token is strictly necessary to sign you in, there is no cookie banner. If we ever add analytics or advertising, we will ask for your consent first.",
    ],
  },
  {
    heading: "Other services we rely on",
    bullets: [
      "Photo hosting, for the images you upload.",
      "Paystack, to take subscription payments. You pay on Paystack's own page, so CRAFTD never sees or stores your card details.",
      "Expo and your phone's notification service, to deliver push notifications.",
      "Your device's location service, to work out your city when you allow it.",
      "Your phone's dialler and WhatsApp open only when you tap Call or WhatsApp on a booking.",
    ],
  },
  {
    heading: "Your choices",
    bullets: [
      "Edit your profile, photos and gigs at any time in the app.",
      "Turn location or notifications off in your phone settings. You can still set your city by hand.",
      "Delete reviews you wrote and photos you uploaded.",
      "Delete your account, and the data that goes with it, at any time in Settings.",
    ],
  },
  {
    heading: "Changes",
    paragraphs: [
      "We may update these terms and this policy as CRAFTD grows. The date at the top shows when they last changed.",
    ],
  },
];

function PolicyBlock({ title, sections }: { title: string; sections: PolicySection[] }) {
  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle} accessibilityRole="header">
        {title}
      </Text>
      {sections.map((section) => (
        <View key={section.heading} style={styles.section}>
          <Text style={styles.heading}>{section.heading}</Text>
          {section.bullets?.map((bullet) => (
            <View key={bullet} style={styles.bulletRow}>
              <Text style={styles.bulletDot} aria-hidden>•</Text>
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}
          {section.paragraphs?.map((paragraph) => (
            <Text key={paragraph} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

export default function TermsScreen() {
  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.title} accessibilityRole="header">Terms & Privacy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.updated}>Last updated: {LAST_UPDATED}</Text>
        <PolicyBlock title="Terms of Use" sections={TERMS} />
        <PolicyBlock title="Privacy Policy" sections={PRIVACY} />

        {BUSINESS_ROWS.length > 0 && (
          <View style={styles.block}>
            <Text style={styles.blockTitle} accessibilityRole="header">
              Who we are
            </Text>
            <View style={styles.section}>
              {BUSINESS_ROWS.map((row) => (
                <Text key={row.label} style={styles.paragraph}>
                  <Text style={styles.businessLabel}>{row.label}: </Text>
                  {row.value}
                </Text>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  backText: { color: colors.primary, fontSize: 15, fontWeight: "600" },
  title: { fontSize: 18, fontWeight: "700", color: colors.text },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  updated: { fontSize: 13, color: colors.textMuted, marginBottom: 20 },
  block: { marginBottom: 12 },
  blockTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 16,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  heading: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
    marginBottom: 8,
  },
  businessLabel: { color: colors.textMuted, fontWeight: "600" },
  bulletRow: { flexDirection: "row", marginBottom: 8 },
  bulletDot: { color: colors.primary, fontSize: 14, lineHeight: 21, width: 16 },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 21, color: colors.text },
});
