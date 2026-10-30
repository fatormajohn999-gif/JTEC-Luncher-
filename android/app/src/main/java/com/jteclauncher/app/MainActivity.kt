package com.jteclauncher.app

import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        // Register the custom JTEC Launcher native plugin before super.onCreate
        registerPlugin(JTECLauncherPlugin::class.java)
        super.onCreate(savedInstanceState)
    }

    override fun onBackPressed() {
        // As an Android HOME launcher, pressing Back on the home screen should not exit
        // or close the launcher. Capacitor's Bridge handles webview back; custom launcher
        // logic ensures root stability.
        super.onBackPressed()
    }
}
