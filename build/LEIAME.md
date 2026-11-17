# TTWtools — Instalação e Orientações

Bem-vindo(a) ao **TTWtools**, aplicativo para análise linguística e exploração de corpora com anotações em múltiplas camadas.

---

## 1. Como instalar e executar no Windows

1. Extraia o arquivo `.zip` para uma pasta de sua escolha (por exemplo, `C:\Program Files\TTWtools` ou em sua pasta pessoal).
2. Para criar os atalhos e registrar as associações com arquivos de projeto e corpus (`.ttwa`, `.ttwc`, etc.), clique duas vezes em:
   `registrar-associacoes.bat`
3. Execute o aplicativo dando duplo clique em:
   `TTWtools.exe`

### Aviso do Windows Defender SmartScreen
Como o TTWtools é um projeto acadêmico de código aberto sem certificado comercial pago da Microsoft, o Windows SmartScreen pode exibir um aviso azul na primeira execução:
> *"O Windows protegeu o seu computador"*
> *(Windows protected your PC)*

Para autorizar a execução:
1. Clique no link **"Mais informações"** (*More info*).
2. Clique no botão **"Executar assim mesmo"** (*Run anyway*).

---

## 2. Como instalar no macOS

1. Na janela da imagem de disco (`.dmg`), arraste o ícone **TTWtools.app** para o atalho da pasta **Applications** (Aplicativos).
2. Aguarde a cópia ser concluída.

### Como autorizar a abertura no seu Mac (Gatekeeper / Quarentena)
Como o TTWtools é distribuído diretamente sem assinatura comercial paga da Apple, os mecanismos do macOS bloqueiam a abertura direta na primeira vez.

**O aplicativo NÃO está danificado.** Para autorizá-lo:

#### Método A — Pelo Finder (Interface Gráfica)
1. Abra a pasta **Aplicativos** (`/Applications`).
2. Clique com o **botão direito** (ou segure `Control` e clique) sobre o **TTWtools** e selecione **Abrir**.
3. Na janela de confirmação, clique em **Abrir**.
4. A partir da segunda vez, o app abrirá diretamente com duplo clique.
*(Em versões recentes do macOS, você também pode ir em Ajustes do Sistema → Privacidade e Segurança → Segurança e clicar em "Abrir Mesmo Assim").*

#### Método B — Pelo Terminal
Se o sistema insistir que o aplicativo está "danificado", execute este comando rápido:
```bash
xattr -cr /Applications/TTWtools.app
```
Esse comando remove o atributo de quarentena do download. Feito isso, abra o TTWtools normalmente.

---

## 3. Como instalar e executar no Linux (Ubuntu / Debian / outros)

1. Extraia o pacote `.tar.gz`:
   ```bash
   tar -xzf TTWtools-*-linux-x86_64.tar.gz
   ```
2. Para registrar o ícone e associações de arquivos no ambiente gráfico (desktop):
   ```bash
   ./instalar-associacoes.sh
   ```
3. Execute o aplicativo:
   ```bash
   ./TTWtools
   ```
*(Nota: Certifique-se de que o sistema possui as bibliotecas do WebKit2GTK instaladas, ex.: `sudo apt install libwebkit2gtk-4.1-0` ou equivalente).*

---

## 4. Licença de Software e Código-Fonte

- **Aplicativo TTWtools (este executável):** distribuído sob os termos da licença livre e de código aberto **GNU General Public License v3.0 ou posterior (GPL-3.0-or-later)**.
- **Sem Garantia:** Este programa é distribuído na esperança de que seja útil, mas SEM QUALQUER GARANTIA; sem mesmo a garantia implícita de COMERCIABILIDADE ou ADEQUAÇÃO A UM DETERMINADO PROPÓSITO. Veja a Licença Pública Geral GNU para mais detalhes.
- **Código-fonte completo do aplicativo:** disponível publicamente em:
  [https://github.com/luaguiaroliveira/ttwtools-app](https://github.com/luaguiaroliveira/ttwtools-app)
- **Pacote Python central (`ttwtools`):** o motor de processamento linguístico utilizado pelo app é mantido como um pacote independente e distribuído sob a licença permissiva **MIT**:
  [https://github.com/luaguiaroliveira/ttwtools](https://github.com/luaguiaroliveira/ttwtools)
- **Componentes de terceiros:**
  - *MFTE (Multi-Feature Tagger for English):* licença GPL 3.0
  - *BiberPlus:* licença MIT (código modificado incorporado no ttwtools)
  - *Stanza (Stanford NLP):* licença Apache 2.0
- O texto integral da licença GPLv3 acompanha este pacote no arquivo `LICENSE.txt`.
