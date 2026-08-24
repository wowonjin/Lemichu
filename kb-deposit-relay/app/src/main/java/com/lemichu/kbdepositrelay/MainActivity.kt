package com.lemichu.kbdepositrelay

import android.app.Application
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.BatteryManager
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.core.app.NotificationManagerCompat
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import com.lemichu.kbdepositrelay.core.KbDepositParser
import com.lemichu.kbdepositrelay.data.DepositEventEntity
import com.lemichu.kbdepositrelay.data.EventRepository
import com.lemichu.kbdepositrelay.data.RelaySettings
import com.lemichu.kbdepositrelay.data.SmsPackageDetector
import com.lemichu.kbdepositrelay.data.SmsPackageOption
import com.lemichu.kbdepositrelay.network.ApiResult
import com.lemichu.kbdepositrelay.network.HeartbeatPayload
import com.lemichu.kbdepositrelay.notification.KbNotificationListenerService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

class MainActivity : ComponentActivity() {
    private val relayViewModel: RelayViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            RelayTheme {
                val state by relayViewModel.uiState.collectAsStateWithLifecycle()
                RelayApp(state = state, viewModel = relayViewModel)
            }
        }
    }

    override fun onResume() {
        super.onResume()
        relayViewModel.refreshDeviceHealth()
    }
}

data class RelayUiState(
    val settings: RelaySettings = RelaySettings(),
    val pendingCount: Int = 0,
    val recentEvents: List<DepositEventEntity> = emptyList(),
    val smsPackages: List<SmsPackageOption> = emptyList(),
    val hasSecret: Boolean = false,
    val listenerGranted: Boolean = false,
    val batteryOptimizationDisabled: Boolean = false,
    val showWizard: Boolean = false,
    val message: String? = null,
)

class RelayViewModel(application: Application) : AndroidViewModel(application) {
    private val graph = (application as RelayApplication).graph
    private val mutableState = MutableStateFlow(
        RelayUiState(
            smsPackages = SmsPackageDetector.installedOptions(application),
            hasSecret = graph.secretStore.hasSecret(),
        ),
    )
    val uiState = mutableState.asStateFlow()

    init {
        viewModelScope.launch {
            combine(
                graph.settingsStore.settings,
                graph.database.eventDao().observePendingCount(),
                graph.database.eventDao().observeRecent(),
            ) { settings, pending, recent -> Triple(settings, pending, recent) }
                .collect { (settings, pending, recent) ->
                    mutableState.update {
                        it.copy(
                            settings = settings,
                            pendingCount = pending,
                            recentEvents = recent,
                            showWizard = !settings.wizardCompleted || it.showWizard,
                        )
                    }
                }
        }
        refreshDeviceHealth()
    }

    fun refreshDeviceHealth() {
        val context = getApplication<Application>()
        val powerManager = context.getSystemService(PowerManager::class.java)
        mutableState.update {
            it.copy(
                smsPackages = SmsPackageDetector.installedOptions(context),
                hasSecret = graph.secretStore.hasSecret(),
                listenerGranted =
                    NotificationManagerCompat.getEnabledListenerPackages(context)
                        .contains(context.packageName),
                batteryOptimizationDisabled =
                    powerManager?.isIgnoringBatteryOptimizations(context.packageName) == true,
            )
        }
    }

    fun showSettings() {
        mutableState.update { it.copy(showWizard = true, message = null) }
    }

    fun closeSettings() {
        if (mutableState.value.settings.wizardCompleted) {
            mutableState.update { it.copy(showWizard = false, message = null) }
        }
    }

    fun completeWizard(
        deviceId: String,
        deviceName: String,
        phone: String,
        serverUrl: String,
        selectedPackage: String,
        secret: String,
    ) {
        val validation = validateSettings(
            deviceId,
            deviceName,
            phone,
            serverUrl,
            selectedPackage,
            secret,
        )
        if (validation != null) {
            mutableState.update { it.copy(message = validation) }
            return
        }
        viewModelScope.launch(Dispatchers.IO) {
            graph.settingsStore.saveConnection(deviceId, deviceName, phone, serverUrl)
            graph.settingsStore.setSelectedSmsPackage(selectedPackage)
            if (secret.isNotBlank()) graph.secretStore.setSecret(secret)
            graph.settingsStore.setWizardCompleted(true)
            graph.workScheduler.ensurePeriodicHeartbeat()
            graph.workScheduler.enqueueImmediateHeartbeat()
            mutableState.update {
                it.copy(
                    showWizard = false,
                    hasSecret = true,
                    message = "설정을 저장하고 Heartbeat를 예약했습니다.",
                )
            }
        }
    }

