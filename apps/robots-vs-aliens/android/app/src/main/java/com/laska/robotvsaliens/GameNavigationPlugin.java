package com.laska.robotvsaliens;

import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.Lifecycle;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.WebViewListener;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "GameNavigation")
public class GameNavigationPlugin extends Plugin {
    private boolean registered;
    private final OnBackPressedCallback back = new OnBackPressedCallback(false) {
        @Override
        public void handleOnBackPressed() {
            AppCompatActivity activity = getActivity();
            // dispatchEvent returns false when the game acknowledges Back with preventDefault().
            getBridge().getWebView().evaluateJavascript(
                    "window.dispatchEvent(new Event('rvaBack', {cancelable:true}))",
                    result -> {
                        if (!"false".equals(result) && isEnabled()
                                && activity.getLifecycle().getCurrentState().isAtLeast(Lifecycle.State.STARTED)) {
                            // A missing listener must leave Android free to handle this same press.
                            setEnabled(false);
                            activity.getOnBackPressedDispatcher().onBackPressed();
                        }
                    });
        }
    };
    private final WebViewListener navigation = new WebViewListener() {
        @Override
        public void onPageStarted(WebView view) {
            back.setEnabled(false);
        }
    };

    @PluginMethod
    public void setHandled(PluginCall call) {
        Boolean handled = call.getBoolean("handled");
        if (handled == null) {
            call.reject("Expected a boolean Back handling state.");
            return;
        }
        AppCompatActivity activity = getActivity();
        activity.runOnUiThread(() -> {
            if (activity.isFinishing() || activity.isDestroyed()) {
                call.resolve();
                return;
            }
            if (!registered) {
                activity.getOnBackPressedDispatcher().addCallback(activity, back);
                getBridge().addWebViewListener(navigation);
                registered = true;
            }
            back.setEnabled(handled);
            call.resolve();
        });
    }

    @Override
    protected void handleOnDestroy() {
        if (registered) getBridge().removeWebViewListener(navigation);
    }
}
