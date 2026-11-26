package com.laska.robotvsaliens;

import android.app.Activity;
import android.content.pm.ActivityInfo;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "GameOrientation")
public class GameOrientationPlugin extends Plugin {
    private static final String PREFERENCE = "orientationMode";
    private static final String LANDSCAPE = "landscape";
    private static final String FOLLOW = "follow";

    static String readMode(Activity activity) {
        return activity.getPreferences(Activity.MODE_PRIVATE).getString(PREFERENCE, LANDSCAPE);
    }

    static void applyMode(Activity activity, String mode) {
        int orientation = FOLLOW.equals(mode)
                ? ActivityInfo.SCREEN_ORIENTATION_USER
                : ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE;
        if (activity.getRequestedOrientation() != orientation) {
            activity.setRequestedOrientation(orientation);
        }
    }

    @PluginMethod
    public void getMode(PluginCall call) {
        call.resolve(new JSObject().put("mode", readMode(getActivity())));
    }

    @PluginMethod
    public void setMode(PluginCall call) {
        String mode = call.getString("mode");
        if (!LANDSCAPE.equals(mode) && !FOLLOW.equals(mode)) {
            call.reject("Unknown orientation mode.");
            return;
        }
        Activity activity = getActivity();
        // Plugin calls run on Capacitor's worker thread. Persist before reporting success.
        if (!activity.getPreferences(Activity.MODE_PRIVATE).edit().putString(PREFERENCE, mode).commit()) {
            call.reject("Could not save the orientation preference.");
            return;
        }
        activity.runOnUiThread(() -> {
            applyMode(activity, mode);
            call.resolve();
        });
    }
}
