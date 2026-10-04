// Casca Tauri do TTWtools (spike F1, ver novodesenho/tauri.md).
//
// Sobe o aplicativo Python em modo `web` (FastAPI) numa porta livre, espera /api/health e abre a
// janela apontando para o servidor, como o pywebview faz hoje. Ao fechar, encerra o servidor.
// Só para desenvolvimento: o pacote final (sidecar PyInstaller em resources) é a fase F3.
//
// Variáveis: TTW_PORT (porta; o benchmark define), TTW_PYTHON (padrão "python"), TTW_APP_DIR
// (raiz do repositório; padrão: a pasta acima de src-tauri), TTW_START_HASH (tela inicial).
// Argumentos: --port N, --open ARQUIVO (ou o caminho de um arquivo do TTWtools sozinho).
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::time::{Duration, Instant};

use tauri::{Manager, RunEvent, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_dialog::DialogExt;

const EXTENSIONS: [&str; 6] = ["ttwa", "ttwl", "ttwal", "ttwc", "ttwcl", "ttwt"];

struct Server(Mutex<Option<Child>>);

fn free_port() -> u16 {
    TcpListener::bind("127.0.0.1:0").and_then(|l| l.local_addr()).map(|a| a.port()).unwrap_or(8765)
}

fn parse_args(args: impl IntoIterator<Item = String>) -> (Option<u16>, Option<String>) {
    let (mut port, mut open) = (None, None);
    let mut args = args.into_iter();
    while let Some(arg) = args.next() {
        match arg.as_str() {
            "--port" => port = args.next().and_then(|v| v.parse().ok()),
            "--open" => open = args.next(),
            other if !other.starts_with('-') && EXTENSIONS.iter().any(|e| other.to_lowercase().ends_with(&format!(".{e}"))) => {
                open = Some(other.to_string())
            }
            _ => {}
        }
    }
    (port, open)
}

fn app_dir() -> PathBuf {
    std::env::var_os("TTW_APP_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from(env!("CARGO_MANIFEST_DIR")).parent().unwrap().to_path_buf())
}

fn spawn_server(port: u16, open: Option<&str>) -> std::io::Result<Child> {
    let python = std::env::var("TTW_PYTHON").unwrap_or_else(|_| "python".into());
    let mut cmd = Command::new(python);
    cmd.args(["-m", "app", "--mode", "web", "--port", &port.to_string()]);
    if let Some(file) = open {
        cmd.args(["--open", file]);
    }
    cmd.env("TTW_PARENT_PID", std::process::id().to_string()); // o servidor sai sozinho se a casca cair
    cmd.current_dir(app_dir()).stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null());
    #[cfg(unix)]
    std::os::unix::process::CommandExt::process_group(&mut cmd, 0); // grupo próprio: encerra a árvore inteira
    cmd.spawn()
}

/// Requisição HTTP mínima ao servidor local (sem dependência de cliente HTTP); devolve a resposta inteira.
fn http(port: u16, method: &str, path: &str, body: &str) -> Option<String> {
    let mut stream = TcpStream::connect_timeout(&([127, 0, 0, 1], port).into(), Duration::from_millis(300)).ok()?;
    stream.set_read_timeout(Some(Duration::from_secs(3))).ok()?;
    let request = format!(
        "{method} {path} HTTP/1.1\r\nHost: 127.0.0.1:{port}\r\nConnection: close\r\nContent-Type: application/json\r\nContent-Length: {}\r\n\r\n{body}",
        body.len()
    );
    stream.write_all(request.as_bytes()).ok()?;
    let mut response = String::new();
    stream.read_to_string(&mut response).ok()?;
    Some(response)
}

fn healthy(port: u16) -> bool {
    http(port, "GET", "/api/health", "").is_some_and(|r| r.contains(" 200 "))
}

fn has_unsaved(port: u16) -> bool {
    http(port, "GET", "/api/project/unsaved", "").is_some_and(|r| r.contains("\"unsaved\":true"))
}

struct Port(u16);

/// Entrega um arquivo aberto pelo sistema (evento do macOS ou segunda instância) à interface:
/// o servidor guarda o caminho e a interface o lê ao ganhar foco, como com o Apple Event do pywebview.
fn hand_over(app: &tauri::AppHandle, file: String) {
    let port = app.state::<Port>().0;
    let app = app.clone();
    std::thread::spawn(move || {
        let deadline = Instant::now() + Duration::from_secs(120);
        while !healthy(port) && Instant::now() < deadline {
            std::thread::sleep(Duration::from_millis(100));
        }
        let body = serde_json::json!({ "path": file }).to_string();
        http(port, "POST", "/api/project/pending-open", &body);
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.unminimize();
            let _ = window.set_focus();
            let _ = window.eval("window.dispatchEvent(new Event('focus'))");
        }
    });
}

