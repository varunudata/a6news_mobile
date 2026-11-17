import { useRouter } from 'expo-router';
import { Facebook, Instagram, Mail, MapPin, Twitter, Youtube } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { FALLBACK_CATEGORIES } from '@/constants/fallbackCategories';
import { BORDER_RADIUS, COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/theme';
import api from '@/services/api';

const SOCIAL_LINKS = [
  {
    name: 'YouTube',
    url: 'https://www.youtube.com/@a6newsinfra',
    Icon: Youtube,
  },
  {
    name: 'Twitter',
    url: 'https://x.com/A6NewsTelugu?t=CLS91x4_28ro0cjprwyD9Q&s=08',
    Icon: Twitter,
  },
  {
    name: 'Facebook',
    url: 'https://www.facebook.com/share/16cLcBDyEh/',
    Icon: Facebook,
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/a6newsinfra?igsh=MW5zcGRjYWMxcDAwMg==',
    Icon: Instagram,
  },
];

const IMPORTANT_LINKS = [
  { label: 'హోమ్', href: '/' },
  { label: 'ప్రధాన వార్తలు', href: '/category/11' },
  { label: 'వీడియో కథనాలు', href: '/category/25' },
  { label: 'ఎడిటోరియల్ లాగిన్', href: '/login' },
];

export function Footer() {
  const router = useRouter();
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);

  useEffect(() => {
    let active = true;

    const fetchCategories = async () => {
      try {
        const response = await api.get('/api/categories');
        const list = response?.data?.data;
        if (active && Array.isArray(list) && list.length > 0) {
          setCategories(list.slice(0, 6));
        }
      } catch {
        // Keep FALLBACK_CATEGORIES on network error
      }
    };

    fetchCategories();

    return () => {
      active = false;
    };
  }, []);

  const openExternal = (url) => {
    Linking.openURL(url).catch(() => { });
  };

  return (
    <View style={styles.footer}>
      <View style={styles.sections}>
        {/* Column 1: Brand & Socials */}
        <View style={styles.section}>
          <View style={styles.brandRow}>
            <Text style={styles.brandTitle}>A6NEWS</Text>
            <View style={styles.infraBadge}>
              <Text style={styles.infraBadgeText}>INFRA</Text>
            </View>
          </View>

          <Text style={styles.brandDescription}>
            జాతీయ రహదారులు, ఎక్స్‌ప్రెస్‌వేలు, విమానాశ్రయాలు, రైల్వేలు, పోర్టులు మరియు రాజధాని
            మౌలిక సదుపాయాల ప్రాజెక్టులపై ఖచ్చితమైన, విశ్వసనీయ సమాచారాన్ని అందించే మీ తెలుగు
            న్యూస్ పోర్టల్.
          </Text>

          <View style={styles.socialRow}>
            {SOCIAL_LINKS.map(({ name, url, Icon }) => (
              <Pressable
                key={name}
                onPress={() => openExternal(url)}
                accessibilityRole="link"
                accessibilityLabel={name}
                style={({ pressed }) => [styles.socialButton, pressed && styles.pressedButton]}>
                <Icon size={16} color={COLORS.white} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Column 2: Important Links */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeading}>ముఖ్యమైన లింకులు</Text>
          </View>
          <View style={styles.linksList}>
            {IMPORTANT_LINKS.map((item) => (
              <Pressable
                key={item.href}
                onPress={() => router.push(item.href)}
                accessibilityRole="link"
                style={({ pressed }) => [styles.linkRow, pressed && styles.pressedLink]}>
                <Text style={styles.linkText}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Column 3: Key Beats / Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeading}>ప్రధాన విభాగాలు</Text>
          </View>
          <View style={styles.linksList}>
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => router.push(`/category/${cat.id}`)}
                accessibilityRole="link"
                style={({ pressed }) => [styles.linkRow, pressed && styles.pressedLink]}>
                <Text style={styles.linkText}>{cat.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Column 4: Contact */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeading}>సంప్రదించండి</Text>
          </View>

          <Text style={styles.contactPrompt}>
            ప్రాజెక్ట్ అప్‌డేట్స్, ప్రెస్ రిలీజ్‌లు లేదా గ్రౌండ్ రిపోర్ట్స్ మా ఎడిటోరియల్ డెస్క్‌తో
            పంచుకోవాలనుకుంటున్నారా?
          </Text>

          <Pressable
            onPress={() => openExternal('mailto:a6newsinfra@gmail.com')}
            accessibilityRole="link"
            style={({ pressed }) => [styles.contactItem, pressed && styles.pressedLink]}>
            <Mail size={16} color={COLORS.white} />
            <Text style={styles.contactText}>a6newsinfra@gmail.com</Text>
          </Pressable>

          <View style={styles.addressRow}>
            <MapPin size={16} color={COLORS.white} style={styles.addressIcon} />
            <View style={styles.addressLines}>
              <Text style={styles.contactText}>విజయవాడ, అమరావతి రాజధాని ప్రాంతం,</Text>
              <Text style={styles.contactText}>ఆంధ్రప్రదేశ్, ఇండియా</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Copyright Bar */}
      <View style={styles.bottomBar}>
        <Text style={styles.copyrightText}>
          © {new Date().getFullYear()} A6NEWS INFRA. All Rights Reserved.
        </Text>
        <Text style={styles.taglineText}>
          జాతీయ రహదారులు, రైల్వేలు, విమానయానం &amp; రాజధాని అభివృద్ధి వార్తల ప్రత్యేకం
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: COLORS.brandRed,
    borderTopWidth: LAYOUT.footerTopBorderWidth,
    borderTopColor: COLORS.brandRedDeep,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxxl,
    paddingBottom: SPACING.xxl,
  },
  sections: {
    gap: SPACING.xxxl,
  },
  section: {
    gap: SPACING.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  brandTitle: {
    ...TYPOGRAPHY.scale.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  infraBadge: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: BORDER_RADIUS.sm,
  },
  infraBadgeText: {
    ...TYPOGRAPHY.scale.xxs,
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: COLORS.brandRed,
    letterSpacing: 1.5,
  },
  brandDescription: {
    ...TYPOGRAPHY.scale.smRelaxed,
    color: COLORS.whiteAlpha85,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  socialButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.whiteAlpha30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressedButton: {
    backgroundColor: COLORS.brandRedDark,
  },
  sectionHeader: {
    paddingBottom: SPACING.sm,
    borderBottomWidth: LAYOUT.borderWidth,
    borderBottomColor: COLORS.red400Alpha40,
  },
  sectionHeading: {
    ...TYPOGRAPHY.scale.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  linksList: {
    gap: SPACING.sm,
  },
  linkRow: {
    paddingVertical: SPACING.xxs,
  },
  pressedLink: {
    opacity: 0.75,
  },
  linkText: {
    ...TYPOGRAPHY.scale.sm,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  contactPrompt: {
    ...TYPOGRAPHY.scale.smRelaxed,
    color: COLORS.whiteAlpha85,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xxs,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  addressIcon: {
    marginTop: 2,
  },
  addressLines: {
    flex: 1,
    gap: 2,
  },
  contactText: {
    ...TYPOGRAPHY.scale.sm,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  bottomBar: {
    marginTop: SPACING.xxxl,
    paddingTop: SPACING.xl,
    borderTopWidth: LAYOUT.borderWidth,
    borderTopColor: COLORS.red400Alpha40,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  copyrightText: {
    ...TYPOGRAPHY.scale.xs,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    textAlign: 'center',
  },
  taglineText: {
    ...TYPOGRAPHY.scale.xs,
    color: COLORS.whiteAlpha85,
    textAlign: 'center',
  },
});

export default Footer;

