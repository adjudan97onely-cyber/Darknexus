# ============================================================
# EXPORT .ENV - PC BUREAU -> PC PORTABLE
# Lance ce script sur ton PC BUREAU.
# Cree un ZIP "env_export_PORTABLE.zip" a copier sur le Portable.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File EXPORT_ENV_POUR_PORTABLE.ps1
# ============================================================

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
$OUTZIP = Join-Path $ROOT "env_export_PORTABLE.zip"
$TMPDIR = Join-Path $env:TEMP "darknexus_env_export"

Write-Host ""
Write-Host "========================================================"
Write-Host "  EXPORT .ENV - PC BUREAU"
Write-Host "========================================================"
Write-Host ""

# Nettoie le dossier temporaire
if (Test-Path $TMPDIR) { Remove-Item $TMPDIR -Recurse -Force }
New-Item -ItemType Directory -Path $TMPDIR | Out-Null

# Liste de tous les .env a exporter (chemin relatif depuis ROOT)
$envFiles = @(
    ".env",
    "backend\.env",
    "frontend\.env",
    "analytics\backend\.env",
    "analytics\frontend\.env",
    "killagain-food\.env",
    "killagain-food\frontend\.env",
    "killagain-food\analytics-lottery\frontend\.env",
    "warzone\backend\.env",
    "warzone\frontend\.env"
)

$count = 0
foreach ($rel in $envFiles) {
    $src = Join-Path $ROOT $rel
    if (Test-Path $src) {
        $dst = Join-Path $TMPDIR $rel
        $dstDir = Split-Path $dst -Parent
        if (-not (Test-Path $dstDir)) {
            New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
        }
        Copy-Item $src $dst -Force
        Write-Host "[OK] $rel"
        $count++
    } else {
        Write-Host "[--] $rel     (non trouve, ignore)"
    }
}

if ($count -eq 0) {
    Write-Host ""
    Write-Host "ERREUR: Aucun fichier .env trouve dans $ROOT"
    Read-Host "Appuie sur Entree pour quitter"
    exit 1
}

# Supprime l'ancien ZIP si present
if (Test-Path $OUTZIP) { Remove-Item $OUTZIP -Force }

# Cree le ZIP
Compress-Archive -Path "$TMPDIR\*" -DestinationPath $OUTZIP -Force

# Nettoie le dossier temporaire
Remove-Item $TMPDIR -Recurse -Force

Write-Host ""
Write-Host "========================================================"
Write-Host "  $count fichiers exportes dans: env_export_PORTABLE.zip"
Write-Host "========================================================"
Write-Host ""
Write-Host "ETAPES SUIVANTES:"
Write-Host "  1. Copie 'env_export_PORTABLE.zip' vers le PC Portable"
Write-Host "     (cle USB, Google Drive, OneDrive, mail...)"
Write-Host "  2. Mets-le dans le dossier Darknexus-main/ du Portable"
Write-Host "  3. Lance IMPORT_ENV_DEPUIS_BUREAU.ps1 sur le Portable"
Write-Host ""
Write-Host "RAPPEL: Les .env du Portable sont INDEPENDANTS du Bureau."
Write-Host "Modifier l'un ne touche JAMAIS l'autre."
Write-Host ""
Read-Host "Appuie sur Entree pour quitter"