fn stop(server: &Server) {
    if let Some(mut child) = server.0.lock().unwrap().take() {
        #[cfg(unix)]
        {
            let _ = Command::new("kill").args(["-TERM", &format!("-{}", child.id())]).status();
        }
        #[cfg(not(unix))]
        {
            let _ = child.kill();
        }
        let _ = child.wait();
    }
}

// ---------------------------------------------------------------------------
// Comandos chamados pela interface (window.__TAURI__.core.invoke) no lugar das rotas
// /api/utils/pick-* e do download por Blob, que no pywebview dependiam da janela do pywebview.
// Devolvem o caminho escolhido, ou None se o usuário cancelar (como a rota devolve 204).
// ---------------------------------------------------------------------------

fn path_text(path: tauri_plugin_dialog::FilePath) -> Option<String> {
    path.into_path().ok().map(|p| p.display().to_string())
}

#[tauri::command]
async fn pick_file(app: tauri::AppHandle, directory: Option<String>, extensions: Vec<String>) -> Option<String> {
    let mut dialog = app.dialog().file();
    if !extensions.is_empty() {
        let exts: Vec<&str> = extensions.iter().map(String::as_str).collect();
        dialog = dialog.add_filter("TTWtools", &exts);
    }
    if let Some(dir) = directory.filter(|d| !d.is_empty()) {
        dialog = dialog.set_directory(dir);
    }
    dialog.blocking_pick_file().and_then(path_text)
}

#[tauri::command]
async fn pick_save(app: tauri::AppHandle, directory: Option<String>, filename: String, extensions: Vec<String>) -> Option<String> {
    let mut dialog = app.dialog().file().set_file_name(filename);
    if !extensions.is_empty() {
        let exts: Vec<&str> = extensions.iter().map(String::as_str).collect();
        dialog = dialog.add_filter("TTWtools", &exts);
    }
    if let Some(dir) = directory.filter(|d| !d.is_empty()) {
        dialog = dialog.set_directory(dir);
    }
    dialog.blocking_save_file().and_then(path_text)
}

#[tauri::command]
async fn pick_folder(app: tauri::AppHandle, directory: Option<String>) -> Option<String> {
    let mut dialog = app.dialog().file();
    if let Some(dir) = directory.filter(|d| !d.is_empty()) {
        dialog = dialog.set_directory(dir);
    }
    dialog.blocking_pick_folder().and_then(path_text)
}

/// Grava os bytes do corpo da chamada (binário, sem JSON) no caminho do cabeçalho `path` (percent-encoded).
#[tauri::command]
fn save_file(request: tauri::ipc::Request<'_>) -> Result<(), String> {
    let tauri::ipc::InvokeBody::Raw(data) = request.body() else {
        return Err("corpo binário esperado".into());
    };
    let raw = request.headers().get("path").and_then(|v| v.to_str().ok()).ok_or("cabeçalho path ausente")?;
    let path = percent_encoding::percent_decode_str(raw).decode_utf8().map_err(|e| e.to_string())?;
    std::fs::write(path.as_ref(), data).map_err(|e| format!("{path}: {e}"))
}

// ---------------------------------------------------------------------------
// Autoteste da ponte (TTW_TAURI_SELFTEST=<pasta>): quando a página do servidor termina de carregar,
// ela chama save_file e selftest_done pela origem http://127.0.0.1. O resultado vai para
// <pasta>/selftest.txt e o processo sai com 0 (ok) ou 1. Prova que a permissão remota funciona.
// ---------------------------------------------------------------------------

const SELFTEST_BYTES: [u8; 4] = [1, 2, 3, 250];

#[tauri::command]
fn selftest_done(app: tauri::AppHandle, ok: bool, detail: String) {
    let dir = std::env::var("TTW_TAURI_SELFTEST").unwrap_or_default();
    let written = std::fs::read(format!("{dir}/selftest.bin")).unwrap_or_default();
    let ok = ok && written == SELFTEST_BYTES;
    let _ = std::fs::write(format!("{dir}/selftest.txt"), format!("{}: {detail}\n", if ok { "OK" } else { "FALHOU" }));
    app.exit(if ok { 0 } else { 1 });
}

