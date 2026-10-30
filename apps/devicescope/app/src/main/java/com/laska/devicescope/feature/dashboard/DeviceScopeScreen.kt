package com.laska.devicescope.feature.dashboard

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.saveable.rememberSaveableStateHolder
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.semantics.*
import androidx.compose.ui.unit.dp
import com.laska.devicescope.R
import com.laska.devicescope.core.designsystem.ScopeGlyph
import com.laska.devicescope.core.hardware.HardwareMetrics
import com.laska.devicescope.core.hardware.findMetric
import com.laska.devicescope.core.model.*
import com.laska.devicescope.feature.details.*
import java.text.DateFormat
import java.util.Date
import java.util.Locale

data class ExplorerState(
    val snapshot: HardwareSnapshot? = null,
    val collecting: Boolean = false,
    val nowElapsedMillis: Long = 0,
    val failed: Boolean = false,
)

private val destinationLabels = listOf(R.string.overview, R.string.hardware, R.string.monitor, R.string.reports)

/** Pure UI boundary; fixtures are provided only by test sources with a visible sample banner. */
@Composable
fun DeviceScopeScreen(
    state: ExplorerState,
    modifier: Modifier = Modifier,
    sampleData: Boolean = false,
    onCollectionNeeded: (Boolean) -> Unit = {},
    onRetry: () -> Unit = {},
) {
    var destination by rememberSaveable { mutableIntStateOf(0) }
    var sectionId by rememberSaveable { mutableStateOf<String?>(null) }
    var detailId by rememberSaveable { mutableStateOf<String?>(null) }
    val fontScale = LocalDensity.current.fontScale
    val locale = LocalConfiguration.current.locales[0] ?: Locale.getDefault()
    val contentState = rememberSaveableStateHolder()
    LaunchedEffect(destination) { onCollectionNeeded(destination <= 1) }
    BoxWithConstraints(modifier.fillMaxSize()) {
        val rail = maxWidth >= 600.dp && fontScale <= 1.3f
        val twoPane = maxWidth >= 840.dp && fontScale <= 1.3f
        val compactNav = maxWidth < 360.dp || fontScale > 1.3f
        val overviewColumns = maxWidth >= 600.dp && fontScale <= 1.3f
        val selected = hardwareSections.firstOrNull { it.id == sectionId }
        BackHandler(enabled = detailId == null && destination != 0) {
            if (destination == 1 && sectionId != null && !twoPane) sectionId = null
            else { destination = 0; sectionId = null }
        }
        fun navigate(index: Int) { destination = index; detailId = null }
        Scaffold(
            containerColor = MaterialTheme.colorScheme.background,
            topBar = {
                Surface(color = MaterialTheme.colorScheme.background) {
                    Column(Modifier.statusBarsPadding().padding(horizontal = 20.dp, vertical = 12.dp)) {
                        if (sampleData) Text(stringResource(R.string.sample_data), color = MaterialTheme.colorScheme.primary,
                            style = MaterialTheme.typography.labelLarge, modifier = Modifier.testTag("sample-banner"))
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            ScopeGlyph(0, Modifier.padding(top = 4.dp))
                            Text(stringResource(R.string.app_name), style = MaterialTheme.typography.titleLarge)
                        }
                        if (destination == 1 && sectionId != null && !twoPane) {
                            TextButton(onClick = { sectionId = null }, modifier = Modifier.testTag("back-to-hardware")) { Text(stringResource(R.string.back_hardware)) }
                        }
                        Text(stringResource(if (destination == 1 && selected != null && !twoPane) selected.title else destinationLabels[destination]),
                            style = MaterialTheme.typography.headlineMedium, modifier = Modifier.semantics { heading() })
                    }
                }
            },
            bottomBar = { if (!rail) AppNavigation(destination, compactNav, ::navigate) },
        ) { insets ->
            Row(Modifier.fillMaxSize().padding(insets)) {
                if (rail) NavigationRail {
                    destinationLabels.forEachIndexed { index, label ->
                        NavigationRailItem(selected = destination == index, onClick = { navigate(index) },
                            icon = { ScopeGlyph(index) }, label = { Text(stringResource(label)) },
                            modifier = Modifier.testTag("nav-$index"))
                    }
                }
                Box(Modifier.weight(1f).fillMaxHeight()) {
                    contentState.SaveableStateProvider(destination) {
                    when {
                        destination >= 2 -> PlannedPage(destination)
                        state.failed -> MessagePage(R.string.read_failed, R.string.read_failed_hint, onRetry)
                        destination == 0 -> Overview(state, locale, overviewColumns,
                            onDetail = { detailId = it }, onSection = { destination = 1; sectionId = it })
                        else -> Hardware(state, locale, selected, twoPane,
                            onSection = { sectionId = it }, onDetail = { detailId = it })
                    }
                    }
                }
            }
        }
        detailId?.let { id ->
            val field = fieldFor(id)
            SourceDialog(field, presentation(state, field, locale), locale, onDismiss = { detailId = null })
        }
    }
}

