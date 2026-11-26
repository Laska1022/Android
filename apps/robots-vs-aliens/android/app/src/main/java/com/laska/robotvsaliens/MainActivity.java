package com.laska.robotvsaliens;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Set the saved orientation before Capacitor creates and lays out the WebView.
        GameOrientationPlugin.applyMode(this, GameOrientationPlugin.readMode(this));
        registerPlugin(GameOrientationPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
