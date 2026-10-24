import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'attendance' | 'results' | 'fees'>('home');

  const schoolName = 'বরইতলী উচ্চ বিদ্যালয়';
  const student = {
    name: 'তানভীর আহমেদ',
    roll: '০১',
    class: '১০ম শ্রেণি',
    section: 'ক (বিজ্ঞান শাখা)',
    attendanceRate: '৯৮.৫%',
    todayStatus: 'উপস্থিত (সকাল ০৯:১৫)',
  };

  const handleActionPress = (title: string) => {
    Alert.alert('স্মার্ট ক্যাম্পাস', `${title} মডিউলে সংযুক্ত হচ্ছে...`);
  };

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
        <TouchableOpacity
          style={styles.notificationBtn}
          onPress={() => Alert.alert('বিজ্ঞপ্তি', 'নতুন ৩টি নোটিশ রয়েছে')}
        >
          <Text style={styles.bellIcon}>🔔</Text>
          <View style={styles.notifBadge}>
            <Text style={styles.notifBadgeText}>৩</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Student Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>তা</Text>
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.studentName}>{student.name}</Text>
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>সক্রিয়</Text>
                </View>
              </View>
              <Text style={styles.studentDetails}>
                {student.class} • রোল: {student.roll} • {student.section}
              </Text>
            </View>
          </View>

          <View style={styles.profileDivider} />

          <View style={styles.profileStatsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>বার্ষিক উপস্থিতি</Text>
              <Text style={styles.statValueGreen}>{student.attendanceRate}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>সর্বশেষ জিপিএ</Text>
              <Text style={styles.statValueBlue}>৫.০০ (A+)</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>ফি স্ট্যাটাস</Text>
              <Text style={styles.statValueGreen}>পরিশোধিত</Text>
            </View>
          </View>
        </View>

        {/* Live Attendance Alert Banner */}
        <View style={styles.attendanceBanner}>
          <View style={styles.liveDot} />
          <View style={styles.attendanceTextWrapper}>
            <Text style={styles.attendanceTitle}>আজকের ডিজিটাল হাজিরা</Text>
            <Text style={styles.attendanceSubtitle}>{student.todayStatus}</Text>
          </View>
          <Text style={styles.checkIcon}>✅</Text>
        </View>

        {/* Quick Action Grid */}
        <Text style={styles.sectionHeaderTitle}>ডিজিটাল সেবাসমূহ</Text>
        <View style={styles.gridContainer}>
          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}
            onPress={() => setActiveTab('attendance')}
          >
            <Text style={styles.gridIcon}>📅</Text>
            <Text style={styles.gridTitle}>ডিজিটাল হাজিরা</Text>
            <Text style={styles.gridDesc}>দৈনিক প্রবেশ/প্রস্থান</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}
            onPress={() => setActiveTab('results')}
          >
            <Text style={styles.gridIcon}>🏆</Text>
            <Text style={styles.gridTitle}>পরীক্ষার ফলাফল</Text>
            <Text style={styles.gridDesc}>গ্রেডশিট ও মার্কশিট</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: '#fdf4ff', borderColor: '#f5d0fe' }]}
            onPress={() => setActiveTab('fees')}
          >
            <Text style={styles.gridIcon}>💳</Text>
            <Text style={styles.gridTitle}>ফি পরিশোধ</Text>
            <Text style={styles.gridDesc}>বিকাশ / নগদ পেমেন্ট</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}
            onPress={() => handleActionPress('ক্লাস রুটিন')}
          >
            <Text style={styles.gridIcon}>📖</Text>
            <Text style={styles.gridTitle}>ক্লাস রুটিন</Text>
            <Text style={styles.gridDesc}>আজ ৪টি ক্লাস বাকি</Text>
          </TouchableOpacity>
        </View>

        {/* Notice Board Preview */}
        <View style={styles.noticeCard}>
          <View style={styles.noticeHeader}>
            <Text style={styles.noticeTitle}>📢 সর্বশেষ নোটিশ</Text>
            <Text style={styles.noticeDate}>২৪ অক্টোবর ২০২৬</Text>
          </View>
          <Text style={styles.noticeBody}>
            ২০২৬ শিক্ষাবর্ষের বার্ষিক পরীক্ষার চূড়ান্ত সময়সূচি ও আসন বিন্যাস প্রকাশিত হয়েছে। প্রবেশপত্র সংগ্রহ করতে যোগাযোগ করুন।
          </Text>
        </View>

        {/* Offline Sync Status Badge */}
        <View style={styles.syncStatusCard}>
          <Text style={styles.syncStatusIcon}>⚡</Text>
          <View style={styles.syncStatusTextWrapper}>
            <Text style={styles.syncStatusTitle}>রিয়েল-টাইম সিঙ্ক সংযুক্ত</Text>
            <Text style={styles.syncStatusDesc}>ইন্টারনেট ছাড়াও জরুরি তথ্যসমূহ অফলাইনে দেখতে পারবেন।</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
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
  attendanceBanner: {
    backgroundColor: '#ecfdf5',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    gap: 10,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  attendanceTextWrapper: {
    flex: 1,
  },
  attendanceTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#065f46',
  },
  attendanceSubtitle: {
    fontSize: 11,
    color: '#047857',
  },
  checkIcon: {
    fontSize: 16,
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
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
    backgroundColor: '#fffdf5',
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
