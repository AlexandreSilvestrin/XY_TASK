import webview


def run_webview(url: str):
    webview.create_window(
        title="XY TASK",
        url=url,
        maximized=True,
    )

    webview.start()