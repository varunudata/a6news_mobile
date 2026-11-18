import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, EyeOff, Lock, ShieldCheck, User } from 'lucide-react-native';

import { A6_LOGO_URL } from '@/components/layout/Navbar';
import { Loader } from '@/components/shared/Loader';
import { BORDER_RADIUS, COLORS, LAYOUT, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { isTokenExpired } from '@/utils/auth';

/**
 * Restricted Admin Login screen accessed only via admin deep link / guard redirect.
 */
export default function AdminLoginScreen() {
  const router = useRouter();
  const { token, role, loadingAuth, login, logout } = useAuth();
  const passwordInputRef = useRef(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [logoFailed, setLogoFailed] = useState(false);

  const isAlreadyAdmin = !loadingAuth && Boolean(token) && !isTokenExpired(token) && role === 'admin';

  useEffect(() => {
    if (isAlreadyAdmin) {
      router.replace('/admin');
    }
  }, [isAlreadyAdmin, router]);

  const handleLogin = async () => {
    if (submitting) {
      return;
    }

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const response = await api.post('/api/auth/login', {
        username: trimmedUsername,
        password,
      });

      const receivedToken = response?.data?.token;
      const receivedRole = response?.data?.role;

      if (!receivedToken) {
        setError('Invalid server response. Please try again.');
        return;
      }

      if (receivedRole !== 'admin') {
        await logout();
        setError('Administrator access required. Non-admin accounts cannot sign in.');
        return;
      }

      const sessionSaved = await login(receivedToken, receivedRole);
      if (!sessionSaved) {
        setError('Received session is invalid or expired. Please try again.');
        return;
      }

      router.replace('/admin');
    } catch (err) {
      const serverMessage = err?.response?.data?.message || err?.response?.data?.error;
      if (!err?.response) {
        setError('Unable to reach server. Please check your connection and try again.');
      } else if (err.response.status === 400 || err.response.status === 401) {
        setError(serverMessage || 'Invalid username or password.');
      } else if (err.response.status === 403) {
        setError(serverMessage || 'Administrator privileges are required.');
      } else {
        setError(serverMessage || 'Sign in failed. Please try again later.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingAuth || isAlreadyAdmin) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <Loader label={isAlreadyAdmin ? 'Opening admin portal...' : 'Checking session...'} size="lg" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.wrapper}>
            <Pressable
              onPress={() => router.replace('/')}
              accessibilityRole="button"
              accessibilityLabel="Back to A6News"
              style={({ pressed }) => [styles.backLink, pressed && styles.backLinkPressed]}
            >
              <ArrowLeft size={16} color={COLORS.textMuted} />
              <Text style={styles.backLinkText}>Back to A6News</Text>
            </Pressable>

            <View style={styles.card}>
              <View style={styles.brandSection}>
                {logoFailed ? (
                  <Text style={styles.logoFallback}>A6 NEWS</Text>
                ) : (
                  <Image
                    source={{ uri: A6_LOGO_URL }}
                    style={styles.logo}
                    resizeMode="contain"
                    onError={() => setLogoFailed(true)}
                  />
                )}

                <View style={styles.portalBadge}>
                  <ShieldCheck size={13} color={COLORS.brandRed} />
                  <Text style={styles.portalBadgeText}>Editorial Portal</Text>
                </View>

                <Text style={styles.heading}>Admin Login</Text>
                <Text style={styles.subtitle}>
                  Restricted access for authorized A6 News editorial administrators only.
                </Text>
              </View>

              {error ? (
                <View style={styles.errorBanner} accessibilityRole="alert">
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.form}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Username</Text>
                  <View style={styles.inputContainer}>
                    <User size={18} color={COLORS.textPlaceholder} />
                    <TextInput
                      value={username}
                      onChangeText={(value) => {
                        setUsername(value);
                        if (error) {
                          setError('');
                        }
                      }}
                      placeholder="Enter admin username"
                      placeholderTextColor={COLORS.textPlaceholder}
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="username"
                      returnKeyType="next"
                      editable={!submitting}
                      onSubmitEditing={() => passwordInputRef.current?.focus()}
                      style={styles.input}
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputContainer}>
                    <Lock size={18} color={COLORS.textPlaceholder} />
                    <TextInput
                      ref={passwordInputRef}
                      value={password}
                      onChangeText={(value) => {
                        setPassword(value);
                        if (error) {
                          setError('');
                        }
                      }}
                      placeholder="Enter password"
                      placeholderTextColor={COLORS.textPlaceholder}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="password"
                      returnKeyType="done"
                      editable={!submitting}
                      onSubmitEditing={handleLogin}
                      style={styles.input}
                    />
                    <Pressable
                      onPress={() => setShowPassword((prev) => !prev)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                      style={styles.eyeButton}
                    >
                      {showPassword ? (
                        <EyeOff size={18} color={COLORS.textMeta} />
                      ) : (
                        <Eye size={18} color={COLORS.textMeta} />
                      )}
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  onPress={handleLogin}
                  disabled={submitting}
                  accessibilityRole="button"
                  accessibilityLabel={submitting ? 'Signing in' : 'Sign In'}
                  style={({ pressed }) => [
                    styles.submitButton,
                    submitting && styles.submitButtonDisabled,
                    pressed && !submitting && styles.submitButtonPressed,
                  ]}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : null}
                  <Text style={styles.submitButtonText}>
                    {submitting ? 'Signing in...' : 'Sign In'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },
  wrapper: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    gap: SPACING.md,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  backLinkPressed: {
    opacity: 0.7,
  },
  backLinkText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textMuted,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderCard,
    padding: SPACING.xxl,
    gap: SPACING.xl,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  brandSection: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  logo: {
    width: 140,
    height: 44,
    marginBottom: SPACING.xs,
  },
  logoFallback: {
    ...TYPOGRAPHY.scale.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: COLORS.brandRed,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  portalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.red50,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.red200,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  portalBadgeText: {
    ...TYPOGRAPHY.scale.badge,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.brandRedDark,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  heading: {
    ...TYPOGRAPHY.scale.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.scale.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: COLORS.red50,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.red200,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  errorText: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.brandRedDark,
  },
  form: {
    gap: SPACING.lg,
  },
  fieldGroup: {
    gap: SPACING.xs,
  },
  label: {
    ...TYPOGRAPHY.scale.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    borderWidth: LAYOUT.borderWidth,
    borderColor: COLORS.borderInput,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    minHeight: 48,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.scale.sm,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.sm,
  },
  eyeButton: {
    padding: SPACING.xs,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.brandRed,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    minHeight: 48,
    marginTop: SPACING.xs,
  },
  submitButtonPressed: {
    backgroundColor: COLORS.brandRedDark,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    ...TYPOGRAPHY.scale.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
});
