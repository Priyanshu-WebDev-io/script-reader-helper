package com.scriptcast.studio

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.provider.OpenableColumns
import com.facebook.react.bridge.*
import java.io.BufferedReader
import java.io.InputStreamReader

class JsonPickerModule(private val reactCtx: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactCtx), ActivityEventListener {

  private var pickerPromise: Promise? = null
  private val PICK_JSON_REQUEST_CODE = 4129

  init {
    reactCtx.addActivityEventListener(this)
  }

  override fun getName(): String = "JsonPicker"

  @ReactMethod
  fun pickJsonFile(promise: Promise) {
    val activity = reactCtx.currentActivity
    if (activity == null) {
      promise.reject("E_ACTIVITY_NULL", "Activity does not exist")
      return
    }

    if (pickerPromise != null) {
      promise.reject("E_ALREADY_PICKING", "File picker is already active")
      return
    }

    pickerPromise = promise

    try {
      val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
        addCategory(Intent.CATEGORY_OPENABLE)
        type = "application/json"
        putExtra(Intent.EXTRA_MIME_TYPES, arrayOf("application/json", "text/json"))
      }
      activity.startActivityForResult(intent, PICK_JSON_REQUEST_CODE)
    } catch (e: Exception) {
      pickerPromise?.reject("E_FAILED_TO_PICK", e.message)
      pickerPromise = null
    }
  }

  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
    if (requestCode == PICK_JSON_REQUEST_CODE) {
      if (resultCode == Activity.RESULT_OK && data?.data != null) {
        val uri: Uri = data.data!!
        try {
          var fileName = "script.json"
          activity.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
            val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            if (nameIndex != -1 && cursor.moveToFirst()) {
              fileName = cursor.getString(nameIndex)
            }
          }

          if (!fileName.endsWith(".json", ignoreCase = true)) {
            pickerPromise?.reject("E_INVALID_FILE_TYPE", "Only .json files are accepted. Selected file: $fileName")
            pickerPromise = null
            return
          }

          val inputStream = activity.contentResolver.openInputStream(uri)
          if (inputStream == null) {
            pickerPromise?.reject("E_OPEN_STREAM_FAILED", "Could not open file input stream")
            pickerPromise = null
            return
          }

          val reader = BufferedReader(InputStreamReader(inputStream))
          val stringBuilder = StringBuilder()
          var line: String?
          while (reader.readLine().also { line = it } != null) {
            stringBuilder.append(line).append("\n")
          }
          reader.close()
          inputStream.close()

          val result = Arguments.createMap().apply {
            putString("name", fileName)
            putString("content", stringBuilder.toString())
            putString("uri", uri.toString())
          }
          pickerPromise?.resolve(result)
        } catch (e: Exception) {
          pickerPromise?.reject("E_READ_FAILED", "Failed to read file: ${e.message}")
        }
      } else {
        pickerPromise?.reject("E_CANCELLED", "File selection cancelled")
      }
      pickerPromise = null
    }
  }

  override fun onNewIntent(intent: Intent) {}
}
