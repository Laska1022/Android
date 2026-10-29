package com.laska.devicescope.core.hardware

import com.laska.devicescope.core.model.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

internal interface HardwareSource {
    fun inventory(): HardwareSnapshot
    fun current(): HardwareSnapshot
}

internal class PollingHardwareRepository(
    private val source: HardwareSource,
    private val intervalMillis: Long = 2_000,
    private val dispatcher: CoroutineDispatcher = Dispatchers.IO,
) : HardwareRepository {
    init { require(intervalMillis > 0) }
    override fun observe(): Flow<HardwareSnapshot> = flow {
        val inventory = source.inventory()
        while (currentCoroutineContext().isActive) {
            currentCoroutineContext().ensureActive()
            val current = source.current()
            emit(HardwareSnapshot(inventory.measurements + current.measurements,
                inventory.capabilities + current.capabilities))
            delay(intervalMillis)
        }
    }.buffer(0).flowOn(dispatcher) // Bound work in flight when a screen consumes slowly.
}
