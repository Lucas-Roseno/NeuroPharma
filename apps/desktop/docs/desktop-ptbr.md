# NeuroPharma - Ambiente Desktop & Distribuição

Este diretório contém todas as instruções para gerar uma interface Desktop do NeuroPharma distribuível para os usuários finais.

---

## Estrutura do Diretório

```text
desktop/
├── NeuroPharma-Launcher/        # Arquivos auxiliares incluídos no .deb
│   ├── neuropharma-src.tar.gz   # Código-fonte compactado (gerado automaticamente)
│   └── init-native.sh              # Motor Nativo para Linux/macOS (Conda + Node.js)
│
└── wrapper/                        # Código-fonte do executável Electron
    ├── main.js                     # Lógica principal (splash screen + ponte para o init-native.sh)
    ├── package.json                # Dependências e configuração do electron-builder
    ├── assets/                     # Ícones (.png para Linux, .icns para Mac)
    ├── scripts/
    │   └── pack-source.js          # Gera o neuropharma-src.tar.gz
    └── dist/                       # Saída do electron-builder (.deb, .dmg)
```

---

## Status por Plataforma

| Plataforma | Modo | Script | Status |
|---|---|---|---|
| Linux | Nativo (Conda + Node.js) | `init-native.sh` | ✅ Implementado e funcionando |

> O build ativo e distribuído atualmente é o **`linux-native`**.

---

## Modo de Distribuição Atual: Nativo (Conda + Node.js)

O modo atual é o **Nativo**, sem Docker. O launcher instala automaticamente o Miniconda, Node.js e o ambiente científico na máquina do usuário. O usuário só precisa instalar o `.deb` e abrir o aplicativo.

> O Miniconda, Node.js, RDKit, OpenBabel, Vina, PyMOL e Flask são instalados automaticamente na primeira execução.
>
> **Exceção:** UCSF Chimera, DOCK6 e DMS são ferramentas de terceiros que não podem ser empacotadas/redistribuídas (as duas primeiras são licenciadas; o DMS não é auto-instalável pelo app por decisão de projeto), então o usuário precisa instalá-las manualmente e garantir que estejam no `PATH` (veja [userguide-linux-ptbr.md](userguide-linux-ptbr.md#requisitos)). O `init-native.sh` verifica Chimera, DOCK6 e DMS juntos em toda abertura do app (etapa `[2/6]`) e recusa iniciar caso algum esteja faltando, indicando exatamente qual(is) precisa(m) ser instalado(s). Para o DMS, a checagem não é só "o comando existe" — ele roda um teste funcional real (gera uma superfície num PDB de teste) pra pegar instalações quebradas, como um `dmsd` pré-compilado incompatível com a glibc local. Nenhuma das três é compilada/instalada automaticamente pelo app; a tela de erro mostra um botão **Retry** pra reexecutar a checagem sem fechar o app, depois que o usuário instalar o que faltava.

---

## Guia do Desenvolvedor: Gerar uma Nova Versão

### Build Completo (comando único)

Sincroniza a versão, gera o tarball e compila o `.deb` em um único comando:

```bash
cd apps/desktop/wrapper

# Linux (único modo ativo atualmente)
npm run build:linux-native

# macOS — script pronto, requer máquina Mac para buildar
# npm run build:mac-native
```

Internamente, `build:linux-native` executa:
1. `npm run sync-version` → sincroniza a versão com o `package.json` raiz
2. `node scripts/pack-source.js` → gera `NeuroPharma-Launcher/neuropharma-src.tar.gz`
3. `electron-builder --linux deb` → compila o Electron e gera o `.deb` em `dist/`

---

### Saída dos Pacotes

```text
wrapper/dist/neuropharma_amd64.deb   ← único artefato gerado
```

O `.deb` já contém tudo que o usuário precisa:
- O executável Electron (interface gráfica)
- O `init-native.sh` (motor de inicialização)
- O `neuropharma-src.tar.gz` (código-fonte extraído na primeira execução)

---

## Atualizações Automáticas (GitHub Releases)

Em toda abertura, o app consulta o último release de `Lucas-Roseno/NeuroPharma` no GitHub e compara a versão com a instalada, mostrando um indicador na tela de carregamento (`Up to date`, `Update available: vX.Y.Z`, ou só a versão atual se a checagem não puder ser feita). Se um release mais novo for encontrado, o usuário recebe a opção de atualizar na hora.

**A atualização em um clique exige dois assets anexados ao release do GitHub**, ambos já gerados pelo `pack-source.js`:

```text
NeuroPharma-Launcher/neuropharma-src.tar.gz
NeuroPharma-Launcher/neuropharma-src.tar.gz.sha256
```

Se algum dos dois estiver faltando no release, o app cai no fallback de mandar o usuário para a página de releases em vez de atualizar automaticamente. Quando os dois estão presentes, o app baixa o tarball, verifica contra o SHA-256 publicado, e passa para o `init-native.sh` (via a variável de ambiente `BMX_SRC_TAR`) para instalar sobre a cópia existente — sem precisar reinstalar o `.deb`, e sem tocar nos dados do usuário nem no ambiente Conda. Falha no download ou checksum incorreto mostram uma janela de erro e o app inicia a versão atual mesmo assim.

> **Checklist de release:** depois de `npm run build:linux-native`, publique um release no GitHub com a tag `vX.Y.Z` (igual à versão do `package.json` raiz) e anexe `wrapper/dist/neuropharma_amd64.deb`, `neuropharma-src.tar.gz` e `neuropharma-src.tar.gz.sha256` como assets.

---

## Instalando o `.deb` Gerado

Após o build terminar, instale o pacote com o `apt`, que **resolve automaticamente as dependências de sistema** (`curl`, `psmisc`). Execute a partir da raiz do repositório:

```bash
sudo apt install ./apps/desktop/wrapper/dist/neuropharma_amd64.deb
```

> Prefira `apt install ./arquivo.deb` a `sudo dpkg -i arquivo.deb` — o `apt` baixa as dependências faltantes sozinho, enquanto o `dpkg -i` exigiria um `sudo apt-get install -f` à parte.

### Atualizando após uma mudança no código

Basta reconstruir e reinstalar o `.deb`. Na próxima abertura o launcher compara o build empacotado com o instalado e, quando forem diferentes, atualiza o código instalado automaticamente. Os dados do usuário (uploads, datasets, resultados) e o ambiente Conda são preservados, então a atualização é rápida.