@Composable
private fun AppNavigation(destination: Int, stacked: Boolean, onNavigate: (Int) -> Unit) {
    Surface(tonalElevation = 3.dp) {
        if (stacked) Column(Modifier.navigationBarsPadding().padding(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf(listOf(0, 1), listOf(2, 3)).forEach { row ->
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    row.forEach { index ->
                        OutlinedButton(onClick = { onNavigate(index) }, modifier = Modifier.weight(1f).heightIn(min = 48.dp)
                            .testTag("nav-$index").semantics { selected = destination == index },
                            colors = ButtonDefaults.outlinedButtonColors(containerColor = if (destination == index)
                                MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface)) {
                            Text(stringResource(destinationLabels[index]))
                        }
                    }
                }
            }
        } else NavigationBar {
            destinationLabels.forEachIndexed { index, label ->
                NavigationBarItem(selected = destination == index, onClick = { onNavigate(index) },
                    icon = { ScopeGlyph(index) }, label = { Text(stringResource(label)) }, modifier = Modifier.testTag("nav-$index"))
            }
        }
    }
}

@Composable
private fun Overview(state: ExplorerState, locale: Locale, columns: Boolean, onDetail: (String) -> Unit, onSection: (String) -> Unit) {
    LazyColumn(Modifier.fillMaxSize().testTag("overview-list"), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(stringResource(R.string.know_device), color = MaterialTheme.colorScheme.primary, style = MaterialTheme.typography.titleMedium)
                val identity = listOf(HardwareMetrics.DEVICE_MANUFACTURER.id, HardwareMetrics.DEVICE_MODEL.id).mapNotNull { id ->
                    (state.snapshot?.findMetric(id)?.result as? Reading.Available<*>)?.value as? String
                }.distinct().joinToString(" · ")
                if (identity.isNotBlank()) Text(identity, style = MaterialTheme.typography.titleLarge)
                Text(stringResource(if (state.snapshot == null) R.string.loading else if (state.collecting) R.string.collecting else R.string.collection_paused),
                    style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        items(overviewFields.chunked(if (columns) 2 else 1), key = { it.first().id }) { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                row.forEach { field -> MetricCard(field, presentation(state, field, locale), state.nowElapsedMillis,
                    Modifier.weight(1f), onDetail = { onDetail(field.id) }) }
            }
        }
        item { SectionLink(R.string.battery, R.string.battery_pending, "battery", onSection) }
        item { SectionLink(R.string.thermals, R.string.thermal_pending, "thermals", onSection) }
        item { Text(stringResource(R.string.privacy_note), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant) }
    }
}

@Composable
private fun SectionLink(title: Int, subtitle: Int, id: String, onSection: (String) -> Unit) {
    OutlinedCard(onClick = { onSection(id) }, modifier = Modifier.fillMaxWidth().testTag("open-$id"), shape = RoundedCornerShape(20.dp)) {
        Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(stringResource(title), style = MaterialTheme.typography.titleLarge)
            Text(stringResource(subtitle), style = MaterialTheme.typography.bodyMedium)
            Text(stringResource(R.string.view_details), color = MaterialTheme.colorScheme.primary)
        }
    }
}