fn selftest_script(dir: &str) -> String {
    let path = format!("{dir}/selftest.bin");
    let beacon = std::env::var("TTW_TAURI_SELFTEST_BEACON").unwrap_or_default(); // porta de um listener de diagnóstico
    format!(
        r#"(async () => {{
  const T = window.__TAURI__;
  const beacon = (m) => {{ const p = {beacon:?}; if (p) new Image().src = 'http://127.0.0.1:' + p + '/?' + encodeURIComponent(m); }};
  beacon('start tauri=' + typeof T + ' origin=' + location.origin);
  try {{
    if (!T) throw new Error('window.__TAURI__ ausente na origem ' + location.origin);
    await T.core.invoke('save_file', new Uint8Array([1, 2, 3, 250]), {{ headers: {{ path: encodeURIComponent({path:?}) }} }});
    await T.core.invoke('selftest_done', {{ ok: true, detail: 'save_file e IPC pela origem ' + location.origin }});
  }} catch (e) {{
    beacon('erro: ' + String(e));
    try {{ await T.core.invoke('selftest_done', {{ ok: false, detail: String(e) }}); }} catch (_) {{}}
  }}
}})()"#
    )
}

fn main() {
    let (arg_port, open) = parse_args(std::env::args().skip(1));
    let port = arg_port
        .or_else(|| std::env::var("TTW_PORT").ok().and_then(|v| v.parse().ok()))
        .unwrap_or_else(free_port);

    let app = tauri::Builder::default()
        // 1º plugin: uma segunda instância (Explorer/Linux abrindo outro arquivo) entrega o arquivo à primeira
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            match parse_args(argv.into_iter().skip(1)).1 {
                Some(file) => hand_over(app, file),
                None => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.unminimize();
                        let _ = window.set_focus();
                    }
                }
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .on_window_event(move |window, event| {
            // alterações não salvas: pede confirmação (mesmo texto do pywebview), em vez de fechar direto
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if has_unsaved(port) {
                    api.prevent_close();
                    let target = window.clone();
                    window
                        .app_handle()
                        .dialog()
                        .message(
                            "Há alterações não salvas no projeto (use Arquivo → Salvar). Fechar mesmo assim?\n\
                             There are unsaved changes in the project (use File → Save). Quit anyway?",
                        )
                        .title("TTWtools")
                        .kind(tauri_plugin_dialog::MessageDialogKind::Warning)
                        .buttons(tauri_plugin_dialog::MessageDialogButtons::OkCancelCustom(
                            "Fechar / Quit".into(),
                            "Cancelar / Cancel".into(),
                        ))
                        .show(move |close| {
                            if close {
                                let _ = target.destroy();
                            }
                        });
                }
            }
        })
        .invoke_handler(tauri::generate_handler![pick_file, pick_save, pick_folder, save_file, selftest_done])
        .on_page_load(|webview, payload| {
            if let Ok(dir) = std::env::var("TTW_TAURI_SELFTEST") {
                use std::io::Write as _;
                if let Ok(mut log) = std::fs::OpenOptions::new().create(true).append(true).open(format!("{dir}/pageload.log")) {
                    let _ = writeln!(log, "{:?} {}", payload.event(), payload.url());
                }
            }
            if let (Ok(dir), tauri::webview::PageLoadEvent::Finished) = (std::env::var("TTW_TAURI_SELFTEST"), payload.event()) {
                if payload.url().host_str() == Some("127.0.0.1") {
                    let _ = webview.eval(selftest_script(&dir));
                }
            }
        })
        .setup(move |app| {
            let child = spawn_server(port, open.as_deref())?;
            app.manage(Server(Mutex::new(Some(child))));
            app.manage(Port(port));
            let handle = app.handle().clone();
            std::thread::spawn(move || {
                let deadline = Instant::now() + Duration::from_secs(120);
                while !healthy(port) {
                    if Instant::now() > deadline {
                        eprintln!("[ttwtools-tauri] o servidor não respondeu em 120 s");
                        handle.exit(1);
                        return;
                    }
                    std::thread::sleep(Duration::from_millis(50));
                }
                let mut url = format!("http://127.0.0.1:{port}");
                if let Ok(hash) = std::env::var("TTW_START_HASH") {
                    url.push('#');
                    url.push_str(hash.trim_start_matches('#'));
                }
                let built = WebviewWindowBuilder::new(&handle, "main", WebviewUrl::External(url.parse().unwrap()))
                    .title("TTWtools")
                    .inner_size(1280.0, 800.0)
                    .min_inner_size(900.0, 600.0)
                    .build();
                if let Err(err) = built {
                    eprintln!("[ttwtools-tauri] não abriu a janela: {err}");
                    handle.exit(1);
                }
            });
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("erro ao iniciar o Tauri");

    app.run(|handle, event| match event {
        RunEvent::Exit => {
            if let Some(server) = handle.try_state::<Server>() {
                stop(&server);
            }
        }
        // macOS: duplo clique num arquivo do TTWtools (app fechado ou aberto) chega aqui, não em argv
        #[cfg(target_os = "macos")]
        RunEvent::Opened { urls } => {
            if let Some(path) = urls.iter().find_map(|u| u.to_file_path().ok()) {
                hand_over(handle, path.display().to_string());
            }
        }
        _ => {}
    });
}
