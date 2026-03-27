/**
 * Internationalisation (i18n) — lightweight translation system.
 *
 * Supports: English (en), German (de), Turkish (tr), Arabic (ar), Ukrainian (uk)
 *
 * Usage in React components:
 *   import { t, setLanguage, LANGUAGES } from './i18n'
 *   <p>{t('scan_letter')}</p>
 */

export type LangCode = 'en' | 'de' | 'tr' | 'ar' | 'uk'

export const LANGUAGES: { code: LangCode; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'de', label: 'German', native: 'Deutsch' },
  { code: 'tr', label: 'Turkish', native: 'Türkçe' },
  { code: 'ar', label: 'Arabic', native: 'العربية' },
  { code: 'uk', label: 'Ukrainian', native: 'Українська' },
]

type TranslationKey =
  | 'app_name'
  | 'app_tagline'
  | 'scan_letter'
  | 'all_letters'
  | 'settings'
  | 'your_letters'
  | 'needs_attention'
  | 'pending'
  | 'handled'
  | 'total'
  | 'no_letters_yet'
  | 'no_letters_hint'
  | 'what_this_is'
  | 'what_to_do'
  | 'if_ignored'
  | 'free_help'
  | 'mark_handled'
  | 'mark_pending'
  | 'generate_reply'
  | 'set_reminder'
  | 'show_raw_text'
  | 'hide_raw_text'
  | 'export_pdf'
  | 'delete'
  | 'deadline'
  | 'amount'
  | 'from'
  | 'scanned'
  | 'status'
  | 'overdue'
  | 'today'
  | 'tomorrow'
  | 'days'
  | 'back_to_all'
  | 'save'
  | 'cancel'
  | 'confirm'
  | 'wrong_type'
  | 'was_this_wrong'
  | 'report_wrong'
  | 'feedback_thanks'
  | 'verify_manually'
  | 'high_confidence'
  | 'medium_confidence'
  | 'low_confidence'
  | 'search_placeholder'
  | 'all'
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'urgency'
  | 'not_detected'
  | 'edit'
  | 'private_local'
  | 'processing'
  | 'scan_qr_hint'
  | 'same_wifi_hint'
  | 'photo_received'
  | 'review_analysis'
  | 'discard'
  | 'save_letter'
  | 'language'
  | 'share_with_advisor'
  | 'copy_summary'
  | 'summary_copied'
  | 'all_caught_up'
  | 'letters_need_attention'

type Translations = Record<TranslationKey, string>

const en: Translations = {
  app_name: 'BriefKlar',
  app_tagline: 'German letters, made clear',
  scan_letter: 'Scan Letter',
  all_letters: 'All Letters',
  settings: 'Settings',
  your_letters: 'Your Letters',
  needs_attention: 'Needs Attention',
  pending: 'Pending',
  handled: 'Handled',
  total: 'Total',
  no_letters_yet: 'No letters scanned yet',
  no_letters_hint: 'Click Scan Letter in the sidebar, scan the QR code with your phone, and photograph any German official letter.',
  what_this_is: 'What this is',
  what_to_do: 'What to do',
  if_ignored: 'If ignored',
  free_help: 'Free Help Available',
  mark_handled: '✓ Mark as Handled',
  mark_pending: '↩ Mark as Pending',
  generate_reply: '✍️ Generate Reply',
  set_reminder: '🔔 Set Reminder',
  show_raw_text: '📄 Show Raw Text',
  hide_raw_text: '📄 Hide Raw Text',
  export_pdf: '📄 Export PDF',
  delete: '🗑 Delete',
  deadline: 'Deadline',
  amount: 'Amount',
  from: 'From',
  scanned: 'Scanned',
  status: 'Status',
  overdue: 'Overdue',
  today: 'Today',
  tomorrow: 'Tomorrow',
  days: 'days',
  back_to_all: '← Back to all letters',
  save: 'Save',
  cancel: 'Cancel',
  confirm: 'Confirm',
  wrong_type: 'Wrong type?',
  was_this_wrong: 'Was this classification wrong?',
  report_wrong: 'Report incorrect',
  feedback_thanks: 'Thanks! Your feedback helps improve BriefKlar.',
  verify_manually: 'Verify before acting.',
  high_confidence: 'High confidence',
  medium_confidence: 'Medium confidence',
  low_confidence: 'Low confidence — verify manually',
  search_placeholder: 'Search by sender, type, or content…',
  all: 'All',
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  urgency: 'Urgency',
  not_detected: 'Not detected',
  edit: 'Edit',
  private_local: '🔒 Private · Local only',
  processing: 'Processing…',
  scan_qr_hint: 'Scan this QR code with your phone, then take a photo of the letter.',
  same_wifi_hint: 'Phone and computer must be on the same WiFi.',
  photo_received: 'Photo received!',
  review_analysis: 'Review Analysis',
  discard: 'Discard',
  save_letter: 'Save Letter',
  language: 'Language',
  share_with_advisor: '📤 Share with Advisor',
  copy_summary: 'Copy Summary',
  summary_copied: '✓ Summary copied to clipboard',
  all_caught_up: 'All caught up — nothing pending',
  letters_need_attention: 'letter(s) need attention',
}

