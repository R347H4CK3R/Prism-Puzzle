import SwiftUI
import WebKit
@main struct PrismPuzzleApp: App { var body: some Scene { WindowGroup { PuzzleView().preferredColorScheme(.dark) } } }
struct PuzzleView: UIViewRepresentable {
 func makeCoordinator() -> Coordinator { Coordinator() }
 func makeUIView(context: Context) -> WKWebView {
  let web = WKWebView(frame: .zero); web.isOpaque = false; web.backgroundColor = UIColor(red: 0.047, green: 0.075, blue: 0.133, alpha: 1)
  web.navigationDelegate = context.coordinator; web.uiDelegate = context.coordinator
  if let url = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "Web") { web.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent()) }
  return web
 }
 func updateUIView(_ view: WKWebView, context: Context) {}
 class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
  func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) { decisionHandler(action.request.url?.isFileURL == true ? .allow : .cancel) }
  func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
   let alert = UIAlertController(title: "Erase progress?", message: message, preferredStyle: .alert)
   alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in completionHandler(false) }); alert.addAction(UIAlertAction(title: "Erase", style: .destructive) { _ in completionHandler(true) })
   guard let root = webView.window?.rootViewController else { completionHandler(false); return }; root.present(alert, animated: true)
  }
 }
}
