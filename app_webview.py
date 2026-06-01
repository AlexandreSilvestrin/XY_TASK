import webview

from config.caminhos import get_webview_storage_dir


def run_webview(url: str):
    webview.create_window(
        title="XY TASK",
        url=url,
        maximized=True,
    )

    webview.start(
        private_mode=False,
        storage_path=str(get_webview_storage_dir()),
    )
