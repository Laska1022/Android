plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.android.library) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.jvm) apply false
    alias(libs.plugins.kotlin.compose) apply false
}
// Include the platform-independent contract tests in the documented Android gate.
tasks.register("testDebugUnitTest") {
    dependsOn(":core:model:test", ":app:testDebugUnitTest", ":core:hardware:testDebugUnitTest", ":core:designsystem:testDebugUnitTest")
}

allprojects {
    dependencyLocking { lockAllConfigurations() }
}
