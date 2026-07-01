package com.example.expensetracker

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.EditText
import android.widget.Toast

/**
 * One-time setup screen.
 * User enters:
 *  - Webhook URL (e.g., https://your-app.vercel.app)
 *  - Webhook secret (WEBHOOK_SECRET env var value)
 *  - Supabase user UUID (copied from Supabase Auth → Users)
 *
 * Then grants Notification Access permission.
 */
class SettingsActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)

        val prefs = getSharedPreferences("expense_tracker", MODE_PRIVATE)

        val urlEdit = findViewById<EditText>(R.id.editWebhookUrl)
        val secretEdit = findViewById<EditText>(R.id.editWebhookSecret)
        val userIdEdit = findViewById<EditText>(R.id.editUserId)

        urlEdit.setText(prefs.getString("webhook_url", ""))
        secretEdit.setText(prefs.getString("webhook_secret", ""))
        userIdEdit.setText(prefs.getString("user_id", ""))

        findViewById<Button>(R.id.btnSave).setOnClickListener {
            prefs.edit()
                .putString("webhook_url", urlEdit.text.toString().trimEnd('/'))
                .putString("webhook_secret", secretEdit.text.toString())
                .putString("user_id", userIdEdit.text.toString())
                .apply()
            Toast.makeText(this, "저장되었습니다", Toast.LENGTH_SHORT).show()
        }

        findViewById<Button>(R.id.btnGrantPermission).setOnClickListener {
            startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
        }
    }
}
