import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  API_BASE_URL,
  fetchMobileDashboardData,
  getStoredAuthToken,
  loginMobileUser,
  logoutMobileUser,
  pingCentralApi,
} from './services/mobileApiClient';
import {
  getOfflineQueue,
  mobileStorage,
  syncMobileQueue,
} from './services/offlineSync';

const DASHBOARD_CACHE_KEY = '@sms_mobile_dashboard_cache_v1';

interface CachedMobileData {
  profile: {
    name: string;
    email: string;
    role: string;
    schoolName?: string;
  } | null;
  notices: Array<{
    id: string;
    title: string;
    content?: string;
    createdAt?: string;
  }>;
  classesCount: number;
  routineCount?: number;
  homeworkCount?: number;
  financeSummary: {
    totalCollected?: number;
    totalPending?: number;
    summaryText?: string;
  } | null;
  lastUpdatedAt?: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'attendance' | 'results' | 'fees'>('home');
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string>('সার্ভার সংযোগ যাচাই করা হচ্ছে...');

  // Auth & Live Data State
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');

  const [dashboardData, setDashboardData] = useState<CachedMobileData>({
    profile: null,
    notices: [],
    classesCount: 0,
    financeSummary: null,
  });

  const loadCachedOrLiveData = useCallback(async (token: string | null) => {
    // Load persisted offline snapshot first so UI responds immediately even offline
    const cachedRaw = await mobileStorage.getItem(DASHBOARD_CACHE_KEY);
    if (cachedRaw) {
      try {
        const parsed = JSON.parse(cachedRaw) as CachedMobileData;
        setDashboardData(parsed);
      } catch {
        // Ignore corrupt cache
      }
    }

    if (!token) {
      return;
    }

    const [{ online }] = await Promise.all([pingCentralApi()]);
    if (!online) {
      return;
    }

    try {
      const live = await fetchMobileDashboardData();
      const snapshot: CachedMobileData = {
        profile: live.profile,
        notices: live.notices,
        classesCount: live.classesCount,
        routineCount: live.routineCount,
        homeworkCount: live.homeworkCount,
        financeSummary: live.financeSummary,
        lastUpdatedAt: new Date().toISOString(),
      };
      setDashboardData(snapshot);
      await mobileStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(snapshot));
    } catch {
      // Keep last cached snapshot when API call fails
    }
  }, []);

  const refreshSyncState = useCallback(async () => {
    const [{ online }, queue, token] = await Promise.all([
      pingCentralApi(),
      getOfflineQueue(),
      getStoredAuthToken(),
    ]);
    setAuthToken(token);
    setIsOnline(online);
    setPendingSyncCount(queue.length);
    if (online && queue.length === 0) {
      setSyncMessage('রিয়েল-টাইম সার্ভার সংযুক্ত ও আপডেটেড');
    } else if (online) {
      setSyncMessage(`${queue.length}টি পেন্ডিং তথ্য সিঙ্কের জন্য প্রস্তুত`);
    } else {
      setSyncMessage('অফলাইন মোড সক্রিয় — নেটওয়ার্ক ফিরলে স্বয়ংক্রিয় সিঙ্ক হবে');
    }
    await loadCachedOrLiveData(token);
    setIsLoadingSession(false);
  }, [loadCachedOrLiveData]);

  useEffect(() => {
    void refreshSyncState();
  }, [refreshSyncState]);

  const handleLogin = async () => {
    setLoginError('');
    if (!emailInput.trim() || !passwordInput.trim()) {
      setLoginError('অনুগ্রহ করে ইমেইল ও পাসওয়ার্ড দিন।');
      return;
    }
    setIsLoggingIn(true);
    try {
      const res = await loginMobileUser(emailInput.trim(), passwordInput.trim());
      if (res?.offline) {
        setLoginError('অফলাইন অবস্থায় নতুন লগইন করা যাচ্ছে না। সার্ভার সংযোগ চেক করুন।');
        return;
      }
      const token = await getStoredAuthToken();
      if (!token) {
        setLoginError('সঠিক টোকেন পাওয়া যায়নি। তথ্য যাচাই করুন।');
        return;
      }
      setAuthToken(token);
      setPasswordInput('');
      await refreshSyncState();
    } catch {
      setLoginError('লগইন ব্যর্থ হয়েছে! ইমেইল, পাসওয়ার্ড বা সার্ভার সংযোগ পরীক্ষা করুন।');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutMobileUser();
    await mobileStorage.removeItem(DASHBOARD_CACHE_KEY);
    setAuthToken(null);
    setDashboardData({
      profile: null,
      notices: [],
      classesCount: 0,
      financeSummary: null,
    });
    setActiveTab('home');
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const token = await getStoredAuthToken();
      const result = await syncMobileQueue(token);
      setIsOnline(result.online);
      setPendingSyncCount(result.remaining);
      if (!result.online) {
        setSyncMessage('অফলাইন মোড — কেন্দ্রীয় সার্ভার পাওয়া যায়নি');
        Alert.alert('অফলাইন', 'সার্ভার সংযোগ না থাকায় ডাটা লোকাল কিউতে সংরক্ষিত আছে।');
      } else {
        await loadCachedOrLiveData(token);
        if (result.synced > 0) {
          setSyncMessage(`${result.synced}টি তথ্য সফলভাবে সার্ভারে সিঙ্ক হয়েছে`);
          Alert.alert('সিঙ্ক সম্পন্ন', `${result.synced}টি অফলাইন তথ্য সার্ভারে আপডেট হয়েছে।`);
        } else {
          setSyncMessage('রিয়েল-টাইম সার্ভার সংযুক্ত ও আপডেটেড');
          Alert.alert('সিঙ্ক স্ট্যাটাস', 'সকল তথ্য সার্ভার থেকে হালনাগাদ করা হয়েছে।');
        }
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const schoolName = dashboardData.profile?.schoolName || 'স্মার্ট ডিজিটাল ক্যাম্পাস';
  const userName = dashboardData.profile?.name || dashboardData.profile?.email || 'অ্যাকাউন্ট প্রোফাইল';
  const userRole = dashboardData.profile?.role || 'সদস্য';
  const latestNotice = dashboardData.notices[0] || null;
  const initials = userName.slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>🏫</Text>
          </View>
          <View>
            <Text style={styles.schoolTitle}>{schoolName}</Text>
            <Text style={styles.schoolSubtitle}>স্মার্ট ডিজিটাল ক্যাম্পাস মোবাইল অ্যাপ</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={() =>
              Alert.alert(
                'নোটিশ বোর্ড',
                dashboardData.notices.length > 0
                  ? `${dashboardData.notices.length}টি নোটিশ: ${latestNotice?.title || ''}`
                  : 'এই মুহূর্তে কোনো নতুন নোটিশ নেই।'
              )
            }
          >
            <Text style={styles.bellIcon}>🔔</Text>
            {dashboardData.notices.length > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{dashboardData.notices.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          {authToken && (
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutBtnText}>লগআউট</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {isLoadingSession ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#059669" />
            <Text style={styles.loadingText}>সেশন ও অফলাইন ক্যাশ লোড হচ্ছে...</Text>
          </View>
        ) : !authToken ? (
          /* Unauthenticated State — Real API Login Screen (No Hardcoded Demo Student Data) */
          <View style={styles.profileCard}>
            <Text style={styles.loginTitle}>অ্যাকাউন্টে প্রবেশ করুন</Text>
            <Text style={styles.loginSubtitle}>
              প্রতিষ্ঠানের রিয়েল-টাইম তথ্য, হাজিরা, ফলাফল ও বেতন দেখতে আপনার নিবন্ধিত ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন।
            </Text>

            <Text style={styles.inputLabel}>ইমেইল ঠিকানা</Text>
            <TextInput
              style={styles.input}
              value={emailInput}
              onChangeText={setEmailInput}
              placeholder="name@school.edu.bd"
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.inputLabel}>পাসওয়ার্ড</Text>
            <TextInput
              style={styles.input}
              value={passwordInput}
              onChangeText={setPasswordInput}
              placeholder="••••••••"
              secureTextEntry
            />

            {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}

            <TouchableOpacity
              style={[styles.primaryButton, isLoggingIn && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoggingIn}
            >
              <Text style={styles.primaryButtonText}>
                {isLoggingIn ? 'যাচাই করা হচ্ছে...' : 'লগইন করুন'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.apiEndpointNote}>সার্ভার ঠিকানা: {API_BASE_URL}</Text>
          </View>
        ) : (
          /* Authenticated Live Profile & Data */
          <>
            <View style={styles.profileCard}>
              <View style={styles.profileRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={styles.profileInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.studentName}>{userName}</Text>
                    <View style={styles.activePill}>
                      <Text style={styles.activePillText}>{userRole}</Text>
                    </View>
                  </View>
                  <Text style={styles.studentDetails}>
                    {dashboardData.profile?.email || 'সক্রিয় অ্যাকাউন্ট'}
                  </Text>
                </View>
              </View>

              <View style={styles.profileDivider} />

              <View style={styles.profileStatsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>মোট শ্রেণি</Text>
                  <Text style={styles.statValueBlue}>{dashboardData.classesCount}টি</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>সক্রিয় নোটিশ / পাঠ</Text>
                  <Text style={styles.statValueGreen}>
                    {dashboardData.notices.length} / {dashboardData.homeworkCount ?? 0}টি
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>সংযোগ ({dashboardData.routineCount ?? 0} রুটিন)</Text>
                  <Text style={styles.statValueGreen}>{isOnline ? 'অনলাইন' : 'অফলাইন ক্যাশ'}</Text>
                </View>
              </View>
            </View>

            {/* Tab-Specific Detail Section */}
            {activeTab === 'attendance' && (
              <View style={styles.profileCard}>
                <Text style={styles.sectionHeaderTitle}>📊 ডিজিটাল হাজিরা</Text>
                <View style={styles.profileDivider} />
                <Text style={styles.emptyInfoText}>
                  {isOnline
                    ? 'উপস্থিতি তথ্য কেন্দ্রীয় সার্ভারের সাথে সিঙ্ক অবস্থায় আছে।'
                    : 'অফলাইন অবস্থায় সর্বশেষ ক্যাশকৃত তথ্য প্রদর্শিত হচ্ছে।'}
                </Text>
              </View>
            )}

            {activeTab === 'results' && (
              <View style={styles.profileCard}>
                <Text style={styles.sectionHeaderTitle}>🏆 একাডেমিক ফলাফল ও শ্রেণি তালিকা</Text>
                <View style={styles.profileDivider} />
                <Text style={styles.emptyInfoText}>
                  নিবন্ধিত শ্রেণি সংখ্যা: {dashboardData.classesCount}টি। প্রকাশিত ফলাফল ওয়েব ও কেন্দ্রীয় পোর্টাল থেকে হালনাগাদ হয়।
                </Text>
              </View>
            )}

            {activeTab === 'fees' && (
              <View style={styles.profileCard}>
                <Text style={styles.sectionHeaderTitle}>💳 বেতন ও ফি সারসংক্ষেপ</Text>
                <View style={styles.profileDivider} />
                {dashboardData.financeSummary ? (
                  <View style={styles.profileStatsRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>মোট আদায়</Text>
                      <Text style={styles.statValueGreen}>
                        ৳{dashboardData.financeSummary.totalCollected ?? 0}
                      </Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>মোট বকেয়া</Text>
                      <Text style={styles.statValueBlue}>
                        ৳{dashboardData.financeSummary.totalPending ?? 0}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.emptyInfoText}>
                    এখনো কোনো আর্থিক সারসংক্ষেপ পাওয়া যায়নি। সিঙ্ক বাটনে চাপ দিয়ে আপডেট করুন।
                  </Text>
                )}
              </View>
            )}

            {/* Quick Action Grid */}
            <Text style={styles.sectionHeaderTitle}>ডিজিটাল সেবাসমূহ</Text>
            <View style={styles.gridContainer}>
              <TouchableOpacity
                style={[styles.gridCard, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}
                onPress={() => setActiveTab('attendance')}
              >
                <Text style={styles.gridIcon}>📅</Text>
                <Text style={styles.gridTitle}>ডিজিটাল হাজিরা</Text>
                <Text style={styles.gridDesc}>কেন্দ্রীয় হাজিরা স্থিতি</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.gridCard, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}
                onPress={() => setActiveTab('results')}
              >
                <Text style={styles.gridIcon}>🏆</Text>
                <Text style={styles.gridTitle}>শ্রেণি ও ফলাফল</Text>
                <Text style={styles.gridDesc}>{dashboardData.classesCount}টি শ্রেণি যুক্ত</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.gridCard, { backgroundColor: '#fdf4ff', borderColor: '#f5d0fe' }]}
                onPress={() => setActiveTab('fees')}
              >
                <Text style={styles.gridIcon}>💳</Text>
                <Text style={styles.gridTitle}>ফি সারসংক্ষেপ</Text>
                <Text style={styles.gridDesc}>রিয়েল-টাইম হিসাব</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.gridCard, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}
                onPress={handleManualSync}
              >
                <Text style={styles.gridIcon}>🔄</Text>
                <Text style={styles.gridTitle}>ডাটা সিঙ্ক</Text>
                <Text style={styles.gridDesc}>সর্বশেষ তথ্য আনুন</Text>
              </TouchableOpacity>
            </View>

            {/* Live Notice Board Preview */}
            <View style={styles.noticeCard}>
              <View style={styles.noticeHeader}>
                <Text style={styles.noticeTitle}>📢 নোটিশ বোর্ড</Text>
                <Text style={styles.noticeDate}>
                  {latestNotice?.createdAt
                    ? new Date(latestNotice.createdAt).toLocaleDateString('bn-BD')
                    : 'হালনাগাদ'}
                </Text>
              </View>
              <Text style={styles.noticeBody}>
                {latestNotice
                  ? `${latestNotice.title}${latestNotice.content ? ' — ' + latestNotice.content : ''}`
                  : 'এখনো কোনো নোটিশ প্রকাশ করা হয়নি।'}
              </Text>
            </View>
          </>
        )}

        {/* Offline Sync Status Badge */}
        <TouchableOpacity
          style={styles.syncStatusCard}
          onPress={handleManualSync}
          disabled={isSyncing}
        >
          <Text style={styles.syncStatusIcon}>{isOnline ? '⚡' : '📡'}</Text>
          <View style={styles.syncStatusTextWrapper}>
            <Text style={styles.syncStatusTitle}>
              {isSyncing
                ? 'সিঙ্ক হচ্ছে...'
                : isOnline
                  ? 'অনলাইন সিঙ্ক সংযুক্ত'
                  : 'অফলাইন ক্যাশ সক্রিয়'}
              {pendingSyncCount > 0 ? ` (${pendingSyncCount} পেন্ডিং)` : ''}
            </Text>
            <Text style={styles.syncStatusDesc}>{syncMessage}</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      {authToken && (
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('home')}>
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={[styles.navLabel, activeTab === 'home' && styles.navLabelActive]}>হোম</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('attendance')}>
            <Text style={styles.navIcon}>📊</Text>
            <Text style={[styles.navLabel, activeTab === 'attendance' && styles.navLabelActive]}>হাজিরা</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('results')}>
            <Text style={styles.navIcon}>📝</Text>
            <Text style={[styles.navLabel, activeTab === 'results' && styles.navLabelActive]}>ফলাফল</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('fees')}>
            <Text style={styles.navIcon}>💳</Text>
            <Text style={[styles.navLabel, activeTab === 'fees' && styles.navLabelActive]}>বেতন ও ফি</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#047857',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  logoutBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
  },
  schoolTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  schoolSubtitle: {
    color: '#a7f3d0',
    fontSize: 10,
  },
  notificationBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellIcon: {
    fontSize: 16,
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#f43f5e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  centerBox: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 12,
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  loginSubtitle: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
  },
  errorText: {
    color: '#e11d48',
    fontSize: 12,
    marginTop: 10,
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  apiEndpointNote: {
    marginTop: 12,
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  activePill: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  activePillText: {
    color: '#15803d',
    fontSize: 10,
    fontWeight: 'bold',
  },
  studentDetails: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  profileDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  profileStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: '#94a3b8',
  },
  statValueGreen: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#059669',
    marginTop: 2,
  },
  statValueBlue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2563eb',
    marginTop: 2,
  },
  emptyInfoText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCard: {
    width: '48%',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  gridIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  gridDesc: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'center',
  },
  noticeCard: {
    backgroundColor: '#fffdf5',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  noticeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#b45309',
  },
  noticeDate: {
    fontSize: 10,
    color: '#92400e',
  },
  noticeBody: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  syncStatusCard: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncStatusIcon: {
    fontSize: 16,
  },
  syncStatusTextWrapper: {
    flex: 1,
  },
  syncStatusTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#334155',
  },
  syncStatusDesc: {
    fontSize: 9,
    color: '#64748b',
  },
  bottomNav: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  navItem: {
    alignItems: 'center',
    gap: 2,
  },
  navIcon: {
    fontSize: 18,
  },
  navLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  navLabelActive: {
    color: '#059669',
    fontWeight: 'bold',
  },
});
