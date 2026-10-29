package com.laska.devicescope.core.hardware

import android.opengl.EGL14 as E
import android.opengl.GLES20 as G
import com.laska.devicescope.core.model.Reading
import kotlinx.coroutines.CancellationException

/** Called on IO, never the UI thread. Every partial setup path is cleaned up. */
internal fun readGpuStrings(): Reading<Map<Int, String?>> {
    val previousDisplay = E.eglGetCurrentDisplay()
    val previousContext = E.eglGetCurrentContext()
    val previousDraw = E.eglGetCurrentSurface(E.EGL_DRAW)
    val previousRead = E.eglGetCurrentSurface(E.EGL_READ)
    val display = E.eglGetDisplay(E.EGL_DEFAULT_DISPLAY)
    if (display == E.EGL_NO_DISPLAY) return Reading.Error("EGL display unavailable")
    var initialized = false
    var context = E.EGL_NO_CONTEXT
    var surface = E.EGL_NO_SURFACE
    return try {
        check(E.eglInitialize(display, IntArray(2), 0, IntArray(2), 0))
        initialized = true
        val configs = arrayOfNulls<android.opengl.EGLConfig>(1)
        val count = IntArray(1)
        check(E.eglChooseConfig(display, intArrayOf(E.EGL_RENDERABLE_TYPE, E.EGL_OPENGL_ES2_BIT,
            E.EGL_SURFACE_TYPE, E.EGL_PBUFFER_BIT, E.EGL_NONE), 0, configs, 0, 1, count, 0) && count[0] > 0)
        context = E.eglCreateContext(display, configs[0], E.EGL_NO_CONTEXT, intArrayOf(E.EGL_CONTEXT_CLIENT_VERSION, 2, E.EGL_NONE), 0)
        check(context != E.EGL_NO_CONTEXT)
        surface = E.eglCreatePbufferSurface(display, configs[0], intArrayOf(E.EGL_WIDTH, 1, E.EGL_HEIGHT, 1, E.EGL_NONE), 0)
        check(surface != E.EGL_NO_SURFACE)
        check(E.eglMakeCurrent(display, surface, surface, context))
        Reading.Available(listOf(G.GL_VENDOR, G.GL_RENDERER, G.GL_VERSION).associateWith { G.glGetString(it) })
    } catch (cancelled: CancellationException) { throw cancelled
    } catch (_: Exception) { Reading.Error("Android could not initialize a public OpenGL context")
    } finally {
        if (initialized) {
            if (previousDisplay != E.EGL_NO_DISPLAY && previousContext != E.EGL_NO_CONTEXT)
                E.eglMakeCurrent(previousDisplay, previousDraw, previousRead, previousContext)
            else E.eglMakeCurrent(display, E.EGL_NO_SURFACE, E.EGL_NO_SURFACE, E.EGL_NO_CONTEXT)
            if (surface != E.EGL_NO_SURFACE) E.eglDestroySurface(display, surface)
            if (context != E.EGL_NO_CONTEXT) E.eglDestroyContext(display, context)
            E.eglTerminate(display)
        }
    }
}
