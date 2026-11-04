package com.amplitudelab.crm;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Amplitude CRM: invólucro do painel publicado no GitHub Pages.
 * O painel é carregado do link, então toda atualização do CRM chega aqui sozinha;
 * o APK só precisa mudar quando o próprio app mudar.
 * O login fica guardado no armazenamento do app, como num navegador.
 */
public class MainActivity extends Activity {
    static final String HOST = "amplitudelab.github.io";
    static final String URL = "https://" + HOST + "/lab/crm/app/?empresa=amplitudelab&app=android";
    static final int SAVE_FILE = 7;

    private FrameLayout root;
    private WebView web;
    private String pendingText;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#0A0F1C"));
        setContentView(root);
        makeWeb();
        if (b != null) web.restoreState(b); else web.loadUrl(URL);
    }

    private void makeWeb() {
        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#0A0F1C"));
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);          // sessão do login e preferências
        s.setDatabaseEnabled(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setTextZoom(100);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setUserAgentString(s.getUserAgentString() + " AmplitudeCRM/1.0");
        web.addJavascriptInterface(new Bridge(), "AmpApp");
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                // o painel fica no app; WhatsApp, pagamento e o resto abrem no app certo do celular
                if ("https".equals(u.getScheme()) && HOST.equals(u.getHost()) && u.getPath() != null && u.getPath().startsWith("/lab/crm/app")) return false;
                openOutside(u);
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

    private void openOutside(Uri u) {
        try {
            Intent i = "intent".equals(u.getScheme()) ? Intent.parseUri(u.toString(), Intent.URI_INTENT_SCHEME) : new Intent(Intent.ACTION_VIEW, u);
            i.addCategory(Intent.CATEGORY_BROWSABLE);
            i.setComponent(null);
            startActivity(i);
        } catch (Exception e) {
            Toast.makeText(this, "Nenhum app abre este link.", Toast.LENGTH_SHORT).show();
        }
    }

    /** Funções que o painel chama quando roda dentro do app (window.AmpApp). */
    class Bridge {
        @JavascriptInterface
        public void copy(String text) {
            runOnUiThread(() -> {
                ClipboardManager cm = (ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
                cm.setPrimaryClip(ClipData.newPlainText("Amplitude CRM", text));
            });
        }

        /** Exportação em CSV: o Android pergunta onde salvar. */
        @JavascriptInterface
        public void save(String name, String text) {
            runOnUiThread(() -> {
                pendingText = text;
                Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("text/csv");
                i.putExtra(Intent.EXTRA_TITLE, name);
                startActivityForResult(i, SAVE_FILE);
            });
        }
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req != SAVE_FILE || res != RESULT_OK || data == null || data.getData() == null || pendingText == null) return;
        try (OutputStream out = getContentResolver().openOutputStream(data.getData())) {
            out.write(new byte[] {(byte) 0xEF, (byte) 0xBB, (byte) 0xBF}); // acentos certos no Excel
            out.write(pendingText.getBytes(StandardCharsets.UTF_8));
            Toast.makeText(this, "Arquivo salvo.", Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
            Toast.makeText(this, "Não deu para salvar o arquivo.", Toast.LENGTH_SHORT).show();
        }
        pendingText = null;
    }

    private void showOffline() {
        String h = "<meta name='viewport' content='width=device-width,initial-scale=1'>"
                + "<body style='margin:0;background:#0A0F1C;color:#E9EEF7;font-family:sans-serif;display:flex;flex-direction:column;"
                + "align-items:center;justify-content:center;height:100vh;text-align:center;padding:24px;box-sizing:border-box'>"
                + "<h2 style='margin:0 0 8px'>Sem conexão</h2><p style='color:#9AA5BB;margin:0 0 24px'>Conecte-se à internet para abrir o CRM.</p>"
                + "<a href='" + URL + "' style='color:#0A0F1C;background:#5B8CFF;padding:14px 28px;border-radius:12px;"
                + "text-decoration:none;font-weight:bold'>Tentar de novo</a></body>";
        web.loadDataWithBaseURL(URL, h, "text/html", "utf-8", null);
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack(); else super.onBackPressed();
    }
}
