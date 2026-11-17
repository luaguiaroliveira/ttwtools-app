# TTWtools — Instalação e Orientações

Bem-vindo(a) ao **TTWtools**, aplicativo para análise linguística e exploração de corpora com anotações em múltiplas camadas.

---

## 1. Como instalar no macOS

1. Na janela da imagem de disco (`.dmg`), arraste o ícone **TTWtools.app** para o atalho da pasta **Applications** (Aplicativos).
2. Aguarde a cópia ser concluída.

---

## 2. Como autorizar a abertura no seu Mac (Gatekeeper / Quarentena)

Como o TTWtools é um projeto acadêmico e de código aberto desenvolvido na universidade, ele não utiliza um certificado comercial pago da Apple Developer. Por isso, os mecanismos de segurança do macOS (Gatekeeper) bloqueiam a abertura direta na primeira vez, mostrando avisos como:
> *"O aplicativo não pode ser aberto porque é de um desenvolvedor não identificado"*  
ou  
> *"TTWtools está danificado e não pode ser aberto. Você deve movê-lo para o Lixo."*

**O aplicativo NÃO está danificado.** Trata-se apenas da flag de quarentena que o macOS atribui a qualquer arquivo baixado pela internet sem notarização em nuvem da Apple. Você pode autorizá-lo de forma segura e permanente na sua própria máquina usando um dos dois métodos abaixo:

### Método A — Pelo Finder (Interface Gráfica)
1. Abra a sua pasta **Aplicativos** (`/Applications`).
2. Localize o **TTWtools**.
3. **Não dê duplo clique** na primeira vez. Clique com o **botão direito** (ou segure a tecla `Control` e clique) sobre o ícone do TTWtools e selecione **Abrir**.
4. Uma caixa de diálogo do sistema será exibida com um botão **Abrir** (ou "Abrir mesmo assim"). Clique em **Abrir**.
5. Pronto! O macOS registrará a autorização na sua máquina e, a partir da segunda vez, você poderá abri-lo normalmente com duplo clique.

*Nota:* No macOS Ventura, Sonoma, Sequoia ou superior, se o botão "Abrir" não aparecer pelo clique direito, você também pode ir em **Ajustes do Sistema** → **Privacidade e Segurança**, rolar até a seção **Segurança** e clicar no botão **"Abrir Mesmo Assim"** que aparece logo após tentar abrir o app.

---

### Método B — Pelo Terminal (Garantido para qualquer versão do macOS)
Se o macOS insistir na mensagem de que o app está "danificado", execute este comando rápido:

1. Abra o aplicativo **Terminal** (pressione `Command + Barra de espaço`, digite `Terminal` e aperte `Enter`).
2. Copie e cole o comando abaixo e aperte `Enter`:
   ```bash
   xattr -cr /Applications/TTWtools.app
   ```
3. Esse comando remove o atributo de quarentena (`com.apple.quarantine`) que o sistema colocou no arquivo durante o download.
4. Feito isso, abra o TTWtools pela pasta Aplicativos normalmente.

---

## 3. Licença de Software e Código-Fonte

- **Aplicativo TTWtools (este executável):** distribuído sob a licença livre e de código aberto **GNU General Public License v3.0 ou posterior (GPL-3.0-or-later)**.
- **Código-fonte completo do aplicativo:** disponível publicamente em:
  [https://github.com/luaguiaroliveira/ttwtools-app](https://github.com/luaguiaroliveira/ttwtools-app)
- **Pacote Python central (`ttwtools`):** o motor de processamento linguístico utilizado pelo app é mantido como um pacote independente e distribuído sob a licença permissiva **MIT**:
  [https://github.com/luaguiaroliveira/ttwtools](https://github.com/luaguiaroliveira/ttwtools)
- **Componentes de terceiros:**
  - *BiberPlus:* licença MIT (código modificado incorporado no ttwtools)
  - *Stanza (Stanford NLP):* licença Apache 2.0
  - *MFTE (Multi-Feature Tagger for English):* licença GPL 3.0
- O texto integral da licença GPLv3 está incluído no arquivo `LICENSE.txt` desta imagem de disco.
