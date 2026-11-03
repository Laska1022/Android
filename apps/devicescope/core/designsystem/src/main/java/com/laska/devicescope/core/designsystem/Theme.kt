package com.laska.devicescope.core.designsystem

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColors = lightColorScheme(
    primary = Color(0xFF005B63), onPrimary = Color.White,
    primaryContainer = Color(0xFFD9F1F0), onPrimaryContainer = Color(0xFF17212E),
    background = Color(0xFFF5F7FA), onBackground = Color(0xFF17212E),
    surface = Color.White, onSurface = Color(0xFF17212E),
    surfaceVariant = Color(0xFFF5F7FA), onSurfaceVariant = Color(0xFF4B596B),
    outline = Color(0xFF697889), error = Color(0xFFAB2530),
    secondaryContainer = Color(0xFFD9F1F0), onSecondaryContainer = Color(0xFF005B63),
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF7ED5D0), onPrimary = Color(0xFF0D151C),
    primaryContainer = Color(0xFF183E43), onPrimaryContainer = Color(0xFFE8EFF4),
    background = Color(0xFF0D151C), onBackground = Color(0xFFE8EFF4),
    surface = Color(0xFF15212C), onSurface = Color(0xFFE8EFF4),
    surfaceVariant = Color(0xFF15212C), onSurfaceVariant = Color(0xFFB1C2CF),
    outline = Color(0xFF8195A5), error = Color(0xFFFFB4B8),
    secondaryContainer = Color(0xFF183E43), onSecondaryContainer = Color(0xFF7ED5D0),
)

/** Original accessible palette; system theme by default, no remote font or dynamic colors. */
@Composable
fun DeviceScopeTheme(darkTheme: Boolean = isSystemInDarkTheme(), content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = if (darkTheme) DarkColors else LightColors, content = content)
}
