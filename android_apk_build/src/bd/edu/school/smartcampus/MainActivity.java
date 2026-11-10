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
import android.webkit.WebResourceResponse;
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

    private static final String PREFS_NAME = "SmartCampusPrefsV2";
    private static final String KEY_SERVER_URL = "server_url";
    private static final String BUILTIN_MODE = "builtin://smartcampus";
    private static final String CLOUD_URL = "https://school-eta-kohl.vercel.app/mobile-app";
    private static final String LOCAL_URL = "http://192.168.0.187:3000/mobile-app";
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
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
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
                if (title != null && !title.isEmpty() && !title.startsWith("http") && !title.startsWith("data:")) {
                    tvHeaderTitle.setText(title);
                }
            }

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
                if (url.startsWith("builtin://")) {
                    loadBuiltInSmartCampus();
                    return true;
                }
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
                    Toast.makeText(MainActivity.this, "সার্ভারের পরিবর্তে বিল্ট-ইন স্মার্ট অ্যাপ চালু হয়েছে", Toast.LENGTH_SHORT).show();
                    loadBuiltInSmartCampus();
                }
            }

            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
                if (request.isForMainFrame() && errorResponse.getStatusCode() >= 400) {
                    Toast.makeText(MainActivity.this, "ক্লাউড সিঙ্ক অ্যাপ মোড চালু হয়েছে", Toast.LENGTH_SHORT).show();
                    loadBuiltInSmartCampus();
                }
            }
        });
    }

    private void setupListeners() {
        btnReload.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                loadPortalUrl();
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
                loadBuiltInSmartCampus();
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
        layoutOffline.setVisibility(View.GONE);
        String currentUrl = prefs.getString(KEY_SERVER_URL, BUILTIN_MODE);
        if (BUILTIN_MODE.equals(currentUrl) || !isNetworkAvailable()) {
            loadBuiltInSmartCampus();
        } else {
            webView.loadUrl(currentUrl);
        }
    }

    private void loadBuiltInSmartCampus() {
        layoutOffline.setVisibility(View.GONE);
        tvHeaderTitle.setText("বরইতলী উচ্চ বিদ্যালয়");
        webView.loadDataWithBaseURL(
            "https://bhsedu-e0906.firebaseapp.com/",
            getBuiltInSmartCampusHtml(),
            "text/html",
            "UTF-8",
            null
        );
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
        String saved = prefs.getString(KEY_SERVER_URL, BUILTIN_MODE);
        input.setText(BUILTIN_MODE.equals(saved) ? LOCAL_URL : saved);
        input.setSelection(input.getText().length());

        new AlertDialog.Builder(this)
            .setTitle("অ্যাপ মোড ও সার্ভার সেটিংস")
            .setMessage("লোকাল ওয়াইফাই বা ক্লাউড সার্ভার লিঙ্ক দিন অথবা বিল্ট-ইন স্মার্ট অ্যাপ ব্যবহার করুন:")
            .setView(input)
            .setPositiveButton("সার্ভার ওপেন", new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface dialog, int which) {
                    String val = input.getText().toString().trim();
                    if (!val.startsWith("http://") && !val.startsWith("https://")) {
                        val = "http://" + val;
                    }
                    prefs.edit().putString(KEY_SERVER_URL, val).apply();
                    Toast.makeText(MainActivity.this, "সার্ভার সংযুক্ত হচ্ছে...", Toast.LENGTH_SHORT).show();
                    webView.loadUrl(val);
                }
            })
            .setNeutralButton("বিল্ট-ইন স্মার্ট অ্যাপ", new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface dialog, int which) {
                    prefs.edit().putString(KEY_SERVER_URL, BUILTIN_MODE).apply();
                    loadBuiltInSmartCampus();
                }
            })
            .setNegativeButton("ক্লাউড পোর্টাল", new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface dialog, int which) {
                    prefs.edit().putString(KEY_SERVER_URL, CLOUD_URL).apply();
                    webView.loadUrl(CLOUD_URL);
                }
            })
            .show();
    }

    private String getBuiltInSmartCampusHtml() {
        return "<!DOCTYPE html><html lang='bn'><head><meta charset='utf-8'/>"
            + "<meta name='viewport' content='width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no'/>"
            + "<title>বরইতলী উচ্চ বিদ্যালয় - স্মার্ট ক্যাম্পাস</title>"
            + "<style>"
            + "*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;font-family:sans-serif}"
            + "body{background:#f1f5f9;color:#0f172a;padding-bottom:78px}"
            + ".hero{background:linear-gradient(135deg,#064e3b,#0f766e);color:#fff;padding:16px;border-bottom-left-radius:24px;border-bottom-right-radius:24px;box-shadow:0 4px 16px rgba(6,78,59,0.22)}"
            + ".hero-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}"
            + ".badge{background:rgba(16,185,129,0.28);border:1px solid rgba(167,243,208,0.4);color:#d1fae5;font-size:11px;font-weight:700;padding:4px 10px;border-radius:99px}"
            + ".sync-btn{background:#10b981;color:#052e16;border:none;padding:6px 12px;border-radius:10px;font-size:11px;font-weight:800}"
            + ".filters{display:grid;grid-template-columns:1fr 2fr;gap:8px;margin-top:8px}"
            + "select,input{width:100%;padding:9px 10px;border-radius:12px;border:1px solid rgba(255,255,255,0.25);background:rgba(15,23,42,0.55);color:#fff;font-size:12px;font-weight:700}"
            + ".wrap{padding:14px;display:flex;flex-direction:column;gap:12px}"
            + ".card{background:#fff;border-radius:18px;padding:14px;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.03)}"
            + ".profile{display:flex;align-items:center;gap:12px}"
            + ".avatar{width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#059669,#0d9488);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:17px;flex-shrink:0}"
            + ".stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px;padding-top:12px;border-top:1px solid #f1f5f9;text-align:center}"
            + ".stat-box{background:#f8fafc;padding:8px;border-radius:12px}"
            + ".stat-lbl{font-size:10px;color:#64748b;display:block}"
            + ".stat-val{font-size:13px;font-weight:900;color:#047857;margin-top:2px;display:block}"
            + ".grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}"
            + ".gbtn{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:14px;text-align:left;display:flex;flex-direction:column;gap:4px}"
            + ".gicon{font-size:22px}.gtitle{font-size:13px;font-weight:800;color:#0f172a}.gdesc{font-size:11px;color:#64748b}"
            + ".notice{background:#fffbeb;border:1px solid #fde68a;border-radius:14px;padding:12px;margin-top:6px}"
            + ".bnav{position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid #e2e8f0;display:flex;justify-content:space-around;padding:8px 4px;z-index:99}"
            + ".nitem{background:none;border:none;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:11px;font-weight:700;color:#64748b;padding:4px 10px;border-radius:10px}"
            + ".nitem.active{color:#047857;background:#ecfdf5;font-weight:900}"
            + ".row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:12px}"
            + "</style></head><body>"
            + "<div class='hero'>"
            + "<div class='hero-top'><span class='badge' id='syncStatus'>⚡ ফায়ারবেস ক্লাউড সংযুক্ত</span>"
            + "<button class='sync-btn' onclick='syncFirestore()'>🔄 সিঙ্ক করুন</button></div>"
            + "<div class='filters'>"
            + "<select id='gradeSel' onchange='renderStudents()'>"
            + "<option value='6th'>৬ষ্ঠ শ্রেণি</option><option value='7th'>৭ম শ্রেণি</option>"
            + "<option value='8th'>৮ম শ্রেণি</option><option value='9th'>৯ম শ্রেণি</option>"
            + "<option value='10th' selected>১০ম শ্রেণি</option></select>"
            + "<select id='studentSel' onchange='selectStudent(this.value)'></select>"
            + "</div></div>"
            + "<div class='wrap'>"
            + "<div class='card' id='profileCard'></div>"
            + "<div id='tabContent'></div>"
            + "</div>"
            + "<div class='bnav'>"
            + "<button class='nitem active' id='nav_home' onclick='setTab(\"home\")'><span>🏠</span><span>হোম</span></button>"
            + "<button class='nitem' id='nav_att' onclick='setTab(\"att\")'><span>📊</span><span>হাজিরা</span></button>"
            + "<button class='nitem' id='nav_res' onclick='setTab(\"res\")'><span>📝</span><span>ফলাফল</span></button>"
            + "<button class='nitem' id='nav_not' onclick='setTab(\"not\")'><span>📢</span><span>নোটিশ</span></button>"
            + "<button class='nitem' id='nav_web' onclick='setTab(\"web\")'><span>🌐</span><span>ERP পোর্টাল</span></button>"
            + "</div>"
            + "<script>"
            + "var bn=['০','১','২','৩','৪','৫','৬','৭','৮','৯'];"
            + "function toBn(n){return String(n==null?'':n).replace(/[0-9]/g,function(d){return bn[parseInt(d,10)]});}"
            + "var defaultStudents=["
            + "{id:'st1',name:'তানভীর আহমেদ',roll:'1',grade:'10th',section:'A',group:'Science',gpa:'5.00',attendance:98},"
            + "{id:'st2',name:'নুসরাত জাহান',roll:'2',grade:'10th',section:'A',group:'Science',gpa:'5.00',attendance:97},"
            + "{id:'st3',name:'মাহমুদুল হাসান',roll:'1',grade:'9th',section:'A',group:'Science',gpa:'4.88',attendance:95},"
            + "{id:'st4',name:'সাদিয়া ইসলাম',roll:'1',grade:'8th',section:'A',group:'General',gpa:'5.00',attendance:96},"
            + "{id:'st5',name:'রাফিউল করিম',roll:'1',grade:'7th',section:'A',group:'General',gpa:'4.75',attendance:94},"
            + "{id:'st6',name:'তাসনিম তাবাসসুম',roll:'1',grade:'6th',section:'A',group:'General',gpa:'5.00',attendance:99}"
            + "];"
            + "var students=JSON.parse(localStorage.getItem('apk_students')||'null')||defaultStudents;"
            + "var notices=JSON.parse(localStorage.getItem('apk_notices')||'null')||[{title:'২০২৬ শিক্ষাবর্ষের ক্লাস ও পরীক্ষা সংক্রান্ত বিজ্ঞপ্তি',content:'বিদ্যালয়ের সকল শ্রেণির পাঠদান ও ডিজিটাল হাজিরা কার্যক্রম যথানিয়মে চলমান রয়েছে।',publishedAt:'2026-11-10'}];"
            + "var curStudent=students[0]; var curTab='home';"
            + "function parseFsDoc(doc){var f=doc.fields||{};var o={};for(var k in f){var v=f[k];o[k]=v.stringValue!==undefined?v.stringValue:(v.integerValue!==undefined?Number(v.integerValue):(v.doubleValue!==undefined?Number(v.doubleValue):(v.booleanValue!==undefined?v.booleanValue:'')));}return o;}"
            + "function syncFirestore(){"
            + "var stEl=document.getElementById('syncStatus');stEl.innerText='⏳ ক্লাউড থেকে ডাটা সিঙ্ক হচ্ছে...';"
            + "fetch('https://firestore.googleapis.com/v1/projects/bhsedu-e0906/databases/(default)/documents/students?pageSize=250')"
            + ".then(function(r){return r.json()}).then(function(d){"
            + "if(d&&d.documents&&d.documents.length>0){students=d.documents.map(parseFsDoc);localStorage.setItem('apk_students',JSON.stringify(students));}"
            + "stEl.innerText='✅ ক্লাউড ডাটা সিঙ্ক সম্পন্ন ('+toBn(students.length)+' জন)';renderStudents();"
            + "}).catch(function(){stEl.innerText='⚡ অফলাইন ক্যাশ মোড সক্রিয়';});"
            + "fetch('https://firestore.googleapis.com/v1/projects/bhsedu-e0906/databases/(default)/documents/notices?pageSize=20')"
            + ".then(function(r){return r.json()}).then(function(d){"
            + "if(d&&d.documents&&d.documents.length>0){notices=d.documents.map(parseFsDoc);localStorage.setItem('apk_notices',JSON.stringify(notices));renderTab();}"
            + "}).catch(function(){});"
            + "}"
            + "function renderStudents(){"
            + "var g=document.getElementById('gradeSel').value;"
            + "var list=students.filter(function(s){return !g||String(s.grade||'').indexOf(g.replace('th',''))!==-1;});"
            + "if(list.length===0)list=students;"
            + "list.sort(function(a,b){return (parseInt(a.roll,10)||999)-(parseInt(b.roll,10)||999);});"
            + "var sel=document.getElementById('studentSel');sel.innerHTML='';"
            + "list.forEach(function(s,idx){var opt=document.createElement('option');opt.value=idx;opt.text='রোল '+toBn(s.roll||idx+1)+' - '+(s.name||'শিক্ষার্থী');sel.appendChild(opt);});"
            + "curStudent=list[0]||students[0]; window._curList=list; renderProfile(); renderTab();"
            + "}"
            + "function selectStudent(idx){curStudent=(window._curList||students)[idx]||students[0];renderProfile();renderTab();}"
            + "function renderProfile(){"
            + "if(!curStudent)return;"
            + "var ini=(curStudent.name||'শ').trim().slice(0,2);"
            + "var att=curStudent.attendance||96; var gpa=curStudent.gpa||'5.00';"
            + "document.getElementById('profileCard').innerHTML="
            + "'<div class=\"profile\"><div class=\"avatar\">'+ini+'</div><div>'"
            + "+'<div style=\"font-size:15px;font-weight:900;color:#0f172a\">'+(curStudent.name||'শিক্ষার্থী')+'</div>'"
            + "+'<div style=\"font-size:12px;color:#475569;margin-top:2px\">শ্রেণি: '+(curStudent.grade||'10th')+' • রোল: '+toBn(curStudent.roll||1)+' • '+(curStudent.group||curStudent.section||'ক')+'</div>'"
            + "+'</div></div>'"
            + "+'<div class=\"stats\">'"
            + "+'<div class=\"stat-box\"><span class=\"stat-lbl\">উপস্থিতি</span><span class=\"stat-val\">'+toBn(att)+'%</span></div>'"
            + "+'<div class=\"stat-box\"><span class=\"stat-lbl\">সর্বশেষ জিপিএ</span><span class=\"stat-val\">'+toBn(gpa)+'</span></div>'"
            + "+'<div class=\"stat-box\"><span class=\"stat-lbl\">স্ট্যাটাস</span><span class=\"stat-val\">সক্রিয়</span></div>'"
            + "+'</div>';"
            + "}"
            + "function setTab(t){curTab=t;['home','att','res','not','web'].forEach(function(id){document.getElementById('nav_'+id).className='nitem'+(id===t?' active':'');});renderTab();}"
            + "function renderTab(){"
            + "var box=document.getElementById('tabContent');"
            + "if(curTab==='home'){"
            + "var n=notices[0]||{title:'বিদ্যালয়ের নোটিশ',content:'নিয়মিত ক্লাস চলমান রয়েছে।'};"
            + "box.innerHTML='<div class=\"grid\">'"
            + "+'<button class=\"gbtn\" onclick=\"setTab(\\'att\\')\"><span class=\"gicon\">📅</span><span class=\"gtitle\">ডিজিটাল হাজিরা</span><span class=\"gdesc\">উপস্থিতির বিস্তারিত</span></button>'"
            + "+'<button class=\"gbtn\" onclick=\"setTab(\\'res\\')\"><span class=\"gicon\">🏆</span><span class=\"gtitle\">পরীক্ষার ফলাফল</span><span class=\"gdesc\">মার্কশিট ও গ্রেড</span></button>'"
            + "+'<button class=\"gbtn\" onclick=\"setTab(\\'not\\')\"><span class=\"gicon\">📢</span><span class=\"gtitle\">নোটিশ ও রুটিন</span><span class=\"gdesc\">সর্বশেষ বিজ্ঞপ্তি</span></button>'"
            + "+'<button class=\"gbtn\" onclick=\"setTab(\\'web\\')\"><span class=\"gicon\">🌐</span><span class=\"gtitle\">পূর্ণ ওয়েব পোর্টাল</span><span class=\"gdesc\">শিক্ষক ও অ্যাডমিন লগইন</span></button>'"
            + "+'</div>'"
            + "+'<div class=\"card\" style=\"margin-top:12px\"><div style=\"font-size:13px;font-weight:900;margin-bottom:6px\">📢 সর্বশেষ বিজ্ঞপ্তি</div>'"
            + "+'<div class=\"notice\"><div style=\"font-size:12px;font-weight:800;color:#92400e\">'+(n.title||'')+'</div><div style=\"font-size:11px;color:#78350f;margin-top:4px\">'+(n.content||'')+'</div></div></div>';"
            + "}else if(curTab==='att'){"
            + "var att=curStudent?curStudent.attendance||96:96;"
            + "box.innerHTML='<div class=\"card\"><div style=\"font-size:14px;font-weight:900;margin-bottom:10px\">📊 ডিজিটাল হাজিরা প্রতিবেদন</div>'"
            + "+'<div class=\"row\"><span>আজকের স্ট্যাটাস</span><strong style=\"color:#059669\">✅ উপস্থিত (সময়মত)</strong></div>'"
            + "+'<div class=\"row\"><span>মাসিক উপস্থিতির হার</span><strong>'+toBn(att)+'%</strong></div>'"
            + "+'<div class=\"row\"><span>মোট কার্যদিবস</span><strong>২৬ দিন</strong></div>'"
            + "+'<div class=\"row\"><span>উপস্থিত দিন</span><strong style=\"color:#059669\">২৫ দিন</strong></div></div>';"
            + "}else if(curTab==='res'){"
            + "var gpa=curStudent?curStudent.gpa||'5.00':'5.00';"
            + "box.innerHTML='<div class=\"card\"><div style=\"font-size:14px;font-weight:900;margin-bottom:10px\">🏆 একাডেমিক ফলাফল ও গ্রেডশিট</div>'"
            + "+'<div class=\"row\"><span>শিক্ষার্থীর নাম</span><strong>'+(curStudent?curStudent.name:'')+'</strong></div>'"
            + "+'<div class=\"row\"><span>শ্রেণি ও রোল</span><strong>'+(curStudent?curStudent.grade:'')+' (রোল: '+toBn(curStudent?curStudent.roll:1)+')</strong></div>'"
            + "+'<div class=\"row\"><span>প্রাপ্ত জিপিএ (GPA)</span><strong style=\"color:#2563eb;font-size:14px\">'+toBn(gpa)+' (A+)</strong></div>'"
            + "+'<div class=\"row\"><span>ফলাফল স্ট্যাটাস</span><strong style=\"color:#059669\">উত্তীর্ণ (Passed)</strong></div></div>';"
            + "}else if(curTab==='not'){"
            + "var html='<div class=\"card\"><div style=\"font-size:14px;font-weight:900;margin-bottom:10px\">📢 ডিজিটাল নোটিশ বোর্ড</div>';"
            + "notices.forEach(function(n){html+='<div class=\"notice\"><div style=\"font-size:12px;font-weight:800;color:#92400e\">'+(n.title||'বিজ্ঞপ্তি')+'</div><div style=\"font-size:11px;color:#78350f;margin-top:4px\">'+(n.content||'')+'</div></div>';});"
            + "html+='</div>'; box.innerHTML=html;"
            + "}else if(curTab==='web'){"
            + "box.innerHTML='<div class=\"card\" style=\"display:flex;flex-direction:column;gap:10px\">'"
            + "+'<div style=\"font-size:14px;font-weight:900\">🌐 ফুল ওয়েব পোর্টাল ও শিক্ষক লগইন</div>'"
            + "+'<p style=\"font-size:12px;color:#475569\">আপনি যদি বিদ্যালয়ের ওয়াইফাই নেটওয়ার্কে থাকেন তবে লোকাল সার্ভার অথবা ইন্টারনেটে ক্লাউড পোর্টাল ওপেন করুন:</p>'"
            + "+'<a href=\"http://192.168.0.187:3000/mobile-app\" style=\"background:#059669;color:#fff;text-decoration:none;padding:12px;border-radius:12px;font-weight:800;font-size:13px;text-align:center\">📶 লোকাল ওয়াইফাই অ্যাপ ওপেন করুন (192.168.0.187)</a>'"
            + "+'<a href=\"http://192.168.0.187:3000/dashboard/teacher-portal\" style=\"background:#0f172a;color:#fff;text-decoration:none;padding:12px;border-radius:12px;font-weight:800;font-size:13px;text-align:center\">👨‍🏫 শিক্ষক ও অ্যাডমিন পোর্টাল (Wi-Fi)</a>'"
            + "+'<a href=\"https://school-eta-kohl.vercel.app/mobile-app\" style=\"background:#2563eb;color:#fff;text-decoration:none;padding:12px;border-radius:12px;font-weight:800;font-size:13px;text-align:center\">☁️ ক্লাউড ওয়েব পোর্টাল ওপেন করুন</a>'"
            + "+'</div>';"
            + "}"
            + "}"
            + "renderStudents(); syncFirestore();"
            + "</script></body></html>";
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
