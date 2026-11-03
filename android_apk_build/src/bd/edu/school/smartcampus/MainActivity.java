package bd.edu.school.smartcampus;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity {

    private static final String PREFS_NAME = "SmartCampusPrefs";
    private static final String KEY_SERVER_URL = "server_url";
    private static final String DEFAULT_URL = "https://eliascox-school.vercel.app";
    private static final int FILE_CHOOSER_RESULT_CODE = 1001;

    private WebView webView;
    private ProgressBar progressBar;
    private LinearLayout layoutOffline;
    private Button btnReload;
    private Button btnConfig;
    private Button btnRetryOffline;
    private Button btnChangeUrlOffline;
    private TextView tvHeaderTitle;

    private ValueCallback<Uri[]> fileUploadCallback;
    private SharedPreferences prefs;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);

        webView = findViewById(R.id.webView);
        progressBar = findViewById(R.id.progressBar);
        layoutOffline = findViewById(R.id.layoutOffline);
        btnReload = findViewById(R.id.btnReload);
        btnConfig = findViewById(R.id.btnConfig);
        btnRetryOffline = findViewById(R.id.btnRetryOffline);
        btnChangeUrlOffline = findViewById(R.id.btnChangeUrlOffline);
        tvHeaderTitle = findViewById(R.id.tvHeaderTitle);

        setupWebView();
        setupListeners();

        loadPortalUrl();
    }

    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
        }

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress < 100) {
                    progressBar.setVisibility(View.VISIBLE);
                    progressBar.setProgress(newProgress);
                } else {
                    progressBar.setVisibility(View.GONE);
                }
            }

            @Override
            public void onReceivedTitle(WebView view, String title) {
                super.onReceivedTitle(view, title);
                if (title != null && !title.isEmpty() && !title.startsWith("http")) {
                    tvHeaderTitle.setText(title);
                }
            }

            // Android 5.0+ File Chooser for Photo, Excel & Marksheet Uploads
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (fileUploadCallback != null) {
                    fileUploadCallback.onReceiveValue(null);
                }
                fileUploadCallback = filePathCallback;

                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                startActivityForResult(Intent.createChooser(intent, "ফাইল নির্বাচন করুন"), FILE_CHOOSER_RESULT_CODE);
                return true;
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if (url.startsWith("tel:") || url.startsWith("mailto:") || url.startsWith("whatsapp:")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        return false;
                    }
                }
                return false;
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                layoutOffline.setVisibility(View.GONE);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    layoutOffline.setVisibility(View.VISIBLE);
                }
            }
        });
    }

    private void setupListeners() {
        btnReload.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                webView.reload();
            }
        });

        btnConfig.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                showServerUrlDialog();
            }
        });

        btnRetryOffline.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                loadPortalUrl();
            }
        });

        btnChangeUrlOffline.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                showServerUrlDialog();
            }
        });
    }

    private void loadPortalUrl() {
        String currentUrl = prefs.getString(KEY_SERVER_URL, DEFAULT_URL);
        if (!isNetworkAvailable()) {
            layoutOffline.setVisibility(View.VISIBLE);
            Toast.makeText(this, "ইন্টারনেট সংযোগ চেক করুন", Toast.LENGTH_SHORT).show();
            return;
        }
        layoutOffline.setVisibility(View.GONE);
        webView.loadUrl(currentUrl);
    }

    private boolean isNetworkAvailable() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) return false;
        NetworkInfo netInfo = cm.getActiveNetworkInfo();
        return netInfo != null && netInfo.isConnected();
    }

    private void showServerUrlDialog() {
        final EditText input = new EditText(this);
        input.setSingleLine(true);
        input.setText(prefs.getString(KEY_SERVER_URL, DEFAULT_URL));
        input.setSelection(input.getText().length());

        new AlertDialog.Builder(this)
            .setTitle("সার্ভার ওয়েব পোর্টাল URL")
            .setMessage("আপনার বিদ্যালয়ের ওয়েবসাইট বা সার্ভার লিঙ্ক প্রদান করুন:")
            .setView(input)
            .setPositiveButton("সংরক্ষণ", new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface dialog, int which) {
                    String val = input.getText().toString().trim();
                    if (!val.startsWith("http://") && !val.startsWith("https://")) {
                        val = "https://" + val;
                    }
                    prefs.edit().putString(KEY_SERVER_URL, val).apply();
                    Toast.makeText(MainActivity.this, "URL সংরক্ষিত হয়েছে", Toast.LENGTH_SHORT).show();
                    webView.loadUrl(val);
                }
            })
            .setNeutralButton("ডিফল্ট রিস্টোর", new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface dialog, int which) {
                    prefs.edit().putString(KEY_SERVER_URL, DEFAULT_URL).apply();
                    webView.loadUrl(DEFAULT_URL);
                }
            })
            .setNegativeButton("বাতিল", null)
            .show();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_RESULT_CODE) {
            if (fileUploadCallback != null) {
                Uri[] results = null;
                if (resultCode == RESULT_OK && data != null) {
                    String dataString = data.getDataString();
                    if (dataString != null) {
                        results = new Uri[]{Uri.parse(dataString)};
                    }
                }
                fileUploadCallback.onReceiveValue(results);
                fileUploadCallback = null;
            }
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