@Composable
private fun Hardware(state: ExplorerState, locale: Locale, selected: HardwareSection?, twoPane: Boolean, onSection: (String) -> Unit, onDetail: (String) -> Unit) {
    val detailState = rememberSaveableStateHolder()
    val activeSection = selected ?: hardwareSections.first().takeIf { twoPane }
    Row(Modifier.fillMaxSize()) {
        if (twoPane || selected == null) LazyColumn(
            Modifier.then(if (twoPane) Modifier.width(256.dp) else Modifier.fillMaxWidth()).testTag("hardware-list"),
            contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(hardwareSections, key = { it.id }) { section ->
                OutlinedButton(onClick = { onSection(section.id) }, modifier = Modifier.fillMaxWidth().heightIn(min = 56.dp)
                    .testTag("section-${section.id}").semantics { this.selected = activeSection?.id == section.id },
                    colors = ButtonDefaults.outlinedButtonColors(containerColor = if (activeSection?.id == section.id)
                        MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface)) {
                    Text(stringResource(section.title), modifier = Modifier.fillMaxWidth())
                }
            }
        }
        val detail = activeSection
        if (detail != null) detailState.SaveableStateProvider(detail.id) {
            SectionDetails(detail, state, locale, Modifier.weight(1f), onDetail)
        }
    }
}

@Composable
private fun SectionDetails(section: HardwareSection, state: ExplorerState, locale: Locale, modifier: Modifier, onDetail: (String) -> Unit) {
    val fields = if (section.id == "cameras") section.fields + state.snapshot?.measurements.orEmpty()
        .filter { it.key.id.startsWith("camera.id_") }.map { fieldFor(it.key.id) } else section.fields
    LazyColumn(modifier.fillMaxHeight().testTag("detail-list"), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item { Text(stringResource(section.title), style = MaterialTheme.typography.titleLarge, modifier = Modifier.semantics { heading() }) }
        if (section.id == "battery" || section.id == "thermals") item {
            Text(stringResource(if (section.id == "battery") R.string.battery_pending else R.string.thermal_pending), style = MaterialTheme.typography.bodyLarge)
        }
        items(fields, key = { it.id }) { field -> MetricCard(field, presentation(state, field, locale), state.nowElapsedMillis,
            onDetail = { onDetail(field.id) }) }
    }
}

private fun fieldFor(id: String): MetricField = (hardwareSections.flatMap { it.fields } + overviewFields).firstOrNull { it.id == id }
    ?: MetricField(id, when (id.substringAfterLast('.')) {
        "facing" -> R.string.camera_facing; "hardware_level" -> R.string.camera_level; "focal_lengths" -> R.string.focal_lengths; else -> R.string.metric
    })

private fun presentation(state: ExplorerState, field: MetricField, locale: Locale) = if (state.failed)
    MetricPresentation(DisplayState.ERROR)
else presentMetric(
    state.snapshot?.findMetric(field.id), state.snapshot?.capabilities?.firstOrNull { it.key.id == field.id },
    state.nowElapsedMillis, state.collecting, state.snapshot != null, locale)

@Composable
private fun MetricCard(field: MetricField, p: MetricPresentation, now: Long, modifier: Modifier = Modifier, onDetail: () -> Unit) {
    val title = stringResource(field.label)
    val status = stringResource(stateLabel(p.state))
    val empty = p.value == ""
    val value = if (empty) stringResource(R.string.empty_inventory) else p.value ?: status
    val source = p.source ?: stringResource(R.string.no_sample)
    val freshness = ageLabel(p, now)
    val provenance = p.provenance?.let { stringResource(provenanceLabel(it)) }
    val camera = if (field.id.startsWith("camera.id_")) stringResource(R.string.camera_identity, field.id.substringBeforeLast('.').removePrefix("camera.")) else null
    val spoken = listOf(title, camera, if (empty) value else p.spokenValue ?: status, if (p.value != null) status else null, provenance,
        p.explanation, source, freshness).filterNotNull().joinToString(". ")
    val actionLabel = stringResource(R.string.open_source)
    OutlinedCard(onClick = onDetail, modifier = modifier.fillMaxWidth().clearAndSetSemantics {
        contentDescription = spoken; role = Role.Button; testTag = "metric-${field.id}"
        onClick(actionLabel) { onDetail(); true }
    }, shape = RoundedCornerShape(20.dp), border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)) {
        Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium)
            camera?.let { Text(it, style = MaterialTheme.typography.bodyMedium) }
            Text(value, style = if (p.value != null && p.value.length < 36) MaterialTheme.typography.headlineMedium else MaterialTheme.typography.bodyLarge)
            if (p.value != null) Text(status, style = MaterialTheme.typography.labelLarge,
                color = if (p.state == DisplayState.AVAILABLE) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant)
            p.explanation?.let { Text(it, style = MaterialTheme.typography.bodyMedium) }
            provenance?.let { Text(it, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant) }
            field.hint?.let { Text(stringResource(it), style = MaterialTheme.typography.bodyMedium) }
            Text(source, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(freshness, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(actionLabel, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
        }
    }
}