const de: Translations = {
  app_name: 'BriefKlar',
  app_tagline: 'Deutsche Briefe, klar erklärt',
  scan_letter: 'Brief scannen',
  all_letters: 'Alle Briefe',
  settings: 'Einstellungen',
  your_letters: 'Deine Briefe',
  needs_attention: 'Handlungsbedarf',
  pending: 'Offen',
  handled: 'Erledigt',
  total: 'Gesamt',
  no_letters_yet: 'Noch keine Briefe gescannt',
  no_letters_hint: 'Klicke auf Brief scannen in der Seitenleiste, scanne den QR-Code mit deinem Handy und fotografiere einen deutschen Amtsbrief.',
  what_this_is: 'Was ist das',
  what_to_do: 'Was tun',
  if_ignored: 'Wenn ignoriert',
  free_help: 'Kostenlose Hilfe',
  mark_handled: '✓ Als erledigt markieren',
  mark_pending: '↩ Als offen markieren',
  generate_reply: '✍️ Antwort erstellen',
  set_reminder: '🔔 Erinnerung setzen',
  show_raw_text: '📄 Rohtext anzeigen',
  hide_raw_text: '📄 Rohtext ausblenden',
  export_pdf: '📄 PDF exportieren',
  delete: '🗑 Löschen',
  deadline: 'Frist',
  amount: 'Betrag',
  from: 'Von',
  scanned: 'Gescannt',
  status: 'Status',
  overdue: 'Überfällig',
  today: 'Heute',
  tomorrow: 'Morgen',
  days: 'Tage',
  back_to_all: '← Zurück zu allen Briefen',
  save: 'Speichern',
  cancel: 'Abbrechen',
  confirm: 'Bestätigen',
  wrong_type: 'Falscher Typ?',
  was_this_wrong: 'Wurde dieser Brief falsch erkannt?',
  report_wrong: 'Fehler melden',
  feedback_thanks: 'Danke! Dein Feedback hilft BriefKlar zu verbessern.',
  verify_manually: 'Bitte manuell überprüfen.',
  high_confidence: 'Hohe Sicherheit',
  medium_confidence: 'Mittlere Sicherheit',
  low_confidence: 'Geringe Sicherheit — bitte prüfen',
  search_placeholder: 'Nach Absender, Typ oder Inhalt suchen…',
  all: 'Alle',
  critical: 'Kritisch',
  high: 'Hoch',
  medium: 'Mittel',
  low: 'Niedrig',
  urgency: 'Dringlichkeit',
  not_detected: 'Nicht erkannt',
  edit: 'Bearbeiten',
  private_local: '🔒 Privat · Nur lokal',
  processing: 'Verarbeitung…',
  scan_qr_hint: 'Scanne den QR-Code mit deinem Handy und fotografiere den Brief.',
  same_wifi_hint: 'Handy und Computer müssen im selben WLAN sein.',
  photo_received: 'Foto empfangen!',
  review_analysis: 'Analyse prüfen',
  discard: 'Verwerfen',
  save_letter: 'Brief speichern',
  language: 'Sprache',
  share_with_advisor: '📤 An Berater senden',
  copy_summary: 'Zusammenfassung kopieren',
  summary_copied: '✓ Zusammenfassung kopiert',
  all_caught_up: 'Alles erledigt — nichts offen',
  letters_need_attention: 'Brief(e) brauchen Aufmerksamkeit',
}

