fn main() {
    // Comandos do app chamados pela interface (origem http://127.0.0.1): cada um precisa de permissão
    // (allow-<comando>) na capability, senão o Tauri os bloqueia para páginas remotas.
    tauri_build::try_build(
        tauri_build::Attributes::new().app_manifest(tauri_build::AppManifest::new().commands(&[
            "pick_file",
            "pick_save",
            "pick_folder",
            "save_file",
            "selftest_done",
        ])),
    )
    .expect("erro no tauri-build")
}
