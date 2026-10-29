package com.laska.devicescope.core.designsystem

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp

/** Original decorative glyphs; the containing navigation action supplies its text label. */
@Composable
fun ScopeGlyph(kind: Int, modifier: Modifier = Modifier) {
    val color = MaterialTheme.colorScheme.primary
    Canvas(modifier.size(24.dp)) {
        val u = size.minDimension / 24f
        val stroke = Stroke(1.8f * u)
        when (kind) {
            1 -> {
                drawRoundRect(color, Offset(5*u, 5*u), Size(14*u, 14*u), CornerRadius(3*u), style = stroke)
                for (i in listOf(8f, 16f)) {
                    drawLine(color, Offset(i*u, 2*u), Offset(i*u, 5*u), 1.8f*u)
                    drawLine(color, Offset(i*u, 19*u), Offset(i*u, 22*u), 1.8f*u)
                    drawLine(color, Offset(2*u, i*u), Offset(5*u, i*u), 1.8f*u)
                    drawLine(color, Offset(19*u, i*u), Offset(22*u, i*u), 1.8f*u)
                }
            }
            2 -> {
                val path = Path().apply { moveTo(2*u,16*u); lineTo(7*u,16*u); lineTo(10*u,6*u); lineTo(14*u,19*u); lineTo(17*u,11*u); lineTo(22*u,11*u) }
                drawPath(path, color, style = stroke)
            }
            3 -> {
                drawRoundRect(color, Offset(5*u, 3*u), Size(14*u, 18*u), CornerRadius(2*u), style = stroke)
                for (y in listOf(8f,12f,16f)) drawLine(color, Offset(9*u,y*u), Offset(15*u,y*u), 1.8f*u)
            }
            else -> {
                drawRoundRect(color, Offset(2*u, 2*u), Size(20*u, 20*u), CornerRadius(6*u), style = stroke)
                drawLine(color, Offset(9*u,7*u), Offset(9*u,17*u), 2.5f*u)
                drawLine(color, Offset(15*u,11*u), Offset(15*u,17*u), 2.5f*u)
            }
        }
    }
}