const tr: Translations = {
  app_name: 'BriefKlar',
  app_tagline: 'Alman mektupları, anlaşılır hale',
  scan_letter: 'Mektup Tara',
  all_letters: 'Tüm Mektuplar',
  settings: 'Ayarlar',
  your_letters: 'Mektupların',
  needs_attention: 'İşlem Gerekli',
  pending: 'Bekliyor',
  handled: 'Tamamlandı',
  total: 'Toplam',
  no_letters_yet: 'Henüz mektup taranmadı',
  no_letters_hint: 'Kenar çubuğundaki Mektup Tara\'ya tıklayın, QR kodu telefonunuzla okutun ve herhangi bir Alman resmi mektubunu fotoğraflayın.',
  what_this_is: 'Bu nedir',
  what_to_do: 'Ne yapmalı',
  if_ignored: 'Görmezden gelinirse',
  free_help: 'Ücretsiz Yardım',
  mark_handled: '✓ Tamamlandı olarak işaretle',
  mark_pending: '↩ Bekliyor olarak işaretle',
  generate_reply: '✍️ Yanıt Oluştur',
  set_reminder: '🔔 Hatırlatıcı Kur',
  show_raw_text: '📄 Ham Metni Göster',
  hide_raw_text: '📄 Ham Metni Gizle',
  export_pdf: '📄 PDF Dışa Aktar',
  delete: '🗑 Sil',
  deadline: 'Son Tarih',
  amount: 'Tutar',
  from: 'Gönderen',
  scanned: 'Taranan',
  status: 'Durum',
  overdue: 'Gecikmiş',
  today: 'Bugün',
  tomorrow: 'Yarın',
  days: 'gün',
  back_to_all: '← Tüm mektuplara dön',
  save: 'Kaydet',
  cancel: 'İptal',
  confirm: 'Onayla',
  wrong_type: 'Yanlış tür?',
  was_this_wrong: 'Bu sınıflandırma yanlış mıydı?',
  report_wrong: 'Yanlış bildir',
  feedback_thanks: 'Teşekkürler! Geri bildiriminiz BriefKlar\'ı geliştirmeye yardımcı oluyor.',
  verify_manually: 'Lütfen manuel olarak doğrulayın.',
  high_confidence: 'Yüksek güven',
  medium_confidence: 'Orta güven',
  low_confidence: 'Düşük güven — manuel doğrulayın',
  search_placeholder: 'Gönderen, tür veya içeriğe göre ara…',
  all: 'Tümü',
  critical: 'Kritik',
  high: 'Yüksek',
  medium: 'Orta',
  low: 'Düşük',
  urgency: 'Aciliyet',
  not_detected: 'Tespit edilmedi',
  edit: 'Düzenle',
  private_local: '🔒 Gizli · Yalnızca yerel',
  processing: 'İşleniyor…',
  scan_qr_hint: 'QR kodu telefonunuzla okutun, ardından mektubun fotoğrafını çekin.',
  same_wifi_hint: 'Telefon ve bilgisayar aynı WiFi\'da olmalı.',
  photo_received: 'Fotoğraf alındı!',
  review_analysis: 'Analizi İncele',
  discard: 'At',
  save_letter: 'Mektubu Kaydet',
  language: 'Dil',
  share_with_advisor: '📤 Danışmana Gönder',
  copy_summary: 'Özeti Kopyala',
  summary_copied: '✓ Özet panoya kopyalandı',
  all_caught_up: 'Tümü tamamlandı — bekleyen yok',
  letters_need_attention: 'mektup(lar) ilgi bekliyor',
}