@Composable
private fun ageLabel(p: MetricPresentation, now: Long): String {
    val sampled = p.sampledAt ?: return stringResource(R.string.no_sample)
    if (p.intervalMillis == 0L) return stringResource(R.string.read_this_visit)
    val age = now - sampled.elapsedRealtimeMillis
    if (age < 0) return stringResource(R.string.sample_clock_changed)
    val seconds = age / 1_000
    return pluralStringResource(R.plurals.sample_age, seconds.coerceAtMost(Int.MAX_VALUE.toLong()).toInt(), seconds)
}

private fun provenanceLabel(value: Provenance) = when (value) {
    Provenance.REPORTED -> R.string.reported
    Provenance.MEASURED -> R.string.measured
    Provenance.ESTIMATED -> R.string.estimated
}

private fun stateLabel(state: DisplayState) = when (state) {
    DisplayState.AVAILABLE -> R.string.available; DisplayState.STALE -> R.string.stale
    DisplayState.PAUSED -> R.string.paused; DisplayState.UNSUPPORTED -> R.string.unavailable
    DisplayState.PERMISSION -> R.string.permission_needed; DisplayState.WAITING -> R.string.waiting
    DisplayState.ERROR -> R.string.read_failed; DisplayState.LOADING -> R.string.loading
    DisplayState.NOT_IMPLEMENTED -> R.string.not_in_version
}

@Composable
private fun SourceDialog(field: MetricField, p: MetricPresentation, locale: Locale, onDismiss: () -> Unit) {
    AlertDialog(onDismissRequest = onDismiss, title = { Text(stringResource(field.label)) },
        text = {
            Column(Modifier.verticalScroll(rememberScrollState()).testTag("source-details"), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(stringResource(stateLabel(p.state)))
                p.value?.let { Text(it.ifEmpty { stringResource(R.string.empty_inventory) }) }
                p.exactValue?.let { Text(it) }
                p.explanation?.let { Text(it) }
                if (p.state == DisplayState.PERMISSION) Text(stringResource(R.string.permission_restriction))
                Text(stringResource(R.string.source_label, p.source ?: stringResource(R.string.no_sample)))
                p.provenance?.let { Text(stringResource(provenanceLabel(it))) }
                p.sampledAt?.let { Text(stringResource(R.string.sample_time, DateFormat.getDateTimeInstance(DateFormat.MEDIUM, DateFormat.LONG, locale).format(Date(it.epochMillis)))) }
                field.hint?.let { Text(stringResource(it)) }
            }
        }, confirmButton = { TextButton(onClick = onDismiss) { Text(stringResource(R.string.close)) } })
}

@Composable
private fun PlannedPage(destination: Int) {
    MessagePage(if (destination == 2) R.string.monitor_pending_title else R.string.reports_pending_title,
        if (destination == 2) R.string.monitor_pending_hint else R.string.reports_pending_hint)
}

@Composable
private fun MessagePage(title: Int, description: Int, onRetry: (() -> Unit)? = null) {
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text(stringResource(title), style = MaterialTheme.typography.titleLarge)
        Text(stringResource(description), style = MaterialTheme.typography.bodyLarge)
        if (onRetry != null) Button(onClick = onRetry, modifier = Modifier.heightIn(min = 48.dp).testTag("retry")) { Text(stringResource(R.string.retry)) }
    }
}