    fun runParserTest() {
        viewModelScope.launch(Dispatchers.IO) {
            val parsed = KbDepositParser.parse(
                """
                [KB]7/10 16:40
                498125****8895
                홍길동
                1,250,000 입금
                1644-9999
                """.trimIndent(),
            )
            if (parsed == null) {
                mutableState.update { it.copy(message = "KB 파서 샘플을 해석하지 못했습니다.") }
                return@launch
            }
            val result = graph.eventRepository.record(parsed, isTest = true)
            mutableState.update {
                it.copy(
                    message = if (result == EventRepository.RecordResult.INSERTED) {
                        "테스트 이벤트를 큐에 추가했습니다. 서버에서 결제로 처리되지 않습니다."
                    } else {
                        "동일한 테스트 이벤트가 이미 큐에 있습니다."
                    },
                )
            }
        }
    }

    fun runServerTest() {
        viewModelScope.launch(Dispatchers.IO) {
            val settings = graph.settingsStore.current()
            val secret = graph.secretStore.readSecret()
            if (settings.serverUrl.isBlank() || secret.isNullOrBlank()) {
                mutableState.update { it.copy(message = "서버 URL과 Device Secret을 먼저 설정하세요.") }
                return@launch
            }
            val result = graph.apiClient.postHeartbeat(
                settings.serverUrl,
                secret,
                HeartbeatPayload(
                    deviceId = settings.deviceId,
                    appVersion = BuildConfig.VERSION_NAME,
                    batteryLevel = batteryLevel(),
                    notificationListenerGranted = mutableState.value.listenerGranted,
                    pendingQueueCount = graph.database.eventDao().pendingCount(),
                    lastEventAt = graph.database.eventDao().lastEventAt(),
                ),
            )
            when (result) {
                ApiResult.Success -> {
                    graph.settingsStore.recordServerResult(
                        true,
                        "서버 테스트 성공",
                        System.currentTimeMillis(),
                    )
                    mutableState.update { it.copy(message = "서버 연결 및 HMAC 인증에 성공했습니다.") }
                }

                is ApiResult.Retryable -> {
                    graph.settingsStore.recordServerResult(false, result.reason)
                    mutableState.update { it.copy(message = "서버 테스트 실패: ${result.reason}") }
                }

                is ApiResult.PermanentFailure -> {
                    graph.settingsStore.recordServerResult(false, result.reason)
                    mutableState.update { it.copy(message = "서버 테스트 거부: ${result.reason}") }
                }
            }
        }
    }

    private fun validateSettings(
        deviceId: String,
        deviceName: String,
        phone: String,
        serverUrl: String,
        selectedPackage: String,
        secret: String,
    ): String? {
        if (deviceId.isBlank() || deviceName.isBlank()) return "기기 ID와 이름을 입력하세요."
        if (phone.isBlank()) return "서버폰 번호를 로컬 설정으로 입력하세요."
        if (selectedPackage.isBlank()) return "알림을 받을 메시지 앱 package를 선택하세요."
        if (secret.isBlank() && !graph.secretStore.hasSecret()) return "Device Secret을 입력하세요."
        val parsedUrl = Uri.parse(serverUrl.trim().trimEnd('/'))
        val hasHost = !parsedUrl.host.isNullOrBlank()
        val isHttps = parsedUrl.scheme == "https" && hasHost
        val allowedDebugUrl = BuildConfig.DEBUG &&
            parsedUrl.scheme == "http" &&
            parsedUrl.host in setOf("localhost", "127.0.0.1", "10.0.2.2", "::1")
        if (!isHttps && !allowedDebugUrl) {
            return "서버 URL은 HTTPS여야 합니다. debug localhost만 HTTP를 허용합니다."
        }
        return null
    }

