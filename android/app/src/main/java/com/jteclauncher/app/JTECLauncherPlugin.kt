package com.jteclauncher.app

import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.net.Uri
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.provider.Settings
import android.util.Base64
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.io.ByteArrayOutputStream

/**
 * JTEC Launcher Native Android Capacitor Plugin.
 * Handles:
 * - Querying installed launcher activities (PackageManager)
 * - Launching applications by package name
 * - Extracting application icons (Base64)
 * - Navigating to Android Application Info and Default Home settings
 * - Triggering tactile haptic feedback
 */
@CapacitorPlugin(name = "JTECLauncher")
class JTECLauncherPlugin : Plugin() {

    @PluginMethod
    fun getInstalledApps(call: PluginCall) {
        try {
            val pm = context.packageManager
            val mainIntent = Intent(Intent.ACTION_MAIN, null).apply {
                addCategory(Intent.CATEGORY_LAUNCHER)
            }

            val activities = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                pm.queryIntentActivities(mainIntent, PackageManager.ResolveInfoFlags.of(0))
            } else {
                @Suppress("DEPRECATION")
                pm.queryIntentActivities(mainIntent, 0)
            }

            val appsArray = JSArray()
            val currentPkg = context.packageName

            for (resolveInfo in activities) {
                val pkgName = resolveInfo.activityInfo.packageName
                if (pkgName == currentPkg) continue // Do not list JTEC Launcher itself in drawer

                val label = resolveInfo.loadLabel(pm).toString()
                val isSystem = (resolveInfo.activityInfo.applicationInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0

                val appObj = JSObject().apply {
                    put("packageName", pkgName)
                    put("name", label)
                    put("activityName", resolveInfo.activityInfo.name)
                    put("isSystemApp", isSystem)
                }
                appsArray.put(appObj)
            }

            val ret = JSObject()
            ret.put("apps", appsArray)
            ret.put("count", appsArray.length())
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to query installed applications: ${e.localizedMessage}", e)
        }
    }

    @PluginMethod
    fun launchApp(call: PluginCall) {
        val packageName = call.getString("packageName")
        if (packageName.isNullOrEmpty()) {
            call.reject("packageName is required")
            return
        }

        try {
            val pm = context.packageManager
            val launchIntent = pm.getLaunchIntentForPackage(packageName)
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(launchIntent)
                call.resolve(JSObject().put("success", true))
            } else {
                call.reject("Unable to create launch intent for $packageName")
            }
        } catch (e: Exception) {
            call.reject("Error launching app $packageName: ${e.localizedMessage}", e)
        }
    }

    @PluginMethod
    fun openAppInfo(call: PluginCall) {
        val packageName = call.getString("packageName")
        if (packageName.isNullOrEmpty()) {
            call.reject("packageName is required")
            return
        }

        try {
            val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.parse("package:$packageName")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            call.resolve(JSObject().put("success", true))
        } catch (e: Exception) {
            call.reject("Error opening app info: ${e.localizedMessage}", e)
        }
    }

    @PluginMethod
    fun uninstallApp(call: PluginCall) {
        val packageName = call.getString("packageName")
        if (packageName.isNullOrEmpty()) {
            call.reject("packageName is required")
            return
        }

        try {
            val intent = Intent(Intent.ACTION_DELETE).apply {
                data = Uri.parse("package:$packageName")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            call.resolve(JSObject().put("success", true))
        } catch (e: Exception) {
            call.reject("Error requesting uninstall: ${e.localizedMessage}", e)
        }
    }

    @PluginMethod
    fun openHomeSettings(call: PluginCall) {
        try {
            // Intent to open Android Home screen selector or Default Apps settings
            val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                Intent(Settings.ACTION_MANAGE_DEFAULT_APPS_SETTINGS).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
            } else {
                Intent(Settings.ACTION_HOME_SETTINGS).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
            }
            context.startActivity(intent)
            call.resolve(JSObject().put("success", true))
        } catch (e: Exception) {
            // Fallback to general settings
            try {
                val fallbackIntent = Intent(Settings.ACTION_SETTINGS).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(fallbackIntent)
                call.resolve(JSObject().put("success", true))
            } catch (fallbackError: Exception) {
                call.reject("Error opening home settings: ${e.localizedMessage}", e)
            }
        }
    }

    @PluginMethod
    fun getAppIcon(call: PluginCall) {
        val packageName = call.getString("packageName")
        if (packageName.isNullOrEmpty()) {
            call.reject("packageName is required")
            return
        }

        try {
            val pm = context.packageManager
            val drawable = pm.getApplicationIcon(packageName)
            val bitmap = drawableToBitmap(drawable)
            val outputStream = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.PNG, 90, outputStream)
            val base64 = Base64.encodeToString(outputStream.toByteArray(), Base64.NO_WRAP)
            
            val ret = JSObject()
            ret.put("iconBase64", "data:image/png;base64,$base64")
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to retrieve icon: ${e.localizedMessage}", e)
        }
    }

    @PluginMethod
    fun triggerHaptic(call: PluginCall) {
        try {
            val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                vibratorManager.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                vibrator.vibrate(VibrationEffect.createPredefined(VibrationEffect.EFFECT_CLICK))
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(20)
            }
            call.resolve(JSObject().put("success", true))
        } catch (e: Exception) {
            call.resolve(JSObject().put("success", false).put("reason", e.localizedMessage))
        }
    }

    private fun drawableToBitmap(drawable: Drawable): Bitmap {
        if (drawable is BitmapDrawable && drawable.bitmap != null) {
            return drawable.bitmap
        }
        val width = if (drawable.intrinsicWidth > 0) drawable.intrinsicWidth else 96
        val height = if (drawable.intrinsicHeight > 0) drawable.intrinsicHeight else 96
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        drawable.setBounds(0, 0, canvas.width, canvas.height)
        drawable.draw(canvas)
        return bitmap
    }
}
