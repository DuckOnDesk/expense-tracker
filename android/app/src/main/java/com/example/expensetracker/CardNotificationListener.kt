package com.example.expensetracker

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * Listens to all device notifications.
 * Filters for known card/bank app packages, then forwards the text
 * to the expense-tracker webhook.
 */
class CardNotificationListener : NotificationListenerService() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    // Known Korean card/bank app package names
    private val CARD_PACKAGES = setOf(
        "com.shinhancard.smartshinhan",   // 신한카드
        "com.samsung.android.spay",       // 삼성페이
        "com.kbcard.kbkookmincard",       // KB국민카드
        "com.hyundaicard.appcard",        // 현대카드
        "com.lottecard.app",              // 롯데카드
        "com.wooricard.wcard",            // 우리카드
        "nh.smart.nhallonepay",           // NH농협카드
        "com.hanacard.mobilecard",        // 하나카드
        "com.kakao.talk",                 // 카카오페이 알림
        "com.nhn.android.search",         // 네이버페이 알림
        "viva.republica.toss",            // 토스
        "com.shinhan.sbanking",           // 신한은행
        "com.wooribank.smart.npib",       // 우리은행
        "nh.smart",                       // NH농협은행
        "com.kbstar.kbbank",              // KB국민은행
        "com.ibk.smart",                  // IBK기업은행
    )

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        val pkg = sbn.packageName ?: return
        if (pkg !in CARD_PACKAGES) return

        val extras = sbn.notification?.extras ?: return
        val title = extras.getString("android.title") ?: ""
        val text = extras.getCharSequence("android.text")?.toString() ?: ""
        val bigText = extras.getCharSequence("android.bigText")?.toString() ?: ""

        // Prefer bigText (more complete) over regular text
        val content = if (bigText.isNotBlank()) "$title $bigText" else "$title $text"
        if (content.isBlank()) return

        Log.d("CardListener", "Intercepted from $pkg: $content")

        scope.launch {
            WebhookSender.send(
                context = applicationContext,
                rawText = content.trim(),
                deviceTime = java.time.Instant.now().toString(),
            )
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification) = Unit
}
