package com.prismpuzzle.app;
import android.app.Activity;
import android.app.AlertDialog;
import android.os.Bundle;
import android.webkit.*;
import android.net.Uri;
public final class MainActivity extends Activity {
 private WebView web;
 @Override public void onCreate(Bundle state){super.onCreate(state);web=new WebView(this);setContentView(web);web.setBackgroundColor(0xff0c1322);WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);settings.setAllowFileAccess(true);settings.setAllowContentAccess(false);settings.setAllowFileAccessFromFileURLs(false);settings.setAllowUniversalAccessFromFileURLs(false);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
 web.setWebViewClient(new WebViewClient(){@Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){return true;} @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){String url=request.getUrl().toString();return url.startsWith("file:///android_asset/")?null:new WebResourceResponse("text/plain","UTF-8",new java.io.ByteArrayInputStream(new byte[0]));}});
 web.setWebChromeClient(new WebChromeClient(){@Override public boolean onJsConfirm(WebView view,String url,String message,JsResult result){new AlertDialog.Builder(MainActivity.this).setMessage(message).setPositiveButton("Erase",(d,w)->result.confirm()).setNegativeButton("Cancel",(d,w)->result.cancel()).setOnCancelListener(d->result.cancel()).show();return true;}});web.loadUrl("file:///android_asset/index.html");}
 @Override protected void onDestroy(){if(web!=null)web.destroy();super.onDestroy();}
}
