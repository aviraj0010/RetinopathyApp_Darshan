package com.retinopathyapp

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import com.facebook.react.bridge.*
import org.tensorflow.lite.Interpreter
import java.io.File
import java.io.FileInputStream
import java.net.URL
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlinx.coroutines.*
import java.io.InputStream
import java.net.HttpURLConnection

class TFLiteModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private var tflite: Interpreter? = null
    private val imageSizeX = 224
    private val imageSizeY = 224
    private val numChannels = 3
    private val imagePixels = imageSizeX * imageSizeY * numChannels
    private val bytePerChannel = 4
    private val scope = CoroutineScope(Dispatchers.IO + Job())
    
    override fun getName() = "TFLiteModule"

    @ReactMethod
    fun loadModel(modelPath: String, promise: Promise) {
        try {
            val file = File(modelPath)
            if (!file.exists()) {
                throw Exception("Model file not found at $modelPath")
            }
            
            FileInputStream(file).use { fileInputStream ->
                val options = Interpreter.Options()
                options.setNumThreads(4)
                tflite = Interpreter(fileInputStream.channel.map(
                    java.nio.channels.FileChannel.MapMode.READ_ONLY, 0, file.length()
                ), options)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("TFLITE_ERROR", "Failed to load model: ${e.message}", e)
        }
    }

    @ReactMethod
    fun analyzeImage(imagePath: String, promise: Promise) {
        scope.launch {
            try {
                if (tflite == null) {
                    throw Exception("Model not loaded")
                }

                val bitmap = when {
                    imagePath.startsWith("content://") -> {
                        val inputStream = reactApplicationContext.contentResolver.openInputStream(Uri.parse(imagePath))
                        inputStream?.use { stream ->
                            BitmapFactory.decodeStream(stream)
                        } ?: throw Exception("Failed to read content URI: $imagePath")
                    }
                    imagePath.startsWith("http") -> loadImageFromUrl(imagePath)
                    imagePath.startsWith("file://") -> loadAndResizeImage(imagePath.substring(7))
                    else -> loadAndResizeImage(imagePath)
                }?.let { resizeBitmapIfNeeded(it) } ?: throw Exception("Failed to load image")

                processBitmapImage(bitmap, promise)
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    promise.reject("ANALYSIS_ERROR", "Failed to analyze image: ${e.message}", e)
                }
            }
        }
    }

    private suspend fun processBitmapImage(bitmap: Bitmap, promise: Promise) {
        try {
            val inputBuffer = convertBitmapToByteBuffer(bitmap)
            val outputBuffer = ByteBuffer.allocateDirect(4 * 5)
            outputBuffer.order(ByteOrder.nativeOrder())

            withContext(Dispatchers.Default) {
                tflite?.run(inputBuffer, outputBuffer)
            }

            outputBuffer.rewind()
            val confidences = FloatArray(5)
            outputBuffer.asFloatBuffer().get(confidences)

            val maxResult = confidences.withIndex().maxByOrNull { it.value }
                ?: throw Exception("No valid classification results")

            withContext(Dispatchers.Main) {
                val result = Arguments.createMap().apply {
                    putDouble("confidence", maxResult.value.toDouble())
                    putInt("classification", maxResult.index)
                    
                    // Create a proper ReadableArray for raw confidences
                    val confidencesArray = Arguments.createArray()
                    confidences.forEach { confidence ->
                        confidencesArray.pushDouble(confidence.toDouble())
                    }
                    putArray("rawConfidences", confidencesArray)
                }
                promise.resolve(result)
            }
        } finally {
            bitmap.recycle()
        }
    }

    private suspend fun loadImageFromUrl(urlString: String): Bitmap? = withContext(Dispatchers.IO) {
        var connection: HttpURLConnection? = null
        try {
            val url = URL(urlString)
            connection = (url.openConnection() as HttpURLConnection).apply {
                doInput = true
                connectTimeout = 15000
                readTimeout = 15000
            }
            
            connection.inputStream.use { 
                BitmapFactory.decodeStream(it)
            }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        } finally {
            connection?.disconnect()
        }
    }

    private fun loadAndResizeImage(imagePath: String): Bitmap? {
        return try {
            val options = BitmapFactory.Options().apply {
                inPreferredConfig = Bitmap.Config.ARGB_8888
                inSampleSize = calculateInSampleSize(this, imagePath)
            }
            
            BitmapFactory.decodeFile(imagePath, options)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    private fun resizeBitmapIfNeeded(bitmap: Bitmap): Bitmap {
        return if (bitmap.width != imageSizeX || bitmap.height != imageSizeY) {
            val resized = Bitmap.createScaledBitmap(bitmap, imageSizeX, imageSizeY, true)
            if (resized != bitmap) {
                bitmap.recycle()
            }
            resized
        } else {
            bitmap
        }
    }

    private fun calculateInSampleSize(options: BitmapFactory.Options, imagePath: String): Int {
        options.inJustDecodeBounds = true
        BitmapFactory.decodeFile(imagePath, options)
        options.inJustDecodeBounds = false

        val (height: Int, width: Int) = options.run { outHeight to outWidth }
        var inSampleSize = 1

        if (height > imageSizeY || width > imageSizeX) {
            val halfHeight: Int = height / 2
            val halfWidth: Int = width / 2

            while (halfHeight / inSampleSize >= imageSizeY && halfWidth / inSampleSize >= imageSizeX) {
                inSampleSize *= 2
            }
        }

        return inSampleSize
    }

    private fun convertBitmapToByteBuffer(bitmap: Bitmap): ByteBuffer {
        val byteBuffer = ByteBuffer.allocateDirect(imagePixels * bytePerChannel)
        byteBuffer.order(ByteOrder.nativeOrder())

        val intValues = IntArray(imageSizeX * imageSizeY)
        bitmap.getPixels(intValues, 0, bitmap.width, 0, 0, bitmap.width, bitmap.height)

        var pixel = 0
        for (i in 0 until imageSizeX) {
            for (j in 0 until imageSizeY) {
                val value = intValues[pixel++]
                byteBuffer.putFloat(((value shr 16 and 0xFF) - 127.5f) / 127.5f)
                byteBuffer.putFloat(((value shr 8 and 0xFF) - 127.5f) / 127.5f)
                byteBuffer.putFloat(((value and 0xFF) - 127.5f) / 127.5f)
            }
        }

        return byteBuffer
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        scope.cancel()
        tflite?.close()
    }
}