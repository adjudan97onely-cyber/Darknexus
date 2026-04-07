# ============================================================
# IMPORT .ENV - PC PORTABLE
# Lance ce script sur ton PC PORTABLE.
# Lit "env_export_PORTABLE.zip" et cree les .env manquants.
# Ne touche JAMAIS un .env qui existe deja.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File IMPORT_ENV_DEPUIS_BUREAU.ps1
# ============================================================

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
$INZIP = Join-Path $ROOT "env_export_PORTABLE.zip"
$TMPDIR = Join-Path $env:TEMP "darknexus_env_import"

Write-Host ""
Write-Host "========================================================"
Write-Host "  IMPORT .ENV - PC PORTABLE"
Write-Host "========================================================"
Write-Host ""

# Verifie le ZIP
if (-not (Test-Path $INZIP)) {
    Write-Host "ERREUR: 'env_export_PORTABLE.zip' non trouve!"
    Write-Host ""
    Write-Host "Etapes:"
    Write-Host "  1. Lance EXPORT_ENV_POUR_PORTABLE.ps1 sur le PC Bureau"
    Write-Host "  2. Copie 'env_export_PORTABLE.zip' dans ce dossier"
    Write-Host "  3. Relance ce script"
    Write-Host ""
    Read-Host "Appuie sur Entree pour quitter"
    exit 1
}

# Nettoie et extrait le ZIP
if (Test-Path $TMPDIR) { Remove-Item $TMPDIR -Recurse -Force }
New-Item -ItemType Directory -Path $TMPDIR | Out-Null
Expand-Archive -Path $INZIP -DestinationPath $TMPDIR -Force

Write-Host "ZIP extrait. Verification des fichiers..."
Write-Host ""

$created = 0
$skipped = 0

# Parcourt tous les fichiers extraits
Get-ChildItem -Path $TMPDIR -Recurse -File | ForEach-Object {
    $srcFile = $_.FullName
    # Chemin relatif depuis TMPDIR
    $relPath = $srcFile.Substring($TMPDIR.Length).TrimStart('\')
    $dstFile = Join-Path $ROOT $relPath

    if (Test-Path $dstFile) {
        Write-Host "[SKIP] $relPath     (deja present - non modifie)"
        $script:skipped++
    } else {
        # Cree le dossier parent si necessaire
        $dstDir = Split-Path $dstFile -Parent
        if (-not (Test-Path $dstDir)) {
            New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
        }
        Copy-Item $srcFile $dstFile -Force
        Write-Host "[CREE] $relPath"
        $script:created++
    }
}

# Nettoie
Remove-Item $TMPDIR -Recurse -Force

Write-Host ""
Write-Host "========================================================"
Write-Host "  RESULTAT:"
Write-Host "  - $created fichier(s) .env cree(s)"
Write-Host "  - $skipped fichier(s) deja present(s) (pas touches)"
Write-Host "========================================================"
Write-Host ""

if ($created -gt 0) {
    Write-Host "Tes .env sont prets! Tu peux lancer les apps."
} elseif ($skipped -gt 0) {
    Write-Host "Tous les .env etaient deja la. Rien n'a change."
} else {
    Write-Host "Aucun fichier traite. Verifie le ZIP."
}

Write-Host ""
Write-Host "RAPPEL: Ces .env sont LOCAUX a ce Portable."
Write-Host "Ils ne modifient JAMAIS les .env du Bureau."
Write-Host ""
Read-Host "Appuie sur Entree pour quitter"