const ar: Translations = {
  app_name: 'BriefKlar',
  app_tagline: 'رسائل ألمانية، واضحة ومفهومة',
  scan_letter: 'مسح الرسالة',
  all_letters: 'جميع الرسائل',
  settings: 'الإعدادات',
  your_letters: 'رسائلك',
  needs_attention: 'تحتاج إجراء',
  pending: 'معلّق',
  handled: 'تم المعالجة',
  total: 'الإجمالي',
  no_letters_yet: 'لم يتم مسح أي رسائل بعد',
  no_letters_hint: 'انقر على مسح الرسالة في الشريط الجانبي، امسح رمز QR بهاتفك، والتقط صورة لأي رسالة ألمانية رسمية.',
  what_this_is: 'ما هذا',
  what_to_do: 'ماذا تفعل',
  if_ignored: 'إذا تم تجاهلها',
  free_help: 'مساعدة مجانية متاحة',
  mark_handled: '✓ تم المعالجة',
  mark_pending: '↩ معلّق',
  generate_reply: '✍️ إنشاء رد',
  set_reminder: '🔔 تعيين تذكير',
  show_raw_text: '📄 عرض النص الخام',
  hide_raw_text: '📄 إخفاء النص الخام',
  export_pdf: '📄 تصدير PDF',
  delete: '🗑 حذف',
  deadline: 'الموعد النهائي',
  amount: 'المبلغ',
  from: 'من',
  scanned: 'تم المسح',
  status: 'الحالة',
  overdue: 'متأخر',
  today: 'اليوم',
  tomorrow: 'غداً',
  days: 'أيام',
  back_to_all: '← العودة لجميع الرسائل',
  save: 'حفظ',
  cancel: 'إلغاء',
  confirm: 'تأكيد',
  wrong_type: 'نوع خاطئ؟',
  was_this_wrong: 'هل كان هذا التصنيف خاطئاً؟',
  report_wrong: 'الإبلاغ عن خطأ',
  feedback_thanks: 'شكراً! ملاحظاتك تساعد في تحسين BriefKlar.',
  verify_manually: 'يرجى التحقق يدوياً.',
  high_confidence: 'ثقة عالية',
  medium_confidence: 'ثقة متوسطة',
  low_confidence: 'ثقة منخفضة — تحقق يدوياً',
  search_placeholder: 'البحث حسب المرسل أو النوع أو المحتوى…',
  all: 'الكل',
  critical: 'حرج',
  high: 'عالي',
  medium: 'متوسط',
  low: 'منخفض',
  urgency: 'الاستعجال',
  not_detected: 'لم يتم الكشف',
  edit: 'تعديل',
  private_local: '🔒 خاص · محلي فقط',
  processing: 'جاري المعالجة…',
  scan_qr_hint: 'امسح رمز QR بهاتفك، ثم التقط صورة للرسالة.',
  same_wifi_hint: 'يجب أن يكون الهاتف والكمبيوتر على نفس شبكة WiFi.',
  photo_received: 'تم استلام الصورة!',
  review_analysis: 'مراجعة التحليل',
  discard: 'تجاهل',
  save_letter: 'حفظ الرسالة',
  language: 'اللغة',
  share_with_advisor: '📤 مشاركة مع مستشار',
  copy_summary: 'نسخ الملخص',
  summary_copied: '✓ تم نسخ الملخص',
  all_caught_up: 'لا توجد رسائل معلقة',
  letters_need_attention: 'رسالة(رسائل) تحتاج انتباه',
}

