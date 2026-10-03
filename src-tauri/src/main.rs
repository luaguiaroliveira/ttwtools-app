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

const EXTENSIONS: [&str; 6] = ["ttwa", "ttwl", "ttwal", "ttwc", "ttwcl", "ttwt"];

struct Server(Mutex<Option<Child>>);

fn free_port() -> u16 {
    TcpListener::bind("127.0.0.1:0").and_then(|l| l.local_addr()).map(|a| a.port()).unwrap_or(8765)
}

fn parse_args() -> (Option<u16>, Option<String>) {
    let (mut port, mut open) = (None, None);
    let mut args = std::env::args().skip(1);
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
    cmd.current_dir(app_dir()).stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null());
    #[cfg(unix)]
    std::os::unix::process::CommandExt::process_group(&mut cmd, 0); // grupo próprio: encerra a árvore inteira
    cmd.spawn()
}

fn healthy(port: u16) -> bool {
    let Ok(mut stream) = TcpStream::connect_timeout(&([127, 0, 0, 1], port).into(), Duration::from_millis(300)) else {
        return false;
    };
    let _ = stream.set_read_timeout(Some(Duration::from_secs(2)));
    let request = format!("GET /api/health HTTP/1.1\r\nHost: 127.0.0.1:{port}\r\nConnection: close\r\n\r\n");
    let mut head = String::new();
    stream.write_all(request.as_bytes()).is_ok()
        && stream.take(64).read_to_string(&mut head).is_ok()
        && head.contains(" 200 ")
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

fn main() {
    let (arg_port, open) = parse_args();
    let port = arg_port
        .or_else(|| std::env::var("TTW_PORT").ok().and_then(|v| v.parse().ok()))
        .unwrap_or_else(free_port);

    let app = tauri::Builder::default()
        .setup(move |app| {
            let child = spawn_server(port, open.as_deref())?;
            app.manage(Server(Mutex::new(Some(child))));
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

    app.run(|handle, event| {
        if let RunEvent::Exit = event {
            if let Some(server) = handle.try_state::<Server>() {
                stop(&server);
            }
        }
    });
}
