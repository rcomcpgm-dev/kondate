import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function LegalScreen() {
  const router = useRouter();

  const handleEmail = () => {
    if (Platform.OS === 'web') {
      window.location.href = 'mailto:r.com.cpgm@gmail.com';
    } else {
      Linking.openURL('mailto:r.com.cpgm@gmail.com');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
        <Text style={styles.backButtonText}>← トップへ</Text>
      </TouchableOpacity>

      <Text style={styles.pageTitle}>特定商取引法に基づく表記</Text>

      <View style={styles.table}>
        <Row label="販売業者" value="個人事業主" />
        <Row label="運営責任者" value="吉瀬 礼" />
        <Row label="所在地" value="請求があった場合に遅滞なく開示いたします。" />
        <Row label="電話番号" value="請求があった場合に遅滞なく開示いたします。" />
        <Row label="メールアドレス" value="r.com.cpgm@gmail.com" onPress={handleEmail} />
        <Row label="URL" value="https://kondate-nu.vercel.app" />
        <Row label="販売価格" value="月額480円（税込）" />
        <Row label="支払方法" value="クレジットカード（Stripe経由）" />
        <Row label="支払時期" value="サブスクリプション登録時に初回決済。以降毎月自動更新。" />
        <Row label="商品の引渡し時期" value="決済完了後、即時にサービスをご利用いただけます。" />
        <Row label="返品・キャンセル" value="サブスクリプションはいつでも解約可能です。解約後も期間満了まで利用できます。返金は原則行いません。" />
        <Row label="動作環境" value="最新版のChrome、Safari、Edge等のWebブラウザ" />
        <Row label="サービス内容" value="AI による献立提案サービス「献立ガチャ」のプレミアム機能（ガチャ無制限、広告非表示等）" />
      </View>

      <Text style={styles.sectionTitle}>プライバシーポリシー</Text>
      <View style={styles.card}>
        <Text style={styles.bodyText}>
          当サービスでは、ユーザーの個人情報を以下の目的で利用します。{'\n\n'}
          1. サブスクリプションの管理・決済処理{'\n'}
          2. サービスの提供・改善{'\n'}
          3. お問い合わせ対応{'\n\n'}
          決済情報はStripe, Inc.が管理し、当サービスではカード情報を保持しません。{'\n\n'}
          個人情報の第三者提供は、法令に基づく場合を除き行いません。
        </Text>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

function Row({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {onPress ? (
        <TouchableOpacity onPress={onPress}>
          <Text style={[styles.value, styles.link]}>{value}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.value}>{value}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2D1B00',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D1B00',
    marginTop: 28,
    marginBottom: 12,
  },
  table: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F5EDE4',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  label: {
    width: 130,
    fontSize: 13,
    fontWeight: '700',
    color: '#8B7355',
  },
  value: {
    flex: 1,
    fontSize: 13,
    color: '#2D1B00',
    lineHeight: 20,
  },
  link: {
    color: '#FF6B35',
    textDecorationLine: 'underline',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bodyText: {
    fontSize: 13,
    color: '#2D1B00',
    lineHeight: 22,
  },
  bottomSpacer: {
    height: 40,
  },
});
