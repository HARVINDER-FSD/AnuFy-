# Script to add 'export const dynamic = "force-dynamic";' to all API route files

$files = Get-ChildItem -Path "app/api" -Filter "route.ts" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Check if it already has the export
    if ($content -notmatch 'export const dynamic') {
        Write-Host "Adding dynamic export to: $($file.FullName)"
        
        # Find the position after imports (look for first 'export async function' or 'const')
        if ($content -match '(?s)(.*?)(export async function|^const [A-Z_]+)') {
            $beforeExport = $matches[1]
            $rest = $content.Substring($beforeExport.Length)
            
            # Add the export statement
            $newContent = $beforeExport + "`nexport const dynamic = 'force-dynamic';`n`n" + $rest
            
            Set-Content -Path $file.FullName -Value $newContent -NoNewline
        }
    } else {
        Write-Host "Skipping (already has dynamic export): $($file.FullName)"
    }
}

Write-Host "`nDone! Added dynamic export to all API routes."