const uk: Translations = {
  app_name: 'BriefKlar',
  app_tagline: 'Німецькі листи, зрозуміло',
  scan_letter: 'Сканувати лист',
  all_letters: 'Усі листи',
  settings: 'Налаштування',
  your_letters: 'Ваші листи',
  needs_attention: 'Потребує уваги',
  pending: 'Очікує',
  handled: 'Оброблено',
  total: 'Всього',
  no_letters_yet: 'Ще не відскановано жодного листа',
  no_letters_hint: 'Натисніть Сканувати лист на бічній панелі, відскануйте QR-код телефоном і сфотографуйте будь-який німецький офіційний лист.',
  what_this_is: 'Що це',
  what_to_do: 'Що робити',
  if_ignored: 'Якщо ігнорувати',
  free_help: 'Безкоштовна допомога',
  mark_handled: '✓ Позначити як оброблене',
  mark_pending: '↩ Позначити як очікує',
  generate_reply: '✍️ Створити відповідь',
  set_reminder: '🔔 Встановити нагадування',
  show_raw_text: '📄 Показати текст',
  hide_raw_text: '📄 Сховати текст',
  export_pdf: '📄 Експорт PDF',
  delete: '🗑 Видалити',
  deadline: 'Крайній термін',
  amount: 'Сума',
  from: 'Від',
  scanned: 'Відскановано',
  status: 'Статус',
  overdue: 'Прострочено',
  today: 'Сьогодні',
  tomorrow: 'Завтра',
  days: 'днів',
  back_to_all: '← Назад до всіх листів',
  save: 'Зберегти',
  cancel: 'Скасувати',
  confirm: 'Підтвердити',
  wrong_type: 'Невірний тип?',
  was_this_wrong: 'Чи правильно визначено цей лист?',
  report_wrong: 'Повідомити про помилку',
  feedback_thanks: 'Дякуємо! Ваш відгук допомагає покращити BriefKlar.',
  verify_manually: 'Будь ласка, перевірте вручну.',
  high_confidence: 'Висока впевненість',
  medium_confidence: 'Середня впевненість',
  low_confidence: 'Низька впевненість — перевірте вручну',
  search_placeholder: 'Пошук за відправником, типом або змістом…',
  all: 'Усі',
  critical: 'Критичний',
  high: 'Високий',
  medium: 'Середній',
  low: 'Низький',
  urgency: 'Терміновість',
  not_detected: 'Не виявлено',
  edit: 'Редагувати',
  private_local: '🔒 Приватно · Тільки локально',
  processing: 'Обробка…',
  scan_qr_hint: 'Відскануйте QR-код телефоном, потім сфотографуйте лист.',
  same_wifi_hint: 'Телефон і комп\'ютер повинні бути в одній WiFi мережі.',
  photo_received: 'Фото отримано!',
  review_analysis: 'Перегляд аналізу',
  discard: 'Відхилити',
  save_letter: 'Зберегти лист',
  language: 'Мова',
  share_with_advisor: '📤 Поділитися з консультантом',
  copy_summary: 'Копіювати резюме',
  summary_copied: '✓ Резюме скопійовано',
  all_caught_up: 'Все оброблено — нічого не очікує',
  letters_need_attention: 'лист(и) потребують уваги',
}

const ALL_TRANSLATIONS: Record<LangCode, Translations> = { en, de, tr, ar, uk }

let currentLang: LangCode = 'en'

export function setLanguage(lang: LangCode): void {
  currentLang = lang
}

export function getLanguage(): LangCode {
  return currentLang
}

export function t(key: TranslationKey): string {
  return ALL_TRANSLATIONS[currentLang]?.[key] ?? ALL_TRANSLATIONS.en[key] ?? key
}

export function isRtl(): boolean {
  return currentLang === 'ar'
}