    private fun batteryLevel(): Int =
        getApplication<Application>()
            .getSystemService(BatteryManager::class.java)
            ?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
            ?: -1
}

@Composable
private fun RelayTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = lightColorScheme(
            primary = Color(0xFF5C4300),
            secondary = Color(0xFF725B00),
            primaryContainer = Color(0xFFFFE082),
            background = Color(0xFFFFFBF2),
        ),
        content = content,
    )
}

@Composable
private fun RelayApp(state: RelayUiState, viewModel: RelayViewModel) {
    val context = LocalContext.current
    if (state.showWizard) {
        SetupWizard(
            state = state,
            onComplete = viewModel::completeWizard,
            onClose = viewModel::closeSettings,
            openNotificationAccess = { openNotificationAccess(context) },
            openBatterySettings = { openBatterySettings(context) },
        )
    } else {
        Dashboard(
            state = state,
            onServerTest = viewModel::runServerTest,
            onParserTest = viewModel::runParserTest,
            onNotificationAccess = { openNotificationAccess(context) },
            onSettings = viewModel::showSettings,
        )
    }
}

@Composable
private fun Dashboard(
    state: RelayUiState,
    onServerTest: () -> Unit,
    onParserTest: () -> Unit,
    onNotificationAccess: () -> Unit,
    onSettings: () -> Unit,
) {
    Scaffold { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                Spacer(Modifier.height(8.dp))
                Text(
                    text = "KB Deposit Relay",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                )
                Text("${state.settings.deviceName} · ${state.settings.deviceId}")
                Text(
                    if (state.settings.serverPhone.isBlank()) {
                        "서버폰 번호: 미설정"
                    } else {
                        "서버폰: ${state.settings.serverPhone}"
                    },
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    HealthCard(
                        "알림 접근",
                        if (state.listenerGranted) "정상" else "권한 필요",
                        state.listenerGranted,
                        Modifier.weight(1f),
                    )
                    HealthCard(
                        "서버",
                        state.settings.lastServerMessage,
                        state.settings.lastServerSuccess,
                        Modifier.weight(1f),
                    )
                    HealthCard(
                        "배터리",
                        if (state.batteryOptimizationDisabled) "제외됨" else "설정 필요",
                        state.batteryOptimizationDisabled,
                        Modifier.weight(1f),
                    )
                }
            }
            item {
                Card(Modifier.fillMaxWidth()) {
                    Column(
                        Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        Text("운영 현황", fontWeight = FontWeight.Bold)
                        Text("마지막 Heartbeat: ${formatMillis(state.settings.lastHeartbeatAt)}")
                        Text(
                            "마지막 입금: ${
                                state.recentEvents.firstOrNull { !it.isTest }?.transactionAt ?: "없음"
                            }",
                        )
                        Text("대기 중 이벤트: ${state.pendingCount}건")
                    }
                }
            }
            state.message?.let { message ->
                item {
                    Text(
                        message,
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(
                                MaterialTheme.colorScheme.primaryContainer,
                                RoundedCornerShape(8.dp),
                            )
                            .padding(12.dp),
                    )
                }
            }
            item {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(onClick = onServerTest, modifier = Modifier.fillMaxWidth()) {
                        Text("서버 테스트")
                    }
                    OutlinedButton(onClick = onParserTest, modifier = Modifier.fillMaxWidth()) {
                        Text("KB 파서 테스트 (결제 처리 안 함)")
                    }
                    OutlinedButton(
                        onClick = onNotificationAccess,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("알림 접근 설정")
                    }
                    OutlinedButton(onClick = onSettings, modifier = Modifier.fillMaxWidth()) {
                        Text("설정")
                    }
                }
            }
            item {
                Text("최근 이벤트", style = MaterialTheme.typography.titleLarge)
            }
            if (state.recentEvents.isEmpty()) {
                item { Text("저장된 파싱 이벤트가 없습니다.") }
            } else {
                items(state.recentEvents, key = DepositEventEntity::eventId) { event ->
                    EventCard(event)
                }
            }
            item { Spacer(Modifier.height(16.dp)) }
        }
    }
}

