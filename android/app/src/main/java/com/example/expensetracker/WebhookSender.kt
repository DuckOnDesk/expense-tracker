package com.example.expensetracker

import android.content.Context
import android.util.Log
import kotlinx.coroutines.delay
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

/**
 * Sends a parsed notification to the expense-tracker webhook.
 * Retries up to 3 times with exponential back-off on network failure.
 */
object WebhookSender {

    private const val TAG = "WebhookSender"
    private const val MAX_RETRIES = 3

    suspend fun send(context: Context, rawText: String, deviceTime: String) {
        val prefs = context.getSharedPreferences("expense_tracker", Context.MODE_PRIVATE)
        val webhookUrl = prefs.getString("webhook_url", BuildConfig.DEFAULT_WEBHOOK_URL) ?: return
        val secret = prefs.getString("webhook_secret", BuildConfig.DEFAULT_WEBHOOK_SECRET) ?: return
        val userId = prefs.getString("user_id", null) ?: return

        val payload = JSONObject().apply {
            put("userId", userId)
            put("rawText", rawText)
            put("deviceTime", deviceTime)
        }.toString()

        repeat(MAX_RETRIES) { attempt ->
            try {
                val conn = (URL("$webhookUrl/api/webhook/notification").openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    setRequestProperty("Content-Type", "application/json")
                    setRequestProperty("Authorization", "Bearer $secret")
                    doOutput = true
                    connectTimeout = 10_000
                    readTimeout = 15_000
                }
                OutputStreamWriter(conn.outputStream).use { it.write(payload) }
                val code = conn.responseCode
                Log.d(TAG, "Webhook response: $code")
                if (code in 200..299) return  // success
            } catch (e: Exception) {
                Log.w(TAG, "Attempt ${attempt + 1} failed: ${e.message}")
            }
            if (attempt < MAX_RETRIES - 1) delay(1_000L * (1 shl attempt))  // 1s, 2s
        }
    }
}
