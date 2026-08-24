package com.lemichu.kbdepositrelay.data

import android.content.Context
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Telephony
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.lemichu.kbdepositrelay.BuildConfig
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import java.nio.charset.StandardCharsets
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

private val Context.relayDataStore by preferencesDataStore(name = "relay_settings")

data class RelaySettings(
    val deviceId: String = "kb-server-phone-01",
    val deviceName: String = "KB 입금 서버폰",
    val serverPhone: String = BuildConfig.DEFAULT_SERVER_PHONE,
    val serverUrl: String = BuildConfig.DEFAULT_SERVER_URL,
    val selectedSmsPackage: String = "",
    val wizardCompleted: Boolean = false,
    val lastHeartbeatAt: Long? = null,
    val lastServerSuccess: Boolean = false,
    val lastServerMessage: String = "확인 전",
)

class SettingsStore(private val context: Context) {
    private object Keys {
        val deviceId = stringPreferencesKey("device_id")
        val deviceName = stringPreferencesKey("device_name")
        val serverPhone = stringPreferencesKey("server_phone")
        val serverUrl = stringPreferencesKey("server_url")
        val selectedSmsPackage = stringPreferencesKey("selected_sms_package")
        val wizardCompleted = booleanPreferencesKey("wizard_completed")
        val lastHeartbeatAt = longPreferencesKey("last_heartbeat_at")
        val lastServerSuccess = booleanPreferencesKey("last_server_success")
        val lastServerMessage = stringPreferencesKey("last_server_message")
    }

    val settings: Flow<RelaySettings> = context.relayDataStore.data.map { values ->
        RelaySettings(
            deviceId = values[Keys.deviceId] ?: "kb-server-phone-01",
            deviceName = values[Keys.deviceName] ?: "KB 입금 서버폰",
            serverPhone = values[Keys.serverPhone] ?: BuildConfig.DEFAULT_SERVER_PHONE,
            serverUrl = values[Keys.serverUrl] ?: BuildConfig.DEFAULT_SERVER_URL,
            selectedSmsPackage = values[Keys.selectedSmsPackage].orEmpty(),
            wizardCompleted = values[Keys.wizardCompleted] ?: false,
            lastHeartbeatAt = values[Keys.lastHeartbeatAt],
            lastServerSuccess = values[Keys.lastServerSuccess] ?: false,
            lastServerMessage = values[Keys.lastServerMessage] ?: "확인 전",
        )
    }

    suspend fun current(): RelaySettings = settings.first()

    suspend fun saveConnection(
        deviceId: String,
        deviceName: String,
        serverPhone: String,
        serverUrl: String,
    ) {
        context.relayDataStore.edit {
            it[Keys.deviceId] = deviceId.trim()
            it[Keys.deviceName] = deviceName.trim()
            it[Keys.serverPhone] = serverPhone.trim()
            it[Keys.serverUrl] = serverUrl.trim().trimEnd('/')
        }
    }

    suspend fun setSelectedSmsPackage(packageName: String) {
        context.relayDataStore.edit { it[Keys.selectedSmsPackage] = packageName.trim() }
    }

    suspend fun setWizardCompleted(completed: Boolean) {
        context.relayDataStore.edit { it[Keys.wizardCompleted] = completed }
    }

    suspend fun recordServerResult(success: Boolean, message: String, heartbeatAt: Long? = null) {
        context.relayDataStore.edit {
            it[Keys.lastServerSuccess] = success
            it[Keys.lastServerMessage] = message.take(100)
            heartbeatAt?.let { value -> it[Keys.lastHeartbeatAt] = value }
        }
    }
}

class KeystoreSecretStore(private val context: Context) {
    private val preferences =
        context.getSharedPreferences("relay_secret_ciphertext", Context.MODE_PRIVATE)

    fun hasSecret(): Boolean = readSecret() != null

    fun setSecret(secret: String) {
        val clean = secret.trim()
        require(clean.isNotEmpty()) { "Device Secret을 입력하세요." }
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, getOrCreateKey())
        cipher.updateAAD(context.packageName.toByteArray(StandardCharsets.UTF_8))
        val ciphertext = cipher.doFinal(clean.toByteArray(StandardCharsets.UTF_8))
        val encoded = Base64.encodeToString(cipher.iv, Base64.NO_WRAP) + ":" +
            Base64.encodeToString(ciphertext, Base64.NO_WRAP)
        preferences.edit().putString(CIPHERTEXT_KEY, encoded).apply()
    }

    fun readSecret(): String? {
        val encoded = preferences.getString(CIPHERTEXT_KEY, null) ?: return null
        return runCatching {
            val parts = encoded.split(':', limit = 2)
            require(parts.size == 2)
            val cipher = Cipher.getInstance(TRANSFORMATION)
            cipher.init(
                Cipher.DECRYPT_MODE,
                getOrCreateKey(),
                GCMParameterSpec(128, Base64.decode(parts[0], Base64.NO_WRAP)),
            )
            cipher.updateAAD(context.packageName.toByteArray(StandardCharsets.UTF_8))
            String(
                cipher.doFinal(Base64.decode(parts[1], Base64.NO_WRAP)),
                StandardCharsets.UTF_8,
            )
        }.getOrNull()?.takeIf(String::isNotEmpty)
    }

    fun clear() {
        preferences.edit().remove(CIPHERTEXT_KEY).apply()
    }

    private fun getOrCreateKey(): SecretKey {
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
        (keyStore.getKey(KEY_ALIAS, null) as? SecretKey)?.let { return it }
        return KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEYSTORE)
            .apply {
                init(
                    KeyGenParameterSpec.Builder(
                        KEY_ALIAS,
                        KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
                    )
                        .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                        .setKeySize(256)
                        .build(),
                )
            }
            .generateKey()
    }

    private companion object {
        const val ANDROID_KEYSTORE = "AndroidKeyStore"
        const val KEY_ALIAS = "kb_deposit_relay_device_secret_v1"
        const val TRANSFORMATION = "AES/GCM/NoPadding"
        const val CIPHERTEXT_KEY = "encrypted_secret"
    }
}

data class SmsPackageOption(
    val packageName: String,
    val label: String,
    val isDefault: Boolean,
)

object SmsPackageDetector {
    private val knownPackages = listOf(
        "com.samsung.android.messaging",
        "com.google.android.apps.messaging",
    )

    fun installedOptions(context: Context): List<SmsPackageOption> {
        val manager = context.packageManager
        val defaultPackage = Telephony.Sms.getDefaultSmsPackage(context)
        return buildList {
            (listOfNotNull(defaultPackage) + knownPackages).distinct().forEach { packageName ->
                getApplicationInfo(manager, packageName)?.let { info ->
                    add(
                        SmsPackageOption(
                            packageName = packageName,
                            label = manager.getApplicationLabel(info).toString(),
                            isDefault = packageName == defaultPackage,
                        ),
                    )
                }
            }
        }.sortedByDescending(SmsPackageOption::isDefault)
    }

    @Suppress("DEPRECATION")
    private fun getApplicationInfo(
        manager: PackageManager,
        packageName: String,
    ): ApplicationInfo? = runCatching {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            manager.getApplicationInfo(
                packageName,
                PackageManager.ApplicationInfoFlags.of(0),
            )
        } else {
            manager.getApplicationInfo(packageName, 0)
        }
    }.getOrNull()
}