@Composable
private fun HealthCard(
    title: String,
    detail: String,
    healthy: Boolean,
    modifier: Modifier = Modifier,
) {
    Card(modifier) {
        Column(Modifier.padding(10.dp)) {
            Text(title, fontWeight = FontWeight.Bold)
            Text(
                detail,
                color = if (healthy) Color(0xFF1B5E20) else MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall,
                maxLines = 2,
            )
        }
    }
}

@Composable
private fun EventCard(event: DepositEventEntity) {
    Card(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(14.dp)) {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text(
                    if (event.isTest) "테스트 · ${event.depositorName}" else event.depositorName,
                    fontWeight = FontWeight.Bold,
                )
                Text(event.status)
            }
            Text("${event.amount.toString().withThousandsSeparator()}원 · ${event.accountMask}")
            Text(event.transactionAt, style = MaterialTheme.typography.bodySmall)
            event.lastError?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        }
    }
}

@Composable
private fun SetupWizard(
    state: RelayUiState,
    onComplete: (String, String, String, String, String, String) -> Unit,
    onClose: () -> Unit,
    openNotificationAccess: () -> Unit,
    openBatterySettings: () -> Unit,
) {
    var step by rememberSaveable { mutableIntStateOf(1) }
    var deviceId by rememberSaveable(state.settings.deviceId) {
        mutableStateOf(state.settings.deviceId)
    }
    var deviceName by rememberSaveable(state.settings.deviceName) {
        mutableStateOf(state.settings.deviceName)
    }
    var phone by rememberSaveable(state.settings.serverPhone) {
        mutableStateOf(state.settings.serverPhone)
    }
    var serverUrl by rememberSaveable(state.settings.serverUrl) {
        mutableStateOf(state.settings.serverUrl)
    }
    var selectedPackage by rememberSaveable(state.settings.selectedSmsPackage) {
        mutableStateOf(
            state.settings.selectedSmsPackage.ifBlank {
                state.smsPackages.firstOrNull { it.isDefault }?.packageName
                    ?: state.smsPackages.firstOrNull()?.packageName.orEmpty()
            },
        )
    }
    var customPackage by rememberSaveable { mutableStateOf(selectedPackage) }
    var secret by rememberSaveable { mutableStateOf("") }

    Scaffold { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            item {
                Text(
                    "KB Deposit Relay 설정",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                )
                Text("5단계 중 $step")
            }
            when (step) {
                1 -> item {
                    WizardCard(
                        "1. 역할과 개인정보",
                        "선택한 메시지 앱의 알림만 확인하고, KB 입금 알림에서 파싱한 계좌 마스크·입금자명·금액·시각만 저장합니다. 알림 원문이나 SMS 원문은 저장·로그·업로드하지 않습니다.",
                    )
                }

                2 -> item {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        WizardCard(
                            "2. 서버폰과 서버",
                            "실제 전화번호와 운영 URL은 이 기기 또는 Git에서 제외된 local.properties에만 입력하세요.",
                        )
                        OutlinedTextField(
                            deviceId,
                            { deviceId = it },
                            label = { Text("기기 ID") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                        )
                        OutlinedTextField(
                            deviceName,
                            { deviceName = it },
                            label = { Text("기기 이름") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                        )
                        OutlinedTextField(
                            phone,
                            { phone = it },
                            label = { Text("서버폰 번호 (로컬 전용)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                        )
                        OutlinedTextField(
                            serverUrl,
                            { serverUrl = it },
                            label = { Text("서버 URL (HTTPS)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri),
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                        )
                    }
                }

                3 -> item {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        WizardCard(
                            "3. Device Secret",
                            "서버에 등록한 것과 같은 Secret을 입력합니다. Android Keystore의 AES/GCM 키로 암호화해 이 기기에만 보관합니다.",
                        )
                        OutlinedTextField(
                            secret,
                            { secret = it },
                            label = {
                                Text(if (state.hasSecret) "새 Secret (비우면 기존 유지)" else "Device Secret")
                            },
                            visualTransformation = PasswordVisualTransformation(),
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                        )
                    }
                }

                4 -> item {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        WizardCard(
                            "4. 메시지 앱과 알림 접근",
                            "기본 SMS 앱과 설치된 Samsung Messages/Google Messages 중 KB 알림을 실제로 표시하는 package를 선택하세요. SMS 읽기 권한은 사용하지 않습니다.",
                        )
                        state.smsPackages.forEach { option ->
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.fillMaxWidth(),
                            ) {
                                RadioButton(
                                    selected = selectedPackage == option.packageName,
                                    onClick = {
                                        selectedPackage = option.packageName
                                        customPackage = option.packageName
                                    },
                                )
                                Text(
                                    "${option.label}${if (option.isDefault) " (기본)" else ""}\n${option.packageName}",
                                )
                            }
                        }
                        OutlinedTextField(
                            customPackage,
                            {
                                customPackage = it
                                selectedPackage = it.trim()
                            },
                            label = { Text("package 직접 입력/덮어쓰기") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                        )
                        Button(
                            onClick = openNotificationAccess,
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Text("알림 접근 허용 화면 열기")
                        }
                        Text(
                            if (state.listenerGranted) "현재 알림 접근: 허용됨" else "현재 알림 접근: 허용 필요",
                        )
                    }
                }

                5 -> item {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        WizardCard(
                            "5. 배터리와 최종 확인",
                            "Samsung 설정에서 앱 배터리를 '제한 없음'으로 지정하고 절전 앱/자동 최적화 대상에서 제외하세요. 이 앱은 접근성이나 SMS 권한을 요청하지 않습니다.",
                        )
                        Button(
                            onClick = openBatterySettings,
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Text("배터리 최적화 설정 열기")
                        }
                        Text(
                            if (state.batteryOptimizationDisabled) {
                                "현재 상태: 배터리 최적화 제외됨"
                            } else {
                                "현재 상태: 최적화 대상일 수 있음"
                            },
                        )
                        Text("선택 package: $selectedPackage")
                        Text("완료 후 서버 테스트와 KB 파서 테스트를 실행하세요.")
                    }
                }
            }
            state.message?.let { item { Text(it, color = MaterialTheme.colorScheme.error) } }
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    if (step > 1) {
                        OutlinedButton(
                            onClick = { step-- },
                            modifier = Modifier.weight(1f),
                        ) {
                            Text("이전")
                        }
                    } else if (state.settings.wizardCompleted) {
                        OutlinedButton(
                            onClick = onClose,
                            modifier = Modifier.weight(1f),
                        ) {
                            Text("취소")
                        }
                    }
                    Button(
                        onClick = {
                            if (step < 5) {
                                step++
                            } else {
                                onComplete(
                                    deviceId,
                                    deviceName,
                                    phone,
                                    serverUrl,
                                    selectedPackage,
                                    secret,
                                )
                            }
                        },
                        modifier = Modifier.weight(1f),
                    ) {
                        Text(if (step < 5) "다음" else "저장하고 시작")
                    }
                }
            }
        }
    }
}

@Composable
private fun WizardCard(title: String, body: String) {
    Card(Modifier.fillMaxWidth()) {
        Column(
            Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text(body)
        }
    }
}

private fun openNotificationAccess(context: Context) {
    val component = ComponentName(context, KbNotificationListenerService::class.java)
    val detailIntent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_DETAIL_SETTINGS)
        .putExtra(Settings.EXTRA_NOTIFICATION_LISTENER_COMPONENT_NAME, component.flattenToString())
    runCatching { context.startActivity(detailIntent) }
        .onFailure {
            context.startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
        }
}

private fun openBatterySettings(context: Context) {
    context.startActivity(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))
}

private fun formatMillis(value: Long?): String {
    if (value == null) return "없음"
    return DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
        .withZone(ZoneId.of("Asia/Seoul"))
        .format(Instant.ofEpochMilli(value))
}

private fun String.withThousandsSeparator(): String =
    reversed().chunked(3).joinToString(",").reversed()
