import { ScrollView, Text, View } from 'react-native';
import BackButton from '../components/BackButton';
import { formStyles as styles } from '../constants/formStyles';

const FAQ = [
  {
    question: 'How do I book someone?',
    answer:
      'Open Browse Categories, pick a service, choose a provider and tap one of their services. Pick a date, add a message if you like, and send the request. The provider then accepts or declines it.',
  },
  {
    question: 'How much does a job cost?',
    answer:
      'Providers don’t list prices. Once your request is accepted you can chat or call to agree the price and how it will be paid. CRAFTD does not take or hold any payment.',
  },
  {
    question: 'Why can’t I message a provider yet?',
    answer:
      'Chat, call and WhatsApp open up once the provider accepts your booking request. Until then your request is still pending.',
  },
  {
    question: 'How do I offer my own services?',
    answer:
      'Turn on "I offer services" in Settings, then go to My Skills and add up to three skills. Add a clear photo and description so clients know what you do.',
  },
  {
    question: 'Is CRAFTD free?',
    answer:
      'Browsing and sending booking requests is always free, and so are your first bookings. Once those are used, a subscription unlocks the rest. You can see how many free bookings you have left under Settings, then Subscription.',
  },
  {
    question: 'How do reviews work?',
    answer:
      'After a provider marks a job complete, both sides can leave a star rating and a comment from the booking. You can delete a review you wrote at any time.',
  },
  {
    question: 'Someone is behaving badly. What can I do?',
    answer:
      'Open their profile and choose Report to tell us what happened, or Block to stop them from booking or messaging you. You can undo a block in Settings under Blocked Users.',
  },
  {
    question: 'How do I delete my account?',
    answer:
      'Go to Settings and choose Delete Account. Your profile, skills, bookings, messages and reviews are removed permanently.',
  },
];

export default function HelpScreen() {
  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.title} accessibilityRole="header">Help & FAQ</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {FAQ.map((item) => (
          <View key={item.question} style={styles.card}>
            <Text style={styles.cardTitle} accessibilityRole="header">
              {item.question}
            </Text>
            <Text style={styles.cardBody}>{item.answer}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
