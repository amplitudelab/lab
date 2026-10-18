package com.symbiozyy.voxelrealms;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.Display;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

/**
 * Voxel Realms: invólucro do jogo publicado no GitHub Pages.
 * O jogo é carregado do link, então qualquer atualização no repositório chega aqui sozinha.
 * Sempre em paisagem, tela cheia imersiva e na maior taxa de atualização da tela (120 Hz).
 */
public class MainActivity extends Activity {
    static final String URL = "https://symbiozyy.github.io/amplitude-lab/voxel-realms/";
    static final String HOST = "symbiozyy.github.io";

    private FrameLayout root;
    private WebView web;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#140C14"));
        setContentView(root);
        makeWeb();
        web.loadUrl(URL);
        maxRefreshRate();
    }

    private void makeWeb() {
        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#140C14"));
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);
        web.setHapticFeedbackEnabled(false);
        web.setLongClickable(false);
        web.setOnLongClickListener(v -> true); // sem menu de seleção ao segurar o botão de ataque
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);          // o save do jogo fica no localStorage
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setTextZoom(100);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setAllowFileAccess(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (HOST.equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) {}
                return true;
            }

            @Override
            public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
                if (r.isForMainFrame()) showOffline();
            }

            @Override
            public boolean onRenderProcessGone(WebView v, RenderProcessGoneDetail d) {
                // se o sistema matar o renderizador (pouca memória), recria sem fechar o app
                root.removeView(web);
                web.destroy();
                makeWeb();
                web.loadUrl(URL);
                return true;
            }
        });
        root.addView(web, new FrameLayout.LayoutParams(-1, -1));
    }

    private void showOffline() {
        String h = "<body style='margin:0;background:#140c14;color:#f4ead2;font-family:serif;display:flex;flex-direction:column;"
                + "align-items:center;justify-content:center;height:100vh;text-align:center'>"
                + "<h2 style='color:#ffd34a'>Sem conexão</h2><p>Conecte-se à internet para carregar Aldoria.</p>"
                + "<a href='" + URL + "' style='color:#140c14;background:#d9a948;padding:12px 28px;border-radius:8px;"
                + "text-decoration:none;font-weight:bold'>Tentar de novo</a></body>";
        web.loadDataWithBaseURL(URL, h, "text/html", "utf-8", null);
    }

    /** Pede a maior taxa de atualização que a tela oferece (120 Hz onde existir). */
    private void maxRefreshRate() {
        try {
            Display d = Build.VERSION.SDK_INT >= 30 ? getDisplay() : getWindowManager().getDefaultDisplay();
            Display.Mode best = d.getMode();
            for (Display.Mode m : d.getSupportedModes()) {
                if (m.getPhysicalWidth() == best.getPhysicalWidth() && m.getPhysicalHeight() == best.getPhysicalHeight()
                        && m.getRefreshRate() > best.getRefreshRate()) best = m;
            }
            WindowManager.LayoutParams p = getWindow().getAttributes();
            p.preferredDisplayModeId = best.getModeId();
            getWindow().setAttributes(p);
        } catch (Exception ignored) {}
    }

    private void immersive() {
        Window w = getWindow();
        if (Build.VERSION.SDK_INT >= 30) {
            w.setDecorFitsSystemWindows(false);
            WindowInsetsController c = w.getInsetsController();
            if (c != null) {
                c.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            w.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
        }
    }

    @Override public void onWindowFocusChanged(boolean f) { super.onWindowFocusChanged(f); if (f) immersive(); }
    @Override protected void onResume() { super.onResume(); web.onResume(); immersive(); }
    @Override protected void onPause() { web.onPause(); super.onPause(); }   // a página salva o jogo ao ficar oculta
    @Override public void onBackPressed() { moveTaskToBack(true); }          // voltar não fecha o jogo por acidente
    @Override protected void onDestroy() { root.removeAllViews(); web.destroy(); super.onDestroy(); }
}
